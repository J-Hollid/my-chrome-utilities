import { resolveEffectiveSchemaDocumentation, resolvePropertyDocumentation } from "./data-layer-schema-documentation.js";
import { schemaPropertyRows } from "./data-layer-schema-rule-property-identity.js";
import { schemaRevision } from "./data-layer-schema-verification.js";
export const defaultSpecificationColumns = [
    "propertyName", "description", "mandatory", "type", "example", "allowedValues", "comments",
];
export const specificationColumnLabels = {
    propertyName: "Property name",
    description: "Description",
    mandatory: "Mandatory",
    type: "Type",
    example: "Example value",
    allowedValues: "Allowed values",
    comments: "Comments",
};
function withoutWorkingState(schema) {
    const { workingDraft: _draft, revisionHistory: _history, ...surface } = structuredClone(schema);
    return surface;
}
function workingDraftSurface(schema) {
    const draft = schema.workingDraft;
    if (!draft)
        return undefined;
    const { workingDraft: _draft, revisionHistory: _history, attachedRules: _rules, parentSchemaId: _parent, inheritedRuleOverrides: _overrides, documentation: _documentation, ...published } = structuredClone(schema);
    return {
        ...published,
        name: draft.name ?? schema.name,
        document: structuredClone(draft.document),
        assignments: structuredClone(draft.assignments),
        ...(draft.attachedRules !== undefined ? { attachedRules: structuredClone(draft.attachedRules) } : {}),
        ...(draft.parentSchemaId !== undefined ? { parentSchemaId: draft.parentSchemaId } : {}),
        ...(draft.inheritedRuleOverrides !== undefined ? { inheritedRuleOverrides: structuredClone(draft.inheritedRuleOverrides) } : {}),
        ...(draft.documentation !== undefined ? { documentation: structuredClone(draft.documentation) } : {}),
    };
}
export function specificationSurfaces(schema) {
    const published = schemaRevision(schema, schema.version) ?? withoutWorkingState(schema);
    const historical = (schema.revisionHistory ?? [])
        .map(({ version }) => schemaRevision(schema, version))
        .filter((revision) => Boolean(revision))
        .sort((left, right) => right.version - left.version)
        .map((revision) => ({
        key: `historical:${revision.version}`,
        label: `historical revision ${revision.version}`,
        schema: revision,
    }));
    const draft = workingDraftSurface(schema);
    return [
        { key: `published:${published.version}`, label: `published revision ${published.version}`, schema: published },
        ...historical,
        ...(draft ? [{ key: "working-draft", label: `working draft based on revision ${schema.workingDraft.sourceVersion}`, schema: draft }] : []),
    ];
}
function typeLabel(schema) {
    if (!schema?.type)
        return "Unspecified";
    if (schema.type === "array") {
        const itemType = schema.items?.type;
        return itemType === "object"
            ? "Array of Object"
            : `Array of ${itemType ? itemType.charAt(0).toUpperCase() + itemType.slice(1) : "Unspecified"}`;
    }
    return schema.type.charAt(0).toUpperCase() + schema.type.slice(1);
}
function pathSegments(path) {
    return path.split("/").filter(Boolean);
}
function propertyName(path) {
    return path.slice(1).replaceAll("/*", "[]").replaceAll("/", ".");
}
function overrideDisabled(schema, path) {
    const overrides = schema.inheritedRuleOverrides ?? {};
    const topLevel = pathSegments(path)[0] ?? "";
    return overrides[path] === "disabled" || overrides[topLevel] === "disabled";
}
function parentChain(schema, allSchemas) {
    const result = [];
    const visited = new Set([schema.id]);
    let parentId = schema.parentSchemaId;
    while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        const parent = allSchemas.find(({ id }) => id === parentId);
        if (!parent)
            break;
        result.push(parent);
        parentId = parent.parentSchemaId;
    }
    return result;
}
function ruleIdentity(rule) {
    return `${rule.id}\u0000${rule.propertyPath ?? ""}`;
}
function effectiveRules(schema, allSchemas) {
    const rules = new Map();
    for (const parent of parentChain(schema, allSchemas).reverse()) {
        for (const rule of parent.attachedRules ?? []) {
            if (rule.enabled === false || (rule.propertyPath && overrideDisabled(schema, rule.propertyPath)))
                continue;
            rules.set(ruleIdentity(rule), rule);
        }
    }
    for (const rule of schema.attachedRules ?? []) {
        if (rule.enabled === false)
            rules.delete(ruleIdentity(rule));
        else
            rules.set(ruleIdentity(rule), rule);
    }
    return [...rules.values()];
}
function rulesFor(path, rules) {
    return rules.filter(({ propertyPath, enabled }) => enabled !== false && propertyPath === path);
}
function schemaAt(document, path) {
    return pathSegments(path).reduce((current, segment) => segment === "*" ? current?.items : current?.properties?.[segment], document);
}
function owningDocument(schema, path, allSchemas) {
    return [schema, ...parentChain(schema, allSchemas)]
        .find((candidate) => schemaAt(candidate.document, path))?.document ?? schema.document;
}
function structuralRequirement(path, document) {
    const segments = pathSegments(path);
    const conditions = [];
    let current = document;
    let readable = "";
    for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        if (segment === "*") {
            const arrayName = readable.split(".").at(-1) ?? "array";
            conditions.push(`a ${arrayName} item exists`);
            current = current?.items;
            continue;
        }
        if (!current)
            return undefined;
        const required = current.required?.includes(segment) ?? false;
        const leaf = index === segments.length - 1;
        readable = readable ? `${readable}.${segment}` : segment;
        const child = current.properties?.[segment];
        if (leaf) {
            if (!required)
                return undefined;
            return conditions.length ? `Yes when ${conditions.join(" and ")}` : "Yes";
        }
        const followedByItem = child?.type === "array" && segments[index + 1] === "*";
        if (!required && !followedByItem)
            conditions.push(`${readable} exists`);
        current = child;
    }
    return undefined;
}
function comparisonText(predicate) {
    if (predicate.operator === "Is one of")
        return predicate.comparisons?.map(({ value }) => String(value)).join(" or ") ?? "";
    return predicate.comparison ? String(predicate.comparison.value) : "";
}
function conditionPath(path, targetPath) {
    const predicate = pathSegments(path);
    const target = pathSegments(targetPath);
    const targetWildcard = target.indexOf("*");
    if (targetWildcard > 0
        && predicate[targetWildcard] === "*"
        && predicate.slice(0, targetWildcard).every((segment, index) => segment === target[index])) {
        return {
            name: propertyName(`/${predicate.slice(targetWildcard + 1).join("/")}`),
            context: `the same ${target[targetWildcard - 1]} item`,
        };
    }
    return { name: propertyName(path) };
}
function predicateText(predicate, targetPath) {
    const path = conditionPath(predicate.propertyPath, targetPath);
    const comparison = comparisonText(predicate);
    const relation = predicate.operator === "Exists" ? "exists"
        : predicate.operator === "Does not exist" ? "does not exist"
            : predicate.operator === "Equals" ? `equals ${comparison}`
                : predicate.operator === "Does not equal" ? `does not equal ${comparison}`
                    : predicate.operator === "Is one of" ? `is one of ${comparison}`
                        : predicate.operator === "Matches pattern" ? `matches ${comparison}`
                            : `${predicate.operator.toLowerCase()} ${comparison}`;
    return `${path.name} ${relation}${path.context ? ` for ${path.context}` : ""}`;
}
function conditionText(group, targetPath) {
    return group.predicates.map((predicate) => predicateText(predicate, targetPath))
        .join(group.operator === "All" ? " and " : " or ");
}
function requiredFor(path, document, rules) {
    const requiredRules = rulesFor(path, rules)
        .filter((rule) => rule.operator?.replaceAll("_", "-").toLowerCase() === "required");
    if (requiredRules.some(({ conditionGroup }) => !conditionGroup))
        return "Yes";
    const structural = structuralRequirement(path, document);
    if (structural)
        return structural;
    const conditional = requiredRules.filter((rule) => Boolean(rule.conditionGroup));
    return conditional.length
        ? conditional.map(({ conditionGroup }) => `Yes when ${conditionText(conditionGroup, path)}`).join("; ")
        : "No";
}
function uniqueValues(values) {
    return values.filter((value, index) => values.findIndex((candidate) => Object.is(candidate, value)) === index);
}
function allowedFor(path, rules) {
    const relevant = rulesFor(path, rules)
        .filter((rule) => rule.operator?.replaceAll("_", "-").toLowerCase() === "allowed-values" && rule.allowedValues);
    const unconditional = relevant.filter(({ conditionGroup }) => !conditionGroup);
    const conditional = relevant.filter((rule) => Boolean(rule.conditionGroup));
    let intersection = unconditional.length ? uniqueValues(unconditional[0].allowedValues) : [];
    for (const rule of unconditional.slice(1)) {
        intersection = intersection.filter((value) => rule.allowedValues.some((candidate) => Object.is(candidate, value)));
    }
    const conflict = unconditional.length > 1 && !intersection.length;
    const groups = [
        ...(conflict ? ["Conflict: no values satisfy all effective rules"] : intersection.length ? [intersection.join(" | ")] : []),
        ...conditional.map((rule) => `${uniqueValues(rule.allowedValues).join(" | ")} when ${conditionText(rule.conditionGroup, path)}`),
    ];
    return {
        values: uniqueValues([...intersection, ...conditional.flatMap((rule) => rule.allowedValues)]),
        groups,
    };
}
export function specificationProperties(schema, allSchemas = [schema]) {
    const parents = parentChain(schema, allSchemas);
    return schemaPropertyRows(schema.document, parents.map(({ document }) => document))
        .filter(({ canonicalPath, origin }) => !canonicalPath.endsWith("/*") && !(origin === "inherited" && overrideDisabled(schema, canonicalPath)))
        .map((row) => {
        const container = row.schema.type === "object" || row.schema.type === "array";
        return {
            canonicalPath: row.canonicalPath,
            propertyName: propertyName(row.canonicalPath),
            origin: row.origin,
            container,
            selectedByDefault: true,
        };
    });
}
export function deriveSpecificationRows(schema, selectedPaths, allSchemas = [schema]) {
    const documentation = resolveEffectiveSchemaDocumentation(schema, allSchemas);
    const rules = effectiveRules(schema, allSchemas);
    return selectedPaths.map((canonicalPath) => {
        const document = owningDocument(schema, canonicalPath, allSchemas);
        const property = schemaAt(document, canonicalPath);
        const resolvedDocumentation = resolvePropertyDocumentation(documentation, canonicalPath);
        const documented = resolvedDocumentation?.inherited && overrideDisabled(schema, canonicalPath)
            ? undefined
            : resolvedDocumentation;
        const example = documented?.example?.value;
        const allowed = allowedFor(canonicalPath, rules);
        return {
            canonicalPath,
            propertyName: propertyName(canonicalPath),
            description: documented?.description ?? "",
            comments: documented?.comments ?? "",
            mandatory: requiredFor(canonicalPath, document, rules),
            type: typeLabel(property),
            ...(example !== undefined ? { example: String(example) } : {}),
            allowedValues: allowed.values,
            allowedValueGroups: allowed.groups,
            ...(allowed.groups.length ? { allowedValuesText: allowed.groups.join("; ") } : {}),
        };
    });
}
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
function plainCell(value) {
    return String(value ?? "").replace(/[\t\r\n]+/gu, " ");
}
export function renderSpecificationClipboard(rows, options = {}) {
    const richTableStyle = "table{border-collapse:collapse}th,td{border:1px solid #8a8a8a;padding:4px 6px;text-align:left;vertical-align:top}th{background:#f2f2f2;font-weight:700}";
    const columns = options.columns ?? defaultSpecificationColumns;
    const includeHeadings = options.includeHeadings !== false;
    const value = (row, column) => column === "propertyName" ? row.propertyName
        : column === "description" ? row.description
            : column === "mandatory" ? row.mandatory
                : column === "type" ? row.type
                    : column === "example" ? row.example ?? ""
                        : column === "allowedValues" ? row.allowedValueGroups.join("; ")
                            : row.comments;
    const htmlCell = (row, column) => column === "allowedValues"
        ? row.allowedValueGroups.map(escapeHtml).join("<br>")
        : column === "comments"
            ? escapeHtml(row.comments).replaceAll("\n", "<br>")
            : escapeHtml(value(row, column));
    const htmlRows = rows.map((row) => `<tr>${columns.map((column) => `<td>${htmlCell(row, column)}</td>`).join("")}</tr>`).join("");
    const heading = includeHeadings ? `<thead><tr>${columns.map((column) => `<th>${escapeHtml(specificationColumnLabels[column])}</th>`).join("")}</tr></thead>` : "";
    const html = `<table><style>${richTableStyle}</style>${heading}<tbody>${htmlRows}</tbody></table>`;
    const plainRows = rows.map((row) => columns.map((column) => value(row, column)));
    const plain = [...(includeHeadings ? [columns.map((column) => specificationColumnLabels[column])] : []), ...plainRows]
        .map((line) => line.map(plainCell).join("\t"))
        .join("\n");
    return { html, plain };
}
//# sourceMappingURL=data-layer-schema-specification-builder.js.map