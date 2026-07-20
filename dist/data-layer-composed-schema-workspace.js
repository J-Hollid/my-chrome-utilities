import { applyCanonicalCommand, canonicalConstraints, canonicalTableRows } from "./data-layer-canonical-schema.js";
import { compileLayeredSchema } from "./data-layer-layered-schema.js";
import { layeredContributorPath, layeredContributorsForPath } from "./data-layer-layered-schema-project.js";
import { transactProject } from "./data-layer-specification-project.js";
const clone = (value) => structuredClone(value);
const constraintsFor = (entity) => {
    const canonical = entity.canonicalSchema;
    return [
        ...(canonical ? canonicalConstraints(canonical) : (entity.schemaConstraints ?? [])),
        ...(entity.localSchemaContributions ?? []),
    ];
};
const mergedAt = (constraints, path) => constraints.filter((constraint) => constraint.path === path).reduce((result, constraint) => ({ ...result, ...clone(constraint), path }), { path });
const entities = (state) => Object.values(state.project.collections).flat();
const eventContext = (entity) => ({ eventId: String(entity.eventId ?? entity.id), eventRole: (entity.role === "context-setting" ? "context" : "interaction") });
const provenanceFor = (effective, entityId) => {
    const shadowed = new Set(effective.superseded.map(({ contributorId }) => contributorId)), lastOrigin = effective.origins.at(-1)?.contributorId;
    return effective.origins.map((origin) => ({ ...origin, state: origin.contributorId === entityId || origin.contributorId === lastOrigin ? "effective" : shadowed.has(origin.contributorId) ? "shadowed" : "inherited" }));
};
const repairsFor = (conflicts, allEntities, entity) => conflicts.flatMap(({ contributors }) => contributors).filter((name, index, names) => names.indexOf(name) === index).flatMap((name) => { const contributor = allEntities.find((candidate) => candidate.name === name); return contributor ? [{ contributorId: contributor.id, contributorName: name, label: contributor.id === entity.id ? `Adjust ${entity.name} override` : `Edit ${name}` }] : []; });
export function composedSchemaWorkspace(state, entity, scope, observation) {
    const resolved = layeredContributorsForPath(state, layeredContributorPath(state, entity, scope), observation ?? {}), contributors = observation ? resolved : resolved.map(({ active: _active, applicabilityConditional: _conditional, exclusionReason: _reason, ...contributor }) => contributor), parents = contributors.filter(({ id }) => id !== entity.id), compiled = compileLayeredSchema(contributors, eventContext(entity)), parentCompiled = compileLayeredSchema(parents, eventContext(entity)), localConstraints = constraintsFor(entity), paths = new Set([
        ...Object.keys(parentCompiled.properties), ...Object.keys(compiled.properties), ...localConstraints.map(({ path }) => path), ...compiled.conflicts.map(({ path }) => path).filter((path) => path !== "/"),
    ]), allEntities = entities(state);
    const rows = [...paths].sort((left, right) => left.localeCompare(right)).map((path) => {
        const inherited = parentCompiled.properties[path], local = mergedAt(localConstraints, path), effective = compiled.properties[path] ?? inherited ?? { path, origins: [], superseded: [] }, conflicts = compiled.conflicts.filter((conflict) => conflict.path === path), hasLocal = localConstraints.some((constraint) => constraint.path === path), ordinaryResolution = hasLocal && conflicts.length === 0 && effective.superseded.some(({ contributorId }) => contributorId !== entity.id);
        return { path, ...(inherited ? { inherited: clone(inherited) } : {}), local, effective: clone(effective), source: (inherited?.origins ?? []).map(({ contributorName }) => contributorName).join(" → ") || "Local only", validationState: conflicts.length ? "blocked" : ordinaryResolution ? "warning" : "ready", message: conflicts.map(({ message }) => message).join(" · ") || (ordinaryResolution ? `Parent difference resolved by ${entity.name} override` : hasLocal ? "Local contribution is effective" : "Inherited from live parents"), action: hasLocal ? (inherited ? "reset" : "remove") : "override", provenance: provenanceFor(effective, entity.id), repairs: repairsFor(conflicts, allEntities, entity) };
    });
    return { heading: `Effective schema at ${entity.name}`, status: compiled.status, rows, conflictSummary: compiled.status === "blocked" ? `${compiled.conflicts.length} unresolved conflict${compiled.conflicts.length === 1 ? "" : "s"} block validation and developer export.` : "Ready for validation and developer export." };
}
function updateEntity(state, kind, entityId, label, update) {
    return transactProject(state, label, (project) => ({ ...project, collections: { ...project.collections, [kind]: project.collections[kind].map((entity) => entity.id === entityId ? update(entity) : entity) } }));
}
export function saveComposedSchemaLocalFacets(state, kind, entityId, path, facets) {
    const sparse = Object.fromEntries(Object.entries(facets).filter(([, value]) => value !== undefined && value !== ""));
    return updateEntity(state, kind, entityId, `Override ${path} at ${kind === "pages" ? "Page" : "Page Group"}`, (entity) => { const existing = entity.localSchemaContributions ?? [], next = [...existing.filter((constraint) => constraint.path !== path), ...(Object.keys(sparse).length ? [{ path, ...clone(sparse) }] : [])]; return { ...entity, localSchemaContributions: next, compiledTargetsStale: true }; });
}
export function resetComposedSchemaLocalProperty(state, kind, entityId, path) {
    return updateEntity(state, kind, entityId, `Reset ${path} to parents`, (entity) => {
        const next = { ...entity, localSchemaContributions: (entity.localSchemaContributions ?? []).filter((constraint) => constraint.path !== path), schemaConstraints: (entity.schemaConstraints ?? []).filter((constraint) => constraint.path !== path), compiledTargetsStale: true }, canonical = entity.canonicalSchema, row = canonical && canonicalTableRows(canonical).find((candidate) => candidate.path === path);
        if (row) {
            const result = applyCanonicalCommand(canonical, { kind: "delete", baseRevision: canonical.revision, propertyId: row.id });
            if (result.status === "applied" || result.status === "rebased")
                next.canonicalSchema = result.document;
        }
        return next;
    });
}
//# sourceMappingURL=data-layer-composed-schema-workspace.js.map