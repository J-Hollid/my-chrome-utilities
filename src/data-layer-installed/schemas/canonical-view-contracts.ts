import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { CompactCanonicalEditorAdapter, SchemasInstalledPorts } from "./contracts.js";
import type { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";

/** Stable ports shared by the canonical controller and installed views. */
export interface CanonicalInstalledViewPorts {
  controller: SchemaCanonicalEditorController;
  elements: {
    context: HTMLElement | null;
    editor: HTMLElement | null;
    detail: HTMLElement | null;
    detailEmpty: HTMLElement | null;
    save: HTMLButtonElement | null;
    list: HTMLElement | null;
    document: Document | undefined;
  };
  activeSchemaId(): string | undefined;
  setActiveSchemaId(id: string | undefined): void;
  draft(): SchemaDefinition | undefined;
  setDraft(schema: SchemaDefinition | undefined): void;
  schemas(): readonly SchemaDefinition[];
  replaceSchemas(schemas: readonly SchemaDefinition[]): void;
  editorDraft(schema: SchemaDefinition): SchemaDefinition;
  propertyAt(document: SchemaDefinition["document"], path: string): unknown;
  selectedPath(): string;
  setSelectedPath(path: string): void;
  renderDraft(): void;
  renderAll(): void;
  persistLibrary(): void;
  proposeName(schema: SchemaDefinition, name: string): SchemaDefinition;
  createId(kind: string): string;
  conceptSuggestions: SchemasInstalledPorts["canonicalConceptSuggestions"];
  createTableEditor?: SchemasInstalledPorts["createCanonicalTableEditor"];
  settle?(schemaId: string): Promise<void>;
  closeRoute(resolve: (referenceKey: string) => HTMLButtonElement | undefined): void;
  generation(): number;
  isCurrent(generation: number): boolean;
  rulePicker: HTMLDialogElement | null;
  setRulePicker(path: string, trigger?: HTMLButtonElement): void;
  closeRulePicker(): void;
}

export type CanonicalProjection = (adapter: CompactCanonicalEditorAdapter) => SchemaDefinition;
