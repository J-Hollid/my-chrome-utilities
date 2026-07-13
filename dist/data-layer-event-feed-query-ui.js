import { activeQuerySummary, applyQueryCondition, clearEventFeedQuery, eventFeedQueryFields, eventFeedQueryOperators, eventFeedQuerySuggestions, filterEventsByQuery, observedPayloadPaths, queryConditionSummary, queryConditionComplete, removeQueryCondition, } from "./data-layer-event-feed-query.js";
function button(text) {
    const control = document.createElement("button");
    control.type = "button";
    control.textContent = text;
    return control;
}
function createPayloadPathStage() {
    const container = document.createElement("section");
    container.id = "event-feed-payload-path-stage";
    container.setAttribute("aria-label", "Choose payload property path");
    container.hidden = true;
    const back = button("Back to fields");
    const searchLabel = document.createElement("label");
    searchLabel.textContent = "Search observed payload paths ";
    const search = document.createElement("input");
    search.id = "event-feed-payload-path-search";
    search.type = "search";
    searchLabel.append(search);
    const results = document.createElement("div");
    results.id = "event-feed-payload-path-results";
    results.setAttribute("role", "listbox");
    results.setAttribute("aria-label", "Observed payload paths");
    const enterCustom = button("Enter custom path");
    const customEditor = document.createElement("section");
    customEditor.id = "event-feed-query-custom-path-editor";
    customEditor.hidden = true;
    const customLabel = document.createElement("label");
    customLabel.textContent = "Custom property path ";
    const customPath = document.createElement("input");
    customPath.id = "event-feed-query-custom-path";
    customPath.type = "text";
    customLabel.append(customPath);
    const addCustom = button("Add property path");
    addCustom.disabled = true;
    customEditor.append(customLabel, addCustom);
    container.append(back, searchLabel, results, enterCustom, customEditor);
    return { container, back, search, results, enterCustom, customEditor, customPath, addCustom };
}
function clearButton(query, update) {
    const clear = button("Clear all");
    clear.addEventListener("click", () => update(clearEventFeedQuery(query)));
    return clear;
}
function renderToolbar(events, query) {
    const toolbar = document.createElement("div");
    toolbar.className = "event-feed-query-toolbar";
    const add = button("Add filter");
    add.id = "add-event-feed-filter";
    const count = document.createElement("output");
    count.id = "live-event-query-count";
    count.setAttribute("aria-live", "polite");
    const visibleCount = filterEventsByQuery(events, query).length;
    count.textContent = `${visibleCount} of ${events.length} events`;
    toolbar.append(add, count);
    return { toolbar, add, visibleCount };
}
function renderActiveFilters(root, query, update) {
    const active = document.createElement("section");
    active.id = "active-event-feed-filters";
    active.setAttribute("aria-label", "Active event feed filters");
    active.hidden = query.conditions.length === 0;
    const querySummary = document.createElement("p");
    querySummary.textContent = activeQuerySummary(query);
    const summaries = document.createElement("ul");
    for (const condition of query.conditions) {
        const item = document.createElement("li");
        const text = document.createElement("span");
        text.textContent = queryConditionSummary(condition);
        const remove = button("Remove");
        remove.setAttribute("aria-label", `Remove filter ${text.textContent}`);
        remove.addEventListener("click", () => {
            update(removeQueryCondition(query, condition.id));
            root.querySelector("#add-event-feed-filter")?.focus({ preventScroll: true });
        });
        item.append(text, remove);
        summaries.append(item);
    }
    active.append(querySummary, summaries, clearButton(query, update));
    return active;
}
function renderNoMatches(query, visibleCount, update) {
    const noMatches = document.createElement("section");
    noMatches.className = "event-feed-query-empty";
    noMatches.setAttribute("aria-live", "polite");
    noMatches.hidden = query.conditions.length === 0 || visibleCount > 0;
    noMatches.append(Object.assign(document.createElement("p"), { textContent: "No events match the active filters." }), clearButton(query, update));
    return noMatches;
}
function renderConditionEditor(events, query, update, add) {
    const editor = document.createElement("section");
    editor.className = "event-feed-condition-editor";
    editor.setAttribute("aria-label", "Add event feed condition");
    editor.hidden = true;
    const fieldLabel = document.createElement("label");
    fieldLabel.textContent = "Field ";
    const field = document.createElement("select");
    field.id = "event-feed-query-field";
    field.append(Object.assign(document.createElement("option"), { value: "", textContent: "Choose field" }));
    for (const candidate of eventFeedQueryFields())
        field.append(Object.assign(document.createElement("option"), { value: candidate, textContent: candidate }));
    fieldLabel.append(field);
    const operatorLabel = document.createElement("label");
    operatorLabel.textContent = "Operator ";
    const operator = document.createElement("select");
    operator.id = "event-feed-query-operator";
    operator.disabled = true;
    operatorLabel.append(operator);
    const valueLabel = document.createElement("label");
    valueLabel.textContent = "Value ";
    const value = document.createElement("input");
    value.id = "event-feed-query-value";
    value.type = "search";
    value.disabled = true;
    value.setAttribute("list", "event-feed-query-suggestions");
    const suggestions = document.createElement("datalist");
    suggestions.id = "event-feed-query-suggestions";
    valueLabel.append(value, suggestions);
    const apply = button("Apply condition");
    apply.disabled = true;
    const cancel = button("Cancel");
    cancel.addEventListener("click", () => { editor.hidden = true; add.focus({ preventScroll: true }); });
    const selectedField = document.createElement("output");
    selectedField.id = "event-feed-query-selected-field";
    selectedField.hidden = true;
    const payloadPathStage = createPayloadPathStage();
    const { container: pathStage, back: backToFields, search: pathSearch, results: pathResults, enterCustom: enterCustomPath, customEditor: customPathEditor, customPath, addCustom: addPropertyPath, } = payloadPathStage;
    const candidate = () => ({
        id: `condition-${Date.now()}-${query.conditions.length + 1}`,
        field: field.value,
        operator: operator.value,
        values: value.value.split(",").map((entry) => entry.trim()).filter(Boolean),
    });
    const refreshApply = () => { apply.disabled = !queryConditionComplete(candidate()); };
    const hideConditionControls = (hidden) => {
        fieldLabel.hidden = hidden;
        operatorLabel.hidden = hidden;
        valueLabel.hidden = hidden;
        apply.hidden = hidden;
    };
    const configureConditionControls = () => {
        hideConditionControls(false);
        pathStage.hidden = true;
        operator.replaceChildren(...eventFeedQueryOperators(field.value).map((candidate) => Object.assign(document.createElement("option"), { value: candidate, textContent: candidate })));
        operator.disabled = !field.value;
        value.disabled = !field.value;
        suggestions.replaceChildren(...eventFeedQuerySuggestions(events, field.value).map((candidate) => Object.assign(document.createElement("option"), { value: candidate })));
        refreshApply();
    };
    const selectPayloadPath = (path) => {
        const payloadField = `Payload · ${path}`;
        if (!Array.from(field.children).some((candidate) => candidate.value === payloadField)) {
            field.append(Object.assign(document.createElement("option"), { value: payloadField, textContent: payloadField }));
        }
        field.value = payloadField;
        selectedField.textContent = `Selected field ${payloadField}`;
        selectedField.hidden = false;
        value.value = "";
        configureConditionControls();
    };
    const renderPayloadPaths = () => {
        const query = pathSearch.value.trim().toLocaleLowerCase();
        const paths = observedPayloadPaths(events).filter((path) => path.toLocaleLowerCase().includes(query));
        pathResults.replaceChildren(...paths.map((path) => {
            const result = button(path);
            result.setAttribute("role", "option");
            result.setAttribute("aria-label", path);
            result.addEventListener("click", () => selectPayloadPath(path));
            return result;
        }));
    };
    const openPayloadPathStage = () => {
        hideConditionControls(true);
        selectedField.hidden = true;
        pathStage.hidden = false;
        customPathEditor.hidden = true;
        pathSearch.value = "";
        renderPayloadPaths();
        pathSearch.focus({ preventScroll: true });
    };
    field.addEventListener("change", () => {
        if (field.value === "Payload property") {
            openPayloadPathStage();
            return;
        }
        selectedField.hidden = !field.value.startsWith("Payload · ");
        configureConditionControls();
    });
    pathSearch.addEventListener("input", renderPayloadPaths);
    backToFields.addEventListener("click", () => {
        pathStage.hidden = true;
        hideConditionControls(false);
        field.value = "Payload property";
        operator.disabled = true;
        value.disabled = true;
        selectedField.hidden = true;
        refreshApply();
        field.focus({ preventScroll: true });
    });
    enterCustomPath.addEventListener("click", () => { customPathEditor.hidden = false; customPath.focus({ preventScroll: true }); });
    customPath.addEventListener("input", () => { addPropertyPath.disabled = !customPath.value.trim(); });
    addPropertyPath.addEventListener("click", () => { const path = customPath.value.trim(); if (path)
        selectPayloadPath(path); });
    operator.addEventListener("change", refreshApply);
    value.addEventListener("input", refreshApply);
    apply.addEventListener("click", () => { const condition = candidate(); if (queryConditionComplete(condition))
        update(applyQueryCondition(query, condition)); });
    add.addEventListener("click", () => { editor.hidden = false; field.focus({ preventScroll: true }); });
    editor.append(fieldLabel, selectedField, operatorLabel, valueLabel, apply, cancel, pathStage);
    return editor;
}
export function renderEventFeedQueryBuilder(root, events, query, update) {
    root.replaceChildren();
    root.className = query.conditions.length ? "event-feed-query active" : "event-feed-query empty";
    const { toolbar, add, visibleCount } = renderToolbar(events, query);
    root.append(toolbar, renderActiveFilters(root, query, update), renderNoMatches(query, visibleCount, update), renderConditionEditor(events, query, update, add));
}
//# sourceMappingURL=data-layer-event-feed-query-ui.js.map