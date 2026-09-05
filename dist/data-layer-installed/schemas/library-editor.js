import { createSchema, discardSchemaWorkingDraft, duplicateSchemaRevision, inspectSchemaRename, publishSchemaWorkingDraft, restoreSchemaRevisionDraft, schemaInheritanceConflict, schemaInheritanceError, schemaRevision, schemaRevisionChoices, updateSchemaWorkingDraft, setSchemaDescription, } from "../../utilities/data-layer/schemas.js";
export class SchemaLibraryEditor {
    #ports;
    #pendingRestoration;
    constructor(ports) { this.#ports = ports; }
    pendingRestorationState() {
        return this.#pendingRestoration ? { ...this.#pendingRestoration } : undefined;
    }
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
                : schema?.workingDraft ? `Working draft based on revision ${schema.version} · ${pending} pending changes` : schema ? `Current revision ${schema.version} · no working draft` : "Unsaved new schema", revision = canonical.editorDocument()?.revision;
            status.textContent = canonical.hasEditor() && revision !== undefined ? `${lifecycle} · ${canonical.editorLabel()} · Schema revision ${revision}` : lifecycle;
        }
        if (description)
            description.value = draft?.documentation?.description ?? schema?.documentation?.description ?? "";
        if (descriptionOrigin)
            descriptionOrigin.textContent = draft?.documentation?.description ? "Working draft" : schema?.documentation?.description ? `Revision ${schema.version}` : "No description";
        if (target)
            target.value = draft?.assignments[0]?.target ?? schema?.assignments[0]?.target ?? "payload";
        if (onlyDeclared && presented)
            onlyDeclared.checked = presented.document
                .additionalProperties === false;
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
                select.replaceChildren(...["inherit", "enabled", "disabled"].map((state) => {
                    const option = document.createElement("option");
                    option.value = state;
                    option.textContent =
                        state === "inherit" ? "Inherit" : state === "enabled" ? "Enabled in this schema" : "Disabled in this schema";
                    return option;
                }));
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
            this.renderInheritance(presented);
        if (schema && presented) {
            const candidates = [...library.schemas.filter(({ id }) => id !== schema.id), presented], inheritance = schemaInheritanceError(presented, candidates)
                ?? schemaInheritanceConflict(presented, candidates), rename = inspectSchemaRename(schema, library.schemas, name?.value ?? presented.name), hasProperties = Object.keys(presented.document
                .properties ?? {}).length > 0, ready = rename.ready && hasProperties && !inheritance;
            if (save) {
                save.disabled = !ready;
                save.textContent = schema.published === false ? "Publish schema" : "Publish revision";
            }
            if (saveReason)
                saveReason.textContent = !rename
                    .ready ? rename.assistance : !hasProperties ? "Add at least one property" : inheritance ?? "Ready to save";
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
    persistDraft() {
        const p = this.#ports, library = p.library;
        if (!library.draft && !library.activeSchemaId)
            return;
        const schema = p.active(), name = p.root
            .querySelector("#schema-editor-name");
        p.replaceActive(p.proposeName(schema, name?.value ?? schema.name));
        p.persistIfStored();
        this.#refreshSaveState();
    }
    updateName() {
        const p = this.#ports, library = p.library;
        if (!library.draft && !library.activeSchemaId)
            return;
        const schema = p.active(), name = p.root
            .querySelector("#schema-editor-name")?.value ?? schema.name;
        if (p.canonical.hasEditor()) {
            const projection = { ...p.editorDraft(schema), name };
            library.setDraft(projection);
            this.#refreshSaveState(projection);
            void p.canonical
                .persistCurrentProjection(projection, "schema name");
            return;
        }
        this.persistDraft();
    }
    saveDescription() {
        const p = this.#ports, schema = p.active(), input = p.root.querySelector("#schema-editor-description");
        if (!p.library.draft && !p.library
            .activeSchemaId)
            return;
        const documentation = setSchemaDescription(schema.workingDraft?.documentation ?? schema.documentation ?? {}, input?.value ?? "");
        p.replaceActive(updateSchemaWorkingDraft(schema, {
            documentation
        }, "Update schema description"));
        const tracks = Boolean(p.canonical.hasEditor() && p.settle), settlement = tracks ? p.beginSettlement(schema.id) : undefined;
        p.persistIfStored();
        p.renderAll();
        if (tracks)
            void p.settle(schema.id).then(() => { if (p.mounted()) {
                p.clearSettlement(schema.id, settlement);
                if (p.canonical.hasEditor())
                    p.renderCanonical();
            } }, () => { });
    }
    updateTarget() {
        const p = this.#ports, library = p.library;
        if (!library.draft && !library.activeSchemaId)
            return;
        const schema = p.active(), target = p.root
            .querySelector("#schema-editor-target")?.value === "raw input" ? "raw input" : "payload", assignments = (schema.workingDraft?.assignments ?? schema.assignments).map((assignment) => ({ ...assignment, target }));
        p.replaceActive(updateSchemaWorkingDraft(schema, {
            assignments
        }, "Update validation target"));
        p.persistIfStored();
        p.renderAll();
    }
    changeParent() {
        const p = this.#ports, library = p.library;
        if (!library.draft && !library.activeSchemaId)
            return;
        const schema = p.active(), changed = p.withParent(p.editorDraft(schema), p.root.querySelector("#schema-editor-parent")?.value || undefined);
        p.replaceActive(updateSchemaWorkingDraft(schema, { parentSchemaId: changed.parentSchemaId }, "Change parent schema"));
        p.persistIfStored();
        p.renderAll();
    }
    changeAdditionalProperties() {
        const p = this.#ports, library = p.library;
        if (!library.draft && !library.activeSchemaId)
            return;
        const schema = p.active(), draft = p.editorDraft(schema), { additionalProperties: _old, ...document } = draft.document, checked = p.root.querySelector("#schema-only-declared-properties")?.checked;
        p.replaceActive(updateSchemaWorkingDraft(schema, { document: checked ? { ...document,
                additionalProperties: false } : document }, "Change additional-property policy"));
        const tracks = Boolean(p.canonical.hasEditor() && p.settle), settlement = tracks ? p.beginSettlement(schema.id) : undefined;
        p.persistIfStored();
        p.renderAll();
        if (tracks) {
            const save = p.root.querySelector("#save-schema");
            if (save)
                save.disabled = true;
            void p.settle(schema.id).then(() => { if (p.mounted()) {
                p.clearSettlement(schema.id, settlement);
                p.renderAll();
            } }, () => { });
        }
    }
    openRevisionReview() {
        const p = this.#ports, library = p.library;
        this.render();
        const draft = library.draft ?? (library.activeSchemaId ? p.active() : undefined);
        if (!draft)
            return;
        const existing = library.schemas.find(({ id }) => id === draft.id), persisted = existing ? p.editorDraft(existing) : draft, pending = persisted.workingDraft?.pendingChanges.filter((change) => !change.startsWith("Rename schema from ")).join("; ") ?? "", proposed = persisted.workingDraft
            ?.name ?? persisted.name, rename = existing && proposed !== existing.name ? ` Rename schema from ${existing.name} to ${proposed}.` : "", summary = p.root.querySelector("#schema-revision-review-summary"), dialog = p.root.querySelector("#schema-revision-review");
        if (summary)
            summary.textContent = existing?.published === false ? `${draft.name} draft will be published as current revision 1.` : existing ? `${existing.name} working draft will be compared with current revision ${existing.version}; confirmation publishes revision ${existing.version + 1}.${rename}${pending ?
                ` Pending changes: ${pending}.` : ""}` : `${draft.name} will be published as current revision 1.`;
        if (dialog)
            dialog.hidden = false;
        dialog?.showModal();
    }
    publish(closeEditor = false) {
        const p = this.#ports, library = p.library, transient = library.activeIndex() < 0, current = p.active(), presented = p.editorDraft(current), publishable = transient ? { ...current, id: createSchema(presented.name.trim(), 1, presented.document).id, published: false } : current, published = publishSchemaWorkingDraft(publishable);
        if (transient)
            library.append(published);
        else
            p.replaceActive(published);
        if (p.addPublishedRules(published))
            p.persistLibraries();
        else
            p.persist();
        this.#closeRevisionDialog();
        if (closeEditor) {
            p.closeCanonical();
            library.clearSelection();
        }
        p
            .renderAll();
        const revalidated = p.revalidate();
        const result = p.root.querySelector("#schema-result");
        if (result)
            result.textContent = `Published ${published.name} revision ${published.version}. Revalidated ${revalidated} current Live events.`;
        return published;
    }
    confirmRevision() {
        const p = this.#ports;
        if (this.#pendingRestoration) {
            const pending = this.#pendingRestoration;
            this.#pendingRestoration = undefined;
            if (p.active()
                .id !== pending.schemaId)
                throw new Error("The schema selected for restoration is no longer active.");
            p.replaceActive(restoreSchemaRevisionDraft(p.active(), pending.version));
            p.persist();
            this.#closeRevisionDialog();
            p.renderAll();
            return;
        }
        this.publish(true);
    }
    cancelRevision() { this.#pendingRestoration = undefined; this.#closeRevisionDialog(); }
    discardTransient() { const p = this.#ports; p.library.clearSelection(); this.#closeDialog("#close-schema-editor-review"); p.renderAll(); }
    keepEditing() { this.#closeDialog("#close-schema-editor-review"); this.#ports.root.querySelector("#schema-editor-name")?.focus(); }
    closeEditor() {
        const p = this.#ports;
        if (!p.library.draft && !p.library.activeSchemaId)
            return;
        p.library.clearSelection();
        p.closeCanonical();
        p.renderAll();
        const result = p
            .root.querySelector("#schema-result");
        if (result)
            result.textContent = "Working draft retained without publishing.";
    }
    discardWorking() {
        const p = this.#ports;
        if (p.library.activeIndex() >= 0) {
            p.replaceActive(discardSchemaWorkingDraft(p.active()));
            p.persist();
        }
        p.library.clearSelection();
        this.#closeDialog("#close-schema-editor-review");
        p.renderAll();
    }
    duplicateRevision() {
        const p = this.#ports, duplicate = duplicateSchemaRevision(p.active(), p.revisionVersion(), p.library.schemas);
        p.library.append(duplicate);
        p.persist();
        p
            .renderAll();
    }
    restoreRevision() {
        const p = this.#ports, schema = p.active(), version = p.revisionVersion();
        this.#pendingRestoration = { schemaId: schema.id, version };
        const summary = p.root
            .querySelector("#schema-revision-review-summary"), dialog = p.root.querySelector("#schema-revision-review");
        if (summary)
            summary.textContent = `${schema.name} revision ${version} will replace ${schema.workingDraft?.pendingChanges.length ?? 0} pending draft changes and create a working draft. Current revision ${schema.version} remains active; publication will create revision ${schema.version + 1}.`;
        if (dialog)
            dialog.hidden = false;
        dialog?.showModal();
    }
    renderInheritance(draft) {
        const p = this.#ports, groupsHost = p.root.querySelector("#schema-inherited-rule-groups"), preview = p.root.querySelector("#schema-effective-rule-preview"), document = p.document;
        if (!groupsHost || !preview || !document)
            return;
        const ancestors = [], seen = new Set([draft.id]);
        let parentId = draft.parentSchemaId;
        while (parentId && !seen.has(parentId)) {
            seen.add(parentId);
            const parent = p.library.schemas.find(({ id }) => id === parentId);
            if (!parent)
                break;
            ancestors.push(parent);
            parentId = parent.parentSchemaId;
        }
        const inherited = ancestors.flatMap((origin) => (origin.attachedRules ?? []).map((rule) => {
            const override = rule.propertyPath ? draft.inheritedRuleOverrides?.[rule
                .propertyPath] : undefined;
            return { path: rule.propertyPath ?? "root", rule, origin, state: override === "disabled" ? "disabled-inherited" : override === "enabled" ? "explicitly-reenabled" :
                    "active-inherited" };
        }));
        const local = (draft.attachedRules ?? []).map((rule) => ({ path: rule.propertyPath ?? "root", rule, origin: draft, state: "local" })), label = (entry) => p.rules().find(({ id }) => id === entry.rule.id)?.name ?? entry.rule.id, grouped = { "active-inherited": inherited.filter((entry) => entry.state === "active-inherited" && entry.rule.enabled !== false), "disabled-inherited": inherited.filter((entry) => entry.state === "disabled-inherited" || (entry.state === "active-inherited" && entry.rule.enabled === false)),
            "explicitly-reenabled": inherited.filter((entry) => entry.state === "explicitly-reenabled"), local }, labels = { "active-inherited": "Active inherited", "disabled-inherited": "Disabled inherited", "explicitly-reenabled": "Explicitly re-enabled", local: "Local" };
        groupsHost.hidden = preview.hidden = ancestors.length === 0;
        groupsHost.replaceChildren(...["active-inherited", "disabled-inherited", "explicitly-reenabled", "local"].map((state) => {
            const group = document.createElement("section"), heading = document.createElement("h5"), list = document.createElement("ul"), entries = grouped[state];
            group.dataset.inheritedRuleGroup = state;
            heading.textContent = `${labels[state]} (${entries.length})`;
            const empty = state === "local" ? "No local rules." : state === "explicitly-reenabled" ? "No explicitly re-enabled inherited rules." : `No ${labels[state]
                .toLowerCase()} rules.`;
            list.replaceChildren(...(entries.length ? entries.map((entry) => Object.assign(document.createElement("li"), { textContent: `${label(entry)} v${entry.rule.version} · ${entry.path} · ${entry.origin.name} v${entry.origin.version}` })) : [Object.assign(document.createElement("li"), { textContent: empty })]));
            group.append(heading, list);
            return group;
        }));
        const effective = [...grouped["active-inherited"], ...grouped["explicitly-reenabled"], ...grouped.local], heading = document.createElement("h4"), list = document.createElement("ul");
        heading.textContent = "Effective-rule preview";
        list.replaceChildren(...(effective.length ? effective.map((entry) => Object.assign(document.createElement("li"), { textContent: `${entry.path} · ${label(entry)} v${entry.rule.version} · ${entry.state === "local" ? "local" : `inherited from ${entry.origin.name} v${entry.origin.version}`}` })) : [Object.assign(document.createElement("li"), {
                textContent: "No effective rules."
            })]));
        preview.replaceChildren(heading, list);
    }
    #refreshSaveState(projection) {
        const p = this.#ports, schema = p.active(), presented = projection ?? p.editorDraft(schema), candidate = p.library.schemas.find(({ id }) => id === presented.id) ?? presented, rename = inspectSchemaRename(candidate, p.library.schemas, presented.name), has = Object.keys(presented.document.properties ?? {}).length > 0, inheritance = schemaInheritanceError(presented, p.library.schemas) ?? schemaInheritanceConflict(presented, p.library.schemas), assistance = p.root.querySelector("#schema-editor-name-assistance"), save = p.root.querySelector("#save-schema"), reason = p.root.querySelector("#save-schema-reason");
        if (assistance)
            assistance.textContent = rename.assistance;
        if (save)
            save.disabled = !rename.ready || !has || Boolean(inheritance);
        if (reason)
            reason.textContent = !rename.ready ? rename.assistance : !has ? "Add at least one property" : inheritance ?? "Ready to save";
    }
    #closeRevisionDialog() { const dialog = this.#ports.root.querySelector("#schema-revision-review"); dialog?.close(); if (dialog)
        dialog.hidden = true; }
    #closeDialog(selector) { const dialog = this.#ports.root.querySelector(selector); dialog?.close(); if (dialog)
        dialog.hidden = true; }
}
//# sourceMappingURL=library-editor.js.map