import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import { SchemaLibraryDeletionWorkflow } from "./library-deletion-workflow.js";
import {
  SchemaLibraryExportWorkflow,
  omittedRuleStatus,
} from "./library-export-workflow.js";
import { SchemaLibraryImportWorkflow } from "./library-import-workflow.js";
import type { SchemaLibraryBehaviorPorts, SchemaLibraryWorkflowPort } from "./library-controller-contracts.js";
export type { SchemaLibraryBehaviorPorts } from "./library-controller-contracts.js";

/** Routes installed Library actions to one-purpose workflows. */
export class SchemaLibraryOperations {
  readonly #import: SchemaLibraryImportWorkflow;
  readonly #deletion: SchemaLibraryDeletionWorkflow;
  readonly #export: SchemaLibraryExportWorkflow;

  constructor(
    library: SchemaLibraryWorkflowPort,
    ports: SchemaLibraryBehaviorPorts,
  ) {
    this.#import = new SchemaLibraryImportWorkflow(library, ports);
    this.#deletion = new SchemaLibraryDeletionWorkflow(library, ports);
    this.#export = new SchemaLibraryExportWorkflow(library, ports);
  }
  reset(): void {
    this.#import.reset();
    this.#deletion.reset();
    this.#export.reset();
  }
  openImportFile(): void {
    this.#import.openFile();
  }
  reviewImport(serialized: string): void {
    this.#import.review(serialized);
  }
  readImportFile(): Promise<void> {
    return this.#import.readFile();
  }
  replaceImport(): void {
    this.#import.replace();
  }
  appendImport(): void {
    this.#import.append();
  }
  cancelImport(): void {
    this.#import.cancel();
  }
  requestDeletion(id: string): boolean {
    return this.#deletion.request(id);
  }
  confirmDeletion(): void {
    this.#deletion.confirm();
  }
  cancelDeletion(): void {
    this.#deletion.cancel();
  }
  openExportChoices(
    trigger: HTMLButtonElement,
    schema?: SchemaDefinition,
  ): void {
    this.#export.openChoices(trigger, schema);
  }
  requestExport(): void {
    this.#export.request();
  }
  omittedStatus(count: number): string {
    return omittedRuleStatus(count);
  }
}
