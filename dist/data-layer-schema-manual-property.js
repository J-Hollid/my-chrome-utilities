function parsePath(path) {
    const trimmed = path.trim();
    if (!trimmed)
        return { segments: [], normalizedPath: "", hasEmptySegment: false };
    const separated = trimmed.replaceAll("/", ".");
    const withoutLeadingSeparator = separated.startsWith(".") ? separated.slice(1) : separated;
    const segments = withoutLeadingSeparator.split(".").map((segment) => segment.trim());
    return {
        segments,
        normalizedPath: `/${segments.filter(Boolean).join("/")}`,
        hasEmptySegment: segments.some((segment) => !segment),
    };
}
function propertyAt(document, segments) {
    let property = document;
    for (const segment of segments)
        property = segment === "*" ? property?.items : property?.properties?.[segment];
    return property;
}
function inheritedPropertyAt(documents, segments) {
    return documents.map((document) => propertyAt(document, segments)).find(Boolean);
}
export function inspectManualProperty(document, inheritedDocuments, definition) {
    const parsed = parsePath(definition.path);
    if (!parsed.segments.length)
        return { result: "blocked", normalizedPath: "", missingObjectPath: [], assistance: "Enter a property path" };
    if (parsed.hasEmptySegment)
        return { result: "blocked", normalizedPath: parsed.normalizedPath, missingObjectPath: [], assistance: "Remove the empty path segment" };
    const missingObjectPath = [];
    for (let index = 0; index < parsed.segments.length - 1; index += 1) {
        const prefix = parsed.segments.slice(0, index + 1);
        const local = propertyAt(document, prefix);
        const inherited = inheritedPropertyAt(inheritedDocuments, prefix);
        const existing = local ?? inherited;
        const traversesArrayItems = existing?.type === "array" && parsed.segments[index + 1] === "*";
        if (existing && existing.type !== "object" && !traversesArrayItems) {
            return { result: "blocked", normalizedPath: parsed.normalizedPath, missingObjectPath, assistance: `${prefix.join(".")} cannot contain child properties` };
        }
        if (!local && parsed.segments[index] !== "*")
            missingObjectPath.push(parsed.segments[index]);
    }
    const local = propertyAt(document, parsed.segments);
    if (local) {
        const existingPath = parsed.segments.includes("*") ? parsed.normalizedPath : parsed.segments.join(".");
        return { result: "blocked", normalizedPath: parsed.normalizedPath, missingObjectPath, assistance: `Go to existing property ${existingPath}`, existingPath };
    }
    if (inheritedPropertyAt(inheritedDocuments, parsed.segments)) {
        const inheritedPath = parsed.segments.join(".");
        return { result: "blocked", normalizedPath: parsed.normalizedPath, missingObjectPath, assistance: `${inheritedPath} is defined by the parent schema` };
    }
    if (definition.type === "array" && !definition.arrayItemType) {
        return { result: "blocked", normalizedPath: parsed.normalizedPath, missingObjectPath, assistance: "Select an array item type" };
    }
    return { result: "ready", normalizedPath: parsed.normalizedPath, missingObjectPath };
}
function manualLeaf(definition) {
    return {
        type: definition.type,
        propertyOrigin: "manual",
        ...(definition.type === "array" && definition.arrayItemType ? { items: { type: definition.arrayItemType } } : {}),
    };
}
function addAtPath(document, segments, definition) {
    const [name, ...rest] = segments;
    if (!name)
        return structuredClone(document);
    if (name === "*") {
        const item = document.items ?? { type: "object", propertyOrigin: "manual" };
        return { ...structuredClone(document), items: rest.length ? addAtPath(item, rest, definition) : manualLeaf(definition) };
    }
    const properties = document.properties ?? {};
    if (!rest.length)
        return { ...structuredClone(document), type: document.type ?? "object", properties: { ...structuredClone(properties), [name]: manualLeaf(definition) } };
    const child = properties[name] ?? { type: "object", propertyOrigin: "manual" };
    return { ...structuredClone(document), type: document.type ?? "object", properties: { ...structuredClone(properties), [name]: addAtPath(child, rest, definition) } };
}
export function manualPropertyContainerAction(document, path) {
    const parsed = parsePath(path);
    const container = propertyAt(document, parsed.segments);
    if (container?.type === "object")
        return { label: "Add child property", parentPath: parsed.normalizedPath };
    if (container?.type === "array" && container.items?.type === "object") {
        return { label: "Add item property", parentPath: `${parsed.normalizedPath}/*` };
    }
    return undefined;
}
export function contextualManualPropertyDefinition(parentPath, childName, type, arrayItemType) {
    const parent = parsePath(parentPath).normalizedPath;
    const child = childName.trim();
    const contextualChild = child === "*" || child.includes("/") || child.includes(".") ? "" : child;
    return {
        path: `${parent}/${contextualChild}`,
        type,
        ...(type === "array" && arrayItemType ? { arrayItemType } : {}),
    };
}
export function addManualProperty(document, inheritedDocuments, definition) {
    const inspection = inspectManualProperty(document, inheritedDocuments, definition);
    if (inspection.result === "blocked")
        throw new Error(inspection.assistance);
    return addAtPath(document, parsePath(definition.path).segments, definition);
}
export function manualPropertyPreview(definition) {
    const path = parsePath(definition.path).segments.join(".");
    return definition.type === "array" && definition.arrayItemType
        ? `${path} is an array of ${definition.arrayItemType}`
        : `${path} is ${definition.type}`;
}
//# sourceMappingURL=data-layer-schema-manual-property.js.map