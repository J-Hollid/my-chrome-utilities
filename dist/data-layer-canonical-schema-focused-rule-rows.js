import { focusedRuleFields } from "./data-layer-focused-schema-property-ui.js";
const clone = (value) => structuredClone(value);
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const input = (dom, name, value = "", type = "text") => { const control = dom.createElement("input"); control.name = name; control.type = type; control.value = value; return control; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const ruleKindLabel = (rule) => rule.name ?? rule.kind;
function editRule(row, rule, context) {
    const { dom } = context, editor = dom.createElement("fieldset"), legend = dom.createElement("legend");
    legend.textContent = `Edit ${ruleKindLabel(rule)}`;
    for (const field of focusedRuleFields(rule.kind)) {
        if (field === "condition") {
            const control = dom.createElement("textarea");
            control.name = "editRuleCondition";
            control.value = rule.condition ? JSON.stringify(rule.condition) : "";
            control.addEventListener("input", () => { const working = context.getWorking(); if (!working)
                return; const index = working.rules.findIndex(({ id }) => id === rule.id); if (index < 0)
                return; const next = clone(working.rules[index]); try {
                next.condition = control.value ? JSON.parse(control.value) : undefined;
            }
            catch { } working.rules[index] = next; });
            editor.append(labeled(dom, "condition", control));
            continue;
        }
        const value = String(rule[field] ?? ""), control = input(dom, `editRule${field[0].toUpperCase() + field.slice(1)}`, value, ["minimum", "maximum", "minItems", "maxItems"].includes(field) ? "number" : "text");
        control.addEventListener("input", () => { const working = context.getWorking(); if (!working)
            return; const index = working.rules.findIndex(({ id }) => id === rule.id); if (index < 0)
            return; const next = clone(working.rules[index]); next[field] = control.value === "" ? undefined : ["minimum", "maximum", "minItems", "maxItems"].includes(field) ? Number(control.value) : control.value; working.rules[index] = next; });
        editor.append(labeled(dom, field, control));
    }
    row.append(editor);
}
export function renderCanonicalRuleRows(host, context) {
    const { dom, removedRuleIds, invariant } = context, working = context.getWorking();
    if (!working)
        return;
    const list = dom.createElement("div");
    list.setAttribute("aria-label", "Stable rule inventory");
    for (const rule of working.rules) {
        const row = dom.createElement("article"), summary = dom.createElement("p"), inherited = rule.provenance?.state === "inherited" || rule.provenance?.state === "shadowed", removed = removedRuleIds.has(rule.id);
        row.dataset.ruleId = rule.id;
        row.dataset.ownership = inherited ? "inherited" : "local";
        summary.textContent = `${ruleKindLabel(rule)} · ${rule.kind} · ${rule.severity} · ${rule.message ?? "No issue message"} · source ${rule.provenance?.contributorName ?? "local"}${removed ? " · Removed" : ""}`;
        row.append(summary, button(dom, "View", () => { row.dataset.ruleMode = "view"; const detail = dom.createElement("p"); detail.textContent = `Rule ${rule.id} · definition ${JSON.stringify(rule)} · effective ${rule.enabled === false ? "disabled" : "enabled"} · source ${rule.provenance?.contributorName ?? "local"}`; row.append(detail); }));
        if (inherited) {
            row.append(...(invariant ? [] : [button(dom, "Replace here", () => replaceInheritedRule(rule, context))]), button(dom, "Open source", () => { row.dataset.ruleMode = "source"; const source = dom.createElement("p"); source.textContent = `Source rule ${rule.id} · ${ruleKindLabel(rule)} · inherited definition is read-only.`; row.append(source); }));
        }
        else if (removed) {
            const impact = dom.createElement("p");
            impact.textContent = `Impact review: ${ruleKindLabel(rule)} · effective result falls back to parent or unset.`;
            row.append(impact, button(dom, "Restore", () => { removedRuleIds.delete(rule.id); context.render(); }));
        }
        else
            row.append(button(dom, "Edit", () => { row.dataset.ruleMode = "edit"; editRule(row, rule, context); }), button(dom, "Remove local", () => { removedRuleIds.add(rule.id); context.feedback(`Staged removal of ${ruleKindLabel(rule)}.`); context.render(); }));
        list.append(row);
    }
    host.append(list);
}
function replaceInheritedRule(rule, context) { const next = context.getWorking(); if (!next)
    return; const index = next.rules.findIndex(({ id }) => id === rule.id); if (index < 0)
    return; const replacement = clone(next.rules[index]); replacement.id = context.id("rule"); replacement.provenance = { source: "created", state: "effective" }; next.rules[index] = replacement; context.feedback(`Staged replacement of ${ruleKindLabel(rule)}.`); context.render(); }
//# sourceMappingURL=data-layer-canonical-schema-focused-rule-rows.js.map