import { applyCanonicalCommand, canonicalTableRows } from "../data-layer-canonical-schema.js";
const within = (candidate, path) => candidate === path || candidate.startsWith(`${path}/`);
export function entityWithInheritedPropertyExcluded(entity, propertyId, path) {
    const next = { ...entity, excludedPropertyIds: [...new Set([...(entity.excludedPropertyIds ?? []), propertyId])], compiledTargetsStale: true };
    if (entity.localSchemaContributions)
        next.localSchemaContributions = entity.localSchemaContributions.filter((constraint) => !within(constraint.path, path));
    if (entity.schemaConstraints)
        next.schemaConstraints = entity.schemaConstraints.filter((constraint) => !within(constraint.path, path));
    const canonical = entity.canonicalSchema, row = canonical && canonicalTableRows(canonical).find((candidate) => candidate.path === path);
    if (row) {
        const result = applyCanonicalCommand(canonical, { kind: "delete", baseRevision: canonical.revision, propertyId: row.id });
        if (result.status !== "applied" && result.status !== "rebased")
            throw new Error(`Local facets for ${path} could not be removed atomically.`);
        next.canonicalSchema = result.document;
    }
    return next;
}
//# sourceMappingURL=property-exclusion.js.map