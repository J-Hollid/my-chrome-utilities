import { saveStoredGraph, storedGraph } from "../data-layer-flow-graph.js";
import { compileLayeredSchema, layeredContributorPath, layeredContributorsForPath, transactProject } from "../utilities/data-layer/schemas.js";
export function inspectOccurrenceContainmentMove(project, flowId, occurrenceId, targetPageGroupId, targetPageId) {
    const target = storedGraph(project, flowId).pageFrames.find(({ pageId, pageGroupId }) => pageId === targetPageId && pageGroupId === targetPageGroupId);
    return inspectOccurrencePageChange(project, flowId, occurrenceId, target?.id ?? "");
}
export function inspectOccurrencePageChange(project, flowId, occurrenceId, targetPageFrameId) {
    const graph = storedGraph(project, flowId), occurrence = graph.occurrences.find(({ id }) => id === occurrenceId), sourceFrame = graph.pageFrames.find(({ id }) => id === occurrence?.pageFrameId), targetFrame = graph.pageFrames.find(({ id }) => id === targetPageFrameId), sourcePage = project.collections.pages.find(({ id }) => id === sourceFrame?.pageId), targetPage = project.collections.pages.find(({ id }) => id === targetFrame?.pageId), rejected = !occurrence || !sourceFrame || !targetFrame || sourceFrame.id === targetFrame.id;
    if (rejected)
        return { rejected, message: "Choose a different existing Page frame.", guidance: targetFrame ? `?kind=flow-page-instances&flow=${encodeURIComponent(flowId)}&entity=${encodeURIComponent(targetFrame.id)}` : "Open a target Flow Page frame." };
    const state = { project }, compileAt = (frame, page) => { const candidate = { ...occurrence, pageFrameId: frame.id, pageId: frame.pageId, ...(frame.pageGroupId ? { pageGroupId: frame.pageGroupId } : {}) }; if (!frame.pageGroupId)
        delete candidate.pageGroupId; const contributors = layeredContributorsForPath(state, layeredContributorPath(state, candidate, "Event-occurrence", flowId)), compiled = compileLayeredSchema(contributors, { eventId: String(occurrence.eventId ?? ""), eventRole: "interaction", occurrenceId: occurrence.id }); return { summary: { pageFrameId: frame.id, pageName: page?.name ?? frame.pageId, status: compiled.status, propertyPaths: Object.keys(compiled.properties).sort() }, properties: compiled.properties }; }, source = compileAt(sourceFrame, sourcePage), target = compileAt(targetFrame, targetPage), sourcePaths = new Set(source.summary.propertyPaths), targetPaths = new Set(target.summary.propertyPaths), addedPaths = target.summary.propertyPaths.filter((path) => !sourcePaths.has(path)), removedPaths = source.summary.propertyPaths.filter((path) => !targetPaths.has(path)), changedPaths = source.summary.propertyPaths.filter((path) => targetPaths.has(path) && JSON.stringify(source.properties[path]) !== JSON.stringify(target.properties[path])), list = (paths) => paths.length ? paths.join(", ") : "none", impact = { source: source.summary, target: target.summary, addedPaths, removedPaths, changedPaths };
    return { rejected, message: `${occurrence.name} will move from ${source.summary.pageName} to ${target.summary.pageName}; effective-schema impact: source ${source.summary.status} with ${source.summary.propertyPaths.length} properties, target ${target.summary.status} with ${target.summary.propertyPaths.length}; added ${list(addedPaths)}; removed ${list(removedPaths)}; changed ${list(changedPaths)}.`, guidance: `?kind=flow-page-instances&flow=${encodeURIComponent(flowId)}&entity=${encodeURIComponent(targetFrame.id)}`, impact };
}
export function reassignFlowOccurrencePage(state, flowId, occurrenceId, targetPageFrameId) {
    const review = inspectOccurrencePageChange(state.project, flowId, occurrenceId, targetPageFrameId);
    if (review.rejected)
        return state;
    return transactProject(state, `Change Flow occurrence ${occurrenceId} Page`, (project) => { const graph = storedGraph(project, flowId), target = graph.pageFrames.find(({ id }) => id === targetPageFrameId); return saveStoredGraph(project, flowId, { ...graph, occurrences: graph.occurrences.map((occurrence) => { if (occurrence.id !== occurrenceId)
            return occurrence; const moved = { ...occurrence, pageFrameId: target.id, pageId: target.pageId }; if (target.pageGroupId)
            moved.pageGroupId = target.pageGroupId;
        else
            delete moved.pageGroupId; delete moved.freePageFrameId; return moved; }) }); });
}
export function addFreePageFrame(state, flowId, input, id) {
    const page = state.project.collections.pages.find(({ id }) => id === input.pageId);
    if (!page)
        return state;
    return transactProject(state, "Add Flow Page frame outside Sections", (project) => { const current = storedGraph(project, flowId), frame = { id: id("flow-page-frame"), pageId: input.pageId, position: { x: Math.max(12, Math.round(input.x)), y: Math.max(55, Math.round(input.y)) } }; return saveStoredGraph(project, flowId, { ...current, pageFrames: [...current.pageFrames, frame] }); });
}
export function addUngroupedPageFrame(state, flowId, input, id) { return addFreePageFrame(state, flowId, { ...input, region: "after-lanes", x: 24 }, id); }
export function inspectFreePageEdgeMove(project, flowId, occurrenceId, targetRegion) {
    const occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId), page = project.collections.pages.find(({ id }) => id === occurrence?.pageId);
    void targetRegion;
    return { rejected: !occurrence, message: occurrence ? `${page?.name ?? occurrence.name} can move outside every Section without changing schema composition.` : "Choose an existing Event occurrence.", guidance: `?kind=flows&entity=${encodeURIComponent(flowId)}` };
}
export function inspectUngroupedPageDrop(project, flowId, pageId, targetSectionId) { const page = project.collections.pages.find(({ id }) => id === pageId), section = storedGraph(project, flowId).sections.find(({ id }) => id === targetSectionId), rejected = !page || !section; return { rejected, message: rejected ? "Choose an existing Page and Section." : `${page.name} can be placed in ${section.name} independently of Property composition.`, guidance: `?kind=flows&entity=${encodeURIComponent(flowId)}` }; }
export function moveFreePageFrame(state, flowId, frameId, presentation) {
    const frame = storedGraph(state.project, flowId).pageFrames.find(({ id }) => id === frameId), position = frame?.position;
    if (!frame)
        return state;
    const next = { x: Math.max(12, Math.round(presentation.x)), y: Math.max(55, Math.round(presentation.y)) };
    if (!frame.freePageRegion && !frame.pageGroupId && position?.x === next.x && position.y === next.y)
        return state;
    return transactProject(state, `Move Page frame ${frameId} outside Sections`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, pageFrames: graph.pageFrames.map((item) => { if (item.id !== frameId)
            return item; const moved = { ...item, position: next }; delete moved.pageGroupId; delete moved.freePageRegion; delete moved.sectionId; return moved; }) }); });
}
//# sourceMappingURL=containment.js.map