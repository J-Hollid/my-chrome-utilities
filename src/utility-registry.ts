import type { UtilityModuleEntry } from "./platform/utility-contract.js";
import { commandPaletteUtility } from "./utilities/command-palette/index.js";
import { hotkeysUtility } from "./utilities/hotkeys/index.js";
import { dataLayerUtility } from "./utilities/data-layer/index.js";

export interface UtilityShell {
  utilityIds: string[];
  commands: string[];
  panels: string[];
  activate(): string[];
  deactivate(): void;
}

export const utilityRegistry: readonly UtilityModuleEntry[] = [
  commandPaletteUtility,
  hotkeysUtility,
  dataLayerUtility,
];

export function composeUtilityShell(
  utilities: readonly UtilityModuleEntry[],
): UtilityShell {
  const utilityIds = utilities.map(({ id }) => id);
  if (new Set(utilityIds).size !== utilityIds.length) {
    throw new Error("Each utility must be registered once");
  }
  const namespaces = utilities.map(({ storage }) => storage.namespace);
  if (new Set(namespaces).size !== namespaces.length) {
    throw new Error("Each utility must own a distinct storage namespace");
  }

  let activeUtilities: UtilityModuleEntry[] = [];
  return {
    utilityIds,
    commands: [...new Set(utilities.flatMap(({ commands }) => commands))],
    panels: [...new Set(utilities.flatMap(({ panels }) => panels))],
    activate(): string[] {
      if (activeUtilities.length) return activeUtilities.map(({ id }) => id);
      try {
        for (const utility of utilities) {
          utility.lifecycle.activate();
          activeUtilities.push(utility);
        }
      } catch (error) {
        for (const utility of activeUtilities.reverse()) {
          utility.lifecycle.deactivate();
        }
        activeUtilities = [];
        throw error;
      }
      return activeUtilities.map(({ id }) => id);
    },
    deactivate(): void {
      for (const utility of activeUtilities.reverse()) {
        utility.lifecycle.deactivate();
      }
      activeUtilities = [];
    },
  };
}

export const extensionShell = composeUtilityShell(utilityRegistry);
