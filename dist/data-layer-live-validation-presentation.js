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
function pointerSegments(path) { return path.split("/").filter(Boolean); }
function canonicalArrayPath(path) { return `/${pointerSegments(path).map((part) => /^\d+$/.test(part) ? "*" : part).join("/")}`; }
function readableEvaluationCounts(counts) {
    return [counts.passed ? `${counts.passed} passed` : "", counts.warnings ? `${counts.warnings} warning${counts.warnings === 1 ? "" : "s"}` : "", counts.errors ? `${counts.errors} error${counts.errors === 1 ? "" : "s"}` : "", counts.notApplicable ? `${counts.notApplicable} not applicable` : ""].filter(Boolean).join(" and ");
}
export function applyArrayValidationRollups(nodes, evaluations) {
    const wildcard = evaluations.filter((evaluation) => evaluation.templatePath?.includes("*"));
    const visit = (source) => {
        const path = source.technicalPath ?? `/${source.path.replaceAll(".", "/")}`;
        const canonical = canonicalArrayPath(path);
        const pathParts = pointerSegments(path);
        const hasConcreteIndex = pathParts.some((part) => /^\d+$/.test(part));
        const canonicalWildcardCount = pointerSegments(canonical).filter((part) => part === "*").length;
        const candidates = wildcard.filter(({ templatePath }) => {
            if (!(templatePath === canonical || templatePath?.startsWith(`${canonical}/`)))
                return false;
            return !hasConcreteIndex || pointerSegments(templatePath ?? "").filter((part) => part === "*").length > canonicalWildcardCount;
        });
        const specificItems = (source.specificItems ?? []).map(visit);
        const affectedItems = specificItems.filter((item) => candidates.some((evaluation) => (evaluation.status === "error" || evaluation.status === "warning") && (evaluation.propertyPath === item.technicalPath || evaluation.propertyPath.startsWith(`${item.technicalPath}/`))));
        const children = source.children.map(visit);
        if (!candidates.length)
            return { ...source, children, specificItems };
        const affected = candidates.filter(({ status }) => status === "error" || status === "warning");
        const wildcardIndexes = affected.map((evaluation) => {
            const template = pointerSegments(evaluation.templatePath ?? "");
            const concrete = pointerSegments(evaluation.propertyPath);
            const indexes = template.map((part, index) => part === "*" ? index : -1).filter((index) => index >= 0);
            const index = hasConcreteIndex ? indexes[canonicalWildcardCount] : canonicalWildcardCount ? indexes[canonicalWildcardCount - 1] : indexes[0];
            return index === undefined ? undefined : concrete[index];
        }).filter((part) => part !== undefined);
        const totalItemCount = source.specificItems?.length || source.matchedValueCount || new Set(candidates.map((evaluation) => evaluation.propertyPath)).size;
        const rollup = {
            errors: candidates.filter(({ status }) => status === "error").length,
            warnings: candidates.filter(({ status }) => status === "warning").length,
            passed: candidates.filter(({ status }) => status === "pass").length,
            notApplicable: candidates.filter(({ status }) => status === "not-applicable").length,
            affectedItemCount: new Set(wildcardIndexes).size,
            totalItemCount,
            affectedPaths: [...new Set(affected.map(({ propertyPath }) => propertyPath))],
            ruleCount: new Set(candidates.map(({ ruleId, rule, ruleVersion }) => ruleId ?? `${rule}:${ruleVersion}`)).size,
        };
        const exact = wildcard.filter(({ templatePath }) => templatePath === canonical);
        const summary = exact.length ? { ...propertyValidationSummary(exact), status: readableEvaluationCounts(rollup) } : source.summary;
        return { ...source, evaluations: exact.length ? exact : source.evaluations, summary, aggregate: { errors: rollup.errors, warnings: rollup.warnings }, children, specificItems, affectedItems, rollup };
    };
    return nodes.map(visit);
}
//# sourceMappingURL=data-layer-live-validation-presentation.js.map