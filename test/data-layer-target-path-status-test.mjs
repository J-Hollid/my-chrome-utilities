import assert from "node:assert/strict";

import { createTargetPathStatusController } from "../dist/data-layer-target-path-status.js";

const pending = new Map();
const renders = [];
const applied = [];
const controller = createTargetPathStatusController({
  render: (path, fieldValue, status) => renders.push({ path, fieldValue, status }),
  read: (path) => new Promise((resolve) => pending.set(path, resolve)),
  apply: (observation) => applied.push(observation.historyPath),
});

const first = controller.configure("event.history", " event.history ");
const second = controller.configure("dataLayer");
assert.deepEqual(renders.map(({ status }) => status), []);

pending.get("event.history")({
  historyPath: "event.history",
  pageUrl: "https://example.test/first",
  pageAccessStatus: "page access available",
  pageObject: { event: { history: [] } },
});
await first;
assert.deepEqual(applied, []);

pending.get("dataLayer")({
  historyPath: "dataLayer",
  pageUrl: "https://example.test/second",
  pageAccessStatus: "page access available",
  pageObject: {},
});
await second;
assert.equal(renders.at(-1).status, "Waiting for path");
assert.deepEqual(applied, ["dataLayer"]);

const unavailable = createTargetPathStatusController({
  render: (_path, _fieldValue, status) => renders.push({ status }),
  read: async () => undefined,
  apply: () => assert.fail("missing selection must not apply an observation"),
});
await unavailable.configure("queue.history");
assert.equal(renders.at(-1).status, "Selection required");
