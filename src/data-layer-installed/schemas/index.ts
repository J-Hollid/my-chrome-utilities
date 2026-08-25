import {
  SCHEMA_LIBRARY_STORAGE_KEY,
  discardSchemaWorkingDraft,
  duplicateSchemaRevision,
  filterAndSortSchemaPropertyRows,
  inspectSchemaPropertyRemoval,
  inspectSpecificIndexRuleTarget,
  inspectJsonSchemaExport,
  importSchema,
  inspectManualProperty,
  inspectSchemaRename,
  proposeSchemaWorkingDraftName,
  publishSchemaWorkingDraft,
  removeSchemaProperty,
  restoreSchemaRevisionDraft,
  schemaPropertyRows,
  schemaRevisionChoices,
  schemaPropertyCopySource,
  schemaInheritanceConflict,
  schemaInheritanceError,
  addManualProperty,
  assignmentDraftAfterGuidedSave,
  assignmentConditionSuggestions, configuredRuleDetails, ruleConfigurationControls, validateRuleConfiguration, comparisonValueFromInput, builtInRulesForProperty, reusableRulesForProperty, reusableRuleMetadata,
  assignmentDataConditionSummary,
  contextualManualPropertyDefinition,
  createRuleConfiguration,
  createExtensionSchemaPackage,
  createSchemaLibraryExport,
  duplicateSchemaAssignment,
  guidedAttachedRule,
  guidedPropertyDocument,
  manualPropertyPreview,
  mergeGuidedDocument,
  restoreSchemaLibrary,
  searchSchemas,
  serializeSchemaLibrary,
  exportJsonSchemaBundle,
  exportJsonSchemaResource,
  setSchemaDescription as updateSchemaDescription,
  setPropertyDocumentation,
  undoSchemaPropertyRemoval,
  undoSchemaPropertyCopy,
  updateSchemaWorkingDraft,
  validateAssignmentDataConditions,
  validateEvent,
  validateWithSchema,
  mountCanonicalSchemaEditor,
  typedComparisonValue, GUIDED_CONTINUATION_STORAGE_KEY, restoreGuidedContinuationSelections, selectGuidedContinuation, selectedGuidedContinuation,
  createGuidedValidationFlow,
  filterSchemaRelationshipTree,
  restoreSchemaRelationshipTreeView,
  saveSchemaRelationshipTreeView,
  applyCanonicalCommand,
  canonicalCommandOutcome,
  canonicalPropertyPath,
  canonicalCommandsFromCompactProjection,
  compactCanonicalCommandPolicy,
  compactSchemaProjection,
  savedSchemaCanonicalDocument,
  beginCompactCanonicalHistoryTransition,
  compactCanonicalHistoryKey,
  compactCanonicalHistorySettlement,
  completeCompactCanonicalHistoryTransition,
  recordCompactCanonicalMutation,
  rejectCompactCanonicalHistoryTransition,
  type CanonicalSchemaDocument,
  type CompactCanonicalHistoryTransitionIdentity,
  type AssignmentConditionTarget,
  type AssignmentDataConditionGroup,
  type SchemaDefinition,
  type SchemaAssignment,
  type SchemaPropertySortOrder,
  type SchemaPropertyRemoval,
  type AppliedSchemaPropertyCopy,
  type ManualArrayItemType,
  type ManualPropertyDefinition,
  type PromotableReusableRule,
  type PublishedGuidedValidation,
  type ManualPropertyValueType,
  type RuleConfiguration,
  type SchemaPropertyType,
  type SchemaWorkingDraft,
  type JsonSchemaCompatibilityReview,
  type SchemaRelationshipCategory,
  type SchemaRelationshipTreeNode, type GuidedContinuationSelections,
} from "../../utilities/data-layer/schemas.js";
import { applySchemaPropertyCopy, planSchemaPropertyCopy, type SchemaPropertyCopyPlan } from "../../data-layer-schema-property-copy.js";
import type { AssignmentDataConditionEditorState } from "../../data-layer-schema-assignment-data-conditions-ui.js";
import {
  persistLocalRulePromotion,
  promoteLocalRule,
  reviewLocalRulePromotion,
  type LocalRulePromotionSelection,
} from "../../data-layer-local-rule-promotion.js";
import type { LocalRulePromotionDialogController } from "../../data-layer-local-rule-promotion-ui.js";
import {
  publishReusableRuleSync,
  reviewReusableRuleSync,
  type ReusableRuleSyncReview,
} from "../../data-layer-reusable-rule-sync.js";
import {
  addLiveSchemaPropertyDeclaration,
  createLiveSchemaPropertyDeclaration,
} from "../../data-layer-live-schema-property-declaration.js";
import {
  applyAllowedValueExpansion,
  reviewAllowedValueExpansion,
  type AllowedValueExpansionDestination,
} from "../../data-layer-allowed-value-expansion.js";
import type { ValidationEvaluation } from "../../data-layer-validation-model.js";

export interface SchemasInstalledPorts {
  root: ParentNode;
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  relationshipViewStorage: Pick<Storage, "getItem" | "setItem">;
  changed(schemas: readonly SchemaDefinition[]): void;
  subscribe(listener: () => void): () => void;
  createRuleId(): string;
  capturedAssignmentValue(target: AssignmentConditionTarget): unknown;
  renderAssignmentConditions(root: HTMLElement, state: AssignmentDataConditionEditorState,
    changed: (state: AssignmentDataConditionEditorState) => void): void;
  localRulePromotionDialog: LocalRulePromotionDialogController;
  subscribeSchemaPersistence(listener: (event: SchemaPersistenceEvent) => void): () => void;
  downloadSchema(value: unknown, filename: string): void;
  relationshipTree(schemas: readonly SchemaDefinition[]): { projectId:string; nodes:readonly SchemaRelationshipTreeNode[] };
  openProjectLibrary(create: boolean): void;
  openContributor(key: string): void;
  openContributorInStudio(key: string): void;
  adoptSavedSchema(schema: SchemaDefinition, trigger: HTMLButtonElement): void;
  renderSchemaSpecification(root: HTMLElement, schema: SchemaDefinition, schemas: readonly SchemaDefinition[],
    surface: `published:${number}` | `historical:${number}` | "working-draft", close: () => void): void;
  reportMissingSchemaEvent(schemaId: string): void;
  scheduleFrame(callback: () => void): void;
  restoreGuidedCapture(eventId:string, propertyPath?:string):void;
  activeProjectId(): string | undefined;
  ensureProjectSchemaContributors(projectId: string, route: Readonly<{ collectionKinds:readonly string[]; includeFlowGraphs:boolean }>): Promise<{ name:string }>;
  settleCanonical?(schemaId:string):Promise<void>;
  mountLayeredProfileEditor():{ dispose():void } | undefined;
  canonicalConceptSuggestions():readonly string[];
  createCanonicalTableEditor?(options:Parameters<typeof mountCanonicalSchemaEditor>[0]):ReturnType<typeof mountCanonicalSchemaEditor>;
  revalidateCurrentLive?(schemas:readonly SchemaDefinition[], manualOverrides:Readonly<Record<string,string>>):number;
  prepareCapturedValidationContinuation?(record:SchemaValidationRecord):Promise<CapturedValidationContinuation>;
}

export interface SchemaValidationRecord { eventId:string; eventName:string; state:string; checkedAt:string; schemaId?:string;
  schemaName?:string; schemaVersion?:number; issueCodes:readonly string[] }
export interface CapturedValidationContinuation { summary:string; destinations:readonly { id:string; label:string }[];
  commit(destinationId:string):Promise<void> }

export type SchemaPersistenceEvent =
  | { type:"saved" | "retried"; schemaId:string }
  | { type:"failed" | "rejected"; schemaId:string; error:unknown };

interface ReusableSchemaRuleRevision {
  name:string; kind:string; version:number; enabled?:boolean; applicableType?:SchemaPropertyType;
  operator?:string; parameters?:string; severity?:string; message?:string; examples?:string;
}

interface ReusableSchemaRule {
  id:string; name:string; kind:string; version:number; enabled:boolean; applicableType?:SchemaPropertyType;
  operator?:string; parameters?:string; severity?:string; message?:string; examples?:string; attachments?:readonly string[];
  revisionHistory?:readonly ReusableSchemaRuleRevision[];
  allowedValues?:readonly (string | number | boolean | null)[];
  conditionGroup?:NonNullable<PromotableReusableRule["conditionGroup"]>;
  description?:string;
}
type CompactCanonicalCommand = Parameters<typeof applyCanonicalCommand>[1];
type CompactCanonicalCommandResult = ReturnType<typeof applyCanonicalCommand>;
interface CompactCanonicalEditorAdapter {
  key:string; label:string; load():CanonicalSchemaDocument;
  dispatch(command:CompactCanonicalCommand):CompactCanonicalCommandResult;
  settle?():Promise<void>; settles?(command:CompactCanonicalCommand):boolean;
  settlementTarget?:string;
  projection?(canonical:CanonicalSchemaDocument):SchemaDefinition;
  persistProjection?(projection:SchemaDefinition, change?:string):boolean;
  stageProjectionCommand?(command:CompactCanonicalCommand):CompactCanonicalCommandResult;
  restoreStagedProjection?(canonical:CanonicalSchemaDocument):void;
  onSettlementCommitted?():void;
  onUndo?():void; onRedo?():void;
  renderContext?(host:HTMLElement):void;
  actions?:readonly { label:string; run():void }[];
  migration?:{ summary:string; conflicts:readonly { id:string; label:string; choices:readonly { id:string; label:string }[] }[];
    resolve(conflictId:string, choiceId:string):void; cancel():void; confirm():Promise<void> };
}
interface CompactCanonicalProjectionPersistenceRequest { adapter:CompactCanonicalEditorAdapter; projection:SchemaDefinition; change?:string }
interface CompactCanonicalProjectionWorker { adapter:CompactCanonicalEditorAdapter; promise:Promise<boolean> }
type DisplayedSchemaRule = { path:string; rule:NonNullable<SchemaDefinition["attachedRules"]>[number]; origin:SchemaDefinition;
  state:"active-inherited" | "disabled-inherited" | "explicitly-reenabled" | "local" };

const SCHEMA_RULE_STORAGE_KEY = "my-chrome-utilities.schema-rule-library.v1";

export function createSchemasInstalledController(ports: SchemasInstalledPorts) {
  const schemaSearch = ports.root.querySelector<HTMLInputElement>("#schema-search");
  const schemaCategoryFilter = ports.root.querySelector<HTMLSelectElement>("#schema-category-filter");
  const schemaEmptyState = ports.root.querySelector<HTMLElement>("#schema-empty-state");
  const schemaCount = ports.root.querySelector<HTMLElement>("#schema-count");
  const schemaList = ports.root.querySelector<HTMLElement>("#schema-list");
  const schemaResult = ports.root.querySelector<HTMLElement>("#schema-result");
  const createSchemaButton = ports.root.querySelector<HTMLButtonElement>("#create-schema");
  const recheckSchemaValidationButton = ports.root.querySelector<HTMLButtonElement>("#recheck-schema-validation");
  const schemaValidationIssues = ports.root.querySelector<HTMLElement>("#schema-validation-issues");
  const schemaValidationRecordList = ports.root.querySelector<HTMLElement>("#schema-validation-record-list");
  const guidedValidationRoot = ports.root.querySelector<HTMLElement>("#guided-validation-flow");
  const schemaEditor = ports.root.querySelector<HTMLElement>("#schema-editor");
  const schemaDetail = ports.root.querySelector<HTMLElement>("#schema-detail");
  const schemaTreeScrollOwner = ports.root.querySelector<HTMLElement>("#workspace-panel-data-layer");
  const schemaPanel = ports.root.querySelector<HTMLElement>("#data-layer-panel-schemas");
  const sidePanelLayeredProfileEditorHost = ports.root.querySelector<HTMLElement>("#side-panel-layered-profile-editor");
  const liveEventQuery = ports.root.querySelector<HTMLElement>("#live-event-query");
  const schemaSubviews = Array.from(ports.root.querySelectorAll<HTMLButtonElement>("#schema-subviews [role=tab]"));
  const schemaPanels = Array.from(ports.root.querySelectorAll<HTMLElement>("#schema-master, #schema-rule-library, #schema-assignments"));
  if (sidePanelLayeredProfileEditorHost && schemaDetail && !schemaDetail.contains(sidePanelLayeredProfileEditorHost)) {
    schemaDetail.prepend(sidePanelLayeredProfileEditorHost);
  }
  const schemaDetailEmpty = ports.root.querySelector<HTMLElement>("#schema-detail-empty");
  const schemaInheritanceProvenance = ports.root.querySelector<HTMLElement>("#schema-inheritance-provenance");
  const schemaRuleOverrides = ports.root.querySelector<HTMLElement>("#schema-rule-overrides");
  const schemaRuleOverrideList = ports.root.querySelector<HTMLElement>("#schema-rule-override-list");
  const schemaEditorParent = ports.root.querySelector<HTMLSelectElement>("#schema-editor-parent");
  const schemaOnlyDeclaredProperties = ports.root.querySelector<HTMLInputElement>("#schema-only-declared-properties");
  const schemaEditorName = ports.root.querySelector<HTMLInputElement>("#schema-editor-name");
  const schemaEditorNameAssistance = ports.root.querySelector<HTMLOutputElement>("#schema-editor-name-assistance");
  const schemaEditorDescription = ports.root.querySelector<HTMLTextAreaElement>("#schema-editor-description");
  const saveSchemaDescriptionButton = ports.root.querySelector<HTMLButtonElement>("#save-schema-description");
  const schemaDescriptionOrigin = ports.root.querySelector<HTMLElement>("#schema-description-origin");
  const schemaEditorTarget = ports.root.querySelector<HTMLSelectElement>("#schema-editor-target");
  const saveSchemaButton = ports.root.querySelector<HTMLButtonElement>("#save-schema");
  const saveSchemaReason = ports.root.querySelector<HTMLElement>("#save-schema-reason");
  const schemaRevisionReview = ports.root.querySelector<HTMLDialogElement>("#schema-revision-review");
  const schemaRevisionReviewSummary = ports.root.querySelector<HTMLElement>("#schema-revision-review-summary");
  const confirmSchemaRevisionButton = ports.root.querySelector<HTMLButtonElement>("#confirm-schema-revision");
  const cancelSchemaRevisionButton = ports.root.querySelector<HTMLButtonElement>("#cancel-schema-revision");
  const schemaCloseReview = ports.root.querySelector<HTMLDialogElement>("#close-schema-editor-review");
  const schemaCloseReviewSummary = ports.root.querySelector<HTMLElement>("#schema-close-review-summary");
  const discardSchemaDraftButton = ports.root.querySelector<HTMLButtonElement>("#discard-schema-draft");
  const keepEditingSchemaButton = ports.root.querySelector<HTMLButtonElement>("#keep-editing-schema");
  const closeSchemaEditorButton = ports.root.querySelector<HTMLButtonElement>("#close-schema-editor");
  const saveAndCloseSchemaButton = ports.root.querySelector<HTMLButtonElement>("#save-and-close-schema");
  const saveSchemaCloseReviewButton = ports.root.querySelector<HTMLButtonElement>("#save-schema-close-review");
  const discardWorkingSchemaDraftButton = ports.root.querySelector<HTMLButtonElement>("#discard-working-schema-draft");
  const schemaRevisionSelector = ports.root.querySelector<HTMLSelectElement>("#schema-revision-selector");
  const schemaRevisionComparison = ports.root.querySelector<HTMLElement>("#schema-revision-comparison");
  const duplicateSchemaRevisionButton = ports.root.querySelector<HTMLButtonElement>("#duplicate-schema-revision");
  const restoreSchemaRevisionButton = ports.root.querySelector<HTMLButtonElement>("#restore-schema-revision");
  const addSchemaPropertyButton = ports.root.querySelector<HTMLButtonElement>("#add-schema-property");
  const schemaOwnerDocument = (ports.root as ParentNode & { ownerDocument?:Document }).ownerDocument
    ?? ("createElement" in ports.root ? ports.root as Document : undefined);
  const ownedElement = <K extends keyof HTMLElementTagNameMap>(selector: string, tag: K): HTMLElementTagNameMap[K] | null =>
    ports.root.querySelector<HTMLElementTagNameMap[K]>(selector) ?? schemaOwnerDocument?.createElement(tag) ?? null;
  const schemaInheritedRuleGroups = ownedElement("#schema-inherited-rule-groups", "section");
  const schemaEffectiveRulePreview = ownedElement("#schema-effective-rule-preview", "section");
  const schemaSpecificationBuilder = ownedElement("#schema-specification-builder", "section");
  const buildSpecificationButton = ownedElement("#build-specification", "button");
  const buildHistoricalSpecificationButton = ownedElement("#build-historical-specification", "button");
  const compactCanonicalContext = ownedElement("#compact-canonical-context", "section");
  if (schemaInheritedRuleGroups) { schemaInheritedRuleGroups.id = "schema-inherited-rule-groups";
    schemaInheritedRuleGroups.setAttribute("aria-label", "Inherited rule states"); }
  if (schemaEffectiveRulePreview) { schemaEffectiveRulePreview.id = "schema-effective-rule-preview";
    schemaEffectiveRulePreview.setAttribute("aria-label", "Effective-rule preview"); }
  if (schemaRuleOverrides && schemaInheritedRuleGroups && schemaEffectiveRulePreview) {
    schemaRuleOverrides.after(schemaInheritedRuleGroups, schemaEffectiveRulePreview);
  }
  if (schemaSpecificationBuilder) { schemaSpecificationBuilder.id = "schema-specification-builder";
    schemaSpecificationBuilder.hidden = true; schemaDetail?.append(schemaSpecificationBuilder); }
  if (buildSpecificationButton) { buildSpecificationButton.id = "build-specification"; buildSpecificationButton.type = "button";
    buildSpecificationButton.textContent = "Build specification"; schemaEditor?.prepend(buildSpecificationButton); }
  if (buildHistoricalSpecificationButton) { buildHistoricalSpecificationButton.id = "build-historical-specification";
    buildHistoricalSpecificationButton.type = "button"; buildHistoricalSpecificationButton.textContent = "Build specification";
    restoreSchemaRevisionButton?.after(buildHistoricalSpecificationButton); }
  if (compactCanonicalContext) { compactCanonicalContext.id = "compact-canonical-context";
    compactCanonicalContext.setAttribute("aria-label", "Compact canonical schema context"); compactCanonicalContext.hidden = true;
    schemaEditor?.prepend(compactCanonicalContext); }
  const schemaPropertyViewControls = ownedElement("#schema-property-view-controls", "div");
  const schemaPropertyFilterLabel = ownedElement("#schema-property-filter-label", "label");
  const schemaPropertyFilter = ownedElement("#schema-property-filter", "input");
  const schemaPropertySortLabel = ownedElement("#schema-property-sort-label", "label");
  const schemaPropertySort = ownedElement("#schema-property-sort", "select");
  const schemaPropertyResultStatus = ownedElement("#schema-property-result-status", "output");
  const schemaPropertyEmpty = ownedElement("#schema-property-empty", "div");
  const schemaPropertyEmptyMessage = ownedElement("#schema-property-empty-message", "p");
  const clearSchemaPropertyFilter = ownedElement("#clear-schema-property-filter", "button");
  const schemaPropertyTree = ownedElement("#schema-property-tree", "ul");
  const schemaPropertyRemovalFeedback = ownedElement("#schema-property-removal-feedback", "output");
  const undoSchemaPropertyRemovalButton = ownedElement("#undo-schema-property-removal", "button");
  const schemaPropertyCopyFeedback = ownedElement("#schema-property-copy-feedback", "output");
  const undoSchemaPropertyCopyButton = ownedElement("#undo-schema-property-copy", "button");
  const schemaPropertyCopyDialog = ownedElement("#schema-property-copy-dialog", "dialog");
  const schemaPropertyRemovalDialog = ownedElement("#schema-property-removal-dialog", "dialog");
  const schemaPropertyRemovalHeading = ownedElement("#schema-property-removal-heading", "h4");
  const schemaPropertyRemovalSummary = ownedElement("#schema-property-removal-summary", "output");
  const confirmSchemaPropertyRemovalButton = ownedElement("#confirm-schema-property-removal", "button");
  const cancelSchemaPropertyRemovalButton = ownedElement("#cancel-schema-property-removal", "button");
  const schemaDocumentationRemovalDialog = ownedElement("#schema-documentation-removal-dialog", "dialog");
  const schemaDocumentationRemovalHeading = ownedElement("#schema-documentation-removal-heading", "h4");
  const schemaDocumentationRemovalSummary = ownedElement("#schema-documentation-removal-summary", "p");
  const confirmSchemaDocumentationRemoval = ownedElement("#confirm-schema-documentation-removal", "button");
  const cancelSchemaDocumentationRemoval = ownedElement("#cancel-schema-documentation-removal", "button");
  const schemaSpecificIndexDialog = ownedElement("#schema-specific-index-dialog", "dialog");
  const schemaSpecificIndexForm = ownedElement("#schema-specific-index-form", "form");
  const schemaSpecificIndexHeading = ownedElement("#schema-specific-index-heading", "h4");
  const schemaSpecificIndexLabel = ownedElement("#schema-specific-index-label", "label");
  const schemaSpecificIndex = ownedElement("#schema-specific-index", "input");
  const schemaSpecificIndexAssistance = ownedElement("#schema-specific-index-assistance", "output");
  const confirmSchemaSpecificIndex = ownedElement("#confirm-schema-specific-index", "button");
  const cancelSchemaSpecificIndex = ownedElement("#cancel-schema-specific-index", "button");
  const schemaManualPropertyDialog = ownedElement("#schema-manual-property-dialog", "dialog");
  const schemaManualPropertyForm = ownedElement("#schema-manual-property-form", "form");
  const schemaManualPropertyHeading = ownedElement("#schema-manual-property-heading", "h4");
  const schemaManualPropertyPathLabel = ownedElement("#schema-manual-property-path-label", "label");
  const schemaManualPropertyPath = ownedElement("#schema-manual-property-path", "input");
  const schemaManualPropertyParentContext = ownedElement("#schema-manual-property-parent-context", "output");
  const schemaManualPropertyChildNameLabel = ownedElement("#schema-manual-property-child-name-label", "label");
  const schemaManualPropertyChildName = ownedElement("#schema-manual-property-child-name", "input");
  const schemaManualPropertyTypeLabel = ownedElement("#schema-manual-property-type-label", "label");
  const schemaManualPropertyType = ownedElement("#schema-manual-property-type", "select");
  const schemaManualArrayTypeGroup = ownedElement("#schema-manual-array-type-group", "label");
  const schemaManualArrayItemType = ownedElement("#schema-manual-array-item-type", "select");
  const schemaManualPropertyPreview = ownedElement("#schema-manual-property-preview", "output");
  const schemaManualPropertyAssistance = ownedElement("#schema-manual-property-assistance", "output");
  const goToExistingSchemaPropertyButton = ownedElement("#go-to-existing-schema-property", "button");
  const confirmSchemaManualPropertyButton = ownedElement("#confirm-schema-manual-property", "button");
  const cancelSchemaManualPropertyButton = ownedElement("#cancel-schema-manual-property", "button");
  const schemaPropertyRulePicker = ownedElement("#schema-property-rule-picker", "dialog");
  const createSchemaAssignmentButton = ports.root.querySelector<HTMLButtonElement>("#create-schema-assignment");
  const createSchemaRuleButton = ports.root.querySelector<HTMLButtonElement>("#create-schema-rule");
  const schemaRuleEditor = ports.root.querySelector<HTMLElement>("#schema-rule-editor");
  const schemaRuleName = ports.root.querySelector<HTMLInputElement>("#schema-rule-name");
  const schemaRuleParameters = ports.root.querySelector<HTMLInputElement>("#schema-rule-parameters");
  const schemaRuleTypes = ports.root.querySelector<HTMLSelectElement>("#schema-rule-types");
  const schemaRuleOperator = ports.root.querySelector<HTMLSelectElement>("#schema-rule-operator");
  const schemaRuleSeverity = ports.root.querySelector<HTMLSelectElement>("#schema-rule-severity");
  const schemaRuleMessage = ports.root.querySelector<HTMLInputElement>("#schema-rule-message");
  const schemaRuleExamples = ports.root.querySelector<HTMLInputElement>("#schema-rule-examples");
  const saveSchemaRuleButton = ports.root.querySelector<HTMLButtonElement>("#save-schema-rule");
  const schemaRuleList = ports.root.querySelector<HTMLElement>("#schema-rule-list");
  const schemaRuleSearch = ports.root.querySelector<HTMLInputElement>("#schema-rule-search");
  const schemaRuleAttachments = ports.root.querySelector<HTMLSelectElement>("#schema-rule-attachments");
  const updateSchemaRuleAttachments = ports.root.querySelector<HTMLInputElement>("#update-schema-rule-attachments");
  const schemaRuleUpgradeReview = ownedElement("#schema-rule-upgrade-review", "dialog");
  const schemaRuleUpgradeReviewSummary = ownedElement("#schema-rule-upgrade-review-summary", "output");
  const confirmSchemaRuleUpgradeButton = ownedElement("#confirm-schema-rule-upgrade", "button");
  const cancelSchemaRuleUpgradeButton = ownedElement("#cancel-schema-rule-upgrade", "button");
  const schemaRuleRevisionReview = ownedElement("#schema-rule-revision-review", "dialog");
  const schemaRuleRevisionReviewSummary = ownedElement("#schema-rule-revision-review-summary", "output");
  const confirmSchemaRuleRevisionButton = ownedElement("#confirm-schema-rule-revision-review", "button");
  const cancelSchemaRuleRevisionButton = ownedElement("#cancel-schema-rule-revision", "button");
  const schemaRuleSyncReview = ownedElement("#schema-rule-sync-review", "dialog");
  const schemaRuleSyncReviewSummary = ownedElement("#schema-rule-sync-review-summary", "output");
  const confirmSchemaRuleSyncButton = ownedElement("#confirm-schema-rule-sync", "button");
  const cancelSchemaRuleSyncButton = ownedElement("#cancel-schema-rule-sync", "button");
  const exportSchemaRulesButton = ports.root.querySelector<HTMLButtonElement>("#export-schema-rules");
  const schemaRuleDeleteReview = ownedElement("#schema-rule-delete-review", "dialog");
  const schemaRuleDeleteReviewSummary = ownedElement("#schema-rule-delete-review-summary", "output");
  const confirmSchemaRuleDeleteButton = ownedElement("#confirm-schema-rule-delete", "button");
  const cancelSchemaRuleDeleteButton = ownedElement("#cancel-schema-rule-delete", "button");
  const schemaAssignmentEditor = ports.root.querySelector<HTMLElement>("#schema-assignment-editor");
  const schemaAssignmentSource = ports.root.querySelector<HTMLInputElement>("#schema-assignment-source");
  const schemaAssignmentEvent = ports.root.querySelector<HTMLInputElement>("#schema-assignment-event");
  const schemaAssignmentPriority = ports.root.querySelector<HTMLInputElement>("#schema-assignment-priority");
  const saveSchemaAssignmentButton = ports.root.querySelector<HTMLButtonElement>("#save-schema-assignment");
  const schemaAssignmentTarget = ports.root.querySelector<HTMLSelectElement>("#schema-assignment-target");
  const schemaAssignmentDomain = ports.root.querySelector<HTMLInputElement>("#schema-assignment-domain");
  const schemaAssignmentPathname = ports.root.querySelector<HTMLInputElement>("#schema-assignment-pathname");
  const schemaAssignmentVersionPolicy = ports.root.querySelector<HTMLSelectElement>("#schema-assignment-version-policy");
  const schemaAssignmentEnabled = ports.root.querySelector<HTMLInputElement>("#schema-assignment-enabled");
  const schemaAssignmentList = ports.root.querySelector<HTMLElement>("#schema-assignment-list");
  const schemaAssignmentConflicts = ports.root.querySelector<HTMLElement>("#schema-assignment-conflicts");
  const schemaAssignmentSchema = ports.root.querySelector<HTMLSelectElement>("#schema-assignment-schema");
  const schemaAssignmentDataConditions = ownedElement("#schema-assignment-data-conditions", "section");
  const importSchemaButton = ports.root.querySelector<HTMLButtonElement>("#import-schema");
  const schemaLibraryImportFile = ports.root.querySelector<HTMLInputElement>("#schema-library-import-file");
  const schemaImportReview = ownedElement("#schema-import-review", "dialog");
  const schemaImportReviewSummary = ownedElement("#schema-import-review-summary", "output");
  const replaceSchemaLibraryButton = ownedElement("#replace-schema-library", "button");
  const appendSchemaLibraryButton = ownedElement("#append-schema-library", "button");
  const cancelSchemaImportButton = ownedElement("#cancel-schema-import", "button");
  const schemaDeleteReview = ownedElement("#schema-delete-review", "dialog");
  const schemaDeleteReviewSummary = ownedElement("#schema-delete-review-summary", "output");
  const confirmSchemaDeleteButton = ownedElement("#confirm-schema-delete", "button");
  const cancelSchemaDeleteButton = ownedElement("#cancel-schema-delete", "button");
  const exportSchemaButton = ports.root.querySelector<HTMLButtonElement>("#export-schema");
  const schemaExportChoices = ownedElement("#schema-export-choices", "dialog");
  const schemaExportReview = ownedElement("#schema-export-compatibility-review", "dialog");
  if (schemaPropertyViewControls && !schemaPropertyViewControls.isConnected) {
    schemaPropertyViewControls.id = "schema-property-view-controls";
    if (schemaPropertyFilterLabel) { schemaPropertyFilterLabel.id = "schema-property-filter-label";
      schemaPropertyFilterLabel.htmlFor = "schema-property-filter"; schemaPropertyFilterLabel.textContent = "Filter properties"; }
    if (schemaPropertyFilter) { schemaPropertyFilter.id = "schema-property-filter"; schemaPropertyFilter.type = "search"; }
    if (schemaPropertySortLabel) { schemaPropertySortLabel.id = "schema-property-sort-label";
      schemaPropertySortLabel.htmlFor = "schema-property-sort"; schemaPropertySortLabel.textContent = "Sort properties"; }
    if (schemaPropertySort) { schemaPropertySort.id = "schema-property-sort";
      for (const [value, label] of [["schema", "Schema order"], ["name-asc", "Name A-Z"], ["name-desc", "Name Z-A"]] as const) {
        const option = schemaOwnerDocument?.createElement("option"); if (option) { option.value = value; option.textContent = label; schemaPropertySort.append(option); }
      } }
    if (schemaPropertyResultStatus) { schemaPropertyResultStatus.id = "schema-property-result-status";
      schemaPropertyResultStatus.setAttribute("aria-live", "polite"); }
    const propertyControls: Array<Node | null> = [schemaPropertyFilterLabel, schemaPropertyFilter, schemaPropertySortLabel,
      schemaPropertySort, schemaPropertyResultStatus];
    schemaPropertyViewControls.append(...propertyControls.filter((element): element is Node => element !== null));
    addSchemaPropertyButton?.before(schemaPropertyViewControls);
  }
  if (schemaPropertyEmpty && !schemaPropertyEmpty.isConnected) {
    schemaPropertyEmpty.id = "schema-property-empty"; schemaPropertyEmpty.hidden = true;
    if (schemaPropertyEmptyMessage) { schemaPropertyEmptyMessage.id = "schema-property-empty-message"; schemaPropertyEmpty.append(schemaPropertyEmptyMessage); }
    if (clearSchemaPropertyFilter) { clearSchemaPropertyFilter.id = "clear-schema-property-filter";
      clearSchemaPropertyFilter.type = "button"; clearSchemaPropertyFilter.textContent = "Clear filter"; schemaPropertyEmpty.append(clearSchemaPropertyFilter); }
    addSchemaPropertyButton?.before(schemaPropertyEmpty);
  }
  if (schemaPropertyTree && !schemaPropertyTree.isConnected) { schemaPropertyTree.id = "schema-property-tree";
    addSchemaPropertyButton?.after(schemaPropertyTree); }
  if (schemaPropertyCopyDialog && !schemaPropertyCopyDialog.isConnected) {
    schemaPropertyCopyDialog.id = "schema-property-copy-dialog"; schemaOwnerDocument?.body.append(schemaPropertyCopyDialog);
  }
  if (schemaPropertyRemovalDialog && !schemaPropertyRemovalDialog.isConnected) {
    schemaPropertyRemovalDialog.id = "schema-property-removal-dialog";
    if (schemaPropertyRemovalHeading) { schemaPropertyRemovalHeading.id = "schema-property-removal-heading";
      schemaPropertyRemovalHeading.textContent = "Remove property?"; schemaPropertyRemovalDialog.append(schemaPropertyRemovalHeading); }
    if (schemaPropertyRemovalSummary) { schemaPropertyRemovalSummary.id = "schema-property-removal-summary";
      schemaPropertyRemovalDialog.append(schemaPropertyRemovalSummary); }
    if (confirmSchemaPropertyRemovalButton) { confirmSchemaPropertyRemovalButton.id = "confirm-schema-property-removal";
      confirmSchemaPropertyRemovalButton.textContent = "Remove property"; schemaPropertyRemovalDialog.append(confirmSchemaPropertyRemovalButton); }
    if (cancelSchemaPropertyRemovalButton) { cancelSchemaPropertyRemovalButton.id = "cancel-schema-property-removal";
      cancelSchemaPropertyRemovalButton.textContent = "Cancel"; schemaPropertyRemovalDialog.append(cancelSchemaPropertyRemovalButton); }
    schemaOwnerDocument?.body.append(schemaPropertyRemovalDialog);
  }
  if (schemaDocumentationRemovalDialog && !schemaDocumentationRemovalDialog.isConnected) {
    schemaDocumentationRemovalDialog.id = "schema-documentation-removal-dialog";
    if (schemaDocumentationRemovalHeading) { schemaDocumentationRemovalHeading.id = "schema-documentation-removal-heading";
      schemaDocumentationRemovalHeading.textContent = "Remove property documentation?"; schemaDocumentationRemovalDialog.append(schemaDocumentationRemovalHeading); }
    if (schemaDocumentationRemovalSummary) schemaDocumentationRemovalDialog.append(schemaDocumentationRemovalSummary);
    if (confirmSchemaDocumentationRemoval) { confirmSchemaDocumentationRemoval.id = "confirm-schema-documentation-removal";
      confirmSchemaDocumentationRemoval.textContent = "Remove documentation"; schemaDocumentationRemovalDialog.append(confirmSchemaDocumentationRemoval); }
    if (cancelSchemaDocumentationRemoval) { cancelSchemaDocumentationRemoval.id = "cancel-schema-documentation-removal";
      cancelSchemaDocumentationRemoval.textContent = "Cancel"; schemaDocumentationRemovalDialog.append(cancelSchemaDocumentationRemoval); }
    schemaOwnerDocument?.body.append(schemaDocumentationRemovalDialog);
  }
  if (schemaSpecificIndexDialog && schemaSpecificIndexForm && !schemaSpecificIndexDialog.isConnected) {
    schemaSpecificIndexDialog.id = "schema-specific-index-dialog"; schemaSpecificIndexForm.id = "schema-specific-index-form";
    if (schemaSpecificIndexHeading) { schemaSpecificIndexHeading.id = "schema-specific-index-heading";
      schemaSpecificIndexHeading.textContent = "Add specific index rule"; schemaSpecificIndexForm.append(schemaSpecificIndexHeading); }
    if (schemaSpecificIndexLabel) { schemaSpecificIndexLabel.id = "schema-specific-index-label";
      schemaSpecificIndexLabel.htmlFor = "schema-specific-index"; schemaSpecificIndexLabel.textContent = "Zero-based array index"; schemaSpecificIndexForm.append(schemaSpecificIndexLabel); }
    if (schemaSpecificIndex) { schemaSpecificIndex.id = "schema-specific-index"; schemaSpecificIndex.type = "number";
      schemaSpecificIndex.min = "0"; schemaSpecificIndex.step = "1"; schemaSpecificIndexForm.append(schemaSpecificIndex); }
    if (schemaSpecificIndexAssistance) schemaSpecificIndexForm.append(schemaSpecificIndexAssistance);
    if (confirmSchemaSpecificIndex) { confirmSchemaSpecificIndex.id = "confirm-schema-specific-index";
      confirmSchemaSpecificIndex.type = "submit"; confirmSchemaSpecificIndex.textContent = "Choose rule"; schemaSpecificIndexForm.append(confirmSchemaSpecificIndex); }
    if (cancelSchemaSpecificIndex) { cancelSchemaSpecificIndex.id = "cancel-schema-specific-index";
      cancelSchemaSpecificIndex.type = "button"; cancelSchemaSpecificIndex.textContent = "Cancel"; schemaSpecificIndexForm.append(cancelSchemaSpecificIndex); }
    schemaSpecificIndexDialog.append(schemaSpecificIndexForm); schemaOwnerDocument?.body.append(schemaSpecificIndexDialog);
  }
  if (schemaManualPropertyDialog && schemaManualPropertyForm && !schemaManualPropertyDialog.isConnected) {
    schemaManualPropertyDialog.id = "schema-manual-property-dialog"; schemaManualPropertyForm.id = "schema-manual-property-form";
    const append = (element: HTMLElement | null): void => { if (element) schemaManualPropertyForm.append(element); };
    if (schemaManualPropertyHeading) { schemaManualPropertyHeading.id = "schema-manual-property-heading";
      schemaManualPropertyHeading.textContent = "Add property"; } append(schemaManualPropertyHeading);
    if (schemaManualPropertyPathLabel) { schemaManualPropertyPathLabel.id = "schema-manual-property-path-label";
      schemaManualPropertyPathLabel.htmlFor = "schema-manual-property-path"; schemaManualPropertyPathLabel.textContent = "Property path"; } append(schemaManualPropertyPathLabel);
    if (schemaManualPropertyPath) schemaManualPropertyPath.id = "schema-manual-property-path"; append(schemaManualPropertyPath);
    if (schemaManualPropertyParentContext) schemaManualPropertyParentContext.id = "schema-manual-property-parent-context"; append(schemaManualPropertyParentContext);
    if (schemaManualPropertyChildNameLabel) { schemaManualPropertyChildNameLabel.id = "schema-manual-property-child-name-label";
      schemaManualPropertyChildNameLabel.htmlFor = "schema-manual-property-child-name"; schemaManualPropertyChildNameLabel.textContent = "Child property name"; } append(schemaManualPropertyChildNameLabel);
    if (schemaManualPropertyChildName) schemaManualPropertyChildName.id = "schema-manual-property-child-name"; append(schemaManualPropertyChildName);
    if (schemaManualPropertyTypeLabel) { schemaManualPropertyTypeLabel.id = "schema-manual-property-type-label";
      schemaManualPropertyTypeLabel.htmlFor = "schema-manual-property-type"; schemaManualPropertyTypeLabel.textContent = "Value type"; } append(schemaManualPropertyTypeLabel);
    if (schemaManualPropertyType) { schemaManualPropertyType.id = "schema-manual-property-type";
      for (const type of ["string", "number", "boolean", "object", "array"] as const) { const option = schemaOwnerDocument?.createElement("option");
        if (option) { option.value = type; option.textContent = type; schemaManualPropertyType.append(option); } } } append(schemaManualPropertyType);
    if (schemaManualArrayTypeGroup) { schemaManualArrayTypeGroup.id = "schema-manual-array-type-group";
      schemaManualArrayTypeGroup.htmlFor = "schema-manual-array-item-type"; schemaManualArrayTypeGroup.textContent = "Array item type ";
      if (schemaManualArrayItemType) { schemaManualArrayItemType.id = "schema-manual-array-item-type"; schemaManualArrayTypeGroup.append(schemaManualArrayItemType); } } append(schemaManualArrayTypeGroup);
    append(schemaManualPropertyPreview); append(schemaManualPropertyAssistance);
    if (goToExistingSchemaPropertyButton) { goToExistingSchemaPropertyButton.id = "go-to-existing-schema-property"; goToExistingSchemaPropertyButton.type = "button"; } append(goToExistingSchemaPropertyButton);
    if (confirmSchemaManualPropertyButton) { confirmSchemaManualPropertyButton.id = "confirm-schema-manual-property";
      confirmSchemaManualPropertyButton.type = "submit"; confirmSchemaManualPropertyButton.textContent = "Add property"; } append(confirmSchemaManualPropertyButton);
    if (cancelSchemaManualPropertyButton) { cancelSchemaManualPropertyButton.id = "cancel-schema-manual-property";
      cancelSchemaManualPropertyButton.type = "button"; cancelSchemaManualPropertyButton.textContent = "Cancel"; } append(cancelSchemaManualPropertyButton);
    schemaManualPropertyDialog.append(schemaManualPropertyForm); schemaOwnerDocument?.body.append(schemaManualPropertyDialog);
  }
  if (schemaPropertyRulePicker && !schemaPropertyRulePicker.isConnected) {
    schemaPropertyRulePicker.id = "schema-property-rule-picker";
    schemaPropertyRulePicker.setAttribute("aria-label", "Schema property rule picker");
    schemaOwnerDocument?.body.append(schemaPropertyRulePicker);
  }
  const installRuleReviewDialog = (dialog: HTMLDialogElement | null, id: string, heading: string,
    summary: HTMLOutputElement | null, confirm: HTMLButtonElement | null, cancel: HTMLButtonElement | null,
    confirmId = `confirm-${id.replace("-review", "")}`): void => {
    if (!dialog || dialog.isConnected) return;
    dialog.id = id;
    const title = schemaOwnerDocument?.createElement("h4"); if (title) { title.textContent = heading; dialog.append(title); }
    if (summary) { summary.id = `${id}-summary`; dialog.append(summary); }
    if (confirm) { confirm.id = confirmId; confirm.type = "button"; confirm.textContent = "Confirm"; dialog.append(confirm); }
    if (cancel) { cancel.id = `cancel-${id.replace("-review", "")}`; cancel.type = "button"; cancel.textContent = "Cancel"; dialog.append(cancel); }
    schemaOwnerDocument?.body.append(dialog);
  };
  installRuleReviewDialog(schemaRuleRevisionReview, "schema-rule-revision-review", "Review rule revision",
    schemaRuleRevisionReviewSummary, confirmSchemaRuleRevisionButton, cancelSchemaRuleRevisionButton,
    "confirm-schema-rule-revision-review");
  installRuleReviewDialog(schemaRuleUpgradeReview, "schema-rule-upgrade-review", "Update pinned rule attachments",
    schemaRuleUpgradeReviewSummary, confirmSchemaRuleUpgradeButton, cancelSchemaRuleUpgradeButton);
  installRuleReviewDialog(schemaRuleSyncReview, "schema-rule-sync-review", "Sync attached schemas and publish revisions",
    schemaRuleSyncReviewSummary, confirmSchemaRuleSyncButton, cancelSchemaRuleSyncButton);
  installRuleReviewDialog(schemaRuleDeleteReview, "schema-rule-delete-review", "Delete reusable rule",
    schemaRuleDeleteReviewSummary, confirmSchemaRuleDeleteButton, cancelSchemaRuleDeleteButton);
  installRuleReviewDialog(schemaImportReview, "schema-import-review", "Import Schema Library",
    schemaImportReviewSummary, replaceSchemaLibraryButton, cancelSchemaImportButton);
  if (schemaImportReview && appendSchemaLibraryButton && !appendSchemaLibraryButton.isConnected) {
    appendSchemaLibraryButton.id = "append-schema-library"; appendSchemaLibraryButton.type = "button";
    appendSchemaLibraryButton.textContent = "Append"; schemaImportReview.append(appendSchemaLibraryButton);
  }
  installRuleReviewDialog(schemaDeleteReview, "schema-delete-review", "Delete schema",
    schemaDeleteReviewSummary, confirmSchemaDeleteButton, cancelSchemaDeleteButton);
  if (schemaExportChoices && !schemaExportChoices.isConnected) { schemaExportChoices.id = "schema-export-choices"; schemaOwnerDocument?.body.append(schemaExportChoices); }
  if (schemaExportReview && !schemaExportReview.isConnected) { schemaExportReview.id = "schema-export-compatibility-review"; schemaOwnerDocument?.body.append(schemaExportReview); }
  if (schemaAssignmentDataConditions && !schemaAssignmentDataConditions.isConnected) {
    schemaAssignmentDataConditions.id = "schema-assignment-data-conditions";
    schemaAssignmentDataConditions.setAttribute("aria-label", "Data layer conditions");
    schemaAssignmentEditor?.insertBefore(schemaAssignmentDataConditions, saveSchemaAssignmentButton);
  }
  let mounted = false;
  let lifecycleGeneration = 0;
  let unsubscribe: (() => void) | undefined;
  let unsubscribeSchemaPersistence: (() => void) | undefined;
  let schemaTreeProjectId: string | undefined;
  let schemaTreeExpandedKeys = new Set<string>();
  let schemaTreeInvokingReference: string | undefined;
  let schemaTreeRestoringScroll = false;
  let schemaTreePendingScroll: number | undefined;
  const schemaTreeStorage = ports.relationshipViewStorage;
  let activeSchemaProjectHydration: Promise<void> | undefined;
  const schemaContributorRoute = { collectionKinds:["profiles", "propertySets", "pages", "events", "flows"], includeFlowGraphs:true } as const;
  let schemaRowDisposers: (() => void)[] = [];
  let schemaRuleRowDisposers: (() => void)[] = [];
  let schemaPropertyRowDisposers: (() => void)[] = [], schemaRulePickerDisposers:(() => void)[] = [];
  const clearSchemaRowListeners = (): void => { for (const dispose of schemaRowDisposers.splice(0)) dispose(); };
  const listen = (target: HTMLElement, type: string, listener: EventListener): void => {
    target.addEventListener(type, listener); schemaRowDisposers.push(() => target.removeEventListener(type, listener));
  };
  const listenRule = (target:HTMLElement, type:string, listener:EventListener):void => {
    target.addEventListener(type, listener); schemaRuleRowDisposers.push(() => target.removeEventListener(type, listener));
  };
  const listenProperty = (target:HTMLElement, type:string, listener:EventListener):void => {
    target.addEventListener(type, listener); schemaPropertyRowDisposers.push(() => target.removeEventListener(type, listener));
  };
  const storedSchemaLibrary = ports.storage.getItem(SCHEMA_LIBRARY_STORAGE_KEY);
  let schemas = restoreSchemaLibrary(storedSchemaLibrary);
  let activeSchemaId: string | undefined;
  let schemaDraft: SchemaDefinition | undefined;
  let selectedSchemaPropertyPath = "example";
  const expandedSchemaPropertyRulePaths = new Set<string>();
  let pendingSchemaPropertyRemoval: { path:string; trigger?:HTMLButtonElement } | undefined;
  let lastSchemaPropertyRemoval: SchemaPropertyRemoval | undefined;
  let lastSchemaPropertyCopy: AppliedSchemaPropertyCopy | undefined;
  let pendingSchemaPropertyCopy: SchemaPropertyCopyPlan | undefined;
  let pendingSchemaDocumentationRemoval: { path:string; trigger?:HTMLElement } | undefined;
  let specificIndexArrayPath: string | undefined;
  let specificIndexTrigger: HTMLButtonElement | undefined;
  let pendingManualPropertyContext: { parentPath:string; trigger?:HTMLButtonElement } | undefined;
  let pendingManualPropertyCanonicalBase: CanonicalSchemaDocument | undefined;
  let pendingSchemaRestoration: { schemaId:string; version:number } | undefined;
  const MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY = "my-chrome-utilities.manual-schema-overrides.v1";
  let manualSchemaOverrides: Record<string, string> = (() => { try { const parsed = JSON.parse(ports.storage.getItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {}; } catch { return {}; } })();
  let schemaRulePickerPath: string | undefined;
  let schemaRulePickerTrigger: HTMLButtonElement | undefined;
  let schemaPropertyInteractionReturn: { schemaId:string; path:string; triggerLabel:string;
    editorScroll:number; treeScroll:number; detailScroll:number } | undefined;
  let schemaPropertyRenderSequence = 0, schemaRulePickerSearch = "";
  let schemaRuleConfiguration: RuleConfiguration | undefined;
  let editingAttachedLocalRule: NonNullable<SchemaDefinition["attachedRules"]>[number] | undefined;
  const normalizeReusableSchemaRule = (value:unknown):ReusableSchemaRule | undefined => value && typeof value === "object"
    && "id" in value && "name" in value && "kind" in value && "version" in value
    ? { ...(structuredClone(value) as ReusableSchemaRule), enabled:(value as ReusableSchemaRule).enabled !== false } : undefined;
  const storedReusableSchemaRules = ports.storage.getItem(SCHEMA_RULE_STORAGE_KEY);
  let reusableSchemaRules: ReusableSchemaRule[] = (() => { try {
    const stored = JSON.parse(storedReusableSchemaRules ?? "[]") as unknown;
    return Array.isArray(stored) ? stored.map(normalizeReusableSchemaRule).filter((rule): rule is ReusableSchemaRule => Boolean(rule)) : [];
  } catch { return []; } })();
  let editingReusableSchemaRuleId: string | undefined;
  let approvedRuleRevisionId: string | undefined;
  let approvedRuleAttachmentUpdateId: string | undefined;
  let pendingRuleSnapshotMetadata: { id:string; version:number; attachments:readonly string[] } | undefined;
  let pendingSchemaRuleRevision: { id:string; changes:Partial<Omit<ReusableSchemaRule, "id" | "version" | "revisionHistory">> } | undefined;
  let pendingSchemaRuleUpgrade: { id:string; schemaIds:readonly string[] } | undefined;
  let pendingSchemaRuleSync: { rule:ReusableSchemaRule; review:ReusableRuleSyncReview } | undefined;
  let pendingReusableSchemaRuleDeletionId: string | undefined;
  let editingSchemaAssignment: { schemaId:string; assignmentId?:string } | undefined;
  let schemaAssignmentConditionState: AssignmentDataConditionEditorState = { target:"payload", suggestions:[] };
  let pendingSchemaImport: { schemas:SchemaDefinition[]; rules:ReusableSchemaRule[] } | undefined;
  let pendingSchemaDeletion: SchemaDefinition | undefined;
  const localRulePromotionDialog = ports.localRulePromotionDialog;
  let pendingLocalRulePromotion: { propertyPath:string; sourceRuleId:string; generation:number } | undefined;
  interface PendingSchemaPersistence {
    schemaId:string; generation:number; kind:"promotion" | "guided"; paused:boolean; settled:boolean;
    previousSchemas:readonly SchemaDefinition[]; previousRules:readonly ReusableSchemaRule[];
    nextSchemas:readonly SchemaDefinition[]; nextRules:readonly ReusableSchemaRule[];
    complete():void; reject(error:unknown):void; pause():void;
  }
  let pendingLocalRulePromotionPersistence: PendingSchemaPersistence | undefined;
  let pendingGuidedValidationPersistence: PendingSchemaPersistence | undefined;
  let guidedContinuationSelections:GuidedContinuationSelections = restoreGuidedContinuationSelections(ports.storage.getItem(GUIDED_CONTINUATION_STORAGE_KEY));
  let guidedPropertyReturn: { schemaId:string; propertyPath:string; generation:number } | undefined;
  const SCHEMA_VALIDATION_RECORD_STORAGE_KEY = "my-chrome-utilities.schema-validation-records.v1";
  let schemaValidationRecords: SchemaValidationRecord[] = (() => { try { const parsed = JSON.parse(ports.storage.getItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : []; } catch { return []; } })();
  let capturedContinuationRowDisposers:(() => void)[] = [];
  let capturedContinuationDialogDisposers:(() => void)[] = [];
  let persistenceGeneration = 0;
  let schemaExportTrigger: HTMLButtonElement | undefined;
  let pendingStandardSchemaExport: { scope:"library" | "schema"; schema?:SchemaDefinition; review:JsonSchemaCompatibilityReview } | undefined;
  let savedCanonicalDocument: CanonicalSchemaDocument | undefined;
  let compactCanonicalEditor: CompactCanonicalEditorAdapter | undefined;
  let compactCanonicalPendingCommand: CompactCanonicalCommand | undefined;
  let compactCanonicalPendingBase: CanonicalSchemaDocument | undefined;
  let compactCanonicalReviewVisible = false;
  const compactCanonicalRevisionSnapshots = new Map<number, CanonicalSchemaDocument>();
  let compactCanonicalCommandFeedback: string | undefined;
  let compactCanonicalSettlementSequence = 0;
  let compactCanonicalSettlementPending = false;
  let compactCanonicalProjectionRequest: CompactCanonicalProjectionPersistenceRequest | undefined;
  let compactCanonicalProjectionWorker: CompactCanonicalProjectionWorker | undefined;
  let compactCanonicalReopenSelection: string | undefined;
  const compactCanonicalScrollByKey = new Map<string, number>();
  let compactCanonicalHistoryState = compactCanonicalHistorySettlement();
  let compactCanonicalPendingHistoryLabel: string | undefined;
  let compactCanonicalPresenceDraft: { propertyId:string; baseRevision:number; mode:string } | undefined;
  let compactCanonicalContextDisposers:(() => void)[] = [];
  let compactCanonicalPropertyMenuId:string | undefined;
  let compactCanonicalTableHost:HTMLElement | undefined;
  let compactCanonicalTableEditor:ReturnType<typeof mountCanonicalSchemaEditor> | undefined;
  let compactCanonicalTableKey:string | undefined;
  const compactCanonicalProjection = (adapter:CompactCanonicalEditorAdapter, canonical=adapter.load()):SchemaDefinition =>
    adapter.projection?.(canonical) ?? compactSchemaProjection(canonical, { id:canonical.contributorId, name:canonical.contributorName, version:canonical.revision });
  const compactCanonicalFacetText = (canonical:CanonicalSchemaDocument, node:CanonicalSchemaDocument["nodes"][string]):string => {
    const allowed = node.allowedValues.length ? node.allowedValues.map(({ value }) => String(value)).join(", ") : "none";
    return `Canonical facets · type ${node.type} · presence ${node.presence.mode} · allowed values ${allowed} · revision ${canonical.revision}`;
  };
  const beginCompactCanonicalPendingHistory = (projectId:string, editorKey:string, label:string,
    history:ReturnType<typeof compactCanonicalHistorySettlement>["history"]):CompactCanonicalHistoryTransitionIdentity => {
    const identity = { operationId:`schema-history:${++compactCanonicalSettlementSequence}`, projectId, editorKey };
    compactCanonicalHistoryState = beginCompactCanonicalHistoryTransition(compactCanonicalHistoryState, { ...identity, history });
    compactCanonicalPendingHistoryLabel = label; return identity;
  };
  const completeCompactCanonicalPendingHistory = (identity:CompactCanonicalHistoryTransitionIdentity):void => {
    compactCanonicalHistoryState = completeCompactCanonicalHistoryTransition(compactCanonicalHistoryState, identity);
    if (!compactCanonicalHistoryState.pending) compactCanonicalPendingHistoryLabel = undefined;
  };
  const rejectCompactCanonicalPendingHistory = (identity:CompactCanonicalHistoryTransitionIdentity):void => {
    compactCanonicalHistoryState = rejectCompactCanonicalHistoryTransition(compactCanonicalHistoryState, identity);
    if (!compactCanonicalHistoryState.pending) compactCanonicalPendingHistoryLabel = undefined;
  };
  const compactCanonicalPendingHistoryFor = (projectId:string, label:string):CompactCanonicalHistoryTransitionIdentity | undefined => {
    const pending = compactCanonicalHistoryState.pending;
    return pending && pending.projectId === projectId && compactCanonicalPendingHistoryLabel === label
      ? { operationId:pending.operationId, projectId:pending.projectId, editorKey:pending.editorKey } : undefined;
  };
  const compactCanonicalSemanticUnresolved = (owned?:CompactCanonicalProjectionPersistenceRequest):boolean => Boolean(
    compactCanonicalSettlementPending || compactCanonicalHistoryState.pending || compactCanonicalPendingCommand
    || (compactCanonicalProjectionWorker && compactCanonicalProjectionWorker.adapter !== owned?.adapter)
    || (compactCanonicalProjectionRequest && compactCanonicalProjectionRequest !== owned));
  const compactCanonicalProjectionQueueUnavailable = (adapter:CompactCanonicalEditorAdapter):boolean => Boolean(
    compactCanonicalHistoryState.pending || compactCanonicalPendingCommand
    || (compactCanonicalProjectionWorker && compactCanonicalProjectionWorker.adapter !== adapter)
    || (compactCanonicalProjectionRequest && compactCanonicalProjectionRequest.adapter !== adapter));
  const renderCompactCanonicalContext = ():void => {
    if (!compactCanonicalContext) return;
    for (const dispose of compactCanonicalContextDisposers.splice(0)) dispose();
    const adapter = compactCanonicalEditor; compactCanonicalContext.hidden = !adapter; compactCanonicalContext.replaceChildren();
    if (!adapter || !schemaOwnerDocument) return;
    const identity = schemaOwnerDocument.createElement("p"), feedback = schemaOwnerDocument.createElement("output");
    identity.textContent = `${adapter.label} · revision ${adapter.load().revision}`;
    feedback.textContent = compactCanonicalCommandFeedback ?? "Canonical editor ready.";
    compactCanonicalContext.append(identity, feedback);
    const own = (control:HTMLElement, action:EventListener, type="click"):void => { compactCanonicalContextDisposers.push(() => control.removeEventListener(type, action)); };
    if (adapter.onUndo) { const undo = schemaOwnerDocument.createElement("button"), action = ():void => adapter.onUndo?.(); undo.type = "button"; undo.textContent = "Undo";
      undo.addEventListener("click", action); own(undo, action); compactCanonicalContext.append(undo); }
    if (adapter.onRedo) { const redo = schemaOwnerDocument.createElement("button"), action = ():void => adapter.onRedo?.(); redo.type = "button"; redo.textContent = "Redo";
      redo.addEventListener("click", action); own(redo, action); compactCanonicalContext.append(redo); }
    for (const configured of adapter.actions ?? []) { const contextAction = schemaOwnerDocument.createElement("button"), action = ():void => configured.run();
      contextAction.type = "button"; contextAction.textContent = configured.label; contextAction.addEventListener("click", action); own(contextAction, action); compactCanonicalContext.append(contextAction); }
    const tableControl = schemaOwnerDocument.createElement("button"), treeControl = schemaOwnerDocument.createElement("button");
    tableControl.type = treeControl.type = "button"; tableControl.textContent = "Table"; treeControl.textContent = "Tree";
    const showTable = ():void => { const current = adapter.load(); void dispatchCompactCanonicalCommand({ kind:"view", baseRevision:current.revision, view:"table" }); };
    const showTree = ():void => { const current = adapter.load(); void dispatchCompactCanonicalCommand({ kind:"view", baseRevision:current.revision, view:"tree" }); };
    tableControl.addEventListener("click", showTable); treeControl.addEventListener("click", showTree); own(tableControl, showTable); own(treeControl, showTree);
    compactCanonicalContext.append(tableControl, treeControl);
    adapter.renderContext?.(compactCanonicalContext);
    if (adapter.migration) {
      const migration = adapter.migration, review = schemaOwnerDocument.createElement("section"), summary = schemaOwnerDocument.createElement("p"),
        cancel = schemaOwnerDocument.createElement("button"), confirm = schemaOwnerDocument.createElement("button");
      review.setAttribute("aria-label", "Canonical schema migration review"); summary.textContent = migration.summary;
      for (const conflict of migration.conflicts) { const resolution = schemaOwnerDocument.createElement("select");
        resolution.setAttribute("aria-label", conflict.label); resolution.append(...conflict.choices.map(({ id, label }) => {
          const option = schemaOwnerDocument!.createElement("option"); option.value = id; option.textContent = label; return option; }));
        const select = ():void => { if (resolution.value) migration.resolve(conflict.id, resolution.value); };
        resolution.addEventListener("change", select); own(resolution, select, "change"); review.append(resolution); }
      cancel.type = confirm.type = "button"; cancel.textContent = "Cancel migration"; confirm.textContent = "Confirm canonical migration";
      confirm.disabled = migration.conflicts.length > 0;
      const cancelMigration = ():void => { migration.cancel(); renderCompactCanonicalContext(); };
      const confirmMigration = ():void => { const generation = lifecycleGeneration; confirm.disabled = true;
        void migration.confirm().then(() => { if (mounted && generation === lifecycleGeneration && compactCanonicalEditor === adapter) renderCompactCanonicalContext(); },
          () => { if (mounted && generation === lifecycleGeneration && compactCanonicalEditor === adapter) { confirm.disabled = false; renderCompactCanonicalContext(); } }); };
      cancel.addEventListener("click", cancelMigration); confirm.addEventListener("click", confirmMigration);
      own(cancel, cancelMigration); own(confirm, confirmMigration); review.append(summary, cancel, confirm); compactCanonicalContext.append(review);
    }
    if (compactCanonicalPropertyMenuId && adapter.load().nodes[compactCanonicalPropertyMenuId]) {
      const propertyId = compactCanonicalPropertyMenuId;
      for (const [label, action, value] of [
        ["Add child", "add-child"], ["Clear example", "no-example"], ["Use custom example", "custom-example", "example"],
        ["Save documentation", "documentation", "Documented property"], ["Required", "presence", "required"],
        ["Rename", "rename", `${adapter.load().nodes[propertyId]!.name} renamed`], ["Move to root", "move"], ["Duplicate", "duplicate"],
        ["Save expected value", "expected", "expected"], ["Reset expected value", "reset-expected"], ["View", "view"], ["Remove", "remove"],
      ] as const) { const compactPropertyControl = schemaOwnerDocument.createElement("button"), run = ():void => { void compactCanonicalPropertyAction(propertyId, action, value); };
        compactPropertyControl.type = "button"; compactPropertyControl.textContent = label; compactPropertyControl.addEventListener("click", run);
        own(compactPropertyControl, run); compactCanonicalContext.append(compactPropertyControl); }
    }
    if (compactCanonicalPendingCommand) {
      const compare = schemaOwnerDocument.createElement("button"), retry = schemaOwnerDocument.createElement("button"), reject = schemaOwnerDocument.createElement("button");
      compare.type = retry.type = reject.type = "button"; compare.textContent = "Compare latest property"; retry.textContent = "Retry local edit"; reject.textContent = "Reject local edit";
      const compareLatest = ():void => { compactCanonicalReviewVisible = true; const base = compactCanonicalPendingBase, latest = adapter.load();
        compactCanonicalCommandFeedback = `Comparing command base revision ${base?.revision ?? "unknown"} with latest revision ${latest.revision}.`; renderCompactCanonicalContext(); };
      compare.addEventListener("click", compareLatest); retry.addEventListener("click", retryCompactCanonicalCommand); reject.addEventListener("click", rejectCompactCanonicalCommand);
      own(compare, compareLatest); own(retry, retryCompactCanonicalCommand); own(reject, rejectCompactCanonicalCommand); compactCanonicalContext.append(compare, retry, reject);
    }
  };
  function removeCompactCanonicalTableEditor():void {
    compactCanonicalTableHost?.replaceChildren(); compactCanonicalTableHost?.remove();
    compactCanonicalTableHost = undefined; compactCanonicalTableEditor = undefined; compactCanonicalTableKey = undefined;
  }
  function renderCompactCanonicalEditor():void {
    renderCompactCanonicalContext();
    const adapter = compactCanonicalEditor;
    if (!adapter || !schemaEditor || !schemaOwnerDocument) { removeCompactCanonicalTableEditor(); return; }
    if (!compactCanonicalTableHost?.isConnected) {
      compactCanonicalTableHost = schemaOwnerDocument.createElement("section");
      compactCanonicalTableHost.id = "compact-canonical-table-editor"; schemaEditor.append(compactCanonicalTableHost);
      compactCanonicalTableEditor = undefined; compactCanonicalTableKey = undefined;
    }
    if (!compactCanonicalTableEditor || compactCanonicalTableKey !== adapter.key) {
      compactCanonicalTableHost.replaceChildren(); compactCanonicalTableKey = adapter.key;
      const createEditor = ports.createCanonicalTableEditor ?? mountCanonicalSchemaEditor;
      compactCanonicalTableEditor = createEditor({ host:compactCanonicalTableHost, surface:"Side panel",
        conceptSuggestions:ports.canonicalConceptSuggestions, load:adapter.load, id:(kind) => `${kind}:${crypto.randomUUID()}`,
        dispatch:(command) => beginCompactCanonicalCommand(command)?.result
          ?? blockedCompactCanonicalCommand(adapter, command, "The canonical editor is no longer available."),
        ...(adapter.onUndo ? { onUndo:adapter.onUndo } : {}), ...(adapter.onRedo ? { onRedo:adapter.onRedo } : {}) });
    } else compactCanonicalTableEditor.render();
    compactCanonicalTableHost.hidden = adapter.load().view !== "table";
  }
  const blockedCompactCanonicalCommand = (adapter:CompactCanonicalEditorAdapter, command:CompactCanonicalCommand, message:string):CompactCanonicalCommandResult =>
    ({ status:"conflict", document:adapter.load(), ...(command.kind !== "policy" && "propertyId" in command ? { propertyId:command.propertyId } : {}), message });
  const beginCompactCanonicalCommand = (command:CompactCanonicalCommand, owned?:CompactCanonicalProjectionPersistenceRequest):{ accepted:boolean; result:CompactCanonicalCommandResult; completion:Promise<boolean> } | undefined => {
    const adapter = compactCanonicalEditor; if (!adapter) return;
    const policy = compactCanonicalCommandPolicy(command.kind, compactCanonicalSemanticUnresolved(owned));
    if (!policy.allowed) { const message = "Resolve the current durable schema save through Retry or Reject before another semantic change.";
      compactCanonicalCommandFeedback = message; renderCompactCanonicalContext();
      return { accepted:false, result:blockedCompactCanonicalCommand(adapter, command, message), completion:Promise.resolve(false) }; }
    const before = structuredClone(adapter.load()); compactCanonicalRevisionSnapshots.set(before.revision, before);
    let result:CompactCanonicalCommandResult;
    try { result = adapter.dispatch(command); } catch (error) { const message = `The canonical command was not applied. ${error instanceof Error ? error.message : String(error)}`;
      compactCanonicalCommandFeedback = message; renderCompactCanonicalContext();
      return { accepted:false, result:blockedCompactCanonicalCommand(adapter, command, message), completion:Promise.resolve(false) }; }
    if (result.status === "conflict" || result.status === "confirmation-required") {
      compactCanonicalPendingCommand = command; compactCanonicalPendingBase = before; compactCanonicalReviewVisible = false;
      compactCanonicalCommandFeedback = result.status === "conflict" ? result.message : result.impact; renderCompactCanonicalContext();
      return { accepted:false, result, completion:Promise.resolve(false) };
    }
    if (policy.semantic) { compactCanonicalPendingCommand = undefined; compactCanonicalPendingBase = undefined;
      compactCanonicalReviewVisible = false; compactCanonicalPresenceDraft = undefined; }
    compactCanonicalCommandFeedback = canonicalCommandOutcome(command, result, before); renderCompactCanonicalContext();
    const settlement = policy.settles && adapter.settle && (adapter.settles?.(command) ?? true) ? ++compactCanonicalSettlementSequence : undefined;
    if (!settlement || !adapter.settle) return { accepted:true, result, completion:Promise.resolve(true) };
    compactCanonicalSettlementPending = true; const generation = lifecycleGeneration;
    const completion = adapter.settle().then(() => { adapter.onSettlementCommitted?.();
      if (mounted && generation === lifecycleGeneration && settlement === compactCanonicalSettlementSequence) {
        compactCanonicalSettlementPending = false; compactCanonicalCommandFeedback = `Committed to ${adapter.settlementTarget ?? "durable Saved Draft"}.`; renderCompactCanonicalContext(); }
      return true;
    }, (error) => { if (mounted && generation === lifecycleGeneration && settlement === compactCanonicalSettlementSequence) {
      compactCanonicalSettlementPending = false; compactCanonicalPendingCommand = command; compactCanonicalPendingBase = before;
      compactCanonicalCommandFeedback = `Not saved; Retry or Reject. ${error instanceof Error ? error.message : String(error)}`; renderCompactCanonicalContext(); }
      return false; });
    return { accepted:true, result, completion };
  };
  const dispatchCompactCanonicalCommand = async (command:CompactCanonicalCommand, owned?:CompactCanonicalProjectionPersistenceRequest):Promise<boolean> => {
    const dispatch = beginCompactCanonicalCommand(command, owned); return Boolean(dispatch?.accepted && await dispatch.completion);
  };
  const beginCompactCanonicalProjectionPersistence = (adapter:CompactCanonicalEditorAdapter, projection:SchemaDefinition, change?:string):Promise<boolean> => {
    if (!adapter.persistProjection) return Promise.resolve(true);
    compactCanonicalProjectionRequest = { adapter, projection:structuredClone(projection), ...(change ? { change } : {}) };
    if (compactCanonicalProjectionWorker?.adapter === adapter) return compactCanonicalProjectionWorker.promise;
    compactCanonicalSettlementPending = true; const generation = lifecycleGeneration;
    const worker:CompactCanonicalProjectionWorker = { adapter, promise:Promise.resolve(false) }; compactCanonicalProjectionWorker = worker;
    worker.promise = (async () => { let committed = false;
      try { while (mounted && generation === lifecycleGeneration && compactCanonicalEditor === adapter) {
        const request = compactCanonicalProjectionRequest; if (!request || request.adapter !== adapter) break;
        compactCanonicalProjectionRequest = undefined; if (!adapter.persistProjection!(structuredClone(request.projection), request.change)) continue;
        await adapter.settle?.(); adapter.onSettlementCommitted?.(); committed = true;
      } compactCanonicalCommandFeedback = committed ? `Saved to ${adapter.settlementTarget ?? "durable Saved Draft"}.` : "Projection already current."; return true;
      } catch (error) { compactCanonicalCommandFeedback = `Projection not saved; Retry or Reject. ${error instanceof Error ? error.message : String(error)}`; return false;
      } finally { if (compactCanonicalProjectionWorker === worker) { compactCanonicalProjectionWorker = undefined; compactCanonicalSettlementPending = false; renderCompactCanonicalContext(); } }
    })(); return worker.promise;
  };
  const persistCompactCanonicalProjection = async (adapter:CompactCanonicalEditorAdapter, projection:SchemaDefinition, change?:string):Promise<boolean> => {
    const commands = canonicalCommandsFromCompactProjection(adapter.load(), projection, (kind) => `schema:${kind}:${++compactCanonicalSettlementSequence}`);
    for (const command of commands) if (!await dispatchCompactCanonicalCommand({ ...command, baseRevision:adapter.load().revision }, compactCanonicalProjectionRequest)) return false;
    return beginCompactCanonicalProjectionPersistence(adapter, projection, change);
  };
  const discardCompactCanonicalProjectionPersistence = (adapter?:CompactCanonicalEditorAdapter):void => {
    if (!adapter || compactCanonicalProjectionRequest?.adapter === adapter) compactCanonicalProjectionRequest = undefined;
    compactCanonicalSettlementPending = false; compactCanonicalSettlementSequence += 1;
  };
  function resumeCompactCanonicalProjectionPersistence(adapter:CompactCanonicalEditorAdapter):Promise<boolean> {
    const request = compactCanonicalProjectionRequest; return request?.adapter === adapter
      ? persistCompactCanonicalProjection(adapter, request.projection, request.change) : Promise.resolve(true);
  }
  const compactCanonicalCommandScope = (command:CompactCanonicalCommand, document:CanonicalSchemaDocument):string =>
    "propertyId" in command ? document.nodes[command.propertyId]?.name ?? command.propertyId : command.kind;
  function retryCompactCanonicalCommand():void { const command = compactCanonicalPendingCommand, adapter = compactCanonicalEditor; if (!command || !adapter) return;
    compactCanonicalPendingCommand = undefined; if (compactCanonicalProjectionRequest?.adapter === adapter) { void resumeCompactCanonicalProjectionPersistence(adapter); return; }
    void dispatchCompactCanonicalCommand({ ...command, baseRevision:adapter.load().revision }).then(renderCompactCanonicalEditor); }
  function rejectCompactCanonicalCommand():void { compactCanonicalPendingCommand = undefined; compactCanonicalPendingBase = undefined;
    compactCanonicalReviewVisible = false; compactCanonicalProjectionRequest = undefined; compactCanonicalCommandFeedback = "Local edit rejected; durable state is unchanged."; renderCompactCanonicalContext(); }
  async function compactCanonicalPropertyAction(propertyId:string, action:"add-child"|"no-example"|"custom-example"|"documentation"|"presence"|"rename"|"move"|"duplicate"|"expected"|"reset-expected"|"view"|"remove", value?:string):Promise<boolean> {
    const adapter = compactCanonicalEditor, document = adapter?.load(), node = document?.nodes[propertyId]; if (!adapter || !document || !node) return false;
    const baseRevision = document.revision;
    if (action === "add-child") return dispatchCompactCanonicalCommand({ kind:"add", baseRevision, parentId:propertyId, name:"New child", type:"string", id:() => ports.createRuleId() });
    if (action === "rename") return dispatchCompactCanonicalCommand({ kind:"rename", baseRevision, propertyId, name:value?.trim() || node.name });
    if (action === "move") return dispatchCompactCanonicalCommand({ kind:"move", baseRevision, propertyId });
    if (action === "duplicate") return dispatchCompactCanonicalCommand({ kind:"duplicate", baseRevision, propertyId, id:() => ports.createRuleId() });
    if (action === "view") return dispatchCompactCanonicalCommand({ kind:"select", baseRevision, propertyId });
    if (action === "remove") return dispatchCompactCanonicalCommand({ kind:"delete", baseRevision, propertyId });
    if (action === "presence") return dispatchCompactCanonicalCommand({ kind:"set", baseRevision, propertyId,
      patch:{ presence:{ ...node.presence, mode:(value || "optional") as typeof node.presence.mode } } });
    if (action === "documentation") return dispatchCompactCanonicalCommand({ kind:"set", baseRevision, propertyId,
      patch:{ documentation:{ ...node.documentation, description:value ?? node.documentation.description } } });
    if (action === "no-example") return dispatchCompactCanonicalCommand({ kind:"set", baseRevision, propertyId,
      patch:{ documentation:{ ...node.documentation, example:{ method:"blank" } } } });
    if (action === "custom-example") return dispatchCompactCanonicalCommand({ kind:"set", baseRevision, propertyId,
      patch:{ documentation:{ ...node.documentation, example:{ method:"custom", value } } } });
    return dispatchCompactCanonicalCommand({ kind:"set", baseRevision, propertyId,
      patch:{ expectedValue:action === "expected" ? value : undefined } });
  }
  const openCompactCanonicalEditor = (adapter:CompactCanonicalEditorAdapter):void => {
    compactCanonicalEditor = adapter; compactCanonicalReopenSelection = adapter.key; compactCanonicalCommandFeedback = undefined;
    compactCanonicalRevisionSnapshots.clear(); compactCanonicalRevisionSnapshots.set(adapter.load().revision, structuredClone(adapter.load()));
    if (schemaDetail) schemaDetail.scrollTop = compactCanonicalScrollByKey.get(adapter.key) ?? 0; renderCompactCanonicalEditor();
  };
  const closeCompactCanonicalEditor = ():void => { if (compactCanonicalEditor && schemaDetail) compactCanonicalScrollByKey.set(compactCanonicalEditor.key, schemaDetail.scrollTop);
    discardCompactCanonicalProjectionPersistence(compactCanonicalEditor); compactCanonicalEditor = undefined; removeCompactCanonicalTableEditor(); compactCanonicalContext && (compactCanonicalContext.hidden = true); };
  const persistSavedCanonicalResult = (schemaId:string, canonical:CanonicalSchemaDocument, change:string):void => {
    const stored = schemas.find(({ id }) => id === schemaId); if (!stored) throw new Error("The saved schema is unavailable.");
    const draft = schemaEditorDraft(stored), projection = savedCompactCanonicalProjection(schemaId, canonical);
    const updated = updateSchemaWorkingDraft(proposeSchemaWorkingDraftName(stored, projection.name), {
      document:projection.document, assignments:projection.assignments, attachedRules:projection.attachedRules,
      parentSchemaId:projection.parentSchemaId, inheritedRuleOverrides:projection.inheritedRuleOverrides,
      documentation:projection.documentation, canonicalSchema:canonical }, change);
    schemas = schemas.map((candidate) => candidate.id === schemaId ? updated : candidate); savedCanonicalDocument = canonical; persistSchemaLibrary();
  };
  const persistSavedProjectionMetadata = (schemaId:string, projection:SchemaDefinition, change?:string):boolean => {
    const stored = schemas.find(({ id }) => id === schemaId); if (!stored) throw new Error("The saved schema is unavailable.");
    const canonical = savedCanonicalDocument; const updated = updateSchemaWorkingDraft(proposeSchemaWorkingDraftName(stored, projection.name), {
      document:projection.document, assignments:projection.assignments, attachedRules:projection.attachedRules,
      parentSchemaId:projection.parentSchemaId, inheritedRuleOverrides:projection.inheritedRuleOverrides,
      documentation:projection.documentation, ...(canonical ? { canonicalSchema:{ ...canonical, contributorName:projection.name } } : {}) }, change);
    if (JSON.stringify(updated) === JSON.stringify(stored)) return false;
    schemas = schemas.map((candidate) => candidate.id === schemaId ? updated : candidate);
    if (canonical) savedCanonicalDocument = { ...canonical, contributorName:projection.name }; persistSchemaLibrary(); return true;
  };
  const savedCompactCanonicalProjection = (schemaId:string, canonical:CanonicalSchemaDocument):SchemaDefinition => {
    const stored = schemas.find(({ id }) => id === schemaId);
    return stored ? compactCanonicalProjection({ key:`saved:${schemaId}`, label:stored.name, load:() => canonical,
      dispatch:(command) => applyCanonicalCommand(canonical, command), projection:(document) => compactSchemaProjection(document, { id:stored.id, name:document.contributorName, version:stored.version }) }, canonical)
      : compactSchemaProjection(canonical, { id:canonical.contributorId, name:canonical.contributorName, version:canonical.revision });
  };
  const openSavedSchemaInUnifiedEditor = (schema:SchemaDefinition):void => {
    schemaDraft = schemaEditorDraft(schema); savedCanonicalDocument = savedSchemaCanonicalDocument(schemaDraft, (kind) => `schema:${kind}:${++compactCanonicalSettlementSequence}`);
    const adapter:CompactCanonicalEditorAdapter = { key:`saved:${schema.id}`, label:`${schema.name} · Saved schema working draft`,
      load:() => savedCanonicalDocument!, projection:(canonical) => savedCompactCanonicalProjection(schema.id, canonical),
      dispatch:(command) => { const result = applyCanonicalCommand(savedCanonicalDocument!, command);
        if (result.status === "applied" || result.status === "rebased") {
          savedCanonicalDocument = result.document;
          if (command.kind !== "select" && command.kind !== "view") persistSavedCanonicalResult(schema.id, result.document, `${command.kind} canonical property`);
        } return result; },
      persistProjection:(projection, change) => persistSavedProjectionMetadata(schema.id, projection, change),
      settle:() => ports.settleCanonical?.(schema.id) ?? Promise.resolve(), settles:(command) => command.kind !== "select" && command.kind !== "view",
      settlementTarget:"durable Saved Schema Library" };
    openCompactCanonicalEditor(adapter);
  };
  const activeIndex = (): number => schemas.findIndex(({ id }) => id === activeSchemaId);
  const active = (): SchemaDefinition => {
    const schema = schemas[activeIndex()];
    if (!schema) throw new Error("Open a schema before editing its draft");
    return schema;
  };
  const persistSchemaLibrary = (): void => {
    ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(schemas));
    ports.changed(schemas);
  };
  const replaceActive = (schema: SchemaDefinition): void => {
    const index = activeIndex(); if (index < 0) throw new Error("Open a schema before editing its draft");
    schemas = schemas.map((candidate, candidateIndex) => candidateIndex === index ? schema : candidate);
    schemaDraft = structuredClone(schema);
  };
  const revisionVersion = (): number => Number(schemaRevisionSelector?.value || active().version);
  const renderSchemaPropertyView = (): void => {
    for (const dispose of schemaPropertyRowDisposers.splice(0)) dispose();
    const schema = activeSchemaId ? active() : undefined;
    const rows = schema ? schemaPropertyRows(schema.workingDraft?.document ?? schema.document) : [];
    const propertyView = filterAndSortSchemaPropertyRows(rows, schemaPropertyFilter?.value ?? "",
      (schemaPropertySort?.value || "schema") as SchemaPropertySortOrder);
    if (schemaPropertyResultStatus) schemaPropertyResultStatus.textContent = `${propertyView.matchCount} of ${propertyView.totalCount} properties`;
    if (schemaPropertyEmpty) schemaPropertyEmpty.hidden = propertyView.rows.length > 0;
    if (schemaPropertyEmptyMessage) schemaPropertyEmptyMessage.textContent = propertyView.rows.length
      ? "" : `No properties match ${schemaPropertyFilter?.value.trim() ?? ""}`;
    if (schemaPropertyTree) {
      const items = propertyView.rows.flatMap((row) => { const item = schemaOwnerDocument?.createElement("li");
        if (!item) return []; item.dataset.propertyPath = row.canonicalPath; const summary = schemaOwnerDocument!.createElement("span"); summary.textContent = row.displayPath; item.append(summary);
        const propertyAction = (label:string, run:(button:HTMLButtonElement) => void) => { const button = schemaOwnerDocument!.createElement("button");
          button.type = "button"; button.textContent = label; button.setAttribute("aria-label", `${label} ${row.canonicalPath}`);
          listenProperty(button, "click", () => run(button)); item.append(button); };
        propertyAction("View", () => { selectedSchemaPropertyPath = row.canonicalPath.slice(1).replaceAll("/", "."); });
        propertyAction("Add child", (button) => openContextualManualPropertyForm(row.canonicalPath, button));
        propertyAction("Edit rules", (button) => openSchemaPropertyRulePicker(row.canonicalPath, button));
        propertyAction("Copy", () => { const destination = schemas.find(({ id }) => id !== schema?.id); if (destination) openSchemaPropertyCopyReview(row.canonicalPath, destination.id); });
        propertyAction("Remove", (button) => requestSchemaPropertyRemoval(row.canonicalPath, button));
        propertyAction("Remove documentation", (button) => requestSchemaDocumentationRemoval(row.canonicalPath, button));
        if (row.schema.type === "array") propertyAction("Add specific index", (button) => openSpecificIndexDialog(row.canonicalPath, button));
        propertyAction(expandedSchemaPropertyRulePaths.has(row.canonicalPath) ? "Hide rules" : "Show rules", () => {
          if (expandedSchemaPropertyRulePaths.has(row.canonicalPath)) expandedSchemaPropertyRulePaths.delete(row.canonicalPath); else expandedSchemaPropertyRulePaths.add(row.canonicalPath); renderSchemaPropertyView(); });
        for (const attached of (schema?.workingDraft?.attachedRules ?? schema?.attachedRules ?? []).filter(({ propertyPath }) => normalizedRulePickerPath(propertyPath ?? "") === row.canonicalPath)) {
          if (attached.id.startsWith("local:")) propertyAction("Promote local rule", () => { openLocalRulePromotionReview(row.canonicalPath, attached.id); });
          propertyAction("Edit attached rule", () => { editingAttachedLocalRule = attached; openSchemaPropertyRulePicker(row.canonicalPath); });
        }
        return [item]; });
      schemaPropertyTree.replaceChildren(...items);
    }
    if (addSchemaPropertyButton) addSchemaPropertyButton.disabled = !schema;
  };
  function renderSchemaDraft(): void {
    const schema = activeSchemaId ? active() : undefined;
    const draft = schema?.workingDraft;
    const presented = schema ? schemaEditorDraft(schema) : undefined;
    if (schemaEditor) schemaEditor.hidden = !schema;
    if (schemaDetail) schemaDetail.hidden = !schema;
    if (schemaDetailEmpty) schemaDetailEmpty.hidden = Boolean(schema);
    if (schemaEditorName) schemaEditorName.value = draft?.name ?? schema?.name ?? "";
    if (schemaEditorDescription) schemaEditorDescription.value = draft?.documentation?.description
      ?? schema?.documentation?.description ?? "";
    if (schemaDescriptionOrigin) schemaDescriptionOrigin.textContent = draft?.documentation?.description
      ? "Working draft" : schema?.documentation?.description ? `Revision ${schema.version}` : "No description";
    if (schemaEditorTarget) schemaEditorTarget.value = draft?.assignments[0]?.target ?? schema?.assignments[0]?.target ?? "payload";
    if (schemaOnlyDeclaredProperties) schemaOnlyDeclaredProperties.checked = presented?.document.additionalProperties === false;
    if (schemaEditorParent && presented && schemaOwnerDocument) {
      const parents = schemas.filter(({ id }) => id !== presented.id);
      const empty = schemaOwnerDocument.createElement("option"); empty.value = ""; empty.textContent = "No parent";
      schemaEditorParent.replaceChildren(empty, ...parents.map((candidate) => { const option = schemaOwnerDocument.createElement("option");
        option.value = candidate.id; option.textContent = `${candidate.name} v${candidate.version}`; return option; }));
      schemaEditorParent.value = presented.parentSchemaId ?? "";
    }
    const parent = presented?.parentSchemaId ? schemas.find(({ id }) => id === presented.parentSchemaId) : undefined;
    if (schemaInheritanceProvenance) schemaInheritanceProvenance.textContent = parent
      ? `Inherited rules originate in ${parent.name} v${parent.version}. Local rules override only after conflicts are resolved.` : "Local schema only";
    if (schemaRuleOverrides) schemaRuleOverrides.hidden = !parent;
    if (schemaRuleOverrideList && schemaOwnerDocument) schemaRuleOverrideList.replaceChildren(...Object.keys(parent?.document.properties ?? {}).map((property) => {
      const label = schemaOwnerDocument.createElement("label"), select = schemaOwnerDocument.createElement("select");
      select.setAttribute("aria-label", `${property} inherited rule override`);
      select.replaceChildren(...(["inherit", "enabled", "disabled"] as const).map((state) => { const option = schemaOwnerDocument.createElement("option");
        option.value = state; option.textContent = state === "inherit" ? "Inherit" : state === "enabled" ? "Enabled in this schema" : "Disabled in this schema"; return option; }));
      select.value = presented?.inheritedRuleOverrides?.[property] ?? "inherit";
      listen(select, "change", () => { if (!activeSchemaId) return; const current = active(), currentDraft = schemaEditorDraft(current);
        replaceActive(updateSchemaWorkingDraft(current, { inheritedRuleOverrides:{ ...(currentDraft.inheritedRuleOverrides ?? {}),
          [property]:select.value as "inherit" | "enabled" | "disabled" } }, `Change inherited rule override ${property}`));
        persistSchemaLibrary(); renderSchemas(); });
      label.append(`${property}: `, select); return label;
    }));
    if (presented) renderSchemaInheritancePresentation(presented);
    const pendingChanges = draft?.pendingChanges ?? [];
    if (buildSpecificationButton) { buildSpecificationButton.hidden = !draft;
      buildSpecificationButton.onclick = schema && draft ? () => openSchemaSpecification(schema, "working-draft", buildSpecificationButton) : null; }
    const historyVersions = schema ? schemaRevisionChoices(schema) : [];
    if (buildHistoricalSpecificationButton) { buildHistoricalSpecificationButton.disabled = historyVersions.length === 0;
      buildHistoricalSpecificationButton.onclick = schema && historyVersions.length
        ? () => openSchemaSpecification(schema, `historical:${revisionVersion()}`, buildHistoricalSpecificationButton) : null; }
    if (saveSchemaReason) saveSchemaReason.textContent = pendingChanges.join("; ");
    if (schemaRevisionReviewSummary) schemaRevisionReviewSummary.textContent = pendingChanges.length
      ? pendingChanges.join("; ") : "No pending changes";
    if (schemaCloseReviewSummary) schemaCloseReviewSummary.textContent = draft
      ? `${pendingChanges.length} pending change${pendingChanges.length === 1 ? "" : "s"}` : "No pending changes";
    if (confirmSchemaRevisionButton && schema) confirmSchemaRevisionButton.textContent = schema.published === false
      ? "Publish revision 1" : `Publish revision ${schema.version + 1}`;
    if (schemaRevisionComparison && schema) schemaRevisionComparison.textContent = `Revision ${revisionVersion()} compared with ${schema.version}`;
    if (schemaEditorNameAssistance && schema) schemaEditorNameAssistance.textContent = inspectSchemaRename(
      schema, schemas, schemaEditorName?.value ?? draft?.name ?? schema.name).assistance;
    renderSchemaPropertyView();
  }
  function restorePendingSchemaTreeScroll(): void {
    if (schemaTreePendingScroll === undefined || !schemaTreeScrollOwner) return;
    const scrollTop = schemaTreePendingScroll; schemaTreeRestoringScroll = true;
    queueMicrotask(() => { schemaTreeScrollOwner.scrollTop = scrollTop; schemaTreePendingScroll = undefined;
      ports.scheduleFrame(() => { schemaTreeRestoringScroll = false; }); });
  }
  function persistSchemaTreeView(projectId: string): void {
    saveSchemaRelationshipTreeView(schemaTreeStorage, projectId, { query:schemaSearch?.value ?? "",
      category:(schemaCategoryFilter?.value ?? "All") as SchemaRelationshipCategory,
      expandedKeys:[...schemaTreeExpandedKeys], scrollTop:schemaTreeScrollOwner?.scrollTop ?? 0 });
  }
  function hydrateActiveProjectForSchemas(): Promise<void> | undefined {
    if (activeSchemaProjectHydration) return activeSchemaProjectHydration;
    const activeProjectId = ports.activeProjectId(); if (!activeProjectId) return;
    const operation = lifecycleGeneration;
    if (schemaResult) schemaResult.textContent = "Loading active project schema contributors from durable storage…";
    activeSchemaProjectHydration = ports.ensureProjectSchemaContributors(activeProjectId, schemaContributorRoute)
      .then(({ name }) => { if (!mounted || operation !== lifecycleGeneration) return; renderSchemas();
        if (schemaResult) schemaResult.textContent = `Loaded schema contributors for ${name}.`; })
      .catch((error: unknown) => { if (mounted && operation === lifecycleGeneration && schemaResult) {
        schemaResult.textContent = `Schema contributors are unavailable. ${error instanceof Error ? error.message : String(error)}`;
      } })
      .finally(() => { activeSchemaProjectHydration = undefined; });
    return activeSchemaProjectHydration;
  }
  const renderSchemas = (): void => {
    if (!mounted) return;
    clearSchemaRowListeners();
    const relationship = ports.relationshipTree(schemas), projectId = relationship.projectId;
    const allNodes = (nodes: readonly SchemaRelationshipTreeNode[]): SchemaRelationshipTreeNode[] =>
      nodes.flatMap((node) => [node, ...allNodes(node.children)]);
    const validNodes = allNodes(relationship.nodes), validKeys = new Set(validNodes.map(({ key }) => key));
    if (schemaTreeProjectId !== projectId) {
      schemaTreeProjectId = projectId;
      const restored = restoreSchemaRelationshipTreeView(schemaTreeStorage, projectId, validKeys);
      schemaTreeExpandedKeys = new Set(restored.expandedKeys.length ? restored.expandedKeys
        : validNodes.filter(({ children }) => children.length).map(({ key }) => key));
      if (schemaSearch) schemaSearch.value = restored.query;
      if (schemaCategoryFilter) schemaCategoryFilter.value = restored.category;
      schemaTreePendingScroll = restored.scrollTop;
      if (!schemaPanel?.hidden) restorePendingSchemaTreeScroll();
    } else schemaTreeExpandedKeys = new Set([...schemaTreeExpandedKeys].filter((key) => validKeys.has(key)));
    const filtered = filterSchemaRelationshipTree(relationship.nodes, { query:schemaSearch?.value ?? "",
      category:(schemaCategoryFilter?.value ?? "All") as SchemaRelationshipCategory });
    const rows: HTMLElement[] = [], document = schemaList?.ownerDocument;
    const savedRow = (node: SchemaRelationshipTreeNode, level: number): HTMLLIElement | undefined => {
      const schema = schemas.find(({ id }) => `saved:${id}` === node.targetKey); if (!schema || !document) return;
      const item = document.createElement("li"), revise = document.createElement("button"), duplicate = document.createElement("button"),
        adopt = document.createElement("button"), build = document.createElement("button"), exportCurrent = document.createElement("button"),
        reportMissing = document.createElement("button"), remove = document.createElement("button");
      const pending = schema.workingDraft?.pendingChanges.length ?? 0, history = schemaRevisionChoices(schema).length;
      item.dataset.schemaEntryKey = node.targetKey; item.dataset.schemaReferenceKey = node.key; item.dataset.schemaRole = node.role;
      item.setAttribute("role", "treeitem"); item.setAttribute("aria-level", String(level));
      item.setAttribute("aria-selected", String(activeSchemaId === schema.id));
      item.textContent = schema.published === false
        ? `${schema.name} · role Saved schema · path ${node.relationshipPath} · revision ${schema.version} · Draft · ${pending} pending changes. `
        : `${schema.name} · current revision ${schema.version} · role Saved schema · path ${node.relationshipPath} · saved · ${pending} pending draft changes · ${history} historical revisions · ${schema.assignments.map((assignment) => `${assignment.sourceId}/${assignment.eventName}/${assignment.target}`).join(", ") || "unassigned"}. `;
      revise.type = duplicate.type = adopt.type = build.type = exportCurrent.type = reportMissing.type = remove.type = "button";
      revise.textContent = "Edit working draft"; duplicate.textContent = "Duplicate"; adopt.textContent = "Add saved schema to project";
      build.textContent = "Build documentation table"; exportCurrent.textContent = "Export"; reportMissing.textContent = "Report missing event"; remove.textContent = "Delete";
      listen(revise, "click", () => { schemaTreeInvokingReference = node.key; activeSchemaId = schema.id; schemaDraft = structuredClone(schema); renderSchemas(); });
      listen(duplicate, "click", () => { schemas = [...schemas, duplicateSchemaRevision(schema, schema.version, schemas)]; persistSchemaLibrary(); renderSchemas(); });
      listen(adopt, "click", () => requestSavedSchemaAdoption(schema, adopt));
      listen(build, "click", () => openSchemaSpecification(schema, `published:${schema.version}`, build));
      listen(exportCurrent, "click", () => openSchemaExportChoices(exportCurrent, schema));
      listen(reportMissing, "click", () => ports.reportMissingSchemaEvent(schema.id));
      listen(remove, "click", () => { const children = schemas.filter((candidate) => candidate.parentSchemaId === schema.id);
        if (children.length) { if (schemaResult) schemaResult.textContent = `Cannot delete ${schema.name}: it is the parent of ${children.map(({ name }) => name).join(", ")}.`; return; }
        pendingSchemaDeletion = schema; if (schemaDeleteReviewSummary) schemaDeleteReviewSummary.textContent = `${schema.name} v${schema.version} and its assignments will be removed.`;
        schemaDeleteReview?.showModal(); });
      item.append(revise, duplicate, adopt, build, exportCurrent, reportMissing, remove); return item;
    };
    const visit = (node: SchemaRelationshipTreeNode, level: number): void => {
      if (node.targetKey?.startsWith("saved:")) { const item = savedRow(node, level); if (item) rows.push(item); return; }
      if (!document) return;
      const item = document.createElement("li"); item.dataset.schemaReferenceKey = node.key; item.setAttribute("role", "treeitem");
      item.setAttribute("aria-level", String(level));
      if (node.targetKey) {
        const open = document.createElement("button"), studio = document.createElement("button"); item.dataset.schemaEntryKey = node.targetKey;
        item.dataset.schemaRole = node.role; item.textContent = `${node.name} · role ${node.role} · path ${node.relationshipPath}. `;
        open.type = studio.type = "button"; open.textContent = "Open schema"; studio.textContent = "Open schema in Specification Studio";
        listen(open, "click", () => { schemaTreeInvokingReference = node.key; openContributorInUnifiedEditor(node.targetKey!); });
        listen(studio, "click", () => ports.openContributorInStudio(node.targetKey!)); item.append(open, studio);
      } else {
        const toggle = document.createElement("button"), expanded = node.expanded || schemaTreeExpandedKeys.has(node.key);
        item.dataset.schemaGroup = node.name; item.setAttribute("aria-expanded", String(expanded)); toggle.type = "button"; toggle.textContent = node.name;
        listen(toggle, "click", () => { if (expanded) schemaTreeExpandedKeys.delete(node.key); else schemaTreeExpandedKeys.add(node.key);
          persistSchemaTreeView(projectId); renderSchemas(); }); item.append(toggle);
      }
      rows.push(item); const expanded = node.expanded || schemaTreeExpandedKeys.has(node.key);
      if (node.children.length && (node.targetKey || expanded)) for (const child of node.children) visit(child, level + 1);
    };
    for (const root of filtered) visit(root, 1);
    if (projectId === "no-project" && document) { const item = document.createElement("li"), open = document.createElement("button"), create = document.createElement("button");
      item.setAttribute("role", "status"); item.textContent = "No active project. Open a project to see relationship-derived contributors. ";
      open.type = create.type = "button"; open.textContent = "Open project"; create.textContent = "Create project";
      listen(open, "click", () => ports.openProjectLibrary(false));
      listen(create, "click", () => ports.openProjectLibrary(true)); item.append(open, create); rows.push(item); }
    const resultCount = rows.filter(({ dataset }) => Boolean(dataset.schemaEntryKey)).length;
    if (schemaEmptyState) schemaEmptyState.hidden = resultCount > 0;
    if (schemaCount) { schemaCount.textContent = `${resultCount} relationship-tree results`; schemaCount.setAttribute("aria-label", `${resultCount} schema relationship-tree results`); }
    schemaList?.replaceChildren(...rows);
    if (schemaResult) schemaResult.textContent = activeSchemaId ? `Selected ${activeSchemaId}` : "";
    renderSchemaDraft();
    renderSchemaAssignments();
  };
  const updateSchemaTreeView = (): void => { if (schemaTreeProjectId) persistSchemaTreeView(schemaTreeProjectId); renderSchemas(); };
  const persistSchemaTreeScroll = (): void => {
    if (schemaTreeProjectId && !schemaTreeRestoringScroll && schemaTreePendingScroll === undefined && !schemaPanel?.hidden) {
      persistSchemaTreeView(schemaTreeProjectId);
    }
  };
  const navigateSchemaTree = (event: KeyboardEvent): void => {
    const target = event.target as HTMLButtonElement | null;
    const controls = Array.from(schemaList?.querySelectorAll<HTMLButtonElement>("li[role=treeitem] > button:first-of-type") ?? []);
    const current = target ? controls.indexOf(target) : -1; if (current < 0 || !target) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? controls.length - 1
        : Math.max(0, Math.min(controls.length - 1, current + (event.key === "ArrowDown" ? 1 : -1)));
      controls[next]?.focus({ preventScroll:false });
    }
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const row = target.closest<HTMLElement>('[role="treeitem"][aria-expanded]'); if (!row) return;
      const expanded = row.getAttribute("aria-expanded") === "true";
      if ((event.key === "ArrowRight" && !expanded) || (event.key === "ArrowLeft" && expanded)) { event.preventDefault(); target.click(); }
    }
  };
  const persistSchemaEditorDraft = (): void => {
    if (!activeSchemaId) return;
    const schema = active();
    replaceActive(proposeSchemaWorkingDraftName(schema, schemaEditorName?.value ?? schema.name));
    persistSchemaLibrary(); renderSchemas();
  };
  const saveSchemaDescription = (): void => { if (!activeSchemaId) return;
    const schema = active();
    const documentation = updateSchemaDescription(schema.workingDraft?.documentation ?? schema.documentation ?? {},
      schemaEditorDescription?.value ?? "");
    replaceActive(updateSchemaWorkingDraft(schema, { documentation }, "Update schema description"));
    persistSchemaLibrary(); renderSchemas(); };
  const updateSchemaTarget = (): void => { if (!activeSchemaId) return;
    const schema = active(); const assignments = (schema.workingDraft?.assignments ?? schema.assignments)
      .map((assignment) => ({ ...assignment, target:(schemaEditorTarget?.value === "raw input" ? "raw input" : "payload") as "raw input" | "payload" }));
    replaceActive(updateSchemaWorkingDraft(schema, { assignments }, "Update validation target")); persistSchemaLibrary(); renderSchemas(); };
  const changeSchemaParent = (): void => { if (!activeSchemaId) return; const schema = active(), draft = schemaEditorDraft(schema);
    const changed = withSchemaParent(draft, schemaEditorParent?.value || undefined);
    replaceActive(updateSchemaWorkingDraft(schema, { parentSchemaId:changed.parentSchemaId }, "Change parent schema"));
    persistSchemaLibrary(); renderSchemas(); };
  const changeOnlyDeclaredProperties = (): void => { if (!activeSchemaId) return; const schema = active(), draft = schemaEditorDraft(schema);
    const { additionalProperties:_previous, ...document } = draft.document;
    replaceActive(updateSchemaWorkingDraft(schema, { document:schemaOnlyDeclaredProperties?.checked
      ? { ...document, additionalProperties:false } : document }, "Change additional-property policy"));
    persistSchemaLibrary(); renderSchemas(); };
  const openSchemaRevisionReview = (): void => { renderSchemaDraft(); schemaRevisionReview?.showModal(); };
  function refreshCurrentLiveAfterSchemaPublication():number {
    return ports.revalidateCurrentLive?.(structuredClone(schemas), structuredClone(manualSchemaOverrides)) ?? 0;
  }
  const publishActiveSchema = (): SchemaDefinition => { const published = publishSchemaWorkingDraft(active());
    replaceActive(published); persistSchemaLibrary(); schemaRevisionReview?.close(); renderSchemas(); refreshCurrentLiveAfterSchemaPublication(); return published; };
  const confirmSchemaRevision = (): void => { publishActiveSchema(); };
  const cancelSchemaRevision = (): void => schemaRevisionReview?.close();
  const discardSchemaDraft = (): void => { replaceActive(discardSchemaWorkingDraft(active())); persistSchemaLibrary(); renderSchemas(); };
  const keepEditingSchema = (): void => { schemaCloseReview?.close(); schemaEditorName?.focus(); };
  const closeSchemaEditor = (): void => { if (active().workingDraft) schemaCloseReview?.showModal();
    else { activeSchemaId = undefined; schemaDraft = undefined; renderSchemas(); } };
  const saveAndCloseSchema = (): void => { if (active().workingDraft) publishActiveSchema();
    activeSchemaId = undefined; schemaDraft = undefined; schemaCloseReview?.close(); renderSchemas(); };
  const discardWorkingSchemaDraft = (): void => { discardSchemaDraft(); activeSchemaId = undefined;
    schemaDraft = undefined; schemaCloseReview?.close(); renderSchemas(); };
  const renderSchemaRevisionComparison = (): void => renderSchemaDraft();
  const duplicateSelectedSchemaRevision = (): void => { const duplicate = duplicateSchemaRevision(active(), revisionVersion(), schemas);
    schemas = [...schemas, duplicate]; activeSchemaId = duplicate.id; schemaDraft = structuredClone(duplicate); persistSchemaLibrary(); renderSchemas(); };
  const restoreSelectedSchemaRevision = (): void => { pendingSchemaRestoration = { schemaId:active().id, version:revisionVersion() };
    replaceActive(restoreSchemaRevisionDraft(active(), pendingSchemaRestoration.version)); pendingSchemaRestoration = undefined;
    persistSchemaLibrary(); renderSchemas(); };
  const clearSchemaPropertyViewFilter = (): void => { if (schemaPropertyFilter) schemaPropertyFilter.value = "";
    renderSchemaPropertyView(); schemaPropertyFilter?.focus(); };
  function showSchemaSubview(subview: string): void {
    for (const tab of schemaSubviews) tab.setAttribute("aria-selected", String(tab.dataset.schemaSubview === subview));
    for (const panel of schemaPanels) panel.hidden = panel.id !== subview;
    if (liveEventQuery) liveEventQuery.hidden = subview !== "schema-master";
  }
  const activateSchemaSubview = (event: Event): void => {
    const subview = (event.currentTarget as HTMLButtonElement).dataset.schemaSubview;
    if (subview) showSchemaSubview(subview);
  };
  function applySchemaPropertyRemoval(path: string): void {
    const schema = active();
    const draft = schema.workingDraft;
    if (!draft) return;
    const removal = removeSchemaProperty(draft.document, draft.attachedRules ?? [], path, draft.documentation);
    lastSchemaPropertyRemoval = removal; selectedSchemaPropertyPath = removal.propertyPath.slice(1).replaceAll("/", ".");
    expandedSchemaPropertyRulePaths.delete(removal.propertyPath);
    replaceActive(updateSchemaWorkingDraft(schema, { document:removal.document, attachedRules:removal.attachedRules,
      ...(removal.documentation !== undefined ? { documentation:removal.documentation } : {}) },
    `Remove property ${removal.propertyPath} and property-specific constraints`));
    if (schemaPropertyRemovalFeedback) schemaPropertyRemovalFeedback.textContent = `Removed ${removal.propertyPath} from the working draft. Undo is available.`;
    if (undoSchemaPropertyRemovalButton) undoSchemaPropertyRemovalButton.hidden = false;
    persistSchemaLibrary(); renderSchemas();
  }
  function requestSchemaPropertyRemoval(path: string, trigger?: HTMLButtonElement): void {
    const schema = active(); const draft = schema.workingDraft;
    if (!draft) return;
    const inspection = inspectSchemaPropertyRemoval(draft.document, draft.attachedRules ?? [], path, draft.documentation);
    if (!inspection.requiresConfirmation) { applySchemaPropertyRemoval(path); return; }
    pendingSchemaPropertyRemoval = { path, ...(trigger ? { trigger } : {}) };
    if (schemaPropertyRemovalSummary) schemaPropertyRemovalSummary.textContent = `${inspection.propertyPath} contains ${inspection.descendants.length} descendants: ${inspection.descendants.join(", ") || "none"}. ${inspection.affectedRuleAttachments.length} affected rule attachments. Documentation entries: ${inspection.affectedDocumentationPaths?.join(", ") || "none"}. No changes occur until confirmation.`;
    schemaPropertyRemovalDialog?.showModal(); schemaPropertyRemovalHeading?.focus();
  }
  function closeSchemaPropertyRemovalDialog(restoreFocus = true): void {
    const trigger = pendingSchemaPropertyRemoval?.trigger; pendingSchemaPropertyRemoval = undefined;
    if (schemaPropertyRemovalDialog?.open) schemaPropertyRemovalDialog.close(); if (restoreFocus) trigger?.focus();
  }
  const confirmSchemaPropertyRemoval = (): void => { const path = pendingSchemaPropertyRemoval?.path;
    closeSchemaPropertyRemovalDialog(false); if (path) applySchemaPropertyRemoval(path); };
  function focusAfterSchemaPropertyRemoval(path:string):void { selectedSchemaPropertyPath = path.replace(/^\//, "").replaceAll("/", "."); renderSchemaPropertyView(); }
  const cancelSchemaPropertyRemoval = (): void => closeSchemaPropertyRemovalDialog();
  const cancelSchemaPropertyRemovalFromDialog = (event: Event): void => { event.preventDefault(); closeSchemaPropertyRemovalDialog(); };
  const undoLastSchemaPropertyRemoval = (): void => {
    if (!lastSchemaPropertyRemoval) return; const schema = active(); const restored = undoSchemaPropertyRemoval(lastSchemaPropertyRemoval);
    const path = lastSchemaPropertyRemoval.propertyPath; selectedSchemaPropertyPath = path.slice(1).replaceAll("/", ".");
    expandedSchemaPropertyRulePaths.add(path);
    replaceActive(updateSchemaWorkingDraft(schema, { document:restored.document, attachedRules:restored.attachedRules,
      ...(restored.documentation !== undefined ? { documentation:restored.documentation } : {}) }, `Undo property removal ${path}`));
    if (schemaPropertyRemovalFeedback) schemaPropertyRemovalFeedback.textContent = `Restored ${path} with its prior definition and tree position.`;
    if (undoSchemaPropertyRemovalButton) undoSchemaPropertyRemovalButton.hidden = true;
    lastSchemaPropertyRemoval = undefined; persistSchemaLibrary(); renderSchemas();
    focusAfterSchemaPropertyRemoval(path);
  };
  function requestSchemaDocumentationRemoval(path: string, trigger?: HTMLElement): void {
    pendingSchemaDocumentationRemoval = { path, ...(trigger ? { trigger } : {}) };
    if (schemaDocumentationRemovalSummary) schemaDocumentationRemovalSummary.textContent = `${path} documentation will be removed from the working draft. The schema property and validation rules remain unchanged.`;
    schemaDocumentationRemovalDialog?.showModal(); schemaDocumentationRemovalHeading?.focus();
  }
  function closeSchemaDocumentationRemoval(restoreFocus = true): void {
    const trigger = pendingSchemaDocumentationRemoval?.trigger; pendingSchemaDocumentationRemoval = undefined;
    if (schemaDocumentationRemovalDialog?.open) schemaDocumentationRemovalDialog.close(); if (restoreFocus) trigger?.focus();
  }
  const confirmSchemaDocumentationRemovalAction = (): void => {
    const path = pendingSchemaDocumentationRemoval?.path; if (!path) return; const schema = active(); const draft = schema.workingDraft;
    closeSchemaDocumentationRemoval(false); if (!draft) return;
    const documentation = setPropertyDocumentation(draft.documentation ?? {}, path, { displayName:"", description:"" });
    replaceActive(updateSchemaWorkingDraft(schema, { documentation }, `Remove property documentation ${path}`));
    persistSchemaLibrary(); renderSchemas();
  };
  const cancelSchemaDocumentationRemovalAction = (): void => closeSchemaDocumentationRemoval();
  const cancelSchemaDocumentationRemovalFromDialog = (event: Event): void => { event.preventDefault(); closeSchemaDocumentationRemoval(); };
  function openSchemaPropertyCopyReview(path: string, destinationId: string): void {
    const sourceSchema = active(); const destination = schemas.find(({ id }) => id === destinationId);
    if (!destination) throw new Error(`Unknown destination schema ${destinationId}`);
    const source = schemaPropertyCopySource(sourceSchema, { surface:sourceSchema.workingDraft ? "working draft" : "current" });
    pendingSchemaPropertyCopy = planSchemaPropertyCopy({ source, destination, selectedPath:path, schemas, reusableRuleIds:[] });
    if (!pendingSchemaPropertyCopy.ready) throw new Error("Resolve property-copy conflicts before confirmation");
    schemaPropertyCopyDialog?.showModal();
  }
  const confirmSchemaPropertyCopy = (): void => {
    if (!pendingSchemaPropertyCopy) return; const transaction = applySchemaPropertyCopy(pendingSchemaPropertyCopy);
    schemas = schemas.map((schema) => schema.id === transaction.schema.id ? transaction.schema : schema);
    lastSchemaPropertyCopy = transaction; pendingSchemaPropertyCopy = undefined; schemaPropertyCopyDialog?.close();
    if (schemaPropertyCopyFeedback) schemaPropertyCopyFeedback.textContent = `Copied ${transaction.plan.selectedPath} from ${transaction.plan.source.label} to ${transaction.schema.name}. Published revisions are unchanged.`;
    if (undoSchemaPropertyCopyButton) undoSchemaPropertyCopyButton.hidden = false;
    persistSchemaLibrary(); renderSchemas();
  };
  const undoLastSchemaPropertyCopy = (): void => {
    if (!lastSchemaPropertyCopy) return; const restored = undoSchemaPropertyCopy(lastSchemaPropertyCopy).schema;
    schemas = schemas.map((schema) => schema.id === restored.id ? restored : schema);
    if (schemaPropertyCopyFeedback) schemaPropertyCopyFeedback.textContent = `Undid property copy to ${restored.name}; the pre-copy working draft was restored.`;
    if (undoSchemaPropertyCopyButton) undoSchemaPropertyCopyButton.hidden = true;
    lastSchemaPropertyCopy = undefined; persistSchemaLibrary(); renderSchemas();
  };
  const renderSpecificIndexInspection = (): void => {
    if (!specificIndexArrayPath || !active().workingDraft) return;
    const inspection = inspectSpecificIndexRuleTarget(active().workingDraft!.document, specificIndexArrayPath, schemaSpecificIndex?.value ?? "");
    if (confirmSchemaSpecificIndex) confirmSchemaSpecificIndex.disabled = inspection.result !== "accepted";
    if (schemaSpecificIndexAssistance) schemaSpecificIndexAssistance.textContent = inspection.assistance;
  };
  const openSpecificIndexDialog = (arrayPath: string, trigger?: HTMLButtonElement): void => {
    specificIndexArrayPath = arrayPath; specificIndexTrigger = trigger;
    if (schemaSpecificIndex) schemaSpecificIndex.value = "";
    if (confirmSchemaSpecificIndex) confirmSchemaSpecificIndex.disabled = true;
    if (schemaSpecificIndexAssistance) schemaSpecificIndexAssistance.textContent = "Enter a non-negative zero-based index";
    schemaSpecificIndexDialog?.showModal(); schemaSpecificIndex?.focus();
  };
  const submitSpecificIndex = (event: Event): void => { event.preventDefault();
    const draft = active().workingDraft; if (!draft || !specificIndexArrayPath) return;
    const inspection = inspectSpecificIndexRuleTarget(draft.document, specificIndexArrayPath, schemaSpecificIndex?.value ?? "");
    if (inspection.result !== "accepted") return;
    const trigger=specificIndexTrigger, dottedPath=inspection.canonicalPath.slice(1).replaceAll("/", ".");
    closeSpecificIndexDialog(); openSchemaPropertyRulePicker(dottedPath, trigger);
  };
  const closeSpecificIndexDialog = (): void => { schemaSpecificIndexDialog?.close(); specificIndexTrigger?.focus();
    specificIndexArrayPath = undefined; specificIndexTrigger = undefined; };
  const cancelSpecificIndexDialog = (event: Event): void => { event.preventDefault(); closeSpecificIndexDialog(); };
  function schemaParentDocuments(): SchemaDefinition["document"][] {
    const documents: SchemaDefinition["document"][] = []; const visited = new Set<string>();
    let parentId = active().workingDraft?.parentSchemaId ?? active().parentSchemaId;
    while (parentId && !visited.has(parentId)) { visited.add(parentId); const parent = schemas.find(({ id }) => id === parentId);
      if (!parent) break; documents.push(parent.document); parentId = parent.parentSchemaId; }
    return documents;
  }
  function manualPropertyDefinition(): ManualPropertyDefinition {
    const type = (schemaManualPropertyType?.value || "string") as ManualPropertyValueType;
    const arrayItemType = (schemaManualArrayItemType?.value ?? "") as ManualArrayItemType | "";
    if (pendingManualPropertyContext) return contextualManualPropertyDefinition(pendingManualPropertyContext.parentPath,
      schemaManualPropertyChildName?.value ?? "", type, type === "array" && arrayItemType ? arrayItemType : undefined);
    return { path:schemaManualPropertyPath?.value ?? "", type,
      ...(type === "array" && arrayItemType ? { arrayItemType } : {}) };
  }
  function renderManualPropertyForm(): void {
    const draft = active().workingDraft; if (!draft) return; const definition = manualPropertyDefinition();
    const inspection = inspectManualProperty(draft.document, schemaParentDocuments(), definition);
    const contextual = Boolean(pendingManualPropertyContext);
    if (schemaManualPropertyPathLabel) schemaManualPropertyPathLabel.hidden = contextual;
    if (schemaManualPropertyPath) schemaManualPropertyPath.hidden = contextual;
    if (schemaManualPropertyChildNameLabel) schemaManualPropertyChildNameLabel.hidden = !contextual;
    if (schemaManualPropertyChildName) schemaManualPropertyChildName.hidden = !contextual;
    if (schemaManualPropertyParentContext) { schemaManualPropertyParentContext.hidden = !contextual;
      schemaManualPropertyParentContext.textContent = pendingManualPropertyContext ? `Parent path: ${pendingManualPropertyContext.parentPath}` : ""; }
    if (schemaManualArrayTypeGroup) schemaManualArrayTypeGroup.hidden = definition.type !== "array";
    if (schemaManualPropertyPreview) schemaManualPropertyPreview.textContent = definition.path.trim()
      ? `Normalized path: ${inspection.normalizedPath || "none"}. ${manualPropertyPreview(definition)}. Missing object path: ${inspection.missingObjectPath.join(", ") || "none"}.`
      : "Normalized path: none. Missing object path: none.";
    if (schemaManualPropertyAssistance) schemaManualPropertyAssistance.textContent = inspection.result === "blocked" ? inspection.assistance : "Ready to add";
    if (confirmSchemaManualPropertyButton) confirmSchemaManualPropertyButton.disabled = inspection.result === "blocked";
    const existingPath = inspection.result === "blocked" ? inspection.existingPath : undefined;
    if (goToExistingSchemaPropertyButton) { goToExistingSchemaPropertyButton.hidden = !existingPath;
      if (existingPath && inspection.result === "blocked") { goToExistingSchemaPropertyButton.textContent = inspection.assistance;
        goToExistingSchemaPropertyButton.dataset.schemaPropertyPath = existingPath; }
      else delete goToExistingSchemaPropertyButton.dataset.schemaPropertyPath; }
  }
  function closeManualPropertyForm(restoreFocus = true): void { const trigger = pendingManualPropertyContext?.trigger;
    pendingManualPropertyContext = undefined; schemaManualPropertyDialog?.close(); if (restoreFocus) (trigger ?? addSchemaPropertyButton)?.focus(); }
  function openManualPropertyForm(parentPath?: string, trigger?: HTMLButtonElement): void {
    if (!active().workingDraft) return; pendingManualPropertyContext = parentPath ? { parentPath, ...(trigger ? { trigger } : {}) } : undefined;
    pendingManualPropertyCanonicalBase = active().workingDraft?.canonicalSchema;
    if (schemaManualPropertyHeading) schemaManualPropertyHeading.textContent = parentPath ? "Add child property" : "Add property";
    if (schemaManualPropertyPath) schemaManualPropertyPath.value = ""; if (schemaManualPropertyChildName) schemaManualPropertyChildName.value = "";
    if (schemaManualPropertyType) schemaManualPropertyType.value = "string"; if (schemaManualArrayItemType) schemaManualArrayItemType.value = "";
    renderManualPropertyForm(); schemaManualPropertyDialog?.showModal(); (parentPath ? schemaManualPropertyChildName : schemaManualPropertyPath)?.focus();
  }
  const submitManualProperty = (event: Event): void => { event.preventDefault(); const schema = active(); const draft = schema.workingDraft;
    if (!draft) return; const definition = manualPropertyDefinition(); const inspection = inspectManualProperty(draft.document, schemaParentDocuments(), definition);
    if (inspection.result !== "ready") { renderManualPropertyForm(); return; }
    replaceActive(updateSchemaWorkingDraft(schema, { document:addManualProperty(draft.document, schemaParentDocuments(), definition) },
      `Add manual property ${inspection.normalizedPath}`)); selectedSchemaPropertyPath = inspection.normalizedPath.slice(1).replaceAll("/", ".");
    closeManualPropertyForm(false); pendingManualPropertyCanonicalBase = undefined; persistSchemaLibrary(); renderSchemas(); };
  function openContextualManualPropertyForm(parentPath:string, trigger?:HTMLButtonElement):void { openManualPropertyForm(parentPath, trigger); }
  const openManualPropertyFromControl = ():void => openManualPropertyForm();
  const cancelManualPropertyDialog = (): void => closeManualPropertyForm();
  const cancelManualPropertyFromDialog = (event: Event): void => { event.preventDefault(); closeManualPropertyForm(); };
  const goToExistingSchemaProperty = (): void => { const path = goToExistingSchemaPropertyButton?.dataset.schemaPropertyPath;
    if (!path) return; selectedSchemaPropertyPath = path.replace(/^\//, "").replaceAll("/", "."); closeManualPropertyForm(false); renderSchemas(); };
  const normalizedRulePickerPath = (path: string): string => `/${path.replace(/^\//, "").replaceAll(".", "/")}`;
  function currentConditionPayload(target:AssignmentConditionTarget = "payload"):unknown { return ports.capturedAssignmentValue(target); }
  function valueAtSchemaPath(value:unknown, path:string):unknown { return path.replace(/^\//, "").split(/[/.]/).filter(Boolean)
    .reduce<unknown>((current, segment) => current && typeof current === "object" ? (current as Record<string, unknown>)[segment] : undefined, value); }
  function initialConditionPredicate(propertyPath:string):NonNullable<PromotableReusableRule["conditionGroup"]> {
    const sample = valueAtSchemaPath(currentConditionPayload(), propertyPath);
    const comparable = sample === null || typeof sample === "string" || typeof sample === "boolean" || (typeof sample === "number" && Number.isFinite(sample));
    return { operator:"All", predicates:[{ propertyPath:normalizedRulePickerPath(propertyPath), operator:comparable ? "Equals" : "Exists",
      ...(comparable ? { comparison:typedComparisonValue(sample as string | number | boolean | null) } : {}) }] };
  }
  function configuredRuleInput():ReusableSchemaRule { const configuration = schemaRuleConfiguration;
    if (configuration) { const details = configuredRuleDetails(configuration); return { id:editingReusableSchemaRuleId ?? ports.createRuleId(),
      name:configuration.reusableName.trim() || `${configuration.ruleType} for ${schemaRulePickerPath}`, kind:configuration.ruleType,
      version:storedReusableRule(editingReusableSchemaRuleId ?? "")?.version ?? 0, enabled:configuration.enabled, applicableType:configuration.propertyType,
      operator:details.operator, ...(details.parameters !== undefined ? { parameters:details.parameters } : {}),
      ...(details.allowedValues !== undefined ? { allowedValues:details.allowedValues } : {}), ...(details.comparison !== undefined ? { comparison:details.comparison } : {}),
      ...(details.limit !== undefined ? { limit:details.limit } : {}), severity:configuration.severity,
      ...(configuration.message.trim() ? { message:configuration.message.trim() } : {}),
      ...(configuration.applyOnlyWhen ? { conditionGroup:{ operator:configuration.conditionGroupOperator, predicates:structuredClone(configuration.conditions) } } : {}),
      ...(configuration.description.trim() ? { description:configuration.description.trim() } : {}) }; }
    const name = schemaRuleName?.value.trim() || "Untitled rule", operator = schemaRuleOperator?.value || "required";
    return { id:editingReusableSchemaRuleId ?? ports.createRuleId(), name, kind:operator, version:storedReusableRule(editingReusableSchemaRuleId ?? "")?.version ?? 0,
      enabled:true, applicableType:(schemaRuleTypes?.value || "string") as SchemaPropertyType, operator,
      ...(schemaRuleParameters?.value.trim() ? { parameters:schemaRuleParameters.value.trim() } : {}),
      ...(schemaRuleSeverity?.value ? { severity:schemaRuleSeverity.value } : {}), ...(schemaRuleMessage?.value.trim() ? { message:schemaRuleMessage.value.trim() } : {}) };
  }
  function renderConditionalRuleConfiguration():void { if (!schemaPropertyRulePicker || !schemaRulePickerPath) return;
    const condition = initialConditionPredicate(schemaRulePickerPath); schemaPropertyRulePicker.dataset.conditionPreview = JSON.stringify(condition); }
  function renderSchemaLocalRuleConfiguration():void { renderSchemaPropertyRulePicker(); renderConditionalRuleConfiguration(); }
  function createConfiguredSchemaRule():boolean { if (!schemaRulePickerPath || !activeSchemaId) return false; const rule = configuredRuleInput();
    reusableSchemaRules = [...reusableSchemaRules.filter(({ id }) => id !== rule.id), { ...rule, version:Math.max(1, rule.version + 1) }];
    const attached = attachReusableRule(activeSchemaId, rule.id, schemaRulePickerPath); if (attached) closeSchemaPropertyRulePickerForCommit(); return attached; }
  function openCompactCanonicalRuleEditor(path:string, trigger?:HTMLButtonElement):void { openSchemaPropertyRulePicker(path, trigger); renderSchemaLocalRuleConfiguration(); }
  function openCompactCanonicalPropertyActions(path:string):void { const document = compactCanonicalEditor?.load();
    compactCanonicalPropertyMenuId = document ? Object.values(document.nodes).find((node) => canonicalPropertyPath(document, node.id) === path || node.id === path)?.id : undefined;
    selectedSchemaPropertyPath = path.replace(/^\//, "").replaceAll("/", "."); renderSchemaPropertyView(); renderCompactCanonicalContext(); }
  const updateConfiguredRulePreview = ():void => { if (schemaRulePickerPath) renderSchemaLocalRuleConfiguration(); };
  const renderSchemaPropertyRulePicker = (): void => {
    schemaPropertyRenderSequence += 1;
    if (!schemaPropertyRulePicker || !schemaRulePickerPath) return;
    for (const dispose of schemaRulePickerDisposers.splice(0)) dispose();
    const path = schemaRulePickerPath, document = schemaPropertyRulePicker.ownerDocument;
    if (!document) return;
    if (!schemaRuleConfiguration) {
      const heading = document.createElement("h4"), search = document.createElement("input"), results = document.createElement("section"), cancel = document.createElement("button");
      heading.id = "schema-property-rule-picker-heading"; heading.textContent = `Add rule for ${path}`;
      results.id = "schema-property-rule-results"; search.id = "schema-property-rule-search"; search.value = schemaRulePickerSearch;
      schemaPropertyRulePicker.setAttribute("aria-labelledby", heading.id); cancel.type = "button"; cancel.textContent = "Cancel";
      const propertyType = schemaRuleTypeForAttachment(active(), path), attachedIds = new Set((active().workingDraft?.attachedRules ?? active().attachedRules ?? []).map(({ id }) => id));
      const rules = [...builtInRulesForProperty(propertyType), ...reusableRulesForProperty(reusableSchemaRules, propertyType, schemaRulePickerSearch, attachedIds)];
      for (const rule of rules.filter((candidate) => !schemaRulePickerSearch || `${candidate.name} ${candidate.kind}`.toLowerCase().includes(schemaRulePickerSearch.toLowerCase()))) {
        const button = document.createElement("button"); button.type = "button"; button.textContent = `${rule.name} · ${reusableRuleMetadata(rule, propertyType)}`;
        const action = ():void => { if (rule.id.startsWith("built-in:")) { schemaRuleConfiguration = createRuleConfiguration(rule.name as RuleConfiguration["ruleType"], propertyType); renderSchemaPropertyRulePicker(); }
          else { attachReusableRule(active().id, rule.id, path); closeSchemaPropertyRulePickerForCommit(); } };
        button.addEventListener("click", action); schemaRulePickerDisposers.push(() => button.removeEventListener("click", action)); results.append(button);
      }
      if (!results.children.length) { const clear = document.createElement("button"); clear.type = "button"; clear.textContent = "Clear search";
        const clearSearch = ():void => { schemaRulePickerSearch = ""; renderSchemaPropertyRulePicker(); }; clear.addEventListener("click", clearSearch);
        schemaRulePickerDisposers.push(() => clear.removeEventListener("click", clearSearch)); results.append(clear); }
      const cancelPicker = ():void => closeSchemaPropertyRulePicker(), searchRules = ():void => { schemaRulePickerSearch = search.value; renderSchemaPropertyRulePicker(); };
      cancel.addEventListener("click", cancelPicker); search.addEventListener("input", searchRules); schemaRulePickerDisposers.push(() => cancel.removeEventListener("click", cancelPicker), () => search.removeEventListener("input", searchRules));
      schemaPropertyRulePicker.replaceChildren(heading, search, results, cancel); return;
    }
    const configuration = schemaRuleConfiguration;
    const editLabel = editingAttachedLocalRule ? `Edit ${editingAttachedLocalRule.name ?? editingAttachedLocalRule.id}` : "Create local rule";
    const form = document.createElement("form"), heading = document.createElement("h4"), status = document.createElement("output"),
      parameters = document.createElement("fieldset");
    form.id = "schema-local-rule-configuration"; heading.id = "schema-property-rule-picker-heading";
    parameters.id = "schema-local-rule-parameters"; heading.textContent = `${editLabel} for ${path}`; status.id = "schema-local-rule-assistance";
    schemaPropertyRulePicker.setAttribute("aria-labelledby", heading.id);
    const refreshValidation = ():void => { const validation = validateRuleConfiguration(configuration); status.textContent = validation.assistance;
      form.dataset.ready = String(validation.ready); schemaPropertyRulePicker.dataset.conditionPreview = JSON.stringify({ operator:configuration.conditionGroupOperator,
        predicates:configuration.conditions }); };
    for (const control of ruleConfigurationControls(configuration.ruleType, configuration.propertyType)) {
      if (control.repeatable) continue; const input = control.inputType === "select" ? document.createElement("select") : document.createElement("input");
      input.id = `schema-local-rule-${control.key}`; input.value = String(configuration[control.key]);
      const update = ():void => { (configuration as unknown as Record<string, unknown>)[control.key] = input.value; refreshValidation(); };
      input.addEventListener(control.inputType === "select" ? "change" : "input", update); schemaRulePickerDisposers.push(() => input.removeEventListener(control.inputType === "select" ? "change" : "input", update)); parameters.append(input);
    }
    const allowedValues = configuration.ruleType === "Allowed values" ? document.createElement("fieldset") : undefined;
    if (allowedValues) allowedValues.id = "schema-local-rule-allowed-values";
    if (allowedValues) configuration.allowedValues.forEach((value, index) => { const input = document.createElement("input"), remove = document.createElement("button");
      input.id = `schema-local-rule-allowed-value-${index + 1}`; input.value = value; remove.type = "button"; remove.textContent = `Remove value ${index + 1}`;
      const update = ():void => { configuration.allowedValues[index] = input.value; refreshValidation(); };
      const removeValue = ():void => { configuration.allowedValues.splice(index, 1); renderSchemaPropertyRulePicker(); };
      input.addEventListener("input", update); remove.addEventListener("click", removeValue);
      schemaRulePickerDisposers.push(() => input.removeEventListener("input", update), () => remove.removeEventListener("click", removeValue)); allowedValues.append(input, remove); });
    if (configuration.ruleType === "Allowed values") { const add = document.createElement("button"); add.type = "button"; add.textContent = "Add another value";
      const addValue = ():void => { configuration.allowedValues.push(""); renderSchemaPropertyRulePicker(); }; add.addEventListener("click", addValue);
      schemaRulePickerDisposers.push(() => add.removeEventListener("click", addValue)); allowedValues?.append(add); parameters.append(allowedValues!); }
    const severity = document.createElement("select"), message = document.createElement("input"), enabled = document.createElement("input");
    severity.id = "schema-local-rule-severity"; severity.value = configuration.severity; message.id = "schema-local-rule-message"; message.value = configuration.message;
    enabled.id = "schema-local-rule-enabled"; enabled.type = "checkbox"; enabled.checked = configuration.enabled;
    const changeSeverity = ():void => { configuration.severity = severity.value; refreshValidation(); }, changeMessage = ():void => { configuration.message = message.value; },
      changeEnabled = ():void => { configuration.enabled = enabled.checked; };
    severity.addEventListener("change", changeSeverity); message.addEventListener("input", changeMessage); enabled.addEventListener("change", changeEnabled);
    schemaRulePickerDisposers.push(() => severity.removeEventListener("change", changeSeverity), () => message.removeEventListener("input", changeMessage), () => enabled.removeEventListener("change", changeEnabled));
    const conditional = document.createElement("input"), reusable = document.createElement("input"); conditional.id = "schema-local-rule-conditional"; conditional.type = "checkbox"; conditional.checked = configuration.applyOnlyWhen;
    reusable.id = "schema-local-rule-reusable"; reusable.type = "checkbox"; reusable.checked = configuration.saveReusable;
    const changeConditional = ():void => { configuration.applyOnlyWhen = conditional.checked; if (conditional.checked && !configuration.conditions.length)
      configuration.conditions.push(initialConditionPredicate(path).predicates[0]!); renderSchemaPropertyRulePicker(); };
    const changeReusable = ():void => { configuration.saveReusable = reusable.checked; renderSchemaPropertyRulePicker(); };
    conditional.addEventListener("change", changeConditional); reusable.addEventListener("change", changeReusable);
    schemaRulePickerDisposers.push(() => conditional.removeEventListener("change", changeConditional), () => reusable.removeEventListener("change", changeReusable));
    form.append(heading, parameters, severity, message, enabled, conditional, reusable);
    if (configuration.applyOnlyWhen) {
      const conditions = document.createElement("fieldset"), group = document.createElement("select");
      conditions.id = "schema-local-rule-conditions"; group.id = "schema-local-rule-condition-group"; group.value = configuration.conditionGroupOperator;
      const changeGroup = ():void => { configuration.conditionGroupOperator = group.value === "Any" ? "Any" : "All"; refreshValidation(); };
      group.addEventListener("change", changeGroup); schemaRulePickerDisposers.push(() => group.removeEventListener("change", changeGroup)); conditions.append(group);
      configuration.conditions.forEach((predicate, index) => { const property = document.createElement("select"), operator = document.createElement("select"), comparison = document.createElement("input"), remove = document.createElement("button");
        property.id = `schema-local-rule-condition-property-${index}`; property.value = predicate.propertyPath; operator.id = `schema-local-rule-condition-operator-${index}`; operator.value = predicate.operator;
        comparison.id = `schema-local-rule-condition-value-${index}`; comparison.value = predicate.comparison ? String(predicate.comparison.value ?? "") : ""; remove.id = `schema-local-rule-condition-remove-${index}`; remove.type = "button"; remove.textContent = `Remove condition ${index + 1}`;
        const changeProperty = ():void => { const schemaPath = property.value.slice(1).replaceAll("/", "."), sample = valueAtSchemaPath(currentConditionPayload(), schemaPath);
          const comparable = sample === null || ["string", "number", "boolean"].includes(typeof sample), detectedType:"null" | "string" | "number" | "boolean" | undefined = sample === null ? "null" : typeof sample === "string" ? "string" : typeof sample === "number" ? "number" : typeof sample === "boolean" ? "boolean" : undefined;
          configuration.conditions[index] = { propertyPath:property.value, operator:comparable ? "Equals" : "Exists", ...(comparable ? { comparison:typedComparisonValue(sample as string | number | boolean | null), ...(detectedType ? { detectedType } : {}) } : {}) }; renderSchemaPropertyRulePicker(); };
        const changeOperator = ():void => { predicate.operator = operator.value as typeof predicate.operator; if (predicate.operator === "Exists" || predicate.operator === "Does not exist") delete predicate.comparison; renderSchemaPropertyRulePicker(); };
        const changeComparison = ():void => { const value = comparisonValueFromInput(comparison.value, predicate.detectedType ?? "string"); if (value) predicate.comparison = value; else delete predicate.comparison; refreshValidation(); };
        const removeCondition = ():void => { configuration.conditions.splice(index, 1); renderSchemaPropertyRulePicker(); };
        property.addEventListener("change", changeProperty); operator.addEventListener("change", changeOperator); comparison.addEventListener("input", changeComparison); remove.addEventListener("click", removeCondition);
        schemaRulePickerDisposers.push(() => property.removeEventListener("change", changeProperty), () => operator.removeEventListener("change", changeOperator),
          () => comparison.removeEventListener("input", changeComparison), () => remove.removeEventListener("click", removeCondition)); conditions.append(property, operator, comparison, remove); });
      const add = document.createElement("button"); add.id = "schema-local-rule-condition-add"; add.type = "button"; add.textContent = "Add condition"; const addCondition = ():void => { configuration.conditions.push(initialConditionPredicate(path).predicates[0]!); renderSchemaPropertyRulePicker(); };
      const preview = document.createElement("output"); preview.id = "schema-local-rule-current-preview";
      add.addEventListener("click", addCondition); schemaRulePickerDisposers.push(() => add.removeEventListener("click", addCondition)); conditions.append(add, preview); form.append(conditions);
    }
    if (configuration.saveReusable) { const explanation = document.createElement("p"), name = document.createElement("input"), description = document.createElement("textarea");
      explanation.id = "schema-local-rule-reusable-explanation"; explanation.textContent = "This reusable rule will be available to other schemas."; name.id = "schema-local-rule-name"; name.value = configuration.reusableName;
      description.id = "schema-local-rule-description"; description.value = configuration.description; const changeName = ():void => { configuration.reusableName = name.value; refreshValidation(); }, changeDescription = ():void => { configuration.description = description.value; };
      name.addEventListener("input", changeName); description.addEventListener("input", changeDescription); schemaRulePickerDisposers.push(() => name.removeEventListener("input", changeName), () => description.removeEventListener("input", changeDescription)); form.append(explanation, name, description); }
    const back = document.createElement("button"), cancel = document.createElement("button"), create = document.createElement("button"); back.type = cancel.type = "button"; create.type = "submit";
    back.textContent = "Back"; cancel.textContent = "Cancel"; create.textContent = "Create rule"; const goBack = ():void => { schemaRuleConfiguration = undefined; renderSchemaPropertyRulePicker(); }, cancelEdit = ():void => closeSchemaPropertyRulePicker();
    const submit = (event:Event):void => { event.preventDefault(); if (validateRuleConfiguration(configuration).ready) createConfiguredSchemaRule(); };
    back.addEventListener("click", goBack); cancel.addEventListener("click", cancelEdit); form.addEventListener("submit", submit);
    schemaRulePickerDisposers.push(() => back.removeEventListener("click", goBack), () => cancel.removeEventListener("click", cancelEdit), () => form.removeEventListener("submit", submit));
    form.append(status, create, back, cancel); schemaPropertyRulePicker.replaceChildren(form); refreshValidation();
  };
  function openSchemaPropertyRulePicker(path: string, trigger?: HTMLButtonElement): void {
    const draft = active().workingDraft; if (!draft) return;
    const canonicalPath = normalizedRulePickerPath(path);
    const row = schemaPropertyRows(draft.document).find(({ canonicalPath:candidate }) => candidate === canonicalPath);
    const propertyType = (["string", "number", "array", "object", "boolean"] as const)
      .includes(row?.schema.type as SchemaPropertyType) ? row?.schema.type as SchemaPropertyType : "string";
    schemaRulePickerPath = path; schemaRulePickerTrigger = trigger; selectedSchemaPropertyPath = path;
    schemaPropertyInteractionReturn = { schemaId:active().id, path, triggerLabel:trigger?.ariaLabel ?? `Add rule for ${path}`,
      editorScroll:schemaEditor?.scrollTop ?? 0, treeScroll:schemaPropertyTree?.scrollTop ?? 0, detailScroll:schemaDetail?.scrollTop ?? 0 };
    editingAttachedLocalRule = draft.attachedRules?.find((rule) => normalizedRulePickerPath(rule.propertyPath ?? "") === canonicalPath);
    schemaRuleConfiguration = createRuleConfiguration("Required", propertyType);
    renderSchemaLocalRuleConfiguration(); schemaPropertyRulePicker?.showModal();
  }
  function closeSchemaPropertyRulePicker(): void {
    const path = schemaRulePickerPath; schemaPropertyRulePicker?.close(); schemaRulePickerTrigger?.focus();
    schemaRulePickerPath = undefined; schemaRulePickerTrigger = undefined; schemaRuleConfiguration = undefined; schemaRulePickerSearch = "";
    editingAttachedLocalRule = undefined; schemaPropertyInteractionReturn = undefined;
  }
  const cancelSchemaPropertyRulePicker = (event: Event): void => { event.preventDefault(); closeSchemaPropertyRulePicker(); };
  const navigateSchemaPropertyRulePicker = (event: KeyboardEvent): void => {
    if (event.key === "Escape") { event.preventDefault(); closeSchemaPropertyRulePicker(); }
  };
  const persistReusableSchemaRules = (): void => { ports.storage.setItem(SCHEMA_RULE_STORAGE_KEY, JSON.stringify(reusableSchemaRules)); };
  const applyPersistenceSnapshot = (nextSchemas: readonly SchemaDefinition[], nextRules: readonly ReusableSchemaRule[]): void => {
    schemas = structuredClone([...nextSchemas]); reusableSchemaRules = structuredClone([...nextRules]);
    ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(schemas)); persistReusableSchemaRules();
    renderSchemas(); renderSchemaRuleLibrary();
  };
  const beginSchemaPersistence = (kind: "promotion" | "guided", schemaId: string,
    previousSchemas: readonly SchemaDefinition[], previousRules: readonly ReusableSchemaRule[],
    nextSchemas: readonly SchemaDefinition[], nextRules: readonly ReusableSchemaRule[]): Promise<void> => {
    const generation = ++persistenceGeneration; let resolveCompletion!: () => void; let rejectCompletion!: (error:unknown) => void;
    const completion = new Promise<void>((resolve, reject) => { resolveCompletion = resolve; rejectCompletion = reject; });
    const transaction: PendingSchemaPersistence = {
      schemaId, generation, kind, paused:false, settled:false, previousSchemas:structuredClone([...previousSchemas]),
      previousRules:structuredClone([...previousRules]), nextSchemas:structuredClone([...nextSchemas]), nextRules:structuredClone([...nextRules]),
      pause() { if (transaction.settled || transaction.paused) return; transaction.paused = true;
        applyPersistenceSnapshot(transaction.previousSchemas, transaction.previousRules); },
      complete() { if (transaction.settled || transaction.generation !== generation) return; transaction.settled = true;
        if (transaction.paused) applyPersistenceSnapshot(transaction.nextSchemas, transaction.nextRules);
        if (pendingLocalRulePromotionPersistence === transaction) pendingLocalRulePromotionPersistence = undefined;
        if (pendingGuidedValidationPersistence === transaction) pendingGuidedValidationPersistence = undefined;
        resolveCompletion(); },
      reject(error) { if (transaction.settled || transaction.generation !== generation) return; transaction.settled = true;
        applyPersistenceSnapshot(transaction.previousSchemas, transaction.previousRules);
        if (pendingLocalRulePromotionPersistence === transaction) pendingLocalRulePromotionPersistence = undefined;
        if (pendingGuidedValidationPersistence === transaction) pendingGuidedValidationPersistence = undefined;
        rejectCompletion(error); },
    };
    if (kind === "promotion") pendingLocalRulePromotionPersistence = transaction;
    else pendingGuidedValidationPersistence = transaction;
    return completion;
  };
  const settleSchemaPersistence = (event: SchemaPersistenceEvent): void => {
    for (const pending of [pendingLocalRulePromotionPersistence, pendingGuidedValidationPersistence]) {
      if (!pending || pending.schemaId !== event.schemaId || pending.settled) continue;
      if (event.type === "failed") { if (pending.kind === "guided") pending.pause(); continue; }
      if (event.type === "rejected") pending.reject(event.error);
      else pending.complete();
    }
  };
  function restoreLocalRulePromotionPresentation(): void {
    pendingLocalRulePromotion = undefined; renderSchemas(); renderSchemaRuleLibrary();
  }
  function openLocalRulePromotionReview(propertyPath: string, sourceRuleId: string): boolean {
    const schema = activeSchemaId ? active() : undefined; if (!schema) return false;
    const generation = ++persistenceGeneration;
    let review: ReturnType<typeof reviewLocalRulePromotion>;
    try { review = reviewLocalRulePromotion({ schema, reusableRules:promotionReusableRules(),
      propertyPath, sourceRuleId, editorContext:"editable" }); }
    catch (error) { if (schemaResult) schemaResult.textContent = error instanceof Error ? error.message : "Promotion is no longer available."; return false; }
    pendingLocalRulePromotion = { propertyPath, sourceRuleId, generation };
    localRulePromotionDialog.open({ review,
      cancel:() => { if (pendingLocalRulePromotion?.generation === generation) restoreLocalRulePromotionPresentation(); },
      confirm:(selected: LocalRulePromotionSelection) => {
        if (pendingLocalRulePromotion?.generation !== generation) throw new Error("The promotion review is stale");
        const previousSchemas = structuredClone(schemas), previousRules = structuredClone(reusableSchemaRules);
        const result = selected.action === "create"
          ? promoteLocalRule({ schema, reusableRules:promotionReusableRules(), propertyPath,
            sourceRuleId, editorContext:"editable", ...selected, createId:ports.createRuleId })
          : promoteLocalRule({ schema, reusableRules:promotionReusableRules(), propertyPath,
            sourceRuleId, editorContext:"editable", action:"use-existing", reusableRuleId:selected.reusableRuleId });
        const nextSchemas = schemas.map((candidate) => candidate.id === result.schema.id ? result.schema : candidate);
        const nextRules = storedPromotionRules(result.reusableRules);
        persistLocalRulePromotion(ports.storage, { schemaKey:SCHEMA_LIBRARY_STORAGE_KEY,
          schemaValue:serializeSchemaLibrary(nextSchemas), ruleKey:SCHEMA_RULE_STORAGE_KEY, ruleValue:JSON.stringify(nextRules) });
        schemas = structuredClone(nextSchemas); reusableSchemaRules = structuredClone([...nextRules]); renderSchemas(); renderSchemaRuleLibrary();
        const completion = beginSchemaPersistence("promotion", result.schema.id, previousSchemas, previousRules, nextSchemas, nextRules);
        return completion.then(() => { if (pendingLocalRulePromotion?.generation === generation) {
          restoreLocalRulePromotionPresentation(); if (schemaResult) schemaResult.textContent =
            `Promoted ${sourceRuleId} to reusable rule ${result.replacementRuleId}.`; } });
      },
    });
    return true;
  }
  function persistPublishedGuidedValidation(result: PublishedGuidedValidation): Promise<void> {
    const rule = result.schema.rules[0]; if (!rule) return Promise.resolve();
    const previousSchemas = structuredClone(schemas), previousRules = structuredClone(reusableSchemaRules);
    const previousSchema = result.destination.previousSchemaId ? schemas.find(({ id }) => id === result.destination.previousSchemaId) : undefined;
    const assignment: SchemaAssignment = { id:result.assignment.id, name:result.assignment.name, sourceId:result.assignment.sourceId,
      eventName:result.assignment.eventName, target:result.assignment.target, priority:result.assignment.priority,
      versionPolicy:result.assignment.versionPolicy, enabled:true };
    const attachedRule = guidedAttachedRule(rule, result.reusableRules[0]?.name ?? `${rule.path} requirement`,
      `local-rule:${result.schema.id}:${rule.path}`);
    const currentDraft = previousSchema?.workingDraft; const assignments = assignmentDraftAfterGuidedSave(
      currentDraft?.assignments ?? previousSchema?.assignments ?? [], assignment, result.destination.assignmentAction);
    const document = mergeGuidedDocument(currentDraft?.document ?? previousSchema?.document ?? { type:"object" },
      guidedPropertyDocument(rule.path, rule.expectedType));
    const attachedRules = [...(currentDraft?.attachedRules ?? previousSchema?.attachedRules ?? []).filter((candidate) =>
      candidate.id !== attachedRule.id || candidate.propertyPath !== attachedRule.propertyPath), attachedRule];
    const schema: SchemaDefinition = previousSchema
      ? updateSchemaWorkingDraft(previousSchema, { document, assignments, attachedRules }, `Add ${rule.path} validation`)
      : { id:result.schema.id, name:result.schema.name, version:1, document:{ type:"object" }, assignments:[], published:false,
        workingDraft:{ baseVersion:0, sourceVersion:0, document, assignments, attachedRules, pendingChanges:[`Add ${rule.path} validation`] } };
    const nextSchemas = [...schemas.filter(({ id }) => id !== schema.id), schema];
    const published = result.reusableRules[0]; const nextRules = published ? [...reusableSchemaRules.filter(({ id }) => id !== published.id),
      { id:published.id, name:published.name, kind:"Guided validation", version:published.version, enabled:published.enabled ?? true,
        attachments:[schema.id], ...(attachedRule.operator ? { operator:attachedRule.operator } : {}),
        ...(attachedRule.parameters ? { parameters:attachedRule.parameters } : {}), ...(attachedRule.allowedValues ? { allowedValues:attachedRule.allowedValues } : {}),
        ...(attachedRule.severity ? { severity:attachedRule.severity } : {}), ...(attachedRule.message ? { message:attachedRule.message } : {}),
        ...(attachedRule.conditionGroup ? { conditionGroup:attachedRule.conditionGroup } : {}) } satisfies ReusableSchemaRule] : reusableSchemaRules;
    applyPersistenceSnapshot(nextSchemas, nextRules);
    return beginSchemaPersistence("guided", schema.id, previousSchemas, previousRules, nextSchemas, nextRules);
  }
  type GuidedCapturedEvent = { id:string; sourceId:string; name:string; payload:unknown; rawInput:unknown; pageUrl?:string };
  const guidedDocumentTypes = (value:unknown):readonly string[] => {
    if (Array.isArray(value)) return ["array"];
    if (value === null) return ["null"];
    if (typeof value === "object") return ["object", ...Object.values(value as Record<string, unknown>).flatMap(guidedDocumentTypes)];
    return [typeof value];
  };
  const guidedSchemaCandidate = (event:GuidedCapturedEvent, schema:SchemaDefinition) => {
    const assignment = schema.assignments.find((candidate) => candidate.sourceId === event.sourceId && candidate.eventName === event.name && candidate.enabled !== false);
    return assignment ? { schema, assignment, typeCoverage:new Set(guidedDocumentTypes(event.payload)).size } : undefined;
  };
  const guidedSchemaCandidates = (event:GuidedCapturedEvent) => schemas.map((schema) => guidedSchemaCandidate(event, schema)).filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
  const guidedSchemaPropertyTypes = (document:SchemaDefinition["document"], prefix=""):Record<string,"String"|"Number"|"Boolean"|"Array"|"Object"> =>
    Object.entries(document.properties ?? {}).reduce<Record<string,"String"|"Number"|"Boolean"|"Array"|"Object">>((types, [name, child]) => {
      const path=prefix ? `${prefix}.${name}` : name, type=child.type === "string" ? "String" : child.type === "number" ? "Number"
        : child.type === "boolean" ? "Boolean" : child.type === "array" ? "Array" : child.type === "object" ? "Object" : undefined;
      if (type) types[path]=type; return { ...types, ...guidedSchemaPropertyTypes(child, path) };
    }, {});
  const guidedUiCandidate = (schema:SchemaDefinition) => { const editable=schema.workingDraft ? schemaEditorDraft(schema) : schema; return {
    id:schema.id, name:schema.name, version:schema.version, target:editable.assignments[0]?.target ?? "payload" as const,
    propertyTypes:guidedSchemaPropertyTypes(editable.document), assignments:editable.assignments.map((assignment) => ({
      ...(assignment.id ? { id:assignment.id } : {}), ...(assignment.name ? { name:assignment.name } : {}), sourceId:assignment.sourceId,
      eventName:assignment.eventName, target:assignment.target, ...(assignment.domainCondition ? { domainCondition:assignment.domainCondition } : {}),
      ...(assignment.pathnameCondition ? { pathnameCondition:assignment.pathnameCondition } : {}), ...(assignment.pathConditions ? { pathConditions:assignment.pathConditions } : {}),
      ...(assignment.priority !== undefined ? { priority:assignment.priority } : {}), ...(assignment.versionPolicy ? { versionPolicy:assignment.versionPolicy } : {}),
      ...(assignment.enabled !== undefined ? { enabled:assignment.enabled } : {}) })) }; };
  const guidedEvent = (event:GuidedCapturedEvent):GuidedCapturedEvent => structuredClone(event);
  const guidedUiEvent = (event:GuidedCapturedEvent) => ({ id:event.id, sourceId:event.sourceId, name:event.name,
    pageUrl:event.pageUrl ?? globalThis.location?.href ?? "https://invalid.local/", payload:event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
      ? structuredClone(event.payload) as Record<string,unknown> : {} });
  const openGuidedValidationForEvent = async (event:GuidedCapturedEvent, schema?:SchemaDefinition):Promise<void> => {
    event = guidedEvent(event);
    const selected = schema ?? selectedGuidedContinuation(guidedContinuationSelections, event, schemas) ?? guidedSchemaCandidates(event)[0]?.schema;
    if (selected) persistGuidedContinuation(event, selected.id);
    guidedPropertyReturn = undefined; if (guidedValidationRoot) { guidedValidationRoot.hidden = false;
      guidedValidationRoot.dataset.eventId = event.id; guidedValidationRoot.dataset.schemaId = selected?.id ?? ""; }
    guidedValidationFlow.open(guidedUiEvent(event), selected ? guidedUiCandidate(selected) : undefined);
  };
  const openGuidedValidationForProperty = async (event:GuidedCapturedEvent, schema:SchemaDefinition, propertyPath:string):Promise<void> => {
    event = guidedEvent(event); persistGuidedContinuation(event, schema.id);
    if (guidedValidationRoot) { guidedValidationRoot.hidden = false; guidedValidationRoot.dataset.eventId = event.id;
      guidedValidationRoot.dataset.schemaId = schema.id; }
    guidedValidationFlow.openProperty(guidedUiEvent(event), propertyPath, guidedUiCandidate(schema));
    guidedPropertyReturn = { schemaId:schema.id, propertyPath, generation:lifecycleGeneration };
  };
  const guidedDraftContinuationForEvent = (event:GuidedCapturedEvent) => {
    const schema = selectedGuidedContinuation(guidedContinuationSelections, event, schemas);
    return schema?.workingDraft ? { schemaId:schema.id, schemaName:schema.name, schemaVersion:schema.version, pendingChanges:schema.workingDraft.pendingChanges.length,
      addProperty:() => { guidedValidationFlow.open(guidedUiEvent(event), guidedUiCandidate(schema)); }, review:() => openGuidedDraft(schema),
      publish:() => { openGuidedDraft(schema); openSchemaRevisionReview(); }, useDifferent:() => openGuidedContinuationPicker(event) } : undefined;
  };
  const finishGuidedValidationSave = (result:PublishedGuidedValidation):void => {
    persistGuidedContinuation({ sourceId:result.assignment.sourceId, name:result.assignment.eventName }, result.schema.id);
    if (guidedPropertyReturn?.schemaId === result.schema.id && guidedPropertyReturn.generation === lifecycleGeneration) {
      restoreGuidedPropertyReturn();
    }
    if (schemaResult) schemaResult.textContent = result.destination.kind === "new" ? `Draft ${result.schema.name} was created.` : `Validation was added to ${result.schema.name} draft.`;
  };
  const renderSchemaValidationRecords = ():void => {
    if (!schemaValidationRecordList || !schemaOwnerDocument) return;
    for (const dispose of capturedContinuationRowDisposers.splice(0)) dispose();
    for (const dispose of capturedContinuationDialogDisposers.splice(0)) dispose();
    schemaValidationRecordList.replaceChildren(...schemaValidationRecords.map((record) => {
      const item = schemaOwnerDocument.createElement("li"), continueButton = schemaOwnerDocument.createElement("button");
      item.textContent = `${record.eventName} · ${record.state}${record.schemaName ? ` · ${record.schemaName} v${record.schemaVersion}` : ""} · ${record.checkedAt}`;
      if (ports.prepareCapturedValidationContinuation) { continueButton.type = "button"; continueButton.textContent = "Continue in project";
        const review = ():void => { void reviewCapturedValidationContinuation(record, continueButton); };
        continueButton.addEventListener("click", review); capturedContinuationRowDisposers.push(() => continueButton.removeEventListener("click", review)); item.append(continueButton); }
      return item;
    }));
  };
  async function reviewCapturedValidationContinuation(record:SchemaValidationRecord, trigger:HTMLButtonElement):Promise<void> {
    if (!ports.prepareCapturedValidationContinuation || !guidedValidationRoot || !schemaOwnerDocument || !mounted) return;
    const generation = lifecycleGeneration, continuation = await ports.prepareCapturedValidationContinuation(structuredClone(record));
    if (!mounted || generation !== lifecycleGeneration) return;
    for (const dispose of capturedContinuationDialogDisposers.splice(0)) dispose();
    const dialog = schemaOwnerDocument.createElement("dialog"), summary = schemaOwnerDocument.createElement("p"), destination = schemaOwnerDocument.createElement("select"),
      confirm = schemaOwnerDocument.createElement("button"), cancel = schemaOwnerDocument.createElement("button");
    summary.textContent = continuation.summary;
    for (const choice of continuation.destinations) { const option = schemaOwnerDocument.createElement("option"); option.value = choice.id; option.textContent = choice.label; destination.append(option); }
    confirm.type = cancel.type = "button"; confirm.textContent = "Continue"; cancel.textContent = "Cancel"; confirm.disabled = !destination.value;
    const close = ():void => { for (const dispose of capturedContinuationDialogDisposers.splice(0)) dispose(); dialog.close(); dialog.remove(); trigger.focus({ preventScroll:true }); };
    const selectDestination = ():void => { confirm.disabled = !destination.value; };
    const confirmContinuation = ():void => { const selected = destination.value; if (!selected) return; confirm.disabled = true;
      void continuation.commit(selected).then(() => { if (mounted && generation === lifecycleGeneration) close(); }, () => {
        if (mounted && generation === lifecycleGeneration) confirm.disabled = false; }); };
    destination.addEventListener("change", selectDestination); confirm.addEventListener("click", confirmContinuation); cancel.addEventListener("click", close);
    capturedContinuationDialogDisposers.push(() => destination.removeEventListener("change", selectDestination),
      () => confirm.removeEventListener("click", confirmContinuation), () => cancel.removeEventListener("click", close), () => { dialog.close(); dialog.remove(); });
    dialog.append(summary, destination, confirm, cancel); guidedValidationRoot.replaceChildren(dialog); dialog.showModal(); destination.focus();
  }
  const recheckCapturedSchemaValidation = (events:readonly GuidedCapturedEvent[] = []):readonly SchemaValidationRecord[] => {
    const checkedAt = new Date().toISOString(), issues:string[] = [];
    const records = events.map((event):SchemaValidationRecord => { const override = manualSchemaOverrides[event.id], candidates = override ? schemas.filter(({ id }) => id === override) : schemas;
      const result = validateEvent({ sourceId:event.sourceId, eventName:event.name, payload:event.payload, rawInput:event.rawInput }, candidates, event.pageUrl);
      issues.push(...result.issues.map((issue) => `${event.name} · ${issue.instancePath || "root"} · ${issue.message}`));
      return { eventId:event.id, eventName:event.name, state:result.state, checkedAt, ...(result.schema ? { schemaId:result.schema.id, schemaName:result.schema.name,
        schemaVersion:result.schema.version } : {}), issueCodes:result.issues.map((issue) => issue.rule ?? issue.schemaLocation) }; });
    schemaValidationRecords = [...schemaValidationRecords, ...records].slice(-50); ports.storage.setItem(SCHEMA_VALIDATION_RECORD_STORAGE_KEY, JSON.stringify(schemaValidationRecords));
    schemaValidationIssues?.replaceChildren(...issues.map((textContent) => Object.assign(schemaOwnerDocument!.createElement("li"), { textContent })));
    renderSchemaValidationRecords(); if (schemaResult) schemaResult.textContent = events.length ? `Rechecked ${events.length} captured events.` : "No captured events are available to recheck.";
    return structuredClone(records);
  };
  const recheckCapturedSchemaValidationFromControl = ():void => { recheckCapturedSchemaValidation(); };
  const createSchemaDraft = ():void => { const sequence = schemas.length + 1, created:SchemaDefinition = { id:`schema:new:${sequence}`, name:`Untitled schema ${sequence}`,
    version:0, document:{ type:"object" }, assignments:[], published:false, workingDraft:{ baseVersion:0, sourceVersion:0, document:{ type:"object" }, assignments:[], pendingChanges:[] } };
    schemas = [...schemas, created]; activeSchemaId = created.id; schemaDraft = structuredClone(created); persistSchemaLibrary(); renderSchemas(); };
  function schemaDocumentPaths(document:SchemaDefinition["document"]):readonly string[] { return schemaPropertyRows(document).map(({ canonicalPath }) => canonicalPath); }
  function schemaPropertyAt(document:SchemaDefinition["document"], path:string):unknown { return schemaPropertyRows(document).find(({ canonicalPath }) => canonicalPath === normalizedRulePickerPath(path))?.schema; }
  function schemaDocumentFromValue(value:unknown):SchemaDefinition["document"] {
    if (!value || typeof value !== "object" || Array.isArray(value)) return { type:typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string" };
    return { type:"object", properties:Object.fromEntries(Object.entries(value).map(([name, child]) => [name, schemaDocumentFromValue(child)])) };
  }
  function openSchemaFromSource(name:string, value:unknown):SchemaDefinition { const sequence = schemas.length + 1, schema:SchemaDefinition = {
    id:`schema:source:${sequence}`, name, version:0, document:{ type:"object" }, assignments:[], published:false,
    workingDraft:{ baseVersion:0, sourceVersion:0, document:schemaDocumentFromValue(value), assignments:[], pendingChanges:["Create schema from captured source"] } };
    schemas = [...schemas, schema]; activeSchemaId = schema.id; schemaDraft = structuredClone(schema); persistSchemaLibrary(); renderSchemas(); return structuredClone(schema); }
  function openNewSchemaEditor():void { createSchemaDraft(); }
  function defineSchemaProperty(document:SchemaDefinition["document"], definition:ManualPropertyDefinition):SchemaDefinition["document"] {
    return addManualProperty(document, [], definition);
  }
  function schemaPropertyType(document:SchemaDefinition["document"], path:string):SchemaPropertyType | undefined {
    const value = schemaPropertyAt(document, path) as { type?:SchemaPropertyType } | undefined; return value?.type;
  }
  function captureSchemaPropertyInteractionReturn(path:string, triggerLabel:string):void { schemaPropertyInteractionReturn = { schemaId:active().id,
    path, triggerLabel, editorScroll:schemaEditor?.scrollTop ?? 0, treeScroll:schemaPropertyTree?.scrollTop ?? 0, detailScroll:schemaDetail?.scrollTop ?? 0 }; }
  function restoreSchemaPropertyInteractionReturn():void { const restoration = schemaPropertyInteractionReturn; if (!restoration || restoration.schemaId !== activeSchemaId) return;
    selectedSchemaPropertyPath = restoration.path; if (schemaEditor) schemaEditor.scrollTop = restoration.editorScroll;
    schemaPropertyTree && (schemaPropertyTree.scrollTop = restoration.treeScroll); schemaDetail && (schemaDetail.scrollTop = restoration.detailScroll); renderSchemas(); }
  function finishSchemaPropertyInteractionReturn():void { restoreSchemaPropertyInteractionReturn(); schemaPropertyInteractionReturn = undefined; }
  function closeSchemaPropertyRulePickerInternal(restore=true):void { if (restore) finishSchemaPropertyInteractionReturn(); closeSchemaPropertyRulePicker(); }
  function closeSchemaPropertyRulePickerForCommit():void { closeSchemaPropertyRulePickerInternal(true); }
  function assignmentConditionCapturedValue(target: AssignmentConditionTarget): unknown {
    return ports.capturedAssignmentValue(target);
  }
  function assignmentConditionEditorState(target: AssignmentConditionTarget,
    group?: AssignmentDataConditionGroup): AssignmentDataConditionEditorState {
    return { target, ...(group ? { group:structuredClone(group) } : {}),
      suggestions:assignmentConditionSuggestions(assignmentConditionCapturedValue(target)) };
  }
  function renderSchemaAssignmentConditionEditor(): void {
    if (!schemaAssignmentDataConditions) return;
    ports.renderAssignmentConditions(schemaAssignmentDataConditions, schemaAssignmentConditionState, (next) => {
      schemaAssignmentConditionState = { ...structuredClone(next),
        suggestions:assignmentConditionSuggestions(assignmentConditionCapturedValue(next.target)) };
      renderSchemaAssignmentConditionEditor();
    });
    const validation = validateAssignmentDataConditions(schemaAssignmentConditionState.group);
    if (saveSchemaAssignmentButton) { saveSchemaAssignmentButton.disabled = !validation.ready;
      saveSchemaAssignmentButton.title = validation.ready ? "" : validation.assistance; }
  }
  const editSchemaAssignment = (schemaId: string, assignment: SchemaAssignment): void => {
    editingSchemaAssignment = assignment.id ? { schemaId, assignmentId:assignment.id } : { schemaId };
    if (schemaAssignmentSchema) schemaAssignmentSchema.value = schemaId;
    if (schemaAssignmentSource) schemaAssignmentSource.value = assignment.sourceId;
    if (schemaAssignmentEvent) schemaAssignmentEvent.value = assignment.eventName;
    if (schemaAssignmentTarget) schemaAssignmentTarget.value = assignment.target;
    if (schemaAssignmentDomain) schemaAssignmentDomain.value = assignment.domainCondition ?? "";
    if (schemaAssignmentPathname) schemaAssignmentPathname.value = assignment.pathnameCondition ?? "";
    if (schemaAssignmentPriority) schemaAssignmentPriority.value = String(assignment.priority ?? 0);
    if (schemaAssignmentVersionPolicy) schemaAssignmentVersionPolicy.value = assignment.versionPolicy ?? "pinned";
    if (schemaAssignmentEnabled) schemaAssignmentEnabled.checked = assignment.enabled !== false;
    schemaAssignmentConditionState = assignmentConditionEditorState(assignment.conditionTarget ?? assignment.target,
      assignment.dataConditionGroup); renderSchemaAssignmentConditionEditor();
    if (schemaAssignmentEditor) schemaAssignmentEditor.hidden = false;
  };
  const mutateSchemaAssignment = (schemaId: string, assignmentId: string | undefined,
    mutate: (assignment: SchemaAssignment) => SchemaAssignment | undefined): void => {
    schemas = schemas.map((schema) => schema.id !== schemaId ? schema : { ...schema,
      assignments:schema.assignments.flatMap((assignment) => assignment.id !== assignmentId ? [assignment] : (() => {
        const changed = mutate(assignment); return changed ? [changed] : [];
      })()),
    });
    persistSchemaLibrary(); renderSchemas();
  };
  const renderSchemaAssignments = (): void => {
    const assignments = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment })));
    if (schemaAssignmentSchema?.ownerDocument) schemaAssignmentSchema.replaceChildren(...schemas.map((schema) => {
      const option = schemaAssignmentSchema.ownerDocument.createElement("option"); option.value = schema.id;
      option.textContent = `${schema.name} version ${schema.version}`; return option;
    }));
    if (schemaAssignmentList?.ownerDocument) schemaAssignmentList.replaceChildren(...assignments.map(({ schema, assignment }) => {
      const item = schemaAssignmentList.ownerDocument.createElement("li"); const summary = schemaAssignmentList.ownerDocument.createElement("span");
      summary.textContent = `${assignment.name ?? assignment.id ?? "Assignment"} · ${assignment.sourceId}/${assignment.eventName} · ${assignment.target} · ${assignmentDataConditionSummary(assignment)} · priority ${assignment.priority ?? 0} · ${assignment.enabled === false ? "disabled" : "enabled"} · ${schema.name}`;
      const edit = schemaAssignmentList.ownerDocument.createElement("button"); const duplicate = schemaAssignmentList.ownerDocument.createElement("button");
      const disable = schemaAssignmentList.ownerDocument.createElement("button"); const remove = schemaAssignmentList.ownerDocument.createElement("button");
      edit.type = duplicate.type = disable.type = remove.type = "button"; edit.textContent = "Edit"; duplicate.textContent = "Duplicate";
      disable.textContent = assignment.enabled === false ? "Enable" : "Disable"; remove.textContent = "Delete";
      edit.addEventListener("click", () => editSchemaAssignment(schema.id, assignment));
      duplicate.addEventListener("click", () => { schemas = schemas.map((candidate) => candidate.id !== schema.id ? candidate : { ...candidate,
        assignments:[...candidate.assignments, duplicateSchemaAssignment(assignment, `${assignment.id ?? "assignment"}:copy`, `${assignment.name ?? "Assignment"} copy`)] });
        persistSchemaLibrary(); renderSchemas(); });
      disable.addEventListener("click", () => mutateSchemaAssignment(schema.id, assignment.id,
        (item) => ({ ...item, enabled:item.enabled === false })));
      remove.addEventListener("click", () => mutateSchemaAssignment(schema.id, assignment.id, () => undefined));
      item.append(summary, edit, duplicate, disable, remove); return item;
    }));
    const collisions = new Map<string, string[]>();
    for (const { schema, assignment } of assignments.filter(({ assignment }) => assignment.enabled !== false)) {
      const key = [assignment.sourceId, assignment.eventName, assignment.target, assignment.priority ?? 0,
        assignment.domainCondition ?? "any", assignment.pathnameCondition ?? "any", assignmentDataConditionSummary(assignment)].join("|");
      collisions.set(key, [...(collisions.get(key) ?? []), `${schema.name}/${assignment.name ?? assignment.id ?? "unnamed"}`]);
    }
    const conflicts = [...collisions.values()].filter((matches) => matches.length > 1);
    if (schemaAssignmentConflicts) schemaAssignmentConflicts.textContent = conflicts.length
      ? `Assignment conflict: ${conflicts.map((matches) => matches.join(", ")).join("; ")}. Edit priorities before validation.` : "";
  };
  const changeSchemaAssignmentTarget = (): void => {
    if (!schemaAssignmentConditionState.group) {
      schemaAssignmentConditionState = assignmentConditionEditorState(schemaAssignmentTarget?.value === "raw input" ? "raw input" : "payload");
      renderSchemaAssignmentConditionEditor();
    }
  };
  const openNewSchemaAssignmentEditor = (): void => {
    editingSchemaAssignment = undefined; const target = schemaAssignmentTarget?.value === "raw input" ? "raw input" : "payload";
    schemaAssignmentConditionState = assignmentConditionEditorState(target); renderSchemaAssignmentConditionEditor();
    if (schemaAssignmentEditor) schemaAssignmentEditor.hidden = false; schemaAssignmentSource?.focus();
  };
  const saveSchemaAssignment = (): void => {
    const schema = schemas.find((candidate) => candidate.id === schemaAssignmentSchema?.value) ?? schemas[0]; if (!schema) return;
    const conditionValidation = validateAssignmentDataConditions(schemaAssignmentConditionState.group);
    if (!conditionValidation.ready) { if (schemaResult) schemaResult.textContent = conditionValidation.assistance;
      renderSchemaAssignmentConditionEditor(); return; }
    const sourceId = schemaAssignmentSource?.value.trim() || "event-history";
    const eventName = schemaAssignmentEvent?.value.trim() || "page_view"; const target = schemaAssignmentTarget?.value === "raw input" ? "raw input" : "payload";
    const existing = editingSchemaAssignment?.schemaId === schema.id
      ? schema.assignments.find(({ id }) => id === editingSchemaAssignment?.assignmentId) : undefined;
    const next: SchemaAssignment = { id:editingSchemaAssignment?.assignmentId ?? `assignment:${schema.id}:${eventName}`,
      name:existing?.name ?? `${schema.name} automatic`, sourceId, eventName, target,
      priority:Number(schemaAssignmentPriority?.value || 10),
      ...(schemaAssignmentDomain?.value.trim() ? { domainCondition:schemaAssignmentDomain.value.trim() } : {}),
      ...(schemaAssignmentPathname?.value.trim() ? { pathnameCondition:schemaAssignmentPathname.value.trim() } : {}),
      ...(schemaAssignmentConditionState.group ? { conditionTarget:schemaAssignmentConditionState.target,
        dataConditionGroup:structuredClone(schemaAssignmentConditionState.group) } : {}),
      versionPolicy:schemaAssignmentVersionPolicy?.value === "follow latest" ? "follow latest" : "pinned",
      enabled:schemaAssignmentEnabled?.checked ?? true };
    schemas = schemas.map((candidate) => candidate.id !== schema.id ? candidate : { ...candidate,
      assignments:editingSchemaAssignment?.schemaId === schema.id
        ? candidate.assignments.map((assignment) => assignment.id === editingSchemaAssignment?.assignmentId ? next : assignment)
        : [...candidate.assignments.filter(({ id }) => id !== next.id), next] });
    editingSchemaAssignment = undefined; persistSchemaLibrary(); renderSchemas(); if (schemaAssignmentEditor) schemaAssignmentEditor.hidden = true;
    if (schemaResult) schemaResult.textContent = `Saved ${next.name} with ${assignmentDataConditionSummary(next)}.`;
  };
  const renderSchemaRuleLibrary = (): void => {
    const query = schemaRuleSearch?.value.trim().toLowerCase() ?? "";
    const visible = reusableSchemaRules.filter((rule) => `${rule.name} ${rule.kind}`.toLowerCase().includes(query));
    for (const dispose of schemaRuleRowDisposers.splice(0)) dispose();
    if (!schemaRuleList?.ownerDocument) { if (schemaRuleList) schemaRuleList.textContent = visible.map((rule) => `${rule.name} v${rule.version} · ${rule.kind}`).join("\n"); return; }
    schemaRuleList.replaceChildren(...visible.map((rule) => { const item = schemaRuleList.ownerDocument!.createElement("li"), summary = schemaRuleList.ownerDocument!.createElement("span");
      summary.textContent = `${rule.name} v${rule.version} · ${rule.kind}`; item.append(summary);
      const action = (label:string, run:() => void) => { const button = schemaRuleList.ownerDocument!.createElement("button"); button.type = "button"; button.textContent = label;
        listenRule(button, "click", run); item.append(button); };
      action("Edit", () => { editReusableSchemaRule(rule.id); });
      action("Sync", () => { openReusableRuleSyncReview(rule.id); });
      action("Duplicate", () => { reusableSchemaRules = [...reusableSchemaRules, { ...structuredClone(rule), id:ports.createRuleId(), name:`${rule.name} copy`, version:1, attachments:[] }]; persistReusableSchemaRules(); renderSchemaRuleLibrary(); });
      action("Export", () => ports.downloadSchema(rule, `${rule.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-rule-v${rule.version}.json`));
      action(rule.enabled ? "Disable" : "Enable", () => { reusableSchemaRules = reusableSchemaRules.map((candidate) => candidate.id === rule.id ? { ...candidate, enabled:!candidate.enabled } : candidate); persistReusableSchemaRules(); renderSchemaRuleLibrary(); });
      action("Delete", () => { requestSchemaRuleDeletion(rule.id); }); return item; }));
  };
  const expansionReusableRules = ():readonly PromotableReusableRule[] => structuredClone(reusableSchemaRules) as readonly PromotableReusableRule[];
  const promotionReusableRules = expansionReusableRules;
  const storedReusableRule = (id:string):ReusableSchemaRule | undefined => reusableSchemaRules.find((rule) => rule.id === id);
  const persistSchemaAndRuleLibraries = ():void => { persistReusableSchemaRules(); persistSchemaLibrary(); };
  const schemaRuleTypeForAttachment = (schema:SchemaDefinition, propertyPath:string):SchemaPropertyType => {
    const row = schemaPropertyRows(schema.workingDraft?.document ?? schema.document).find(({ canonicalPath }) => canonicalPath === normalizedRulePickerPath(propertyPath));
    return (["string", "number", "array", "object", "boolean"] as const).includes(row?.schema.type as SchemaPropertyType)
      ? row!.schema.type as SchemaPropertyType : "string";
  };
  const attachReusableRule = (schemaId:string, ruleId:string, propertyPath?:string):boolean => {
    const rule = storedReusableRule(ruleId), schema = schemas.find(({ id }) => id === schemaId); if (!rule || !schema) return false;
    if (propertyPath && rule.applicableType && rule.applicableType !== schemaRuleTypeForAttachment(schema, propertyPath)) return false;
    schemas = schemas.map((candidate) => candidate.id !== schemaId ? candidate : { ...candidate, attachedRules:[...(candidate.attachedRules ?? [])
      .filter((attached) => attached.id !== rule.id || attached.propertyPath !== propertyPath), { id:rule.id, name:rule.name, version:rule.version,
        ...(propertyPath ? { propertyPath:normalizedRulePickerPath(propertyPath) } : {}), ...(rule.operator ? { operator:rule.operator } : {}),
        ...(rule.parameters ? { parameters:rule.parameters } : {}), ...(rule.severity ? { severity:rule.severity } : {}),
        ...(rule.message ? { message:rule.message } : {}), enabled:rule.enabled }] });
    persistSchemaAndRuleLibraries(); renderSchemas(); return true;
  };
  const updateAttachedRule = (schemaId:string, ruleId:string, enabled:boolean):boolean => {
    let changed = false; schemas = schemas.map((schema) => { if (schema.id !== schemaId || !schema.attachedRules) return schema;
      return { ...schema, attachedRules:schema.attachedRules.map((rule) => { if (rule.id !== ruleId) return rule; changed = true; return { ...rule, enabled }; }) }; });
    if (changed) { persistSchemaAndRuleLibraries(); renderSchemas(); } return changed;
  };
  const editReusableSchemaRule = (id:string):boolean => {
    const rule = storedReusableRule(id); if (!rule) return false; editingReusableSchemaRuleId = id; openNewSchemaRuleEditor();
    if (schemaRuleName) schemaRuleName.value = rule.name; if (schemaRuleParameters) schemaRuleParameters.value = rule.parameters ?? "";
    if (schemaRuleTypes) schemaRuleTypes.value = rule.applicableType ?? "string"; if (schemaRuleOperator) schemaRuleOperator.value = rule.operator ?? "required";
    if (schemaRuleSeverity) schemaRuleSeverity.value = rule.severity ?? "error"; if (schemaRuleMessage) schemaRuleMessage.value = rule.message ?? "";
    if (schemaRuleExamples) schemaRuleExamples.value = rule.examples ?? ""; return true;
  };
  const openAttachedSchemaRuleEditor = (schemaId:string, ruleId:string):boolean => {
    const schema = schemas.find(({ id }) => id === schemaId), attached = schema?.attachedRules?.find(({ id }) => id === ruleId);
    return Boolean(attached && editReusableSchemaRule(ruleId));
  };
  const focusSchemaPropertyRule = (propertyPath:string):void => { selectedSchemaPropertyPath = propertyPath.replace(/^\//, "").replaceAll("/", "."); renderSchemas(); };
  const focusSchemaPropertyRow = focusSchemaPropertyRule;
  const renderSchemaWorkflowRows = ():void => { renderSchemaRuleLibrary(); renderSchemaAssignments(); };
  const openNewSchemaRuleEditor = (): void => {
    if (!editingReusableSchemaRuleId) pendingRuleSnapshotMetadata = undefined;
    if (schemaRuleEditor) schemaRuleEditor.hidden = false;
    if (schemaRuleName) schemaRuleName.value = ""; if (schemaRuleParameters) schemaRuleParameters.value = "";
    if (schemaRuleMessage) schemaRuleMessage.value = ""; if (schemaRuleExamples) schemaRuleExamples.value = "";
    if (schemaRuleTypes) schemaRuleTypes.value = "string"; if (schemaRuleSeverity) schemaRuleSeverity.value = "error";
    if (schemaRuleAttachments?.ownerDocument) schemaRuleAttachments.replaceChildren(...schemas.map((schema) => {
      const option = schemaRuleAttachments.ownerDocument.createElement("option"); option.value = schema.id;
      option.textContent = `${schema.name} v${schema.version}`; return option; }));
    schemaRuleName?.focus();
  };
  const saveReusableSchemaRule = (): void => {
    const name = schemaRuleName?.value.trim(); if (!name) return;
    const parameters = schemaRuleParameters?.value.trim(); const applicableType = schemaRuleTypes?.value as SchemaPropertyType | undefined;
    const operator = schemaRuleOperator?.value; const severity = schemaRuleSeverity?.value; const message = schemaRuleMessage?.value.trim();
    const examples = schemaRuleExamples?.value.trim(); const attachments = Array.from(schemaRuleAttachments?.selectedOptions ?? []).map(({ value }) => value);
    const previous = editingReusableSchemaRuleId ? storedReusableRule(editingReusableSchemaRuleId) : undefined;
    if (previous && approvedRuleRevisionId !== previous.id) { captureReusableRuleSnapshot();
      requestSchemaRuleRevision(previous.id, { name, kind:`${operator || "Required"}${parameters ? ` (${parameters})` : ""}`,
        ...(applicableType ? { applicableType } : {}), ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}),
        ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), attachments }); return; }
    const rule: ReusableSchemaRule = { id:previous?.id ?? ports.createRuleId(), name,
      kind:`${operator || "Required"}${parameters ? ` (${parameters})` : ""}`, version:(previous?.version ?? 0) + 1, enabled:previous?.enabled ?? true,
      ...(applicableType ? { applicableType } : {}), ...(operator ? { operator } : {}), ...(parameters ? { parameters } : {}),
      ...(severity ? { severity } : {}), ...(message ? { message } : {}), ...(examples ? { examples } : {}), attachments };
    pendingRuleSnapshotMetadata = previous ? { id:previous.id, version:previous.version, attachments:[...(previous.attachments ?? [])] } : undefined;
    reusableSchemaRules = [...reusableSchemaRules.filter(({ id }) => id !== rule.id), rule];
    if (updateSchemaRuleAttachments?.checked || rule.version === 1) schemas = schemas.map((schema) => {
      if (!attachments.includes(schema.id)) return schema;
      const attachedRules = [...(schema.attachedRules ?? []).filter(({ id }) => id !== rule.id),
        { id:rule.id, name:rule.name, version:rule.version, ...(operator ? { operator } : {}),
          ...(parameters ? { parameters } : {}), ...(severity ? { severity } : {}), ...(message ? { message } : {}), enabled:true }];
      return { ...schema, attachedRules };
    });
    editingReusableSchemaRuleId = undefined; persistSchemaAndRuleLibraries(); renderSchemas(); renderSchemaRuleLibrary();
    if (schemaRuleEditor) schemaRuleEditor.hidden = true;
  };
  const captureReusableRuleSnapshot = ():void => { const previous = editingReusableSchemaRuleId ? storedReusableRule(editingReusableSchemaRuleId) : undefined;
    if (previous) pendingRuleSnapshotMetadata = { id:previous.id, version:previous.version, attachments:[...(previous.attachments ?? [])] }; };
  const captureReusableRuleSnapshotFromEditor = (event:Event):void => { if ((event.target as HTMLElement)?.id === "schema-rule-save") captureReusableRuleSnapshot(); };
  const updateRuleAttachmentPreview = (): void => {
    if (schemaResult) schemaResult.textContent = updateSchemaRuleAttachments?.checked
      ? "Pinned attachments will be updated" : "Existing pinned attachments remain unchanged";
  };
  const requestSchemaRuleRevision = (id: string,
    changes: Partial<Omit<ReusableSchemaRule, "id" | "version" | "revisionHistory">>): boolean => {
    const previous = reusableSchemaRules.find((rule) => rule.id === id); if (!previous) return false;
    pendingSchemaRuleRevision = { id, changes:structuredClone(changes) }; approvedRuleRevisionId = undefined;
    const nextName = changes.name ?? previous.name; const nextParameters = changes.parameters ?? previous.parameters ?? "none";
    if (schemaRuleRevisionReviewSummary) schemaRuleRevisionReviewSummary.textContent =
      `${previous.name} v${previous.version} will become ${nextName} v${previous.version + 1}; parameters ${previous.parameters ?? "none"} → ${nextParameters}.`;
    schemaRuleRevisionReview?.showModal(); confirmSchemaRuleRevisionButton?.focus(); return true;
  };
  const confirmReusableSchemaRuleRevision = (): void => {
    const pending = pendingSchemaRuleRevision; if (!pending) return;
    reusableSchemaRules = reusableSchemaRules.map((rule) => rule.id !== pending.id ? rule : {
      ...rule, ...structuredClone(pending.changes), version:rule.version + 1,
      revisionHistory:[...(rule.revisionHistory ?? []), {
        name:rule.name, kind:rule.kind, version:rule.version, ...(rule.enabled === false ? { enabled:false } : {}),
        ...(rule.applicableType ? { applicableType:rule.applicableType } : {}), ...(rule.operator ? { operator:rule.operator } : {}),
        ...(rule.parameters ? { parameters:rule.parameters } : {}), ...(rule.severity ? { severity:rule.severity } : {}),
        ...(rule.message ? { message:rule.message } : {}), ...(rule.examples ? { examples:rule.examples } : {}),
      }],
    });
    approvedRuleRevisionId = pending.id; if (editingReusableSchemaRuleId === pending.id) { editingReusableSchemaRuleId = undefined; if (schemaRuleEditor) schemaRuleEditor.hidden = true; }
    pendingSchemaRuleRevision = undefined; persistReusableSchemaRules(); renderSchemaRuleLibrary(); schemaRuleRevisionReview?.close();
  };
  const cancelReusableSchemaRuleRevision = (): void => { pendingSchemaRuleRevision = undefined; schemaRuleRevisionReview?.close(); };
  const requestSchemaRuleUpgrade = (id: string, schemaIds: readonly string[]): boolean => {
    const rule = reusableSchemaRules.find((candidate) => candidate.id === id); if (!rule) return false;
    const affected = schemas.filter((schema) => schemaIds.includes(schema.id) && schema.attachedRules?.some((item) => item.id === id));
    pendingSchemaRuleUpgrade = { id, schemaIds:[...schemaIds] };
    if (schemaRuleUpgradeReviewSummary) schemaRuleUpgradeReviewSummary.textContent = affected.length
      ? `Update pinned attachments for ${rule.name} v${rule.version}: ${affected.map(({ name }) => name).join(", ")}.`
      : `No pinned attachments for ${rule.name} are selected.`;
    if (confirmSchemaRuleUpgradeButton) confirmSchemaRuleUpgradeButton.disabled = affected.length === 0;
    schemaRuleUpgradeReview?.showModal(); (affected.length ? confirmSchemaRuleUpgradeButton : cancelSchemaRuleUpgradeButton)?.focus(); return true;
  };
  const confirmReusableSchemaRuleUpgrade = (): void => {
    const pending = pendingSchemaRuleUpgrade; if (!pending) return;
    const rule = reusableSchemaRules.find((candidate) => candidate.id === pending.id); if (!rule) return;
    schemas = schemas.map((schema) => {
      if (!pending.schemaIds.includes(schema.id) || !schema.attachedRules) return schema;
      return { ...schema, attachedRules:schema.attachedRules.map((attached) => attached.id !== rule.id ? attached : {
        ...attached, name:rule.name, version:rule.version, ...(rule.operator ? { operator:rule.operator } : {}),
        ...(rule.parameters ? { parameters:rule.parameters } : {}), ...(rule.severity ? { severity:rule.severity } : {}),
        ...(rule.message ? { message:rule.message } : {}), enabled:rule.enabled,
      }) };
    });
    approvedRuleAttachmentUpdateId = pending.id; pendingSchemaRuleUpgrade = undefined; persistSchemaLibrary(); schemaRuleUpgradeReview?.close();
  };
  const cancelReusableSchemaRuleUpgrade = (): void => { pendingSchemaRuleUpgrade = undefined; schemaRuleUpgradeReview?.close(); };
  const requestSchemaRuleSync = (id: string): boolean => {
    const rule = reusableSchemaRules.find((candidate) => candidate.id === id); if (!rule) return false;
    const review = reviewReusableRuleSync(schemas, rule); pendingSchemaRuleSync = { rule:structuredClone(rule), review };
    const changes = review.schemas.map((schema) => `${schema.schemaName} revision ${schema.currentVersion} to ${schema.nextVersion}`).join("; ");
    if (schemaRuleSyncReviewSummary) schemaRuleSyncReviewSummary.textContent = review.blocked.length
      ? `${review.schemaCount} schemas and ${review.attachmentCount} attachments. ${review.blocked.map(({ assistance }) => assistance).join(". ")}.`
      : `${review.schemaCount} schemas and ${review.attachmentCount} attachments: ${changes || "no pinned revisions"}. No changes occur before confirmation.`;
    if (confirmSchemaRuleSyncButton) confirmSchemaRuleSyncButton.disabled = !review.ready;
    schemaRuleSyncReview?.showModal(); (review.ready ? confirmSchemaRuleSyncButton : cancelSchemaRuleSyncButton)?.focus(); return true;
  };
  const openReusableRuleSyncReview = requestSchemaRuleSync;
  const confirmReusableSchemaRuleSync = (): void => {
    const pending = pendingSchemaRuleSync; if (!pending) return;
    const settledRule = reusableSchemaRules.find((rule) => rule.id === pending.rule.id);
    if (!settledRule) throw new Error("The reusable rule was removed after review");
    const settledReview = reviewReusableRuleSync(schemas, settledRule);
    if (JSON.stringify(settledReview) !== JSON.stringify(pending.review)) throw new Error("The attached schemas changed after review");
    schemas = publishReusableRuleSync(schemas, settledRule, settledReview); pendingSchemaRuleSync = undefined;
    persistSchemaLibrary(); renderSchemas(); schemaRuleSyncReview?.close();
  };
  const cancelReusableSchemaRuleSync = (): void => { pendingSchemaRuleSync = undefined; schemaRuleSyncReview?.close(); };
  const requestSchemaRuleDeletion = (id: string): boolean => {
    const rule = reusableSchemaRules.find((candidate) => candidate.id === id); if (!rule) return false;
    const attached = schemas.filter((schema) => rule.attachments?.includes(schema.id)
      || schema.attachedRules?.some((attachedRule) => attachedRule.id === id) || JSON.stringify(schema.document).includes(id));
    if (attached.length) { if (schemaResult) schemaResult.textContent = `Cannot delete ${rule.name}: attached to ${attached.map(({ name }) => name).join(", ")}.`; return false; }
    pendingReusableSchemaRuleDeletionId = id;
    if (schemaRuleDeleteReviewSummary) schemaRuleDeleteReviewSummary.textContent = `${rule.name} v${rule.version} will be removed.`;
    schemaRuleDeleteReview?.showModal(); confirmSchemaRuleDeleteButton?.focus(); return true;
  };
  const confirmReusableSchemaRuleDeletion = (): void => {
    if (!pendingReusableSchemaRuleDeletionId) return;
    reusableSchemaRules = reusableSchemaRules.filter(({ id }) => id !== pendingReusableSchemaRuleDeletionId);
    pendingReusableSchemaRuleDeletionId = undefined; persistReusableSchemaRules(); renderSchemaRuleLibrary(); schemaRuleDeleteReview?.close();
  };
  const cancelReusableSchemaRuleDeletion = (): void => { pendingReusableSchemaRuleDeletionId = undefined; schemaRuleDeleteReview?.close(); };
  const exportReusableSchemaRules = (): void => {
    const blob = new Blob([`${JSON.stringify(reusableSchemaRules, null, 2)}\n`], { type:"application/json" });
    const url = URL.createObjectURL(blob); const link = schemaOwnerDocument?.createElement("a");
    if (link) { link.href = url; link.download = "schema-rules.json"; link.click(); } URL.revokeObjectURL(url);
  };
  const openSchemaLibraryImportFile = (): void => schemaLibraryImportFile?.click();
  const reviewSchemaLibraryImport = (serialized: string): void => {
    const archive = JSON.parse(serialized) as { version?:number; schemas?:unknown; rules?:unknown };
    if (archive.version !== 1 || !Array.isArray(archive.schemas) || !Array.isArray(archive.rules)) {
      throw new Error("Choose a version 1 Schema Library export.");
    }
    const importedSchemas = archive.schemas.map((schema) => importSchema(JSON.stringify(schema)));
    const candidates = [...schemas.filter((schema) => !importedSchemas.some(({ id }) => id === schema.id)), ...importedSchemas];
    for (const schema of importedSchemas) {
      const issue = schemaInheritanceError(schema, candidates) ?? schemaInheritanceConflict(schema, candidates);
      if (issue) throw new Error(issue);
    }
    const rules = archive.rules.filter((rule): rule is ReusableSchemaRule => Boolean(rule && typeof rule === "object"
      && "id" in rule && "name" in rule && "kind" in rule && "version" in rule && "enabled" in rule));
    pendingSchemaImport = { schemas:importedSchemas, rules:structuredClone(rules) };
    if (schemaImportReviewSummary) schemaImportReviewSummary.textContent =
      `${importedSchemas.length} schemas and ${rules.length} reusable rules are ready to import.`;
    schemaImportReview?.showModal();
  };
  const readSchemaLibraryImportFile = async (): Promise<void> => {
    const file = schemaLibraryImportFile?.files?.[0]; if (!file) return;
    try { reviewSchemaLibraryImport(await file.text()); }
    catch (error) { if (schemaResult) schemaResult.textContent = error instanceof Error ? error.message : "Schema Library import failed."; }
    if (schemaLibraryImportFile) schemaLibraryImportFile.value = "";
  };
  const replaceSchemaLibrary = (): void => {
    if (!pendingSchemaImport) return; schemas = structuredClone(pendingSchemaImport.schemas);
    reusableSchemaRules = structuredClone(pendingSchemaImport.rules); pendingSchemaImport = undefined;
    persistSchemaLibrary(); persistReusableSchemaRules(); renderSchemas(); renderSchemaRuleLibrary(); schemaImportReview?.close();
  };
  const appendSchemaLibrary = (): void => {
    if (!pendingSchemaImport) return;
    schemas = [...schemas.filter((schema) => !pendingSchemaImport!.schemas.some(({ id }) => id === schema.id)),
      ...structuredClone(pendingSchemaImport.schemas)];
    reusableSchemaRules = [...reusableSchemaRules.filter((rule) => !pendingSchemaImport!.rules.some(({ id }) => id === rule.id)),
      ...structuredClone(pendingSchemaImport.rules)];
    pendingSchemaImport = undefined; persistSchemaLibrary(); persistReusableSchemaRules(); renderSchemas(); renderSchemaRuleLibrary(); schemaImportReview?.close();
  };
  const cancelSchemaLibraryImport = (): void => { pendingSchemaImport = undefined; schemaImportReview?.close(); };
  const requestSchemaDeletion = (id: string): boolean => {
    const schema = schemas.find((candidate) => candidate.id === id); if (!schema) return false;
    const children = schemas.filter(({ parentSchemaId }) => parentSchemaId === id);
    if (children.length) { if (schemaResult) schemaResult.textContent =
      `Cannot delete ${schema.name}: it is the parent of ${children.map(({ name }) => name).join(", ")}.`; return false; }
    pendingSchemaDeletion = structuredClone(schema);
    if (schemaDeleteReviewSummary) schemaDeleteReviewSummary.textContent = `${schema.name} v${schema.version} and its assignments will be removed.`;
    schemaDeleteReview?.showModal(); return true;
  };
  const confirmSchemaDeletion = (): void => {
    const schema = pendingSchemaDeletion; if (!schema) return; schemas = schemas.filter(({ id }) => id !== schema.id);
    pendingSchemaDeletion = undefined; if (activeSchemaId === schema.id) { activeSchemaId = undefined; schemaDraft = undefined; }
    persistSchemaLibrary(); renderSchemas(); schemaDeleteReview?.close();
    if (schemaResult) schemaResult.textContent = `Deleted ${schema.name}.`;
  };
  const cancelSchemaDeletion = (): void => { pendingSchemaDeletion = undefined; schemaDeleteReview?.close(); };
  function finishSchemaExport(status: string): void {
    if (schemaResult) schemaResult.textContent = status; schemaExportReview?.close(); schemaExportChoices?.close();
    pendingStandardSchemaExport = undefined; schemaExportTrigger?.focus(); schemaExportTrigger = undefined;
  }
  function openStandardSchemaExportReview(scope: "library" | "schema", schema?: SchemaDefinition): void {
    const review = schema ? inspectJsonSchemaExport(schema, schemas) : exportJsonSchemaBundle(schemas).compatibility;
    pendingStandardSchemaExport = { scope, ...(schema ? { schema } : {}), review };
    if (!schemaExportReview?.ownerDocument) return;
    const summary = schemaExportReview.ownerDocument.createElement("p"); summary.textContent =
      `${scope === "library" ? `${schemas.length} schema resources` : `${schema?.name} revision ${schema?.version}`} · ${review.conversions.length} conversions · ${omittedRuleStatus(review.omitted.length)}`;
    const confirm = schemaExportReview.ownerDocument.createElement("button"); confirm.type = "button"; confirm.textContent = "Confirm standard export";
    const cancel = schemaExportReview.ownerDocument.createElement("button"); cancel.type = "button"; cancel.textContent = "Cancel";
    confirm.addEventListener("click", () => { const pending = pendingStandardSchemaExport; if (!pending) return;
      if (pending.scope === "library") { const exported = exportJsonSchemaBundle(schemas); downloadSchemaJson(exported.document, exported.filename);
        finishSchemaExport(`Exported JSON Schema bundle with ${exported.resourceIds.length} schemas.`); }
      else if (pending.schema) { const exported = exportJsonSchemaResource(pending.schema, schemas); downloadSchemaJson(exported.document, exported.filename);
        finishSchemaExport(`Exported ${pending.schema.name} revision ${pending.schema.version}.`); } });
    cancel.addEventListener("click", () => { pendingStandardSchemaExport = undefined; schemaExportReview.close(); schemaExportTrigger?.focus(); });
    schemaExportReview.replaceChildren(summary, confirm, cancel); schemaExportReview.showModal(); confirm.focus();
  }
  function openSchemaExportChoices(trigger: HTMLButtonElement, schema?: SchemaDefinition): void {
    schemaExportTrigger = trigger; if (!schemaExportChoices?.ownerDocument) return;
    const extension = schemaExportChoices.ownerDocument.createElement("button"); extension.type = "button"; extension.textContent = "Extension backup";
    const standard = schemaExportChoices.ownerDocument.createElement("button"); standard.type = "button"; standard.textContent = "JSON Schema Draft 2020-12";
    const cancel = schemaExportChoices.ownerDocument.createElement("button"); cancel.type = "button"; cancel.textContent = "Cancel";
    extension.addEventListener("click", () => { if (schema) { const archive = createExtensionSchemaPackage(schema, schemas, reusableSchemaRules);
      ports.downloadSchema(archive, `${schema.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-extension-package-v1.json`);
      finishSchemaExport(`Exported Extension schema package for ${schema.name}.`); }
    else { const archive = createSchemaLibraryExport(schemas, reusableSchemaRules); ports.downloadSchema(archive, "schema-library-v1.json");
      finishSchemaExport(`Exported Extension backup with ${archive.schemas.length} schemas and ${archive.rules.length} rules.`); } });
    standard.addEventListener("click", () => { schemaExportChoices.close(); openStandardSchemaExportReview(schema ? "schema" : "library", schema); });
    cancel.addEventListener("click", () => { schemaExportChoices.close(); schemaExportTrigger?.focus(); schemaExportTrigger = undefined; });
    schemaExportChoices.replaceChildren(extension, standard, cancel); schemaExportChoices.showModal(); extension.focus();
  }
  const requestSchemaLibraryExport = (): void => { if (exportSchemaButton) openSchemaExportChoices(exportSchemaButton); };
  const rememberCompactCanonicalScroll = ():void => { if (compactCanonicalEditor && schemaDetail && schemaDetail.scrollTop > 0)
    compactCanonicalScrollByKey.set(compactCanonicalEditor.key, schemaDetail.scrollTop); };
  let guidedDialogDisposers:(() => void)[] = [];
  let livePropertyDialogDisposers:(() => void)[] = [];
  let allowedValueDialogDisposers:(() => void)[] = [];
  let sidePanelLayeredProfileEditor:{ dispose():void } | undefined;
  const guidedValidationFlow = createGuidedValidationFlow(guidedValidationRoot, {
    schemaCandidates:() => schemas.map(guidedUiCandidate),
    publish:persistPublishedGuidedValidation,
    close:() => { if (guidedValidationRoot) { guidedValidationRoot.hidden = true; guidedValidationRoot.removeAttribute("data-event-id");
      guidedValidationRoot.removeAttribute("data-schema-id"); } restoreGuidedPropertyReturn(); },
    saved:finishGuidedValidationSave,
  });
  return {
    mount(): void {
      if (mounted) return; mounted = true; lifecycleGeneration += 1;
      sidePanelLayeredProfileEditor = ports.mountLayeredProfileEditor();
      schemaSearch?.addEventListener("input", updateSchemaTreeView);
      createSchemaButton?.addEventListener("click", openNewSchemaEditor);
      recheckSchemaValidationButton?.addEventListener("click", recheckCapturedSchemaValidationFromControl);
      schemaCategoryFilter?.addEventListener("change", updateSchemaTreeView);
      schemaTreeScrollOwner?.addEventListener("scroll", persistSchemaTreeScroll, { passive:true });
      schemaList?.addEventListener("keydown", navigateSchemaTree);
      schemaDetail?.addEventListener("scroll", rememberCompactCanonicalScroll);
      schemaEditorName?.addEventListener("input", persistSchemaEditorDraft);
      saveSchemaDescriptionButton?.addEventListener("click", saveSchemaDescription);
      schemaEditorTarget?.addEventListener("change", updateSchemaTarget);
      schemaEditorParent?.addEventListener("change", changeSchemaParent);
      schemaOnlyDeclaredProperties?.addEventListener("change", changeOnlyDeclaredProperties);
      saveSchemaButton?.addEventListener("click", openSchemaRevisionReview);
      confirmSchemaRevisionButton?.addEventListener("click", confirmSchemaRevision);
      cancelSchemaRevisionButton?.addEventListener("click", cancelSchemaRevision);
      discardSchemaDraftButton?.addEventListener("click", discardSchemaDraft);
      keepEditingSchemaButton?.addEventListener("click", keepEditingSchema);
      closeSchemaEditorButton?.addEventListener("click", closeSchemaEditor);
      saveAndCloseSchemaButton?.addEventListener("click", saveAndCloseSchema);
      saveSchemaCloseReviewButton?.addEventListener("click", saveAndCloseSchema);
      discardWorkingSchemaDraftButton?.addEventListener("click", discardWorkingSchemaDraft);
      schemaRevisionSelector?.addEventListener("change", renderSchemaRevisionComparison);
      duplicateSchemaRevisionButton?.addEventListener("click", duplicateSelectedSchemaRevision);
      restoreSchemaRevisionButton?.addEventListener("click", restoreSelectedSchemaRevision);
      addSchemaPropertyButton?.addEventListener("click", openManualPropertyFromControl);
      schemaPropertyFilter?.addEventListener("input", renderSchemaPropertyView);
      schemaPropertySort?.addEventListener("change", renderSchemaPropertyView);
      clearSchemaPropertyFilter?.addEventListener("click", clearSchemaPropertyViewFilter);
      for (const tab of schemaSubviews) tab.addEventListener("click", activateSchemaSubview);
      confirmSchemaPropertyRemovalButton?.addEventListener("click", confirmSchemaPropertyRemoval);
      cancelSchemaPropertyRemovalButton?.addEventListener("click", cancelSchemaPropertyRemoval);
      schemaPropertyRemovalDialog?.addEventListener("cancel", cancelSchemaPropertyRemovalFromDialog);
      undoSchemaPropertyRemovalButton?.addEventListener("click", undoLastSchemaPropertyRemoval);
      confirmSchemaDocumentationRemoval?.addEventListener("click", confirmSchemaDocumentationRemovalAction);
      cancelSchemaDocumentationRemoval?.addEventListener("click", cancelSchemaDocumentationRemovalAction);
      schemaDocumentationRemovalDialog?.addEventListener("cancel", cancelSchemaDocumentationRemovalFromDialog);
      undoSchemaPropertyCopyButton?.addEventListener("click", undoLastSchemaPropertyCopy);
      schemaSpecificIndex?.addEventListener("input", renderSpecificIndexInspection);
      schemaSpecificIndexForm?.addEventListener("submit", submitSpecificIndex);
      cancelSchemaSpecificIndex?.addEventListener("click", closeSpecificIndexDialog);
      schemaSpecificIndexDialog?.addEventListener("cancel", cancelSpecificIndexDialog);
      schemaManualPropertyPath?.addEventListener("input", renderManualPropertyForm);
      schemaManualPropertyChildName?.addEventListener("input", renderManualPropertyForm);
      schemaManualPropertyType?.addEventListener("change", renderManualPropertyForm);
      schemaManualArrayItemType?.addEventListener("change", renderManualPropertyForm);
      schemaManualPropertyForm?.addEventListener("submit", submitManualProperty);
      cancelSchemaManualPropertyButton?.addEventListener("click", cancelManualPropertyDialog);
      schemaManualPropertyDialog?.addEventListener("cancel", cancelManualPropertyFromDialog);
      goToExistingSchemaPropertyButton?.addEventListener("click", goToExistingSchemaProperty);
      schemaPropertyRulePicker?.addEventListener("cancel", cancelSchemaPropertyRulePicker);
      schemaPropertyRulePicker?.addEventListener("keydown", navigateSchemaPropertyRulePicker);
      createSchemaRuleButton?.addEventListener("click", openNewSchemaRuleEditor);
      saveSchemaRuleButton?.addEventListener("click", saveReusableSchemaRule);
      saveSchemaRuleButton?.addEventListener("pointerdown", captureReusableRuleSnapshot);
      schemaRuleEditor?.addEventListener("input", updateConfiguredRulePreview);
      schemaRuleEditor?.addEventListener("click", captureReusableRuleSnapshotFromEditor);
      schemaRuleSearch?.addEventListener("input", renderSchemaRuleLibrary);
      updateSchemaRuleAttachments?.addEventListener("change", updateRuleAttachmentPreview);
      confirmSchemaRuleRevisionButton?.addEventListener("click", confirmReusableSchemaRuleRevision);
      cancelSchemaRuleRevisionButton?.addEventListener("click", cancelReusableSchemaRuleRevision);
      confirmSchemaRuleUpgradeButton?.addEventListener("click", confirmReusableSchemaRuleUpgrade);
      cancelSchemaRuleUpgradeButton?.addEventListener("click", cancelReusableSchemaRuleUpgrade);
      confirmSchemaRuleSyncButton?.addEventListener("click", confirmReusableSchemaRuleSync);
      cancelSchemaRuleSyncButton?.addEventListener("click", cancelReusableSchemaRuleSync);
      confirmSchemaRuleDeleteButton?.addEventListener("click", confirmReusableSchemaRuleDeletion);
      cancelSchemaRuleDeleteButton?.addEventListener("click", cancelReusableSchemaRuleDeletion);
      exportSchemaRulesButton?.addEventListener("click", exportReusableSchemaRules);
      schemaAssignmentTarget?.addEventListener("change", changeSchemaAssignmentTarget);
      createSchemaAssignmentButton?.addEventListener("click", openNewSchemaAssignmentEditor);
      saveSchemaAssignmentButton?.addEventListener("click", saveSchemaAssignment);
      importSchemaButton?.addEventListener("click", openSchemaLibraryImportFile);
      schemaLibraryImportFile?.addEventListener("change", readSchemaLibraryImportFile);
      replaceSchemaLibraryButton?.addEventListener("click", replaceSchemaLibrary);
      appendSchemaLibraryButton?.addEventListener("click", appendSchemaLibrary);
      cancelSchemaImportButton?.addEventListener("click", cancelSchemaLibraryImport);
      confirmSchemaDeleteButton?.addEventListener("click", confirmSchemaDeletion);
      cancelSchemaDeleteButton?.addEventListener("click", cancelSchemaDeletion);
      exportSchemaButton?.addEventListener("click", requestSchemaLibraryExport);
      unsubscribe = ports.subscribe(renderSchemas);
      unsubscribeSchemaPersistence = ports.subscribeSchemaPersistence(settleSchemaPersistence);
      renderSchemas(); renderSchemaValidationRecords();
    },
    dispose(): void {
      if (!mounted) return; mounted = false; lifecycleGeneration += 1;
      schemaSearch?.removeEventListener("input", updateSchemaTreeView);
      createSchemaButton?.removeEventListener("click", openNewSchemaEditor);
      recheckSchemaValidationButton?.removeEventListener("click", recheckCapturedSchemaValidationFromControl);
      schemaCategoryFilter?.removeEventListener("change", updateSchemaTreeView);
      schemaTreeScrollOwner?.removeEventListener("scroll", persistSchemaTreeScroll);
      schemaList?.removeEventListener("keydown", navigateSchemaTree);
      schemaDetail?.removeEventListener("scroll", rememberCompactCanonicalScroll);
      schemaEditorName?.removeEventListener("input", persistSchemaEditorDraft);
      saveSchemaDescriptionButton?.removeEventListener("click", saveSchemaDescription);
      schemaEditorTarget?.removeEventListener("change", updateSchemaTarget);
      schemaEditorParent?.removeEventListener("change", changeSchemaParent);
      schemaOnlyDeclaredProperties?.removeEventListener("change", changeOnlyDeclaredProperties);
      saveSchemaButton?.removeEventListener("click", openSchemaRevisionReview);
      confirmSchemaRevisionButton?.removeEventListener("click", confirmSchemaRevision);
      cancelSchemaRevisionButton?.removeEventListener("click", cancelSchemaRevision);
      discardSchemaDraftButton?.removeEventListener("click", discardSchemaDraft);
      keepEditingSchemaButton?.removeEventListener("click", keepEditingSchema);
      closeSchemaEditorButton?.removeEventListener("click", closeSchemaEditor);
      saveAndCloseSchemaButton?.removeEventListener("click", saveAndCloseSchema);
      saveSchemaCloseReviewButton?.removeEventListener("click", saveAndCloseSchema);
      discardWorkingSchemaDraftButton?.removeEventListener("click", discardWorkingSchemaDraft);
      schemaRevisionSelector?.removeEventListener("change", renderSchemaRevisionComparison);
      duplicateSchemaRevisionButton?.removeEventListener("click", duplicateSelectedSchemaRevision);
      restoreSchemaRevisionButton?.removeEventListener("click", restoreSelectedSchemaRevision);
      addSchemaPropertyButton?.removeEventListener("click", openManualPropertyFromControl);
      schemaPropertyFilter?.removeEventListener("input", renderSchemaPropertyView);
      schemaPropertySort?.removeEventListener("change", renderSchemaPropertyView);
      clearSchemaPropertyFilter?.removeEventListener("click", clearSchemaPropertyViewFilter);
      for (const tab of schemaSubviews) tab.removeEventListener("click", activateSchemaSubview);
      confirmSchemaPropertyRemovalButton?.removeEventListener("click", confirmSchemaPropertyRemoval);
      cancelSchemaPropertyRemovalButton?.removeEventListener("click", cancelSchemaPropertyRemoval);
      schemaPropertyRemovalDialog?.removeEventListener("cancel", cancelSchemaPropertyRemovalFromDialog);
      undoSchemaPropertyRemovalButton?.removeEventListener("click", undoLastSchemaPropertyRemoval);
      confirmSchemaDocumentationRemoval?.removeEventListener("click", confirmSchemaDocumentationRemovalAction);
      cancelSchemaDocumentationRemoval?.removeEventListener("click", cancelSchemaDocumentationRemovalAction);
      schemaDocumentationRemovalDialog?.removeEventListener("cancel", cancelSchemaDocumentationRemovalFromDialog);
      undoSchemaPropertyCopyButton?.removeEventListener("click", undoLastSchemaPropertyCopy);
      schemaSpecificIndex?.removeEventListener("input", renderSpecificIndexInspection);
      schemaSpecificIndexForm?.removeEventListener("submit", submitSpecificIndex);
      cancelSchemaSpecificIndex?.removeEventListener("click", closeSpecificIndexDialog);
      schemaSpecificIndexDialog?.removeEventListener("cancel", cancelSpecificIndexDialog);
      schemaManualPropertyPath?.removeEventListener("input", renderManualPropertyForm);
      schemaManualPropertyChildName?.removeEventListener("input", renderManualPropertyForm);
      schemaManualPropertyType?.removeEventListener("change", renderManualPropertyForm);
      schemaManualArrayItemType?.removeEventListener("change", renderManualPropertyForm);
      schemaManualPropertyForm?.removeEventListener("submit", submitManualProperty);
      cancelSchemaManualPropertyButton?.removeEventListener("click", cancelManualPropertyDialog);
      schemaManualPropertyDialog?.removeEventListener("cancel", cancelManualPropertyFromDialog);
      goToExistingSchemaPropertyButton?.removeEventListener("click", goToExistingSchemaProperty);
      schemaPropertyRulePicker?.removeEventListener("cancel", cancelSchemaPropertyRulePicker);
      schemaPropertyRulePicker?.removeEventListener("keydown", navigateSchemaPropertyRulePicker);
      createSchemaRuleButton?.removeEventListener("click", openNewSchemaRuleEditor);
      saveSchemaRuleButton?.removeEventListener("click", saveReusableSchemaRule);
      saveSchemaRuleButton?.removeEventListener("pointerdown", captureReusableRuleSnapshot);
      schemaRuleEditor?.removeEventListener("input", updateConfiguredRulePreview);
      schemaRuleEditor?.removeEventListener("click", captureReusableRuleSnapshotFromEditor);
      schemaRuleSearch?.removeEventListener("input", renderSchemaRuleLibrary);
      updateSchemaRuleAttachments?.removeEventListener("change", updateRuleAttachmentPreview);
      confirmSchemaRuleRevisionButton?.removeEventListener("click", confirmReusableSchemaRuleRevision);
      cancelSchemaRuleRevisionButton?.removeEventListener("click", cancelReusableSchemaRuleRevision);
      confirmSchemaRuleUpgradeButton?.removeEventListener("click", confirmReusableSchemaRuleUpgrade);
      cancelSchemaRuleUpgradeButton?.removeEventListener("click", cancelReusableSchemaRuleUpgrade);
      confirmSchemaRuleSyncButton?.removeEventListener("click", confirmReusableSchemaRuleSync);
      cancelSchemaRuleSyncButton?.removeEventListener("click", cancelReusableSchemaRuleSync);
      confirmSchemaRuleDeleteButton?.removeEventListener("click", confirmReusableSchemaRuleDeletion);
      cancelSchemaRuleDeleteButton?.removeEventListener("click", cancelReusableSchemaRuleDeletion);
      exportSchemaRulesButton?.removeEventListener("click", exportReusableSchemaRules);
      schemaAssignmentTarget?.removeEventListener("change", changeSchemaAssignmentTarget);
      createSchemaAssignmentButton?.removeEventListener("click", openNewSchemaAssignmentEditor);
      saveSchemaAssignmentButton?.removeEventListener("click", saveSchemaAssignment);
      importSchemaButton?.removeEventListener("click", openSchemaLibraryImportFile);
      schemaLibraryImportFile?.removeEventListener("change", readSchemaLibraryImportFile);
      replaceSchemaLibraryButton?.removeEventListener("click", replaceSchemaLibrary);
      appendSchemaLibraryButton?.removeEventListener("click", appendSchemaLibrary);
      cancelSchemaImportButton?.removeEventListener("click", cancelSchemaLibraryImport);
      confirmSchemaDeleteButton?.removeEventListener("click", confirmSchemaDeletion);
      cancelSchemaDeleteButton?.removeEventListener("click", cancelSchemaDeletion);
      exportSchemaButton?.removeEventListener("click", requestSchemaLibraryExport);
      pendingSchemaPropertyRemoval = undefined; pendingSchemaDocumentationRemoval = undefined; lastSchemaPropertyRemoval = undefined;
      pendingSchemaPropertyCopy = undefined; lastSchemaPropertyCopy = undefined;
      specificIndexArrayPath = undefined; specificIndexTrigger = undefined;
      pendingManualPropertyContext = undefined; pendingManualPropertyCanonicalBase = undefined; pendingSchemaRestoration = undefined;
      schemaRulePickerPath = undefined; schemaRulePickerTrigger = undefined; schemaPropertyInteractionReturn = undefined;
      schemaRuleConfiguration = undefined; editingAttachedLocalRule = undefined;
      pendingSchemaRuleRevision = undefined; pendingSchemaRuleUpgrade = undefined;
      pendingSchemaRuleSync = undefined; pendingReusableSchemaRuleDeletionId = undefined;
      editingReusableSchemaRuleId = undefined; approvedRuleRevisionId = undefined; approvedRuleAttachmentUpdateId = undefined;
      pendingRuleSnapshotMetadata = undefined;
      editingSchemaAssignment = undefined; schemaAssignmentConditionState = { target:"payload", suggestions:[] };
      pendingSchemaImport = undefined; pendingSchemaDeletion = undefined;
      pendingStandardSchemaExport = undefined; schemaExportTrigger = undefined;
      schemaExportChoices?.close(); schemaExportReview?.close(); schemaExportChoices?.replaceChildren(); schemaExportReview?.replaceChildren();
      if (buildSpecificationButton) buildSpecificationButton.onclick = null;
      if (buildHistoricalSpecificationButton) buildHistoricalSpecificationButton.onclick = null;
      if (schemaSpecificationBuilder) { schemaSpecificationBuilder.hidden = true; schemaSpecificationBuilder.replaceChildren(); }
      closeCompactCanonicalEditor(); savedCanonicalDocument = undefined; compactCanonicalPendingCommand = undefined;
      for (const dispose of compactCanonicalContextDisposers.splice(0)) dispose();
      sidePanelLayeredProfileEditor?.dispose(); sidePanelLayeredProfileEditor = undefined;
      compactCanonicalPendingBase = undefined; compactCanonicalReviewVisible = false; compactCanonicalRevisionSnapshots.clear();
      compactCanonicalCommandFeedback = undefined; compactCanonicalProjectionWorker = undefined; compactCanonicalReopenSelection = undefined;
      compactCanonicalPresenceDraft = undefined; compactCanonicalHistoryState = compactCanonicalHistorySettlement();
      for (const dispose of guidedDialogDisposers.splice(0)) dispose(); guidedValidationFlow.close(); guidedPropertyReturn = undefined;
      for (const dispose of livePropertyDialogDisposers.splice(0)) dispose();
      for (const dispose of allowedValueDialogDisposers.splice(0)) dispose();
      for (const dispose of capturedContinuationRowDisposers.splice(0)) dispose();
      for (const dispose of capturedContinuationDialogDisposers.splice(0)) dispose();
      guidedValidationRoot?.replaceChildren();
      const disposed = new Error("Schemas controller disposed before durable persistence settled");
      pendingLocalRulePromotionPersistence?.reject(disposed); pendingGuidedValidationPersistence?.reject(disposed);
      pendingLocalRulePromotion = undefined; localRulePromotionDialog.close();
      unsubscribe?.(); unsubscribe = undefined;
      unsubscribeSchemaPersistence?.(); unsubscribeSchemaPersistence = undefined;
      activeSchemaProjectHydration = undefined;
      clearSchemaRowListeners();
      for (const dispose of schemaRuleRowDisposers.splice(0)) dispose();
      for (const dispose of schemaPropertyRowDisposers.splice(0)) dispose();
      for (const dispose of schemaRulePickerDisposers.splice(0)) dispose();
      schemaList?.replaceChildren();
      schemaAssignmentList?.replaceChildren();
      schemaAssignmentDataConditions?.replaceChildren();
    },
    open(id: string): void {
      if (!schemas.some((schema) => schema.id === id)) throw new Error(`Unknown schema ${id}`);
      activeSchemaId = id;
      schemaDraft = structuredClone(active()); renderSchemas();
    },
    beginDraft(): void { replaceActive(updateSchemaWorkingDraft(active(), {})); persistSchemaLibrary(); renderSchemas(); },
    updateDraft(changes: Partial<Pick<SchemaWorkingDraft, "name" | "document" | "assignments" | "attachedRules" | "parentSchemaId" | "inheritedRuleOverrides" | "documentation" | "canonicalSchema">>, change?: string): void {
      replaceActive(updateSchemaWorkingDraft(active(), changes, change)); persistSchemaLibrary(); renderSchemas();
    },
    publish(): SchemaDefinition { return structuredClone(publishActiveSchema()); },
    discard(): void { replaceActive(discardSchemaWorkingDraft(active())); persistSchemaLibrary(); renderSchemas(); },
    add(schema: SchemaDefinition): void { schemas = [...schemas, structuredClone(schema)]; activeSchemaId = schema.id; schemaDraft = structuredClone(schema); persistSchemaLibrary(); renderSchemas(); },
    replace(next: readonly SchemaDefinition[]): void { schemas = structuredClone([...next]); if (!schemas.some(({ id }) => id === activeSchemaId)) { activeSchemaId = undefined; schemaDraft = undefined; } persistSchemaLibrary(); renderSchemas(); },
    validate:(event: Parameters<typeof validateEvent>[0]) => validateEvent(event, schemas),
    validateAgainstSchema:(event: Parameters<typeof validateEvent>[0], schemaId:string) => {
      const schema = schemas.find((candidate) => candidate.id === schemaId);
      if (!schema) return { message:"Select a schema to refresh Library draft validation." };
      const result = validateWithSchema(event, schema, schemas);
      return { message:`Library draft validation: ${result.state} · ${schema.name} v${schema.version}.`, result };
    },
    runGuidedValidation:async () => { const event = guidedValidationRoot?.dataset.eventId;
      if (event) { const captured={ id:event, sourceId:"", name:"", pageUrl:"", payload:{}, rawInput:{} };
        guidedValidationFlow.open(guidedUiEvent(captured), activeSchemaId ? guidedUiCandidate(active()) : undefined); } },
    requestPropertyRemoval:requestSchemaPropertyRemoval,
    requestDocumentationRemoval:requestSchemaDocumentationRemoval,
    requestPropertyCopy:openSchemaPropertyCopyReview,
    confirmPropertyCopy:confirmSchemaPropertyCopy,
    openSpecificIndex:openSpecificIndexDialog,
    openManualProperty:openManualPropertyForm,
    openContextualManualProperty:openContextualManualPropertyForm,
    openSchemaFromSource,
    schemaDocumentPaths,
    schemaPropertyAt,
    defineSchemaProperty,
    schemaPropertyType,
    capturePropertyReturn:captureSchemaPropertyInteractionReturn,
    restorePropertyReturn:restoreSchemaPropertyInteractionReturn,
    closeRulePickerForCommit:closeSchemaPropertyRulePickerForCommit,
    openRulePicker:openSchemaPropertyRulePicker,
    openCanonicalRuleEditor:openCompactCanonicalRuleEditor,
    configureRule:(ruleType:RuleConfiguration["ruleType"]) => { if (!schemaRuleConfiguration) return false;
      schemaRuleConfiguration = createRuleConfiguration(ruleType, schemaRuleConfiguration.propertyType); renderSchemaPropertyRulePicker(); return true; },
    openCanonicalPropertyActions:openCompactCanonicalPropertyActions,
    compactPropertyAction:compactCanonicalPropertyAction,
    configuredRule:configuredRuleInput,
    conditionPredicate:initialConditionPredicate,
    createConfiguredRule:createConfiguredSchemaRule,
    requestRuleRevision:requestSchemaRuleRevision,
    requestRuleUpgrade:requestSchemaRuleUpgrade,
    requestRuleSync:openReusableRuleSyncReview,
    confirmRuleSync:confirmReusableSchemaRuleSync,
    requestRuleDeletion:requestSchemaRuleDeletion,
    editReusableRule:editReusableSchemaRule,
    openAttachedRule:openAttachedSchemaRuleEditor,
    attachReusableRule,
    updateAttachedRule,
    focusPropertyRule:focusSchemaPropertyRule,
    focusPropertyRow:focusSchemaPropertyRow,
    promotionRules:promotionReusableRules,
    renderWorkflow:renderSchemaWorkflowRows,
    editAssignment:editSchemaAssignment,
    reviewLibraryImport:reviewSchemaLibraryImport,
    requestDeletion:requestSchemaDeletion,
    openExportChoices:(schemaId?:string) => { if (!exportSchemaButton) return false;
      const schema = schemaId ? schemas.find(({ id }) => id === schemaId) : undefined; if (schemaId && !schema) return false;
      openSchemaExportChoices(exportSchemaButton, schema); return true; },
    requestLocalRulePromotion:openLocalRulePromotionReview,
    persistGuidedValidation:(result:PublishedGuidedValidation) => persistPublishedGuidedValidation(result).then(() => finishGuidedValidationSave(result)),
    openGuidedEvent:openGuidedValidationForEvent,
    openGuidedProperty:openGuidedValidationForProperty,
    openLivePropertyDeclaration,
    openAllowedValueExpansionReview,
    closeGuided:guidedValidationFlow.close,
    guidedDraft:guidedValidationFlow.currentDraft,
    guidedState:() => ({ selections:structuredClone(guidedContinuationSelections), selectedSchemaPropertyPath,
      hasPropertyReturn:Boolean(guidedPropertyReturn), dialogListenerCount:guidedDialogDisposers.length }),
    guidedContinuation:guidedDraftContinuationForEvent,
    recheckCaptured:recheckCapturedSchemaValidation,
    refreshCurrentLiveAfterSchemaPublication,
    reviewCapturedValidationContinuation,
    setManualSchemaOverride:(eventId:string, schemaId?:string) => { if (schemaId) manualSchemaOverrides[eventId] = schemaId; else delete manualSchemaOverrides[eventId];
      ports.storage.setItem(MANUAL_SCHEMA_OVERRIDE_STORAGE_KEY, JSON.stringify(manualSchemaOverrides)); },
    hydrateActiveProjectForSchemas,
    openSavedCanonical:(schemaId:string) => { const schema = schemas.find(({ id }) => id === schemaId); if (!schema) return false;
      openSavedSchemaInUnifiedEditor(schema); return true; },
    openCanonical:openCompactCanonicalEditor,
    closeCanonical:closeCompactCanonicalEditor,
    dispatchCanonical:dispatchCompactCanonicalCommand,
    persistCanonicalProjection:(projection:SchemaDefinition, change?:string) => compactCanonicalEditor
      ? persistCompactCanonicalProjection(compactCanonicalEditor, projection, change) : Promise.resolve(false),
    resumeCanonicalProjection:() => compactCanonicalEditor ? resumeCompactCanonicalProjectionPersistence(compactCanonicalEditor) : Promise.resolve(false),
    retryCanonical:retryCompactCanonicalCommand,
    rejectCanonical:rejectCompactCanonicalCommand,
    canonicalProjection:() => compactCanonicalEditor ? compactCanonicalProjection(compactCanonicalEditor) : undefined,
    canonicalDocument:() => compactCanonicalEditor ? structuredClone(compactCanonicalEditor.load()) : undefined,
    canonicalFacet:(propertyId:string) => { const document = compactCanonicalEditor?.load(), node = document?.nodes[propertyId];
      return document && node ? compactCanonicalFacetText(document, node) : undefined; },
    canonicalCommandScope:(command:CompactCanonicalCommand) => compactCanonicalEditor
      ? compactCanonicalCommandScope(command, compactCanonicalEditor.load()) : undefined,
    canonicalQueueUnavailable:() => compactCanonicalEditor ? compactCanonicalProjectionQueueUnavailable(compactCanonicalEditor) : false,
    beginCanonicalHistory:(projectId:string, label:string, before:CanonicalSchemaDocument, after:CanonicalSchemaDocument) => {
      if (!compactCanonicalEditor) return undefined; const key = compactCanonicalHistoryKey(projectId, compactCanonicalEditor.key);
      const history = recordCompactCanonicalMutation(compactCanonicalHistoryState.history, key, before, after);
      return beginCompactCanonicalPendingHistory(projectId, compactCanonicalEditor.key, label, history); },
    completeCanonicalHistory:completeCompactCanonicalPendingHistory,
    rejectCanonicalHistory:rejectCompactCanonicalPendingHistory,
    pendingCanonicalHistory:compactCanonicalPendingHistoryFor,
    canonicalState:() => ({ open:Boolean(compactCanonicalEditor), pending:Boolean(compactCanonicalPendingCommand),
      settlementPending:compactCanonicalSettlementPending, reviewVisible:compactCanonicalReviewVisible,
      feedback:compactCanonicalCommandFeedback, reopenSelection:compactCanonicalReopenSelection,
      projectionPending:Boolean(compactCanonicalProjectionRequest), historyPending:Boolean(compactCanonicalHistoryState.pending) }),
    renderCanonical:renderCompactCanonicalEditor,
    rulePickerState:() => ({ path:schemaRulePickerPath, renderSequence:schemaPropertyRenderSequence,
      ...(schemaRuleConfiguration ? { configuration:structuredClone(schemaRuleConfiguration) } : {}) }),
    rules:(): readonly ReusableSchemaRule[] => structuredClone(reusableSchemaRules),
    ruleState:() => ({ editingReusableSchemaRuleId, approvedRuleRevisionId, approvedRuleAttachmentUpdateId,
      pendingRuleSnapshotMetadata:pendingRuleSnapshotMetadata ? structuredClone(pendingRuleSnapshotMetadata) : undefined }),
    omittedRuleStatus,
    storePromotionRules:storedPromotionRules,
    schemas:(): readonly SchemaDefinition[] => structuredClone(schemas),
    state:() => ({ ...(activeSchemaId ? { activeSchemaId } : {}), draftDirty:Boolean(activeSchemaId && active().workingDraft),
      schemaCount:schemas.length, mounted }),
  };
  function restoreGuidedPropertyReturn():void {
    const snapshot = guidedPropertyReturn; if (!snapshot || snapshot.generation !== lifecycleGeneration) return;
    selectedSchemaPropertyPath = snapshot.propertyPath; activeSchemaId = snapshot.schemaId; guidedPropertyReturn = undefined; renderSchemas();
  }
  function persistGuidedContinuation(event:Pick<GuidedCapturedEvent, "sourceId" | "name">, schemaId:string):void {
    guidedContinuationSelections = selectGuidedContinuation(guidedContinuationSelections, event, schemaId);
    ports.storage.setItem(GUIDED_CONTINUATION_STORAGE_KEY, JSON.stringify(guidedContinuationSelections));
  }
  function openGuidedDraft(schema:SchemaDefinition):void {
    activeSchemaId = schema.id; schemaDraft = schemaEditorDraft(schema); renderSchemas();
  }
  function openGuidedContinuationPicker(event:GuidedCapturedEvent):void {
    if (!guidedValidationRoot || !schemaOwnerDocument) return;
    for (const dispose of guidedDialogDisposers.splice(0)) dispose(); guidedValidationRoot.replaceChildren();
    const dialog = schemaOwnerDocument.createElement("dialog"), heading = schemaOwnerDocument.createElement("h5"), choices = schemaOwnerDocument.createElement("div");
    dialog.id = "guided-continuation-schema-picker"; dialog.setAttribute("aria-labelledby", "guided-continuation-schema-picker-heading");
    heading.id = "guided-continuation-schema-picker-heading"; heading.textContent = "Choose schema destination";
    choices.setAttribute("aria-label", "Schemas with working drafts");
    for (const schema of schemas.filter(({ workingDraft }) => Boolean(workingDraft))) {
      const choose = schemaOwnerDocument.createElement("button"); choose.type = "button";
      choose.textContent = `${schema.name} revision ${schema.version} · ${schema.workingDraft?.pendingChanges.length ?? 0} pending changes`;
      const select = ():void => { persistGuidedContinuation(event, schema.id); dialog.close(); guidedValidationRoot.replaceChildren();
        ports.restoreGuidedCapture(event.id); for (const dispose of guidedDialogDisposers.splice(0)) dispose(); };
      choose.addEventListener("click", select); guidedDialogDisposers.push(() => choose.removeEventListener("click", select)); choices.append(choose);
    }
    const cancel = schemaOwnerDocument.createElement("button"); cancel.type = "button"; cancel.textContent = "Cancel";
    const close = ():void => { dialog.close(); guidedValidationRoot.replaceChildren(); for (const dispose of guidedDialogDisposers.splice(0)) dispose(); };
    cancel.addEventListener("click", close); guidedDialogDisposers.push(() => cancel.removeEventListener("click", close));
    dialog.append(heading, choices, cancel); guidedValidationRoot.append(dialog); dialog.showModal(); heading.focus({ preventScroll:true });
  }
  function openLivePropertyDeclaration(event:GuidedCapturedEvent, path:string, trigger:HTMLButtonElement):boolean {
    if (!guidedValidationRoot || !schemaOwnerDocument) return false;
    for (const dispose of livePropertyDialogDisposers.splice(0)) dispose(); guidedValidationRoot.replaceChildren();
    const dialog = schemaOwnerDocument.createElement("dialog"), feedback = schemaOwnerDocument.createElement("output");
    dialog.className = "live-schema-property-declaration-review"; dialog.setAttribute("aria-labelledby", "live-schema-property-declaration-heading");
    const close = (restoreFocus=true):void => { for (const dispose of livePropertyDialogDisposers.splice(0)) dispose();
      dialog.close(); guidedValidationRoot.replaceChildren(); if (restoreFocus) trigger.focus({ preventScroll:true }); };
    const listen = (control:HTMLButtonElement, action:() => void):void => { control.addEventListener("click", action);
      livePropertyDialogDisposers.push(() => control.removeEventListener("click", action)); };
    const showReview = (schema:SchemaDefinition):void => {
      const heading = schemaOwnerDocument.createElement("h5"), review = schemaOwnerDocument.createElement("p"), confirm = schemaOwnerDocument.createElement("button"), cancel = schemaOwnerDocument.createElement("button");
      heading.id = "live-schema-property-declaration-heading"; heading.textContent = "Review schema property declaration";
      try {
        const declaration = createLiveSchemaPropertyDeclaration(event.payload, path, schema);
        review.textContent = `${declaration.canonicalPath} · ${declaration.detectedType} · ${schema.name} revision ${schema.version}. No validation rule will be added.`;
        confirm.type = cancel.type = "button"; confirm.textContent = `Add property to ${schema.name} draft`; cancel.textContent = "Cancel";
        listen(confirm, () => { try { schemas = schemas.map((candidate) => candidate.id === schema.id
            ? addLiveSchemaPropertyDeclaration(candidate, declaration) : candidate); persistSchemaLibrary(); renderSchemas(); close(false);
            ports.scheduleFrame(() => ports.restoreGuidedCapture(event.id, declaration.concretePath)); }
          catch (error) { feedback.textContent = error instanceof Error ? error.message : "The property could not be added to the schema draft."; } });
        listen(cancel, () => close()); dialog.replaceChildren(heading, review, feedback, confirm, cancel);
      } catch (error) { feedback.textContent = error instanceof Error ? error.message : "The observed property is unavailable.";
        cancel.type = "button"; cancel.textContent = "Cancel"; listen(cancel, () => close()); dialog.replaceChildren(heading, feedback, cancel); }
      heading.focus({ preventScroll:true });
    };
    const selected = selectedGuidedContinuation(guidedContinuationSelections, event, schemas);
    if (selected?.workingDraft) showReview(selected);
    else {
      const heading = schemaOwnerDocument.createElement("h5"), choices = schemas.filter(({ workingDraft }) => Boolean(workingDraft)).map((schema) => {
        const choose = schemaOwnerDocument.createElement("button"); choose.type = "button"; choose.textContent = schema.name; listen(choose, () => showReview(schema)); return choose; }),
        cancel = schemaOwnerDocument.createElement("button"); heading.id = "live-schema-property-declaration-heading"; heading.textContent = "Choose schema destination";
      cancel.type = "button"; cancel.textContent = "Cancel"; listen(cancel, () => close()); dialog.replaceChildren(heading, ...choices, cancel); heading.focus({ preventScroll:true });
    }
    guidedValidationRoot.append(dialog); dialog.showModal(); return true;
  }
  function openAllowedValueExpansionReview(eventId:string, assignedSchemaId:string, evaluation:ValidationEvaluation, trigger:HTMLButtonElement):boolean {
    if (!guidedValidationRoot || !schemaOwnerDocument) return false;
    const input = { schemas, reusableRules:expansionReusableRules(), assignedSchemaId, evidence:evaluation };
    let review:ReturnType<typeof reviewAllowedValueExpansion>;
    try { review = reviewAllowedValueExpansion(input); }
    catch (error) { if (schemaResult) schemaResult.textContent = error instanceof Error ? error.message : "The allowed value review is unavailable."; return false; }
    for (const dispose of allowedValueDialogDisposers.splice(0)) dispose(); guidedValidationRoot.replaceChildren();
    const dialog = schemaOwnerDocument.createElement("dialog"), heading = schemaOwnerDocument.createElement("h5"), summary = schemaOwnerDocument.createElement("p"),
      destinations = schemaOwnerDocument.createElement("fieldset"), feedback = schemaOwnerDocument.createElement("output"), confirm = schemaOwnerDocument.createElement("button"),
      openDraft = schemaOwnerDocument.createElement("button"), cancel = schemaOwnerDocument.createElement("button");
    let destination:AllowedValueExpansionDestination = review.destinations[0]!;
    heading.textContent = "Review allowed value addition"; summary.textContent = `${review.assignedSchema.name} revision ${review.assignedSchema.version} · ${review.propertyPath} · proposed ${String(review.proposedValue)}.`;
    const listenAllowed = (control:HTMLElement, type:string, action:EventListener):void => { control.addEventListener(type, action);
      allowedValueDialogDisposers.push(() => control.removeEventListener(type, action)); };
    for (const [index, choice] of review.destinations.entries()) { const label = schemaOwnerDocument.createElement("label"), radio = schemaOwnerDocument.createElement("input");
      radio.type = "radio"; radio.value = choice; radio.checked = index === 0; const select = ():void => { destination = choice; };
      listenAllowed(radio, "change", select); label.append(radio, choice); destinations.append(label); }
    const close = (restoreFocus=true):void => { for (const dispose of allowedValueDialogDisposers.splice(0)) dispose(); dialog.close(); guidedValidationRoot.replaceChildren();
      if (restoreFocus) trigger.focus({ preventScroll:true }); };
    confirm.type = openDraft.type = cancel.type = "button"; confirm.textContent = review.alreadyPending ? "Keep existing pending value" : "Confirm addition";
    openDraft.textContent = "Open working draft"; cancel.textContent = "Cancel";
    listenAllowed(confirm, "click", () => { try { const applied = applyAllowedValueExpansion({ ...input, destination });
        schemas = applied.schemas; reusableSchemaRules = storedPromotionRules(applied.reusableRules.map((rule) => ({ ...rule,
          name:rule.name ?? rule.id, enabled:rule.enabled !== false })) as unknown as readonly PromotableReusableRule[]); persistSchemaAndRuleLibraries();
        activeSchemaId = applied.affectedSchemaId; schemaDraft = schemaEditorDraft(active()); renderSchemas(); close(false);
        if (schemaResult) schemaResult.textContent = applied.changed ? `${String(review.proposedValue)} was added to the working draft.` : "The allowed value was already pending; no duplicate was created.";
        ports.scheduleFrame(() => ports.restoreGuidedCapture(eventId, evaluation.propertyPath)); }
      catch (error) { feedback.textContent = error instanceof Error ? error.message : "The allowed value could not be added."; } });
    listenAllowed(openDraft, "click", () => { const targetId = destination === "parent-schema-draft" ? evaluation.schemaId : assignedSchemaId,
        target = schemas.find(({ id }) => id === targetId); if (!target) return; activeSchemaId = target.id; schemaDraft = schemaEditorDraft(target); close(false); renderSchemas(); });
    listenAllowed(cancel, "click", () => close()); dialog.append(heading, summary, destinations, feedback, confirm, openDraft, cancel);
    guidedValidationRoot.append(dialog); dialog.showModal(); heading.focus({ preventScroll:true }); return true;
  }
  function downloadSchemaJson(value:unknown, filename:string):void { ports.downloadSchema(value, filename); }
  function omittedRuleStatus(count:number):string { return `${count} omitted ${count === 1 ? "rule" : "rules"}`; }
  function storedPromotionRules(rules:readonly PromotableReusableRule[]):ReusableSchemaRule[] {
    return rules.map((rule) => { const { revisionHistory, ...current } = structuredClone(rule); return { ...current,
      ...(revisionHistory ? { revisionHistory:revisionHistory.map((snapshot) => ({ name:snapshot.name ?? rule.name,
        kind:snapshot.kind ?? rule.kind, version:snapshot.version ?? 1, ...(snapshot.enabled !== undefined ? { enabled:snapshot.enabled } : {}),
        ...(snapshot.operator !== undefined ? { operator:snapshot.operator } : {}), ...(snapshot.parameters !== undefined ? { parameters:snapshot.parameters } : {}),
        ...(snapshot.allowedValues !== undefined ? { allowedValues:structuredClone(snapshot.allowedValues) } : {}),
        ...(snapshot.severity !== undefined ? { severity:snapshot.severity } : {}), ...(snapshot.message !== undefined ? { message:snapshot.message } : {}),
        ...(snapshot.conditionGroup !== undefined ? { conditionGroup:structuredClone(snapshot.conditionGroup) } : {}) })) } : {}) } as ReusableSchemaRule; });
  }
  function requestSavedSchemaAdoption(schema: SchemaDefinition, trigger: HTMLButtonElement): void {
    ports.adoptSavedSchema(structuredClone(schema), trigger);
  }
  function openSchemaSpecification(schema: SchemaDefinition,
    surface: `published:${number}` | `historical:${number}` | "working-draft", trigger: HTMLButtonElement): void {
    if (!schemaSpecificationBuilder) return; schemaSpecificationBuilder.hidden = false;
    if (schemaEditor) schemaEditor.hidden = true; if (schemaDetailEmpty) schemaDetailEmpty.hidden = true;
    ports.renderSchemaSpecification(schemaSpecificationBuilder, structuredClone(schema), structuredClone(schemas), surface, () => {
      schemaSpecificationBuilder.hidden = true; renderSchemaDraft(); trigger.focus({ preventScroll:true });
    });
  }
  function openContributorInUnifiedEditor(key: string): void { ports.openContributor(key); }
  function schemaEditorDraft(schema: SchemaDefinition): SchemaDefinition {
    const draft = schema.workingDraft; if (!draft) return structuredClone(schema);
    const { attachedRules:_attachedRules, parentSchemaId:_parentSchemaId, inheritedRuleOverrides:_overrides,
      documentation:_documentation, canonicalSchema:_canonicalSchema, ...current } = structuredClone(schema);
    return { ...current, name:draft.name ?? current.name, document:structuredClone(draft.document), assignments:structuredClone(draft.assignments),
      ...(draft.attachedRules !== undefined ? { attachedRules:structuredClone(draft.attachedRules) } : {}),
      ...(draft.parentSchemaId !== undefined ? { parentSchemaId:draft.parentSchemaId } : {}),
      ...(draft.inheritedRuleOverrides !== undefined ? { inheritedRuleOverrides:structuredClone(draft.inheritedRuleOverrides) } : {}),
      ...(draft.documentation !== undefined ? { documentation:structuredClone(draft.documentation) } : {}),
      ...(draft.canonicalSchema !== undefined ? { canonicalSchema:structuredClone(draft.canonicalSchema) } : {}) };
  }
  function withSchemaParent(schema: SchemaDefinition, parentSchemaId: string | undefined): SchemaDefinition {
    const { parentSchemaId:_previousParentSchemaId, ...withoutParent } = schema;
    return parentSchemaId ? { ...withoutParent, parentSchemaId } : withoutParent;
  }
  function schemaRuleLabel(entry: DisplayedSchemaRule): string {
    return reusableSchemaRules.find(({ id }) => id === entry.rule.id)?.name ?? entry.rule.id;
  }
  function displaySchemaRule(entry: DisplayedSchemaRule): string {
    return `${schemaRuleLabel(entry)} v${entry.rule.version} · ${entry.path} · ${entry.origin.name} v${entry.origin.version}`;
  }
  function renderSchemaInheritancePresentation(draft: SchemaDefinition): void {
    if (!schemaInheritedRuleGroups || !schemaEffectiveRulePreview || !schemaOwnerDocument) return;
    const ancestors: SchemaDefinition[] = [], seen = new Set<string>([draft.id]); let parentId = draft.parentSchemaId;
    while (parentId && !seen.has(parentId)) { seen.add(parentId); const parent = schemas.find(({ id }) => id === parentId);
      if (!parent) break; ancestors.push(parent); parentId = parent.parentSchemaId; }
    const inherited = ancestors.flatMap((origin) => (origin.attachedRules ?? []).map((rule): DisplayedSchemaRule => {
      const override = rule.propertyPath ? draft.inheritedRuleOverrides?.[rule.propertyPath] : undefined;
      return { path:rule.propertyPath ?? "root", rule, origin, state:override === "disabled" ? "disabled-inherited"
        : override === "enabled" ? "explicitly-reenabled" : "active-inherited" }; }));
    const local = (draft.attachedRules ?? []).map((rule): DisplayedSchemaRule => ({ path:rule.propertyPath ?? "root", rule, origin:draft, state:"local" }));
    const groups: Record<DisplayedSchemaRule["state"], readonly DisplayedSchemaRule[]> = {
      "active-inherited":inherited.filter((entry) => entry.state === "active-inherited" && entry.rule.enabled !== false),
      "disabled-inherited":inherited.filter((entry) => entry.state === "disabled-inherited" || (entry.state === "active-inherited" && entry.rule.enabled === false)),
      "explicitly-reenabled":inherited.filter((entry) => entry.state === "explicitly-reenabled"), local };
    const labels: Record<DisplayedSchemaRule["state"], string> = { "active-inherited":"Active inherited",
      "disabled-inherited":"Disabled inherited", "explicitly-reenabled":"Explicitly re-enabled", local:"Local" };
    schemaInheritedRuleGroups.hidden = ancestors.length === 0; schemaEffectiveRulePreview.hidden = ancestors.length === 0;
    schemaInheritedRuleGroups.replaceChildren(...(["active-inherited", "disabled-inherited", "explicitly-reenabled", "local"] as const).map((state) => {
      const group = schemaOwnerDocument.createElement("section"), heading = schemaOwnerDocument.createElement("h5"), list = schemaOwnerDocument.createElement("ul"), entries = groups[state];
      group.dataset.inheritedRuleGroup = state; heading.textContent = `${labels[state]} (${entries.length})`;
      const empty = state === "local" ? "No local rules." : state === "explicitly-reenabled" ? "No explicitly re-enabled inherited rules." : `No ${labels[state].toLowerCase()} rules.`;
      list.replaceChildren(...(entries.length ? entries.map((entry) => { const item = schemaOwnerDocument.createElement("li"); item.textContent = displaySchemaRule(entry); return item; })
        : [Object.assign(schemaOwnerDocument.createElement("li"), { textContent:empty })])); group.append(heading, list); return group; }));
    const effective = [...groups["active-inherited"], ...groups["explicitly-reenabled"], ...groups.local], heading = schemaOwnerDocument.createElement("h4"), list = schemaOwnerDocument.createElement("ul");
    heading.textContent = "Effective-rule preview"; list.replaceChildren(...(effective.length ? effective.map((entry) => Object.assign(schemaOwnerDocument.createElement("li"), {
      textContent:`${entry.path} · ${schemaRuleLabel(entry)} v${entry.rule.version} · ${entry.state === "local" ? "local" : `inherited from ${entry.origin.name} v${entry.origin.version}`}` }))
      : [Object.assign(schemaOwnerDocument.createElement("li"), { textContent:"No effective rules." })])); schemaEffectiveRulePreview.replaceChildren(heading, list);
  }
}

export const installedControllerDefinition = Object.freeze({
  id:"schemas",
  capabilities:["schema and rule libraries", "drafts", "assignments", "validation", "guided validation"],
});
