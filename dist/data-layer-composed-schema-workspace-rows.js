import { renderFocusedPropertyMenu } from "./data-layer-focused-schema-property-menu.js";
import { focusedOwnershipActions, focusedPropertySectionLabels } from "./data-layer-focused-schema-property-ui.js";
import { renderComposedFocusedSection } from "./data-layer-composed-schema-workspace-focused-sections.js";
import { schemaTableCellMetadata, schemaTableColumns, schemaTableExpectedOrAllowed, schemaTableOverlayStyle } from "./data-layer-schema-table.js";
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
function applyPersistedItemOwnership(host, row) {
    const overriddenValues = new Set((row.local.allowedValueProvenance ?? []).filter(({ state }) => state === "overridden").map(({ id }) => id));
    const overriddenRules = new Set((row.local.rules ?? []).filter((rule) => String(rule.provenance?.state) === "overridden").map((rule) => String(rule.id ?? "")));
    for (const item of Array.from(host.querySelectorAll("[data-value-id],[data-rule-id]"))) {
        const id = item.dataset.valueId ?? item.dataset.ruleId;
        if (!id || !overriddenValues.has(id) && !overriddenRules.has(id))
            continue;
        item.dataset.ownership = "overridden";
        const remove = Array.from(item.querySelectorAll("button")).find(({ textContent }) => textContent?.trim() === "Remove local");
        if (remove)
            remove.textContent = "Reset to parent";
    }
}
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
    const local = Object.keys(row.local).some((key) => key !== "path"), inherited = Boolean(row.inherited), actions = focusedOwnershipActions({ local, inherited, overridden: row.action === "reset", invariant: row.effective.enforcement === "invariant", conflict: row.validationState === "blocked", replaceable: row.effective.enforcement === "overridable" });
    return renderFocusedPropertyMenu({ dom: context.dom, path: row.path, actions, sectionsDisabled: context.removed, close: context.close, sectionSummary: (section) => section === "values" ? `${(context.draft?.allowedValues ?? row.local.allowedValues ?? row.effective.allowedValues ?? []).length} allowed values` : section === "rules" ? `${(context.draft?.rules ?? []).length} rules` : "View effective value", selectSection: context.selectSection, runAction: (action) => { if (action === "Remove local" || action === "Reset to parent") {
            context.beginAction(row);
            return;
        } if (action === "Override here" || action === "Replace here" || action === "Edit")
            context.selectSection("definition");
        else
            context.render(); } });
}
function focused(row, context) {
    const { dom } = context, editor = dom.createElement("section"), heading = dom.createElement("h3"), identity = dom.createElement("p"), effective = dom.createElement("p"), host = dom.createElement("section"), actions = dom.createElement("div");
    editor.setAttribute("aria-label", `${row.path} focused property editor`);
    editor.dataset.focusedPropertyEditor = "true";
    editor.dataset.schemaOverlayLayer = "child";
    heading.textContent = `Focused property · ${row.path}`;
    identity.textContent = `${row.path} · stable identity ${row.effective.definitionId ?? row.path}`;
    effective.textContent = `Inherited value and source: ${row.inherited ? context.effectiveText({ ...row, effective: row.inherited }) : "none"} · Local value: ${Object.keys(row.local).length > 1 ? context.effectiveText({ ...row, effective: row.local }) : "none"} · Effective result: ${context.effectiveText(row)} · Validation state: ${row.validationState} · Conflicts: ${row.validationState === "blocked" ? row.message : "none"}`;
    host.setAttribute("aria-label", `${row.path} focused ${focusedPropertySectionLabels[context.activeSection]} section`);
    const focusedContext = { model: context.model, dom, row, getDraft: () => context.draft, activeSection: context.activeSection, removedRuleIds: context.removedRuleIds, removedValueIds: context.removedValueIds, restoredRuleIds: context.restoredRuleIds, restoredValueIds: context.restoredValueIds, stagedLocalValueIds: context.stagedLocalValueIds, overriddenRuleIds: context.overriddenRuleIds, overrideRule: context.overrideRule, render: context.render, ...(context.onStructure ? { onStructure: context.onStructure } : {}) };
    if (context.removed)
        host.append(Object.assign(dom.createElement("p"), { textContent: "Whole-property lifecycle staged. Facet and structure controls are unavailable until this reset or removal is cancelled." }));
    else {
        renderComposedFocusedSection(host, focusedContext);
        applyPersistedItemOwnership(host, row);
    }
    if (context.pendingAction) {
        const impact = dom.createElement("p");
        impact.setAttribute("aria-label", "Property impact review");
        impact.textContent = `${context.pendingAction === "reset" ? "Reset" : "Remove"} preview · prospective effective result ${row.inherited ? context.effectiveText({ ...row, effective: row.inherited }) : "none"} · staged whole-property lifecycle is included in Review changes · affected Page instances recompile · outputs become stale · one Undo action remains available.`;
        actions.append(impact, button(dom, context.pendingAction === "reset" ? "Cancel reset" : "Cancel removal", context.cancelAction), button(dom, context.pendingAction === "reset" ? "Confirm reset to parents" : "Confirm remove local property", () => context.confirmAction(row)));
    }
    else
        actions.append(button(dom, "Cancel", context.closeChild), button(dom, "Review changes", () => { const review = dom.createElement("section"), list = dom.createElement("ul"); review.setAttribute("aria-label", "Review changes"); const baselineRules = (row.local.rules ?? []), effectiveRules = (row.effective.rules ?? []), draftRules = (context.draft?.rules ?? []), draftValues = context.draft?.allowedValues ?? []; for (const inheritedRule of effectiveRules)
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
    const { dom } = context, table = rows.querySelector(":scope > table") ?? dom.createElement("table"), head = dom.createElement("thead"), headRow = dom.createElement("tr"), body = dom.createElement("tbody");
    const cell = (index, text) => { const value = dom.createElement("td"), metadata = schemaTableCellMetadata[index]; value.dataset.schemaTableCell = metadata.key; value.dataset.schemaTableLabel = metadata.label; if (text !== undefined)
        value.textContent = text; return value; };
    for (const { label } of schemaTableColumns)
        headRow.append(Object.assign(dom.createElement("th"), { textContent: label }));
    head.append(headRow);
    const editable = (row, facet, value) => { const control = dom.createElement("input"); control.type = "text"; control.value = value; control.dataset.inlineSchemaFacet = facet; control.setAttribute("aria-label", `${facet} for ${row.path}`); control.addEventListener("input", () => context.stageInline(row, facet, control.value)); return control; };
    for (const row of context.model.rows) {
        const draft = context.activePath === row.path ? context.draft : undefined, tr = dom.createElement("tr"), identity = cell(0), name = dom.createElement("span"), propertyActions = button(dom, "⋯", () => context.open(row, propertyActions)), effective = { ...row.effective, ...row.local }, description = draft?.documentation ?? String(effective.documentation ?? ""), expected = draft ? schemaTableExpectedOrAllowed(draft) : schemaTableExpectedOrAllowed(effective), exampleValue = draft?.exampleValue ?? (Array.isArray(effective.examples) ? effective.examples[0] : undefined);
        tr.className = "composed-schema-row";
        tr.dataset.effectivePropertyPath = row.path;
        if (context.rowPathDataset)
            tr.dataset[context.rowPathDataset] = row.path;
        tr.dataset.validationState = row.validationState;
        identity.style.position = "relative";
        name.textContent = row.path.split("/").filter(Boolean).at(-1) ?? row.path;
        propertyActions.setAttribute("aria-label", `Property actions for ${row.path}`);
        propertyActions.dataset.propertyActionsPath = row.path;
        identity.append(name, propertyActions);
        if (context.onRepair)
            for (const repair of row.repairs)
                identity.append(button(dom, repair.label, () => context.onRepair?.(repair)));
        tr.append(identity, cell(1, row.path), cell(2, String(draft?.type ?? effective.type ?? "constraint")), cell(3, String(draft?.presence ?? effective.presence ?? "optional")));
        for (const [offset, control] of [editable(row, "description", description), editable(row, "expected-or-allowed", expected), editable(row, "example", exampleValue === undefined ? "" : String(exampleValue))].entries()) {
            const valueCell = cell(offset + 4);
            valueCell.append(control);
            tr.append(valueCell);
        }
        tr.append(cell(7, row.source), cell(8, context.removed && context.activePath === row.path ? "Removed" : Object.keys(row.local).length > 1 ? `Local · effective ${context.effectiveText(row)}` : "Inherited · effective"), cell(9, `${row.validationState} · ${row.message}`));
        if (context.overlayOpen && context.activePath === row.path) {
            const overlay = dom.createElement("section");
            overlay.dataset.schemaRowOverlay = "true";
            overlay.setAttribute("aria-label", `${row.path} property overlay`);
            overlay.style.cssText = schemaTableOverlayStyle;
            overlay.append(contextMenu(row, context));
            if (context.focusedOpen)
                overlay.append(focused(row, context));
            identity.append(overlay);
        }
        body.append(tr);
    }
    table.replaceChildren(head, body);
    table.setAttribute("aria-label", `${context.model.heading} rows`);
    rows.replaceChildren(table);
}
//# sourceMappingURL=data-layer-composed-schema-workspace-rows.js.map