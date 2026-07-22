import { orderedPageGroupIds, requiresPageGroupMembershipMigration } from "./utilities/data-layer/page-group-membership.js";
import { canonicalSchemaWithConstraint, compileLayeredSchema, createCanonicalSchema, layeredContributorPath, layeredContributorsForPath, migrateLegacyProfile, transactProject, validateLayeredObservation } from "./utilities/data-layer/schemas.js";
const clone = (value) => structuredClone(value);
const graphIndex = (project) => project.documentationFlowGraphs ?? {};
const storedGraph = (project, flowId) => { const stored = graphIndex(project)[flowId], legacy = project.collections.flows.find(({ id }) => id === flowId)?.pageGroupIds; return { pageGroupIds: [...(stored?.pageGroupIds ?? legacy ?? [])], pageFrames: stored?.pageFrames ?? [], occurrences: stored?.occurrences ?? [], relationships: stored?.relationships ?? [], ...(stored?.selectedItem ? { selectedItem: stored.selectedItem } : {}), ...(stored?.viewport ? { viewport: stored.viewport } : {}) }; };
const saveStoredGraph = (project, flowId, graph) => { const { selectedItem: _selectedItem, viewport: _viewport, ...semanticGraph } = graph; return { ...project, documentationFlowGraphs: { ...graphIndex(project), [flowId]: semanticGraph } }; };
const legacyBindingOccurrence = (occurrence) => typeof occurrence.contextBindingId === "string" && Boolean(occurrence.contextBindingId);
const relationshipEndpoint = (relationship, side) => {
    const endpoint = side === "source" ? relationship.sourceEndpoint : relationship.targetEndpoint;
    if (endpoint && (endpoint.kind === "page-frame" || endpoint.kind === "event-occurrence") && endpoint.id)
        return endpoint;
    const legacy = side === "source" ? relationship.sourceNodeId : relationship.targetNodeId;
    return legacy ? { kind: "event-occurrence", id: String(legacy) } : undefined;
};
const relationshipTouches = (relationship, ids) => ids.has(relationshipEndpoint(relationship, "source")?.id ?? "") || ids.has(relationshipEndpoint(relationship, "target")?.id ?? "");
const normalizedOccurrence = (input) => {
    if (input.pageFrameId || input.pageGroupId || input.freePageFrameId || input.freePageFrame) {
        const { layout, x, y, fallbackRole, eventId, ...values } = clone(input);
        void layout;
        void fallbackRole;
        const ownsCoordinates = Boolean(input.pageFrameId || input.freePageFrameId || input.freePageFrame);
        return { ...values, ...(eventId ? { eventId } : {}), position: { ...(ownsCoordinates ? { x: Number(x ?? input.layout?.x ?? 24) } : {}), y: Number(y ?? input.layout?.y ?? 70) }, optional: input.obligation === "Optional" };
    }
    const { layout, ...values } = clone(input);
    if (!layout)
        throw new Error("An uncontained legacy Flow occurrence requires an explicit legacy layout.");
    return { ...values, lane: layout.lane, position: { x: layout.x, y: layout.y }, optional: input.obligation === "Optional" };
};
export function documentaryFlowGraph(project, flowId) { const graph = storedGraph(project, flowId); return { pageGroupIds: graph.pageGroupIds, pageFrames: graph.pageFrames, occurrences: graph.occurrences, relationships: graph.relationships, ...(graph.selectedItem ? { selectedItem: graph.selectedItem } : {}), ...(graph.viewport ? { viewport: graph.viewport } : {}) }; }
export function flowPageGroupLaneIds(project, flowId) { return storedGraph(project, flowId).pageGroupIds; }
export function flowOccurrenceEventSchema(project, flowId, occurrenceId) {
    const occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId), event = project.collections.events.find(({ id }) => id === occurrence?.eventId);
    return event?.schemaDraftId ?? event?.schemaId;
}
function validOccurrence(state, flowId, input) {
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
        const group = state.project.collections.pageGroups.find(({ id }) => id === effectivePageGroupId), memberIds = orderedPageGroupIds(state.project, page.id);
        if (!group || !flowPageGroupLaneIds(state.project, flowId).includes(group.id) || !memberIds.includes(group.id))
            throw new Error("A Flow occurrence requires a selected Page Group containing its Page.");
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
    const authoritative = event.role === "context-setting" || event.role === "interaction", role = (authoritative ? event.role : input.role ?? input.fallbackRole ?? "interaction"), { fallbackRole, ...values } = input;
    void fallbackRole;
    return { ...values, name: input.name.trim(), role };
}
export function inspectPageFrameDrop(project, flowId, pageId, targetPageGroupId) {
    const page = project.collections.pages.find(({ id }) => id === pageId), group = project.collections.pageGroups.find(({ id }) => id === targetPageGroupId), selected = flowPageGroupLaneIds(project, flowId).includes(targetPageGroupId), memberships = orderedPageGroupIds(project, pageId), member = Boolean(group && memberships.includes(group.id)), migrationRequired = Boolean(page && requiresPageGroupMembershipMigration(project, pageId)), rejected = !page || !group || !selected || !member || migrationRequired, names = memberships.map((id) => project.collections.pageGroups.find((candidate) => candidate.id === id)?.name ?? id);
    return { rejected, message: rejected ? `${page?.name ?? pageId} belongs to ${names.join(", ") || "no selected Page Group"}, not ${group?.name ?? targetPageGroupId}.` : `${page.name} can be placed in ${group.name}.`, guidance: `?kind=pages&entity=${encodeURIComponent(pageId)}&field=pageGroupIds` };
}
export function addFlowPageFrame(state, flowId, input, id) {
    const review = inspectPageFrameDrop(state.project, flowId, input.pageId, input.pageGroupId);
    if (review.rejected)
        return state;
    const graph = storedGraph(state.project, flowId);
    if (graph.pageFrames.some(({ pageId, pageGroupId }) => pageId === input.pageId && pageGroupId === input.pageGroupId))
        return state;
    return transactProject(state, "Add Flow Page frame", (project) => { const current = storedGraph(project, flowId), frame = { id: id("flow-page-frame"), pageId: input.pageId, pageGroupId: input.pageGroupId, position: { x: Math.max(20, Math.round(input.x ?? 40 + current.pageFrames.filter(({ pageGroupId }) => pageGroupId === input.pageGroupId).length * 240)), y: Math.max(40, Math.round(input.y)) } }; return saveStoredGraph(project, flowId, { ...current, pageFrames: [...current.pageFrames, frame] }); });
}
export function removeFlowPageFrame(state, flowId, pageFrameId) {
    const graph = storedGraph(state.project, flowId), frame = graph.pageFrames.find(({ id }) => id === pageFrameId);
    if (!frame)
        return state;
    const removedIds = new Set([pageFrameId, ...graph.occurrences.filter((occurrence) => occurrence.pageFrameId === pageFrameId).map(({ id }) => id)]);
    return transactProject(state, "Remove Flow Page frame", (project) => { const current = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...current, pageFrames: current.pageFrames.filter(({ id }) => id !== pageFrameId), occurrences: current.occurrences.filter((occurrence) => occurrence.pageFrameId !== pageFrameId), relationships: current.relationships.filter((relationship) => !relationshipTouches(relationship, removedIds)) }); });
}
export function moveFlowPageFrame(state, flowId, pageFrameId, input) {
    const graph = storedGraph(state.project, flowId), frame = graph.pageFrames.find(({ id }) => id === pageFrameId);
    if (!frame || inspectPageFrameDrop(state.project, flowId, frame.pageId, input.pageGroupId).rejected)
        return state;
    const x = Math.max(20, Math.round(input.x ?? frame.position.x ?? 40)), y = Math.max(40, Math.round(input.y));
    if (frame.pageGroupId === input.pageGroupId && !frame.freePageRegion && frame.position.x === x && frame.position.y === y)
        return state;
    return transactProject(state, "Move Flow Page frame", (project) => { const current = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...current, pageFrames: current.pageFrames.map((candidate) => { if (candidate.id !== pageFrameId)
            return candidate; const moved = { ...candidate, pageGroupId: input.pageGroupId, position: { x, y } }; delete moved.freePageRegion; return moved; }) }); });
}
export function addEventOccurrenceToPage(state, flowId, input, id) { return addGraphOccurrence(state, flowId, input, id); }
export function reorderFlowPageGroupLane(state, flowId, pageGroupId, delta) { const lanes = [...flowPageGroupLaneIds(state.project, flowId)], from = lanes.indexOf(pageGroupId); if (from < 0)
    return state; const to = Math.max(0, Math.min(lanes.length - 1, from + delta)); if (from === to)
    return state; lanes.splice(from, 1); lanes.splice(to, 0, pageGroupId); return setFlowPageGroupLanes(state, flowId, lanes); }
export function saveFlowViewState(state, _flowId, _view) { return state; }
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
    const graph = storedGraph(state.project, flowId), page = state.project.collections.pages.find(({ id }) => id === input.pageId);
    if (!page || graph.pageFrames.some(({ pageId }) => pageId === input.pageId))
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
    if (!frame)
        return state;
    const next = { region: presentation.region, x: Math.max(12, Math.round(presentation.x)), y: Math.max(55, Math.round(presentation.y)) };
    if (frame.freePageRegion === next.region && position?.x === next.x && position.y === next.y)
        return state;
    return transactProject(state, `Move free Page frame ${frameId}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, pageFrames: graph.pageFrames.map((item) => { if (item.id !== frameId)
            return item; const moved = { ...item, freePageRegion: next.region, position: { x: next.x, y: next.y } }; delete moved.pageGroupId; return moved; }) }); });
}
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
    const contributorPath = layeredContributorPath(state, occurrence, "Event-occurrence", flowId), contributors = layeredContributorsForPath(state, contributorPath), event = state.project.collections.events.find(({ id: eventId }) => eventId === occurrence.eventId), role = occurrence.role ?? event?.role, effective = compileLayeredSchema(contributors, { eventId: String(occurrence.eventId ?? ""), eventRole: role === "context-setting" ? "context" : "interaction", occurrenceId }).properties[path], legacy = Boolean(occurrence.schemaConstraints || occurrence.localSchemaContributions), canonical = occurrence.canonicalSchema ?? (legacy ? migrateLegacyProfile(occurrence, { id }).document : createCanonicalSchema({ id: id("canonical-schema"), contributorId: occurrence.id, contributorName: occurrence.name })), next = canonicalSchemaWithConstraint(canonical, { path, ...(effective?.type ? { type: effective.type } : {}), examples: [clone(value)] }, id);
    return transactProject(state, `Save Flow occurrence example ${path}`, (project) => { const graph = storedGraph(project, flowId); return saveStoredGraph(project, flowId, { ...graph, occurrences: graph.occurrences.map((candidate) => { if (candidate.id !== occurrenceId)
            return candidate; const updated = { ...candidate, canonicalSchema: next, schemaInstanceExamplePaths: [...new Set([...(candidate.schemaInstanceExamplePaths ?? []), path])] }; delete updated.schemaConstraints; delete updated.localSchemaContributions; return updated; }) }); });
}
export function deriveFlowOccurrenceExample(project, flowId, occurrenceId) {
    const occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId);
    if (!occurrence)
        return { status: "Blocked", payload: {}, formattedJson: "{}", provenance: {}, issues: [{ path: "/", code: "CONFLICT", message: "The Event occurrence is unavailable.", editHref: exampleEditHref(flowId, occurrenceId, "/") }] };
    const state = { project }, path = layeredContributorPath(state, occurrence, "Event-occurrence", flowId), contributors = layeredContributorsForPath(state, path), event = project.collections.events.find(({ id }) => id === occurrence.eventId), sourceRole = occurrence.role ?? event?.role, role = sourceRole === "context-setting" ? "context-setting" : "interaction", compiled = compileLayeredSchema(contributors, { eventId: String(occurrence.eventId ?? ""), eventRole: role === "context-setting" ? "context" : "interaction", occurrenceId }), payload = {}, provenance = {};
    for (const [propertyPath, property] of Object.entries(compiled.properties)) {
        if (property.presence === "forbidden")
            continue;
        let configured;
        if (property.expectedValue !== undefined)
            configured = { value: property.expectedValue, source: property.expectedContributor ?? property.origins.at(-1)?.contributorName ?? occurrence.name };
        else
            for (const contributor of [...contributors].reverse()) {
                const constraint = [...contributor.constraints].reverse().find((candidate) => candidate.path === propertyPath && applicableExample(candidate, occurrence, String(occurrence.eventId ?? ""), role) && (candidate.examples?.length ?? 0) > 0);
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
export function flowOccurrenceExampleEditorRows(project, flowId, occurrenceId) {
    const occurrence = storedGraph(project, flowId).occurrences.find(({ id }) => id === occurrenceId);
    if (!occurrence)
        return [];
    const state = { project }, path = layeredContributorPath(state, occurrence, "Event-occurrence", flowId), contributors = layeredContributorsForPath(state, path), event = project.collections.events.find(({ id }) => id === occurrence.eventId), role = occurrence.role ?? event?.role, compiled = compileLayeredSchema(contributors, { eventId: String(occurrence.eventId ?? ""), eventRole: role === "context-setting" ? "context" : "interaction", occurrenceId }), example = deriveFlowOccurrenceExample(project, flowId, occurrenceId);
    return Object.entries(compiled.properties).map(([propertyPath, property]) => ({ path: propertyPath, ...(property.type ? { type: property.type } : {}), value: valueAtPath(example.payload, propertyPath) }));
}
const legacyContextRoleConflictMessage = (event, occurrenceName, flowName, pageName) => event.role === "interaction" ? `${occurrenceName} in ${flowName} on ${pageName} references ${event.name} as Page context, but Event role interaction conflicts with the required context-setting role.` : undefined;
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
            const roleConflict = legacyContextRoleConflictMessage(event, occurrenceName, flowName, page.name);
            if (roleConflict) {
                blockers.push({ ...base, message: roleConflict });
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
    return transactProject(state, "Migrate legacy Flow Page context bindings", (project) => { const pagesById = new Map(project.collections.pages.map((page) => [page.id, page])), eventsById = new Map(project.collections.events.map((event) => [event.id, event])), documentationFlowGraphs = Object.fromEntries(Object.entries(graphIndex(project)).map(([candidateFlowId, graph]) => [candidateFlowId, { ...graph, occurrences: graph.occurrences.map((occurrence) => { if (!legacyBindingOccurrence(occurrence))
                return occurrence; const page = pagesById.get(String(occurrence.pageId)), binding = (page?.contextEventBindings ?? []).find(({ id }) => id === occurrence.contextBindingId), event = eventsById.get(String(binding?.eventId ?? "")); if (!binding || !event)
                return occurrence; const { contextBindingId, eventId: discardedEventId, role: discardedRole, trigger: discardedTrigger, ...stored } = occurrence; void contextBindingId; void discardedEventId; void discardedRole; void discardedTrigger; return { ...stored, eventId: event.id, role: "context-setting", trigger: String(binding.trigger ?? binding.name ?? "") }; }) }])), pages = project.collections.pages.map((page) => { if (!("contextEventBindings" in page))
        return page; const { contextEventBindings, ...stored } = page; void contextEventBindings; return stored; }); return { ...project, collections: { ...project.collections, pages }, documentationFlowGraphs }; });
}
export function saveGraphRelationship(state, flowId, fromOccurrenceId, input, id) {
    const graph = storedGraph(state.project, flowId), occurrenceIds = new Set(graph.occurrences.map(({ id }) => id)), frameIds = new Set(graph.pageFrames.map(({ id }) => id)), endpoint = (endpointId) => frameIds.has(endpointId) ? { kind: "page-frame", id: endpointId } : occurrenceIds.has(endpointId) ? { kind: "event-occurrence", id: endpointId } : undefined, sourceEndpoint = endpoint(fromOccurrenceId), targetEndpoint = endpoint(input.toStepId);
    if (fromOccurrenceId === input.toStepId)
        return state;
    if (!state.project.collections.flows.some(({ id }) => id === flowId) || !sourceEndpoint || !targetEndpoint)
        throw new Error("A Flow relationship requires an existing Flow, source, and target endpoint.");
    return transactProject(state, `Save Flow relationship ${input.id ?? "new"}`, (project) => { const current = storedGraph(project, flowId), relationship = { id: input.id ?? id("flow-relationship"), sourceEndpoint, targetEndpoint, kind: input.kind, ...(input.group ? { group: input.group } : {}), ...(input.label ? { label: input.label } : {}), ...(input.documentationCondition ? { documentationCondition: input.documentationCondition } : {}), ...(input.expectation ? { expectation: input.expectation } : {}) }; return saveStoredGraph(project, flowId, { ...current, relationships: current.relationships.some(({ id }) => id === relationship.id) ? current.relationships.map((candidate) => candidate.id === relationship.id ? relationship : candidate) : [...current.relationships, relationship] }); });
}
export function flowRelationshipText(graph, relationship) { const source = graph.connectionEndpoints.find(({ id, kind }) => id === relationship.sourceEndpoint.id && kind === relationship.sourceEndpoint.kind), target = graph.connectionEndpoints.find(({ id, kind }) => id === relationship.targetEndpoint.id && kind === relationship.targetEndpoint.kind); return [source?.name ?? "Missing endpoint", relationship.kind, target?.name ?? "Missing endpoint", relationship.group, relationship.label, relationship.documentationCondition, relationship.expectation].filter((value) => value !== undefined && value !== "").join(" · "); }
export function inspectFlowGraph(graph, catalog) { const diagnostics = [], endpointKeys = new Set(graph.connectionEndpoints.map(({ kind, id }) => `${kind}:${id}`)); for (const node of graph.nodes) {
    if (!catalog.events.some(({ id }) => id === node.eventId))
        diagnostics.push({ kind: "missing-event", message: `${node.name} has no resolved Event`, nodeId: node.id });
    if (!catalog.pages.some(({ id }) => id === node.pageId))
        diagnostics.push({ kind: "missing-page", message: `${node.name} has no resolved Page`, nodeId: node.id });
} for (const relationship of graph.relationships)
    if (!endpointKeys.has(`${relationship.sourceEndpoint.kind}:${relationship.sourceEndpoint.id}`) || !endpointKeys.has(`${relationship.targetEndpoint.kind}:${relationship.targetEndpoint.id}`))
        diagnostics.push({ kind: "dangling-relationship", message: `Relationship ${relationship.id} has a missing endpoint`, relationshipId: relationship.id }); return diagnostics; }
export function flowOutline(graph) { return graph.nodes.map((node) => ({ nodeId: node.id, name: node.name, role: node.role, obligation: node.obligation, expectedMinimum: node.expectedMinimum, ...(node.expectedMaximum !== undefined ? { expectedMaximum: node.expectedMaximum } : {}), relationshipIds: graph.relationships.filter(({ sourceNodeId }) => sourceNodeId === node.id).map(({ id }) => id) })); }
export function projectFlowGraph(project, flowId) {
    const flow = project.collections.flows.find(({ id }) => id === flowId);
    if (!flow)
        throw new Error(`Unknown Flow ${flowId}`);
    const laneIds = flowPageGroupLaneIds(project, flowId), lanes = laneIds.map((groupId) => project.collections.pageGroups.find(({ id }) => id === groupId)).filter((group) => Boolean(group)).map(clone), stored = storedGraph(project, flowId), frameById = new Map(stored.pageFrames.map((frame) => [frame.id, frame])), freeFrames = stored.pageFrames.filter(({ freePageRegion }) => Boolean(freePageRegion)), legacyFreeFrames = stored.occurrences.filter(({ freePageFrame }) => freePageFrame), hasBefore = [...freeFrames, ...legacyFreeFrames].some(({ freePageRegion }) => freePageRegion === "before-lanes"), laneOffset = hasBefore ? 200 : 0, freeFrameById = new Map([...freeFrames, ...legacyFreeFrames].map((frame) => [frame.id, frame])), frameSize = (frame) => { const children = stored.occurrences.filter(({ pageFrameId }) => pageFrameId === frame.id), width = Math.max(190, ...children.map((child) => Number(child.position?.x ?? 24) + 190 + 20)), height = Math.max(108, ...children.map((child) => Number(child.position?.y ?? 70) + 90 + 20)); return { width, height }; }, laneBands = [];
    let nextBandY = 20;
    for (const [index, lane] of lanes.entries()) {
        const frames = stored.pageFrames.filter(({ pageGroupId, freePageRegion }) => pageGroupId === lane.id && !freePageRegion), height = Math.max(240, ...frames.map((frame) => Number(frame.position.y ?? 40) + frameSize(frame).height + 40));
        laneBands.push({ id: lane.id, name: lane.name, y: nextBandY, height });
        nextBandY += height + 24;
        void index;
    }
    const bandById = new Map(laneBands.map((band) => [band.id, band])), namedWidth = Math.max(900, ...stored.pageFrames.filter(({ freePageRegion }) => !freePageRegion).map((frame) => Number(frame.position.x ?? 40) + frameSize(frame).width + 60));
    const frameEndpoints = stored.pageFrames.map((frame) => { const page = project.collections.pages.find(({ id }) => id === frame.pageId), size = frameSize(frame), band = frame.pageGroupId ? bandById.get(frame.pageGroupId) : undefined, region = (frame.freePageRegion ?? "after-lanes"), x = frame.freePageRegion ? (region === "before-lanes" ? Number(frame.position.x ?? 24) : laneOffset + namedWidth + Number(frame.position.x ?? 24)) : laneOffset + Number(frame.position.x ?? 40), y = frame.freePageRegion ? Number(frame.position.y ?? 55) : Number(band?.y ?? 20) + Number(frame.position.y ?? 40), lane = frame.freePageRegion ? region : band?.name ?? String(frame.pageGroupId ?? "unplaced"); return { kind: "page-frame", id: frame.id, name: page?.name ?? frame.pageId, pageId: frame.pageId, ...(frame.pageGroupId ? { pageGroupId: frame.pageGroupId } : {}), ...(frame.freePageRegion ? { freePageRegion: frame.freePageRegion } : {}), layout: { lane, x, y }, width: size.width, height: size.height }; }), frameEndpointById = new Map(frameEndpoints.map((endpoint) => [endpoint.id, endpoint]));
    const nodes = stored.occurrences.filter(({ freePageFrame }) => !freePageFrame).map((occurrence) => {
        const page = project.collections.pages.find(({ id }) => id === occurrence.pageId), binding = legacyBindingOccurrence(occurrence) ? (page?.contextEventBindings ?? []).find(({ id }) => id === occurrence.contextBindingId) : undefined, eventId = String(binding?.eventId ?? occurrence.eventId ?? ""), event = project.collections.events.find(({ id }) => id === eventId), position = occurrence.position, containingFrame = frameById.get(String(occurrence.pageFrameId ?? "")), containingEndpoint = frameEndpointById.get(String(occurrence.pageFrameId ?? "")), pageGroupId = typeof containingFrame?.pageGroupId === "string" ? containingFrame.pageGroupId : typeof occurrence.pageGroupId === "string" ? occurrence.pageGroupId : undefined, parentFree = freeFrameById.get(String(occurrence.pageFrameId ?? occurrence.freePageFrameId ?? "")), freePageRegion = (parentFree?.freePageRegion ?? "after-lanes"), laneIndex = pageGroupId ? laneIds.indexOf(pageGroupId) : -1, eventRole = event?.role, role = (occurrence.role ?? (binding ? "context-setting" : eventRole === "context-setting" || eventRole === "interaction" ? eventRole : "interaction")), layout = position && typeof position.y === "number" ? (containingEndpoint ? { lane: containingEndpoint.layout.lane, x: containingEndpoint.layout.x + Number(position.x ?? 24), y: containingEndpoint.layout.y + position.y } : parentFree ? { lane: freePageRegion, x: Number(position.x ?? 30), y: position.y } : laneIndex >= 0 ? { lane: String(lanes[laneIndex]?.name ?? pageGroupId), x: laneOffset + 30 + laneIndex * 200, y: position.y } : typeof occurrence.lane === "string" ? { lane: occurrence.lane, x: Number(position.x ?? 30), y: position.y } : undefined) : undefined;
        return { id: occurrence.id, name: String(event?.name ?? occurrence.name), eventId, pageId: String(occurrence.pageId ?? ""), ...(occurrence.pageFrameId ? { pageFrameId: String(occurrence.pageFrameId) } : {}), ...(pageGroupId ? { pageGroupId } : {}), ...(parentFree ? { freePageFrameId: parentFree.id, freePageRegion } : {}), role, ...(typeof occurrence.trigger === "string" ? { trigger: occurrence.trigger } : binding?.trigger ? { trigger: String(binding.trigger) } : {}), obligation: (typeof occurrence.obligation === "string" ? occurrence.obligation : occurrence.optional ? "Optional" : "Required"), expectedMinimum: Number(occurrence.minimum ?? 1), ...(occurrence.maximum !== undefined ? { expectedMaximum: Number(occurrence.maximum) } : {}), ...(layout ? { layout } : {}) };
    }), occurrenceEndpoints = nodes.filter((node) => Boolean(node.layout)).map((node) => ({ kind: "event-occurrence", id: node.id, name: node.name, pageId: node.pageId, ...(node.pageGroupId ? { pageGroupId: node.pageGroupId } : {}), ...(node.freePageRegion ? { freePageRegion: node.freePageRegion } : {}), layout: node.layout, width: 170, height: 90 })), connectionEndpoints = [...frameEndpoints, ...occurrenceEndpoints], relationships = stored.relationships.flatMap((edge) => { const sourceEndpoint = relationshipEndpoint(edge, "source"), targetEndpoint = relationshipEndpoint(edge, "target"); if (!sourceEndpoint || !targetEndpoint)
        return []; return [{ id: edge.id, sourceEndpoint, targetEndpoint, sourceNodeId: sourceEndpoint.id, targetNodeId: targetEndpoint.id, kind: (["expected-next", "alternative", "parallel", "merge"].includes(String(edge.kind)) ? edge.kind : "expected-next"), ...(typeof edge.group === "string" ? { group: edge.group } : {}), ...(typeof edge.label === "string" ? { label: edge.label } : {}), ...(typeof edge.documentationCondition === "string" ? { documentationCondition: edge.documentationCondition } : {}), ...(typeof edge.expectation === "string" ? { expectation: edge.expectation } : {}) }]; }), graph = { id: flow.id, name: flow.name, purpose: String(flow.purpose ?? flow.description ?? ""), nodes, connectionEndpoints, relationships }, catalog = { pageGroups: project.collections.pageGroups.map((group) => clone(group)), pages: project.collections.pages.map((page) => clone(page)), events: project.collections.events.map((event) => clone(event)) };
    return { projectName: project.name, lanes, laneBands, graph, catalog, diagnostics: inspectFlowGraph(graph, catalog) };
}
//# sourceMappingURL=data-layer-flow-graph.js.map