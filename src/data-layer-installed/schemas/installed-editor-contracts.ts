import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";

export interface SchemaInstalledLibraryPort {
  readonly schemas: readonly SchemaDefinition[];
  select(id: string, draft?: SchemaDefinition): void;
}

export interface SchemaInstalledLibraryEditorPort {
  persistDraft(): void;
  updateName(): void;
  saveDescription(): void;
  updateTarget(): void;
  changeParent(): void;
  changeAdditionalProperties(): void;
  openRevisionReview(): void;
  confirmRevision(): void;
  cancelRevision(): void;
  discardTransient(): void;
  keepEditing(): void;
  closeEditor(): void;
  discardWorking(): void;
  render(): void;
  duplicateRevision(): void;
  restoreRevision(): void;
  publish(close?: boolean): SchemaDefinition;
}

export interface SchemaInstalledPropertyPort {
  requestRemoval(path:string, trigger?:HTMLButtonElement):void;
  confirmRemoval():void;
  cancelRemoval(event?:Event):void;
  undoRemoval():void;
  requestDocumentationRemoval(path:string, trigger?:HTMLElement):void;
  confirmDocumentationRemoval():void;
  closeDocumentationRemoval():void;
  openCopy(path:string, triggerOrDestination:HTMLButtonElement|string):void;
  confirmCopy():void;
  undoCopy():void;
  renderSpecificIndex():void;
  openSpecificIndex(path:string, trigger?:HTMLButtonElement):void;
  submitSpecificIndex(event:Event):void;
  closeSpecificIndex(event?:Event):void;
  renderManual():void;
  openManual(parentPath?:string, trigger?:HTMLButtonElement):void;
  submitManual(event:Event):void;
  closeManual():void;
  goToExisting():void;
}

export interface SchemaInstalledEditorWorkflowPorts {
  root: ParentNode;
  library: SchemaInstalledLibraryPort;
  editor: SchemaInstalledLibraryEditorPort;
  property: SchemaInstalledPropertyPort;
  schemaEditor: HTMLElement | null;
  schemaDetailEmpty: HTMLElement | null;
  schemaEditorName: HTMLElement | null;
  propertyFilter: HTMLInputElement | null;
  subviews: readonly HTMLButtonElement[];
  panels: readonly HTMLElement[];
  liveEventQuery: HTMLElement | null;
  specificationBuilder: HTMLElement | null;
  renderProperty(): void;
  renderAll(): void;
  showSchemas(): void;
  openRoute(trigger?: HTMLElement): void;
  createEmpty(): void;
  settleCanonical: boolean;
  renderSpecification(
    root: HTMLElement,
    schema: SchemaDefinition,
    schemas: readonly SchemaDefinition[],
    surface: `published:${number}` | `historical:${number}` | "working-draft",
    close: () => void,
  ): void;
}

/** Commands used by installed editor listener bindings. */
export interface SchemaInstalledEditorCommands {
  openNew(): void;
  updateName(): void;
  saveDescription(): void;
  updateTarget(): void;
  changeParent(): void;
  changeDeclaredOnly(): void;
  openRevision(): void;
  confirmRevision(): void;
  cancelRevision(): void;
  discardTransient(): void;
  keepEditing(): void;
  closeEditor(): void;
  saveFromCloseReview(): void;
  discardWorking(): void;
  renderRevision(): void;
  duplicateRevision(): void;
  restoreRevision(): void;
  openManual(): void;
  clearPropertyFilter(): void;
  activateSubview(event: Event): void;
  confirmRemoval(): void;
  cancelRemoval(event?: Event): void;
  undoRemoval(): void;
  confirmDocumentationRemoval(): void;
  cancelDocumentationRemoval(event?: Event): void;
  renderSpecificIndex(): void;
  submitSpecificIndex(event: Event): void;
  closeSpecificIndex(event?: Event): void;
  renderManual(): void;
  submitManual(event: Event): void;
  closeManual(event?: Event): void;
  goToExisting(): void;
}

export interface SchemaEditorBindingOperations {
  updateTree(): void;
  recheck(): void;
  persistTreeScroll(): void;
  navigateTree(event: KeyboardEvent): void;
  rememberCanonicalScroll(): void;
}

export interface SchemaPropertyBindingOperations {
  render(): void;
  undoCopy(): void;
  cancelRulePicker(event: Event): void;
  navigateRulePicker(event: KeyboardEvent): void;
}
