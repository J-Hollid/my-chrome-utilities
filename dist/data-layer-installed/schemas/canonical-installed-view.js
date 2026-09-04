import { applyCanonicalCommand, canonicalPropertyPath, compactSchemaProjection, mountCanonicalSchemaEditor, savedSchemaCanonicalDocument, savedSchemaFromCanonical, updateSchemaWorkingDraft, } from "../../utilities/data-layer/schemas.js";
/** Owns the installed DOM projection and saved-schema adapter for canonical editing. */
export class SchemaCanonicalInstalledView {
    #ports;
    constructor(ports) { this.#ports = ports; }
    projection(adapter, canonical = adapter.load()) {
        return adapter.projection?.(canonical) ?? compactSchemaProjection(canonical, { id: canonical.contributorId, name: canonical.contributorName, version: canonical.revision });
    }
    facet(canonical, node) {
        const allowed = node.allowedValues.length ? node.allowedValues.map(({ value }) => String(value)).join(", ") : "none";
        return `Canonical facets · type ${node.type} · presence ${node.presence.mode} · allowed values ${allowed} · revision ${canonical.revision}`;
    }
    renderContext() {
        const p = this.#ports, c = p.controller;
        c.renderContext({ host: p.elements.context, document: p.elements.document, generation: p.generation(), isCurrent: p.isCurrent,
            dispatch: (command) => c.dispatchCommand(command), propertyAction: (id, action, value) => c.propertyAction(id, action, value), retry: () => c.retryCommand(), reject: () => c.rejectCommand(), rerender: () => this.renderContext() });
    }
    removeTable() { const c = this.#ports.controller; c.tableHost?.replaceChildren(); c.tableHost?.remove(); c.tableHost = undefined; c.tableEditor = undefined; c.tableKey = undefined; }
    render() {
        const p = this.#ports, c = p.controller, { editor, detail, document, save } = p.elements;
        this.renderContext();
        const adapter = c.editor;
        if (!adapter || !editor || !document) {
            this.removeTable();
            return;
        }
        const canonical = adapter.load();
        p.setDraft(this.projection(adapter, canonical));
        c.revisionSnapshots.set(canonical.revision, structuredClone(canonical));
        const selected = canonical.selectedPropertyId ? canonical.nodes[canonical.selectedPropertyId] : undefined, presented = p.activeSchemaId() ? p.editorDraft(p.schemas().find(({ id }) => id === p.activeSchemaId())) : p.draft(), exists = presented && p.propertyAt(presented.document, p.selectedPath());
        if (selected && !exists)
            p.setSelectedPath(canonicalPropertyPath(canonical, selected.id).slice(1).replaceAll("/", "."));
        editor.hidden = false;
        editor.dataset.schemaPresentation = "compact-panel";
        editor.dataset.canonicalRevision = String(canonical.revision);
        editor.dataset.canonicalSchemaId = canonical.id;
        editor.setAttribute("aria-label", "Side panel canonical schema editor");
        if (detail) {
            detail.hidden = false;
            detail.setAttribute("aria-label", "Side panel schema editor region");
        }
        p.renderDraft();
        if (!c.tableHost?.isConnected) {
            c.tableHost = document.createElement("section");
            c.tableHost.id = "compact-canonical-table-editor";
            editor.append(c.tableHost);
            c.tableEditor = undefined;
            c.tableKey = undefined;
        }
        c.tableHost.replaceChildren();
        c.tableKey = adapter.key;
        const create = p.createTableEditor ?? mountCanonicalSchemaEditor;
        c.tableEditor = create({ host: c.tableHost, surface: "Side panel", conceptSuggestions: p.conceptSuggestions, load: adapter.load, id: p.createId,
            dispatch: (command) => c.beginCommand(command)?.result ?? c.blockedCommand(adapter, command, "The canonical editor is no longer available."), ...(adapter.onUndo ? { onUndo: adapter.onUndo } : {}), ...(adapter.onRedo ? { onRedo: adapter.onRedo } : {}) });
        const controls = Array.from(c.tableHost.querySelectorAll("button")), table = controls.find(({ textContent }) => textContent?.trim() === "Table"), tree = controls.find(({ textContent }) => textContent?.trim() === "Tree");
        table?.addEventListener("click", () => { const current = adapter.load(); c.beginCommand({ kind: "view", baseRevision: current.revision, view: "table" }); c.tableHost.hidden = false; }, { once: true });
        tree?.addEventListener("click", () => { const current = adapter.load(); c.beginCommand({ kind: "view", baseRevision: current.revision, view: "tree" }); this.render(); }, { once: true });
        c.tableHost.hidden = adapter.load().view !== "table";
        const unavailable = c.semanticUnresolved();
        editor.setAttribute("aria-busy", String(unavailable));
        if (save && adapter.key.startsWith("saved:"))
            save.disabled = save.disabled || unavailable;
    }
    open(adapter) {
        const p = this.#ports, c = p.controller;
        if (!adapter.key.startsWith("saved:")) {
            p.setActiveSchemaId(undefined);
            c.savedDocument = undefined;
            p.setDraft(undefined);
        }
        c.editor = adapter;
        c.reopenSelection = adapter.key;
        c.commandFeedback = undefined;
        c.revisionSnapshots.clear();
        c.revisionSnapshots.set(adapter.load().revision, structuredClone(adapter.load()));
        if (p.elements.detail)
            p.elements.detail.scrollTop = c.scrollByKey.get(adapter.key) ?? 0;
        this.render();
    }
    close(clearSelection = true) {
        const p = this.#ports, c = p.controller, detail = p.elements.detail;
        if (c.editor && detail)
            c.scrollByKey.set(c.editor.key, detail.scrollTop);
        c.discardProjectionPersistence(c.editor);
        c.editor = undefined;
        if (clearSelection) {
            p.setActiveSchemaId(undefined);
            p.setDraft(undefined);
            c.savedDocument = undefined;
        }
        this.removeTable();
        if (p.elements.context)
            p.elements.context.hidden = true;
        if (p.elements.editor)
            p.elements.editor.hidden = true;
        if (detail)
            detail.hidden = false;
        if (p.elements.detailEmpty)
            p.elements.detailEmpty.hidden = false;
        p.renderAll();
        p.closeRoute((key) => { const row = Array.from(p.elements.list?.children ?? []).find((candidate) => candidate.dataset.schemaReferenceKey === key); return row?.querySelector("button") ?? undefined; });
    }
    openSaved(schema) {
        const p = this.#ports, c = p.controller;
        p.setDraft(p.editorDraft(schema));
        c.savedDocument = savedSchemaCanonicalDocument(p.draft(), p.createId);
        const schemaId = schema.id;
        const project = (canonical) => { const stored = p.schemas().find(({ id }) => id === schemaId); if (!stored)
            return compactSchemaProjection(canonical, { id: canonical.contributorId, name: canonical.contributorName, version: canonical.revision }); const outer = p.editorDraft(stored), result = savedSchemaFromCanonical({ ...outer, name: canonical.contributorName }, canonical), { canonicalSchema: _canonical, ...projection } = result; return projection; };
        const persistCanonical = (canonical, change) => { const stored = p.schemas().find(({ id }) => id === schemaId); if (!stored)
            throw new Error("The saved schema is unavailable."); const source = p.draft()?.id === schemaId ? p.draft() : p.editorDraft(stored), projection = savedSchemaFromCanonical(source, canonical), updated = updateSchemaWorkingDraft(p.proposeName(stored, projection.name), { document: projection.document, assignments: projection.assignments, attachedRules: projection.attachedRules, parentSchemaId: projection.parentSchemaId, inheritedRuleOverrides: projection.inheritedRuleOverrides, documentation: projection.documentation, canonicalSchema: canonical }, change); p.replaceSchemas(p.schemas().map((candidate) => candidate.id === schemaId ? updated : candidate)); c.savedDocument = canonical; p.persistLibrary(); };
        const persistProjection = (projection, change) => { const stored = p.schemas().find(({ id }) => id === schemaId); if (!stored)
            throw new Error("The saved schema is unavailable."); const canonical = c.savedDocument, updated = updateSchemaWorkingDraft(p.proposeName(stored, projection.name), { document: projection.document, assignments: projection.assignments, attachedRules: projection.attachedRules, parentSchemaId: projection.parentSchemaId, inheritedRuleOverrides: projection.inheritedRuleOverrides, documentation: projection.documentation, ...(canonical ? { canonicalSchema: { ...canonical, contributorName: projection.name } } : {}) }, change === "schema name" ? undefined : change); if (JSON.stringify(updated) === JSON.stringify(stored))
            return false; p.replaceSchemas(p.schemas().map((candidate) => candidate.id === schemaId ? updated : candidate)); if (canonical)
            c.savedDocument = { ...canonical, contributorName: projection.name }; p.persistLibrary(); return true; };
        const adapter = { key: `saved:${schema.id}`, label: `${schema.name} · Saved schema working draft`, load: () => c.savedDocument, projection: project,
            dispatch: (command) => { const result = applyCanonicalCommand(c.savedDocument, command); if (result.status === "applied" || result.status === "rebased") {
                if (command.kind === "select" || command.kind === "view")
                    c.savedDocument = result.document;
                else
                    persistCanonical(result.document, `${command.kind} canonical property`);
            } return result; },
            stageProjectionCommand: (command) => { const result = applyCanonicalCommand(c.savedDocument, command); if (result.status === "applied" || result.status === "rebased")
                c.savedDocument = result.document; return result; }, restoreStagedProjection: (canonical) => { c.savedDocument = structuredClone(canonical); }, persistProjection,
            settle: () => p.settle?.(schema.id) ?? Promise.resolve(), settles: (command) => command.kind !== "select" && command.kind !== "view", settlementTarget: "durable Saved Schema Library", actions: [{ label: "Publish schema", run: () => p.elements.save?.click() }, { label: "Close editor", run: () => this.close() }] };
        this.open(adapter);
    }
}
//# sourceMappingURL=canonical-installed-view.js.map