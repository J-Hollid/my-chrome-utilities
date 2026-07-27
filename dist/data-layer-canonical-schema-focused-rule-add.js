import { filterFocusedReusableRules, focusedReusableOutcome, focusedRuleFields, focusedRuleIssue, readFocusedReusableRules } from "./data-layer-focused-schema-property-ui.js";
import { renderSharedConditionTree } from "./data-layer-shared-condition-tree-editor.js";
import { schemaTableStageAllowedValues } from "./data-layer-schema-table.js";
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const input = (dom, name, value = "", type = "text") => { const control = dom.createElement("input"); control.name = name; control.type = type; control.value = value; return control; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const numericFields = new Set(["minimum", "maximum", "minItems", "maxItems"]);
const section = (dom, title) => { const value = dom.createElement("section"), heading = dom.createElement("h3"); heading.textContent = title; value.append(heading); return value; };
export function renderCanonicalRuleAddPanel(host, context) {
    const { dom } = context;
    const opener = button(dom, "Add rule", () => open());
    host.append(opener);
    const open = () => {
        const working = context.getWorking();
        if (!working)
            return;
        opener.remove();
        const panel = dom.createElement("fieldset"), legend = dom.createElement("legend"), details = section(dom, "Rule details"), when = section(dom, "When"), then = section(dom, "Then"), severitySection = section(dom, "Severity and message"), actions = section(dom, "Rule actions"), kind = dom.createElement("select"), fields = dom.createElement("div"), status = dom.createElement("p"), name = input(dom, "newRuleName");
        let condition;
        panel.dataset.ruleEditorMode = "add";
        panel.setAttribute("aria-label", "Add rule editor");
        legend.textContent = "Add rule";
        status.setAttribute("role", "status");
        kind.name = "ruleKind";
        kind.required = true;
        kind.append(new Option("Choose rule type", ""), ...["presence", "value", "pattern", "range", "cardinality", "reusable"].map((entry) => new Option(entry, entry)));
        details.append(labeled(dom, "Rule name", name), labeled(dom, "Rule type", kind));
        const conditionHost = dom.createElement("div");
        when.append(conditionHost);
        const candidate = () => {
            if (!kind.value)
                return undefined;
            const trimmedName = name.value.trim(), rule = { id: "staged-rule", kind: kind.value, severity: (severitySection.querySelector("[name=\"newRuleSeverity\"]")?.value ?? "error"), ...(trimmedName ? { name: trimmedName } : {}), ...(condition ? { condition } : {}) };
            for (const field of ["pattern", "minimum", "maximum", "minItems", "maxItems", "message"]) {
                const control = panel.querySelector(`[name="newRule${field[0].toUpperCase() + field.slice(1)}"]`);
                if (control && control.value !== "")
                    Object.assign(rule, { [field]: numericFields.has(field) ? Number(control.value) : control.value });
            }
            const presence = panel.querySelector("[name=\"newRulePresence\"]");
            if (presence?.value)
                rule.presence = presence.value;
            const ordinary = panel.querySelector("[name=\"newRuleOrdinaryValue\"]");
            if (ordinary?.value)
                rule.allowedValues = schemaTableStageAllowedValues([], ordinary.value, working.type);
            const reusable = panel.querySelector("[name=\"newRuleReusableRuleId\"]");
            if (reusable?.value) {
                rule.reusableRuleId = reusable.value;
                const source = readFocusedReusableRules().find(({ id }) => id === reusable.value), ruleName = source?.name ?? reusable.selectedOptions[0]?.textContent, outcome = source && focusedReusableOutcome(source);
                if (ruleName)
                    rule.name = ruleName;
                if (outcome)
                    rule.reusableOutcome = outcome;
            }
            return rule;
        };
        const add = button(dom, "Add rule", () => { const next = context.getWorking(), rule = candidate(); if (!next || !rule)
            return; const issue = focusedRuleIssue(rule); if (issue) {
            status.textContent = issue;
            return;
        } rule.id = context.id("rule"); next.rules = [...next.rules, rule]; context.feedback("Staged rule addition."); context.render(); });
        const validate = () => { const rule = candidate(), issue = rule ? focusedRuleIssue(rule) : "Choose a rule type."; add.disabled = Boolean(issue); status.textContent = issue ?? ""; };
        const renderOutcome = () => {
            fields.replaceChildren();
            for (const field of focusedRuleFields(kind.value)) {
                if (field === "condition" || field === "severity" || field === "message")
                    continue;
                if (field === "reusableRuleId") {
                    const search = input(dom, "reusableRuleSearch"), reusable = dom.createElement("select");
                    search.type = "search";
                    search.placeholder = "Search reusable rules by name";
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
                if (field === "presence") {
                    const control = dom.createElement("select");
                    control.name = "newRulePresence";
                    control.append(new Option("Choose presence", ""), new Option("Required", "required"), new Option("Optional", "optional"), new Option("Forbidden", "forbidden"));
                    control.addEventListener("change", validate);
                    fields.append(labeled(dom, "Presence", control));
                    continue;
                }
                const control = input(dom, `newRule${field[0].toUpperCase() + field.slice(1)}`, "", numericFields.has(field) ? "number" : "text");
                control.addEventListener("input", validate);
                fields.append(labeled(dom, field === "ordinaryValue" ? "Allowed values" : field, control));
            }
            validate();
        };
        const severity = dom.createElement("select"), message = input(dom, "newRuleMessage");
        severity.name = "newRuleSeverity";
        severity.append(new Option("error", "error"), new Option("warning", "warning"));
        severity.addEventListener("change", validate);
        message.addEventListener("input", validate);
        severitySection.append(labeled(dom, "Severity", severity), labeled(dom, "Message", message));
        name.addEventListener("input", validate);
        kind.addEventListener("change", renderOutcome);
        actions.setAttribute("aria-label", "Rule actions");
        actions.append(status, button(dom, "Cancel", () => { panel.remove(); host.prepend(opener); opener.focus({ preventScroll: true }); }), add);
        then.append(fields);
        panel.append(legend, details, when, then, severitySection, actions);
        host.append(panel);
        renderSharedConditionTree(conditionHost, { dom, properties: () => context.properties?.() ?? [], id: context.id, onChange: (next) => { condition = next; validate(); } });
        renderOutcome();
        name.focus({ preventScroll: true });
    };
}
//# sourceMappingURL=data-layer-canonical-schema-focused-rule-add.js.map