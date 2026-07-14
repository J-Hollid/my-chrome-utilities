import { normalizeCanonicalSchemaDocument } from "./data-layer-schema-canonical-document.js";
import { urlConditionsMatch } from "./data-layer-path-conditions.js";
import { canonicalNestedPath, resolveNestedValues } from "./data-layer-schema-nested-path.js";
import { conditionGroupAppliesToValue, conditionalRuleSummary, } from "./data-layer-conditional-validation-rules.js";
import { resolveEffectiveSchemaDocumentation, } from "./data-layer-schema-documentation.js";
function clone(value) { return structuredClone(value); }
function valueType(value) { return Array.isArray(value) ? "array" : value === null ? "null" : typeof value; }
function schemaSlug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function schemaId(name, version) { return `schema:${schemaSlug(name)}:${version}`; }
function stableSchemaId(name) { return `schema-${schemaSlug(name)}`; }
function canonicalAttachedRulePath(path) {
    return canonicalNestedPath(path);
}
function documentContainsPath(document, path) {
    let current = normalizeCanonicalSchemaDocument(document);
    for (const segment of canonicalAttachedRulePath(path).split("/").filter(Boolean)) {
        current = segment === "*" || /^\d+$/.test(segment) ? current?.items : current?.properties?.[segment];
        if (!current)
            return false;
    }
    return true;
}
function schemaDefinitionAtPath(document, path) {
    let current = normalizeCanonicalSchemaDocument(document);
    for (const segment of canonicalAttachedRulePath(path).split("/").filter(Boolean)) {
        current = segment === "*" || /^\d+$/.test(segment) ? current?.items : current?.properties?.[segment];
    }
    return current;
}
function exactLegacyParameterPrefix(parameters, propertyPath) {
    const canonical = canonicalAttachedRulePath(propertyPath);
    const alternatives = new Set([canonical, canonical.slice(1), propertyPath.trim()]);
    return [...alternatives].find((candidate) => parameters.startsWith(`${candidate}:`));
}
function effectiveAttachedRule(rule, document) {
    let propertyPath = rule.propertyPath ? canonicalAttachedRulePath(rule.propertyPath) : undefined;
    let parameters = rule.parameters;
    if (!propertyPath && parameters && document) {
        const separator = parameters.indexOf(":");
        const legacyTarget = separator > 0 ? parameters.slice(0, separator).trim() : "";
        if (legacyTarget && documentContainsPath(document, legacyTarget))
            propertyPath = canonicalAttachedRulePath(legacyTarget);
    }
    if (propertyPath && parameters !== undefined) {
        const prefix = exactLegacyParameterPrefix(parameters, propertyPath);
        if (prefix)
            parameters = parameters.slice(prefix.length + 1);
        if (rule.operator?.replaceAll("_", "-").toLowerCase() === "required"
            && canonicalAttachedRulePath(parameters) === propertyPath)
            parameters = undefined;
    }
    const { propertyPath: _propertyPath, parameters: _parameters, ...rest } = rule;
    return {
        ...rest,
        ...(propertyPath ? { propertyPath } : {}),
        ...(parameters !== undefined ? { parameters } : {}),
    };
}
function canonicalSchemaRules(schema) {
    const normalized = clone(schema);
    if (normalized.attachedRules)
        normalized.attachedRules = normalized.attachedRules.map((rule) => effectiveAttachedRule(rule, normalized.document));
    if (normalized.workingDraft?.attachedRules)
        normalized.workingDraft.attachedRules = normalized.workingDraft.attachedRules.map((rule) => effectiveAttachedRule(rule, normalized.workingDraft?.document));
    if (normalized.revisionHistory)
        normalized.revisionHistory = normalized.revisionHistory.map(canonicalSchemaRules);
    return normalized;
}
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
export function importSchema(serialized) { return canonicalSchemaRules(JSON.parse(serialized)); }
export function exportSchema(schema) { return JSON.stringify(canonicalSchemaRules(schema)); }
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
            ...(source.documentation !== undefined ? { documentation: clone(source.documentation) } : {}),
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
    const { attachedRules: _attachedRules, parentSchemaId: _parentSchemaId, inheritedRuleOverrides: _overrides, documentation: _documentation, ...current } = snapshot;
    return {
        ...current,
        version: schema.published === false ? 1 : schema.version + 1,
        published: true,
        document: clone(draft.document),
        assignments: clone(draft.assignments).map((assignment) => assignmentForSchema(assignment, schema.id)),
        ...(draft.attachedRules ? { attachedRules: clone(draft.attachedRules) } : {}),
        ...(draft.parentSchemaId ? { parentSchemaId: draft.parentSchemaId } : {}),
        ...(draft.inheritedRuleOverrides ? { inheritedRuleOverrides: clone(draft.inheritedRuleOverrides) } : {}),
        ...(draft.documentation !== undefined ? { documentation: clone(draft.documentation) } : {}),
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
export function duplicateSchemaRevision(schema, version, schemas = []) {
    const source = schemaRevision(schema, version);
    if (!source)
        throw new Error(`Schema revision ${version} does not exist.`);
    const { revisionHistory: _history, workingDraft: _draft, ...duplicate } = duplicateSchema(source, `${schema.name} revision ${version} copy`, schemas);
    return { ...duplicate, version: 1, published: false, assignments: [] };
}
export function reviseSchema(schema, document) {
    return publishSchemaWorkingDraft(updateSchemaWorkingDraft(schema, { document }, "Update schema document"));
}
export function duplicateSchema(schema, name, schemas = []) {
    const duplicate = { ...clone(schema), id: schemaId(name, schema.version), name };
    if (!schemas.length)
        return duplicate;
    const effective = resolveEffectiveSchemaDocumentation(schema, schemas);
    const properties = Object.fromEntries(Object.entries(effective.properties).map(([path, entry]) => [path, {
            displayName: entry.displayName,
            description: entry.description,
        }]));
    return {
        ...duplicate,
        ...(effective.description || Object.keys(properties).length ? {
            documentation: {
                ...(effective.description ? { description: effective.description } : {}),
                ...(Object.keys(properties).length ? { properties } : {}),
            },
        } : {}),
    };
}
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
export function resolveSchemaAssignment(event, pageUrl, schemas) {
    const matches = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment })))
        .filter(({ assignment }) => assignment.enabled !== false && assignment.sourceId === event.sourceId && assignment.eventName === event.eventName)
        .filter(({ assignment }) => urlConditionsMatch(pageUrl, assignment));
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
export function serializeSchemaLibrary(schemas) { return JSON.stringify(schemas.map(canonicalSchemaRules)); }
export function schemaLibraryExportIdentitySnapshot(items) { return items.map(({ id }) => id); }
export function createSchemaLibraryExport(schemas, rules) {
    return { version: 1, schemas: schemas.map(canonicalSchemaRules), rules: rules.map(clone) };
}
export function serializeSchemaLibraryExport(schemas, rules) { return `${JSON.stringify(createSchemaLibraryExport(schemas, rules), null, 2)}\n`; }
export function migrateSchemaLibrary(schemas) {
    const groups = new Map();
    for (const schema of schemas) {
        const key = schema.name.trim().toLowerCase();
        groups.set(key, [...(groups.get(key) ?? []), canonicalSchemaRules(schema)]);
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
        ...(rule.conditionGroup && rule.propertyPath && rule.operator ? {
            conditionSummary: conditionalRuleSummary({
                conditionGroup: rule.conditionGroup,
                consequence: { propertyPath: rule.propertyPath, operator: rule.operator, ...(rule.parameters !== undefined ? { parameters: rule.parameters } : {}) },
            }),
        } : {}),
    };
}
function configuredAllowedValues(rule) {
    if (rule.allowedValues)
        return rule.allowedValues;
    const parameters = rule.parameters ?? "";
    const values = !rule.propertyPath && parameters.includes(":") ? parameters.slice(parameters.indexOf(":") + 1) : parameters;
    return values.split(",").map((item) => item.trim()).filter(Boolean);
}
function ruleAllowsValue(rule, value) {
    return rule.allowedValues
        ? rule.allowedValues.some((candidate) => Object.is(candidate, value))
        : configuredAllowedValues(rule).includes(String(value));
}
function observedValueText(value) {
    if (typeof value === "string")
        return value;
    if (value === undefined)
        return "undefined";
    try {
        return JSON.stringify(value) ?? String(value);
    }
    catch {
        return String(value);
    }
}
function nestedRuleFailure(rule, match) {
    const operator = rule.operator?.replaceAll("_", "-").toLowerCase() ?? "";
    const actual = match.exists ? observedValueText(match.value) : "missing";
    if (operator === "required")
        return match.exists ? undefined : { message: "Required value", expected: "value", actual };
    if (!match.exists)
        return undefined;
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
        const values = configuredAllowedValues(rule);
        return match.exists && ruleAllowsValue(rule, match.value) ? undefined : { message: "Value is not allowed", expected: values.map(String).join(","), actual };
    }
    if (operator === "regular-expression" || operator === "regular expression") {
        try {
            return match.exists && new RegExp(rule.parameters ?? "").test(String(match.value)) ? undefined : { message: "Value does not match pattern", expected: rule.parameters ?? "pattern", actual };
        }
        catch {
            return { message: "Invalid regular expression", expected: rule.parameters ?? "pattern", actual };
        }
    }
    if (operator === "numeric-range") {
        const [minimumText = "", maximumText = ""] = rule.parameters?.split(",") ?? [];
        const minimum = minimumText === "" ? undefined : Number(minimumText);
        const maximum = maximumText === "" ? undefined : Number(maximumText);
        const value = typeof match.value === "number" ? match.value : Number.NaN;
        const inRange = match.exists && Number.isFinite(value) && (minimum === undefined || value >= minimum) && (maximum === undefined || value <= maximum);
        return inRange ? undefined : { message: "Value is outside range", expected: `${minimumText || "no minimum"} to ${maximumText || "no maximum"}`, actual };
    }
    if (operator === "item-count") {
        const minimum = Number(rule.parameters ?? 0);
        return match.exists && Array.isArray(match.value) && match.value.length >= minimum ? undefined : { message: "Too few items", expected: `minimum ${minimum} items`, actual };
    }
    return undefined;
}
function attachedRuleIssues(value, schema, result, rules = schema.attachedRules ?? []) {
    for (const storedRule of rules) {
        const rule = effectiveAttachedRule(storedRule, schema.document);
        if (rule.enabled === false)
            continue;
        if (rule.conditionGroup && !conditionGroupAppliesToValue(value, rule.conditionGroup))
            continue;
        if (rule.propertyPath?.startsWith("/")) {
            const definition = schemaDefinitionAtPath(schema.document, rule.propertyPath);
            const storedByCanonicalPath = schema.document.properties?.[canonicalAttachedRulePath(rule.propertyPath)] !== undefined;
            for (const match of resolveNestedValues(value, rule.propertyPath)) {
                const failure = nestedRuleFailure(rule, match);
                const declaredTypeMismatch = storedByCanonicalPath && match.exists && match.value !== undefined && match.value !== null
                    && definition?.type !== undefined && valueType(match.value) !== definition.type;
                if (failure && !declaredTypeMismatch) {
                    const allowedValues = rule.operator?.replaceAll("_", "-").toLowerCase() === "allowed-values"
                        ? configuredAllowedValues(rule).map(String)
                        : [];
                    result.push(issueFromAttachedRule(rule, schema, {
                        instancePath: match.concretePath,
                        ...(storedRule.propertyPath?.startsWith("/") || match.templatePath.includes("*") ? { templatePath: match.templatePath } : {}),
                        ...failure,
                    }, allowedValues));
                }
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
        const allowedValues = rule.operator === "allowed-values"
            ? configuredAllowedValues(rule).map(String)
            : [];
        if (rule.operator === "allowed-values" && (constraint || rule.allowedValues) && !ruleAllowsValue(rule, record[property]))
            result.push(issueFromAttachedRule(rule, schema, { instancePath: `/${property}`, message: "Value is not allowed", expected: allowedValues.map(String).join(","), actual: String(record[property]) }, allowedValues));
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
function allowedValueEvaluationEvidence(rule, schema, actualValue) {
    const operator = rule.operator?.replaceAll("_", "-").replaceAll(" ", "-").toLowerCase();
    return operator === "allowed-values"
        ? { ruleId: rule.id, operator: "allowed-values", schemaId: schema.id, actualValue, allowedValues: configuredAllowedValues(rule) }
        : {};
}
function attachedRuleEvaluations(value, schema, rules) {
    return rules.filter(({ enabled }) => enabled !== false).flatMap((storedRule) => {
        const rule = effectiveAttachedRule(storedRule, schema.document);
        if (rule.conditionGroup && !conditionGroupAppliesToValue(value, rule.conditionGroup)) {
            const summary = rule.propertyPath && rule.operator
                ? conditionalRuleSummary({ conditionGroup: rule.conditionGroup, consequence: { propertyPath: rule.propertyPath, operator: rule.operator, ...(rule.parameters !== undefined ? { parameters: rule.parameters } : {}) } })
                : "Conditional rule";
            return [{
                    propertyPath: rule.propertyPath ?? "",
                    status: "not-applicable",
                    message: `Not applicable: ${summary}`,
                    expected: summary,
                    actual: "condition not satisfied",
                    rule: rule.name ?? rule.id,
                    ruleVersion: rule.version,
                    severity: rule.severity ?? "error",
                    schemaName: schema.name,
                    schemaVersion: schema.version,
                }];
        }
        if (rule.propertyPath?.startsWith("/")) {
            return resolveNestedValues(value, rule.propertyPath).map((match) => {
                const failure = nestedRuleFailure(rule, match);
                const operator = rule.operator?.replaceAll("_", "-").toLowerCase() ?? "";
                if (!match.exists && operator !== "required")
                    return {
                        propertyPath: match.concretePath,
                        status: "not-applicable",
                        message: rule.message ?? `${rule.name ?? rule.id} is not applicable because the optional target is absent`,
                        expected: rule.parameters ?? "optional value rule",
                        actual: "missing",
                        rule: rule.name ?? rule.id,
                        ruleVersion: rule.version,
                        severity: rule.severity ?? "error",
                        schemaName: schema.name,
                        schemaVersion: schema.version,
                    };
                if (!failure)
                    return {
                        propertyPath: match.concretePath,
                        status: "pass",
                        message: rule.message ?? `${rule.name ?? rule.id} passed`,
                        expected: rule.parameters ?? "rule satisfied",
                        actual: match.exists ? observedValueText(match.value) : "missing",
                        rule: rule.name ?? rule.id,
                        ruleVersion: rule.version,
                        severity: rule.severity ?? "error",
                        schemaName: schema.name,
                        schemaVersion: schema.version,
                    };
                const issue = issueFromAttachedRule(rule, schema, {
                    instancePath: match.concretePath,
                    ...(storedRule.propertyPath?.startsWith("/") || match.templatePath.includes("*") ? { templatePath: match.templatePath } : {}),
                    ...failure,
                });
                return {
                    propertyPath: issue.instancePath,
                    status: issue.severity === "warning" ? "warning" : "error",
                    message: issue.message,
                    expected: issue.expected,
                    actual: issue.actual,
                    rule: rule.name ?? rule.id,
                    ruleVersion: rule.version,
                    severity: issue.severity ?? "error",
                    schemaName: schema.name,
                    schemaVersion: schema.version,
                    ...allowedValueEvaluationEvidence(rule, schema, match.value),
                };
            });
        }
        const issues = [];
        attachedRuleIssues(value, schema, issues, [rule]);
        const propertyPath = rule.propertyPath ?? rule.parameters?.split(":", 1)[0]?.split(",", 1)[0]?.trim() ?? "";
        const record = value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
        const present = Boolean(propertyPath && record && propertyPath in record);
        const actual = present ? String(record?.[propertyPath]) : "missing";
        const operator = rule.operator?.replaceAll("_", "-").toLowerCase() ?? "";
        if (!present && operator !== "required")
            return [{ propertyPath, status: "not-applicable", message: rule.message ?? `${rule.name ?? rule.id} is not applicable because the optional target is absent`, expected: rule.parameters?.split(":", 2)[1] ?? "optional value rule", actual, rule: rule.name ?? rule.id, ruleVersion: rule.version, severity: rule.severity ?? "error", schemaName: schema.name, schemaVersion: schema.version }];
        if (!issues.length)
            return [{ propertyPath, status: "pass", message: rule.message ?? `${rule.name ?? rule.id} passed`, expected: rule.parameters?.split(":", 2)[1] ?? "rule satisfied", actual, rule: rule.name ?? rule.id, ruleVersion: rule.version, severity: rule.severity ?? "error", schemaName: schema.name, schemaVersion: schema.version }];
        return issues.map((issue) => ({ propertyPath: issue.instancePath, status: issue.severity === "warning" ? "warning" : "error", message: issue.message, expected: issue.expected, actual: issue.actual, rule: rule.name ?? rule.id, ruleVersion: rule.version, severity: issue.severity ?? "error", schemaName: schema.name, schemaVersion: schema.version, ...allowedValueEvaluationEvidence(rule, schema, record?.[propertyPath]) }));
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
    issuesFor(value, normalizeCanonicalSchemaDocument(inheritedDocument(schema, schemas)), "", "#", result, schema);
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
function effectiveDocumentation(schema, schemas) {
    const documentation = resolveEffectiveSchemaDocumentation(schema, schemas);
    return documentation.description || Object.keys(documentation.properties).length ? documentation : undefined;
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
            const documentation = effectiveDocumentation(resolution.schema, schemas);
            return { state: validationStateForIssues(issues), issues, evaluations: validationEvaluations(value, resolution.schema, schemas), schema: { id: resolution.schema.id, name: resolution.schema.name, version: resolution.schema.version }, ...(documentation ? { documentation } : {}), target: resolution.assignment.target, assignment: resolution.assignment, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
        }
    }
    const match = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment }))).find(({ assignment }) => assignment.sourceId === event.sourceId && assignment.eventName === event.eventName);
    if (!match)
        return { state: "Not checked", issues: [] };
    const value = match.assignment.target === "payload" ? event.payload : event.rawInput;
    const issues = [];
    collectSchemaIssues(value, match.schema, schemas, issues);
    const inheritedFrom = inheritedSchemaProvenance(match.schema, schemas);
    const documentation = effectiveDocumentation(match.schema, schemas);
    return { state: validationStateForIssues(issues), issues, evaluations: validationEvaluations(value, match.schema, schemas), schema: { id: match.schema.id, name: match.schema.name, version: match.schema.version }, ...(documentation ? { documentation } : {}), target: match.assignment.target, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
}
export function validateWithSchema(event, schema, schemas, target = schema.assignments[0]?.target ?? "payload") {
    const value = target === "payload" ? event.payload : event.rawInput;
    const issues = [];
    collectSchemaIssues(value, schema, schemas, issues);
    const inheritedFrom = inheritedSchemaProvenance(schema, schemas);
    const documentation = effectiveDocumentation(schema, schemas);
    return { state: validationStateForIssues(issues), issues, evaluations: validationEvaluations(value, schema, schemas), schema: { id: schema.id, name: schema.name, version: schema.version }, ...(documentation ? { documentation } : {}), target, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
}
export function validationSummary(results) { return { "Not checked": results.filter((result) => result.state === "Not checked").length, Valid: results.filter((result) => result.state === "Valid").length, Warnings: results.filter((result) => result.state.endsWith("warnings") && !result.state.includes("error")).length, Issues: results.filter((result) => result.state.endsWith("issues") || result.state.includes("error") && result.state !== "Assignment error").length, "Assignment error": results.filter((result) => result.state === "Assignment error").length }; }
export function filterByValidation(events, state) { return events.filter((event) => event.validation === state); }
export function revalidateExplicitly(event, schemas, version) {
    const revisions = schemas.flatMap((schema) => schemaRevision(schema, version) ?? []);
    return validateEvent(event, revisions);
}
//# sourceMappingURL=data-layer-schema-verification.js.map