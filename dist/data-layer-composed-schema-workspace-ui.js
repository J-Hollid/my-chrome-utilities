import { composedFacetDraft, overrideComposedRule, sparseComposedFacets } from "./data-layer-composed-schema-builders.js";
import { renderComposedRows } from "./data-layer-composed-schema-workspace-rows.js";
const button = (text, run) => { const control = document.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function mountComposedSchemaWorkspace(options) {
    const section = document.createElement("section"), heading = document.createElement("h2"), summary = document.createElement("p"), columns = document.createElement("div"), addControls = document.createElement("div"), choice = document.createElement("select"), add = document.createElement("button"), rows = document.createElement("div");
    let activePath, activeSection = "definition", draft, removed = false, removedRuleIds = new Set(), overriddenRuleIds = new Set(), pendingAction, originFocus, originPath;
    section.className = "composed-schema-workspace";
    section.setAttribute("aria-label", options.model.heading);
    section.dataset.schemaStatus = options.model.status;
    section.dataset.schemaPresentation = "focused-property";
    if (options.schemaContributorId)
        section.dataset.schemaContributorId = options.schemaContributorId;
    if (options.schemaContributorScope)
        section.dataset.schemaContributorScope = options.schemaContributorScope;
    heading.textContent = options.model.heading;
    summary.setAttribute("role", "status");
    summary.className = options.model.status === "blocked" ? "error" : "status-text";
    summary.textContent = `${options.model.status === "blocked" ? "Blocked" : "Ready"} · ${options.model.rows.length} effective properties${options.includeConflictSummary === false ? "" : ` · ${options.model.conflictSummary}`}`;
    columns.className = "composed-schema-columns";
    columns.setAttribute("aria-hidden", "true");
    for (const label of ["Property", "Effective definition", "Source", "Local state", "Validation state", "Actions"])
        columns.append(Object.assign(document.createElement("strong"), { textContent: label }));
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
    const rerender = () => renderComposedRows(rows, { dom: document, model: options.model, effectiveText: options.effectiveText, onRepair: options.onRepair, rowPathDataset: options.rowPathDataset, activePath, activeSection, draft, removed, removedRuleIds, overriddenRuleIds, overrideRule, pendingAction, beginAction, cancelAction, confirmAction, open, close, save, render: rerender, setActiveSection: (value) => { activeSection = value; } });
    const overrideRule = (index) => { if (!draft)
        return; const id = `rule:${crypto.randomUUID()}`, next = overrideComposedRule(draft, index, id); if (next === draft)
        return; draft = next; overriddenRuleIds.add(id); rerender(); };
    const open = (row, focus, sectionName = "definition") => { activePath = row.path; activeSection = sectionName; draft = composedFacetDraft(row.local, row.effective); removed = false; removedRuleIds = new Set(); overriddenRuleIds = new Set(); pendingAction = undefined; if (focus) {
        originFocus = focus;
        originPath = row.path;
    } rerender(); };
    const close = () => { const restorePath = originPath; activePath = undefined; draft = undefined; removed = false; removedRuleIds = new Set(); overriddenRuleIds = new Set(); pendingAction = undefined; rerender(); const target = originFocus?.isConnected ? originFocus : restorePath ? rows.querySelector(`[aria-label="Property actions for ${CSS.escape(restorePath)}"]`) : undefined; originFocus = undefined; originPath = undefined; if (target)
        queueMicrotask(() => target.focus({ preventScroll: true })); };
    const beginAction = (row, focus) => { open(row, focus); pendingAction = row.action === "reset" ? "reset" : "remove"; rerender(); };
    const cancelAction = () => { pendingAction = undefined; removed = false; rerender(); };
    const confirmAction = (row) => { pendingAction = undefined; removed = true; options.onReset(row); close(); };
    const save = (row) => { if (!draft)
        return; if (removed) {
        options.onReset(row);
        close();
        return;
    } const staged = { ...draft, rules: draft.rules.filter((rule) => !removedRuleIds.has(String(rule.id ?? ""))) }; options.onSave(row, sparseComposedFacets(staged, row.inherited ?? { path: row.path })); close(); };
    section.addEventListener("keydown", (event) => { if (event.key === "Escape" && activePath) {
        event.preventDefault();
        close();
    } });
    rerender();
    section.append(heading, summary, columns, addControls, rows);
    options.host.append(section);
    return section;
}
//# sourceMappingURL=data-layer-composed-schema-workspace-ui.js.map