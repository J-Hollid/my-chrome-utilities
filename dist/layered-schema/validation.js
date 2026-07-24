const clone = (value) => structuredClone(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const valueAt = (payload, path) => path.split("/").filter(Boolean).reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, payload);
const typeMatches = (value, type) => type === "array" ? Array.isArray(value) : type === "null" ? value === null : type === "integer" ? Number.isInteger(value) : type === "object" ? Boolean(value) && typeof value === "object" && !Array.isArray(value) : typeof value === type;
const conditionOperator = (operator, actual, expected) => { if (operator === "Equals")
    return same(actual, expected); if (operator === "Does not equal")
    return !same(actual, expected); if (operator === "Exists")
    return actual !== undefined; if (operator === "Does not exist")
    return actual === undefined; if (operator === "Starts with")
    return String(actual ?? "").startsWith(String(expected ?? "")); if (operator === "Contains")
    return String(actual ?? "").includes(String(expected ?? "")); if (operator === "Matches pattern")
    try {
        return new RegExp(String(expected ?? "")).test(String(actual ?? ""));
    }
    catch {
        return false;
    } if (operator === "Greater than")
    return Number(actual) > Number(expected); if (operator === "At least")
    return Number(actual) >= Number(expected); if (operator === "Less than")
    return Number(actual) < Number(expected); if (operator === "At most")
    return Number(actual) <= Number(expected); return false; };
const conditionMatches = (condition, payload, pathsByDefinition) => { if (!condition)
    return true; const kind = String(condition.kind ?? ""); if (kind === "predicate") {
    const path = pathsByDefinition.get(String(condition.propertyId ?? "")), actual = path ? valueAt(payload, path) : undefined;
    return conditionOperator(String(condition.operator ?? "Equals"), actual, condition.value);
} const children = condition.children ?? []; if (kind === "all")
    return children.every((child) => conditionMatches(child, payload, pathsByDefinition)); if (kind === "any")
    return children.some((child) => conditionMatches(child, payload, pathsByDefinition)); if (kind === "not")
    return !children.some((child) => conditionMatches(child, payload, pathsByDefinition)); return true; };
const pushIssue = (issues, targetName, path, property, actual, code, expected) => { issues.push({ path, code, severity: "error", expected: clone(expected), actual: clone(actual), provenance: String(property.expectedContributor ?? targetName) }); };
const validateProperty = (issues, targetName, path, property, payload, pathsByDefinition) => { const actual = valueAt(payload, path), condition = conditionMatches(property.condition, payload, pathsByDefinition); if (property.presence === "required" && condition && actual === undefined) {
    pushIssue(issues, targetName, path, property, actual, "REQUIRED", "present");
    return;
} if (property.presence === "forbidden" && condition && actual !== undefined) {
    pushIssue(issues, targetName, path, property, actual, "FORBIDDEN", "absent");
    return;
} if (actual === undefined)
    return; if (property.type && !typeMatches(actual, String(property.type)))
    pushIssue(issues, targetName, path, property, actual, "TYPE", property.type); if (Array.isArray(property.allowedValues) && !property.allowedValues.some((candidate) => same(candidate, actual)))
    pushIssue(issues, targetName, path, property, actual, "ALLOWED_VALUE", property.allowedValues); if (Array.isArray(property.patterns) && !property.patterns.every((pattern) => new RegExp(String(pattern)).test(String(actual))))
    pushIssue(issues, targetName, path, property, actual, "PATTERN", property.patterns); if (typeof property.minimum === "number" && typeof actual === "number" && actual < property.minimum)
    pushIssue(issues, targetName, path, property, actual, "MINIMUM", property.minimum); if (typeof property.maximum === "number" && typeof actual === "number" && actual > property.maximum)
    pushIssue(issues, targetName, path, property, actual, "MAXIMUM", property.maximum); if (typeof property.minItems === "number" && Array.isArray(actual) && actual.length < property.minItems)
    pushIssue(issues, targetName, path, property, actual, "MIN_ITEMS", property.minItems); if (typeof property.maxItems === "number" && Array.isArray(actual) && actual.length > property.maxItems)
    pushIssue(issues, targetName, path, property, actual, "MAX_ITEMS", property.maxItems); if (property.expectedValue !== undefined && !same(actual, property.expectedValue))
    pushIssue(issues, targetName, path, property, actual, "EXPECTED_VALUE", property.expectedValue); };
export function validateLayeredObservation(target, payload) { const issues = [], pathsByDefinition = new Map(Object.entries(target.compiled.properties).flatMap(([path, property]) => property.definitionId ? [[property.definitionId, path]] : [])); for (const [path, property] of Object.entries(target.compiled.properties))
    validateProperty(issues, target.targetName, path, property, payload, pathsByDefinition); return { selectedTargetId: target.targetId, selectedTargetName: target.targetName, effectiveSchemaRevision: target.revision, issues, provenance: target.compiled.provenance }; }
//# sourceMappingURL=validation.js.map