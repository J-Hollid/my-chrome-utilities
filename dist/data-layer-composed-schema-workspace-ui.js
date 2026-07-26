import { composedFacetDraft, composedFacetDraftWithoutRemovedItems, sparseComposedFacets } from "./data-layer-composed-schema-builders.js";
import { renderComposedRows } from "./data-layer-composed-schema-workspace-rows.js";
import { typedCanonicalValue } from "./data-layer-canonical-schema-facets.js";
import { schemaTableOverlayTransition, schemaTableReplaceExpectedOrAllowed, schemaTableStageAllowedValues } from "./data-layer-schema-table.js";
const button = (text, run) => { const control = document.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function stageComposedExpectedOrAllowed(draft, text) {
    const staged = schemaTableReplaceExpectedOrAllowed(draft, text);
    if (staged.expectedValue === undefined)
        return staged;
    return { ...staged, exampleMethod: staged.exampleMethod === "allowed-value" ? "custom" : staged.exampleMethod };
}
export function composedTableQuickEditFacets(row, facet, value) {
    const next = composedFacetDraft(row.local, row.effective);
    if (facet === "description")
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
export function mountComposedSchemaWorkspace(options) {
    const section = document.createElement("section"), heading = document.createElement("h2"), summary = document.createElement("p"), quickEditFeedback = document.createElement("output"), filterControls = document.createElement("div"), filter = document.createElement("input"), sort = document.createElement("select"), addControls = document.createElement("div"), choice = document.createElement("select"), add = document.createElement("button"), rows = document.createElement("div");
    let activePath, overlayOpen = false, focusedOpen = false, activeSection = "definition", draft, removed = false, confirmedAction, removedRuleIds = new Set(), removedValueIds = new Set(), restoredRuleIds = new Set(), restoredValueIds = new Set(), stagedLocalValueIds = new Set(), overriddenRuleIds = new Set(), pendingStructure = [], pendingAction, originFocus, originPath, query = "", sortMode = "path";
    let overlayState = { phase: "closed" };
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
    summary.textContent = `${options.model.status === "blocked" ? "Blocked" : "Ready"} · ${options.model.rows.length} effective properties${options.includeConflictSummary === false ? "" : ` · ${options.model.conflictSummary}`}`;
    quickEditFeedback.setAttribute("aria-label", "Table cell diagnostic");
    filter.type = "search";
    filter.placeholder = "Filter properties";
    filter.setAttribute("aria-label", "Filter schema properties");
    sort.setAttribute("aria-label", "Sort schema properties");
    sort.append(new Option("Tree order", "path"), new Option("Source", "source"), new Option("Validation", "validation"));
    filterControls.setAttribute("aria-label", "Schema property navigation controls");
    filterControls.append(filter, sort);
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
    const visibleModel = () => { const needle = query.trim().toLowerCase(), rows = options.model.rows.filter((row) => !needle || row.path.toLowerCase().includes(needle) || row.source.toLowerCase().includes(needle) || options.effectiveText(row).toLowerCase().includes(needle)).sort((left, right) => sortMode === "source" ? left.source.localeCompare(right.source) || left.path.localeCompare(right.path) : sortMode === "validation" ? left.validationState.localeCompare(right.validationState) || left.path.localeCompare(right.path) : left.path.localeCompare(right.path)); return { ...options.model, rows }; };
    const rerender = () => renderComposedRows(rows, { dom: document, model: visibleModel(), effectiveText: options.effectiveText, ...(options.onRepair ? { onRepair: options.onRepair } : {}), ...(options.onStructure ? { onStructure: (kind, path, name) => { pendingStructure.push({ kind, path, ...(name === undefined ? {} : { name }) }); rerender(); } } : {}), ...(options.rowPathDataset ? { rowPathDataset: options.rowPathDataset } : {}), activePath, overlayOpen, focusedOpen, activeSection, draft, removed, confirmedAction, removedRuleIds, removedValueIds, restoredRuleIds, restoredValueIds, stagedLocalValueIds, overriddenRuleIds, overrideRule, pendingAction, pendingStructure, beginAction, cancelAction, confirmAction, open, commitInline, cancelInline: () => { }, inlineDiagnostic: (message) => { quickEditFeedback.textContent = message; }, quickEditRoot: () => options.host, quickEditScope: `composed:${options.schemaContributorId ?? options.model.heading}`, close, closeChild, save, render: rerender, selectSection: (value) => { activeSection = value; focusedOpen = true; overlayState = schemaTableOverlayTransition(overlayState, { kind: "focus" }); rerender(); } });
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
    } overlayState = schemaTableOverlayTransition(overlayState, { kind: "open", path: row.path }); activeSection = sectionName; overlayOpen = true; focusedOpen = false; if (focus) {
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
    const close = (reason = "cancel") => { overlayState = schemaTableOverlayTransition(overlayState, { kind: reason }); const restorePath = ("restorePath" in overlayState ? overlayState.restorePath : undefined) ?? originPath; activePath = undefined; overlayOpen = false; focusedOpen = false; activeSection = "definition"; draft = undefined; removed = false; confirmedAction = undefined; removedRuleIds = new Set(); removedValueIds = new Set(); restoredRuleIds = new Set(); restoredValueIds = new Set(); stagedLocalValueIds = new Set(); overriddenRuleIds = new Set(); pendingStructure = []; pendingAction = undefined; rerender(); const target = originFocus?.isConnected ? originFocus : restorePath ? rows.querySelector(`[aria-label="Property actions for ${CSS.escape(restorePath)}"]`) : undefined; originFocus = undefined; originPath = undefined; if (target)
        queueMicrotask(() => target.focus({ preventScroll: true })); };
    const closeChild = () => { focusedOpen = false; overlayState = activePath ? { phase: "menu", path: activePath } : { phase: "closed" }; rerender(); const target = rows.querySelector(`[data-property-context-menu="true"] [data-section="${activeSection}"] button`); if (target)
        queueMicrotask(() => target.focus({ preventScroll: true })); };
    const beginAction = (row, focus) => { open(row, focus); focusedOpen = true; pendingAction = row.action === "reset" ? "reset" : "remove"; rerender(); };
    const cancelAction = () => { pendingAction = undefined; removed = false; confirmedAction = undefined; rerender(); };
    const confirmAction = (_row) => { confirmedAction = pendingAction; pendingAction = undefined; removed = true; rerender(); };
    const save = (row) => { if (!draft)
        return; if (removed) {
        options.onReset(row);
        close();
        return;
    } const staged = composedFacetDraftWithoutRemovedItems(draft, removedRuleIds, removedValueIds); options.onSave(row, sparseComposedFacets(staged, row.inherited ?? { path: row.path }), pendingStructure); close(); };
    filter.addEventListener("input", () => { query = filter.value; rerender(); });
    sort.addEventListener("change", () => { sortMode = sort.value; rerender(); });
    section.addEventListener("keydown", (event) => { if (event.key === "Escape" && overlayOpen) {
        event.preventDefault();
        if (focusedOpen)
            closeChild();
        else
            close("escape");
    } });
    rerender();
    section.append(heading, summary, quickEditFeedback, filterControls, addControls, rows);
    options.host.append(section);
    return section;
}
//# sourceMappingURL=data-layer-composed-schema-workspace-ui.js.map