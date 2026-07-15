import { guidedPropertyDocument, mergeGuidedDocument } from "./data-layer-guided-nested-property-merge.js";
function segments(path) {
    return path.split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}
function valueAt(payload, path) {
    return segments(path).reduce((value, segment) => {
        if (Array.isArray(value) && /^\d+$/.test(segment))
            return value[Number(segment)];
        if (value && typeof value === "object")
            return value[segment];
        return undefined;
    }, payload);
}
function detectedType(value) {
    if (Array.isArray(value))
        return "Array";
    if (value !== null && typeof value === "object")
        return "Object";
    if (typeof value === "number")
        return "Number";
    if (typeof value === "boolean")
        return "Boolean";
    return "String";
}
export function canonicalLivePropertyPath(path) {
    return `/${segments(path).map((segment) => /^\d+$/.test(segment) ? "*" : segment).join("/")}`;
}
export function createLiveSchemaPropertyDeclaration(payload, concretePath, schema) {
    if (!schema.workingDraft)
        throw new Error(`${schema.name} has no working draft`);
    return {
        concretePath,
        canonicalPath: canonicalLivePropertyPath(concretePath),
        detectedType: detectedType(valueAt(payload, concretePath)),
        schemaId: schema.id,
        schemaName: schema.name,
        schemaVersion: schema.version,
    };
}
export function addLiveSchemaPropertyDeclaration(schema, declaration) {
    if (!schema.workingDraft || schema.id !== declaration.schemaId)
        throw new Error("Declaration destination is unavailable");
    const document = mergeGuidedDocument(schema.workingDraft.document, guidedPropertyDocument(declaration.canonicalPath, declaration.detectedType));
    return {
        ...structuredClone(schema),
        workingDraft: {
            ...structuredClone(schema.workingDraft),
            document,
            pendingChanges: [...schema.workingDraft.pendingChanges, `Declare ${declaration.canonicalPath} as ${declaration.detectedType}`],
        },
    };
}
//# sourceMappingURL=data-layer-live-schema-property-declaration.js.map