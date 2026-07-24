import { addComposedConditionPredicate, moveComposedConditionBranch, removeComposedConditionBranch, typedComposedValue } from "./data-layer-composed-schema-builders.js";
import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function renderComposedFocusedCondition(host, context) {
    const { dom } = context, draft = context.getDraft();
    if (!draft)
        return;
    const summary = dom.createElement("p"), tree = dom.createElement("div"), controls = dom.createElement("div");
    summary.textContent = focusedConditionLabel(draft.condition);
    tree.setAttribute("aria-label", "Readable condition tree");
    const appendNode = (condition, path) => { const row = dom.createElement("article"); row.dataset.conditionPath = path.join(".") || "root"; row.textContent = focusedConditionLabel(condition); const detail = (mode) => { row.dataset.conditionState = mode; const description = dom.createElement("p"); description.textContent = `${mode === "view" ? "Read-only" : "Editable"} condition · ${focusedConditionLabel(condition)}`; row.append(description); }; const addChild = () => { const draft = context.getDraft(), choice = context.model.rows[0]; if (!draft || !choice || condition.kind === "predicate")
        return; const next = addComposedConditionPredicate(draft, path, { propertyId: choice.effective.definitionId ?? choice.path, operator: "Exists" }); draft.condition = next.condition; context.render(); }; const move = () => { const draft = context.getDraft(); if (!draft || !path.length)
        return; const delta = path.at(-1) === 0 ? 1 : -1, next = moveComposedConditionBranch(draft, path, delta); draft.condition = next.condition; context.render(); }; const remove = () => { const draft = context.getDraft(); if (!draft)
        return; const next = removeComposedConditionBranch(draft, path); draft.condition = next.condition; context.render(); }; row.append(button(dom, "View", () => detail("view")), button(dom, "Edit", () => detail("edit")), button(dom, "Add child", addChild), button(dom, "Move", move), button(dom, "Remove", remove)); tree.append(row); if (condition.kind !== "predicate" && Array.isArray(condition.children))
        condition.children.forEach((child, index) => appendNode(child, [...path, index])); };
    if (draft.condition)
        appendNode(draft.condition, []);
    else
        tree.textContent = "All (empty)";
    for (const kind of ["all", "any", "not"])
        controls.append(button(dom, `Add ${kind === "all" ? "All" : kind === "any" ? "Any" : "Not"} group`, () => { draft.condition = { kind, children: [] }; context.render(); }));
    const property = dom.createElement("select"), operator = dom.createElement("select"), value = dom.createElement("input");
    property.setAttribute("aria-label", "Condition property");
    property.append(new Option("Search property", ""), ...context.model.rows.map(({ path, effective }) => new Option(path, effective.definitionId ?? path)));
    operator.setAttribute("aria-label", "Condition operator");
    operator.append(...["Equals", "Does not equal", "Exists", "Does not exist", "Starts with", "Contains", "Matches pattern", "Greater than", "At least", "Less than", "At most"].map((entry) => new Option(entry, entry)));
    value.setAttribute("aria-label", "Condition value");
    controls.append(labeled(dom, "Search property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", value), button(dom, "Add predicate", () => { if (!property.value)
        return; draft.condition = { kind: "all", children: [{ kind: "predicate", propertyId: property.value, operator: operator.value, ...(value.value ? { value: typedComposedValue(undefined, value.value) } : {}) }] }; context.render(); }));
    host.append(summary, tree, controls);
}
//# sourceMappingURL=data-layer-composed-schema-workspace-focused-conditions.js.map