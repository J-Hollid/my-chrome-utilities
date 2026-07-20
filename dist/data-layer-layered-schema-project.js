import { canonicalConstraints } from "./data-layer-canonical-schema.js";
const contributionFor = (entity, scope) => {
    const canonical = entity.canonicalSchema;
    return { id: entity.id, name: entity.name, scope, constraints: canonical ? canonicalConstraints(canonical) : (entity.schemaConstraints ?? []) };
};
const referencedId = (entity, key) => typeof entity[key] === "string" ? String(entity[key]) : undefined;
const referencedProfileId = (state, entity) => {
    const direct = referencedId(entity, "profileId") ?? (entity.profileIds?.length === 1 ? String(entity.profileIds[0]) : undefined);
    if (direct)
        return direct;
    const page = state.project.collections.pages.find(({ id }) => id === referencedId(entity, "pageId")), pageProfiles = page?.profileIds ?? [];
    return pageProfiles.length === 1 ? pageProfiles[0] : state.project.collections.profiles.length === 1 ? state.project.collections.profiles[0].id : undefined;
};
export function layeredContributorPath(state, entity, scope, flowId) {
    const selectedFlowId = flowId ?? (scope === "Flow Page-instance" ? entity.id : undefined), flowGraph = selectedFlowId ? state.project.documentationFlowGraphs?.[selectedFlowId] : undefined, flowPageGroupIds = flowGraph?.pageGroupIds ?? [], referencedFrameId = referencedId(entity, "pageFrameId") ?? (scope === "Flow Page-instance" ? entity.id : undefined), referencedFrame = flowGraph?.pageFrames?.find(({ id }) => id === referencedFrameId), flowPageGroupId = referencedId(referencedFrame ?? entity, "pageGroupId") ?? (flowPageGroupIds.length === 1 ? flowPageGroupIds[0] : undefined), flowPageGroup = state.project.collections.pageGroups.find(({ id }) => id === flowPageGroupId), flowPageIds = flowPageGroup?.pageIds ?? [], flowPageId = referencedId(referencedFrame ?? entity, "pageId") ?? (flowPageIds.length === 1 ? flowPageIds[0] : undefined), profileId = scope === "Shared Profile" ? entity.id : referencedProfileId(state, entity), pageId = referencedId(entity, "pageId") ?? (scope === "Page" ? entity.id : scope === "Flow Page-instance" ? flowPageId : undefined), containingGroups = pageId ? state.project.collections.pageGroups.filter((group) => (group.pageIds ?? []).includes(pageId)) : [], pageGroupId = referencedId(entity, "pageGroupId") ?? referencedId(referencedFrame ?? {}, "pageGroupId") ?? (scope === "Page Group" ? entity.id : containingGroups.length === 1 ? containingGroups[0].id : scope === "Flow Page-instance" ? flowPageGroupId : undefined), selectedPage = pageId ? state.project.collections.pages.find(({ id }) => id === pageId) : undefined, contextBinding = (selectedPage?.contextEventBindings ?? []).find(({ id }) => id === entity.contextBindingId), eventId = referencedId(entity, "eventId") ?? referencedId(contextBinding ?? { id: "", name: "" }, "eventId") ?? (scope === "Event" ? entity.id : undefined);
    return { ...(profileId ? { profileId } : {}), ...(eventId ? { eventId } : {}), ...(pageGroupId ? { pageGroupId } : {}), ...(pageId ? { pageId } : {}), ...(selectedFlowId ? { flowId: selectedFlowId } : {}), ...(referencedFrame ? { pageFrameId: referencedFrame.id } : {}), ...(scope === "Event-occurrence" ? { occurrenceId: entity.id } : {}) };
}
export function layeredContributorsForPath(state, path) {
    const graph = path.flowId ? state.project.documentationFlowGraphs?.[path.flowId] : undefined, pageFrame = graph?.pageFrames?.find(({ id }) => id === path.pageFrameId), occurrence = graph?.occurrences?.find(({ id }) => id === path.occurrenceId);
    const one = (entities, id, scope) => id ? entities.filter((entity) => entity.id === id).map((entity) => contributionFor(entity, scope)) : [];
    return [...one(state.project.collections.profiles, path.profileId, "Shared Profile"), ...one(state.project.collections.events, path.eventId, "Event"), ...one(state.project.collections.pageGroups, path.pageGroupId, "Page Group"), ...one(state.project.collections.pages, path.pageId, "Page"), ...(pageFrame ? [contributionFor(pageFrame, "Flow Page-instance")] : []), ...(occurrence ? [contributionFor(occurrence, occurrence.freePageFrame ? "Flow Page-instance" : "Event-occurrence")] : [])];
}
export function layeredContributionDetails(state, entity, scope, flowId) {
    return layeredContributorsForPath(state, layeredContributorPath(state, entity, scope, flowId)).flatMap((contributor) => contributor.constraints.map((constraint) => ({ contributorId: contributor.id, contributorName: contributor.name, scope: contributor.scope, path: constraint.path, target: constraint.target ?? "all", condition: constraint.condition ? JSON.stringify(constraint.condition) : "Always", enforcement: constraint.enforcement ?? "not set", usedById: entity.id, usedByName: entity.name, usedByScope: scope })));
}
//# sourceMappingURL=data-layer-layered-schema-project.js.map