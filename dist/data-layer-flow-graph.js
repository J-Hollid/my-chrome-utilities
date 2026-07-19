import { transactProject } from "./utilities/data-layer/schemas.js";
const clone = (value) => structuredClone(value);
const graphIndex = (project) => project.documentationFlowGraphs ?? {};
const storedGraph = (project, flowId) => graphIndex(project)[flowId] ?? { occurrences: [], relationships: [] };
const saveStoredGraph = (project, flowId, graph) => ({ ...project, documentationFlowGraphs: { ...graphIndex(project), [flowId]: graph } });
const normalizedOccurrence = (input) => { const { layout, ...values } = clone(input); return { ...values, lane: layout.lane, position: { x: layout.x, y: layout.y }, optional: input.obligation === "Optional" }; };
export function documentaryFlowGraph(project, flowId) { const graph = storedGraph(project, flowId); return { occurrences: graph.occurrences, relationships: graph.relationships }; }
function validOccurrence(state, flowId, input) {
    if (!state.project.collections.flows.some(({ id }) => id === flowId))
        throw new Error("A documentary Flow graph requires an existing Flow.");
    if (!input.name.trim())
        throw new Error("A Flow occurrence requires a name.");
    if (!state.project.collections.pages.some(({ id }) => id === input.pageId))
        throw new Error("A Flow occurrence requires an existing Page.");
    const event = state.project.collections.events.find(({ id }) => id === input.eventId);
    if (!event)
        throw new Error("A Flow occurrence requires an existing Event.");
    if (input.minimum < 0 || input.maximum < input.minimum)
        throw new Error("Flow occurrence bounds are invalid.");
    const { fallbackRole, ...values } = input, authoritative = event.role === "context-setting" || event.role === "interaction";
    return { ...values, name: input.name.trim(), ...(!authoritative ? { fallbackRole } : {}) };
}
export function addGraphOccurrence(state, flowId, input, id) {
    const valid = validOccurrence(state, flowId, input);
    return transactProject(state, `Add ${valid.name} Flow occurrence`, (project) => { const graph = storedGraph(project, flowId), occurrence = { id: id("flow-occurrence"), ...normalizedOccurrence(valid) }; return saveStoredGraph(project, flowId, { ...graph, occurrences: [...graph.occurrences, occurrence] }); });
}
export function updateGraphOccurrence(state, flowId, occurrenceId, input) {
    if (!storedGraph(state.project, flowId).occurrences.some(({ id }) => id === occurrenceId))
        throw new Error("Unknown documentary Flow occurrence.");
    const valid = validOccurrence(state, flowId, input);
    return transactProject(state, `Save Flow occurrence ${occurrenceId}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, occurrences: graph.occurrences.map((occurrence) => { if (occurrence.id !== occurrenceId)
            return occurrence; const { layout: discardedLayout, relationshipGroup: discardedRelationshipGroup, branch: discardedBranch, ...stored } = occurrence; void discardedLayout; void discardedRelationshipGroup; void discardedBranch; return { ...stored, ...normalizedOccurrence(valid) }; }) }); });
}
export function moveGraphOccurrence(state, flowId, occurrenceId, layout) {
    const occurrence = storedGraph(state.project, flowId).occurrences.find(({ id }) => id === occurrenceId), position = occurrence?.position;
    if (!occurrence || occurrence.lane === layout.lane && position?.x === layout.x && position.y === layout.y)
        return state;
    return transactProject(state, `Move Flow occurrence ${occurrenceId}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, occurrences: graph.occurrences.map((item) => { if (item.id !== occurrenceId)
            return item; const { layout: discardedLayout, ...stored } = item; void discardedLayout; return { ...stored, lane: layout.lane, position: { x: layout.x, y: layout.y } }; }) }); });
}
export function reorderGraphOccurrence(state, flowId, from, to) {
    const count = storedGraph(state.project, flowId).occurrences.length, target = Math.max(0, Math.min(to, count - 1));
    if (from < 0 || from >= count || from === target)
        return state;
    return transactProject(state, "Reorder Flow occurrence", (project) => { const graph = storedGraph(project, flowId), occurrences = [...graph.occurrences], moved = occurrences.splice(from, 1)[0]; occurrences.splice(target, 0, moved); return saveStoredGraph(project, flowId, { ...graph, occurrences }); });
}
export function removeGraphOccurrence(state, flowId, occurrenceId) {
    if (!state.project.collections.flows.some(({ id }) => id === flowId) || !storedGraph(state.project, flowId).occurrences.some(({ id }) => id === occurrenceId))
        return state;
    return transactProject(state, `Remove Flow occurrence ${occurrenceId}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { occurrences: graph.occurrences.filter(({ id }) => id !== occurrenceId), relationships: graph.relationships.filter(({ sourceNodeId, targetNodeId }) => sourceNodeId !== occurrenceId && targetNodeId !== occurrenceId) }); });
}
export function saveGraphRelationship(state, flowId, fromOccurrenceId, input, id) {
    const graph = storedGraph(state.project, flowId), occurrenceIds = new Set(graph.occurrences.map(({ id }) => id));
    if (!state.project.collections.flows.some(({ id }) => id === flowId) || !occurrenceIds.has(fromOccurrenceId) || !occurrenceIds.has(input.toStepId))
        throw new Error("A Flow relationship requires an existing Flow, source, and target occurrence.");
    return transactProject(state, `Save Flow relationship ${input.id ?? "new"}`, (project) => { const current = storedGraph(project, flowId), relationship = { id: input.id ?? id("flow-relationship"), sourceNodeId: fromOccurrenceId, targetNodeId: input.toStepId, kind: input.kind, ...(input.group ? { group: input.group } : {}), ...(input.label ? { label: input.label } : {}), ...(input.documentationCondition ? { documentationCondition: input.documentationCondition } : {}), ...(input.expectation ? { expectation: input.expectation } : {}) }; return saveStoredGraph(project, flowId, { ...current, relationships: current.relationships.some(({ id }) => id === relationship.id) ? current.relationships.map((candidate) => candidate.id === relationship.id ? relationship : candidate) : [...current.relationships, relationship] }); });
}
export function flowRelationshipText(graph, relationship) { const source = graph.nodes.find(({ id }) => id === relationship.sourceNodeId), target = graph.nodes.find(({ id }) => id === relationship.targetNodeId); return [source?.name ?? "Missing occurrence", relationship.kind, target?.name ?? "Missing occurrence", relationship.group, relationship.label, relationship.documentationCondition, relationship.expectation].filter((value) => value !== undefined && value !== "").join(" · "); }
export function inspectFlowGraph(graph, catalog) { const diagnostics = [], nodeIds = new Set(graph.nodes.map(({ id }) => id)); for (const node of graph.nodes) {
    if (!catalog.events.some(({ id }) => id === node.eventId))
        diagnostics.push({ kind: "missing-event", message: `${node.name} has no resolved Event`, nodeId: node.id });
    if (!catalog.pages.some(({ id }) => id === node.pageId))
        diagnostics.push({ kind: "missing-page", message: `${node.name} has no resolved Page`, nodeId: node.id });
} for (const relationship of graph.relationships)
    if (!nodeIds.has(relationship.sourceNodeId) || !nodeIds.has(relationship.targetNodeId))
        diagnostics.push({ kind: "dangling-relationship", message: `Relationship ${relationship.id} has a missing endpoint`, relationshipId: relationship.id }); return diagnostics; }
export function flowOutline(graph) { return graph.nodes.map((node) => ({ nodeId: node.id, name: node.name, role: node.role, obligation: node.obligation, expectedMinimum: node.expectedMinimum, ...(node.expectedMaximum !== undefined ? { expectedMaximum: node.expectedMaximum } : {}), relationshipIds: graph.relationships.filter(({ sourceNodeId }) => sourceNodeId === node.id).map(({ id }) => id) })); }
export function projectFlowGraph(project, flowId) {
    const flow = project.collections.flows.find(({ id }) => id === flowId);
    if (!flow)
        throw new Error(`Unknown Flow ${flowId}`);
    const stored = storedGraph(project, flowId), nodes = stored.occurrences.map((occurrence) => { const event = project.collections.events.find(({ id }) => id === occurrence.eventId), position = occurrence.position, eventRole = event?.role; return { id: occurrence.id, name: occurrence.name, eventId: String(occurrence.eventId ?? ""), pageId: String(occurrence.pageId ?? ""), role: eventRole === "context-setting" || eventRole === "interaction" ? eventRole : occurrence.fallbackRole === "context-setting" ? "context-setting" : "interaction", obligation: (typeof occurrence.obligation === "string" ? occurrence.obligation : occurrence.optional ? "Optional" : "Required"), expectedMinimum: Number(occurrence.minimum ?? 1), ...(occurrence.maximum !== undefined ? { expectedMaximum: Number(occurrence.maximum) } : {}), ...(position && typeof position.x === "number" && typeof position.y === "number" ? { layout: { lane: typeof occurrence.lane === "string" ? occurrence.lane : "Shipping", x: position.x, y: position.y } } : {}) }; }), relationships = stored.relationships.map((edge) => ({ id: edge.id, sourceNodeId: String(edge.sourceNodeId ?? ""), targetNodeId: String(edge.targetNodeId ?? ""), kind: (["expected-next", "alternative", "parallel", "merge"].includes(String(edge.kind)) ? edge.kind : "expected-next"), ...(typeof edge.group === "string" ? { group: edge.group } : {}), ...(typeof edge.label === "string" ? { label: edge.label } : {}), ...(typeof edge.documentationCondition === "string" ? { documentationCondition: edge.documentationCondition } : {}), ...(typeof edge.expectation === "string" ? { expectation: edge.expectation } : {}) })), graph = { id: flow.id, name: flow.name, purpose: String(flow.purpose ?? flow.description ?? ""), nodes, relationships }, catalog = { pages: project.collections.pages.map((page) => clone(page)), events: project.collections.events.map((event) => clone(event)) };
    return { projectName: project.name, graph, catalog, diagnostics: inspectFlowGraph(graph, catalog) };
}
//# sourceMappingURL=data-layer-flow-graph.js.map