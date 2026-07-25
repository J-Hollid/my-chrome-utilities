import { filterFocusedReusableRules, focusedRuleFields, focusedRuleIssue, readFocusedReusableRules } from "./data-layer-focused-schema-property-ui.js";
import { renderSharedConditionTree } from "./data-layer-shared-condition-tree-editor.js";
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const input = (dom, name, value = "", type = "text") => { const control = dom.createElement("input"); control.name = name; control.type = type; control.value = value; return control; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const numericFields = new Set(["minimum", "maximum", "minItems", "maxItems"]);
export function renderCanonicalRuleAddPanel(host, context) {
    const { dom } = context, working = context.getWorking();
    if (!working)
        return;
    const panel = dom.createElement("fieldset"), legend = dom.createElement("legend"), kind = dom.createElement("select"), fields = dom.createElement("div"), status = dom.createElement("p");
    let condition;
    legend.textContent = "Add rule";
    status.setAttribute("role", "status");
    kind.name = "ruleKind";
    kind.append(new Option("Choose rule kind", ""), ...["pattern", "range", "cardinality", "condition", "reusable", "custom"].map((entry) => new Option(entry, entry)));
    const candidate = () => {
        if (!kind.value)
            return undefined;
        const rule = { id: "staged-rule", kind: kind.value, severity: "error" };
        for (const field of ["pattern", "minimum", "maximum", "minItems", "maxItems", "message"]) {
            const control = fields.querySelector(`[name="newRule${field[0].toUpperCase() + field.slice(1)}"]`);
            if (control && control.value !== "")
                Object.assign(rule, { [field]: numericFields.has(field) ? Number(control.value) : control.value });
        }
        if (condition)
            rule.condition = condition;
        const reusable = fields.querySelector("[name=\"newRuleReusableRuleId\"]");
        if (reusable?.value) {
            rule.reusableRuleId = reusable.value;
            const name = reusable.selectedOptions[0]?.textContent;
            if (name)
                rule.name = name;
        }
        return rule;
    };
    const validate = () => { const issue = candidate() ? focusedRuleIssue(candidate()) : undefined; addRule.disabled = !kind.value || Boolean(issue); status.textContent = issue ?? ""; };
    const renderFields = () => {
        fields.replaceChildren();
        condition = undefined;
        if (!kind.value) {
            validate();
            return;
        }
        for (const field of focusedRuleFields(kind.value)) {
            if (field === "condition") {
                const tree = dom.createElement("div");
                renderSharedConditionTree(tree, { dom, properties: () => context.properties?.() ?? [], id: context.id, onChange: (next) => { condition = next; validate(); } });
                fields.append(labeled(dom, "Condition tree", tree));
                continue;
            }
            if (field === "reusableRuleId") {
                const search = input(dom, "reusableRuleSearch");
                search.type = "search";
                search.placeholder = "Search reusable rules by name";
                const reusable = dom.createElement("select");
                reusable.name = "newRuleReusableRuleId";
                reusable.setAttribute("aria-label", "Reusable rule name");
                const renderChoices = () => { const selected = reusable.value, choices = filterFocusedReusableRules(readFocusedReusableRules(), search.value); reusable.replaceChildren(new Option("Choose reusable rule", ""), ...choices.map(({ id, name }) => new Option(name, id))); if (choices.some(({ id }) => id === selected))
                    reusable.value = selected; validate(); };
                search.addEventListener("input", renderChoices);
                reusable.addEventListener("change", validate);
                renderChoices();
                fields.append(labeled(dom, "Search reusable rules", search), labeled(dom, "Reusable rule", reusable));
                continue;
            }
            const control = input(dom, `newRule${field[0].toUpperCase() + field.slice(1)}`, "", numericFields.has(field) ? "number" : "text");
            control.addEventListener("input", validate);
            fields.append(labeled(dom, field, control));
        }
        validate();
    };
    const addRule = button(dom, "Add rule", () => {
        const next = context.getWorking(), rule = candidate();
        if (!next || !rule)
            return;
        const issue = focusedRuleIssue(rule);
        if (issue) {
            status.textContent = issue;
            return;
        }
        rule.id = context.id("rule");
        next.rules = [...next.rules, rule];
        context.feedback("Staged rule addition.");
        context.render();
    });
    addRule.disabled = true;
    kind.required = true;
    kind.addEventListener("change", renderFields);
    renderFields();
    panel.append(legend, labeled(dom, "Rule kind", kind), fields, status, addRule);
    host.append(panel);
}
//# sourceMappingURL=data-layer-canonical-schema-focused-rule-add.js.map