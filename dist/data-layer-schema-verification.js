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
export const SCHEMA_VALIDATION_RECORDS_STORAGE_KEY = "my-chrome-utilities.schema-validation-records.v1";
export function saveSchemaValidationRecord(records, eventId, result, validatedAt = new Date().toISOString()) { return [...records, { eventId, validatedAt, result: clone(result) }]; }
export function restoreSchemaValidationRecords(serialized) { try {
    const records = JSON.parse(serialized ?? "[]");
    return Array.isArray(records) ? records.filter((record) => !!record && typeof record.eventId === "string" && typeof record.validatedAt === "string" && !!record.result).map(clone) : [];
}
catch {
    return [];
} }
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
    if (schema.enum && !schema.enum.includes(String(value)))
        result.push({ instancePath: path, message: "Value is not allowed", expected: schema.enum.join(", "), actual: String(value), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/enum` });
    if (schema.forbidden?.includes(String(value)))
        result.push({ instancePath: path, message: "Value is forbidden", expected: `not one of ${schema.forbidden.join(", ")}`, actual: String(value), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/forbidden` });
    if (typeof value === "number" && ((schema.minimum !== undefined && value < schema.minimum) || (schema.maximum !== undefined && value > schema.maximum)))
        result.push({ instancePath: path, message: "Value is outside range", expected: `${schema.minimum ?? "-∞"}, ${schema.maximum ?? "∞"}`, actual: String(value), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/range` });
    if (schema.pattern && !safeRegex(schema.pattern)?.test(String(value)))
        result.push({ instancePath: path, message: "Value does not match pattern", expected: schema.pattern, actual: String(value), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/pattern` });
    if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
        const record = value;
        if (schema.additionalProperties === false)
            for (const property of Object.keys(record))
                if (!(property in (schema.properties ?? {})))
                    result.push({ instancePath: `${path}/${property}`, message: "Undeclared property", expected: "declared property", actual: property, schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/additionalProperties` });
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
function inheritedRuleAttachments(schema, schemas, visited = new Set()) {
    if (!schema.parentId || visited.has(schema.id))
        return schema.ruleAttachments ?? [];
    visited.add(schema.id);
    const parent = schemas.find((candidate) => candidate.id === schema.parentId);
    const attachments = [...(parent ? inheritedRuleAttachments(parent, schemas, visited) : []), ...(schema.ruleAttachments ?? [])];
    return attachments.filter((attachment, index) => attachments.findIndex((candidate) => candidate.ruleId === attachment.ruleId && candidate.version === attachment.version) === index);
}
function safeRegex(pattern) {
    if (pattern.length > 200 || /\\[1-9]|\\k<|\(\?<?[=!]/.test(pattern) || /\([^)]*[+*][^)]*\)[+*{]/.test(pattern))
        return undefined;
    try {
        return new RegExp(pattern, "u");
    }
    catch {
        return undefined;
    }
}
function ruleIssuesFor(value, schema, schemas, rules, result) {
    for (const attachment of inheritedRuleAttachments(schema, schemas)) {
        const rule = rules.find((candidate) => candidate.id === attachment.ruleId && candidate.version === attachment.version) ?? attachment.snapshot;
        const location = `#/ruleAttachments/${encodeURIComponent(attachment.ruleId)}@${attachment.version}`;
        if (!rule) {
            result.push({ instancePath: "", message: "Pinned rule unavailable", expected: `${attachment.ruleId} v${attachment.version}`, actual: "unavailable", schemaName: schema.name, schemaVersion: schema.version, schemaLocation: location });
            continue;
        }
        const types = rule.applicableTypes.split(",").map((type) => type.trim().toLowerCase()).filter(Boolean);
        if (types.length > 0 && !types.includes("any") && !types.includes(valueType(value)))
            continue;
        const expected = rule.operator === "required" ? "a present value" : rule.parameters || "an allowed value";
        const missing = value === undefined || value === null || (typeof value === "string" && value.trim() === "");
        const allowed = rule.parameters.split(",").map((parameter) => parameter.trim()).filter(Boolean);
        const pattern = rule.operator === "matches-pattern" ? safeRegex(rule.parameters) : undefined;
        const [parsedMinimum, parsedMaximum] = rule.parameters.split(",").map((parameter) => Number(parameter.trim()));
        const minimum = parsedMinimum ?? Number.NaN;
        const maximum = parsedMaximum ?? Number.NaN;
        const undeclared = schema.document.type === "object" && value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value).filter((key) => !(key in (schema.document.properties ?? {}))) : [];
        const fails = rule.operator === "required" ? missing : rule.operator === "allowed-values" ? allowed.length > 0 && !allowed.includes(String(value)) : rule.operator === "forbidden-values" ? allowed.includes(String(value)) : rule.operator === "number-range" ? typeof value !== "number" || !Number.isFinite(minimum) || !Number.isFinite(maximum) || value < minimum || value > maximum : rule.operator === "declared-only" ? undeclared.length > 0 : rule.operator === "matches-pattern" ? !pattern || !pattern.test(String(value)) : false;
        if (fails)
            result.push({ instancePath: "", message: rule.operator === "matches-pattern" && !pattern ? "Invalid safe regex" : rule.message || rule.name, expected: rule.operator === "matches-pattern" ? rule.parameters || "a safe regex" : rule.operator === "forbidden-values" ? `not one of ${rule.parameters}` : rule.operator === "number-range" ? rule.parameters : rule.operator === "declared-only" ? "declared fields only" : expected, actual: rule.operator === "declared-only" ? undeclared.join(", ") : missing ? "missing" : String(value), schemaName: schema.name, schemaVersion: schema.version, schemaLocation: location, ...(rule.severity ? { severity: rule.severity } : {}) });
    }
}
function validationFor(schema, assignment, event, schemas, rules) {
    const value = assignment.target === "payload" ? event.payload : event.rawInput;
    const issues = [];
    issuesFor(value, inheritedDocument(schema, schemas), "", "#", issues, schema);
    ruleIssuesFor(value, schema, schemas, rules, issues);
    return { state: issues.length === 0 ? "Valid" : `${issues.length} issues`, issues, schema: { id: schema.id, name: schema.name, version: schema.version }, target: assignment.target };
}
export function validateEvent(event, schemas, pageUrl, rules = []) {
    if (pageUrl) {
        const resolution = resolveSchemaAssignment(event, pageUrl, schemas);
        if (resolution.error)
            return { state: "Assignment error", issues: [] };
        if (resolution.schema && resolution.assignment) {
            return validationFor(resolution.schema, resolution.assignment, event, schemas, rules);
        }
    }
    const match = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment }))).find(({ assignment }) => assignment.sourceId === event.sourceId && assignment.eventName === event.eventName);
    if (!match)
        return { state: "Not checked", issues: [] };
    return validationFor(match.schema, match.assignment, event, schemas, rules);
}
export function validationSummary(results) { return { Valid: results.filter((result) => result.state === "Valid").length, Issues: results.filter((result) => result.state.endsWith("issues")).length, "Not checked": results.filter((result) => result.state === "Not checked").length }; }
export function filterByValidation(events, state) { return events.filter((event) => event.validation === state); }
export function revalidateExplicitly(event, schemas, version, rules = []) { return validateEvent(event, schemas.filter((schema) => schema.version === version), undefined, rules); }
//# sourceMappingURL=data-layer-schema-verification.js.map