import {
  attachedObservationTarget,
  type ObservationTargetState,
} from "./data-layer-observation-targets.js";
import type { DataLayerSessionState } from "./data-layer-session.js";

export interface AttachedTargetRecoveryRequest {
  readonly sessionId: string;
  readonly targetId: string;
  readonly tabId: number;
}

export function captureAttachedTargetRecovery(
  targetState: ObservationTargetState,
  sessionState: DataLayerSessionState,
): AttachedTargetRecoveryRequest | undefined {
  const target = attachedObservationTarget(targetState);
  const session = sessionState.session;
  if (
    !target ||
    session?.status !== "active" ||
    session.tabId !== target.tabId
  ) {
    return undefined;
  }
  return {
    sessionId: session.id,
    targetId: target.id,
    tabId: target.tabId,
  };
}

export function attachedTargetRecoveryIsCurrent(
  targetState: ObservationTargetState,
  sessionState: DataLayerSessionState,
  request: AttachedTargetRecoveryRequest,
): boolean {
  const session = sessionState.session;
  return (
    session?.status === "active" &&
    session.id === request.sessionId &&
    session.tabId === request.tabId &&
    targetState.selectedTargetId === request.targetId &&
    targetState.attachedTargetId === request.targetId
  );
}
