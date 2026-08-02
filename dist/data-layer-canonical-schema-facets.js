const clone = (value) => structuredClone(value);
const typeLabel = (type) => type[0].toUpperCase() + type.slice(1);
const valueMatches = (value, type) => {
    if (type === "null")
        return value === null;
    if (type === "array")
        return Array.isArray(value);
    if (type === "object")
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    if (type === "integer")
        return Number.isInteger(value);
    if (type === "number")
        return typeof value === "number" && Number.isFinite(value);
    return typeof value === type;
};
const validateItem = (value, schema, indexPath) => {
    if (schema.type && !valueMatches(value, schema.type))
        throw new Error(`Item ${indexPath.map((index) => index + 1).join(".")}: Expected ${typeLabel(schema.type)}.`);
    if (schema.type === "array" && schema.items && Array.isArray(value))
        value.forEach((item, index) => validateItem(item, schema.items, [...indexPath, index]));
    if (schema.allowedValues?.length && !schema.allowedValues.some((candidate) => JSON.stringify(candidate) === JSON.stringify(value)))
        throw new Error(`Item ${indexPath.map((index) => index + 1).join(".")}: Expected one of ${schema.allowedValues.map(String).join(", ")}.`);
};
/** Parse a facet input using the selected canonical property type. */
export function typedCanonicalValue(type, text, itemSchema) {
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
        if (type === "array" && itemSchema)
            for (const [index, item] of value.entries())
                validateItem(item, itemSchema, [index]);
        return clone(value);
    }
    if (type === "string" && text.startsWith('"')) {
        let value;
        try {
            value = JSON.parse(text);
        }
        catch {
            throw new Error("Enter a valid quoted String literal.");
        }
        if (typeof value !== "string")
            throw new Error("Enter a String.");
        return value;
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
export function repairCanonicalBooleanAllowedValues(node, nextType) {
    if (nextType !== "boolean" || !node.allowedValues.length || node.type !== "string" && node.type !== "boolean")
        return { allowedValues: node.allowedValues, repairCount: 0 };
    let repairCount = 0;
    const allowedValues = node.allowedValues.map((entry) => {
        if (typeof entry.value === "boolean")
            return entry;
        if (entry.value !== "true" && entry.value !== "false")
            throw new Error(`${canonicalFacetText(entry.value)} is not a Boolean.`);
        repairCount += 1;
        return { ...entry, value: entry.value === "true" };
    });
    return { allowedValues: repairCount ? allowedValues : node.allowedValues, repairCount };
}
//# sourceMappingURL=data-layer-canonical-schema-facets.js.map