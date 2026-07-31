import { canonicalConstraints, canonicalPropertyPath } from "./data-layer-canonical-schema.js";
const clone = (value) => structuredClone(value);
const orderedChildren = (document, parentId) => Object.values(document.nodes).filter((node) => node.parentId === parentId).sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
const orderedIds = (document, parentId) => orderedChildren(document, parentId).flatMap((node) => [node.id, ...orderedIds(document, node.id)]);
const predicatePropertyIds = (predicate) => predicate ? predicate.kind === "predicate" ? [predicate.propertyId] : predicate.children.flatMap(predicatePropertyIds) : [];
const stableUnique = (values) => [...new Set(values)];
const dependencyRulesFor = (node, recipe) => {
    const presenceId = `presence:${node.id}`, presence = recipe.presenceReplacements.some(({ sourceRuleId }) => sourceRuleId === presenceId) || recipe.excludedRuleIds.includes(presenceId) ? [] : node.presence.condition ? [{ id: presenceId, condition: node.presence.condition }] : [];
    const rules = node.rules.flatMap((rule) => { if (rule.enforcement === "invariant")
        return [{ id: rule.id, ...(rule.condition ? { condition: rule.condition } : {}) }]; const replacements = recipe.ruleReplacements.filter(({ sourceRuleId, propertyId }) => sourceRuleId === rule.id && propertyId === node.id); if (replacements.length)
        return replacements.map(({ rule: replacement }) => ({ id: rule.id, ...(replacement.condition ? { condition: replacement.condition } : {}) })); if (recipe.excludedRuleIds.includes(rule.id))
        return []; return [{ id: rule.id, ...(rule.condition ? { condition: rule.condition } : {}) }]; });
    return [...presence, ...rules];
};
const effectiveRulesFor = (node, recipe) => node.rules.flatMap((rule) => { if (rule.enforcement === "invariant")
    return [clone(rule)]; const replacements = recipe.ruleReplacements.filter(({ sourceRuleId, propertyId }) => sourceRuleId === rule.id && propertyId === node.id); if (replacements.length)
    return replacements.map(({ rule: replacement }) => clone(replacement)); return recipe.excludedRuleIds.includes(rule.id) ? [] : [clone(rule)]; });
const applyDerivedRuleFacets = (constraint, rules) => { delete constraint.patterns; delete constraint.minimum; delete constraint.maximum; delete constraint.minItems; delete constraint.maxItems; const ordinary = rules.filter(({ enabled, condition, arrayScope }) => enabled !== false && !condition && !arrayScope?.boundaries.length), patterns = ordinary.flatMap(({ kind, pattern }) => kind === "pattern" && pattern ? [pattern] : []), minimums = ordinary.flatMap(({ kind, minimum }) => kind === "range" && minimum !== undefined ? [minimum] : []), maximums = ordinary.flatMap(({ kind, maximum }) => kind === "range" && maximum !== undefined ? [maximum] : []), minItems = ordinary.flatMap(({ kind, minItems }) => kind === "cardinality" && minItems !== undefined ? [minItems] : []), maxItems = ordinary.flatMap(({ kind, maxItems }) => kind === "cardinality" && maxItems !== undefined ? [maxItems] : []); if (patterns.length)
    constraint.patterns = stableUnique(patterns); if (minimums.length)
    constraint.minimum = Math.max(...minimums); if (maximums.length)
    constraint.maximum = Math.min(...maximums); if (minItems.length)
    constraint.minItems = Math.max(...minItems); if (maxItems.length)
    constraint.maxItems = Math.min(...maxItems); };
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
    const dependencyIds = new Set(), missingRuleDependencies = [], queued = [...direct], processed = new Set(), missingKeys = new Set();
    while (queued.length) {
        const sourcePropertyId = queued.shift();
        if (processed.has(sourcePropertyId))
            continue;
        processed.add(sourcePropertyId);
        const node = document.nodes[sourcePropertyId];
        if (!node)
            continue;
        for (const rule of dependencyRulesFor(node, recipe))
            for (const propertyId of predicatePropertyIds(rule.condition)) {
                if (direct.has(propertyId) || dependencyIds.has(propertyId))
                    continue;
                if (recipe.includedDependencyPropertyIds.includes(propertyId) && document.nodes[propertyId] && !excluded.has(propertyId)) {
                    dependencyIds.add(propertyId);
                    queued.push(propertyId);
                    continue;
                }
                const key = `${sourcePropertyId}\0${rule.id}\0${propertyId}`;
                if (!missingKeys.has(key)) {
                    missingKeys.add(key);
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
    const selection = profileInheritanceSelection(document, recipe), direct = new Set(selection.directPropertyIds), dependencies = new Set(selection.ruleDependencyPropertyIds), structural = new Set(selection.structuralPropertyIds), byId = new Map(canonicalConstraints(document).map((constraint) => [constraint.definitionId, constraint]));
    const constraints = selection.effectivePropertyIds.flatMap((propertyId) => {
        const source = byId.get(propertyId), node = document.nodes[propertyId];
        if (!source || !node)
            return [];
        if (structural.has(propertyId))
            return [{ path: source.path, type: source.type, definitionId: propertyId, selectionReason: "structural" }];
        const constraint = clone(source), nextRules = effectiveRulesFor(node, recipe);
        constraint.rules = nextRules;
        applyDerivedRuleFacets(constraint, nextRules);
        const presenceId = `presence:${propertyId}`, presenceReplacement = recipe.presenceReplacements.find(({ sourceRuleId, propertyId: replacementPropertyId }) => sourceRuleId === presenceId && replacementPropertyId === propertyId);
        if (recipe.excludedRuleIds.includes(presenceId)) {
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
const missingDependencyKey = ({ propertyId, sourcePropertyId, sourceRuleId }) => `${sourcePropertyId}\0${sourceRuleId}\0${propertyId}`;
const ruleFingerprints = (document, propertyIds, recipe) => Object.fromEntries(propertyIds.flatMap((propertyId) => { const node = document.nodes[propertyId]; if (!node)
    return []; const presenceId = `presence:${propertyId}`, presenceOverridden = recipe.excludedRuleIds.includes(presenceId) || recipe.presenceReplacements.some(({ sourceRuleId }) => sourceRuleId === presenceId); return [...(!presenceOverridden && node.presence.condition ? [[presenceId, JSON.stringify(node.presence)]] : []), ...effectiveRulesFor(node, recipe).map((rule) => [rule.id, JSON.stringify(rule)])]; }));
export function profileInheritanceSourceSnapshot(document, recipe) { const selection = profileInheritanceSelection(document, recipe); return { revision: document.revision, effectivePropertyIds: [...selection.effectivePropertyIds], propertyPaths: Object.fromEntries(selection.effectivePropertyIds.flatMap((propertyId) => document.nodes[propertyId] ? [[propertyId, canonicalPropertyPath(document, propertyId)]] : [])), ruleFingerprints: ruleFingerprints(document, selection.effectivePropertyIds, recipe), missingRuleDependencyKeys: selection.missingRuleDependencies.map(missingDependencyKey) }; }
export function profileInheritanceRecipeApplied(document, recipe) { const applied = { ...clone(recipe), sourceRevision: document.revision, sourceSnapshot: profileInheritanceSourceSnapshot(document, recipe) }; delete applied.sourceImpact; return applied; }
export function profileInheritanceCurrentImpact(document, recipe) { const snapshot = recipe.sourceSnapshot, selection = profileInheritanceSelection(document, recipe); if (!snapshot)
    return { addedEffectivePropertyIds: [], removedPropertyIds: selection.missingPropertyIds, changedPaths: [], changedRuleIds: [], newMissingRuleDependencies: selection.missingRuleDependencies, stale: document.revision !== recipe.sourceRevision || Boolean(selection.missingPropertyIds.length || selection.missingRuleDependencies.length) }; const effective = new Set(selection.effectivePropertyIds), prior = new Set(snapshot.effectivePropertyIds), addedEffectivePropertyIds = selection.effectivePropertyIds.filter((id) => !prior.has(id)), removedPropertyIds = snapshot.effectivePropertyIds.filter((id) => !effective.has(id)), changedPaths = snapshot.effectivePropertyIds.flatMap((propertyId) => { const before = snapshot.propertyPaths[propertyId], node = document.nodes[propertyId]; if (!before || !node)
    return []; const after = canonicalPropertyPath(document, propertyId); return before === after ? [] : [{ propertyId, before, after }]; }), currentRules = ruleFingerprints(document, stableUnique([...snapshot.effectivePropertyIds, ...selection.effectivePropertyIds]), recipe), changedRuleIds = stableUnique([...Object.keys(snapshot.ruleFingerprints), ...Object.keys(currentRules)]).filter((id) => snapshot.ruleFingerprints[id] !== currentRules[id]), knownMissing = new Set(snapshot.missingRuleDependencyKeys), newMissingRuleDependencies = selection.missingRuleDependencies.filter((dependency) => !knownMissing.has(missingDependencyKey(dependency))), stale = Boolean(addedEffectivePropertyIds.length || removedPropertyIds.length || changedPaths.length || changedRuleIds.length || newMissingRuleDependencies.length); return { addedEffectivePropertyIds, removedPropertyIds, changedPaths, changedRuleIds, newMissingRuleDependencies, stale }; }
export function markProfileInheritanceTargetStale(target, profileId, before, after) { const recipes = (target.profileInheritanceRecipes ?? []), affected = recipes.some((recipe) => recipe.profileId === profileId); if (!affected)
    return target; const nextRecipes = recipes.map((recipe) => { if (recipe.profileId !== profileId)
    return recipe; const impact = recipe.sourceSnapshot ? profileInheritanceCurrentImpact(after, recipe) : profileInheritanceImpact(before, after, recipe); return { ...clone(recipe), sourceImpact: impact }; }); return { ...target, profileInheritanceRecipes: nextRecipes, compiledTargetsStale: true, validationStale: true, testCasesStale: true, documentationStale: true, exportStale: true }; }
export function markProfileInheritanceConsumersForSourceChange(project, profileId, before, after) { return { ...project, collections: { ...project.collections, pages: project.collections.pages.map((entity) => markProfileInheritanceTargetStale(entity, profileId, before, after)), pageGroups: project.collections.pageGroups.map((entity) => markProfileInheritanceTargetStale(entity, profileId, before, after)), events: project.collections.events.map((entity) => markProfileInheritanceTargetStale(entity, profileId, before, after)) } }; }
export function profileInheritanceImpact(before, after, recipe) { const priorRecipe = profileInheritanceRecipeApplied(before, recipe), impact = profileInheritanceCurrentImpact(after, priorRecipe), referenced = stableUnique([...recipe.propertySelections, ...recipe.excludedPropertyIds, ...recipe.includedDependencyPropertyIds]), removedPinned = referenced.filter((id) => before.nodes[id] && !after.nodes[id]); return { ...impact, removedPropertyIds: stableUnique([...impact.removedPropertyIds, ...removedPinned]) }; }
//# sourceMappingURL=data-layer-selective-profile-inheritance.js.map