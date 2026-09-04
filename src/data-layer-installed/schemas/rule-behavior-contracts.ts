import type { LocalRulePromotionDialogController } from "../../data-layer-local-rule-promotion-ui.js";
import type { AssignmentConditionTarget, SchemaDefinition, SchemaPropertyType } from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule } from "./contracts.js";
import type { RuleElements, SchemaRulePresentationPort } from "./rule-view-contracts.js";

export interface SchemaRuleBehaviorPorts {
  elements: RuleElements;
  presentation: SchemaRulePresentationPort;
  schemas(): SchemaDefinition[];
  replaceSchemas(schemas: SchemaDefinition[]): void;
  persistRules(): void;
  persistLibrary(): void;
  renderAll(): void;
  renderDraft(): void;
  createId(): string;
  download(value: unknown, filename: string): void;
  createRuleId(): string;
  capturedValue(target: AssignmentConditionTarget): unknown;
  editableSchema(): SchemaDefinition;
  propertyType(document: SchemaDefinition["document"], path: string): SchemaPropertyType | undefined;
  draft(): SchemaDefinition | undefined;
  replaceDraft(schema: SchemaDefinition): void;
  presentDraft(schema: SchemaDefinition): SchemaDefinition;
  activeSchemaId(): string | undefined;
  promotionDialog: LocalRulePromotionDialogController;
  detail: HTMLElement | null;
  root: ParentNode;
  scheduleFrame(callback: () => void): void;
  result(message: string): void;
  commitPromotion(schemaId: string, previousSchemas: readonly SchemaDefinition[], previousRules: readonly ReusableSchemaRule[], nextSchemas: readonly SchemaDefinition[], nextRules: readonly ReusableSchemaRule[]): Promise<void>;
  settleCanonical?(schemaId: string): Promise<void>;
}
