import { canonicalPropertyPath, canonicalSchemaFromJsonSchema } from "./data-layer-canonical-schema.js";
const pointer = (path) => `/${path.split(/[./]/).filter(Boolean).join("/")}`;
const clone = (value) => structuredClone(value);
const jsonFacetRule = (schemaId, nodeId, kind) => `json-facet:${schemaId}:${nodeId}:${kind}`;
const canonicalOperator = (operator) => ({ "Equal": "Equals", "Is greater than": "Greater than", "Is at least": "At least", "Is less than": "Less than", "Is at most": "At most" }[operator] ?? operator);
function canonicalRuleCondition(document, group) {
    if (!group)
        return undefined;
    const byPath = new Map(Object.values(document.nodes).map((node) => [canonicalPropertyPath(document, node.id), node.id])), children = group.predicates.flatMap((predicate) => { const propertyId = byPath.get(pointer(predicate.propertyPath)); if (!propertyId)
        return []; const value = predicate.comparison?.value; return [{ kind: "predicate", propertyId, operator: canonicalOperator(predicate.operator), ...(value !== undefined ? { value } : predicate.comparison?.type === "null" ? { value: null } : {}) }]; });
    if (!children.length)
        return undefined;
    return { kind: group.operator === "Any" ? "any" : group.operator === "Not" ? "not" : "all", children };
}
export function savedSchemaCanonicalDocument(schema, id, target) {
    if (schema.canonicalSchema)
        return clone(schema.canonicalSchema);
    const canonical = canonicalSchemaFromJsonSchema({ id: target?.id ?? `canonical:saved:${schema.id}`, contributorId: target?.contributorId ?? schema.id, contributorName: target?.contributorName ?? schema.name, sourceIdentity: schema.id, sourceRevision: schema.version, document: schema.document, idFactory: id }), byPath = new Map(Object.values(canonical.nodes).map((node) => [canonicalPropertyPath(canonical, node.id), node]));
    const definitionsByNodeId = {}, sourceRules = schema.attachedRules ?? schema.rules ?? [];
    const visit = (definition, path) => { for (const [name, child] of Object.entries(definition.properties ?? {})) {
        const childPath = `${path}/${name}`, node = byPath.get(childPath), documentation = schema.documentation?.properties?.[childPath], rich = child;
        if (node) {
            definitionsByNodeId[node.id] = clone(rich);
            if (definition.required?.includes(name))
                node.presence = { mode: "required" };
            else if (definition.forbidden?.includes(name))
                node.presence = { mode: "forbidden" };
            if (node.type === "array" && rich.items && typeof rich.items === "object" && typeof rich.items.type === "string")
                node.itemType = rich.items.type;
            node.allowedValues = node.allowedValues.map((entry, index) => ({ ...entry, id: `allowed-value:${node.id}:${index}` }));
            if (documentation)
                node.documentation = { displayText: documentation.displayName, description: documentation.description || node.documentation.description, comments: documentation.comments ?? "", example: documentation.example ? { method: documentation.example.selectionMethod === "allowed value" ? "allowed-value" : "custom", value: clone(documentation.example.value) } : node.documentation.example };
            const minimum = typeof rich.minimum === "number" ? rich.minimum : undefined, maximum = typeof rich.maximum === "number" ? rich.maximum : undefined, minItems = typeof rich.minItems === "number" ? rich.minItems : undefined, maxItems = typeof rich.maxItems === "number" ? rich.maxItems : undefined;
            if (typeof rich.pattern === "string")
                node.rules.push({ id: jsonFacetRule(schema.id, node.id, "pattern"), kind: "pattern", pattern: rich.pattern, severity: "error", message: "Pattern mismatch" });
            if (minimum !== undefined || maximum !== undefined)
                node.rules.push({ id: jsonFacetRule(schema.id, node.id, "range"), kind: "range", ...(minimum !== undefined ? { minimum } : {}), ...(maximum !== undefined ? { maximum } : {}), severity: "error", message: "Outside range" });
            if (minItems !== undefined || maxItems !== undefined)
                node.rules.push({ id: jsonFacetRule(schema.id, node.id, "cardinality"), kind: "cardinality", ...(minItems !== undefined ? { minItems } : {}), ...(maxItems !== undefined ? { maxItems } : {}), severity: "error", message: "Outside cardinality" });
        }
        visit(child, childPath);
    } };
    visit(schema.document, "");
    const typedRuleValue = (node, value) => { if (typeof value !== "string")
        return clone(value); if (node.type === "number" || node.type === "integer") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : value;
    } if (node.type === "boolean" && ["true", "false"].includes(value.toLowerCase()))
        return value.toLowerCase() === "true"; if (node.type === "null" && value === "null")
        return null; return value; };
    for (const rule of sourceRules) {
        const node = byPath.get(pointer(rule.propertyPath ?? ""));
        if (!node)
            continue;
        const operator = rule.operator?.replaceAll("_", "-").replaceAll(" ", "-").toLowerCase(), bounds = rule.parameters?.split(",") ?? [], number = (value) => value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : undefined, minimum = number(bounds[0]), maximum = number(bounds[1]), kind = operator === "pattern" || operator === "regular-expression" ? "pattern" : operator === "range" || operator === "numeric-range" ? "range" : operator === "cardinality" || operator === "item-count" ? "cardinality" : "custom", condition = canonicalRuleCondition(canonical, rule.conditionGroup), mappedFacet = operator === "exact-value" || operator === "allowed-values" || operator === "required", sourceMetadata = mappedFacet ? { name: rule.name ?? rule.id, revision: rule.version, operator, provenance: { source: "saved-schema", sourceId: schema.id, revision: schema.version } } : {};
        node.rules.push({ id: rule.id, kind, ...(kind === "pattern" && rule.parameters ? { pattern: rule.parameters } : {}), ...(kind === "range" && minimum !== undefined ? { minimum } : {}), ...(kind === "range" && maximum !== undefined ? { maximum } : {}), ...(kind === "cardinality" && minimum !== undefined ? { minItems: minimum } : {}), ...(kind === "cardinality" && maximum !== undefined ? { maxItems: maximum } : {}), ...(condition ? { condition } : {}), severity: rule.severity === "warning" ? "warning" : "error", ...(rule.message !== undefined ? { message: rule.message } : {}), ...(typeof rule.enabled === "boolean" ? { enabled: rule.enabled } : {}), ...sourceMetadata, ...(rule.id.startsWith("rule:") && !mappedFacet ? { reusableRuleId: rule.id } : {}) });
        if (rule.enabled === false)
            continue;
        if (operator === "required") {
            node.presence = condition ? { mode: "required-when", condition } : { mode: "required" };
            continue;
        }
        if (condition)
            continue;
        if (operator === "exact-value" && rule.parameters !== undefined)
            node.expectedValue = typedRuleValue(node, rule.parameters);
        if (operator === "allowed-values") {
            const values = rule.allowedValues ?? bounds.map((value) => value.trim()).filter(Boolean);
            node.allowedValues = values.map((value, index) => ({ id: `allowed-value:${node.id}:rule:${rule.id}:${index}`, value: typedRuleValue(node, value) }));
        }
    }
    canonical.sourceContent = { document: clone(schema.document), rules: clone(sourceRules), documentation: clone(schema.documentation ?? {}), examples: [], definitionsByNodeId };
    return canonical;
}
//# sourceMappingURL=data-layer-saved-schema-canonical.js.map