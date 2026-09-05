import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule } from "./contracts.js";

/** Read-only state and commands used by Library workflows. */
export interface SchemaLibraryWorkflowPort {
  readonly schemas: readonly SchemaDefinition[];
  readonly activeSchemaId: string | undefined;
  replaceSchemas(next: readonly SchemaDefinition[]): void;
  clearSelection(): void;
  persist(): void;
}

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
