import { ruleConfigurationControls } from "../../utilities/data-layer/schemas.js";
/** Renders scalar and repeatable rule parameter controls. */
export function renderRuleParameterView(c, document, configuration, refresh, rerender) {
    const parameters = document.createElement("fieldset");
    parameters.id = "schema-local-rule-parameters";
    parameters.append(Object.assign(document.createElement("legend"), {
        textContent: "Rule parameters",
    }));
    for (const control of ruleConfigurationControls(configuration.ruleType, configuration.propertyType)) {
        if (control.repeatable)
            continue;
        const input = control.inputType === "select"
            ? document.createElement("select")
            : document.createElement("input");
        input.id = `schema-local-rule-${control.key}`;
        if (control.inputType === "select")
            input.append(...(control.key === "comparison"
                ? [
                    Object.assign(document.createElement("option"), {
                        value: "",
                        textContent: "Choose comparison",
                    }),
                ]
                : []), ...(control.choices ?? []).map((value) => Object.assign(document.createElement("option"), {
                value,
                textContent: value,
            })));
        else {
            const text = input;
            text.type = control.inputType === "number" ? "number" : "text";
            if (control.minimum !== undefined)
                text.min = String(control.minimum);
            if (control.step !== undefined)
                text.step = String(control.step);
        }
        input.value = String(configuration[control.key]);
        const label = document.createElement("label");
        label.htmlFor = input.id;
        label.textContent = control.label;
        const update = () => {
            configuration[control.key] =
                input.value;
            refresh();
        };
        const event = control.inputType === "select" ? "change" : "input";
        input.addEventListener(event, update);
        c.ownPicker(() => input.removeEventListener(event, update));
        parameters.append(label, input);
    }
    if (!ruleConfigurationControls(configuration.ruleType, configuration.propertyType).length)
        parameters.append(Object.assign(document.createElement("p"), {
            textContent: "No parameter controls",
        }));
    const allowed = configuration.ruleType === "Allowed values"
        ? document.createElement("fieldset")
        : undefined;
    if (allowed) {
        allowed.id = "schema-local-rule-allowed-values";
        configuration.allowedValues.forEach((value, index) => {
            const input = document.createElement("input"), remove = document.createElement("button");
            input.id = `schema-local-rule-allowed-value-${index + 1}`;
            input.value = value;
            remove.type = "button";
            remove.textContent = `Remove value ${index + 1}`;
            const update = () => {
                configuration.allowedValues[index] = input.value;
                refresh();
            }, removeValue = () => {
                configuration.allowedValues.splice(index, 1);
                rerender();
            };
            input.addEventListener("input", update);
            remove.addEventListener("click", removeValue);
            c.ownPicker(() => input.removeEventListener("input", update), () => remove.removeEventListener("click", removeValue));
            allowed.append(input, remove);
        });
        const add = document.createElement("button");
        add.type = "button";
        add.textContent = "Add another value";
        const addValue = () => {
            configuration.allowedValues.push("");
            rerender();
        };
        add.addEventListener("click", addValue);
        c.ownPicker(() => add.removeEventListener("click", addValue));
        allowed.append(add);
        parameters.append(allowed);
    }
    return parameters;
}
//# sourceMappingURL=rule-picker-parameter-view.js.map