import { layeredConditionMatches, layeredPropertyPaths, resolveConditionalLayeredSchema } from "./conditional-rules.js";
const clone = (value) => structuredClone(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const valueAt = (payload, path) => path.split("/").filter(Boolean).reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, payload);
const typeMatches = (value, type) => type === "array" ? Array.isArray(value) : type === "null" ? value === null : type === "integer" ? Number.isInteger(value) : type === "object" ? Boolean(value) && typeof value === "object" && !Array.isArray(value) : typeof value === type;
const pushIssue = (issues, targetName, path, canonicalPath, property, actual, code, expected) => { issues.push({ path, ...(canonicalPath !== path ? { canonicalPath } : {}), code, severity: "error", expected: clone(expected), actual: clone(actual), provenance: String(property.expectedContributor ?? targetName) }); };
const concretePaths = (payload, template) => { const segments = template.split("/").filter(Boolean), walk = (value, index, parts) => { if (index === segments.length)
    return [`/${parts.join("/")}`]; const segment = segments[index]; if (segment === "*")
    return Array.isArray(value) ? value.flatMap((entry, itemIndex) => walk(entry, index + 1, [...parts, String(itemIndex)])) : []; const decoded = segment.replaceAll("~1", "/").replaceAll("~0", "~"), next = value && typeof value === "object" ? value[decoded] : undefined; if (next === undefined && segments.slice(index + 1).includes("*"))
    return []; return walk(next, index + 1, [...parts, segment]); }; return walk(payload, 0, []); };
const scopedPath = (path, canonicalPath, rule) => {
    const boundaries = (rule.arrayScope?.boundaries ?? []), actual = path.split("/").filter(Boolean), canonical = canonicalPath.split("/").filter(Boolean), wildcards = canonical.flatMap((segment, index) => segment === "*" ? [index] : []);
    return boundaries.every((boundary, index) => boundary.mode !== "position" || Number(actual[wildcards[index] ?? -1]) === Number(boundary.position) - 1);
};
const contextualPaths = (pathsByDefinition, path, canonicalPath) => {
    const actual = path.split("/").filter(Boolean), canonical = canonicalPath.split("/").filter(Boolean), indices = canonical.flatMap((segment, index) => segment === "*" ? [actual[index]] : []);
    return new Map([...pathsByDefinition].map(([id, template]) => { let ordinal = 0; return [id, `/${template.split("/").filter(Boolean).map((segment) => segment === "*" ? (indices[ordinal++] ?? segment) : segment).join("/")}`]; }));
};
const validateItemShape = (issues, targetName, path, canonicalPath, property, actual, schema) => {
    if (!schema.type)
        return;
    if (!typeMatches(actual, schema.type)) {
        pushIssue(issues, targetName, path, canonicalPath, property, actual, "TYPE", schema.type);
        return;
    }
    if (schema.allowedValues?.length && !schema.allowedValues.some((candidate) => same(candidate, actual)))
        pushIssue(issues, targetName, path, canonicalPath, property, actual, "ALLOWED_VALUE", schema.allowedValues);
    if (schema.type === "array" && Array.isArray(actual) && schema.items)
        actual.forEach((item, index) => validateItemShape(issues, targetName, `${path}/${index}`, `${canonicalPath}/*`, property, item, schema.items));
};
const validateScopedRules = (issues, targetName, path, canonicalPath, property, actual, payload, pathsByDefinition) => {
    for (const rule of property.rules ?? []) {
        const scoped = Boolean(rule.arrayScope?.boundaries?.length);
        if (!scoped || rule.enabled === false || !scopedPath(path, canonicalPath, rule) || !layeredConditionMatches(rule.condition, payload, contextualPaths(pathsByDefinition, path, canonicalPath)))
            continue;
        if (rule.kind === "presence" && rule.presence === "required" && actual === undefined)
            pushIssue(issues, targetName, path, canonicalPath, property, actual, "REQUIRED", "present");
        if (rule.kind === "presence" && rule.presence === "forbidden" && actual !== undefined)
            pushIssue(issues, targetName, path, canonicalPath, property, actual, "FORBIDDEN", "absent");
        if (actual === undefined)
            continue;
        if (rule.kind === "pattern" && typeof rule.pattern === "string" && !new RegExp(rule.pattern).test(String(actual)))
            pushIssue(issues, targetName, path, canonicalPath, property, actual, "PATTERN", [rule.pattern]);
        if (rule.kind === "value" && Array.isArray(rule.allowedValues) && !rule.allowedValues.some((candidate) => same(candidate, actual)))
            pushIssue(issues, targetName, path, canonicalPath, property, actual, "ALLOWED_VALUE", rule.allowedValues);
        if (rule.kind === "value" && rule.expectedValue !== undefined && !same(rule.expectedValue, actual))
            pushIssue(issues, targetName, path, canonicalPath, property, actual, "EXPECTED_VALUE", rule.expectedValue);
        if (rule.kind === "range" && typeof rule.minimum === "number" && typeof actual === "number" && actual < rule.minimum)
            pushIssue(issues, targetName, path, canonicalPath, property, actual, "MINIMUM", rule.minimum);
        if (rule.kind === "range" && typeof rule.maximum === "number" && typeof actual === "number" && actual > rule.maximum)
            pushIssue(issues, targetName, path, canonicalPath, property, actual, "MAXIMUM", rule.maximum);
        if (rule.kind === "cardinality" && typeof rule.minItems === "number" && Array.isArray(actual) && actual.length < rule.minItems)
            pushIssue(issues, targetName, path, canonicalPath, property, actual, "MIN_ITEMS", rule.minItems);
        if (rule.kind === "cardinality" && typeof rule.maxItems === "number" && Array.isArray(actual) && actual.length > rule.maxItems)
            pushIssue(issues, targetName, path, canonicalPath, property, actual, "MAX_ITEMS", rule.maxItems);
    }
};
const validateProperty = (issues, targetName, path, canonicalPath, property, payload, pathsByDefinition) => { const actual = valueAt(payload, path), condition = layeredConditionMatches(property.condition, payload, pathsByDefinition); if (property.presence === "required" && condition && actual === undefined) {
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "REQUIRED", "present");
    return;
} if (property.presence === "forbidden" && condition && actual !== undefined) {
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "FORBIDDEN", "absent");
    return;
} validateScopedRules(issues, targetName, path, canonicalPath, property, actual, payload, pathsByDefinition); if (actual === undefined)
    return; if (property.type && !typeMatches(actual, String(property.type)))
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "TYPE", property.type); if (property.type === "array" && Array.isArray(actual)) {
    const schema = property.itemSchema, itemType = typeof property.itemType === "string" ? property.itemType : undefined, itemSchema = schema ?? (itemType ? { id: `item:${canonicalPath}`, type: itemType } : undefined);
    if (itemSchema)
        actual.forEach((item, index) => validateItemShape(issues, targetName, `${path}/${index}`, `${canonicalPath}/*`, property, item, itemSchema));
} if (Array.isArray(property.allowedValues) && !property.allowedValues.some((candidate) => same(candidate, actual)))
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "ALLOWED_VALUE", property.allowedValues); if (Array.isArray(property.patterns) && !property.patterns.every((pattern) => new RegExp(String(pattern)).test(String(actual))))
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "PATTERN", property.patterns); if (typeof property.minimum === "number" && typeof actual === "number" && actual < property.minimum)
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "MINIMUM", property.minimum); if (typeof property.maximum === "number" && typeof actual === "number" && actual > property.maximum)
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "MAXIMUM", property.maximum); if (typeof property.minItems === "number" && Array.isArray(actual) && actual.length < property.minItems)
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "MIN_ITEMS", property.minItems); if (typeof property.maxItems === "number" && Array.isArray(actual) && actual.length > property.maxItems)
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "MAX_ITEMS", property.maxItems); if (property.expectedValue !== undefined && !same(actual, property.expectedValue))
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "EXPECTED_VALUE", property.expectedValue); };
export function validateLayeredObservation(target, payload) { const effective = resolveConditionalLayeredSchema(target.compiled, payload), issues = [], pathsByDefinition = layeredPropertyPaths(effective); for (const [canonicalPath, property] of Object.entries(effective.properties))
    for (const path of concretePaths(payload, canonicalPath))
        validateProperty(issues, target.targetName, path, canonicalPath, property, payload, pathsByDefinition); if (effective.onlyDefinedFields) {
    const declared = new Set(Object.keys(effective.properties)), provenance = effective.provenance.at(-1)?.contributorName ?? target.targetName, encoded = (key) => key.replaceAll("~", "~0").replaceAll("/", "~1"), walk = (value, actual, canonical) => { if (Array.isArray(value)) {
        value.forEach((item, index) => walk(item, [...actual, String(index)], [...canonical, "*"]));
        return;
    } if (!value || typeof value !== "object")
        return; for (const [key, child] of Object.entries(value)) {
        const segment = encoded(key), actualPath = `/${[...actual, segment].join("/")}`, canonicalParts = [...canonical, segment], canonicalPath = `/${canonicalParts.join("/")}`;
        if (!declared.has(canonicalPath)) {
            issues.push({ path: actualPath, canonicalPath, code: "UNDECLARED_PROPERTY", message: "Undeclared property", severity: "error", expected: "declared property", actual: clone(child), provenance });
            continue;
        }
        walk(child, [...actual, segment], canonicalParts);
    } };
    walk(payload, [], []);
} return { selectedTargetId: target.targetId, selectedTargetName: target.targetName, effectiveSchemaRevision: target.revision, status: effective.status, conflicts: effective.conflicts, issues, provenance: effective.provenance }; }
//# sourceMappingURL=validation.js.map