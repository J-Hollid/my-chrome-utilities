import { composedFacetDraft, sparseComposedFacets } from "./data-layer-composed-schema-builders.js";
import { focusedOwnershipActions, focusedPropertySectionLabels, focusedPropertySections } from "./data-layer-focused-schema-property-ui.js";
import { renderComposedFocusedSection } from "./data-layer-composed-schema-workspace-focused-sections.js";
const button = (text, run) => { const control = document.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const actionText = (row) => row.action === "override" ? "Override here" : row.action === "reset" ? "Reset to parents" : "Remove local property";
export function mountComposedSchemaWorkspace(options) {
    const section = document.createElement("section"), heading = document.createElement("h2"), summary = document.createElement("p"), columns = document.createElement("div"), addControls = document.createElement("div"), choice = document.createElement("select"), add = document.createElement("button"), rows = document.createElement("div");
    let activePath, activeSection = "definition", draft, removed = false, removedRuleIds = new Set(), originFocus, originPath;
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
    const rowFor = (path) => options.model.rows.find(({ path: rowPath }) => rowPath === path);
    const open = (row, focus, sectionName = "definition") => { activePath = row.path; activeSection = sectionName; draft = composedFacetDraft(row.local, row.effective); removed = false; removedRuleIds = new Set(); if (focus) {
        originFocus = focus;
        originPath = row.path;
    } renderRows(); };
    const close = () => { const restorePath = originPath; activePath = undefined; draft = undefined; removed = false; removedRuleIds = new Set(); renderRows(); const target = originFocus?.isConnected ? originFocus : restorePath ? rows.querySelector(`[aria-label="Property actions for ${CSS.escape(restorePath)}"]`) : undefined; originFocus = undefined; originPath = undefined; if (target)
        queueMicrotask(() => target.focus({ preventScroll: true })); };
    const save = (row) => { if (!draft)
        return; if (removed) {
        options.onReset(row);
        close();
        return;
    } const staged = { ...draft, rules: draft.rules.filter((rule) => !removedRuleIds.has(String(rule.id ?? ""))) }; options.onSave(row, sparseComposedFacets(staged, row.inherited ?? { path: row.path })); close(); };
    const contextMenu = (row) => { const menu = document.createElement("div"); menu.setAttribute("role", "menu"); menu.setAttribute("aria-label", `${row.path} property context menu`); menu.dataset.propertyContextMenu = "true"; for (const sectionName of focusedPropertySections) {
        const entry = document.createElement("div"), choose = button(focusedPropertySectionLabels[sectionName], () => { activeSection = sectionName; renderRows(); }), details = document.createElement("span");
        entry.dataset.section = sectionName;
        details.textContent = sectionName === "values" ? `${(draft?.allowedValues ?? row.local.allowedValues ?? row.effective.allowedValues ?? []).length} allowed values` : sectionName === "rules" ? `${(draft?.rules ?? []).length} rules` : "View effective value";
        entry.append(choose, details);
        menu.append(entry);
    } const ownership = document.createElement("div"); const local = Object.keys(row.local).some((key) => key !== "path"), inherited = Boolean(row.inherited), actions = focusedOwnershipActions({ local, inherited, overridden: row.action === "reset", invariant: row.effective.enforcement === "invariant", conflict: row.validationState === "blocked", replaceable: row.effective.enforcement !== "invariant" }); for (const action of actions) {
        const control = button(action, () => { if (action === "Remove local" || action === "Reset to parent") {
            removed = true;
            activeSection = "rules";
            renderRows();
            return;
        } if (action === "Override here" || action === "Replace here") {
            activeSection = "definition";
            renderRows();
            return;
        } renderRows(); });
        control.dataset.ownershipAction = action;
        ownership.append(control);
    } menu.append(ownership); return menu; };
    const renderFocused = (row) => { const editor = document.createElement("section"), heading = document.createElement("h3"), identity = document.createElement("p"), effective = document.createElement("p"), host = document.createElement("section"), actions = document.createElement("div"); editor.setAttribute("aria-label", `${row.path} focused property editor`); editor.dataset.focusedPropertyEditor = "true"; heading.textContent = `Focused property · ${row.path}`; identity.textContent = `${row.path} · stable identity ${row.effective.definitionId ?? row.path}`; effective.textContent = `Inherited value and source: ${row.inherited ? options.effectiveText({ ...row, effective: row.inherited }) : "none"} · Effective result: ${options.effectiveText(row)} · validation ${row.validationState} · conflicts ${row.validationState === "blocked" ? row.message : "none"}`; host.setAttribute("aria-label", `${row.path} focused ${focusedPropertySectionLabels[activeSection]} section`); renderComposedFocusedSection(host, { model: options.model, dom: document, row, getDraft: () => draft, activeSection, removedRuleIds, render: renderRows }); actions.append(button("Cancel", close), button("Review changes", () => { const review = document.createElement("p"); review.setAttribute("aria-label", "Review changes"); review.textContent = `Review changes · ${row.path} · prospective effective result ${options.effectiveText(row)} · affected consumers recompile`; actions.replaceChildren(review, button("Cancel review", () => renderRows()), button("Confirm changes", () => save(row))); }), button("Save property", () => save(row))); editor.append(heading, identity, effective, host, actions); return editor; };
    const renderRows = () => { rows.replaceChildren(); for (const row of options.model.rows) {
        const article = document.createElement("article"), overview = document.createElement("div"), toggle = document.createElement("button"), effective = document.createElement("span"), source = document.createElement("span"), local = document.createElement("span"), validation = document.createElement("span"), actions = document.createElement("div"), primary = button(actionText(row), () => open(row, primary)), propertyActions = button("Property actions", () => open(row, propertyActions));
        article.className = "composed-schema-row";
        article.dataset.effectivePropertyPath = row.path;
        if (options.rowPathDataset)
            article.dataset[options.rowPathDataset] = row.path;
        article.dataset.validationState = row.validationState;
        toggle.type = "button";
        toggle.className = "composed-schema-row-toggle";
        toggle.textContent = row.path;
        toggle.setAttribute("aria-expanded", String(activePath === row.path));
        toggle.addEventListener("click", () => activePath === row.path ? close() : open(row, toggle));
        effective.textContent = options.effectiveText(row) || "constraint";
        source.textContent = row.source;
        local.textContent = removed && activePath === row.path ? "Removed" : Object.keys(row.local).length > 1 ? JSON.stringify(row.local) : "Inherited";
        validation.textContent = `${row.validationState} · ${row.message}`;
        actions.className = "composed-schema-row-actions";
        propertyActions.setAttribute("aria-label", `Property actions for ${row.path}`);
        actions.append(primary, propertyActions);
        overview.append(toggle, effective, source, local, validation, actions);
        article.append(overview);
        if (options.onRepair)
            for (const repair of row.repairs)
                article.append(button(repair.label, () => options.onRepair?.(repair)));
        if (activePath === row.path) {
            article.append(contextMenu(row), renderFocused(row));
        }
        rows.append(article);
    } };
    section.addEventListener("keydown", (event) => { if (event.key === "Escape" && activePath) {
        event.preventDefault();
        close();
    } });
    renderRows();
    section.append(heading, summary, columns, addControls, rows);
    options.host.append(section);
    return section;
}
//# sourceMappingURL=data-layer-composed-schema-workspace-ui.js.map