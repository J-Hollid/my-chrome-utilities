import { activateProject, commitProjectImport, createProjectInLibrary, exportProjectBundle, migrateSingletonProject, projectMetadata, resolveProjectWrite, restoreProjectLibrary, saveProjectState, serializeProjectLibrary, stageProjectImport, updateProjectMetadata, PROJECT_LIBRARY_STORAGE_KEY } from "./data-layer-project-library.js";
import { undoProjectTransaction } from "./data-layer-specification-project.js";
import { restoreCanonicalProjectEnvelope, restoreCanonicalProjectState, serializeCanonicalProjectState } from "./data-layer-specification-repository.js";
const q = (root, selector) => { const value = root.querySelector(selector); if (!value)
    throw new Error(`Missing ${selector}`); return value; };
const button = (text, aria, run) => { const control = document.createElement("button"); control.type = "button"; control.textContent = text; control.setAttribute("aria-label", aria); control.addEventListener("click", run); return control; };
const metadataFields = (form, values) => { const fields = {}; for (const [key, label, kind] of [["name", "Name", "input"], ["purpose", "Purpose or description", "textarea"], ["website", "Website or domain", "input"], ["owner", "Owner or team", "input"], ["notes", "Notes", "textarea"]]) {
    const control = kind === "textarea" ? document.createElement("textarea") : document.createElement("input"), wrapper = document.createElement("label");
    control.name = key;
    control.value = values[key];
    if (key === "name")
        control.required = true;
    wrapper.append(label, control);
    form.append(wrapper);
    fields[key] = control;
} return fields; };
const readMetadata = (fields) => ({ name: fields.name.value, purpose: fields.purpose.value, website: fields.website.value, owner: fields.owner.value, notes: fields.notes.value });
export function mountProjectLibraryUi(options) {
    const now = options.now ?? (() => new Date().toISOString()), id = options.id ?? ((kind) => `${kind}:${crypto.randomUUID()}`), activeHeader = q(options.root, "#active-project-header"), activeCard = q(options.root, "#active-project-card"), search = q(options.root, "#project-library-search"), list = q(options.root, "#project-library-list"), create = q(options.root, "#create-library-project"), importControl = q(options.root, "#import-library-project"), file = q(options.root, "#import-library-project-file"), status = q(options.root, "#project-library-status");
    const singleton = options.storage.getItem(options.projectStorageKey), state = restoreCanonicalProjectState(singleton), envelope = restoreCanonicalProjectEnvelope(singleton), navigation = options.storage.getItem(options.navigationStorageKey);
    let library = migrateSingletonProject(restoreProjectLibrary(options.storage.getItem(PROJECT_LIBRARY_STORAGE_KEY)), state && envelope ? { state, revision: envelope.revision, ...(navigation ? { navigation: JSON.parse(navigation) } : {}) } : undefined, now);
    const active = () => library.activeProjectId ? library.projects[library.activeProjectId] : undefined;
    const projectProjection = () => { const record = active(); if (record)
        options.storage.setItem(options.projectStorageKey, serializeCanonicalProjectState(record.state, record.revision));
    else
        options.storage.removeItem(options.projectStorageKey); };
    const persist = (next, projection = true) => { library = next; options.storage.setItem(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(library)); if (projection)
        projectProjection(); options.onChange?.(); render(); };
    options.storage.setItem(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(library));
    if (library.activeProjectId)
        projectProjection();
    const open = (projectId, route = "overview") => { const next = activateProject(library, projectId, now); persist(next); options.openStudio(`specification-builder.html?project=${encodeURIComponent(projectId)}&route=${encodeURIComponent(route)}`); };
    const download = (projectId) => { const record = library.projects[projectId], serialized = exportProjectBundle(library, projectId), link = document.createElement("a"); globalThis.__lastProjectExport = serialized; link.href = URL.createObjectURL(new Blob([serialized], { type: "application/json" })); link.download = `${record.state.project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-project.json`; link.click(); URL.revokeObjectURL(link.href); status.textContent = `Exported ${record.state.project.name} Draft revision ${record.revision} without changing project context.`; };
    const closeDialog = (dialog) => { dialog.close(); dialog.remove(); };
    const edit = (projectId, returnFocus) => { const record = library.projects[projectId], dialog = document.createElement("dialog"), heading = document.createElement("h4"), form = document.createElement("form"), fields = metadataFields(form, projectMetadata(library, projectId)), save = button("Save project details", `Save details for ${record.state.project.name}`, () => { try {
        persist(updateProjectMetadata(library, projectId, readMetadata(fields), now));
        heading.textContent = `Saved ${library.projects[projectId].state.project.name}. Stable identity ${projectId}; Draft revision ${library.projects[projectId].revision}.`;
        undo.hidden = false;
    }
    catch (error) {
        heading.textContent = error instanceof Error ? error.message : String(error);
    } }), undo = button("Undo metadata edit", `Undo metadata edit for ${record.state.project.name}`, () => { const current = library.projects[projectId], restored = undoProjectTransaction(current.state); persist({ ...library, projects: { ...library.projects, [projectId]: { ...current, state: restored, revision: current.revision + 1, lastModifiedAt: now() } } }); heading.textContent = `Restored prior metadata for ${projectId} without changing active context.`; undo.hidden = true; }), cancel = button("Close", "Close project details", () => { closeDialog(dialog); returnFocus.focus(); }); heading.textContent = `Edit ${record.state.project.name} details`; undo.hidden = true; form.addEventListener("submit", (event) => event.preventDefault()); form.append(save, undo, cancel); dialog.append(heading, form); document.body.append(dialog); dialog.addEventListener("close", () => returnFocus.focus(), { once: true }); dialog.showModal(); fields.name.focus(); };
    const switchReview = (projectId, returnFocus) => { const target = library.projects[projectId], current = active(), dialog = document.createElement("dialog"), heading = document.createElement("h4"), summary = document.createElement("p"), confirm = button(`Switch to ${target.state.project.name}`, `Confirm switch to ${target.state.project.name}`, () => { try {
        persist(activateProject(library, projectId, now));
        closeDialog(dialog);
        queueMicrotask(() => list.querySelector(`[data-project-id="${CSS.escape(projectId)}"]`)?.focus());
    }
    catch (error) {
        summary.textContent = error instanceof Error ? error.message : String(error);
    } }), cancel = button("Cancel switch", `Cancel switch to ${target.state.project.name}`, () => { closeDialog(dialog); returnFocus.focus(); }); heading.textContent = `Review switch to ${target.state.project.name}`; summary.textContent = `${current?.state.project.name ?? "No active project"} (${library.activeProjectId ?? "none"}) → ${target.state.project.name} (${projectId}). Schema, Pages, Page Groups, Events, Flows, documentation, assignments, and Specification Studio will replace context atomically. Current Draft ${current?.pendingWrite ? "has a pending write" : "is saved"}.`; dialog.append(heading, summary); if (current?.pendingWrite) {
        confirm.disabled = true;
        for (const choice of ["merge", "reject", "retry"])
            dialog.append(button(`${choice[0].toUpperCase()}${choice.slice(1)} ${current.pendingWrite.label}`, `${choice} pending command ${current.pendingWrite.label}`, () => { try {
                const persisted = choice === "merge" ? { state: current.state, revision: Math.max(current.revision, current.pendingWrite.baseRevision) + 1 } : undefined;
                library = resolveProjectWrite(library, library.activeProjectId, choice, persisted, now);
                persist(library);
                confirm.disabled = false;
                summary.textContent = choice === "retry" ? `Replayed ${current.pendingWrite.label} at project revision ${library.projects[current.state.project.id].revision}. Retry switching to ${target.state.project.name}.` : `Resolved ${current.pendingWrite.label} with ${choice}. Retry switching to ${target.state.project.name}.`;
                confirm.focus();
            }
            catch (error) {
                summary.textContent = error instanceof Error ? error.message : String(error);
            } }));
    } dialog.append(confirm, cancel); document.body.append(dialog); dialog.showModal(); heading.tabIndex = -1; heading.focus(); };
    const creation = () => { const dialog = document.createElement("dialog"), heading = document.createElement("h4"), form = document.createElement("form"), fields = metadataFields(form, { name: "", purpose: "", website: "", owner: "", notes: "" }), review = document.createElement("p"), confirm = button("Confirm create project", "Confirm create project", () => { try {
        const next = createProjectInLibrary(library, readMetadata(fields), { id, now });
        persist(next);
        review.textContent = `${next.projects[next.activeProjectId].state.project.name} is active. Recommended next action: Open in Specification Studio.`;
        confirm.disabled = true;
    }
    catch (error) {
        review.textContent = error instanceof Error ? error.message : String(error);
    } }), prepare = button("Review create project", "Review create project", () => { const values = readMetadata(fields); try {
        if (!values.name.trim())
            throw new Error("Name rejects blank text.");
        if (Object.values(library.projects).some(({ state }) => state.project.name.toLowerCase() === values.name.trim().toLowerCase()))
            throw new Error("Name rejects a case-insensitive existing project name.");
        review.textContent = `Impact review: ${values.name.trim()} will become active while ${active()?.state.project.name ?? "all existing projects"} remains saved.`;
        confirm.disabled = false;
        confirm.focus();
    }
    catch (error) {
        review.textContent = error instanceof Error ? error.message : String(error);
        confirm.disabled = true;
    } }), openStudio = button("Open in Specification Studio", "Open new project in Specification Studio", () => { if (library.activeProjectId)
        open(library.activeProjectId); }), cancel = button("Close", "Close create project", () => closeDialog(dialog)); heading.textContent = "Create project"; confirm.disabled = true; form.addEventListener("submit", (event) => event.preventDefault()); form.append(prepare, review, confirm, openStudio, cancel); dialog.append(heading, form); document.body.append(dialog); dialog.showModal(); fields.name.focus(); };
    const importReview = (serialized) => { let staged = stageProjectImport(serialized, library, { id: (oldId) => `import:${crypto.randomUUID()}:${oldId.split(":")[0]}`, now }), dialog = document.createElement("dialog"), heading = document.createElement("h4"), summary = document.createElement("p"), name = document.createElement("input"), commit = button("Import as new project", "Import as new project", () => { try {
        const nextName = name.value.trim();
        if (!nextName)
            throw new Error("Enter a unique target project name.");
        if (Object.values(library.projects).some(({ state }) => state.project.name.toLowerCase() === nextName.toLowerCase()))
            throw new Error("Target project name must be unique.");
        staged = { ...staged, targetName: nextName, state: { ...staged.state, project: { ...staged.state.project, name: nextName } } };
        persist(commitProjectImport(library, staged, now), false);
        summary.textContent = `Imported ${nextName} as inactive project ${staged.projectId}. Open it explicitly to activate.`;
        commit.disabled = true;
    }
    catch (error) {
        summary.textContent = error instanceof Error ? error.message : String(error);
    } }), cancel = button("Close import review", "Close import review", () => closeDialog(dialog)); heading.textContent = "Review project import"; name.value = staged.targetName; name.setAttribute("aria-label", "Unique target project name"); summary.textContent = staged.blockers.length ? staged.blockers.map(({ section, message }) => `${section}: ${message}`).join(" · ") : `Format version 1 · source ${staged.sourceName} · Draft revision ${staged.sourceRevision} · entity counts ${JSON.stringify(staged.entityCounts)} · reference integrity ${staged.referenceIntegrity} · migrations ${staged.migrations.join(", ") || "none"} · unique target name ${staged.targetName} · Import as new project.`; commit.disabled = Boolean(staged.blockers.length); dialog.append(heading, summary, name, commit, cancel); document.body.append(dialog); dialog.showModal(); heading.tabIndex = -1; heading.focus(); };
    function render() {
        const record = active(), term = search.value.trim().toLowerCase();
        activeHeader.textContent = record ? `Active project: ${record.state.project.name} · ${record.state.project.id} · Draft revision ${record.revision}` : "No active project · Open project or Create project";
        activeCard.replaceChildren();
        if (record) {
            const heading = document.createElement("h4"), summary = document.createElement("p"), editButton = button("Edit details", `Edit details for ${record.state.project.name}`, () => edit(record.state.project.id, editButton));
            heading.textContent = record.state.project.name;
            summary.textContent = `${record.state.project.site} · Draft revision ${record.revision} · last modified ${record.lastModifiedAt}`;
            activeCard.append(heading, summary, button("Open in Specification Studio", `Open ${record.state.project.name} in Specification Studio`, () => open(record.state.project.id)), editButton, button("Export", `Export ${record.state.project.name}`, () => download(record.state.project.id)));
        }
        else {
            const message = document.createElement("p"), openProject = button("Open project", "Open a project", () => search.focus()), createProject = button("Create project", "Create project", creation);
            message.textContent = "No active project";
            activeCard.append(message, openProject, createProject);
        }
        list.replaceChildren();
        for (const [projectId, entry] of Object.entries(library.projects).filter(([, entry]) => [entry.state.project.name, entry.state.project.site, String(entry.state.project.owner ?? "")].some((value) => value.toLowerCase().includes(term)))) {
            const item = document.createElement("li"), summary = document.createElement("p"), isActive = projectId === library.activeProjectId;
            item.dataset.projectId = projectId;
            item.tabIndex = -1;
            summary.textContent = `${entry.state.project.name} · ${entry.state.project.site} · Draft revision ${entry.revision} · ${isActive ? "Active" : "Saved"} · last modified ${entry.lastModifiedAt}`;
            item.append(summary);
            if (isActive)
                item.append(button("Active", `${entry.state.project.name} Active`, () => { }));
            else
                item.append(button("Switch", `Switch to ${entry.state.project.name}`, function () { switchReview(projectId, this); }));
            item.append(button("Edit details", `Edit details for ${entry.state.project.name}`, function () { edit(projectId, this); }), button("Export", `Export ${entry.state.project.name}`, () => download(projectId)));
            list.append(item);
        }
    }
    search.addEventListener("input", render);
    create.addEventListener("click", creation);
    importControl.addEventListener("click", () => file.click());
    file.addEventListener("change", async () => { const selected = file.files?.[0]; if (selected)
        importReview(await selected.text()); file.value = ""; });
    render();
    const captureActiveProject = (state, revision) => { if (library.activeProjectId !== state.project.id)
        return; library = saveProjectState(library, state.project.id, state, revision, now); options.storage.setItem(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(library)); render(); };
    const activate = (projectId) => persist(activateProject(library, projectId, now));
    return { render, library: () => cloneLibrary(library), activate, syncActiveProject: projectProjection, captureActiveProject };
}
const cloneLibrary = (library) => structuredClone(library);
//# sourceMappingURL=data-layer-project-library-ui.js.map