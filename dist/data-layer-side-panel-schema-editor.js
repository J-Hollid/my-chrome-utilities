const canonicalRevision = (entity) => entity.canonicalSchema?.revision ?? Number(entity.sourceRevision ?? 0);
const projectEntry = (key, entity, role, scope, lineage) => ({ key, name: entity.name, role, scope, lineage: lineage || "Project root", revision: canonicalRevision(entity), state: entity.canonicalSchema ? "Draft" : "Migration required" });
export function sidePanelSchemaGroups(state, savedSchemas) {
    const saved = { name: "Saved schemas", entries: savedSchemas.map((schema) => ({ key: `saved:${schema.id}`, name: schema.name, role: "Saved schema", scope: "Library", lineage: schema.parentSchemaId ? `Parent ${schema.parentSchemaId}` : "Library root", revision: schema.version, state: schema.published === false || schema.workingDraft ? "Draft" : "saved" })) };
    if (!state)
        return saved.entries.length ? [saved] : [];
    const { collections } = state.project, profileName = (id) => collections.profiles.find((candidate) => candidate.id === id)?.name, groupName = (id) => collections.pageGroups.find((candidate) => candidate.id === id)?.name, pageName = (id) => collections.pages.find((candidate) => candidate.id === id)?.name, eventName = (id) => collections.events.find((candidate) => candidate.id === id)?.name, join = (values) => values.filter((value) => Boolean(value)).join(" → ");
    const groups = [saved,
        { name: "Shared", entries: collections.profiles.map((entity) => projectEntry(`profiles:${entity.id}`, entity, "Shared Profile", "Shared Profile", "Project root")) },
        { name: "Page Groups", entries: collections.pageGroups.map((entity) => projectEntry(`pageGroups:${entity.id}`, entity, "Page Group", "Page Group", profileName(entity.profileId) ?? "Project root")) },
        { name: "Pages", entries: collections.pages.map((entity) => projectEntry(`pages:${entity.id}`, entity, "Page", "Page", join([profileName(entity.profileId), ...(entity.pageGroupIds ?? []).map(groupName)]))) },
        { name: "Events", entries: collections.events.map((entity) => projectEntry(`events:${entity.id}`, entity, "Event", "Event", profileName(entity.profileId) ?? "Project root")) },
        { name: "Flow instances", entries: Object.entries(state.project.documentationFlowGraphs ?? {}).flatMap(([flowId, graph]) => (graph.pageFrames ?? []).map((entity) => projectEntry(`flowInstances:${flowId}:${entity.id}`, entity, "Flow Page instance", "Flow Page-instance", join([collections.flows.find(({ id }) => id === flowId)?.name, groupName(entity.pageGroupId), pageName(entity.pageId)])))) },
        { name: "Occurrences", entries: Object.entries(state.project.documentationFlowGraphs ?? {}).flatMap(([flowId, graph]) => { const typed = graph; return (typed.occurrences ?? []).map((entity) => projectEntry(`occurrences:${flowId}:${entity.id}`, entity, "Event occurrence", "Event-occurrence", join([collections.flows.find(({ id }) => id === flowId)?.name, typed.pageFrames?.find(({ id }) => id === entity.pageFrameId)?.name, eventName(entity.eventId)]))); }) },
    ];
    return groups.filter(({ entries }) => entries.length);
}
export function resolveSidePanelSchemaContributor(state, key) {
    const collections = [["profiles", "Shared Profile"], ["pageGroups", "Page Group"], ["pages", "Page"], ["events", "Event"]];
    for (const [collectionKind, scope] of collections) {
        const entity = state.project.collections[collectionKind].find((candidate) => key === `${collectionKind}:${candidate.id}`);
        if (entity)
            return { entity, scope, collectionKind };
    }
    for (const [flowId, graph] of Object.entries(state.project.documentationFlowGraphs ?? {})) {
        const typed = graph, frame = typed.pageFrames?.find((candidate) => key === `flowInstances:${flowId}:${candidate.id}`);
        if (frame)
            return { entity: frame, scope: "Flow Page-instance", flowId };
        const occurrence = typed.occurrences?.find((candidate) => key === `occurrences:${flowId}:${candidate.id}`);
        if (occurrence)
            return { entity: occurrence, scope: "Event-occurrence", flowId };
    }
    return undefined;
}
export function canonicalMigrationDurablyAcknowledged(state, key, expected) {
    const selection = resolveSidePanelSchemaContributor(state, key), entity = selection?.entity;
    const canonicalKeys = (value) => value && typeof value === "object" ? [...new Set(Object.values(value).flatMap(canonicalKeys).concat(Object.keys(value)))].sort() : [];
    const canonicalBytes = (value) => JSON.stringify(value, canonicalKeys(value));
    if (!entity || canonicalBytes(entity.canonicalSchema) !== canonicalBytes(expected))
        return false;
    const requirements = entity.requirements, schemaConstraints = entity.schemaConstraints, structuredDraft = entity.structuredDraft;
    return !requirements?.length && !schemaConstraints?.length && !entity.structuredSchema && !structuredDraft?.document;
}
//# sourceMappingURL=data-layer-side-panel-schema-editor.js.map