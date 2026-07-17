import { commandPaletteUtility } from "./utilities/command-palette/index.js";
import { hotkeysUtility } from "./utilities/hotkeys/index.js";
import { dataLayerUtility } from "./utilities/data-layer/index.js";
export const utilityRegistry = [
    commandPaletteUtility,
    hotkeysUtility,
    dataLayerUtility,
];
export function composeUtilityShell(utilities) {
    const utilityIds = utilities.map(({ id }) => id);
    if (new Set(utilityIds).size !== utilityIds.length) {
        throw new Error("Each utility must be registered once");
    }
    const namespaces = utilities.map(({ storage }) => storage.namespace);
    if (new Set(namespaces).size !== namespaces.length) {
        throw new Error("Each utility must own a distinct storage namespace");
    }
    let activeUtilities = [];
    return {
        utilityIds,
        commands: [...new Set(utilities.flatMap(({ commands }) => commands))],
        panels: [...new Set(utilities.flatMap(({ panels }) => panels))],
        activate() {
            if (activeUtilities.length)
                return activeUtilities.map(({ id }) => id);
            try {
                for (const utility of utilities) {
                    utility.lifecycle.activate();
                    activeUtilities.push(utility);
                }
            }
            catch (error) {
                for (const utility of activeUtilities.reverse()) {
                    utility.lifecycle.deactivate();
                }
                activeUtilities = [];
                throw error;
            }
            return activeUtilities.map(({ id }) => id);
        },
        deactivate() {
            for (const utility of activeUtilities.reverse()) {
                utility.lifecycle.deactivate();
            }
            activeUtilities = [];
        },
    };
}
export const extensionShell = composeUtilityShell(utilityRegistry);
//# sourceMappingURL=utility-registry.js.map