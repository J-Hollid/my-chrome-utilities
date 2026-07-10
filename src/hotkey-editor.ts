import type { AppCommand } from "./commands.js";
import {
  changeHotkeyBinding,
  type HotkeyKeymap,
} from "./hotkey-keymap.js";

export interface HotkeyEditorController {
  bind(): void;
  render(): void;
}

export interface HotkeyEditorOptions {
  commands: readonly AppCommand[];
  container: HTMLElement | null;
  filter: HTMLInputElement | null;
  getKeymap(): HotkeyKeymap;
  setKeymap(keymap: HotkeyKeymap): void;
  setStatus(message: string): void;
  setWarning(message: string): void;
}

function editorGroupLabel(command: AppCommand): string {
  if (command.category === "navigation") {
    return "Navigation";
  }
  if (command.category === "data-layer") {
    return "Workspace";
  }
  return "General";
}

export function createHotkeyEditor(
  options: HotkeyEditorOptions,
): HotkeyEditorController {
  const {
    commands,
    container,
    filter,
    getKeymap,
    setKeymap,
    setStatus,
    setWarning,
  } = options;

  function commit(command: AppCommand, sequence: string): void {
    const change = changeHotkeyBinding(getKeymap(), command.id, sequence);

    if (!change.keymap) {
      setWarning(
        `Conflict: ${change.sequence} is assigned to ${change.conflictingCommandId}; ${command.id} was not changed.`,
      );
      return;
    }

    setKeymap(change.keymap);
    setWarning("");
    setStatus(
      change.sequence
        ? `Hotkey updated: ${command.id}`
        : `Hotkey cleared: ${command.id}`,
    );
    renderHotkeyEditor();
  }

  function renderCommand(command: AppCommand): HTMLLIElement {
    const keymap = getKeymap();
    const item = document.createElement("li");
    const title = document.createElement("strong");
    const id = document.createElement("code");
    const input = document.createElement("input");
    const save = document.createElement("button");
    const clear = document.createElement("button");

    title.textContent = command.title;
    id.textContent = command.id;
    input.type = "text";
    input.value = keymap.bindings[command.id] ?? "";
    input.placeholder = "Unassigned";
    input.dataset.commandId = command.id;
    input.setAttribute("aria-label", `Hotkey sequence for ${command.title}`);
    input.addEventListener("input", () => {
      setStatus(`Pending hotkey change: ${input.value}`);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        input.value = getKeymap().bindings[command.id] ?? "";
        setStatus("");
      }
    });
    save.type = "button";
    save.textContent = "Save";
    save.setAttribute("aria-label", `Save hotkey for ${command.title}`);
    save.addEventListener("click", () => commit(command, input.value));
    clear.type = "button";
    clear.textContent = "Clear";
    clear.setAttribute("aria-label", `Clear hotkey for ${command.title}`);
    clear.addEventListener("click", () => commit(command, ""));
    item.append(title, document.createTextNode(" "), id, input, save, clear);
    return item;
  }

  function renderHotkeyEditor(): void {
    if (!container) {
      return;
    }

    const keymap = getKeymap();
    const query = filter?.value.trim().toLowerCase() ?? "";
    const matching = commands.filter((command) =>
      `${command.title} ${command.id} ${keymap.bindings[command.id] ?? ""}`
        .toLowerCase()
        .includes(query),
    );
    const groups = new Map<string, AppCommand[]>();

    for (const command of matching) {
      const label = editorGroupLabel(command);
      groups.set(label, [...(groups.get(label) ?? []), command]);
    }

    container.replaceChildren();
    for (const [label, groupedCommands] of groups) {
      const section = document.createElement("section");
      const heading = document.createElement("h3");
      const list = document.createElement("ul");
      heading.textContent = label;
      list.append(...groupedCommands.map(renderCommand));
      section.append(heading, list);
      container.append(section);
    }
  }

  return {
    bind: () => filter?.addEventListener("input", renderHotkeyEditor),
    render: renderHotkeyEditor,
  };
}
