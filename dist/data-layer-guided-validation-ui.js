import { addAllowedValue, advanceGuidedValidation, backGuidedValidation, compatibleRequirements, createGuidedValidationDraft, existingSchemaDestination, pathConditionResult, pathConditionsResult, publishGuidedValidation, removeAllowedValue, selectGuidedProperty, setAllowedValue, setExpectedType, setGuidedRequirement, setGuidedSchemaDestination, setGuidedScope, schemaDestinationOptions, validateNewSchemaName, validateAllowedValues, } from "./data-layer-guided-validation.js";
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
    function announce(message) { status = message; render(); }
    function setDraft(next, message) {
        draft = next;
        errors = [];
        status = message ?? status;
        render();
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
        const order = ["property", "requirement", "scope", "destination", "review"];
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
            input.addEventListener("change", () => setDraft(selectGuidedProperty(draft, property.path), `${property.path} selected; ${property.detectedType} detected from this event.`));
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
        const typeHint = element("p", `${draft.property.detectedType} — ${draft.property.typeSource}`);
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
            const expression = labelledInput(`guided-path-expression-${index}`, "Expression", condition.expression, "Enter a pathname, wildcard path, or complete-path regular expression.");
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
        const prefill = element("p", `Domain ${draft.scope.domain}; event ${draft.event.name}; source ${draft.event.sourceId}; target payload.`);
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
        createNew.addEventListener("change", () => setDraft(setGuidedSchemaDestination(draft, { kind: "new", schemaName: "" }), "Create a new schema selected."));
        newLabel.append(createNew, " Create a new schema");
        const existingLabel = element("label");
        const useExisting = element("input");
        useExisting.type = "radio";
        useExisting.name = "guided-schema-destination";
        useExisting.value = "existing";
        useExisting.checked = draft.destination?.kind === "existing";
        useExisting.addEventListener("change", () => setDraft(setGuidedSchemaDestination(draft, { kind: "existing", schemaId: "", schemaName: "", schemaVersion: 0, matchingAssignment: false }), "Add to an existing schema selected."));
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
        if (draft.destination?.kind === "existing") {
            const list = element("fieldset");
            list.id = "guided-existing-schemas";
            list.append(element("legend", "Available schemas"));
            for (const option of schemaDestinationOptions(draft, candidates)) {
                const row = element("div");
                const label = element("label");
                const input = element("input");
                input.type = "radio";
                input.name = "guided-existing-schema";
                input.value = option.id;
                input.disabled = !option.available;
                input.checked = draft.destination.schemaId === option.id;
                input.addEventListener("change", () => setDraft(setGuidedSchemaDestination(draft, existingSchemaDestination(draft, option)), `${option.name} selected.`));
                label.append(input, ` ${option.name} version ${option.version}`);
                const explanation = element("p", option.explanation);
                explanation.id = `guided-existing-schema-${option.id.replace(/[^a-z0-9]+/gi, "-")}-explanation`;
                input.setAttribute("aria-describedby", explanation.id);
                row.append(label, explanation);
                list.append(row);
            }
            container.append(list);
        }
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
        container.append(details);
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
        const save = element("button", "Save validation");
        save.type = "button";
        save.addEventListener("click", async () => {
            try {
                const result = publishGuidedValidation(draft, publish.checked);
                await effects.publish(result);
                api.close();
                effects.saved?.(result);
            }
            catch (error) {
                showErrors([{ id: "guided-validation-review", message: error instanceof Error && error.message === "Guided validation draft is incomplete." ? error.message : "Saving failed. Check storage access and try again." }]);
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
        renderAdvanced(root);
        renderNavigation(root);
        const statusElement = element("output", status);
        statusElement.id = "guided-validation-status";
        statusElement.setAttribute("role", "status");
        statusElement.setAttribute("aria-live", "polite");
        root.append(statusElement);
    }
    const api = {
        open(event) { draft = createGuidedValidationDraft(event); errors = []; status = "Validation draft opened; nothing has been saved."; testPath = ""; testPathStatus = ""; render(); root?.querySelector("#guided-validation-heading")?.focus({ preventScroll: true }); },
        close() { draft = undefined; errors = []; status = ""; testPath = ""; testPathStatus = ""; render(); effects.close?.(); },
        currentDraft() { return draft; },
    };
    return api;
}
//# sourceMappingURL=data-layer-guided-validation-ui.js.map