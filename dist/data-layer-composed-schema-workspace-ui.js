import { composedFacetDraft, composedFacetDraftWithoutRemovedItems, sparseComposedFacets } from "./data-layer-composed-schema-builders.js";
import { composedSchemaRowOwnershipInput } from "./data-layer-composed-schema-ownership.js";
import { activateFocusedOwnershipSection, focusedOwnershipState } from "./data-layer-focused-schema-property-ui.js";
import { renderComposedRows } from "./data-layer-composed-schema-workspace-rows.js";
import { typedCanonicalValue } from "./data-layer-canonical-schema-facets.js";
import { schemaTableOverlayTarget, schemaTableOverlayTransition, schemaTableReplaceExpectedOrAllowed, schemaTableSortComparison, schemaTableSortOptions, schemaTableStageAllowedValues } from "./data-layer-schema-table.js";
import { declareStudioChoice } from "./data-layer-studio-choice-controls.js";
const button = (text, run) => { const control = document.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const workspaceViews = new Map();
const workspacePanels = new Map();
const workspacePanelFocus = new Map();
export function stageComposedExpectedOrAllowed(draft, text) {
    const staged = schemaTableReplaceExpectedOrAllowed(draft, text);
    if (staged.expectedValue === undefined)
        return staged;
    return { ...staged, exampleMethod: staged.exampleMethod === "allowed-value" ? "custom" : staged.exampleMethod };
}
export function composedTableQuickEditFacets(row, facet, value) {
    const next = composedFacetDraft(row.local, row.effective);
    if (facet === "concept")
        next.concept = value.trim() || undefined;
    else if (facet === "type")
        next.type = value;
    else if (facet === "presence")
        next.presence = value;
    else if (facet === "description")
        next.documentation = value;
    else if (facet === "example") {
        next.exampleMethod = value ? "custom" : "blank";
        next.exampleValue = value ? typedCanonicalValue((next.type ?? row.effective.type), value) : undefined;
    }
    else {
        next.allowedValues = schemaTableStageAllowedValues(next.allowedValues, value, (next.type ?? row.effective.type));
        delete next.expectedValue;
        delete next.allowedValueIds;
        delete next.allowedValueProvenance;
    }
    return sparseComposedFacets(next, row.inherited ?? { path: row.path });
}
export function composedTableResetFacet(row, facet) {
    const { path: _, ...local } = structuredClone(row.local);
    delete local[facet];
    if (facet === "type")
        delete local.itemType;
    return local;
}
export function mountComposedSchemaWorkspace(options) {
    const section = document.createElement("section"), heading = document.createElement("h2"), summary = document.createElement("p"), headerActions = document.createElement("div"), localChangesButton = document.createElement("button"), parentAdditionsButton = document.createElement("button"), panel = document.createElement("aside"), policy = document.createElement("input"), policyLabel = document.createElement("label"), quickEditFeedback = document.createElement("output"), filterControls = document.createElement("div"), filter = document.createElement("input"), sort = document.createElement("select"), addControls = document.createElement("div"), choice = document.createElement("select"), add = document.createElement("button"), rows = document.createElement("div"), viewKey = options.schemaContributorId ?? options.model.heading, savedView = workspaceViews.get(viewKey), hasDecisions = options.model.rows.some(({ validationState }) => validationState === "blocked");
    let activePath, overlayOpen = false, focusedOpen = false, reviewOpen = false, saveIssue, activeSection = "definition", draft, removed = false, confirmedAction, removedRuleIds = new Set(), removedValueIds = new Set(), restoredRuleIds = new Set(), restoredValueIds = new Set(), stagedLocalValueIds = new Set(), overriddenRuleIds = new Set(), pendingStructure = [], pendingAction, originFocus, originPath, query = savedView?.query ?? "", sortMode = savedView?.sortMode ?? "path", decisionsOnly = hasDecisions && (savedView?.decisionsOnly ?? false);
    let overlayState = { phase: "closed" };
    let ownershipSession = { inherited: false, local: true, structureOwned: true, activated: [] };
    section.className = options.compact ? "composed-schema-workspace compact-schema-workspace" : "composed-schema-workspace";
    section.setAttribute("aria-label", options.model.heading);
    section.dataset.schemaStatus = options.model.status;
    section.dataset.schemaPresentation = options.compact ? "compact-side-panel" : "focused-property";
    if (options.schemaContributorId)
        section.dataset.schemaContributorId = options.schemaContributorId;
    if (options.schemaContributorScope)
        section.dataset.schemaContributorScope = options.schemaContributorScope;
    heading.textContent = options.model.heading;
    summary.setAttribute("role", "status");
    summary.className = options.model.status === "blocked" ? "error" : "status-text";
    summary.textContent = options.model.status === "blocked" ? `Blocked · ${options.model.conflictSummary}` : `Ready · ${options.model.rows.length} effective properties${options.includeConflictSummary === false ? "" : ` · ${options.model.conflictSummary}`}`;
    headerActions.className = "composed-schema-inventory-actions";
    localChangesButton.type = parentAdditionsButton.type = "button";
    localChangesButton.textContent = `Local changes ${options.model.localChangeCount}`;
    parentAdditionsButton.textContent = `Parent additions ${options.model.parentAdditionCount}`;
    localChangesButton.setAttribute("aria-expanded", "false");
    parentAdditionsButton.setAttribute("aria-expanded", "false");
    panel.className = "composed-schema-inventory-panel";
    panel.hidden = true;
    panel.tabIndex = -1;
    headerActions.append(localChangesButton, parentAdditionsButton);
    policy.type = "checkbox";
    policy.checked = options.onlyDefinedFields === true;
    policy.setAttribute("aria-label", "Only defined fields");
    policy.addEventListener("change", () => options.onOnlyDefinedFields?.(policy.checked));
    policyLabel.append(policy, "Only defined fields");
    declareStudioChoice(policy, "schema.only-defined");
    quickEditFeedback.setAttribute("aria-label", "Table cell diagnostic");
    filter.type = "search";
    filter.placeholder = "Filter properties";
    filter.setAttribute("aria-label", "Filter schema properties");
    filter.value = query;
    sort.setAttribute("aria-label", "Sort schema properties");
    sort.append(...schemaTableSortOptions.map(({ label, value }) => new Option(label, value)));
    sort.value = sortMode;
    filterControls.setAttribute("aria-label", "Schema property navigation controls");
    filterControls.append(filter, sort);
    if (hasDecisions) {
        const decisionFilter = button("Show properties needing decisions", () => { decisionsOnly = !decisionsOnly; decisionFilter.setAttribute("aria-pressed", String(decisionsOnly)); saveView(); rerender(); });
        decisionFilter.setAttribute("aria-pressed", String(decisionsOnly));
        filterControls.append(decisionFilter);
    }
    addControls.setAttribute("aria-label", "Add local property");
    choice.setAttribute("aria-label", "Choose inherited property to override");
    choice.append(new Option("Choose a property", ""), ...options.model.rows.filter(({ inherited }) => Boolean(inherited)).map(({ path }) => new Option(path, path)));
    add.type = "button";
    add.textContent = "Add local property";
    add.addEventListener("click", () => { const row = options.model.rows.find(({ path }) => path === choice.value) || options.model.rows.find(({ inherited }) => Boolean(inherited)); if (row)
        open(row, add); });
    addControls.append(choice, add);
    rows.setAttribute("role", "table");
    rows.setAttribute("aria-label", `${options.model.heading} rows`);
    rows.dataset.schemaEditorScrollRegion = "true";
    const saveView = () => { workspaceViews.set(viewKey, { query, sortMode, decisionsOnly, scrollTop: rows.scrollTop }); };
    const valueText = (value) => value === undefined ? "Not set" : typeof value === "string" ? value : JSON.stringify(value);
    const prospectiveParentValues = (items) => items.map((item) => item.action === "remove-property" ? `${item.label}: no parent value; local property will be removed` : `${item.label}: ${valueText(item.inheritedValue)}`).join("; ");
    const closePanel = () => { const mode = workspacePanels.get(viewKey); workspacePanels.delete(viewKey); panel.hidden = true; panel.replaceChildren(); localChangesButton.setAttribute("aria-expanded", "false"); parentAdditionsButton.setAttribute("aria-expanded", "false"); (mode === "local" ? localChangesButton : parentAdditionsButton).focus(); };
    const applyItemReset = (path, item) => { workspacePanels.set(viewKey, "local"); workspacePanelFocus.set(viewKey, { mode: "local", path }); if (item.action === "reset-rule" && item.ruleId)
        options.onResetLocalRule?.(path, item.ruleId);
    else
        options.onResetLocalFacet?.(path, item.key); };
    const reviewReset = (path, item, origin) => { const review = document.createElement("section"), heading = document.createElement("h4"), detail = document.createElement("p"), confirm = button("Confirm reset", () => { workspacePanels.set(viewKey, "local"); workspacePanelFocus.set(viewKey, { mode: "local", path }); if (item.action === "remove-property")
        options.onReset(options.model.rows.find((row) => row.path === path));
    else
        applyItemReset(path, item); }), cancel = button("Cancel", () => { review.remove(); origin.focus(); }); heading.textContent = item.action === "remove-property" ? `Remove local property ${path}` : `Reset ${item.label} to parent`; detail.textContent = `Review removal: ${valueText(item.localValue)}. Current parent value ${valueText(item.inheritedValue)} will become effective.`; review.setAttribute("aria-label", `Review reset for ${path} ${item.label}`); review.append(heading, detail, confirm, cancel); panel.append(review); confirm.focus(); };
    const renderPanel = (mode, origin) => {
        workspacePanels.set(viewKey, mode);
        panel.hidden = false;
        panel.replaceChildren();
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "false");
        panel.setAttribute("aria-label", mode === "local" ? "Local changes" : "Parent additions");
        localChangesButton.setAttribute("aria-expanded", String(mode === "local"));
        parentAdditionsButton.setAttribute("aria-expanded", String(mode === "parent"));
        const title = document.createElement("h3"), close = button("Close", closePanel);
        title.textContent = mode === "local" ? `Local changes ${options.model.localChangeCount}` : `Parent additions ${options.model.parentAdditionCount}`;
        panel.append(title, close);
        if (mode === "local") {
            for (const group of options.model.localChanges) {
                const property = document.createElement("section"), propertyHeading = document.createElement("h4"), edit = button(`Edit ${group.path}`, () => { const row = options.model.rows.find(({ path }) => path === group.path); if (row)
                    open(row, edit); }), resetProperty = button(`Reset ${group.path} to parent`, () => { const review = document.createElement("section"), description = document.createElement("p"), confirm = button("Confirm property reset", () => { workspacePanels.set(viewKey, "local"); workspacePanelFocus.set(viewKey, { mode: "local", path: group.path }); options.onReset(options.model.rows.find(({ path }) => path === group.path)); }), cancel = button("Cancel", () => { review.remove(); resetProperty.focus(); }); description.textContent = `Review removal of ${group.items.length} locally owned ${group.items.length === 1 ? "item" : "items"} from ${group.path}. Current parent values: ${prospectiveParentValues(group.items)}.`; review.setAttribute("aria-label", `Review property reset ${group.path}`); review.append(description, confirm, cancel); panel.append(review); confirm.focus(); });
                property.dataset.localChangePath = group.path;
                propertyHeading.textContent = group.path;
                property.append(propertyHeading, edit);
                if (options.model.rows.find(({ path }) => path === group.path)?.inherited)
                    property.append(resetProperty);
                for (const item of group.items) {
                    const entry = document.createElement("article"), itemHeading = document.createElement("h5"), detail = document.createElement("p"), reset = document.createElement("button");
                    itemHeading.textContent = item.label;
                    detail.textContent = item.kind === "property" ? `Effective definition ${valueText(item.effectiveValue)}` : `${item.sourceContributor ?? "Parent"}: ${valueText(item.inheritedValue)} · Local: ${valueText(item.localValue)} · Effective: ${valueText(item.effectiveValue)}${item.parentDiffers ? " · Parent differs" : ""}`;
                    reset.type = "button";
                    reset.textContent = item.action === "remove-property" ? "Remove local property" : "Reset to parent";
                    reset.setAttribute("aria-label", `${reset.textContent} ${group.path} ${item.label}`);
                    reset.addEventListener("click", () => item.action === "remove-property" ? reviewReset(group.path, item, reset) : applyItemReset(group.path, item));
                    entry.append(itemHeading, detail, reset);
                    property.append(entry);
                }
                panel.append(property);
            }
            if (options.model.localChangeCount) {
                const resetAll = button("Reset all to parents", () => { const review = document.createElement("section"), description = document.createElement("p"), confirm = button("Confirm reset all", () => { workspacePanels.set(viewKey, "local"); workspacePanelFocus.set(viewKey, { mode: "local" }); options.onResetAllLocalChanges?.(); }), cancel = button("Cancel", () => { review.remove(); resetAll.focus(); }); description.textContent = `Review removal of all ${options.model.localChangeCount} local items. Current parent values: ${options.model.localChanges.map(({ path, items }) => `${path} ${prospectiveParentValues(items)}`).join("; ")}.`; review.setAttribute("aria-label", "Review reset all local changes"); review.append(description, confirm, cancel); panel.append(review); confirm.focus(); });
                panel.append(resetAll);
            }
        }
        else {
            const selected = new Map();
            for (const group of options.model.parentAdditions) {
                const source = document.createElement("section"), sourceHeading = document.createElement("h4");
                sourceHeading.textContent = `${group.profileName} · ${group.sourceGroup}`;
                source.append(sourceHeading);
                for (const item of group.items) {
                    const label = document.createElement("label"), control = document.createElement("input"), detail = document.createElement("span");
                    control.type = "checkbox";
                    control.value = item.propertyId;
                    control.dataset.recipeId = group.recipeId;
                    control.addEventListener("change", () => { const ids = selected.get(group.recipeId) ?? new Set(); if (control.checked)
                        ids.add(item.propertyId);
                    else
                        ids.delete(item.propertyId); selected.set(group.recipeId, ids); });
                    detail.textContent = `${item.path} · ${item.definitionSummary} · ${item.provenance} · ${item.dependencyImpact}`;
                    label.append(control, detail);
                    source.append(label);
                }
                panel.append(source);
            }
            const include = button("Include selected", () => { const selections = [...selected].flatMap(([recipeId, ids]) => ids.size ? [{ recipeId, propertyIds: [...ids] }] : []); if (selections.length) {
                workspacePanels.set(viewKey, "parent");
                workspacePanelFocus.set(viewKey, { mode: "parent" });
                options.onIncludeParentAdditions?.(selections);
            } });
            panel.append(include);
        }
        queueMicrotask(() => { const requested = workspacePanelFocus.get(viewKey); if (requested?.mode !== mode) {
            panel.focus();
            return;
        } workspacePanelFocus.delete(viewKey); const samePath = requested.path ? panel.querySelector(`[data-local-change-path="${CSS.escape(requested.path)}"] button`) : undefined, next = samePath ?? panel.querySelector('[data-local-change-path] button, input[type="checkbox"]') ?? (mode === "local" ? localChangesButton : parentAdditionsButton); next.focus({ preventScroll: true }); });
    };
    localChangesButton.addEventListener("click", () => workspacePanels.get(viewKey) === "local" ? closePanel() : renderPanel("local", localChangesButton));
    parentAdditionsButton.addEventListener("click", () => workspacePanels.get(viewKey) === "parent" ? closePanel() : renderPanel("parent", parentAdditionsButton));
    const visibleModel = () => { const needle = query.trim().toLowerCase(), visible = options.model.rows.filter((row) => (!decisionsOnly || row.validationState === "blocked") && (!needle || row.path.toLowerCase().includes(needle) || String(row.source ?? "").toLowerCase().includes(needle) || options.effectiveText(row).toLowerCase().includes(needle))).sort((left, right) => schemaTableSortComparison({ path: left.path, concept: left.effective.concept, source: left.source }, { path: right.path, concept: right.effective.concept, source: right.source }, sortMode)); return { ...options.model, rows: visible }; };
    const focusDecisionTarget = () => {
        const row = options.model.rows.find(({ path }) => path === activePath), sectionName = activeSection === "definition" ? "Definition" : activeSection === "rules" ? "Rules" : activeSection === "structure" ? "Structure" : undefined, decision = row?.decisions?.find(({ section: decisionSection }) => decisionSection === sectionName);
        if (!decision)
            return;
        const named = decision.facet === "Type" ? "propertyType" : decision.facet === "Presence" ? "presenceMode" : decision.facet === "Allowed values" || decision.facet === "Expected value" ? "ordinaryValue" : decision.facet === "Array item definition" ? "itemType" : undefined, ruleId = decision.localRuleId ?? decision.sourceRuleId ?? decision.repairs.find(({ ruleId: repairRuleId }) => repairRuleId)?.ruleId, target = named ? schemaTableOverlayTarget(section, `[name="${named}"]`) : ruleId ? schemaTableOverlayTarget(section, `[data-rule-id="${CSS.escape(ruleId)}"] input, [data-rule-id="${CSS.escape(ruleId)}"] select, [data-rule-id="${CSS.escape(ruleId)}"] button`) : undefined, fallback = schemaTableOverlayTarget(section, `[data-schema-decision-issue="true"][data-decision-facet="${CSS.escape(decision.facet)}"]`);
        (target ?? fallback)?.focus({ preventScroll: true });
    };
    const rerender = () => renderComposedRows(rows, { dom: document, overlayHost: section, model: visibleModel(), effectiveText: options.effectiveText, conceptSuggestions: options.conceptSuggestions, ...(options.onRepair ? { onRepair: (repair) => { saveView(); options.onRepair?.(repair); } } : {}), ...(options.onStructure ? { onStructure: (kind, path, name) => { pendingStructure.push({ kind, path, ...(name === undefined ? {} : { name }) }); rerender(); } } : {}), ...(options.rowPathDataset ? { rowPathDataset: options.rowPathDataset } : {}), activePath, overlayOpen, focusedOpen, reviewOpen, saveIssue, activeSection, draft, removed, confirmedAction, removedRuleIds, removedValueIds, restoredRuleIds, restoredValueIds, stagedLocalValueIds, overriddenRuleIds, overrideRule, pendingAction, pendingStructure, ownershipSession, activateOwnership: (action) => { ownershipSession = activateFocusedOwnershipSection(ownershipSession, activeSection, action); rerender(); }, beginAction, cancelAction, confirmAction, open, commitInline, resetInline, cancelInline: () => { }, inlineDiagnostic: (message) => { quickEditFeedback.textContent = message; }, quickEditRoot: () => options.host, quickEditScope: `composed:${options.schemaContributorId ?? options.model.heading}`, close, closeChild, beginReview, cancelReview, save, render: rerender, selectSection: (value) => { activeSection = value; focusedOpen = true; reviewOpen = false; saveIssue = undefined; overlayState = schemaTableOverlayTransition(overlayState, { kind: "focus" }); rerender(); queueMicrotask(focusDecisionTarget); } });
    const overrideRule = (sourceId) => { if (!draft)
        return; const source = options.model.rows.find(({ path }) => path === activePath)?.effective.rules?.find((rule) => String(rule.id ?? "") === sourceId); if (!source || source.enforcement === "invariant")
        return; const id = `rule:${crypto.randomUUID()}`, replacement = { ...structuredClone(source), id, replacesRuleId: sourceId, provenance: { source: "created", state: "overridden", sourceId } }; draft = { ...draft, rules: [...draft.rules, replacement] }; overriddenRuleIds.add(id); rerender(); };
    const open = (row, focus, sectionName = "definition") => { if (activePath !== row.path || !draft) {
        activePath = row.path;
        draft = composedFacetDraft(row.local, row.effective);
        removed = false;
        confirmedAction = undefined;
        removedRuleIds = new Set();
        removedValueIds = new Set();
        restoredRuleIds = new Set();
        restoredValueIds = new Set();
        stagedLocalValueIds = new Set();
        overriddenRuleIds = new Set();
        pendingStructure = [];
        pendingAction = undefined;
        ownershipSession = focusedOwnershipState(composedSchemaRowOwnershipInput(row)).session;
    } overlayState = schemaTableOverlayTransition(overlayState, { kind: "open", path: row.path }); activeSection = sectionName; overlayOpen = true; focusedOpen = false; reviewOpen = false; saveIssue = undefined; if (focus) {
        originFocus = focus;
        originPath = row.path;
    } rerender(); };
    const commitInline = (row, facet, value) => {
        try {
            options.onSave(row, composedTableQuickEditFacets(row, facet, value));
            return { status: "committed" };
        }
        catch (error) {
            return { status: "invalid", diagnostic: error instanceof Error ? error.message : String(error) };
        }
    };
    const resetInline = (row, facet) => {
        try {
            options.onSave(row, composedTableResetFacet(row, facet));
            return { status: "committed" };
        }
        catch (error) {
            return { status: "invalid", diagnostic: error instanceof Error ? error.message : String(error) };
        }
    };
    const close = (reason = "cancel") => { overlayState = schemaTableOverlayTransition(overlayState, { kind: reason }); const restorePath = ("restorePath" in overlayState ? overlayState.restorePath : undefined) ?? originPath; activePath = undefined; overlayOpen = false; focusedOpen = false; reviewOpen = false; saveIssue = undefined; activeSection = "definition"; draft = undefined; removed = false; confirmedAction = undefined; removedRuleIds = new Set(); removedValueIds = new Set(); restoredRuleIds = new Set(); restoredValueIds = new Set(); stagedLocalValueIds = new Set(); overriddenRuleIds = new Set(); pendingStructure = []; pendingAction = undefined; ownershipSession = { inherited: false, local: true, structureOwned: true, activated: [] }; rerender(); const target = originFocus?.isConnected ? originFocus : restorePath ? rows.querySelector(`[aria-label="Property actions for ${CSS.escape(restorePath)}"]`) : undefined; originFocus = undefined; originPath = undefined; if (target)
        queueMicrotask(() => target.focus({ preventScroll: true })); };
    const closeChild = () => { if (reviewOpen) {
        cancelReview();
        return;
    } focusedOpen = false; overlayState = activePath ? { phase: "menu", path: activePath } : { phase: "closed" }; rerender(); const target = schemaTableOverlayTarget(section, `[data-property-context-menu="true"] [data-section="${activeSection}"] button`); if (target)
        queueMicrotask(() => target.focus({ preventScroll: true })); };
    const beginReview = () => { reviewOpen = true; saveIssue = undefined; overlayState = schemaTableOverlayTransition(overlayState, { kind: "review" }); rerender(); };
    const cancelReview = () => { reviewOpen = false; overlayState = activePath ? { phase: "focused", path: activePath } : { phase: "closed" }; rerender(); };
    const beginAction = (row, focus) => { open(row, focus); focusedOpen = true; pendingAction = row.action === "reset" ? "reset" : "remove"; rerender(); };
    const cancelAction = () => { pendingAction = undefined; removed = false; confirmedAction = undefined; rerender(); };
    const confirmAction = (_row) => { confirmedAction = pendingAction; pendingAction = undefined; removed = true; rerender(); };
    const save = (row) => { if (!draft)
        return; try {
        if (removed) {
            options.onReset(row);
            close();
            return;
        }
        const staged = composedFacetDraftWithoutRemovedItems(draft, removedRuleIds, removedValueIds);
        options.onSave(row, sparseComposedFacets(staged, row.inherited ?? { path: row.path }), pendingStructure);
        close();
    }
    catch (error) {
        saveIssue = error instanceof Error ? error.message : String(error);
        rerender();
    } };
    filter.addEventListener("input", () => { query = filter.value; saveView(); rerender(); });
    sort.addEventListener("change", () => { sortMode = sort.value; saveView(); rerender(); });
    section.addEventListener("keydown", (event) => { if (event.key === "Escape" && !panel.hidden) {
        event.preventDefault();
        closePanel();
        return;
    } if (event.key === "Escape" && overlayOpen) {
        event.preventDefault();
        if (focusedOpen)
            closeChild();
        else
            close("escape");
    } });
    rerender();
    section.append(heading, summary, headerActions, policyLabel, quickEditFeedback, filterControls, addControls, rows, panel);
    options.host.append(section);
    if (savedView)
        rows.scrollTop = savedView.scrollTop;
    const retainedPanel = workspacePanels.get(viewKey);
    if (retainedPanel)
        renderPanel(retainedPanel);
    return section;
}
//# sourceMappingURL=data-layer-composed-schema-workspace-ui.js.map