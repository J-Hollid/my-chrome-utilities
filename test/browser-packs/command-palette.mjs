import { commandPaletteUtility, commandsForUtilityShell, listCommands, runCommandById } from "../../dist/utilities/command-palette/index.js";
import { inspectBrowserPack } from "./shared-harness.mjs";
inspectBrowserPack("command-palette",commandPaletteUtility);
const commands=commandsForUtilityShell(listCommands(),commandPaletteUtility.commands);
const records=[];
runCommandById(commands[0].id,{record(entry){records.push(entry);}});
if(records[0]?.message!=="demo.say-hello ran")throw new Error("Registered command did not execute through the production command boundary");
