import type { LiveEvent } from "./data-layer-live-observer.js";
import type {
  LiveFlowHistoryEntry,
  LiveFlowMatchedPathEntry,
} from "./data-layer-live-flow-testing.js";

export interface LiveFlowDefectContext {
  flowId: string;
  flowName: string;
  selectedStepId: string;
  selectedStepName: string;
  eventId: string;
  eventStepLink: { eventId:string; stepId:string };
  path: readonly LiveFlowMatchedPathEntry[];
  linkEvidence:
    | { kind:"path"; label:string; relationshipIds:readonly string[] }
    | { kind:"start"; label:string; pageFrameId:string };
  effectiveTarget: { id:string; name:string };
  effectiveSchemaRevision: number;
  effectiveSchemaRevisionIdentity: string;
  provenance: readonly {
    contributorId:string;
    contributorName:string;
    scope:string;
  }[];
}

function representedValue(value: unknown): string {
  return JSON.stringify(value) ?? String(value);
}

function linkEvidence(
  entry: LiveFlowHistoryEntry,
): LiveFlowDefectContext["linkEvidence"] {
  if (!entry.relationshipId) {
    return {
      kind:"start",
      label:`Started at ${entry.stepName}`,
      pageFrameId:entry.stepId,
    };
  }
  const relationshipIds = entry.matchedPath.flatMap(({ relationshipId }) => (
    relationshipId ? [relationshipId] : []
  ));
  return {
    kind:"path",
    label:`path ${entry.matchedPath.map(({ stepName }) => stepName).join(" to ")}`,
    relationshipIds,
  };
}

export function createManualFlowDefectEvent(
  entry: LiveFlowHistoryEntry,
  event: LiveEvent,
): LiveEvent {
  const observedEvent = { ...event };
  delete observedEvent.manualFlowValidations;
  const context: LiveFlowDefectContext = {
    flowId:entry.flowId,
    flowName:entry.flowName,
    selectedStepId:entry.stepId,
    selectedStepName:entry.stepName,
    eventId:event.id,
    eventStepLink:{ eventId:event.id, stepId:entry.stepId },
    path:structuredClone(entry.matchedPath),
    linkEvidence:linkEvidence(entry),
    effectiveTarget:structuredClone(entry.target),
    effectiveSchemaRevision:entry.effectiveSchemaRevision,
    effectiveSchemaRevisionIdentity:entry.effectiveSchemaRevisionIdentity,
    provenance:structuredClone(entry.provenance),
  };
  const contributorPath = entry.provenance
    .map(({ scope, contributorName }) => `${scope} ${contributorName}`)
    .join(" → ");
  return {
    ...observedEvent,
    manualFlowContext:context,
    validation:entry.status === "Valid" ? "Valid" : `${entry.issues.length} issues`,
    validationDetails:{
      evaluations:[],
      schema:{
        id:entry.target.id,
        name:`${entry.target.name} Flow-step expectation`,
        version:entry.effectiveSchemaRevision,
      },
      issues:entry.issues.map((issue) => ({
        instancePath:issue.path,
        message:`Observed value does not satisfy the linked ${entry.stepName} Flow-step expectation`,
        expected:representedValue(issue.expected),
        actual:representedValue(issue.actual),
        schemaName:entry.target.name,
        schemaVersion:entry.effectiveSchemaRevision,
        schemaLocation:`Flow ${entry.relationshipId ?? "start"} → ${entry.stepId}`,
        rule:issue.code,
        severity:issue.severity,
        origin:`Manual Flow test · ${issue.provenance}${contributorPath ? ` · ${contributorPath}` : ""}`,
      })),
    },
  };
}
