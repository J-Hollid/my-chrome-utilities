export const clone = (value) => structuredClone(value);
export const semanticallyPopulated = (value) => { if (value === undefined || value === null)
    return false; if (Array.isArray(value))
    return value.some(semanticallyPopulated); if (typeof value === "string")
    return value.trim().length > 0; if (typeof value !== "object")
    return true; return Object.entries(value).some(([key, entry]) => { if (key === "type" && entry === "object")
    return false; if (key === "properties" && entry && typeof entry === "object" && !Array.isArray(entry))
    return Object.keys(entry).length > 0; return semanticallyPopulated(entry); }); };
export const definitionAtPath = (definitions, path, definition, provenance) => { const values = definitions.get(path) ?? []; values.push({ definition, provenance }); definitions.set(path, values); };
export const collectStructured = (definitions, document, source, parent = "") => { const properties = document.properties, required = new Set(document.required ?? []); for (const [name, definition] of Object.entries(properties ?? {})) {
    const path = `${parent}/${name}`, normalized = required.has(name) ? { ...definition, required: true } : definition;
    definitionAtPath(definitions, path, normalized, { source });
    if (definition.type === "array" && definition.items && typeof definition.items === "object") {
        const items = definition.items;
        if (items.type === "object" || items.properties)
            collectStructured(definitions, items, source, path);
    }
    else if (definition.type === "object" || definition.properties)
        collectStructured(definitions, definition, source, path);
} };
export const explicitValues = (defs, read) => { const values = []; for (const { definition, provenance } of defs) {
    const value = read(definition);
    if (value === undefined)
        continue;
    const prior = values.find((candidate) => JSON.stringify(candidate.value) === JSON.stringify(value));
    if (prior)
        prior.sources.push(provenance.source);
    else
        values.push({ value: clone(value), sources: [provenance.source] });
} return values; };
export const canonicalRules = (definition, path, source, profileId) => { const given = (definition.rules ?? definition["x-rules"]) ?? [], patterns = [...definition.patterns ?? [], ...(typeof definition.pattern === "string" ? [definition.pattern] : [])], facetId = (kind, index) => `json-facet:${profileId}:${encodeURIComponent(path)}:${source}:${kind}${index === undefined ? "" : `:${index}`}`, range = definition.minimum !== undefined || definition.maximum !== undefined ? [{ id: facetId("range"), kind: "range", severity: "error", message: "Outside migrated range", ...(typeof definition.minimum === "number" ? { minimum: definition.minimum } : {}), ...(typeof definition.maximum === "number" ? { maximum: definition.maximum } : {}) }] : [], cardinality = definition.minItems !== undefined || definition.maxItems !== undefined ? [{ id: facetId("cardinality"), kind: "cardinality", severity: "error", message: "Outside migrated cardinality", ...(typeof definition.minItems === "number" ? { minItems: definition.minItems } : {}), ...(typeof definition.maxItems === "number" ? { maxItems: definition.maxItems } : {}) }] : []; return [...given.map(clone), ...patterns.map((pattern, index) => ({ id: facetId("pattern", index), kind: "pattern", pattern, severity: "error", message: "Pattern mismatch" })), ...range, ...cardinality]; };
//# sourceMappingURL=migration-helpers.js.map