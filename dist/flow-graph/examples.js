import { clone, graphIndex, inferFlowRelationshipKind, legacyBindingOccurrence, relationshipEndpoint, relationshipPorts, saveStoredGraph, storedGraph } from "../data-layer-flow-graph.js";
import { canonicalSchemaWithConstraint, compileLayeredSchema, createCanonicalSchema, layeredContributorPath, layeredContributorsForPath, migrateLegacyProfile, transactProject, validateLayeredObservation } from "../utilities/data-layer/schemas.js";
const pointerParts = (path) => path.split("/").filter(Boolean).map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
const setAtPath = (payload, path, value) => { const parts = pointerParts(path); if (!parts.length)
    return; let parent = payload; for (const part of parts.slice(0, -1)) {
    const next = parent[part];
    if (!next || typeof next !== "object" || Array.isArray(next))
        parent[part] = {};
    parent = parent[part];
} parent[parts.at(-1)] = clone(value); };
const valueAtPath = (payload, path) => pointerParts(path).reduce((value, part) => value && typeof value === "object" && !Array.isArray(value) ? value[part] : undefined, payload);
const applicableExample = (constraint, occurrence, eventId, role) => !constraint.target || constraint.target === "all" || constraint.target === occurrence.id || constraint.target === eventId || constraint.target === (role === "context-setting" ? "context" : "interaction");
const exampleEditHref = (flowId, occurrenceId, path) => `?kind=flow-page-instances&flow=${encodeURIComponent(flowId)}&entity=${encodeURIComponent(occurrenceId)}&field=${encodeURIComponent(`canonicalSchema.properties${path}.example`)}`;
export function setFlowOccurrenceExample(state, flowId, occurrenceId, path, value, id) {
    const occurrence = storedGraph(state.project, flowId).occurrences.find(({ id: candidateId }) => candidateId === occurrenceId);
    if (!occurrence || !path.startsWith("/"))
        return state;
    const contributorPath = layeredContributorPath(state, occurrence, "Event-occurrence", flowId), contributors = layeredContributorsForPath(state, contributorPath), effective = compileLayeredSchema(contributors, { eventId: String(occurrence.eventId ?? ""), eventRole: "interaction", occurrenceId }).properties[path], legacy = Boolean(occurrence.schemaConstraints || occurrence.localSchemaContributions), canonical = occurrence.canonicalSchema ?? (legacy ? migrateLegacyProfile(occurrence, { id }).document : createCanonicalSchema({ id: id("canonical-schema"), contributorId: occurrence.id, contributorName: occurrence.name })), next = canonicalSchemaWithConstraint(canonical, { path, ...(effective?.type ? { type: effective.type } : {}), examples: [clone(value)] }, id);
    return transactProject(state, `Save Flow occurrence example ${path}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, occurrences: graph.occurrences.map((candidate) => { if (candidate.id !== occurrenceId)
            return candidate; const updated = { ...candidate, canonicalSchema: next, schemaInstanceExamplePaths: [...new Set([...(candidate.schemaInstanceExamplePaths ?? []), path])] }; delete updated.schemaConstraints; delete updated.localSchemaContributions; return updated; }) }); });
}
export function deriveFlowOccurrenceExample(project, flowId, occurrenceId) {
    const occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId);
    if (!occurrence)
        return { status: "Blocked", payload: {}, formattedJson: "{}", provenance: {}, issues: [{ path: "/", code: "CONFLICT", message: "The Event occurrence is unavailable.", editHref: exampleEditHref(flowId, occurrenceId, "/") }] };
    const state = { project }, path = layeredContributorPath(state, occurrence, "Event-occurrence", flowId), contributors = layeredContributorsForPath(state, path), compiled = compileLayeredSchema(contributors, { eventId: String(occurrence.eventId ?? ""), eventRole: "interaction", occurrenceId }), payload = {}, provenance = {};
    for (const [propertyPath, property] of Object.entries(compiled.properties)) {
        if (property.presence === "forbidden")
            continue;
        let configured;
        if (property.expectedValue !== undefined)
            configured = { value: property.expectedValue, source: property.expectedContributor ?? property.origins.at(-1)?.contributorName ?? occurrence.name };
        else
            for (const contributor of [...contributors].reverse()) {
                const constraint = [...contributor.constraints].reverse().find((candidate) => candidate.path === propertyPath && applicableExample(candidate, occurrence, String(occurrence.eventId ?? ""), "interaction") && (candidate.examples?.length ?? 0) > 0);
                if (constraint) {
                    configured = { value: constraint.examples[0], source: contributor.scope === "Event-occurrence" && !/occurrence$/i.test(contributor.name) ? `${contributor.name} occurrence` : contributor.name };
                    break;
                }
            }
        if (configured !== undefined) {
            setAtPath(payload, propertyPath, configured.value);
            provenance[propertyPath] = configured.source;
        }
    }
    const edit = (propertyPath) => exampleEditHref(flowId, occurrenceId, propertyPath);
    if (compiled.status === "blocked") {
        const issues = compiled.conflicts.map(({ path: propertyPath, message }) => ({ path: propertyPath, code: "CONFLICT", message, editHref: edit(propertyPath) }));
        return { status: "Blocked", payload, formattedJson: JSON.stringify(payload, null, 2), provenance, issues };
    }
    const validation = validateLayeredObservation({ targetId: occurrenceId, targetName: occurrence.name, revision: Number(occurrence.canonicalSchema?.revision ?? 0), compiled }, payload), issues = validation.issues.map((issue) => ({ path: issue.path, code: issue.code === "REQUIRED" ? "REQUIRED_EXAMPLE" : issue.code, message: issue.code === "REQUIRED" ? "Required property has no configured example." : `${issue.code} example does not satisfy ${JSON.stringify(issue.expected)}.`, editHref: edit(issue.path) })), invalid = issues.some(({ code }) => code !== "REQUIRED_EXAMPLE"), incomplete = issues.some(({ code }) => code === "REQUIRED_EXAMPLE"), status = invalid ? "Invalid" : incomplete ? "Incomplete" : "Complete";
    return { status, payload, formattedJson: JSON.stringify(payload, null, 2), provenance, issues };
}
export function deriveFlowPageFrameExample(project, flowId, pageFrameId) {
    const frame = storedGraph(project, flowId).pageFrames.find(({ id }) => id === pageFrameId), page = project.collections.pages.find(({ id }) => id === frame?.pageId);
    if (!frame || !page)
        return { status: "Blocked", payload: {}, formattedJson: "{}", provenance: {}, issues: [{ path: "/", code: "CONFLICT", message: "The Page frame is unavailable.", editHref: exampleEditHref(flowId, pageFrameId, "/") }] };
    const frameEntity = { ...frame, name: `${page.name} Page frame` }, state = { project }, path = layeredContributorPath(state, frameEntity, "Flow Page-instance", flowId), contributors = layeredContributorsForPath(state, path), eventName = String(page.eventName ?? "pageview"), compiled = compileLayeredSchema(contributors, { eventId: eventName, eventRole: "context" }), payload = {}, provenance = {};
    for (const [propertyPath, property] of Object.entries(compiled.properties)) {
        if (property.presence === "forbidden")
            continue;
        let configured;
        if (property.expectedValue !== undefined)
            configured = { value: property.expectedValue, source: property.expectedContributor ?? property.origins.at(-1)?.contributorName ?? page.name };
        else
            for (const contributor of [...contributors].reverse()) {
                const constraint = [...contributor.constraints].reverse().find((candidate) => candidate.path === propertyPath && applicableExample(candidate, frameEntity, eventName, "context-setting") && (candidate.examples?.length ?? 0) > 0);
                if (constraint) {
                    configured = { value: constraint.examples[0], source: contributor.name };
                    break;
                }
            }
        if (configured !== undefined) {
            setAtPath(payload, propertyPath, configured.value);
            provenance[propertyPath] = configured.source;
        }
    }
    const edit = (propertyPath) => exampleEditHref(flowId, pageFrameId, propertyPath);
    if (compiled.status === "blocked") {
        const issues = compiled.conflicts.map(({ path: propertyPath, message }) => ({ path: propertyPath, code: "CONFLICT", message, editHref: edit(propertyPath) }));
        return { status: "Blocked", payload, formattedJson: JSON.stringify(payload, null, 2), provenance, issues };
    }
    const validation = validateLayeredObservation({ targetId: pageFrameId, targetName: page.name, revision: Number(frameEntity.revision ?? 0), compiled }, payload), issues = validation.issues.map((issue) => ({ path: issue.path, code: issue.code === "REQUIRED" ? "REQUIRED_EXAMPLE" : issue.code, message: issue.code === "REQUIRED" ? "Required property has no configured example." : `${issue.code} example does not satisfy ${JSON.stringify(issue.expected)}.`, editHref: edit(issue.path) })), invalid = issues.some(({ code }) => code !== "REQUIRED_EXAMPLE"), incomplete = issues.some(({ code }) => code === "REQUIRED_EXAMPLE"), status = invalid ? "Invalid" : incomplete ? "Incomplete" : "Complete";
    return { status, payload, formattedJson: JSON.stringify(payload, null, 2), provenance, issues };
}
export function flowOccurrenceExampleEditorRows(project, flowId, occurrenceId) {
    const occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId);
    if (!occurrence)
        return [];
    const state = { project }, path = layeredContributorPath(state, occurrence, "Event-occurrence", flowId), contributors = layeredContributorsForPath(state, path), compiled = compileLayeredSchema(contributors, { eventId: String(occurrence.eventId ?? ""), eventRole: "interaction", occurrenceId }), example = deriveFlowOccurrenceExample(project, flowId, occurrenceId);
    return Object.entries(compiled.properties).map(([propertyPath, property]) => ({ path: propertyPath, ...(property.type ? { type: property.type } : {}), value: valueAtPath(example.payload, propertyPath) }));
}
export function reviewLegacyFlowContextMigration(project, flowId) {
    void flowId;
    const items = [], blockers = [];
    for (const [candidateFlowId, graph] of Object.entries(graphIndex(project))) {
        const flow = project.collections.flows.find(({ id }) => id === candidateFlowId), flowName = flow?.name ?? "Unknown Flow";
        for (const occurrence of graph.occurrences) {
            if (!legacyBindingOccurrence(occurrence))
                continue;
            const occurrenceName = typeof occurrence.name === "string" && occurrence.name.trim() ? occurrence.name.trim() : "Unnamed occurrence", base = { flowId: candidateFlowId, occurrenceId: occurrence.id, flowName, occurrenceName }, page = project.collections.pages.find(({ id }) => id === occurrence.pageId);
            if (!page) {
                blockers.push({ ...base, message: `${occurrenceName} in ${flowName} has a missing Page.` });
                continue;
            }
            const binding = (page.contextEventBindings ?? []).find(({ id }) => id === occurrence.contextBindingId);
            if (!binding) {
                blockers.push({ ...base, message: `${occurrenceName} in ${flowName} has a missing Page binding on ${page.name}.` });
                continue;
            }
            const event = project.collections.events.find(({ id }) => id === binding.eventId);
            if (!event) {
                blockers.push({ ...base, message: `${occurrenceName} in ${flowName} has a missing Event on ${page.name}.` });
                continue;
            }
            items.push({ ...base, pageName: page.name, eventName: event.name, trigger: String(binding.trigger ?? binding.name ?? "") });
        }
    }
    return { items, blockers };
}
export function migrateLegacyFlowContextBindings(state, flowId) {
    const review = reviewLegacyFlowContextMigration(state.project, flowId);
    if (review.blockers.length || !review.items.length)
        return state;
    return transactProject(state, "Migrate legacy Flow Page context bindings", (project) => { const eventsById = new Map(project.collections.events.map((event) => [event.id, event])), primaryBindingByPage = new Map(), pages = project.collections.pages.map((page) => { const bindings = page.contextEventBindings ?? [], primary = bindings[0], event = eventsById.get(String(primary?.eventId ?? "")); if (primary)
        primaryBindingByPage.set(page.id, primary.id); const { contextEventBindings, ...stored } = page; void contextEventBindings; return { ...stored, ...(event ? { eventName: String(event.eventName ?? event.name) } : {}) }; }), pagesById = new Map(project.collections.pages.map((page) => [page.id, page])), documentationFlowGraphs = Object.fromEntries(Object.entries(graphIndex(project)).map(([candidateFlowId, graph]) => { const occurrenceFrameIds = new Map(graph.occurrences.flatMap((occurrence) => typeof occurrence.pageFrameId === "string" ? [[occurrence.id, occurrence.pageFrameId]] : [])), removed = new Set(graph.occurrences.filter((occurrence) => legacyBindingOccurrence(occurrence) && primaryBindingByPage.get(String(occurrence.pageId)) === occurrence.contextBindingId).map(({ id }) => id)), occurrences = graph.occurrences.flatMap((occurrence) => { const { role: discardedRole, ...roleFree } = occurrence; void discardedRole; if (removed.has(occurrence.id))
        return []; if (!legacyBindingOccurrence(occurrence))
        return [roleFree]; const page = pagesById.get(String(occurrence.pageId)), binding = (page?.contextEventBindings ?? []).find(({ id }) => id === occurrence.contextBindingId), event = eventsById.get(String(binding?.eventId ?? "")); if (!binding || !event)
        return [roleFree]; const { contextBindingId, eventId: discardedEventId, trigger: discardedTrigger, ...stored } = roleFree; void contextBindingId; void discardedEventId; void discardedTrigger; return [{ ...stored, eventId: event.id, trigger: String(binding.trigger ?? binding.name ?? "") }]; }), migrateEndpoint = (endpoint) => endpoint?.kind === "event-occurrence" && occurrenceFrameIds.has(endpoint.id) ? { kind: "page-frame", id: occurrenceFrameIds.get(endpoint.id) } : endpoint, relationships = graph.relationships.map((relationship) => { const sourceEndpoint = migrateEndpoint(relationshipEndpoint(relationship, "source")), targetEndpoint = migrateEndpoint(relationshipEndpoint(relationship, "target")); if (!sourceEndpoint || !targetEndpoint)
        return relationship; const { sourceNodeId: discardedSource, targetNodeId: discardedTarget, ...stored } = relationship; void discardedSource; void discardedTarget; return { ...stored, sourceEndpoint, targetEndpoint }; }); return [candidateFlowId, { ...graph, occurrences, relationships }]; })), events = project.collections.events.map((event) => { const { role, ...stored } = event; void role; return stored; }); return { ...project, collections: { ...project.collections, pages, events }, documentationFlowGraphs }; });
}
export function migrateLegacyFlowRelationshipKinds(state, flowId) {
    const graph = storedGraph(state.project, flowId), requiresMigration = graph.relationships.some((relationship) => relationship.kind === "parallel");
    if (!requiresMigration)
        return state;
    return transactProject(state, "Migrate legacy Flow relationship kinds", (project) => { const current = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...current, relationships: current.relationships.map((relationship) => relationship.kind === "parallel" ? { ...relationship, ...relationshipPorts(relationship), kind: "alternative" } : relationship) }); });
}
export function saveGraphRelationship(state, flowId, fromOccurrenceId, input, id) {
    const graph = storedGraph(state.project, flowId), frameIds = new Set(graph.pageFrames.map(({ id }) => id)), endpoint = (endpointId) => frameIds.has(endpointId) ? { kind: "page-frame", id: endpointId } : undefined, sourceEndpoint = endpoint(fromOccurrenceId), targetEndpoint = endpoint(input.toStepId);
    if (fromOccurrenceId === input.toStepId)
        return state;
    if (!state.project.collections.flows.some(({ id }) => id === flowId) || !sourceEndpoint || !targetEndpoint)
        throw new Error("A Flow relationship requires existing source and target Page frames.");
    const kind = inferFlowRelationshipKind(input.sourcePort, input.targetPort);
    if (!kind)
        return state;
    return transactProject(state, `Save Flow relationship ${input.id ?? "new"}`, (project) => { const current = storedGraph(project, flowId), relationship = { id: input.id ?? id("flow-relationship"), sourceEndpoint, targetEndpoint, sourcePort: input.sourcePort, targetPort: input.targetPort, kind, ...(input.group ? { group: input.group } : {}), ...(input.label ? { label: input.label } : {}), ...(input.documentationCondition ? { documentationCondition: input.documentationCondition } : {}), ...(input.expectation ? { expectation: input.expectation } : {}) }; return saveStoredGraph(project, flowId, { ...current, relationships: current.relationships.some(({ id }) => id === relationship.id) ? current.relationships.map((candidate) => candidate.id === relationship.id ? relationship : candidate) : [...current.relationships, relationship] }); });
}
export function removeFlowRelationship(state, flowId, relationshipId) {
    if (!storedGraph(state.project, flowId).relationships.some(({ id }) => id === relationshipId))
        return state;
    return transactProject(state, `Delete Flow relationship ${relationshipId}`, (project) => { const current = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...current, relationships: current.relationships.filter(({ id }) => id !== relationshipId) }); });
}
//# sourceMappingURL=examples.js.map