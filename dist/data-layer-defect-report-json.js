export function cloneValue(value) {
    return value === undefined ? value : structuredClone(value);
}
export function pointerSegments(pointer) {
    if (!pointer.startsWith("/"))
        throw new Error(`Invalid JSON pointer: ${pointer}`);
    return pointer.slice(1).split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}
export function pointerValue(payload, pointer) {
    let current = payload;
    for (const segment of pointerSegments(pointer)) {
        if (current === null || typeof current !== "object")
            return undefined;
        current = current[segment];
    }
    return current;
}
export function updatePointer(payload, pointer, operation, value) {
    const segments = pointerSegments(pointer);
    const leaf = segments.pop();
    if (!leaf)
        throw new Error("The root payload cannot be corrected directly.");
    let parent = payload;
    for (const segment of segments) {
        const child = parent[segment];
        if (child === null || typeof child !== "object")
            parent[segment] = {};
        parent = parent[segment];
    }
    if (operation === "remove")
        delete parent[leaf];
    else
        parent[leaf] = cloneValue(value);
}
//# sourceMappingURL=data-layer-defect-report-json.js.map