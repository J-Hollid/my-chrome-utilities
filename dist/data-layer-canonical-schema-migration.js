import { migrateLegacyProfile } from "./canonical-schema/migration-plan.js";
export { hasLegacySchemaRepresentation, migrateLegacyProfile } from "./canonical-schema/migration-plan.js";
const clone = (value) => structuredClone(value);
const emptyDocumentation = () => ({ displayText: "", description: "", comments: "", example: { method: "blank" } });
const typeOf = (value) => value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : typeof value === "object" ? "object" : "string";
export function resolveCanonicalMigrationConflict(plan, conflictId, choiceId) {
    const conflict = plan.conflicts.find(({ id }) => id === conflictId), choice = conflict?.choices.find(({ id }) => id === choiceId);
    if (!conflict || !choice)
        throw new Error("Choose an available canonical migration resolution.");
    const next = clone(plan), target = next.conflicts.find(({ id }) => id === conflictId), node = next.document.nodes[target.propertyId], value = clone(choice.value);
    if (target.facet === "type")
        node.type = value;
    else if (target.facet === "item type")
        node.itemType = value;
    else if (target.facet === "presence")
        node.presence = value;
    else if (target.facet === "allowed values")
        node.allowedValues = value.map((entry, index) => ({ id: `migration-allowed:${encodeURIComponent(target.path)}:${index}`, value: entry }));
    else if (target.facet === "rules") {
        const replacement = value;
        node.rules = [...node.rules.filter(({ id }) => id !== replacement.id), replacement];
    }
    else if (target.facet === "display text")
        node.documentation.displayText = String(value);
    else if (target.facet === "description")
        node.documentation.description = String(value);
    else if (target.facet === "comments")
        node.documentation.comments = String(value);
    else if (target.facet === "example")
        node.documentation.example = value;
    else if (target.facet === "expected value")
        node.expectedValue = value;
    else if (target.facet === "enforcement")
        node.enforcement = value;
    else if (target.facet === "target")
        node.target = String(value);
    else
        node.overrideReferences = value;
    next.conflicts = next.conflicts.filter(({ id }) => id !== conflictId);
    return next;
}
export function canonicalSchemaFromJsonSchema(input) { const profile = { id: input.contributorId, name: input.contributorName, structuredSchema: input.document }, plan = migrateLegacyProfile(profile, { id: input.idFactory }), firstRootId = plan.document.rootIds[0], document = { ...plan.document, id: input.id, source: { identity: input.sourceIdentity, revision: input.sourceRevision, provenance: "saved-schema-library" }, ...(firstRootId ? { selectedPropertyId: firstRootId } : {}) }; for (const node of Object.values(document.nodes))
    node.provenance = node.provenance.map(() => ({ source: "saved-schema", sourceId: input.sourceIdentity, revision: input.sourceRevision })); return document; }
export function canonicalNodeFromValue(name, value, input) { return { id: input.id("property"), name, ...(input.parentId ? { parentId: input.parentId } : {}), order: input.order, type: typeOf(value), presence: { mode: "optional" }, allowedValues: [], rules: [], documentation: emptyDocumentation(), provenance: [{ source: "created" }], overrideReferences: [] }; }
//# sourceMappingURL=data-layer-canonical-schema-migration.js.map