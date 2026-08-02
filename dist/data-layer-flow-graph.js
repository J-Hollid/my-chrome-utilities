import { orderedPageGroupIds } from "./utilities/data-layer/page-group-membership.js";
export { addFreePageFrame, addUngroupedPageFrame, inspectFreePageEdgeMove, inspectOccurrenceContainmentMove, inspectOccurrencePageChange, inspectUngroupedPageDrop, moveFreePageFrame, reassignFlowOccurrencePage } from "./flow-graph/containment.js";
export { flowOutline, flowRelationshipText, inspectFlowGraph, projectFlowGraph } from "./flow-graph/projection.js";
export { deriveFlowOccurrenceExample, deriveFlowPageFrameExample, setFlowOccurrenceExample, flowOccurrenceExampleEditorRows } from "./flow-graph/examples.js";
export { migrateLegacyFlowContextBindings, migrateLegacyFlowRelationshipKinds, removeFlowRelationship, reviewLegacyFlowContextMigration, saveGraphRelationship } from "./flow-graph/examples.js";
export { addEventOccurrenceToPage, addGraphOccurrence, addInteractionOccurrenceToPage, moveGraphOccurrence, removeGraphOccurrence, reorderGraphOccurrence, updateGraphOccurrence } from "./flow-graph/occurrences.js";
export { applyFlowPageGroupLaneSelection, addFlowPageFrame, duplicateFlowPageFrame, inspectPageFrameDrop, moveFlowPageFrame, removeFlowPageFrame, reorderFlowPageGroupLane, saveFlowViewState, setFlowPageGroupLanes } from "./flow-graph/page-frames.js";
export const FLOW_GRAPH_GEOMETRY = { eventWidth: 170, eventHeight: 94, eventMinX: 12, eventMinY: 40, pageFrameMinWidth: 190, pageFrameMinHeight: 108, pageFrameChildRightPadding: 20, pageFrameChildBottomPadding: 16 };
export const clone = (value) => structuredClone(value);
export const graphIndex = (project) => project.documentationFlowGraphs ?? {};
export const storedGraph = (project, flowId) => { const stored = graphIndex(project)[flowId], legacyProject = Object.hasOwn(project.collections, "pageGroups"), legacy = legacyProject ? project.collections.flows.find(({ id }) => id === flowId)?.pageGroupIds : undefined; return { sections: stored?.sections ?? [], pageGroupIds: legacyProject ? [...(stored?.pageGroupIds ?? legacy ?? [])] : [], pageFrames: stored?.pageFrames ?? [], occurrences: stored?.occurrences ?? [], relationships: stored?.relationships ?? [], ...(stored?.selectedItem ? { selectedItem: stored.selectedItem } : {}), ...(stored?.viewport ? { viewport: stored.viewport } : {}) }; };
export const saveStoredGraph = (project, flowId, graph) => { const { selectedItem: _selectedItem, viewport: _viewport, ...semanticGraph } = clone(graph); if (!Object.hasOwn(project.collections, "pageGroups")) {
    delete semanticGraph.pageGroupIds;
    for (const frame of semanticGraph.pageFrames) {
        delete frame.pageGroupId;
        delete frame.freePageRegion;
    }
    for (const occurrence of semanticGraph.occurrences) {
        delete occurrence.pageGroupId;
        delete occurrence.freePageFrameId;
        delete occurrence.freePageFrame;
        delete occurrence.freePageRegion;
    }
} return { ...project, documentationFlowGraphs: { ...graphIndex(project), [flowId]: semanticGraph } }; };
export const legacyBindingOccurrence = (occurrence) => typeof occurrence.contextBindingId === "string" && Boolean(occurrence.contextBindingId);
export const relationshipEndpoint = (relationship, side) => {
    const endpoint = side === "source" ? relationship.sourceEndpoint : relationship.targetEndpoint;
    if (endpoint && (endpoint.kind === "page-frame" || endpoint.kind === "event-occurrence") && endpoint.id)
        return endpoint;
    const legacy = side === "source" ? relationship.sourceNodeId : relationship.targetNodeId;
    return legacy ? { kind: "event-occurrence", id: String(legacy) } : undefined;
};
export const relationshipTouches = (relationship, ids) => ids.has(relationshipEndpoint(relationship, "source")?.id ?? "") || ids.has(relationshipEndpoint(relationship, "target")?.id ?? "");
const flowPortSide = (value) => value === "left" || value === "right" || value === "top" || value === "bottom";
export function inferFlowRelationshipKind(sourcePort, targetPort) {
    if (sourcePort === "right" && targetPort === "left")
        return "expected_next";
    if (sourcePort === "top" && targetPort === "bottom")
        return "alternative";
    if (sourcePort === "bottom" && targetPort === "top")
        return "merge";
    return undefined;
}
const legacyPorts = (kind) => kind === "alternative" || kind === "parallel" ? { sourcePort: "top", targetPort: "bottom" } : kind === "merge" ? { sourcePort: "bottom", targetPort: "top" } : { sourcePort: "right", targetPort: "left" };
export const relationshipPorts = (relationship) => flowPortSide(relationship.sourcePort) && flowPortSide(relationship.targetPort) ? { sourcePort: relationship.sourcePort, targetPort: relationship.targetPort } : legacyPorts(relationship.kind);
export const normalizedOccurrence = (input) => {
    if (input.pageFrameId || input.pageGroupId || input.freePageFrameId || input.freePageFrame) {
        const { layout, x, y, fallbackRole, role, eventId, ...values } = clone(input);
        void layout;
        void fallbackRole;
        void role;
        const ownsCoordinates = Boolean(input.pageFrameId || input.freePageFrameId || input.freePageFrame);
        return { ...values, ...(eventId ? { eventId } : {}), position: { ...(ownsCoordinates ? { x: Number(x ?? input.layout?.x ?? 24) } : {}), y: Number(y ?? input.layout?.y ?? 70) }, optional: input.obligation === "Optional" };
    }
    const { layout, ...values } = clone(input);
    if (!layout)
        throw new Error("An uncontained legacy Flow occurrence requires an explicit legacy layout.");
    return { ...values, lane: layout.lane, position: { x: layout.x, y: layout.y }, optional: input.obligation === "Optional" };
};
export function documentaryFlowGraph(project, flowId) { const graph = storedGraph(project, flowId); return { sections: graph.sections, pageGroupIds: graph.pageGroupIds, pageFrames: graph.pageFrames, occurrences: graph.occurrences, relationships: graph.relationships, ...(graph.selectedItem ? { selectedItem: graph.selectedItem } : {}), ...(graph.viewport ? { viewport: graph.viewport } : {}) }; }
export function flowPageGroupLaneIds(project, flowId) { return storedGraph(project, flowId).pageGroupIds; }
export function flowOccurrenceEventSchema(project, flowId, occurrenceId) {
    const occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId), event = project.collections.events.find(({ id }) => id === occurrence?.eventId);
    return event?.id;
}
export function validOccurrence(state, flowId, input) {
    if ("contextBindingId" in input)
        throw new Error("A legacy Page-context binding is migration input and cannot be authored as a Flow occurrence.");
    const flow = state.project.collections.flows.find(({ id }) => id === flowId);
    if (!flow)
        throw new Error("A documentary Flow graph requires an existing Flow.");
    if (!input.name.trim())
        throw new Error("A Flow occurrence requires a name.");
    const page = state.project.collections.pages.find(({ id }) => id === input.pageId);
    if (!page)
        throw new Error("A Flow occurrence requires an existing Page.");
    if (!input.pageFrameId)
        throw new Error("A Flow occurrence requires an existing containing Page frame; legacy lane records are migration input only.");
    const graph = storedGraph(state.project, flowId), frame = graph.pageFrames.find(({ id }) => id === input.pageFrameId);
    if (input.pageFrameId && (!frame || frame.pageId !== page.id || (input.pageGroupId !== undefined && String(frame.pageGroupId ?? "") !== String(input.pageGroupId))))
        throw new Error("A Flow occurrence requires its existing containing Page frame.");
    const effectivePageGroupId = input.pageGroupId ?? frame?.pageGroupId;
    if (effectivePageGroupId) {
        const group = state.project.collections.propertySets.find(({ id }) => id === effectivePageGroupId), memberIds = orderedPageGroupIds(state.project, page.id);
        if (!group || !flowPageGroupLaneIds(state.project, flowId).includes(group.id) || !memberIds.includes(group.id))
            throw new Error("A Flow occurrence requires a selected Property Set containing its Page.");
    }
    if (input.freePageFrameId) {
        const legacyFrame = graph.occurrences.find(({ id }) => id === input.freePageFrameId);
        if (!legacyFrame?.freePageFrame || legacyFrame.pageId !== page.id)
            throw new Error("A free-page interaction requires an existing free Page frame for its Page.");
    }
    const event = state.project.collections.events.find(({ id }) => id === input.eventId);
    if (!event)
        throw new Error("A Flow occurrence requires an existing Event.");
    if (input.minimum < 0 || input.maximum < input.minimum)
        throw new Error("Flow occurrence bounds are invalid.");
    const { fallbackRole, role, ...values } = input;
    void fallbackRole;
    void role;
    return { ...values, name: input.name.trim() };
}
//# sourceMappingURL=data-layer-flow-graph.js.map