import assert from "node:assert/strict";
import { extensionShell, utilityRegistry } from "../../dist/utility-registry.js";
import { inspectUtilityEntry } from "./shared-harness.mjs";
assert.deepEqual(extensionShell.utilityIds,["command-palette","hotkeys","data-layer"]);
for(const utility of utilityRegistry)inspectUtilityEntry(utility);
console.log("shell browser adapter passed");
