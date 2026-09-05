import { applyCanonicalCommand, canonicalPropertyPath, compactSchemaProjection, activateFocusedOwnershipSection,
     clearSchemaTableOverlay, focusedCanonicalOwnershipInput, focusedDefinitionFieldLabels, focusedOwnershipActionTarget,
     focusedOwnershipState, focusedPropertyLayerSequence, focusedPropertyLifecycleOperation, focusedPropertyPatch,
     focusedPropertyProvenanceSummary, focusedSectionOwnershipActions, focusedSourceState, focusedStagedChanges,
     gateFocusedOwnershipSection, mountSchemaTableOverlay, renderCanonicalFocusedSection, renderFocusedPropertyMenu,
     type CanonicalSchemaDocument, type SchemaDefinition, } from "../../utilities/data-layer/schemas.js";
import type { CompactCanonicalCommand, CompactCanonicalEditorAdapter, } from "./contracts.js";
import { SchemaCanonicalContextTableView } from "./canonical-context-table-view.js";
import { createCanonicalSavedAdapter } from "./canonical-saved-adapter.js";
import { openCanonicalRuleEditor } from "./canonical-rule-editor-view.js";
import { openCanonicalPropertyActions } from "./canonical-property-actions-view.js";
import type { CanonicalInstalledViewPorts } from "./canonical-view-contracts.js";
export type { CanonicalInstalledViewPorts } from "./canonical-view-contracts.js";
/** Owns the installed DOM projection and saved-schema adapter for canonical editing. */
export class SchemaCanonicalInstalledView {
    readonly #ports: CanonicalInstalledViewPorts;
    readonly #contextTable: SchemaCanonicalContextTableView;
    constructor(ports: CanonicalInstalledViewPorts) {
        this.#ports = ports;
        this.#contextTable = new SchemaCanonicalContextTableView(ports, (canonical) => this.projection(canonical));
    }
    projection(canonical: CanonicalSchemaDocument): SchemaDefinition {
        return compactSchemaProjection(canonical, {
                id: canonical.contributorId,
                name: canonical.contributorName,
                version: canonical.revision,
            });
    }
    facet(canonical: CanonicalSchemaDocument, node: CanonicalSchemaDocument["nodes"][string]): string {
        const allowed = node.allowedValues.length
            ? node.allowedValues.map(({ value }) => String(value)).join(", ")
            : "none";
        return `Canonical facets · type ${node.type} · presence ${node.presence.mode} · allowed values ${allowed} · revision ${canonical.revision}`;
    }
    renderContext(): void {
        this.#contextTable.renderContext();
    }
    clearContext(): void {
        this.#contextTable.clearContext();
    }
    ownContext(dispose: () => void): void {
        this.#contextTable.ownContext(dispose);
    }
    removeTable(): void {
        this.#contextTable.removeTable();
    }
    render(): void {
        this.#contextTable.render();
    }
    open(adapter: CompactCanonicalEditorAdapter): void {
        const p = this.#ports, c = p.controller;
        if (!adapter.key.startsWith("saved:")) {
            p.setActiveSchemaId(undefined);
            c.setSavedDocument(undefined);
            p.setDraft(undefined);
        }
        c.openEditor(adapter);
        c.setCommandFeedback(undefined);
        if (p.elements.detail)
            p.elements.detail.scrollTop = c.scrollByKey.get(adapter.key) ?? 0;
        this.render();
    }
    close(clearSelection = true): void {
        const p = this.#ports, c = p.controller, detail = p.elements.detail;
        const editorKey = c.editorKey();
        if (editorKey && detail)
            c.rememberScroll(editorKey, detail.scrollTop);
        c.discardCurrentProjectionPersistence();
        c.closeEditor();
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
            const row = Array.from(p.elements.list?.children ?? []).find((candidate) => (candidate as HTMLElement).dataset.schemaReferenceKey === key) as HTMLElement | undefined;
            return row?.querySelector<HTMLButtonElement>("button") ?? undefined;
        });
    }
    openSaved(schema: SchemaDefinition): void {
        this.open(createCanonicalSavedAdapter(this.#ports, schema, () => this.close()));
    }
    openRule(path: string, trigger?: HTMLButtonElement): boolean {
        return openCanonicalRuleEditor(this.#ports, path, trigger);
    }
    openPropertyActions(path: string, trigger?: HTMLButtonElement): boolean {
        return openCanonicalPropertyActions(this.#ports, this.#contextTable, path, trigger);
    }
    dispose(): void {
        this.#contextTable.dispose();
    }
}
