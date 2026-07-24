import { typedComposedValue } from "./data-layer-composed-schema-builders.js";
import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const valueText = (value) => value === undefined ? "unset" : typeof value === "string" ? value : JSON.stringify(value);
function renderCondition(host, context) {
    const { dom } = context, draft = context.getDraft();
    if (!draft)
        return;
    const summary = dom.createElement("p"), tree = dom.createElement("div"), controls = dom.createElement("div");
    summary.textContent = focusedConditionLabel(draft.condition);
    tree.setAttribute("aria-label", "Readable condition tree");
    const appendNode = (condition, path) => {
        const row = dom.createElement("article");
        row.dataset.conditionPath = path.join(".") || "root";
        row.textContent = focusedConditionLabel(condition);
        row.append(button(dom, "View", () => { row.dataset.conditionState = "view"; }), button(dom, "Edit", () => { row.dataset.conditionState = "edit"; }), button(dom, "Add child", () => { }), button(dom, "Move", () => { }), button(dom, "Remove", () => { }));
        tree.append(row);
        if (condition.kind !== "predicate" && Array.isArray(condition.children))
            condition.children.forEach((child, index) => appendNode(child, [...path, index]));
    };
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
function renderRules(host, context) {
    const { dom } = context, draft = context.getDraft();
    if (!draft)
        return;
    const list = dom.createElement("div");
    list.setAttribute("aria-label", "Stable rule inventory");
    const localIds = new Set((context.row.local.rules ?? []).map((rule) => String(rule.id ?? "")));
    draft.rules.forEach((rule, index) => {
        const row = dom.createElement("article"), summary = dom.createElement("p"), id = String(rule.id ?? `rule-${index}`), local = localIds.has(id), removed = context.removedRuleIds.has(id);
        row.dataset.ruleId = id;
        row.dataset.ownership = local ? "local" : "inherited";
        summary.textContent = `${String(rule.name ?? rule.kind ?? "rule")} · ${String(rule.kind ?? "custom")} · ${String(rule.severity ?? "error")} · ${String(rule.message ?? "No issue message")} · ${local ? "local" : "inherited"}${removed ? " · Removed" : ""}`;
        row.append(summary, button(dom, "View", () => { row.dataset.ruleMode = "view"; }));
        if (local && !removed)
            row.append(button(dom, "Edit", () => { row.dataset.ruleMode = "edit"; }), button(dom, "Remove local", () => { context.removedRuleIds.add(id); context.render(); }));
        else if (local)
            row.append(button(dom, "Restore", () => { context.removedRuleIds.delete(id); context.render(); }));
        else
            row.append(button(dom, "Override here", () => { }), button(dom, "Open source", () => { }));
        list.append(row);
    });
    const addPanel = dom.createElement("fieldset"), kind = dom.createElement("select"), fields = dom.createElement("div");
    kind.name = "ruleKind";
    kind.append(...["pattern", "range", "cardinality", "condition", "custom"].map((entry) => new Option(entry, entry)));
    const renderFields = () => { fields.replaceChildren(); const names = kind.value === "pattern" ? ["pattern", "severity", "message"] : kind.value === "range" ? ["minimum", "maximum", "severity", "message"] : kind.value === "cardinality" ? ["minItems", "maxItems", "severity", "message"] : ["severity", "message", "reusableRuleId"]; for (const name of names) {
        if (name === "reusableRuleId") {
            const search = dom.createElement("input");
            search.name = "reusableRuleSearch";
            search.placeholder = "Search reusable rules by name";
            const reusable = dom.createElement("select");
            reusable.name = "reusableRuleId";
            reusable.setAttribute("aria-label", "Reusable rule name");
            reusable.append(new Option("No reusable rule", ""), ...draft.rules.filter(({ reusableRuleId }, index, array) => reusableRuleId && array.findIndex((candidate) => candidate.reusableRuleId === reusableRuleId) === index).map((candidate) => new Option(String(candidate.name ?? candidate.reusableRuleId), String(candidate.reusableRuleId))));
            fields.append(labeled(dom, "Search reusable rules", search), labeled(dom, "Reusable rule", reusable));
            continue;
        }
        const control = dom.createElement("input");
        control.name = `newRule${name}`;
        if (["minimum", "maximum", "minItems", "maxItems"].includes(name))
            control.type = "number";
        fields.append(labeled(dom, name, control));
    } };
    kind.addEventListener("change", renderFields);
    renderFields();
    addPanel.append(labeled(dom, "Rule kind", kind), fields, button(dom, "Add rule", () => { const rule = { id: `rule:${crypto.randomUUID()}`, kind: kind.value, severity: "error", message: "" }; for (const control of Array.from(fields.querySelectorAll("input")))
        if (control.value)
            rule[control.name.replace(/^newRule/, "").replace(/^./, (letter) => letter.toLowerCase())] = ["minimum", "maximum", "minItems", "maxItems"].some((name) => control.name.endsWith(name)) ? Number(control.value) : control.value; const reusable = fields.querySelector("[name=\"reusableRuleId\"]"); if (reusable?.value)
        rule.reusableRuleId = reusable.value; draft.rules = [...draft.rules, rule]; context.render(); }));
    host.append(list, addPanel);
}
export function renderComposedFocusedSection(host, context) {
    const { dom } = context, draft = context.getDraft();
    if (!draft)
        return;
    host.dataset.focusedSection = context.activeSection;
    if (context.activeSection === "definition") {
        const type = dom.createElement("select");
        type.name = "propertyType";
        type.append(new Option("Inherit type", ""), ...["string", "number", "integer", "boolean", "object", "array", "null"].map((entry) => new Option(entry, entry)));
        type.value = draft.type ?? "";
        type.addEventListener("change", () => { draft.type = type.value || undefined; });
        host.append(labeled(dom, "Type", type));
    }
    if (context.activeSection === "presence") {
        const presence = dom.createElement("select");
        presence.name = "presenceMode";
        presence.append(new Option("Inherit presence", ""), ...["required", "optional", "forbidden", "permitted"].map((entry) => new Option(entry, entry)));
        presence.value = draft.presence ?? "";
        presence.addEventListener("change", () => { draft.presence = presence.value || undefined; });
        host.append(labeled(dom, "Presence", presence));
    }
    if (context.activeSection === "values") {
        const list = dom.createElement("div");
        draft.allowedValues.forEach((entry, index) => { const control = dom.createElement("input"); control.value = valueText(entry); control.setAttribute("aria-label", `Allowed value ${index + 1}`); control.addEventListener("input", () => { draft.allowedValues[index] = control.value; }); list.append(labeled(dom, `Value ${index + 1}`, control), button(dom, "Remove", () => { draft.allowedValues = draft.allowedValues.filter((_, candidate) => candidate !== index); context.render(); })); });
        host.append(list, button(dom, "Add allowed value", () => { draft.allowedValues = [...draft.allowedValues, ""]; context.render(); }));
    }
    if (context.activeSection === "conditions")
        renderCondition(host, context);
    if (context.activeSection === "rules")
        renderRules(host, context);
    if (context.activeSection === "documentation") {
        const control = dom.createElement("textarea");
        control.name = "documentation";
        control.value = draft.documentation;
        control.addEventListener("input", () => { draft.documentation = control.value; });
        host.append(labeled(dom, "Documentation", control));
    }
    if (context.activeSection === "example") {
        const control = dom.createElement("input");
        control.name = "exampleValue";
        control.value = valueText(draft.exampleValue);
        control.addEventListener("input", () => { draft.exampleValue = control.value; });
        host.append(labeled(dom, "Example", control));
    }
    if (context.activeSection === "structure")
        host.append(Object.assign(dom.createElement("p"), { textContent: `Stable identity ${context.row.path}` }));
}
//# sourceMappingURL=data-layer-composed-schema-workspace-focused-sections.js.map