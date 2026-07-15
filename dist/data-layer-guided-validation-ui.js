import { addAllowedValue, applyGuidedSchemaCandidate, assignmentConfigurationRequired, advanceGuidedValidation, backGuidedValidation, compatibleRequirements, createGuidedContinuationDraft, createGuidedContinuationForProperty, createGuidedValidationDraft, createGuidedValidationForProperty, guidedValidationStages, pathConditionResult, pathConditionsResult, publishGuidedValidation, retargetGuidedValidation, resolveGuidedPrefillReplacement, resolveGuidedTargetReplacement, removeAllowedValue, selectGuidedProperty, selectGuidedContinuationProperty, setAllowedValue, setExpectedType, setGuidedRequirement, setGuidedSchemaDestination, setGuidedScope, validateNewSchemaName, validateAllowedValues, } from "./data-layer-guided-validation.js";
import { renderGuidedSchemaPicker } from "./data-layer-guided-schema-picker-ui.js";
import { inspectValidationTarget, normalizeTargetExpression, parseTargetExpression } from "./data-layer-recursive-property-tree.js";
import { addGuidedCondition, createGuidedConditionalDraft, guidedConditionComparisonText, guidedConditionGroup, guidedConditionPropertyOptions, guidedConditionalPreview, reconcileGuidedConditions, removeGuidedCondition, selectGuidedConditionProperty, setGuidedConditionComparison, setGuidedConditionGroupOperator, setGuidedConditionOperator, validateGuidedConditionalDraft, } from "./data-layer-live-guided-conditional-rule-authoring.js";
import { conditionalRuleSummary, operatorsForConditionType } from "./data-layer-conditional-validation-rules.js";
const stageLabels = {
    property: "Choose properties",
    requirement: "Define requirement",
    scope: "Choose event scope",
    destination: "Choose schema destination",
    review: "Review validation",
};
const scopeLabels = {
    "domain-all-paths": "This domain on all paths",
    "current-path": "Only the current path",
    "selected-paths": "Selected paths or patterns",
    everywhere: "Every domain and path",
};
function element(name, text) {
    const result = document.createElement(name);
    if (text !== undefined)
        result.textContent = text;
    return result;
}
function labelledInput(id, labelText, value, hintText) {
    const wrapper = element("div");
    const label = element("label", labelText);
    label.htmlFor = id;
    const input = element("input");
    input.id = id;
    input.value = value;
    wrapper.append(label, input);
    if (hintText) {
        const hint = element("p", hintText);
        hint.id = `${id}-hint`;
        input.setAttribute("aria-describedby", hint.id);
        wrapper.append(hint);
    }
    return { wrapper, input };
}
export function createGuidedValidationFlow(root, effects) {
    let draft;
    let errors = [];
    let status = "";
    let testPath = "";
    let testPathStatus = "";
    let schemaPickerOpen = false;
    let schemaPickerQuery = "";
    let schemaPickerReturnId = "guided-existing-schema-picker";
    let continuationCandidate;
    let targetEditorOpen = false;
    let targetExpression = "";
    let observedTargetPath = "";
    let targetExpectedType = "";
    let conditionalDiscardPending = false;
    function announce(message) { status = message; render(); }
    function setDraft(next, message) {
        draft = next;
        errors = [];
        status = message ?? status;
        render();
    }
    function guidedConsequence(candidate) {
        if (!candidate.property || !candidate.requirement)
            return undefined;
        const operator = candidate.requirement === "Must be one of these values" ? "allowed-values"
            : candidate.requirement === "Must match a pattern" ? "regular-expression"
                : "required";
        const parameters = operator === "allowed-values" ? candidate.allowedValues.join(",")
            : operator === "regular-expression" ? candidate.allowedValues[0]
                : undefined;
        return { propertyPath: candidate.property.path, operator, ...(parameters !== undefined ? { parameters } : {}) };
    }
    function conditionalOptions(candidate) {
        const destination = candidate.destination;
        const selected = destination?.kind === "existing"
            ? effects.schemaCandidates().find(({ id }) => id === destination.schemaId)
            : undefined;
        return guidedConditionPropertyOptions(candidate.event.payload, selected?.propertyTypes ?? {}, candidate.property?.path ?? "");
    }
    function reconcileConditionalDraft(candidate) {
        return candidate.conditional
            ? { ...candidate, conditional: reconcileGuidedConditions(candidate.conditional, conditionalOptions(candidate)) }
            : candidate;
    }
    function move(next) {
        setDraft(next);
        root?.querySelector("#guided-validation-heading")?.focus({ preventScroll: true });
    }
    function showErrors(nextErrors) {
        errors = nextErrors;
        render();
        root?.querySelector("#guided-validation-errors")?.focus({ preventScroll: true });
    }
    function validateStage() {
        if (!draft)
            return [];
        if (draft.stage === "property" && !draft.property)
            return [{ id: "guided-property-list", message: "Select at least one property" }];
        if (draft.stage === "requirement") {
            if (!draft.requirement)
                return [{ id: "guided-requirement", message: "Choose a requirement" }];
            if (draft.requirementCorrectionRequired)
                return [{ id: "guided-requirement", message: "Choose a requirement compatible with the expected data type" }];
            if (draft.requirement === "Must be one of these values") {
                const result = validateAllowedValues(draft.allowedValues);
                if (!result.valid)
                    return [{ id: "guided-allowed-values", message: result.assistance }];
            }
            if (draft.conditional) {
                const consequence = guidedConsequence(draft);
                if (consequence) {
                    const result = validateGuidedConditionalDraft(draft.conditional, consequence);
                    if (!result.ready) {
                        const id = result.assistance === "Add at least one condition" ? "guided-condition-group"
                            : result.assistance === "Choose a condition property" || result.assistance.startsWith("Review condition property") ? "guided-condition-property-0"
                                : result.assistance === "Enter a comparison value" || result.assistance === "Correct the regular expression" ? "guided-condition-comparison-0"
                                    : "guided-condition-operator-0";
                        return [{ id, message: result.assistance }];
                    }
                }
            }
        }
        if (draft.stage === "scope" && draft.scope.kind === "selected-paths") {
            const pathname = draft.scope.pathname;
            const invalid = draft.scope.conditions.flatMap((condition, index) => {
                const result = pathConditionResult(condition, pathname);
                return result.valid ? [] : [{ id: `guided-path-expression-${index}`, message: `Path condition ${index + 1}: correct the regular expression: ${result.error ?? "invalid syntax"}` }];
            });
            if (invalid.length)
                return invalid;
        }
        if (draft.stage === "destination") {
            if (!draft.destination)
                return [{ id: "guided-schema-destination", message: "Choose a schema destination" }];
            if (draft.destination.kind === "new") {
                const result = validateNewSchemaName(draft.destination.schemaName, effects.schemaCandidates().map(({ name }) => name));
                if (!result.valid)
                    return [{ id: "guided-new-schema-name", message: result.assistance }];
            }
            if (draft.destination.kind === "existing" && !draft.destination.schemaId)
                return [{ id: "guided-existing-schemas", message: "Choose an available existing schema" }];
        }
        return [];
    }
    function continueFlow() {
        if (!draft)
            return;
        const nextErrors = validateStage();
        if (nextErrors.length) {
            showErrors(nextErrors);
            return;
        }
        move(advanceGuidedValidation(draft));
    }
    function renderStages(container) {
        if (!draft)
            return;
        const order = guidedValidationStages(draft);
        const current = order.indexOf(draft.stage);
        const list = element("ol");
        list.id = "guided-validation-stages";
        list.setAttribute("aria-label", "Validation creation stages");
        list.replaceChildren(...order.map((stage, index) => {
            const item = element("li", stageLabels[stage]);
            item.dataset.stage = stage;
            item.dataset.state = index < current ? "complete" : index === current ? "current" : "upcoming";
            if (index === current)
                item.setAttribute("aria-current", "step");
            return item;
        }));
        container.append(list);
    }
    function renderErrors(container) {
        const summary = element("section");
        summary.id = "guided-validation-errors";
        summary.tabIndex = -1;
        summary.hidden = errors.length === 0;
        summary.setAttribute("aria-labelledby", "guided-validation-errors-heading");
        const heading = element("h5", "Correct these fields");
        heading.id = "guided-validation-errors-heading";
        const list = element("ul");
        list.replaceChildren(...errors.map(({ id, message }) => {
            const item = element("li");
            const link = element("a", message);
            link.href = `#${id}`;
            item.append(link);
            return item;
        }));
        summary.append(heading, list);
        container.append(summary);
    }
    function renderInlineErrors() {
        if (!root)
            return;
        for (const { id, message } of errors) {
            const control = root.querySelector(`#${id}`);
            if (!control)
                continue;
            const error = element("p", message);
            error.id = `${id}-error`;
            error.dataset.inlineError = "true";
            control.setAttribute("aria-invalid", "true");
            control.setAttribute("aria-describedby", [control.getAttribute("aria-describedby"), error.id].filter(Boolean).join(" "));
            control.insertAdjacentElement("afterend", error);
        }
    }
    function renderPropertyStage(container) {
        if (!draft)
            return;
        const fieldset = element("fieldset");
        fieldset.id = "guided-property-list";
        fieldset.append(element("legend", "Select a property to validate"));
        for (const property of draft.properties) {
            const label = element("label");
            const input = element("input");
            input.type = "radio";
            input.name = "guided-property";
            input.value = property.path;
            input.checked = draft.property?.path === property.path;
            input.addEventListener("change", () => {
                const next = continuationCandidate
                    ? selectGuidedContinuationProperty(draft, property.path, continuationCandidate)
                    : selectGuidedProperty(draft, property.path);
                setDraft(next, `${property.path} selected; ${property.detectedType} detected from this event.`);
            });
            label.append(input, ` ${property.path} — ${String(property.value)} (${property.detectedType})`);
            fieldset.append(label);
        }
        container.append(fieldset);
    }
    function renderAllowedValues(container) {
        if (!draft || draft.requirement !== "Must be one of these values")
            return;
        const group = element("fieldset");
        group.id = "guided-allowed-values";
        group.append(element("legend", "Allowed values"));
        draft.allowedValues.forEach((value, index) => {
            const row = element("div");
            const label = element("label", `Allowed value ${index + 1}`);
            const input = element("input");
            input.value = value;
            input.id = `guided-allowed-value-${index + 1}`;
            label.htmlFor = input.id;
            input.addEventListener("input", () => { draft = setAllowedValue(draft, index, input.value); const result = validateAllowedValues(draft.allowedValues); status = result.assistance; const statusElement = root?.querySelector("#guided-validation-status"); if (statusElement)
                statusElement.textContent = status; });
            const remove = element("button", "Remove value");
            remove.type = "button";
            remove.addEventListener("click", () => setDraft(removeAllowedValue(draft, index), "Allowed value removed."));
            row.append(label, input, remove);
            group.append(row);
        });
        const add = element("button", "Add another value");
        add.type = "button";
        add.addEventListener("click", () => setDraft(addAllowedValue(draft), "Another allowed value added."));
        const assistance = element("p", validateAllowedValues(draft.allowedValues).assistance);
        assistance.id = "guided-allowed-values-hint";
        group.setAttribute("aria-describedby", assistance.id);
        group.append(add, assistance);
        container.append(group);
    }
    function renderRequirementStage(container) {
        if (!draft?.property)
            return;
        const typeLabel = element("label", "Expected data type");
        typeLabel.htmlFor = "guided-expected-type";
        const type = element("select");
        type.id = "guided-expected-type";
        type.setAttribute("aria-describedby", "guided-expected-type-hint");
        for (const value of ["String", "Number", "Array", "Object", "Boolean"])
            type.append(Object.assign(element("option", value), { value, selected: draft.property.expectedType === value }));
        type.addEventListener("change", () => setDraft(setExpectedType(draft, type.value), `${type.value} retained as an explicit override.`));
        const typeSource = draft.prefillSources.expectedType ?? draft.property.typeSource;
        const typeHint = element("p", `${draft.property.detectedType} — ${typeSource}`);
        typeHint.id = "guided-expected-type-hint";
        const requirementLabel = element("label", "Requirement");
        requirementLabel.htmlFor = "guided-requirement";
        const requirement = element("select");
        requirement.id = "guided-requirement";
        requirement.setAttribute("aria-describedby", "guided-requirement-hint");
        requirement.append(Object.assign(element("option", "Choose a requirement"), { value: "" }), ...compatibleRequirements(draft.property.expectedType).map((value) => Object.assign(element("option", value), { value, selected: draft.requirement === value })));
        requirement.addEventListener("change", () => { if (requirement.value)
            setDraft(setGuidedRequirement(draft, requirement.value), `${requirement.value} selected.`); });
        const hint = element("p", "Choose the plain-language condition that this property must satisfy.");
        hint.id = "guided-requirement-hint";
        const preview = element("p", draft.preview.message);
        preview.id = "guided-validation-preview";
        preview.setAttribute("role", "status");
        container.append(typeLabel, type, typeHint, requirementLabel, requirement, hint, preview);
        renderAllowedValues(container);
        renderGuidedConditions(container);
        renderCompatibleAssignments(container);
    }
    function renderGuidedConditions(container) {
        if (!draft?.property || !draft.requirement)
            return;
        const toggleLabel = element("label");
        const toggle = element("input");
        toggle.type = "checkbox";
        toggle.id = "guided-apply-condition";
        toggle.checked = Boolean(draft.conditional);
        toggleLabel.append(toggle, " Apply only when");
        container.append(toggleLabel);
        toggle.addEventListener("change", () => {
            if (toggle.checked) {
                setDraft({ ...draft, conditional: addGuidedCondition(createGuidedConditionalDraft()) }, "Conditional controls opened; nothing has been saved.");
                return;
            }
            if ((draft.conditional?.conditionGroup.predicates.length ?? 0) > 0) {
                conditionalDiscardPending = true;
                render();
                return;
            }
            const { conditional: _conditional, ...unconditional } = draft;
            setDraft(unconditional, "The consequence is unconditional.");
        });
        if (!draft.conditional)
            return;
        const consequence = guidedConsequence(draft);
        const options = conditionalOptions(draft);
        const group = element("fieldset");
        group.id = "guided-condition-group";
        group.append(element("legend", "Trigger conditions"));
        const groupLabel = element("label", "Apply when");
        const groupOperator = element("select");
        groupOperator.id = "guided-condition-group-operator";
        groupLabel.htmlFor = groupOperator.id;
        for (const value of ["All", "Any"])
            groupOperator.append(Object.assign(element("option", value), { value, selected: draft.conditional.conditionGroup.operator === value }));
        groupOperator.addEventListener("change", () => setDraft({ ...draft, conditional: setGuidedConditionGroupOperator(draft.conditional, groupOperator.value) }, "Condition group updated."));
        group.append(groupLabel, groupOperator);
        draft.conditional.conditionGroup.predicates.forEach((predicate, index) => {
            const row = element("section");
            row.className = "guided-condition-row";
            row.setAttribute("aria-label", `Condition ${index + 1}`);
            const propertyLabel = element("label", "Condition property");
            const property = element("select");
            property.id = `guided-condition-property-${index}`;
            propertyLabel.htmlFor = property.id;
            property.append(Object.assign(element("option", "Choose a condition property"), { value: "" }));
            if (predicate.propertyPath && !options.some(({ path }) => path === predicate.propertyPath)) {
                property.append(Object.assign(element("option", `${predicate.propertyPath} — unavailable, review required`), { value: predicate.propertyPath, selected: true }));
            }
            for (const option of options)
                property.append(Object.assign(element("option", `${option.path} — ${option.source}`), { value: option.path, selected: predicate.propertyPath === option.path }));
            property.addEventListener("change", () => setDraft({ ...draft, conditional: selectGuidedConditionProperty(draft.conditional, index, options.find(({ path }) => path === property.value)) }, `${property.value || "Condition property"} selected.`));
            const detected = element("output", predicate.propertyPath ? `Detected type: ${predicate.detectedType ?? "string"}` : "Choose a property to detect its type");
            detected.id = `guided-condition-type-${index}`;
            const operatorLabel = element("label", "Trigger operator");
            const operator = element("select");
            operator.id = `guided-condition-operator-${index}`;
            operatorLabel.htmlFor = operator.id;
            const compatible = operatorsForConditionType(predicate.detectedType ?? "string");
            if (!compatible.includes(predicate.operator))
                operator.append(Object.assign(element("option", predicate.operator), { value: predicate.operator, selected: true }));
            for (const value of compatible)
                operator.append(Object.assign(element("option", value), { value, selected: predicate.operator === value }));
            operator.addEventListener("change", () => setDraft({ ...draft, conditional: setGuidedConditionOperator(draft.conditional, index, operator.value) }, "Trigger operator updated."));
            row.append(propertyLabel, property, detected, operatorLabel, operator);
            if (predicate.operator !== "Exists" && predicate.operator !== "Does not exist") {
                const comparisonLabel = element("label", "Comparison value");
                const comparison = element("input");
                comparison.id = `guided-condition-comparison-${index}`;
                comparison.value = guidedConditionComparisonText(predicate);
                comparisonLabel.htmlFor = comparison.id;
                comparison.addEventListener("input", () => {
                    if (!draft?.conditional)
                        return;
                    draft = { ...draft, conditional: setGuidedConditionComparison(draft.conditional, index, comparison.value) };
                    const currentConsequence = guidedConsequence(draft);
                    const currentConditional = draft.conditional;
                    const output = root?.querySelector("#guided-condition-preview");
                    if (output && currentConsequence && currentConditional)
                        output.textContent = `${guidedConditionalPreview(draft.event.payload, currentConditional, currentConsequence).result} for the current event`;
                });
                row.append(comparisonLabel, comparison);
            }
            const remove = element("button", "Remove condition");
            remove.type = "button";
            remove.addEventListener("click", () => setDraft({ ...draft, conditional: removeGuidedCondition(draft.conditional, index) }, "Condition removed."));
            row.append(remove);
            group.append(row);
        });
        const add = element("button", "Add another condition");
        add.type = "button";
        add.addEventListener("click", () => setDraft({ ...draft, conditional: addGuidedCondition(draft.conditional) }, "Another condition added."));
        group.append(add);
        if (consequence) {
            const cleanGroup = guidedConditionGroup(draft.conditional);
            const summary = cleanGroup && cleanGroup.predicates.length ? conditionalRuleSummary({ conditionGroup: cleanGroup, consequence }) : "Add at least one condition";
            const readable = element("p", summary);
            readable.id = "guided-condition-summary";
            const result = element("output", `${guidedConditionalPreview(draft.event.payload, draft.conditional, consequence).result} for the current event`);
            result.id = "guided-condition-preview";
            result.setAttribute("aria-live", "polite");
            group.append(readable, result);
        }
        container.append(group);
        if (conditionalDiscardPending) {
            const dialog = element("dialog");
            dialog.id = "guided-condition-discard-confirmation";
            const heading = element("h5", "Discard trigger conditions?");
            dialog.append(heading, element("p", `${draft.conditional.conditionGroup.predicates.map(({ propertyPath }) => propertyPath || "unfinished condition").join(", ")} will be discarded.`));
            const keep = element("button", "Keep conditions");
            keep.type = "button";
            keep.addEventListener("click", () => { conditionalDiscardPending = false; render(); });
            const discard = element("button", "Discard conditions");
            discard.type = "button";
            discard.addEventListener("click", () => { const { conditional: _conditional, ...unconditional } = draft; conditionalDiscardPending = false; setDraft(unconditional, "The consequence is unconditional."); });
            dialog.addEventListener("cancel", (event) => { event.preventDefault(); conditionalDiscardPending = false; render(); });
            dialog.append(keep, discard);
            container.append(dialog);
            dialog.showModal();
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
        }
    }
    function updateScope(kind) {
        if (!draft)
            return;
        const conditions = kind === "selected-paths" && draft.scope.conditions.length === 0
            ? [{ matchType: "Exact path", expression: draft.scope.pathname }]
            : draft.scope.conditions;
        setDraft(setGuidedScope(draft, { ...draft.scope, kind, conditions }), `${scopeLabels[kind]} selected.`);
    }
    function updateCondition(index, changes) {
        if (!draft)
            return;
        const conditions = draft.scope.conditions.map((condition, candidate) => candidate === index ? { ...condition, ...changes } : condition);
        setDraft(setGuidedScope(draft, { ...draft.scope, conditions }), "Path condition updated.");
    }
    function renderPathConditions(container) {
        if (!draft || draft.scope.kind !== "selected-paths")
            return;
        const pathSource = draft.prefillSources.pathConditions ?? "Enter a pathname, wildcard path, or complete-path regular expression.";
        const group = element("fieldset");
        group.id = "guided-path-conditions";
        group.append(element("legend", "Path conditions"), element("p", "This assignment matches when any condition matches."));
        draft.scope.conditions.forEach((condition, index) => {
            const row = element("section");
            row.setAttribute("aria-label", `Path condition ${index + 1}`);
            const typeLabel = element("label", "Match type");
            const type = element("select");
            typeLabel.htmlFor = type.id = `guided-path-type-${index}`;
            for (const value of ["Exact path", "Path pattern", "Regular expression"])
                type.append(Object.assign(element("option", value), { value, selected: condition.matchType === value }));
            type.addEventListener("change", () => updateCondition(index, { matchType: type.value }));
            const expression = labelledInput(`guided-path-expression-${index}`, "Expression", condition.expression, pathSource);
            expression.input.addEventListener("change", () => updateCondition(index, { expression: expression.input.value }));
            const result = pathConditionResult(condition, draft.scope.pathname);
            const output = element("output", result.valid ? `${draft.scope.pathname} is ${result.matches ? "a match" : "no match"}` : `Syntax error: ${result.error}`);
            output.setAttribute("aria-live", "polite");
            const remove = element("button", "Remove condition");
            remove.type = "button";
            remove.addEventListener("click", () => setDraft(setGuidedScope(draft, { ...draft.scope, conditions: draft.scope.conditions.filter((_, candidate) => candidate !== index) }), "Path condition removed."));
            row.append(typeLabel, type, expression.wrapper, output, remove);
            group.append(row);
        });
        const add = element("button", "Add another path condition");
        add.type = "button";
        add.addEventListener("click", () => setDraft(setGuidedScope(draft, { ...draft.scope, conditions: [...draft.scope.conditions, { matchType: "Exact path", expression: draft.scope.pathname }] }), "Another path condition added."));
        const test = labelledInput("guided-test-path", "Test another path", testPath || draft.scope.pathname, "Enter a pathname to test against every saved condition.");
        test.input.addEventListener("input", () => { testPath = test.input.value; });
        const testButton = element("button", "Test another path");
        testButton.type = "button";
        const testOutput = element("output", testPathStatus);
        testOutput.id = "guided-test-path-result";
        testOutput.setAttribute("aria-live", "polite");
        testButton.addEventListener("click", () => {
            testPath = test.input.value;
            const result = pathConditionsResult(draft.scope.conditions, testPath);
            testPathStatus = result.valid ? `${testPath} is ${result.matches ? "a match" : "no match"}` : `Syntax error: ${result.error}`;
            testOutput.textContent = testPathStatus;
        });
        group.append(add, test.wrapper, testButton, testOutput);
        container.append(group);
    }
    function renderScopeStage(container) {
        if (!draft)
            return;
        const prefill = element("fieldset");
        prefill.id = "guided-routing-prefills";
        prefill.append(element("legend", "Event and assignment values"));
        const assignmentName = labelledInput("guided-assignment-name", "Assignment name", draft.advanced.assignmentName, "Name the reviewed assignment configuration.");
        assignmentName.input.addEventListener("change", () => setDraft({ ...draft, advanced: { ...draft.advanced, assignmentName: assignmentName.input.value } }, "Assignment name updated."));
        const domain = labelledInput("guided-scope-domain", "Domain", draft.scope.domain, draft.prefillSources.domain);
        domain.input.addEventListener("change", () => setDraft(setGuidedScope(draft, { ...draft.scope, domain: domain.input.value }), "Domain updated."));
        const pathname = labelledInput("guided-scope-pathname", "Pathname", draft.scope.pathname, draft.prefillSources.pathname);
        pathname.input.addEventListener("change", () => setDraft(setGuidedScope(draft, { ...draft.scope, pathname: pathname.input.value }), "Pathname updated."));
        const eventName = labelledInput("guided-scope-event", "Event name", draft.event.name, draft.prefillSources.eventName);
        eventName.input.addEventListener("change", () => {
            const { eventName: _source, ...prefillSources } = draft.prefillSources;
            setDraft({ ...draft, event: { ...draft.event, name: eventName.input.value }, prefillSources }, "Event name updated.");
        });
        const source = labelledInput("guided-scope-source", "Event source", draft.advanced.sourceId, draft.prefillSources.sourceId);
        source.input.addEventListener("change", () => {
            const { sourceId: _source, ...prefillSources } = draft.prefillSources;
            setDraft({ ...draft, advanced: { ...draft.advanced, sourceId: source.input.value }, prefillSources }, "Event source updated.");
        });
        const target = labelledInput("guided-scope-target", "Validation target", draft.advanced.target, draft.prefillSources.target);
        target.input.addEventListener("change", () => {
            const { target: _source, ...prefillSources } = draft.prefillSources;
            const value = target.input.value === "raw input" ? "raw input" : "payload";
            setDraft({ ...draft, advanced: { ...draft.advanced, target: value }, prefillSources }, "Validation target updated.");
        });
        prefill.append(assignmentName.wrapper, domain.wrapper, pathname.wrapper, eventName.wrapper, source.wrapper, target.wrapper);
        const choices = element("fieldset");
        choices.append(element("legend", "Where should this validation apply?"));
        for (const [kind, labelText] of Object.entries(scopeLabels)) {
            const label = element("label");
            const input = element("input");
            input.type = "radio";
            input.name = "guided-scope";
            input.value = kind;
            input.checked = draft.scope.kind === kind;
            input.addEventListener("change", () => updateScope(kind));
            label.append(input, ` ${labelText}`);
            choices.append(label);
        }
        container.append(prefill, choices);
        renderPathConditions(container);
    }
    function closeSchemaPicker(restoreFocus = true) {
        schemaPickerOpen = false;
        schemaPickerQuery = "";
        render();
        if (restoreFocus)
            root?.querySelector(`#${schemaPickerReturnId}`)?.focus({ preventScroll: true });
    }
    function openSchemaPicker(returnId) {
        schemaPickerOpen = true;
        schemaPickerQuery = "";
        schemaPickerReturnId = returnId;
        render();
    }
    function selectSchemaCandidate(candidate) {
        if (!draft)
            return;
        draft = reconcileConditionalDraft(applyGuidedSchemaCandidate(draft, candidate));
        errors = [];
        status = `${candidate.name} version ${candidate.version} selected.`;
        schemaPickerOpen = false;
        schemaPickerQuery = "";
        render();
        root?.querySelector("#guided-change-existing-schema")?.focus({ preventScroll: true });
    }
    function renderDestinationStage(container) {
        if (!draft)
            return;
        const candidates = effects.schemaCandidates();
        const choices = element("fieldset");
        choices.id = "guided-schema-destination";
        choices.append(element("legend", "Where should this validation be saved?"));
        const newLabel = element("label");
        const createNew = element("input");
        createNew.type = "radio";
        createNew.name = "guided-schema-destination";
        createNew.value = "new";
        createNew.checked = draft.destination?.kind === "new";
        createNew.addEventListener("change", () => { schemaPickerOpen = false; setDraft(reconcileConditionalDraft(setGuidedSchemaDestination(draft, { kind: "new", schemaName: "" })), "Create a new schema selected."); });
        newLabel.append(createNew, " Create a new schema");
        const existingLabel = element("label");
        const useExisting = element("input");
        useExisting.id = "guided-existing-schema-picker";
        useExisting.type = "radio";
        useExisting.name = "guided-schema-destination";
        useExisting.value = "existing";
        useExisting.checked = draft.destination?.kind === "existing";
        useExisting.setAttribute("aria-haspopup", "dialog");
        useExisting.setAttribute("aria-controls", "guided-schema-picker");
        useExisting.addEventListener("change", () => openSchemaPicker(useExisting.id));
        existingLabel.append(useExisting, " Add to an existing schema");
        choices.append(newLabel, existingLabel);
        container.append(choices);
        if (draft.destination?.kind === "new") {
            const field = labelledInput("guided-new-schema-name", "Schema name", draft.destination.schemaName, "Enter a unique name for the schema this validation will create.");
            const assistance = element("output");
            assistance.id = "guided-new-schema-name-assistance";
            assistance.setAttribute("aria-live", "polite");
            field.input.setAttribute("aria-describedby", `${field.input.getAttribute("aria-describedby")} ${assistance.id}`);
            const update = () => {
                draft = setGuidedSchemaDestination(draft, { kind: "new", schemaName: field.input.value });
                assistance.textContent = validateNewSchemaName(field.input.value, candidates.map(({ name }) => name)).assistance;
            };
            field.input.addEventListener("input", update);
            update();
            container.append(field.wrapper, assistance);
        }
        if (draft.destination?.kind === "existing" && draft.destination.schemaId) {
            const summary = element("section");
            summary.id = "guided-existing-schema-summary";
            summary.append(element("p", `${draft.destination.schemaName} version ${draft.destination.schemaVersion}`));
            const change = element("button", "Change existing schema");
            change.id = "guided-change-existing-schema";
            change.type = "button";
            change.setAttribute("aria-haspopup", "dialog");
            change.setAttribute("aria-controls", "guided-schema-picker");
            change.addEventListener("click", () => openSchemaPicker(change.id));
            summary.append(change);
            container.append(summary);
        }
        renderPrefillReplacementReview(container);
        if (schemaPickerOpen) {
            renderGuidedSchemaPicker({
                container,
                draft,
                candidates,
                query: schemaPickerQuery,
                onQuery(query) { schemaPickerQuery = query; render(); },
                onClose() { closeSchemaPicker(); },
                onSelect(candidate) { selectSchemaCandidate(candidate); },
            });
        }
    }
    function renderCompatibleAssignments(container) {
        if (!draft ||
            !assignmentConfigurationRequired(draft) ||
            draft.assignmentResolution?.selection !== "required from readable assignment choices")
            return;
        const candidates = effects.schemaCandidates();
        const assignments = element("fieldset");
        assignments.id = "guided-compatible-assignments";
        assignments.append(element("legend", "Choose a compatible assignment"));
        for (const [index, assignment] of draft.assignmentResolution.compatibleAssignments.entries()) {
            const id = assignment.id ?? `compatible-assignment-${index}`;
            const label = element("label");
            const input = element("input");
            input.type = "radio";
            input.name = "guided-compatible-assignment";
            input.value = id;
            const readable = assignment.name ?? `${assignment.eventName} on ${assignment.domainCondition ?? "every domain"}`;
            input.addEventListener("change", () => {
                const candidate = candidates.find(({ id: candidateId }) => draft.destination?.kind === "existing" && candidateId === draft.destination.schemaId);
                if (candidate)
                    setDraft(applyGuidedSchemaCandidate(draft, candidate, id), `${readable} selected.`);
            });
            label.append(input, ` ${readable}`);
            assignments.append(label);
        }
        container.append(assignments);
    }
    function renderPrefillReplacementReview(container) {
        if (draft?.prefillReplacementReview?.length) {
            const review = element("section");
            review.id = "guided-prefill-replacement-review";
            review.append(element("h5", "Review schema-derived replacements"));
            const list = element("ul");
            list.replaceChildren(...draft.prefillReplacementReview.map(({ field, currentValue, proposedValue }) => element("li", `${field}: ${currentValue} would be replaced by ${proposedValue}`)));
            const keep = element("button", "Keep current values");
            keep.type = "button";
            keep.addEventListener("click", () => setDraft(resolveGuidedPrefillReplacement(draft, "keep"), "Current values kept."));
            const accept = element("button", "Accept schema-derived values");
            accept.type = "button";
            accept.addEventListener("click", () => setDraft(resolveGuidedPrefillReplacement(draft, "accept"), "Schema-derived values accepted."));
            review.append(list, keep, accept);
            container.append(review);
        }
    }
    function renderTargetReplacementReview(container) {
        if (!draft?.targetReplacementReview)
            return;
        const { previous, proposed } = draft.targetReplacementReview;
        const review = element("section");
        review.id = "guided-target-replacement-review";
        review.append(element("h5", "Review refreshed target values"));
        const list = element("ul");
        list.append(element("li", `target: ${previous.path} was replaced by ${proposed.path}`), element("li", `detected type: ${previous.detectedType} was replaced by ${proposed.detectedType}`), element("li", `observed example: ${String(previous.observedValue)} was replaced by ${String(proposed.observedValue)}`));
        const keep = element("button", "Keep compatible entered values");
        keep.type = "button";
        keep.addEventListener("click", () => setDraft(resolveGuidedTargetReplacement(draft, "keep"), "Compatible entered values kept; correct any incompatible requirement."));
        const accept = element("button", "Accept refreshed target defaults");
        accept.type = "button";
        accept.addEventListener("click", () => setDraft(resolveGuidedTargetReplacement(draft, "accept"), "Refreshed target defaults accepted."));
        review.append(list, keep, accept);
        container.append(review);
    }
    function updateAdvanced(field, value) {
        if (!draft)
            return;
        const nextValue = field === "priority" ? Number(value) : value;
        draft = { ...draft, advanced: { ...draft.advanced, [field]: nextValue } };
        status = `${field} updated.`;
    }
    function renderAdvanced(container) {
        if (!draft)
            return;
        const details = element("details");
        details.id = "guided-advanced-settings";
        details.append(element("summary", "Edit advanced settings"));
        const fields = [["ruleName", "Rule name"], ["message", "Custom message"], ["sourceId", "Source"], ["target", "Target"], ["priority", "Priority"]];
        for (const [key, label] of fields) {
            const field = labelledInput(`guided-${key}`, label, String(draft.advanced[key]), `Generated from the selected ${draft.event.name} event.`);
            field.input.addEventListener("input", () => updateAdvanced(key, field.input.value));
            details.append(field.wrapper);
        }
        details.append(element("p", `Severity ${draft.advanced.severity}; version policy ${draft.advanced.versionPolicy}.`));
        if (draft.property) {
            const editTarget = element("button", "Advanced Edit target path");
            editTarget.type = "button";
            editTarget.addEventListener("click", () => { observedTargetPath ||= draft.property.path; targetExpression = normalizeTargetExpression(draft.property.path, draft.event.payload); targetExpectedType = ""; targetEditorOpen = true; render(); root?.querySelector("#guided-target-expression")?.focus(); });
            details.append(editTarget);
        }
        container.append(details);
    }
    function renderTargetEditor(container) {
        if (!draft?.property || !targetEditorOpen)
            return;
        const dialog = element("dialog");
        dialog.id = "guided-target-path-editor";
        dialog.setAttribute("aria-labelledby", "guided-target-path-heading");
        const heading = element("h5", "Edit validation target path");
        heading.id = "guided-target-path-heading";
        const label = element("label", "Expert expression");
        const input = element("input");
        input.id = "guided-target-expression";
        input.value = targetExpression;
        label.htmlFor = input.id;
        const segmentsHeading = element("h6", "Typed path segments");
        const segments = element("ol");
        segments.id = "guided-target-segments";
        segments.setAttribute("aria-labelledby", "guided-target-segments-heading");
        segmentsHeading.id = "guided-target-segments-heading";
        const preview = element("section");
        preview.id = "guided-target-preview";
        const expectedLabel = element("label", "Expected target type");
        expectedLabel.htmlFor = "guided-target-expected-type";
        expectedLabel.hidden = true;
        const expected = element("select");
        expected.id = "guided-target-expected-type";
        expected.hidden = true;
        expected.append(Object.assign(element("option", "Choose expected type"), { value: "" }), ...["String", "Number", "Array", "Object", "Boolean", "Null"].map((value) => Object.assign(element("option", value), { value })));
        const expressionFor = (values) => `$${values.map((segment) => segment.kind === "property" ? `[${JSON.stringify(segment.value)}]` : segment.kind === "every" ? "[*]" : `[${segment.value}]`).join("")}`;
        const parsedSegments = () => { try {
            return parseTargetExpression(normalizeTargetExpression(input.value, draft.event.payload));
        }
        catch {
            return [];
        } };
        const setSegments = (values) => { targetExpression = expressionFor(values); input.value = targetExpression; refresh(); };
        const renderSegments = (values) => {
            segments.replaceChildren(...values.map((segment, index) => {
                const row = element("li");
                row.className = "guided-target-segment";
                const kindLabel = element("label", `Segment ${index + 1} type`);
                const kind = element("select");
                kind.id = `guided-target-segment-kind-${index}`;
                kindLabel.htmlFor = kind.id;
                for (const [value, text] of [["property", "Object property"], ["every", "Every array item"], ["index", "Array index"]])
                    kind.append(Object.assign(element("option", text), { value, selected: segment.kind === value }));
                const valueLabel = element("label", segment.kind === "property" ? "Property name" : segment.kind === "index" ? "Zero-based index" : "Every observed item");
                const value = element("input");
                value.id = `guided-target-segment-value-${index}`;
                valueLabel.htmlFor = value.id;
                value.disabled = segment.kind === "every";
                value.value = segment.kind === "every" ? "*" : String(segment.value);
                kind.addEventListener("change", () => { const next = [...values]; next[index] = kind.value === "property" ? { kind: "property", value: segment.kind === "property" ? segment.value : "property" } : kind.value === "index" ? { kind: "index", value: segment.kind === "index" ? segment.value : 0 } : { kind: "every", value: null }; setSegments(next); });
                value.addEventListener("change", () => { const next = [...values]; next[index] = segment.kind === "property" ? { kind: "property", value: value.value } : segment.kind === "index" ? { kind: "index", value: Number(value.value) } : segment; setSegments(next); });
                const actions = element("div");
                actions.className = "guided-target-segment-actions";
                const propertyBefore = element("button", "Insert property before");
                propertyBefore.type = "button";
                propertyBefore.addEventListener("click", () => setSegments([...values.slice(0, index), { kind: "property", value: "property" }, ...values.slice(index)]));
                const indexBefore = element("button", "Insert array index before");
                indexBefore.type = "button";
                indexBefore.addEventListener("click", () => setSegments([...values.slice(0, index), { kind: "index", value: 0 }, ...values.slice(index)]));
                const remove = element("button", "Remove segment");
                remove.type = "button";
                remove.addEventListener("click", () => setSegments(values.filter((_, candidate) => candidate !== index)));
                actions.append(propertyBefore, indexBefore, remove);
                row.append(kindLabel, kind, valueLabel, value, actions);
                return row;
            }));
        };
        const refresh = () => {
            targetExpression = input.value;
            const inspection = inspectValidationTarget(draft.event.payload, targetExpression);
            const values = parsedSegments();
            renderSegments(values);
            const segmentText = values.length ? values.map((segment) => segment.kind === "property" ? `Property ${segment.value}` : segment.kind === "every" ? "Every array item" : `Array index ${segment.value}`).join(" · ") : "Target segments need correction";
            preview.textContent = [segmentText, inspection.readablePath, inspection.expression, `${inspection.matchedValueCount ?? 0} matched values`, `Detected types: ${inspection.detectedTypes?.join(", ") || "unobserved"}`, `Examples: ${inspection.examples?.map(String).join(", ") || "none"}`, inspection.missingNodes?.length ? `Will create: ${inspection.missingNodes.join(", ")}` : "", inspection.assistance].filter(Boolean).join(" · ");
            const needsType = Boolean(inspection.requiresExpectedType);
            expectedLabel.hidden = expected.hidden = !needsType;
            expected.value = targetExpectedType;
            apply.disabled = inspection.result === "blocked" || (needsType && !targetExpectedType);
        };
        input.addEventListener("input", refresh);
        expected.addEventListener("change", () => { targetExpectedType = expected.value; refresh(); });
        const addProperty = element("button", "Add Property segment");
        addProperty.type = "button";
        addProperty.addEventListener("click", () => setSegments([...parsedSegments(), { kind: "property", value: "property" }]));
        const addIndex = element("button", "Add Array index segment");
        addIndex.type = "button";
        addIndex.addEventListener("click", () => setSegments([...parsedSegments(), { kind: "index", value: 0 }]));
        const addEvery = element("button", "Add Every item segment");
        addEvery.type = "button";
        addEvery.addEventListener("click", () => setSegments([...parsedSegments(), { kind: "every", value: null }]));
        const reset = element("button", "Reset to observed path");
        reset.type = "button";
        reset.addEventListener("click", () => { targetExpression = normalizeTargetExpression(observedTargetPath, draft.event.payload); targetExpectedType = ""; input.value = targetExpression; refresh(); });
        const apply = element("button", "Apply target path");
        apply.type = "button";
        apply.addEventListener("click", () => {
            const inspection = inspectValidationTarget(draft.event.payload, targetExpression);
            if (inspection.result !== "accepted" && inspection.result !== "unobserved")
                return;
            draft = reconcileConditionalDraft(retargetGuidedValidation(draft, String(inspection.expression), targetExpectedType || undefined));
            targetEditorOpen = false;
            status = "Target path applied; review refreshed inferred values before saving.";
            render();
        });
        const cancel = element("button", "Cancel");
        cancel.type = "button";
        cancel.addEventListener("click", () => { targetEditorOpen = false; render(); });
        dialog.addEventListener("cancel", (event) => { event.preventDefault(); targetEditorOpen = false; render(); });
        dialog.append(heading, label, input, segmentsHeading, segments, addProperty, addIndex, addEvery, preview, expectedLabel, expected, reset, apply, cancel);
        container.append(dialog);
        dialog.showModal();
        refresh();
    }
    function renderReviewStage(container) {
        if (!draft)
            return;
        const review = element("p", draft.review);
        review.id = "guided-validation-review";
        const publishLabel = element("label");
        const publish = element("input");
        publish.id = "guided-publish-rule";
        publish.type = "checkbox";
        publishLabel.append(publish, " Publish this rule for Rule Library reuse");
        const save = element("button", "Add validation to draft");
        save.type = "button";
        save.addEventListener("click", async () => {
            try {
                const result = publishGuidedValidation(draft, publish.checked);
                await effects.publish(result);
                api.close();
                effects.saved?.(result);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Saving failed. Check storage access and try again.";
                const conditionalError = ["Add at least one condition", "Choose a condition property", "Enter a comparison value", "Correct the regular expression"].includes(message) || message.startsWith("Choose an operator compatible with") || message.startsWith("Review condition property");
                showErrors([{ id: conditionalError ? "guided-condition-group" : "guided-validation-review", message: conditionalError ? message : error instanceof Error && message === "Guided validation draft is incomplete." ? message : "Saving failed. Check storage access and try again." }]);
            }
        });
        container.append(review, element("p", draft.preview.message), publishLabel, save);
    }
    function renderNavigation(container) {
        if (!draft)
            return;
        const actions = element("div");
        actions.setAttribute("aria-label", "Guided validation navigation");
        if (draft.stage !== "property") {
            const back = element("button", "Back");
            back.type = "button";
            back.addEventListener("click", () => move(backGuidedValidation(draft)));
            actions.append(back);
        }
        if (draft.stage !== "review") {
            const next = element("button", "Continue");
            next.type = "button";
            next.addEventListener("click", continueFlow);
            actions.append(next);
        }
        const cancel = element("button", "Cancel");
        cancel.type = "button";
        cancel.addEventListener("click", () => api.close());
        actions.append(cancel);
        container.append(actions);
    }
    function render() {
        if (!root)
            return;
        root.hidden = !draft;
        if (!draft) {
            root.replaceChildren();
            return;
        }
        const heading = element("h4", stageLabels[draft.stage]);
        heading.id = "guided-validation-heading";
        heading.tabIndex = -1;
        root.replaceChildren(heading);
        renderStages(root);
        renderErrors(root);
        if (draft.continuation) {
            const context = element("p", `Adding to ${draft.continuation.schemaName} draft`);
            context.id = "guided-continuation-context";
            root.append(context);
        }
        if (draft.stage === "property")
            renderPropertyStage(root);
        if (draft.stage === "requirement")
            renderRequirementStage(root);
        if (draft.stage === "scope")
            renderScopeStage(root);
        if (draft.stage === "destination")
            renderDestinationStage(root);
        if (draft.stage === "review")
            renderReviewStage(root);
        renderInlineErrors();
        renderTargetReplacementReview(root);
        renderAdvanced(root);
        renderNavigation(root);
        renderTargetEditor(root);
        const statusElement = element("output", status);
        statusElement.id = "guided-validation-status";
        statusElement.setAttribute("role", "status");
        statusElement.setAttribute("aria-live", "polite");
        root.append(statusElement);
    }
    const api = {
        open(event, continuation) { continuationCandidate = continuation; draft = continuation ? createGuidedContinuationDraft(event, continuation) : createGuidedValidationDraft(event); errors = []; status = "Validation draft opened; nothing has been saved."; testPath = ""; testPathStatus = ""; schemaPickerOpen = false; schemaPickerQuery = ""; targetEditorOpen = false; conditionalDiscardPending = false; render(); root?.querySelector("#guided-validation-heading")?.focus({ preventScroll: true }); },
        openProperty(event, path, continuation) { continuationCandidate = continuation; draft = continuation ? createGuidedContinuationForProperty(event, continuation, path) : createGuidedValidationForProperty(event, path); errors = []; status = `${path} selected from the event property tree; nothing has been saved.`; testPath = ""; testPathStatus = ""; schemaPickerOpen = false; schemaPickerQuery = ""; targetEditorOpen = false; conditionalDiscardPending = false; observedTargetPath = path; render(); root?.querySelector("#guided-validation-heading")?.focus({ preventScroll: true }); },
        close() { continuationCandidate = undefined; draft = undefined; errors = []; status = ""; testPath = ""; testPathStatus = ""; schemaPickerOpen = false; schemaPickerQuery = ""; targetEditorOpen = false; conditionalDiscardPending = false; render(); effects.close?.(); },
        currentDraft() { return draft; },
    };
    return api;
}
//# sourceMappingURL=data-layer-guided-validation-ui.js.map