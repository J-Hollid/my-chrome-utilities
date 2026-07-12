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
export function reviseSchema(schema, document) { return { ...schema, id: schemaId(schema.name, schema.version + 1), version: schema.version + 1, document: clone(document), revisionHistory: [...(schema.revisionHistory ?? []), clone(schema)] }; }
export function duplicateSchema(schema, name) { return { ...clone(schema), id: schemaId(name, schema.version), name }; }
export function schemaInheritanceError(schema, schemas) {
    if (!schema.parentSchemaId)
        return undefined;
    if (schema.parentSchemaId === schema.id)
        return "A schema cannot inherit from itself";
    const parents = new Map(schemas.map((item) => [item.id, item.parentSchemaId]));
    if (!parents.has(schema.parentSchemaId))
        return "The selected parent schema does not exist";
    let current = schema.parentSchemaId;
    while (current) {
        if (current === schema.id)
            return "Schema inheritance cannot contain a cycle";
        current = parents.get(current);
    }
    const parent = schemas.find((candidate) => candidate.id === schema.parentSchemaId);
    const childTarget = schema.assignments[0]?.target;
    const parentTarget = parent?.assignments[0]?.target;
    if (childTarget && parentTarget && childTarget !== parentTarget)
        return "Parent and child validation targets must match";
    return undefined;
}
export function schemaInheritanceConflict(schema, schemas) {
    let parentId = schema.parentSchemaId;
    while (parentId) {
        const parent = schemas.find((candidate) => candidate.id === parentId);
        if (!parent)
            return undefined;
        for (const [property, localRule] of Object.entries(schema.document.properties ?? {})) {
            if (schema.inheritedRuleOverrides?.[property] === "disabled")
                continue;
            const inheritedRule = parent.document.properties?.[property];
            if (localRule.type && inheritedRule?.type && localRule.type !== inheritedRule.type)
                return `Inheritance conflict: ${property} is ${inheritedRule.type} in ${parent.name} but ${localRule.type} locally`;
        }
        parentId = parent.parentSchemaId;
    }
    return undefined;
}
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
function attachedRuleIssues(value, schema, result) {
    for (const rule of schema.attachedRules ?? []) {
        if (rule.enabled === false || rule.operator !== "required")
            continue;
        for (const property of rule.parameters?.split(",").map((item) => item.trim()).filter(Boolean) ?? []) {
            if (!value || typeof value !== "object" || Array.isArray(value) || !(property in value))
                result.push({ instancePath: `/${property}`, message: "Required value", expected: "value", actual: "missing", schemaName: schema.name, schemaVersion: schema.version, schemaLocation: `#/attachedRules/${rule.id}` });
        }
    }
}
function inheritedDocument(schema, schemas, visited = new Set()) {
    if (!schema.parentSchemaId || visited.has(schema.id))
        return schema.document;
    visited.add(schema.id);
    const parent = schemas.find((candidate) => candidate.id === schema.parentSchemaId);
    if (!parent)
        return schema.document;
    const inherited = inheritedDocument(parent, schemas, visited);
    const disabled = new Set(Object.entries(schema.inheritedRuleOverrides ?? {}).filter(([, state]) => state === "disabled").map(([property]) => property));
    const inheritedProperties = Object.fromEntries(Object.entries(inherited.properties ?? {}).filter(([property]) => !disabled.has(property)));
    return {
        ...inherited,
        ...schema.document,
        required: [...new Set([...(inherited.required ?? []).filter((property) => !disabled.has(property)), ...(schema.document.required ?? [])])],
        properties: { ...inheritedProperties, ...(schema.document.properties ?? {}) },
    };
}
function inheritedSchemaProvenance(schema, schemas) {
    const parents = [];
    const visited = new Set([schema.id]);
    let parentId = schema.parentSchemaId;
    while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        const parent = schemas.find((candidate) => candidate.id === parentId);
        if (!parent)
            break;
        parents.push({ id: parent.id, name: parent.name, version: parent.version });
        parentId = parent.parentSchemaId;
    }
    return parents;
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
            attachedRuleIssues(value, resolution.schema, issues);
            const inheritedFrom = inheritedSchemaProvenance(resolution.schema, schemas);
            return { state: issues.length === 0 ? "Valid" : `${issues.length} issues`, issues, schema: { id: resolution.schema.id, name: resolution.schema.name, version: resolution.schema.version }, target: resolution.assignment.target, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
        }
    }
    const match = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment }))).find(({ assignment }) => assignment.sourceId === event.sourceId && assignment.eventName === event.eventName);
    if (!match)
        return { state: "Not checked", issues: [] };
    const value = match.assignment.target === "payload" ? event.payload : event.rawInput;
    const issues = [];
    issuesFor(value, inheritedDocument(match.schema, schemas), "", "#", issues, match.schema);
    attachedRuleIssues(value, match.schema, issues);
    const inheritedFrom = inheritedSchemaProvenance(match.schema, schemas);
    return { state: issues.length === 0 ? "Valid" : `${issues.length} issues`, issues, schema: { id: match.schema.id, name: match.schema.name, version: match.schema.version }, target: match.assignment.target, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
}
export function validateWithSchema(event, schema, schemas, target = schema.assignments[0]?.target ?? "payload") {
    const value = target === "payload" ? event.payload : event.rawInput;
    const issues = [];
    issuesFor(value, inheritedDocument(schema, schemas), "", "#", issues, schema);
    attachedRuleIssues(value, schema, issues);
    const inheritedFrom = inheritedSchemaProvenance(schema, schemas);
    return { state: issues.length === 0 ? "Valid" : `${issues.length} issues`, issues, schema: { id: schema.id, name: schema.name, version: schema.version }, target, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
}
export function validationSummary(results) { return { Valid: results.filter((result) => result.state === "Valid").length, Issues: results.filter((result) => result.state.endsWith("issues")).length, "Not checked": results.filter((result) => result.state === "Not checked").length }; }
export function filterByValidation(events, state) { return events.filter((event) => event.validation === state); }
export function revalidateExplicitly(event, schemas, version) { return validateEvent(event, schemas.filter((schema) => schema.version === version)); }
//# sourceMappingURL=data-layer-schema-verification.js.map