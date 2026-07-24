import { normalizedOccurrence, relationshipTouches, saveStoredGraph, storedGraph, validOccurrence } from "../data-layer-flow-graph.js";
import { transactProject } from "../utilities/data-layer/schemas.js";
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
    if (!occurrence)
        return state;
    if (occurrence.pageFrameId || occurrence.pageGroupId || occurrence.freePageFrameId || occurrence.freePageFrame) {
        const requestedGroup = "pageGroupId" in layout ? layout.pageGroupId : undefined;
        if (requestedGroup && requestedGroup !== occurrence.pageGroupId || Boolean(occurrence.freePageFrameId || occurrence.freePageFrame) && requestedGroup)
            return state;
        const ownsCoordinates = Boolean(occurrence.pageFrameId || occurrence.freePageFrameId || occurrence.freePageFrame), x = Math.max(12, Math.round("x" in layout && typeof layout.x === "number" ? layout.x : position?.x ?? 24)), y = Math.max(55, Math.round(layout.y));
        if ((!ownsCoordinates || position?.x === x) && position?.y === y)
            return state;
        return transactProject(state, `Move Flow occurrence ${occurrenceId}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, occurrences: graph.occurrences.map((item) => item.id === occurrenceId ? { ...item, position: { ...(ownsCoordinates ? { x } : {}), y } } : item) }); });
    }
    const legacy = layout;
    if (occurrence.lane === legacy.lane && position?.x === legacy.x && position.y === legacy.y)
        return state;
    return transactProject(state, `Move Flow occurrence ${occurrenceId}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, occurrences: graph.occurrences.map((item) => { if (item.id !== occurrenceId)
            return item; const { layout: discardedLayout, ...stored } = item; void discardedLayout; return { ...stored, lane: legacy.lane, position: { x: legacy.x, y: legacy.y } }; }) }); });
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
    return transactProject(state, `Remove Flow occurrence ${occurrenceId}`, (project) => { const graph = storedGraph(project, flowId), removed = new Set([occurrenceId]); return saveStoredGraph(project, flowId, { ...graph, occurrences: graph.occurrences.filter(({ id }) => id !== occurrenceId), relationships: graph.relationships.filter((relationship) => !relationshipTouches(relationship, removed)) }); });
}
export function addEventOccurrenceToPage(state, flowId, input, id) { return addGraphOccurrence(state, flowId, input, id); }
export function addInteractionOccurrenceToPage(state, flowId, input, id) { return addGraphOccurrence(state, flowId, input, id); }
//# sourceMappingURL=occurrences.js.map