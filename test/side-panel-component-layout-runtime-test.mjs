import { readFile } from "node:fs/promises";

import { runDirectSidePanelCompatibility } from "./support/side-panel-browser-direct-compatibility.mjs";

// Supported direct compatibility command. Registered logical targets use their
// owning pack entry programs; no-target mode retains the complete viewport suite.
const captureMode = process.env.SWARMFORGE_SIDE_PANEL_DIRECT_COMPATIBILITY_CAPTURE;
if (captureMode && captureMode !== "preparation-v1") {
  throw new Error("Direct compatibility capture accepts only the preparation-v1 authority");
}
await runDirectSidePanelCompatibility(captureMode ? {
  capturePreparation:true,
  assertionSource:await readFile(new URL("./support/side-panel-browser-fixture-primitives.mjs", import.meta.url), "utf8"),
} : undefined);
