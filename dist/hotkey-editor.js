import { hotkeyRecorder, reservedHotkey } from "./interface/hotkey-recorder.js";
import { changeHotkeyBinding, } from "./hotkey-keymap.js";
function editorGroupLabel(command) {
    if (command.category === "navigation") {
        return "Navigation";
    }
    if (command.category === "data-layer") {
        return "Workspace";
    }
    return "General";
}
export function createHotkeyEditor(options) {
    const { commands, container, filter, getKeymap, setKeymap, setStatus, setWarning, } = options;
    function commit(command, sequence) {
        if (reservedHotkey(sequence)) {
            setWarning("This sequence contains a browser or Commands shortcut. Choose different keys.");
            return;
        }
        const change = changeHotkeyBinding(getKeymap(), command.id, sequence);
        if (!change.keymap) {
            setWarning(`Conflict: ${change.sequence} is assigned to ${commands.find((item) => item.id === change.conflictingCommandId)?.title ?? change.conflictingCommandId}; ${command.title} was not changed.`);
            return;
        }
        setKeymap(change.keymap);
        setWarning("");
        setStatus(change.sequence
            ? `Hotkey updated: ${command.title}`
            : `Hotkey cleared: ${command.title}`);
        renderHotkeyEditor();
    }
    function renderCommand(command) {
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
        const advanced = document.createElement("details"), summary = document.createElement("summary");
        summary.textContent = "Command ID";
        advanced.append(summary, id);
        item.append(title, input, hotkeyRecorder(input, setStatus), save, clear, advanced);
        return item;
    }
    function renderHotkeyEditor() {
        if (!container) {
            return;
        }
        const keymap = getKeymap();
        const query = filter?.value.trim().toLowerCase() ?? "";
        const matching = commands.filter((command) => `${command.title} ${command.id} ${keymap.bindings[command.id] ?? ""}`
            .toLowerCase()
            .includes(query));
        const groups = new Map();
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
    let bound = false;
    const bind = () => {
        if (bound)
            return;
        bound = true;
        filter?.addEventListener("input", renderHotkeyEditor);
    };
    const unbind = () => {
        if (!bound)
            return;
        bound = false;
        filter?.removeEventListener("input", renderHotkeyEditor);
    };
    return {
        bind,
        unbind,
        render: renderHotkeyEditor,
    };
}
//# sourceMappingURL=hotkey-editor.js.map