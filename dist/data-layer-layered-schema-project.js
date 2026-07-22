import { canonicalConstraints } from "./data-layer-canonical-schema.js";
import { orderedPageGroupIds } from "./data-layer-page-group-membership.js";
import { transactProject } from "./data-layer-specification-project.js";
const contributionFor = (entity, scope) => {
    const canonical = entity.canonicalSchema;
    const base = canonical ? canonicalConstraints(canonical) : (entity.schemaConstraints ?? []), sparse = entity.localSchemaContributions ?? [];
    return { id: entity.id, name: entity.name, scope, constraints: [...base, ...sparse] };
};
const referencedId = (entity, key) => typeof entity[key] === "string" ? String(entity[key]) : undefined;
const referencedProfileId = (state, entity) => {
    const direct = referencedId(entity, "profileId") ?? (entity.profileIds?.length === 1 ? String(entity.profileIds[0]) : undefined);
    if (direct)
        return direct;
    const page = state.project.collections.pages.find(({ id }) => id === referencedId(entity, "pageId")), pageProfiles = page?.profileIds ?? [];
    return pageProfiles.length === 1 ? pageProfiles[0] : state.project.collections.profiles.length === 1 ? state.project.collections.profiles[0].id : undefined;
};
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function conditionMatches(condition, observation) { if (!condition)
    return true; if (condition.kind === "predicate") {
    const actual = observation[condition.field];
    if (condition.operator === "equals")
        return same(actual, condition.value);
    if (condition.operator === "does not equal")
        return !same(actual, condition.value);
    if (condition.operator === "exists")
        return actual !== undefined;
    if (condition.operator === "does not exist")
        return actual === undefined;
    if (condition.operator === "contains")
        return String(actual ?? "").includes(String(condition.value ?? ""));
    if (condition.operator === "matches pattern" || condition.operator === "regex")
        try {
            return new RegExp(String(condition.pattern ?? condition.value ?? "")).test(String(actual ?? ""));
        }
        catch {
            return false;
        }
    return false;
} if (condition.kind === "all")
    return condition.conditions.every((child) => conditionMatches(child, observation)); if (condition.kind === "any")
    return condition.conditions.some((child) => conditionMatches(child, observation)); return !condition.conditions.some((child) => conditionMatches(child, observation)); }
export function flowPageFrameContributor(state, flowId, pageFrameId) {
    const graph = state.project.documentationFlowGraphs?.[flowId], frame = graph?.pageFrames?.find(({ id }) => id === pageFrameId);
    if (!frame)
        return;
    const page = state.project.collections.pages.find(({ id }) => id === frame.pageId), flow = state.project.collections.flows.find(({ id }) => id === flowId);
    return { ...frame, name: typeof frame.name === "string" && frame.name.trim() ? frame.name : `${page?.name ?? "Page"} in ${flow?.name ?? "Flow"}` };
}
export function layeredContributorPath(state, entity, scope, flowId) {
    const selectedFlowId = flowId ?? (scope === "Flow Page-instance" ? entity.id : undefined), flowGraph = selectedFlowId ? state.project.documentationFlowGraphs?.[selectedFlowId] : undefined, flowPageGroupIds = flowGraph?.pageGroupIds ?? [], referencedFrameId = referencedId(entity, "pageFrameId") ?? (scope === "Flow Page-instance" ? entity.id : undefined), referencedFrame = flowGraph?.pageFrames?.find(({ id }) => id === referencedFrameId), flowPageGroupId = referencedId(referencedFrame ?? entity, "pageGroupId") ?? (flowPageGroupIds.length === 1 ? flowPageGroupIds[0] : undefined), flowPageGroup = state.project.collections.pageGroups.find(({ id }) => id === flowPageGroupId), flowPageIds = flowPageGroup?.pageIds ?? [], flowPageId = referencedId(referencedFrame ?? entity, "pageId") ?? (flowPageIds.length === 1 ? flowPageIds[0] : undefined), profileId = scope === "Shared Profile" ? entity.id : referencedProfileId(state, entity), pageId = referencedId(entity, "pageId") ?? (scope === "Page" ? entity.id : scope === "Flow Page-instance" ? flowPageId : undefined), pageGroupIds = pageId ? orderedPageGroupIds(state.project, pageId) : scope === "Page Group" ? [entity.id] : [], pageGroupId = referencedId(referencedFrame ?? {}, "pageGroupId") ?? referencedId(entity, "pageGroupId") ?? (scope === "Page Group" ? entity.id : pageGroupIds.length === 1 ? pageGroupIds[0] : scope === "Flow Page-instance" ? flowPageGroupId : undefined), selectedPage = pageId ? state.project.collections.pages.find(({ id }) => id === pageId) : undefined, contextBinding = (selectedPage?.contextEventBindings ?? []).find(({ id }) => id === entity.contextBindingId), eventId = referencedId(entity, "eventId") ?? referencedId(contextBinding ?? { id: "", name: "" }, "eventId") ?? (scope === "Event" ? entity.id : undefined);
    return { ...(profileId ? { profileId } : {}), ...(eventId ? { eventId } : {}), ...(pageGroupId ? { pageGroupId } : {}), ...(pageGroupIds.length ? { pageGroupIds } : {}), ...(pageId ? { pageId } : {}), ...(selectedFlowId ? { flowId: selectedFlowId } : {}), ...(referencedFrame ? { pageFrameId: referencedFrame.id } : {}), ...(scope === "Event-occurrence" ? { occurrenceId: entity.id } : {}) };
}
export function layeredContributorsForPath(state, path, observation = {}) {
    const graph = path.flowId ? state.project.documentationFlowGraphs?.[path.flowId] : undefined, pageFrame = graph?.pageFrames?.find(({ id }) => id === path.pageFrameId), occurrence = graph?.occurrences?.find(({ id }) => id === path.occurrenceId);
    const one = (entities, id, scope) => id ? entities.filter((entity) => entity.id === id).map((entity) => contributionFor(entity, scope)) : [];
    const groupIds = path.pageGroupIds ?? (path.pageGroupId ? [path.pageGroupId] : []), groups = groupIds.flatMap((groupId) => state.project.collections.pageGroups.filter(({ id }) => id === groupId).map((group) => { const contributor = contributionFor(group, "Page Group"), applicability = (state.project.collections.applicabilitySets ?? []).find(({ id }) => id === group.applicabilitySetId), conditional = Boolean(applicability), active = conditionMatches(applicability?.condition, observation); return { ...contributor, ...(conditional ? { active, applicabilityConditional: true, ...(!active ? { exclusionReason: `${applicability.name} did not match` } : {}) } : {}) }; }));
    return [...one(state.project.collections.profiles, path.profileId, "Shared Profile"), ...one(state.project.collections.events, path.eventId, "Event"), ...groups, ...one(state.project.collections.pages, path.pageId, "Page"), ...(pageFrame ? [contributionFor(pageFrame, "Flow Page-instance")] : []), ...(occurrence ? [contributionFor(occurrence, occurrence.freePageFrame ? "Flow Page-instance" : "Event-occurrence")] : [])];
}
export function layeredContributionDetails(state, entity, scope, flowId) {
    return layeredContributorsForPath(state, layeredContributorPath(state, entity, scope, flowId)).flatMap((contributor) => contributor.constraints.map((constraint) => ({ contributorId: contributor.id, contributorName: contributor.name, scope: contributor.scope, path: constraint.path, target: constraint.target ?? "all", condition: constraint.condition ? JSON.stringify(constraint.condition) : "Always", enforcement: constraint.enforcement ?? "not set", usedById: entity.id, usedByName: entity.name, usedByScope: scope })));
}
export function saveFlowPageInstanceLocalFacets(state, flowId, pageFrameId, path, facets) {
    const graph = state.project.documentationFlowGraphs[flowId], frame = graph?.pageFrames?.find(({ id }) => id === pageFrameId);
    if (!frame)
        throw new Error(`Flow Page instance ${pageFrameId} is unavailable.`);
    const sparse = Object.fromEntries(Object.entries(facets).filter(([, value]) => value !== undefined && value !== ""));
    return transactProject(state, `Override ${path} at Flow Page instance`, (project) => { const graphs = project.documentationFlowGraphs; return { ...project, documentationFlowGraphs: { ...graphs, [flowId]: { ...graphs[flowId], pageFrames: graphs[flowId].pageFrames.map((candidate) => candidate.id === pageFrameId ? { ...candidate, localSchemaContributions: [...(candidate.localSchemaContributions ?? []).filter((constraint) => constraint.path !== path), ...(Object.keys(sparse).length ? [{ path, ...structuredClone(sparse) }] : [])], compiledTargetsStale: true } : candidate) } } }; });
}
export function resetFlowPageInstanceLocalProperty(state, flowId, pageFrameId, path) {
    const graph = state.project.documentationFlowGraphs[flowId], frame = graph?.pageFrames?.find(({ id }) => id === pageFrameId);
    if (!frame)
        throw new Error(`Flow Page instance ${pageFrameId} is unavailable.`);
    return transactProject(state, `Reset ${path} to parents at Flow Page instance`, (project) => { const graphs = project.documentationFlowGraphs; return { ...project, documentationFlowGraphs: { ...graphs, [flowId]: { ...graphs[flowId], pageFrames: graphs[flowId].pageFrames.map((candidate) => candidate.id === pageFrameId ? { ...candidate, localSchemaContributions: (candidate.localSchemaContributions ?? []).filter((constraint) => constraint.path !== path), compiledTargetsStale: true } : candidate) } } }; });
}
//# sourceMappingURL=data-layer-layered-schema-project.js.map