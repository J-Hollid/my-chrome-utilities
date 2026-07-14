function countText(count, singular) {
    return `${count} ${singular}${count === 1 ? "" : "s"}`;
}
export function validationVisual(state) {
    if (state === "Valid")
        return { badgeText: state, symbol: "✓", symbolName: "check", treatment: "pass", summary: "Validation passed" };
    if (state === "Not checked")
        return { badgeText: state, symbol: "○", symbolName: "neutral", treatment: "neutral", summary: "Validation not checked" };
    if (state === "Assignment error")
        return { badgeText: state, symbol: "!", symbolName: "error", treatment: "assignment-error", summary: "Validation assignment error" };
    const errors = Number(state.match(/(\d+) errors?/)?.[1] ?? (state.endsWith("issues") ? state.match(/\d+/)?.[0] : 0));
    const warnings = Number(state.match(/(\d+) warnings?/)?.[1] ?? (state.endsWith("warnings") ? state.match(/\d+/)?.[0] : 0));
    if (errors) {
        const counts = warnings ? `${countText(errors, "error")}, and ${countText(warnings, "warning")}` : countText(errors, "error");
        return { badgeText: state, symbol: "!", symbolName: "error", treatment: "error", summary: `Validation failed, ${counts}` };
    }
    if (warnings)
        return { badgeText: state, symbol: "⚠", symbolName: "warning", treatment: "warning", summary: `Validation completed with ${countText(warnings, "warning")}` };
    return { badgeText: state, symbol: "○", symbolName: "neutral", treatment: "neutral", summary: state };
}
export function propertyValidationSummary(evaluations) {
    const errors = evaluations.filter(({ status }) => status === "error").length;
    const warnings = evaluations.filter(({ status }) => status === "warning").length;
    const passed = evaluations.filter(({ status }) => status === "pass").length;
    const notApplicable = evaluations.filter(({ status }) => status === "not-applicable").length;
    if (errors)
        return { status: warnings ? `${countText(errors, "error")} and ${countText(warnings, "warning")}` : countText(errors, "error"), symbolName: "error", treatment: "error", errors, warnings, passed };
    if (warnings)
        return { status: countText(warnings, "warning"), symbolName: "warning", treatment: "warning", errors, warnings, passed };
    if (passed)
        return { status: `${countText(passed, "rule")} passed`, symbolName: "check", treatment: "pass", errors, warnings, passed };
    if (notApplicable)
        return { status: `${countText(notApplicable, "rule")} not applicable`, symbolName: "neutral", treatment: "neutral", errors, warnings, passed };
    return { status: "No rules", symbolName: "neutral", treatment: "neutral", errors, warnings, passed };
}
function normalizedPath(path) {
    return path.replace(/^\//, "").replaceAll("/", ".");
}
function valueLabel(value) {
    if (value === undefined)
        return "Missing";
    if (value !== null && typeof value === "object")
        return Array.isArray(value) ? `${value.length} items` : `${Object.keys(value).length} properties`;
    return String(value);
}
function issueEvaluation(issue) {
    const ruleMatch = (issue.rule ?? "Schema rule").match(/^(.*?)(?: v(\d+))?$/);
    return {
        propertyPath: normalizedPath(issue.instancePath),
        status: issue.severity === "warning" ? "warning" : "error",
        message: issue.conditionSummary ? `${issue.message} · condition ${issue.conditionSummary}` : issue.message,
        expected: issue.expected,
        actual: issue.actual,
        rule: ruleMatch?.[1] ?? "Schema rule",
        ruleVersion: Number(ruleMatch?.[2] ?? 0),
        severity: issue.severity ?? "error",
        schemaName: issue.schemaName,
        schemaVersion: issue.schemaVersion,
    };
}
export function buildValidationPropertyTree(payload, evaluations, issues) {
    const issueEvaluations = issues.map(issueEvaluation).filter((issue) => !evaluations.some((evaluation) => normalizedPath(evaluation.propertyPath) === normalizedPath(issue.propertyPath)
        && evaluation.message === issue.message));
    const allEvaluations = [...evaluations, ...issueEvaluations];
    const byPath = new Map();
    for (const evaluation of allEvaluations) {
        const path = normalizedPath(evaluation.propertyPath);
        byPath.set(path, [...(byPath.get(path) ?? []), { ...evaluation }]);
    }
    const records = payload && typeof payload === "object" ? payload : { value: payload };
    function node(name, value, path) {
        const children = value !== null && typeof value === "object"
            ? Object.entries(value).map(([childName, childValue]) => node(childName, childValue, `${path}.${childName}`))
            : [];
        const direct = byPath.get(path) ?? [];
        const descendantPaths = [...byPath.keys()].filter((candidate) => candidate.startsWith(`${path}.`));
        const expectedChildren = [...new Set(descendantPaths.map((candidate) => candidate.slice(path.length + 1).split(".")[0]).filter((candidate) => Boolean(candidate)))];
        for (const childName of expectedChildren) {
            if (!children.some((child) => child.name === childName))
                children.push(node(childName, undefined, `${path}.${childName}`));
        }
        const aggregate = children.reduce((counts, child) => ({
            errors: counts.errors + child.summary.errors + child.aggregate.errors,
            warnings: counts.warnings + child.summary.warnings + child.aggregate.warnings,
        }), { errors: 0, warnings: 0 });
        return { path, name, value, valueLabel: valueLabel(value), missing: value === undefined, evaluations: direct, summary: propertyValidationSummary(direct), aggregate, children };
    }
    const roots = Object.entries(records).map(([name, value]) => node(name, value, name));
    const missingRoots = [...new Set([...byPath.keys()].map((path) => path.split(".")[0]).filter((candidate) => Boolean(candidate)))];
    for (const name of missingRoots)
        if (!roots.some((root) => root.name === name))
            roots.push(node(name, undefined, name));
    return roots;
}
function hasApplicableEvidence(node) {
    return node.evaluations.some(({ status }) => status !== "not-applicable")
        || node.children.some(hasApplicableEvidence)
        || (node.specificItems ?? []).some(hasApplicableEvidence);
}
function presentPropertyNode(node, showNonApplicable) {
    const children = node.children
        .map((child) => presentPropertyNode(child, showNonApplicable))
        .filter((child) => Boolean(child));
    const specificItems = (node.specificItems ?? [])
        .map((child) => presentPropertyNode(child, showNonApplicable))
        .filter((child) => Boolean(child));
    if (!showNonApplicable && node.missing && !hasApplicableEvidence(node))
        return undefined;
    const evaluations = showNonApplicable
        ? node.evaluations
        : node.evaluations.filter(({ status }) => status !== "not-applicable");
    const summary = propertyValidationSummary(evaluations);
    const displayedSummary = !showNonApplicable && !node.missing && evaluations.length === 0
        && node.evaluations.some(({ status }) => status === "not-applicable")
        ? { ...summary, status: "No applicable rules" }
        : summary;
    const aggregate = [...children, ...specificItems].reduce((counts, child) => ({
        errors: counts.errors + child.summary.errors + child.aggregate.errors,
        warnings: counts.warnings + child.summary.warnings + child.aggregate.warnings,
    }), { errors: 0, warnings: 0 });
    return { ...node, evaluations, summary: displayedSummary, aggregate, children, specificItems };
}
export function presentValidationPropertyTree(nodes, showNonApplicable) {
    return nodes
        .map((node) => presentPropertyNode(node, showNonApplicable))
        .filter((node) => Boolean(node));
}
//# sourceMappingURL=data-layer-live-validation-presentation.js.map