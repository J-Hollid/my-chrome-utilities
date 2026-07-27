import { filterFocusedReusableRules, focusedOwnershipActions, focusedReusableOutcome, focusedRuleFields, focusedRuleIssue, readFocusedReusableRules } from "./data-layer-focused-schema-property-ui.js";
import { renderSharedConditionTree } from "./data-layer-shared-condition-tree-editor.js";
import { schemaTableAllowedValues, schemaTableRuleConditionSummary, schemaTableRuleOutcomeSummary, schemaTableStageAllowedValues } from "./data-layer-schema-table.js";
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const numericFields = new Set(["minimum", "maximum", "minItems", "maxItems"]);
const clone = (value) => structuredClone(value);
const properties = (context) => () => context.model.rows.map(({ path, effective }) => ({ id: effective.definitionId ?? path, name: path.split("/").filter(Boolean).at(-1) ?? path, ...(effective.type ? { type: effective.type } : {}) }));
const section = (dom, title) => { const host = dom.createElement("section"), heading = dom.createElement("h3"); heading.textContent = title; host.append(heading); return host; };
function renderRuleEditor(row, rule, index, context, invoker) {
    const { dom } = context, draftRule = clone(rule), editor = dom.createElement("fieldset"), details = section(dom, "Rule details"), when = section(dom, "When"), then = section(dom, "Then"), severity = section(dom, "Severity and message"), actions = section(dom, "Rule actions"), status = dom.createElement("p");
    let save;
    editor.dataset.ruleEditorMode = "edit";
    editor.setAttribute("aria-label", `Edit rule ${String(rule.id ?? index)}`);
    actions.setAttribute("aria-label", "Rule actions");
    status.setAttribute("role", "status");
    const validate = () => { const issue = focusedRuleIssue(draftRule); if (save)
        save.disabled = Boolean(issue); status.textContent = issue ?? ""; };
    const name = dom.createElement("input"), kind = dom.createElement("select");
    name.name = "editRuleName";
    name.value = String(draftRule.name ?? "");
    kind.name = "editRuleKind";
    kind.disabled = true;
    kind.append(new Option(String(draftRule.kind ?? "rule"), String(draftRule.kind ?? "rule")));
    name.addEventListener("input", () => { if (name.value.trim())
        draftRule.name = name.value.trim();
    else
        delete draftRule.name; validate(); });
    details.append(labeled(dom, "Rule name", name), labeled(dom, "Rule type", kind));
    const tree = dom.createElement("div");
    renderSharedConditionTree(tree, { dom, ...(draftRule.condition ? { condition: draftRule.condition } : {}), properties: properties(context), id: (kindName) => `${kindName}:${crypto.randomUUID()}`, onChange: (next) => { if (next)
            draftRule.condition = next;
        else
            delete draftRule.condition; validate(); } });
    when.append(tree);
    for (const field of focusedRuleFields(String(draftRule.kind ?? "reusable"))) {
        if (field === "condition" || field === "reusableRuleId")
            continue;
        if (field === "presence") {
            const control = dom.createElement("select");
            control.name = "editRulePresence";
            control.append(new Option("Required", "required"), new Option("Optional", "optional"), new Option("Forbidden", "forbidden"));
            control.value = String(draftRule.presence ?? "required");
            control.addEventListener("change", () => { draftRule.presence = control.value; validate(); });
            then.append(labeled(dom, "Presence", control));
            continue;
        }
        if (field === "ordinaryValue") {
            const control = dom.createElement("input");
            control.name = "editRuleOrdinaryValue";
            control.value = schemaTableAllowedValues(draftRule);
            control.addEventListener("input", () => { delete draftRule.expectedValue; draftRule.allowedValues = schemaTableStageAllowedValues(Array.isArray(draftRule.allowedValues) ? draftRule.allowedValues : [], control.value, (context.getDraft()?.type ?? context.row.effective.type)); validate(); });
            then.append(labeled(dom, "Allowed values", control));
            continue;
        }
        const control = field === "severity" ? dom.createElement("select") : dom.createElement("input");
        control.name = `editRule${field[0].toUpperCase() + field.slice(1)}`;
        if (control instanceof HTMLSelectElement)
            control.append(new Option("error", "error"), new Option("warning", "warning"));
        else if (numericFields.has(field))
            control.type = "number";
        control.value = String(draftRule[field] ?? "");
        control.addEventListener("input", () => { if (control.value === "")
            delete draftRule[field];
        else
            draftRule[field] = numericFields.has(field) ? Number(control.value) : control.value; validate(); });
        (field === "severity" || field === "message" ? severity : then).append(labeled(dom, field, control));
    }
    save = button(dom, "Save rule", () => { const draft = context.getDraft(), issue = focusedRuleIssue(draftRule); if (!draft)
        return; if (issue) {
        status.textContent = issue;
        return;
    } draft.rules[index] = clone(draftRule); context.render(); });
    actions.append(status, button(dom, "Cancel", () => { editor.remove(); row.dataset.ruleMode = "view"; invoker.focus({ preventScroll: true }); }), save);
    editor.append(details, when, then, severity, actions);
    row.append(editor);
    validate();
}
function renderRuleInventory(host, context) {
    const { dom } = context, draft = context.getDraft();
    if (!draft)
        return;
    const names = properties(context)(), list = dom.createElement("div");
    list.setAttribute("aria-label", "Stable rule inventory");
    const localIds = new Set((context.row.local.rules ?? []).map((rule) => String(rule.id ?? ""))), displayedById = new Map();
    for (const rule of context.row.effective.rules ?? [])
        displayedById.set(String(rule.id ?? `rule:${displayedById.size}`), rule);
    for (const rule of draft.rules)
        displayedById.set(String(rule.id ?? `rule:${displayedById.size}`), rule);
    [...displayedById.values()].forEach((rule, index) => {
        const row = dom.createElement("article"), summary = dom.createElement("p"), id = String(rule.id ?? `rule-${index}`), localIndex = draft.rules.findIndex((candidate) => String(candidate.id ?? "") === id), local = localIndex >= 0 || localIds.has(id) || context.overriddenRuleIds.has(id), removed = context.removedRuleIds.has(id);
        row.dataset.ruleId = id;
        row.dataset.ownership = local ? "local" : "inherited";
        summary.textContent = `${String(rule.name ?? rule.kind ?? "rule")} · ${schemaTableRuleConditionSummary(rule.condition, names)} · Then ${schemaTableRuleOutcomeSummary(rule)} · ${String(rule.severity ?? "error")} · ${String(rule.message ?? "No issue message")} · source ${local ? "local" : context.row.source} · ${local ? "local" : "inherited"}${removed ? " · Removed" : ""}`;
        row.append(summary, button(dom, "View", () => { row.dataset.ruleMode = "view"; const detail = dom.createElement("p"); detail.textContent = `Rule ${id} · definition ${JSON.stringify(rule)} · effective ${rule.enabled === false ? "disabled" : "enabled"} · source ${local ? "local" : "inherited"}`; row.append(detail); }));
        if (local && !removed) {
            const edit = button(dom, "Edit", () => { row.dataset.ruleMode = "edit"; renderRuleEditor(row, rule, localIndex, context, edit); });
            row.append(edit, button(dom, "Remove local", () => { context.restoredRuleIds.delete(id); context.removedRuleIds.add(id); context.render(); }));
        }
        else if (local)
            row.append(button(dom, "Restore", () => { context.removedRuleIds.delete(id); context.restoredRuleIds.add(id); context.render(); }));
        else {
            const choices = focusedOwnershipActions({ inherited: true, invariant: rule.enforcement === "invariant", replaceable: rule.enforcement === "overridable" });
            if (choices.includes("Replace here"))
                row.append(button(dom, "Replace here", () => context.overrideRule(id)));
            if (choices.includes("Override here"))
                row.append(button(dom, "Override here", () => context.overrideRule(id)));
            if (choices.includes("Open source"))
                row.append(button(dom, "Open source", () => { row.dataset.ruleMode = "source"; }));
        }
        list.append(row);
    });
    host.append(list);
}
function renderAddPanel(host, context) {
    const { dom } = context, opener = button(dom, "Add rule", () => open());
    host.append(opener);
    const open = () => {
        const draft = context.getDraft();
        if (!draft)
            return;
        opener.remove();
        const panel = dom.createElement("fieldset"), details = section(dom, "Rule details"), when = section(dom, "When"), then = section(dom, "Then"), severity = section(dom, "Severity and message"), actions = section(dom, "Rule actions"), kind = dom.createElement("select"), name = dom.createElement("input"), fields = dom.createElement("div"), status = dom.createElement("p");
        let condition;
        panel.dataset.ruleEditorMode = "add";
        panel.setAttribute("aria-label", "Add rule editor");
        actions.setAttribute("aria-label", "Rule actions");
        status.setAttribute("role", "status");
        kind.name = "ruleKind";
        kind.append(new Option("Choose rule type", ""), ...["presence", "value", "pattern", "range", "cardinality", "reusable"].map((entry) => new Option(entry, entry)));
        name.name = "newRuleName";
        details.append(labeled(dom, "Rule name", name), labeled(dom, "Rule type", kind));
        const candidate = () => { if (!kind.value)
            return undefined; const rule = { id: "staged-rule", kind: kind.value, severity: severity.querySelector("[name=\"newRuleSeverity\"]")?.value ?? "error", ...(name.value.trim() ? { name: name.value.trim() } : {}), ...(condition ? { condition } : {}) }; for (const field of ["pattern", "minimum", "maximum", "minItems", "maxItems", "message"]) {
            const control = panel.querySelector(`[name="newRule${field[0].toUpperCase() + field.slice(1)}"]`);
            if (control?.value)
                rule[field] = numericFields.has(field) ? Number(control.value) : control.value;
        } const presence = panel.querySelector("[name=\"newRulePresence\"]"); if (presence?.value)
            rule.presence = presence.value; const ordinary = panel.querySelector("[name=\"newRuleOrdinaryValue\"]"); if (ordinary?.value)
            rule.allowedValues = schemaTableStageAllowedValues([], ordinary.value, (draft.type ?? context.row.effective.type)); const reusable = panel.querySelector("[name=\"newRuleReusableRuleId\"]"); if (reusable?.value) {
            rule.reusableRuleId = reusable.value;
            const source = readFocusedReusableRules().find(({ id }) => id === reusable.value), outcome = source && focusedReusableOutcome(source);
            rule.name = source?.name ?? reusable.selectedOptions[0]?.textContent;
            if (outcome)
                rule.reusableOutcome = outcome;
        } return rule; };
        const add = button(dom, "Add rule", () => { const rule = candidate(), issue = rule && focusedRuleIssue(rule); if (!rule)
            return; if (issue) {
            status.textContent = issue;
            return;
        } rule.id = `rule:${crypto.randomUUID()}`; draft.rules = [...draft.rules, rule]; context.render(); }), validate = () => { const rule = candidate(), issue = rule ? focusedRuleIssue(rule) : "Choose a rule type."; add.disabled = Boolean(issue); status.textContent = issue ?? ""; };
        const renderFields = () => { fields.replaceChildren(); for (const field of focusedRuleFields(kind.value)) {
            if (["condition", "severity", "message"].includes(field))
                continue;
            if (field === "reusableRuleId") {
                const search = dom.createElement("input"), select = dom.createElement("select");
                search.type = "search";
                search.name = "reusableRuleSearch";
                select.name = "newRuleReusableRuleId";
                const choices = () => { const selected = select.value, rules = filterFocusedReusableRules(readFocusedReusableRules(), search.value); select.replaceChildren(new Option("Choose reusable rule", ""), ...rules.map(({ id, name: ruleName }) => new Option(ruleName, id))); if (rules.some(({ id }) => id === selected))
                    select.value = selected; validate(); };
                search.addEventListener("input", choices);
                select.addEventListener("change", validate);
                choices();
                fields.append(labeled(dom, "Search reusable rules", search), labeled(dom, "Reusable rule", select));
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
            const control = dom.createElement("input");
            control.name = `newRule${field[0].toUpperCase() + field.slice(1)}`;
            if (numericFields.has(field))
                control.type = "number";
            control.addEventListener("input", validate);
            fields.append(labeled(dom, field === "ordinaryValue" ? "Allowed values" : field, control));
        } validate(); };
        const tree = dom.createElement("div");
        when.append(tree);
        then.append(fields);
        const severityControl = dom.createElement("select"), message = dom.createElement("input");
        severityControl.name = "newRuleSeverity";
        severityControl.append(new Option("error", "error"), new Option("warning", "warning"));
        message.name = "newRuleMessage";
        severity.append(labeled(dom, "Severity", severityControl), labeled(dom, "Message", message));
        actions.append(status, button(dom, "Cancel", () => { panel.remove(); host.prepend(opener); opener.focus({ preventScroll: true }); }), add);
        panel.append(details, when, then, severity, actions);
        host.append(panel);
        renderSharedConditionTree(tree, { dom, properties: properties(context), id: (prefix) => `${prefix}:${crypto.randomUUID()}`, onChange: (next) => { condition = next; validate(); } });
        name.addEventListener("input", validate);
        kind.addEventListener("change", renderFields);
        severityControl.addEventListener("change", validate);
        message.addEventListener("input", validate);
        renderFields();
        name.focus({ preventScroll: true });
    };
}
export function renderComposedFocusedRules(host, context) { renderRuleInventory(host, context); renderAddPanel(host, context); }
//# sourceMappingURL=data-layer-composed-schema-workspace-focused-rules.js.map