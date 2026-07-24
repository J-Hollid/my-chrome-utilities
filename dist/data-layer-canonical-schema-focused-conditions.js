import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
const operators = ["Equals", "Does not equal", "Exists", "Does not exist", "Starts with", "Contains", "Matches pattern", "Greater than", "At least", "Less than", "At most"];
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const input = (dom, name, value = "", type = "text") => { const control = dom.createElement("input"); control.name = name; control.type = type; control.value = value; return control; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function renderCanonicalFocusedCondition(host, context) {
    const { dom } = context, working = context.getWorking();
    if (!working)
        return;
    const summary = dom.createElement("p"), tree = dom.createElement("div"), actions = dom.createElement("div");
    summary.setAttribute("aria-label", "Condition tree summary");
    summary.textContent = focusedConditionLabel(working.presence.condition);
    tree.setAttribute("aria-label", "Readable condition tree");
    const append = (condition, path, parent) => { const row = dom.createElement("div"); row.dataset.conditionPath = path.join(".") || "root"; row.textContent = focusedConditionLabel(condition); row.append(button(dom, "View", () => { row.dataset.conditionState = "view"; const detail = dom.createElement("p"); detail.textContent = `Read-only condition · ${focusedConditionLabel(condition)}`; row.append(detail); }), button(dom, "Edit", () => { row.dataset.conditionState = "edit"; const detail = dom.createElement("p"); detail.textContent = `Editable condition · ${focusedConditionLabel(condition)}`; row.append(detail); }), button(dom, "Add child", () => { if (condition.kind !== "predicate")
        condition.children.push({ kind: "predicate", propertyId: Object.keys(context.current().nodes)[0] ?? "", operator: "Exists" }); context.render(); }), button(dom, "Move", () => { const nextDocument = context.getWorking(); if (!nextDocument || !path.length)
        return; const parentCondition = path.slice(0, -1).reduce((value, index) => value?.children?.[index], nextDocument.presence.condition), index = path.at(-1), target = index === 0 ? 1 : index - 1; if (!parentCondition?.children || target < 0 || target >= parentCondition.children.length)
        return; [parentCondition.children[index], parentCondition.children[target]] = [parentCondition.children[target], parentCondition.children[index]]; context.render(); }), button(dom, "Remove", () => { const next = context.getWorking(); if (!next)
        return; if (!path.length)
        delete next.presence.condition;
    else {
        const parentCondition = path.slice(0, -1).reduce((value, index) => value?.children?.[index], next.presence.condition);
        parentCondition?.children?.splice(path.at(-1), 1);
    } context.render(); })); (parent ?? tree).append(row); if (condition.kind !== "predicate")
        condition.children.forEach((child, index) => append(child, [...path, index], row)); };
    if (working.presence.condition)
        append(working.presence.condition, []);
    else
        tree.textContent = "No condition; presence is unconditional.";
    for (const kind of ["all", "any", "not"])
        actions.append(button(dom, `Add ${kind === "all" ? "All" : kind === "any" ? "Any" : "Not"} group`, () => { const next = context.getWorking(); if (!next)
            return; const current = next.presence.condition; if (!current)
            next.presence = { mode: next.presence.mode, condition: { kind, children: [] } };
        else if (current.kind !== "predicate")
            current.children.push({ kind, children: [] }); context.render(); }));
    const property = dom.createElement("select"), operator = dom.createElement("select"), value = input(dom, "conditionValue");
    property.setAttribute("aria-label", "Condition property");
    property.append(new Option("Choose property", ""), ...Object.values(context.current().nodes).map((candidate) => new Option(candidate.name, candidate.id)));
    operator.setAttribute("aria-label", "Condition operator");
    operator.append(...operators.map((entry) => new Option(entry, entry)));
    value.setAttribute("aria-label", "Condition value");
    actions.append(labeled(dom, "Search property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", value), button(dom, "Add predicate", () => { const next = context.getWorking(); if (!next || !property.value)
        return; const leaf = { kind: "predicate", propertyId: property.value, operator: operator.value, ...(value.value ? { value: value.value } : {}) }; const current = next.presence.condition; if (!current)
        next.presence = { mode: next.presence.mode, condition: { kind: "all", children: [leaf] } };
    else if (current.kind !== "predicate")
        current.children.push(leaf);
    else
        next.presence = { mode: next.presence.mode, condition: { kind: "all", children: [current, leaf] } }; context.render(); }));
    host.append(summary, tree, actions);
}
//# sourceMappingURL=data-layer-canonical-schema-focused-conditions.js.map