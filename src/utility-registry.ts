import type { UtilityModuleEntry } from "./platform/utility-contract.js";
import { commandPaletteUtility } from "./utilities/command-palette/index.js";
import { hotkeysUtility } from "./utilities/hotkeys/index.js";
import { dataLayerUtility } from "./utilities/data-layer/index.js";

export const utilityRegistry:readonly UtilityModuleEntry[]=[commandPaletteUtility,hotkeysUtility,dataLayerUtility];
export function composeUtilityShell(utilities:readonly UtilityModuleEntry[]):{utilityIds:string[];commands:string[];panels:string[]}{
  const utilityIds=utilities.map(({id})=>id);if(new Set(utilityIds).size!==utilityIds.length)throw new Error("Each utility must be registered once");
  const namespaces=utilities.map(({storage})=>storage.namespace);if(new Set(namespaces).size!==namespaces.length)throw new Error("Each utility must own a distinct storage namespace");
  return {utilityIds,commands:[...new Set(utilities.flatMap(({commands})=>commands))],panels:[...new Set(utilities.flatMap(({panels})=>panels))]};
}
export const extensionShell=composeUtilityShell(utilityRegistry);
