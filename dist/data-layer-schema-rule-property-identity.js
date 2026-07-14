import { canonicalRulePropertyPath } from "./data-layer-schema-property-rule-picker.js";
function documentRows(document, origin) {
    const rows = [];
    const visit = (schema, prefix) => {
        for (const [name, child] of Object.entries(schema.properties ?? {})) {
            const canonicalPath = name.trim().startsWith("/")
                ? canonicalRulePropertyPath(name)
                : canonicalRulePropertyPath(`${prefix}/${name}`);
            rows.push({ canonicalPath, displayPath: canonicalPath.slice(1).replaceAll("/", "."), origin, schema: child });
            if (child.type === "array" && child.items) {
                const itemPath = `${canonicalPath}/*`;
                rows.push({ canonicalPath: itemPath, displayPath: itemPath.slice(1).replaceAll("/", "."), origin, schema: child.items });
                visit(child.items, itemPath);
            }
            else
                visit(child, canonicalPath);
        }
    };
    visit(document, "");
    return rows;
}
export function schemaPropertyRows(localDocument, inheritedDocuments = [], excludedInheritedPaths = new Set()) {
    const seen = new Set();
    return [
        ...documentRows(localDocument, "local"),
        ...inheritedDocuments.flatMap((document) => documentRows(document, "inherited")),
    ].filter((row) => {
        if (row.origin === "inherited" && excludedInheritedPaths.has(row.canonicalPath))
            return false;
        if (seen.has(row.canonicalPath))
            return false;
        seen.add(row.canonicalPath);
        return true;
    });
}
export function attachRuleToSchemaProperty(draft, path, rule) {
    const propertyPath = canonicalRulePropertyPath(path);
    const attachedRules = draft.attachedRules ?? [];
    const attachment = { ...rule, propertyPath };
    const existingIndex = attachedRules.findIndex((item) => item.id === rule.id
        && canonicalRulePropertyPath(item.propertyPath ?? "") === propertyPath);
    if (existingIndex >= 0) {
        if (JSON.stringify(attachedRules[existingIndex]) === JSON.stringify(attachment))
            return draft;
        return {
            ...draft,
            attachedRules: attachedRules.map((item, index) => index === existingIndex ? attachment : item),
        };
    }
    return {
        ...draft,
        attachedRules: [...attachedRules, attachment],
    };
}
//# sourceMappingURL=data-layer-schema-rule-property-identity.js.map