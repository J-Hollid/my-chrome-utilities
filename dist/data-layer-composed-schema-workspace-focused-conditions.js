import { addComposedConditionPredicate, moveComposedConditionBranch, removeComposedConditionBranch, typedComposedValue } from "./data-layer-composed-schema-builders.js";
import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const clone = (value) => structuredClone(value);
const existsOperators = ["Exists", "Does not exist"];
const operatorsFor = (type) => { const base = [...existsOperators]; if (type === "number" || type === "integer")
    return [...base, "Equals", "Does not equal", "Greater than", "At least", "Less than", "At most"]; if (type === "boolean" || type === "null")
    return [...base, "Equals", "Does not equal"]; return [...base, "Equals", "Does not equal", "Starts with", "Contains", "Matches pattern"]; };
const propertyChoice = (context, value) => { const row = context.model.rows.find((candidate) => candidate.path === value || candidate.effective.definitionId === value); return row ? { path: row.path, id: row.effective.definitionId ?? row.path, type: row.effective.type ?? "string" } : undefined; };
const stableCondition = (condition, path = "root") => condition.kind === "predicate" ? { ...condition, id: String(condition.id ?? `condition:${path}`) } : { ...condition, id: String(condition.id ?? `condition:${path}`), children: (Array.isArray(condition.children) ? condition.children : []).map((child, index) => stableCondition(child, `${path}.${index}`)) };
function renderPredicateEditor(row, condition, context) {
    const { dom } = context, draft = context.getDraft();
    if (!draft)
        return;
    const editor = dom.createElement("fieldset"), search = dom.createElement("input"), property = dom.createElement("select"), operator = dom.createElement("select"), value = dom.createElement("input");
    editor.setAttribute("aria-label", "Condition predicate editor");
    search.type = "search";
    search.placeholder = "Search properties";
    search.setAttribute("aria-label", "Search condition properties");
    property.setAttribute("aria-label", "Condition property");
    const renderProperties = () => { const query = search.value.trim().toLowerCase(), selected = property.value; property.replaceChildren(new Option("Choose property", ""), ...context.model.rows.filter(({ path }) => !query || path.toLowerCase().includes(query)).map(({ path }) => new Option(path, path))); property.value = selected || String(condition.propertyId ?? ""); };
    renderProperties();
    operator.setAttribute("aria-label", "Type-valid operator");
    value.setAttribute("aria-label", "Typed value");
    const selected = () => propertyChoice(context, property.value), renderOperators = () => { operator.replaceChildren(...operatorsFor(selected()?.type).map((entry) => new Option(entry, entry))); operator.value = String(condition.operator ?? operator.options[0]?.value ?? ""); value.hidden = existsOperators.includes(operator.value); value.value = condition.value === undefined ? "" : String(condition.value); };
    renderOperators();
    search.addEventListener("input", renderProperties);
    property.addEventListener("change", () => { condition.propertyId = selected()?.id ?? property.value; condition.value = undefined; renderOperators(); });
    operator.addEventListener("change", () => { condition.operator = operator.value; if (existsOperators.includes(operator.value))
        delete condition.value; });
    value.addEventListener("input", () => { try {
        const choice = selected();
        condition.value = choice ? typedComposedValue(choice.type, value.value) : value.value;
    }
    catch {
        condition.value = value.value;
    } });
    editor.append(labeled(dom, "Search properties", search), labeled(dom, "Condition property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", value));
    row.append(editor);
}
export function renderComposedFocusedCondition(host, context) {
    const { dom } = context, draft = context.getDraft();
    if (!draft)
        return;
    draft.condition = stableCondition(draft.condition);
    const summary = dom.createElement("p"), tree = dom.createElement("div"), controls = dom.createElement("div");
    summary.textContent = focusedConditionLabel(draft.condition);
    tree.setAttribute("aria-label", "Readable condition tree");
    const appendNode = (condition, path) => { const row = dom.createElement("article"); row.dataset.conditionPath = path.join(".") || "root"; row.dataset.conditionId = String(condition.id ?? `condition:${path.join(".") || "root"}`); row.append(Object.assign(dom.createElement("p"), { textContent: focusedConditionLabel(condition) })); const detail = (mode) => { row.dataset.conditionState = mode; const description = dom.createElement("p"); description.textContent = `${mode === "view" ? "Read-only" : "Editable"} condition · ${focusedConditionLabel(condition)}`; row.append(description); }; const addChild = () => { const draft = context.getDraft(), choice = context.model.rows[0]; if (!draft || !choice || condition.kind === "predicate")
        return; const next = addComposedConditionPredicate(draft, path, { propertyId: choice.effective.definitionId ?? choice.path, operator: "Exists" }); draft.condition = stableCondition(next.condition); context.render(); }; const move = () => { const draft = context.getDraft(); if (!draft || !path.length)
        return; const next = moveComposedConditionBranch(draft, path, path.at(-1) === 0 ? 1 : -1); draft.condition = next.condition; context.render(); }; const remove = () => { const draft = context.getDraft(); if (!draft)
        return; const next = removeComposedConditionBranch(draft, path); draft.condition = next.condition; context.render(); }; row.append(button(dom, "View", () => detail("view")), button(dom, "Edit", () => { detail("edit"); if (condition.kind === "predicate")
        renderPredicateEditor(row, condition, context); }), button(dom, "Add child", addChild), button(dom, "Move", move), button(dom, "Remove", remove)); tree.append(row); if (condition.kind !== "predicate" && Array.isArray(condition.children))
        condition.children.forEach((child, index) => appendNode(child, [...path, index])); };
    if (draft.condition)
        appendNode(draft.condition, []);
    else
        tree.textContent = "All (empty)";
    for (const kind of ["all", "any", "not"])
        controls.append(button(dom, `Add ${kind === "all" ? "All" : kind === "any" ? "Any" : "Not"} group`, () => { draft.condition = stableCondition({ kind, children: [] }); context.render(); }));
    const search = dom.createElement("input"), property = dom.createElement("select"), operator = dom.createElement("select"), value = dom.createElement("input");
    search.type = "search";
    search.placeholder = "Search properties";
    search.setAttribute("aria-label", "Search condition properties");
    property.setAttribute("aria-label", "Condition property");
    operator.setAttribute("aria-label", "Type-valid operator");
    value.setAttribute("aria-label", "Typed value");
    const renderProperties = () => { const query = search.value.trim().toLowerCase(), selected = property.value; property.replaceChildren(new Option("Choose property", ""), ...context.model.rows.filter(({ path }) => !query || path.toLowerCase().includes(query)).map(({ path, effective }) => new Option(path, effective.definitionId ?? path))); property.value = selected; };
    renderProperties();
    const selected = () => propertyChoice(context, property.value), renderOperators = () => { operator.replaceChildren(...operatorsFor(selected()?.type).map((entry) => new Option(entry, entry))); value.hidden = existsOperators.includes(operator.value); };
    search.addEventListener("input", renderProperties);
    property.addEventListener("change", renderOperators);
    operator.addEventListener("change", () => { value.hidden = existsOperators.includes(operator.value); });
    renderOperators();
    controls.append(labeled(dom, "Search properties", search), labeled(dom, "Condition property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", value), button(dom, "Add predicate", () => { const choice = selected(); if (!choice)
        return; try {
        const typed = existsOperators.includes(operator.value) ? undefined : typedComposedValue(choice.type, value.value), next = addComposedConditionPredicate(draft, [], { propertyId: choice.id, operator: operator.value, value: typed });
        draft.condition = stableCondition(next.condition);
        context.render();
    }
    catch {
        value.setCustomValidity("Value does not match the selected property type.");
    } }));
    host.append(summary, tree, controls);
}
//# sourceMappingURL=data-layer-composed-schema-workspace-focused-conditions.js.map