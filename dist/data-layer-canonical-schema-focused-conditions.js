import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
import { renderCanonicalConditionTree } from "./data-layer-canonical-schema-focused-condition-tree.js";
const operators = ["Equals", "Does not equal", "Exists", "Does not exist", "Starts with", "Contains", "Matches pattern", "Greater than", "At least", "Less than", "At most"];
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function renderCanonicalFocusedCondition(host, context) {
    const { dom } = context, working = context.getWorking();
    if (!working)
        return;
    const summary = dom.createElement("p"), treeHost = dom.createElement("div"), actions = dom.createElement("div");
    summary.setAttribute("aria-label", "Condition tree summary");
    summary.textContent = focusedConditionLabel(working.presence.condition);
    renderCanonicalConditionTree(treeHost, context);
    for (const kind of ["all", "any", "not"])
        actions.append(button(dom, `Add ${kind === "all" ? "All" : kind === "any" ? "Any" : "Not"} group`, () => { const next = context.getWorking(); if (!next)
            return; const current = next.presence.condition; if (!current)
            next.presence = { mode: next.presence.mode, condition: { kind, children: [] } };
        else if (current.kind !== "predicate" && !(current.kind === "not" && current.children.length))
            current.children.push({ kind, children: [] }); context.render(); }));
    const property = dom.createElement("select"), operator = dom.createElement("select"), value = dom.createElement("input");
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
    host.append(summary, treeHost, actions);
}
//# sourceMappingURL=data-layer-canonical-schema-focused-conditions.js.map