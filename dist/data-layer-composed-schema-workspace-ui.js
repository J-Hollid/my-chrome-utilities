import { mountComposedSchemaFacetBuilder } from "./data-layer-composed-schema-builders.js";
const actionText = (row) => row.action === "override" ? "Override here" : row.action === "reset" ? "Reset to parents" : "Remove local property";
const button = (text, run) => { const control = document.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function mountComposedSchemaWorkspace(options) {
    const { model } = options, section = document.createElement("section"), heading = document.createElement("h2"), summary = document.createElement("p"), columns = document.createElement("div"), addControls = document.createElement("div"), choice = document.createElement("select"), add = document.createElement("button"), rows = document.createElement("div"), propertyChoices = model.rows.flatMap(({ path, effective }) => effective.definitionId ? [{ path, definitionId: effective.definitionId, type: effective.type }] : []);
    section.className = "composed-schema-workspace";
    section.setAttribute("aria-label", model.heading);
    section.dataset.schemaStatus = model.status;
    if (options.schemaContributorId)
        section.dataset.schemaContributorId = options.schemaContributorId;
    if (options.schemaContributorScope)
        section.dataset.schemaContributorScope = options.schemaContributorScope;
    heading.textContent = model.heading;
    summary.setAttribute("role", "status");
    summary.className = model.status === "blocked" ? "error" : "status-text";
    summary.textContent = `${model.status === "blocked" ? "Blocked" : "Ready"} · ${model.rows.length} effective properties${options.includeConflictSummary === false ? "" : ` · ${model.conflictSummary}`}`;
    columns.className = "composed-schema-columns";
    columns.setAttribute("aria-hidden", "true");
    for (const label of ["Property", "Effective definition", "Source", "Local state", "Validation state", "Actions"])
        columns.append(Object.assign(document.createElement("strong"), { textContent: label }));
    addControls.setAttribute("aria-label", "Add local property");
    choice.setAttribute("aria-label", "Choose inherited property to override");
    choice.append(new Option("Choose a property", ""), ...model.rows.filter(({ inherited }) => Boolean(inherited)).map(({ path }) => new Option(path, path)));
    add.type = "button";
    add.textContent = "Add local property";
    addControls.append(choice, add);
    rows.setAttribute("role", "table");
    rows.setAttribute("aria-label", `${model.heading} rows`);
    const rowFor = (path) => rows.querySelector(`[data-effective-property-path="${CSS.escape(path)}"]`), openDetail = (article) => { const detail = article.querySelector("[aria-label$=\"stacked row detail\"]"), toggle = article.querySelector(".composed-schema-row-toggle"); if (detail)
        detail.hidden = false; toggle?.setAttribute("aria-expanded", "true"); detail?.querySelector("input,select,button")?.focus(); };
    add.addEventListener("click", () => { const path = choice.value || model.rows.find(({ inherited }) => Boolean(inherited))?.path, article = path ? rowFor(path) : undefined; if (article)
        openDetail(article); });
    for (const row of model.rows) {
        const article = document.createElement("article"), overview = document.createElement("div"), toggle = document.createElement("button"), effective = document.createElement("span"), source = document.createElement("span"), local = document.createElement("span"), validation = document.createElement("span"), actions = document.createElement("div"), primary = document.createElement("button"), detail = document.createElement("section"), builder = document.createElement("section"), detailAction = document.createElement("button"), provenance = document.createElement("ol"), impact = document.createElement("div");
        article.className = "composed-schema-row";
        article.dataset.effectivePropertyPath = row.path;
        if (options.rowPathDataset)
            article.dataset[options.rowPathDataset] = row.path;
        article.dataset.validationState = row.validationState;
        overview.className = "composed-schema-row-overview";
        overview.setAttribute("role", "row");
        toggle.type = primary.type = detailAction.type = "button";
        toggle.className = "composed-schema-row-toggle";
        toggle.textContent = row.path;
        toggle.setAttribute("aria-expanded", "false");
        effective.textContent = options.effectiveText(row) || "constraint";
        source.textContent = row.source;
        local.textContent = Object.keys(row.local).length > 1 ? JSON.stringify(row.local) : "Inherited";
        validation.textContent = `${row.validationState} · ${row.message}`;
        actions.className = "composed-schema-row-actions";
        primary.textContent = actionText(row);
        detail.className = "composed-schema-row-detail";
        detail.hidden = true;
        detail.setAttribute("aria-label", `${row.path} stacked row detail`);
        detailAction.textContent = primary.textContent;
        provenance.setAttribute("aria-label", `${row.path} provenance`);
        provenance.append(Object.assign(document.createElement("li"), { textContent: "Provenance" }));
        for (const origin of row.provenance)
            provenance.append(Object.assign(document.createElement("li"), { textContent: `${origin.scope} ${origin.contributorName} · ${origin.state}` }));
        if (options.onRepair)
            for (const repair of row.repairs)
                impact.append(button(repair.label, () => options.onRepair(repair)));
        const open = () => openDetail(article);
        toggle.addEventListener("click", () => { detail.hidden = !detail.hidden; toggle.setAttribute("aria-expanded", String(!detail.hidden)); if (detail.hidden)
            toggle.focus(); });
        primary.addEventListener("click", () => { if (row.action === "override") {
            open();
            return;
        } impact.replaceChildren(); impact.append(`${row.action === "reset" ? "Reset" : "Remove"} preview: effective parent value ${row.inherited ? options.effectiveText({ ...row, effective: row.inherited }) : "none"}; affected Page instances will recompile; outputs become stale; one Undo action will be available. `); const confirm = button(row.action === "reset" ? "Confirm reset to parents" : "Confirm remove local property", () => options.onReset(row)); impact.append(confirm); open(); });
        detailAction.addEventListener("click", () => primary.click());
        actions.append(primary);
        overview.append(toggle, effective, source, local, validation, actions);
        detail.append(builder, detailAction, provenance, impact);
        article.append(overview, detail);
        rows.append(article);
        mountComposedSchemaFacetBuilder({ host: builder, path: row.path, local: row.local, effective: row.effective, inherited: row.inherited, propertyChoices, ...(options.includeConditionEvaluation === undefined ? {} : { includeConditionEvaluation: options.includeConditionEvaluation }), onSave: (facets) => options.onSave(row, facets) });
    }
    section.append(heading, summary, columns, addControls, rows);
    options.host.append(section);
    return section;
}
//# sourceMappingURL=data-layer-composed-schema-workspace-ui.js.map