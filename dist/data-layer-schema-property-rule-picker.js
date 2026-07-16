import { validateConditionalRule, } from "./data-layer-conditional-validation-rules.js";
import { allowedValuesRuleLibraryMetadata, allowedValuesRuleLibrarySearchText, typedAllowedValues } from "./data-layer-allowed-values-rule.js";
export { canonicalRulePropertyPath } from "./data-layer-schema-property-path.js";
const compatibility = {
    "Required": ["string", "number", "array", "object", "boolean"],
    "Exact value": ["string", "number", "boolean"],
    "Allowed values": ["string", "number", "boolean"],
    "Regular expression": ["string"],
    "Text length": ["string"],
    "Digits only": ["string"],
    "Numeric range": ["number"],
    "Item count": ["array"],
    "Allow undeclared properties": ["object"],
};
const builtIns = Object.keys(compatibility).map((name) => ({
    id: `built-in:${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    kind: name,
    operator: name.toLowerCase(),
}));
export function ruleTypeAvailability(propertyType, ruleType) {
    return compatibility[ruleType].includes(propertyType) ? "available" : "unavailable";
}
export function builtInRulesForProperty(propertyType) {
    return builtIns
        .filter(({ name }) => ruleTypeAvailability(propertyType, name) === "available")
        .map((rule) => ({ ...rule, applicableType: propertyType }));
}
export function applicablePropertyTypesForRule(rule) {
    if (rule.applicableType)
        return [rule.applicableType];
    const metadata = `${rule.kind} ${rule.operator ?? ""}`.toLowerCase();
    if (metadata.includes("string"))
        return ["string"];
    if (metadata.includes("number"))
        return ["number"];
    if (metadata.includes("array"))
        return ["array"];
    if (metadata.includes("object"))
        return ["object"];
    if (metadata.includes("boolean"))
        return ["boolean"];
    const ruleType = Object.keys(compatibility)
        .find((candidate) => metadata.includes(candidate.toLowerCase()));
    return ruleType ? compatibility[ruleType] : [];
}
export function reusableRulesForProperty(rules, propertyType, query, attachedIds) {
    const normalized = query.trim().toLowerCase();
    return rules
        .filter((rule) => rule.enabled !== false && applicablePropertyTypesForRule(rule).includes(propertyType))
        .filter((rule) => !normalized || [rule.name, rule.kind, rule.operator, rule.parameters, allowedValuesRuleLibrarySearchText(rule), rule.description, ...applicablePropertyTypesForRule(rule), `version ${rule.version ?? 1}`]
        .filter(Boolean).join(" ").toLowerCase().includes(normalized))
        .map((rule) => ({ ...rule, alreadyAttached: attachedIds.has(rule.id) }));
}
export function reusableRuleMetadata(rule, propertyType) {
    const values = allowedValuesRuleLibraryMetadata(rule);
    return `${rule.operator ?? rule.kind}${values ? ` · ${values}` : rule.parameters ? ` · ${rule.parameters}` : " · no parameters"} · type ${rule.applicableType ?? propertyType} · version ${rule.version ?? 1}`;
}
function valueInputType(propertyType) {
    return propertyType === "number" ? "number" : propertyType === "boolean" ? "select" : "text";
}
export function ruleConfigurationControls(ruleType, propertyType) {
    if (ruleType === "Exact value")
        return [{ key: "exactValue", label: "Exact value", inputType: valueInputType(propertyType) }];
    if (ruleType === "Allowed values")
        return [{ key: "allowedValues", label: "Allowed values", inputType: valueInputType(propertyType), repeatable: true }];
    if (ruleType === "Regular expression")
        return [{ key: "pattern", label: "Pattern", inputType: "text" }];
    if (ruleType === "Text length" || ruleType === "Item count")
        return [
            { key: "comparison", label: "Comparison", inputType: "select", choices: [">", ">=", "==", "<", "<="] },
            { key: "limit", label: "Limit", inputType: "number", minimum: 0, step: 1 },
        ];
    if (ruleType === "Numeric range")
        return [
            { key: "minimum", label: "Minimum", inputType: "number", optional: true },
            { key: "maximum", label: "Maximum", inputType: "number", optional: true },
        ];
    return [];
}
export function createRuleConfiguration(ruleType, propertyType) {
    return {
        ruleType,
        propertyType,
        exactValue: "",
        allowedValues: [""],
        pattern: "",
        exactLength: "",
        minimum: "",
        maximum: "",
        minimumItemCount: "",
        comparison: "",
        limit: "",
        severity: "error",
        message: "",
        saveReusable: false,
        reusableName: "",
        description: "",
        applyOnlyWhen: false,
        conditionGroupOperator: "All",
        conditions: [],
    };
}
function nonNegativeWholeNumber(value) {
    return value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= 0;
}
function legacyCardinalityComparison(configuration) {
    if (configuration.comparison)
        return configuration.comparison;
    if (configuration.ruleType === "Text length" && configuration.exactLength.trim())
        return "==";
    if (configuration.ruleType === "Item count" && configuration.minimumItemCount.trim())
        return ">=";
    return "";
}
function cardinalityLimit(configuration) {
    if (configuration.limit.trim())
        return configuration.limit;
    return configuration.ruleType === "Text length" ? configuration.exactLength : configuration.minimumItemCount;
}
export function validateRuleConfiguration(configuration) {
    if (configuration.ruleType === "Exact value" && !configuration.exactValue.trim())
        return { ready: false, assistance: "Enter an exact value" };
    if (configuration.ruleType === "Allowed values" && !configuration.allowedValues.some((value) => value.trim()))
        return { ready: false, assistance: "Add at least one allowed value" };
    if (configuration.ruleType === "Regular expression") {
        if (!configuration.pattern)
            return { ready: false, assistance: "Enter a pattern" };
        try {
            new RegExp(configuration.pattern);
        }
        catch {
            return { ready: false, assistance: "Correct the regular expression" };
        }
    }
    if ((configuration.ruleType === "Text length" || configuration.ruleType === "Item count") && !legacyCardinalityComparison(configuration))
        return { ready: false, assistance: "Choose a comparison" };
    if ((configuration.ruleType === "Text length" || configuration.ruleType === "Item count") && !nonNegativeWholeNumber(cardinalityLimit(configuration)))
        return { ready: false, assistance: "Enter a non-negative whole number" };
    if (configuration.ruleType === "Numeric range") {
        const minimum = configuration.minimum.trim();
        const maximum = configuration.maximum.trim();
        if (!minimum && !maximum)
            return { ready: false, assistance: "Enter at least one boundary" };
        if ((minimum && !Number.isFinite(Number(minimum))) || (maximum && !Number.isFinite(Number(maximum))))
            return { ready: false, assistance: "Enter numeric boundaries" };
        if (minimum && maximum && Number(minimum) >= Number(maximum))
            return { ready: false, assistance: "Make minimum less than maximum" };
    }
    if (configuration.saveReusable && !configuration.reusableName.trim())
        return { ready: false, assistance: "Enter a rule name" };
    if (configuration.applyOnlyWhen) {
        const details = configuredRuleDetails(configuration);
        const conditional = validateConditionalRule({
            conditionGroup: { operator: configuration.conditionGroupOperator, predicates: configuration.conditions },
            consequence: { propertyPath: "/consequence", operator: details.operator, ...(details.parameters !== undefined ? { parameters: details.parameters } : {}) },
        });
        if (!conditional.ready)
            return conditional;
    }
    return { ready: true, assistance: "Ready to create rule" };
}
export function configuredRuleDetails(configuration) {
    if (configuration.ruleType === "Required")
        return { operator: "required" };
    if (configuration.ruleType === "Exact value")
        return { operator: "exact-value", parameters: configuration.exactValue };
    if (configuration.ruleType === "Allowed values")
        return { operator: "allowed-values", allowedValues: typedAllowedValues(configuration.allowedValues, configuration.propertyType) };
    if (configuration.ruleType === "Regular expression")
        return { operator: "regular-expression", parameters: configuration.pattern };
    if (configuration.ruleType === "Text length" || configuration.ruleType === "Item count") {
        const limit = cardinalityLimit(configuration);
        return {
            operator: configuration.ruleType === "Text length" ? "text-length" : "item-count",
            parameters: limit,
            comparison: legacyCardinalityComparison(configuration),
            limit: Number(limit),
        };
    }
    if (configuration.ruleType === "Digits only")
        return { operator: "digits-only" };
    if (configuration.ruleType === "Numeric range")
        return { operator: "numeric-range", parameters: `${configuration.minimum.trim()},${configuration.maximum.trim()}` };
    return { operator: "allow-undeclared-properties" };
}
export function createRuleConfigurationFromAttachedRule(ruleType, propertyType, rule) {
    const configuration = createRuleConfiguration(ruleType, propertyType);
    return {
        ...configuration,
        comparison: rule.comparison ?? (ruleType === "Text length" ? "==" : ">="),
        limit: String(rule.limit ?? rule.parameters ?? ""),
    };
}
//# sourceMappingURL=data-layer-schema-property-rule-picker.js.map