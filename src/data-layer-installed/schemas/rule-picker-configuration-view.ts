import { validateRuleConfiguration } from "../../utilities/data-layer/schemas.js";
import type { SchemaRuleController } from "./rule-controller.js";
import type { RulePickerConfiguration, RulePickerPorts, } from "./rule-picker-contracts.js";
import { renderRuleParameterView } from "./rule-picker-parameter-view.js";
import { appendReusableRuleView } from "./rule-picker-reusable-view.js";
import { appendRuleConditionView } from "./rule-picker-condition-view.js";
/** Renders rule parameters, predicates, preview, metadata, and submission. */
export function renderRulePickerConfiguration(c: SchemaRuleController, p: RulePickerPorts, path: string,
     rerender: () => void, normalize: (value: string) => string, renderRoot: () => void, workingConfiguration: RulePickerConfiguration): void {
    const picker = p.picker;
    const document = picker?.ownerDocument;
    if (!picker || !document)
        return;
    const configuration = workingConfiguration!, editLabel = c.editingAttached
        ? `Edit ${c.editingAttached.name ?? c.editingAttached.id}`
        : "Create local rule", form = document.createElement("form"), heading = document.createElement("h4"),
             context = document.createElement("p"), status = document.createElement("output");
    form.id = "schema-local-rule-configuration";
    heading.id = "schema-property-rule-picker-heading";
    heading.textContent = `${editLabel} for ${normalize(path)}`;
    context.textContent = `Local rule origin · ${normalize(path)} · ${configuration.ruleType.toLowerCase()} operator · type ${configuration.propertyType}`;
    status.id = "schema-local-rule-assistance";
    picker.setAttribute("aria-labelledby", heading.id);
    let createButton: HTMLButtonElement | undefined;
    const refresh = (): void => {
        c.setConfiguration(configuration);
        const validation = validateRuleConfiguration(configuration);
        status.textContent = validation.assistance;
        if (createButton)
            createButton.disabled = !validation.ready;
        form.dataset.ready = String(validation.ready);
        picker.dataset.conditionPreview = JSON.stringify({
            propertyPath: normalize(path),
            operator: configuration.conditionGroupOperator,
            predicates: configuration.conditions,
        });
    };
    const parameters = renderRuleParameterView(c, document, configuration, refresh, rerender);
    const severity = document.createElement("select"), message = document.createElement("input"), enabled = document.createElement("input"),
         severityLabel = document.createElement("label"), messageLabel = document.createElement("label"),
         enabledLabel = document.createElement("label");
    severity.id = "schema-local-rule-severity";
    severity.append(...["error", "warning"].map((value) => Object.assign(document.createElement("option"), {
        value,
        textContent: value,
    })));
    severity.value = configuration.severity;
    message.id = "schema-local-rule-message";
    message.value = configuration.message;
    enabled.id = "schema-local-rule-enabled";
    enabled.type = "checkbox";
    enabled.checked = configuration.enabled;
    severityLabel.htmlFor = severity.id;
    severityLabel.textContent = "Severity";
    messageLabel.htmlFor = message.id;
    messageLabel.textContent = "Issue message (optional)";
    enabledLabel.append(enabled, " Enabled");
    const changeSeverity = (): void => {
        configuration.severity = severity.value;
        refresh();
    }, changeMessage = (): void => {
        configuration.message = message.value;
        c.setConfiguration(configuration);
    }, changeEnabled = (): void => {
        configuration.enabled = enabled.checked;
        c.setConfiguration(configuration);
    };
    severity.addEventListener("change", changeSeverity);
    message.addEventListener("input", changeMessage);
    enabled.addEventListener("change", changeEnabled);
    c.ownPicker(() => severity.removeEventListener("change", changeSeverity), () => message.removeEventListener("input",
         changeMessage), () => enabled.removeEventListener("change", changeEnabled));
    const conditional = document.createElement("input"), conditionalLabel = document.createElement("label");
    conditional.id = "schema-local-rule-conditional";
    conditional.type = "checkbox";
    conditional.checked = configuration.applyOnlyWhen;
    conditionalLabel.append(conditional, " Apply only when");
    const changeConditional = (): void => {
        configuration.applyOnlyWhen = conditional.checked;
        if (conditional.checked && !configuration.conditions.length)
            configuration.conditions.push(c.conditionPredicate(path).predicates[0]!);
        rerender();
    };
    conditional.addEventListener("change", changeConditional);
    c.ownPicker(() => conditional.removeEventListener("change", changeConditional));
    form.append(heading, context, parameters, severityLabel, severity, messageLabel, message, enabledLabel,
         conditionalLabel);
    appendRuleConditionView(c, p, document, form, path, configuration, refresh, rerender, normalize);
    appendReusableRuleView(c, document, form, configuration, refresh, rerender);
    const back = document.createElement("button"), cancel = document.createElement("button"), create = document.createElement("button");
    back.type = cancel.type = "button";
    create.type = "submit";
    back.textContent = "Back to rule choices";
    cancel.textContent = "Cancel";
    create.textContent = c.editingAttached ? "Save changes" : "Create rule";
    createButton = create;
    const goBack = (): void => {
        c.setConfiguration(undefined);
        renderRoot();
    }, cancelEdit = (): void => p.close(), submit = (event: Event): void => {
        event.preventDefault();
        if (validateRuleConfiguration(configuration).ready)
            p.createConfigured();
    };
    back.addEventListener("click", goBack);
    cancel.addEventListener("click", cancelEdit);
    form.addEventListener("submit", submit);
    c.ownPicker(() => back.removeEventListener("click", goBack), () => cancel.removeEventListener("click",
         cancelEdit), () => form.removeEventListener("submit", submit));
    form.append(status, create, ...(c.editingAttached ? [] : [back]), cancel);
    picker.replaceChildren(form);
    refresh();
}
