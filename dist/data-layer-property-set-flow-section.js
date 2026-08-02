import { transactProject } from "./data-layer-specification-project.js";
const clone = (value) => structuredClone(value);
const collections = (project) => project.collections;
const graphs = (project) => (project.documentationFlowGraphs ?? {});
const unique = (values) => [...new Set(values)];
const applications = (page) => Array.isArray(page.propertySetApplications) ? clone(page.propertySetApplications) : [];
export function orderedPropertySetApplications(project, pageId) {
    return applications(project.collections.pages.find(({ id }) => id === pageId) ?? { id: "", name: "" });
}
const updatePage = (state, pageId, label, update) => transactProject(state, label, (project) => {
    if (!project.collections.pages.some(({ id }) => id === pageId))
        throw new Error(`Unknown Page ${pageId}.`);
    return { ...project, collections: { ...project.collections, pages: project.collections.pages.map((page) => page.id === pageId ? update(page) : page) } };
});
export function addPropertySetApplication(state, pageId, propertySetId, applicabilitySetId, id) {
    const page = state.project.collections.pages.find(({ id }) => id === pageId), propertySet = collections(state.project).propertySets?.find(({ id }) => id === propertySetId);
    if (!page)
        throw new Error(`Unknown Page ${pageId}.`);
    if (!propertySet)
        throw new Error(`Unknown Property Set ${propertySetId}.`);
    if (applicabilitySetId && !state.project.collections.applicabilitySets.some(({ id }) => id === applicabilitySetId))
        throw new Error(`Unknown Applicability Set ${applicabilitySetId}.`);
    if (applications(page).some((application) => application.propertySetId === propertySetId))
        throw new Error(`${page.name} already applies ${propertySet.name}.`);
    return updatePage(state, pageId, `Apply Property Set ${propertySet.name} to ${page.name}`, (candidate) => ({ ...candidate, propertySetApplications: [...applications(candidate), { id: id("property-set-application"), name: propertySet.name, propertySetId, ...(applicabilitySetId ? { applicabilitySetId } : {}) }] }));
}
export function reorderPropertySetApplication(state, pageId, propertySetId, delta) {
    const page = state.project.collections.pages.find(({ id }) => id === pageId);
    if (!page)
        throw new Error(`Unknown Page ${pageId}.`);
    const current = applications(page), from = current.findIndex((application) => application.propertySetId === propertySetId);
    if (from < 0)
        return state;
    const to = Math.max(0, Math.min(current.length - 1, from + delta));
    if (to === from)
        return state;
    const next = [...current], moved = next.splice(from, 1)[0];
    next.splice(to, 0, moved);
    return updatePage(state, pageId, `Reorder Property composition for ${page.name}`, (candidate) => ({ ...candidate, propertySetApplications: next }));
}
export function removePropertySetApplication(state, pageId, propertySetId) {
    const page = state.project.collections.pages.find(({ id }) => id === pageId);
    if (!page)
        return state;
    const current = applications(page);
    if (!current.some((application) => application.propertySetId === propertySetId))
        return state;
    const propertySet = collections(state.project).propertySets?.find(({ id }) => id === propertySetId);
    return updatePage(state, pageId, `Remove Property Set ${propertySet?.name ?? propertySetId} from ${page.name}`, (candidate) => ({ ...candidate, propertySetApplications: current.filter((application) => application.propertySetId !== propertySetId) }));
}
export function propertySetPages(project, propertySetId) { return project.collections.pages.filter((page) => applications(page).some((application) => application.propertySetId === propertySetId)); }
const sectionGraph = (project, flowId) => { if (!project.collections.flows.some(({ id }) => id === flowId))
    throw new Error(`Unknown Flow ${flowId}.`); return graphs(project)[flowId] ?? { sections: [], pageFrames: [], occurrences: [], relationships: [] }; };
const saveGraph = (state, flowId, label, update) => transactProject(state, label, (project) => ({ ...project, documentationFlowGraphs: { ...graphs(project), [flowId]: update(clone(sectionGraph(project, flowId))) } }));
const cleanBounds = (bounds) => ({ x: Math.round(bounds.x), y: Math.round(bounds.y), width: Math.max(240, Math.round(bounds.width)), height: Math.max(140, Math.round(bounds.height)) });
const withoutSection = (frame) => { const { sectionId: _sectionId, ...outside } = frame; return outside; };
export function createFlowSection(state, flowId, input, id) {
    const name = input.name.trim();
    if (!name)
        throw new Error("A Flow Section requires a name.");
    return saveGraph(state, flowId, `Create Section ${name}`, (graph) => ({ ...graph, sections: [...(graph.sections ?? []), { id: id("flow-section"), name, bounds: cleanBounds(input.bounds), order: (graph.sections ?? []).length }] }));
}
export function movePageFrameToSection(state, flowId, frameId, sectionId) {
    const graph = sectionGraph(state.project, flowId), frame = graph.pageFrames?.find(({ id }) => id === frameId);
    if (!frame)
        throw new Error(`Unknown Page frame ${frameId}.`);
    const section = sectionId ? graph.sections?.find(({ id }) => id === sectionId) : undefined;
    if (sectionId && !section)
        throw new Error(`Unknown Flow Section ${sectionId}.`);
    return saveGraph(state, flowId, section ? `Move ${frame.name} to Section ${section.name}` : `Move ${frame.name} outside Sections`, (next) => ({ ...next, pageFrames: (next.pageFrames ?? []).map((candidate) => candidate.id !== frameId ? candidate : section ? { ...candidate, sectionId: section.id, position: { x: section.bounds.x + 40, y: section.bounds.y + 50 } } : withoutSection(candidate)) }));
}
export function moveFlowSection(state, flowId, sectionId, position) {
    const section = sectionGraph(state.project, flowId).sections?.find(({ id }) => id === sectionId);
    if (!section)
        throw new Error(`Unknown Flow Section ${sectionId}.`);
    const dx = Math.round(position.x) - section.bounds.x, dy = Math.round(position.y) - section.bounds.y;
    return saveGraph(state, flowId, `Move Section ${section.name}`, (graph) => ({ ...graph, sections: (graph.sections ?? []).map((candidate) => candidate.id === sectionId ? { ...candidate, bounds: { ...candidate.bounds, x: position.x, y: position.y } } : candidate), pageFrames: (graph.pageFrames ?? []).map((frame) => frame.sectionId === sectionId ? { ...frame, position: { ...(frame.position.x === undefined ? {} : { x: frame.position.x + dx }), y: frame.position.y + dy } } : frame) }));
}
export function renameAndResizeFlowSection(state, flowId, sectionId, input) {
    const section = sectionGraph(state.project, flowId).sections?.find(({ id }) => id === sectionId), name = input.name.trim();
    if (!section)
        throw new Error(`Unknown Flow Section ${sectionId}.`);
    if (!name)
        throw new Error("A Flow Section requires a name.");
    return saveGraph(state, flowId, `Resize and rename Section ${section.name}`, (graph) => ({ ...graph, sections: (graph.sections ?? []).map((candidate) => candidate.id === sectionId ? { ...candidate, name, bounds: cleanBounds(input.bounds) } : candidate) }));
}
export function removeFlowSection(state, flowId, sectionId) {
    const section = sectionGraph(state.project, flowId).sections?.find(({ id }) => id === sectionId);
    if (!section)
        return state;
    return saveGraph(state, flowId, `Remove Section ${section.name} and retain Page frames`, (graph) => ({ ...graph, sections: (graph.sections ?? []).filter(({ id }) => id !== sectionId).map((candidate, order) => ({ ...candidate, order })), pageFrames: (graph.pageFrames ?? []).map((frame) => frame.sectionId === sectionId ? withoutSection(frame) : frame) }));
}
const endpointId = (relationship, side) => String(relationship[`${side}Endpoint`]?.id ?? relationship[`${side}NodeId`] ?? "") || undefined;
const sectionRemovalFingerprint = (graph, sectionId) => JSON.stringify({ section: graph.sections?.find(({ id }) => id === sectionId), frames: (graph.pageFrames ?? []).filter((frame) => frame.sectionId === sectionId), occurrences: graph.occurrences ?? [], relationships: graph.relationships ?? [] });
export function inspectSectionRemovalWithContents(project, flowId, sectionId) {
    const graph = sectionGraph(project, flowId), section = graph.sections?.find(({ id }) => id === sectionId);
    if (!section)
        throw new Error(`Unknown Flow Section ${sectionId}.`);
    const frames = (graph.pageFrames ?? []).filter((frame) => frame.sectionId === sectionId), ids = new Set(frames.map(({ id }) => id)), relationships = (graph.relationships ?? []).filter((relationship) => ids.has(endpointId(relationship, "source") ?? "") || ids.has(endpointId(relationship, "target") ?? ""));
    return { flowId, sectionId, sectionName: section.name, pageFrames: frames.map(({ id, name }) => ({ id, name })), relationships: relationships.map(({ id, name }) => ({ id, name: name || id })), fingerprint: sectionRemovalFingerprint(graph, sectionId) };
}
export function removeFlowSectionWithContents(state, flowId, sectionId, review) {
    const graph = sectionGraph(state.project, flowId);
    if (review.flowId !== flowId || review.sectionId !== sectionId || review.fingerprint !== sectionRemovalFingerprint(graph, sectionId))
        throw new Error("Review the current Section impact before destructive removal.");
    const frameIds = new Set(review.pageFrames.map(({ id }) => id)), occurrenceIds = new Set((graph.occurrences ?? []).filter((occurrence) => frameIds.has(String(occurrence.pageFrameId ?? ""))).map(({ id }) => id)), removedIds = new Set([...frameIds, ...occurrenceIds]);
    return saveGraph(state, flowId, `Remove Section ${review.sectionName} with contents`, (next) => ({ ...next, sections: (next.sections ?? []).filter(({ id }) => id !== sectionId).map((candidate, order) => ({ ...candidate, order })), pageFrames: (next.pageFrames ?? []).filter(({ id }) => !frameIds.has(id)), occurrences: (next.occurrences ?? []).filter(({ id }) => !occurrenceIds.has(id)), relationships: (next.relationships ?? []).filter((relationship) => !removedIds.has(endpointId(relationship, "source") ?? "") && !removedIds.has(endpointId(relationship, "target") ?? "")) }));
}
const verifyUpgrade = (before, after) => {
    const legacy = collections(before).pageGroups ?? [], sets = collections(after).propertySets ?? [];
    if (legacy.length !== sets.length || legacy.some((group) => !sets.some(({ id }) => id === group.id)))
        throw new Error("Property Set upgrade did not preserve contributor identities.");
    for (const [flowId, beforeGraph] of Object.entries(graphs(before))) {
        const afterGraph = graphs(after)[flowId];
        if (!afterGraph)
            throw new Error(`Flow ${flowId} was not preserved.`);
        const keys = (values) => JSON.stringify((values ?? []).map(({ id }) => id));
        if (keys(beforeGraph.pageFrames) !== keys(afterGraph.pageFrames) || keys(beforeGraph.occurrences) !== keys(afterGraph.occurrences) || JSON.stringify(beforeGraph.relationships ?? []) !== JSON.stringify(afterGraph.relationships ?? []))
            throw new Error(`Flow ${flowId} identities or topology changed during upgrade.`);
    }
};
export function upgradePageGroupsToPropertySets(state, id) {
    const legacy = collections(state.project).pageGroups;
    if (!legacy)
        return state;
    return transactProject(state, "Upgrade Page Groups to Property Sets and Flow Sections", (project) => {
        const legacySets = collections(project).pageGroups ?? [], propertySets = legacySets.map((group) => { const next = clone(group); delete next.pageIds; delete next.applicabilitySetId; return next; }), applicabilityBySet = new Map(legacySets.map((group) => [group.id, typeof group.applicabilitySetId === "string" ? group.applicabilitySetId : undefined])), legacyMembers = new Map(legacySets.map((group) => [group.id, new Set((group.pageIds ?? []).map(String))]));
        const pages = project.collections.pages.map((page) => { const stored = Array.isArray(page.pageGroupIds) ? page.pageGroupIds.map(String) : [], fromGroups = legacySets.filter((group) => legacyMembers.get(group.id)?.has(page.id)).map(({ id }) => id), ordered = unique([...stored, ...fromGroups]), next = { ...page, propertySetApplications: ordered.map((propertySetId) => { const set = propertySets.find(({ id }) => id === propertySetId); return { id: id("property-set-application"), name: set.name, propertySetId, ...(applicabilityBySet.get(propertySetId) ? { applicabilitySetId: applicabilityBySet.get(propertySetId) } : {}) }; }) }; delete next.pageGroupIds; return next; });
        const documentationFlowGraphs = Object.fromEntries(Object.entries(graphs(project)).map(([flowId, graph]) => { const laneIds = unique([...(graph.pageGroupIds ?? []), ...(graph.pageFrames ?? []).flatMap((frame) => typeof frame.pageGroupId === "string" ? [frame.pageGroupId] : [])]), sectionByLane = new Map(), sections = laneIds.map((groupId, order) => { const group = legacySets.find(({ id }) => id === groupId), sectionId = id("flow-section"); sectionByLane.set(groupId, sectionId); return { id: sectionId, name: group?.name ?? groupId, order, bounds: { x: 20, y: 40 + order * 220, width: 1000, height: 200 } }; }), pageFrames = (graph.pageFrames ?? []).map((frame) => { const legacyFrame = frame, next = { ...legacyFrame, ...(typeof legacyFrame.pageGroupId === "string" && sectionByLane.has(legacyFrame.pageGroupId) ? { sectionId: sectionByLane.get(legacyFrame.pageGroupId) } : {}) }; delete next.pageGroupId; return next; }), next = { ...graph, sections, pageFrames }; delete next.pageGroupIds; return [flowId, next]; })), assignments = project.collections.assignments.map((assignment) => assignment.targetKind === "Page Group" ? { ...assignment, targetKind: "Property Set" } : assignment), nextCollections = { ...project.collections, propertySets, pages, assignments };
        delete nextCollections.pageGroups;
        const next = { ...project, collections: nextCollections, documentationFlowGraphs, propertySetFlowSectionVersion: 1 };
        verifyUpgrade(project, next);
        return next;
    });
}
//# sourceMappingURL=data-layer-property-set-flow-section.js.map