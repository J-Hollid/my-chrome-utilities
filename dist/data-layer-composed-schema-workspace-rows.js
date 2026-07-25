import { renderFocusedPropertyMenu } from "./data-layer-focused-schema-property-menu.js";
import { focusedOwnershipActions, focusedPropertySectionLabels } from "./data-layer-focused-schema-property-ui.js";
import { renderComposedFocusedSection } from "./data-layer-composed-schema-workspace-focused-sections.js";
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const actionText = (row) => row.action === "override" ? "Override here" : row.action === "reset" ? "Reset to parents" : "Remove local property";
export function composedReviewLifecycleInventory(removed, confirmedAction, restoredRuleIds, restoredValueIds) { const entries = []; if (removed)
    entries.push(confirmedAction === "reset" ? "Reset to parents" : "Remove local property"); for (const id of restoredRuleIds)
    entries.push(`Restored rule ${id}`); for (const id of restoredValueIds)
    entries.push(`Restored value ${id}`); return entries; }
const reviewCondition = (value) => { if (!value || typeof value !== "object")
    return value; const condition = value; if (condition.kind === "predicate")
    return { kind: "predicate", propertyId: condition.propertyId, operator: condition.operator, ...(condition.value !== undefined ? { value: condition.value } : {}) }; if (condition.kind === "all" || condition.kind === "any" || condition.kind === "not") {
    const children = Array.isArray(condition.children) ? condition.children.map(reviewCondition) : [];
    return condition.kind === "all" && !children.length ? undefined : { kind: condition.kind, children };
} return value; };
export function composedReviewFacetDelta(row, draft) { const baseline = { ...row.inherited, ...row.local }, baselineExample = Array.isArray(baseline.examples) ? baseline.examples[0] : undefined, next = { type: draft.type, itemType: draft.itemType, presence: draft.presence, expectedValue: draft.expectedValue, condition: reviewCondition(draft.condition), documentation: draft.documentation || undefined, exampleValue: draft.exampleMethod === "blank" ? undefined : draft.exampleValue }; const previous = { ...baseline, condition: reviewCondition(baseline.condition), documentation: baseline.documentation || undefined, exampleValue: baselineExample }; return ["type", "itemType", "presence", "expectedValue", "condition", "documentation", "exampleValue"].filter((key) => JSON.stringify(next[key]) !== JSON.stringify(previous[key])).map((key) => ({ label: key === "expectedValue" ? "Edited expected value" : key === "exampleValue" ? "Edited example" : `Edited ${key}`, detail: `${row.path} · prospective result ${JSON.stringify(next[key])} · consumers recompile` })); }
function contextMenu(row, context) {
    const local = Object.keys(row.local).some((key) => key !== "path"), inherited = Boolean(row.inherited), actions = focusedOwnershipActions({ local, inherited, overridden: row.action === "reset", invariant: row.effective.enforcement === "invariant", conflict: row.validationState === "blocked", replaceable: row.effective.enforcement !== "invariant" });
    return renderFocusedPropertyMenu({ dom: context.dom, path: row.path, actions, sectionsDisabled: context.removed, sectionSummary: (section) => section === "values" ? `${(context.draft?.allowedValues ?? row.local.allowedValues ?? row.effective.allowedValues ?? []).length} allowed values` : section === "rules" ? `${(context.draft?.rules ?? []).length} rules` : "View effective value", selectSection: (section) => { context.setActiveSection(section); context.render(); }, runAction: (action) => { if (action === "Remove local" || action === "Reset to parent") {
            context.beginAction(row);
            return;
        } if (action === "Override here" || action === "Replace here")
            context.setActiveSection("definition"); context.render(); } });
}
function focused(row, context) {
    const { dom } = context, editor = dom.createElement("section"), heading = dom.createElement("h3"), identity = dom.createElement("p"), effective = dom.createElement("p"), host = dom.createElement("section"), actions = dom.createElement("div");
    editor.setAttribute("aria-label", `${row.path} focused property editor`);
    editor.dataset.focusedPropertyEditor = "true";
    heading.textContent = `Focused property · ${row.path}`;
    identity.textContent = `${row.path} · stable identity ${row.effective.definitionId ?? row.path}`;
    effective.textContent = `Inherited value and source: ${row.inherited ? context.effectiveText({ ...row, effective: row.inherited }) : "none"} · Local value: ${Object.keys(row.local).length > 1 ? context.effectiveText({ ...row, effective: row.local }) : "none"} · Effective result: ${context.effectiveText(row)} · Validation state: ${row.validationState} · Conflicts: ${row.validationState === "blocked" ? row.message : "none"}`;
    host.setAttribute("aria-label", `${row.path} focused ${focusedPropertySectionLabels[context.activeSection]} section`);
    const focusedContext = { model: context.model, dom, row, getDraft: () => context.draft, activeSection: context.activeSection, removedRuleIds: context.removedRuleIds, removedValueIds: context.removedValueIds, restoredRuleIds: context.restoredRuleIds, restoredValueIds: context.restoredValueIds, stagedLocalValueIds: context.stagedLocalValueIds, overriddenRuleIds: context.overriddenRuleIds, overrideRule: context.overrideRule, render: context.render, ...(context.onStructure ? { onStructure: context.onStructure } : {}) };
    if (context.removed)
        host.append(Object.assign(dom.createElement("p"), { textContent: "Whole-property lifecycle staged. Facet and structure controls are unavailable until this reset or removal is cancelled." }));
    else
        renderComposedFocusedSection(host, focusedContext);
    if (context.pendingAction) {
        const impact = dom.createElement("p");
        impact.setAttribute("aria-label", "Property impact review");
        impact.textContent = `${context.pendingAction === "reset" ? "Reset" : "Remove"} preview · prospective effective result ${row.inherited ? context.effectiveText({ ...row, effective: row.inherited }) : "none"} · staged whole-property lifecycle is included in Review changes · affected Page instances recompile · outputs become stale · one Undo action remains available.`;
        actions.append(impact, button(dom, context.pendingAction === "reset" ? "Cancel reset" : "Cancel removal", context.cancelAction), button(dom, context.pendingAction === "reset" ? "Confirm reset to parents" : "Confirm remove local property", () => context.confirmAction(row)));
    }
    else
        actions.append(button(dom, "Cancel", context.close), button(dom, "Review changes", () => { const review = dom.createElement("section"), list = dom.createElement("ul"); review.setAttribute("aria-label", "Review changes"); const baselineRules = (row.local.rules ?? []), effectiveRules = (row.effective.rules ?? []), draftRules = (context.draft?.rules ?? []), draftValues = context.draft?.allowedValues ?? []; for (const inheritedRule of effectiveRules)
            if (!draftRules.some((candidate) => String(candidate.id ?? "") === String(inheritedRule.id ?? "")))
                list.append(Object.assign(dom.createElement("li"), { textContent: `Inherited rule ${String(inheritedRule.id ?? "(unidentified)")} · prospective result ${JSON.stringify(inheritedRule)} · consumers recompile` })); for (const lifecycle of composedReviewLifecycleInventory(context.removed, context.confirmedAction, context.restoredRuleIds, context.restoredValueIds))
            list.append(Object.assign(dom.createElement("li"), { textContent: `${lifecycle} · prospective effective result ${row.inherited ? context.effectiveText({ ...row, effective: row.inherited }) : "none"} · local lifecycle is explicit and affected consumers recompile` })); if (!context.removed) {
            for (const change of composedReviewFacetDelta(row, context.draft))
                list.append(Object.assign(dom.createElement("li"), { textContent: `${change.label} · ${change.detail}` }));
            for (const rule of draftRules) {
                const id = String(rule.id ?? "");
                const baseline = baselineRules.find((candidate) => String(candidate.id ?? "") === id);
                const state = baseline ? JSON.stringify(baseline) === JSON.stringify(rule) ? "Unchanged" : "Edited" : effectiveRules.some((candidate) => String(candidate.id ?? "") === id) ? "Inherited" : "Added";
                list.append(Object.assign(dom.createElement("li"), { textContent: `${state} rule ${id || "(unidentified)"} · prospective result ${JSON.stringify(rule)} · consumers recompile` }));
            }
            for (const [index, value] of draftValues.entries()) {
                const valueId = context.draft?.allowedValueIds?.[index];
                list.append(Object.assign(dom.createElement("li"), { textContent: `${context.removedValueIds.has(String(valueId)) ? "Removed" : context.stagedLocalValueIds.has(String(valueId)) ? "Overridden" : "Allowed"} value ${valueId ?? "(unidentified)"} · prospective result ${JSON.stringify(value)} · consumers recompile` }));
            }
            for (const id of context.removedRuleIds)
                list.append(Object.assign(dom.createElement("li"), { textContent: `Removed rule ${id} · prospective result falls back to inherited definition` }));
            for (const id of context.removedValueIds)
                if (!draftValues.some((_, index) => context.draft?.allowedValueIds?.[index] === id))
                    list.append(Object.assign(dom.createElement("li"), { textContent: `Removed value ${id} · prospective result falls back to inherited value` }));
            for (const operation of context.pendingStructure)
                list.append(Object.assign(dom.createElement("li"), { textContent: `Structure ${operation.kind} · ${operation.path} · prospective structural result is applied atomically · consumers recompile` }));
        } if (!list.children.length)
            list.append(Object.assign(dom.createElement("li"), { textContent: `Unchanged facets · prospective effective result ${context.effectiveText(row)} · consumers recompile` })); review.append(Object.assign(dom.createElement("p"), { textContent: `Review changes · ${row.path} · one confirmation creates one Undo entry; no durable write occurs before confirmation.` }), list); actions.replaceChildren(review, button(dom, "Cancel review", context.render), button(dom, "Confirm changes", () => context.save(row))); }));
    editor.append(heading, identity, effective, host, actions);
    return editor;
}
export function renderComposedRows(rows, context) {
    rows.replaceChildren();
    for (const row of context.model.rows) {
        const article = context.dom.createElement("article"), overview = context.dom.createElement("div"), toggle = context.dom.createElement("button"), effective = context.dom.createElement("span"), source = context.dom.createElement("span"), local = context.dom.createElement("span"), validation = context.dom.createElement("span"), actions = context.dom.createElement("div"), primary = button(context.dom, actionText(row), () => row.action === "override" ? context.open(row, primary) : context.beginAction(row, primary)), propertyActions = button(context.dom, "Property actions", () => context.open(row, propertyActions));
        article.className = "composed-schema-row";
        article.dataset.effectivePropertyPath = row.path;
        if (context.rowPathDataset)
            article.dataset[context.rowPathDataset] = row.path;
        article.dataset.validationState = row.validationState;
        toggle.className = "composed-schema-row-toggle";
        toggle.textContent = row.path;
        toggle.setAttribute("aria-expanded", String(context.activePath === row.path));
        toggle.addEventListener("click", () => context.activePath === row.path ? context.close() : context.open(row, toggle));
        effective.textContent = context.effectiveText(row) || "constraint";
        source.textContent = row.source;
        local.textContent = context.removed && context.activePath === row.path ? "Removed" : Object.keys(row.local).length > 1 ? JSON.stringify(row.local) : "Inherited";
        validation.textContent = `${row.validationState} · ${row.message}`;
        actions.className = "composed-schema-row-actions";
        propertyActions.setAttribute("aria-label", `Property actions for ${row.path}`);
        actions.append(primary, propertyActions);
        overview.append(toggle, effective, source, local, validation, actions);
        article.append(overview);
        if (context.onRepair)
            for (const repair of row.repairs)
                article.append(button(context.dom, repair.label, () => context.onRepair?.(repair)));
        if (context.activePath === row.path)
            article.append(contextMenu(row, context), focused(row, context));
        rows.append(article);
    }
}
//# sourceMappingURL=data-layer-composed-schema-workspace-rows.js.map