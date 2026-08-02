import { transactProject } from "./data-layer-specification-project.js";
import { selectiveProfileContribution } from "./data-layer-selective-profile-inheritance.js";
const clone = (value) => structuredClone(value);
const legacyCollections = (project) => project.collections;
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
    const page = state.project.collections.pages.find(({ id }) => id === pageId), propertySet = state.project.collections.propertySets.find(({ id }) => id === propertySetId);
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
    const propertySet = state.project.collections.propertySets.find(({ id }) => id === propertySetId);
    return updatePage(state, pageId, `Remove Property Set ${propertySet?.name ?? propertySetId} from ${page.name}`, (candidate) => ({ ...candidate, propertySetApplications: current.filter((application) => application.propertySetId !== propertySetId) }));
}
export function setPropertySetApplicationApplicability(state, pageId, propertySetId, applicabilitySetId) {
    const page = state.project.collections.pages.find(({ id }) => id === pageId), propertySet = state.project.collections.propertySets.find(({ id }) => id === propertySetId);
    if (!page)
        throw new Error(`Unknown Page ${pageId}.`);
    if (!propertySet)
        throw new Error(`Unknown Property Set ${propertySetId}.`);
    if (applicabilitySetId && !state.project.collections.applicabilitySets.some(({ id }) => id === applicabilitySetId))
        throw new Error(`Unknown Applicability Set ${applicabilitySetId}.`);
    if (!applications(page).some((application) => application.propertySetId === propertySetId))
        throw new Error(`${page.name} does not apply ${propertySet.name}.`);
    return updatePage(state, pageId, `Change ${propertySet.name} applicability on ${page.name}`, (candidate) => ({ ...candidate, propertySetApplications: applications(candidate).map((application) => { if (application.propertySetId !== propertySetId)
            return application; const next = { ...application, ...(applicabilitySetId ? { applicabilitySetId } : {}) }; if (!applicabilitySetId)
            delete next.applicabilitySetId; return next; }) }));
}
const schemaEvaluationInput = (entity) => entity ? {
    id: entity.id,
    revision: entity.canonicalSchema?.revision ?? entity.revision ?? entity.version ?? 0,
    canonicalSchema: entity.canonicalSchema,
    schemaConstraints: entity.schemaConstraints,
    requirements: entity.requirements,
    localSchemaContributions: entity.localSchemaContributions,
    onlyDefinedFields: entity.onlyDefinedFields,
    profileId: entity.profileId,
    profileIds: entity.profileIds,
} : undefined;
const referencedProfileIds = (entity) => unique([entity.profileId, ...(entity.profileIds ?? [])].filter((value) => typeof value === "string" && Boolean(value)));
const profileEvaluationInput = (profile, targets) => {
    if (!profile)
        return;
    const canonical = profile.canonicalSchema, recipes = targets.flatMap((target) => (target.profileInheritanceRecipes ?? []).filter(({ profileId }) => profileId === profile.id));
    if (!canonical || !recipes.length)
        return schemaEvaluationInput(profile);
    const contributions = recipes.map((recipe) => selectiveProfileContribution(canonical, recipe)), constraints = contributions.flatMap((contribution) => contribution.constraints).filter((constraint, index, all) => all.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(constraint)) === index), inheritanceConflicts = contributions.flatMap((contribution) => contribution.conflicts);
    return { id: profile.id, constraints, inheritanceConflicts };
};
export function pagePropertySetEvaluatorRevision(project, pageId) {
    const page = project.collections.pages.find(({ id }) => id === pageId), sets = new Map(project.collections.propertySets.map((set) => [set.id, set])), profiles = new Map(project.collections.profiles.map((profile) => [profile.id, profile])), applicabilitySets = new Map(project.collections.applicabilitySets.map((set) => [set.id, set])), applied = applications(page ?? { id: "", name: "" }), appliedSets = applied.flatMap(({ propertySetId }) => { const set = sets.get(propertySetId); return set ? [set] : []; }), profileTargets = [...(page ? [page] : []), ...appliedSets], profileIds = unique(profileTargets.flatMap(referencedProfileIds));
    return `page:${JSON.stringify({ page: schemaEvaluationInput(page), profiles: profileIds.map((profileId) => profileEvaluationInput(profiles.get(profileId), profileTargets.filter((target) => referencedProfileIds(target).includes(profileId)))), applications: applied.map(({ id, propertySetId, applicabilitySetId }) => { const applicability = applicabilitySetId ? applicabilitySets.get(applicabilitySetId) : undefined; return { id, propertySetId, propertySet: schemaEvaluationInput(sets.get(propertySetId)), ...(applicabilitySetId ? { applicabilitySetId, applicabilityRevision: applicability?.canonicalSchema?.revision ?? applicability?.revision ?? applicability?.version ?? 0, applicabilityCondition: applicability?.condition } : {}), }; }) })}`;
}
export function propertySetPages(project, propertySetId) { return project.collections.pages.filter((page) => applications(page).some((application) => application.propertySetId === propertySetId)); }
export function changePropertySetSchema(state, propertySetId, constraints) {
    const propertySet = state.project.collections.propertySets.find(({ id }) => id === propertySetId);
    if (!propertySet)
        throw new Error(`Unknown Property Set ${propertySetId}.`);
    return transactProject(state, `Change Property Set schema for ${propertySet.name}`, (project) => ({ ...project, collections: { ...project.collections, propertySets: project.collections.propertySets.map((candidate) => candidate.id === propertySetId ? { ...candidate, schemaConstraints: clone(constraints), compiledTargetsStale: true } : candidate) } }));
}
export function stagePropertySetParentAddition(state, propertySetId, profileId, constraint) {
    const propertySet = state.project.collections.propertySets.find(({ id }) => id === propertySetId), profile = state.project.collections.profiles.find(({ id }) => id === profileId), path = String(constraint.path ?? "");
    if (!propertySet)
        throw new Error(`Unknown Property Set ${propertySetId}.`);
    if (!profile)
        throw new Error(`Unknown Shared Profile ${profileId}.`);
    if (!path)
        throw new Error("A Parent addition requires a property path.");
    return transactProject(state, `Add ${path} to ${profile.name} for ${propertySet.name} review`, (project) => ({ ...project, collections: { ...project.collections, profiles: project.collections.profiles.map((candidate) => candidate.id === profileId ? { ...candidate, parentAdditions: [...(candidate.parentAdditions ?? []).filter((entry) => entry.path !== path), clone(constraint)] } : candidate), propertySets: project.collections.propertySets.map((candidate) => candidate.id === propertySetId ? { ...candidate, parentAdditions: [...(candidate.parentAdditions ?? []).filter((entry) => entry.path !== path), { ...clone(constraint), profileId }] } : candidate) } }));
}
export function includePropertySetParentAddition(state, propertySetId, path) {
    const propertySet = state.project.collections.propertySets.find(({ id }) => id === propertySetId), addition = propertySet?.parentAdditions?.find((entry) => entry.path === path);
    if (!propertySet)
        throw new Error(`Unknown Property Set ${propertySetId}.`);
    if (!addition)
        throw new Error(`Parent addition ${path} is unavailable.`);
    const { profileId: _profileId, ...constraint } = addition;
    return transactProject(state, `Include Parent addition ${path} in ${propertySet.name}`, (project) => ({ ...project, collections: { ...project.collections, propertySets: project.collections.propertySets.map((candidate) => candidate.id !== propertySetId ? candidate : { ...candidate, schemaConstraints: [...(candidate.schemaConstraints ?? []).filter((entry) => entry.path !== path), constraint], parentAdditions: (candidate.parentAdditions ?? []).filter((entry) => entry.path !== path), compiledTargetsStale: true }) } }));
}
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
    return saveGraph(state, flowId, section ? `Move ${frame.name} to Section ${section.name}` : `Move ${frame.name} outside Sections`, (next) => ({ ...next, pageFrames: (next.pageFrames ?? []).map((candidate) => candidate.id !== frameId ? candidate : section ? { ...candidate, sectionId: section.id } : withoutSection(candidate)) }));
}
export function addFlowPageFrameToSection(state, flowId, pageId, sectionId, id) {
    const graph = sectionGraph(state.project, flowId), page = state.project.collections.pages.find(({ id }) => id === pageId), section = sectionId ? graph.sections?.find(({ id }) => id === sectionId) : undefined;
    if (!page)
        throw new Error(`Unknown Page ${pageId}.`);
    if (sectionId && !section)
        throw new Error(`Unknown Flow Section ${sectionId}.`);
    const peers = (graph.pageFrames ?? []).filter((frame) => frame.sectionId === sectionId), position = { x: (section?.bounds.x ?? 24) + 40 + (peers.length % 3) * 220, y: (section?.bounds.y ?? 24) + 50 + Math.floor(peers.length / 3) * 120 };
    return saveGraph(state, flowId, section ? `Add ${page.name} to Section ${section.name}` : `Add ${page.name} outside Sections`, (next) => ({ ...next, pageFrames: [...(next.pageFrames ?? []), { id: id("flow-page-frame"), name: page.name, pageId: page.id, ...(section ? { sectionId: section.id } : {}), position }] }));
}
export function moveFlowPageFramePresentation(state, flowId, frameId, position) {
    const graph = sectionGraph(state.project, flowId), frame = graph.pageFrames?.find(({ id }) => id === frameId), section = position.sectionId ? graph.sections?.find(({ id }) => id === position.sectionId) : undefined;
    if (!frame)
        throw new Error(`Unknown Page frame ${frameId}.`);
    if (position.sectionId && !section)
        throw new Error(`Unknown Flow Section ${position.sectionId}.`);
    const nextPosition = { x: Math.round(position.x), y: Math.round(position.y) }, nextSectionId = position.sectionId === undefined ? frame.sectionId : section?.id;
    if (frame.position.x === nextPosition.x && frame.position.y === nextPosition.y && frame.sectionId === nextSectionId)
        return state;
    return saveGraph(state, flowId, `Move ${frame.name} Page frame`, (next) => ({ ...next, pageFrames: (next.pageFrames ?? []).map((candidate) => { if (candidate.id !== frameId)
            return candidate; const moved = { ...candidate, position: nextPosition, ...(nextSectionId ? { sectionId: nextSectionId } : {}) }; if (!nextSectionId)
            delete moved.sectionId; return moved; }) }));
}
export function connectFlowPageFrames(state, flowId, sourceId, targetId, id) {
    const graph = sectionGraph(state.project, flowId), source = graph.pageFrames?.find(({ id }) => id === sourceId), target = graph.pageFrames?.find(({ id }) => id === targetId);
    if (!source || !target || source.id === target.id)
        throw new Error("A Flow relationship requires two distinct Page frames.");
    return saveGraph(state, flowId, `Connect ${source.name} to ${target.name}`, (next) => ({ ...next, relationships: [...(next.relationships ?? []), { id: id("flow-relationship"), name: `${source.name} to ${target.name}`, sourceEndpoint: { kind: "page-frame", id: source.id }, targetEndpoint: { kind: "page-frame", id: target.id }, sourcePort: "right", targetPort: "left" }] }));
}
export function addFlowEventOccurrence(state, flowId, frameId, eventId, id) {
    const graph = sectionGraph(state.project, flowId), frame = graph.pageFrames?.find(({ id }) => id === frameId), event = state.project.collections.events.find(({ id }) => id === eventId);
    if (!frame)
        throw new Error(`Unknown Page frame ${frameId}.`);
    if (!event)
        throw new Error(`Unknown Event ${eventId}.`);
    const peers = (graph.occurrences ?? []).filter((occurrence) => occurrence.pageFrameId === frame.id);
    return saveGraph(state, flowId, `Add ${event.name} to ${frame.name}`, (next) => ({ ...next, occurrences: [...(next.occurrences ?? []), { id: id("flow-occurrence"), name: event.name, pageFrameId: frame.id, pageId: frame.pageId, eventId: event.id, obligation: "Required", minimum: 1, maximum: 1, position: { x: 24, y: 70 + peers.length * 28 } }] }));
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
const legacyFrameSize = (graph, frame) => { const children = (graph.occurrences ?? []).filter((occurrence) => occurrence.pageFrameId === frame.id); return { width: Math.max(190, ...children.map((occurrence) => Number(occurrence.position?.x ?? 24) + 190)), height: Math.max(108, ...children.map((occurrence) => Number(occurrence.position?.y ?? 70) + 110)) }; };
const normalizeLegacyFramePlacement = (graph, frame, sectionId, laneOffset, namedWidth, laneY) => {
    const legacy = frame, x = Number(frame.position.x ?? 24), absoluteX = legacy.freePageRegion === "before-lanes" ? x : legacy.freePageRegion === "after-lanes" ? laneOffset + namedWidth + x : laneOffset + x, absoluteY = legacy.freePageRegion ? frame.position.y : laneY + frame.position.y, next = { ...legacy, ...(sectionId ? { sectionId } : {}), position: { x: absoluteX, y: absoluteY } };
    delete next.pageGroupId;
    delete next.freePageRegion;
    return next;
};
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const expectedPropertySets = (before) => (legacyCollections(before).pageGroups ?? []).map((group) => { const next = clone(group); delete next.pageIds; delete next.applicabilitySetId; return next; });
const expectedApplications = (before, page) => { const legacy = legacyCollections(before).pageGroups ?? [], stored = Array.isArray(page.pageGroupIds) ? page.pageGroupIds.map(String) : [], members = legacy.filter((group) => (group.pageIds ?? []).map(String).includes(page.id)).map(({ id }) => id); return unique([...stored, ...members]).map((propertySetId) => { const group = legacy.find(({ id }) => id === propertySetId); return { name: group.name, propertySetId, ...(typeof group.applicabilitySetId === "string" ? { applicabilitySetId: group.applicabilitySetId } : {}) }; }); };
const applicationSemantics = (page) => applications(page).map(({ name, propertySetId, applicabilitySetId }) => ({ name, propertySetId, ...(applicabilitySetId ? { applicabilitySetId } : {}) }));
const projectedGeometry = (graph) => { const frames = (graph.pageFrames ?? []).map((frame) => { const size = legacyFrameSize(graph, frame); return { id: frame.id, x: Number(frame.position.x ?? 24), y: Number(frame.position.y), ...size }; }), byId = new Map(frames.map((frame) => [frame.id, frame])); return { frames, occurrences: (graph.occurrences ?? []).map((occurrence) => { const frame = byId.get(String(occurrence.pageFrameId)); return { id: occurrence.id, x: Number(frame?.x ?? 0) + Number(occurrence.position?.x ?? 24), y: Number(frame?.y ?? 0) + Number(occurrence.position?.y ?? 70) }; }), relationships: (graph.relationships ?? []).map((relationship) => { const source = byId.get(endpointId(relationship, "source") ?? ""), target = byId.get(endpointId(relationship, "target") ?? ""); return { id: relationship.id, x1: Number(source?.x ?? 0) + Number(source?.width ?? 0), y1: Number(source?.y ?? 0) + Number(source?.height ?? 0) / 2, x2: Number(target?.x ?? 0), y2: Number(target?.y ?? 0) + Number(target?.height ?? 0) / 2 }; }) }; };
export function verifyPropertySetFlowSectionUpgrade(before, after) {
    const propertySets = expectedPropertySets(before);
    if (!equal(propertySets, after.collections.propertySets))
        throw new Error("Property Set upgrade did not preserve contributors and effective schema inputs.");
    const beforePages = before.collections.pages, afterPages = after.collections.pages;
    if (beforePages.length !== afterPages.length)
        throw new Error("Property Set upgrade did not preserve Pages or their applications.");
    for (const page of beforePages) {
        const upgraded = afterPages.find(({ id }) => id === page.id), expected = expectedApplications(before, page);
        if (!upgraded || !equal(expected, applicationSemantics(upgraded)))
            throw new Error(`Property Set applications for Page ${page.id} changed order or applicability.`);
        const expectedPage = clone(page);
        delete expectedPage.pageGroupIds;
        delete expectedPage.propertySetApplications;
        const actualPage = clone(upgraded);
        delete actualPage.propertySetApplications;
        if (!equal(expectedPage, actualPage))
            throw new Error(`Page ${page.id} changed outside its Property Set applications.`);
    }
    const expectedAssignments = before.collections.assignments.map((assignment) => assignment.targetKind === "Page Group" ? { ...assignment, targetKind: "Property Set" } : assignment);
    if (!equal(expectedAssignments, after.collections.assignments))
        throw new Error("Property Set upgrade did not preserve Assignment targets.");
    for (const kind of Object.keys(before.collections)) {
        if (kind === "pages" || kind === "propertySets" || kind === "assignments" || kind === "pageGroups")
            continue;
        if (!equal(before.collections[kind], after.collections[kind]))
            throw new Error(`Property Set upgrade changed unrelated ${String(kind)} entities.`);
    }
    const legacyIdentities = new Set(), collectIdentities = (value) => { if (Array.isArray(value)) {
        value.forEach(collectIdentities);
        return;
    } if (!value || typeof value !== "object")
        return; for (const [key, nested] of Object.entries(value)) {
        if (key === "id" && typeof nested === "string")
            legacyIdentities.add(nested);
        collectIdentities(nested);
    } };
    collectIdentities(before);
    const sectionIdentities = new Set();
    for (const [flowId, beforeGraph] of Object.entries(graphs(before))) {
        const afterGraph = graphs(after)[flowId];
        if (!afterGraph)
            throw new Error(`Flow ${flowId} was not preserved.`);
        const laneIds = unique([...(beforeGraph.pageGroupIds ?? []), ...(beforeGraph.pageFrames ?? []).flatMap((frame) => typeof frame.pageGroupId === "string" ? [frame.pageGroupId] : [])]), hasBefore = (beforeGraph.pageFrames ?? []).some((frame) => frame.freePageRegion === "before-lanes"), laneOffset = hasBefore ? 200 : 0, namedFrames = (beforeGraph.pageFrames ?? []).filter((frame) => !frame.freePageRegion), namedWidth = Math.max(900, ...namedFrames.map((frame) => Number(frame.position.x ?? 40) + legacyFrameSize(beforeGraph, frame).width + 60)), laneLeft = laneOffset + 10, namedRight = Math.max(laneLeft + 700, ...namedFrames.map((frame) => laneOffset + Number(frame.position.x ?? 40) + legacyFrameSize(beforeGraph, frame).width + 60)), sections = afterGraph.sections ?? [];
        if (sections.length !== laneIds.length)
            throw new Error(`Flow ${flowId} Section geometry was not preserved.`);
        for (const section of sections) {
            if (typeof section.id !== "string" || !section.id.trim() || legacyIdentities.has(section.id) || sectionIdentities.has(section.id))
                throw new Error(`Flow ${flowId} did not receive new unique Section identities.`);
            sectionIdentities.add(section.id);
        }
        let nextY = 20;
        const lane = new Map();
        for (const [groupOrder, groupId] of laneIds.entries()) {
            const section = sections[groupOrder], group = (legacyCollections(before).pageGroups ?? []).find(({ id }) => id === groupId), frames = namedFrames.filter((frame) => frame.pageGroupId === groupId), height = Math.max(240, ...frames.map((frame) => Number(frame.position.y ?? 40) + legacyFrameSize(beforeGraph, frame).height + 40)), expected = { id: section?.id, name: group?.name ?? groupId, order: groupOrder, bounds: { x: laneLeft, y: nextY, width: namedRight - laneLeft, height } };
            if (!section || !equal(expected, section))
                throw new Error(`Flow ${flowId} Section geometry was not preserved.`);
            lane.set(groupId, { sectionId: section.id, y: nextY });
            nextY += height + 24;
        }
        const expectedFrames = (beforeGraph.pageFrames ?? []).map((frame) => { const groupId = typeof frame.pageGroupId === "string" ? frame.pageGroupId : undefined, placement = groupId ? lane.get(groupId) : undefined; return normalizeLegacyFramePlacement(beforeGraph, frame, placement?.sectionId, laneOffset, namedWidth, placement?.y ?? 20); });
        if (!equal(expectedFrames, afterGraph.pageFrames ?? []))
            throw new Error(`Flow ${flowId} Page-frame geometry was not preserved.`);
        if (!equal(beforeGraph.occurrences ?? [], afterGraph.occurrences ?? []) || !equal(beforeGraph.relationships ?? [], afterGraph.relationships ?? []))
            throw new Error(`Flow ${flowId} occurrence or relationship geometry and topology changed during upgrade.`);
        if (!equal(projectedGeometry({ ...beforeGraph, pageFrames: expectedFrames }), projectedGeometry(afterGraph)))
            throw new Error(`Flow ${flowId} projected occurrence or relationship geometry changed during upgrade.`);
    }
}
export function upgradePageGroupsToPropertySets(state, id) {
    const legacy = legacyCollections(state.project).pageGroups;
    if (!legacy)
        return state;
    return transactProject(state, "Upgrade Page Groups to Property Sets and Flow Sections", (project) => {
        const legacySets = legacyCollections(project).pageGroups ?? [], propertySets = legacySets.map((group) => { const next = clone(group); delete next.pageIds; delete next.applicabilitySetId; return next; }), applicabilityBySet = new Map(legacySets.map((group) => [group.id, typeof group.applicabilitySetId === "string" ? group.applicabilitySetId : undefined])), legacyMembers = new Map(legacySets.map((group) => [group.id, new Set((group.pageIds ?? []).map(String))]));
        const pages = project.collections.pages.map((page) => { const stored = Array.isArray(page.pageGroupIds) ? page.pageGroupIds.map(String) : [], fromGroups = legacySets.filter((group) => legacyMembers.get(group.id)?.has(page.id)).map(({ id }) => id), ordered = unique([...stored, ...fromGroups]), next = { ...page, propertySetApplications: ordered.map((propertySetId) => { const set = propertySets.find(({ id }) => id === propertySetId); return { id: id("property-set-application"), name: set.name, propertySetId, ...(applicabilityBySet.get(propertySetId) ? { applicabilitySetId: applicabilityBySet.get(propertySetId) } : {}) }; }) }; delete next.pageGroupIds; return next; });
        const documentationFlowGraphs = Object.fromEntries(Object.entries(graphs(project)).map(([flowId, graph]) => { const laneIds = unique([...(graph.pageGroupIds ?? []), ...(graph.pageFrames ?? []).flatMap((frame) => typeof frame.pageGroupId === "string" ? [frame.pageGroupId] : [])]), hasBefore = (graph.pageFrames ?? []).some((frame) => frame.freePageRegion === "before-lanes"), laneOffset = hasBefore ? 200 : 0, namedFrames = (graph.pageFrames ?? []).filter((frame) => !frame.freePageRegion), namedWidth = Math.max(900, ...namedFrames.map((frame) => Number(frame.position.x ?? 40) + legacyFrameSize(graph, frame).width + 60)), laneLeft = laneOffset + 10, namedRight = Math.max(laneLeft + 700, ...namedFrames.map((frame) => laneOffset + Number(frame.position.x ?? 40) + legacyFrameSize(graph, frame).width + 60)), sectionByLane = new Map(), laneYById = new Map(); let nextLaneY = 20; const sections = laneIds.map((groupId, order) => { const group = legacySets.find(({ id }) => id === groupId), sectionId = id("flow-section"), frames = namedFrames.filter((frame) => frame.pageGroupId === groupId), height = Math.max(240, ...frames.map((frame) => Number(frame.position.y ?? 40) + legacyFrameSize(graph, frame).height + 40)); sectionByLane.set(groupId, sectionId); laneYById.set(groupId, nextLaneY); const section = { id: sectionId, name: group?.name ?? groupId, order, bounds: { x: laneLeft, y: nextLaneY, width: namedRight - laneLeft, height } }; nextLaneY += height + 24; return section; }), pageFrames = (graph.pageFrames ?? []).map((frame) => { const legacyFrame = frame, groupId = typeof legacyFrame.pageGroupId === "string" ? legacyFrame.pageGroupId : undefined, sectionId = groupId ? sectionByLane.get(groupId) : undefined; return normalizeLegacyFramePlacement(graph, legacyFrame, sectionId, laneOffset, namedWidth, groupId ? laneYById.get(groupId) ?? 20 : 0); }), next = { ...graph, sections, pageFrames }; delete next.pageGroupIds; return [flowId, next]; })), assignments = project.collections.assignments.map((assignment) => assignment.targetKind === "Page Group" ? { ...assignment, targetKind: "Property Set" } : assignment), nextCollections = { ...project.collections, propertySets, pages, assignments };
        delete nextCollections.pageGroups;
        const next = { ...project, collections: nextCollections, documentationFlowGraphs, propertySetFlowSectionVersion: 1 };
        verifyPropertySetFlowSectionUpgrade(project, next);
        return next;
    });
}
//# sourceMappingURL=data-layer-property-set-flow-section.js.map