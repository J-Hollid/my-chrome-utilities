import { focusedRuleFields } from "./data-layer-focused-schema-property-ui.js";
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const input = (dom, name, value = "", type = "text") => { const control = dom.createElement("input"); control.name = name; control.type = type; control.value = value; return control; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function renderCanonicalRuleAddPanel(host, context) {
    const { dom } = context, working = context.getWorking();
    if (!working)
        return;
    const panel = dom.createElement("fieldset"), legend = dom.createElement("legend"), kind = dom.createElement("select"), fields = dom.createElement("div");
    legend.textContent = "Add rule";
    kind.name = "ruleKind";
    kind.append(...["pattern", "range", "cardinality", "condition", "custom"].map((entry) => new Option(entry, entry)));
    const renderFields = () => { fields.replaceChildren(); for (const field of focusedRuleFields(kind.value)) {
        if (field === "condition")
            continue;
        if (field === "reusableRuleId") {
            const search = input(dom, "reusableRuleSearch");
            search.placeholder = "Search reusable rules by name";
            const reusable = dom.createElement("select");
            reusable.name = "newRuleReusableRuleId";
            reusable.setAttribute("aria-label", "Reusable rule name");
            reusable.append(new Option("No reusable rule", ""), ...working.rules.filter(({ reusableRuleId }, index, array) => reusableRuleId && array.findIndex((candidate) => candidate.reusableRuleId === reusableRuleId) === index).map((candidate) => new Option(candidate.name ?? candidate.reusableRuleId, candidate.reusableRuleId)));
            fields.append(labeled(dom, "Search reusable rules", search), labeled(dom, "Reusable rule", reusable));
            continue;
        }
        fields.append(labeled(dom, field, input(dom, `newRule${field[0].toUpperCase() + field.slice(1)}`, "", ["minimum", "maximum", "minItems", "maxItems"].includes(field) ? "number" : "text")));
    } };
    kind.addEventListener("change", renderFields);
    renderFields();
    panel.append(legend, labeled(dom, "Rule kind", kind), fields, button(dom, "Add rule", () => { const next = context.getWorking(); if (!next)
        return; const rule = { id: context.id("rule"), kind: kind.value, severity: "error", message: "" }; for (const field of ["pattern", "minimum", "maximum", "minItems", "maxItems"]) {
        const control = fields.querySelector(`[name="newRule${field[0].toUpperCase() + field.slice(1)}"]`);
        if (control?.value)
            Object.assign(rule, { [field]: field.includes("Items") || ["minimum", "maximum"].includes(field) ? Number(control.value) : control.value });
    } const message = fields.querySelector("[name=\"newRuleMessage\"]"); if (message)
        rule.message = message.value; const reusable = fields.querySelector("[name=\"newRuleReusableRuleId\"]"); if (reusable?.value)
        rule.reusableRuleId = reusable.value; next.rules = [...next.rules, rule]; context.feedback("Staged rule addition."); context.render(); }));
    host.append(panel);
}
//# sourceMappingURL=data-layer-canonical-schema-focused-rule-add.js.map