import { addManualProperty, schemaPropertyRows, } from "../../utilities/data-layer/schemas.js";
export function schemaDocumentPaths(document) {
    return schemaPropertyRows(document).map(({ canonicalPath }) => canonicalPath);
}
export function schemaPropertyAt(document, path) {
    const normalized = `/${path.replace(/^\//, "").replaceAll(".", "/")}`;
    return schemaPropertyRows(document).find(({ canonicalPath }) => canonicalPath === normalized)?.schema;
}
export function schemaDocumentFromValue(value) {
    if (Array.isArray(value))
        return { type: "array", items: value.length ? schemaDocumentFromValue(value[0]) : {} };
    if (!value || typeof value !== "object")
        return { type: typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string" };
    return { type: "object", properties: Object.fromEntries(Object.entries(value).map(([name, child]) => [name, schemaDocumentFromValue(child)])) };
}
export function defineSchemaProperty(document, definition) {
    return addManualProperty(document, [], definition);
}
export function schemaPropertyType(document, path) {
    return schemaPropertyAt(document, path)?.type;
}
export function schemaEditorDraft(schema) {
    const draft = schema.workingDraft;
    if (!draft)
        return structuredClone(schema);
    const { attachedRules: _attachedRules, parentSchemaId: _parentSchemaId, inheritedRuleOverrides: _overrides, documentation: _documentation, canonicalSchema: _canonicalSchema, ...current } = structuredClone(schema);
    return { ...current, name: draft.name ?? current.name, document: structuredClone(draft.document), assignments: structuredClone(draft.assignments),
        ...(draft.attachedRules !== undefined ? { attachedRules: structuredClone(draft.attachedRules) } : {}),
        ...(draft.parentSchemaId !== undefined ? { parentSchemaId: draft.parentSchemaId } : {}),
        ...(draft.inheritedRuleOverrides !== undefined ? { inheritedRuleOverrides: structuredClone(draft.inheritedRuleOverrides) } : {}),
        ...(draft.documentation !== undefined ? { documentation: structuredClone(draft.documentation) } : {}),
        ...(draft.canonicalSchema !== undefined ? { canonicalSchema: structuredClone(draft.canonicalSchema) } : {}) };
}
export function withSchemaParent(schema, parentSchemaId) {
    const { parentSchemaId: _previousParentSchemaId, ...withoutParent } = schema;
    return parentSchemaId ? { ...withoutParent, parentSchemaId } : withoutParent;
}
export function storedPromotionRules(rules) {
    return rules.map((rule) => {
        const { revisionHistory, ...current } = structuredClone(rule);
        return { ...current,
            ...(revisionHistory ? { revisionHistory: revisionHistory.map((snapshot) => ({ name: snapshot.name ?? rule.name,
                    kind: snapshot.kind ?? rule.kind, version: snapshot.version ?? 1, ...(snapshot.enabled !== undefined ? { enabled: snapshot.enabled } : {}),
                    ...(snapshot.operator !== undefined ? { operator: snapshot.operator } : {}), ...(snapshot.parameters !== undefined ? { parameters: snapshot.parameters } : {}),
                    ...(snapshot.allowedValues !== undefined ? { allowedValues: structuredClone(snapshot.allowedValues) } : {}),
                    ...(snapshot.severity !== undefined ? { severity: snapshot.severity } : {}), ...(snapshot.message !== undefined ? { message: snapshot.message } : {}),
                    ...(snapshot.conditionGroup !== undefined ? { conditionGroup: structuredClone(snapshot.conditionGroup) } : {}) })) } : {}) };
    });
}
//# sourceMappingURL=schema-model.js.map