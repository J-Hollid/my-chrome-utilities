import { documentaryFlowGraph } from "./utilities/data-layer/flow-graph.js";
import { compileLayeredSchema, layeredContributorPath, layeredContributorsForPath, validateLayeredObservation } from "./utilities/data-layer/schemas.js";
const clone = (value) => structuredClone(value);
const graphs = (state) => state.project.documentationFlowGraphs;
const graph = (state, flowId) => documentaryFlowGraph(state.project, flowId);
const payload = (event) => { const value = event.payload ?? event.rawInput; return value && typeof value === "object" && !Array.isArray(value) ? value : {}; };
function assertRunProject(run, state) { if (state.project.id !== run.projectId)
    throw new Error("Flow test project context changed."); }
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
function stableJson(value) {
    if (Array.isArray(value))
        return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object")
        return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
    return JSON.stringify(value) ?? "undefined";
}
function facetRevision(compiled) { let hash = 2166136261; for (const character of stableJson(compiled)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
} return (hash >>> 0) || 1; }
function revisionIdentity(revision) { return `flow-schema:${revision.toString(16).padStart(8, "0")}`; }
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
    const frameEntities = new Map((graphs(state)[flowId]?.pageFrames ?? []).map((frame) => [frame.id, frame]));
    const startChoices = current.pageFrames.map((frame) => { const page = state.project.collections.pages.find(({ id }) => id === frame.pageId), lane = state.project.collections.pageGroups.find(({ id }) => id === frame.pageGroupId)?.name ?? (frame.freePageRegion === "before-lanes" ? "Before lanes" : frame.freePageRegion === "after-lanes" ? "After lanes" : "Free"), storedName = frameEntities.get(frame.id)?.name, instanceName = storedName === `${page?.name} frame` ? page?.name : storedName; return { id: frame.id, name: instanceName || page?.name || frame.id, kind: "Page", pageId: frame.pageId, lane, stableFrameId: frame.id, recommended: !incoming.has(frame.id) }; }).sort((left, right) => Number(right.recommended) - Number(left.recommended));
    return { ...run, flowId, flowName: flow.name, startChoices, currentStepId: undefined, incomingRelationshipId: undefined, history: [], matchedEventIds: [], startedAt: undefined };
}
export function liveFlowEventLink(run, eventId) {
    return run.history.find((entry) => entry.eventId === eventId);
}
export function liveFlowEventStepChoices(run, state, eventId) {
    assertRunProject(run, state);
    if (!run.flowId)
        return { mode: "initial", choices: [], noRootPage: false };
    const recorded = liveFlowEventLink(run, eventId);
    if (recorded) {
        return { mode: "recorded", noRootPage: false, choices: [{
                    id: recorded.stepId, name: recorded.stepName, stepKind: recorded.stepKind, root: run.startChoices.some(({ id, recommended }) => id === recorded.stepId && recommended),
                    recorded: true, displayName: recorded.stepName, ...(recorded.relationshipId ? { relationshipId: recorded.relationshipId } : {}),
                }] };
    }
    if (!run.history.length) {
        const noRootPage = !run.startChoices.some(({ recommended }) => recommended);
        return { mode: "initial", noRootPage, choices: run.startChoices.map((choice) => ({
                id: choice.id, name: choice.name, stepKind: "Page", root: choice.recommended, recorded: false, displayName: choice.name,
            })) };
    }
    const source = step(state, run.flowId, run.currentStepId);
    const choices = graph(state, run.flowId).relationships
        .filter((relationship) => relationship.sourceEndpoint?.id === run.currentStepId && Boolean(relationship.targetEndpoint?.id))
        .map((relationship) => {
        const target = step(state, run.flowId, relationship.targetEndpoint.id);
        const label = typeof relationship.label === "string" ? relationship.label.trim() : "";
        return { id: target.id, name: target.name, stepKind: target.kind, root: false, recorded: false, kind: relationshipKind(relationship), relationshipId: relationship.id, displayName: label || `${source.name} to ${target.name}` };
    });
    return { mode: "next", choices, noRootPage: false };
}
export function linkLiveFlowEvent(run, state, event, stepId) {
    assertRunProject(run, state);
    if (!run.flowId || !run.flowName)
        throw new Error("Select a Flow test context before linking an event.");
    if (liveFlowEventLink(run, event.id))
        throw new Error("This observed event already has a recorded Flow step.");
    const offered = liveFlowEventStepChoices(run, state, event.id).choices.find(({ id }) => id === stepId);
    if (!offered)
        throw new Error(run.history.length ? "No relationship from current step." : "A Flow test must start with a listed Page frame.");
    const selected = step(state, run.flowId, stepId);
    const path = layeredContributorPath(state, selected.entity, selected.scope, run.flowId);
    const contributors = layeredContributorsForPath(state, path, payload(event));
    const compiled = compileLayeredSchema(contributors, { eventId: String(selected.entity.eventId ?? event.name), eventRole: selected.kind === "Event" ? "interaction" : "context", ...(selected.kind === "Event" ? { occurrenceId: selected.id } : {}) });
    const effectiveRevision = facetRevision(compiled);
    const validation = validateLayeredObservation({ targetId: selected.id, targetName: selected.name, revision: effectiveRevision, compiled }, payload(event));
    const pathEntry = { stepId: selected.id, stepName: selected.name, ...(offered.relationshipId ? { relationshipId: offered.relationshipId } : {}), eventId: event.id, captureTime: event.captureTime };
    const matchedPath = [...run.history.map(({ stepId: historyStepId, stepName, relationshipId, eventId, captureTime }) => ({ stepId: historyStepId, stepName, ...(relationshipId ? { relationshipId } : {}), eventId, captureTime })), pathEntry];
    const entry = { projectId: run.projectId, flowId: run.flowId, flowName: run.flowName, stepId: selected.id, stepKind: selected.kind, stepName: selected.name, eventId: event.id, captureTime: event.captureTime, selectionMode: "Manual Flow test", ...(offered.relationshipId ? { relationshipId: offered.relationshipId } : {}), effectiveSchemaRevision: validation.effectiveSchemaRevision, effectiveSchemaRevisionIdentity: revisionIdentity(effectiveRevision), issues: validation.issues, provenance: clone(validation.provenance), target: { id: selected.id, name: selected.name }, status: validation.issues.length ? "Invalid" : "Valid", matchedPath };
    return { ...run, currentStepId: selected.id, incomingRelationshipId: undefined, history: [...run.history, entry], matchedEventIds: [...run.matchedEventIds, event.id], startedAt: run.startedAt ?? event.captureTime };
}
export function attachLiveFlowDefect(run, stepId, defectId, eventId) { return { ...run, history: run.history.map((entry) => entry.stepId === stepId && (!eventId || entry.eventId === eventId) ? { ...entry, defectId } : entry) }; }
export function liveFlowSessionEvidence(run, state, endedAt) {
    assertRunProject(run, state);
    if (!run.flowId || !run.flowName || !run.currentStepId || !run.history.length)
        throw new Error("Link an observed event before saving Flow-test evidence.");
    const traversed = new Set(run.history.map(({ relationshipId }) => relationshipId).filter(Boolean)), visited = new Set(run.history.map(({ stepId }) => stepId)), unchosenAlternatives = graph(state, run.flowId).relationships.filter(({ id, sourceEndpoint, targetEndpoint }) => Boolean(sourceEndpoint && targetEndpoint) && visited.has(sourceEndpoint.id) && !traversed.has(id)).map(({ id, targetEndpoint }) => ({ relationshipId: id, stepId: targetEndpoint.id, status: "Not tested" }));
    return { runId: run.id, projectId: run.projectId, flowId: run.flowId, flowName: run.flowName, label: "Manual Flow test evidence", endedAt, currentStepId: run.currentStepId, history: clone(run.history), unchosenAlternatives, resumeMatching: false };
}
export function serializeLiveFlowSummary(summary) { return JSON.stringify(summary); }
export function restoreLiveFlowSummary(serialized) { try {
    const value = JSON.parse(serialized);
    return value?.label === "Manual Flow test evidence" && typeof value.currentStepId === "string" && Array.isArray(value.history) ? clone(value) : undefined;
}
catch {
    return;
} }
//# sourceMappingURL=data-layer-live-flow-testing.js.map