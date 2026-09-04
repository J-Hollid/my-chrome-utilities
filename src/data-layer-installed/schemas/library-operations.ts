import type { ReusableSchemaRule } from "./contracts.js";
import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import { SchemaLibraryDeletionWorkflow } from "./library-deletion-workflow.js";
import {
  SchemaLibraryExportWorkflow,
  omittedRuleStatus,
} from "./library-export-workflow.js";
import { SchemaLibraryImportWorkflow } from "./library-import-workflow.js";
import type { SchemaLibraryController } from "./library-controller.js";

export interface SchemaLibraryBehaviorPorts {
  elements: {
    importFile: HTMLInputElement | null;
    importReview: HTMLDialogElement | null;
    importSummary: HTMLElement | null;
    deleteReview: HTMLDialogElement | null;
    deleteSummary: HTMLElement | null;
    exportButton: HTMLButtonElement | null;
    exportChoices: HTMLDialogElement | null;
    exportReview: HTMLDialogElement | null;
    result: HTMLElement | null;
  };
  rules(): ReusableSchemaRule[];
  replaceRules(rules: ReusableSchemaRule[]): void;
  persistRules(): void;
  renderAll(): void;
  renderRules(): void;
  download(value: unknown, filename: string): void;
}

/** Routes installed Library actions to one-purpose workflows. */
export class SchemaLibraryOperations {
  readonly #import: SchemaLibraryImportWorkflow;
  readonly #deletion: SchemaLibraryDeletionWorkflow;
  readonly #export: SchemaLibraryExportWorkflow;

  constructor(
    library: SchemaLibraryController,
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
  ): boolean {
    return this.#export.openChoices(trigger, schema);
  }
  requestExport(): void {
    this.#export.request();
  }
  omittedStatus(count: number): string {
    return omittedRuleStatus(count);
  }
}
