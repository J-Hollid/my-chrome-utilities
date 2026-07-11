export type LiveTestingState = "Active" | "Paused" | "Ended";
export type LiveObserverStatus = "Connected" | "Waiting for path" | "Error" | "Disconnected";

export interface LiveSessionSummaryInput {
  testingState: LiveTestingState;
  observerStatus: LiveObserverStatus;
  targetPage: string;
  pageUrl: string;
  observerPath: string;
  capturedEventCount: number;
  connectedSourceCount: number;
}

export interface LiveSessionSummary extends Omit<LiveSessionSummaryInput, "testingState"> {
  statusLabel: "Capturing" | "Paused" | "Ended";
}

export function createLiveSessionSummary(
  input: LiveSessionSummaryInput,
): LiveSessionSummary {
  return {
    statusLabel: input.testingState === "Active"
      ? "Capturing"
      : input.testingState,
    observerStatus: input.observerStatus,
    targetPage: input.targetPage,
    pageUrl: input.pageUrl,
    observerPath: input.observerPath,
    capturedEventCount: input.capturedEventCount,
    connectedSourceCount: input.connectedSourceCount,
  };
}
