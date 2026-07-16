function isAllowedValuesOperator(operator) {
    return operator?.trim().replaceAll("_", "-").replaceAll(" ", "-").toLowerCase() === "allowed-values";
}
function convertToken(token, type) {
    if (type === "number") {
        if (!token || !Number.isFinite(Number(token)))
            return undefined;
        return Number(token);
    }
    if (type === "boolean") {
        if (token === "true")
            return true;
        if (token === "false")
            return false;
        return undefined;
    }
    return token;
}
export function normalizeAllowedValuesRule(rule, type) {
    if (!isAllowedValuesOperator(rule.operator))
        return structuredClone(rule);
    if (rule.allowedValues !== undefined) {
        const { parameters: _parameters, migrationIssue: _migrationIssue, ...canonical } = structuredClone(rule);
        return canonical;
    }
    if (rule.parameters === undefined)
        return structuredClone(rule);
    const tokens = rule.parameters.split(",").map((token) => token.trim()).filter(Boolean);
    const converted = tokens.map((token) => convertToken(token, type));
    const invalidIndex = converted.findIndex((value) => value === undefined);
    if (invalidIndex >= 0)
        return { ...structuredClone(rule), migrationIssue: `Allowed values migration could not convert ${tokens[invalidIndex]} to ${type ?? "string"}` };
    const { parameters: _parameters, migrationIssue: _migrationIssue, ...withoutLegacy } = structuredClone(rule);
    return { ...withoutLegacy, allowedValues: converted };
}
export function typedAllowedValues(values, type) {
    const tokens = values.map((value) => value.trim()).filter(Boolean);
    const converted = tokens.map((token) => convertToken(token, type));
    if (converted.some((value) => value === undefined))
        throw new Error(`Allowed values must all be valid ${type ?? "string"} values.`);
    return converted;
}
export function allowedValuesRuleLibraryMetadata(rule) {
    if (!isAllowedValuesOperator(rule.operator) || rule.allowedValues === undefined)
        return undefined;
    return `Allowed values: ${rule.allowedValues.map(String).join(", ")}`;
}
export function allowedValuesRuleLibrarySearchText(rule) {
    return isAllowedValuesOperator(rule.operator) && rule.allowedValues !== undefined
        ? rule.allowedValues.map(String).join(" ")
        : "";
}
//# sourceMappingURL=data-layer-allowed-values-rule.js.map