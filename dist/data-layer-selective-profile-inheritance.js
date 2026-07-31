import { canonicalConstraints, canonicalPropertyPath } from "./data-layer-canonical-schema.js";
const clone = (value) => structuredClone(value);
const orderedChildren = (document, parentId) => Object.values(document.nodes).filter((node) => node.parentId === parentId).sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
const orderedIds = (document, parentId) => orderedChildren(document, parentId).flatMap((node) => [node.id, ...orderedIds(document, node.id)]);
const predicatePropertyIds = (predicate) => predicate ? predicate.kind === "predicate" ? [predicate.propertyId] : predicate.children.flatMap(predicatePropertyIds) : [];
const stableUnique = (values) => [...new Set(values)];
const rulesFor = (node) => [
    ...(node.presence.condition ? [{ id: `presence:${node.id}`, condition: node.presence.condition }] : []),
    ...node.rules.map(({ id, condition }) => ({ id, ...(condition ? { condition } : {}) })),
];
const hasRuleResolution = (recipe, ruleId) => recipe.excludedRuleIds.includes(ruleId) || recipe.ruleReplacements.some(({ sourceRuleId }) => sourceRuleId === ruleId) || recipe.presenceReplacements.some(({ sourceRuleId }) => sourceRuleId === ruleId);
export function createProfileInheritanceRecipe(input) {
    return { ...input, conceptSelections: [], propertySelections: [], excludedPropertyIds: [], includedDependencyPropertyIds: [], excludedRuleIds: [], ruleReplacements: [], presenceReplacements: [] };
}
export function selectProfileInheritanceBranch(document, recipe, propertyId) {
    if (!document.nodes[propertyId])
        return clone(recipe);
    return { ...clone(recipe), propertySelections: stableUnique([...recipe.propertySelections, propertyId, ...orderedIds(document, propertyId)]) };
}
export function profileInheritanceSelection(document, recipe) {
    const order = orderedIds(document), excluded = new Set(recipe.excludedPropertyIds), missingPropertyIds = recipe.propertySelections.filter((id) => !document.nodes[id]), direct = new Set();
    for (const id of order) {
        const node = document.nodes[id];
        if (excluded.has(id))
            continue;
        if (recipe.startingPoint === "everything" || recipe.propertySelections.includes(id) || Boolean(node.concept && recipe.conceptSelections.includes(node.concept)))
            direct.add(id);
    }
    const dependencyIds = new Set(), missingRuleDependencies = [];
    for (const sourcePropertyId of direct) {
        const node = document.nodes[sourcePropertyId];
        for (const rule of rulesFor(node)) {
            if (hasRuleResolution(recipe, rule.id))
                continue;
            for (const propertyId of predicatePropertyIds(rule.condition)) {
                if (direct.has(propertyId) || dependencyIds.has(propertyId))
                    continue;
                if (recipe.includedDependencyPropertyIds.includes(propertyId) && document.nodes[propertyId] && !excluded.has(propertyId))
                    dependencyIds.add(propertyId);
                else
                    missingRuleDependencies.push({ propertyId, sourcePropertyId, sourceRuleId: rule.id });
            }
        }
    }
    const selected = new Set([...direct, ...dependencyIds]), structural = new Set();
    for (const id of selected) {
        let parent = document.nodes[id]?.parentId;
        while (parent) {
            if (!selected.has(parent))
                structural.add(parent);
            parent = document.nodes[parent]?.parentId;
        }
    }
    const inOrder = (ids) => order.filter((id) => ids.has(id));
    return { directPropertyIds: inOrder(direct), structuralPropertyIds: inOrder(structural), ruleDependencyPropertyIds: inOrder(dependencyIds), effectivePropertyIds: order.filter((id) => direct.has(id) || dependencyIds.has(id) || structural.has(id)), missingPropertyIds: stableUnique(missingPropertyIds), missingRuleDependencies };
}
export function selectiveProfileContribution(document, recipe) {
    const selection = profileInheritanceSelection(document, recipe), selected = new Set(selection.effectivePropertyIds), direct = new Set(selection.directPropertyIds), dependencies = new Set(selection.ruleDependencyPropertyIds), byId = new Map(canonicalConstraints(document).map((constraint) => [constraint.definitionId, constraint]));
    const constraints = selection.effectivePropertyIds.flatMap((propertyId) => {
        const source = byId.get(propertyId);
        if (!source)
            return [];
        const constraint = clone(source), excludedRules = new Set(recipe.excludedRuleIds), replacements = recipe.ruleReplacements.filter((item) => item.propertyId === propertyId), nextRules = [...(constraint.rules ?? []).filter(({ id }) => !excludedRules.has(id)), ...replacements.map(({ rule }) => clone(rule))];
        constraint.rules = nextRules;
        const presenceId = `presence:${propertyId}`, presenceReplacement = recipe.presenceReplacements.find(({ sourceRuleId, propertyId: replacementPropertyId }) => sourceRuleId === presenceId && replacementPropertyId === propertyId);
        if (excludedRules.has(presenceId)) {
            delete constraint.presence;
            delete constraint.condition;
        }
        if (presenceReplacement) {
            constraint.presence = presenceReplacement.presence;
            delete constraint.condition;
        }
        return [{ ...constraint, selectionReason: direct.has(propertyId) ? "direct" : dependencies.has(propertyId) ? "rule-dependency" : "structural" }];
    });
    return { constraints, selection, conflicts: selection.missingRuleDependencies.map(({ sourcePropertyId, sourceRuleId, propertyId }) => ({ path: canonicalPropertyPath(document, sourcePropertyId), sourceRuleId, dependencyPropertyId: propertyId })) };
}
export function profileInheritanceSummary(document, recipe) { const selection = profileInheritanceSelection(document, recipe); return { direct: selection.directPropertyIds.length, structural: selection.structuralPropertyIds.length, ruleDependencies: selection.ruleDependencyPropertyIds.length, missingDependencies: selection.missingRuleDependencies.length, conflicts: selection.missingRuleDependencies.length, effective: selection.effectivePropertyIds.length, synchronizedConcepts: recipe.conceptSelections.length, fixedProperties: recipe.propertySelections.filter((id) => document.nodes[id] && !recipe.excludedPropertyIds.includes(id)).length, exclusions: recipe.excludedPropertyIds.length, ruleOverrides: recipe.excludedRuleIds.length + recipe.ruleReplacements.length + recipe.presenceReplacements.length, missingSelections: selection.missingPropertyIds.length }; }
export function searchProfileInheritanceProperties(document, filters, recipe) { const selected = new Set(profileInheritanceSelection(document, recipe).directPropertyIds), query = filters.query.trim().toLocaleLowerCase(); return orderedIds(document).map((id) => document.nodes[id]).filter((node) => { const text = [node.name, canonicalPropertyPath(document, node.id), node.documentation.displayText, node.documentation.description, node.documentation.comments, node.documentation.example.value].map((value) => String(value ?? "").toLocaleLowerCase()).join(" "), required = node.presence.mode.startsWith("required"), isSelected = selected.has(node.id); return (!query || text.includes(query)) && (filters.concept === "all" || node.concept === filters.concept) && (filters.type === "all" || node.type === filters.type) && (filters.required === "any" || (filters.required === "required" ? required : !required)) && (filters.selection === "any" || (filters.selection === "selected" ? isSelected : !isSelected)); }); }
export function copyProfileInheritanceRecipe(recipe, input) { return { ...clone(recipe), ...input }; }
export function profileInheritanceImpact(before, after, recipe) { const referenced = stableUnique([...recipe.propertySelections, ...recipe.excludedPropertyIds, ...recipe.includedDependencyPropertyIds]), removedPropertyIds = referenced.filter((id) => before.nodes[id] && !after.nodes[id]), addedEffectivePropertyIds = profileInheritanceSelection(after, recipe).effectivePropertyIds.filter((id) => !profileInheritanceSelection(before, recipe).effectivePropertyIds.includes(id)), changedPaths = referenced.flatMap((propertyId) => before.nodes[propertyId] && after.nodes[propertyId] && canonicalPropertyPath(before, propertyId) !== canonicalPropertyPath(after, propertyId) ? [{ propertyId, before: canonicalPropertyPath(before, propertyId), after: canonicalPropertyPath(after, propertyId) }] : []), changedRuleIds = recipe.excludedRuleIds.filter((ruleId) => JSON.stringify(Object.values(before.nodes).flatMap(({ rules }) => rules).find(({ id }) => id === ruleId)) !== JSON.stringify(Object.values(after.nodes).flatMap(({ rules }) => rules).find(({ id }) => id === ruleId))); return { addedEffectivePropertyIds, removedPropertyIds, changedPaths, changedRuleIds, stale: Boolean(addedEffectivePropertyIds.length || removedPropertyIds.length || changedPaths.length || changedRuleIds.length) }; }
//# sourceMappingURL=data-layer-selective-profile-inheritance.js.map