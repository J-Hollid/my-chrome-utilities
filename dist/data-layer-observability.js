export * from "./data-layer-source.js";
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
    return {
        ...template,
        payload: structuredClone(payload),
        version: template.version + 1,
    };
}
export function duplicateTemplate(template, name) {
    return {
        ...template,
        id: `${template.id}:copy`,
        name,
        payload: structuredClone(template.payload),
    };
}
export function saveSession(id, name, events, createdAt) {
    return {
        id,
        name,
        events: events.map((event) => structuredClone(event)),
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
            return template
                ? [
                    {
                        id: `step:${index + 1}`,
                        templateId: template.id,
                        templateVersion: template.version,
                        enabled: true,
                        destination: template.destination,
                    },
                ]
                : [];
        }),
    };
}
export function runnableSteps(sequence, templates, adapters) {
    const adapterById = new Map(adapters.map((adapter) => [adapter.id, adapter]));
    const templateById = new Map(templates.map((template) => [template.id, template]));
    return sequence.steps.filter((step) => {
        const template = templateById.get(step.templateId);
        return (step.enabled &&
            !!template &&
            adapterById.get(template.sourceId)?.capabilities.includes("push"));
    });
}
//# sourceMappingURL=data-layer-observability.js.map