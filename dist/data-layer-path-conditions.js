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
//# sourceMappingURL=data-layer-path-conditions.js.map