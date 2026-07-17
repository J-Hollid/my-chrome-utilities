import { defineUtility } from "../../platform/utility-contract.js";
import { createDomUtilityLifecycle } from "../../platform/utility-lifecycle-dom.js";
import type { AppCommand } from "../../commands.js";
export { filterPaletteCommands, selectedPaletteIndexForKey } from "../../command-palette.js";
export { createPaletteController } from "../../command-palette-ui.js";
export { listCommands, findCommand, runCommandById } from "../../commands.js";
export type { AppCommand, CommandRunContext, CommandRunRecord } from "../../commands.js";
export function commandsForUtilityShell(
  commands: readonly AppCommand[],
  registeredCommandIds: readonly string[],
): readonly AppCommand[] {
  const registered = new Set(registeredCommandIds);
  const selected = commands.filter(({ id }) => registered.has(id));
  const available = new Set(selected.map(({ id }) => id));
  const missing = registeredCommandIds.filter((id) => !available.has(id));
  if (missing.length) {
    throw new Error(`Registered utility commands are unavailable: ${missing.join(", ")}`);
  }
  return selected;
}
export const commandPaletteUtility=defineUtility({id:"command-palette",identity:{name:"Command palette",description:"Command discovery and execution"},commands:["demo.say-hello"],panels:["palette"],lifecycle:createDomUtilityLifecycle("command-palette",["palette"]),storage:{namespace:"my-chrome-utilities.command-palette",version:1}});
