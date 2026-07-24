const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function renderComposedFocusedRules(host, context) {
    const { dom } = context, draft = context.getDraft();
    if (!draft)
        return;
    const list = dom.createElement("div");
    list.setAttribute("aria-label", "Stable rule inventory");
    const localIds = new Set((context.row.local.rules ?? []).map((rule) => String(rule.id ?? "")));
    draft.rules.forEach((rule, index) => { const row = dom.createElement("article"), summary = dom.createElement("p"), id = String(rule.id ?? `rule-${index}`), local = localIds.has(id) || context.overriddenRuleIds.has(id), removed = context.removedRuleIds.has(id); row.dataset.ruleId = id; row.dataset.ownership = local ? "local" : "inherited"; summary.textContent = `${String(rule.name ?? rule.kind ?? "rule")} · ${String(rule.kind ?? "custom")} · ${String(rule.severity ?? "error")} · ${String(rule.message ?? "No issue message")} · ${local ? "local" : "inherited"}${removed ? " · Removed" : ""}`; row.append(summary, button(dom, "View", () => { row.dataset.ruleMode = "view"; const detail = dom.createElement("p"); detail.textContent = `Rule ${id} · ${String(rule.kind ?? "custom")} · ${String(rule.message ?? "No issue message")} · ${local ? "local" : "inherited"}`; row.append(detail); })); if (local && !removed)
        row.append(button(dom, "Edit", () => { row.dataset.ruleMode = "edit"; }), button(dom, "Remove local", () => { context.removedRuleIds.add(id); context.render(); }));
    else if (local)
        row.append(button(dom, "Restore", () => { context.removedRuleIds.delete(id); context.render(); }));
    else
        row.append(button(dom, "Override here", () => context.overrideRule(index)), button(dom, "Open source", () => { row.dataset.ruleMode = "source"; const detail = dom.createElement("p"); detail.textContent = `Source rule ${id} · inherited definition is read-only.`; row.append(detail); })); list.append(row); });
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
//# sourceMappingURL=data-layer-composed-schema-workspace-focused-rules.js.map