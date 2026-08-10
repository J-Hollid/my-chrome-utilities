import type { AppCommand } from "../../commands.js";
import { createHotkeyEditor, type HotkeyEditorController, type HotkeyEditorOptions } from "../../hotkey-editor.js";
import {
  advanceHotkeySequence,
  blankHotkeyKeymap,
  duplicateSequences,
  HOTKEY_KEYMAP_STORAGE_KEY,
  keyTokenFromKeyboardEvent,
  updateHotkeyKeymap,
  validateHotkeyKeymap,
  type HotkeyKeymap,
} from "../../hotkey-keymap.js";

export interface InstalledHotkeyElements {
  root: HTMLElement | null;
  createButton: HTMLButtonElement | null;
  updateButton: HTMLButtonElement | null;
  loadButton: HTMLButtonElement | null;
  fileInput: HTMLInputElement | null;
  status: HTMLElement | null;
  warning: HTMLElement | null;
  editorContainer: HTMLElement | null;
  editorFilter: HTMLInputElement | null;
}

export interface HotkeyRuntimeMessages {
  addListener(listener: (message: unknown) => void): void;
  removeListener(listener: (message: unknown) => void): void;
}

export interface InstalledHotkeyControllerDependencies {
  commands: readonly AppCommand[];
  storage: Pick<Storage, "getItem" | "setItem">;
  elements: InstalledHotkeyElements;
  documentEvents: Pick<Document, "addEventListener" | "removeEventListener">;
  pageLifecycle: Pick<Window, "addEventListener" | "removeEventListener">;
  runtimeMessages?: HotkeyRuntimeMessages;
  createEditor?: (options: HotkeyEditorOptions) => HotkeyEditorController;
  download(file: { filename: string; contents: string; type: "application/json" }): () => void;
  executeCommand(commandId: string): void;
  shellClaimsKey(event: KeyboardEvent): boolean;
  ignoresTarget(target: EventTarget | null): boolean;
}

export interface InstalledHotkeyController {
  mount(): void;
  render(): void;
  focus(): void;
  dispose(): void;
}

const keymapFilename = "my-chrome-utilities-hotkey-keymap.json";

function focusMessage(message: unknown): message is { type:"focus-app-hotkeys" } {
  return typeof message === "object" && message !== null &&
    "type" in message && message.type === "focus-app-hotkeys";
}

export function createInstalledHotkeyController(
  dependencies: InstalledHotkeyControllerDependencies,
): InstalledHotkeyController {
  const { commands, storage, elements, documentEvents, pageLifecycle, runtimeMessages } = dependencies;
  let keymap = blankHotkeyKeymap(commands);
  let pending: string[] = [];
  let mounted = false;

  const setStatus = (message: string): void => { if (elements.status) elements.status.textContent = message; };
  const setWarning = (message: string): void => { if (elements.warning) elements.warning.textContent = message; };
  const persist = (next: HotkeyKeymap): void => {
    storage.setItem(HOTKEY_KEYMAP_STORAGE_KEY, JSON.stringify(next));
  };
  const editor = (dependencies.createEditor ?? createHotkeyEditor)({
    commands,
    container:elements.editorContainer,
    filter:elements.editorFilter,
    getKeymap:() => keymap,
    setKeymap:(next) => { keymap = next; persist(next); },
    setStatus,
    setWarning,
  });

  const focus = (): void => {
    if (!elements.root) return;
    elements.root.focus();
    elements.root.dataset.hotkeyFocus = "active";
  };
  const focusActive = (): boolean => elements.root?.dataset.hotkeyFocus === "active";
  const storedKeymap = (): HotkeyKeymap | undefined => {
    const stored = storage.getItem(HOTKEY_KEYMAP_STORAGE_KEY);
    if (!stored) return undefined;
    try {
      const validation = validateHotkeyKeymap(JSON.parse(stored), commands);
      return validation.valid ? validation.keymap : undefined;
    } catch { return undefined; }
  };
  const download = (next: HotkeyKeymap): void => {
    const release = dependencies.download({
      filename: keymapFilename,
      contents: `${JSON.stringify(next, null, 2)}\n`,
      type: "application/json",
    });
    try {
      // The adapter performs the download before returning its object-URL cleanup.
    } finally {
      release();
    }
  };
  const load = (value: unknown): boolean => {
    const validation = validateHotkeyKeymap(value, commands);
    const duplicates = validation.keymap
      ? duplicateSequences(validation.keymap)
      : validation.duplicateSequences;
    if (!validation.valid || !validation.keymap) {
      const duplicate = duplicates[0]?.sequence;
      setWarning(duplicate ? `Duplicate key sequence: ${duplicate}`
        : (validation.error ?? "Invalid hotkey keymap."));
      return false;
    }
    keymap = validation.keymap;
    persist(keymap);
    pending = [];
    editor.render();
    setWarning("");
    setStatus("Keymap loaded");
    focus();
    return true;
  };
  const createFile = (): void => {
    keymap = blankHotkeyKeymap(commands);
    download(keymap);
    editor.render();
    setWarning("");
    setStatus("Blank keymap created");
  };
  const updateFile = (): void => {
    const summary = updateHotkeyKeymap(keymap, commands);
    keymap = summary.keymap;
    download(keymap);
    editor.render();
    setWarning("");
    setStatus(`Keymap updated: added ${summary.added.length}, removed ${summary.removed.length}`);
  };
  const loadFile = async (): Promise<void> => {
    try {
      const file = elements.fileInput?.files?.[0];
      if (!file) return;
      try { load(JSON.parse(await file.text())); }
      catch { setWarning("Keymap file must contain valid JSON."); }
    } finally {
      if (elements.fileInput) elements.fileInput.value = "";
    }
  };
  const keydown = (event: KeyboardEvent): void => {
    if (dependencies.shellClaimsKey(event) || !focusActive() ||
        dependencies.ignoresTarget(event.target)) return;
    if (event.key === "Escape" && pending.length > 0) {
      event.preventDefault(); pending = []; return;
    }
    const hadPending = pending.length > 0;
    const advance = advanceHotkeySequence(keymap, pending, keyTokenFromKeyboardEvent(event));
    if (advance.status === "pending") {
      event.preventDefault(); pending = advance.pending; return;
    }
    pending = [];
    if (advance.status === "matched" && advance.commandId) {
      event.preventDefault(); dependencies.executeCommand(advance.commandId); return;
    }
    if (hadPending) event.preventDefault();
  };
  const runtimeMessage = (message: unknown): void => { if (focusMessage(message)) focus(); };
  const clickLoad = (): void => { elements.fileInput?.click(); };
  const changeFile = (): Promise<void> => loadFile();
  const pageHide = (): void => { dispose(); };

  const mount = (): void => {
    if (mounted) return;
    keymap = storedKeymap() ?? blankHotkeyKeymap(commands);
    pending = [];
    mounted = true;
    editor.bind();
    elements.createButton?.addEventListener("click", createFile);
    elements.updateButton?.addEventListener("click", updateFile);
    elements.loadButton?.addEventListener("click", clickLoad);
    elements.fileInput?.addEventListener("change", changeFile);
    documentEvents.addEventListener("keydown", keydown, true);
    pageLifecycle.addEventListener("pagehide", pageHide);
    runtimeMessages?.addListener(runtimeMessage);
    editor.render();
  };
  const dispose = (): void => {
    if (!mounted) return;
    mounted = false;
    pending = [];
    editor.unbind();
    elements.createButton?.removeEventListener("click", createFile);
    elements.updateButton?.removeEventListener("click", updateFile);
    elements.loadButton?.removeEventListener("click", clickLoad);
    elements.fileInput?.removeEventListener("change", changeFile);
    documentEvents.removeEventListener("keydown", keydown, true);
    pageLifecycle.removeEventListener("pagehide", pageHide);
    runtimeMessages?.removeListener(runtimeMessage);
  };

  return { mount, render:() => editor.render(), focus, dispose };
}
