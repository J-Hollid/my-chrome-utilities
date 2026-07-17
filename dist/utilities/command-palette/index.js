import { defineUtility } from "../../platform/utility-contract.js";
import { createDomUtilityLifecycle } from "../../platform/utility-lifecycle-dom.js";
import { createPaletteController } from "../../command-palette-ui.js";
import { listCommands, runCommandById } from "../../commands.js";
export { filterPaletteCommands, selectedPaletteIndexForKey } from "../../command-palette.js";
export { createPaletteController } from "../../command-palette-ui.js";
export { listCommands, findCommand, runCommandById } from "../../commands.js";
export function commandsForUtilityShell(commands, registeredCommandIds) {
    const registered = new Set(registeredCommandIds);
    const selected = commands.filter(({ id }) => registered.has(id));
    const available = new Set(selected.map(({ id }) => id));
    const missing = registeredCommandIds.filter((id) => !available.has(id));
    if (missing.length) {
        throw new Error(`Registered utility commands are unavailable: ${missing.join(", ")}`);
    }
    return selected;
}
const commandPaletteCommandIds = ["demo.say-hello"];
export const commandPaletteUtility = defineUtility({ id: "command-palette", identity: { name: "Command palette", description: "Command discovery and execution" }, commands: commandPaletteCommandIds, panels: ["palette"], lifecycle: createDomUtilityLifecycle("command-palette", ["palette"], { onMount(root) {
            const host = root;
            if (!host.querySelector("#open-palette") || !host.querySelector("#palette-filter") || !host.querySelector("#palette-results"))
                return;
            const commandLog = host.querySelector("#command-log");
            const commands = commandsForUtilityShell(listCommands(), commandPaletteCommandIds);
            const controller = createPaletteController({ root: host, sidePanelContent: host.querySelector("#side-panel-content"), commands, runCommand(command) { runCommandById(command.id, { record(entry) { if (commandLog)
                        commandLog.textContent = entry.message; } }); } });
            controller.bind();
        } }), storage: { namespace: "my-chrome-utilities.command-palette", version: 1 } });
//# sourceMappingURL=index.js.map