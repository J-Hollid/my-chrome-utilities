const options = [
    { kind: "starts-with", label: "Starts with" },
    { kind: "ends-with", label: "Ends with" },
    { kind: "includes", label: "Includes" },
];
const equalityOperators = ["Equals", "Does not equal"];
const stringOperators = [...equalityOperators, "Starts with", "Does not start with", "Ends with", "Does not end with", "Includes", "Does not include"];
const legacyOperators = { "starts-with": "Starts with", "ends-with": "Ends with", "includes": "Includes" };
export const valueOperatorOptions = (propertyType) => propertyType?.toLocaleLowerCase() === "string" ? [...stringOperators] : ["number", "integer", "boolean"].includes(propertyType?.toLocaleLowerCase() ?? "") ? [...equalityOperators] : [];
export function valueRuleOperand(propertyType, value) {
    if (propertyType?.toLocaleLowerCase() === "boolean")
        return value === "true";
    if (["number", "integer"].includes(propertyType?.toLocaleLowerCase() ?? "")) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || propertyType?.toLocaleLowerCase() === "integer" && !Number.isInteger(numeric))
            return undefined;
        return numeric;
    }
    return value;
}
export function normalizeValueRule(rule) {
    if (!isStringLiteralRuleKind(rule.kind))
        return structuredClone(rule);
    const { literal, ...retained } = structuredClone(rule);
    return { ...retained, kind: "value", operator: legacyOperators[rule.kind], expectedValue: literal };
}
export function valueRuleMatches(operator, actual, operand) {
    const equal = actual === operand, value = String(actual ?? ""), expected = String(operand ?? "");
    if (operator === "Equals")
        return equal;
    if (operator === "Does not equal")
        return !equal;
    if (operator === "Starts with")
        return value.startsWith(expected);
    if (operator === "Does not start with")
        return !value.startsWith(expected);
    if (operator === "Ends with")
        return value.endsWith(expected);
    if (operator === "Does not end with")
        return !value.endsWith(expected);
    if (operator === "Includes")
        return value.includes(expected);
    if (operator === "Does not include")
        return !value.includes(expected);
    return false;
}
export function valueRuleRequirement(operator, operand) {
    const value = String(operand ?? "");
    if (operator === "Equals")
        return `equal ${value}`;
    if (operator === "Does not equal")
        return `not equal ${value}`;
    if (operator === "Starts with")
        return `start with ${value}`;
    if (operator === "Does not start with")
        return `not start with ${value}`;
    if (operator === "Ends with")
        return `end with ${value}`;
    if (operator === "Does not end with")
        return `not end with ${value}`;
    if (operator === "Includes")
        return `include ${value}`;
    if (operator === "Does not include")
        return `not include ${value}`;
    return value;
}
export const stringRuleKindOptions = (propertyType) => propertyType?.toLocaleLowerCase() === "string" ? options.map((option) => ({ ...option })) : [];
export const isStringLiteralRuleKind = (kind) => options.some((option) => option.kind === kind);
export function stringRuleMatches(kind, actual, literal) {
    const value = String(actual ?? ""), expected = String(literal ?? "");
    if (kind === "starts-with")
        return value.startsWith(expected);
    if (kind === "ends-with")
        return value.endsWith(expected);
    if (kind === "includes")
        return value.includes(expected);
    return false;
}
export function stringRuleRequirement(kind, literal) {
    const value = String(literal ?? "");
    if (kind === "starts-with")
        return `start with ${value}`;
    if (kind === "ends-with")
        return `end with ${value}`;
    if (kind === "includes")
        return `include ${value}`;
    return value;
}
export function regularExpressionIssue(expression) {
    const value = String(expression ?? "");
    if (!value.trim())
        return "Enter a regular expression";
    try {
        new RegExp(value);
        return undefined;
    }
    catch (error) {
        return `Invalid regular expression: ${error instanceof Error ? error.message : String(error)}`;
    }
}
export function regularExpressionTest(expression, sample) {
    const issue = regularExpressionIssue(expression);
    if (issue)
        return issue === "Enter a regular expression" ? { state: "empty", text: "" } : { state: "invalid", text: issue };
    if (String(sample ?? "") === "")
        return { state: "empty", text: "" };
    return new RegExp(String(expression)).test(String(sample))
        ? { state: "match", text: "Matches pattern", treatment: "valid-green" }
        : { state: "no-match", text: "Does not match pattern", treatment: "invalid-red" };
}
//# sourceMappingURL=data-layer-string-rule-validation.js.map