import { canonicalTableRows } from "./data-layer-canonical-schema.js";
import { migrateLegacyProfile } from "./canonical-schema/migration-plan.js";
export { hasLegacySchemaRepresentation, migrateLegacyProfile } from "./canonical-schema/migration-plan.js";
import { canonicalPredicateWithStableIds } from "./data-layer-canonical-predicate-identity.js";
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
    else if (target.facet === "presence") {
        const presence = value, condition = canonicalPredicateWithStableIds(presence.condition, kind => `${kind}:${target.propertyId}`);
        node.presence = condition ? { ...presence, condition } : { ...presence };
    }
    else if (target.facet === "allowed values")
        node.allowedValues = value.map((entry, index) => ({ id: `migration-allowed:${encodeURIComponent(target.path)}:${index}`, value: entry }));
    else if (target.facet === "rules") {
        const replacement = value, condition = canonicalPredicateWithStableIds(replacement.condition, kind => `${kind}:${replacement.id}`), nextRule = condition ? { ...replacement, condition } : { ...replacement };
        node.rules = [...node.rules.filter(({ id }) => id !== replacement.id), nextRule];
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
export function canonicalSchemaFromJsonSchema(input) { const profile = { id: input.contributorId, name: input.contributorName, structuredSchema: input.document }, plan = migrateLegacyProfile(profile, { id: input.idFactory }), firstRootId = plan.document.rootIds[0], document = { ...plan.document, id: input.id, source: { identity: input.sourceIdentity, revision: input.sourceRevision, provenance: "saved-schema-library" }, ...(input.document.additionalProperties === false ? { onlyDefinedFields: true } : {}), ...(firstRootId ? { selectedPropertyId: firstRootId } : {}) }; for (const node of Object.values(document.nodes)) {
    const presenceCondition = canonicalPredicateWithStableIds(node.presence.condition, input.idFactory);
    node.presence = presenceCondition ? { ...node.presence, condition: presenceCondition } : { ...node.presence };
    node.rules = node.rules.map((rule) => { const condition = canonicalPredicateWithStableIds(rule.condition, input.idFactory); return condition ? { ...rule, condition } : { ...rule }; });
    node.provenance = node.provenance.map(() => ({ source: "saved-schema", sourceId: input.sourceIdentity, revision: input.sourceRevision }));
} for (const row of canonicalTableRows(document)) {
    let definition = input.document;
    for (const segment of row.path.split("/").filter((value) => value && value !== "*"))
        definition = (definition.properties?.[segment] ?? definition.items ?? {});
    const concept = typeof definition["x-concept"] === "string" ? definition["x-concept"].trim() : "", types = Array.isArray(definition.type) ? definition.type.filter((value) => typeof value === "string" && ["string", "number", "integer", "boolean", "null", "object", "array"].includes(value)) : [], declared = types.find((value) => value !== "null");
    if (declared) {
        row.node.type = declared;
        row.node.nullable = types.includes("null");
    }
    if (row.node.type === "object" && definition.additionalProperties === false)
        row.node.onlyDefinedFields = true;
    if (concept)
        row.node.concept = concept;
} return document; }
export function canonicalNodeFromValue(name, value, input) { return { id: input.id("property"), name, ...(input.parentId ? { parentId: input.parentId } : {}), order: input.order, type: typeOf(value), presence: { mode: "optional" }, allowedValues: [], rules: [], documentation: emptyDocumentation(), provenance: [{ source: "created" }], overrideReferences: [] }; }
//# sourceMappingURL=data-layer-canonical-schema-migration.js.map