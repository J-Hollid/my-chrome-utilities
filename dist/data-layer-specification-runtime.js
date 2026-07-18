import { advanceFlowInstance, resolveApplicability, startFlowInstance, } from "./data-layer-specification-project.js";
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
function firstStepMatches(flow, input) { const step = (flow.steps ?? [])[0]; return Boolean(step && (!step.eventId || step.eventId === input.eventId) && (!step.pageId || step.pageId === input.pageId)); }
export function recordSpecificationRuntimeObservation(storage, observation) {
    const project = restoreProject(storage);
    if (!project)
        return { instances: restoreInstances(storage) };
    const observedEventId = eventId(project, observation), observedPageId = pageId(project, observation.pageUrl);
    const input = { ...(observedEventId ? { eventId: observedEventId } : {}), ...(observedPageId ? { pageId: observedPageId } : {}) };
    const prior = restoreInstances(storage), others = prior.filter((instance) => instance.sessionId !== observation.sessionId), session = prior.filter((instance) => instance.sessionId === observation.sessionId && instance.status === "active"), existingFlowIds = new Set(session.map(({ flowId }) => flowId));
    const started = project.collections.flows.filter((flow) => !existingFlowIds.has(flow.id) && firstStepMatches(flow, input)).map((flow) => startFlowInstance(project, flow.id, observation.sessionId));
    const advanced = [...session, ...started].map((instance) => advanceFlowInstance(project, instance, input));
    const changed = advanced.filter((instance, index) => instance.history.length > ([...session, ...started][index]?.history.length ?? 0));
    const instances = [...others, ...advanced.filter((instance) => instance.history.length > 0)];
    storage.setItem(FLOW_INSTANCES_STORAGE_KEY, JSON.stringify(instances));
    const active = changed.length === 1 ? changed[0] : undefined;
    if (!active)
        return { instances };
    const url = observation.pageUrl ? new URL(observation.pageUrl, globalThis.location?.href) : undefined;
    const applicability = resolveApplicability(project, { pathname: url?.pathname ?? "", eventName: observation.eventName ?? "", flowId: active.selector, payload: observation.payload ?? {} }), priorRouting = storage.getItem(FLOW_ROUTING_STORAGE_KEY);
    let routing = [];
    try {
        const parsed = JSON.parse(priorRouting ?? "[]");
        if (Array.isArray(parsed))
            routing = parsed;
    }
    catch { /* replace invalid evidence */ }
    routing.push({ sessionId: observation.sessionId, instanceId: active.id, flowId: active.selector, pageUrl: observation.pageUrl, eventName: observation.eventName, winner: applicability.winner, ties: applicability.ties });
    storage.setItem(FLOW_ROUTING_STORAGE_KEY, JSON.stringify(routing));
    return { instances, active, applicability };
}
export function recordSpecificationCapture(storage, input) { const raw = input.rawValue && typeof input.rawValue === "object" ? input.rawValue : {}; const eventName = typeof raw.event === "string" ? raw.event : typeof raw.eventName === "string" ? raw.eventName : undefined; return recordSpecificationRuntimeObservation(storage, { ...input, ...(eventName ? { eventName } : {}), payload: raw }); }
export function recordSpecificationNavigation(storage, input) { return recordSpecificationRuntimeObservation(storage, input); }
//# sourceMappingURL=data-layer-specification-runtime.js.map