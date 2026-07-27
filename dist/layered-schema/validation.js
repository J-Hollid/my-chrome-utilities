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
const scopedPath = (path, rule, pathsByDefinition) => { const boundaries = (rule.arrayScope?.boundaries ?? []), segments = path.split("/").filter(Boolean); return boundaries.every((boundary) => { if (boundary.mode !== "position")
    return true; const boundaryPath = pathsByDefinition.get(String(boundary.propertyId ?? "")); if (!boundaryPath)
    return false; const index = boundaryPath.split("/").filter(Boolean).length; return Number(segments[index]) === Number(boundary.position) - 1; }); };
const validateScopedRules = (issues, targetName, path, canonicalPath, property, actual, pathsByDefinition) => { for (const rule of property.rules ?? []) {
    const positioned = Boolean(rule.arrayScope?.boundaries?.some(({ mode }) => mode === "position"));
    if (!positioned || !scopedPath(path, rule, pathsByDefinition) || actual === undefined)
        continue;
    if (rule.kind === "pattern" && typeof rule.pattern === "string" && !new RegExp(rule.pattern).test(String(actual)))
        pushIssue(issues, targetName, path, canonicalPath, property, actual, "PATTERN", [rule.pattern]);
    if (rule.kind === "value" && Array.isArray(rule.allowedValues) && !rule.allowedValues.some((candidate) => same(candidate, actual)))
        pushIssue(issues, targetName, path, canonicalPath, property, actual, "ALLOWED_VALUE", rule.allowedValues);
} };
const validateProperty = (issues, targetName, path, canonicalPath, property, payload, pathsByDefinition) => { const actual = valueAt(payload, path), condition = layeredConditionMatches(property.condition, payload, pathsByDefinition); if (property.presence === "required" && condition && actual === undefined) {
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "REQUIRED", "present");
    return;
} if (property.presence === "forbidden" && condition && actual !== undefined) {
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "FORBIDDEN", "absent");
    return;
} if (actual === undefined)
    return; if (property.type && !typeMatches(actual, String(property.type)))
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "TYPE", property.type); if (Array.isArray(property.allowedValues) && !property.allowedValues.some((candidate) => same(candidate, actual)))
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "ALLOWED_VALUE", property.allowedValues); if (Array.isArray(property.patterns) && !property.patterns.every((pattern) => new RegExp(String(pattern)).test(String(actual))))
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "PATTERN", property.patterns); if (typeof property.minimum === "number" && typeof actual === "number" && actual < property.minimum)
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "MINIMUM", property.minimum); if (typeof property.maximum === "number" && typeof actual === "number" && actual > property.maximum)
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "MAXIMUM", property.maximum); if (typeof property.minItems === "number" && Array.isArray(actual) && actual.length < property.minItems)
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "MIN_ITEMS", property.minItems); if (typeof property.maxItems === "number" && Array.isArray(actual) && actual.length > property.maxItems)
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "MAX_ITEMS", property.maxItems); if (property.expectedValue !== undefined && !same(actual, property.expectedValue))
    pushIssue(issues, targetName, path, canonicalPath, property, actual, "EXPECTED_VALUE", property.expectedValue); validateScopedRules(issues, targetName, path, canonicalPath, property, actual, pathsByDefinition); };
export function validateLayeredObservation(target, payload) { const effective = resolveConditionalLayeredSchema(target.compiled, payload), issues = [], pathsByDefinition = layeredPropertyPaths(effective); for (const [canonicalPath, property] of Object.entries(effective.properties))
    for (const path of concretePaths(payload, canonicalPath))
        validateProperty(issues, target.targetName, path, canonicalPath, property, payload, pathsByDefinition); return { selectedTargetId: target.targetId, selectedTargetName: target.targetName, effectiveSchemaRevision: target.revision, status: effective.status, conflicts: effective.conflicts, issues, provenance: effective.provenance }; }
//# sourceMappingURL=validation.js.map