import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
import { renderCanonicalConditionTree } from "./data-layer-canonical-schema-focused-condition-tree.js";
import { typedCanonicalValue } from "./data-layer-canonical-schema-facets.js";
const existence = ["Exists", "Does not exist"];
const operatorsFor = (type) => type === "number" || type === "integer" ? [...existence, "Equals", "Does not equal", "Greater than", "At least", "Less than", "At most"] : type === "boolean" || type === "null" ? [...existence, "Equals", "Does not equal"] : [...existence, "Equals", "Does not equal", "Starts with", "Contains", "Matches pattern"];
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
    operator.setAttribute("aria-label", "Type-valid operator");
    value.setAttribute("aria-label", "Typed value");
    const selected = () => context.current().nodes[property.value], renderOperators = () => { operator.replaceChildren(...operatorsFor(selected()?.type).map((entry) => new Option(entry, entry))); value.hidden = existence.includes(operator.value); };
    property.addEventListener("change", () => { renderOperators(); });
    operator.addEventListener("change", () => { value.hidden = existence.includes(operator.value); });
    renderOperators();
    actions.append(labeled(dom, "Search property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", value), button(dom, "Add predicate", () => { const next = context.getWorking(), candidate = selected(); if (!next || !candidate || !operator.value)
        return; const typed = existence.includes(operator.value) ? undefined : typedCanonicalValue(candidate.type, value.value); const leaf = { kind: "predicate", propertyId: property.value, operator: operator.value, ...(typed === undefined ? {} : { value: typed }) }; const current = next.presence.condition; if (!current)
        next.presence = { mode: next.presence.mode, condition: { kind: "all", children: [leaf] } };
    else if (current.kind !== "predicate")
        current.children.push(leaf);
    else
        next.presence = { mode: next.presence.mode, condition: { kind: "all", children: [current, leaf] } }; context.render(); }));
    host.append(summary, treeHost, actions);
}
//# sourceMappingURL=data-layer-canonical-schema-focused-conditions.js.map