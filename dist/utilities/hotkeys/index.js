import { defineUtility } from "../../platform/utility-contract.js";
import { createDomUtilityLifecycle } from "../../platform/utility-lifecycle-dom.js";
import { createHotkeyEditor } from "../../hotkey-editor.js";
import { blankHotkeyKeymap } from "../../hotkey-keymap.js";
import { listCommands } from "../../commands.js";
export { createHotkeyEditor } from "../../hotkey-editor.js";
export * from "../../hotkey-keymap.js";
const hotkeyCommandIds = ["navigation.show-hotkeys"];
function mountHotkeyEditor(root) {
    const container = root.querySelector("#hotkey-editor-commands");
    const filter = root.querySelector("#hotkey-editor-filter");
    if (!container || !filter)
        return;
    const commands = listCommands().filter(({ id }) => hotkeyCommandIds.includes(id));
    let keymap = blankHotkeyKeymap(commands);
    const editor = createHotkeyEditor({
        commands,
        container,
        filter,
        getKeymap: () => keymap,
        setKeymap(next) { keymap = next; },
        setStatus(message) {
            const status = root.querySelector("#keymap-status");
            if (status)
                status.textContent = message;
        },
        setWarning(message) {
            const warning = root.querySelector("#keymap-warning");
            if (warning)
                warning.textContent = message;
        },
    });
    editor.bind();
    editor.render();
}
export const hotkeysUtility = defineUtility({
    id: "hotkeys",
    identity: { name: "Hotkeys", description: "Key bindings and hotkey editing" },
    commands: hotkeyCommandIds,
    panels: ["workspace-panel-hotkeys"],
    lifecycle: createDomUtilityLifecycle("hotkeys", ["workspace-panel-hotkeys"], { onMount: mountHotkeyEditor }),
    storage: {
        namespace: "my-chrome-utilities.hotkeys",
        version: 1,
        legacyKeys: ["my-chrome-utilities.hotkey-keymap.v1"],
    },
});
//# sourceMappingURL=index.js.map