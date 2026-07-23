import { canonicalPropertyPath, canonicalSchemaFromJsonSchema } from "./data-layer-canonical-schema.js";
const pointer = (path) => `/${path.split(/[./]/).filter(Boolean).join("/")}`;
const clone = (value) => structuredClone(value);
const jsonFacetRule = (schemaId, nodeId, kind) => `json-facet:${schemaId}:${nodeId}:${kind}`;
const canonicalOperator = (operator) => ({ "Equal": "Equals", "Is greater than": "Greater than", "Is at least": "At least", "Is less than": "Less than", "Is at most": "At most" }[operator] ?? operator);
function canonicalRuleCondition(document, group) {
    if (!group)
        return { complete: true };
    const byPath = new Map(Object.values(document.nodes).map((node) => [canonicalPropertyPath(document, node.id), node.id])), kind = group.operator === "All" ? "all" : group.operator === "Any" ? "any" : group.operator === "Not" ? "not" : undefined, children = group.predicates.map((predicate) => { const propertyId = byPath.get(pointer(predicate.propertyPath)); if (!propertyId)
        return undefined; const value = predicate.comparison?.value; return { kind: "predicate", propertyId, operator: canonicalOperator(predicate.operator), ...(value !== undefined ? { value } : predicate.comparison?.type === "null" ? { value: null } : {}) }; });
    if (!kind || !children.length || children.some((child) => child === undefined) || (kind === "not" && children.length !== 1))
        return { complete: false };
    return { complete: true, condition: { kind, children: children } };
}
export function savedSchemaCanonicalDocument(schema, id, target) {
    if (schema.canonicalSchema)
        return clone(schema.canonicalSchema);
    const canonical = canonicalSchemaFromJsonSchema({ id: target?.id ?? `canonical:saved:${schema.id}`, contributorId: target?.contributorId ?? schema.id, contributorName: target?.contributorName ?? schema.name, sourceIdentity: schema.id, sourceRevision: schema.version, document: schema.document, idFactory: id }), byPath = new Map(Object.values(canonical.nodes).map((node) => [canonicalPropertyPath(canonical, node.id), node]));
    const definitionsByNodeId = {}, pathsByNodeId = {}, sourceRules = schema.attachedRules ?? schema.rules ?? [];
    const visit = (definition, path) => { for (const [index, [name, child]] of Object.entries(definition.properties ?? {}).entries()) {
        const childPath = `${path}/${name}`, node = byPath.get(childPath), documentation = schema.documentation?.properties?.[childPath], rich = child;
        if (node) {
            node.order = index;
            definitionsByNodeId[node.id] = clone(rich);
            pathsByNodeId[node.id] = childPath;
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
    canonical.rootIds = Object.values(canonical.nodes).filter(({ parentId }) => !parentId).sort((left, right) => left.order - right.order).map(({ id }) => id);
    if (canonical.rootIds[0])
        canonical.selectedPropertyId = canonical.rootIds[0];
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
        const operator = rule.operator?.replaceAll("_", "-").replaceAll(" ", "-").toLowerCase(), bounds = rule.parameters?.split(",") ?? [], number = (value) => value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : undefined, minimum = number(bounds[0]), maximum = number(bounds[1]), kind = operator === "pattern" || operator === "regular-expression" ? "pattern" : operator === "range" || operator === "numeric-range" ? "range" : operator === "cardinality" || operator === "item-count" ? "cardinality" : "custom", conditionMapping = canonicalRuleCondition(canonical, rule.conditionGroup), mappedFacet = operator === "exact-value" || operator === "allowed-values" || operator === "required", sourceMetadata = mappedFacet ? { name: rule.name ?? rule.id, revision: rule.version, operator, provenance: { source: "saved-schema", sourceId: schema.id, revision: schema.version } } : {};
        node.rules.push({ id: rule.id, kind, ...(kind === "pattern" && rule.parameters ? { pattern: rule.parameters } : {}), ...(kind === "range" && minimum !== undefined ? { minimum } : {}), ...(kind === "range" && maximum !== undefined ? { maximum } : {}), ...(kind === "cardinality" && minimum !== undefined ? { minItems: minimum } : {}), ...(kind === "cardinality" && maximum !== undefined ? { maxItems: maximum } : {}), ...(conditionMapping.condition ? { condition: conditionMapping.condition } : {}), severity: rule.severity === "warning" ? "warning" : "error", ...(rule.message !== undefined ? { message: rule.message } : {}), ...(typeof rule.enabled === "boolean" ? { enabled: rule.enabled } : {}), ...sourceMetadata, ...(rule.id.startsWith("rule:") && !mappedFacet ? { reusableRuleId: rule.id } : {}) });
        if (rule.enabled === false)
            continue;
        if (operator === "required") {
            if (conditionMapping.complete)
                node.presence = conditionMapping.condition ? { mode: "required-when", condition: conditionMapping.condition } : { mode: "required" };
            continue;
        }
        if (rule.conditionGroup)
            continue;
        if (operator === "exact-value" && rule.parameters !== undefined)
            node.expectedValue = typedRuleValue(node, rule.parameters);
        if (operator === "allowed-values") {
            const values = rule.allowedValues ?? bounds.map((value) => value.trim()).filter(Boolean);
            node.allowedValues = values.map((value, index) => ({ id: `allowed-value:${node.id}:rule:${rule.id}:${index}`, value: typedRuleValue(node, value) }));
        }
    }
    canonical.sourceContent = { document: clone(schema.document), rules: clone(sourceRules), documentation: clone(schema.documentation ?? {}), examples: [], definitionsByNodeId, pathsByNodeId };
    return canonical;
}
const orderedChildren = (document, parentId) => Object.values(document.nodes).filter((node) => node.parentId === parentId).sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
function jsonDefinition(document, node) {
    const base = clone(document.sourceContent?.definitionsByNodeId?.[node.id] ?? {}), children = orderedChildren(document, node.id), definition = { ...base, type: node.type };
    for (const key of ["properties", "required", "forbidden", "enum", "description", "examples", "pattern", "minimum", "maximum", "minItems", "maxItems"])
        delete definition[key];
    if (node.type === "array") {
        const prior = base.items && typeof base.items === "object" ? clone(base.items) : undefined;
        definition.items = node.itemType && prior?.type === node.itemType ? prior : { type: node.itemType ?? "string" };
    }
    else
        delete definition.items;
    if (children.length) {
        definition.properties = Object.fromEntries(children.map((child) => [child.name, jsonDefinition(document, child)]));
        const required = children.filter(({ presence }) => presence.mode.startsWith("required")).map(({ name }) => name), forbidden = children.filter(({ presence }) => presence.mode.startsWith("forbidden")).map(({ name }) => name);
        if (required.length)
            definition.required = required;
        if (forbidden.length)
            definition.forbidden = forbidden;
    }
    if (node.allowedValues.length)
        definition.enum = node.allowedValues.map(({ value }) => clone(value));
    if (node.documentation.description)
        definition.description = node.documentation.description;
    if (node.documentation.example.method !== "blank")
        definition.examples = [clone(node.documentation.example.value)];
    for (const rule of node.rules.filter(({ id }) => id.startsWith("json-facet:"))) {
        if (rule.kind === "pattern" && rule.pattern)
            definition.pattern = rule.pattern;
        if (rule.kind === "range") {
            if (rule.minimum !== undefined)
                definition.minimum = rule.minimum;
            if (rule.maximum !== undefined)
                definition.maximum = rule.maximum;
        }
        if (rule.kind === "cardinality") {
            if (rule.minItems !== undefined)
                definition.minItems = rule.minItems;
            if (rule.maxItems !== undefined)
                definition.maxItems = rule.maxItems;
        }
    }
    return definition;
}
export function savedSchemaFromCanonical(schema, canonical) {
    const roots = orderedChildren(canonical), root = clone(canonical.sourceContent?.document ?? {});
    for (const key of ["properties", "required", "forbidden"])
        delete root[key];
    root.type = "object";
    root.properties = Object.fromEntries(roots.map((node) => [node.name, jsonDefinition(canonical, node)]));
    const rootRequired = roots.filter(({ presence }) => presence.mode.startsWith("required")).map(({ name }) => name), rootForbidden = roots.filter(({ presence }) => presence.mode.startsWith("forbidden")).map(({ name }) => name);
    if (rootRequired.length)
        root.required = rootRequired;
    if (rootForbidden.length)
        root.forbidden = rootForbidden;
    const document = root, attachedRules = [], properties = {};
    for (const node of Object.values(canonical.nodes)) {
        const path = canonicalPropertyPath(canonical, node.id), priorDocumentation = schema.documentation?.properties?.[path], example = node.documentation.example.method === "blank" ? undefined : { value: structuredClone(node.documentation.example.value), selectionMethod: node.documentation.example.method === "allowed-value" ? "allowed value" : "custom" }, sourceRules = canonical.sourceContent?.definitionsByNodeId?.[node.id]?.rules, embeddedRuleIds = new Set(Array.isArray(sourceRules) ? sourceRules.flatMap((rule) => rule && typeof rule === "object" && "id" in rule && typeof rule.id === "string" ? [rule.id] : []) : []);
        if (node.documentation.displayText || node.documentation.description || node.documentation.comments || priorDocumentation || example)
            properties[path] = { displayName: node.documentation.displayText, description: node.documentation.description, ...(node.documentation.comments ? { comments: node.documentation.comments } : {}), ...(example ? { example } : {}) };
        for (const rule of node.rules) {
            if (rule.id.startsWith("json-facet:"))
                continue;
            const prior = (schema.attachedRules ?? []).find(({ id }) => id === rule.id);
            if (!prior && embeddedRuleIds.has(rule.id))
                continue;
            const operator = rule.kind === "pattern" ? (prior?.operator ?? "regular-expression") : rule.kind === "range" ? "numeric-range" : rule.kind === "cardinality" ? "item-count" : prior?.operator ?? rule.kind, parameters = rule.kind === "pattern" ? rule.pattern : rule.kind === "range" ? `${rule.minimum ?? ""},${rule.maximum ?? ""}` : rule.kind === "cardinality" ? `${rule.minItems ?? ""},${rule.maxItems ?? ""}` : prior?.parameters, propertyPath = prior?.propertyPath && pointer(prior.propertyPath) === path ? prior.propertyPath : path, { conditionGroup: _legacyConditionGroup, ...priorWithoutLegacyCondition } = prior ?? {};
            attachedRules.push({ ...priorWithoutLegacyCondition, id: rule.id, version: prior?.version ?? 1, propertyPath, operator, ...(parameters !== undefined ? { parameters } : {}), severity: rule.severity, ...(rule.message !== undefined ? { message: rule.message } : {}) });
        }
    }
    const clean = (value) => { const next = structuredClone(value); delete next.attachedRules; if (next.required && !next.required.length)
        delete next.required; for (const child of Object.values(next.properties ?? {}))
        clean(child); return next; };
    const documentation = { ...(schema.documentation?.description ? { description: schema.documentation.description } : {}), ...(Object.keys(properties).length ? { properties } : {}) };
    const { attachedRules: _attachedRules, documentation: _documentation, canonicalSchema: _canonicalSchema, ...current } = schema;
    return { ...current, document: clean(document), ...(attachedRules.length ? { attachedRules } : {}), ...(Object.keys(documentation).length ? { documentation } : {}), canonicalSchema: clone(canonical) };
}
//# sourceMappingURL=data-layer-saved-schema-canonical.js.map