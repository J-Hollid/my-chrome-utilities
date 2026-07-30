import { focusedOwnershipActionTarget, focusedOwnershipActions, focusedRuleFields, focusedRuleIssue } from "./data-layer-focused-schema-property-ui.js";
import { renderSharedConditionTree } from "./data-layer-shared-condition-tree-editor.js";
import { schemaTableAllowedValues, schemaTableRuleConditionSummary, schemaTableRuleOutcomeSummary, schemaTableStageAllowedValues } from "./data-layer-schema-table.js";
import { renderRegularExpressionTester, stringRuleKindOptions } from "./data-layer-string-rule-validation.js";
const clone = (value) => structuredClone(value);
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const input = (dom, name, value = "", type = "text") => { const control = dom.createElement("input"); control.name = name; control.type = type; control.value = value; return control; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const ruleKindLabel = (rule) => rule.name ?? rule.kind;
const fieldLabel = (field) => ({ pattern: "Regular expression", literal: "Literal value", minimum: "Minimum", maximum: "Maximum", minItems: "Minimum items", maxItems: "Maximum items", severity: "Severity", message: "Message" }[field] ?? field);
function editRule(row, rule, context, invoker) {
    const { dom } = context, editor = dom.createElement("fieldset"), legend = dom.createElement("legend"), draft = clone(rule), status = dom.createElement("p"), details = dom.createElement("section"), when = dom.createElement("section"), then = dom.createElement("section"), severitySection = dom.createElement("section"), actions = dom.createElement("section");
    let save, conditionIssue;
    const headed = (host, text) => { const heading = dom.createElement("h3"); heading.textContent = text; host.append(heading); };
    editor.dataset.ruleEditorMode = "edit";
    then.dataset.ruleFieldGrid = "true";
    severitySection.dataset.ruleFieldGrid = "true";
    editor.setAttribute("aria-label", `Edit rule ${rule.id}`);
    legend.textContent = `Edit ${ruleKindLabel(rule)}`;
    status.setAttribute("role", "status");
    headed(details, "Rule details");
    headed(when, "When");
    headed(then, "Then");
    headed(severitySection, "Severity and message");
    headed(actions, "Rule actions");
    actions.setAttribute("aria-label", "Rule actions");
    const validate = () => { const issue = conditionIssue ?? focusedRuleIssue(draft); if (save)
        save.disabled = Boolean(issue); status.textContent = issue ?? ""; };
    const name = input(dom, "editRuleName", draft.name ?? ""), kind = dom.createElement("select"), kindLabel = stringRuleKindOptions(context.getWorking()?.type).find(({ kind: entry }) => entry === draft.kind)?.label ?? draft.kind;
    kind.name = "editRuleKind";
    kind.disabled = true;
    kind.append(new Option(kindLabel, draft.kind));
    name.addEventListener("input", () => { const value = name.value.trim(); if (value)
        draft.name = value;
    else
        delete draft.name; validate(); });
    details.append(labeled(dom, "Rule name", name), labeled(dom, "Rule type", kind));
    const tree = dom.createElement("div");
    renderSharedConditionTree(tree, { dom, allowEmpty: true, ...(draft.condition ? { condition: draft.condition } : {}), properties: () => context.properties?.() ?? [], id: context.id, onIssue: (issue) => { conditionIssue = issue; }, onChange: (condition) => { if (condition)
            draft.condition = condition;
        else
            delete draft.condition; validate(); } });
    when.append(tree);
    for (const field of focusedRuleFields(draft.kind)) {
        if (field === "condition")
            continue;
        if (field === "reusableRuleId")
            continue;
        if (field === "presence") {
            const control = dom.createElement("select");
            control.name = "editRulePresence";
            control.append(new Option("Required", "required"), new Option("Optional", "optional"), new Option("Forbidden", "forbidden"));
            control.value = draft.presence ?? "required";
            control.addEventListener("change", () => { draft.presence = control.value; validate(); });
            then.append(labeled(dom, "Presence", control));
            continue;
        }
        if (field === "ordinaryValue") {
            const control = input(dom, "editRuleOrdinaryValue", schemaTableAllowedValues(draft));
            control.addEventListener("input", () => { delete draft.expectedValue; draft.allowedValues = schemaTableStageAllowedValues(draft.allowedValues ?? [], control.value, context.getWorking()?.type); validate(); });
            then.append(labeled(dom, "Allowed values", control));
            continue;
        }
        const numeric = ["minimum", "maximum", "minItems", "maxItems"].includes(field), control = field === "severity" ? dom.createElement("select") : input(dom, `editRule${field[0].toUpperCase() + field.slice(1)}`, String(draft[field] ?? ""), numeric ? "number" : "text");
        control.name = `editRule${field[0].toUpperCase() + field.slice(1)}`;
        if (control instanceof HTMLSelectElement) {
            control.append(new Option("error", "error"), new Option("warning", "warning"));
            control.value = draft.severity;
        }
        control.addEventListener("input", () => { draft[field] = control.value === "" ? undefined : numeric ? Number(control.value) : control.value; validate(); });
        const label = labeled(dom, fieldLabel(field), control);
        if (field === "message")
            label.dataset.ruleMessageField = "true";
        (field === "severity" || field === "message" ? severitySection : then).append(label);
        if (field === "pattern" && control instanceof HTMLInputElement)
            then.append(renderRegularExpressionTester(dom, control));
    }
    save = button(dom, "Save rule", () => { const working = context.getWorking(); if (!working)
        return; const index = working.rules.findIndex(({ id }) => id === rule.id); if (index < 0)
        return; const issue = conditionIssue ?? focusedRuleIssue(draft); if (issue) {
        status.textContent = issue;
        return;
    } working.rules[index] = draft; context.feedback(`Staged changes to ${ruleKindLabel(draft)}.`); context.render(); });
    actions.append(status, button(dom, "Cancel", () => { editor.remove(); row.dataset.ruleMode = "view"; invoker.focus({ preventScroll: true }); }), save);
    editor.append(legend, details, when, then, severitySection, actions);
    row.append(editor);
    validate();
}
export function renderCanonicalRuleRows(host, context) {
    const { dom, removedRuleIds, invariant } = context, working = context.getWorking();
    if (!working)
        return;
    const list = dom.createElement("div"), properties = context.properties?.() ?? [];
    list.setAttribute("aria-label", "Stable rule inventory");
    for (const rule of working.rules) {
        const row = dom.createElement("article"), summary = dom.createElement("p"), provenanceState = rule.provenance?.state, inherited = provenanceState === "inherited" || provenanceState === "shadowed", overridden = provenanceState === "overridden", removed = removedRuleIds.has(rule.id), ownershipState = inherited ? "inherited" : overridden ? "overridden" : "local", target = focusedOwnershipActionTarget("Rules", "rule", rule.id), legal = focusedOwnershipActions({ inherited, overridden, local: !inherited && !overridden, invariant: rule.enforcement === "invariant" || invariant, replaceable: rule.enforcement === "overridable" && !invariant });
        row.dataset.ruleId = rule.id;
        row.dataset.ownership = ownershipState;
        row.dataset.sectionOwnershipActions = "true";
        row.dataset.ownershipTarget = target.label;
        row.dataset.legalOwnershipActions = legal.join("|");
        summary.textContent = `${ruleKindLabel(rule)} · ${schemaTableRuleConditionSummary(rule.condition, properties)} · Then ${schemaTableRuleOutcomeSummary(rule)} · ${rule.severity} · ${rule.message ?? "No issue message"} · source ${rule.provenance?.contributorName ?? "local"} · ${ownershipState}${removed ? " · Removed" : ""}`;
        const ownershipButton = (action, run) => { const control = button(dom, action, run); control.dataset.ownershipAction = action; control.dataset.ownershipTarget = target.label; control.setAttribute("aria-label", `${action} · ${target.label}`); return control; }, view = () => { row.dataset.ruleMode = "view"; const detail = dom.createElement("p"); detail.textContent = `Rule ${rule.id} · definition ${JSON.stringify(rule)} · effective ${rule.enabled === false ? "disabled" : "enabled"} · source ${rule.provenance?.contributorName ?? "local"}`; row.append(detail); }, openSource = () => { row.dataset.ruleMode = "source"; const source = dom.createElement("p"); source.textContent = `Source rule ${rule.id} · ${ruleKindLabel(rule)} · inherited definition is read-only.`; row.append(source); };
        row.append(summary);
        if (removed) {
            const impact = dom.createElement("p");
            impact.textContent = `Impact review: ${ruleKindLabel(rule)} · effective result falls back to parent or unset.`;
            row.append(impact, button(dom, "Restore", () => { removedRuleIds.delete(rule.id); context.render(); }));
        }
        else
            for (const action of legal) {
                if (action === "View" || action === "View conflict")
                    row.append(ownershipButton(action, view));
                else if (action === "Replace here" || action === "Override here")
                    row.append(ownershipButton(action, () => replaceInheritedRule(rule, context)));
                else if (action === "Open source" || action === "Open contributing sources")
                    row.append(ownershipButton(action, openSource));
                else if (action === "Edit" || action === "Edit local resolution") {
                    const edit = ownershipButton(action, () => { row.dataset.ruleMode = "edit"; editRule(row, rule, context, edit); });
                    row.append(edit);
                }
                else if (action === "Remove local" || action === "Reset to parent")
                    row.append(ownershipButton(action, () => { removedRuleIds.add(rule.id); context.feedback(`Staged removal of ${ruleKindLabel(rule)}.`); context.render(); }));
            }
        list.append(row);
    }
    host.append(list);
}
function replaceInheritedRule(rule, context) { const next = context.getWorking(); if (!next)
    return; const inherited = next.rules.find(({ id }) => id === rule.id); if (!inherited)
    return; const replacement = clone(inherited); replacement.id = context.id("rule"); replacement.replacesRuleId = inherited.id; replacement.provenance = { source: "created", state: "overridden", sourceId: inherited.id }; next.rules = [...next.rules, replacement]; context.feedback(`Staged replacement of ${ruleKindLabel(rule)}.`); context.render(); }
//# sourceMappingURL=data-layer-canonical-schema-focused-rule-rows.js.map