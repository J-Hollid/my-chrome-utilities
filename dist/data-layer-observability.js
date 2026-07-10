const artifactLifecycles = {
    "captured event": {
        contentLifecycle: "immutable",
        executionBehavior: "not directly executable",
    },
    "saved session": {
        contentLifecycle: "captured content immutable",
        executionBehavior: "not directly executable",
    },
    "event template": {
        contentLifecycle: "versioned edits",
        executionBehavior: "pushable when supported",
    },
    "test sequence": {
        contentLifecycle: "editable steps",
        executionBehavior: "runnable when ready",
    },
    "execution record": {
        contentLifecycle: "immutable",
        executionBehavior: "not executable",
    },
};
function clone(value) {
    return structuredClone(value);
}
export function normalizeAdapterInput(_adapter, input) {
    if (Array.isArray(input) && typeof input[0] === "string") {
        return {
            name: input[0],
            payload: clone(input[1]),
            rawInput: clone(input),
        };
    }
    if (typeof input === "object" && input !== null && !Array.isArray(input)) {
        const record = input;
        const { event, ...payload } = record;
        return {
            name: typeof event === "string" ? event : "unknown",
            payload: clone(payload),
            rawInput: clone(input),
        };
    }
    return { name: "unknown", payload: clone(input), rawInput: clone(input) };
}
export function adapterActions(adapter) {
    return [...adapter.capabilities];
}
export function artifactLifecycle(type) {
    return { ...artifactLifecycles[type] };
}
export function createSourceManager(sources = []) {
    return { sources: clone(sources), events: [] };
}
export function addObservationSource(manager, source) {
    const sources = manager.sources.filter(({ id }) => id !== source.id);
    return { ...manager, sources: [...sources, clone(source)] };
}
export function setObservationSourceEnabled(manager, sourceId, enabled) {
    return {
        ...manager,
        sources: manager.sources.map((source) => source.id === sourceId ? { ...source, enabled } : source),
    };
}
export function removeObservationSource(manager, sourceId) {
    return {
        sources: manager.sources.filter(({ id }) => id !== sourceId),
        events: manager.events,
    };
}
export function captureSourceInput(manager, sourceId, input, metadata) {
    const source = manager.sources.find(({ id }) => id === sourceId);
    if (!source?.enabled || source.status !== "Connected") {
        return manager;
    }
    const normalized = normalizeAdapterInput(source, input);
    const event = {
        id: metadata.eventId,
        sessionId: metadata.sessionId,
        sourceId: source.id,
        sourceKind: source.kind,
        name: normalized.name,
        captureTime: metadata.captureTime,
        ...(metadata.sourceTime ? { sourceTime: metadata.sourceTime } : {}),
        pageUrl: metadata.pageUrl,
        payload: normalized.payload,
        rawInput: normalized.rawInput,
        validation: "Not checked",
        provenance: `captured:${source.id}`,
    };
    return { ...manager, events: [...manager.events, event] };
}
export function sourceFeed(manager, sourceId) {
    return eventFeed(manager.events, sourceId);
}
export function sourceSummaries(manager) {
    return manager.sources.map((source) => clone(source));
}
export function normalizeSourceEvent(input) {
    return { ...input, validation: input.validation ?? "Not checked" };
}
export function saveEventTemplate(event, name, destination) {
    return {
        id: `template:${event.id}`,
        name,
        eventName: event.name,
        sourceId: event.sourceId,
        destination,
        payload: structuredClone(event.payload),
        version: 1,
        originatingSessionId: event.sessionId,
        originatingEventId: event.id,
    };
}
export function reviseTemplate(template, payload) {
    return { ...template, payload: structuredClone(payload), version: template.version + 1 };
}
export function duplicateTemplate(template, name) {
    return { ...template, id: `${template.id}:copy`, name, payload: structuredClone(template.payload) };
}
export function saveSession(id, name, events, createdAt) {
    return {
        id, name, events: events.map((event) => structuredClone(event)),
        sourceIds: [...new Set(events.map((event) => event.sourceId))],
        pageScope: events[0]?.pageUrl ?? "",
        createdAt,
    };
}
export function sequenceFromSession(session, name, templates) {
    const templateForEvent = new Map(templates.map((template) => [template.originatingEventId, template]));
    return {
        id: `sequence:${session.id}`,
        name,
        steps: session.events.flatMap((event, index) => {
            const template = templateForEvent.get(event.id);
            return template ? [{ id: `step:${index + 1}`, templateId: template.id, templateVersion: template.version, enabled: true, destination: template.destination }] : [];
        }),
    };
}
export function eventFeed(events, sourceId) {
    return [...events]
        .filter((event) => !sourceId || event.sourceId === sourceId)
        .sort((left, right) => left.captureTime.localeCompare(right.captureTime));
}
export function runnableSteps(sequence, templates, adapters) {
    const adapterById = new Map(adapters.map((adapter) => [adapter.id, adapter]));
    const templateById = new Map(templates.map((template) => [template.id, template]));
    return sequence.steps.filter((step) => {
        const template = templateById.get(step.templateId);
        return step.enabled && !!template && adapterById.get(template.sourceId)?.capabilities.includes("push");
    });
}
//# sourceMappingURL=data-layer-observability.js.map