import {
  canonicalPropertyPath,
  mountCanonicalSchemaEditor,
  type CanonicalSchemaDocument,
  type SchemaDefinition,
} from "../../utilities/data-layer/schemas.js";
import type { CanonicalInstalledViewPorts } from "./canonical-view-contracts.js";
import {installedCanonicalExportSource} from "./context-export/canonical-control.js";

/** Owns the canonical table mount and its persistence projection. */
export class SchemaCanonicalTableView {
  #host: HTMLElement | undefined;

  constructor(
    private readonly ports: CanonicalInstalledViewPorts,
    private readonly projection: (canonical: CanonicalSchemaDocument) => SchemaDefinition,
  ) {}

  remove(): void {
    this.#host?.replaceChildren();
    this.#host?.remove();
    this.#host = undefined;
  }

  render(): void {
    const p = this.ports;
    const c = p.controller;
    const { editor, detail, document, save } = p.elements;
    const editorState = c.editorState;
    if (!editorState || !editor || !document) {
      this.remove();
      return;
    }
    const canonical = editorState.document;
    p.setDraft(c.projectEditor(this.projection));
    c.recordRevision(canonical);
    const selected = canonical.selectedPropertyId
      ? canonical.nodes[canonical.selectedPropertyId]
      : undefined;
    const activeId = p.activeSchemaId();
    const active = activeId ? p.schemas().find(({ id }) => id === activeId) : undefined;
    const presented = active ? p.editorDraft(active) : p.draft();
    const exists = presented && p.propertyAt(presented.document, p.selectedPath());
    if (selected && !exists) {
      p.setSelectedPath(canonicalPropertyPath(canonical, selected.id).slice(1).replaceAll("/", "."));
    }
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
    if (!this.#host?.isConnected) {
      this.#host = document.createElement("section");
      this.#host.id = "compact-canonical-table-editor";
      editor.append(this.#host);
    }
    this.#host.replaceChildren();
    const create = p.createTableEditor ?? mountCanonicalSchemaEditor;
    create({
      host: this.#host,
      surface: "Side panel",
      contextExport:()=>installedCanonicalExportSource(p),
      conceptSuggestions: p.conceptSuggestions,
      load: () => c.editorDocument() ?? canonical,
      id: p.createId,
      dispatch: (command) => c.beginCommand(command)?.result
        ?? c.blockedCurrentCommand(command, "The canonical editor is no longer available.",canonical),
      ...(editorState.canUndo ? { onUndo: () => c.runEditorUndo() } : {}),
      ...(editorState.canRedo ? { onRedo: () => c.runEditorRedo() } : {}),
    });
    const controls = Array.from(this.#host.querySelectorAll("button"));
    const table = controls.find(({ textContent }) => textContent?.trim() === "Table");
    const tree = controls.find(({ textContent }) => textContent?.trim() === "Tree");
    table?.addEventListener("click", () => {
      const current = c.editorDocument();if(!current)return;
      c.beginCommand({ kind: "view", baseRevision: current.revision, view: "table" });
      this.#host!.hidden = false;
    }, { once: true });
    tree?.addEventListener("click", () => {
      const current = c.editorDocument();if(!current)return;
      c.beginCommand({ kind: "view", baseRevision: current.revision, view: "tree" });
      this.render();
    }, { once: true });
    this.#host.hidden = c.editorDocument()?.view !== "table";
    const unavailable = c.semanticUnresolved();
    editor.setAttribute("aria-busy", String(unavailable));
    if (save && editorState.key.startsWith("saved:")) save.disabled = save.disabled || unavailable;
  }
}
