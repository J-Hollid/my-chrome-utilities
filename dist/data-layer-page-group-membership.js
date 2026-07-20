import { transactProject } from "./data-layer-specification-project.js";
const storedIds = (page) => Array.isArray(page.pageGroupIds) ? page.pageGroupIds.map(String) : undefined;
const unique = (values) => [...new Set(values)];
const legacyIds = (project, pageId) => project.collections.pageGroups.filter((group) => (group.pageIds ?? []).includes(pageId)).map(({ id }) => id);
export function requiresPageGroupMembershipMigration(project, pageId) {
    const review = stagePageGroupMembershipMigration(project, pageId);
    return legacyIds(project, pageId).length > 0 || review.missingPageGroupIds.length > 0 || review.duplicatePageGroupIds.length > 0;
}
export function orderedPageGroupIds(project, pageId) {
    const page = project.collections.pages.find(({ id }) => id === pageId);
    if (!page)
        return [];
    return unique([...(storedIds(page) ?? []), ...legacyIds(project, pageId)]);
}
export function pageGroupMembers(project, pageGroupId) {
    const legacyIds = project.collections.pageGroups.find(({ id }) => id === pageGroupId)?.pageIds ?? [];
    return project.collections.pages.filter((page) => (storedIds(page) ?? []).includes(pageGroupId) || legacyIds.includes(page.id));
}
function writeMemberships(state, pageId, pageGroupIds, label) {
    return transactProject(state, label, (project) => ({ ...project, collections: { ...project.collections, pages: project.collections.pages.map((page) => page.id === pageId ? { ...page, pageGroupIds: [...pageGroupIds] } : page), pageGroups: project.collections.pageGroups.map((group) => { if (!Array.isArray(group.pageIds) || group.pageIds.every((id) => id !== pageId))
                return group; const retained = group.pageIds.filter((id) => id !== pageId), next = { ...group }; if (retained.length)
                next.pageIds = retained;
            else
                delete next.pageIds; return next; }) } }));
}
export function addPageGroupMembership(state, pageId, pageGroupId) {
    const page = state.project.collections.pages.find(({ id }) => id === pageId);
    if (!page)
        throw new Error(`Unknown Page ${pageId}.`);
    const group = state.project.collections.pageGroups.find(({ id }) => id === pageGroupId);
    if (!group)
        throw new Error(`Unknown Page Group ${pageGroupId}.`);
    if (requiresPageGroupMembershipMigration(state.project, pageId))
        return state;
    const current = orderedPageGroupIds(state.project, pageId);
    if (current.includes(pageGroupId))
        throw new Error(`${page.name} already belongs to ${group.name}.`);
    return writeMemberships(state, pageId, [...current, pageGroupId], `Add ${page.name} to Page Group ${group.name}`);
}
export function previewPageGroupMembershipMove(project, pageId, pageGroupId, delta) {
    const current = orderedPageGroupIds(project, pageId), from = current.indexOf(pageGroupId);
    if (from < 0 || requiresPageGroupMembershipMigration(project, pageId))
        return current;
    const to = Math.max(0, Math.min(current.length - 1, from + delta));
    if (to === from)
        return current;
    const next = [...current], moved = next.splice(from, 1)[0];
    next.splice(to, 0, moved);
    return next;
}
export function movePageGroupMembership(state, pageId, pageGroupId, delta) {
    if (requiresPageGroupMembershipMigration(state.project, pageId))
        return state;
    const page = state.project.collections.pages.find(({ id }) => id === pageId), current = orderedPageGroupIds(state.project, pageId), next = previewPageGroupMembershipMove(state.project, pageId, pageGroupId, delta);
    if (!page || next === current || next.join("\0") === current.join("\0"))
        return state;
    return writeMemberships(state, pageId, next, `Reorder Page Group rules for ${page.name}`);
}
export function inspectPageGroupMembershipRemoval(project, pageId, pageGroupId) {
    const page = project.collections.pages.find(({ id }) => id === pageId), group = project.collections.pageGroups.find(({ id }) => id === pageGroupId), memberships = orderedPageGroupIds(project, pageId), groups = new Map(project.collections.pageGroups.map((candidate) => [candidate.id, candidate]));
    const graphs = project.documentationFlowGraphs ?? {}, uses = Object.entries(graphs).flatMap(([flowId, graph]) => (graph.pageFrames ?? []).filter((frame) => frame.pageId === pageId && frame.pageGroupId === pageGroupId).map((frame) => ({ flowId, graph, frame })));
    const actions = uses.flatMap(({ flowId, graph, frame }) => { const alternatives = (graph.pageGroupIds ?? []).filter((id) => id !== pageGroupId && memberships.includes(id)); return [...alternatives.slice(0, 1).map((id) => ({ label: `Move to ${groups.get(id)?.name ?? id}`, kind: "move-frame", flowId, frameId: frame.id, pageGroupId: id })), { label: "Remove Page frame", kind: "remove-frame", flowId, frameId: frame.id }]; });
    const affectedTargets = uses.map(({ flowId }) => project.collections.flows.find(({ id }) => id === flowId)?.name ?? flowId), blocked = uses.length > 0;
    return { blocked, message: blocked ? `${affectedTargets[0] ?? "Flow"} uses ${page?.name ?? pageId} in ${group?.name ?? pageGroupId}; move or remove that Page frame before removing membership.` : `${page?.name ?? pageId} can leave ${group?.name ?? pageGroupId}.`, actions, affectedTargets };
}
export function removePageGroupMembership(state, pageId, pageGroupId) {
    if (requiresPageGroupMembershipMigration(state.project, pageId))
        return state;
    const review = inspectPageGroupMembershipRemoval(state.project, pageId, pageGroupId);
    if (review.blocked)
        return state;
    const page = state.project.collections.pages.find(({ id }) => id === pageId);
    if (!page)
        return state;
    const current = orderedPageGroupIds(state.project, pageId);
    if (!current.includes(pageGroupId))
        return state;
    const group = state.project.collections.pageGroups.find(({ id }) => id === pageGroupId);
    return writeMemberships(state, pageId, current.filter((id) => id !== pageGroupId), `Remove ${page.name} from Page Group ${group?.name ?? pageGroupId}`);
}
export function stagePageGroupMembershipMigration(project, pageId) {
    const page = project.collections.pages.find(({ id }) => id === pageId);
    if (!page)
        throw new Error(`Unknown Page ${pageId}.`);
    const owned = storedIds(page) ?? [], legacy = legacyIds(project, pageId), combined = [...owned, ...legacy], counts = new Map();
    for (const id of combined)
        counts.set(id, (counts.get(id) ?? 0) + 1);
    const known = new Set(project.collections.pageGroups.map(({ id }) => id));
    return { pageId, pageName: page.name, proposedPageGroupIds: unique(combined), missingPageGroupIds: unique(combined.filter((id) => !known.has(id))), duplicatePageGroupIds: [...counts].filter(([, count]) => count > 1).map(([id]) => id).filter((id) => owned.filter((candidate) => candidate === id).length > 1) };
}
export function confirmPageGroupMembershipMigration(state, review) {
    if (review.missingPageGroupIds.length)
        throw new Error(`Cannot migrate missing Page Group ${review.missingPageGroupIds.join(", ")}.`);
    if (review.duplicatePageGroupIds.length)
        throw new Error(`Cannot migrate duplicate Page Group ${review.duplicatePageGroupIds.join(", ")}.`);
    const page = state.project.collections.pages.find(({ id }) => id === review.pageId);
    if (!page)
        throw new Error(`Unknown Page ${review.pageId}.`);
    return transactProject(state, `Migrate ordered Page Group membership for ${page.name}`, (project) => ({ ...project, collections: { ...project.collections, pages: project.collections.pages.map((candidate) => candidate.id === page.id ? { ...candidate, pageGroupIds: [...review.proposedPageGroupIds] } : candidate), pageGroups: project.collections.pageGroups.map((group) => { if (!Array.isArray(group.pageIds))
                return group; const pageIds = group.pageIds.filter((id) => id !== page.id), next = { ...group }; if (pageIds.length)
                next.pageIds = pageIds;
            else
                delete next.pageIds; return next; }) } }));
}
//# sourceMappingURL=data-layer-page-group-membership.js.map