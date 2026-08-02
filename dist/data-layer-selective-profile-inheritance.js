import { canonicalConstraints, canonicalPropertyPath } from "./data-layer-canonical-schema.js";
const clone = (value) => structuredClone(value);
const orderedChildren = (document, parentId) => Object.values(document.nodes).filter((node) => node.parentId === parentId).sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
const orderedIds = (document, parentId) => orderedChildren(document, parentId).flatMap((node) => [node.id, ...orderedIds(document, node.id)]);
const predicatePropertyIds = (predicate) => predicate ? predicate.kind === "predicate" ? [predicate.propertyId] : predicate.children.flatMap(predicatePropertyIds) : [];
const stableUnique = (values) => [...new Set(values)];
const structuralItemShape = (item) => ({ id: item.id, ...(item.type ? { type: item.type } : {}), ...(item.items ? { items: structuralItemShape(item.items) } : {}) });
const structuralDefinitionShape = (node) => ({ type: node.type, ...(node.itemType ? { itemType: node.itemType } : {}), ...(node.itemSchema ? { itemSchema: structuralItemShape(node.itemSchema) } : {}) });
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
const conceptFor = (node) => node.concept?.trim() || "Ungrouped";
const checkedState = (selectedCount, totalCount) => selectedCount === 0 ? "false" : selectedCount === totalCount ? "true" : "mixed";
export function profileInheritanceTree(document, recipe, filters) {
    const order = orderedIds(document), selected = new Set(profileInheritanceSelection(document, recipe).directPropertyIds), concepts = stableUnique(order.map((id) => conceptFor(document.nodes[id]))), matching = filters ? new Set(searchProfileInheritanceProperties(document, filters, recipe).map(({ id }) => id)) : undefined, result = [];
    for (const concept of concepts) {
        const conceptIds = order.filter((id) => conceptFor(document.nodes[id]) === concept), visibleTargets = matching ? conceptIds.filter((id) => matching.has(id)) : conceptIds;
        if (!visibleTargets.length)
            continue;
        const included = new Set(), operatedById = new Map();
        for (const id of visibleTargets) {
            let current = id;
            while (current) {
                included.add(current);
                operatedById.set(current, [...(operatedById.get(current) ?? []), id]);
                current = document.nodes[current]?.parentId;
            }
        }
        const children = new Map();
        for (const id of order.filter((candidate) => included.has(candidate))) {
            const parent = document.nodes[id].parentId;
            children.set(parent, [...(children.get(parent) ?? []), id]);
        }
        const descendantIds = (propertyId) => operatedById.get(propertyId) ?? [];
        const selectedConceptCount = visibleTargets.filter((id) => selected.has(id)).length, conceptNodeId = `concept:${concept}`;
        result.push({ id: conceptNodeId, kind: "concept", level: 1, label: concept, concept, descendantPropertyIds: visibleTargets, selectedCount: selectedConceptCount, totalCount: visibleTargets.length, checked: checkedState(selectedConceptCount, visibleTargets.length) });
        const appendProperties = (parentPropertyId, level) => { for (const id of children.get(parentPropertyId) ?? []) {
            const node = document.nodes[id], descendantPropertyIds = descendantIds(id), selectedCount = descendantPropertyIds.filter((candidate) => selected.has(candidate)).length, hasChildren = (children.get(id)?.length ?? 0) > 0;
            result.push({ id: `property:${concept}:${id}`, parentId: parentPropertyId ? `property:${concept}:${parentPropertyId}` : conceptNodeId, kind: hasChildren ? "branch" : "property", level, label: node.name, concept, propertyId: id, descendantPropertyIds, selectedCount, totalCount: descendantPropertyIds.length, checked: checkedState(selectedCount, descendantPropertyIds.length) });
            appendProperties(id, level + 1);
        } };
        appendProperties(undefined, 2);
    }
    return result;
}
export function profileInheritanceTreeWindow(tree, offset, limit) {
    const safeLimit = Math.max(1, Math.floor(limit)), safeOffset = Math.min(Math.max(0, Math.floor(offset)), Math.max(0, tree.length - 1)), included = new Set(tree.slice(safeOffset, safeOffset + safeLimit).map(({ id }) => id)), byId = new Map(tree.map((node) => [node.id, node]));
    for (const id of [...included]) {
        let parent = byId.get(id)?.parentId;
        while (parent) {
            included.add(parent);
            parent = byId.get(parent)?.parentId;
        }
    }
    return { nodes: tree.filter(({ id }) => included.has(id)), offset: safeOffset, total: tree.length };
}
export function toggleProfileInheritanceConcept(document, recipe, concept) {
    const next = clone(recipe), ids = Object.values(document.nodes).filter((node) => conceptFor(node) === concept).map(({ id }) => id), active = next.conceptSelections.includes(concept), idSet = new Set(ids);
    next.conceptSelections = active ? next.conceptSelections.filter((value) => value !== concept) : stableUnique([...next.conceptSelections, concept]);
    next.propertySelections = active ? next.propertySelections.filter((id) => !idSet.has(id)) : next.propertySelections;
    next.excludedPropertyIds = active ? stableUnique([...next.excludedPropertyIds, ...ids]) : next.excludedPropertyIds.filter((id) => !idSet.has(id));
    return next;
}
export function toggleProfileInheritanceTreeBranch(document, recipe, propertyId, operatedPropertyIds) {
    if (!document.nodes[propertyId])
        return clone(recipe);
    const next = clone(recipe), ids = stableUnique((operatedPropertyIds ?? [propertyId, ...orderedIds(document, propertyId)]).filter((id) => Boolean(document.nodes[id]))), selected = new Set(profileInheritanceSelection(document, next).directPropertyIds), allSelected = ids.every((id) => selected.has(id)), idSet = new Set(ids);
    if (allSelected) {
        next.propertySelections = next.propertySelections.filter((id) => !idSet.has(id));
        next.excludedPropertyIds = stableUnique([...next.excludedPropertyIds, ...ids]);
        return next;
    }
    next.excludedPropertyIds = next.excludedPropertyIds.filter((id) => !idSet.has(id));
    const live = (id) => next.startingPoint === "everything" || Boolean(document.nodes[id]?.concept && next.conceptSelections.includes(document.nodes[id].concept));
    next.propertySelections = stableUnique([...next.propertySelections, ...ids.filter((id) => !live(id))]);
    return next;
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
            return [{ path: source.path, ...structuralDefinitionShape(node), definitionId: propertyId, selectionReason: "structural" }];
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
const sourceRuleValues = (document, propertyIds) => Object.fromEntries(propertyIds.flatMap((propertyId) => { const node = document.nodes[propertyId]; if (!node)
    return []; return [...(node.presence.condition ? [[`presence:${propertyId}`, node.presence]] : []), ...node.rules.map((rule) => [rule.id, rule])]; }));
const definitionDigest = (value) => { const text = JSON.stringify(value); let left = 0x811c9dc5, right = 0x9e3779b9; for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193);
    right = Math.imul(right ^ code, 0x85ebca6b);
} return `digest-v1:${(left >>> 0).toString(16).padStart(8, "0")}${(right >>> 0).toString(16).padStart(8, "0")}`; };
const sourceRuleFingerprints = (document, propertyIds) => Object.fromEntries(Object.entries(sourceRuleValues(document, propertyIds)).map(([id, value]) => [id, definitionDigest(value)]));
const sourceDefinitionValues = (document, selection) => { const structural = new Set(selection.structuralPropertyIds); return Object.fromEntries(selection.effectivePropertyIds.flatMap((propertyId) => { const node = document.nodes[propertyId]; if (!node)
    return []; if (structural.has(propertyId))
    return [[propertyId, structuralDefinitionShape(node)]]; const { id: _, name: __, parentId: ___, order: ____, rules: _____, provenance: ______, structureOwned: _______, localDefinitionFacets: ________, inheritedDefinition: _________, ...definitionFacets } = node; return [[propertyId, definitionFacets]]; })); };
const sourceDefinitionFingerprints = (document, selection) => Object.fromEntries(Object.entries(sourceDefinitionValues(document, selection)).map(([id, value]) => [id, definitionDigest(value)]));
export function profileInheritanceSourceSnapshot(document, recipe) { const selection = profileInheritanceSelection(document, recipe), ruleBearingPropertyIds = stableUnique([...selection.directPropertyIds, ...selection.ruleDependencyPropertyIds]); return { revision: document.revision, effectivePropertyIds: [...selection.effectivePropertyIds], propertyPaths: Object.fromEntries(selection.effectivePropertyIds.flatMap((propertyId) => document.nodes[propertyId] ? [[propertyId, canonicalPropertyPath(document, propertyId)]] : [])), ruleFingerprints: sourceRuleFingerprints(document, ruleBearingPropertyIds), definitionFingerprints: sourceDefinitionFingerprints(document, selection), missingRuleDependencyKeys: selection.missingRuleDependencies.map(missingDependencyKey) }; }
export function profileInheritanceRecipeApplied(document, recipe) { const applied = { ...clone(recipe), sourceRevision: document.revision, sourceSnapshot: profileInheritanceSourceSnapshot(document, recipe) }; delete applied.sourceImpact; return applied; }
export function profileInheritanceCurrentImpact(document, recipe) { const snapshot = recipe.sourceSnapshot, selection = profileInheritanceSelection(document, recipe); if (!snapshot)
    return { addedEffectivePropertyIds: [], removedPropertyIds: selection.missingPropertyIds, changedPaths: [], changedDefinitionPropertyIds: [], changedRuleIds: [], newMissingRuleDependencies: selection.missingRuleDependencies, stale: document.revision !== recipe.sourceRevision || Boolean(selection.missingPropertyIds.length || selection.missingRuleDependencies.length) }; const effective = new Set(selection.effectivePropertyIds), prior = new Set(snapshot.effectivePropertyIds), addedEffectivePropertyIds = selection.effectivePropertyIds.filter((id) => !prior.has(id)), removedPropertyIds = snapshot.effectivePropertyIds.filter((id) => !effective.has(id)), changedPaths = snapshot.effectivePropertyIds.flatMap((propertyId) => { const before = snapshot.propertyPaths[propertyId], node = document.nodes[propertyId]; if (!before || !node)
    return []; const after = canonicalPropertyPath(document, propertyId); return before === after ? [] : [{ propertyId, before, after }]; }), sameEffectiveSet = !addedEffectivePropertyIds.length && !removedPropertyIds.length, reorderedPropertyIds = sameEffectiveSet ? selection.effectivePropertyIds.filter((id, index) => snapshot.effectivePropertyIds[index] !== id) : [], currentDefinitions = sourceDefinitionFingerprints(document, selection), fingerprintedDefinitionChanges = snapshot.definitionFingerprints ? stableUnique([...Object.keys(snapshot.definitionFingerprints), ...Object.keys(currentDefinitions)]).filter((id) => snapshot.definitionFingerprints?.[id] !== currentDefinitions[id] && prior.has(id) && effective.has(id)) : document.revision !== snapshot.revision ? selection.effectivePropertyIds.filter((id) => prior.has(id)) : [], changedDefinitionPropertyIds = stableUnique([...fingerprintedDefinitionChanges, ...reorderedPropertyIds]), ruleBearingPropertyIds = stableUnique([...selection.directPropertyIds, ...selection.ruleDependencyPropertyIds]), currentValues = sourceRuleValues(document, ruleBearingPropertyIds), currentRules = sourceRuleFingerprints(document, ruleBearingPropertyIds), changedRuleIds = stableUnique([...Object.keys(snapshot.ruleFingerprints), ...Object.keys(currentRules)]).filter((id) => { const before = snapshot.ruleFingerprints[id], after = currentRules[id]; if (before === after)
    return false; return currentValues[id] === undefined || before !== JSON.stringify(currentValues[id]); }), knownMissing = new Set(snapshot.missingRuleDependencyKeys), newMissingRuleDependencies = selection.missingRuleDependencies.filter((dependency) => !knownMissing.has(missingDependencyKey(dependency))), stale = Boolean(addedEffectivePropertyIds.length || removedPropertyIds.length || changedPaths.length || changedDefinitionPropertyIds.length || changedRuleIds.length || newMissingRuleDependencies.length); return { addedEffectivePropertyIds, removedPropertyIds, changedPaths, changedDefinitionPropertyIds, changedRuleIds, newMissingRuleDependencies, stale }; }
export function markProfileInheritanceTargetStale(target, profileId, before, after) { const recipes = (target.profileInheritanceRecipes ?? []), affected = recipes.some((recipe) => recipe.profileId === profileId); if (!affected)
    return target; const nextRecipes = recipes.map((recipe) => { if (recipe.profileId !== profileId)
    return recipe; const impact = recipe.sourceSnapshot ? profileInheritanceCurrentImpact(after, recipe) : profileInheritanceImpact(before, after, recipe); return { ...clone(recipe), sourceImpact: impact }; }), stale = nextRecipes.some((recipe) => recipe.profileId === profileId && recipe.sourceImpact?.stale); return { ...target, profileInheritanceRecipes: nextRecipes, ...(stale ? { compiledTargetsStale: true, validationStale: true, testCasesStale: true, documentationStale: true, exportStale: true } : {}) }; }
export function markProfileInheritanceConsumersForSourceChange(project, profileId, before, after) { return { ...project, collections: { ...project.collections, pages: project.collections.pages.map((entity) => markProfileInheritanceTargetStale(entity, profileId, before, after)), pageGroups: project.collections.pageGroups.map((entity) => markProfileInheritanceTargetStale(entity, profileId, before, after)), events: project.collections.events.map((entity) => markProfileInheritanceTargetStale(entity, profileId, before, after)) } }; }
export function profileInheritanceImpact(before, after, recipe) { const priorRecipe = profileInheritanceRecipeApplied(before, recipe), impact = profileInheritanceCurrentImpact(after, priorRecipe), referenced = stableUnique([...recipe.propertySelections, ...recipe.excludedPropertyIds, ...recipe.includedDependencyPropertyIds]), removedPinned = referenced.filter((id) => before.nodes[id] && !after.nodes[id]); return { ...impact, removedPropertyIds: stableUnique([...impact.removedPropertyIds, ...removedPinned]) }; }
//# sourceMappingURL=data-layer-selective-profile-inheritance.js.map