import { liveSessionControls, } from "./data-layer-live-session-controls.js";
export function renderLiveSessionControls(elements, state) {
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
//# sourceMappingURL=data-layer-live-session-controls-ui.js.map