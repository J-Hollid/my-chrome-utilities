import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
import { renderCanonicalFocusedRules } from "./data-layer-canonical-schema-focused-rules.js";
const types = ["string", "number", "integer", "boolean", "object", "array", "null"];
const operators = ["Equals", "Does not equal", "Exists", "Does not exist", "Starts with", "Contains", "Matches pattern", "Greater than", "At least", "Less than", "At most"];
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const input = (dom, name, value = "", type = "text") => { const control = dom.createElement("input"); control.name = name; control.type = type; control.value = value; return control; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const presenceText = (mode) => ({ optional: "Optional", required: "Required", "required-when": "Required when", forbidden: "Forbidden", "forbidden-when": "Forbidden when" })[mode];
function renderCondition(host, context) {
    const { dom } = context, working = context.getWorking();
    if (!working)
        return;
    const summary = dom.createElement("p"), tree = dom.createElement("div"), actions = dom.createElement("div");
    summary.setAttribute("aria-label", "Condition tree summary");
    summary.textContent = focusedConditionLabel(working.presence.condition);
    tree.setAttribute("aria-label", "Readable condition tree");
    const append = (condition, path, parent) => { const row = dom.createElement("div"); row.dataset.conditionPath = path.join(".") || "root"; row.textContent = focusedConditionLabel(condition); row.append(button(dom, "View", () => { row.dataset.conditionState = "view"; }), button(dom, "Edit", () => { row.dataset.conditionState = "edit"; }), button(dom, "Add child", () => { if (condition.kind !== "predicate")
        condition.children.push({ kind: "predicate", propertyId: Object.keys(context.current().nodes)[0] ?? "", operator: "Exists" }); context.render(); }), button(dom, "Move", () => { row.dataset.conditionState = "moved"; }), button(dom, "Remove", () => { const next = context.getWorking(); if (!next)
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
export function renderCanonicalFocusedSection(host, context) {
    const { dom } = context, working = context.getWorking();
    if (!working)
        return;
    host.dataset.focusedSection = context.activeSection;
    if (context.activeSection === "definition") {
        const name = input(dom, "propertyName", working.name), type = dom.createElement("select");
        type.name = "propertyType";
        type.append(...types.map((entry) => new Option(entry, entry)));
        type.value = working.type;
        name.addEventListener("input", () => { const next = context.getWorking(); if (next)
            next.name = name.value; });
        type.addEventListener("change", () => { const next = context.getWorking(); if (next)
            next.type = type.value; });
        const rename = button(dom, "Rename", () => { const next = context.getWorking(); if (!next)
            return; const original = context.current().nodes[next.id]; if (!original)
            return; const result = context.command({ kind: "set", baseRevision: context.current().revision, propertyId: next.id, patch: context.patchFor(next, original) }); if (result.status === "applied" || result.status === "rebased") {
            context.setWorking(undefined);
            context.render();
        } }), addChild = button(dom, "Add child", () => { const next = context.getWorking(); if (!next)
            return; const result = context.command({ kind: "add", baseRevision: context.current().revision, parentId: next.id, name: "child", type: "string", id: context.id }); if ((result.status === "applied" || result.status === "rebased") && result.document) {
            context.select(result.document.selectedPropertyId);
            context.setWorking(undefined);
            context.render();
        } }), addSibling = button(dom, "Add sibling", () => { const next = context.getWorking(); if (!next)
            return; const result = context.command({ kind: "add", baseRevision: context.current().revision, ...(next.parentId ? { parentId: next.parentId } : {}), afterId: next.id, name: "property", type: "string", id: context.id }); if ((result.status === "applied" || result.status === "rebased") && result.document) {
            context.select(result.document.selectedPropertyId);
            context.setWorking(undefined);
            context.render();
        } });
        host.append(labeled(dom, "Property name", name), labeled(dom, "Type", type), rename, addChild, addSibling);
    }
    if (context.activeSection === "presence") {
        const presence = dom.createElement("select");
        presence.name = "presenceMode";
        presence.append(...["optional", "required", "required-when", "forbidden", "forbidden-when"].map((entry) => new Option(presenceText(entry), entry)));
        presence.value = working.presence.mode;
        presence.addEventListener("change", () => { const next = context.getWorking(); if (next)
            next.presence = { ...next.presence, mode: presence.value }; });
        host.append(labeled(dom, "Presence", presence));
        if (working.presence.condition)
            renderCondition(host, context);
    }
    if (context.activeSection === "values") {
        const list = dom.createElement("div");
        working.allowedValues.forEach((entry, index) => { const row = dom.createElement("div"), value = input(dom, `allowedValue-${entry.id}`, String(entry.value)); value.setAttribute("aria-label", `Allowed value ${index + 1}`); value.addEventListener("input", () => { const next = context.getWorking(); if (next)
            next.allowedValues[index] = { ...entry, value: value.value }; }); row.append(labeled(dom, `Value ${index + 1}`, value), button(dom, "Remove", () => { const next = context.getWorking(); if (next) {
            next.allowedValues.splice(index, 1);
            context.render();
        } })); list.append(row); });
        host.append(list, button(dom, "Add allowed value", () => { const next = context.getWorking(); if (next) {
            next.allowedValues.push({ id: context.id("allowed-value"), value: "" });
            context.render();
        } }));
    }
    if (context.activeSection === "conditions")
        renderCondition(host, context);
    if (context.activeSection === "rules")
        renderCanonicalFocusedRules(host, context);
    if (context.activeSection === "documentation") {
        const display = input(dom, "displayText", working.documentation.displayText), description = dom.createElement("textarea"), comments = dom.createElement("textarea");
        description.name = "description";
        description.value = working.documentation.description;
        comments.name = "comments";
        comments.value = working.documentation.comments;
        display.addEventListener("input", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, displayText: display.value }; });
        description.addEventListener("input", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, description: description.value }; });
        comments.addEventListener("input", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, comments: comments.value }; });
        host.append(labeled(dom, "Display text", display), labeled(dom, "Description", description), labeled(dom, "Comments", comments));
    }
    if (context.activeSection === "example") {
        const method = dom.createElement("select"), value = input(dom, "exampleValue", String(working.documentation.example.value ?? ""));
        method.name = "exampleMethod";
        method.append(...["allowed-value", "custom", "blank"].map((entry) => new Option(entry, entry)));
        method.value = working.documentation.example.method;
        method.addEventListener("change", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, example: { method: method.value, value: method.value === "blank" ? undefined : value.value } }; });
        value.addEventListener("input", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, example: { method: method.value, value: value.value } }; });
        host.append(labeled(dom, "Example method", method), labeled(dom, "Example value", value));
    }
    if (context.activeSection === "structure")
        host.append(Object.assign(dom.createElement("p"), { textContent: `Stable identity ${working.id} · ${context.current().id}` }), labeled(dom, "Name", input(dom, "structureName", working.name)), button(dom, "Add child", () => { }), button(dom, "Add sibling", () => { }));
}
//# sourceMappingURL=data-layer-canonical-schema-focused-sections.js.map