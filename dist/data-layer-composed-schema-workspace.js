import { applyCanonicalCommand, canonicalConstraints, canonicalTableRows } from "./data-layer-canonical-schema.js";
import { transactProject } from "./data-layer-specification-project.js";
import { composedSchemaWorkspace } from "./composed-schema/workspace-model.js";
import { composedCanonicalSchema, resetCanonicalRow } from "./composed-schema/canonical-workspace.js";
import { applyLayerConstraintStructures, structureDeletesPath } from "./flow-graph/page-instance-structure.js";
import { includeProfileInheritanceParentAdditions } from "./data-layer-selective-profile-inheritance.js";
export { composedSchemaWorkspace, composedCanonicalSchema };
export const schemaContributorUsesEffectiveWorkspace = (scope) => scope !== "Shared Profile";
const clone = (value) => structuredClone(value);
function updateEntity(state, kind, entityId, label, update) { return transactProject(state, label, (project) => ({ ...project, collections: { ...project.collections, [kind]: project.collections[kind].map((entity) => entity.id === entityId ? update(entity) : entity) } })); }
const sparseFacetKeys = (constraint) => Object.fromEntries(Object.entries(constraint).filter(([key]) => !["path", "origins", "superseded", "expectedContributor"].includes(key)));
const sparseAgainst = (constraint, inherited) => { const result = { path: constraint.path }, parent = inherited ? sparseFacetKeys(inherited) : {}, rules = (constraint.rules ?? []).filter((rule) => { const state = rule.provenance?.state; return state === "local" || state === "effective" || state === "overridden" || (!state && !(inherited?.rules ?? []).some((candidate) => String(candidate.id ?? "") === String(rule.id ?? ""))); }), localValueOwnership = (constraint.allowedValueProvenance ?? []).filter(({ state }) => state !== "inherited"), candidate = { ...constraint }; if (rules.length)
    candidate.rules = rules;
else
    delete candidate.rules; if (localValueOwnership.length)
    candidate.allowedValueProvenance = localValueOwnership;
else
    delete candidate.allowedValueProvenance; for (const [key, value] of Object.entries(sparseFacetKeys(candidate))) {
    if (key === "definitionId" && inherited && !inherited.definitionId)
        continue;
    if ((key === "allowedValues" || key === "allowedValueIds") && inherited && JSON.stringify(constraint.allowedValues) === JSON.stringify(inherited.allowedValues) && !localValueOwnership.length)
        continue;
    if (key === "target" && inherited && value === "all" && parent.target === undefined)
        continue;
    if (value !== undefined && JSON.stringify(value) !== JSON.stringify(parent[key]))
        result[key] = clone(value);
} return result; };
const sparseCanonicalConstraints = (document, parents) => { const structureOwned = new Map(canonicalTableRows(document).map(({ path, node }) => [path, node.structureOwned === true])); return canonicalConstraints(document).map((constraint) => { const candidate = clone(constraint), parent = parents.get(constraint.path); if (parent && structureOwned.get(constraint.path) !== true)
    delete candidate.definitionId; return sparseAgainst(candidate, parent); }).filter((constraint) => Object.keys(constraint).length > 1); };
export function saveComposedCanonicalDocument(state, kind, entityId, document) { const entity = state.project.collections[kind].find(({ id }) => id === entityId); if (!entity)
    throw new Error(`${kind === "pages" ? "Page" : "Property Set"} ${entityId} is unavailable.`); const scope = kind === "pages" ? "Page" : "Property Set", workspace = composedSchemaWorkspace(state, entity, scope), parents = new Map(workspace.rows.map(({ path, inherited }) => [path, inherited])), constraints = sparseCanonicalConstraints(document, parents); return updateEntity(state, kind, entityId, `Save effective canonical schema for ${entity.name}`, (current) => { const next = { ...current, localSchemaContributions: constraints, onlyDefinedFields: document.onlyDefinedFields === true, compiledTargetsStale: true }; delete next.canonicalSchema; delete next.schemaConstraints; return next; }); }
export function saveComposedEventCanonicalDocument(state, entityId, document) { const entity = state.project.collections.events.find(({ id }) => id === entityId); if (!entity)
    throw new Error(`Event ${entityId} is unavailable.`); const workspace = composedSchemaWorkspace(state, entity, "Event"), parents = new Map(workspace.rows.map(({ path, inherited }) => [path, inherited])), constraints = sparseCanonicalConstraints(document, parents); return updateEntity(state, "events", entityId, `Save effective canonical schema for ${entity.name}`, (current) => ({ ...current, localSchemaContributions: constraints, onlyDefinedFields: document.onlyDefinedFields === true, compiledTargetsStale: true })); }
function saveFlowComposedCanonicalDocument(state, flowId, entityId, field, scope, document) {
    const graph = state.project.documentationFlowGraphs[flowId], entity = graph?.[field]?.find(({ id }) => id === entityId);
    if (!entity)
        throw new Error(`${scope} ${entityId} is unavailable.`);
    const workspace = composedSchemaWorkspace(state, entity, scope, undefined, flowId), parents = new Map(workspace.rows.map(({ path, inherited }) => [path, inherited])), constraints = sparseCanonicalConstraints(document, parents);
    return transactProject(state, `Save effective canonical schema for ${entity.name}`, (project) => { const graphs = project.documentationFlowGraphs, current = graphs[flowId], entries = current[field] ?? []; return { ...project, documentationFlowGraphs: { ...graphs, [flowId]: { ...current, [field]: entries.map((candidate) => { if (candidate.id !== entityId)
                    return candidate; const next = { ...candidate, localSchemaContributions: constraints, onlyDefinedFields: document.onlyDefinedFields === true, compiledTargetsStale: true }; delete next.canonicalSchema; delete next.schemaConstraints; return next; }) } } }; });
}
export const saveFlowPageInstanceCanonicalDocument = (state, flowId, entityId, document) => saveFlowComposedCanonicalDocument(state, flowId, entityId, "pageFrames", "Flow Page-instance", document);
export const saveEventOccurrenceCanonicalDocument = (state, flowId, entityId, document) => saveFlowComposedCanonicalDocument(state, flowId, entityId, "occurrences", "Event-occurrence", document);
export function saveComposedSchemaLocalFacets(state, kind, entityId, path, facets) { const sparse = Object.fromEntries(Object.entries(facets).filter(([, value]) => value !== undefined && value !== "")); return updateEntity(state, kind, entityId, `Override ${path} at ${kind === "pages" ? "Page" : "Property Set"}`, (entity) => { const existing = entity.localSchemaContributions ?? [], next = [...existing.filter((constraint) => constraint.path !== path), ...(Object.keys(sparse).length ? [{ path, ...clone(sparse) }] : [])]; return { ...entity, localSchemaContributions: next, compiledTargetsStale: true }; }); }
const entityWithSchemaPolicy = (entity, onlyDefinedFields) => { const canonical = entity.canonicalSchema; if (!canonical)
    return { ...entity, onlyDefinedFields, compiledTargetsStale: true }; const result = applyCanonicalCommand(canonical, { kind: "policy", baseRevision: canonical.revision, onlyDefinedFields }); if (result.status !== "applied" && result.status !== "rebased")
    throw new Error("The canonical defined-fields policy changed before it could be saved."); const next = { ...entity, canonicalSchema: result.document, compiledTargetsStale: true }; delete next.onlyDefinedFields; return next; };
export function saveComposedSchemaPolicy(state, kind, entityId, onlyDefinedFields) { return updateEntity(state, kind, entityId, `Change defined-fields policy at ${kind === "pages" ? "Page" : "Property Set"}`, (entity) => entityWithSchemaPolicy(entity, onlyDefinedFields)); }
export function saveComposedEntitySchemaPolicy(state, kind, entityId, onlyDefinedFields) { return updateEntity(state, kind, entityId, `Change defined-fields policy at ${kind === "pages" ? "Page" : kind === "propertySets" ? "Property Set" : "Event"}`, (entity) => entityWithSchemaPolicy(entity, onlyDefinedFields)); }
export function saveFlowContributorSchemaPolicy(state, flowId, field, entityId, onlyDefinedFields) { return transactProject(state, `Change defined-fields policy at ${field === "pageFrames" ? "Flow Page instance" : "Event occurrence"}`, (project) => { const graphs = project.documentationFlowGraphs, graph = graphs[flowId], entries = graph[field] ?? []; return { ...project, documentationFlowGraphs: { ...graphs, [flowId]: { ...graph, [field]: entries.map((entity) => entity.id === entityId ? entityWithSchemaPolicy(entity, onlyDefinedFields) : entity) } } }; }); }
export function saveFlowPageInstanceSchemaPolicy(state, flowId, pageFrameId, onlyDefinedFields) { return saveFlowContributorSchemaPolicy(state, flowId, "pageFrames", pageFrameId, onlyDefinedFields); }
export function saveComposedSchemaLocalFacetsAndStructures(state, kind, entityId, path, facets, commands, id) { const sparse = Object.fromEntries(Object.entries(facets).filter(([, value]) => value !== undefined && value !== "")); return updateEntity(state, kind, entityId, `Save ${commands.length + 1} ${kind === "pages" ? "Page" : kind === "propertySets" ? "Property Set" : "Event"} schema changes`, (entity) => { const existing = entity.localSchemaContributions ?? [], focused = { path, ...clone(sparse) }, seeded = commands.length ? [...existing.filter((constraint) => constraint.path !== path), focused] : existing, structured = applyLayerConstraintStructures(seeded, commands, id), next = commands.length ? structured.filter((constraint) => Object.keys(constraint).length > 1) : [...existing.filter((constraint) => constraint.path !== path), ...(Object.keys(sparse).length ? [focused] : [])]; return { ...entity, localSchemaContributions: structureDeletesPath(commands, path) ? next.filter((constraint) => constraint.path !== path) : next, compiledTargetsStale: true }; }); }
export function resetComposedSchemaLocalProperty(state, kind, entityId, path) { return updateEntity(state, kind, entityId, `Reset ${path} to parents`, (entity) => { const next = { ...entity, localSchemaContributions: (entity.localSchemaContributions ?? []).filter((constraint) => constraint.path !== path), schemaConstraints: (entity.schemaConstraints ?? []).filter((constraint) => constraint.path !== path), compiledTargetsStale: true }; return resetCanonicalRow(entity.canonicalSchema, path, next); }); }
const recordCanonicalReset = (document, propertyIds) => { document.revision += 1; document.changes = [...document.changes, { revision: document.revision, propertyIds: [...propertyIds], kind: "set" }]; return document; };
const canonicalNodeAt = (document, path) => { const id = canonicalTableRows(document).find((row) => row.path === path)?.id; return id ? document.nodes[id] : undefined; };
const restoreCanonicalDerivedFacet = (node, facet) => { const locallyOwned = (rule) => ["local", "overridden", "effective"].includes(String(rule.provenance?.state ?? "")), removeSynthetic = (kind, identity) => { node.rules = node.rules.filter((rule) => rule.kind !== kind || !locallyOwned(rule) || !identity(rule.id)); }; if (facet === "patterns") {
    removeSynthetic("pattern", (id) => id.startsWith("rule:" + node.id + ":pattern:"));
    return true;
} if (facet === "minimum" || facet === "maximum") {
    removeSynthetic("range", (id) => id === "rule:" + node.id + ":range");
    return true;
} if (facet === "minItems" || facet === "maxItems") {
    removeSynthetic("cardinality", (id) => id === "rule:" + node.id + ":cardinality");
    return true;
} return false; };
const restoreCanonicalFacet = (node, facet) => { const inherited = node.inheritedDefinition, value = inherited?.[facet], related = new Set([String(facet), ...(facet === "allowedValues" ? ["allowedValueIds", "allowedValueProvenance"] : []), ...(facet === "presence" ? ["condition"] : []), ...((facet === "minimum" || facet === "maximum") ? ["minimum", "maximum"] : []), ...((facet === "minItems" || facet === "maxItems") ? ["minItems", "maxItems"] : [])]); node.localDefinitionFacets = (node.localDefinitionFacets ?? []).filter((key) => !related.has(key) && !(facet === "minimum" && key === "maximum") && !(facet === "minItems" && key === "maxItems")); if (restoreCanonicalDerivedFacet(node, facet))
    return;
else if (facet === "concept") {
    if (typeof value === "string")
        node.concept = value;
    else
        delete node.concept;
}
else if (facet === "type") {
    if (typeof value === "string")
        node.type = value;
    else
        delete node.type;
}
else if (facet === "nullable") {
    if (typeof value === "boolean")
        node.nullable = value;
    else
        delete node.nullable;
}
else if (facet === "onlyDefinedFields") {
    if (typeof value === "boolean")
        node.onlyDefinedFields = value;
    else
        delete node.onlyDefinedFields;
}
else if (facet === "itemType") {
    if (typeof value === "string")
        node.itemType = value;
    else
        delete node.itemType;
}
else if (facet === "itemSchema") {
    if (value)
        node.itemSchema = clone(value);
    else
        delete node.itemSchema;
}
else if (facet === "presence") {
    const presence = { mode: (inherited?.presence ?? "optional") };
    if (inherited?.condition)
        presence.condition = clone(inherited.condition);
    node.presence = presence;
}
else if (facet === "documentation")
    node.documentation = { ...node.documentation, description: inherited?.documentation ?? "" };
else if (facet === "comments")
    node.documentation = { ...node.documentation, comments: inherited?.comments ?? "" };
else if (facet === "examples")
    node.documentation = { ...node.documentation, example: inherited?.examples?.length ? { method: "custom", value: clone(inherited.examples[0]) } : { method: "blank" } };
else if (facet === "allowedValues")
    node.allowedValues = (inherited?.allowedValues ?? []).map((allowedValue, index) => ({ id: inherited?.allowedValueIds?.[index] ?? `allowed-value:${node.id}:parent:${index}`, value: clone(allowedValue), ...(inherited?.allowedValueProvenance?.[index] ? { provenance: [{ source: "path-constraint", ...(inherited.allowedValueProvenance[index].source ? { sourceId: inherited.allowedValueProvenance[index].source } : {}), ...(inherited.allowedValueProvenance[index].contributorId ? { contributorId: inherited.allowedValueProvenance[index].contributorId } : {}), state: inherited.allowedValueProvenance[index].state }] } : {}) }));
else if (facet === "expectedValue") {
    if (value !== undefined)
        node.expectedValue = clone(value);
    else
        delete node.expectedValue;
} };
const resetCanonicalFacet = (canonical, path, facet) => { if (!canonical)
    return; const document = clone(canonical), node = canonicalNodeAt(document, path); if (!node)
    return canonical; restoreCanonicalFacet(node, facet); return recordCanonicalReset(document, [node.id]); };
const resetCanonicalRule = (canonical, path, ruleId) => { if (!canonical)
    return; const document = clone(canonical), node = canonicalNodeAt(document, path); if (!node)
    return canonical; node.rules = node.rules.filter(({ id }) => id !== ruleId); return recordCanonicalReset(document, [node.id]); };
const removeLayerFacet = (constraint, facet) => { delete constraint[facet]; if (facet === "minimum" || facet === "maximum") {
    delete constraint.minimum;
    delete constraint.maximum;
} if (facet === "minItems" || facet === "maxItems") {
    delete constraint.minItems;
    delete constraint.maxItems;
} if (facet === "allowedValues") {
    delete constraint.allowedValueIds;
    delete constraint.allowedValueProvenance;
} if (facet === "presence")
    delete constraint.condition; };
export function resetComposedSchemaLocalFacet(state, kind, entityId, path, facet) { return updateEntity(state, kind, entityId, `Use inherited ${String(facet)} for ${path}`, (entity) => { const withoutFacet = (constraints) => ((constraints ?? []).flatMap((constraint) => { if (constraint.path !== path)
    return [constraint]; const next = clone(constraint); removeLayerFacet(next, facet); return Object.keys(next).length > 1 ? [next] : []; })); return { ...entity, localSchemaContributions: withoutFacet(entity.localSchemaContributions), schemaConstraints: withoutFacet(entity.schemaConstraints), ...(entity.canonicalSchema ? { canonicalSchema: resetCanonicalFacet(entity.canonicalSchema, path, facet) } : {}), compiledTargetsStale: true }; }); }
export function resetComposedSchemaLocalRule(state, kind, entityId, path, ruleId) { return updateEntity(state, kind, entityId, `Remove local rule for ${path}`, (entity) => { const withoutRule = (constraints) => ((constraints ?? []).flatMap((constraint) => { if (constraint.path !== path)
    return [constraint]; const next = clone(constraint), rules = (next.rules ?? []).filter((rule) => String(rule.id ?? "") !== ruleId); if (rules.length)
    next.rules = rules;
else
    delete next.rules; return Object.keys(next).length > 1 ? [next] : []; })); return { ...entity, localSchemaContributions: withoutRule(entity.localSchemaContributions), schemaConstraints: withoutRule(entity.schemaConstraints), ...(entity.canonicalSchema ? { canonicalSchema: resetCanonicalRule(entity.canonicalSchema, path, ruleId) } : {}), compiledTargetsStale: true }; }); }
export function resetComposedSchemaLocalChanges(state, kind, entityId) { return updateEntity(state, kind, entityId, "Reset all local schema changes to parents", (entity) => { const next = { ...entity, localSchemaContributions: [], schemaConstraints: [], compiledTargetsStale: true }; if (entity.canonicalSchema)
    delete next.canonicalSchema; return next; }); }
export function includeComposedSchemaParentAdditions(state, kind, entityId, recipeId, propertyIds) { return updateEntity(state, kind, entityId, "Include selected parent additions", (entity) => { const recipes = entity.profileInheritanceRecipes ?? [], selectedRecipeIds = recipeId ? new Set([recipeId]) : new Set(recipes.map(({ id }) => id)), nextRecipes = recipes.map((recipe) => { if (!selectedRecipeIds.has(recipe.id))
    return recipe; const profile = state.project.collections.profiles.find(({ id }) => id === recipe.profileId), document = profile?.canonicalSchema, matching = document ? propertyIds.filter((propertyId) => Boolean(document.nodes[propertyId])) : []; return document && matching.length ? includeProfileInheritanceParentAdditions(document, recipe, matching) : recipe; }); return nextRecipes.some((recipe, index) => recipe !== recipes[index]) ? { ...entity, profileInheritanceRecipes: nextRecipes, compiledTargetsStale: true } : entity; }); }
export function includeComposedSchemaParentAdditionSelections(state, kind, entityId, selections) { return updateEntity(state, kind, entityId, "Include selected parent additions", (entity) => { const selected = new Map(selections.filter(({ propertyIds }) => propertyIds.length).map(({ recipeId, propertyIds }) => [recipeId, propertyIds])), recipes = entity.profileInheritanceRecipes ?? []; if (!selected.size)
    return entity; return { ...entity, profileInheritanceRecipes: recipes.map((recipe) => { const propertyIds = selected.get(recipe.id), profile = propertyIds ? state.project.collections.profiles.find(({ id }) => id === recipe.profileId) : undefined, document = profile?.canonicalSchema; return propertyIds && document ? includeProfileInheritanceParentAdditions(document, recipe, propertyIds) : recipe; }), compiledTargetsStale: true }; }); }
const updateFlowComposedEntity = (state, flowId, entityId, label, update) => transactProject(state, label, (project) => { const graphs = project.documentationFlowGraphs, graph = graphs[flowId]; if (!graph)
    return project; const field = graph.pageFrames?.some(({ id }) => id === entityId) ? "pageFrames" : "occurrences", entries = graph[field] ?? []; return { ...project, documentationFlowGraphs: { ...graphs, [flowId]: { ...graph, [field]: entries.map((entity) => entity.id === entityId ? update(entity) : entity) } } }; });
export function saveFlowComposedSchemaLocalFacets(state, flowId, entityId, path, facets) { return updateFlowComposedEntity(state, flowId, entityId, `Save local schema facets for ${path}`, (entity) => { const existing = entity.localSchemaContributions ?? [], sparse = Object.fromEntries(Object.entries(facets).filter(([, value]) => value !== undefined && value !== "")); return { ...entity, localSchemaContributions: [...existing.filter((constraint) => constraint.path !== path), ...(Object.keys(sparse).length ? [{ path, ...sparse }] : [])], compiledTargetsStale: true }; }); }
export function resetFlowComposedSchemaLocalProperty(state, flowId, entityId, path) { return updateFlowComposedEntity(state, flowId, entityId, `Reset ${path} to parents`, (entity) => resetCanonicalRow(entity.canonicalSchema, path, { ...entity, localSchemaContributions: (entity.localSchemaContributions ?? []).filter((constraint) => constraint.path !== path), schemaConstraints: (entity.schemaConstraints ?? []).filter((constraint) => constraint.path !== path), compiledTargetsStale: true })); }
export function resetFlowComposedSchemaLocalFacet(state, flowId, entityId, path, facet) { return updateFlowComposedEntity(state, flowId, entityId, `Use inherited ${String(facet)} for ${path}`, (entity) => { const strip = (constraints) => ((constraints ?? []).flatMap((constraint) => { if (constraint.path !== path)
    return [constraint]; const next = clone(constraint); removeLayerFacet(next, facet); return Object.keys(next).length > 1 ? [next] : []; })); return { ...entity, localSchemaContributions: strip(entity.localSchemaContributions), schemaConstraints: strip(entity.schemaConstraints), ...(entity.canonicalSchema ? { canonicalSchema: resetCanonicalFacet(entity.canonicalSchema, path, facet) } : {}), compiledTargetsStale: true }; }); }
export function resetFlowComposedSchemaLocalRule(state, flowId, entityId, path, ruleId) { return updateFlowComposedEntity(state, flowId, entityId, `Remove local rule for ${path}`, (entity) => { const strip = (constraints) => ((constraints ?? []).flatMap((constraint) => { if (constraint.path !== path)
    return [constraint]; const next = clone(constraint), rules = (next.rules ?? []).filter((rule) => String(rule.id ?? "") !== ruleId); if (rules.length)
    next.rules = rules;
else
    delete next.rules; return Object.keys(next).length > 1 ? [next] : []; })); return { ...entity, localSchemaContributions: strip(entity.localSchemaContributions), schemaConstraints: strip(entity.schemaConstraints), ...(entity.canonicalSchema ? { canonicalSchema: resetCanonicalRule(entity.canonicalSchema, path, ruleId) } : {}), compiledTargetsStale: true }; }); }
export function resetFlowComposedSchemaLocalChanges(state, flowId, entityId) { return updateFlowComposedEntity(state, flowId, entityId, "Reset all local schema changes to parents", (entity) => { const next = { ...entity, localSchemaContributions: [], schemaConstraints: [], compiledTargetsStale: true }; if (entity.canonicalSchema)
    delete next.canonicalSchema; return next; }); }
export function includeFlowComposedSchemaParentAdditions(state, flowId, entityId, selections) { return updateFlowComposedEntity(state, flowId, entityId, "Include selected parent additions", (entity) => { const selected = new Map(selections.map(({ recipeId, propertyIds }) => [recipeId, propertyIds])), recipes = entity.profileInheritanceRecipes ?? [], nextRecipes = recipes.map((recipe) => { const propertyIds = selected.get(recipe.id), profile = propertyIds ? state.project.collections.profiles.find(({ id }) => id === recipe.profileId) : undefined, document = profile?.canonicalSchema, matching = document && propertyIds ? propertyIds.filter((propertyId) => Boolean(document.nodes[propertyId])) : []; return document && matching.length ? includeProfileInheritanceParentAdditions(document, recipe, matching) : recipe; }); return nextRecipes.some((recipe, index) => recipe !== recipes[index]) ? { ...entity, profileInheritanceRecipes: nextRecipes, compiledTargetsStale: true } : entity; }); }
export function composedSchemaScopeForKind(kind) { return kind === "pages" ? "Page" : kind === "propertySets" ? "Property Set" : "Event"; }
export function applyComposedSchemaContextualFacet(state, kind, entityId, path, facet, value, repair) {
    const target = state.project.collections[kind].find(({ id }) => id === entityId), offered = target ? composedSchemaWorkspace(state, target, composedSchemaScopeForKind(kind)).rows.find(({ path: rowPath }) => rowPath === path)?.repairs.filter((candidate) => candidate.kind === "use-contextual" && candidate.facet === facet && JSON.stringify(candidate.value) === JSON.stringify(value)) ?? [] : [], selected = offered.find((candidate) => !repair || candidate.contributorId === repair.contributorId && candidate.rejectedContributorId === repair.rejectedContributorId && candidate.rejectedFacet === repair.rejectedFacet);
    if (!selected)
        return state;
    return updateEntity(state, kind, entityId, `Use contextual ${String(facet)} for ${path}`, (entity) => { const existing = entity.localSchemaContributions ?? [], current = existing.find((constraint) => constraint.path === path) ?? { path }, grouped = ["minimum", "maximum", "minItems", "maxItems"].includes(facet) && value && typeof value === "object", facetValues = grouped ? Object.fromEntries(Object.entries(clone(value)).filter(([, candidate]) => candidate !== undefined)) : { [facet]: clone(value) }, resolution = selected?.rejectedContributorId && selected.rejectedFacet ? { selectedContributorId: selected.contributorId, selectedFacet: facet, rejectedContributorId: selected.rejectedContributorId, rejectedFacet: selected.rejectedFacet } : undefined, priorResolutions = current.peerFacetResolutions ?? [], nextResolutions = resolution ? [...priorResolutions.filter((candidate) => !(new Set([candidate.selectedContributorId, candidate.rejectedContributorId]).has(resolution.selectedContributorId) && new Set([candidate.selectedContributorId, candidate.rejectedContributorId]).has(resolution.rejectedContributorId))), resolution] : priorResolutions, next = { ...clone(current), ...facetValues, ...(nextResolutions.length ? { peerFacetResolutions: nextResolutions } : {}) }; return { ...entity, localSchemaContributions: [...existing.filter((constraint) => constraint.path !== path), next], compiledTargetsStale: true }; });
}
export function overrideComposedSchemaLocalRule(state, kind, entityId, path, ruleId, sourceRuleId) { return updateEntity(state, kind, entityId, `Override inherited rule for ${path}`, (entity) => { const override = (constraints) => ((constraints ?? []).map((constraint) => constraint.path !== path ? constraint : { ...clone(constraint), rules: (constraint.rules ?? []).map((rule) => String(rule.id ?? "") === ruleId ? { ...clone(rule), replacesRuleId: sourceRuleId, provenance: { ...(rule.provenance ?? {}), state: "overridden", sourceId: sourceRuleId } } : rule) })); return { ...entity, localSchemaContributions: override(entity.localSchemaContributions), schemaConstraints: override(entity.schemaConstraints), compiledTargetsStale: true }; }); }
//# sourceMappingURL=data-layer-composed-schema-workspace.js.map