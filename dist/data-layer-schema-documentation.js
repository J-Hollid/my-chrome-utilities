function pathSegments(path) {
    return path.replaceAll(".", "/").split("/").map((segment) => segment.trim()).filter(Boolean);
}
export function canonicalDocumentationPath(path, wildcardNumeric = false) {
    return `/${pathSegments(path).map((segment) => wildcardNumeric && /^\d+$/.test(segment) ? "*" : segment).join("/")}`;
}
function cleanText(value) {
    return value?.trim() ?? "";
}
export function setSchemaDescription(documentation, description) {
    const next = cleanText(description);
    const properties = documentation.properties && Object.keys(documentation.properties).length
        ? structuredClone(documentation.properties)
        : undefined;
    return {
        ...(next ? { description: next } : {}),
        ...(properties ? { properties } : {}),
    };
}
export function setPropertyDocumentation(documentation, path, entry) {
    const canonicalPath = canonicalDocumentationPath(path);
    const displayName = cleanText(entry.displayName);
    const description = cleanText(entry.description);
    const comments = cleanText(entry.comments);
    const example = entry.example ? structuredClone(entry.example) : undefined;
    const properties = structuredClone(documentation.properties ?? {});
    if (displayName || description || comments || example)
        properties[canonicalPath] = { displayName, description, ...(comments ? { comments } : {}), ...(example ? { example } : {}) };
    else
        delete properties[canonicalPath];
    return {
        ...(documentation.description ? { description: documentation.description } : {}),
        ...(Object.keys(properties).length ? { properties } : {}),
    };
}
export function removePropertyDocumentation(documentation, path) {
    const canonicalPath = canonicalDocumentationPath(path);
    const properties = Object.fromEntries(Object.entries(documentation.properties ?? {})
        .filter(([candidate]) => candidate !== canonicalPath && !candidate.startsWith(`${canonicalPath}/`))
        .map(([candidate, entry]) => [candidate, structuredClone(entry)]));
    return {
        ...(documentation.description ? { description: documentation.description } : {}),
        ...(Object.keys(properties).length ? { properties } : {}),
    };
}
function identity(schema) {
    return { id: schema.id, name: schema.name, version: schema.version };
}
export function resolveEffectiveSchemaDocumentation(schema, schemas) {
    const chain = [];
    const visited = new Set();
    let current = schema;
    while (current && !visited.has(current.id)) {
        visited.add(current.id);
        chain.unshift(current);
        current = current.parentSchemaId
            ? schemas.find((candidate) => candidate.id === current?.parentSchemaId)
            : undefined;
    }
    const properties = {};
    let description;
    let descriptionOrigin;
    for (const owner of chain) {
        if (owner.documentation?.description) {
            description = owner.documentation.description;
            descriptionOrigin = identity(owner);
        }
        for (const [path, entry] of Object.entries(owner.documentation?.properties ?? {})) {
            const mappingPath = canonicalDocumentationPath(path);
            properties[mappingPath] = {
                ...structuredClone(entry),
                mappingPath,
                origin: identity(owner),
                inherited: owner.id !== schema.id,
            };
        }
    }
    return {
        ...(description && descriptionOrigin ? { description, descriptionOrigin } : {}),
        properties,
    };
}
function mappingMatches(mappingPath, concretePath) {
    const mapping = pathSegments(mappingPath);
    const concrete = pathSegments(concretePath);
    return mapping.length === concrete.length
        && mapping.every((segment, index) => segment === "*" || segment === concrete[index]);
}
export function resolvePropertyDocumentation(documentation, path) {
    const canonicalPath = canonicalDocumentationPath(path);
    return documentation.properties[canonicalPath]
        ?? Object.values(documentation.properties).find(({ mappingPath }) => mappingMatches(mappingPath, canonicalPath));
}
export function schemaDocumentationSearchText(path, documentation) {
    return [canonicalDocumentationPath(path), documentation?.displayName, documentation?.description]
        .filter(Boolean).join(" ").toLowerCase();
}
//# sourceMappingURL=data-layer-schema-documentation.js.map