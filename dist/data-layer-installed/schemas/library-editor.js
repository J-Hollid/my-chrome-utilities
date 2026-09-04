import { inspectSchemaRename, schemaInheritanceConflict, schemaInheritanceError, schemaRevision, schemaRevisionChoices, updateSchemaWorkingDraft, } from "../../utilities/data-layer/schemas.js";
export class SchemaLibraryEditor {
    #ports;
    constructor(ports) { this.#ports = ports; }
    render() {
        const p = this.#ports, root = p.root, document = p.document, library = p.library, canonical = p.canonical, schema = library.activeSchemaId ? p.active() : library.draft, draft = schema?.workingDraft, presented = schema ? p.editorDraft(schema) : undefined, editor = root.querySelector("#schema-editor"), detail = root.querySelector("#schema-detail"), empty = root.querySelector("#schema-detail-empty"), name = root.querySelector("#schema-editor-name"), status = root.querySelector("#schema-editor-status"), description = root.querySelector("#schema-editor-description"), descriptionOrigin = root.querySelector("#schema-description-origin"), target = root.querySelector("#schema-editor-target"), onlyDeclared = root.querySelector("#schema-only-declared-properties"), parentSelect = root.querySelector("#schema-editor-parent"), provenance = root.querySelector("#schema-inheritance-provenance"), overrides = root.querySelector("#schema-rule-overrides"), overrideList = root.querySelector("#schema-rule-override-list"), save = root.querySelector("#save-schema"), saveReason = root.querySelector("#save-schema-reason"), build = root.querySelector("#build-specification"), revisions = root.querySelector("#schema-revision-selector"), duplicate = root.querySelector("#duplicate-schema-revision"), restore = root.querySelector("#restore-schema-revision"), buildHistorical = root.querySelector("#build-historical-specification"), closeSummary = root.querySelector("#close-schema-editor-review-summary"), confirmRevision = root.querySelector("#confirm-schema-revision"), comparison = root.querySelector("#schema-revision-comparison"), nameAssistance = root.querySelector("#schema-editor-name-assistance");
        if (editor)
            editor.hidden = !schema;
        if (detail)
            detail.hidden = false;
        if (empty)
            empty.hidden = Boolean(schema);
        if (name)
            name.value = draft?.name ?? schema?.name ?? "";
        if (status) {
            const pending = schema?.workingDraft?.pendingChanges.length ?? 0, lifecycle = schema?.published === false ? `Unpublished new schema draft · ${pending} pending changes`
                : schema?.workingDraft ? `Working draft based on revision ${schema.version} · ${pending} pending changes` : schema ? `Current revision ${schema.version} · no working draft` : "Unsaved new schema", revision = canonical.editor?.load().revision;
            status.textContent = canonical.editor && revision !== undefined ? `${lifecycle} · ${canonical.editor.label} · Schema revision ${revision}` : lifecycle;
        }
        if (description)
            description.value = draft?.documentation?.description ?? schema?.documentation?.description ?? "";
        if (descriptionOrigin)
            descriptionOrigin.textContent = draft?.documentation?.description ? "Working draft" : schema?.documentation?.description ? `Revision ${schema.version}` : "No description";
        if (target)
            target.value = draft?.assignments[0]?.target ?? schema?.assignments[0]?.target ?? "payload";
        if (onlyDeclared && presented)
            onlyDeclared.checked = presented.document.additionalProperties === false;
        if (parentSelect && presented && document) {
            const none = document.createElement("option");
            none.value = "";
            none.textContent = "No parent";
            parentSelect.replaceChildren(none, ...library.schemas.filter(({ id }) => id !== presented.id).map((candidate) => {
                const option = document.createElement("option");
                option.value = candidate.id;
                option.textContent = `${candidate.name} v${candidate.version}`;
                return option;
            }));
            parentSelect.value = presented.parentSchemaId ?? "";
        }
        const parent = presented?.parentSchemaId ? library.schemas.find(({ id }) => id === presented.parentSchemaId) : undefined;
        if (provenance)
            provenance.textContent = parent ? `Inherited rules originate in ${parent.name} v${parent.version}. Local rules override only after conflicts are resolved.` : "Local schema only";
        if (overrides)
            overrides.hidden = !parent;
        if (overrideList && document)
            overrideList.replaceChildren(...Object.keys(parent?.document.properties ?? {}).map((property) => {
                const label = document.createElement("label"), select = document.createElement("select");
                select.setAttribute("aria-label", `${property} inherited rule override`);
                select.replaceChildren(...["inherit", "enabled", "disabled"].map((state) => { const option = document.createElement("option"); option.value = state; option.textContent = state === "inherit" ? "Inherit" : state === "enabled" ? "Enabled in this schema" : "Disabled in this schema"; return option; }));
                select.value = presented?.inheritedRuleOverrides?.[property] ?? "inherit";
                p.listen(select, "change", () => {
                    if (!library.activeSchemaId)
                        return;
                    const current = p.active(), currentDraft = p.editorDraft(current);
                    p.replaceActive(updateSchemaWorkingDraft(current, { inheritedRuleOverrides: { ...(currentDraft.inheritedRuleOverrides ?? {}), [property]: select.value } }, `Change inherited rule override ${property}`));
                    p.persist();
                    p.renderAll();
                });
                label.append(`${property}: `, select);
                return label;
            }));
        if (presented)
            p.renderInheritance(presented);
        if (schema && presented) {
            const candidates = [...library.schemas.filter(({ id }) => id !== schema.id), presented], inheritance = schemaInheritanceError(presented, candidates) ?? schemaInheritanceConflict(presented, candidates), rename = inspectSchemaRename(schema, library.schemas, name?.value ?? presented.name), hasProperties = Object.keys(presented.document.properties ?? {}).length > 0, ready = rename.ready && hasProperties && !inheritance;
            if (save) {
                save.disabled = !ready;
                save.textContent = schema.published === false ? "Publish schema" : "Publish revision";
            }
            if (saveReason)
                saveReason.textContent = !rename.ready ? rename.assistance : !hasProperties ? "Add at least one property" : inheritance ?? "Ready to save";
        }
        else if (save)
            save.disabled = true;
        const pending = draft?.pendingChanges ?? [];
        if (build) {
            build.hidden = !draft;
            build.onclick = schema && draft ? () => p.openSpecification(schema, "working-draft", build) : null;
        }
        const history = schema ? schemaRevisionChoices(schema) : [];
        if (revisions && document) {
            const selected = Number(revisions.value);
            revisions.replaceChildren(...history.map((version) => { const option = document.createElement("option"); option.value = String(version); option.textContent = `Revision ${version}`; return option; }));
            revisions.value = String(history.includes(selected) ? selected : history[0] ?? "");
        }
        if (duplicate)
            duplicate.disabled = !history.length;
        if (restore)
            restore.disabled = !history.length;
        if (buildHistorical) {
            buildHistorical.disabled = !history.length;
            buildHistorical.onclick = schema && history.length ? () => p.openSpecification(schema, `historical:${p.revisionVersion()}`, buildHistorical) : null;
        }
        if (closeSummary)
            closeSummary.textContent = draft ? `${pending.length} pending change${pending.length === 1 ? "" : "s"}` : "No pending changes";
        if (confirmRevision && schema)
            confirmRevision.textContent = schema.published === false ? "Publish revision 1" : `Publish revision ${schema.version + 1}`;
        if (comparison && schema) {
            const version = p.revisionVersion(), historical = schemaRevision(schema, version);
            comparison.textContent = `Revision ${version} compared with current revision ${schema.version}. ${Object.keys(historical?.document.properties ?? {}).length} historical properties; ${Object.keys(schema.document.properties ?? {}).length} current properties.`;
        }
        if (nameAssistance && schema)
            nameAssistance.textContent = inspectSchemaRename(schema, library.schemas, name?.value ?? draft?.name ?? schema.name).assistance;
        p.renderProperty();
    }
}
//# sourceMappingURL=library-editor.js.map