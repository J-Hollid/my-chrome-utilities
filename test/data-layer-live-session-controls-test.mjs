import assert from "node:assert/strict";

import {
  liveSessionControls,
} from "../dist/data-layer-live-session-controls.js";
import { renderLiveSessionControls } from "../dist/data-layer-live-session-controls-ui.js";

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

const elements = {
  startTestingButton: { hidden: false },
  endTestingButton: { hidden: false },
  pauseCaptureButton: { hidden: false },
  resumeCaptureButton: { hidden: false },
};

renderLiveSessionControls(elements, { activeSession: false, captureStatus: "Live" });
assert.equal(elements.startTestingButton.hidden, false);
assert.equal(elements.endTestingButton.hidden, true);
assert.equal(elements.pauseCaptureButton.hidden, true);
assert.equal(elements.resumeCaptureButton.hidden, true);

renderLiveSessionControls(elements, { activeSession: true, captureStatus: "Live" });
assert.equal(elements.startTestingButton.hidden, true);
assert.equal(elements.endTestingButton.hidden, false);
assert.equal(elements.pauseCaptureButton.hidden, false);
assert.equal(elements.resumeCaptureButton.hidden, true);

renderLiveSessionControls(elements, { activeSession: true, captureStatus: "Paused" });
assert.equal(elements.pauseCaptureButton.hidden, true);
assert.equal(elements.resumeCaptureButton.hidden, false);
