import assert from "node:assert/strict";

import { verifyPreparedInstalledController } from "../support/data-layer-installed-controller-contract.mjs";

await verifyPreparedInstalledController("capture");

const runtime = await import("../../dist/data-layer-installed/runtime.js");
assert.equal(typeof runtime.mountInstalledDataLayerRuntime, "function",
  "the public Data Layer entry can mount the installed runtime through one lifecycle boundary");
