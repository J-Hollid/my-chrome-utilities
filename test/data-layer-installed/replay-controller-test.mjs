import assert from "node:assert/strict";

import { verifyPreparedInstalledController } from "../support/data-layer-installed-controller-contract.mjs";
await verifyPreparedInstalledController("replay");

const { createReplayInstalledController } = await import(
  "../../dist/data-layer-installed/replay/index.js"
);
const controller = createReplayInstalledController({
  root:{ querySelector:() => null },
  listTemplates:() => [{ id:"template:1", name:"Page view", version:1,
    sourceId:"source:1", destination:"event.history", payload:{ event:"page_view" } }],
  listSources:() => [],
  pageUrl:() => "https://example.test/",
});
controller.mount();
controller.mount();
controller.createFromSession("session:1", "Regression", ["1"]);
assert.equal(controller.sequences().length, 1,
  "the Replay controller exclusively owns installed sequence state");
controller.dispose();
controller.dispose();
controller.mount();
assert.equal(controller.sequences().length, 1,
  "disposing and remounting Replay does not duplicate or discard domain state");
