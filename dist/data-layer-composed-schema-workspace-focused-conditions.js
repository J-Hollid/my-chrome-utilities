import { addComposedConditionPredicate, moveComposedConditionBranch, removeComposedConditionBranch, typedComposedValue } from "./data-layer-composed-schema-builders.js";
import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const existsOperators = ["Exists", "Does not exist"];
const operatorsFor = (type) => { const base = [...existsOperators]; if (type === "number" || type === "integer")
    return [...base, "Equals", "Does not equal", "Greater than", "At least", "Less than", "At most"]; if (type === "boolean" || type === "null")
    return [...base, "Equals", "Does not equal"]; return [...base, "Equals", "Does not equal", "Starts with", "Contains", "Matches pattern"]; };
const propertyChoice = (context, value) => { const row = context.model.rows.find((candidate) => candidate.path === value || candidate.effective.definitionId === value); return row ? { path: row.path, id: row.effective.definitionId ?? row.path, type: row.effective.type ?? "string" } : undefined; };
/** Assign missing identities once; subsequent renders and structural moves retain them. */
export const ensureComposedConditionIds = (condition, id = () => `condition:${crypto.randomUUID()}`) => { const withId = { ...condition, id: String(condition.id ?? id("condition")) }; if (withId.kind !== "predicate")
    withId.children = (Array.isArray(withId.children) ? withId.children : []).map((child) => ensureComposedConditionIds(child, id)); return withId; };
function renderPredicateEditor(row, condition, context) {
    const { dom } = context, draft = context.getDraft();
    if (!draft)
        return;
    const editor = dom.createElement("fieldset"), search = dom.createElement("input"), property = dom.createElement("select"), operator = dom.createElement("select"), valueHost = dom.createElement("span");
    editor.setAttribute("aria-label", "Condition predicate editor");
    search.type = "search";
    search.placeholder = "Search properties";
    search.setAttribute("aria-label", "Search condition properties");
    property.setAttribute("aria-label", "Condition property");
    operator.setAttribute("aria-label", "Type-valid operator");
    const renderProperties = () => { const query = search.value.trim().toLowerCase(), selected = property.value; property.replaceChildren(new Option("Choose property", ""), ...context.model.rows.filter(({ path }) => !query || path.toLowerCase().includes(query)).map(({ path }) => new Option(path, path))); property.value = selected || String(condition.propertyId ?? ""); };
    const selected = () => propertyChoice(context, property.value);
    const renderValue = () => { valueHost.replaceChildren(); if (existsOperators.includes(operator.value))
        return; const value = dom.createElement("input"); value.setAttribute("aria-label", "Typed value"); value.value = condition.value === undefined ? "" : String(condition.value); value.addEventListener("input", () => { try {
        const choice = selected();
        condition.value = choice ? typedComposedValue(choice.type, value.value) : value.value;
    }
    catch {
        condition.value = value.value;
    } }); valueHost.append(value); };
    const renderOperators = () => { operator.replaceChildren(...operatorsFor(selected()?.type).map((entry) => new Option(entry, entry))); operator.value = String(condition.operator ?? operator.options[0]?.value ?? ""); renderValue(); };
    renderProperties();
    renderOperators();
    search.addEventListener("input", renderProperties);
    property.addEventListener("change", () => { condition.propertyId = selected()?.id ?? property.value; delete condition.value; renderOperators(); });
    operator.addEventListener("change", () => { condition.operator = operator.value; if (existsOperators.includes(operator.value))
        delete condition.value; renderValue(); });
    editor.append(labeled(dom, "Search properties", search), labeled(dom, "Condition property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", valueHost));
    row.append(editor);
}
export function renderComposedFocusedCondition(host, context) {
    const { dom } = context, draft = context.getDraft();
    if (!draft)
        return;
    if (draft.condition)
        draft.condition = ensureComposedConditionIds(draft.condition);
    const summary = dom.createElement("p"), tree = dom.createElement("div"), controls = dom.createElement("div");
    summary.textContent = focusedConditionLabel(draft.condition);
    tree.setAttribute("aria-label", "Readable condition tree");
    const appendNode = (condition, path) => { const row = dom.createElement("article"); row.dataset.conditionPath = path.join(".") || "root"; row.dataset.conditionId = String(condition.id); row.append(Object.assign(dom.createElement("p"), { textContent: focusedConditionLabel(condition) })); const detail = (mode) => { row.dataset.conditionState = mode; const description = dom.createElement("p"); description.textContent = `${mode === "view" ? "Read-only" : "Editable"} condition · ${focusedConditionLabel(condition)}`; row.append(description); }; const addChild = () => { const current = context.getDraft(), choice = context.model.rows[0]; if (!current || !choice || condition.kind === "predicate")
        return; const next = addComposedConditionPredicate(current, path, { propertyId: choice.effective.definitionId ?? choice.path, operator: "Exists" }); current.condition = ensureComposedConditionIds(next.condition); context.render(); }; const move = () => { const current = context.getDraft(); if (!current || !path.length)
        return; current.condition = moveComposedConditionBranch(current, path, path.at(-1) === 0 ? 1 : -1).condition; context.render(); }; const remove = () => { const current = context.getDraft(); if (!current)
        return; current.condition = removeComposedConditionBranch(current, path).condition; context.render(); }; row.append(button(dom, "View", () => detail("view")), button(dom, "Edit", () => { detail("edit"); if (condition.kind === "predicate")
        renderPredicateEditor(row, condition, context); }), button(dom, "Add child", addChild), button(dom, "Move", move), button(dom, "Remove", remove)); tree.append(row); if (condition.kind !== "predicate" && Array.isArray(condition.children))
        condition.children.forEach((child, index) => appendNode(child, [...path, index])); };
    if (draft.condition)
        appendNode(draft.condition, []);
    else
        tree.textContent = "All (empty)";
    for (const kind of ["all", "any", "not"])
        controls.append(button(dom, `Add ${kind === "all" ? "All" : kind === "any" ? "Any" : "Not"} group`, () => { draft.condition = ensureComposedConditionIds({ kind, children: [] }); context.render(); }));
    const search = dom.createElement("input"), property = dom.createElement("select"), operator = dom.createElement("select"), valueHost = dom.createElement("span");
    search.type = "search";
    search.placeholder = "Search properties";
    search.setAttribute("aria-label", "Search condition properties");
    property.setAttribute("aria-label", "Condition property");
    operator.setAttribute("aria-label", "Type-valid operator");
    const renderProperties = () => { const query = search.value.trim().toLowerCase(), selected = property.value; property.replaceChildren(new Option("Choose property", ""), ...context.model.rows.filter(({ path }) => !query || path.toLowerCase().includes(query)).map(({ path, effective }) => new Option(path, effective.definitionId ?? path))); property.value = selected; };
    const selected = () => propertyChoice(context, property.value);
    const renderValue = () => { valueHost.replaceChildren(); if (existsOperators.includes(operator.value))
        return; const value = dom.createElement("input"); value.setAttribute("aria-label", "Typed value"); valueHost.append(value); };
    const renderOperators = () => { operator.replaceChildren(...operatorsFor(selected()?.type).map((entry) => new Option(entry, entry))); renderValue(); };
    renderProperties();
    renderOperators();
    search.addEventListener("input", renderProperties);
    property.addEventListener("change", renderOperators);
    operator.addEventListener("change", renderValue);
    controls.append(labeled(dom, "Search properties", search), labeled(dom, "Condition property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", valueHost), button(dom, "Add predicate", () => { const choice = selected(); if (!choice)
        return; try {
        const value = valueHost.querySelector('input[aria-label="Typed value"]');
        const typed = existsOperators.includes(operator.value) ? undefined : typedComposedValue(choice.type, value?.value ?? "");
        const next = addComposedConditionPredicate(draft, [], { propertyId: choice.id, operator: operator.value, value: typed });
        draft.condition = ensureComposedConditionIds(next.condition);
        context.render();
    }
    catch {
        valueHost.querySelector("input")?.setCustomValidity("Value does not match the selected property type.");
    } }));
    host.append(summary, tree, controls);
}
//# sourceMappingURL=data-layer-composed-schema-workspace-focused-conditions.js.map