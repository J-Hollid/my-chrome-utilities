import { compactSchemaProjection, } from "../../utilities/data-layer/schemas.js";
import { SchemaCanonicalContextTableView } from "./canonical-context-table-view.js";
import { createCanonicalSavedAdapter } from "./canonical-saved-adapter.js";
import { openCanonicalRuleEditor } from "./canonical-rule-editor-view.js";
import { openCanonicalPropertyActions } from "./canonical-property-actions-view.js";
/** Owns the installed DOM projection and saved-schema adapter for canonical editing. */
export class SchemaCanonicalInstalledView {
    #ports;
    #contextTable;
    constructor(ports) {
        this.#ports = ports;
        this.#contextTable = new SchemaCanonicalContextTableView(ports, (adapter) => this.projection(adapter));
    }
    projection(adapter, canonical = adapter.load()) {
        return (adapter.projection?.(canonical) ??
            compactSchemaProjection(canonical, {
                id: canonical.contributorId,
                name: canonical.contributorName,
                version: canonical.revision,
            }));
    }
    facet(canonical, node) {
        const allowed = node.allowedValues.length
            ? node.allowedValues.map(({ value }) => String(value)).join(", ")
            : "none";
        return `Canonical facets · type ${node.type} · presence ${node.presence.mode} · allowed values ${allowed} · revision ${canonical.revision}`;
    }
    renderContext() {
        this.#contextTable.renderContext();
    }
    clearContext() {
        this.#contextTable.clearContext();
    }
    ownContext(dispose) {
        this.#contextTable.ownContext(dispose);
    }
    removeTable() {
        this.#contextTable.removeTable();
    }
    render() {
        this.#contextTable.render();
    }
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
        p.closeRoute((key) => {
            const row = Array.from(p.elements.list?.children ?? []).find((candidate) => candidate.dataset.schemaReferenceKey === key);
            return row?.querySelector("button") ?? undefined;
        });
    }
    openSaved(schema) {
        this.open(createCanonicalSavedAdapter(this.#ports, schema, () => this.close()));
    }
    openRule(path, trigger) {
        return openCanonicalRuleEditor(this.#ports, path, trigger);
    }
    openPropertyActions(path, trigger) {
        return openCanonicalPropertyActions(this.#ports, this.#contextTable, path, trigger);
    }
    dispose() {
        this.#contextTable.dispose();
    }
}
//# sourceMappingURL=canonical-installed-view.js.map