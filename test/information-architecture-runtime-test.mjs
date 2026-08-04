import assert from "node:assert/strict";

import { liveSessionControls } from "../dist/data-layer-live-session-controls.js";
import {
  attachSelectedObservationTarget,
  createObservationTarget,
  createObservationTargetState,
  detachObservationTarget,
  selectObservationTarget,
} from "../dist/data-layer-observation-targets.js";
import {
  endDataLayerTestingSession,
  startDataLayerTestingSession,
} from "../dist/data-layer-session.js";

const controlCases = [
  {
    sessionState: "Inactive",
    captureState: "Inactive",
    activeSession: false,
    productionCaptureState: "Live",
    sessionAction: "Start testing",
    captureAction: "none",
  },
  {
    sessionState: "Active",
    captureState: "Live",
    activeSession: true,
    productionCaptureState: "Live",
    sessionAction: "End testing",
    captureAction: "Pause capture",
  },
  {
    sessionState: "Active",
    captureState: "Paused",
    activeSession: true,
    productionCaptureState: "Paused",
    sessionAction: "End testing",
    captureAction: "Resume capture",
  },
];

const controls = controlCases.map((testCase) => {
  const actual = liveSessionControls({
    activeSession: testCase.activeSession,
    captureStatus: testCase.productionCaptureState,
  });
  assert.deepEqual(actual, {
    sessionAction: testCase.sessionAction,
    captureAction: testCase.captureAction,
  });
  return {
    sessionState: testCase.sessionState,
    captureState: testCase.captureState,
    ...actual,
  };
});

const target = createObservationTarget({
  tabId: 42,
  windowId: 7,
  pageUrl: "https://example.test/",
  title: "Example",
});
const selected = selectObservationTarget(
  createObservationTargetState([target]),
  target.id,
);
const attached = attachSelectedObservationTarget(selected);
const started = startDataLayerTestingSession({}, {
  id: "information-architecture-runtime",
  tabId: target.tabId,
  windowId: target.windowId,
  url: target.pageUrl,
  historyPath: "event.history",
  targetTitle: target.title,
  targetOrigin: target.origin,
});
const ended = endDataLayerTestingSession(started);
const detached = detachObservationTarget(attached.state);
const lifecycle = {
  started: attached.result === "Attached" && started.session?.status === "active",
  ended: ended.session?.status === "ended" && detached.sessionState === "Detached",
};

assert.deepEqual(lifecycle, { started: true, ended: true });

console.log(JSON.stringify({ informationArchitecture: { controls, lifecycle } }));
