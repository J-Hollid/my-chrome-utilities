import type { CanonicalSchemaDocument, SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type {
  CompactCanonicalCommand,
  CompactCanonicalCommandResult,
  CompactCanonicalEditorAdapter,
  SchemasInstalledPorts,
} from "./contracts.js";

/** Commands and read-only state needed by the installed canonical view. */
export interface CanonicalInstalledControllerPort {
  readonly editorState: { key:string; label:string; document:CanonicalSchemaDocument; canUndo:boolean; canRedo:boolean;
    actions:readonly { label:string }[]; migration?:{ summary:string; conflicts:readonly { id:string; label:string;
      choices:readonly { id:string; label:string }[] }[] } } | undefined;
  readonly scrollByKey: ReadonlyMap<string, number>;
  readonly savedDocument: CanonicalSchemaDocument | undefined;
  readonly commandFeedback: string | undefined;
  readonly pendingCommand: CompactCanonicalCommand | undefined;
  editorDocument(): CanonicalSchemaDocument | undefined;
  editorKey(): string | undefined;
  hasEditor(): boolean;
  isEditorKey(key:string): boolean;
  runEditorUndo(): void | string | Promise<void | string>;
  runEditorRedo(): void | string | Promise<void | string>;
  runEditorAction(index:number): void;
  renderEditorContext(host:HTMLElement): void;
  resolveMigration(conflictId:string,choiceId:string): void;
  cancelMigration(): void;
  confirmMigration(): Promise<void>;
  projectEditor(fallback:(canonical:CanonicalSchemaDocument)=>SchemaDefinition): SchemaDefinition | undefined;
  setSavedDocument(value: CanonicalSchemaDocument | undefined): void;
  setCommandFeedback(message: string | undefined): void;
  openEditor(adapter: CompactCanonicalEditorAdapter): void;
  closeEditor(): void;
  rememberScroll(key: string, scrollTop: number): void;
  recordRevision(document: CanonicalSchemaDocument): void;
  semanticUnresolved(): boolean;
  beginCommand(command: CompactCanonicalCommand): {
    accepted: boolean;
    result: CompactCanonicalCommandResult;
    completion: Promise<boolean>;
  } | undefined;
  blockedCurrentCommand(command: CompactCanonicalCommand, message: string, fallback:CanonicalSchemaDocument): CompactCanonicalCommandResult;
  dispatchCommand(command: CompactCanonicalCommand): Promise<boolean>;
  propertyAction(
    propertyId: string,
    action: "add-child" | "no-example" | "custom-example" | "documentation" |
      "presence" | "rename" | "move" | "duplicate" | "expected" |
      "reset-expected" | "view" | "remove",
    value?: string,
  ): Promise<boolean>;
  showPendingComparison(): void;
  retryCommand(): void;
  rejectCommand(): void;
  discardCurrentProjectionPersistence(): void;
}

/** Stable ports shared by the canonical controller and installed views. */
export interface CanonicalInstalledViewPorts {
  exportRelationships?:()=>ReturnType<SchemasInstalledPorts["relationshipTree"]>;
  controller: CanonicalInstalledControllerPort;
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
