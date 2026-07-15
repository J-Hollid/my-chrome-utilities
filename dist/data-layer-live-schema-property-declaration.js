import { guidedPropertyDocument, mergeGuidedDocument } from "./data-layer-guided-nested-property-merge.js";
import { detectedValueType } from "./data-layer-guided-validation.js";
import { resolveNestedValues } from "./data-layer-schema-nested-path.js";
function segments(path) {
    return path.split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}
function observedValue(payload, path) {
    const match = resolveNestedValues(payload, path).find(({ exists }) => exists);
    if (!match)
        throw new Error(`Observed property ${path} is unavailable`);
    return match.value;
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
        detectedType: detectedValueType(observedValue(payload, concretePath)),
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