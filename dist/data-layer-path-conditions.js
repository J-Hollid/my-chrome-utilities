function pathnameOf(pathOrUrl) {
    try {
        return new URL(pathOrUrl).pathname || "/";
    }
    catch {
        return pathOrUrl.split(/[?#]/, 1)[0] || "/";
    }
}
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function globMatches(value, pattern) {
    if (!pattern || pattern === "any")
        return true;
    const expression = `^${pattern.split("*").map(escapeRegex).join(".*")}$`;
    return new RegExp(expression, "i").test(value);
}
export function pathConditionResult(condition, pathOrUrl) {
    const pathname = pathnameOf(pathOrUrl);
    try {
        const pattern = condition.matchType === "Exact path"
            ? new RegExp(`^${escapeRegex(condition.expression)}$`)
            : condition.matchType === "Path pattern"
                ? new RegExp(`^${condition.expression.split("*").map(escapeRegex).join(".*")}$`)
                : new RegExp(condition.expression);
        return { valid: true, matches: pattern.test(pathname) };
    }
    catch (error) {
        return { valid: false, matches: false, error: error instanceof Error ? error.message : "Invalid regular expression" };
    }
}
export function pathConditionsResult(conditions, pathOrUrl) {
    for (const condition of conditions) {
        const result = pathConditionResult(condition, pathOrUrl);
        if (!result.valid)
            return result;
        if (result.matches)
            return { ...result, matchingCondition: condition };
    }
    return { valid: true, matches: false };
}
export function urlConditionsMatch(pageUrl, conditions) {
    const url = new URL(pageUrl);
    const pathMatches = conditions.pathConditions?.length
        ? conditions.pathConditions.some((condition) => pathConditionResult(condition, url.pathname).matches)
        : globMatches(url.pathname, conditions.pathnameCondition);
    return globMatches(url.hostname, conditions.domainCondition) && pathMatches;
}
//# sourceMappingURL=data-layer-path-conditions.js.map