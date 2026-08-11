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
function mountCommandPalette(root) {
    const host = root;
    const launcher = host.querySelector("#open-palette");
    const palette = host.querySelector("#palette");
    const filter = host.querySelector("#palette-filter");
    const results = host.querySelector("#palette-results");
    if (!launcher || !palette || !filter || !results)
        return;
    const commandLog = host.querySelector("#command-log");
    const commands = commandsForUtilityShell(listCommands(), commandPaletteCommandIds);
    const controller = createPaletteController({
        commands,
        executeCommand(command) {
            runCommandById(command.id, {
                record(entry) {
                    if (commandLog)
                        commandLog.textContent = entry.message;
                },
            });
        },
        elements: {
            root: host,
            launcher,
            palette,
            filter,
            results,
            sidePanelContent: host.querySelector("#side-panel-content"),
        },
        ownerDocument: host.ownerDocument,
    });
    controller.mount();
    return () => controller.dispose();
}
export const commandPaletteUtility = defineUtility({
    id: "command-palette",
    identity: { name: "Command palette", description: "Command discovery and execution" },
    commands: commandPaletteCommandIds,
    panels: ["palette"],
    lifecycle: createDomUtilityLifecycle("command-palette", ["palette"], { onMount: mountCommandPalette }),
    storage: { namespace: "my-chrome-utilities.command-palette", version: 1 },
});
//# sourceMappingURL=index.js.map