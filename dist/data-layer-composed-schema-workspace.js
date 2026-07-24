import { canonicalConstraints } from "./data-layer-canonical-schema.js";
import { transactProject } from "./data-layer-specification-project.js";
import { composedSchemaWorkspace } from "./composed-schema/workspace-model.js";
import { composedCanonicalSchema, resetCanonicalRow } from "./composed-schema/canonical-workspace.js";
export { composedSchemaWorkspace, composedCanonicalSchema };
const clone = (value) => structuredClone(value);
function updateEntity(state, kind, entityId, label, update) { return transactProject(state, label, (project) => ({ ...project, collections: { ...project.collections, [kind]: project.collections[kind].map((entity) => entity.id === entityId ? update(entity) : entity) } })); }
const sparseFacetKeys = (constraint) => Object.fromEntries(Object.entries(constraint).filter(([key]) => !["path", "origins", "superseded", "expectedContributor"].includes(key)));
const sparseAgainst = (constraint, inherited) => { const result = { path: constraint.path }, parent = inherited ? sparseFacetKeys(inherited) : {}; for (const [key, value] of Object.entries(sparseFacetKeys(constraint))) {
    if (key === "definitionId" && inherited && !inherited.definitionId)
        continue;
    if (key === "target" && inherited && value === "all" && parent.target === undefined)
        continue;
    if (value !== undefined && JSON.stringify(value) !== JSON.stringify(parent[key]))
        result[key] = clone(value);
} return result; };
export function saveComposedCanonicalDocument(state, kind, entityId, document) { const entity = state.project.collections[kind].find(({ id }) => id === entityId); if (!entity)
    throw new Error(`${kind === "pages" ? "Page" : "Page Group"} ${entityId} is unavailable.`); const scope = kind === "pages" ? "Page" : "Page Group", workspace = composedSchemaWorkspace(state, entity, scope), parents = new Map(workspace.rows.map(({ path, inherited }) => [path, inherited])), constraints = canonicalConstraints(document).map((constraint) => sparseAgainst(constraint, parents.get(constraint.path))).filter((constraint) => Object.keys(constraint).length > 1); return updateEntity(state, kind, entityId, `Save effective canonical schema for ${entity.name}`, (current) => { const next = { ...current, localSchemaContributions: constraints, compiledTargetsStale: true }; delete next.canonicalSchema; delete next.schemaConstraints; return next; }); }
export function saveComposedSchemaLocalFacets(state, kind, entityId, path, facets) { const sparse = Object.fromEntries(Object.entries(facets).filter(([, value]) => value !== undefined && value !== "")); return updateEntity(state, kind, entityId, `Override ${path} at ${kind === "pages" ? "Page" : "Page Group"}`, (entity) => { const existing = entity.localSchemaContributions ?? [], next = [...existing.filter((constraint) => constraint.path !== path), ...(Object.keys(sparse).length ? [{ path, ...clone(sparse) }] : [])]; return { ...entity, localSchemaContributions: next, compiledTargetsStale: true }; }); }
export function resetComposedSchemaLocalProperty(state, kind, entityId, path) { return updateEntity(state, kind, entityId, `Reset ${path} to parents`, (entity) => { const next = { ...entity, localSchemaContributions: (entity.localSchemaContributions ?? []).filter((constraint) => constraint.path !== path), schemaConstraints: (entity.schemaConstraints ?? []).filter((constraint) => constraint.path !== path), compiledTargetsStale: true }; return resetCanonicalRow(entity.canonicalSchema, path, next); }); }
//# sourceMappingURL=data-layer-composed-schema-workspace.js.map