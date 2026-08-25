export const installedDataLayerControllerOrder = [
  "capture",
  "event-library",
  "schemas",
  "defects",
  "replay",
  "projects",
  "durable-projects",
  "project-event-transport",
  "live-flow-testing",
] as const;

export type InstalledDataLayerControllerId =
  typeof installedDataLayerControllerOrder[number];

export interface InstalledDataLayerControllerLifecycle {
  mount(): void;
  dispose(): void;
}

interface InstalledPaletteLifecycle extends InstalledDataLayerControllerLifecycle {}
interface InstalledWorkspaceTabsLifecycle extends InstalledDataLayerControllerLifecycle {
  show(tab: WorkspaceTabId, focus?: boolean): void;
}

export interface InstalledSidePanelShellPorts {
  pageLifecycle: Pick<Window, "addEventListener" | "removeEventListener">;
  commandLog: Pick<HTMLElement, "textContent"> | null;
  palette: InstalledPaletteLifecycle;
  workspaceTabs: InstalledWorkspaceTabsLifecycle;
  hotkeys: InstalledDataLayerControllerLifecycle;
  captureCommands: {
    startTesting(): Promise<unknown>;
    endTesting(): Promise<unknown>;
    chooseObservationTarget(): Promise<unknown>;
    attachSelectedTarget(): Promise<unknown>;
    detachObservationTarget(): void;
  };
  showDataLayerView(view: Parameters<NonNullable<CommandRunContext["showDataLayerView"]>>[0]): void;
}

export function createChromeRuntimeMessagePort(runtimeMessages: {
  addListener(listener: (message: unknown) => void): void;
  removeListener(listener: (message: unknown) => void): void;
}) {
  return {
    addListener:(listener: (message: unknown) => void): void => runtimeMessages.addListener(listener),
    removeListener:(listener: (message: unknown) => void): void => runtimeMessages.removeListener(listener),
  };
}

export function createInstalledSidePanelShellController(ports: InstalledSidePanelShellPorts) {
  const paletteController = ports.palette;
  const workspaceTabsController = ports.workspaceTabs;
  const hotkeyController = ports.hotkeys;
  let mounted = false;
  async function recordDataLayerCommandRun(entry: CommandRunRecord): Promise<void> {
    if (entry.commandId === "data-layer.start-testing") await ports.captureCommands.startTesting();
    if (entry.commandId === "data-layer.end-testing") await ports.captureCommands.endTesting();
    if (entry.commandId === "data-layer.choose-observation-target") await ports.captureCommands.chooseObservationTarget();
    if (entry.commandId === "data-layer.attach-selected-target") await ports.captureCommands.attachSelectedTarget();
    if (entry.commandId === "data-layer.detach-observation-target") ports.captureCommands.detachObservationTarget();
  }
  function recordCommandRun(entry: CommandRunRecord): void {
    void recordDataLayerCommandRun(entry);
    if (ports.commandLog) ports.commandLog.textContent = entry.message;
  }
  function showWorkspace(tab: WorkspaceTabId, focus = false): void {
    workspaceTabsController.show(tab, focus);
  }
  const commandRunContext: CommandRunContext = {
    record:recordCommandRun,
    showWorkspace,
    showDataLayerView:ports.showDataLayerView,
  };
  const pageHidden = (): void => paletteController.dispose();
  return {
    mount(): void {
      if (mounted) return; mounted = true;
      workspaceTabsController.mount(); hotkeyController.mount(); paletteController.mount();
      ports.pageLifecycle.addEventListener("pagehide", pageHidden, { once:true });
    },
    dispose(): void {
      if (!mounted) return; mounted = false;
      ports.pageLifecycle.removeEventListener("pagehide", pageHidden);
      paletteController.dispose(); hotkeyController.dispose(); workspaceTabsController.dispose();
    },
    commandContext:commandRunContext,
    runDataLayerCommand:recordDataLayerCommandRun,
  };
}

export interface InstalledSidePanelRuntimeFoundation {
  app: HTMLElement | null;
  sidePanelContent: HTMLElement | null;
  commandLog: HTMLElement | null;
  openPaletteButton: HTMLButtonElement | null;
  palette: HTMLElement | null;
  paletteFilter: HTMLInputElement | null;
  paletteResults: HTMLElement | null;
  createKeymapButton: HTMLButtonElement | null;
  updateKeymapButton: HTMLButtonElement | null;
  loadKeymapButton: HTMLButtonElement | null;
  keymapFileInput: HTMLInputElement | null;
  keymapStatus: HTMLElement | null;
  keymapWarning: HTMLElement | null;
  workspaceTabList: HTMLElement | null;
  hotkeyEditorFilter: HTMLInputElement | null;
  hotkeyEditorCommands: HTMLElement | null;
  dataLayerStorage: Storage;
  hotkeyStorage: Storage;
  shellStorage: Storage;
  durableProjectRuntime: Awaited<ReturnType<typeof openDurableProjectRuntime>>;
}

export interface DurableProjectCoordinationPorts {
  renderProjectEventTransport(): void;
  renderSchemas(): void;
  renderSchemaWorkflowRows(): void;
  renderCompactCanonicalEditor(): void;
  renderLayeredProfileEditor(): void;
}

export function installDurableProjectCoordinationSubscription(
  durableProjectRuntime: Awaited<ReturnType<typeof openDurableProjectRuntime>>,
  ports: DurableProjectCoordinationPorts,
): () => void {
  return durableProjectRuntime.subscribe(({ active }) => {
    ports.renderProjectEventTransport();
    if (!active?.state) return;
    ports.renderSchemas();
    ports.renderSchemaWorkflowRows();
    ports.renderCompactCanonicalEditor();
    ports.renderLayeredProfileEditor();
  });
}

export async function createInstalledSidePanelRuntimeFoundation(
  root: Document = document,
  storage: Storage = globalThis.localStorage,
): Promise<InstalledSidePanelRuntimeFoundation> {
  const app = root.querySelector<HTMLElement>("#app");
  const panelRoot = root.querySelector<HTMLElement>("#side-panel-root");
  const utilityDirectory = root.querySelector<HTMLElement>("#utility-directory");
  const utilityStorageContract = (id: string) => {
    const contract = utilityRegistry.find((utility) => utility.id === id)?.storage;
    if (!contract) throw new Error(`Missing utility storage contract: ${id}`);
    return contract;
  };
  if (panelRoot) mountUtilityShell(extensionShell, panelRoot, window);
  if (utilityDirectory) renderUtilityDirectory(utilityRegistry, utilityDirectory);
  bindUtilityPanels(utilityRegistry, root);
  const durableProjectRuntime = await openDurableProjectRuntime(storage).catch((error) => {
    installDurableRepositoryStartupFailure(root, error);
    return new Promise<never>(() => {});
  });
  const projectStorage = durableProjectRuntime.storage;
  const scopedDataLayerStorage = createUtilityStorage(storage, utilityStorageContract("data-layer"));
  const dataLayerStorage: Storage = {
    get length() { return scopedDataLayerStorage.length; },
    clear() { scopedDataLayerStorage.clear(); projectStorage.removeItem(SCHEMA_LIBRARY_STORAGE_KEY); },
    key:(index) => scopedDataLayerStorage.key(index),
    getItem:(key) => key === SCHEMA_LIBRARY_STORAGE_KEY ? projectStorage.getItem(key) : scopedDataLayerStorage.getItem(key),
    setItem(key, value) { if (key === SCHEMA_LIBRARY_STORAGE_KEY) projectStorage.setItem(key, value); else scopedDataLayerStorage.setItem(key, value); },
    removeItem(key) { if (key === SCHEMA_LIBRARY_STORAGE_KEY) projectStorage.removeItem(key); else scopedDataLayerStorage.removeItem(key); },
  };
  const hotkeyStorage = createUtilityStorage(storage, utilityStorageContract("hotkeys"));
  const shellStorage = createUtilityStorage(storage, { namespace:"my-chrome-utilities.shell", version:1,
    legacyKeys:["my-chrome-utilities.workspace-tab.v1"] });
  const sidePanelContent = root.querySelector<HTMLElement>("#side-panel-content");
  const commandLog = root.querySelector<HTMLElement>("#command-log");
  const openPaletteButton = root.querySelector<HTMLButtonElement>("#open-palette");
  const palette = root.querySelector<HTMLElement>("#palette");
  const paletteFilter = root.querySelector<HTMLInputElement>("#palette-filter");
  const paletteResults = root.querySelector<HTMLElement>("#palette-results");
  const createKeymapButton = root.querySelector<HTMLButtonElement>("#create-keymap");
  const updateKeymapButton = root.querySelector<HTMLButtonElement>("#update-keymap");
  const loadKeymapButton = root.querySelector<HTMLButtonElement>("#load-keymap");
  const keymapFileInput = root.querySelector<HTMLInputElement>("#keymap-file");
  const keymapStatus = root.querySelector<HTMLElement>("#keymap-status");
  const keymapWarning = root.querySelector<HTMLElement>("#keymap-warning");
  const workspaceTabList = root.querySelector<HTMLElement>("#workspace-tabs");
  const hotkeyEditorFilter = root.querySelector<HTMLInputElement>("#hotkey-editor-filter");
  const hotkeyEditorCommands = root.querySelector<HTMLElement>("#hotkey-editor-commands");
  return { app, sidePanelContent, commandLog, openPaletteButton, palette, paletteFilter, paletteResults,
    createKeymapButton, updateKeymapButton, loadKeymapButton, keymapFileInput, keymapStatus, keymapWarning,
    workspaceTabList, hotkeyEditorFilter, hotkeyEditorCommands,
    dataLayerStorage, hotkeyStorage, shellStorage, durableProjectRuntime };
}

export type InstalledDataLayerControllers = Readonly<Record<
  InstalledDataLayerControllerId,
  InstalledDataLayerControllerLifecycle
>>;

export function createInstalledDataLayerLifecycle(
  controllers: InstalledDataLayerControllers,
): InstalledDataLayerControllerLifecycle {
  let mounted = false;

  return {
    mount(): void {
      if (mounted) return;
      mounted = true;
      for (const id of installedDataLayerControllerOrder) controllers[id].mount();
    },
    dispose(): void {
      if (!mounted) return;
      mounted = false;
      for (const id of [...installedDataLayerControllerOrder].reverse()) {
        controllers[id].dispose();
      }
    },
  };
}
import { extensionShell, utilityRegistry } from "../utility-registry.js";
import { bindUtilityPanels, mountUtilityShell, renderUtilityDirectory } from "../platform/utility-shell-dom.js";
import { createUtilityStorage } from "../platform/utility-storage.js";
import { installDurableRepositoryStartupFailure, openDurableProjectRuntime,
  SCHEMA_LIBRARY_STORAGE_KEY } from "../utilities/data-layer/schemas.js";
import type { CommandRunContext, CommandRunRecord } from "../commands.js";
import type { WorkspaceTabId } from "../workspace-tabs.js";
