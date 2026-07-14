function pointerSegments(pointer) {
    return pointer.slice(1).split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}
function arraySegment(segment) {
    return segment === "*" || /^\d+$/.test(segment ?? "");
}
function mergeSchema(left, right) {
    if (!left)
        return structuredClone(right);
    const merged = { ...structuredClone(left), ...structuredClone(right) };
    if (left.properties || right.properties)
        merged.properties = { ...structuredClone(left.properties ?? {}), ...structuredClone(right.properties ?? {}) };
    const items = left.items && right.items ? mergeSchema(left.items, right.items) : right.items ?? left.items;
    if (items)
        merged.items = structuredClone(items);
    if (left.required || right.required)
        merged.required = [...new Set([...(left.required ?? []), ...(right.required ?? [])])];
    return merged;
}
function insertSchemaPath(root, segments, definition) {
    let current = root;
    segments.forEach((segment, index) => {
        const last = index === segments.length - 1;
        if (arraySegment(segment)) {
            current.type ??= "array";
            if (last)
                current.items = mergeSchema(current.items, definition);
            else {
                current.items ??= { type: arraySegment(segments[index + 1]) ? "array" : "object" };
                current = current.items;
            }
            return;
        }
        current.type ??= "object";
        current.properties ??= {};
        if (last)
            current.properties[segment] = mergeSchema(current.properties[segment], definition);
        else {
            current.properties[segment] ??= { type: arraySegment(segments[index + 1]) ? "array" : "object" };
            current = current.properties[segment];
        }
    });
}
function markRequiredPath(root, segments) {
    let current = root;
    segments.forEach((segment, index) => {
        if (arraySegment(segment)) {
            if (current.items)
                current = current.items;
            return;
        }
        current.required = [...new Set([...(current.required ?? []), segment])];
        if (index < segments.length - 1 && current.properties?.[segment])
            current = current.properties[segment];
    });
}
export function normalizeCanonicalSchemaDocument(document) {
    const { properties, required, ...rest } = structuredClone(document);
    const normalized = { ...rest, ...(document.type === "object" ? { properties: {} } : {}) };
    for (const [storedPath, storedDefinition] of Object.entries(properties ?? {})) {
        const definition = normalizeCanonicalSchemaDocument(storedDefinition);
        insertSchemaPath(normalized, storedPath.startsWith("/") ? pointerSegments(storedPath) : [storedPath], definition);
    }
    for (const storedPath of required ?? []) {
        markRequiredPath(normalized, storedPath.startsWith("/") ? pointerSegments(storedPath) : [storedPath]);
    }
    return normalized;
}
//# sourceMappingURL=data-layer-schema-canonical-document.js.map