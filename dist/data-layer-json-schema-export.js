import { canonicalNestedPath } from "./data-layer-schema-nested-path.js";
import { resolveEffectiveSchemaDocumentation } from "./data-layer-schema-documentation.js";
import { cardinalityBounds } from "./data-layer-cardinality.js";
export const JSON_SCHEMA_2020_12_DIALECT = "https://json-schema.org/draft/2020-12/schema";
const RESOURCE_BASE = "https://schemas.my-chrome-utilities.invalid";
function clone(value) { return structuredClone(value); }
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function pointerSegments(path) { return canonicalNestedPath(path).split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~")); }
function normalizedOperator(rule) { return rule.operator?.replaceAll("_", "-").replaceAll(" ", "-").toLowerCase() ?? ""; }
export function jsonSchemaResourceId(schema) {
    return `${RESOURCE_BASE}/${encodeURIComponent(schema.id)}/revisions/${schema.version}`;
}
export function jsonSchemaResourceFilename(schema) {
    return `${slug(schema.name)}-revision-${schema.version}.schema.json`;
}
function schemaChain(schema, schemas) {
    const chain = [];
    const visited = new Set();
    let current = schema;
    while (current && !visited.has(current.id)) {
        visited.add(current.id);
        chain.unshift(current);
        current = current.parentSchemaId ? schemas.find(({ id }) => id === current?.parentSchemaId) : undefined;
    }
    return chain;
}
function mergeDocuments(parent, child) {
    return {
        ...clone(parent),
        ...clone(child),
        required: [...new Set([...(parent.required ?? []), ...(child.required ?? [])])],
        forbidden: [...new Set([...(parent.forbidden ?? []), ...(child.forbidden ?? [])])],
        properties: { ...(clone(parent.properties ?? {})), ...(clone(child.properties ?? {})) },
    };
}
function effectiveDocument(schema, schemas) {
    const chain = schemaChain(schema, schemas);
    let result = { type: "object" };
    for (const owner of chain) {
        result = mergeDocuments(result, owner.document);
        const disabled = Object.entries(owner.inheritedRuleOverrides ?? {}).filter(([, state]) => state === "disabled").map(([path]) => pointerSegments(path)[0]).filter(Boolean);
        if (disabled.length && result.properties)
            result.properties = Object.fromEntries(Object.entries(result.properties).filter(([name]) => !disabled.includes(name)));
    }
    return result;
}
function effectiveRules(schema, schemas) {
    const rules = new Map();
    for (const owner of schemaChain(schema, schemas)) {
        const disabled = new Set(Object.entries(owner.inheritedRuleOverrides ?? {}).filter(([, state]) => state === "disabled").map(([identity]) => canonicalNestedPath(identity)));
        for (const [id, rule] of rules)
            if (disabled.has(canonicalNestedPath(rule.propertyPath ?? id)) || disabled.has(canonicalNestedPath(id)))
                rules.delete(id);
        for (const rule of owner.attachedRules ?? []) {
            if (rule.enabled === false)
                rules.delete(rule.id);
            else
                rules.set(rule.id, clone(rule));
        }
    }
    return [...rules.values()];
}
function standardDocument(source, closeObjects) {
    const result = {};
    if (source.type)
        result.type = source.type;
    if (source.required?.length)
        result.required = [...source.required];
    if (source.properties)
        result.properties = Object.fromEntries(Object.entries(source.properties).map(([name, child]) => [name, standardDocument(child, closeObjects)]));
    if (source.items)
        result.items = standardDocument(source.items, closeObjects);
    if (source.minimum !== undefined)
        result.minimum = source.minimum;
    if (source.maximum !== undefined)
        result.maximum = source.maximum;
    if (source.type === "object" && closeObjects)
        result.additionalProperties = false;
    else if (source.additionalProperties !== undefined)
        result.additionalProperties = source.additionalProperties;
    if (source.forbidden?.length)
        result.not = { anyOf: source.forbidden.map((name) => ({ required: [name] })) };
    return result;
}
function targetAtPath(document, path, create = true) {
    let current = document;
    for (const segment of pointerSegments(path)) {
        if (segment === "*" || /^\d+$/.test(segment)) {
            if (!current.items && create)
                current.items = {};
            current = current.items;
        }
        else {
            if (!current.properties && create)
                current.properties = {};
            if (!current.properties?.[segment] && create)
                current.properties[segment] = {};
            current = current.properties?.[segment];
        }
        if (!current)
            return undefined;
    }
    return current;
}
function parentAndName(document, path) {
    const segments = pointerSegments(path);
    const name = segments.at(-1);
    if (!name || name === "*")
        return undefined;
    const parentPath = `/${segments.slice(0, -1).join("/")}`;
    const parent = targetAtPath(document, parentPath);
    return parent ? { parent, name } : undefined;
}
function appendRequired(document, path) {
    const target = parentAndName(document, path);
    if (!target)
        return;
    target.parent.required = [...new Set([...(target.parent.required ?? []), target.name])];
}
function appendForbidden(document, path) {
    const target = parentAndName(document, path);
    if (!target)
        return;
    const not = (target.parent.not ?? { anyOf: [] });
    if (!(not.anyOf ?? []).some((candidate) => candidate.required?.length === 1 && candidate.required[0] === target.name)) {
        not.anyOf = [...(not.anyOf ?? []), { required: [target.name] }];
    }
    target.parent.not = not;
}
function typedParameter(rule, target) {
    const value = rule.parameters ?? "";
    if ((rule.applicableType ?? target.type) === "number")
        return Number(value);
    if ((rule.applicableType ?? target.type) === "boolean")
        return value === "true";
    return value;
}
function cardinalityAssertion(rule, prefix) {
    const limit = rule.limit ?? Number(rule.parameters ?? 0);
    const comparison = rule.comparison ?? (prefix === "Length" ? "==" : ">=");
    const bounds = cardinalityBounds(comparison, limit);
    if (bounds.impossible)
        return { not: {} };
    return {
        ...(bounds.minimum !== undefined ? { [`min${prefix}`]: bounds.minimum } : {}),
        ...(bounds.maximum !== undefined ? { [`max${prefix}`]: bounds.maximum } : {}),
    };
}
function standardAssertion(rule, target) {
    const operator = normalizedOperator(rule);
    if (operator === "exact-value")
        return { const: typedParameter(rule, target) };
    if (operator === "allowed-values")
        return { enum: clone(rule.allowedValues ?? rule.parameters?.split(",").map((value) => value.trim()).filter(Boolean) ?? []) };
    if (operator === "regular-expression")
        return { pattern: rule.parameters ?? "" };
    if (operator === "digits-only")
        return { pattern: "^[0-9]+$" };
    if (operator === "non-empty-string")
        return { minLength: 1 };
    if (operator === "numeric-range") {
        const [minimum = "", maximum = ""] = rule.parameters?.split(",") ?? [];
        return { ...(minimum !== "" ? { minimum: Number(minimum) } : {}), ...(maximum !== "" ? { maximum: Number(maximum) } : {}) };
    }
    if (operator === "text-length")
        return cardinalityAssertion(rule, "Length");
    if (operator === "item-count")
        return cardinalityAssertion(rule, "Items");
    if (operator === "value-type")
        return rule.parameters ?? target.type ? { type: (rule.parameters ?? target.type) } : {};
    return undefined;
}
function predicateAssertion(predicate) {
    if (predicate.operator === "Exists") {
        const result = {};
        appendRequired(result, predicate.propertyPath);
        return result;
    }
    if (predicate.operator === "Does not exist") {
        const result = {};
        appendForbidden(result, predicate.propertyPath);
        return result;
    }
    const targetAssertion = predicate.operator === "Equals" ? { const: predicate.comparison?.value }
        : predicate.operator === "Does not equal" ? { not: { const: predicate.comparison?.value } }
            : predicate.operator === "Is one of" ? { enum: predicate.comparisons?.map(({ value }) => value) ?? [] }
                : predicate.operator === "Matches pattern" ? { pattern: String(predicate.comparison?.value ?? "") }
                    : predicate.operator === "Is greater than" ? { exclusiveMinimum: predicate.comparison?.value }
                        : predicate.operator === "Is at least" ? { minimum: predicate.comparison?.value }
                            : predicate.operator === "Is less than" ? { exclusiveMaximum: predicate.comparison?.value }
                                : { maximum: predicate.comparison?.value };
    const result = {};
    Object.assign(targetAtPath(result, predicate.propertyPath), targetAssertion);
    appendRequired(result, predicate.propertyPath);
    return result;
}
function consequenceSchema(rule) {
    const result = {};
    if (normalizedOperator(rule) === "required")
        appendRequired(result, rule.propertyPath ?? "");
    else if (normalizedOperator(rule) === "forbidden-property")
        appendForbidden(result, rule.propertyPath ?? "");
    else
        Object.assign(targetAtPath(result, rule.propertyPath ?? ""), standardAssertion(rule, {}) ?? {});
    return result;
}
function applyRule(document, rule) {
    const operator = normalizedOperator(rule);
    const path = rule.propertyPath ?? "";
    if (rule.conditionGroup) {
        const predicates = rule.conditionGroup.predicates.map(predicateAssertion);
        const condition = predicates.length === 1 ? predicates[0] : rule.conditionGroup.operator === "All" ? { allOf: predicates } : { anyOf: predicates };
        document.allOf = [...(document.allOf ?? []), { if: condition, then: consequenceSchema(rule) }];
        return true;
    }
    if (operator === "required") {
        appendRequired(document, path);
        return true;
    }
    if (operator === "forbidden-property") {
        appendForbidden(document, path);
        return true;
    }
    if (operator === "allow-undeclared-properties") {
        const target = targetAtPath(document, path);
        if (target)
            target.additionalProperties = true;
        return true;
    }
    const target = targetAtPath(document, path);
    const assertion = target && standardAssertion(rule, target);
    if (!target || !assertion)
        return false;
    Object.assign(target, assertion);
    return true;
}
function decorateDocumentation(document, schema, schemas) {
    const documentation = resolveEffectiveSchemaDocumentation(schema, schemas);
    if (documentation.description)
        document.description = documentation.description;
    for (const [path, entry] of Object.entries(documentation.properties)) {
        const target = targetAtPath(document, path, false);
        if (!target)
            continue;
        if (entry.description)
            target.description = entry.description;
        if (entry.example)
            target.examples = [clone(entry.example.value)];
    }
}
function buildJsonSchemaExport(schema, schemas) {
    const document = standardDocument(effectiveDocument(schema, schemas), schemaChain(schema, schemas).some(({ document }) => document.additionalProperties === false));
    const omitted = [];
    const conversions = [];
    for (const rule of effectiveRules(schema, schemas)) {
        const applied = applyRule(document, rule);
        if (!applied)
            omitted.push({ ruleId: rule.id, ruleName: rule.name ?? rule.id, propertyPath: rule.propertyPath ?? "/", behavior: normalizedOperator(rule) || "unknown" });
        else if (rule.severity === "warning" || rule.message)
            conversions.push({ ruleId: rule.id, propertyPath: rule.propertyPath ?? "/", conversion: "warning severity and custom issue message become a standard pass or fail assertion" });
    }
    return { document, compatibility: { omitted, conversions } };
}
export function inspectJsonSchemaExport(schema, schemas) {
    return buildJsonSchemaExport(schema, schemas).compatibility;
}
export function exportJsonSchemaResource(schema, schemas) {
    const { document, compatibility } = buildJsonSchemaExport(schema, schemas);
    decorateDocumentation(document, schema, schemas);
    return {
        document: { $schema: JSON_SCHEMA_2020_12_DIALECT, $id: jsonSchemaResourceId(schema), title: schema.name, ...document },
        filename: jsonSchemaResourceFilename(schema),
        compatibility,
    };
}
export function exportJsonSchemaBundle(schemas) {
    const published = schemas.filter((schema) => schema.published !== false && schema.version > 0);
    const exports = published.map((schema) => exportJsonSchemaResource(schema, schemas));
    return {
        document: { $schema: JSON_SCHEMA_2020_12_DIALECT, $id: `${RESOURCE_BASE}/bundles/schema-library`, title: "Schema Library", $defs: Object.fromEntries(published.map((schema, index) => [`${slug(schema.name)}-revision-${schema.version}`, exports[index].document])) },
        filename: "schema-library-draft-2020-12.schema.json",
        resourceIds: published.map(jsonSchemaResourceId),
        compatibility: { omitted: exports.flatMap(({ compatibility }) => compatibility.omitted), conversions: exports.flatMap(({ compatibility }) => compatibility.conversions) },
    };
}
export function createExtensionSchemaPackage(schema, schemas, rules) {
    const dependencies = schemaChain(schema, schemas);
    const ruleIds = new Set(dependencies.flatMap((item) => [...(item.attachedRules ?? []), ...(item.workingDraft?.attachedRules ?? [])]).map(({ id }) => id));
    return { version: 1, schemas: dependencies.map(clone), rules: rules.filter(({ id }) => ruleIds.has(id)).map(clone) };
}
//# sourceMappingURL=data-layer-json-schema-export.js.map