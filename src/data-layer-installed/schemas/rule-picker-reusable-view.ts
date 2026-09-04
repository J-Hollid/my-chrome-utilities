import type { SchemaRuleController } from "./rule-controller.js";
import type { RulePickerConfiguration } from "./rule-picker-contracts.js";
/** Renders reusable-rule selection and reusable metadata controls. */
export function appendReusableRuleView(c: SchemaRuleController, document: Document, form: HTMLFormElement,
     configuration: RulePickerConfiguration, refresh: () => void, rerender: () => void): void {
    if (c.editingAttached)
        return;
    const reusable = document.createElement("input");
    const reusableLabel = document.createElement("label");
    reusable.id = "schema-local-rule-reusable";
    reusable.type = "checkbox";
    reusable.checked = configuration.saveReusable;
    reusableLabel.append(reusable, " Save as reusable rule in Rule Library");
    const changeReusable = (): void => {
        configuration.saveReusable = reusable.checked;
        rerender();
    };
    reusable.addEventListener("change", changeReusable);
    c.ownPicker(() => reusable.removeEventListener("change", changeReusable));
    form.append(reusableLabel);
    if (!configuration.saveReusable)
        return;
    const explanation = document.createElement("p");
    const name = document.createElement("input");
    const description = document.createElement("textarea");
    explanation.id = "schema-local-rule-reusable-explanation";
    explanation.textContent =
        "This reusable rule will be available to other schemas.";
    name.id = "schema-local-rule-name";
    name.value = configuration.reusableName;
    name.required = true;
    description.id = "schema-local-rule-description";
    description.value = configuration.description;
    const changeName = (): void => {
        configuration.reusableName = name.value;
        refresh();
    };
    const changeDescription = (): void => {
        configuration.description = description.value;
        c.setConfiguration(configuration);
    };
    name.addEventListener("input", changeName);
    description.addEventListener("input", changeDescription);
    c.ownPicker(() => name.removeEventListener("input", changeName), () => description.removeEventListener("input",
         changeDescription));
    form.append(explanation, name, description);
}
