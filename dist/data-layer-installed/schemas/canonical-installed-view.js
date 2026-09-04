import { applyCanonicalCommand, canonicalPropertyPath, compactSchemaProjection, activateFocusedOwnershipSection, clearSchemaTableOverlay, focusedCanonicalOwnershipInput, focusedDefinitionFieldLabels, focusedOwnershipActionTarget, focusedOwnershipState, focusedPropertyLayerSequence, focusedPropertyLifecycleOperation, focusedPropertyPatch, focusedPropertyProvenanceSummary, focusedSectionOwnershipActions, focusedSourceState, focusedStagedChanges, gateFocusedOwnershipSection, mountSchemaTableOverlay, renderCanonicalFocusedSection, renderFocusedPropertyMenu, } from "../../utilities/data-layer/schemas.js";
import { SchemaCanonicalContextTableView } from "./canonical-context-table-view.js";
import { createCanonicalSavedAdapter } from "./canonical-saved-adapter.js";
import { openCanonicalRuleEditor } from "./canonical-rule-editor-view.js";
/** Owns the installed DOM projection and saved-schema adapter for canonical editing. */
export class SchemaCanonicalInstalledView {
    #ports;
    #contextTable;
    constructor(ports) { this.#ports = ports; this.#contextTable = new SchemaCanonicalContextTableView(ports, (adapter) => this.projection(adapter)); }
    projection(adapter, canonical = adapter.load()) {
        return adapter.projection?.(canonical) ?? compactSchemaProjection(canonical, { id: canonical.contributorId, name: canonical.contributorName, version: canonical.revision });
    }
    facet(canonical, node) {
        const allowed = node.allowedValues.length ? node.allowedValues.map(({ value }) => String(value)).join(", ") : "none";
        return `Canonical facets · type ${node.type} · presence ${node.presence.mode} · allowed values ${allowed} · revision ${canonical.revision}`;
    }
    renderContext() { this.#contextTable.renderContext(); }
    clearContext() { this.#contextTable.clearContext(); }
    ownContext(dispose) { this.#contextTable.ownContext(dispose); }
    removeTable() { this.#contextTable.removeTable(); }
    render() { this.#contextTable.render(); }
    open(adapter) {
        const p = this.#ports, c = p.controller;
        if (!adapter.key.startsWith("saved:")) {
            p.setActiveSchemaId(undefined);
            c.setSavedDocument(undefined);
            p.setDraft(undefined);
        }
        c.editor = adapter;
        c.reopenSelection = adapter.key;
        c.setCommandFeedback(undefined);
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
            c.setSavedDocument(undefined);
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
        this.open(createCanonicalSavedAdapter(this.#ports, schema, () => this.close()));
    }
    openRule(path, trigger) {
        return openCanonicalRuleEditor(this.#ports, path, trigger);
    }
    openPropertyActions(path, trigger) {
        const p = this.#ports, c = p.controller, adapter = c.editor, model = adapter?.load(), original = model && Object.values(model.nodes).find((candidate) => canonicalPropertyPath(model, candidate.id) === path || candidate.id === path), owner = p.elements.editor, document = p.elements.document;
        if (!adapter || !model || !original || !owner || !document)
            return false;
        this.#contextTable.showProperty(original.id);
        p.setSelectedPath(path.replace(/^\//, "").replaceAll("/", "."));
        if (!trigger) {
            this.renderContext();
            return true;
        }
        let working = structuredClone(original), activeSection, feedbackText = "", stagedOwnershipAction = "";
        const ownership = focusedOwnershipState(focusedCanonicalOwnershipInput(original));
        let ownershipSession = ownership.session;
        const removedRuleIds = new Set(), removedValueIds = new Set(), stagedOperations = [], state = focusedSourceState(original), sectionOwnership = focusedSectionOwnershipActions(ownership.input), close = () => { clearSchemaTableOverlay(owner); trigger.focus({ preventScroll: true }); }, restoreFocus = (label) => queueMicrotask(() => Array.from(owner.ownerDocument.querySelectorAll('[data-schema-row-overlay="true"] button')).find(({ textContent, ariaLabel }) => textContent?.trim() === label || ariaLabel === label)?.focus({ preventScroll: true }));
        const menu = () => renderFocusedPropertyMenu({ dom: document, path, provenance: focusedPropertyProvenanceSummary(original.provenance), close, sectionSummary: (name) => name === "rules" ? `${working.rules.length} rules` : name === "structure" ? "Stable property identity" : "Effective definition facets", selectSection: (name) => showSection(name) }), mount = (layers, focusLabel) => {
            const sequence = focusedPropertyLayerSequence(activeSection, ...(layers.length === 3 ? ["review"] : []));
            layers.forEach((layer, index) => { layer.dataset.compactFocusedLayer = sequence[index] ?? "review"; });
            mountSchemaTableOverlay(owner, trigger, path, layers, close);
            if (focusLabel)
                restoreFocus(focusLabel);
        }, showMenu = (focusLabel) => { activeSection = undefined; mount([menu()], focusLabel); };
        const sectionContext = (section, render) => ({ dom: document, current: () => model, node: original, getWorking: () => working, setWorking: (value) => {
                if (value)
                    working = value;
            }, activeSection: section, setActiveSection: (value) => {
                if (value === "definition" || value === "rules" || value === "structure")
                    activeSection = value;
            }, removedRuleIds, removedValueIds, id: (kind) => `${kind}:${crypto.randomUUID()}`, stageStructure: (operation) => { stagedOperations.push(operation); render(); }, render, patchFor: (next, source) => focusedPropertyPatch(next, source, removedRuleIds, removedValueIds), command: (command) => applyCanonicalCommand(model, command), select: () => { }, feedback: (message) => { feedbackText = message; } });
        const showReview = (section, child, focusLabel) => {
            const review = document.createElement("section"), heading = document.createElement("h3"), summary = document.createElement("p"), changes = document.createElement("ul"), actions = document.createElement("div"), cancel = document.createElement("button"), confirm = document.createElement("button"), patch = focusedPropertyPatch(working, original, removedRuleIds, removedValueIds), staged = focusedStagedChanges(working, original, removedRuleIds, path, removedValueIds);
            review.setAttribute("aria-label", "Review changes");
            review.dataset.focusedReview = "true";
            heading.textContent = "Review changes";
            summary.textContent = `${path} · ${stagedOwnershipAction ? `${stagedOwnershipAction} · ` : ""}one property command and one Undo action · no durable write before confirmation.`;
            for (const change of staged)
                changes.append(Object.assign(document.createElement("li"), { textContent: `${change.label} · ${change.detail}` }));
            for (const operation of stagedOperations)
                changes.append(Object.assign(document.createElement("li"), { textContent: `Structure ${operation.kind} · ${"propertyId" in operation ? operation.propertyId : original.id}` }));
            cancel.type = "button";
            cancel.textContent = "Cancel review";
            cancel.addEventListener("click", () => showSection(section, "Review changes"));
            confirm.type = "button";
            confirm.textContent = "Confirm changes";
            confirm.addEventListener("click", () => {
                void c.dispatchCommand({ kind: "set", baseRevision: adapter.load().revision, propertyId: original.id, patch, operations: stagedOperations }).then((result) => {
                    if (result)
                        close();
                });
            });
            actions.append(cancel, confirm);
            review.append(heading, summary, changes, actions);
            review.addEventListener("keydown", (event) => {
                if (event.key !== "Escape")
                    return;
                event.preventDefault();
                event.stopPropagation();
                showSection(section, "Review changes");
            });
            activeSection = section;
            mount([menu(), child, review], focusLabel ?? "Confirm changes");
        };
        const buildSection = (section) => {
            const host = document.createElement("section"), heading = document.createElement("h3"), identity = document.createElement("p"), body = document.createElement("section"), group = document.createElement("div"), status = document.createElement("p"), actions = document.createElement("div"), cancel = document.createElement("button"), review = document.createElement("button"), render = () => showSection(section);
            host.dataset.focusedPropertyEditor = "true";
            host.dataset.schemaOverlayLayer = "child";
            host.dataset.focusedSection = section;
            host.setAttribute("aria-label", `${path} focused ${section} section`);
            heading.textContent = section === "definition" ? "Definition" : section === "rules" ? "Rules" : "Structure";
            identity.textContent = `${path} · stable identity ${original.id} · ${focusedPropertyProvenanceSummary(original.provenance)}`;
            body.setAttribute("aria-label", `Focused ${heading.textContent} section`);
            renderCanonicalFocusedSection(body, sectionContext(section, render));
            if (section === "definition")
                body.dataset.definitionFields = focusedDefinitionFieldLabels.join("|");
            const target = focusedOwnershipActionTarget(section === "structure" ? "Structure" : section === "rules" ? "Rules" : "Definition", section === "structure" ? "property" : section === "rules" ? "rule" : "facet", section === "structure" ? original.id : section === "rules" ? `${original.id}:rules` : `${original.id}:definition`), visible = section === "rules" ? [] : sectionOwnership[section];
            if (visible.length) {
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
                    control.addEventListener("click", () => {
                        feedbackText = `${action} targets ${target.label}.`;
                        ownershipSession = activateFocusedOwnershipSection(ownershipSession, section, action);
                        if (action === "Override here" || action === "Replace here")
                            stagedOwnershipAction = action;
                        const operation = focusedPropertyLifecycleOperation(action, original.id);
                        if (operation) {
                            stagedOwnershipAction = action;
                            if (!stagedOperations.some((candidate) => candidate.kind === "delete" && candidate.propertyId === original.id))
                                stagedOperations.push(operation);
                        }
                        render();
                    });
                    group.append(control);
                }
            }
            gateFocusedOwnershipSection(body, ownershipSession, section);
            status.setAttribute("role", "status");
            status.textContent = feedbackText;
            cancel.type = "button";
            cancel.textContent = "Cancel";
            cancel.addEventListener("click", () => showMenu(heading.textContent));
            review.type = "button";
            review.textContent = "Review changes";
            review.addEventListener("click", () => showReview(section, host));
            actions.append(cancel, review);
            host.append(heading, identity, body, group, status, actions);
            host.addEventListener("keydown", (event) => {
                if (event.key !== "Escape")
                    return;
                event.preventDefault();
                event.stopPropagation();
                showMenu(heading.textContent);
            });
            return host;
        };
        function showSection(section, focusLabel) { activeSection = section; mount([menu(), buildSection(section)], focusLabel); }
        showMenu();
        this.renderContext();
        return true;
    }
    dispose() { this.#contextTable.dispose(); }
}
//# sourceMappingURL=canonical-installed-view.js.map