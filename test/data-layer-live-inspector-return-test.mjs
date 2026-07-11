import assert from "node:assert/strict";
import {
  captureInspectorReturn,
  restoreInspectorReturn,
} from "../dist/data-layer-live-inspector-return.js";

const snapshot = captureInspectorReturn("purchase", 480);
assert.deepEqual(snapshot, { eventId: "purchase", scrollTop: 480 });
assert.deepEqual(restoreInspectorReturn(snapshot), { eventId: "purchase", scrollTop: 480 });
assert.deepEqual(captureInspectorReturn("banner", -10), { eventId: "banner", scrollTop: 0 });
