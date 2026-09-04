import { cardinalityComparisonPasses, conditionGroupAppliesToValue, } from "../../utilities/data-layer/schemas.js";
/** Creates the captured-event preview for the current rule configuration. */
export function createRulePickerPreview(c, p, document, path, configuration) {
    const preview = document.createElement("output");
    preview.id = "schema-local-rule-current-preview";
    const applies = conditionGroupAppliesToValue(p.capturedValue(), {
        operator: configuration.conditionGroupOperator,
        predicates: configuration.conditions,
    });
    if (!applies) {
        preview.textContent = "Current event preview: Not applicable";
        return preview;
    }
    const observed = c.valueAtPath(p.capturedValue(), path);
    const measured = configuration.ruleType === "Item count" && Array.isArray(observed.value)
        ? observed.value.length
        : configuration.ruleType === "Text length" &&
            typeof observed.value === "string"
            ? observed.value.length
            : undefined;
    const passed = measured === undefined
        ? observed.exists
        : configuration.comparison !== "" &&
            cardinalityComparisonPasses(measured, configuration.comparison, Number(configuration.limit));
    preview.textContent = `Current event preview: ${passed ? "Passed" : "Failed"}`;
    return preview;
}
//# sourceMappingURL=rule-picker-preview-view.js.map