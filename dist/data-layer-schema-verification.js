import { pathConditionResult } from "./data-layer-path-conditions.js";
import { resolveNestedValues } from "./data-layer-schema-nested-path.js";
function clone(value) { return structuredClone(value); }
function valueType(value) { return Array.isArray(value) ? "array" : value === null ? "null" : typeof value; }
function schemaSlug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function schemaId(name, version) { return `schema:${schemaSlug(name)}:${version}`; }
function stableSchemaId(name) { return `schema-${schemaSlug(name)}`; }
function schemaSnapshot(schema) {
    const { revisionHistory: _history, workingDraft: _draft, ...snapshot } = clone(schema);
    return snapshot;
}
function assignmentForSchema(assignment, id) {
    const { schemaVersion, ...withoutVersion } = clone(assignment);
    return {
        ...withoutVersion,
        ...(assignment.schemaId ? { schemaId: id } : {}),
        ...(assignment.versionPolicy === "pinned" && schemaVersion !== undefined ? { schemaVersion } : {}),
    };
}
export function createSchema(name, version, document) {
    return { id: schemaId(name, version), name, version, document: clone(document), assignments: [] };
}
export function importSchema(serialized) { return clone(JSON.parse(serialized)); }
export function exportSchema(schema) { return JSON.stringify(schema); }
export function assignSchema(schema, assignment) {
    return { ...schema, assignments: [...schema.assignments.filter((item) => !(item.sourceId === assignment.sourceId && item.eventName === assignment.eventName && item.target === assignment.target)), clone(assignment)] };
}
export function createSchemaWorkingDraft(schema, sourceVersion = schema.version) {
    if (schema.workingDraft)
        return clone(schema);
    const source = schemaRevision(schema, sourceVersion);
    if (!source)
        throw new Error(`Schema revision ${sourceVersion} does not exist.`);
    return {
        ...clone(schema),
        workingDraft: {
            baseVersion: schema.version,
            sourceVersion,
            document: clone(source.document),
            assignments: clone(source.assignments),
            ...(source.attachedRules ? { attachedRules: clone(source.attachedRules) } : {}),
            ...(source.parentSchemaId ? { parentSchemaId: source.parentSchemaId } : {}),
            ...(source.inheritedRuleOverrides ? { inheritedRuleOverrides: clone(source.inheritedRuleOverrides) } : {}),
            pendingChanges: [],
        },
    };
}
export function updateSchemaWorkingDraft(schema, changes, change) {
    const withDraft = schema.workingDraft ? clone(schema) : createSchemaWorkingDraft(schema);
    const draft = withDraft.workingDraft;
    return { ...withDraft, workingDraft: { ...draft, ...clone(changes), pendingChanges: change ? [...draft.pendingChanges, change] : draft.pendingChanges } };
}
export function discardSchemaWorkingDraft(schema) {
    const { workingDraft: _draft, ...current } = clone(schema);
    return current;
}
export function publishSchemaWorkingDraft(schema) {
    const draft = schema.workingDraft;
    if (!draft)
        throw new Error("Schema has no working draft to publish.");
    const snapshot = schemaSnapshot(schema);
    const { attachedRules: _attachedRules, parentSchemaId: _parentSchemaId, inheritedRuleOverrides: _overrides, ...current } = snapshot;
    return {
        ...current,
        version: schema.published === false ? 1 : schema.version + 1,
        published: true,
        document: clone(draft.document),
        assignments: clone(draft.assignments).map((assignment) => assignmentForSchema(assignment, schema.id)),
        ...(draft.attachedRules ? { attachedRules: clone(draft.attachedRules) } : {}),
        ...(draft.parentSchemaId ? { parentSchemaId: draft.parentSchemaId } : {}),
        ...(draft.inheritedRuleOverrides ? { inheritedRuleOverrides: clone(draft.inheritedRuleOverrides) } : {}),
        revisionHistory: schema.published === false ? [] : [...(schema.revisionHistory ?? []).map(schemaSnapshot), snapshot],
    };
}
export function schemaRevision(schema, version) {
    if (schema.version === version)
        return schemaSnapshot(schema);
    const match = schema.revisionHistory?.find((revision) => revision.version === version);
    return match ? schemaSnapshot(match) : undefined;
}
export function schemaRevisionChoices(schema) {
    return [...new Set((schema.revisionHistory ?? []).map(({ version }) => version))].sort((left, right) => right - left);
}
export function restoreSchemaRevisionDraft(schema, version) {
    const withoutDraft = discardSchemaWorkingDraft(schema);
    const restored = createSchemaWorkingDraft(withoutDraft, version);
    return { ...restored, workingDraft: { ...restored.workingDraft, pendingChanges: [`Restore revision ${version}`] } };
}
export function duplicateSchemaRevision(schema, version) {
    const source = schemaRevision(schema, version);
    if (!source)
        throw new Error(`Schema revision ${version} does not exist.`);
    const { revisionHistory: _history, workingDraft: _draft, ...duplicate } = duplicateSchema(source, `${schema.name} revision ${version} copy`);
    return { ...duplicate, version: 1, published: false, assignments: [] };
}
export function reviseSchema(schema, document) {
    return publishSchemaWorkingDraft(updateSchemaWorkingDraft(schema, { document }, "Update schema document"));
}
export function duplicateSchema(schema, name) { return { ...clone(schema), id: schemaId(name, schema.version), name }; }
export function assignableSchemas(schemas) {
    return schemas.filter(({ published }) => published !== false).map(clone);
}
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
function assignmentPathMatches(pathname, assignment) {
    if (!assignment.pathConditions?.length)
        return glob(pathname, assignment.pathnameCondition);
    return assignment.pathConditions.some((condition) => pathConditionResult(condition, pathname).matches);
}
export function resolveSchemaAssignment(event, pageUrl, schemas) {
    const url = new URL(pageUrl);
    const matches = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment })))
        .filter(({ assignment }) => assignment.enabled !== false && assignment.sourceId === event.sourceId && assignment.eventName === event.eventName)
        .filter(({ assignment }) => glob(url.hostname, assignment.domainCondition) && assignmentPathMatches(url.pathname, assignment));
    if (matches.length === 0)
        return {};
    const highest = Math.max(...matches.map(({ assignment }) => assignment.priority ?? 0));
    const selected = matches.filter(({ assignment }) => (assignment.priority ?? 0) === highest);
    if (selected.length !== 1)
        return { error: `Assignment error: ${selected.map(({ assignment }) => assignment.name ?? assignment.id ?? "unnamed assignment").join(", ")}` };
    const resolved = selected[0];
    if (!resolved)
        return {};
    const pinnedVersion = resolved.assignment.versionPolicy === "pinned" ? resolved.assignment.schemaVersion : undefined;
    const selectedSchema = pinnedVersion ? schemaRevision(resolved.schema, pinnedVersion) : resolved.schema;
    return selectedSchema ? { schema: selectedSchema, assignment: resolved.assignment } : { error: `Assignment error: schema revision ${pinnedVersion} is unavailable` };
}
export const SCHEMA_LIBRARY_STORAGE_KEY = "my-chrome-utilities.schema-library.v1";
export function serializeSchemaLibrary(schemas) { return JSON.stringify(schemas); }
export function schemaLibraryExportIdentitySnapshot(items) { return items.map(({ id }) => id); }
export function createSchemaLibraryExport(schemas, rules) {
    return { version: 1, schemas: schemas.map(clone), rules: rules.map(clone) };
}
export function serializeSchemaLibraryExport(schemas, rules) { return `${JSON.stringify(createSchemaLibraryExport(schemas, rules), null, 2)}\n`; }
export function migrateSchemaLibrary(schemas) {
    const groups = new Map();
    for (const schema of schemas) {
        const key = schema.name.trim().toLowerCase();
        groups.set(key, [...(groups.get(key) ?? []), clone(schema)]);
    }
    return [...groups.values()].map((group) => {
        if (group.length === 1)
            return group[0];
        const ordered = [...group].sort((left, right) => left.version - right.version);
        const current = ordered.at(-1);
        const stableId = stableSchemaId(current.name);
        const revisions = ordered.slice(0, -1).flatMap((schema) => [...(schema.revisionHistory ?? []), schema]).map(schemaSnapshot);
        const assignments = ordered.flatMap(({ assignments }) => assignments).map((assignment) => {
            const pinnedVersion = assignment.schemaVersion ?? Number(assignment.schemaId?.match(/(?:^|:)(\d+)$/)?.[1] ?? current.version);
            return assignmentForSchema({ ...assignment, ...(assignment.versionPolicy === "pinned" ? { schemaVersion: pinnedVersion } : {}) }, stableId);
        });
        return {
            ...schemaSnapshot(current),
            id: stableId,
            assignments,
            revisionHistory: [...new Map(revisions.map((revision) => [revision.version, { ...revision, id: stableId }])).values()].sort((left, right) => left.version - right.version),
        };
    });
}
export function restoreSchemaLibrary(serialized) {
    if (!serialized)
        return [];
    try {
        const parsed = JSON.parse(serialized);
        if (!Array.isArray(parsed))
            return [];
        const schemas = parsed.filter((schema) => !!schema && typeof schema.id === "string" && typeof schema.name === "string" && typeof schema.version === "number");
        return migrateSchemaLibrary(schemas);
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
        for (const property of schema.forbidden ?? [])
            if (property in record)
                result.push({ instancePath: `${path}/${property}`, message: "Forbidden property", expected: "absent", actual: valueType(record[property]), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/forbidden` });
        if (schema.additionalProperties === false)
            for (const property of Object.keys(record))
                if (!(property in (schema.properties ?? {})))
                    result.push({ instancePath: `${path}/${property}`, message: "Undeclared property", expected: "declared property", actual: valueType(record[property]), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/additionalProperties` });
        for (const [property, child] of Object.entries(schema.properties ?? {}))
            if (property in record)
                issuesFor(record[property], child, `${path}/${property}`, `${schemaPath}/properties/${property}`, result, metadata);
    }
    if (schema.type === "number" && typeof value === "number") {
        if (schema.minimum !== undefined && value < schema.minimum)
            result.push({ instancePath: path, message: "Value below minimum", expected: String(schema.minimum), actual: String(value), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/minimum` });
        if (schema.maximum !== undefined && value > schema.maximum)
            result.push({ instancePath: path, message: "Value above maximum", expected: String(schema.maximum), actual: String(value), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/maximum` });
    }
    if (schema.type === "array" && Array.isArray(value) && schema.items)
        value.forEach((item, index) => issuesFor(item, schema.items, `${path}/${index}`, `${schemaPath}/items`, result, metadata));
}
function issueFromAttachedRule(rule, schema, issue, allowedValues = []) {
    return {
        ...issue,
        message: rule.message ?? issue.message,
        schemaName: schema.name,
        schemaVersion: schema.version,
        schemaLocation: `#/attachedRules/${rule.id}`,
        rule: `${rule.name ?? rule.id} v${rule.version}`,
        severity: rule.severity ?? "error",
        origin: `${schema.name} v${schema.version}`,
        ...(allowedValues.length ? { allowedValues } : {}),
    };
}
function nestedRuleFailure(rule, match) {
    const operator = rule.operator?.replaceAll("_", "-").toLowerCase() ?? "";
    const actual = match.exists ? typeof match.value === "string" ? match.value : JSON.stringify(match.value) : "missing";
    if (operator === "required")
        return match.exists ? undefined : { message: "Required value", expected: "value", actual };
    if (operator === "exact-value")
        return match.exists && String(match.value) === (rule.parameters ?? "") ? undefined : { message: "Value is not exact", expected: rule.parameters ?? "value", actual };
    if (operator === "value-type") {
        const valueType = Array.isArray(match.value) ? "array" : typeof match.value;
        return match.exists && valueType === rule.parameters ? undefined : { message: "Type mismatch", expected: rule.parameters ?? "value", actual: match.exists ? valueType : actual };
    }
    if (operator === "non-empty-string")
        return match.exists && typeof match.value === "string" && match.value.length > 0 ? undefined : { message: "Value is empty", expected: "non-empty string", actual };
    if (operator === "text-length") {
        const length = Number(rule.parameters);
        return match.exists && typeof match.value === "string" && match.value.length === length ? undefined : { message: "Text length mismatch", expected: `text length ${length}`, actual };
    }
    if (operator === "digits-only")
        return match.exists && typeof match.value === "string" && /^\d+$/.test(match.value) ? undefined : { message: "Value contains non-digits", expected: "digits only", actual };
    if (operator === "allowed-values" || operator === "allowed values") {
        const values = rule.parameters?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
        return match.exists && values.includes(String(match.value)) ? undefined : { message: "Value is not allowed", expected: values.join(","), actual };
    }
    if (operator === "regular-expression" || operator === "regular expression") {
        try {
            return match.exists && new RegExp(rule.parameters ?? "").test(String(match.value)) ? undefined : { message: "Value does not match pattern", expected: rule.parameters ?? "pattern", actual };
        }
        catch {
            return { message: "Invalid regular expression", expected: rule.parameters ?? "pattern", actual };
        }
    }
    if (operator === "item-count") {
        const minimum = Number(rule.parameters ?? 0);
        return match.exists && Array.isArray(match.value) && match.value.length >= minimum ? undefined : { message: "Too few items", expected: `minimum ${minimum} items`, actual };
    }
    return undefined;
}
function attachedRuleIssues(value, schema, result, rules = schema.attachedRules ?? []) {
    for (const rule of rules) {
        if (rule.enabled === false)
            continue;
        if (rule.propertyPath?.startsWith("/")) {
            for (const match of resolveNestedValues(value, rule.propertyPath)) {
                const failure = nestedRuleFailure(rule, match);
                if (failure)
                    result.push(issueFromAttachedRule(rule, schema, { instancePath: match.concretePath, templatePath: match.templatePath, ...failure }));
            }
            continue;
        }
        const record = value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
        if (rule.operator === "required")
            for (const property of rule.parameters?.split(",").map((item) => item.trim()).filter(Boolean) ?? [])
                if (!record || !(property in record))
                    result.push(issueFromAttachedRule(rule, schema, { instancePath: `/${property}`, message: "Required value", expected: "value", actual: "missing" }));
        const [property, constraint] = rule.parameters?.split(":", 2) ?? [];
        if (!record || !property || !(property in record))
            continue;
        const allowedValues = rule.operator === "allowed-values" && constraint
            ? constraint.split(",").map((item) => item.trim()).filter(Boolean)
            : [];
        if (rule.operator === "allowed-values" && constraint && !allowedValues.includes(String(record[property])))
            result.push(issueFromAttachedRule(rule, schema, { instancePath: `/${property}`, message: "Value is not allowed", expected: constraint, actual: String(record[property]) }, allowedValues));
        if (rule.operator === "regular-expression" && constraint) {
            try {
                if (!new RegExp(constraint).test(String(record[property])))
                    result.push(issueFromAttachedRule(rule, schema, { instancePath: `/${property}`, message: "Value does not match pattern", expected: constraint, actual: String(record[property]) }));
            }
            catch {
                result.push(issueFromAttachedRule(rule, schema, { instancePath: `/${property}`, message: "Invalid regular expression", expected: constraint, actual: String(record[property]) }));
            }
        }
    }
}
function inheritedAttachedRuleIssues(value, schema, schemas, result) {
    const disabled = new Set(Object.entries(schema.inheritedRuleOverrides ?? {}).filter(([, state]) => state === "disabled").map(([path]) => path));
    const visited = new Set([schema.id]);
    let parentId = schema.parentSchemaId;
    while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        const parent = schemas.find((candidate) => candidate.id === parentId);
        if (!parent)
            break;
        attachedRuleIssues(value, parent, result, (parent.attachedRules ?? []).filter((rule) => !rule.propertyPath || !disabled.has(rule.propertyPath)));
        parentId = parent.parentSchemaId;
    }
}
function attachedRuleEvaluations(value, schema, rules) {
    return rules.filter(({ enabled }) => enabled !== false).flatMap((rule) => {
        const issues = [];
        attachedRuleIssues(value, schema, issues, [rule]);
        const propertyPath = rule.propertyPath ?? rule.parameters?.split(":", 1)[0]?.split(",", 1)[0]?.trim() ?? "";
        const record = value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
        const actual = propertyPath && record && propertyPath in record ? String(record[propertyPath]) : "missing";
        if (!issues.length)
            return [{ propertyPath, status: "pass", message: rule.message ?? `${rule.name ?? rule.id} passed`, expected: rule.parameters?.split(":", 2)[1] ?? "rule satisfied", actual, rule: rule.name ?? rule.id, ruleVersion: rule.version, severity: rule.severity ?? "error", schemaName: schema.name, schemaVersion: schema.version }];
        return issues.map((issue) => ({ propertyPath: issue.instancePath, status: issue.severity === "warning" ? "warning" : "error", message: issue.message, expected: issue.expected, actual: issue.actual, rule: rule.name ?? rule.id, ruleVersion: rule.version, severity: issue.severity ?? "error", schemaName: schema.name, schemaVersion: schema.version }));
    });
}
function validationEvaluations(value, schema, schemas) {
    const result = attachedRuleEvaluations(value, schema, schema.attachedRules ?? []);
    const disabled = new Set(Object.entries(schema.inheritedRuleOverrides ?? {}).filter(([, state]) => state === "disabled").map(([path]) => path));
    const visited = new Set([schema.id]);
    let parentId = schema.parentSchemaId;
    while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        const parent = schemas.find((candidate) => candidate.id === parentId);
        if (!parent)
            break;
        result.push(...attachedRuleEvaluations(value, parent, (parent.attachedRules ?? []).filter((rule) => !rule.propertyPath || !disabled.has(rule.propertyPath))));
        parentId = parent.parentSchemaId;
    }
    return result;
}
function collectSchemaIssues(value, schema, schemas, result) {
    issuesFor(value, inheritedDocument(schema, schemas), "", "#", result, schema);
    attachedRuleIssues(value, schema, result);
    inheritedAttachedRuleIssues(value, schema, schemas, result);
}
function validationStateForIssues(issues) {
    if (issues.length === 0)
        return "Valid";
    const warnings = issues.filter((issue) => issue.severity === "warning").length;
    const errors = issues.length - warnings;
    if (!errors)
        return `${warnings} warnings`;
    if (!warnings)
        return `${errors} issues`;
    return `${errors} ${errors === 1 ? "error" : "errors"} and ${warnings} ${warnings === 1 ? "warning" : "warnings"}`;
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
            collectSchemaIssues(value, resolution.schema, schemas, issues);
            const inheritedFrom = inheritedSchemaProvenance(resolution.schema, schemas);
            return { state: validationStateForIssues(issues), issues, evaluations: validationEvaluations(value, resolution.schema, schemas), schema: { id: resolution.schema.id, name: resolution.schema.name, version: resolution.schema.version }, target: resolution.assignment.target, assignment: resolution.assignment, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
        }
    }
    const match = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment }))).find(({ assignment }) => assignment.sourceId === event.sourceId && assignment.eventName === event.eventName);
    if (!match)
        return { state: "Not checked", issues: [] };
    const value = match.assignment.target === "payload" ? event.payload : event.rawInput;
    const issues = [];
    collectSchemaIssues(value, match.schema, schemas, issues);
    const inheritedFrom = inheritedSchemaProvenance(match.schema, schemas);
    return { state: validationStateForIssues(issues), issues, evaluations: validationEvaluations(value, match.schema, schemas), schema: { id: match.schema.id, name: match.schema.name, version: match.schema.version }, target: match.assignment.target, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
}
export function validateWithSchema(event, schema, schemas, target = schema.assignments[0]?.target ?? "payload") {
    const value = target === "payload" ? event.payload : event.rawInput;
    const issues = [];
    collectSchemaIssues(value, schema, schemas, issues);
    const inheritedFrom = inheritedSchemaProvenance(schema, schemas);
    return { state: validationStateForIssues(issues), issues, evaluations: validationEvaluations(value, schema, schemas), schema: { id: schema.id, name: schema.name, version: schema.version }, target, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
}
export function validationSummary(results) { return { "Not checked": results.filter((result) => result.state === "Not checked").length, Valid: results.filter((result) => result.state === "Valid").length, Warnings: results.filter((result) => result.state.endsWith("warnings") && !result.state.includes("error")).length, Issues: results.filter((result) => result.state.endsWith("issues") || result.state.includes("error") && result.state !== "Assignment error").length, "Assignment error": results.filter((result) => result.state === "Assignment error").length }; }
export function filterByValidation(events, state) { return events.filter((event) => event.validation === state); }
export function revalidateExplicitly(event, schemas, version) {
    const revisions = schemas.flatMap((schema) => schemaRevision(schema, version) ?? []);
    return validateEvent(event, revisions);
}
//# sourceMappingURL=data-layer-schema-verification.js.map