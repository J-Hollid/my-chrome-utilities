import { comparisonValueFromInput, conditionValueAtPath, evaluateConditionalRule, operatorsForConditionType, typedComparisonValue, validateConditionalRule, } from "./data-layer-conditional-validation-rules.js";
import { canonicalRulePropertyPath } from "./data-layer-schema-property-path.js";
function conditionType(value) {
    if (value === null)
        return "null";
    if (Array.isArray(value))
        return "array";
    if (typeof value === "string")
        return "string";
    if (typeof value === "number")
        return "number";
    if (typeof value === "boolean")
        return "boolean";
    return "object";
}
function guidedType(type) {
    return type === "String" ? "string"
        : type === "Number" ? "number"
            : type === "Boolean" ? "boolean"
                : type === "Array" ? "array"
                    : type === "Object" ? "object"
                        : "null";
}
function eventOptions(value, path = "") {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return [];
    return Object.entries(value).flatMap(([name, child]) => {
        const childPath = `${path}/${name.replaceAll("~", "~0").replaceAll("/", "~1")}`;
        const own = {
            path: canonicalRulePropertyPath(childPath),
            type: conditionType(child),
            source: "current event",
            observedValue: child,
        };
        return child && typeof child === "object" && !Array.isArray(child)
            ? [own, ...eventOptions(child, childPath)]
            : [own];
    });
}
export function guidedConditionPropertyOptions(payload, destinationPropertyTypes, consequencePath) {
    const excluded = canonicalRulePropertyPath(consequencePath);
    const byPath = new Map();
    for (const option of eventOptions(payload))
        byPath.set(option.path, option);
    for (const [path, type] of Object.entries(destinationPropertyTypes)) {
        const canonical = canonicalRulePropertyPath(path);
        if (!byPath.has(canonical))
            byPath.set(canonical, { path: canonical, type: guidedType(type), source: "destination schema" });
    }
    byPath.delete(excluded);
    return [...byPath.values()].sort((left, right) => left.path.localeCompare(right.path));
}
export function createGuidedConditionalDraft() {
    return { enabled: true, conditionGroup: { operator: "All", predicates: [] } };
}
function updatePredicate(draft, index, update) {
    return {
        ...draft,
        conditionGroup: {
            ...draft.conditionGroup,
            predicates: draft.conditionGroup.predicates.map((predicate, candidate) => candidate === index ? update(predicate) : predicate),
        },
    };
}
export function addGuidedCondition(draft) {
    return {
        ...draft,
        conditionGroup: {
            ...draft.conditionGroup,
            predicates: [...draft.conditionGroup.predicates, { propertyPath: "", operator: "Exists", detectedType: "string" }],
        },
    };
}
export function removeGuidedCondition(draft, index) {
    return {
        ...draft,
        conditionGroup: {
            ...draft.conditionGroup,
            predicates: draft.conditionGroup.predicates.filter((_, candidate) => candidate !== index),
        },
    };
}
export function selectGuidedConditionProperty(draft, index, option) {
    return updatePredicate(draft, index, (previous) => {
        if (!option)
            return { propertyPath: "", operator: "Exists", detectedType: "string" };
        const sameCompatibleProperty = previous.propertyPath === option.path && previous.detectedType === option.type;
        const operator = operatorsForConditionType(option.type).includes(previous.operator) && previous.propertyPath
            ? previous.operator
            : option.type === "array" || option.type === "object" ? "Exists" : "Equals";
        const editedComparison = sameCompatibleProperty && previous.comparisonEdited;
        const comparison = editedComparison
            ? previous.comparison
            : option.observedValue !== undefined && operator !== "Exists" && operator !== "Does not exist"
                ? typedComparisonValue(option.observedValue)
                : undefined;
        return {
            propertyPath: option.path,
            operator,
            detectedType: option.type,
            ...(comparison ? { comparison } : {}),
            ...(editedComparison ? { comparisonEdited: true } : { comparisonEdited: false }),
        };
    });
}
export function setGuidedConditionGroupOperator(draft, operator) {
    return { ...draft, conditionGroup: { ...draft.conditionGroup, operator } };
}
export function setGuidedConditionOperator(draft, index, operator) {
    return updatePredicate(draft, index, (predicate) => {
        if (operator === "Exists" || operator === "Does not exist") {
            const { comparison: _comparison, comparisons: _comparisons, comparisonEdited: _edited, ...withoutComparison } = predicate;
            return { ...withoutComparison, operator };
        }
        return { ...predicate, operator };
    });
}
export function setGuidedConditionComparison(draft, index, input) {
    return updatePredicate(draft, index, (predicate) => {
        if (predicate.operator === "Is one of") {
            const comparisons = input.split(",")
                .map((value) => comparisonValueFromInput(value, predicate.detectedType ?? "string"))
                .filter((value) => value !== undefined);
            const { comparison: _comparison, ...rest } = predicate;
            return { ...rest, comparisons, comparisonEdited: true };
        }
        const comparison = comparisonValueFromInput(input, predicate.detectedType ?? "string");
        const { comparison: _comparison, comparisons: _comparisons, ...rest } = predicate;
        return { ...rest, ...(comparison ? { comparison } : {}), comparisonEdited: true };
    });
}
export function reconcileGuidedConditions(draft, available) {
    const options = new Map(available.map((option) => [option.path, option]));
    return {
        ...draft,
        conditionGroup: {
            ...draft.conditionGroup,
            predicates: draft.conditionGroup.predicates.map((predicate) => {
                const option = options.get(predicate.propertyPath);
                if (!option || option.type !== predicate.detectedType)
                    return { ...predicate, requiresReview: true };
                const { requiresReview: _review, ...retained } = predicate;
                return retained;
            }),
        },
    };
}
export function validateGuidedConditionalDraft(draft, consequence) {
    const review = draft.conditionGroup.predicates.find(({ requiresReview }) => requiresReview);
    if (review)
        return { ready: false, assistance: `Review condition property ${review.propertyPath}` };
    return validateConditionalRule({
        conditionGroup: draft.conditionGroup,
        consequence: { ...consequence, propertyPath: canonicalRulePropertyPath(consequence.propertyPath) },
    });
}
function consequencePasses(payload, consequence) {
    const observed = conditionValueAtPath(payload, canonicalRulePropertyPath(consequence.propertyPath));
    const operator = consequence.operator.replaceAll("_", "-").toLowerCase();
    if (operator === "required")
        return observed.exists;
    if (!observed.exists)
        return false;
    if (operator === "allowed-values")
        return (consequence.parameters ?? "").split(",").includes(String(observed.value));
    if (operator === "regular-expression") {
        try {
            return new RegExp(consequence.parameters ?? "").test(String(observed.value));
        }
        catch {
            return false;
        }
    }
    if (operator === "exact-value")
        return String(observed.value) === (consequence.parameters ?? "");
    if (operator === "item-count")
        return Array.isArray(observed.value) && observed.value.length >= Number(consequence.parameters ?? 0);
    if (operator === "text-length")
        return typeof observed.value === "string" && observed.value.length >= Number(consequence.parameters ?? 0);
    return true;
}
export function guidedConditionalPreview(payload, draft, consequence) {
    return evaluateConditionalRule(payload, { conditionGroup: draft.conditionGroup, consequence }, () => consequencePasses(payload, consequence));
}
export function guidedConditionComparisonText(predicate) {
    if (predicate.operator === "Is one of")
        return predicate.comparisons?.map(({ value }) => String(value)).join(", ") ?? "";
    return predicate.comparison ? String(predicate.comparison.value) : "";
}
export function guidedConditionGroup(draft) {
    if (!draft?.enabled)
        return undefined;
    return {
        operator: draft.conditionGroup.operator,
        predicates: draft.conditionGroup.predicates.map(({ comparisonEdited: _edited, requiresReview: _review, ...predicate }) => structuredClone(predicate)),
    };
}
//# sourceMappingURL=data-layer-live-guided-conditional-rule-authoring.js.map