import { builtInRulesForProperty, cardinalityComparisonPasses, comparisonValueFromInput, conditionGroupAppliesToValue, createRuleConfiguration, operatorsForConditionType, reusableRuleMetadata, reusableRulesForProperty, ruleConfigurationControls, schemaPropertyRows, typedComparisonValue, validateRuleConfiguration, } from "../../utilities/data-layer/schemas.js";
/** Owns local rule picker DOM presentation and its temporary listeners. */
export class SchemaRulePickerView {
    #controller;
    #ports;
    constructor(controller, ports) { this.#controller = controller; this.#ports = ports; }
    render() {
        const c = this.#controller, p = this.#ports, picker = p.picker, path = c.pickerPath;
        p.incrementRender();
        if (!picker || !path)
            return;
        c.clearPicker();
        const document = picker.ownerDocument, normalize = (value) => c.normalizePickerPath(value), rerender = () => this.render();
        if (!c.configuration) {
            const heading = document.createElement("h4"), search = document.createElement("input"), results = document.createElement("section"), cancel = document.createElement("button"), propertyType = c.typeForAttachment(p.active(), path);
            heading.id = "schema-property-rule-picker-heading";
            heading.textContent = `Add rule for ${path} · type ${propertyType}`;
            results.id = "schema-property-rule-results";
            search.id = "schema-property-rule-search";
            search.value = c.pickerSearch;
            picker.setAttribute("aria-labelledby", heading.id);
            cancel.type = "button";
            cancel.textContent = "Cancel";
            const canonical = normalize(path), attachedIds = new Set((p.active().workingDraft?.attachedRules ?? p.active().attachedRules ?? []).filter(({ propertyPath }) => normalize(propertyPath ?? "") === canonical).map(({ id }) => id)), query = c.pickerSearch.trim().toLowerCase(), builtIns = builtInRulesForProperty(propertyType).filter((rule) => !query || [rule.name, rule.operator, rule.applicableType].join(" ").toLowerCase().includes(query)), reusable = reusableRulesForProperty(c.rules, propertyType, c.pickerSearch, attachedIds), create = document.createElement("section"), library = document.createElement("section");
            create.setAttribute("aria-label", "Create a rule");
            library.setAttribute("aria-label", "Attach from Rule Library");
            create.append(Object.assign(document.createElement("h5"), { textContent: "Create a rule" }));
            library.append(Object.assign(document.createElement("h5"), { textContent: "Attach from Rule Library" }));
            for (const rule of builtIns) {
                const article = document.createElement("article"), button = document.createElement("button"), metadata = document.createElement("p");
                button.type = "button";
                button.textContent = rule.name;
                metadata.textContent = reusableRuleMetadata(rule, propertyType);
                const action = () => { c.configuration = createRuleConfiguration(rule.name, propertyType); rerender(); };
                button.addEventListener("click", action);
                c.ownPicker(() => button.removeEventListener("click", action));
                article.append(button, metadata);
                create.append(article);
            }
            for (const rule of reusable) {
                const article = document.createElement("article"), button = document.createElement("button"), metadata = document.createElement("p");
                button.type = "button";
                button.textContent = `${rule.name} version ${rule.version ?? 1}${rule.alreadyAttached ? " · already attached" : ""}`;
                button.disabled = rule.alreadyAttached;
                metadata.textContent = reusableRuleMetadata(rule, propertyType);
                const action = () => { c.attach(p.active().id, rule.id, path); p.closeForCommit(); };
                button.addEventListener("click", action);
                c.ownPicker(() => button.removeEventListener("click", action));
                article.append(button, metadata);
                library.append(article);
            }
            if (!builtIns.length && !reusable.length) {
                const empty = document.createElement("p"), clear = document.createElement("button");
                empty.id = "schema-property-rule-empty";
                empty.textContent = "No compatible rules match this search";
                clear.type = "button";
                clear.textContent = "Clear search";
                const clearSearch = () => { c.pickerSearch = ""; rerender(); };
                clear.addEventListener("click", clearSearch);
                c.ownPicker(() => clear.removeEventListener("click", clearSearch));
                results.append(empty, clear);
            }
            else
                results.append(create, library);
            const close = () => p.close(), searchRules = () => { c.pickerSearch = search.value; rerender(); };
            cancel.addEventListener("click", close);
            search.addEventListener("input", searchRules);
            c.ownPicker(() => cancel.removeEventListener("click", close), () => search.removeEventListener("input", searchRules));
            picker.replaceChildren(heading, search, results, cancel);
            return;
        }
        const configuration = c.configuration, editLabel = c.editingAttached ? `Edit ${c.editingAttached.name ?? c.editingAttached.id}` : "Create local rule", form = document.createElement("form"), heading = document.createElement("h4"), context = document.createElement("p"), status = document.createElement("output"), parameters = document.createElement("fieldset");
        form.id = "schema-local-rule-configuration";
        heading.id = "schema-property-rule-picker-heading";
        parameters.id = "schema-local-rule-parameters";
        parameters.append(Object.assign(document.createElement("legend"), { textContent: "Rule parameters" }));
        heading.textContent = `${editLabel} for ${normalize(path)}`;
        context.textContent = `Local rule origin · ${normalize(path)} · ${configuration.ruleType.toLowerCase()} operator · type ${configuration.propertyType}`;
        status.id = "schema-local-rule-assistance";
        picker.setAttribute("aria-labelledby", heading.id);
        let createButton;
        const refresh = () => { const validation = validateRuleConfiguration(configuration); status.textContent = validation.assistance; if (createButton)
            createButton.disabled = !validation.ready; form.dataset.ready = String(validation.ready); picker.dataset.conditionPreview = JSON.stringify({ propertyPath: normalize(path), operator: configuration.conditionGroupOperator, predicates: configuration.conditions }); };
        for (const control of ruleConfigurationControls(configuration.ruleType, configuration.propertyType)) {
            if (control.repeatable)
                continue;
            const input = control.inputType === "select" ? document.createElement("select") : document.createElement("input");
            input.id = `schema-local-rule-${control.key}`;
            if (control.inputType === "select")
                input.append(...(control.key === "comparison" ? [Object.assign(document.createElement("option"), { value: "", textContent: "Choose comparison" })] : []), ...(control.choices ?? []).map((value) => Object.assign(document.createElement("option"), { value, textContent: value })));
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
            const update = () => { configuration[control.key] = input.value; refresh(); };
            const event = control.inputType === "select" ? "change" : "input";
            input.addEventListener(event, update);
            c.ownPicker(() => input.removeEventListener(event, update));
            parameters.append(label, input);
        }
        if (!ruleConfigurationControls(configuration.ruleType, configuration.propertyType).length)
            parameters.append(Object.assign(document.createElement("p"), { textContent: "No parameter controls" }));
        const allowed = configuration.ruleType === "Allowed values" ? document.createElement("fieldset") : undefined;
        if (allowed) {
            allowed.id = "schema-local-rule-allowed-values";
            configuration.allowedValues.forEach((value, index) => {
                const input = document.createElement("input"), remove = document.createElement("button");
                input.id = `schema-local-rule-allowed-value-${index + 1}`;
                input.value = value;
                remove.type = "button";
                remove.textContent = `Remove value ${index + 1}`;
                const update = () => { configuration.allowedValues[index] = input.value; refresh(); }, removeValue = () => { configuration.allowedValues.splice(index, 1); rerender(); };
                input.addEventListener("input", update);
                remove.addEventListener("click", removeValue);
                c.ownPicker(() => input.removeEventListener("input", update), () => remove.removeEventListener("click", removeValue));
                allowed.append(input, remove);
            });
            const add = document.createElement("button");
            add.type = "button";
            add.textContent = "Add another value";
            const addValue = () => { configuration.allowedValues.push(""); rerender(); };
            add.addEventListener("click", addValue);
            c.ownPicker(() => add.removeEventListener("click", addValue));
            allowed.append(add);
            parameters.append(allowed);
        }
        const severity = document.createElement("select"), message = document.createElement("input"), enabled = document.createElement("input"), severityLabel = document.createElement("label"), messageLabel = document.createElement("label"), enabledLabel = document.createElement("label");
        severity.id = "schema-local-rule-severity";
        severity.append(...["error", "warning"].map((value) => Object.assign(document.createElement("option"), { value, textContent: value })));
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
        const changeSeverity = () => { configuration.severity = severity.value; refresh(); }, changeMessage = () => { configuration.message = message.value; }, changeEnabled = () => { configuration.enabled = enabled.checked; };
        severity.addEventListener("change", changeSeverity);
        message.addEventListener("input", changeMessage);
        enabled.addEventListener("change", changeEnabled);
        c.ownPicker(() => severity.removeEventListener("change", changeSeverity), () => message.removeEventListener("input", changeMessage), () => enabled.removeEventListener("change", changeEnabled));
        const conditional = document.createElement("input"), reusable = document.createElement("input"), conditionalLabel = document.createElement("label"), reusableLabel = document.createElement("label");
        conditional.id = "schema-local-rule-conditional";
        conditional.type = "checkbox";
        conditional.checked = configuration.applyOnlyWhen;
        reusable.id = "schema-local-rule-reusable";
        reusable.type = "checkbox";
        reusable.checked = configuration.saveReusable;
        conditionalLabel.append(conditional, " Apply only when");
        reusableLabel.append(reusable, " Save as reusable rule in Rule Library");
        const changeConditional = () => { configuration.applyOnlyWhen = conditional.checked; if (conditional.checked && !configuration.conditions.length)
            configuration.conditions.push(c.conditionPredicate(path).predicates[0]); rerender(); }, changeReusable = () => { configuration.saveReusable = reusable.checked; rerender(); };
        conditional.addEventListener("change", changeConditional);
        reusable.addEventListener("change", changeReusable);
        c.ownPicker(() => conditional.removeEventListener("change", changeConditional), () => reusable.removeEventListener("change", changeReusable));
        form.append(heading, context, parameters, severityLabel, severity, messageLabel, message, enabledLabel, conditionalLabel);
        if (configuration.applyOnlyWhen) {
            const conditions = document.createElement("fieldset"), group = document.createElement("select");
            conditions.id = "schema-local-rule-conditions";
            group.id = "schema-local-rule-condition-group";
            conditions.append(Object.assign(document.createElement("legend"), { textContent: "Apply only when" }));
            group.append(...["All", "Any"].map((value) => Object.assign(document.createElement("option"), { value, textContent: value })));
            group.value = configuration.conditionGroupOperator;
            const changeGroup = () => { configuration.conditionGroupOperator = group.value === "Any" ? "Any" : "All"; refresh(); };
            group.addEventListener("change", changeGroup);
            c.ownPicker(() => group.removeEventListener("change", changeGroup));
            conditions.append(group);
            configuration.conditions.forEach((predicate, index) => {
                const property = document.createElement("select"), operator = document.createElement("select"), comparison = document.createElement("input"), remove = document.createElement("button"), editable = p.draft() ?? p.active();
                property.id = `schema-local-rule-condition-property-${index}`;
                property.append(Object.assign(document.createElement("option"), { value: "", textContent: "Choose a condition property" }), ...schemaPropertyRows(editable.document).map(({ canonicalPath }) => canonicalPath).filter((candidate) => normalize(candidate) !== normalize(path)).map((candidate) => Object.assign(document.createElement("option"), { value: normalize(candidate), textContent: normalize(candidate) })));
                property.value = predicate.propertyPath;
                operator.id = `schema-local-rule-condition-operator-${index}`;
                operator.append(...operatorsForConditionType(predicate.detectedType ?? "string").map((value) => Object.assign(document.createElement("option"), { value, textContent: value })));
                operator.value = predicate.operator;
                comparison.id = `schema-local-rule-condition-value-${index}`;
                comparison.value = predicate.comparison ? String(predicate.comparison.value ?? "") : "";
                remove.id = `schema-local-rule-condition-remove-${index}`;
                remove.type = "button";
                remove.textContent = `Remove condition ${index + 1}`;
                const changeProperty = () => { const sample = c.valueAtPath(p.capturedValue(), property.value), detectedType = p.propertyType(editable.document, property.value) ?? "string", comparable = sample.exists && (sample.value === null || ["string", "number", "boolean"].includes(typeof sample.value)); configuration.conditions[index] = { propertyPath: property.value, operator: comparable ? "Equals" : "Exists", detectedType, ...(comparable ? { comparison: typedComparisonValue(sample.value) } : {}) }; rerender(); }, changeOperator = () => { predicate.operator = operator.value; if (predicate.operator === "Exists" || predicate.operator === "Does not exist")
                    delete predicate.comparison; rerender(); }, changeComparison = () => { const value = comparisonValueFromInput(comparison.value, predicate.detectedType ?? "string"); if (value)
                    predicate.comparison = value;
                else
                    delete predicate.comparison; refresh(); }, removeCondition = () => { configuration.conditions.splice(index, 1); rerender(); };
                property.addEventListener("change", changeProperty);
                operator.addEventListener("change", changeOperator);
                comparison.addEventListener("input", changeComparison);
                remove.addEventListener("click", removeCondition);
                c.ownPicker(() => property.removeEventListener("change", changeProperty), () => operator.removeEventListener("change", changeOperator), () => comparison.removeEventListener("input", changeComparison), () => remove.removeEventListener("click", removeCondition));
                conditions.append(property, operator, comparison, remove);
            });
            const add = document.createElement("button"), preview = document.createElement("output");
            add.id = "schema-local-rule-condition-add";
            add.type = "button";
            add.textContent = "Add condition";
            preview.id = "schema-local-rule-current-preview";
            const addCondition = () => { configuration.conditions.push(c.conditionPredicate(path).predicates[0]); rerender(); }, applies = conditionGroupAppliesToValue(p.capturedValue(), { operator: configuration.conditionGroupOperator, predicates: configuration.conditions });
            if (!applies)
                preview.textContent = "Current event preview: Not applicable";
            else {
                const observed = c.valueAtPath(p.capturedValue(), path), measured = configuration.ruleType === "Item count" && Array.isArray(observed.value) ? observed.value.length : configuration.ruleType === "Text length" && typeof observed.value === "string" ? observed.value.length : undefined, passed = measured === undefined ? observed.exists : configuration.comparison !== "" && cardinalityComparisonPasses(measured, configuration.comparison, Number(configuration.limit));
                preview.textContent = `Current event preview: ${passed ? "Passed" : "Failed"}`;
            }
            add.addEventListener("click", addCondition);
            c.ownPicker(() => add.removeEventListener("click", addCondition));
            conditions.append(add, preview);
            form.append(conditions);
        }
        if (!c.editingAttached)
            form.append(reusableLabel);
        if (!c.editingAttached && configuration.saveReusable) {
            const explanation = document.createElement("p"), name = document.createElement("input"), description = document.createElement("textarea");
            explanation.id = "schema-local-rule-reusable-explanation";
            explanation.textContent = "This reusable rule will be available to other library.schemas.";
            name.id = "schema-local-rule-name";
            name.value = configuration.reusableName;
            name.required = true;
            description.id = "schema-local-rule-description";
            description.value = configuration.description;
            const changeName = () => { configuration.reusableName = name.value; refresh(); }, changeDescription = () => { configuration.description = description.value; };
            name.addEventListener("input", changeName);
            description.addEventListener("input", changeDescription);
            c.ownPicker(() => name.removeEventListener("input", changeName), () => description.removeEventListener("input", changeDescription));
            form.append(explanation, name, description);
        }
        const back = document.createElement("button"), cancel = document.createElement("button"), create = document.createElement("button");
        back.type = cancel.type = "button";
        create.type = "submit";
        back.textContent = "Back to rule choices";
        cancel.textContent = "Cancel";
        create.textContent = c.editingAttached ? "Save changes" : "Create rule";
        createButton = create;
        const goBack = () => { c.configuration = undefined; rerender(); }, cancelEdit = () => p.close(), submit = (event) => { event.preventDefault(); if (validateRuleConfiguration(configuration).ready)
            p.createConfigured(); };
        back.addEventListener("click", goBack);
        cancel.addEventListener("click", cancelEdit);
        form.addEventListener("submit", submit);
        c.ownPicker(() => back.removeEventListener("click", goBack), () => cancel.removeEventListener("click", cancelEdit), () => form.removeEventListener("submit", submit));
        form.append(status, create, ...(c.editingAttached ? [] : [back]), cancel);
        picker.replaceChildren(form);
        refresh();
    }
}
//# sourceMappingURL=rule-picker-view.js.map