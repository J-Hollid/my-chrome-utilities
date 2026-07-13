import { activeQuerySummary, applyQueryCondition, clearEventFeedQuery, eventFeedQueryFields, eventFeedQueryOperators, eventFeedQuerySuggestions, filterEventsByQuery, queryConditionSummary, queryConditionComplete, removeQueryCondition, } from "./data-layer-event-feed-query.js";
function button(text) {
    const control = document.createElement("button");
    control.type = "button";
    control.textContent = text;
    return control;
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
    for (const candidate of eventFeedQueryFields(events))
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
    const candidate = () => ({
        id: `condition-${Date.now()}-${query.conditions.length + 1}`,
        field: field.value,
        operator: operator.value,
        values: value.value.split(",").map((entry) => entry.trim()).filter(Boolean),
    });
    const refreshApply = () => { apply.disabled = !queryConditionComplete(candidate()); };
    field.addEventListener("change", () => {
        operator.replaceChildren(...eventFeedQueryOperators(field.value).map((candidate) => Object.assign(document.createElement("option"), { value: candidate, textContent: candidate })));
        operator.disabled = !field.value;
        value.disabled = !field.value;
        suggestions.replaceChildren(...eventFeedQuerySuggestions(events, field.value).map((candidate) => Object.assign(document.createElement("option"), { value: candidate })));
        refreshApply();
    });
    operator.addEventListener("change", refreshApply);
    value.addEventListener("input", refreshApply);
    apply.addEventListener("click", () => { const condition = candidate(); if (queryConditionComplete(condition))
        update(applyQueryCondition(query, condition)); });
    add.addEventListener("click", () => { editor.hidden = false; field.focus({ preventScroll: true }); });
    editor.append(fieldLabel, operatorLabel, valueLabel, apply, cancel);
    return editor;
}
export function renderEventFeedQueryBuilder(root, events, query, update) {
    root.replaceChildren();
    root.className = query.conditions.length ? "event-feed-query active" : "event-feed-query empty";
    const { toolbar, add, visibleCount } = renderToolbar(events, query);
    root.append(toolbar, renderActiveFilters(root, query, update), renderNoMatches(query, visibleCount, update), renderConditionEditor(events, query, update, add));
}
//# sourceMappingURL=data-layer-event-feed-query-ui.js.map