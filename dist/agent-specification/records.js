import { canonicalTableRows, canonicalJsonSchemaDocument, createCanonicalSchema } from "../data-layer-canonical-schema.js";
import { agentCanonicalSchema } from "./schema.js";
import { validateAgentRecord } from "./record-validation.js";
import { createProfileInheritanceRecipe, profileInheritanceRecipeApplied, profileInheritanceSelection } from "../data-layer-selective-profile-inheritance.js";
import { parseRecord, record } from "./contract.js";
const fields = new Set(["description", "purpose", "eventName", "sourceId", "target", "path", "pathname", "url", "trigger", "condition", "priority", "eventId", "pageId", "applicabilitySetId", "targetKind", "targetId", "input", "observations", "expected", "reviewedExpectations", "steps", "propertySetApplications", "example", "fallback", "entryCondition", "exitCondition", "timeoutMinutes", "correlationField", "occurrencePolicy"]);
export function entityRecord(entity, project) {
    const result = { name: entity.name };
    for (const [key, value] of Object.entries(entity))
        if (fields.has(key))
            result[key] = value;
    if (entity.canonicalSchema)
        result.schema = canonicalJsonSchemaDocument(entity.canonicalSchema);
    if (Array.isArray(entity.profileInheritanceRecipes))
        result.inheritance = entity.profileInheritanceRecipes.map(recipe => ({ profileId: recipe.profileId, propertyIds: recipe.propertySelections }));
    const graph = project?.documentationFlowGraphs?.[entity.id];
    if (graph)
        result.graph = structuredClone(graph);
    return result;
}
export function changeRecord(change) {
    return { ...parseRecord(change.recordJson), name: change.name };
}
export function remapReferences(value, ids, key = "") {
    const isReference = /(?:Id|Ids)$/u.test(key) && key !== "sourceId";
    if (typeof value === "string")
        return isReference ? ids.get(value) ?? value : value;
    if (Array.isArray(value))
        return value.map(item => remapReferences(item, ids, key));
    if (record(value))
        return Object.fromEntries(Object.entries(value).map(([field, item]) => [field, remapReferences(item, ids, field)]));
    return value;
}
export function materializeChange(change, id, project, ids, existing) {
    const data = remapReferences(parseRecord(change.recordJson), ids);
    for (const key of Object.keys(data))
        if (!fields.has(key) && !["schema", "inheritance", "graph"].includes(key))
            throw new Error(`Unsupported ${change.kind} field ${key}.`);
    validateAgentRecord(data);
    const entity = { ...structuredClone(existing ?? {}), id, name: change.name };
    for (const [key, value] of Object.entries(data))
        if (fields.has(key))
            entity[key] = structuredClone(value);
    if (data.schema !== undefined) {
        if (!record(data.schema))
            throw new Error("Schema must be a JSON object.");
        entity.canonicalSchema = agentCanonicalSchema(id, change.name, data.schema, existing?.canonicalSchema);
    }
    else if (!existing && ["profiles", "pages", "propertySets", "events"].includes(change.kind)) {
        entity.canonicalSchema = createCanonicalSchema({ id: `schema:${id}`, contributorId: id, contributorName: change.name });
    }
    if (change.kind === "profiles")
        entity.requirements ??= [];
    if (change.kind === "events") {
        entity.eventName ??= change.name;
        entity.sourceId ??= "event-history";
        entity.target ??= "payload";
    }
    if (change.kind === "flows")
        entity.steps ??= [];
    if (change.kind === "pages")
        entity.propertySetApplications ??= [];
    if (data.inheritance !== undefined) {
        if (!Array.isArray(data.inheritance))
            throw new Error("Inheritance must be a list.");
        entity.profileInheritanceRecipes = data.inheritance.map((entry, index) => {
            if (!record(entry) || typeof entry.profileId !== "string" || !Array.isArray(entry.propertyIds) || !entry.propertyIds.every(id => typeof id === "string"))
                throw new Error("Invalid profile inheritance.");
            const profile = project.collections.profiles.find(profile => profile.id === entry.profileId);
            const schema = profile?.canonicalSchema;
            if (!schema)
                throw new Error(`Shared Profile ${entry.profileId} has no canonical schema.`);
            const paths = new Map(canonicalTableRows(schema).map(row => [row.path, row.node.id]));
            const recipe = { ...createProfileInheritanceRecipe({ id: `inheritance:${id}:${index}`, profileId: profile.id, targetId: id, startingPoint: "properties", sourceRevision: schema.revision }), propertySelections: entry.propertyIds.map(id => schema.nodes[id] ? id : paths.get(id) ?? id) };
            const selected = profileInheritanceSelection(schema, recipe);
            if (selected.missingPropertyIds.length || selected.missingRuleDependencies.length)
                throw new Error(`Resolve missing properties or rule dependencies in ${profile.name}.`);
            return profileInheritanceRecipeApplied(schema, recipe);
        });
    }
    return entity;
}
//# sourceMappingURL=records.js.map