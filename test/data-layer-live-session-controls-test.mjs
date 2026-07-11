import assert from "node:assert/strict";

import {
  liveSessionControls,
} from "../dist/data-layer-live-session-controls.js";

assert.deepEqual(
  liveSessionControls({ activeSession: false, captureStatus: "Live" }),
  { sessionAction: "Start testing", captureAction: "none" },
);
assert.deepEqual(
  liveSessionControls({ activeSession: true, captureStatus: "Live" }),
  { sessionAction: "End testing", captureAction: "Pause capture" },
);
assert.deepEqual(
  liveSessionControls({ activeSession: true, captureStatus: "Paused" }),
  { sessionAction: "End testing", captureAction: "Resume capture" },
);
