import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { installedDataLayerControllerOrder } from
  "../../dist/data-layer-installed/runtime.js";

export async function verifyPreparedInstalledConsumer(packId) {
  const packs = JSON.parse(await readFile("verification/packs.json", "utf8"));
  const pack = packs.find(({ id }) => id === packId);
  const slice = pack.verificationSlices.find(
    ({ id }) => id === "side_panel_installed_controller_consumer",
  );
  assert.equal(slice.consumerOnly, true);
  assert.deepEqual(slice.sourcePaths, []);
  assert.deepEqual(slice.sourcePrefixes, []);
  assert.equal(installedDataLayerControllerOrder.length, 9);
}
