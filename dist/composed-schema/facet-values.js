const clone = (value) => structuredClone(value);
export function typedComposedValue(type, text) {
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
        return value;
    }
    return text;
}
export function addComposedAllowedValue(draft, value) { return { ...draft, allowedValues: [...draft.allowedValues, clone(value)] }; }
export function removeComposedAllowedValue(draft, index) { return { ...draft, allowedValues: draft.allowedValues.filter((_, candidate) => candidate !== index) }; }
export function moveComposedAllowedValue(draft, index, delta) { const target = index + delta; if (target < 0 || target >= draft.allowedValues.length)
    return draft; const allowedValues = clone(draft.allowedValues); [allowedValues[index], allowedValues[target]] = [allowedValues[target], allowedValues[index]]; return { ...draft, allowedValues }; }
//# sourceMappingURL=facet-values.js.map