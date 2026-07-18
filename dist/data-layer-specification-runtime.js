import { evaluateSpecificationObservation } from "./data-layer-specification-engine.js";
export const SPECIFICATION_PROJECT_STORAGE_KEY = "my-chrome-utilities.specification-project.v1";
export const FLOW_INSTANCES_STORAGE_KEY = "my-chrome-utilities.flow-instances.v1";
export const FLOW_ROUTING_STORAGE_KEY = "my-chrome-utilities.flow-routing.v1";
function restoreProject(storage) {
    const serialized = storage.getItem(SPECIFICATION_PROJECT_STORAGE_KEY);
    if (!serialized)
        return undefined;
    try {
        const parsed = JSON.parse(serialized);
        return parsed.project;
    }
    catch {
        return undefined;
    }
}
function publishedPlan(project) { if (!project.currentRelease)
    return undefined; const release = project.releases.find(({ id }) => id === project.currentRelease); return release?.executablePlan; }
function restoreInstances(storage) { const serialized = storage.getItem(FLOW_INSTANCES_STORAGE_KEY); if (!serialized)
    return []; try {
    const value = JSON.parse(serialized);
    return Array.isArray(value) ? value : [];
}
catch {
    return [];
} }
function eventId(project, observation) { const observed = observation.eventName?.trim(); if (!observed)
    return undefined; const normalized = observed.toLowerCase(); return project.collections.events.find((event) => event.id === observed || String(event.eventName ?? "").toLowerCase() === normalized || event.name.toLowerCase() === normalized)?.id; }
function pageId(project, pageUrl) { if (!pageUrl)
    return undefined; let url; try {
    url = new URL(pageUrl);
}
catch {
    return undefined;
} return project.collections.pages.find((page) => page.url === pageUrl || page.pathname === url.pathname || page.path === url.pathname)?.id; }
export function recordSpecificationRuntimeObservation(storage, observation) {
    const project = restoreProject(storage);
    if (!project)
        return { instances: restoreInstances(storage) };
    const observedEventId = eventId(project, observation), observedPageId = pageId(project, observation.pageUrl);
    const prior = restoreInstances(storage), payload = observation.payload && typeof observation.payload === "object" ? observation.payload : {}, url = observation.pageUrl ? new URL(observation.pageUrl, globalThis.location?.href) : undefined, plan = publishedPlan(project);
    if (!plan)
        return { instances: prior };
    const evaluation = evaluateSpecificationObservation(plan, { ...observation, ...payload, payload: observation.payload ?? {}, pathname: url?.pathname ?? "", ...(observedEventId ? { eventId: observedEventId } : {}), ...(observedPageId ? { pageId: observedPageId } : {}) }, prior), transition = evaluation.stateTransition, instances = transition.instances;
    storage.setItem(FLOW_INSTANCES_STORAGE_KEY, JSON.stringify(instances));
    const active = transition.active, ambiguity = transition.ambiguity, applicability = { candidates: evaluation.candidates.map((candidate) => ({ id: candidate.assignmentId, name: candidate.assignmentId, matched: candidate.rejectionReasons.length === 0, priority: candidate.priority, evidence: candidate.rejectionReasons.join("; ") || "All configured predicates matched" })), ...(evaluation.winner ? { winner: { id: evaluation.winner.assignmentId, name: evaluation.winner.assignmentId } } : {}), ties: evaluation.ties.map((id) => ({ id, name: id })) }, priorRouting = storage.getItem(FLOW_ROUTING_STORAGE_KEY);
    let routing = [];
    try {
        const parsed = JSON.parse(priorRouting ?? "[]");
        if (Array.isArray(parsed))
            routing = parsed;
    }
    catch { /* replace invalid evidence */ }
    routing.push({ sessionId: observation.sessionId, sourceId: observation.sourceId, eventId: observedEventId, ...(active ? { instanceId: active.id, flowId: active.flowId, stepId: active.currentStepId } : {}), pageUrl: observation.pageUrl, eventName: observation.eventName, winner: evaluation.winner, ties: evaluation.ties, candidates: evaluation.candidates, ...(ambiguity ? { ambiguity } : {}) });
    storage.setItem(FLOW_ROUTING_STORAGE_KEY, JSON.stringify(routing));
    return { instances, ...(active ? { active } : {}), applicability, evaluation, ...(ambiguity ? { ambiguity } : {}) };
}
export function recordSpecificationCapture(storage, input) { const raw = input.rawValue && typeof input.rawValue === "object" ? input.rawValue : {}; const eventName = typeof raw.event === "string" ? raw.event : typeof raw.eventName === "string" ? raw.eventName : undefined; return recordSpecificationRuntimeObservation(storage, { ...input, ...(eventName ? { eventName } : {}), payload: raw }); }
export function recordSpecificationNavigation(storage, input) { return recordSpecificationRuntimeObservation(storage, input); }
//# sourceMappingURL=data-layer-specification-runtime.js.map