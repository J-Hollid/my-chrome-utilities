import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
import { typedCanonicalValue } from "./data-layer-canonical-schema-facets.js";
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const input = (dom, name, value = "") => { const control = dom.createElement("input"); control.name = name; control.value = value; return control; };
const conditionAt = (root, path) => path.reduce((condition, index) => condition.kind !== "predicate" ? condition.children[index] : condition, root);
const replaceCondition = (root, path, replacement) => { if (!path.length)
    return replacement; const parent = conditionAt(root, path.slice(0, -1)); if (parent.kind !== "predicate")
    parent.children[path.at(-1)] = replacement; return root; };
const existence = ["Exists", "Does not exist"];
const operatorsFor = (type) => type === "number" || type === "integer" ? [...existence, "Equals", "Does not equal", "Greater than", "At least", "Less than", "At most"] : type === "boolean" || type === "null" ? [...existence, "Equals", "Does not equal"] : [...existence, "Equals", "Does not equal", "Starts with", "Contains", "Matches pattern"];
function editPredicate(row, condition, path, context) {
    if (condition.kind !== "predicate")
        return;
    const { dom } = context, editor = dom.createElement("fieldset"), property = dom.createElement("select"), operator = dom.createElement("select"), value = input(dom, "conditionEditValue", condition.value === undefined ? "" : String(condition.value));
    editor.setAttribute("aria-label", "Condition predicate editor");
    property.append(...Object.values(context.current().nodes).map((candidate) => new Option(candidate.name, candidate.id)));
    property.value = condition.propertyId;
    const renderOperators = () => { const selected = context.current().nodes[property.value]; operator.replaceChildren(...operatorsFor(selected?.type).map((entry) => new Option(entry, entry))); operator.value = condition.operator; value.hidden = existence.includes(operator.value); };
    renderOperators();
    const update = (patch) => { const next = context.getWorking(); if (next?.presence.condition)
        replaceCondition(next.presence.condition, path, { ...condition, ...patch }); };
    property.addEventListener("change", () => { condition.propertyId = property.value; condition.value = undefined; renderOperators(); update({ propertyId: property.value, value: undefined }); context.render(); });
    operator.addEventListener("change", () => { condition.operator = operator.value; condition.value = undefined; update({ operator: operator.value, value: undefined }); value.hidden = existence.includes(operator.value); });
    value.addEventListener("input", () => { const selected = context.current().nodes[property.value]; const typed = selected ? typedCanonicalValue(selected.type, value.value) : value.value; update({ value: typed }); });
    editor.append(labeled(dom, "Property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", value), button(dom, "Apply condition", () => context.render()));
    row.append(editor);
}
function appendCondition(rowParent, condition, path, context) {
    const { dom } = context, row = dom.createElement("div");
    row.dataset.conditionPath = path.join(".") || "root";
    row.textContent = focusedConditionLabel(condition);
    const detail = (mode) => { row.dataset.conditionState = mode; const description = dom.createElement("p"); description.textContent = `${mode === "view" ? "Read-only" : "Editable"} condition · ${focusedConditionLabel(condition)}`; row.append(description); };
    const addChild = () => { const next = context.getWorking(); if (!next)
        return; const firstProperty = Object.keys(context.current().nodes)[0] ?? ""; if (condition.kind === "predicate") {
        const replacement = { kind: "all", children: [condition, { kind: "predicate", propertyId: firstProperty, operator: "Exists" }] };
        next.presence.condition = replaceCondition(next.presence.condition, path, replacement);
    }
    else if (condition.kind !== "not" || condition.children.length === 0)
        condition.children.push({ kind: "predicate", propertyId: firstProperty, operator: "Exists" }); context.render(); };
    row.append(button(dom, "View", () => detail("view")), button(dom, "Edit", () => { detail("edit"); editPredicate(row, condition, path, context); }), button(dom, "Add child", addChild), button(dom, "Move", () => { const next = context.getWorking(); if (!next || !path.length)
        return; const parent = conditionAt(next.presence.condition, path.slice(0, -1)); if (parent.kind === "predicate")
        return; const index = path.at(-1), target = index === 0 ? 1 : index - 1; if (target < 0 || target >= parent.children.length)
        return; [parent.children[index], parent.children[target]] = [parent.children[target], parent.children[index]]; context.render(); }), button(dom, "Remove", () => { const next = context.getWorking(); if (!next)
        return; if (!path.length)
        delete next.presence.condition;
    else {
        const parent = conditionAt(next.presence.condition, path.slice(0, -1));
        if (parent.kind !== "predicate")
            parent.children.splice(path.at(-1), 1);
    } context.render(); }));
    rowParent.append(row);
    if (condition.kind !== "predicate")
        condition.children.forEach((child, index) => appendCondition(row, child, [...path, index], context));
}
export function renderCanonicalConditionTree(host, context) { const { dom } = context, working = context.getWorking(); if (!working)
    return; const tree = dom.createElement("div"); tree.setAttribute("aria-label", "Readable condition tree"); if (working.presence.condition)
    appendCondition(tree, working.presence.condition, [], context);
else
    tree.textContent = "No condition; presence is unconditional."; host.append(tree); }
//# sourceMappingURL=data-layer-canonical-schema-focused-condition-tree.js.map