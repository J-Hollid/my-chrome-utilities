export type LiveCaptureStatus = "Live" | "Paused";

export interface LiveSessionControlState {
  activeSession: boolean;
  captureStatus: LiveCaptureStatus;
}

export interface LiveSessionControls {
  sessionAction: "Start testing" | "End testing";
  captureAction: "none" | "Pause capture" | "Resume capture";
}

export function liveSessionControls(
  state: LiveSessionControlState,
): LiveSessionControls {
  if (!state.activeSession) {
    return { sessionAction: "Start testing", captureAction: "none" };
  }
  return {
    sessionAction: "End testing",
    captureAction: state.captureStatus === "Paused"
      ? "Resume capture"
      : "Pause capture",
  };
}
