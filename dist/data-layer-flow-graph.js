import { transactProject } from "./utilities/data-layer/schemas.js";
const clone = (value) => structuredClone(value);
const graphIndex = (project) => project.documentationFlowGraphs ?? {};
const storedGraph = (project, flowId) => { const stored = graphIndex(project)[flowId], legacy = project.collections.flows.find(({ id }) => id === flowId)?.pageGroupIds; return { pageGroupIds: [...(stored?.pageGroupIds ?? legacy ?? [])], occurrences: stored?.occurrences ?? [], relationships: stored?.relationships ?? [] }; };
const saveStoredGraph = (project, flowId, graph) => ({ ...project, documentationFlowGraphs: { ...graphIndex(project), [flowId]: graph } });
const normalizedOccurrence = (input) => {
    if (input.pageGroupId || input.freePageFrameId || input.freePageFrame) {
        const { layout, y, fallbackRole, eventId, ...values } = clone(input);
        void layout;
        void fallbackRole;
        return { ...values, ...(eventId ? { eventId } : {}), position: { y: Number(y ?? input.layout?.y ?? 70) }, optional: input.obligation === "Optional" };
    }
    const { layout, ...values } = clone(input), legacyLayout = layout ?? { lane: "Shipping", x: 230, y: Number(input.y ?? 70) };
    return { ...values, lane: legacyLayout.lane, position: { x: legacyLayout.x, y: legacyLayout.y }, optional: input.obligation === "Optional" };
};
export function documentaryFlowGraph(project, flowId) { const graph = storedGraph(project, flowId); return { pageGroupIds: graph.pageGroupIds, occurrences: graph.occurrences, relationships: graph.relationships }; }
export function flowPageGroupLaneIds(project, flowId) { return storedGraph(project, flowId).pageGroupIds; }
export function flowOccurrenceEventSchema(project, flowId, occurrenceId) {
    const occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId), page = project.collections.pages.find(({ id }) => id === occurrence?.pageId), binding = (page?.contextEventBindings ?? []).find(({ id }) => id === occurrence?.contextBindingId), event = project.collections.events.find(({ id }) => id === (binding?.eventId ?? occurrence?.eventId));
    return event?.schemaDraftId ?? event?.schemaId;
}
function validOccurrence(state, flowId, input) {
    const flow = state.project.collections.flows.find(({ id }) => id === flowId);
    if (!flow)
        throw new Error("A documentary Flow graph requires an existing Flow.");
    if (!input.name.trim())
        throw new Error("A Flow occurrence requires a name.");
    const page = state.project.collections.pages.find(({ id }) => id === input.pageId);
    if (!page)
        throw new Error("A Flow occurrence requires an existing Page.");
    if (input.pageGroupId || input.freePageFrameId || input.freePageFrame) {
        if (input.pageGroupId) {
            const group = state.project.collections.pageGroups.find(({ id }) => id === input.pageGroupId), laneIds = flowPageGroupLaneIds(state.project, flowId), memberIds = group?.pageIds ?? [];
            if (!group || !laneIds.includes(group.id) || !memberIds.includes(page.id))
                throw new Error("A Flow occurrence requires a selected Page Group containing its Page.");
        }
        else if (input.freePageFrameId) {
            const frame = storedGraph(state.project, flowId).occurrences.find(({ id }) => id === input.freePageFrameId);
            if (!frame?.freePageFrame || frame.pageId !== page.id)
                throw new Error("An ungrouped interaction requires an existing free Page frame for its Page.");
        }
        else {
            const selectedGroups = new Set(flowPageGroupLaneIds(state.project, flowId)), grouped = state.project.collections.pageGroups.some((group) => selectedGroups.has(group.id) && (group.pageIds ?? []).includes(page.id));
            if (grouped)
                throw new Error("A Page contained by a selected Page Group cannot remain an ungrouped entry Page.");
        }
        const binding = (page.contextEventBindings ?? []).find(({ id }) => id === input.contextBindingId), eventId = input.contextBindingId ? binding?.eventId : input.eventId;
        if (input.contextBindingId && !binding)
            throw new Error("A page-context occurrence requires an existing Page context-event binding.");
        if (!eventId || !state.project.collections.events.some(({ id }) => id === eventId))
            throw new Error("A Flow occurrence requires an existing Event or context-event binding.");
        if (input.minimum < 0 || input.maximum < input.minimum)
            throw new Error("Flow occurrence bounds are invalid.");
        if (input.contextBindingId) {
            const { eventId: discardedEventId, ...semantic } = input;
            void discardedEventId;
            return { ...semantic, name: input.name.trim() };
        }
        return { ...input, name: input.name.trim() };
    }
    const event = state.project.collections.events.find(({ id }) => id === input.eventId);
    if (!event)
        throw new Error("A Flow occurrence requires an existing Event.");
    if (input.minimum < 0 || input.maximum < input.minimum)
        throw new Error("Flow occurrence bounds are invalid.");
    const { fallbackRole, ...values } = input, authoritative = event.role === "context-setting" || event.role === "interaction";
    return { ...values, name: input.name.trim(), ...(!authoritative && fallbackRole ? { fallbackRole } : {}) };
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
    if (!occurrence)
        return state;
    if (occurrence.pageGroupId || occurrence.freePageFrameId || occurrence.freePageFrame) {
        const requestedGroup = "pageGroupId" in layout ? layout.pageGroupId : undefined;
        if (requestedGroup && requestedGroup !== occurrence.pageGroupId || Boolean(occurrence.freePageFrameId || occurrence.freePageFrame) && requestedGroup)
            return state;
        if (position?.y === layout.y)
            return state;
        return transactProject(state, `Move Flow occurrence ${occurrenceId}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, occurrences: graph.occurrences.map((item) => item.id === occurrenceId ? { ...item, position: { y: layout.y } } : item) }); });
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
    return transactProject(state, `Remove Flow occurrence ${occurrenceId}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, occurrences: graph.occurrences.filter(({ id }) => id !== occurrenceId), relationships: graph.relationships.filter(({ sourceNodeId, targetNodeId }) => sourceNodeId !== occurrenceId && targetNodeId !== occurrenceId) }); });
}
export function setFlowPageGroupLanes(state, flowId, pageGroupIds) {
    const flow = state.project.collections.flows.find(({ id }) => id === flowId), known = new Set(state.project.collections.pageGroups.map(({ id }) => id)), graph = storedGraph(state.project, flowId);
    if (!flow)
        throw new Error(`Unknown Flow ${flowId}`);
    if (new Set(pageGroupIds).size !== pageGroupIds.length || pageGroupIds.some((groupId) => !known.has(groupId)))
        throw new Error("Flow lanes require distinct existing Page Group references.");
    const removed = new Set(graph.pageGroupIds.filter((groupId) => !pageGroupIds.includes(groupId))), affected = graph.occurrences.find((occurrence) => removed.has(String(occurrence.pageGroupId ?? "")));
    if (affected)
        throw new Error(`${affected.name} must be reassigned or removed before removing its Page Group lane.`);
    if (JSON.stringify(graph.pageGroupIds) === JSON.stringify(pageGroupIds) && !("pageGroupIds" in flow))
        return state;
    return transactProject(state, "Set Flow Page Group lanes", (project) => { const current = storedGraph(project, flowId); return saveStoredGraph({ ...project, collections: { ...project.collections, flows: project.collections.flows.map((candidate) => { if (candidate.id !== flowId)
                return candidate; const { pageGroupIds: discarded, ...stored } = candidate; void discarded; return stored; }) } }, flowId, { ...current, pageGroupIds: [...pageGroupIds] }); });
}
export function inspectOccurrenceContainmentMove(project, flowId, occurrenceId, targetPageGroupId, targetPageId) {
    const flow = project.collections.flows.find(({ id }) => id === flowId), occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId), sourcePage = project.collections.pages.find(({ id }) => id === occurrence?.pageId), targetPage = project.collections.pages.find(({ id }) => id === targetPageId), targetGroup = project.collections.pageGroups.find(({ id }) => id === targetPageGroupId), rejected = !occurrence || occurrence.pageId !== targetPageId || occurrence.pageGroupId !== targetPageGroupId;
    return { rejected, message: rejected ? `${occurrence?.name ?? occurrenceId} remains inside ${sourcePage?.name ?? occurrence?.pageId ?? "its Page"}; it cannot move into ${targetPage?.name ?? targetPageId} in ${targetGroup?.name ?? targetPageGroupId} within ${flow?.name ?? flowId}. Event occurrences cannot cross Page or Page Group containment boundaries.` : "The occurrence remains in its current Page frame.", guidance: "Add the predefined Event from the component palette to create a distinct occurrence in another Page frame." };
}
export function addInteractionOccurrenceToPage(state, flowId, input, id) { return addGraphOccurrence(state, flowId, input, id); }
export function addUngroupedPageFrame(state, flowId, input, id) {
    const flow = state.project.collections.flows.find(({ id }) => id === flowId), page = state.project.collections.pages.find(({ id }) => id === input.pageId), binding = (page?.contextEventBindings ?? []).find(({ id }) => id === input.contextBindingId);
    if (!flow || !page || !binding)
        throw new Error("A free Page frame requires an existing Flow, Page, and Page context binding.");
    const selectedGroups = new Set(flowPageGroupLaneIds(state.project, flowId)), grouped = state.project.collections.pageGroups.some((group) => selectedGroups.has(group.id) && (group.pageIds ?? []).includes(page.id));
    if (grouped)
        throw new Error("A Page already contained by a selected Page Group cannot become an ungrouped entry Page.");
    return transactProject(state, `Add ${page.name} ungrouped entry Page`, (project) => { const graph = storedGraph(project, flowId), frame = { id: id("flow-page-frame"), name: input.name, pageId: page.id, contextBindingId: binding.id, freePageFrame: true, obligation: "Required", minimum: 1, maximum: 1, optional: false, position: { y: input.y } }; return saveStoredGraph(project, flowId, { ...graph, occurrences: [...graph.occurrences, frame] }); });
}
export function inspectUngroupedPageDrop(project, flowId, pageId, targetPageGroupId) {
    const page = project.collections.pages.find(({ id }) => id === pageId), group = project.collections.pageGroups.find(({ id }) => id === targetPageGroupId), flow = project.collections.flows.find(({ id }) => id === flowId);
    return { rejected: true, message: `${page?.name ?? pageId} is an ungrouped entry Page and cannot be dropped over ${group?.name ?? targetPageGroupId} in ${flow?.name ?? flowId} without explicit membership.`, guidance: `?kind=pages&entity=${encodeURIComponent(pageId)}&field=pageGroupIds` };
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
    const laneIds = flowPageGroupLaneIds(project, flowId), lanes = laneIds.map((groupId) => project.collections.pageGroups.find(({ id }) => id === groupId)).filter((group) => Boolean(group)).map(clone), stored = storedGraph(project, flowId);
    const nodes = stored.occurrences.map((occurrence, index) => {
        const page = project.collections.pages.find(({ id }) => id === occurrence.pageId), binding = (page?.contextEventBindings ?? []).find(({ id }) => id === occurrence.contextBindingId), eventId = String(binding?.eventId ?? occurrence.eventId ?? ""), event = project.collections.events.find(({ id }) => id === eventId), position = occurrence.position, pageGroupId = typeof occurrence.pageGroupId === "string" ? occurrence.pageGroupId : undefined, freePageFrame = Boolean(occurrence.freePageFrame || occurrence.freePageFrameId), laneIndex = pageGroupId ? laneIds.indexOf(pageGroupId) : -1, eventRole = event?.role, role = binding ? "context-setting" : pageGroupId || freePageFrame ? "interaction" : eventRole === "context-setting" || eventRole === "interaction" ? eventRole : occurrence.fallbackRole === "context-setting" ? "context-setting" : "interaction", layout = position && typeof position.y === "number" ? { lane: freePageFrame ? "Ungrouped entry pages" : laneIndex >= 0 ? lanes[laneIndex]?.name ?? pageGroupId : typeof occurrence.lane === "string" ? occurrence.lane : "Shipping", x: freePageFrame ? 30 + laneIds.length * 200 : laneIndex >= 0 ? 30 + laneIndex * 200 : typeof position.x === "number" ? position.x : 230, y: position.y } : undefined;
        return { id: occurrence.id, name: occurrence.name, eventId, pageId: String(occurrence.pageId ?? ""), ...(pageGroupId ? { pageGroupId } : {}), ...(occurrence.freePageFrameId ? { freePageFrameId: String(occurrence.freePageFrameId) } : {}), ...(occurrence.freePageFrame ? { freePageFrame: true } : {}), ...(binding ? { contextBindingId: binding.id, occurrenceType: "page-context" } : { ...(pageGroupId || freePageFrame ? { occurrenceType: "interaction" } : {}) }), role, obligation: (typeof occurrence.obligation === "string" ? occurrence.obligation : occurrence.optional ? "Optional" : "Required"), expectedMinimum: Number(occurrence.minimum ?? 1), ...(occurrence.maximum !== undefined ? { expectedMaximum: Number(occurrence.maximum) } : {}), ...(layout ? { layout } : {}) };
    }), relationships = stored.relationships.map((edge) => ({ id: edge.id, sourceNodeId: String(edge.sourceNodeId ?? ""), targetNodeId: String(edge.targetNodeId ?? ""), kind: (["expected-next", "alternative", "parallel", "merge"].includes(String(edge.kind)) ? edge.kind : "expected-next"), ...(typeof edge.group === "string" ? { group: edge.group } : {}), ...(typeof edge.label === "string" ? { label: edge.label } : {}), ...(typeof edge.documentationCondition === "string" ? { documentationCondition: edge.documentationCondition } : {}), ...(typeof edge.expectation === "string" ? { expectation: edge.expectation } : {}) })), graph = { id: flow.id, name: flow.name, purpose: String(flow.purpose ?? flow.description ?? ""), nodes, relationships }, catalog = { pageGroups: project.collections.pageGroups.map((group) => clone(group)), pages: project.collections.pages.map((page) => clone(page)), events: project.collections.events.map((event) => clone(event)) };
    return { projectName: project.name, lanes, graph, catalog, diagnostics: inspectFlowGraph(graph, catalog) };
}
//# sourceMappingURL=data-layer-flow-graph.js.map