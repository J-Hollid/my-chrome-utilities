import { canonicalConstraints, canonicalTableRows } from "../data-layer-canonical-schema.js";
import { compileLayeredSchema } from "../data-layer-layered-schema.js";
import { layeredContributorPath, layeredContributorsForPath } from "../data-layer-layered-schema-project.js";
import { profileInheritanceParentAdditions } from "../data-layer-selective-profile-inheritance.js";
const clone = (value) => structuredClone(value);
const canonicalLocalConstraints = (document) => canonicalConstraints(document).map((constraint) => { const row = canonicalTableRowForPath(document, constraint.path), node = row && document.nodes[row.id]; if (!node?.localDefinitionFacets)
    return constraint; if (node.structureOwned && !node.inheritedDefinition)
    return constraint; const keys = new Set(node.localDefinitionFacets), result = { path: constraint.path }; if (node.structureOwned && constraint.definitionId)
    result.definitionId = constraint.definitionId; for (const key of keys)
    if (constraint[key] !== undefined)
        result[key] = clone(constraint[key]); const localRules = (constraint.rules ?? []).filter((rule) => ["local", "overridden", "effective"].includes(String(rule.provenance?.state ?? ""))); if (localRules.length)
    result.rules = localRules; if (keys.has("allowedValues")) {
    if (constraint.allowedValueIds)
        result.allowedValueIds = constraint.allowedValueIds;
    if (constraint.allowedValueProvenance)
        result.allowedValueProvenance = constraint.allowedValueProvenance;
} return result; }).filter((constraint) => Object.keys(constraint).length > 1);
const canonicalTableRowForPath = (document, path) => canonicalTableRows(document).find((row) => row.path === path);
const constraintsFor = (entity) => { const canonical = entity.canonicalSchema; return [...(canonical ? canonicalLocalConstraints(canonical) : (entity.schemaConstraints ?? [])), ...(entity.localSchemaContributions ?? [])]; };
const mergedAt = (constraints, path) => constraints.filter((constraint) => constraint.path === path).reduce((result, constraint) => ({ ...result, ...clone(constraint), path }), { path });
const entities = (state) => Object.values(state.project.collections).flat();
const eventContext = (entity) => ({ eventId: String(entity.eventId ?? entity.id), eventRole: (entity.role === "context-setting" ? "context" : "interaction") });
const provenanceFor = (effective, entityId) => { const shadowed = new Set(effective.superseded.map(({ contributorId }) => contributorId)), lastOrigin = effective.origins.at(-1)?.contributorId; return effective.origins.map((origin) => ({ ...origin, state: origin.contributorId === entityId || origin.contributorId === lastOrigin ? "effective" : shadowed.has(origin.contributorId) ? "shadowed" : "inherited" })); };
const displayValue = (value) => typeof value === "string" && value.length ? value[0].toUpperCase() + value.slice(1) : JSON.stringify(value);
const decisionDetail = (conflict) => conflict.facet && conflict.localContributor && conflict.sourceContributor ? `${conflict.localContributor} uses ${displayValue(conflict.localValue)}. ${conflict.sourceContributor} uses ${displayValue(conflict.sourceValue)}. ${conflict.message}.` : undefined;
const facetKey = (facet) => facet === "Type" ? "type" : facet === "Presence" ? "presence" : facet === "Allowed values" ? "allowedValues" : facet === "Expected value" ? "expectedValue" : facet === "Pattern rule" ? "patterns" : facet === "Range rule" ? "minimum" : facet === "Cardinality rule" ? "minItems" : facet === "Array item definition" ? "itemSchema" : undefined;
const facetLabel = (facet) => facet === "type" ? "Type" : facet === "presence" ? "Presence" : facet === "allowedValues" ? "Allowed values" : facet === "expectedValue" ? "Expected value" : facet === "patterns" ? "Pattern rule" : facet === "minimum" || facet === "maximum" ? "Range rule" : facet === "minItems" || facet === "maxItems" ? "Cardinality rule" : facet === "itemType" || facet === "itemSchema" ? "Array item definition" : String(facet);
const localOwnsFacet = (local, facet) => Object.hasOwn(local, facet) || Boolean(local.rules?.some((rule) => facet === "patterns" ? rule.kind === "pattern" : facet === "minimum" ? rule.kind === "range" : facet === "minItems" ? rule.kind === "cardinality" : false));
const inventoryFacets = ["concept", "type", "nullable", "presence", "allowedValues", "expectedValue", "documentation", "comments", "examples", "itemType", "itemSchema", "patterns", "minimum", "maximum", "minItems", "maxItems"];
const inventoryLabel = (facet) => facet === "documentation" ? "Description" : facet === "comments" ? "Comments" : facet === "examples" ? "Example" : facetLabel(facet);
const localChangesFor = (rows) => rows.flatMap((row) => {
    const sourceContributor = row.inherited?.origins.at(-1)?.contributorName;
    if (!row.inherited && Object.keys(row.local).length > 1)
        return [{ path: row.path, items: [{ kind: "property", key: "property", label: "Local property", localValue: clone(row.local), effectiveValue: clone(row.effective), parentDiffers: false, action: "remove-property" }] }];
    const items = inventoryFacets.flatMap((facet) => Object.hasOwn(row.local, facet) && row.local[facet] !== undefined ? [{ kind: "facet", key: String(facet), label: inventoryLabel(facet), ...(sourceContributor ? { sourceContributor } : {}), inheritedValue: clone(row.inherited?.[facet]), localValue: clone(row.local[facet]), effectiveValue: clone(row.effective[facet]), parentDiffers: JSON.stringify(row.inherited?.[facet]) !== JSON.stringify(row.local[facet]), action: "reset-facet" }] : []);
    for (const rule of row.local.rules ?? []) {
        const ruleId = String(rule.id ?? ""), sourceRuleId = String(rule.replacesRuleId ?? ruleId), inheritedRule = row.inherited?.rules?.find((candidate) => String(candidate.id ?? "") === sourceRuleId), effectiveRule = row.effective.rules?.find((candidate) => String(candidate.id ?? "") === ruleId || String(candidate.replacesRuleId ?? "") === sourceRuleId);
        items.push({ kind: "rule", key: ruleId, label: String(rule.name ?? "Local rule"), ...(sourceContributor ? { sourceContributor } : {}), inheritedValue: clone(inheritedRule), localValue: clone(rule), effectiveValue: clone(effectiveRule ?? rule), parentDiffers: JSON.stringify(inheritedRule) !== JSON.stringify(rule), action: "reset-rule", ruleId });
    }
    return items.length ? [{ path: row.path, items }] : [];
});
const parentAdditionsFor = (state, entity) => (entity.profileInheritanceRecipes ?? []).flatMap((recipe) => { const profile = state.project.collections.profiles.find(({ id }) => id === recipe.profileId), document = profile?.canonicalSchema; if (!profile || !document)
    return []; const additions = profileInheritanceParentAdditions(document, recipe), groups = [...new Set(additions.map(({ sourceGroup }) => sourceGroup))]; return groups.map((sourceGroup) => ({ profileId: profile.id, profileName: profile.name, recipeId: recipe.id, sourceGroup, items: additions.filter((item) => item.sourceGroup === sourceGroup) })); });
const repairsFor = (conflicts, allEntities, entity, local) => {
    const repairs = [];
    for (const conflict of conflicts) {
        const facet = facetKey(conflict.facet), source = allEntities.find(({ id }) => id === conflict.sourceContributorId);
        if (facet && conflict.localContributorId !== entity.id && conflict.sourceContributorId !== entity.id) {
            for (const [contributorId, contributorName, value, repairFacet, rejectedContributorId, rejectedFacet, rejectedAuthority] of [[conflict.sourceContributorId, conflict.sourceContributor, conflict.sourceValue, conflict.sourceFacet ?? facet, conflict.localContributorId, conflict.localFacet ?? facet, conflict.localFacetProtected || conflict.localRuleInvariant], [conflict.localContributorId, conflict.localContributor, conflict.localValue, conflict.localFacet ?? facet, conflict.sourceContributorId, conflict.sourceFacet ?? facet, conflict.sourceFacetProtected || conflict.sourceRuleInvariant]]) {
                const contributor = allEntities.find(({ id }) => id === contributorId);
                if (contributor && contributorName && rejectedContributorId && !rejectedAuthority)
                    repairs.push({ kind: "use-contextual", contributorId: contributor.id, contributorName, label: `Use ${contributorName} ${facetLabel(repairFacet)} here`, facet: repairFacet, value: clone(value), rejectedContributorId, rejectedFacet });
            }
            continue;
        }
        if (facet && source && conflict.localContributorId === entity.id && localOwnsFacet(local, facet)) {
            const namedRule = conflict.section === "Rules" && Boolean(conflict.localRuleId && conflict.sourceRuleId), kind = namedRule ? (conflict.sourceRuleInvariant ? "remove-local-rule" : "override-rule") : "use-source", label = kind === "remove-local-rule" ? `Remove ${entity.name} ${conflict.facet}` : kind === "override-rule" ? `Override ${source.name} ${conflict.facet} here` : `Use ${source.name} ${conflict.facet}`;
            repairs.push({ kind, contributorId: source.id, contributorName: source.name, label, facet, ...(conflict.localRuleId ? { ruleId: conflict.localRuleId } : {}), ...(conflict.sourceRuleId ? { sourceRuleId: conflict.sourceRuleId } : {}) }, { kind: "open-source", contributorId: source.id, contributorName: source.name, label: `Open ${source.name}` });
            continue;
        }
        for (const [index, name] of conflict.contributors.entries()) {
            const id = conflict.contributorIds?.[index], contributor = id ? allEntities.find((candidate) => candidate.id === id) : allEntities.find((candidate) => candidate.name === name);
            if (contributor)
                repairs.push({ kind: "edit-contributor", contributorId: contributor.id, contributorName: name, label: contributor.id === entity.id ? `Adjust ${entity.name} override` : `Edit ${name}` });
        }
    }
    return repairs.filter((repair, index, all) => all.findIndex(({ kind, contributorId, facet, ruleId }) => kind === repair.kind && contributorId === repair.contributorId && facet === repair.facet && ruleId === repair.ruleId) === index);
};
export function composedSchemaWorkspace(state, entity, scope, observation, flowId, pageGroupApplicabilitySetIds) {
    const contributorPath = layeredContributorPath(state, entity, scope, flowId), selectedSets = pageGroupApplicabilitySetIds ? new Set(pageGroupApplicabilitySetIds) : undefined, participatingGroupIds = selectedSets ? (contributorPath.pageGroupIds ?? (contributorPath.pageGroupId ? [contributorPath.pageGroupId] : [])).filter((groupId) => { const group = state.project.collections.pageGroups.find(({ id }) => id === groupId); return !group?.applicabilitySetId || selectedSets.has(String(group.applicabilitySetId)); }) : undefined, contributors = layeredContributorsForPath(state, participatingGroupIds ? { ...contributorPath, pageGroupIds: participatingGroupIds } : contributorPath, observation), parents = contributors.filter(({ id }) => id !== entity.id), compiled = compileLayeredSchema(contributors, eventContext(entity)), parentCompiled = compileLayeredSchema(parents, eventContext(entity)), localConstraints = constraintsFor(entity), paths = new Set([...Object.keys(parentCompiled.properties), ...Object.keys(compiled.properties), ...localConstraints.map(({ path }) => path), ...compiled.conflicts.map(({ path }) => path).filter((path) => path !== "/")]), allEntities = entities(state);
    const rows = [...paths].sort((left, right) => left.localeCompare(right)).map((path) => { const inherited = parentCompiled.properties[path], local = mergedAt(localConstraints, path), effective = compiled.properties[path] ?? inherited ?? { path, origins: [], superseded: [] }, conflicts = compiled.conflicts.filter((conflict) => conflict.path === path), repairs = repairsFor(conflicts, allEntities, entity, local), decisions = conflicts.flatMap((conflict) => { const detail = decisionDetail(conflict); return conflict.facet && conflict.section && detail ? [{ facet: conflict.facet, section: conflict.section, detail, repairs: repairsFor([conflict], allEntities, entity, local), ...(conflict.sourceRuleId ? { sourceRuleId: conflict.sourceRuleId } : {}), ...(conflict.localRuleId ? { localRuleId: conflict.localRuleId } : {}) }] : []; }), decision = decisions[0], hasLocal = localConstraints.some((constraint) => constraint.path === path), ordinaryResolution = hasLocal && conflicts.length === 0 && effective.superseded.some(({ contributorId }) => contributorId !== entity.id), selectionReason = inherited?.selectionReason; return { path, ...(inherited ? { inherited: clone(inherited) } : {}), local, effective: clone(effective), source: `${(inherited?.origins ?? []).flatMap(({ contributorName, inheritanceRoutes }) => inheritanceRoutes?.length ? [...inheritanceRoutes] : [contributorName]).join(" · ") || "Local only"}${selectionReason ? ` · ${selectionReason} selection` : ""}`, ...(selectionReason ? { selectionReason } : {}), validationState: conflicts.length ? "blocked" : ordinaryResolution ? "warning" : "ready", decisions, ...(decision ? { decisionFacet: decision.facet, decisionDetail: decision.detail } : {}), message: conflicts.map(({ message }) => message).join(" · ") || (ordinaryResolution ? `Parent difference resolved by ${entity.name} override` : hasLocal ? "Local contribution is effective" : selectionReason ? `Inherited from live parents by ${selectionReason} selection` : "Inherited from live parents"), action: hasLocal ? (inherited ? "reset" : "remove") : "override", provenance: provenanceFor(effective, entity.id), repairs }; });
    const decisionCount = new Set(compiled.conflicts.map(({ path }) => path).filter((path) => path !== "/")).size, schemaDecisionCount = compiled.conflicts.filter(({ path }) => path === "/").length, decisionSummary = decisionCount && schemaDecisionCount ? `${decisionCount} ${decisionCount === 1 ? "property needs a decision" : "properties need decisions"} and ${schemaDecisionCount} schema ${schemaDecisionCount === 1 ? "decision is" : "decisions are"} required` : decisionCount ? `${decisionCount} ${decisionCount === 1 ? "property needs a decision" : "properties need decisions"}` : `${schemaDecisionCount} schema ${schemaDecisionCount === 1 ? "decision is" : "decisions are"} required`;
    const localChanges = localChangesFor(rows), localChangeCount = localChanges.reduce((count, { items }) => count + items.length, 0), parentAdditions = parentAdditionsFor(state, entity), parentAdditionCount = parentAdditions.reduce((count, { items }) => count + items.length, 0);
    return { heading: `Effective schema at ${entity.name}`, status: compiled.status, rows, conflictSummary: compiled.status === "blocked" ? `${decisionSummary} before validation and developer export.` : "Ready for validation and developer export.", localChanges, localChangeCount, parentAdditions, parentAdditionCount };
}
//# sourceMappingURL=workspace-model.js.map