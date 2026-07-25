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
const conditionAt = (root, path) => path.reduce((current, index) => (current.children[index]), root);
const replaceAt = (root, path, replacement) => { if (!path.length)
    return replacement; const parent = conditionAt(root, path.slice(0, -1)); parent.children[path.at(-1)] = replacement; return root; };
function renderPredicateEditor(row, condition, path, context) {
    const { dom } = context, draft = context.getDraft();
    if (!draft)
        return;
    const editor = dom.createElement("fieldset"), property = dom.createElement("select"), operator = dom.createElement("select"), value = dom.createElement("input");
    editor.setAttribute("aria-label", "Condition predicate editor");
    property.setAttribute("aria-label", "Condition property");
    property.append(new Option("Search property", ""), ...context.model.rows.map(({ path: propertyPath, effective }) => new Option(propertyPath, propertyPath)));
    property.value = String(condition.propertyId ?? "");
    operator.setAttribute("aria-label", "Type-valid operator");
    value.setAttribute("aria-label", "Typed value");
    const selected = () => propertyChoice(context, property.value), renderOperators = () => { operator.replaceChildren(...operatorsFor(selected()?.type).map((entry) => new Option(entry, entry))); operator.value = String(condition.operator ?? operator.options[0]?.value ?? ""); value.hidden = existsOperators.includes(operator.value); value.value = condition.value === undefined ? "" : String(condition.value); };
    renderOperators();
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
    editor.append(labeled(dom, "Search property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", value), button(dom, "Apply condition", () => { const root = clone(draft.condition); draft.condition = replaceAt(root, path, clone(condition)); context.render(); }));
    row.append(editor);
}
export function renderComposedFocusedCondition(host, context) {
    const { dom } = context, draft = context.getDraft();
    if (!draft)
        return;
    const summary = dom.createElement("p"), tree = dom.createElement("div"), controls = dom.createElement("div");
    summary.textContent = focusedConditionLabel(draft.condition);
    tree.setAttribute("aria-label", "Readable condition tree");
    const appendNode = (condition, path) => { const row = dom.createElement("article"); row.dataset.conditionPath = path.join(".") || "root"; row.append(Object.assign(dom.createElement("p"), { textContent: focusedConditionLabel(condition) })); const detail = (mode) => { row.dataset.conditionState = mode; const description = dom.createElement("p"); description.textContent = `${mode === "view" ? "Read-only" : "Editable"} condition · ${focusedConditionLabel(condition)}`; row.append(description); }; const addChild = () => { const draft = context.getDraft(), choice = context.model.rows[0]; if (!draft || !choice || condition.kind === "predicate")
        return; const next = addComposedConditionPredicate(draft, path, { propertyId: choice.effective.definitionId ?? choice.path, operator: "Exists" }); draft.condition = next.condition; context.render(); }; const move = () => { const draft = context.getDraft(); if (!draft || !path.length)
        return; const delta = path.at(-1) === 0 ? 1 : -1, next = moveComposedConditionBranch(draft, path, delta); draft.condition = next.condition; context.render(); }; const remove = () => { const draft = context.getDraft(); if (!draft)
        return; const next = removeComposedConditionBranch(draft, path); draft.condition = next.condition; context.render(); }; row.append(button(dom, "View", () => detail("view")), button(dom, "Edit", () => { detail("edit"); if (condition.kind === "predicate")
        renderPredicateEditor(row, condition, path, context); }), button(dom, "Add child", addChild), button(dom, "Move", move), button(dom, "Remove", remove)); tree.append(row); if (condition.kind !== "predicate" && Array.isArray(condition.children))
        condition.children.forEach((child, index) => appendNode(child, [...path, index])); };
    if (draft.condition)
        appendNode(draft.condition, []);
    else
        tree.textContent = "All (empty)";
    for (const kind of ["all", "any", "not"])
        controls.append(button(dom, `Add ${kind === "all" ? "All" : kind === "any" ? "Any" : "Not"} group`, () => { draft.condition = { kind, children: [] }; context.render(); }));
    const property = dom.createElement("select"), operator = dom.createElement("select"), value = dom.createElement("input");
    property.setAttribute("aria-label", "Condition property");
    property.append(new Option("Search property", ""), ...context.model.rows.map(({ path, effective }) => new Option(path, path)));
    operator.setAttribute("aria-label", "Type-valid operator");
    value.setAttribute("aria-label", "Typed value");
    const selected = () => propertyChoice(context, property.value), renderOperators = () => { operator.replaceChildren(...operatorsFor(selected()?.type).map((entry) => new Option(entry, entry))); value.hidden = existsOperators.includes(operator.value); };
    property.addEventListener("change", () => { renderOperators(); });
    operator.addEventListener("change", () => { value.hidden = existsOperators.includes(operator.value); });
    renderOperators();
    controls.append(labeled(dom, "Search property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", value), button(dom, "Add predicate", () => { const choice = selected(); if (!choice)
        return; try {
        const typed = existsOperators.includes(operator.value) ? undefined : typedComposedValue(choice.type, value.value);
        const next = addComposedConditionPredicate(draft, [], { propertyId: choice.id, operator: operator.value, value: typed });
        draft.condition = next.condition;
        context.render();
    }
    catch {
        value.setCustomValidity("Value does not match the selected property type.");
    } }));
    host.append(summary, tree, controls);
}
//# sourceMappingURL=data-layer-composed-schema-workspace-focused-conditions.js.map