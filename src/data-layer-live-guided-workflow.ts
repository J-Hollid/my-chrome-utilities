import type { ObservationTargetAccessState } from "./data-layer-observation-targets.js";
import type { TargetPathStatus } from "./data-layer-target-path-status.js";

export type LiveSetupStepId = "target" | "readiness" | "session";
export type LiveSetupStepState = "complete" | "current" | "upcoming";

export interface LiveSetupStep {
  id: LiveSetupStepId;
  label: string;
  state: LiveSetupStepState;
}

export interface LiveGuidedWorkflow {
  setupVisible: boolean;
  steps: readonly LiveSetupStep[];
  chooseTargetVisible: boolean;
  startTestingEnabled: boolean;
  startTestingLabel: string;
  startTestingDescription: string;
}

export function liveGuidedWorkflow(input: {
  activeSession: boolean;
  selectedTarget?: { title: string; accessState: ObservationTargetAccessState };
  pathStatus: TargetPathStatus;
}): LiveGuidedWorkflow {
  const targetSelected = input.selectedTarget !== undefined;
  const ready = input.selectedTarget?.accessState === "Ready"
    && input.pathStatus === "Ready";
  const current: LiveSetupStepId = !targetSelected
    ? "target"
    : ready
      ? "session"
      : "readiness";
  const order: readonly LiveSetupStepId[] = ["target", "readiness", "session"];
  const currentIndex = order.indexOf(current);
  const labels: Record<LiveSetupStepId, string> = {
    target: targetSelected
      ? `Choose target — ${input.selectedTarget?.title} selected`
      : "Choose target",
    readiness: ready
      ? "Confirm access and path — Ready"
      : `Confirm access and path — ${input.pathStatus}`,
    session: "Start testing",
  };

  return {
    setupVisible: !input.activeSession,
    steps: order.map((id, index) => ({
      id,
      label: labels[id],
      state: index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming",
    })),
    chooseTargetVisible: !input.activeSession,
    startTestingEnabled: !input.activeSession && ready,
    startTestingLabel: ready && input.selectedTarget
      ? `Start testing ${input.selectedTarget.title}`
      : "Start testing",
    startTestingDescription: ready
      ? "Starts testing with the selected ready target."
      : "Choose a ready target and confirm its observer path before starting",
  };
}
