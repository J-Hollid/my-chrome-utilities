import { readFile } from "node:fs/promises";

import { runDirectSidePanelCompatibility } from
  "./support/side-panel-browser-direct-compatibility.mjs";

await runDirectSidePanelCompatibility({
  capturePreparation:true,
  assertionSource:await readFile(
    new URL("./support/side-panel-browser-fixture-primitives.mjs", import.meta.url),
    "utf8",
  ),
});
