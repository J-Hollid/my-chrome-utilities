/** Renders reusable-rule selection and reusable metadata controls. */
export function appendReusableRuleView(c, document, form, configuration, refresh, rerender) {
    if (c.editingAttached)
        return;
    const reusable = document.createElement("input");
    const reusableLabel = document.createElement("label");
    reusable.id = "schema-local-rule-reusable";
    reusable.type = "checkbox";
    reusable.checked = configuration.saveReusable;
    reusableLabel.append(reusable, " Save as reusable rule in Rule Library");
    const changeReusable = () => {
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
    const changeName = () => {
        configuration.reusableName = name.value;
        refresh();
    };
    const changeDescription = () => {
        configuration.description = description.value;
        c.setConfiguration(configuration);
    };
    name.addEventListener("input", changeName);
    description.addEventListener("input", changeDescription);
    c.ownPicker(() => name.removeEventListener("input", changeName), () => description.removeEventListener("input", changeDescription));
    form.append(explanation, name, description);
}
//# sourceMappingURL=rule-picker-reusable-view.js.map