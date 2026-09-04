import { applyCanonicalCommand, canonicalPropertyPath, compactSchemaProjection, mountCanonicalSchemaEditor, savedSchemaCanonicalDocument, savedSchemaFromCanonical, updateSchemaWorkingDraft, activateFocusedOwnershipSection, clearSchemaTableOverlay, focusedCanonicalOwnershipInput, focusedDefinitionFieldLabels, focusedOwnershipActionTarget, focusedOwnershipState, focusedPropertyLayerSequence, focusedPropertyLifecycleOperation, focusedPropertyPatch, focusedPropertyProvenanceSummary, focusedSectionOwnershipActions, focusedSourceState, focusedStagedChanges, gateFocusedOwnershipSection, mountSchemaTableOverlay, renderCanonicalFocusedSection, renderCanonicalFocusedRules, renderFocusedPropertyMenu, canonicalRulePropertyPath, } from "../../utilities/data-layer/schemas.js";
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
    openRule(path, trigger) {
        const p = this.#ports, c = p.controller, picker = p.rulePicker, adapter = c.editor, base = adapter?.load(), node = base && Object.values(base.nodes).find((candidate) => canonicalPropertyPath(base, candidate.id) === canonicalRulePropertyPath(path) || candidate.id === path);
        if (!adapter || !base || !node || !picker)
            return false;
        let working = structuredClone(node), feedbackText = "";
        const removedRuleIds = new Set(), properties = () => Object.values(base.nodes).map(({ id, name, type, allowedValues }) => ({ id, name, type, allowedValues: allowedValues.map(({ value }) => value) })), button = (text, run) => { const control = picker.ownerDocument.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
        const render = () => {
            const document = picker.ownerDocument, focused = document.createElement("section"), heading = document.createElement("h3"), identity = document.createElement("p"), rules = document.createElement("section"), actions = document.createElement("section"), feedback = document.createElement("output");
            focused.dataset.focusedPropertyEditor = "true";
            focused.dataset.focusedSection = "rules";
            focused.setAttribute("aria-label", `${path} focused Rules section`);
            heading.textContent = "Rules";
            identity.textContent = `${path} · stable identity ${node.id} · Local value and effective result remain staged until Review changes.`;
            rules.setAttribute("aria-label", "Compact staged rule editor");
            actions.setAttribute("aria-label", "Property actions");
            feedback.setAttribute("role", "status");
            feedback.textContent = feedbackText;
            renderCanonicalFocusedRules(rules, { dom: document, getWorking: () => working, properties, removedRuleIds, invariant: working.enforcement === "invariant", id: (kind) => `${kind}:${crypto.randomUUID()}`, render, feedback: (message) => { feedbackText = message; } });
            const cancel = button("Cancel", p.closeRulePicker), review = button("Review changes", () => { const panel = document.createElement("section"), summary = document.createElement("p"), reviewActions = document.createElement("section"), stagedRules = working.rules.filter(({ id }) => !removedRuleIds.has(id)); panel.setAttribute("aria-label", "Review changes"); summary.textContent = `Review changes · ${path} · ${stagedRules.length} staged rules · one property command and one Undo action.`; reviewActions.setAttribute("aria-label", "Property review actions"); reviewActions.append(button("Cancel review", render), button("Confirm changes", () => { void (async () => { const current = adapter.load(), result = await c.dispatchCommand({ kind: "set", baseRevision: current.revision, propertyId: node.id, patch: { rules: structuredClone(stagedRules) } }); if (result)
                p.closeRulePicker(); })(); })); panel.append(summary, reviewActions); picker.replaceChildren(panel); });
            actions.append(feedback, cancel, review);
            focused.append(heading, identity, rules, actions);
            picker.replaceChildren(focused);
        };
        p.setRulePicker(path, trigger);
        render();
        picker.showModal();
        picker.querySelector('[aria-label="Compact staged rule editor"] > button')?.focus({ preventScroll: true });
        return true;
    }
    openPropertyActions(path, trigger) {
        const p = this.#ports, c = p.controller, adapter = c.editor, model = adapter?.load(), original = model && Object.values(model.nodes).find((candidate) => canonicalPropertyPath(model, candidate.id) === path || candidate.id === path), owner = p.elements.editor, document = p.elements.document;
        if (!adapter || !model || !original || !owner || !document)
            return false;
        c.propertyMenuId = original.id;
        p.setSelectedPath(path.replace(/^\//, "").replaceAll("/", "."));
        if (!trigger) {
            this.renderContext();
            return true;
        }
        let working = structuredClone(original), activeSection, feedbackText = "", stagedOwnershipAction = "";
        const ownership = focusedOwnershipState(focusedCanonicalOwnershipInput(original));
        let ownershipSession = ownership.session;
        const removedRuleIds = new Set(), removedValueIds = new Set(), stagedOperations = [], state = focusedSourceState(original), sectionOwnership = focusedSectionOwnershipActions(ownership.input), close = () => { clearSchemaTableOverlay(owner); trigger.focus({ preventScroll: true }); }, restoreFocus = (label) => queueMicrotask(() => Array.from(owner.ownerDocument.querySelectorAll('[data-schema-row-overlay="true"] button')).find(({ textContent, ariaLabel }) => textContent?.trim() === label || ariaLabel === label)?.focus({ preventScroll: true }));
        const menu = () => renderFocusedPropertyMenu({ dom: document, path, provenance: focusedPropertyProvenanceSummary(original.provenance), close, sectionSummary: (name) => name === "rules" ? `${working.rules.length} rules` : name === "structure" ? "Stable property identity" : "Effective definition facets", selectSection: (name) => showSection(name) }), mount = (layers, focusLabel) => { const sequence = focusedPropertyLayerSequence(activeSection, ...(layers.length === 3 ? ["review"] : [])); layers.forEach((layer, index) => { layer.dataset.compactFocusedLayer = sequence[index] ?? "review"; }); mountSchemaTableOverlay(owner, trigger, path, layers, close); if (focusLabel)
            restoreFocus(focusLabel); }, showMenu = (focusLabel) => { activeSection = undefined; mount([menu()], focusLabel); };
        const sectionContext = (section, render) => ({ dom: document, current: () => model, node: original, getWorking: () => working, setWorking: (value) => { if (value)
                working = value; }, activeSection: section, setActiveSection: (value) => { if (value === "definition" || value === "rules" || value === "structure")
                activeSection = value; }, removedRuleIds, removedValueIds, id: (kind) => `${kind}:${crypto.randomUUID()}`, stageStructure: (operation) => { stagedOperations.push(operation); render(); }, render, patchFor: (next, source) => focusedPropertyPatch(next, source, removedRuleIds, removedValueIds), command: (command) => applyCanonicalCommand(model, command), select: () => { }, feedback: (message) => { feedbackText = message; } });
        const showReview = (section, child, focusLabel) => { const review = document.createElement("section"), heading = document.createElement("h3"), summary = document.createElement("p"), changes = document.createElement("ul"), actions = document.createElement("div"), cancel = document.createElement("button"), confirm = document.createElement("button"), patch = focusedPropertyPatch(working, original, removedRuleIds, removedValueIds), staged = focusedStagedChanges(working, original, removedRuleIds, path, removedValueIds); review.setAttribute("aria-label", "Review changes"); review.dataset.focusedReview = "true"; heading.textContent = "Review changes"; summary.textContent = `${path} · ${stagedOwnershipAction ? `${stagedOwnershipAction} · ` : ""}one property command and one Undo action · no durable write before confirmation.`; for (const change of staged)
            changes.append(Object.assign(document.createElement("li"), { textContent: `${change.label} · ${change.detail}` })); for (const operation of stagedOperations)
            changes.append(Object.assign(document.createElement("li"), { textContent: `Structure ${operation.kind} · ${"propertyId" in operation ? operation.propertyId : original.id}` })); cancel.type = "button"; cancel.textContent = "Cancel review"; cancel.addEventListener("click", () => showSection(section, "Review changes")); confirm.type = "button"; confirm.textContent = "Confirm changes"; confirm.addEventListener("click", () => { void c.dispatchCommand({ kind: "set", baseRevision: adapter.load().revision, propertyId: original.id, patch, operations: stagedOperations }).then((result) => { if (result)
            close(); }); }); actions.append(cancel, confirm); review.append(heading, summary, changes, actions); review.addEventListener("keydown", (event) => { if (event.key !== "Escape")
            return; event.preventDefault(); event.stopPropagation(); showSection(section, "Review changes"); }); activeSection = section; mount([menu(), child, review], focusLabel ?? "Confirm changes"); };
        const buildSection = (section) => { const host = document.createElement("section"), heading = document.createElement("h3"), identity = document.createElement("p"), body = document.createElement("section"), group = document.createElement("div"), status = document.createElement("p"), actions = document.createElement("div"), cancel = document.createElement("button"), review = document.createElement("button"), render = () => showSection(section); host.dataset.focusedPropertyEditor = "true"; host.dataset.schemaOverlayLayer = "child"; host.dataset.focusedSection = section; host.setAttribute("aria-label", `${path} focused ${section} section`); heading.textContent = section === "definition" ? "Definition" : section === "rules" ? "Rules" : "Structure"; identity.textContent = `${path} · stable identity ${original.id} · ${focusedPropertyProvenanceSummary(original.provenance)}`; body.setAttribute("aria-label", `Focused ${heading.textContent} section`); renderCanonicalFocusedSection(body, sectionContext(section, render)); if (section === "definition")
            body.dataset.definitionFields = focusedDefinitionFieldLabels.join("|"); const target = focusedOwnershipActionTarget(section === "structure" ? "Structure" : section === "rules" ? "Rules" : "Definition", section === "structure" ? "property" : section === "rules" ? "rule" : "facet", section === "structure" ? original.id : section === "rules" ? `${original.id}:rules` : `${original.id}:definition`), visible = section === "rules" ? [] : sectionOwnership[section]; if (visible.length) {
            group.dataset.sectionOwnershipActions = "true";
            group.dataset.ownershipState = state;
            group.dataset.ownershipTarget = target.label;
            for (const action of visible) {
                const control = document.createElement("button");
                control.type = "button";
                control.textContent = action;
                control.dataset.ownershipAction = action;
                control.dataset.ownershipTarget = target.label;
                control.setAttribute("aria-label", `${action} · ${target.label}`);
                control.addEventListener("click", () => { feedbackText = `${action} targets ${target.label}.`; ownershipSession = activateFocusedOwnershipSection(ownershipSession, section, action); if (action === "Override here" || action === "Replace here")
                    stagedOwnershipAction = action; const operation = focusedPropertyLifecycleOperation(action, original.id); if (operation) {
                    stagedOwnershipAction = action;
                    if (!stagedOperations.some((candidate) => candidate.kind === "delete" && candidate.propertyId === original.id))
                        stagedOperations.push(operation);
                } render(); });
                group.append(control);
            }
        } gateFocusedOwnershipSection(body, ownershipSession, section); status.setAttribute("role", "status"); status.textContent = feedbackText; cancel.type = "button"; cancel.textContent = "Cancel"; cancel.addEventListener("click", () => showMenu(heading.textContent)); review.type = "button"; review.textContent = "Review changes"; review.addEventListener("click", () => showReview(section, host)); actions.append(cancel, review); host.append(heading, identity, body, group, status, actions); host.addEventListener("keydown", (event) => { if (event.key !== "Escape")
            return; event.preventDefault(); event.stopPropagation(); showMenu(heading.textContent); }); return host; };
        function showSection(section, focusLabel) { activeSection = section; mount([menu(), buildSection(section)], focusLabel); }
        showMenu();
        this.renderContext();
        return true;
    }
}
//# sourceMappingURL=canonical-installed-view.js.map