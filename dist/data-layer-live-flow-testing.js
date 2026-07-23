import { documentaryFlowGraph } from "./utilities/data-layer/flow-graph.js";
import { compileLayeredSchema, layeredContributorPath, layeredContributorsForPath, validateLayeredObservation } from "./utilities/data-layer/schemas.js";
const clone = (value) => structuredClone(value);
const graphs = (state) => state.project.documentationFlowGraphs;
const graph = (state, flowId) => documentaryFlowGraph(state.project, flowId);
const capturedAfter = (candidate, prior) => Date.parse(candidate) > Date.parse(prior);
const payload = (event) => { const value = event.payload ?? event.rawInput; return value && typeof value === "object" && !Array.isArray(value) ? value : {}; };
function frameName(state, frame) { return state.project.collections.pages.find(({ id }) => id === frame.pageId)?.name ?? frame.name; }
function occurrenceName(state, flowId, occurrence) { void flowId; return occurrence.name || (state.project.collections.events.find(({ id }) => id === occurrence.eventId)?.name ?? occurrence.id); }
function step(state, flowId, id) {
    const current = graphs(state)[flowId];
    const frame = current?.pageFrames?.find((candidate) => candidate.id === id);
    if (frame)
        return { id, kind: "Page", name: frameName(state, frame), entity: frame, scope: "Flow Page-instance" };
    const occurrence = current?.occurrences?.find((candidate) => candidate.id === id);
    if (occurrence)
        return { id, kind: "Event", name: occurrenceName(state, flowId, occurrence), entity: occurrence, scope: "Event-occurrence" };
    throw new Error(`Flow graph step ${id} is unavailable.`);
}
function revision(contributors) { return Math.max(0, ...contributors.map((contributor) => Number(contributor.revision ?? 0))); }
function stableJson(value) {
    if (Array.isArray(value))
        return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object")
        return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
    return JSON.stringify(value) ?? "undefined";
}
function revisionIdentity(compiled) { let hash = 2166136261; for (const character of stableJson(compiled)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
} return `flow-schema:${(hash >>> 0).toString(16).padStart(8, "0")}`; }
function relationshipKind(relationship) { return relationship.kind; }
export function liveFlowChoices(activeProjectId, projects) {
    if (!activeProjectId)
        return { flows: [], recovery: ["Open project", "Create project"] };
    const active = projects.find(({ project }) => project.id === activeProjectId);
    return { flows: (active?.project.collections.flows ?? []).map(({ id, name }) => ({ id, name })), recovery: [] };
}
export function createLiveFlowTest(id, projectId) { return { id, projectId, startChoices: [], history: [], matchedEventIds: [] }; }
export function selectLiveFlow(run, state, flowId) {
    if (state.project.id !== run.projectId)
        throw new Error("Flow test project context changed.");
    const flow = state.project.collections.flows.find(({ id }) => id === flowId);
    if (!flow)
        throw new Error("The selected Flow is unavailable in the active project.");
    const current = graph(state, flowId), incoming = new Set(current.relationships.map((relationship) => relationship.targetEndpoint?.id).filter((id) => Boolean(id)));
    const startChoices = current.pageFrames.map((frame) => { const page = state.project.collections.pages.find(({ id }) => id === frame.pageId), lane = state.project.collections.pageGroups.find(({ id }) => id === frame.pageGroupId)?.name ?? (frame.freePageRegion === "before-lanes" ? "Before lanes" : frame.freePageRegion === "after-lanes" ? "After lanes" : "Free"); return { id: frame.id, name: page?.name ?? frame.id, kind: "Page", pageId: frame.pageId, lane, stableFrameId: frame.id, recommended: !incoming.has(frame.id) }; });
    return { ...run, flowId, flowName: flow.name, startChoices, currentStepId: undefined, incomingRelationshipId: undefined, history: [], matchedEventIds: [], startedAt: undefined };
}
export function startLiveFlowPath(run, pageFrameId) { if (!run.startChoices.some(({ id }) => id === pageFrameId))
    throw new Error("A Flow test must start with a listed Page frame."); return { ...run, currentStepId: pageFrameId, startedAt: undefined }; }
export function liveFlowNextSteps(run, state) {
    if (!run.flowId || !run.currentStepId || !run.history.some(({ stepId }) => stepId === run.currentStepId))
        return [];
    const source = step(state, run.flowId, run.currentStepId);
    return graph(state, run.flowId).relationships.filter((relationship) => relationship.sourceEndpoint?.id === run.currentStepId && Boolean(relationship.targetEndpoint?.id)).map((relationship) => { const target = step(state, run.flowId, relationship.targetEndpoint.id), label = typeof relationship.label === "string" ? relationship.label.trim() : "", displayName = label || `${source.name} to ${target.name}`; return { id: target.id, name: target.name, stepKind: target.kind, kind: relationshipKind(relationship), relationshipId: relationship.id, displayName }; });
}
export function liveFlowGraphNodes(run, state) {
    if (!run.flowId || !run.currentStepId)
        return [];
    const current = graphs(state)[run.flowId], nextById = new Map(liveFlowNextSteps(run, state).map((next) => [next.id, next])), nodes = [...(current?.pageFrames ?? []).map((entity) => step(state, run.flowId, entity.id)), ...(current?.occurrences ?? []).map((entity) => step(state, run.flowId, entity.id))];
    return nodes.map(({ id, name, kind: stepKind }) => { const next = nextById.get(id); if (next)
        return { id, name, stepKind, enabled: true, reason: `Connected by ${next.kind}`, next }; return { id, name, stepKind, enabled: false, reason: id === run.currentStepId ? "Current graph step" : "No relationship from current step" }; });
}
export function selectLiveFlowStep(run, state, stepId) { const offered = liveFlowNextSteps(run, state).find(({ id }) => id === stepId); if (!offered)
    throw new Error("No relationship from current step."); return { ...run, currentStepId: stepId, incomingRelationshipId: offered.relationshipId }; }
function compatibility(state, flowId, stepId, event) {
    const selected = step(state, flowId, stepId);
    if (selected.kind === "Event") {
        const eventEntity = state.project.collections.events.find(({ id }) => id === selected.entity.eventId), expected = String(eventEntity?.eventName ?? eventEntity?.name ?? selected.name);
        return event.name === expected ? { compatible: true, evidence: `Event identity ${expected} · observation source ${event.sourceName ?? event.sourceId}`, reason: "Eligible Event identity and observation source" } : { compatible: false, evidence: `Observed ${event.name} from ${event.sourceName ?? event.sourceId}`, reason: `Event identity does not match ${expected}` };
    }
    const page = state.project.collections.pages.find(({ id }) => id === selected.entity.pageId), pathname = String(page?.pathname ?? "");
    const observed = event.pageUrl ? new URL(event.pageUrl, "https://flow.invalid").pathname : "";
    return !pathname || pathname === observed ? { compatible: true, evidence: `Observed Page context ${observed || "available"}`, reason: "Eligible observed Page context" } : { compatible: false, evidence: `Observed Page context ${observed || "unavailable"}`, reason: `Page context does not match ${pathname}` };
}
export function liveFlowCandidateEvents(run, state, events) {
    if (!run.flowId || !run.currentStepId)
        return [];
    const prior = run.history.at(-1)?.captureTime, matched = new Set(run.matchedEventIds);
    return events.map((event) => { const match = compatibility(state, run.flowId, run.currentStepId, event); let eligible = true, reason = match.reason; if (matched.has(event.id)) {
        eligible = false;
        reason = "Already matched in this run";
    }
    else if (prior && !capturedAfter(event.captureTime, prior)) {
        eligible = false;
        reason = "Captured before the previous match";
    }
    else if (!match.compatible)
        eligible = false; return { eventId: event.id, name: event.name, captureTime: event.captureTime, eligible, selected: false, reason, evidence: match.evidence }; });
}
export function matchLiveFlowEvent(run, state, events, eventId) {
    if (!run.flowId || !run.currentStepId)
        throw new Error("Select a Flow graph step before matching an observed event.");
    const candidate = liveFlowCandidateEvents(run, state, events).find((item) => item.eventId === eventId), event = events.find(({ id }) => id === eventId);
    if (!candidate?.eligible || !event)
        throw new Error(candidate?.reason ?? "Observed event is unavailable.");
    const selected = step(state, run.flowId, run.currentStepId), path = layeredContributorPath(state, selected.entity, selected.scope, run.flowId), contributors = layeredContributorsForPath(state, path, payload(event)), compiled = compileLayeredSchema(contributors, { eventId: String(selected.entity.eventId ?? event.name), eventRole: selected.kind === "Event" ? "interaction" : "context", ...(selected.kind === "Event" ? { occurrenceId: selected.id } : {}) }), effectiveRevision = revision(contributors), validation = validateLayeredObservation({ targetId: selected.id, targetName: selected.name, revision: effectiveRevision, compiled }, payload(event)), entry = { stepId: selected.id, stepKind: selected.kind, stepName: selected.name, eventId: event.id, captureTime: event.captureTime, selectionMode: "Manual Flow test", ...(run.incomingRelationshipId ? { relationshipId: run.incomingRelationshipId } : {}), effectiveSchemaRevision: validation.effectiveSchemaRevision, effectiveSchemaRevisionIdentity: revisionIdentity(compiled), issues: validation.issues, provenance: clone(validation.provenance), target: { id: selected.id, name: selected.name }, status: validation.issues.length ? "Invalid" : "Valid" };
    return { ...run, history: [...run.history, entry], matchedEventIds: [...run.matchedEventIds, event.id], incomingRelationshipId: undefined, startedAt: run.startedAt ?? event.captureTime };
}
export function attachLiveFlowDefect(run, stepId, defectId, eventId) { return { ...run, history: run.history.map((entry) => entry.stepId === stepId && (!eventId || entry.eventId === eventId) ? { ...entry, defectId } : entry) }; }
export function completeLiveFlowTest(run, state, endedAt) { if (!run.flowId || !run.flowName)
    throw new Error("Select a Flow before completing its selected path."); const traversed = new Set(run.history.map(({ relationshipId }) => relationshipId).filter(Boolean)), visited = new Set(run.history.map(({ stepId }) => stepId)), unchosenAlternatives = graph(state, run.flowId).relationships.filter(({ id, sourceEndpoint, targetEndpoint }) => Boolean(sourceEndpoint && targetEndpoint) && visited.has(sourceEndpoint.id) && !traversed.has(id)).map(({ id, targetEndpoint }) => ({ relationshipId: id, stepId: targetEndpoint.id, status: "Not tested" })); return { runId: run.id, projectId: run.projectId, flowId: run.flowId, flowName: run.flowName, label: "Completed selected path", endedAt, history: clone(run.history), unchosenAlternatives, resumeMatching: false }; }
export function serializeLiveFlowSummary(summary) { return JSON.stringify(summary); }
export function restoreLiveFlowSummary(serialized) { try {
    const value = JSON.parse(serialized);
    return value?.label === "Completed selected path" && Array.isArray(value.history) ? clone(value) : undefined;
}
catch {
    return;
} }
//# sourceMappingURL=data-layer-live-flow-testing.js.map