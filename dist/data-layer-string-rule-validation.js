const options = [
    { kind: "starts-with", label: "Starts with" },
    { kind: "ends-with", label: "Ends with" },
    { kind: "includes", label: "Includes" },
];
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