function clone(value) { return structuredClone(value); }
function valueType(value) { return Array.isArray(value) ? "array" : value === null ? "null" : typeof value; }
function schemaId(name, version) { return `schema:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${version}`; }
export function createSchema(name, version, document) {
    return { id: schemaId(name, version), name, version, document: clone(document), assignments: [] };
}
export function importSchema(serialized) { return clone(JSON.parse(serialized)); }
export function exportSchema(schema) { return JSON.stringify(schema); }
export function assignSchema(schema, assignment) {
    return { ...schema, assignments: [...schema.assignments.filter((item) => !(item.sourceId === assignment.sourceId && item.eventName === assignment.eventName && item.target === assignment.target)), clone(assignment)] };
}
export function reviseSchema(schema, document) { return { ...schema, id: schemaId(schema.name, schema.version + 1), version: schema.version + 1, document: clone(document) }; }
export function duplicateSchema(schema, name) { return { ...clone(schema), id: schemaId(name, schema.version), name }; }
export function searchSchemas(schemas, query) { const q = query.toLowerCase(); return schemas.filter((schema) => [schema.name, schema.version, ...schema.assignments.flatMap((a) => [a.sourceId, a.eventName, a.target])].join(" ").toLowerCase().includes(q)); }
function issuesFor(value, schema, path, schemaPath, result, metadata) {
    if (schema.type && valueType(value) !== schema.type)
        result.push({ instancePath: path, message: "Type mismatch", expected: schema.type, actual: valueType(value), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: schemaPath });
    if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
        const record = value;
        for (const property of schema.required ?? [])
            if (!(property in record))
                result.push({ instancePath: `${path}/${property}`, message: "Required value", expected: schema.properties?.[property]?.type ?? "value", actual: "missing", schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/required` });
        for (const [property, child] of Object.entries(schema.properties ?? {}))
            if (property in record)
                issuesFor(record[property], child, `${path}/${property}`, `${schemaPath}/properties/${property}`, result, metadata);
    }
    if (schema.type === "array" && Array.isArray(value) && schema.items)
        value.forEach((item, index) => issuesFor(item, schema.items, `${path}/${index}`, `${schemaPath}/items`, result, metadata));
}
export function validateEvent(event, schemas) {
    const match = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment }))).find(({ assignment }) => assignment.sourceId === event.sourceId && assignment.eventName === event.eventName);
    if (!match)
        return { state: "Not checked", issues: [] };
    const value = match.assignment.target === "payload" ? event.payload : event.rawInput;
    const issues = [];
    issuesFor(value, match.schema.document, "", "#", issues, match.schema);
    return { state: issues.length === 0 ? "Valid" : `${issues.length} issues`, issues, schema: { id: match.schema.id, name: match.schema.name, version: match.schema.version }, target: match.assignment.target };
}
export function validationSummary(results) { return { Valid: results.filter((result) => result.state === "Valid").length, Issues: results.filter((result) => result.state.endsWith("issues")).length, "Not checked": results.filter((result) => result.state === "Not checked").length }; }
export function filterByValidation(events, state) { return events.filter((event) => event.validation === state); }
export function revalidateExplicitly(event, schemas, version) { return validateEvent(event, schemas.filter((schema) => schema.version === version)); }
//# sourceMappingURL=data-layer-schema-verification.js.map