export type LiveTestingState = "Active" | "Paused" | "Detached";

export interface LiveSessionSummaryInput {
  testingState: LiveTestingState;
  targetPage: string;
  pageUrl: string;
  observerPath: string;
  capturedEventCount: number;
  connectedSourceCount: number;
}

export interface LiveSessionSummary extends Omit<LiveSessionSummaryInput, "testingState"> {
  statusLabel: "Capturing" | "Paused" | "Detached";
}

export function createLiveSessionSummary(
  input: LiveSessionSummaryInput,
): LiveSessionSummary {
  return {
    statusLabel: input.testingState === "Active"
      ? "Capturing"
      : input.testingState,
    targetPage: input.targetPage,
    pageUrl: input.pageUrl,
    observerPath: input.observerPath,
    capturedEventCount: input.capturedEventCount,
    connectedSourceCount: input.connectedSourceCount,
  };
}
