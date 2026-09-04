import {
  canonicalPropertyPath,
  mountCanonicalSchemaEditor,
  type SchemaDefinition,
} from "../../utilities/data-layer/schemas.js";
import type { CompactCanonicalEditorAdapter } from "./contracts.js";
import type { CanonicalInstalledViewPorts } from "./canonical-view-contracts.js";

/** Owns the canonical table mount and its persistence projection. */
export class SchemaCanonicalTableView {
  #host: HTMLElement | undefined;

  constructor(
    private readonly ports: CanonicalInstalledViewPorts,
    private readonly projection: (adapter: CompactCanonicalEditorAdapter) => SchemaDefinition,
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
    const adapter = c.editor;
    if (!adapter || !editor || !document) {
      this.remove();
      return;
    }
    const canonical = adapter.load();
    p.setDraft(this.projection(adapter));
    c.revisionSnapshots.set(canonical.revision, structuredClone(canonical));
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
      conceptSuggestions: p.conceptSuggestions,
      load: adapter.load,
      id: p.createId,
      dispatch: (command) => c.beginCommand(command)?.result
        ?? c.blockedCommand(adapter, command, "The canonical editor is no longer available."),
      ...(adapter.onUndo ? { onUndo: adapter.onUndo } : {}),
      ...(adapter.onRedo ? { onRedo: adapter.onRedo } : {}),
    });
    const controls = Array.from(this.#host.querySelectorAll("button"));
    const table = controls.find(({ textContent }) => textContent?.trim() === "Table");
    const tree = controls.find(({ textContent }) => textContent?.trim() === "Tree");
    table?.addEventListener("click", () => {
      const current = adapter.load();
      c.beginCommand({ kind: "view", baseRevision: current.revision, view: "table" });
      this.#host!.hidden = false;
    }, { once: true });
    tree?.addEventListener("click", () => {
      const current = adapter.load();
      c.beginCommand({ kind: "view", baseRevision: current.revision, view: "tree" });
      this.render();
    }, { once: true });
    this.#host.hidden = adapter.load().view !== "table";
    const unavailable = c.semanticUnresolved();
    editor.setAttribute("aria-busy", String(unavailable));
    if (save && adapter.key.startsWith("saved:")) save.disabled = save.disabled || unavailable;
  }
}
