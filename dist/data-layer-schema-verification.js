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
function glob(value, pattern) {
    if (!pattern || pattern === "any")
        return true;
    const expression = `^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*")}$`;
    return new RegExp(expression, "i").test(value);
}
export function resolveSchemaAssignment(event, pageUrl, schemas) {
    const url = new URL(pageUrl);
    const matches = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment })))
        .filter(({ assignment }) => assignment.enabled !== false && assignment.sourceId === event.sourceId && assignment.eventName === event.eventName)
        .filter(({ assignment }) => glob(url.hostname, assignment.domainCondition) && glob(url.pathname, assignment.pathnameCondition));
    if (matches.length === 0)
        return {};
    const highest = Math.max(...matches.map(({ assignment }) => assignment.priority ?? 0));
    const selected = matches.filter(({ assignment }) => (assignment.priority ?? 0) === highest);
    if (selected.length !== 1)
        return { error: `Assignment error: ${selected.map(({ assignment }) => assignment.name ?? assignment.id ?? "unnamed assignment").join(", ")}` };
    return selected[0] ?? {};
}
export const SCHEMA_LIBRARY_STORAGE_KEY = "my-chrome-utilities.schema-library.v1";
export function serializeSchemaLibrary(schemas) { return JSON.stringify(schemas); }
export function restoreSchemaLibrary(serialized) {
    if (!serialized)
        return [];
    try {
        const parsed = JSON.parse(serialized);
        return Array.isArray(parsed) ? parsed.filter((schema) => !!schema && typeof schema.id === "string" && typeof schema.name === "string" && typeof schema.version === "number").map(clone) : [];
    }
    catch {
        return [];
    }
}
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
function inheritedDocument(schema, schemas, visited = new Set()) {
    if (!schema.parentId || visited.has(schema.id))
        return schema.document;
    visited.add(schema.id);
    const parent = schemas.find((candidate) => candidate.id === schema.parentId);
    if (!parent)
        return schema.document;
    const inherited = inheritedDocument(parent, schemas, visited);
    return { ...inherited, ...schema.document, required: [...new Set([...(inherited.required ?? []), ...(schema.document.required ?? [])])], properties: { ...(inherited.properties ?? {}), ...(schema.document.properties ?? {}) } };
}
export function validateEvent(event, schemas, pageUrl) {
    if (pageUrl) {
        const resolution = resolveSchemaAssignment(event, pageUrl, schemas);
        if (resolution.error)
            return { state: "Assignment error", issues: [] };
        if (resolution.schema && resolution.assignment) {
            const value = resolution.assignment.target === "payload" ? event.payload : event.rawInput;
            const issues = [];
            issuesFor(value, inheritedDocument(resolution.schema, schemas), "", "#", issues, resolution.schema);
            return { state: issues.length === 0 ? "Valid" : `${issues.length} issues`, issues, schema: { id: resolution.schema.id, name: resolution.schema.name, version: resolution.schema.version }, target: resolution.assignment.target };
        }
    }
    const match = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment }))).find(({ assignment }) => assignment.sourceId === event.sourceId && assignment.eventName === event.eventName);
    if (!match)
        return { state: "Not checked", issues: [] };
    const value = match.assignment.target === "payload" ? event.payload : event.rawInput;
    const issues = [];
    issuesFor(value, inheritedDocument(match.schema, schemas), "", "#", issues, match.schema);
    return { state: issues.length === 0 ? "Valid" : `${issues.length} issues`, issues, schema: { id: match.schema.id, name: match.schema.name, version: match.schema.version }, target: match.assignment.target };
}
export function validationSummary(results) { return { Valid: results.filter((result) => result.state === "Valid").length, Issues: results.filter((result) => result.state.endsWith("issues")).length, "Not checked": results.filter((result) => result.state === "Not checked").length }; }
export function filterByValidation(events, state) { return events.filter((event) => event.validation === state); }
export function revalidateExplicitly(event, schemas, version) { return validateEvent(event, schemas.filter((schema) => schema.version === version)); }
//# sourceMappingURL=data-layer-schema-verification.js.map