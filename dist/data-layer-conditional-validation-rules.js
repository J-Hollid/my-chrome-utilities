import { parseTargetExpression } from "./data-layer-recursive-property-tree.js";
const existenceOperators = ["Exists", "Does not exist"];
const equalityOperators = ["Equals", "Does not equal", "Is one of"];
const numericOperators = ["Is greater than", "Is at least", "Is less than", "Is at most"];
export function typedComparisonValue(value) {
    return { type: value === null ? "null" : typeof value, value };
}
export function comparisonValueFromInput(input, type) {
    const value = input.trim();
    if (!value)
        return undefined;
    if (type === "number") {
        const number = Number(value);
        return Number.isFinite(number) ? typedComparisonValue(number) : undefined;
    }
    if (type === "boolean") {
        return value === "true" ? typedComparisonValue(true)
            : value === "false" ? typedComparisonValue(false)
                : undefined;
    }
    if (type === "null")
        return value === "null" ? typedComparisonValue(null) : undefined;
    return type === "string" ? typedComparisonValue(input) : undefined;
}
export function operatorsForConditionType(type) {
    if (type === "string")
        return [...existenceOperators, ...equalityOperators, "Matches pattern"];
    if (type === "number")
        return [...existenceOperators, ...equalityOperators, ...numericOperators];
    if (type === "boolean" || type === "null")
        return [...existenceOperators, ...equalityOperators];
    return existenceOperators;
}
function sameTypedValue(observed, comparison) {
    return comparison !== undefined
        && (observed === null ? "null" : typeof observed) === comparison.type
        && Object.is(observed, comparison.value);
}
export function evaluateConditionPredicate(observed, predicate) {
    if (predicate.operator === "Exists")
        return observed.exists;
    if (predicate.operator === "Does not exist")
        return !observed.exists;
    if (!observed.exists)
        return false;
    if (predicate.operator === "Equals")
        return sameTypedValue(observed.value, predicate.comparison);
    if (predicate.operator === "Does not equal")
        return !sameTypedValue(observed.value, predicate.comparison);
    if (predicate.operator === "Is one of")
        return predicate.comparisons?.some((value) => sameTypedValue(observed.value, value)) ?? false;
    if (predicate.operator === "Matches pattern") {
        if (typeof observed.value !== "string" || predicate.comparison?.type !== "string")
            return false;
        try {
            return new RegExp(String(predicate.comparison.value)).test(observed.value);
        }
        catch {
            return false;
        }
    }
    if (typeof observed.value !== "number" || predicate.comparison?.type !== "number")
        return false;
    const configured = predicate.comparison.value;
    if (predicate.operator === "Is greater than")
        return observed.value > configured;
    if (predicate.operator === "Is at least")
        return observed.value >= configured;
    if (predicate.operator === "Is less than")
        return observed.value < configured;
    return observed.value <= configured;
}
export function conditionGroupApplies(group, evaluate) {
    return group.operator === "All"
        ? group.predicates.every(evaluate)
        : group.predicates.some(evaluate);
}
function pointerSegments(path) {
    return path.replace(/^\//, "").split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}
export function conditionValueAtPath(value, path) {
    let current = value;
    for (const segment of pointerSegments(path)) {
        if (current === null || typeof current !== "object" || !(segment in current))
            return { value: undefined, exists: false };
        current = current[segment];
    }
    return { value: current, exists: true };
}
export function conditionGroupAppliesToValue(value, group) {
    return conditionGroupApplies(group, (predicate) => evaluateConditionPredicate(conditionValueAtPath(value, predicate.propertyPath), predicate));
}
function wildcardIndexes(segments) {
    return segments.flatMap((segment, index) => segment === "*" ? [index] : []);
}
function sharesWildcardContext(candidate, template, wildcardIndex) {
    return candidate[wildcardIndex] === "*"
        && candidate.slice(0, wildcardIndex).every((segment, index) => segment === template[index]);
}
function correlatedPredicatePath(predicatePath, consequenceTemplatePath, consequenceConcretePath) {
    const predicate = pointerSegments(predicatePath);
    const template = pointerSegments(consequenceTemplatePath);
    const concrete = pointerSegments(consequenceConcretePath);
    const templateWildcards = wildcardIndexes(template);
    const predicateWildcards = wildcardIndexes(predicate);
    if (!predicateWildcards.length || predicateWildcards.length > templateWildcards.length)
        return predicatePath;
    const sharesContexts = predicateWildcards.every((index, ordinal) => templateWildcards[ordinal] === index && sharesWildcardContext(predicate, template, index));
    if (!sharesContexts)
        return predicatePath;
    let wildcard = 0;
    return `/${predicate.map((segment) => segment === "*" ? concrete[templateWildcards[wildcard++]] : segment).join("/")}`;
}
export function conditionGroupAppliesToConsequence(value, group, consequenceTemplatePath, consequenceConcretePath) {
    return conditionGroupApplies(group, (predicate) => {
        const path = correlatedPredicatePath(predicate.propertyPath, consequenceTemplatePath, consequenceConcretePath);
        return evaluateConditionPredicate(conditionValueAtPath(value, path), predicate);
    });
}
export function evaluateConditionalRule(value, rule, evaluateConsequence) {
    if (!conditionGroupAppliesToValue(value, rule.conditionGroup))
        return { result: "Not applicable", invocationCount: 0 };
    return { result: evaluateConsequence(rule.consequence) ? "Passed" : "Failed", invocationCount: 1 };
}
function pathLabel(path) {
    if (path.startsWith("$")) {
        return parseTargetExpression(path).map((segment) => segment.kind === "property" ? String(segment.value) : segment.kind === "every" ? "*" : String(segment.value)).join(".");
    }
    return pointerSegments(path).join(".");
}
function configuredLabel(predicate) {
    if (predicate.operator === "Is one of")
        return predicate.comparisons?.map(({ value }) => String(value)).join(", ") ?? "";
    return predicate.comparison ? String(predicate.comparison.value) : "";
}
export function conditionPredicateSummary(predicate) {
    const suffix = configuredLabel(predicate);
    return `${pathLabel(predicate.propertyPath)} ${predicate.operator.toLowerCase()}${suffix ? ` ${suffix}` : ""}`;
}
function consequenceSummary(consequence) {
    const path = pathLabel(consequence.propertyPath);
    const operator = consequence.operator.replaceAll("_", "-").toLowerCase();
    if (operator === "item-count")
        return `${path} must contain at least ${consequence.parameters ?? "0"} item` + (consequence.parameters === "1" ? "" : "s");
    if (operator === "required")
        return `${path} must be present`;
    if (operator === "exact-value")
        return `${path} must equal ${consequence.parameters ?? ""}`;
    return `${path} must satisfy ${operator}${consequence.parameters ? ` ${consequence.parameters}` : ""}`;
}
export function conditionalRuleSummary(rule) {
    const conjunction = rule.conditionGroup.operator === "All" ? " and " : " or ";
    const consequenceSegments = pointerSegments(rule.consequence.propertyPath);
    const wildcardIndex = consequenceSegments.indexOf("*");
    const correlated = wildcardIndex > 0 && rule.conditionGroup.predicates.every((predicate) => sharesWildcardContext(pointerSegments(predicate.propertyPath), consequenceSegments, wildcardIndex));
    if (correlated) {
        const localPredicate = (predicate) => ({
            ...predicate,
            propertyPath: `/${pointerSegments(predicate.propertyPath).slice(wildcardIndex + 1).join("/")}`,
        });
        const localConsequence = {
            ...rule.consequence,
            propertyPath: `/${consequenceSegments.slice(wildcardIndex + 1).join("/")}`,
        };
        return `For each ${consequenceSegments[wildcardIndex - 1]} item, when ${rule.conditionGroup.predicates.map((predicate) => conditionPredicateSummary(localPredicate(predicate))).join(conjunction)}, ${consequenceSummary(localConsequence)}`;
    }
    return `When ${rule.conditionGroup.predicates.map(conditionPredicateSummary).join(conjunction)}, ${consequenceSummary(rule.consequence)}`;
}
function comparisonRequired(operator) {
    return !existenceOperators.includes(operator);
}
function consequenceValid(consequence) {
    const operator = consequence.operator.replaceAll("_", "-").toLowerCase();
    if (!consequence.propertyPath.trim())
        return false;
    if (operator === "required" || operator === "digits-only" || operator === "non-empty-string")
        return true;
    if (operator === "item-count" || operator === "text-length") {
        return consequence.parameters !== undefined
            && Number.isInteger(Number(consequence.parameters))
            && Number(consequence.parameters) >= 0;
    }
    if (operator === "regular-expression") {
        try {
            new RegExp(consequence.parameters ?? "");
            return Boolean(consequence.parameters);
        }
        catch {
            return false;
        }
    }
    return consequence.parameters !== undefined && consequence.parameters.trim() !== "";
}
export function validateConditionalRule(rule) {
    const predicates = rule.conditionGroup?.predicates ?? [];
    if (!predicates.length)
        return { ready: false, assistance: "Add at least one condition" };
    for (const predicate of predicates) {
        if (!predicate.propertyPath.trim())
            return { ready: false, assistance: "Choose a condition property" };
        if (!operatorsForConditionType(predicate.detectedType ?? "string").includes(predicate.operator)) {
            return { ready: false, assistance: `Choose an operator compatible with ${predicate.detectedType ?? "string"}` };
        }
        if (comparisonRequired(predicate.operator)) {
            const hasValue = predicate.operator === "Is one of" ? Boolean(predicate.comparisons?.length) : predicate.comparison !== undefined;
            if (!hasValue)
                return { ready: false, assistance: "Enter a comparison value" };
        }
        if (predicate.operator === "Matches pattern") {
            try {
                new RegExp(String(predicate.comparison?.value ?? ""));
            }
            catch {
                return { ready: false, assistance: "Correct the regular expression" };
            }
        }
    }
    if (!rule.consequence || !consequenceValid(rule.consequence))
        return { ready: false, assistance: "Correct the consequence rule" };
    return { ready: true, assistance: "Ready to create conditional rule" };
}
//# sourceMappingURL=data-layer-conditional-validation-rules.js.map