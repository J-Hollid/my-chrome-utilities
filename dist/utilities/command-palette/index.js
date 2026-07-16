import { defineUtility } from "../../platform/utility-contract.js";
export { filterPaletteCommands, selectedPaletteIndexForKey } from "../../command-palette.js";
export { listCommands, findCommand, runCommandById } from "../../commands.js";
export const commandPaletteUtility = defineUtility({ id: "command-palette", identity: { name: "Command palette", description: "Command discovery and execution" }, commands: ["demo.say-hello"], panels: ["command-palette"], lifecycle: { activate() { }, deactivate() { } }, storage: { namespace: "my-chrome-utilities.command-palette", version: 1 } });
//# sourceMappingURL=index.js.map