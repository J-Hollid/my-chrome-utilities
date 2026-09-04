import { comparisonValueFromInput, operatorsForConditionType, schemaPropertyRows, typedComparisonValue,
     } from "../../utilities/data-layer/schemas.js";
import type { SchemaRuleController } from "./rule-controller.js";
import type { RulePickerConfiguration, RulePickerPorts, } from "./rule-picker-contracts.js";
import { createRulePickerPreview } from "./rule-picker-preview-view.js";
/** Renders conditional predicates and their captured-event preview. */
export function appendRuleConditionView(c: SchemaRuleController, p: RulePickerPorts, document: Document,
     form: HTMLFormElement, path: string, configuration: RulePickerConfiguration, refresh: () => void,
     rerender: () => void, normalize: (value: string) => string): void {
    if (configuration.applyOnlyWhen) {
        const conditions = document.createElement("fieldset"), group = document.createElement("select");
        conditions.id = "schema-local-rule-conditions";
        group.id = "schema-local-rule-condition-group";
        conditions.append(Object.assign(document.createElement("legend"), {
            textContent: "Apply only when",
        }));
        group.append(...["All", "Any"].map((value) => Object.assign(document.createElement("option"), {
            value,
            textContent: value,
        })));
        group.value = configuration.conditionGroupOperator;
        const changeGroup = (): void => {
            configuration.conditionGroupOperator =
                group.value === "Any" ? "Any" : "All";
            refresh();
        };
        group.addEventListener("change", changeGroup);
        c.ownPicker(() => group.removeEventListener("change", changeGroup));
        conditions.append(group);
        configuration.conditions.forEach((predicate, index) => {
            const property = document.createElement("select"), operator = document.createElement("select"),
                 comparison = document.createElement("input"), remove = document.createElement("button"),
                 editable = p.draft() ?? p.active();
            property.id = `schema-local-rule-condition-property-${index}`;
            property.append(Object.assign(document.createElement("option"), {
                value: "",
                textContent: "Choose a condition property",
            }), ...schemaPropertyRows(editable.document)
                .map(({ canonicalPath }) => canonicalPath)
                .filter((candidate) => normalize(candidate) !== normalize(path))
                .map((candidate) => Object.assign(document.createElement("option"), {
                value: normalize(candidate),
                textContent: normalize(candidate),
            })));
            property.value = predicate.propertyPath;
            operator.id = `schema-local-rule-condition-operator-${index}`;
            operator.append(...operatorsForConditionType(predicate.detectedType ?? "string").map((value) => Object.assign(document.createElement("option"),
                 {
                value,
                textContent: value,
            })));
            operator.value = predicate.operator;
            comparison.id = `schema-local-rule-condition-value-${index}`;
            comparison.value = predicate.comparison
                ? String(predicate.comparison.value ?? "")
                : "";
            remove.id = `schema-local-rule-condition-remove-${index}`;
            remove.type = "button";
            remove.textContent = `Remove condition ${index + 1}`;
            const changeProperty = (): void => {
                const sample = c.valueAtPath(p.capturedValue(), property.value), detectedType = p.propertyType(editable.document,
                     property.value) ?? "string", comparable = sample.exists &&
                    (sample.value === null ||
                        ["string", "number", "boolean"].includes(typeof sample.value));
                configuration.conditions[index] = {
                    propertyPath: property.value,
                    operator: comparable ? "Equals" : "Exists",
                    detectedType,
                    ...(comparable
                        ? {
                            comparison: typedComparisonValue(sample.value as string | number | boolean | null),
                        }
                        : {}),
                };
                rerender();
            }, changeOperator = (): void => {
                predicate.operator = operator.value as typeof predicate.operator;
                if (predicate.operator === "Exists" ||
                    predicate.operator === "Does not exist")
                    delete predicate.comparison;
                rerender();
            }, changeComparison = (): void => {
                const value = comparisonValueFromInput(comparison.value, predicate.detectedType ?? "string");
                if (value)
                    predicate.comparison = value;
                else
                    delete predicate.comparison;
                refresh();
            }, removeCondition = (): void => {
                configuration.conditions.splice(index, 1);
                rerender();
            };
            property.addEventListener("change", changeProperty);
            operator.addEventListener("change", changeOperator);
            comparison.addEventListener("input", changeComparison);
            remove.addEventListener("click", removeCondition);
            c.ownPicker(() => property.removeEventListener("change", changeProperty), () => operator.removeEventListener("change",
                 changeOperator), () => comparison.removeEventListener("input", changeComparison), () => remove.removeEventListener("click",
                 removeCondition));
            conditions.append(property, operator, comparison, remove);
        });
        const add = document.createElement("button");
        add.id = "schema-local-rule-condition-add";
        add.type = "button";
        add.textContent = "Add condition";
        const addCondition = (): void => {
            configuration.conditions.push(c.conditionPredicate(path).predicates[0]!);
            rerender();
        };
        const preview = createRulePickerPreview(c, p, document, path, configuration);
        add.addEventListener("click", addCondition);
        c.ownPicker(() => add.removeEventListener("click", addCondition));
        conditions.append(add, preview);
        form.append(conditions);
    }
}
