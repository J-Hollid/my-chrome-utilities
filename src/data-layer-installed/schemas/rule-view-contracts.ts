import type { ReusableRuleSyncReview } from "../../data-layer-reusable-rule-sync.js";
import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule } from "./contracts.js";

export interface RuleElements {
  list: HTMLElement | null; search: HTMLInputElement | null; editor: HTMLElement | null; name: HTMLInputElement | null;
  parameters: HTMLInputElement | null; types: HTMLSelectElement | null; operator: HTMLSelectElement | null;
  severity: HTMLSelectElement | null; message: HTMLInputElement | null; examples: HTMLInputElement | null;
  attachments: HTMLSelectElement | null; updateAttachments: HTMLInputElement | null; result: HTMLElement | null;
  revisionReview: HTMLDialogElement | null; revisionSummary: HTMLElement | null; confirmRevision: HTMLButtonElement | null;
  upgradeReview: HTMLDialogElement | null; upgradeSummary: HTMLElement | null; confirmUpgrade: HTMLButtonElement | null; cancelUpgrade: HTMLButtonElement | null;
  syncReview: HTMLDialogElement | null; syncSummary: HTMLElement | null; confirmSync: HTMLButtonElement | null; cancelSync: HTMLButtonElement | null;
  deleteReview: HTMLDialogElement | null; deleteSummary: HTMLElement | null; confirmDelete: HTMLButtonElement | null;
  document: Document | undefined;
}

export interface SchemaRulePresentationPort {
  render(): void;
  openEditor(): void;
  populate(rule: ReusableSchemaRule): void;
  showRevision(previous: ReusableSchemaRule, changes: Partial<ReusableSchemaRule>): void;
  showUpgrade(rule: ReusableSchemaRule, affected: readonly SchemaDefinition[]): void;
  showSync(review: ReusableRuleSyncReview): void;
  showDeletion(rule: ReusableSchemaRule): void;
  close(kind: "editor" | "revision" | "upgrade" | "sync" | "delete"): void;
  updateAttachmentPreview(): void;
}
