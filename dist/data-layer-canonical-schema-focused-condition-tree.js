import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const input = (dom, name, value = "") => { const control = dom.createElement("input"); control.name = name; control.value = value; return control; };
const conditionAt = (root, path) => path.reduce((condition, index) => condition.kind !== "predicate" ? condition.children[index] : condition, root);
const replaceCondition = (root, path, replacement) => { if (!path.length)
    return replacement; const parent = conditionAt(root, path.slice(0, -1)); if (parent.kind !== "predicate")
    parent.children[path.at(-1)] = replacement; return root; };
const operators = ["Equals", "Does not equal", "Exists", "Does not exist", "Starts with", "Contains", "Matches pattern", "Greater than", "At least", "Less than", "At most"];
function editPredicate(row, condition, path, context) {
    if (condition.kind !== "predicate")
        return;
    const { dom } = context, editor = dom.createElement("fieldset"), property = dom.createElement("select"), operator = dom.createElement("select"), value = input(dom, "conditionEditValue", condition.value === undefined ? "" : String(condition.value));
    editor.setAttribute("aria-label", "Condition predicate editor");
    property.append(...Object.values(context.current().nodes).map((candidate) => new Option(candidate.name, candidate.id)));
    operator.append(...operators.map((entry) => new Option(entry, entry)));
    property.value = condition.propertyId;
    operator.value = condition.operator;
    const update = (patch) => { const next = context.getWorking(); if (next?.presence.condition)
        replaceCondition(next.presence.condition, path, { ...condition, ...patch }); };
    property.addEventListener("change", () => { update({ propertyId: property.value }); context.render(); });
    operator.addEventListener("change", () => { update({ operator: operator.value }); context.render(); });
    value.addEventListener("input", () => update({ value: value.value }));
    editor.append(labeled(dom, "Property", property), labeled(dom, "Operator", operator), labeled(dom, "Value", value), button(dom, "Apply condition", () => context.render()));
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