const clone = (value) => structuredClone(value);
/** Parse a facet input using the selected canonical property type. */
export function typedCanonicalValue(type, text) {
    if (type === "number") {
        const value = Number(text);
        if (!Number.isFinite(value))
            throw new Error("Enter a number.");
        return value;
    }
    if (type === "integer") {
        const value = Number(text);
        if (!Number.isInteger(value))
            throw new Error("Enter a whole number.");
        return value;
    }
    if (type === "boolean") {
        if (text !== "true" && text !== "false")
            throw new Error("Enter true or false.");
        return text === "true";
    }
    if (type === "null")
        return null;
    if (type === "array" || type === "object") {
        let value;
        try {
            value = JSON.parse(text);
        }
        catch {
            throw new Error(`Enter valid JSON for ${type}.`);
        }
        if (type === "array" && !Array.isArray(value) || type === "object" && (!value || typeof value !== "object" || Array.isArray(value)))
            throw new Error(`Enter a JSON ${type}.`);
        return clone(value);
    }
    return text;
}
export function canonicalFacetText(value) {
    if (value === undefined)
        return "";
    if (typeof value === "string")
        return value;
    const serialized = JSON.stringify(value);
    return serialized === undefined ? String(value) : serialized;
}
//# sourceMappingURL=data-layer-canonical-schema-facets.js.map