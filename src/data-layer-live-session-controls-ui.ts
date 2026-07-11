import {
  liveSessionControls,
  type LiveSessionControlState,
  type LiveSessionControls,
} from "./data-layer-live-session-controls.js";

export interface LiveSessionControlElements {
  startTestingButton: Pick<HTMLButtonElement, "hidden"> | null;
  endTestingButton: Pick<HTMLButtonElement, "hidden"> | null;
  pauseCaptureButton: Pick<HTMLButtonElement, "hidden"> | null;
  resumeCaptureButton: Pick<HTMLButtonElement, "hidden"> | null;
}

export function renderLiveSessionControls(
  elements: LiveSessionControlElements,
  state: LiveSessionControlState,
): LiveSessionControls {
  const controls = liveSessionControls(state);
  if (elements.startTestingButton) {
    elements.startTestingButton.hidden = controls.sessionAction !== "Start testing";
  }
  if (elements.endTestingButton) {
    elements.endTestingButton.hidden = controls.sessionAction !== "End testing";
  }
  if (elements.pauseCaptureButton) {
    elements.pauseCaptureButton.hidden = controls.captureAction !== "Pause capture";
  }
  if (elements.resumeCaptureButton) {
    elements.resumeCaptureButton.hidden = controls.captureAction !== "Resume capture";
  }
  return controls;
}
