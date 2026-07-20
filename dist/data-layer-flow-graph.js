import { transactProject } from "./utilities/data-layer/schemas.js";
const clone = (value) => structuredClone(value);
const graphIndex = (project) => project.documentationFlowGraphs ?? {};
const storedGraph = (project, flowId) => { const stored = graphIndex(project)[flowId], legacy = project.collections.flows.find(({ id }) => id === flowId)?.pageGroupIds; return { pageGroupIds: [...(stored?.pageGroupIds ?? legacy ?? [])], pageFrames: stored?.pageFrames ?? [], occurrences: stored?.occurrences ?? [], relationships: stored?.relationships ?? [], ...(stored?.selectedItem ? { selectedItem: stored.selectedItem } : {}), ...(stored?.viewport ? { viewport: stored.viewport } : {}) }; };
const saveStoredGraph = (project, flowId, graph) => ({ ...project, documentationFlowGraphs: { ...graphIndex(project), [flowId]: graph } });
const normalizedOccurrence = (input) => {
    if (input.pageFrameId || input.pageGroupId || input.freePageFrameId || input.freePageFrame) {
        const { layout, x, y, fallbackRole, eventId, ...values } = clone(input);
        void layout;
        void fallbackRole;
        return { ...values, ...(eventId ? { eventId } : {}), position: { ...(input.freePageFrame ? { x: Number(x ?? input.layout?.x ?? 24) } : {}), y: Number(y ?? input.layout?.y ?? 70) }, optional: input.obligation === "Optional" };
    }
    const { layout, ...values } = clone(input), legacyLayout = layout ?? { lane: "Shipping", x: 230, y: Number(input.y ?? 70) };
    return { ...values, lane: legacyLayout.lane, position: { x: legacyLayout.x, y: legacyLayout.y }, optional: input.obligation === "Optional" };
};
export function documentaryFlowGraph(project, flowId) { const graph = storedGraph(project, flowId); return { pageGroupIds: graph.pageGroupIds, pageFrames: graph.pageFrames, occurrences: graph.occurrences, relationships: graph.relationships, ...(graph.selectedItem ? { selectedItem: graph.selectedItem } : {}), ...(graph.viewport ? { viewport: graph.viewport } : {}) }; }
export function flowPageGroupLaneIds(project, flowId) { return storedGraph(project, flowId).pageGroupIds; }
export function flowOccurrenceEventSchema(project, flowId, occurrenceId) {
    const occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId), event = project.collections.events.find(({ id }) => id === occurrence?.eventId);
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
    const graph = storedGraph(state.project, flowId), frame = input.pageFrameId ? graph.pageFrames.find(({ id }) => id === input.pageFrameId) : undefined;
    if (input.pageFrameId && (!frame || frame.pageId !== page.id || String(frame.pageGroupId ?? "") !== String(input.pageGroupId ?? "")))
        throw new Error("A Flow occurrence requires its existing containing Page frame.");
    if (input.pageGroupId) {
        const group = state.project.collections.pageGroups.find(({ id }) => id === input.pageGroupId), memberIds = group?.pageIds ?? [];
        if (!group || !flowPageGroupLaneIds(state.project, flowId).includes(group.id) || !memberIds.includes(page.id))
            throw new Error("A Flow occurrence requires a selected Page Group containing its Page.");
    }
    if (input.freePageFrameId) {
        const legacyFrame = graph.occurrences.find(({ id }) => id === input.freePageFrameId);
        if (!legacyFrame?.freePageFrame || legacyFrame.pageId !== page.id)
            throw new Error("A free-page interaction requires an existing free Page frame for its Page.");
    }
    const binding = (page.contextEventBindings ?? []).find(({ id }) => id === input.contextBindingId), eventId = input.contextBindingId ? binding?.eventId : input.eventId, event = state.project.collections.events.find(({ id }) => id === eventId);
    if (input.contextBindingId && !binding)
        throw new Error("A page-context occurrence requires an existing Page context-event binding.");
    if (!event)
        throw new Error("A Flow occurrence requires an existing Event.");
    if (input.minimum < 0 || input.maximum < input.minimum)
        throw new Error("Flow occurrence bounds are invalid.");
    if (input.contextBindingId) {
        const { eventId: discardedEventId, ...semantic } = input;
        void discardedEventId;
        return { ...semantic, name: input.name.trim() };
    }
    const authoritative = event.role === "context-setting" || event.role === "interaction", role = (authoritative ? event.role : input.role ?? input.fallbackRole ?? "interaction"), { fallbackRole, ...values } = input;
    void fallbackRole;
    return { ...values, name: input.name.trim(), role };
}
export function inspectPageFrameDrop(project, flowId, pageId, targetPageGroupId) {
    const page = project.collections.pages.find(({ id }) => id === pageId), group = project.collections.pageGroups.find(({ id }) => id === targetPageGroupId), selected = flowPageGroupLaneIds(project, flowId).includes(targetPageGroupId), member = Boolean(group && (group.pageIds ?? []).includes(pageId)), rejected = !page || !group || !selected || !member;
    return { rejected, message: rejected ? `${page?.name ?? pageId} belongs to ${project.collections.pageGroups.find((candidate) => (candidate.pageIds ?? []).includes(pageId))?.name ?? "no selected Page Group"}, not ${group?.name ?? targetPageGroupId}.` : `${page.name} can be placed in ${group.name}.`, guidance: `?kind=pages&entity=${encodeURIComponent(pageId)}&field=pageGroupIds` };
}
export function addFlowPageFrame(state, flowId, input, id) {
    const review = inspectPageFrameDrop(state.project, flowId, input.pageId, input.pageGroupId);
    if (review.rejected)
        return state;
    const graph = storedGraph(state.project, flowId);
    if (graph.pageFrames.some(({ pageId, pageGroupId }) => pageId === input.pageId && pageGroupId === input.pageGroupId))
        return state;
    return transactProject(state, "Add Flow Page frame", (project) => { const current = storedGraph(project, flowId), frame = { id: id("flow-page-frame"), pageId: input.pageId, pageGroupId: input.pageGroupId, position: { y: Math.max(40, Math.round(input.y)) } }; return saveStoredGraph(project, flowId, { ...current, pageFrames: [...current.pageFrames, frame] }); });
}
export function removeFlowPageFrame(state, flowId, pageFrameId) {
    const graph = storedGraph(state.project, flowId), frame = graph.pageFrames.find(({ id }) => id === pageFrameId);
    if (!frame)
        return state;
    const occurrenceIds = new Set(graph.occurrences.filter((occurrence) => occurrence.pageFrameId === pageFrameId).map(({ id }) => id));
    return transactProject(state, "Remove Flow Page frame", (project) => { const current = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...current, pageFrames: current.pageFrames.filter(({ id }) => id !== pageFrameId), occurrences: current.occurrences.filter((occurrence) => occurrence.pageFrameId !== pageFrameId), relationships: current.relationships.filter(({ sourceNodeId, targetNodeId }) => !occurrenceIds.has(sourceNodeId) && !occurrenceIds.has(targetNodeId)) }); });
}
export function addPageContextOccurrence(state, flowId, input, id) {
    const frame = storedGraph(state.project, flowId).pageFrames.find(({ id }) => id === input.pageFrameId), page = state.project.collections.pages.find(({ id: pageId }) => pageId === frame?.pageId), binding = (page?.contextEventBindings ?? []).find(({ id: bindingId }) => bindingId === input.contextBindingId);
    if (!frame || !page || !binding)
        throw new Error("A Page-context occurrence requires an existing Page frame and binding.");
    return addGraphOccurrence(state, flowId, { name: String(binding.name), pageFrameId: frame.id, ...(frame.pageGroupId ? { pageGroupId: frame.pageGroupId } : {}), pageId: page.id, contextBindingId: binding.id, obligation: "Required", minimum: 1, maximum: 1, y: input.y }, id);
}
export function addEventOccurrenceToPage(state, flowId, input, id) { return addGraphOccurrence(state, flowId, input, id); }
export function reorderFlowPageGroupLane(state, flowId, pageGroupId, delta) { const lanes = [...flowPageGroupLaneIds(state.project, flowId)], from = lanes.indexOf(pageGroupId); if (from < 0)
    return state; const to = Math.max(0, Math.min(lanes.length - 1, from + delta)); if (from === to)
    return state; lanes.splice(from, 1); lanes.splice(to, 0, pageGroupId); return setFlowPageGroupLanes(state, flowId, lanes); }
export function saveFlowViewState(state, flowId, view) { const graph = storedGraph(state.project, flowId); if (JSON.stringify({ selectedItem: graph.selectedItem, viewport: graph.viewport }) === JSON.stringify(view))
    return state; return transactProject(state, "Save Flow canvas view", (project) => saveStoredGraph(project, flowId, { ...storedGraph(project, flowId), ...clone(view) })); }
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
        return transactProject(state, `Move Flow occurrence ${occurrenceId}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, occurrences: graph.occurrences.map((item) => item.id === occurrenceId ? { ...item, position: { ...(item.freePageFrame && typeof item.position?.x === "number" ? { x: item.position.x } : {}), y: layout.y } } : item) }); });
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
    const removed = new Set(graph.pageGroupIds.filter((groupId) => !pageGroupIds.includes(groupId))), affectedFrame = graph.pageFrames.find((frame) => removed.has(String(frame.pageGroupId ?? ""))), affectedOccurrence = graph.occurrences.find((occurrence) => removed.has(String(occurrence.pageGroupId ?? ""))), affectedPage = state.project.collections.pages.find(({ id }) => id === (affectedFrame?.pageId ?? affectedOccurrence?.pageId));
    if (affectedFrame || affectedOccurrence)
        throw new Error(`${affectedPage?.name ?? affectedOccurrence?.name ?? "Contained Page"} must be reassigned or removed. Move Page frame or Remove Page frame first.`);
    if (JSON.stringify(graph.pageGroupIds) === JSON.stringify(pageGroupIds) && !("pageGroupIds" in flow))
        return state;
    return transactProject(state, "Set Flow Page Group lanes", (project) => { const current = storedGraph(project, flowId); return saveStoredGraph({ ...project, collections: { ...project.collections, flows: project.collections.flows.map((candidate) => { if (candidate.id !== flowId)
                return candidate; const { pageGroupIds: discarded, ...stored } = candidate; void discarded; return stored; }) } }, flowId, { ...current, pageGroupIds: [...pageGroupIds] }); });
}
export function applyFlowPageGroupLaneSelection(state, flowId, pageGroupIds) { return pageGroupIds === undefined ? state : setFlowPageGroupLanes(state, flowId, pageGroupIds); }
export function inspectOccurrenceContainmentMove(project, flowId, occurrenceId, targetPageGroupId, targetPageId) {
    const flow = project.collections.flows.find(({ id }) => id === flowId), occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId), sourcePage = project.collections.pages.find(({ id }) => id === occurrence?.pageId), targetPage = project.collections.pages.find(({ id }) => id === targetPageId), targetGroup = project.collections.pageGroups.find(({ id }) => id === targetPageGroupId), rejected = !occurrence || occurrence.pageId !== targetPageId || occurrence.pageGroupId !== targetPageGroupId;
    return { rejected, message: rejected ? `${occurrence?.name ?? occurrenceId} remains inside ${sourcePage?.name ?? occurrence?.pageId ?? "its Page"}; it cannot move into ${targetPage?.name ?? targetPageId} in ${targetGroup?.name ?? targetPageGroupId} within ${flow?.name ?? flowId}. Event occurrences cannot cross Page or Page Group containment boundaries.` : "The occurrence remains in its current Page frame.", guidance: "Add the predefined Event from the component palette to create a distinct occurrence in another Page frame." };
}
export function addInteractionOccurrenceToPage(state, flowId, input, id) { return addGraphOccurrence(state, flowId, input, id); }
export function addFreePageFrame(state, flowId, input, id) {
    const graph = storedGraph(state.project, flowId), page = state.project.collections.pages.find(({ id }) => id === input.pageId), grouped = state.project.collections.pageGroups.some((group) => (group.pageIds ?? []).includes(input.pageId));
    if (!page || grouped || graph.pageFrames.some(({ pageId, freePageRegion }) => pageId === input.pageId && Boolean(freePageRegion)))
        return state;
    return transactProject(state, "Add free Flow Page frame", (project) => { const current = storedGraph(project, flowId), frame = { id: id("flow-page-frame"), pageId: input.pageId, freePageRegion: input.region, position: { x: Math.max(12, Math.round(input.x)), y: Math.max(55, Math.round(input.y)) } }; return saveStoredGraph(project, flowId, { ...current, pageFrames: [...current.pageFrames, frame] }); });
}
export function addUngroupedPageFrame(state, flowId, input, id) { return addFreePageFrame(state, flowId, { ...input, region: "after-lanes", x: 24 }, id); }
export function inspectFreePageEdgeMove(project, flowId, occurrenceId, targetRegion) {
    const occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId), page = project.collections.pages.find(({ id }) => id === occurrence?.pageId), flow = project.collections.flows.find(({ id }) => id === flowId), rejected = !occurrence?.freePageFrame;
    return { rejected, message: rejected ? `${page?.name ?? occurrence?.name ?? occurrenceId} remains in its Page Group lane in ${flow?.name ?? flowId}; it cannot move to ${targetRegion} without explicit membership changes.` : `${page?.name ?? occurrence.name} can move to ${targetRegion} without changing membership.`, guidance: `?kind=pages&entity=${encodeURIComponent(String(occurrence?.pageId ?? ""))}&field=pageGroupIds` };
}
export function inspectUngroupedPageDrop(project, flowId, pageId, targetPageGroupId) { const page = project.collections.pages.find(({ id }) => id === pageId), group = project.collections.pageGroups.find(({ id }) => id === targetPageGroupId), flow = project.collections.flows.find(({ id }) => id === flowId); return { rejected: true, message: `${page?.name ?? pageId} is a free Page and cannot be dropped over ${group?.name ?? targetPageGroupId} in ${flow?.name ?? flowId} without explicit membership.`, guidance: `?kind=pages&entity=${encodeURIComponent(pageId)}&field=pageGroupIds` }; }
export function moveFreePageFrame(state, flowId, frameId, presentation) {
    const frame = storedGraph(state.project, flowId).pageFrames.find(({ id }) => id === frameId), position = frame?.position;
    if (!frame?.freePageRegion)
        return state;
    const next = { region: presentation.region, x: Math.max(12, Math.round(presentation.x)), y: Math.max(55, Math.round(presentation.y)) };
    if (frame.freePageRegion === next.region && position?.x === next.x && position.y === next.y)
        return state;
    return transactProject(state, `Move free Page frame ${frameId}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, pageFrames: graph.pageFrames.map((item) => item.id === frameId ? { ...item, freePageRegion: next.region, position: { x: next.x, y: next.y } } : item) }); });
}
export function reviewLegacyFlowContextMigration(project, flowId) {
    void flowId;
    const items = [], blockers = [];
    for (const [candidateFlowId, graph] of Object.entries(graphIndex(project))) {
        const flow = project.collections.flows.find(({ id }) => id === candidateFlowId), flowName = flow?.name ?? "Unknown Flow";
        for (const occurrence of graph.occurrences) {
            if (!occurrence.contextBindingId)
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
    return transactProject(state, "Migrate legacy Flow Page context bindings", (project) => { const pagesById = new Map(project.collections.pages.map((page) => [page.id, page])), eventsById = new Map(project.collections.events.map((event) => [event.id, event])), documentationFlowGraphs = Object.fromEntries(Object.entries(graphIndex(project)).map(([candidateFlowId, graph]) => [candidateFlowId, { ...graph, occurrences: graph.occurrences.map((occurrence) => { if (!occurrence.contextBindingId)
                return occurrence; const page = pagesById.get(String(occurrence.pageId)), binding = (page?.contextEventBindings ?? []).find(({ id }) => id === occurrence.contextBindingId), event = eventsById.get(String(binding?.eventId ?? "")); if (!binding || !event)
                return occurrence; const { contextBindingId, eventId: discardedEventId, role: discardedRole, trigger: discardedTrigger, ...stored } = occurrence; void contextBindingId; void discardedEventId; void discardedRole; void discardedTrigger; const authoritative = event.role === "context-setting" || event.role === "interaction"; return { ...stored, eventId: event.id, role: authoritative ? event.role : "context-setting", trigger: String(binding.trigger ?? binding.name ?? "") }; }) }])), pages = project.collections.pages.map((page) => { if (!("contextEventBindings" in page))
        return page; const { contextEventBindings, ...stored } = page; void contextEventBindings; return stored; }); return { ...project, collections: { ...project.collections, pages }, documentationFlowGraphs }; });
}
export function saveGraphRelationship(state, flowId, fromOccurrenceId, input, id) {
    const graph = storedGraph(state.project, flowId), occurrenceIds = new Set(graph.occurrences.map(({ id }) => id));
    if (fromOccurrenceId === input.toStepId)
        return state;
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
    const laneIds = flowPageGroupLaneIds(project, flowId), lanes = laneIds.map((groupId) => project.collections.pageGroups.find(({ id }) => id === groupId)).filter((group) => Boolean(group)).map(clone), stored = storedGraph(project, flowId), freeFrames = stored.pageFrames.filter(({ freePageRegion }) => Boolean(freePageRegion)), legacyFreeFrames = stored.occurrences.filter(({ freePageFrame }) => freePageFrame), hasBefore = [...freeFrames, ...legacyFreeFrames].some(({ freePageRegion }) => freePageRegion === "before-lanes"), laneOffset = hasBefore ? 200 : 0, freeFrameById = new Map([...freeFrames, ...legacyFreeFrames].map((frame) => [frame.id, frame]));
    const nodes = stored.occurrences.filter(({ freePageFrame }) => !freePageFrame).map((occurrence) => {
        const page = project.collections.pages.find(({ id }) => id === occurrence.pageId), binding = (page?.contextEventBindings ?? []).find(({ id }) => id === occurrence.contextBindingId), eventId = String(binding?.eventId ?? occurrence.eventId ?? ""), event = project.collections.events.find(({ id }) => id === eventId), position = occurrence.position, pageGroupId = typeof occurrence.pageGroupId === "string" ? occurrence.pageGroupId : undefined, parentFree = freeFrameById.get(String(occurrence.pageFrameId ?? occurrence.freePageFrameId ?? "")), freePageRegion = (parentFree?.freePageRegion ?? "after-lanes"), laneIndex = pageGroupId ? laneIds.indexOf(pageGroupId) : -1, eventRole = event?.role, role = (occurrence.role ?? (binding ? "context-setting" : eventRole === "context-setting" || eventRole === "interaction" ? eventRole : "interaction")), relativeX = Number(parentFree ? parentFree.position.x ?? 24 : 24) + 10, freeX = freePageRegion === "before-lanes" ? relativeX : laneOffset + laneIds.length * 220 + relativeX, layout = position && typeof position.y === "number" ? { lane: parentFree ? freePageRegion : laneIndex >= 0 ? lanes[laneIndex]?.name ?? pageGroupId : typeof occurrence.lane === "string" ? occurrence.lane : "Shipping", x: parentFree ? freeX : laneIndex >= 0 ? laneOffset + 30 + laneIndex * 200 : typeof position.x === "number" ? position.x : 230, y: position.y } : undefined;
        return { id: occurrence.id, name: String(event?.name ?? occurrence.name), eventId, pageId: String(occurrence.pageId ?? ""), ...(occurrence.pageFrameId ? { pageFrameId: String(occurrence.pageFrameId) } : {}), ...(pageGroupId ? { pageGroupId } : {}), ...(parentFree ? { freePageFrameId: parentFree.id, freePageRegion } : {}), ...(binding ? { contextBindingId: binding.id } : {}), occurrenceType: "interaction", role, ...(typeof occurrence.trigger === "string" ? { trigger: occurrence.trigger } : binding?.trigger ? { trigger: String(binding.trigger) } : {}), obligation: (typeof occurrence.obligation === "string" ? occurrence.obligation : occurrence.optional ? "Optional" : "Required"), expectedMinimum: Number(occurrence.minimum ?? 1), ...(occurrence.maximum !== undefined ? { expectedMaximum: Number(occurrence.maximum) } : {}), ...(layout ? { layout } : {}) };
    }), relationships = stored.relationships.map((edge) => ({ id: edge.id, sourceNodeId: String(edge.sourceNodeId ?? ""), targetNodeId: String(edge.targetNodeId ?? ""), kind: (["expected-next", "alternative", "parallel", "merge"].includes(String(edge.kind)) ? edge.kind : "expected-next"), ...(typeof edge.group === "string" ? { group: edge.group } : {}), ...(typeof edge.label === "string" ? { label: edge.label } : {}), ...(typeof edge.documentationCondition === "string" ? { documentationCondition: edge.documentationCondition } : {}), ...(typeof edge.expectation === "string" ? { expectation: edge.expectation } : {}) })), graph = { id: flow.id, name: flow.name, purpose: String(flow.purpose ?? flow.description ?? ""), nodes, relationships }, catalog = { pageGroups: project.collections.pageGroups.map((group) => clone(group)), pages: project.collections.pages.map((page) => clone(page)), events: project.collections.events.map((event) => clone(event)) };
    return { projectName: project.name, lanes, graph, catalog, diagnostics: inspectFlowGraph(graph, catalog) };
}
//# sourceMappingURL=data-layer-flow-graph.js.map