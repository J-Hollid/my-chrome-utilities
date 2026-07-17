import { defineUtility } from "../../platform/utility-contract.js";
import { createDomUtilityLifecycle } from "../../platform/utility-lifecycle-dom.js";
export { createHotkeyEditor } from "../../hotkey-editor.js";
export * from "../../hotkey-keymap.js";
export const hotkeysUtility = defineUtility({ id: "hotkeys", identity: { name: "Hotkeys", description: "Key bindings and hotkey editing" }, commands: ["navigation.show-hotkeys"], panels: ["workspace-panel-hotkeys"], lifecycle: createDomUtilityLifecycle("hotkeys", ["workspace-panel-hotkeys"]), storage: { namespace: "my-chrome-utilities.hotkeys", version: 1, legacyKeys: ["my-chrome-utilities.hotkey-keymap.v1"] } });
//# sourceMappingURL=index.js.map