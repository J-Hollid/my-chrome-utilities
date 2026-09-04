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
  schemaRevision,
  schemaPropertyRows,
  schemaRevisionChoices,
  schemaPropertyCopySource,
  schemaInheritanceConflict,
  schemaInheritanceError,
  addManualProperty,
  assignmentDraftAfterGuidedSave,
  assignableSchemas,
  assignmentConditionSuggestions, configuredRuleDetails, ruleConfigurationControls, validateRuleConfiguration, comparisonValueFromInput, builtInRulesForProperty, applicablePropertyTypesForRule, reusableRulesForProperty, reusableRuleMetadata,
  conditionGroupAppliesToValue, operatorsForConditionType, cardinalityComparisonPasses,
  renderSchemaPropertyTypeEditor, applySchemaPropertyTypeEdit, schemaPropertyTypeLabel, schemaPropertyTypeOwner,
  canonicalDocumentationPath, resolveEffectiveSchemaDocumentation, schemaPropertyExampleChoices, schemaPropertyExampleInputType,
  exampleValueFromInput, schemaPropertyExampleConflicts,
  assignmentDataConditionSummary,
  contextualManualPropertyDefinition,
  createRuleConfiguration,
  createRuleConfigurationFromAttachedRule,
  createExtensionSchemaPackage,
  createSchemaLibraryExport,
  duplicateSchemaAssignment,
  guidedAttachedRule,
  guidedPropertyDocument,
  manualPropertyContainerAction,
  manualPropertyPreview,
  mergeGuidedDocument,
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
  mountCanonicalPredicateEditor,
  typedComparisonValue, GUIDED_CONTINUATION_STORAGE_KEY, restoreGuidedContinuationSelections, selectGuidedContinuation, selectedGuidedContinuation,
  createGuidedValidationFlow,
  applyCanonicalCommand,
  canonicalCommandOutcome,
  canonicalPropertyPath,
  canonicalLivePropertyPath,
  canonicalRulePropertyPath,
  canonicalCommandsFromCompactProjection,
  compactCanonicalCommandPolicy,
  compactSchemaProjection,
  createSchema,
  activateFocusedOwnershipSection,
  clearSchemaTableOverlay,
  focusedCanonicalOwnershipInput,
  focusedDefinitionFieldLabels,
  focusedOwnershipActionTarget,
  focusedOwnershipState,
  focusedPropertyLayerSequence,
  focusedPropertyLifecycleOperation,
  focusedPropertyPatch,
  focusedPropertyProvenanceSummary,
  focusedSectionOwnershipActions,
  focusedSourceState,
  focusedStagedChanges,
  gateFocusedOwnershipSection,
  mountSchemaTableOverlay,
  renderCanonicalFocusedSection,
  renderFocusedPropertyMenu,
  renderCanonicalFocusedRules,
  savedSchemaCanonicalDocument,
  savedSchemaFromCanonical,
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
  type SchemaPropertyDocumentation, type SchemaPropertyExample,
  type SchemaRelationshipTreeNode, type GuidedContinuationSelections,
} from "../../utilities/data-layer/schemas.js";
import { createSchemaLifecycle } from "./lifecycle.js";
import { createSchemaRelationshipTreeController } from "./relationship-tree-controller.js";
import { SchemaLibraryController } from "./library-controller.js";
import { SchemaPropertyController } from "./property-controller.js";
import { SchemaAssignmentController } from "./assignment-controller.js";
import { SchemaValidationController } from "./validation-controller.js";
import { SchemaGuidedValidationController } from "./guided-validation-controller.js";
import { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import { applySchemaPropertyCopy, planSchemaPropertyCopy, type SchemaPropertyCopyPlan } from "../../data-layer-schema-property-copy.js";
import { renderSchemaPropertyCopyReview, type SchemaPropertyCopyReviewController } from "../../data-layer-schema-property-copy-ui.js";
import type { AssignmentDataConditionEditorState } from "../../data-layer-schema-assignment-data-conditions-ui.js";
import { normalizeAllowedValuesRuleLibraryEntry } from "../../data-layer-allowed-values-rule.js";
import {
  persistLocalRulePromotion,
  promoteLocalRule,
  reviewLocalRulePromotion,
  type LocalRulePromotionSelection,
} from "../../data-layer-local-rule-promotion.js";
import type { LocalRulePromotionDialogController } from "../../data-layer-local-rule-promotion-ui.js";
import { createProjectHydrationSlot } from "./project-hydration.js";
import { createSchemaEditorRouteController } from "./editor-route-controller.js";
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
import { openAllowedValueExpansionDialog } from "../../data-layer-allowed-value-expansion-ui.js";
import type { ValidationEvaluation } from "../../data-layer-validation-model.js";

export interface SchemasInstalledPorts {
  root: ParentNode;
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  relationshipViewStorage: Pick<Storage, "getItem" | "setItem">;
  changed(schemas: readonly SchemaDefinition[]): void;
  subscribe(listener: (activeProjectId:string|undefined) => void): () => void;
  blocked?(): boolean;
  createRuleId(): string;
  capturedAssignmentValue(target: AssignmentConditionTarget): unknown;
  renderAssignmentConditions(root: HTMLElement, state: AssignmentDataConditionEditorState,
    changed: (state: AssignmentDataConditionEditorState) => void): void;
  localRulePromotionDialog: LocalRulePromotionDialogController;
  subscribeSchemaPersistence(listener: (event: SchemaPersistenceEvent) => void | Promise<void>): () => void;
  downloadSchema(value: unknown, filename: string): void;
  relationshipTree(schemas: readonly SchemaDefinition[]): { projectId:string; nodes:readonly SchemaRelationshipTreeNode[] };
  openProjectLibrary(create: boolean): void;
  openContributor(key: string): void;
  openContributorInStudio(key: string): void;
  adoptSavedSchema(schema: SchemaDefinition, trigger: HTMLButtonElement): void;
  renderSchemaSpecification(root: HTMLElement, schema: SchemaDefinition, schemas: readonly SchemaDefinition[],
    surface: `published:${number}` | `historical:${number}` | "working-draft", close: () => void): void;
  reportMissingSchemaEvent(schemaId: string): void;
  showSchemasView():void;
  scheduleFrame(callback: () => void): void;
  restoreGuidedCapture(eventId:string, propertyPath?:string, focusAction?:"validation"|"declaration"):void;
  guidedSaved?(message:string):void;
  activeProjectId(): string | undefined;
  ensureProjectSchemaContributors(projectId: string, route: Readonly<{ collectionKinds:readonly string[]; includeFlowGraphs:boolean }>): Promise<{ name:string }>;
  settleCanonical?(schemaId:string):Promise<void>;
  mountLayeredProfileEditor():{ dispose():void } | undefined;
  canonicalConceptSuggestions():readonly string[];
  createCanonicalTableEditor?(options:Parameters<typeof mountCanonicalSchemaEditor>[0]):ReturnType<typeof mountCanonicalSchemaEditor>;
  revalidateCurrentLive?(schemas:readonly SchemaDefinition[], manualOverrides:Readonly<Record<string,string>>):number;
  prepareCapturedValidationContinuation?(record:SchemaValidationRecord):Promise<CapturedValidationContinuation>;
}

export interface SchemaSourceDraftInput { name:string; sourceId:string; eventName:string; payload:unknown; label:string }

export interface SchemaValidationRecord { eventId:string; eventName:string; state:string; checkedAt:string; schemaId?:string;
  schemaName?:string; schemaVersion?:number; target?:string; assignmentId?:string; assignmentName?:string; assignmentEvidence?:string;
  evaluated?:{ resultIdentity:string; winner?:{ schemaId:string; schemaRevision:number }; issueDetails:readonly { code:string; path?:string }[] };
  issueCodes:readonly string[] }
export interface CapturedValidationContinuation {
  projectName:string; summary:string; review:string; suggestedName:string;
  events:readonly { id:string; name:string }[]; pages:readonly { id:string; name:string }[];
  flowSteps:readonly { id:string; name:string }[]; profiles:readonly { id:string; name:string }[];
  commit(input:{ destination:"fixture" | "profile"; name:string; eventId:string; pageId?:string; flowStepId?:string; profileId?:string }):Promise<{ entityName:string; kind:"fixtures" | "profiles" }>;
}

export type SchemaPersistenceEvent =
  | { type:"saved" | "retried"; schemaId:string }
  | { type:"failed" | "rejected"; schemaId:string; error:unknown };

export interface ReusableSchemaRuleRevision {
  name:string; kind:string; version:number; enabled?:boolean; applicableType?:SchemaPropertyType;
  operator?:string; parameters?:string; severity?:string; message?:string; examples?:string;
}

export interface ReusableSchemaRule {
  id:string; name:string; kind:string; version:number; enabled:boolean; applicableType?:SchemaPropertyType;
  operator?:string; parameters?:string; severity?:string; message?:string; examples?:string; attachments?:readonly string[];
  revisionHistory?:readonly ReusableSchemaRuleRevision[];
  allowedValues?:readonly (string | number | boolean | null)[];
  comparison?:Exclude<NonNullable<SchemaDefinition["attachedRules"]>[number]["comparison"], undefined>;
  limit?:number;
  conditionGroup?:NonNullable<PromotableReusableRule["conditionGroup"]>;
  description?:string;
}
export type CompactCanonicalCommand = Parameters<typeof applyCanonicalCommand>[1];
type CompactCanonicalCommandResult = ReturnType<typeof applyCanonicalCommand>;
export interface CompactCanonicalEditorAdapter {
  key:string; label:string; load():CanonicalSchemaDocument;
  dispatch(command:CompactCanonicalCommand):CompactCanonicalCommandResult;
  settle?():Promise<void>; settles?(command:CompactCanonicalCommand):boolean;
  settlementTarget?:string;
  projection?(canonical:CanonicalSchemaDocument):SchemaDefinition;
  persistProjection?(projection:SchemaDefinition, change?:string):boolean;
  stageProjectionCommand?(command:CompactCanonicalCommand):CompactCanonicalCommandResult;
  restoreStagedProjection?(canonical:CanonicalSchemaDocument):void;
  onSettlementCommitted?():void;
  onUndo?():void|string|Promise<void|string>; onRedo?():void|string|Promise<void|string>;
  renderContext?(host:HTMLElement):void;
  actions?:readonly { label:string; run():void }[];
  migration?:{ summary:string; conflicts:readonly { id:string; label:string; choices:readonly { id:string; label:string }[] }[];
    resolve(conflictId:string, choiceId:string):void; cancel():void; confirm():Promise<void> };
}
export interface CompactCanonicalProjectionPersistenceRequest { adapter:CompactCanonicalEditorAdapter; projection:SchemaDefinition; change?:string }
export interface CompactCanonicalProjectionWorker { adapter:CompactCanonicalEditorAdapter; promise:Promise<boolean>; settlement:number }
type DisplayedSchemaRule = { path:string; rule:NonNullable<SchemaDefinition["attachedRules"]>[number]; origin:SchemaDefinition;
  state:"active-inherited" | "disabled-inherited" | "explicitly-reenabled" | "local" };

import { SCHEMA_RULE_STORAGE_KEY, SchemaRuleController } from "./rule-controller.js";

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
  const schemaEditorStatus = ports.root.querySelector<HTMLElement>("#schema-editor-status");
  const schemaDetail = ports.root.querySelector<HTMLElement>("#schema-detail");
  const schemaTreeScrollOwner = ports.root.querySelector<HTMLElement>("#workspace-panel-data-layer");
  const schemaPanel = ports.root.querySelector<HTMLElement>("#data-layer-panel-schemas");
  const editorRoute = createSchemaEditorRouteController({
    panel:schemaPanel, scrollOwner:schemaTreeScrollOwner, scheduleFrame:ports.scheduleFrame,
  });
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
  const schemaEditorNameAssistance = ownedElement("#schema-editor-name-assistance", "output");
  if (schemaEditorNameAssistance && !schemaEditorNameAssistance.isConnected) {
    schemaEditorNameAssistance.id = "schema-editor-name-assistance"; schemaEditorName?.after(schemaEditorNameAssistance);
  }
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
  let schemaPropertyCopyDialog = ownedElement("#schema-property-copy-dialog", "dialog");
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
  if (schemaRuleTypes?.ownerDocument) schemaRuleTypes.replaceChildren(...([
    ["string", "String"], ["number", "Number"], ["boolean", "Boolean"],
    ["object", "Object"], ["array", "Array"],
  ] as const).map(([value, label]) => {
    const option = schemaRuleTypes.ownerDocument.createElement("option");
    option.value = value; option.textContent = label; return option;
  }));
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
  if (schemaPropertyRemovalFeedback && !schemaPropertyRemovalFeedback.isConnected) {
    schemaPropertyRemovalFeedback.id = "schema-property-removal-feedback"; schemaPropertyRemovalFeedback.setAttribute("aria-live", "polite");
    schemaPropertyTree?.after(schemaPropertyRemovalFeedback);
  }
  if (undoSchemaPropertyRemovalButton && !undoSchemaPropertyRemovalButton.isConnected) {
    undoSchemaPropertyRemovalButton.id = "undo-schema-property-removal"; undoSchemaPropertyRemovalButton.type = "button";
    undoSchemaPropertyRemovalButton.textContent = "Undo"; undoSchemaPropertyRemovalButton.hidden = true;
    schemaPropertyRemovalFeedback?.after(undoSchemaPropertyRemovalButton);
  }
  if (schemaPropertyCopyFeedback && !schemaPropertyCopyFeedback.isConnected) {
    schemaPropertyCopyFeedback.id = "schema-property-copy-feedback"; schemaPropertyCopyFeedback.setAttribute("aria-live", "polite");
    schemaPropertyRemovalFeedback?.after(schemaPropertyCopyFeedback);
  }
  if (undoSchemaPropertyCopyButton && !undoSchemaPropertyCopyButton.isConnected) {
    undoSchemaPropertyCopyButton.id = "undo-schema-property-copy"; undoSchemaPropertyCopyButton.type = "button";
    undoSchemaPropertyCopyButton.textContent = "Undo property copy"; undoSchemaPropertyCopyButton.hidden = true;
    schemaPropertyCopyFeedback?.after(undoSchemaPropertyCopyButton);
  }
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
      if (schemaManualArrayItemType) { schemaManualArrayItemType.id = "schema-manual-array-item-type";
        const empty = schemaOwnerDocument?.createElement("option"); if (empty) { empty.value = ""; empty.textContent = "Choose item type"; schemaManualArrayItemType.append(empty); }
        for (const type of ["string", "number", "boolean", "object"] as const) { const option = schemaOwnerDocument?.createElement("option");
          if (option) { option.value = type; option.textContent = type; schemaManualArrayItemType.append(option); } }
        schemaManualArrayTypeGroup.append(schemaManualArrayItemType); } } append(schemaManualArrayTypeGroup);
    if (schemaManualPropertyPreview) { schemaManualPropertyPreview.id = "schema-manual-property-preview";
      schemaManualPropertyPreview.setAttribute("aria-live", "polite"); } append(schemaManualPropertyPreview);
    if (schemaManualPropertyAssistance) { schemaManualPropertyAssistance.id = "schema-manual-property-assistance";
      schemaManualPropertyAssistance.setAttribute("aria-live", "polite"); } append(schemaManualPropertyAssistance);
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
    schemaRuleSyncReviewSummary, confirmSchemaRuleSyncButton, cancelSchemaRuleSyncButton, "confirm-schema-rule-sync");
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
  const lifecycle = createSchemaLifecycle();
  let unsubscribe: (() => void) | undefined;
  let unsubscribeSchemaPersistence: (() => void) | undefined;
  let hydratedSchemaProjectId: string | undefined;
  const relationshipTreeController = createSchemaRelationshipTreeController({
    query:schemaSearch, category:schemaCategoryFilter, scrollOwner:schemaTreeScrollOwner,
    panel:schemaPanel, list:schemaList, emptyState:schemaEmptyState, count:schemaCount,
    storage:ports.relationshipViewStorage, scheduleFrame:ports.scheduleFrame,
  });
  const activeSchemaProjectHydration = createProjectHydrationSlot();
  const schemaContributorRoute = { collectionKinds:["profiles", "propertySets", "pages", "events", "flows"], includeFlowGraphs:true } as const;
  let schemaPropertyRowDisposers: (() => void)[] = [];
  const listen = (target: HTMLElement, type: string, listener: EventListener): void => {
    relationshipTreeController.listen(target, type, listener);
  };
  const listenRule = (target:HTMLElement, type:string, listener:EventListener):void => {
    ruleController.listenRow(target, type, listener);
  };
  const listenProperty = (target:HTMLElement, type:string, listener:EventListener):void => {
    target.addEventListener(type, listener); schemaPropertyRowDisposers.push(() => target.removeEventListener(type, listener));
  };
  const library = new SchemaLibraryController({ storage:ports.storage, changed:ports.changed });
  const propertyController = new SchemaPropertyController();
  let pendingSchemaRestoration: { schemaId:string; version:number } | undefined;
  const validationController = new SchemaValidationController(ports.storage);
  const ruleController = new SchemaRuleController(ports.storage, {
    elements:{ list:schemaRuleList, search:schemaRuleSearch, editor:schemaRuleEditor, name:schemaRuleName,
      parameters:schemaRuleParameters, types:schemaRuleTypes, operator:schemaRuleOperator, severity:schemaRuleSeverity,
      message:schemaRuleMessage, examples:schemaRuleExamples, attachments:schemaRuleAttachments,
      updateAttachments:updateSchemaRuleAttachments, result:schemaResult, revisionReview:schemaRuleRevisionReview,
      revisionSummary:schemaRuleRevisionReviewSummary, confirmRevision:confirmSchemaRuleRevisionButton,
      upgradeReview:schemaRuleUpgradeReview, upgradeSummary:schemaRuleUpgradeReviewSummary,
      confirmUpgrade:confirmSchemaRuleUpgradeButton, cancelUpgrade:cancelSchemaRuleUpgradeButton,
      syncReview:schemaRuleSyncReview, syncSummary:schemaRuleSyncReviewSummary, confirmSync:confirmSchemaRuleSyncButton,
      cancelSync:cancelSchemaRuleSyncButton, deleteReview:schemaRuleDeleteReview, deleteSummary:schemaRuleDeleteReviewSummary,
      confirmDelete:confirmSchemaRuleDeleteButton, document:schemaOwnerDocument },
    schemas:() => library.schemas, replaceSchemas:(schemas) => { library.schemas = schemas; },
    persistRules:() => ruleController.persist(), persistLibrary:() => persistSchemaLibrary(),
    renderAll:() => renderSchemas(), createId:ports.createRuleId, download:ports.downloadSchema,
  });
  const assignmentController = new SchemaAssignmentController({
    elements:{ editor:schemaAssignmentEditor, source:schemaAssignmentSource, event:schemaAssignmentEvent,
      priority:schemaAssignmentPriority, save:saveSchemaAssignmentButton, target:schemaAssignmentTarget,
      domain:schemaAssignmentDomain, pathname:schemaAssignmentPathname, versionPolicy:schemaAssignmentVersionPolicy,
      enabled:schemaAssignmentEnabled, list:schemaAssignmentList, conflicts:schemaAssignmentConflicts,
      schema:schemaAssignmentSchema, conditions:schemaAssignmentDataConditions, result:schemaResult },
    schemas:() => library.schemas, replaceSchemas:(schemas) => { library.schemas = schemas; },
    persistAndRender:() => { persistSchemaLibrary(); renderSchemas(); },
    capturedValue:ports.capturedAssignmentValue, renderConditions:ports.renderAssignmentConditions,
  });
  library.configure({
    elements:{ importFile:schemaLibraryImportFile, importReview:schemaImportReview, importSummary:schemaImportReviewSummary,
      deleteReview:schemaDeleteReview, deleteSummary:schemaDeleteReviewSummary, exportButton:exportSchemaButton,
      exportChoices:schemaExportChoices, exportReview:schemaExportReview, result:schemaResult },
    rules:() => ruleController.rules, replaceRules:(rules) => { ruleController.rules = rules; },
    persistRules:() => ruleController.persist(), renderAll:() => renderSchemas(), renderRules:() => ruleController.render(),
    download:ports.downloadSchema,
  });
  const localRulePromotionDialog = ports.localRulePromotionDialog;
  interface PendingSchemaPersistence {
    schemaId:string; generation:number; kind:"promotion" | "guided"; paused:boolean; settled:boolean;
    previousSchemas:readonly SchemaDefinition[]; previousRules:readonly ReusableSchemaRule[];
    nextSchemas:readonly SchemaDefinition[]; nextRules:readonly ReusableSchemaRule[];
    complete():void; reject(error:unknown):void; pause():void;
  }
  let pendingLocalRulePromotionPersistence: PendingSchemaPersistence | undefined;
  let pendingGuidedValidationPersistence: PendingSchemaPersistence | undefined;
  const guidedController = new SchemaGuidedValidationController(ports.storage);
  let persistenceGeneration = 0;
  const canonicalController = new SchemaCanonicalEditorController({
    blocked:() => Boolean(ports.blocked?.()), generation:() => lifecycle.generation(),
    isCurrent:(generation) => lifecycle.isCurrent(generation),
    setBusy:(busy) => { schemaEditor?.setAttribute("aria-busy", String(busy)); if (busy && saveSchemaButton) saveSchemaButton.disabled = true; },
    renderContext:() => renderCompactCanonicalContext(), renderEditor:() => renderCompactCanonicalEditor(),
    createId:ports.createRuleId,
  });
  const compactCanonicalProjection = (adapter:CompactCanonicalEditorAdapter, canonical=adapter.load()):SchemaDefinition =>
    adapter.projection?.(canonical) ?? compactSchemaProjection(canonical, { id:canonical.contributorId, name:canonical.contributorName, version:canonical.revision });
  const compactCanonicalFacetText = (canonical:CanonicalSchemaDocument, node:CanonicalSchemaDocument["nodes"][string]):string => {
    const allowed = node.allowedValues.length ? node.allowedValues.map(({ value }) => String(value)).join(", ") : "none";
    return `Canonical facets · type ${node.type} · presence ${node.presence.mode} · allowed values ${allowed} · revision ${canonical.revision}`;
  };
  const beginCompactCanonicalSettlement = (schemaId?:string):number => {
    const settlement = canonicalController.beginSettlement(schemaId); schemaEditor?.setAttribute("aria-busy", "true");
    if(saveSchemaButton)saveSchemaButton.disabled=true; return settlement;
  };
  const clearCompactCanonicalSettlement = (schemaId?:string, settlement?:number):boolean => canonicalController.clearSettlement(schemaId, settlement);
  const renderCompactCanonicalContext = ():void => canonicalController.renderContext({
    host:compactCanonicalContext, document:schemaOwnerDocument, generation:lifecycle.generation(),
    isCurrent:(generation) => lifecycle.isCurrent(generation),
    dispatch:(command) => canonicalController.dispatchCommand(command),
    propertyAction:(propertyId, action, value) => canonicalController.propertyAction(propertyId, action, value),
    retry:() => canonicalController.retryCommand(), reject:() => canonicalController.rejectCommand(), rerender:renderCompactCanonicalContext,
  });
  function removeCompactCanonicalTableEditor():void {
    canonicalController.tableHost?.replaceChildren(); canonicalController.tableHost?.remove();
    canonicalController.tableHost = undefined; canonicalController.tableEditor = undefined; canonicalController.tableKey = undefined;
  }
  function renderCompactCanonicalEditor():void {
    renderCompactCanonicalContext();
    const adapter = canonicalController.editor;
    if (!adapter || !schemaEditor || !schemaOwnerDocument) { removeCompactCanonicalTableEditor(); return; }
    const canonical = adapter.load();
    library.draft = compactCanonicalProjection(adapter, canonical);
    canonicalController.revisionSnapshots.set(canonical.revision, structuredClone(canonical));
    const selected = canonical.selectedPropertyId ? canonical.nodes[canonical.selectedPropertyId] : undefined;
    const presented = library.activeSchemaId ? schemaEditorDraft(active()) : library.draft;
    const selectedPathStillExists = presented && schemaPropertyAt(presented.document, normalizedRulePickerPath(propertyController.selectedPath));
    if (selected && !selectedPathStillExists) propertyController.selectedPath = canonicalPropertyPath(canonical, selected.id).slice(1).replaceAll("/", ".");
    schemaEditor.hidden = false;
    schemaEditor.dataset.schemaPresentation = "compact-panel";
    schemaEditor.dataset.canonicalRevision = String(canonical.revision);
    schemaEditor.dataset.canonicalSchemaId = canonical.id;
    schemaEditor.setAttribute("aria-label", "Side panel canonical schema editor");
    if (schemaDetail) { schemaDetail.hidden = false; schemaDetail.setAttribute("aria-label", "Side panel schema editor region"); }
    renderSchemaDraft();
    if (!canonicalController.tableHost?.isConnected) {
      canonicalController.tableHost = schemaOwnerDocument.createElement("section");
      canonicalController.tableHost.id = "compact-canonical-table-editor"; schemaEditor.append(canonicalController.tableHost);
      canonicalController.tableEditor = undefined; canonicalController.tableKey = undefined;
    }
    canonicalController.tableHost.replaceChildren(); canonicalController.tableKey = adapter.key;
    const createEditor = ports.createCanonicalTableEditor ?? mountCanonicalSchemaEditor;
    canonicalController.tableEditor = createEditor({ host:canonicalController.tableHost, surface:"Side panel",
      conceptSuggestions:ports.canonicalConceptSuggestions, load:adapter.load, id:(kind) => `${kind}:${crypto.randomUUID()}`,
      dispatch:(command) => canonicalController.beginCommand(command)?.result
        ?? canonicalController.blockedCommand(adapter, command, "The canonical editor is no longer available."),
      ...(adapter.onUndo ? { onUndo:adapter.onUndo } : {}), ...(adapter.onRedo ? { onRedo:adapter.onRedo } : {}) });
    const tableControl = Array.from(canonicalController.tableHost.querySelectorAll("button")).find(({ textContent }) => textContent?.trim() === "Table");
    const treeControl = Array.from(canonicalController.tableHost.querySelectorAll("button")).find(({ textContent }) => textContent?.trim() === "Tree");
    tableControl?.addEventListener("click", () => { const current = adapter.load();
      canonicalController.beginCommand({ kind:"view", baseRevision:current.revision, view:"table" }); canonicalController.tableHost!.hidden = false; }, { once:true });
    treeControl?.addEventListener("click", () => { const current = adapter.load();
      canonicalController.beginCommand({ kind:"view", baseRevision:current.revision, view:"tree" }); renderCompactCanonicalEditor(); }, { once:true });
    canonicalController.tableHost.hidden = adapter.load().view !== "table";
    const unavailable = canonicalController.semanticUnresolved(); schemaEditor.setAttribute("aria-busy", String(unavailable));
    if (saveSchemaButton && adapter.key.startsWith("saved:")) saveSchemaButton.disabled = saveSchemaButton.disabled || unavailable;
  }
  const openCompactCanonicalEditor = (adapter:CompactCanonicalEditorAdapter):void => {
    if(!adapter.key.startsWith("saved:")){library.activeSchemaId=undefined;canonicalController.savedDocument=undefined;library.draft=undefined;}
    canonicalController.editor = adapter; canonicalController.reopenSelection = adapter.key; canonicalController.commandFeedback = undefined;
    canonicalController.revisionSnapshots.clear(); canonicalController.revisionSnapshots.set(adapter.load().revision, structuredClone(adapter.load()));
    if (schemaDetail) schemaDetail.scrollTop = canonicalController.scrollByKey.get(adapter.key) ?? 0; renderCompactCanonicalEditor();
  };
  const closeCompactCanonicalEditor = (clearSchemaSelection = true):void => { if (canonicalController.editor && schemaDetail) canonicalController.scrollByKey.set(canonicalController.editor.key, schemaDetail.scrollTop);
    canonicalController.discardProjectionPersistence(canonicalController.editor); canonicalController.editor = undefined;
    if (clearSchemaSelection) { library.activeSchemaId = undefined; library.draft = undefined; canonicalController.savedDocument = undefined; }
    removeCompactCanonicalTableEditor(); compactCanonicalContext && (compactCanonicalContext.hidden = true);
    if (schemaEditor) schemaEditor.hidden = true; if (schemaDetail) schemaDetail.hidden = false; if (schemaDetailEmpty) schemaDetailEmpty.hidden = false;
    renderSchemas();
    editorRoute.close((referenceKey) => {
      const invokingRow = Array.from(schemaList?.children ?? []).find((candidate) =>
        (candidate as HTMLElement).dataset.schemaReferenceKey === referenceKey) as HTMLElement | undefined;
      return invokingRow?.querySelector<HTMLButtonElement>("button") ?? undefined;
    }); };
  const proposeInstalledSchemaWorkingDraftName = (schema:SchemaDefinition, proposed:string):SchemaDefinition => {
    const updated = proposeSchemaWorkingDraftName(schema, proposed), draft = updated.workingDraft;
    if (!draft?.canonicalSchema || !proposed) return updated;
    return { ...updated, workingDraft:{ ...draft,
      canonicalSchema:{ ...draft.canonicalSchema, contributorName:proposed } } };
  };
  const persistSavedCanonicalResult = (schemaId:string, canonical:CanonicalSchemaDocument, change:string):void => {
    const stored = library.schemas.find(({ id }) => id === schemaId); if (!stored) throw new Error("The saved schema is unavailable.");
    const projectionSource = library.draft?.id === schemaId ? library.draft : schemaEditorDraft(stored);
    const projection = savedSchemaFromCanonical(projectionSource, canonical);
    const updated = updateSchemaWorkingDraft(proposeInstalledSchemaWorkingDraftName(stored, projection.name), {
      document:projection.document, assignments:projection.assignments, attachedRules:projection.attachedRules,
      parentSchemaId:projection.parentSchemaId, inheritedRuleOverrides:projection.inheritedRuleOverrides,
      documentation:projection.documentation, canonicalSchema:canonical }, change);
    library.schemas = library.schemas.map((candidate) => candidate.id === schemaId ? updated : candidate); canonicalController.savedDocument = canonical; persistSchemaLibrary();
  };
  const persistSavedProjectionMetadata = (schemaId:string, projection:SchemaDefinition, change?:string):boolean => {
    const stored = library.schemas.find(({ id }) => id === schemaId); if (!stored) throw new Error("The saved schema is unavailable.");
    const canonical = canonicalController.savedDocument; const updated = updateSchemaWorkingDraft(proposeInstalledSchemaWorkingDraftName(stored, projection.name), {
      document:projection.document, assignments:projection.assignments, attachedRules:projection.attachedRules,
      parentSchemaId:projection.parentSchemaId, inheritedRuleOverrides:projection.inheritedRuleOverrides,
      documentation:projection.documentation, ...(canonical ? { canonicalSchema:{ ...canonical, contributorName:projection.name } } : {}) },
      change === "schema name" ? undefined : change);
    if (JSON.stringify(updated) === JSON.stringify(stored)) return false;
    library.schemas = library.schemas.map((candidate) => candidate.id === schemaId ? updated : candidate);
    if (canonical) canonicalController.savedDocument = { ...canonical, contributorName:projection.name }; persistSchemaLibrary(); return true;
  };
  const savedCompactCanonicalProjection = (schemaId:string, canonical:CanonicalSchemaDocument):SchemaDefinition => {
    const stored = library.schemas.find(({ id }) => id === schemaId);
    if (!stored) return compactSchemaProjection(canonical, { id:canonical.contributorId, name:canonical.contributorName, version:canonical.revision });
    const outer = schemaEditorDraft(stored), projected = savedSchemaFromCanonical({ ...outer, name:canonical.contributorName }, canonical);
    const { canonicalSchema:_canonicalSchema, ...projection } = projected; return projection;
  };
  const openSavedSchemaInUnifiedEditor = (schema:SchemaDefinition):void => {
    library.draft = schemaEditorDraft(schema); canonicalController.savedDocument = savedSchemaCanonicalDocument(library.draft, (kind) => `schema:${kind}:${++canonicalController.idSequence}`);
    const adapter:CompactCanonicalEditorAdapter = { key:`saved:${schema.id}`, label:`${schema.name} · Saved schema working draft`,
      load:() => canonicalController.savedDocument!, projection:(canonical) => savedCompactCanonicalProjection(schema.id, canonical),
      dispatch:(command) => { const result = applyCanonicalCommand(canonicalController.savedDocument!, command);
        if (result.status === "applied" || result.status === "rebased") {
          if (command.kind === "select" || command.kind === "view") canonicalController.savedDocument = result.document;
          else persistSavedCanonicalResult(schema.id, result.document, `${command.kind} canonical property`);
        } return result; },
      stageProjectionCommand:(command) => { const result = applyCanonicalCommand(canonicalController.savedDocument!, command);
        if (result.status === "applied" || result.status === "rebased") canonicalController.savedDocument = result.document; return result; },
      restoreStagedProjection:(canonical) => { canonicalController.savedDocument = structuredClone(canonical); },
      persistProjection:(projection, change) => persistSavedProjectionMetadata(schema.id, projection, change),
      settle:() => ports.settleCanonical?.(schema.id) ?? Promise.resolve(), settles:(command) => command.kind !== "select" && command.kind !== "view",
      settlementTarget:"durable Saved Schema Library",
      actions:[{ label:"Publish schema", run:() => saveSchemaButton?.click() }, { label:"Close editor", run:closeCompactCanonicalEditor }] };
    openCompactCanonicalEditor(adapter);
  };
  const activeIndex = (): number => library.activeIndex();
  const active = (): SchemaDefinition => library.active();
  const serializeChangedSchemaLibrary = (nextSchemas:readonly SchemaDefinition[]):string => library.serialize(nextSchemas);
  const persistSchemaLibrary = (): void => library.persist();
  const startQueuedSchemaLibraryPersistence = ():void => {
    if (canonicalController.libraryPersistenceWorker || !canonicalController.queuedLibraryPersistence || canonicalController.settlementClaims.size) return;
    const queuedSchemaId = canonicalController.queuedLibraryPersistence.schemaId;
    canonicalController.libraryPersistenceWorker = (async () => {
      let activeRequest:{ schemaId:string; schemas:readonly SchemaDefinition[] } | undefined;
      try {
        while (lifecycle.isMounted() && canonicalController.queuedLibraryPersistence) {
          const request = canonicalController.queuedLibraryPersistence; activeRequest = request; canonicalController.queuedLibraryPersistence = undefined;
          canonicalController.settlementPending = true; canonicalController.settlementSchemaId = activeRequest.schemaId;
          schemaEditor?.setAttribute("aria-busy", "true");
          ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeChangedSchemaLibrary(activeRequest.schemas)); ports.changed(activeRequest.schemas);
          await ports.settleCanonical!(activeRequest.schemaId); activeRequest = undefined;
        }
      } catch {
        if (ports.blocked?.() && !canonicalController.queuedLibraryPersistence && activeRequest) canonicalController.queuedLibraryPersistence = activeRequest;
      } finally {
        canonicalController.libraryPersistenceWorker = undefined;
        if (!canonicalController.queuedLibraryPersistence) clearCompactCanonicalSettlement(activeRequest?.schemaId ?? queuedSchemaId);
        if (canonicalController.editor) renderCompactCanonicalEditor(); else schemaEditor?.setAttribute("aria-busy", String(Boolean(canonicalController.queuedLibraryPersistence)));
      }
    })();
  };
  const queueSchemaLibraryPersistence = (schemaId:string):void => {
    if (!ports.settleCanonical) { persistSchemaLibrary(); return; }
    canonicalController.queuedLibraryPersistence = { schemaId, schemas:structuredClone(library.schemas) };
    canonicalController.settlementPending = true; canonicalController.settlementSchemaId = schemaId;
    schemaEditor?.setAttribute("aria-busy", "true");
    void canonicalController.settlementBarrier.then((committed) => { if (committed) startQueuedSchemaLibraryPersistence(); });
  };
  const persistEditedSchemaIfStored = (): void => { if (activeIndex() >= 0) persistSchemaLibrary(); };
  const replaceActive = (schema: SchemaDefinition): void => library.replaceActive(schema);
  const revisionVersion = (): number => Number(schemaRevisionSelector?.value || active().version);
  const renderSchemaPropertyView = (): void => {
    const openRuleDisclosures = schemaPropertyTree
      ? Array.from(schemaPropertyTree.querySelectorAll("details[data-attached-rules][open]")) as HTMLDetailsElement[] : [];
    for (const disclosure of openRuleDisclosures) {
      const owner = disclosure.closest("[data-schema-property-canonical-path]") as HTMLElement | null;
      const canonicalPath = owner?.dataset.schemaPropertyCanonicalPath;
      if (canonicalPath) propertyController.expandedRulePaths.add(canonicalPath);
    }
    const activePropertyElement = schemaOwnerDocument?.activeElement as HTMLElement | null | undefined,
      focusedPropertyControl = activePropertyElement && schemaPropertyTree?.contains(activePropertyElement)
        ? activePropertyElement : undefined,
      previousTreeScroll = schemaPropertyTree?.scrollTop ?? 0,
      previousFocusLabel = focusedPropertyControl?.getAttribute("aria-label"),
      previousRuleFocus = focusedPropertyControl?.dataset.ruleId && focusedPropertyControl.dataset.propertyPath && focusedPropertyControl.dataset.schemaRuleAction
        ? { ruleId:focusedPropertyControl.dataset.ruleId, propertyPath:focusedPropertyControl.dataset.propertyPath,
          action:focusedPropertyControl.dataset.schemaRuleAction } : undefined,
      promotionFocusReturn = ruleController.promotionFocusReturn ? { ...ruleController.promotionFocusReturn } : undefined;
    for (const dispose of schemaPropertyRowDisposers.splice(0)) dispose();
    const schema = library.activeSchemaId ? active() : library.draft;
    const editable = schema ? schemaEditorDraft(schema) : undefined, excludedInheritedPaths = new Set(Object.entries(editable?.inheritedRuleOverrides ?? {})
      .filter(([, state]) => state === "disabled").map(([path]) => canonicalRulePropertyPath(path)));
    const rows = editable ? schemaPropertyRows(editable.document, schemaParentDocuments(), excludedInheritedPaths) : [];
    const propertyView = filterAndSortSchemaPropertyRows(rows, schemaPropertyFilter?.value ?? "",
      (schemaPropertySort?.value || "schema") as SchemaPropertySortOrder);
    const compactDocument = canonicalController.editor?.load(), compactNodesByPath = new Map(compactDocument
      ? Object.values(compactDocument.nodes).map((node) => [canonicalPropertyPath(compactDocument, node.id), node] as const) : []);
    if (schemaPropertyResultStatus) schemaPropertyResultStatus.textContent = `${propertyView.matchCount} of ${propertyView.totalCount} properties${schemaPropertyFilter?.value.trim() && propertyView.matchCount ? `, ${propertyView.contextCount} context` : ""}`;
    if (schemaPropertyEmpty) schemaPropertyEmpty.hidden = propertyView.rows.length > 0;
    if (schemaPropertyEmptyMessage) schemaPropertyEmptyMessage.textContent = propertyView.rows.length
      ? "" : `No properties match ${schemaPropertyFilter?.value.trim() ?? ""}`;
    if (schemaPropertyTree) {
      const items = propertyView.rows.flatMap((row) => { const item = schemaOwnerDocument?.createElement("li");
        if (!item) return []; item.dataset.propertyPath = row.canonicalPath;
        item.dataset.schemaPropertyPath = row.displayPath;
        item.dataset.schemaPropertyCanonicalPath = row.canonicalPath;
        const summary = schemaOwnerDocument!.createElement("strong"), metadata = schemaOwnerDocument!.createElement("span"), selectedRow = row.displayPath === propertyController.selectedPath || row.canonicalPath === normalizedRulePickerPath(propertyController.selectedPath);
        summary.textContent = canonicalController.editor ? `${row.displayPath} · ${row.canonicalPath}` : row.displayPath;
        metadata.className = "schema-property-metadata"; metadata.textContent = `${row.filterContext ? "Filter context · " : ""}${row.origin === "inherited" ? "Inherited" : row.displayPath.endsWith(".*") ? "Every item" : row.schema.propertyOrigin === "manual" ? "Manual" : "Observed"} · type ${row.schema.type ?? "unknown"}`;
        if (selectedRow) item.setAttribute("aria-current", "true");
        const compactNode = compactNodesByPath.get(row.canonicalPath), compactPropertyActions = compactNode && canonicalController.editor ? schemaOwnerDocument!.createElement("button") : undefined;
        if (compactPropertyActions) { compactPropertyActions.type = "button"; compactPropertyActions.textContent = "⋯";
          compactPropertyActions.setAttribute("aria-label", `Property actions for ${row.canonicalPath}`);
          listenProperty(compactPropertyActions, "click", () => openCompactCanonicalPropertyActions(row.canonicalPath, compactPropertyActions)); }
        item.tabIndex = -1; listenProperty(summary, "click", () => {
          propertyController.selectedPath = row.displayPath;
          if (compactDocument && compactNode) void canonicalController.dispatchCommand({ kind:"select", baseRevision:compactDocument.revision, propertyId:compactNode.id });
          renderSchemaPropertyView();
        }); item.append(summary, metadata, ...(compactPropertyActions ? [compactPropertyActions] : []));
        if (schema) {
          const editable = schemaEditorDraft(schema), inheritedOwner = row.origin === "inherited" ? schemaPropertyTypeOwner(editable, row.canonicalPath, library.schemas) : undefined;
          const typeControls = renderSchemaPropertyTypeEditor({ schema:editable, path:row.canonicalPath, property:row.schema,
            ...(inheritedOwner ? { inheritedOwner:{ name:inheritedOwner.name, open:() => { library.activeSchemaId = inheritedOwner.id; library.draft = schemaEditorDraft(inheritedOwner); renderSchemas(); } } } : {}),
            confirm:(edit) => { const changed = applySchemaPropertyTypeEdit(schemaEditorDraft(active()), edit);
              replaceActive(updateSchemaWorkingDraft(active(), { document:changed.document, attachedRules:changed.attachedRules, documentation:changed.documentation },
                `Change ${row.canonicalPath} type from ${schemaPropertyTypeLabel(row.schema)} to ${edit.type}`)); persistSchemaLibrary(); renderSchemas(); } });
          item.append(typeControls.action, typeControls.editor);
        }
        if (selectedRow && compactNode && compactDocument && canonicalController.editor && row.origin !== "inherited") {
          const presence = schemaOwnerDocument!.createElement("fieldset"), presenceLegend = schemaOwnerDocument!.createElement("legend"),
            mode = schemaOwnerDocument!.createElement("select"), savePresence = schemaOwnerDocument!.createElement("button"),
            predicateControls = schemaOwnerDocument!.createElement("section"), presenceDraft = canonicalController.presenceDraft?.propertyId === compactNode.id
              ? canonicalController.presenceDraft : undefined;
          presence.className = "compact-canonical-presence"; presence.dataset.compactPropertyId = compactNode.id;
          presenceLegend.textContent = "Conditional presence"; mode.setAttribute("aria-label", `Conditional presence for ${row.canonicalPath}`);
          mode.append(...(["optional", "required", "required-when", "forbidden", "forbidden-when"] as const)
            .map((value) => { const option = schemaOwnerDocument!.createElement("option"); option.textContent = value.replaceAll("-", " "); option.value = value; return option; }));
          mode.value = presenceDraft?.mode ?? compactNode.presence.mode;
          const dispatchPresence = (next:CanonicalSchemaDocument["nodes"][string]["presence"]):void => {
            void canonicalController.dispatchCommand({ kind:"set", baseRevision:presenceDraft?.baseRevision ?? compactDocument.revision,
              propertyId:compactNode.id, patch:{ presence:next } });
          };
          if (typeof (schemaOwnerDocument as Document).getElementById === "function") mountCanonicalPredicateEditor({ host:predicateControls, document:compactDocument,
              ...(compactNode.presence.condition ? { condition:compactNode.presence.condition } : {}),
              label:`Nested conditional presence for ${row.canonicalPath}`, saveLabel:"Save conditional presence", excludePropertyId:compactNode.id,
              onSave:(condition) => { if (mode.value.endsWith("-when")) dispatchPresence({ mode:mode.value as "required-when" | "forbidden-when", condition }); },
              ...(compactNode.presence.condition ? { onClear:() => dispatchPresence({ mode:mode.value.startsWith("forbidden") ? "forbidden" : "required" }) } : {}) });
          predicateControls.hidden = !mode.value.endsWith("-when");
          listenProperty(mode, "change", () => { predicateControls.hidden = !mode.value.endsWith("-when");
            canonicalController.presenceDraft = { propertyId:compactNode.id, baseRevision:presenceDraft?.baseRevision ?? compactDocument.revision, mode:mode.value };
            savePresence.hidden = mode.value.endsWith("-when"); });
          savePresence.type = "button"; savePresence.textContent = "Save presence"; savePresence.hidden = mode.value.endsWith("-when");
          listenProperty(savePresence, "click", () => { if (!mode.value.endsWith("-when")) dispatchPresence({ mode:mode.value as "optional" | "required" | "forbidden" }); });
          presence.append(presenceLegend, mode, savePresence, predicateControls); item.append(presence);

          const lifecycle = schemaOwnerDocument!.createElement("fieldset"), lifecycleLegend = schemaOwnerDocument!.createElement("legend"),
            renameInput = schemaOwnerDocument!.createElement("input"), rename = schemaOwnerDocument!.createElement("button"),
            moveSelect = schemaOwnerDocument!.createElement("select"), move = schemaOwnerDocument!.createElement("button"),
            duplicate = schemaOwnerDocument!.createElement("button"), expectedInput = schemaOwnerDocument!.createElement("input"),
            saveExpected = schemaOwnerDocument!.createElement("button"), reset = schemaOwnerDocument!.createElement("button");
          lifecycleLegend.textContent = "Move and lifecycle"; renameInput.name = "propertyName"; renameInput.value = compactNode.name;
          renameInput.setAttribute("aria-label", `Rename ${row.canonicalPath}`); rename.type = "button"; rename.textContent = "Rename";
          listenProperty(rename, "click", () => { void canonicalController.dispatchCommand({ kind:"rename", baseRevision:compactDocument.revision, propertyId:compactNode.id, name:renameInput.value }); });
          moveSelect.name = "moveParent"; moveSelect.setAttribute("aria-label", `Move ${row.canonicalPath} under`);
          const rootOption = schemaOwnerDocument!.createElement("option"); rootOption.textContent = "Root"; rootOption.value = "";
          moveSelect.append(rootOption, ...Object.values(compactDocument.nodes).filter(({ id, parentId }) => id !== compactNode.id && parentId !== compactNode.id)
            .map((node) => { const option = schemaOwnerDocument!.createElement("option"); option.textContent = node.name; option.value = node.id; return option; })); moveSelect.value = compactNode.parentId ?? "";
          move.type = "button"; move.textContent = "Move"; listenProperty(move, "click", () => { void canonicalController.dispatchCommand({ kind:"move", baseRevision:compactDocument.revision,
            propertyId:compactNode.id, ...(moveSelect.value ? { parentId:moveSelect.value } : {}) }); });
          duplicate.type = "button"; duplicate.textContent = "Duplicate"; listenProperty(duplicate, "click", () => { void canonicalController.dispatchCommand({ kind:"duplicate",
            baseRevision:compactDocument.revision, propertyId:compactNode.id, id:() => ports.createRuleId() }); });
          expectedInput.name = "expectedValue"; expectedInput.setAttribute("aria-label", `Expected value for ${row.canonicalPath}`);
          expectedInput.value = compactNode.expectedValue === undefined ? "" : String(compactNode.expectedValue);
          saveExpected.type = "button"; saveExpected.textContent = "Save contextual contribution"; listenProperty(saveExpected, "click", () => {
            const raw = expectedInput.value.trim(); let expectedValue:unknown = raw;
            if (compactNode.type === "number") expectedValue = Number(raw); else if (compactNode.type === "boolean") expectedValue = raw === "true"; else if (compactNode.type === "null") expectedValue = null;
            void canonicalController.dispatchCommand({ kind:"set", baseRevision:compactDocument.revision, propertyId:compactNode.id, patch:{ expectedValue } }); });
          reset.type = "button"; reset.textContent = "Reset to parents"; reset.hidden = compactDocument.source?.provenance !== "project-composed-effective";
          listenProperty(reset, "click", () => { void canonicalController.dispatchCommand({ kind:"delete", baseRevision:compactDocument.revision, propertyId:compactNode.id }); });
          lifecycle.append(lifecycleLegend, renameInput, rename, moveSelect, move, duplicate, expectedInput, saveExpected, reset); item.append(lifecycle);
        }
        if (schema) {
          const presented = schemaEditorDraft(schema), documentationPath = canonicalDocumentationPath(row.canonicalPath),
            effective = resolveEffectiveSchemaDocumentation(presented, [...library.schemas.filter(({ id }) => id !== presented.id), presented]),
            localDocumentation = presented.documentation?.properties?.[documentationPath], propertyDocumentation = effective.properties[documentationPath],
            parent = presented.parentSchemaId ? library.schemas.find(({ id }) => id === presented.parentSchemaId) : undefined,
            inheritedDocumentation = parent ? resolveEffectiveSchemaDocumentation(parent, library.schemas).properties[documentationPath] : undefined;
          const documentationSummary = schemaOwnerDocument!.createElement("p"); documentationSummary.className = "schema-property-documentation";
          documentationSummary.textContent = propertyDocumentation
            ? `${propertyDocumentation.displayName || row.displayPath} · ${propertyDocumentation.description}${propertyDocumentation.comments ? ` · Comments: ${propertyDocumentation.comments}` : ""}${propertyDocumentation.example ? ` · Example: ${String(propertyDocumentation.example.value)}` : ""}${propertyDocumentation.inherited ? ` · inherited from ${propertyDocumentation.origin.name} revision ${propertyDocumentation.origin.version}` : " · local"}`
            : "No documentation";
          const editDocumentation = schemaOwnerDocument!.createElement("a"); editDocumentation.setAttribute("role", "button"); editDocumentation.tabIndex = 0; editDocumentation.className = "schema-property-documentation-control";
          editDocumentation.textContent = localDocumentation || propertyDocumentation ? "Edit documentation" : "Add documentation";
          editDocumentation.setAttribute("aria-label", `${editDocumentation.textContent} for ${documentationPath}`);
          const editor = schemaOwnerDocument!.createElement("fieldset"); editor.className = "schema-property-documentation-editor"; editor.hidden = true;
          const legend = schemaOwnerDocument!.createElement("legend"); legend.textContent = `Documentation for ${documentationPath}`;
          const field = (labelText:string, control:HTMLInputElement | HTMLTextAreaElement) => { const label = schemaOwnerDocument!.createElement("label"); label.htmlFor = control.id; label.textContent = labelText; return label; };
          const suffix = row.displayPath.replace(/[^a-z0-9]+/gi, "-"), displayName = schemaOwnerDocument!.createElement("input"), description = schemaOwnerDocument!.createElement("textarea"), comments = schemaOwnerDocument!.createElement("textarea");
          displayName.id = `schema-documentation-name-${suffix}`; displayName.value = localDocumentation?.displayName ?? propertyDocumentation?.displayName ?? "";
          description.id = `schema-documentation-description-${suffix}`; description.value = localDocumentation?.description ?? propertyDocumentation?.description ?? "";
          comments.id = `schema-documentation-comments-${suffix}`; comments.name = "comments"; comments.value = localDocumentation?.comments ?? propertyDocumentation?.comments ?? "";
          const exampleGroup = schemaOwnerDocument!.createElement("fieldset"), exampleLegend = schemaOwnerDocument!.createElement("legend"); exampleGroup.className = "schema-property-example-editor"; exampleLegend.textContent = "Example value"; exampleGroup.append(exampleLegend);
          const exampleName = `schema-documentation-example-${suffix}`, allowedExamples = schemaPropertyExampleChoices(presented, row.canonicalPath, [...library.schemas.filter(({ id }) => id !== presented.id), presented]),
            exampleType = schemaPropertyExampleInputType(presented, row.canonicalPath, localDocumentation?.example?.value ?? propertyDocumentation?.example?.value ?? allowedExamples[0], [...library.schemas.filter(({ id }) => id !== presented.id), presented]);
          let exampleDraft:SchemaPropertyExample | undefined = structuredClone(localDocumentation?.example ?? propertyDocumentation?.example), customInitialized = exampleDraft?.selectionMethod === "custom";
          const assistance = schemaOwnerDocument!.createElement("output"); assistance.className = "schema-property-example-assistance";
          const noLabel = schemaOwnerDocument!.createElement("label"), noExample = schemaOwnerDocument!.createElement("input"); noExample.type = "radio"; noExample.name = exampleName; noExample.checked = !exampleDraft; noLabel.append(noExample, " No example value");
          noExample.addEventListener("change", () => { if (noExample.checked) { exampleDraft = undefined; assistance.textContent = ""; } }); exampleGroup.append(noLabel);
          for (const allowed of allowedExamples) { const label = schemaOwnerDocument!.createElement("label"), radio = schemaOwnerDocument!.createElement("input"); radio.type = "radio"; radio.name = exampleName; radio.value = String(allowed); radio.dataset.exampleSelectionMethod = "allowed value"; radio.checked = exampleDraft?.selectionMethod === "allowed value" && Object.is(exampleDraft.value, allowed);
            radio.addEventListener("change", () => { if (radio.checked) { exampleDraft = { value:structuredClone(allowed), selectionMethod:"allowed value" }; assistance.textContent = ""; } }); label.append(radio, ` ${String(allowed)}`); exampleGroup.append(label); }
          const customLabel = schemaOwnerDocument!.createElement("label"), custom = schemaOwnerDocument!.createElement("input"), customInput = schemaOwnerDocument!.createElement("input"); custom.type = "radio"; custom.name = exampleName; custom.dataset.exampleSelectionMethod = "custom"; custom.checked = exampleDraft?.selectionMethod === "custom"; customLabel.append(custom, " Custom value");
          customInput.dataset.schemaPropertyExampleInput = documentationPath; customInput.type = exampleType === "number" ? "number" : "text"; customInput.value = exampleDraft?.selectionMethod === "custom" ? String(exampleDraft.value) : exampleType === "null" ? "null" : ""; customInput.hidden = !custom.checked; customInput.readOnly = exampleType === "null";
          const refreshExample = () => { const parsed = exampleValueFromInput(customInput.value, exampleType); if (!parsed) { exampleDraft = undefined; assistance.textContent = `Enter a valid ${exampleType} example value`; return; } exampleDraft = parsed; assistance.textContent = schemaPropertyExampleConflicts(parsed, allowedExamples) ? "Example value does not satisfy the effective Allowed values rule" : ""; };
          custom.addEventListener("change", () => { if (!custom.checked) return; customInput.hidden = false; if (!customInitialized) { customInitialized = true; if (exampleType === "boolean" && !customInput.value) customInput.value = "false"; if (exampleType === "null") customInput.value = "null"; } refreshExample(); customInput.focus(); }); customInput.addEventListener("input", refreshExample);
          exampleGroup.append(customLabel, customInput, assistance); if (custom.checked) refreshExample();
          const save = schemaOwnerDocument!.createElement("input"), remove = schemaOwnerDocument!.createElement("input"); save.type = remove.type = "button"; save.value = "Save documentation"; remove.value = inheritedDocumentation ? "Restore inherited documentation" : "Remove documentation"; remove.hidden = !localDocumentation;
          save.addEventListener("click", () => { if (custom.checked && !exampleDraft) { refreshExample(); customInput.focus(); return; }
            const entry:SchemaPropertyDocumentation = { displayName:displayName.value, description:description.value, ...(comments.value.trim() ? { comments:comments.value.trim() } : {}), ...(exampleDraft ? { example:structuredClone(exampleDraft) } : {}) };
            const currentLocalDocumentation=schemaEditorDraft(active()).documentation?.properties?.[documentationPath];
            if ((currentLocalDocumentation??localDocumentation) && !entry.displayName.trim() && !entry.description.trim() && !entry.comments && !entry.example) {
              requestSchemaDocumentationRemoval(documentationPath, save); return;
            }
            if(canonicalController.editor&&compactNode&&compactDocument){const example=entry.example
              ?{method:entry.example.selectionMethod==="allowed value"?"allowed-value" as const:"custom" as const,value:structuredClone(entry.example.value)}
              :{method:"blank" as const};void canonicalController.dispatchCommand({kind:"set",baseRevision:compactDocument.revision,propertyId:compactNode.id,
                patch:{documentation:{displayText:entry.displayName,description:entry.description,comments:entry.comments??"",example}}});return;}
            const documentation = setPropertyDocumentation(schemaEditorDraft(active()).documentation ?? {}, documentationPath, entry);
            const schemaId = active().id; replaceActive(updateSchemaWorkingDraft(active(), { documentation }, `Document property ${documentationPath}`));
            queueSchemaLibraryPersistence(schemaId); renderSchemas(); schemaEditor?.setAttribute("aria-busy", String(Boolean(ports.settleCanonical))); });
          remove.addEventListener("click", () => requestSchemaDocumentationRemoval(documentationPath, remove));
          editDocumentation.addEventListener("click", () => { editor.hidden = false; editDocumentation.setAttribute("aria-expanded", "true"); displayName.focus(); });
          editDocumentation.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); editDocumentation.click(); } });
          editor.append(legend, field("Display name", displayName), displayName, field("Description", description), description, field("Comments", comments), comments, exampleGroup, save, remove);
          const section = schemaOwnerDocument!.createElement("section"); section.className = "schema-property-documentation-section"; section.setAttribute("aria-label", `Documentation for ${documentationPath}`); section.append(documentationSummary, editDocumentation, editor); item.append(section);
        }
        const propertyAction = (label:string, run:(button:HTMLButtonElement) => void, ariaLabel = `${label} ${row.canonicalPath}`) => { const button = schemaOwnerDocument!.createElement("button");
          button.type = "button"; button.textContent = label; button.setAttribute("aria-label", ariaLabel);
          if (label === "Add rule") button.className = "schema-property-add-rule";
          listenProperty(button, "click", () => run(button)); item.append(button); };
        {
          propertyAction("View", () => { propertyController.selectedPath = row.canonicalPath.slice(1).replaceAll("/", "."); });
          const containerAction = editable ? manualPropertyContainerAction(editable.document, row.canonicalPath) : undefined;
          propertyAction(containerAction?.label ?? "Add child", (button) => openContextualManualPropertyForm(
            containerAction?.parentPath ?? row.canonicalPath, button), `${containerAction?.label ?? "Add child"} on ${row.canonicalPath}`);
          propertyAction("Add rule", (button) => openSchemaPropertyRulePicker(row.displayPath, button), `Add rule for ${row.displayPath}`);
          if (row.schema.type === "array") propertyAction("Add specific index rule", (button) => openSpecificIndexDialog(row.canonicalPath, button));
          propertyAction("Edit canonical rules", (button) => { openCompactCanonicalRuleEditor(row.displayPath, button); },
            `Edit canonical rules for ${row.displayPath}`);
          propertyAction("Copy to another schema", (button) => openSchemaPropertyCopyReview(row.canonicalPath, button), `Copy ${row.canonicalPath} to another schema`);
          if (row.origin === "inherited") propertyAction("Exclude inherited property", () => {
          const current = active(), draft = schemaEditorDraft(current);
          replaceActive(updateSchemaWorkingDraft(current, { inheritedRuleOverrides:{ ...(draft.inheritedRuleOverrides ?? {}), [row.canonicalPath]:"disabled" } },
            `Exclude inherited property ${row.canonicalPath}`));
          persistSchemaLibrary(); renderSchemas();
          if (schemaPropertyRemovalFeedback) schemaPropertyRemovalFeedback.textContent = `Excluded inherited property ${row.canonicalPath} locally; the parent schema is unchanged.`;
          }, `Exclude inherited property ${row.canonicalPath}`);
          else propertyAction("Remove property", (button) => requestSchemaPropertyRemoval(row.canonicalPath, button), `Remove property ${row.canonicalPath}`);
          propertyAction("Remove documentation", (button) => requestSchemaDocumentationRemoval(row.canonicalPath, button));
          propertyAction(propertyController.expandedRulePaths.has(row.canonicalPath) ? "Hide rules" : "Show rules", () => {
            if (propertyController.expandedRulePaths.has(row.canonicalPath)) propertyController.expandedRulePaths.delete(row.canonicalPath);
            else propertyController.expandedRulePaths.add(row.canonicalPath); renderSchemaPropertyView();
          });
        }
        const attachedRules = (schema?.workingDraft?.attachedRules ?? schema?.attachedRules ?? [])
          .filter(({ propertyPath }) => normalizedRulePickerPath(propertyPath ?? "") === row.canonicalPath);
        const disclosure = schemaOwnerDocument!.createElement("details"), disclosureSummary = schemaOwnerDocument!.createElement("summary");
        disclosure.dataset.attachedRules = "true"; disclosure.open = propertyController.expandedRulePaths.has(row.canonicalPath);
        disclosureSummary.textContent = `View attached rules (${attachedRules.length})`;
        const activeRuleCount = schemaOwnerDocument!.createElement("span"); activeRuleCount.className = "schema-property-active-rule-count"; activeRuleCount.textContent = ` (${attachedRules.filter(({ enabled }) => enabled !== false).length} active rules)`;
        listenProperty(disclosure, "toggle", () => { if (disclosure.open) propertyController.expandedRulePaths.add(row.canonicalPath);
          else propertyController.expandedRulePaths.delete(row.canonicalPath); }); disclosure.append(disclosureSummary, activeRuleCount);
        if (!attachedRules.length) disclosure.append("No rules attached to this property.");
        for (const attached of attachedRules) {
          const attachedRow = schemaOwnerDocument!.createElement("div"); attachedRow.className = "schema-attached-rule"; attachedRow.dataset.ruleId = attached.id;
          attachedRow.dataset.propertyPath = row.canonicalPath; attachedRow.tabIndex = -1;
          attachedRow.textContent = `${attached.id} v${attached.version} · ${attached.operator ?? "rule"} · ${attached.enabled === false ? "disabled" : "active"} `;
          const attachedAction = (label:string, run:(button:HTMLButtonElement) => void):void => { const button = schemaOwnerDocument!.createElement("button");
            button.type = "button"; button.textContent = label; button.dataset.ruleId = attached.id;
            button.dataset.propertyPath = row.canonicalPath; button.dataset.schemaRuleAction = label;
            listenProperty(button, "click", () => run(button)); attachedRow.append(button); };
          attachedAction("Edit", (button) => { openAttachedSchemaRuleEditor(schema!.id, attached.id, row.displayPath, button); });
          attachedRow.lastElementChild?.classList.add("schema-attached-rule-edit");
          attachedAction(attached.enabled === false ? "Re-enable" : "Disable", () => {
            if (schema) updateAttachedRule(schema.id, attached.id, attached.enabled === false);
          });
          attachedAction("Remove", () => { if (!schema) return; library.schemas = library.schemas.map((candidate) => candidate.id !== schema.id ? candidate : {
            ...candidate, attachedRules:(candidate.attachedRules ?? []).filter((rule) => rule.id !== attached.id),
            ...(candidate.workingDraft ? { workingDraft:{ ...candidate.workingDraft,
              attachedRules:(candidate.workingDraft.attachedRules ?? []).filter((rule) => rule.id !== attached.id) } } : {}),
          }); persistSchemaAndRuleLibraries(); renderSchemas(); });
          if (!ruleController.rules.some(({ id }) => id === attached.id)) { attachedAction("Promote to reusable rule", () => { openLocalRulePromotionReview(row.canonicalPath, attached.id); });
            const promotionAction = attachedRow.lastElementChild as HTMLButtonElement | null;
            promotionAction?.classList.add("local-rule-promotion-action");
            if (promotionAction) listenProperty(promotionAction, "focus", () => { ruleController.promotionFocusedPosition = {
              propertyPath:row.canonicalPath, ruleId:attached.id, detailScroll:schemaDetail?.scrollTop ?? 0 }; }); }
          const canonicalRule = compactNode?.rules.find(({ id }) => id === attached.id);
          if (canonicalController.editor && compactDocument && compactNode && canonicalRule && typeof (schemaOwnerDocument as Document).getElementById === "function") {
            const predicateEditor = schemaOwnerDocument!.createElement("section");
            mountCanonicalPredicateEditor({ host:predicateEditor, document:compactDocument,
              ...(canonicalRule.condition ? { condition:canonicalRule.condition } : {}), label:`Nested rule predicate for ${attached.id}`,
              saveLabel:"Save nested rule predicate", onSave:(condition) => { const latest = canonicalController.editor?.load(), latestNode = latest?.nodes[compactNode.id];
                if (!latest || !latestNode) return; void canonicalController.dispatchCommand({ kind:"set", baseRevision:latest.revision, propertyId:latestNode.id,
                  patch:{ rules:latestNode.rules.map((candidate) => candidate.id === canonicalRule.id ? { ...candidate, condition } : candidate) } }); },
              ...(canonicalRule.condition ? { onClear:() => { const latest = canonicalController.editor?.load(), latestNode = latest?.nodes[compactNode.id];
                if (!latest || !latestNode) return; void canonicalController.dispatchCommand({ kind:"set", baseRevision:latest.revision, propertyId:latestNode.id,
                  patch:{ rules:latestNode.rules.map((candidate) => { if (candidate.id !== canonicalRule.id) return candidate;
                    const { condition:_condition, ...withoutCondition } = candidate; return withoutCondition; }) } }); } } : {}) });
            attachedRow.append(predicateEditor);
          }
          disclosure.append(attachedRow);
        }
        item.append(disclosure);
        return [item]; });
      const itemByPath = new Map(propertyView.rows.map((row, index) => [row.displayPath, items[index]!])), roots:HTMLElement[] = [];
      propertyView.rows.forEach((row) => { const item = itemByPath.get(row.displayPath)!;
        item.setAttribute("role", "treeitem"); item.setAttribute("aria-level", String(Math.max(1, row.displayPath.split(".").length)));
        const parentPath = propertyView.rows.map(({ displayPath }) => displayPath).filter((candidate) => candidate !== row.displayPath && row.displayPath.startsWith(`${candidate}.`))
          .sort((left, right) => right.length - left.length)[0], parent = parentPath ? itemByPath.get(parentPath) : undefined;
        if (!parent) { roots.push(item); return; }
        let children = Array.from(parent.children).find((child):child is HTMLUListElement => child.tagName === "UL" && child.classList.contains("schema-property-children"));
        if (!children) { children = schemaOwnerDocument!.createElement("ul"); children.className = "schema-property-children"; parent.append(children); } children.append(item);
      });
      schemaPropertyTree.replaceChildren(...roots);
      schemaPropertyTree.scrollTop = previousTreeScroll;
      if (previousFocusLabel) Array.from(schemaPropertyTree.querySelectorAll<HTMLElement>("[aria-label]"))
        .find((control) => control.getAttribute("aria-label") === previousFocusLabel)?.focus({ preventScroll:true });
      else if (previousRuleFocus) Array.from(schemaPropertyTree.querySelectorAll<HTMLElement>("button[data-rule-id]"))
        .find(({ dataset }) => dataset.ruleId === previousRuleFocus.ruleId && dataset.propertyPath === previousRuleFocus.propertyPath
          && dataset.schemaRuleAction === previousRuleFocus.action)?.focus({ preventScroll:true });
      else if (promotionFocusReturn && !schemaOwnerDocument?.querySelector<HTMLDialogElement>("#local-rule-promotion-review")?.open) Array.from(schemaPropertyTree.querySelectorAll<HTMLElement>("button[data-rule-id]"))
        .find(({ dataset }) => dataset.ruleId === promotionFocusReturn.ruleId
          && dataset.propertyPath === promotionFocusReturn.propertyPath)?.focus({ preventScroll:true });
      const copyPosition = propertyController.pendingCopyPosition;
      if (copyPosition && copyPosition.schemaId === library.activeSchemaId) {
        schemaPropertyTree.querySelector<HTMLElement>(`button[aria-label="Copy ${copyPosition.path} to another schema"]`)?.focus({ preventScroll:true });
        schemaEditor && (schemaEditor.scrollTop = copyPosition.editorScroll); schemaPropertyTree.scrollTop = copyPosition.treeScroll;
      }
    }
    if (addSchemaPropertyButton) addSchemaPropertyButton.disabled = !schema;
  };
  function renderSchemaDraft(): void {
    const schema = library.activeSchemaId ? active() : library.draft;
    const draft = schema?.workingDraft;
    const presented = schema ? schemaEditorDraft(schema) : undefined;
    if (schemaEditor) schemaEditor.hidden = !schema;
    if (schemaDetail) schemaDetail.hidden = false;
    if (schemaDetailEmpty) schemaDetailEmpty.hidden = Boolean(schema);
    if (schemaEditorName) schemaEditorName.value = draft?.name ?? schema?.name ?? "";
    if (schemaEditorStatus) {
      const pendingCount = schema?.workingDraft?.pendingChanges.length ?? 0;
      const lifecycleStatus = schema?.published === false
        ? `Unpublished new schema draft · ${pendingCount} pending changes`
        : schema?.workingDraft ? `Working draft based on revision ${schema.version} · ${pendingCount} pending changes`
          : schema ? `Current revision ${schema.version} · no working draft` : "Unsaved new schema";
      const compactCanonicalRevision=canonicalController.editor?.load().revision;
      schemaEditorStatus.textContent = canonicalController.editor && compactCanonicalRevision!==undefined
        ? `${lifecycleStatus} · ${canonicalController.editor.label} · Schema revision ${compactCanonicalRevision}`
        : lifecycleStatus;
    }
    if (schemaEditorDescription) schemaEditorDescription.value = draft?.documentation?.description
      ?? schema?.documentation?.description ?? "";
    if (schemaDescriptionOrigin) schemaDescriptionOrigin.textContent = draft?.documentation?.description
      ? "Working draft" : schema?.documentation?.description ? `Revision ${schema.version}` : "No description";
    if (schemaEditorTarget) schemaEditorTarget.value = draft?.assignments[0]?.target ?? schema?.assignments[0]?.target ?? "payload";
    if (schemaOnlyDeclaredProperties && presented) schemaOnlyDeclaredProperties.checked = presented.document.additionalProperties === false;
    if (schemaEditorParent && presented && schemaOwnerDocument) {
      const parents = library.schemas.filter(({ id }) => id !== presented.id);
      const empty = schemaOwnerDocument.createElement("option"); empty.value = ""; empty.textContent = "No parent";
      schemaEditorParent.replaceChildren(empty, ...parents.map((candidate) => { const option = schemaOwnerDocument.createElement("option");
        option.value = candidate.id; option.textContent = `${candidate.name} v${candidate.version}`; return option; }));
      schemaEditorParent.value = presented.parentSchemaId ?? "";
    }
    const parent = presented?.parentSchemaId ? library.schemas.find(({ id }) => id === presented.parentSchemaId) : undefined;
    if (schemaInheritanceProvenance) schemaInheritanceProvenance.textContent = parent
      ? `Inherited rules originate in ${parent.name} v${parent.version}. Local rules override only after conflicts are resolved.` : "Local schema only";
    if (schemaRuleOverrides) schemaRuleOverrides.hidden = !parent;
    if (schemaRuleOverrideList && schemaOwnerDocument) schemaRuleOverrideList.replaceChildren(...Object.keys(parent?.document.properties ?? {}).map((property) => {
      const label = schemaOwnerDocument.createElement("label"), select = schemaOwnerDocument.createElement("select");
      select.setAttribute("aria-label", `${property} inherited rule override`);
      select.replaceChildren(...(["inherit", "enabled", "disabled"] as const).map((state) => { const option = schemaOwnerDocument.createElement("option");
        option.value = state; option.textContent = state === "inherit" ? "Inherit" : state === "enabled" ? "Enabled in this schema" : "Disabled in this schema"; return option; }));
      select.value = presented?.inheritedRuleOverrides?.[property] ?? "inherit";
      listen(select, "change", () => { if (!library.activeSchemaId) return; const current = active(), currentDraft = schemaEditorDraft(current);
        replaceActive(updateSchemaWorkingDraft(current, { inheritedRuleOverrides:{ ...(currentDraft.inheritedRuleOverrides ?? {}),
          [property]:select.value as "inherit" | "enabled" | "disabled" } }, `Change inherited rule override ${property}`));
        persistSchemaLibrary(); renderSchemas(); });
      label.append(`${property}: `, select); return label;
    }));
    if (presented) renderSchemaInheritancePresentation(presented);
    if (schema && presented) {
      const candidates = [...library.schemas.filter(({ id }) => id !== schema.id), presented];
      const inheritanceError = schemaInheritanceError(presented, candidates) ?? schemaInheritanceConflict(presented, candidates);
      const rename = inspectSchemaRename(schema, library.schemas, schemaEditorName?.value ?? presented.name);
      const hasProperties = Object.keys(presented.document.properties ?? {}).length > 0;
      const ready = rename.ready && hasProperties && !inheritanceError;
      if (saveSchemaButton) { saveSchemaButton.disabled = !ready;
        saveSchemaButton.textContent = schema.published === false ? "Publish schema" : "Publish revision"; }
      if (saveSchemaReason) saveSchemaReason.textContent = !rename.ready ? rename.assistance
        : !hasProperties ? "Add at least one property" : inheritanceError ?? "Ready to save";
    } else if (saveSchemaButton) saveSchemaButton.disabled = true;
    const pendingChanges = draft?.pendingChanges ?? [];
    if (buildSpecificationButton) { buildSpecificationButton.hidden = !draft;
      buildSpecificationButton.onclick = schema && draft ? () => openSchemaSpecification(schema, "working-draft", buildSpecificationButton) : null; }
    const historyVersions = schema ? schemaRevisionChoices(schema) : [];
    if (schemaRevisionSelector && schemaOwnerDocument) {
      const selectedRevision = Number(schemaRevisionSelector.value);
      schemaRevisionSelector.replaceChildren(...historyVersions.map((version) => {
        const option = schemaOwnerDocument.createElement("option"); option.value = String(version); option.textContent = `Revision ${version}`; return option;
      }));
      schemaRevisionSelector.value = String(historyVersions.includes(selectedRevision) ? selectedRevision : historyVersions[0] ?? "");
    }
    if (duplicateSchemaRevisionButton) duplicateSchemaRevisionButton.disabled = historyVersions.length === 0;
    if (restoreSchemaRevisionButton) restoreSchemaRevisionButton.disabled = historyVersions.length === 0;
    if (buildHistoricalSpecificationButton) { buildHistoricalSpecificationButton.disabled = historyVersions.length === 0;
      buildHistoricalSpecificationButton.onclick = schema && historyVersions.length
        ? () => openSchemaSpecification(schema, `historical:${revisionVersion()}`, buildHistoricalSpecificationButton) : null; }
    if (schemaCloseReviewSummary) schemaCloseReviewSummary.textContent = draft
      ? `${pendingChanges.length} pending change${pendingChanges.length === 1 ? "" : "s"}` : "No pending changes";
    if (confirmSchemaRevisionButton && schema) confirmSchemaRevisionButton.textContent = schema.published === false
      ? "Publish revision 1" : `Publish revision ${schema.version + 1}`;
    if (schemaRevisionComparison && schema) {
      const version = revisionVersion(), historical = schemaRevision(schema, version);
      const historicalProperties = Object.keys(historical?.document.properties ?? {}).length;
      const currentProperties = Object.keys(schema.document.properties ?? {}).length;
      schemaRevisionComparison.textContent = `Revision ${version} compared with current revision ${schema.version}. ${historicalProperties} historical properties; ${currentProperties} current properties.`;
    }
    if (schemaEditorNameAssistance && schema) schemaEditorNameAssistance.textContent = inspectSchemaRename(
      schema, library.schemas, schemaEditorName?.value ?? draft?.name ?? schema.name).assistance;
    renderSchemaPropertyView();
  }
  function hydrateProjectForSchemas(activeProjectId:string): Promise<void> {
    const operation = lifecycle.generation();
    if (schemaResult) schemaResult.textContent = "Loading active project schema contributors from durable storage…";
    return activeSchemaProjectHydration.run(activeProjectId, () => ports.ensureProjectSchemaContributors(activeProjectId, schemaContributorRoute)
      .then(({ name }) => { if (!lifecycle.isMounted() || operation !== lifecycle.generation() || ports.activeProjectId() !== activeProjectId) return; hydratedSchemaProjectId=activeProjectId;relationshipTreeController.invalidateProject();renderSchemas();
        if (schemaResult) schemaResult.textContent = `Loaded schema contributors for ${name}.`; })
      .catch((error: unknown) => { if (lifecycle.isMounted() && operation === lifecycle.generation() && ports.activeProjectId() === activeProjectId && schemaResult) {
        schemaResult.textContent = `Schema contributors are unavailable. ${error instanceof Error ? error.message : String(error)}`;
      } }));
  }
  function hydrateActiveProjectForSchemas(): Promise<void> | undefined {
    const activeProjectId = ports.activeProjectId();
    return activeProjectId ? hydrateProjectForSchemas(activeProjectId) : undefined;
  }
  const renderSchemas = (): void => {
    if (!lifecycle.isMounted()) return;
    const relationship = ports.relationshipTree(library.schemas), invokingReference = editorRoute.invokingReference();
    relationshipTreeController.render({
      projectId:relationship.projectId, nodes:relationship.nodes, schemas:library.schemas,
      ...(library.activeSchemaId ? { activeSchemaId:library.activeSchemaId } : {}),
      ...(invokingReference ? { invokingReference } : {}),
      historyCount:(schema) => schemaRevisionChoices(schema).length,
      editSaved:(schema, trigger, referenceKey) => { editorRoute.open(trigger, referenceKey); library.activeSchemaId = schema.id;
        library.draft = structuredClone(schema); renderSchemas(); openSavedSchemaInUnifiedEditor(schema); },
      duplicateSaved:(schema) => { library.schemas = [...library.schemas, duplicateSchemaRevision(schema, schema.version, library.schemas)]; persistSchemaLibrary(); renderSchemas(); },
      adoptSaved:requestSavedSchemaAdoption,
      buildSpecification:(schema, trigger) => openSchemaSpecification(schema, `published:${schema.version}`, trigger),
      exportSaved:(schema, trigger) => library.openExportChoices(trigger, schema),
      reportMissing:(schema) => ports.reportMissingSchemaEvent(schema.id),
      deleteSaved:(schema) => { library.requestDeletion(schema.id); },
      openContributor:(key, trigger, referenceKey) => { editorRoute.open(trigger, referenceKey); const retainedScroll = canonicalController.editor?.key === key ? schemaDetail?.scrollTop : undefined;
        openContributorInUnifiedEditor(key); if (schemaDetail && retainedScroll !== undefined) schemaDetail.scrollTop = retainedScroll; renderSchemas(); },
      openContributorInStudio:ports.openContributorInStudio, openProject:ports.openProjectLibrary, rerender:renderSchemas,
    });
    renderSchemaDraft(); assignmentController.render();
  };
  const updateSchemaTreeView = (): void => { relationshipTreeController.update(); renderSchemas(); };
  const persistSchemaTreeScroll = (): void => relationshipTreeController.persistScroll();
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
    if (!library.draft && !library.activeSchemaId) return;
    const schema = active();
    replaceActive(proposeInstalledSchemaWorkingDraftName(schema, schemaEditorName?.value ?? schema.name));
    persistEditedSchemaIfStored();
    const presented = schemaEditorDraft(active()), candidate = library.schemas.find(({ id }) => id === presented.id) ?? presented,
      rename = inspectSchemaRename(candidate, library.schemas, presented.name), hasProperties = Object.keys(presented.document.properties ?? {}).length > 0,
      inheritanceError = schemaInheritanceError(presented, library.schemas) ?? schemaInheritanceConflict(presented, library.schemas);
    if (schemaEditorNameAssistance) schemaEditorNameAssistance.textContent = rename.assistance;
    if (saveSchemaButton) saveSchemaButton.disabled = !rename.ready || !hasProperties || Boolean(inheritanceError);
    if (saveSchemaReason) saveSchemaReason.textContent = !rename.ready ? rename.assistance : !hasProperties ? "Add at least one property" : inheritanceError ?? "Ready to save";
  };
  const updateSchemaEditorName = (): void => {
    if (!library.draft && !library.activeSchemaId) return;
    const schema = active(), name = schemaEditorName?.value ?? schema.name;
    if (canonicalController.editor) {
      const projection = { ...schemaEditorDraft(schema), name };
      library.draft = structuredClone(projection);
      const rename = inspectSchemaRename(schema, library.schemas, name), hasProperties = Object.keys(projection.document.properties ?? {}).length > 0,
        inheritanceError = schemaInheritanceError(projection, library.schemas) ?? schemaInheritanceConflict(projection, library.schemas);
      if (schemaEditorNameAssistance) schemaEditorNameAssistance.textContent = rename.assistance;
      if (saveSchemaButton) saveSchemaButton.disabled = !rename.ready || !hasProperties || Boolean(inheritanceError);
      if (saveSchemaReason) saveSchemaReason.textContent = !rename.ready ? rename.assistance : !hasProperties
        ? "Add at least one property" : inheritanceError ?? "Ready to save";
      void canonicalController.beginProjectionPersistence(canonicalController.editor, projection, "schema name");
      return;
    }
    persistSchemaEditorDraft();
  };
  const saveSchemaDescription = (): void => { if (!library.draft && !library.activeSchemaId) return;
    const schema = active();
    const documentation = updateSchemaDescription(schema.workingDraft?.documentation ?? schema.documentation ?? {},
      schemaEditorDescription?.value ?? "");
    replaceActive(updateSchemaWorkingDraft(schema, { documentation }, "Update schema description"));
    const tracksCanonicalSettlement = Boolean(canonicalController.editor && ports.settleCanonical);
    const settlement = tracksCanonicalSettlement ? beginCompactCanonicalSettlement(schema.id) : undefined;
    if (tracksCanonicalSettlement) { canonicalController.settlementPending = true; canonicalController.settlementSchemaId = schema.id; }
    persistEditedSchemaIfStored(); renderSchemas();
    if (tracksCanonicalSettlement) void ports.settleCanonical!(schema.id).then(() => {
      if (!lifecycle.isMounted()) return; clearCompactCanonicalSettlement(schema.id, settlement); if (canonicalController.editor) renderCompactCanonicalEditor();
    }, () => {}); };
  const updateSchemaTarget = (): void => { if (!library.draft && !library.activeSchemaId) return;
    const schema = active(); const assignments = (schema.workingDraft?.assignments ?? schema.assignments)
      .map((assignment) => ({ ...assignment, target:(schemaEditorTarget?.value === "raw input" ? "raw input" : "payload") as "raw input" | "payload" }));
    replaceActive(updateSchemaWorkingDraft(schema, { assignments }, "Update validation target")); persistEditedSchemaIfStored(); renderSchemas(); };
  const changeSchemaParent = (): void => { if (!library.draft && !library.activeSchemaId) return; const schema = active(), draft = schemaEditorDraft(schema);
    const changed = withSchemaParent(draft, schemaEditorParent?.value || undefined);
    replaceActive(updateSchemaWorkingDraft(schema, { parentSchemaId:changed.parentSchemaId }, "Change parent schema"));
    persistEditedSchemaIfStored(); renderSchemas(); };
  const changeOnlyDeclaredProperties = (): void => { if (!library.draft && !library.activeSchemaId) return; const schema = active(), draft = schemaEditorDraft(schema);
    const { additionalProperties:_previous, ...document } = draft.document;
    replaceActive(updateSchemaWorkingDraft(schema, { document:schemaOnlyDeclaredProperties?.checked
      ? { ...document, additionalProperties:false } : document }, "Change additional-property policy"));
    const tracksCanonicalSettlement = Boolean(canonicalController.editor && ports.settleCanonical);
    const settlement = tracksCanonicalSettlement ? beginCompactCanonicalSettlement(schema.id) : undefined;
    if (tracksCanonicalSettlement) { canonicalController.settlementPending = true; canonicalController.settlementSchemaId = schema.id; }
    persistEditedSchemaIfStored(); renderSchemas();
    if (tracksCanonicalSettlement) { if (saveSchemaButton) saveSchemaButton.disabled = true; void ports.settleCanonical!(schema.id).then(() => {
      if (!lifecycle.isMounted()) return; clearCompactCanonicalSettlement(schema.id, settlement); renderSchemas();
    }, () => {}); } };
  const openSchemaRevisionReview = (): void => {
    renderSchemaDraft(); const draft = library.draft ?? (library.activeSchemaId ? active() : undefined); if (!draft) return;
    const existing = library.schemas.find(({ id }) => id === draft.id), persisted = existing ? schemaEditorDraft(existing) : draft;
    const pending = persisted.workingDraft?.pendingChanges.filter((change) => !change.startsWith("Rename schema from ")).join("; ") ?? "";
    const proposedName = persisted.workingDraft?.name ?? persisted.name;
    const rename = existing && proposedName !== existing.name ? ` Rename schema from ${existing.name} to ${proposedName}.` : "";
    if (schemaRevisionReviewSummary) schemaRevisionReviewSummary.textContent = existing?.published === false
      ? `${draft.name} draft will be published as current revision 1.`
      : existing
        ? `${existing.name} working draft will be compared with current revision ${existing.version}; confirmation publishes revision ${existing.version + 1}.${rename}${pending ? ` Pending changes: ${pending}.` : ""}`
        : `${draft.name} will be published as current revision 1.`;
    if (schemaRevisionReview) schemaRevisionReview.hidden = false; schemaRevisionReview?.showModal();
  };
  function refreshCurrentLiveAfterSchemaPublication():number {
    return ports.revalidateCurrentLive?.(structuredClone(library.schemas), structuredClone(validationController.manualOverrides)) ?? 0;
  }
  const publishActiveSchema = (closeEditor = false): SchemaDefinition => {
    const transient = activeIndex() < 0, current = active(), presented = schemaEditorDraft(current);
    const publishable = transient ? { ...current, id:createSchema(presented.name.trim(), 1, presented.document).id, published:false } : current;
    const published = publishSchemaWorkingDraft(publishable);
    if (transient) { library.schemas = [...library.schemas, published]; library.activeSchemaId = published.id; library.draft = structuredClone(published); }
    else replaceActive(published);
    let ruleLibraryChanged = false;
    for (const rule of published.attachedRules ?? []) {
      if (!rule.id.startsWith("rule:") || ruleController.rules.some(({ id }) => id === rule.id)) continue;
      ruleController.rules = [...ruleController.rules, {
        id:rule.id, name:rule.name ?? rule.id, kind:rule.operator ?? "required", version:rule.version,
        enabled:rule.enabled !== false, ...(rule.operator ? { operator:rule.operator } : {}),
        ...(rule.parameters ? { parameters:rule.parameters } : {}), ...(rule.severity ? { severity:rule.severity } : {}),
        ...(rule.message ? { message:rule.message } : {}), attachments:[published.id],
      }];
      ruleLibraryChanged = true;
    }
    if (ruleLibraryChanged) persistSchemaAndRuleLibraries(); else persistSchemaLibrary();
    schemaRevisionReview?.close(); if (schemaRevisionReview) schemaRevisionReview.hidden = true;
    if (closeEditor) { closeCompactCanonicalEditor(); library.activeSchemaId = undefined; library.draft = undefined; }
    renderSchemas(); const revalidated = refreshCurrentLiveAfterSchemaPublication();
    if (schemaResult) schemaResult.textContent = `Published ${published.name} revision ${published.version}. Revalidated ${revalidated} current Live events.`;
    return published;
  };
  const confirmSchemaRevision = (): void => {
    if (pendingSchemaRestoration) {
      const pending = pendingSchemaRestoration; pendingSchemaRestoration = undefined;
      if (active().id !== pending.schemaId) throw new Error("The schema selected for restoration is no longer active.");
      replaceActive(restoreSchemaRevisionDraft(active(), pending.version)); persistSchemaLibrary();
      schemaRevisionReview?.close(); if (schemaRevisionReview) schemaRevisionReview.hidden = true; renderSchemas(); return;
    }
    publishActiveSchema(true);
  };
  const cancelSchemaRevision = (): void => { pendingSchemaRestoration = undefined;
    schemaRevisionReview?.close(); if (schemaRevisionReview) schemaRevisionReview.hidden = true; };
  const discardSchemaDraft = (): void => {
    library.draft = undefined; library.activeSchemaId = undefined; schemaCloseReview?.close(); if (schemaCloseReview) schemaCloseReview.hidden = true; renderSchemas();
  };
  const keepEditingSchema = (): void => { schemaCloseReview?.close(); schemaEditorName?.focus(); };
  const closeSchemaEditor = (): void => { if (!library.draft && !library.activeSchemaId) return; library.activeSchemaId = undefined; library.draft = undefined;
    closeCompactCanonicalEditor(); renderSchemas(); if (schemaResult) schemaResult.textContent = "Working draft retained without publishing."; };
  const saveAndCloseSchema = (): void => { openSchemaRevisionReview(); };
  const saveSchemaFromCloseReview = (): void => { schemaCloseReview?.close(); if (schemaCloseReview) schemaCloseReview.hidden = true;
    openSchemaRevisionReview(); };
  const discardWorkingSchemaDraft = (): void => {
    if (activeIndex() >= 0) { replaceActive(discardSchemaWorkingDraft(active())); persistSchemaLibrary(); }
    library.activeSchemaId = undefined; library.draft = undefined; schemaCloseReview?.close(); if (schemaCloseReview) schemaCloseReview.hidden = true; renderSchemas();
  };
  const renderSchemaRevisionComparison = (): void => renderSchemaDraft();
  const duplicateSelectedSchemaRevision = (): void => { const duplicate = duplicateSchemaRevision(active(), revisionVersion(), library.schemas);
    library.schemas = [...library.schemas, duplicate]; library.activeSchemaId = duplicate.id; library.draft = structuredClone(duplicate); persistSchemaLibrary(); renderSchemas(); };
  const restoreSelectedSchemaRevision = (): void => { const schema = active(), version = revisionVersion();
    pendingSchemaRestoration = { schemaId:schema.id, version };
    if (schemaRevisionReviewSummary) schemaRevisionReviewSummary.textContent =
      `${schema.name} revision ${version} will replace ${schema.workingDraft?.pendingChanges.length ?? 0} pending draft changes and create a working draft. Current revision ${schema.version} remains active; publication will create revision ${schema.version + 1}.`;
    if (schemaRevisionReview) schemaRevisionReview.hidden = false; schemaRevisionReview?.showModal(); };
  const clearSchemaPropertyViewFilter = (): void => { if (schemaPropertyFilter) schemaPropertyFilter.value = "";
    renderSchemaPropertyView(); schemaPropertyFilter?.focus(); };
  function showSchemaSubview(subview: string): void {
    for (const tab of schemaSubviews) {
      const target = tab.dataset.schemaSubview ?? tab.getAttribute("aria-controls");
      const selected = target === subview; tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1;
    }
    for (const panel of schemaPanels) panel.hidden = panel.id !== subview;
    if (liveEventQuery) liveEventQuery.hidden = subview !== "schema-master";
  }
  const activateSchemaSubview = (event: Event): void => {
    const tab = event.currentTarget as HTMLButtonElement;
    const subview = tab.dataset.schemaSubview ?? tab.getAttribute("aria-controls") ?? undefined;
    if (subview) showSchemaSubview(subview);
  };
  function applySchemaPropertyRemoval(path: string): void {
    const schema = active();
    const draft = schema.workingDraft;
    if (!draft) return;
    const priorPaths = Array.from(schemaPropertyTree?.querySelectorAll<HTMLElement>("[data-schema-property-canonical-path]") ?? [], ({ dataset }) => dataset.schemaPropertyCanonicalPath ?? ""),
      priorIndex = Math.max(0, priorPaths.indexOf(path));
    const removal = removeSchemaProperty(draft.document, draft.attachedRules ?? [], path, draft.documentation);
    propertyController.lastRemoval = removal; propertyController.selectedPath = removal.propertyPath.slice(1).replaceAll("/", ".");
    propertyController.expandedRulePaths.delete(removal.propertyPath);
    replaceActive(updateSchemaWorkingDraft(schema, { document:removal.document, attachedRules:removal.attachedRules,
      ...(removal.documentation !== undefined ? { documentation:removal.documentation } : {}) },
    `Remove property ${removal.propertyPath} and property-specific constraints`));
    if (schemaPropertyRemovalFeedback) schemaPropertyRemovalFeedback.textContent = `Removed ${removal.propertyPath} from the working draft. Undo is available.`;
    if (undoSchemaPropertyRemovalButton) undoSchemaPropertyRemovalButton.hidden = false;
    persistSchemaLibrary(); renderSchemas();
    const remaining = Array.from(schemaPropertyTree?.querySelectorAll<HTMLElement>("[data-schema-property-canonical-path]") ?? []),
      focusRow = remaining[Math.min(priorIndex, remaining.length - 1)];
    if (focusRow) { propertyController.selectedPath = focusRow.dataset.schemaPropertyPath ?? focusRow.dataset.schemaPropertyCanonicalPath ?? "";
      renderSchemaPropertyView(); const selected = schemaPropertyTree?.querySelector<HTMLElement>(`[data-schema-property-canonical-path="${CSS.escape(focusRow.dataset.schemaPropertyCanonicalPath ?? "")}"]`);
      (selected?.querySelector<HTMLElement>("button, a, input, select, textarea") ?? selected)?.focus({ preventScroll:true }); }
    else addSchemaPropertyButton?.focus({ preventScroll:true });
  }
  function requestSchemaPropertyRemoval(path: string, trigger?: HTMLButtonElement): void {
    const schema = active(); const draft = schema.workingDraft;
    if (!draft) return;
    const inspection = inspectSchemaPropertyRemoval(draft.document, draft.attachedRules ?? [], path, draft.documentation);
    if (!inspection.requiresConfirmation) { applySchemaPropertyRemoval(path); return; }
    propertyController.pendingRemoval = { path, ...(trigger ? { trigger } : {}) };
    if (schemaPropertyRemovalSummary) { const affectedRules = inspection.affectedRuleAttachments
      .map((rule) => `${rule.name ?? rule.id} at ${rule.propertyPath ?? inspection.propertyPath}`).join(", ") || "none";
      schemaPropertyRemovalSummary.textContent = `${inspection.propertyPath} contains ${inspection.descendants.length} descendants: ${inspection.descendants.join(", ") || "none"}. ${inspection.affectedRuleAttachments.length} affected rule attachments: ${affectedRules}. Documentation entries: ${inspection.affectedDocumentationPaths?.join(", ") || "none"}. No changes occur until confirmation.`; }
    schemaPropertyRemovalDialog?.showModal(); schemaPropertyRemovalHeading?.focus();
  }
  function closeSchemaPropertyRemovalDialog(restoreFocus = true): void {
    const trigger = propertyController.pendingRemoval?.trigger; propertyController.pendingRemoval = undefined;
    if (schemaPropertyRemovalDialog?.open) schemaPropertyRemovalDialog.close(); if (restoreFocus) trigger?.focus();
  }
  const confirmSchemaPropertyRemoval = (): void => { const path = propertyController.pendingRemoval?.path;
    closeSchemaPropertyRemovalDialog(false); if (path) applySchemaPropertyRemoval(path); };
  function focusAfterSchemaPropertyRemoval(path:string):void { propertyController.selectedPath = path.replace(/^\//, "").replaceAll("/", "."); renderSchemaPropertyView(); }
  const cancelSchemaPropertyRemoval = (): void => closeSchemaPropertyRemovalDialog();
  const cancelSchemaPropertyRemovalFromDialog = (event: Event): void => { event.preventDefault(); closeSchemaPropertyRemovalDialog(); };
  const undoLastSchemaPropertyRemoval = (): void => {
    if (!propertyController.lastRemoval) return;
    if (canonicalController.editor?.onUndo) {
      const path = propertyController.lastRemoval.propertyPath; propertyController.lastRemoval = undefined; canonicalController.editor.onUndo();
      if (schemaPropertyRemovalFeedback) schemaPropertyRemovalFeedback.textContent = `Restored ${path} from page-scoped Undo with its canonical identity and tree position.`;
      if (undoSchemaPropertyRemovalButton) undoSchemaPropertyRemovalButton.hidden = true;
      return;
    }
    const schema = active(), restored = undoSchemaPropertyRemoval(propertyController.lastRemoval);
    const path = propertyController.lastRemoval.propertyPath; propertyController.selectedPath = path.slice(1).replaceAll("/", ".");
    propertyController.expandedRulePaths.add(path);
    replaceActive(updateSchemaWorkingDraft(schema, { document:restored.document, attachedRules:restored.attachedRules,
      ...(restored.documentation !== undefined ? { documentation:restored.documentation } : {}) }, `Undo property removal ${path}`));
    if (schemaPropertyRemovalFeedback) schemaPropertyRemovalFeedback.textContent = `Restored ${path} with its prior definition and tree position.`;
    if (undoSchemaPropertyRemovalButton) undoSchemaPropertyRemovalButton.hidden = true;
    propertyController.lastRemoval = undefined; persistSchemaLibrary(); renderSchemas();
    focusAfterSchemaPropertyRemoval(path);
  };
  function requestSchemaDocumentationRemoval(path: string, trigger?: HTMLElement): void {
    propertyController.pendingDocumentationRemoval = { path, ...(trigger ? { trigger } : {}) };
    if (schemaDocumentationRemovalSummary) schemaDocumentationRemovalSummary.textContent = `${path} documentation will be removed from the working draft. The schema property and validation rules remain unchanged.`;
    schemaDocumentationRemovalDialog?.showModal(); schemaDocumentationRemovalHeading?.focus();
  }
  function closeSchemaDocumentationRemoval(restoreFocus = true): void {
    const trigger = propertyController.pendingDocumentationRemoval?.trigger; propertyController.pendingDocumentationRemoval = undefined;
    if (schemaDocumentationRemovalDialog?.open) schemaDocumentationRemovalDialog.close(); if (restoreFocus) trigger?.focus();
  }
  const confirmSchemaDocumentationRemovalAction = (): void => {
    const path = propertyController.pendingDocumentationRemoval?.path; if (!path) return; const schema = active(); const draft = schema.workingDraft;
    closeSchemaDocumentationRemoval(false); if (!draft) return;
    const documentation = setPropertyDocumentation(draft.documentation ?? {}, path, { displayName:"", description:"" });
    const canonicalBase = canonicalController.savedSchemaId(canonicalController.editor) === schema.id
      ? canonicalController.savedDocument : draft.canonicalSchema;
    const canonicalNode = canonicalBase && Object.values(canonicalBase.nodes)
      .find((candidate) => canonicalPropertyPath(canonicalBase, candidate.id) === path);
    const canonicalRemoval = canonicalBase && canonicalNode ? applyCanonicalCommand(canonicalBase, {
      kind:"set", baseRevision:canonicalBase.revision, propertyId:canonicalNode.id,
      patch:{ documentation:{ displayText:"", description:"", comments:"", example:{ method:"blank" } } },
    }) : undefined;
    const canonicalSchema = canonicalRemoval?.status === "applied" || canonicalRemoval?.status === "rebased"
      ? canonicalRemoval.document : undefined;
    if (canonicalSchema && canonicalController.savedSchemaId(canonicalController.editor) === schema.id) canonicalController.savedDocument = canonicalSchema;
    replaceActive(updateSchemaWorkingDraft(schema, { documentation, ...(canonicalSchema ? { canonicalSchema } : {}) },
      `Remove property documentation ${path}`));
    queueSchemaLibraryPersistence(schema.id); renderSchemas(); schemaEditor?.setAttribute("aria-busy", String(Boolean(ports.settleCanonical)));
  };
  const cancelSchemaDocumentationRemovalAction = (): void => closeSchemaDocumentationRemoval();
  const cancelSchemaDocumentationRemovalFromDialog = (event: Event): void => { event.preventDefault(); closeSchemaDocumentationRemoval(); };
  const resetSchemaPropertyCopyDialog = ():void => {
    const cleanCopyDialog = typeof schemaPropertyCopyDialog?.cloneNode === "function"
      ? schemaPropertyCopyDialog.cloneNode(false) as HTMLDialogElement : undefined;
    if (schemaPropertyCopyDialog && cleanCopyDialog) {
      cleanCopyDialog.id = schemaPropertyCopyDialog.id; schemaPropertyCopyDialog.replaceWith(cleanCopyDialog);
      schemaPropertyCopyDialog = cleanCopyDialog;
    }
  };
  function openSchemaPropertyCopyReview(path: string, triggerOrDestination: HTMLButtonElement | string): void {
    const sourceSchema = active(), source = schemaPropertyCopySource(sourceSchema,
      { surface:sourceSchema.workingDraft ? "working draft" : "current" }),
      editorScroll = schemaEditor?.scrollTop ?? 0, treeScroll = schemaPropertyTree?.scrollTop ?? 0;
    const trigger = typeof triggerOrDestination === "string" ? undefined : triggerOrDestination;
    const sources = [source, ...(sourceSchema.workingDraft ? [schemaPropertyCopySource(sourceSchema, { surface:"current" })] : []),
      ...schemaRevisionChoices(sourceSchema).map((version) => schemaPropertyCopySource(sourceSchema, { surface:"historical", version }))];
    propertyController.pendingCopyReview?.close(); resetSchemaPropertyCopyDialog();
    const reviewController = renderSchemaPropertyCopyReview(schemaPropertyCopyDialog!, { source, sources, selectedPath:path,
      destinations:library.schemas.filter(({ id }) => id !== sourceSchema.id), schemas:library.schemas, reusableRuleIds:ruleController.rules.map(({ id }) => id),
      ...(trigger ? { trigger } : {}),
      onApply:(transaction) => {
        propertyController.pendingCopyPosition = { schemaId:sourceSchema.id, settlementSchemaId:transaction.schema.id, path, editorScroll, treeScroll };
        library.schemas = library.schemas.map((schema) => schema.id === transaction.schema.id ? transaction.schema : schema);
        propertyController.lastCopy = transaction; propertyController.pendingCopy = undefined; propertyController.pendingCopyReview = undefined; persistSchemaLibrary(); renderSchemas(); ruleController.render();
        if (undoSchemaPropertyCopyButton) undoSchemaPropertyCopyButton.hidden = false;
        if (schemaPropertyCopyFeedback) schemaPropertyCopyFeedback.textContent = `Copied ${path} from ${source.label} to ${transaction.schema.name}. Published revisions are unchanged.`;
        const restoration = propertyController.pendingCopyPosition;
        const restoreCopyPosition = ():void => { schemaPropertyTree?.querySelector<HTMLElement>(`button[aria-label="Copy ${path} to another schema"]`)?.focus({ preventScroll:true });
          if (schemaEditor) schemaEditor.scrollTop = editorScroll; if (schemaPropertyTree) schemaPropertyTree.scrollTop = treeScroll; };
        const completeCopyPosition = ():void => { restoreCopyPosition(); ports.scheduleFrame(() => { restoreCopyPosition();
          if (propertyController.pendingCopyPosition === restoration) propertyController.pendingCopyPosition = undefined; }); };
        queueMicrotask(restoreCopyPosition); ports.scheduleFrame(restoreCopyPosition); if (ports.settleCanonical) void ports.settleCanonical(transaction.schema.id)
          .then(() => ports.scheduleFrame(completeCopyPosition), () => {}); else ports.scheduleFrame(completeCopyPosition);
      }, ...(trigger ? { onClose:() => trigger.focus({ preventScroll:true }) } : {}) });
    propertyController.pendingCopyReview = reviewController;
    if (typeof triggerOrDestination === "string") {
      const destination = schemaPropertyCopyDialog?.querySelector<HTMLSelectElement>("#schema-property-copy-destination");
      if (destination) {
        destination.value = triggerOrDestination;
        const testableDestination = destination as HTMLSelectElement & { dispatch?:(type:string)=>void };
        if (testableDestination.dispatch) testableDestination.dispatch("change");
        else destination.dispatchEvent(new Event("change", { bubbles:true }));
      }
      propertyController.pendingCopy = reviewController.plan();
    }
  }
  const confirmSchemaPropertyCopy = (): void => {
    if (!propertyController.pendingCopy) return; const transaction = applySchemaPropertyCopy(propertyController.pendingCopy);
    library.schemas = library.schemas.map((schema) => schema.id === transaction.schema.id ? transaction.schema : schema);
    propertyController.lastCopy = transaction; propertyController.pendingCopy = undefined; propertyController.pendingCopyReview?.close(); propertyController.pendingCopyReview = undefined;
    resetSchemaPropertyCopyDialog();
    if (schemaPropertyCopyFeedback) schemaPropertyCopyFeedback.textContent = `Copied ${transaction.plan.selectedPath} from ${transaction.plan.source.label} to ${transaction.schema.name}. Published revisions are unchanged.`;
    if (undoSchemaPropertyCopyButton) undoSchemaPropertyCopyButton.hidden = false;
    persistSchemaLibrary(); renderSchemas();
  };
  const undoLastSchemaPropertyCopy = (): void => {
    if (!propertyController.lastCopy) return; const restored = undoSchemaPropertyCopy(propertyController.lastCopy).schema;
    library.schemas = library.schemas.map((schema) => schema.id === restored.id ? restored : schema);
    if (schemaPropertyCopyFeedback) schemaPropertyCopyFeedback.textContent = `Undid property copy to ${restored.name}; the pre-copy working draft was restored.`;
    if (undoSchemaPropertyCopyButton) undoSchemaPropertyCopyButton.hidden = true;
    propertyController.lastCopy = undefined; persistSchemaLibrary(); renderSchemas();
  };
  const renderSpecificIndexInspection = (): void => {
    if (!propertyController.specificIndexArrayPath || !active().workingDraft) return;
    const inspection = inspectSpecificIndexRuleTarget(active().workingDraft!.document, propertyController.specificIndexArrayPath, schemaSpecificIndex?.value ?? "");
    if (confirmSchemaSpecificIndex) confirmSchemaSpecificIndex.disabled = inspection.result !== "accepted";
    if (schemaSpecificIndexAssistance) schemaSpecificIndexAssistance.textContent = inspection.assistance;
  };
  const openSpecificIndexDialog = (arrayPath: string, trigger?: HTMLButtonElement): void => {
    propertyController.specificIndexArrayPath = arrayPath; propertyController.specificIndexTrigger = trigger;
    if (schemaSpecificIndex) schemaSpecificIndex.value = "";
    if (confirmSchemaSpecificIndex) confirmSchemaSpecificIndex.disabled = true;
    if (schemaSpecificIndexAssistance) schemaSpecificIndexAssistance.textContent = "Enter a non-negative zero-based index";
    schemaSpecificIndexDialog?.showModal(); schemaSpecificIndex?.focus();
  };
  const submitSpecificIndex = (event: Event): void => { event.preventDefault();
    const draft = active().workingDraft; if (!draft || !propertyController.specificIndexArrayPath) return;
    const inspection = inspectSpecificIndexRuleTarget(draft.document, propertyController.specificIndexArrayPath, schemaSpecificIndex?.value ?? "");
    if (inspection.result !== "accepted") return;
    const trigger=propertyController.specificIndexTrigger, dottedPath=inspection.canonicalPath.slice(1).replaceAll("/", ".");
    closeSpecificIndexDialog(); openSchemaPropertyRulePicker(dottedPath, trigger);
  };
  const closeSpecificIndexDialog = (): void => { schemaSpecificIndexDialog?.close(); propertyController.specificIndexTrigger?.focus();
    propertyController.specificIndexArrayPath = undefined; propertyController.specificIndexTrigger = undefined; };
  const cancelSpecificIndexDialog = (event: Event): void => { event.preventDefault(); closeSpecificIndexDialog(); };
  function schemaParentDocuments(): SchemaDefinition["document"][] {
    const documents: SchemaDefinition["document"][] = []; const visited = new Set<string>();
    let parentId = active().workingDraft?.parentSchemaId ?? active().parentSchemaId;
    while (parentId && !visited.has(parentId)) { visited.add(parentId); const parent = library.schemas.find(({ id }) => id === parentId);
      if (!parent) break; documents.push(parent.document); parentId = parent.parentSchemaId; }
    return documents;
  }
  function manualPropertyDefinition(): ManualPropertyDefinition {
    const type = (schemaManualPropertyType?.value || "string") as ManualPropertyValueType;
    const arrayItemType = (schemaManualArrayItemType?.value ?? "") as ManualArrayItemType | "";
    if (propertyController.pendingManualContext) return contextualManualPropertyDefinition(propertyController.pendingManualContext.parentPath,
      schemaManualPropertyChildName?.value ?? "", type, type === "array" && arrayItemType ? arrayItemType : undefined);
    return { path:schemaManualPropertyPath?.value ?? "", type,
      ...(type === "array" && arrayItemType ? { arrayItemType } : {}) };
  }
  function renderManualPropertyForm(): void {
    const draft = active().workingDraft; if (!draft) return; const definition = manualPropertyDefinition();
    const inspection = inspectManualProperty(draft.document, schemaParentDocuments(), definition);
    const contextual = Boolean(propertyController.pendingManualContext);
    if (schemaManualPropertyPathLabel) schemaManualPropertyPathLabel.hidden = contextual;
    if (schemaManualPropertyPath) schemaManualPropertyPath.hidden = contextual;
    if (schemaManualPropertyChildNameLabel) schemaManualPropertyChildNameLabel.hidden = !contextual;
    if (schemaManualPropertyChildName) schemaManualPropertyChildName.hidden = !contextual;
    if (schemaManualPropertyParentContext) { schemaManualPropertyParentContext.hidden = !contextual;
      schemaManualPropertyParentContext.textContent = propertyController.pendingManualContext ? `Parent path: ${propertyController.pendingManualContext.parentPath}` : ""; }
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
  function closeManualPropertyForm(restoreFocus = true): void { const trigger = propertyController.pendingManualContext?.trigger;
    propertyController.pendingManualContext = undefined; schemaManualPropertyDialog?.close(); if (restoreFocus) (trigger ?? addSchemaPropertyButton)?.focus(); }
  function openManualPropertyForm(parentPath?: string, trigger?: HTMLButtonElement): void {
    if (!active().workingDraft) return; propertyController.pendingManualContext = parentPath ? { parentPath, ...(trigger ? { trigger } : {}) } : undefined;
    propertyController.pendingManualCanonicalBase = active().workingDraft?.canonicalSchema;
    if (schemaManualPropertyHeading) schemaManualPropertyHeading.textContent = parentPath ? "Add child property" : "Add property";
    if (schemaManualPropertyPath) schemaManualPropertyPath.value = ""; if (schemaManualPropertyChildName) schemaManualPropertyChildName.value = "";
    if (schemaManualPropertyType) schemaManualPropertyType.value = "string"; if (schemaManualArrayItemType) schemaManualArrayItemType.value = "";
    renderManualPropertyForm(); schemaManualPropertyDialog?.showModal(); (parentPath ? schemaManualPropertyChildName : schemaManualPropertyPath)?.focus();
  }
  const submitManualProperty = (event: Event): void => { event.preventDefault(); const schema = active(); const draft = schema.workingDraft;
    if (!draft) return; const definition = manualPropertyDefinition(); const inspection = inspectManualProperty(draft.document, schemaParentDocuments(), definition);
    if (inspection.result !== "ready") { renderManualPropertyForm(); return; }
    const document = addManualProperty(draft.document, schemaParentDocuments(), definition);
    let canonicalSchema = draft.canonicalSchema;
    if (canonicalSchema) {
      const previousCanonical = canonicalSchema;
      const projected:SchemaDefinition = { ...schema, document, name:draft.name ?? schema.name, assignments:draft.assignments,
        ...(draft.attachedRules ? { attachedRules:draft.attachedRules } : {}), ...(draft.documentation ? { documentation:draft.documentation } : {}) };
      canonicalSchema = savedSchemaCanonicalDocument(projected, (kind) => `schema:${kind}:${++canonicalController.idSequence}`, {
        id:previousCanonical.id, contributorId:previousCanonical.contributorId, contributorName:previousCanonical.contributorName,
      });
      canonicalSchema.revision = previousCanonical.revision + 1;
      const selectedPropertyId = Object.values(canonicalSchema.nodes)
        .find((node) => canonicalPropertyPath(canonicalSchema!, node.id) === inspection.normalizedPath)?.id;
      if (selectedPropertyId) canonicalSchema.selectedPropertyId = selectedPropertyId;
    }
    replaceActive(updateSchemaWorkingDraft(schema, { document, ...(canonicalSchema ? { canonicalSchema } : {}) },
      `Add manual property ${inspection.normalizedPath}`)); propertyController.selectedPath = inspection.normalizedPath.slice(1).replaceAll("/", ".");
    closeManualPropertyForm(false); propertyController.pendingManualCanonicalBase = undefined; persistSchemaLibrary(); renderSchemas(); };
  function openContextualManualPropertyForm(parentPath:string, trigger?:HTMLButtonElement):void { openManualPropertyForm(parentPath, trigger); }
  const openManualPropertyFromControl = ():void => openManualPropertyForm();
  const cancelManualPropertyDialog = (): void => closeManualPropertyForm();
  const cancelManualPropertyFromDialog = (event: Event): void => { event.preventDefault(); closeManualPropertyForm(); };
  const goToExistingSchemaProperty = (): void => { const path = goToExistingSchemaPropertyButton?.dataset.schemaPropertyPath;
    if (!path) return; propertyController.selectedPath = path.replace(/^\//, "").replaceAll("/", "."); closeManualPropertyForm(false); renderSchemas();
    schemaPropertyTree?.querySelector<HTMLButtonElement>(`button[aria-label="${CSS.escape(`Add rule for ${propertyController.selectedPath}`)}"]`)?.focus({ preventScroll:true }); };
  const normalizedRulePickerPath = (path: string): string => `/${path.replace(/^\//, "").replaceAll(".", "/")}`;
  function currentConditionPayload(target:AssignmentConditionTarget = "payload"):unknown { return ports.capturedAssignmentValue(target); }
  function valueAtSchemaPath(value:unknown, path:string):{ exists:boolean; value:unknown } {
    let current = value;
    for (const segment of path.replace(/^\//, "").split(/[/.]/).filter(Boolean)) {
      if (current === null || typeof current !== "object" || !(segment in current)) return { exists:false, value:undefined };
      current = (current as Record<string, unknown>)[segment];
    }
    return { exists:true, value:current };
  }
  function initialConditionPredicate(propertyPath:string):NonNullable<PromotableReusableRule["conditionGroup"]> {
    const editable = library.draft ?? schemaEditorDraft(active()), consequence = normalizedRulePickerPath(propertyPath);
    const choice = schemaDocumentPaths(editable.document).find((path) => normalizedRulePickerPath(path) === "/page_type")
      ?? schemaDocumentPaths(editable.document).find((path) => normalizedRulePickerPath(path) !== consequence) ?? "";
    const canonical = choice ? normalizedRulePickerPath(choice) : "", sample = valueAtSchemaPath(currentConditionPayload(), canonical);
    const detectedType = choice ? schemaPropertyType(editable.document, canonical) ?? "string" : "string";
    const comparable = sample.exists && (sample.value === null || ["string", "number", "boolean"].includes(typeof sample.value));
    return { operator:"All", predicates:[{ propertyPath:canonical, operator:comparable ? "Equals" : "Exists", detectedType,
      ...(comparable ? { comparison:typedComparisonValue(sample.value as string | number | boolean | null) } : {}) }] };
  }
  function sampledConditionPredicate(propertyPath:string):NonNullable<PromotableReusableRule["conditionGroup"]> {
    const editable = library.draft ?? schemaEditorDraft(active()), canonical = normalizedRulePickerPath(propertyPath),
      sample = valueAtSchemaPath(currentConditionPayload(), canonical), comparable = sample.exists &&
        (sample.value === null || ["string", "number", "boolean"].includes(typeof sample.value));
    return { operator:"All", predicates:[{ propertyPath:canonical, operator:comparable ? "Equals" : "Exists",
      ...(comparable ? { comparison:typedComparisonValue(sample.value as string | number | boolean | null) } : {}),
      ...(comparable ? {} : { detectedType:schemaPropertyType(editable.document, canonical) ?? "string" }) }] };
  }
  function configuredRuleInput():ReusableSchemaRule { const configuration = ruleController.configuration;
    if (configuration) { const details = configuredRuleDetails(configuration), generatedId = configuration.saveReusable
      ? ports.createRuleId() : ports.createRuleId().replace(/^rule:/, "local-rule:"); return { id:ruleController.editingAttached?.id ?? ruleController.editingReusableId ?? generatedId,
      name:configuration.reusableName.trim() || `${configuration.ruleType} for ${ruleController.pickerPath}`, kind:configuration.ruleType,
      version:storedReusableRule(ruleController.editingReusableId ?? "")?.version ?? 0, enabled:configuration.enabled, applicableType:configuration.propertyType,
      operator:details.operator, ...(details.parameters !== undefined ? { parameters:details.parameters } : {}),
      ...(details.allowedValues !== undefined ? { allowedValues:details.allowedValues } : {}), ...(details.comparison !== undefined ? { comparison:details.comparison } : {}),
      ...(details.limit !== undefined ? { limit:details.limit } : {}), severity:configuration.severity,
      ...(configuration.message.trim() ? { message:configuration.message.trim() } : {}),
      ...(configuration.applyOnlyWhen ? { conditionGroup:{ operator:configuration.conditionGroupOperator, predicates:structuredClone(configuration.conditions) } } : {}),
      ...(configuration.description.trim() ? { description:configuration.description.trim() } : {}) }; }
    const name = schemaRuleName?.value.trim() || "Untitled rule", operator = schemaRuleOperator?.value || "required";
    return { id:ruleController.editingReusableId ?? ports.createRuleId(), name, kind:operator, version:storedReusableRule(ruleController.editingReusableId ?? "")?.version ?? 0,
      enabled:true, applicableType:(schemaRuleTypes?.value || "string") as SchemaPropertyType, operator,
      ...(schemaRuleParameters?.value.trim() ? { parameters:schemaRuleParameters.value.trim() } : {}),
      ...(schemaRuleSeverity?.value ? { severity:schemaRuleSeverity.value } : {}), ...(schemaRuleMessage?.value.trim() ? { message:schemaRuleMessage.value.trim() } : {}) };
  }
  function renderConditionalRuleConfiguration():void { if (!schemaPropertyRulePicker || !ruleController.pickerPath) return;
    const condition = initialConditionPredicate(ruleController.pickerPath); schemaPropertyRulePicker.dataset.conditionPreview = JSON.stringify({
      propertyPath:normalizedRulePickerPath(ruleController.pickerPath), ...condition }); }
  function renderSchemaLocalRuleConfiguration():void { renderSchemaPropertyRulePicker(); renderConditionalRuleConfiguration(); }
  function createConfiguredSchemaRule():boolean { if (!ruleController.pickerPath || (!library.activeSchemaId && !library.draft)) return false; const rule = configuredRuleInput();
    const savedRule = { ...rule, version:ruleController.editingAttached?.version ?? Math.max(1, rule.version + 1) };
    if (ruleController.configuration?.saveReusable) ruleController.rules = [...ruleController.rules.filter(({ id }) => id !== savedRule.id), savedRule];
    const attached = attachReusableRule(library.activeSchemaId ?? library.draft!.id, savedRule.id, ruleController.pickerPath, savedRule);
    if (attached) closeSchemaPropertyRulePickerForCommit(); return attached; }
  function openCompactCanonicalRuleEditor(path:string, trigger?:HTMLButtonElement):boolean {
    const adapter = canonicalController.editor, base = adapter?.load(), node = base && Object.values(base.nodes)
      .find((candidate) => canonicalPropertyPath(base, candidate.id) === canonicalRulePropertyPath(path) || candidate.id === path);
    if (!adapter || !base || !node || !schemaPropertyRulePicker) return false;
    let working = structuredClone(node), feedbackText = "";
    const removedRuleIds = new Set<string>();
    const properties = () => Object.values(base.nodes).map(({ id, name, type, allowedValues }) => ({
      id, name, type, allowedValues:allowedValues.map(({ value }) => value),
    }));
    const button = (text:string, run:() => void):HTMLButtonElement => {
      const control = schemaPropertyRulePicker.ownerDocument.createElement("button");
      control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control;
    };
    const render = ():void => {
      const document = schemaPropertyRulePicker.ownerDocument, focused = document.createElement("section"),
        heading = document.createElement("h3"), identity = document.createElement("p"), rules = document.createElement("section"),
        actions = document.createElement("section"), feedback = document.createElement("output");
      focused.dataset.focusedPropertyEditor = "true"; focused.dataset.focusedSection = "rules";
      focused.setAttribute("aria-label", `${path} focused Rules section`); heading.textContent = "Rules";
      identity.textContent = `${path} · stable identity ${node.id} · Local value and effective result remain staged until Review changes.`;
      rules.setAttribute("aria-label", "Compact staged rule editor"); actions.setAttribute("aria-label", "Property actions");
      feedback.setAttribute("role", "status"); feedback.textContent = feedbackText;
      renderCanonicalFocusedRules(rules, { dom:document, getWorking:() => working,
        properties, removedRuleIds, invariant:working.enforcement === "invariant", id:(kind) => `${kind}:${crypto.randomUUID()}`,
        render, feedback:(message) => { feedbackText = message; } });
      const cancel = button("Cancel", closeSchemaPropertyRulePicker), review = button("Review changes", () => {
        const reviewPanel = document.createElement("section"), summary = document.createElement("p"), reviewActions = document.createElement("section"),
          stagedRules = working.rules.filter(({ id }) => !removedRuleIds.has(id));
        reviewPanel.setAttribute("aria-label", "Review changes");
        summary.textContent = `Review changes · ${path} · ${stagedRules.length} staged rules · one property command and one Undo action.`;
        reviewActions.setAttribute("aria-label", "Property review actions");
        reviewActions.append(button("Cancel review", render), button("Confirm changes", () => { void (async () => {
          const current = adapter.load(), result = await canonicalController.dispatchCommand({ kind:"set", baseRevision:current.revision,
            propertyId:node.id, patch:{ rules:structuredClone(stagedRules) } });
          if (result) closeSchemaPropertyRulePicker();
        })(); }));
        reviewPanel.append(summary, reviewActions); schemaPropertyRulePicker.replaceChildren(reviewPanel);
      });
      actions.append(feedback, cancel, review); focused.append(heading, identity, rules, actions);
      schemaPropertyRulePicker.replaceChildren(focused);
    };
    ruleController.pickerPath = path; ruleController.pickerTrigger = trigger; ruleController.configuration = undefined; ruleController.editingAttached = undefined;
    render(); schemaPropertyRulePicker.showModal();
    schemaPropertyRulePicker.querySelector<HTMLButtonElement>('[aria-label="Compact staged rule editor"] > button')?.focus({ preventScroll:true });
    return true;
  }
  function openCompactCanonicalPropertyActions(path:string,trigger?:HTMLButtonElement):boolean {
    const adapter=canonicalController.editor,documentModel=adapter?.load(),original=documentModel&&Object.values(documentModel.nodes).find((candidate)=>canonicalPropertyPath(documentModel,candidate.id)===path||candidate.id===path),owner=schemaEditor;
    if(!adapter||!documentModel||!original||!owner||!schemaOwnerDocument)return false;
    canonicalController.propertyMenuId=original.id;propertyController.selectedPath=path.replace(/^\//,"").replaceAll("/",".");
    if(!trigger){renderCompactCanonicalContext();return true;}
    let working=structuredClone(original),activeSection:"definition"|"rules"|"structure"|undefined,feedbackText="",stagedOwnershipAction="";
    const ownership=focusedOwnershipState(focusedCanonicalOwnershipInput(original));let ownershipSession=ownership.session;
    const removedRuleIds=new Set<string>(),removedValueIds=new Set<string>(),stagedOperations:NonNullable<Extract<Parameters<typeof applyCanonicalCommand>[1],{kind:"set"}>["operations"]>=[];
    const state=focusedSourceState(original),sectionOwnership=focusedSectionOwnershipActions(ownership.input);
    const close=()=>{clearSchemaTableOverlay(owner);trigger.focus({preventScroll:true});};
    const restoreFocus=(label:string)=>queueMicrotask(()=>Array.from(owner.ownerDocument.querySelectorAll<HTMLButtonElement>('[data-schema-row-overlay="true"] button')).find(({textContent,ariaLabel})=>textContent?.trim()===label||ariaLabel===label)?.focus({preventScroll:true}));
    const menu=()=>renderFocusedPropertyMenu({dom:schemaOwnerDocument,path,provenance:focusedPropertyProvenanceSummary(original.provenance),close,sectionSummary:(name)=>name==="rules"?`${working.rules.length} rules`:name==="structure"?"Stable property identity":"Effective definition facets",selectSection:(name)=>showSection(name as "definition"|"rules"|"structure")});
    const mount=(layers:HTMLElement[],focusLabel?:string)=>{const sequence=focusedPropertyLayerSequence(activeSection,...(layers.length===3?["review" as const]:[]));layers.forEach((layer,index)=>{layer.dataset.compactFocusedLayer=sequence[index]??"review";});mountSchemaTableOverlay(owner,trigger,path,layers,close);if(focusLabel)restoreFocus(focusLabel);};
    const showMenu=(focusLabel?:string)=>{activeSection=undefined;mount([menu()],focusLabel);};
    const sectionContext=(section:"definition"|"rules"|"structure",render:()=>void)=>({dom:schemaOwnerDocument,current:()=>documentModel,node:original,getWorking:()=>working,setWorking:(value:typeof working|undefined)=>{if(value)working=value;},activeSection:section,setActiveSection:(value:string)=>{if(value==="definition"||value==="rules"||value==="structure")activeSection=value;},removedRuleIds,removedValueIds,id:(kind:string)=>`${kind}:${crypto.randomUUID()}`,stageStructure:(operation:typeof stagedOperations[number])=>{stagedOperations.push(operation);render();},render,patchFor:(next:typeof working,source:typeof original)=>focusedPropertyPatch(next,source,removedRuleIds,removedValueIds),command:(command:Parameters<typeof applyCanonicalCommand>[1])=>applyCanonicalCommand(documentModel,command),select:()=>{},feedback:(message:string)=>{feedbackText=message;}});
    const showReview=(section:"definition"|"rules"|"structure",child:HTMLElement,focusLabel?:string)=>{const review=schemaOwnerDocument.createElement("section"),heading=schemaOwnerDocument.createElement("h3"),summary=schemaOwnerDocument.createElement("p"),changes=schemaOwnerDocument.createElement("ul"),actions=schemaOwnerDocument.createElement("div"),cancel=schemaOwnerDocument.createElement("button"),confirm=schemaOwnerDocument.createElement("button"),patch=focusedPropertyPatch(working,original,removedRuleIds,removedValueIds),staged=focusedStagedChanges(working,original,removedRuleIds,path,removedValueIds);review.setAttribute("aria-label","Review changes");review.dataset.focusedReview="true";heading.textContent="Review changes";summary.textContent=`${path} · ${stagedOwnershipAction?`${stagedOwnershipAction} · `:""}one property command and one Undo action · no durable write before confirmation.`;for(const change of staged)changes.append(Object.assign(schemaOwnerDocument.createElement("li"),{textContent:`${change.label} · ${change.detail}`}));for(const operation of stagedOperations)changes.append(Object.assign(schemaOwnerDocument.createElement("li"),{textContent:`Structure ${operation.kind} · ${"propertyId" in operation?operation.propertyId:original.id}`}));cancel.type="button";cancel.textContent="Cancel review";cancel.addEventListener("click",()=>showSection(section,"Review changes"));confirm.type="button";confirm.textContent="Confirm changes";confirm.addEventListener("click",()=>{void canonicalController.dispatchCommand({kind:"set",baseRevision:adapter.load().revision,propertyId:original.id,patch,operations:stagedOperations}).then((result)=>{if(result)close();});});actions.append(cancel,confirm);review.append(heading,summary,changes,actions);review.addEventListener("keydown",(event)=>{if(event.key!=="Escape")return;event.preventDefault();event.stopPropagation();showSection(section,"Review changes");});activeSection=section;mount([menu(),child,review],focusLabel??"Confirm changes");};
    const buildSection=(section:"definition"|"rules"|"structure")=>{const host=schemaOwnerDocument.createElement("section"),heading=schemaOwnerDocument.createElement("h3"),identity=schemaOwnerDocument.createElement("p"),body=schemaOwnerDocument.createElement("section"),group=schemaOwnerDocument.createElement("div"),status=schemaOwnerDocument.createElement("p"),actions=schemaOwnerDocument.createElement("div"),cancel=schemaOwnerDocument.createElement("button"),review=schemaOwnerDocument.createElement("button"),render=()=>showSection(section);host.dataset.focusedPropertyEditor="true";host.dataset.schemaOverlayLayer="child";host.dataset.focusedSection=section;host.setAttribute("aria-label",`${path} focused ${section} section`);heading.textContent=section==="definition"?"Definition":section==="rules"?"Rules":"Structure";identity.textContent=`${path} · stable identity ${original.id} · ${focusedPropertyProvenanceSummary(original.provenance)}`;body.setAttribute("aria-label",`Focused ${heading.textContent} section`);renderCanonicalFocusedSection(body,sectionContext(section,render));if(section==="definition")body.dataset.definitionFields=focusedDefinitionFieldLabels.join("|");const target=focusedOwnershipActionTarget(section==="structure"?"Structure":section==="rules"?"Rules":"Definition",section==="structure"?"property":section==="rules"?"rule":"facet",section==="structure"?original.id:section==="rules"?`${original.id}:rules`:`${original.id}:definition`),visible=section==="rules"?[]:sectionOwnership[section];if(visible.length){group.dataset.sectionOwnershipActions="true";group.dataset.ownershipState=state;group.dataset.ownershipTarget=target.label;for(const action of visible){const control=schemaOwnerDocument.createElement("button");control.type="button";control.textContent=action;control.dataset.ownershipAction=action;control.dataset.ownershipTarget=target.label;control.setAttribute("aria-label",`${action} · ${target.label}`);control.addEventListener("click",()=>{feedbackText=`${action} targets ${target.label}.`;ownershipSession=activateFocusedOwnershipSection(ownershipSession,section,action);if(action==="Override here"||action==="Replace here")stagedOwnershipAction=action;const operation=focusedPropertyLifecycleOperation(action,original.id);if(operation){stagedOwnershipAction=action;if(!stagedOperations.some((candidate)=>candidate.kind==="delete"&&candidate.propertyId===original.id))stagedOperations.push(operation);}render();});group.append(control);}}gateFocusedOwnershipSection(body,ownershipSession,section);status.setAttribute("role","status");status.textContent=feedbackText;cancel.type="button";cancel.textContent="Cancel";cancel.addEventListener("click",()=>showMenu(heading.textContent));review.type="button";review.textContent="Review changes";review.addEventListener("click",()=>showReview(section,host));actions.append(cancel,review);host.append(heading,identity,body,group,status,actions);host.addEventListener("keydown",(event)=>{if(event.key!=="Escape")return;event.preventDefault();event.stopPropagation();showMenu(heading.textContent);});return host;};
    function showSection(section:"definition"|"rules"|"structure",focusLabel?:string):void{activeSection=section;mount([menu(),buildSection(section)],focusLabel);}
    showMenu();renderCompactCanonicalContext();return true;
  }
  const updateConfiguredRulePreview = ():void => { if (ruleController.pickerPath) renderSchemaLocalRuleConfiguration(); };
  const renderSchemaPropertyRulePicker = (): void => {
    propertyController.renderSequence += 1;
    if (!schemaPropertyRulePicker || !ruleController.pickerPath) return;
    ruleController.clearPicker();
    const path = ruleController.pickerPath, document = schemaPropertyRulePicker.ownerDocument;
    if (!document) return;
    if (!ruleController.configuration) {
      const heading = document.createElement("h4"), search = document.createElement("input"), results = document.createElement("section"), cancel = document.createElement("button"),
        propertyType = schemaRuleTypeForAttachment(active(), path);
      heading.id = "schema-property-rule-picker-heading"; heading.textContent = `Add rule for ${path} · type ${propertyType}`;
      results.id = "schema-property-rule-results"; search.id = "schema-property-rule-search"; search.value = ruleController.pickerSearch;
      schemaPropertyRulePicker.setAttribute("aria-labelledby", heading.id); cancel.type = "button"; cancel.textContent = "Cancel";
      const canonicalPath = normalizedRulePickerPath(path), attachedIds = new Set(
        (active().workingDraft?.attachedRules ?? active().attachedRules ?? [])
          .filter(({ propertyPath }) => normalizedRulePickerPath(propertyPath ?? "") === canonicalPath)
          .map(({ id }) => id),
      );
      const normalized = ruleController.pickerSearch.trim().toLowerCase(), builtIns = builtInRulesForProperty(propertyType)
        .filter((rule) => !normalized || [rule.name, rule.operator, rule.applicableType].join(" ").toLowerCase().includes(normalized));
      const reusable = reusableRulesForProperty(ruleController.rules, propertyType, ruleController.pickerSearch, attachedIds);
      const create = document.createElement("section"), library = document.createElement("section");
      create.setAttribute("aria-label", "Create a rule"); library.setAttribute("aria-label", "Attach from Rule Library");
      create.append(Object.assign(document.createElement("h5"), { textContent:"Create a rule" }));
      library.append(Object.assign(document.createElement("h5"), { textContent:"Attach from Rule Library" }));
      for (const rule of builtIns) {
        const article = document.createElement("article"), button = document.createElement("button"), metadata = document.createElement("p");
        button.type = "button"; button.textContent = rule.name; metadata.textContent = reusableRuleMetadata(rule, propertyType);
        const action = ():void => { ruleController.configuration = createRuleConfiguration(rule.name as RuleConfiguration["ruleType"], propertyType); renderSchemaPropertyRulePicker(); };
        button.addEventListener("click", action); ruleController.ownPicker(() => button.removeEventListener("click", action)); article.append(button, metadata); create.append(article);
      }
      for (const rule of reusable) {
        const article = document.createElement("article"), button = document.createElement("button"), metadata = document.createElement("p");
        button.type = "button"; button.textContent = `${rule.name} version ${rule.version ?? 1}${rule.alreadyAttached ? " · already attached" : ""}`;
        button.disabled = rule.alreadyAttached; metadata.textContent = reusableRuleMetadata(rule, propertyType);
        const action = ():void => { attachReusableRule(active().id, rule.id, path); closeSchemaPropertyRulePickerForCommit(); };
        button.addEventListener("click", action); ruleController.ownPicker(() => button.removeEventListener("click", action)); article.append(button, metadata); library.append(article);
      }
      if (!builtIns.length && !reusable.length) { const empty = document.createElement("p"), clear = document.createElement("button");
        empty.id = "schema-property-rule-empty"; empty.textContent = "No compatible rules match this search"; clear.type = "button"; clear.textContent = "Clear search";
        const clearSearch = ():void => { ruleController.pickerSearch = ""; renderSchemaPropertyRulePicker(); }; clear.addEventListener("click", clearSearch);
        ruleController.ownPicker(() => clear.removeEventListener("click", clearSearch)); results.append(empty, clear); }
      else results.append(create, library);
      const cancelPicker = ():void => closeSchemaPropertyRulePicker(), searchRules = ():void => { ruleController.pickerSearch = search.value; renderSchemaPropertyRulePicker(); };
      cancel.addEventListener("click", cancelPicker); search.addEventListener("input", searchRules); ruleController.ownPicker(() => cancel.removeEventListener("click", cancelPicker), () => search.removeEventListener("input", searchRules));
      schemaPropertyRulePicker.replaceChildren(heading, search, results, cancel); return;
    }
    const configuration = ruleController.configuration;
    const editLabel = ruleController.editingAttached ? `Edit ${ruleController.editingAttached.name ?? ruleController.editingAttached.id}` : "Create local rule";
    const form = document.createElement("form"), heading = document.createElement("h4"), context = document.createElement("p"), status = document.createElement("output"),
      parameters = document.createElement("fieldset");
    form.id = "schema-local-rule-configuration"; heading.id = "schema-property-rule-picker-heading";
    parameters.id = "schema-local-rule-parameters"; parameters.append(Object.assign(document.createElement("legend"), { textContent:"Rule parameters" }));
    heading.textContent = `${editLabel} for ${normalizedRulePickerPath(path)}`; context.textContent = `Local rule origin · ${normalizedRulePickerPath(path)} · ${configuration.ruleType.toLowerCase()} operator · type ${configuration.propertyType}`;
    status.id = "schema-local-rule-assistance";
    schemaPropertyRulePicker.setAttribute("aria-labelledby", heading.id);
    let createButton:HTMLButtonElement | undefined;
    const refreshValidation = ():void => { const validation = validateRuleConfiguration(configuration); status.textContent = validation.assistance;
      if (createButton) createButton.disabled = !validation.ready;
      form.dataset.ready = String(validation.ready); schemaPropertyRulePicker.dataset.conditionPreview = JSON.stringify({ propertyPath:normalizedRulePickerPath(path), operator:configuration.conditionGroupOperator,
        predicates:configuration.conditions }); };
    for (const control of ruleConfigurationControls(configuration.ruleType, configuration.propertyType)) {
      if (control.repeatable) continue; const input = control.inputType === "select" ? document.createElement("select") : document.createElement("input");
      input.id = `schema-local-rule-${control.key}`;
      if (control.inputType === "select") input.append(
        ...(control.key === "comparison"
          ? [Object.assign(document.createElement("option"), { value:"", textContent:"Choose comparison" })]
          : []),
        ...(control.choices ?? []).map((value) => Object.assign(document.createElement("option"), { value, textContent:value })),
      );
      else { const textInput = input as HTMLInputElement; textInput.type = control.inputType === "number" ? "number" : "text";
        if (control.minimum !== undefined) textInput.min = String(control.minimum); if (control.step !== undefined) textInput.step = String(control.step); }
      input.value = String(configuration[control.key]);
      const label = document.createElement("label"); label.htmlFor = input.id; label.textContent = control.label;
      const update = ():void => { (configuration as unknown as Record<string, unknown>)[control.key] = input.value; refreshValidation(); };
      input.addEventListener(control.inputType === "select" ? "change" : "input", update); ruleController.ownPicker(() => input.removeEventListener(control.inputType === "select" ? "change" : "input", update)); parameters.append(label, input);
    }
    if (!ruleConfigurationControls(configuration.ruleType, configuration.propertyType).length) parameters.append(Object.assign(document.createElement("p"), { textContent:"No parameter controls" }));
    const allowedValues = configuration.ruleType === "Allowed values" ? document.createElement("fieldset") : undefined;
    if (allowedValues) allowedValues.id = "schema-local-rule-allowed-values";
    if (allowedValues) configuration.allowedValues.forEach((value, index) => { const input = document.createElement("input"), remove = document.createElement("button");
      input.id = `schema-local-rule-allowed-value-${index + 1}`; input.value = value; remove.type = "button"; remove.textContent = `Remove value ${index + 1}`;
      const update = ():void => { configuration.allowedValues[index] = input.value; refreshValidation(); };
      const removeValue = ():void => { configuration.allowedValues.splice(index, 1); renderSchemaPropertyRulePicker(); };
      input.addEventListener("input", update); remove.addEventListener("click", removeValue);
      ruleController.ownPicker(() => input.removeEventListener("input", update), () => remove.removeEventListener("click", removeValue)); allowedValues.append(input, remove); });
    if (configuration.ruleType === "Allowed values") { const add = document.createElement("button"); add.type = "button"; add.textContent = "Add another value";
      const addValue = ():void => { configuration.allowedValues.push(""); renderSchemaPropertyRulePicker(); }; add.addEventListener("click", addValue);
      ruleController.ownPicker(() => add.removeEventListener("click", addValue)); allowedValues?.append(add); parameters.append(allowedValues!); }
    const severity = document.createElement("select"), message = document.createElement("input"), enabled = document.createElement("input"),
      severityLabel = document.createElement("label"), messageLabel = document.createElement("label"), enabledLabel = document.createElement("label");
    severity.id = "schema-local-rule-severity"; severity.append(...["error", "warning"].map((value) => Object.assign(document.createElement("option"), { value, textContent:value })));
    severity.value = configuration.severity; message.id = "schema-local-rule-message"; message.value = configuration.message;
    enabled.id = "schema-local-rule-enabled"; enabled.type = "checkbox"; enabled.checked = configuration.enabled;
    severityLabel.htmlFor = severity.id; severityLabel.textContent = "Severity"; messageLabel.htmlFor = message.id; messageLabel.textContent = "Issue message (optional)"; enabledLabel.append(enabled, " Enabled");
    const changeSeverity = ():void => { configuration.severity = severity.value; refreshValidation(); }, changeMessage = ():void => { configuration.message = message.value; },
      changeEnabled = ():void => { configuration.enabled = enabled.checked; };
    severity.addEventListener("change", changeSeverity); message.addEventListener("input", changeMessage); enabled.addEventListener("change", changeEnabled);
    ruleController.ownPicker(() => severity.removeEventListener("change", changeSeverity), () => message.removeEventListener("input", changeMessage), () => enabled.removeEventListener("change", changeEnabled));
    const conditional = document.createElement("input"), reusable = document.createElement("input"), conditionalLabel = document.createElement("label"), reusableLabel = document.createElement("label"); conditional.id = "schema-local-rule-conditional"; conditional.type = "checkbox"; conditional.checked = configuration.applyOnlyWhen;
    reusable.id = "schema-local-rule-reusable"; reusable.type = "checkbox"; reusable.checked = configuration.saveReusable;
    conditionalLabel.append(conditional, " Apply only when"); reusableLabel.append(reusable, " Save as reusable rule in Rule Library");
    const changeConditional = ():void => { configuration.applyOnlyWhen = conditional.checked; if (conditional.checked && !configuration.conditions.length)
      configuration.conditions.push(initialConditionPredicate(path).predicates[0]!); renderSchemaPropertyRulePicker(); };
    const changeReusable = ():void => { configuration.saveReusable = reusable.checked; renderSchemaPropertyRulePicker(); };
    conditional.addEventListener("change", changeConditional); reusable.addEventListener("change", changeReusable);
    ruleController.ownPicker(() => conditional.removeEventListener("change", changeConditional), () => reusable.removeEventListener("change", changeReusable));
    form.append(heading, context, parameters, severityLabel, severity, messageLabel, message, enabledLabel, conditionalLabel);
    if (configuration.applyOnlyWhen) {
      const conditions = document.createElement("fieldset"), group = document.createElement("select");
      conditions.id = "schema-local-rule-conditions"; group.id = "schema-local-rule-condition-group"; group.value = configuration.conditionGroupOperator;
      conditions.append(Object.assign(document.createElement("legend"), { textContent:"Apply only when" }));
      group.append(...["All", "Any"].map((value) => Object.assign(document.createElement("option"), { value, textContent:value })));
      group.value = configuration.conditionGroupOperator;
      const changeGroup = ():void => { configuration.conditionGroupOperator = group.value === "Any" ? "Any" : "All"; refreshValidation(); };
      group.addEventListener("change", changeGroup); ruleController.ownPicker(() => group.removeEventListener("change", changeGroup)); conditions.append(group);
      configuration.conditions.forEach((predicate, index) => { const property = document.createElement("select"), operator = document.createElement("select"), comparison = document.createElement("input"), remove = document.createElement("button");
        const editable = library.draft ?? schemaEditorDraft(active());
        property.id = `schema-local-rule-condition-property-${index}`;
        property.append(Object.assign(document.createElement("option"), { value:"", textContent:"Choose a condition property" }),
          ...schemaDocumentPaths(editable.document).filter((candidate) => normalizedRulePickerPath(candidate) !== normalizedRulePickerPath(path))
            .map((candidate) => Object.assign(document.createElement("option"), { value:normalizedRulePickerPath(candidate), textContent:normalizedRulePickerPath(candidate) })));
        property.value = predicate.propertyPath; operator.id = `schema-local-rule-condition-operator-${index}`;
        operator.append(...operatorsForConditionType(predicate.detectedType ?? "string").map((value) => Object.assign(document.createElement("option"), { value, textContent:value })));
        operator.value = predicate.operator;
        comparison.id = `schema-local-rule-condition-value-${index}`; comparison.value = predicate.comparison ? String(predicate.comparison.value ?? "") : ""; remove.id = `schema-local-rule-condition-remove-${index}`; remove.type = "button"; remove.textContent = `Remove condition ${index + 1}`;
        const changeProperty = ():void => { const sample = valueAtSchemaPath(currentConditionPayload(), property.value), detectedType = schemaPropertyType(editable.document, property.value) ?? "string";
          const comparable = sample.exists && (sample.value === null || ["string", "number", "boolean"].includes(typeof sample.value));
          configuration.conditions[index] = { propertyPath:property.value, operator:comparable ? "Equals" : "Exists", detectedType,
            ...(comparable ? { comparison:typedComparisonValue(sample.value as string | number | boolean | null) } : {}) }; renderSchemaPropertyRulePicker(); };
        const changeOperator = ():void => { predicate.operator = operator.value as typeof predicate.operator; if (predicate.operator === "Exists" || predicate.operator === "Does not exist") delete predicate.comparison; renderSchemaPropertyRulePicker(); };
        const changeComparison = ():void => { const value = comparisonValueFromInput(comparison.value, predicate.detectedType ?? "string"); if (value) predicate.comparison = value; else delete predicate.comparison; refreshValidation(); };
        const removeCondition = ():void => { configuration.conditions.splice(index, 1); renderSchemaPropertyRulePicker(); };
        property.addEventListener("change", changeProperty); operator.addEventListener("change", changeOperator); comparison.addEventListener("input", changeComparison); remove.addEventListener("click", removeCondition);
        ruleController.ownPicker(() => property.removeEventListener("change", changeProperty), () => operator.removeEventListener("change", changeOperator),
          () => comparison.removeEventListener("input", changeComparison), () => remove.removeEventListener("click", removeCondition)); conditions.append(property, operator, comparison, remove); });
      const add = document.createElement("button"); add.id = "schema-local-rule-condition-add"; add.type = "button"; add.textContent = "Add condition"; const addCondition = ():void => { configuration.conditions.push(initialConditionPredicate(path).predicates[0]!); renderSchemaPropertyRulePicker(); };
      const preview = document.createElement("output"); preview.id = "schema-local-rule-current-preview";
      const applies = conditionGroupAppliesToValue(currentConditionPayload(), { operator:configuration.conditionGroupOperator, predicates:configuration.conditions });
      if (!applies) preview.textContent = "Current event preview: Not applicable";
      else { const observed = valueAtSchemaPath(currentConditionPayload(), path), measured = configuration.ruleType === "Item count" && Array.isArray(observed.value) ? observed.value.length
        : configuration.ruleType === "Text length" && typeof observed.value === "string" ? observed.value.length : undefined;
        const passed = measured === undefined ? observed.exists : configuration.comparison !== "" && cardinalityComparisonPasses(measured, configuration.comparison, Number(configuration.limit));
        preview.textContent = `Current event preview: ${passed ? "Passed" : "Failed"}`; }
      add.addEventListener("click", addCondition); ruleController.ownPicker(() => add.removeEventListener("click", addCondition)); conditions.append(add, preview); form.append(conditions);
    }
    if (!ruleController.editingAttached) form.append(reusableLabel);
    if (!ruleController.editingAttached && configuration.saveReusable) { const explanation = document.createElement("p"), name = document.createElement("input"), description = document.createElement("textarea");
      explanation.id = "schema-local-rule-reusable-explanation"; explanation.textContent = "This reusable rule will be available to other library.schemas."; name.id = "schema-local-rule-name"; name.value = configuration.reusableName;
      name.required = true;
      description.id = "schema-local-rule-description"; description.value = configuration.description; const changeName = ():void => { configuration.reusableName = name.value; refreshValidation(); }, changeDescription = ():void => { configuration.description = description.value; };
      name.addEventListener("input", changeName); description.addEventListener("input", changeDescription); ruleController.ownPicker(() => name.removeEventListener("input", changeName), () => description.removeEventListener("input", changeDescription)); form.append(explanation, name, description); }
    const back = document.createElement("button"), cancel = document.createElement("button"), create = document.createElement("button"); back.type = cancel.type = "button"; create.type = "submit";
    back.textContent = "Back to rule choices"; cancel.textContent = "Cancel"; create.textContent = ruleController.editingAttached ? "Save changes" : "Create rule"; createButton = create;
    const goBack = ():void => { ruleController.configuration = undefined; renderSchemaPropertyRulePicker(); }, cancelEdit = ():void => closeSchemaPropertyRulePicker();
    const submit = (event:Event):void => { event.preventDefault(); if (validateRuleConfiguration(configuration).ready) createConfiguredSchemaRule(); };
    back.addEventListener("click", goBack); cancel.addEventListener("click", cancelEdit); form.addEventListener("submit", submit);
    ruleController.ownPicker(() => back.removeEventListener("click", goBack), () => cancel.removeEventListener("click", cancelEdit), () => form.removeEventListener("submit", submit));
    form.append(status, create, ...(ruleController.editingAttached ? [] : [back]), cancel); schemaPropertyRulePicker.replaceChildren(form); refreshValidation();
  };
  function openSchemaPropertyRulePicker(path: string, trigger?: HTMLButtonElement): void {
    if (canonicalController.editor && !canonicalController.editor.key.startsWith("saved:") && openCompactCanonicalRuleEditor(path, trigger)) return;
    ruleController.pickerPath = path; ruleController.pickerTrigger = trigger; propertyController.selectedPath = path;
    propertyController.interactionReturn = { schemaId:active().id, path, triggerLabel:trigger?.ariaLabel ?? `Add rule for ${path}`,
      editorScroll:schemaEditor?.scrollTop ?? 0, treeScroll:schemaPropertyTree?.scrollTop ?? 0, detailScroll:schemaDetail?.scrollTop ?? 0 };
    ruleController.configuration = undefined;
    renderSchemaLocalRuleConfiguration(); schemaPropertyRulePicker?.showModal();
    schemaPropertyRulePicker?.querySelector<HTMLInputElement>("#schema-property-rule-search")?.focus({ preventScroll:true });
  }
  function closeSchemaPropertyRulePicker(): void {
    const triggerLabel = ruleController.pickerTrigger?.getAttribute("aria-label") ?? propertyController.interactionReturn?.triggerLabel;
    schemaPropertyRulePicker?.close();
    const currentTrigger = ruleController.pickerTrigger?.isConnected ? ruleController.pickerTrigger
      : Array.from(schemaPropertyTree?.querySelectorAll<HTMLButtonElement>("button") ?? [])
        .find((button) => button.getAttribute("aria-label") === triggerLabel);
    currentTrigger?.focus({ preventScroll:true });
    ruleController.pickerPath = undefined; ruleController.pickerTrigger = undefined; ruleController.configuration = undefined; ruleController.pickerSearch = "";
    ruleController.editingAttached = undefined; propertyController.interactionReturn = undefined;
  }
  const cancelSchemaPropertyRulePicker = (event: Event): void => { event.preventDefault(); closeSchemaPropertyRulePicker(); };
  const navigateSchemaPropertyRulePicker = (event: KeyboardEvent): void => {
    if (event.key === "Escape") { event.preventDefault(); closeSchemaPropertyRulePicker(); return; }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;
    const buttons = Array.from(schemaPropertyRulePicker?.querySelectorAll<HTMLButtonElement>("#schema-property-rule-results button:not(:disabled)") ?? []),
      index = buttons.indexOf(schemaOwnerDocument?.activeElement as HTMLButtonElement);
    if (event.key === "Enter" && index >= 0) { event.preventDefault(); buttons[index]?.click(); return; }
    if (!buttons.length || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
    event.preventDefault(); buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
  };
  const persistReusableSchemaRules = (): void => ruleController.persist();
  const applyPersistenceSnapshot = (nextSchemas: readonly SchemaDefinition[], nextRules: readonly ReusableSchemaRule[]): void => {
    library.schemas = structuredClone([...nextSchemas]); ruleController.rules = structuredClone([...nextRules]);
    ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary(library.schemas)); persistReusableSchemaRules();
    renderSchemas(); ruleController.render();
  };
  const restorePersistenceSnapshot = (nextSchemas: readonly SchemaDefinition[], nextRules: readonly ReusableSchemaRule[]): void => {
    library.schemas = structuredClone([...nextSchemas]); ruleController.rules = structuredClone([...nextRules]);
    persistReusableSchemaRules(); renderSchemas(); ruleController.render();
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
        restorePersistenceSnapshot(transaction.previousSchemas, transaction.previousRules); },
      complete() { if (transaction.settled || transaction.generation !== generation) return; transaction.settled = true;
        if (transaction.paused) applyPersistenceSnapshot(transaction.nextSchemas, transaction.nextRules);
        if (pendingLocalRulePromotionPersistence === transaction) pendingLocalRulePromotionPersistence = undefined;
        if (pendingGuidedValidationPersistence === transaction) pendingGuidedValidationPersistence = undefined;
        resolveCompletion(); },
      reject(error) { if (transaction.settled || transaction.generation !== generation) return; transaction.settled = true;
        restorePersistenceSnapshot(transaction.previousSchemas, transaction.previousRules);
        if (pendingLocalRulePromotionPersistence === transaction) pendingLocalRulePromotionPersistence = undefined;
        if (pendingGuidedValidationPersistence === transaction) pendingGuidedValidationPersistence = undefined;
        rejectCompletion(error); },
    };
    if (kind === "promotion") pendingLocalRulePromotionPersistence = transaction;
    else pendingGuidedValidationPersistence = transaction;
    return completion;
  };
  const settleSchemaPersistence = (event: SchemaPersistenceEvent): void | Promise<void> => {
    if (propertyController.pendingCopyPosition && propertyController.pendingCopyPosition.settlementSchemaId === event.schemaId
      && (event.type === "saved" || event.type === "retried" || event.type === "rejected")) {
      const restoration = propertyController.pendingCopyPosition;
      const restoreCopyPosition = ():void => {
        schemaPropertyTree?.querySelector<HTMLElement>(`button[aria-label="Copy ${restoration.path} to another schema"]`)?.focus({ preventScroll:true });
        if (schemaEditor) schemaEditor.scrollTop = restoration.editorScroll;
        if (schemaPropertyTree) schemaPropertyTree.scrollTop = restoration.treeScroll;
      };
      queueMicrotask(restoreCopyPosition); ports.scheduleFrame(() => { restoreCopyPosition(); ports.scheduleFrame(() => {
        restoreCopyPosition(); if (propertyController.pendingCopyPosition === restoration) propertyController.pendingCopyPosition = undefined;
      }); });
    }
    if (event.type === "retried" && canonicalController.editor && canonicalController.projectionRequest?.adapter === canonicalController.editor
      && canonicalController.savedSchemaId(canonicalController.editor) === event.schemaId) {
      return canonicalController.resumeProjectionPersistence(canonicalController.editor).then(() => { renderSchemas(); renderCompactCanonicalEditor(); });
    }
    if (event.type === "saved") {
      const acknowledged = [...canonicalController.settlementClaims]
        .find(([, schemaId]) => schemaId === event.schemaId)?.[0];
      if (acknowledged !== undefined) clearCompactCanonicalSettlement(event.schemaId, acknowledged);
      if (canonicalController.editor) renderCompactCanonicalEditor();
    }
    if (canonicalController.settlementSchemaId === event.schemaId) {
      if (event.type === "retried" || event.type === "rejected") {
        clearCompactCanonicalSettlement(event.schemaId);
        if (event.type === "rejected") {
          canonicalController.pendingCommand = undefined; canonicalController.pendingBase = undefined;
          canonicalController.projectionRequest = undefined; canonicalController.commandFeedback = "Durable schema change rejected; the saved state was restored.";
        }
        if (canonicalController.editor) renderCompactCanonicalEditor();
      }
    }
    const pendingTransactions = [pendingLocalRulePromotionPersistence, pendingGuidedValidationPersistence];
    const transactional = pendingTransactions.some((pending) => pending?.schemaId === event.schemaId && !pending.settled);
    if (event.type === "failed" && !transactional && canonicalController.settlementSchemaId !== event.schemaId) {
      library.reload();
      if (library.activeSchemaId) {
        const activeStored = library.schemas.find(({ id }) => id === library.activeSchemaId);
        if (activeStored) {
          library.draft = schemaEditorDraft(activeStored);
          canonicalController.savedDocument = savedSchemaCanonicalDocument(library.draft,
            (kind) => `schema:${kind}:${++canonicalController.idSequence}`);
        }
      }
      renderSchemas();
    }
    for (const pending of pendingTransactions) {
      if (!pending || pending.schemaId !== event.schemaId || pending.settled) continue;
      if (event.type === "failed") { if (pending.kind === "guided") pending.pause(); continue; }
      if (event.type === "rejected") pending.reject(event.error);
      else pending.complete();
    }
  };
  function restoreLocalRulePromotionPresentation(ruleId?: string, rerender = true): void {
    if (ruleController.pendingPromotion) ruleController.promotionFocusReturn = {
      propertyPath:ruleController.pendingPromotion.propertyPath, ruleId:ruleId ?? ruleController.pendingPromotion.sourceRuleId,
      detailScroll:ruleController.pendingPromotion.detailScroll };
    ruleController.pendingPromotion = undefined;
    if (rerender) { renderSchemas(); ruleController.render(); }
    const focusReturn = ruleController.promotionFocusReturn ? { ...ruleController.promotionFocusReturn } : undefined;
    if (focusReturn) {
      const restoreDetailScroll = ():void => {
        if (schemaDetail && schemaDetail.scrollTop !== focusReturn.detailScroll) schemaDetail.scrollTop = focusReturn.detailScroll;
      };
      schemaDetail?.addEventListener("scroll", restoreDetailScroll);
      restoreDetailScroll();
      ports.scheduleFrame(() => {
        restoreDetailScroll();
        ports.scheduleFrame(() => {
          Array.from(ports.root.querySelectorAll<HTMLElement>("button[data-rule-id]"))
            .find(({ dataset }) => dataset.ruleId === focusReturn.ruleId && dataset.propertyPath === focusReturn.propertyPath)
            ?.focus({ preventScroll:true });
          restoreDetailScroll();
          schemaDetail?.removeEventListener("scroll", restoreDetailScroll);
        });
      });
    }
  }
  function openLocalRulePromotionReview(propertyPath: string, sourceRuleId: string): boolean {
    const storedSchema = library.activeSchemaId ? active() : undefined, schema = storedSchema ?? library.draft; if (!schema) return false;
    const editorContext = storedSchema ? "editable" as const : "new-schema" as const;
    const generation = ++persistenceGeneration;
    let review: ReturnType<typeof reviewLocalRulePromotion>;
    try { review = reviewLocalRulePromotion({ schema, reusableRules:promotionReusableRules(), propertyPath, sourceRuleId, editorContext }); }
    catch (error) { if (schemaResult) schemaResult.textContent = error instanceof Error ? error.message : "Promotion is no longer available."; return false; }
    const focusedPosition = ruleController.promotionFocusedPosition?.propertyPath === propertyPath
      && ruleController.promotionFocusedPosition.ruleId === sourceRuleId ? ruleController.promotionFocusedPosition : undefined;
    ruleController.pendingPromotion = { propertyPath, sourceRuleId, generation,
      detailScroll:focusedPosition?.detailScroll ?? schemaDetail?.scrollTop ?? 0 };
    ruleController.promotionFocusReturn = undefined;
    localRulePromotionDialog.open({ review,
      cancel:() => { if (ruleController.pendingPromotion?.generation === generation) restoreLocalRulePromotionPresentation(undefined, false); },
      confirm:(selected: LocalRulePromotionSelection) => {
        if (ruleController.pendingPromotion?.generation !== generation) throw new Error("The promotion review is stale");
        const previousSchemas = structuredClone(library.schemas), previousRules = structuredClone(ruleController.rules);
        const result = selected.action === "create"
          ? promoteLocalRule({ schema, reusableRules:promotionReusableRules(), propertyPath, sourceRuleId, editorContext, ...selected })
          : promoteLocalRule({ schema, reusableRules:promotionReusableRules(), propertyPath,
            sourceRuleId, editorContext, action:"use-existing", reusableRuleId:selected.reusableRuleId });
        const nextSchemas = storedSchema ? library.schemas.map((candidate) => candidate.id === result.schema.id ? result.schema : candidate) : library.schemas;
        const nextRules = storedPromotionRules(result.reusableRules);
        if (!storedSchema) {
          ruleController.rules = structuredClone([...nextRules]); library.draft = structuredClone(result.schema);
          persistReusableSchemaRules(); renderSchemaDraft(); ruleController.render(); restoreLocalRulePromotionPresentation(); return;
        }
        const completion = beginSchemaPersistence("promotion", result.schema.id, previousSchemas, previousRules, nextSchemas, nextRules);
        persistLocalRulePromotion(ports.storage, { schemaKey:SCHEMA_LIBRARY_STORAGE_KEY,
          schemaValue:serializeSchemaLibrary(nextSchemas), ruleKey:SCHEMA_RULE_STORAGE_KEY, ruleValue:JSON.stringify(nextRules) });
        library.schemas = structuredClone(nextSchemas); ruleController.rules = structuredClone([...nextRules]); renderSchemas(); ruleController.render();
        return completion.then(async () => { await ports.settleCanonical?.(result.schema.id);
          const focusReplacement = () => Array.from(schemaOwnerDocument?.querySelectorAll?.<HTMLElement>("button[data-rule-id]")
            ?? ports.root.querySelectorAll<HTMLElement>("button[data-rule-id]"))
            .find(({ dataset }) => dataset.ruleId === result.replacementRuleId && dataset.propertyPath === propertyPath)
            ?.focus({ preventScroll:true });
          ports.scheduleFrame(() => ports.scheduleFrame(focusReplacement));
          return () => {
            if (ruleController.pendingPromotion?.generation === generation) {
              if (schemaResult) schemaResult.textContent = `Promoted ${sourceRuleId} to reusable rule ${result.replacementRuleId}.`;
              restoreLocalRulePromotionPresentation(result.replacementRuleId);
            }
            ports.scheduleFrame(() => ports.scheduleFrame(focusReplacement));
          }; });
      },
    });
    return true;
  }
  function persistPublishedGuidedValidation(result: PublishedGuidedValidation): Promise<void> {
    const rule = result.schema.rules[0]; if (!rule) return Promise.resolve();
    const previousSchemas = structuredClone(library.schemas), previousRules = structuredClone(ruleController.rules);
    const previousSchema = result.destination.previousSchemaId ? library.schemas.find(({ id }) => id === result.destination.previousSchemaId) : undefined;
    const assignment: SchemaAssignment = { id:result.assignment.id, name:result.assignment.name, sourceId:result.assignment.sourceId,
      eventName:result.assignment.eventName, target:result.assignment.target, priority:result.assignment.priority,
      versionPolicy:result.assignment.versionPolicy, enabled:true,
      ...(result.assignment.domainCondition ? { domainCondition:result.assignment.domainCondition } : {}),
      ...(result.assignment.pathnameCondition ? { pathnameCondition:result.assignment.pathnameCondition } : {}),
      ...(result.assignment.pathConditions ? { pathConditions:result.assignment.pathConditions } : {}) };
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
    const nextSchemas = [...library.schemas.filter(({ id }) => id !== schema.id), schema];
    const published = result.reusableRules[0]; const nextRules = published ? [...ruleController.rules.filter(({ id }) => id !== published.id),
      { id:published.id, name:published.name, kind:attachedRule.operator ?? "required", version:published.version, enabled:published.enabled ?? true,
        attachments:[schema.id], ...(attachedRule.operator ? { operator:attachedRule.operator } : {}),
        ...(attachedRule.parameters ? { parameters:attachedRule.parameters } : {}), ...(attachedRule.allowedValues ? { allowedValues:attachedRule.allowedValues } : {}),
        ...(attachedRule.severity ? { severity:attachedRule.severity } : {}), ...(attachedRule.message ? { message:attachedRule.message } : {}),
        ...(attachedRule.conditionGroup ? { conditionGroup:attachedRule.conditionGroup } : {}) } satisfies ReusableSchemaRule] : ruleController.rules;
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
  const guidedSchemaCandidates = (event:GuidedCapturedEvent) => library.schemas.map((schema) => guidedSchemaCandidate(event, schema)).filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
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
    const selected = schema ?? selectedGuidedContinuation(guidedController.selections, event, library.schemas) ?? guidedSchemaCandidates(event)[0]?.schema;
    if (selected) persistGuidedContinuation(event, selected.id);
    guidedController.propertyReturn = undefined; if (guidedValidationRoot) { guidedValidationRoot.hidden = false;
      guidedValidationRoot.dataset.eventId = event.id; guidedValidationRoot.dataset.schemaId = selected?.id ?? ""; }
    guidedValidationFlow.open(guidedUiEvent(event), selected ? guidedUiCandidate(selected) : undefined);
  };
  const openGuidedValidationForProperty = async (event:GuidedCapturedEvent, schema:SchemaDefinition | undefined, propertyPath:string,
    returnToSchema=true):Promise<void> => {
    event = guidedEvent(event); if (schema) persistGuidedContinuation(event, schema.id);
    if (guidedValidationRoot) { guidedValidationRoot.hidden = false; guidedValidationRoot.dataset.eventId = event.id;
      guidedValidationRoot.dataset.schemaId = schema?.id ?? ""; }
    guidedValidationFlow.openProperty(guidedUiEvent(event), propertyPath, schema ? guidedUiCandidate(schema) : undefined);
    if (returnToSchema) guidedController.propertyReturn = schema ? { kind:"schema", schemaId:schema.id, propertyPath, generation:lifecycle.generation() } : undefined;
  };
  const guidedDraftContinuationForEvent = (event:GuidedCapturedEvent) => {
    const schema = selectedGuidedContinuation(guidedController.selections, event, library.schemas);
    return schema?.workingDraft ? { schemaId:schema.id, schemaName:schema.name, schemaVersion:schema.version, pendingChanges:schema.workingDraft.pendingChanges.length,
      addProperty:() => { guidedValidationFlow.open(guidedUiEvent(event), guidedUiCandidate(schema)); }, review:() => openGuidedDraft(schema),
      publish:() => { openGuidedDraft(schema); openSchemaRevisionReview(); }, useDifferent:() => openGuidedContinuationPicker(event) } : undefined;
  };
  const finishGuidedValidationSave = (result:PublishedGuidedValidation):void => {
    persistGuidedContinuation({ sourceId:result.assignment.sourceId, name:result.assignment.eventName }, result.schema.id);
    ports.guidedSaved?.(result.destination.kind === "new" ? `Draft ${result.schema.name} was created.` : `Validation was added to ${result.schema.name} draft.`);
    if (guidedController.propertyReturn?.generation === lifecycle.generation() && guidedController.propertyReturn.kind === "capture") {
      const snapshot=guidedController.propertyReturn;guidedController.propertyReturn=undefined;ports.restoreGuidedCapture(snapshot.eventId,snapshot.propertyPath);
    } else if (guidedController.propertyReturn?.generation === lifecycle.generation() && guidedController.propertyReturn.kind === "schema" && guidedController.propertyReturn.schemaId === result.schema.id) {
      restoreGuidedPropertyReturn();
    }
    if (schemaResult) schemaResult.textContent = result.destination.kind === "new" ? `Draft ${result.schema.name} was created.` : `Validation was added to ${result.schema.name} draft.`;
  };
  const renderSchemaValidationRecords = ():void => {
    if (!schemaValidationRecordList || !schemaOwnerDocument) return;
    validationController.clearRows();
    validationController.clearDialog();
    schemaValidationRecordList.replaceChildren(...validationController.records.map((record) => {
      const item = schemaOwnerDocument.createElement("li"), summary = schemaOwnerDocument.createElement("span"), continueButton = schemaOwnerDocument.createElement("button");
      summary.textContent = `${record.eventName} · ${record.state} · ${record.schemaName ? `${record.schemaName} v${record.schemaVersion} · ${record.target ?? "payload"}` : "No matching schema"}${record.assignmentId ? ` · assignment ${record.assignmentName ?? record.assignmentId} (${record.assignmentId})` : ""}${record.assignmentEvidence ? ` · ${record.assignmentEvidence}` : ""} · ${record.checkedAt}`;
      if (ports.prepareCapturedValidationContinuation) { continueButton.type = "button"; continueButton.textContent = "Continue in project";
        continueButton.disabled = !record.schemaId || !record.evaluated;
        const review = ():void => { void reviewCapturedValidationContinuation(record, continueButton); };
        continueButton.addEventListener("click", review); validationController.ownRow(() => continueButton.removeEventListener("click", review)); item.append(summary, continueButton); }
      else item.append(summary);
      return item;
    }));
  };
  async function reviewCapturedValidationContinuation(record:SchemaValidationRecord, trigger:HTMLButtonElement):Promise<void> {
    if (!ports.prepareCapturedValidationContinuation || !guidedValidationRoot || !schemaOwnerDocument || !lifecycle.isMounted()) return;
    const generation = lifecycle.generation(); let continuation:CapturedValidationContinuation;
    try { continuation = await ports.prepareCapturedValidationContinuation(structuredClone(record)); }
    catch (error) { if (lifecycle.isMounted() && generation === lifecycle.generation() && schemaResult) schemaResult.textContent = error instanceof Error ? error.message : String(error); return; }
    if (!lifecycle.isMounted() || generation !== lifecycle.generation()) return;
    validationController.clearDialog();
    const dialog = schemaOwnerDocument.createElement("dialog"), heading = schemaOwnerDocument.createElement("h4"), summary = schemaOwnerDocument.createElement("p"), review = schemaOwnerDocument.createElement("p"),
      name = schemaOwnerDocument.createElement("input"), confirm = schemaOwnerDocument.createElement("button"), cancel = schemaOwnerDocument.createElement("button");
    const select = (labelText:string, values:readonly {id:string;name:string}[], optional=false):HTMLSelectElement => { const label=schemaOwnerDocument!.createElement("label"), control=schemaOwnerDocument!.createElement("select");
      label.textContent=labelText; if(optional){const option=schemaOwnerDocument!.createElement("option");option.value="";option.textContent=`No ${labelText.toLowerCase()}`;control.append(option);}
      for(const value of values){const option=schemaOwnerDocument!.createElement("option");option.value=value.id;option.textContent=value.name;control.append(option);} if(!optional&&values[0])control.value=values[0].id;label.append(control);dialog.append(label);return control; };
    heading.textContent="Continue captured validation in project"; summary.textContent=continuation.summary; review.textContent=continuation.review;
    name.value=continuation.suggestedName; name.setAttribute("aria-label","Test case name"); dialog.append(heading,summary,review,name);
    const destination=select("Destination",[{id:"fixture",name:"Event validation Test case"},{id:"profile",name:"Profile requirements"}]), event=select("Event",continuation.events),
      page=select("Page",continuation.pages,true), step=select("Flow step",continuation.flowSteps,true), profile=select("Profile",continuation.profiles,true);
    confirm.type = cancel.type = "button"; confirm.textContent = "Create Test case and open in Specification Studio"; cancel.textContent = "Cancel";
    const close = (restoreFocus:boolean):void => { validationController.clearDialog(); dialog.close(); dialog.remove(); if(restoreFocus)trigger.focus({ preventScroll:true }); };
    const selectDestination = ():void => { const toProfile=destination.value==="profile";name.hidden=Boolean(toProfile);event.parentElement!.hidden=toProfile;page.parentElement!.hidden=toProfile;step.parentElement!.hidden=toProfile;
      confirm.textContent=toProfile?"Add requirements and open Profile":"Create Test case and open in Specification Studio"; };
    const confirmContinuation = ():void => { const toProfile=destination.value==="profile";if(toProfile&&!profile.value){summary.textContent="Choose a Profile for the evaluated requirements.";return;} confirm.disabled = true;
      void continuation.commit({destination:toProfile?"profile":"fixture",name:name.value.trim(),eventId:event.value,...(page.value?{pageId:page.value}:{}),...(step.value?{flowStepId:step.value}:{}),...(profile.value?{profileId:profile.value}:{})})
        .then(({entityName}) => { if (lifecycle.isMounted() && generation === lifecycle.generation()) { close(false); if(schemaResult)schemaResult.textContent=`Saved evaluated capture evidence in ${entityName}; opening it in Specification Studio.`; } },
          (error) => { if (lifecycle.isMounted() && generation === lifecycle.generation()){confirm.disabled=false;summary.textContent=error instanceof Error?error.message:String(error);} }); };
    const cancelContinuation=():void=>close(true);
    destination.addEventListener("change", selectDestination); confirm.addEventListener("click", confirmContinuation); cancel.addEventListener("click", cancelContinuation);
    validationController.ownDialog(() => destination.removeEventListener("change", selectDestination),
      () => confirm.removeEventListener("click", confirmContinuation), () => cancel.removeEventListener("click", cancelContinuation), () => { dialog.close(); dialog.remove(); });
    dialog.append(confirm, cancel); guidedValidationRoot.replaceChildren(dialog); dialog.showModal(); name.focus({preventScroll:true});
  }
  const recheckCapturedSchemaValidation = (events:readonly GuidedCapturedEvent[] = []):readonly SchemaValidationRecord[] => {
    const checkedAt = new Date().toISOString(), issues:string[] = [];
    const records = events.map((event):SchemaValidationRecord => { const override = validationController.manualOverrides[event.id], candidates = override ? library.schemas.filter(({ id }) => id === override) : library.schemas;
      const result = validateEvent({ sourceId:event.sourceId, eventName:event.name, payload:event.payload, rawInput:event.rawInput }, candidates, event.pageUrl);
      issues.push(...result.issues.map((issue) => `${event.name} · ${issue.instancePath || "root"} · ${issue.message}`));
      return { eventId:event.id, eventName:event.name, state:result.state, checkedAt, ...(result.schema ? { schemaId:result.schema.id, schemaName:result.schema.name,
        schemaVersion:result.schema.version } : {}), issueCodes:result.issues.map((issue) => issue.rule ?? issue.schemaLocation) }; });
    validationController.replaceRecords([...validationController.records, ...records]);
    schemaValidationIssues?.replaceChildren(...issues.map((textContent) => Object.assign(schemaOwnerDocument!.createElement("li"), { textContent })));
    renderSchemaValidationRecords(); if (schemaResult) schemaResult.textContent = events.length ? `Rechecked ${events.length} captured events.` : "No captured events are available to recheck.";
    return structuredClone(records);
  };
  const recheckCapturedSchemaValidationFromControl = ():void => { recheckCapturedSchemaValidation(); };
  const createSchemaDraft = ():void => {
    const created = createSchema("", 1, { type:"object" }), transient:SchemaDefinition = { ...created, published:false,
      workingDraft:{ name:"", baseVersion:1, sourceVersion:1, document:{ type:"object" }, assignments:[], pendingChanges:[] } };
    library.activeSchemaId = undefined; library.draft = transient; propertyController.selectedPath = ""; renderSchemas(); schemaEditorName?.focus({ preventScroll:true });
  };
  function schemaDocumentPaths(document:SchemaDefinition["document"]):readonly string[] { return schemaPropertyRows(document).map(({ canonicalPath }) => canonicalPath); }
  function schemaPropertyAt(document:SchemaDefinition["document"], path:string):unknown { return schemaPropertyRows(document).find(({ canonicalPath }) => canonicalPath === normalizedRulePickerPath(path))?.schema; }
  function schemaDocumentFromValue(value:unknown):SchemaDefinition["document"] {
    if (Array.isArray(value)) return { type:"array", items:value.length ? schemaDocumentFromValue(value[0]) : {} };
    if (!value || typeof value !== "object") return { type:typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string" };
    return { type:"object", properties:Object.fromEntries(Object.entries(value).map(([name, child]) => [name, schemaDocumentFromValue(child)])) };
  }
  function openSchemaFromSource(source:SchemaSourceDraftInput):SchemaDefinition {
    const inferred = schemaDocumentFromValue(source.payload), document:SchemaDefinition["document"] = inferred.type === "object"
      ? inferred : { type:"object", properties:{ value:inferred } };
    const assignment:SchemaAssignment = { sourceId:source.sourceId, eventName:source.eventName, target:"payload" };
    const created = createSchema(`${source.name} schema`, 1, document), schema:SchemaDefinition = { ...created, published:false,
      assignments:[assignment], workingDraft:{ baseVersion:1, sourceVersion:1, document:structuredClone(document),
        assignments:[assignment], pendingChanges:["Create schema from captured source"] } };
    library.activeSchemaId = undefined; library.draft = schema; propertyController.selectedPath = Object.keys(document.properties ?? {})[0] ?? "value";
    ports.showSchemasView(); renderSchemas(); if (schemaResult) schemaResult.textContent = `${source.label} fields loaded into a new schema draft.`;
    schemaEditorName?.focus({ preventScroll:true }); return structuredClone(schema);
  }
  function openNewSchemaEditor():void { editorRoute.open(createSchemaButton ?? undefined); createSchemaDraft(); }
  function defineSchemaProperty(document:SchemaDefinition["document"], definition:ManualPropertyDefinition):SchemaDefinition["document"] {
    return addManualProperty(document, [], definition);
  }
  function schemaPropertyType(document:SchemaDefinition["document"], path:string):SchemaPropertyType | undefined {
    const value = schemaPropertyAt(document, path) as { type?:SchemaPropertyType } | undefined; return value?.type;
  }
  function captureSchemaPropertyInteractionReturn(path:string, triggerLabel:string):void { propertyController.interactionReturn = { schemaId:active().id,
    path, triggerLabel, editorScroll:schemaEditor?.scrollTop ?? 0, treeScroll:schemaPropertyTree?.scrollTop ?? 0, detailScroll:schemaDetail?.scrollTop ?? 0 }; }
  function restoreSchemaPropertyInteractionReturn():void { const restoration = propertyController.interactionReturn; if (!restoration || restoration.schemaId !== library.activeSchemaId) return;
    propertyController.selectedPath = restoration.path; if (schemaEditor) schemaEditor.scrollTop = restoration.editorScroll;
    schemaPropertyTree && (schemaPropertyTree.scrollTop = restoration.treeScroll); schemaDetail && (schemaDetail.scrollTop = restoration.detailScroll); renderSchemas(); }
  function finishSchemaPropertyInteractionReturn():void { restoreSchemaPropertyInteractionReturn(); propertyController.interactionReturn = undefined; }
  function closeSchemaPropertyRulePickerInternal(restore=true):void { if (restore) finishSchemaPropertyInteractionReturn(); closeSchemaPropertyRulePicker(); }
  function closeSchemaPropertyRulePickerForCommit():void { closeSchemaPropertyRulePickerInternal(true); }
  const expansionReusableRules = ():readonly PromotableReusableRule[] => structuredClone(ruleController.rules) as readonly PromotableReusableRule[];
  const promotionReusableRules = expansionReusableRules;
  const storedReusableRule = (id:string):ReusableSchemaRule | undefined => ruleController.rules.find((rule) => rule.id === id);
  const persistSchemaAndRuleLibraries = ():void => { persistSchemaLibrary(); persistReusableSchemaRules(); };
  const schemaRuleTypeForAttachment = (schema:SchemaDefinition, propertyPath:string):SchemaPropertyType => {
    const row = schemaPropertyRows(schema.workingDraft?.document ?? schema.document).find(({ canonicalPath }) => canonicalPath === normalizedRulePickerPath(propertyPath));
    return (["string", "number", "array", "object", "boolean"] as const).includes(row?.schema.type as SchemaPropertyType)
      ? row!.schema.type as SchemaPropertyType : "string";
  };
  const attachReusableRule = (schemaId:string, ruleId:string, propertyPath?:string, suppliedRule?:ReusableSchemaRule):boolean => {
    const rule = suppliedRule ?? storedReusableRule(ruleId), storedSchema = library.schemas.find(({ id }) => id === schemaId),
      schema = storedSchema ?? (library.draft?.id === schemaId ? library.draft : undefined); if (!rule || !schema) return false;
    if (propertyPath && !applicablePropertyTypesForRule(rule).includes(schemaRuleTypeForAttachment(schema, propertyPath))) return false;
    const canonicalPropertyPath = propertyPath ? normalizedRulePickerPath(propertyPath) : undefined;
    const sourceRules = schema.workingDraft?.attachedRules ?? schema.attachedRules ?? [], attachedRules = [...sourceRules
      .filter((attached) => attached.id !== rule.id || normalizedRulePickerPath(attached.propertyPath ?? "") !== canonicalPropertyPath), { id:rule.id, name:rule.name, version:rule.version,
        ...(canonicalPropertyPath ? { propertyPath:canonicalPropertyPath } : {}), ...(rule.operator ? { operator:rule.operator } : {}),
        ...(rule.parameters ? { parameters:rule.parameters } : {}), ...(rule.severity ? { severity:rule.severity } : {}),
        ...(rule.allowedValues ? { allowedValues:structuredClone(rule.allowedValues) } : {}), ...(rule.comparison ? { comparison:rule.comparison } : {}),
        ...(rule.limit !== undefined ? { limit:rule.limit } : {}), ...(rule.applicableType ? { applicableType:rule.applicableType } : {}),
        ...(rule.message ? { message:rule.message } : {}), ...(rule.conditionGroup ? { conditionGroup:structuredClone(rule.conditionGroup) } : {}), enabled:rule.enabled }];
    const updated = updateSchemaWorkingDraft(schema, { attachedRules }, `Attach ${rule.name} to ${propertyPath ?? "schema"}`);
    if (!storedSchema) { library.draft = structuredClone(updated); renderSchemaDraft(); return true; }
    library.schemas = library.schemas.map((candidate) => candidate.id === schemaId ? updated : candidate); library.draft = schemaEditorDraft(updated);
    persistSchemaAndRuleLibraries(); renderSchemas(); return true;
  };
  const updateAttachedRule = (schemaId:string, ruleId:string, enabled:boolean):boolean => {
    let changed = false; library.schemas = library.schemas.map((schema) => { if (schema.id !== schemaId || !schema.attachedRules) return schema;
      return { ...schema, attachedRules:schema.attachedRules.map((rule) => { if (rule.id !== ruleId) return rule; changed = true; return { ...rule, enabled }; }) }; });
    if (changed) { persistSchemaAndRuleLibraries(); renderSchemas(); } return changed;
  };
  const attachedSchemaRuleType = (rule:NonNullable<SchemaDefinition["attachedRules"]>[number]):RuleConfiguration["ruleType"] => {
    const operator = rule.operator?.replaceAll("_", "-").toLowerCase();
    if (operator === "exact-value") return "Exact value"; if (operator === "allowed-values") return "Allowed values";
    if (operator === "regular-expression" || operator === "regex") return "Regular expression"; if (operator === "text-length") return "Text length";
    if (operator === "digits-only") return "Digits only"; if (operator === "numeric-range") return "Numeric range";
    if (operator === "item-count") return "Item count"; if (operator === "allow-undeclared-properties") return "Allow undeclared properties"; return "Required";
  };
  const openAttachedSchemaRuleEditor = (schemaId:string, ruleId:string, path?:string, trigger?:HTMLButtonElement):boolean => {
    const schema = library.schemas.find(({ id }) => id === schemaId), attached = (schema?.workingDraft?.attachedRules ?? schema?.attachedRules)?.find(({ id }) => id === ruleId);
    if (!schema || !attached) return false;
    if (storedReusableRule(ruleId)) { showSchemaSubview("schema-rule-library"); return ruleController.edit(ruleId); }
    const propertyPath = path ?? attached.propertyPath ?? ""; propertyController.selectedPath = ruleController.pickerPath = propertyPath; ruleController.pickerTrigger = trigger;
    ruleController.editingAttached = attached; ruleController.configuration = createRuleConfigurationFromAttachedRule(attachedSchemaRuleType(attached), schemaRuleTypeForAttachment(schema, propertyPath), attached);
    renderSchemaPropertyRulePicker(); schemaPropertyRulePicker?.showModal(); schemaPropertyRulePicker?.querySelector<HTMLElement>("input, select, textarea, button")?.focus({ preventScroll:true }); return true;
  };
  const focusSchemaPropertyRule = (propertyPath:string):void => { propertyController.selectedPath = propertyPath.replace(/^\//, "").replaceAll("/", "."); renderSchemas(); };
  const focusSchemaPropertyRow = focusSchemaPropertyRule;
  const renderSchemaWorkflowRows = ():void => { ruleController.render(); assignmentController.render(); };
  const rememberCompactCanonicalScroll = ():void => { if (canonicalController.editor && schemaDetail && schemaDetail.scrollTop > 0)
    canonicalController.scrollByKey.set(canonicalController.editor.key, schemaDetail.scrollTop); };
  let sidePanelLayeredProfileEditor:{ dispose():void } | undefined;
  const guidedValidationFlow = createGuidedValidationFlow(guidedValidationRoot, {
    schemaCandidates:() => library.schemas.map(guidedUiCandidate),
    publish:persistPublishedGuidedValidation,
    close:() => { if (guidedValidationRoot) { guidedValidationRoot.hidden = true; guidedValidationRoot.removeAttribute("data-event-id");
      guidedValidationRoot.removeAttribute("data-schema-id"); } restoreGuidedPropertyReturn(); },
    saved:finishGuidedValidationSave,
  });
  return {
    mount(): void {
      if (!lifecycle.mount()) return;
      editorRoute.mount();
      sidePanelLayeredProfileEditor = ports.mountLayeredProfileEditor();
      lifecycle.listen(schemaSearch, "input", updateSchemaTreeView);
      lifecycle.listen(createSchemaButton, "click", openNewSchemaEditor);
      lifecycle.listen(recheckSchemaValidationButton, "click", recheckCapturedSchemaValidationFromControl);
      lifecycle.listen(schemaCategoryFilter, "change", updateSchemaTreeView);
      lifecycle.listen(schemaTreeScrollOwner, "scroll", persistSchemaTreeScroll, { passive:true });
      lifecycle.listen(schemaList, "keydown", navigateSchemaTree);
      lifecycle.listen(schemaDetail, "scroll", rememberCompactCanonicalScroll);
      lifecycle.listen(schemaEditorName, "input", updateSchemaEditorName);
      lifecycle.listen(saveSchemaDescriptionButton, "click", saveSchemaDescription);
      lifecycle.listen(schemaEditorTarget, "input", updateSchemaTarget);
      lifecycle.listen(schemaEditorParent, "change", changeSchemaParent);
      lifecycle.listen(schemaOnlyDeclaredProperties, "change", changeOnlyDeclaredProperties);
      lifecycle.listen(saveSchemaButton, "click", openSchemaRevisionReview);
      lifecycle.listen(confirmSchemaRevisionButton, "click", confirmSchemaRevision);
      lifecycle.listen(cancelSchemaRevisionButton, "click", cancelSchemaRevision);
      lifecycle.listen(discardSchemaDraftButton, "click", discardSchemaDraft);
      lifecycle.listen(keepEditingSchemaButton, "click", keepEditingSchema);
      lifecycle.listen(closeSchemaEditorButton, "click", closeSchemaEditor);
      lifecycle.listen(saveAndCloseSchemaButton, "click", saveAndCloseSchema);
      lifecycle.listen(saveSchemaCloseReviewButton, "click", saveSchemaFromCloseReview);
      lifecycle.listen(discardWorkingSchemaDraftButton, "click", discardWorkingSchemaDraft);
      lifecycle.listen(schemaRevisionSelector, "change", renderSchemaRevisionComparison);
      lifecycle.listen(duplicateSchemaRevisionButton, "click", duplicateSelectedSchemaRevision);
      lifecycle.listen(restoreSchemaRevisionButton, "click", restoreSelectedSchemaRevision);
      lifecycle.listen(addSchemaPropertyButton, "click", openManualPropertyFromControl);
      lifecycle.listen(schemaPropertyFilter, "input", renderSchemaPropertyView);
      lifecycle.listen(schemaPropertySort, "change", renderSchemaPropertyView);
      lifecycle.listen(clearSchemaPropertyFilter, "click", clearSchemaPropertyViewFilter);
      for (const tab of schemaSubviews) lifecycle.listen(tab, "click", activateSchemaSubview);
      lifecycle.listen(confirmSchemaPropertyRemovalButton, "click", confirmSchemaPropertyRemoval);
      lifecycle.listen(cancelSchemaPropertyRemovalButton, "click", cancelSchemaPropertyRemoval);
      lifecycle.listen(schemaPropertyRemovalDialog, "cancel", cancelSchemaPropertyRemovalFromDialog);
      lifecycle.listen(undoSchemaPropertyRemovalButton, "click", undoLastSchemaPropertyRemoval);
      lifecycle.listen(confirmSchemaDocumentationRemoval, "click", confirmSchemaDocumentationRemovalAction);
      lifecycle.listen(cancelSchemaDocumentationRemoval, "click", cancelSchemaDocumentationRemovalAction);
      lifecycle.listen(schemaDocumentationRemovalDialog, "cancel", cancelSchemaDocumentationRemovalFromDialog);
      lifecycle.listen(undoSchemaPropertyCopyButton, "click", undoLastSchemaPropertyCopy);
      lifecycle.listen(schemaSpecificIndex, "input", renderSpecificIndexInspection);
      lifecycle.listen(schemaSpecificIndexForm, "submit", submitSpecificIndex);
      lifecycle.listen(cancelSchemaSpecificIndex, "click", closeSpecificIndexDialog);
      lifecycle.listen(schemaSpecificIndexDialog, "cancel", cancelSpecificIndexDialog);
      lifecycle.listen(schemaManualPropertyPath, "input", renderManualPropertyForm);
      lifecycle.listen(schemaManualPropertyChildName, "input", renderManualPropertyForm);
      lifecycle.listen(schemaManualPropertyType, "change", renderManualPropertyForm);
      lifecycle.listen(schemaManualArrayItemType, "change", renderManualPropertyForm);
      lifecycle.listen(schemaManualPropertyForm, "submit", submitManualProperty);
      lifecycle.listen(cancelSchemaManualPropertyButton, "click", cancelManualPropertyDialog);
      lifecycle.listen(schemaManualPropertyDialog, "cancel", cancelManualPropertyFromDialog);
      lifecycle.listen(goToExistingSchemaPropertyButton, "click", goToExistingSchemaProperty);
      lifecycle.listen(schemaPropertyRulePicker, "cancel", cancelSchemaPropertyRulePicker);
      lifecycle.listen(schemaPropertyRulePicker, "keydown", navigateSchemaPropertyRulePicker);
      lifecycle.listen(createSchemaRuleButton, "click", () => ruleController.beginNew());
      lifecycle.listen(saveSchemaRuleButton, "click", () => ruleController.save());
      lifecycle.listen(saveSchemaRuleButton, "pointerdown", () => ruleController.captureSnapshot());
      lifecycle.listen(schemaRuleEditor, "input", updateConfiguredRulePreview);
      lifecycle.listen(schemaRuleEditor, "click", (event) => { if ((event.target as HTMLElement)?.id === "schema-rule-save") ruleController.captureSnapshot(); });
      lifecycle.listen(schemaRuleSearch, "input", () => ruleController.render());
      lifecycle.listen(updateSchemaRuleAttachments, "change", () => ruleController.updateAttachmentPreview());
      lifecycle.listen(confirmSchemaRuleRevisionButton, "click", () => ruleController.confirmRevision());
      lifecycle.listen(cancelSchemaRuleRevisionButton, "click", () => ruleController.cancelRevision());
      lifecycle.listen(confirmSchemaRuleUpgradeButton, "click", () => ruleController.confirmUpgrade());
      lifecycle.listen(cancelSchemaRuleUpgradeButton, "click", () => ruleController.cancelUpgrade());
      lifecycle.listen(confirmSchemaRuleSyncButton, "click", () => ruleController.confirmSync());
      lifecycle.listen(cancelSchemaRuleSyncButton, "click", () => ruleController.cancelSync());
      lifecycle.listen(confirmSchemaRuleDeleteButton, "click", () => ruleController.confirmDeletion());
      lifecycle.listen(cancelSchemaRuleDeleteButton, "click", () => ruleController.cancelDeletion());
      lifecycle.listen(exportSchemaRulesButton, "click", () => ruleController.exportRules());
      lifecycle.listen(schemaAssignmentTarget, "change", () => assignmentController.changeTarget());
      lifecycle.listen(createSchemaAssignmentButton, "click", () => assignmentController.openNew());
      lifecycle.listen(saveSchemaAssignmentButton, "click", () => assignmentController.save());
      lifecycle.listen(importSchemaButton, "click", () => library.openImportFile());
      lifecycle.listen(schemaLibraryImportFile, "change", () => { void library.readImportFile(); });
      lifecycle.listen(replaceSchemaLibraryButton, "click", () => library.replaceImport());
      lifecycle.listen(appendSchemaLibraryButton, "click", () => library.appendImport());
      lifecycle.listen(cancelSchemaImportButton, "click", () => library.cancelImport());
      lifecycle.listen(confirmSchemaDeleteButton, "click", () => library.confirmDeletion());
      lifecycle.listen(cancelSchemaDeleteButton, "click", () => library.cancelDeletion());
      lifecycle.listen(exportSchemaButton, "click", () => library.requestExport());
      unsubscribe = ports.subscribe((activeProjectId) => {
        library.reload();
        ruleController.reload();
        if (library.activeSchemaId) { const activeStored = library.schemas.find(({ id }) => id === library.activeSchemaId); if (activeStored) library.draft = schemaEditorDraft(activeStored); }
        if (!schemaPanel?.hidden && activeProjectId && activeProjectId !== hydratedSchemaProjectId) void hydrateProjectForSchemas(activeProjectId);
        renderSchemas(); ruleController.render();
        if (canonicalController.editor) renderCompactCanonicalEditor();
      });
      unsubscribeSchemaPersistence = ports.subscribeSchemaPersistence(settleSchemaPersistence);
      renderSchemas(); ruleController.render(); renderSchemaValidationRecords();
    },
    dispose(): void {
      if (!lifecycle.dispose()) return;
      editorRoute.dispose();
      propertyController.dispose(resetSchemaPropertyCopyDialog); pendingSchemaRestoration = undefined;
      assignmentController.dispose();
      library.pendingImport = undefined; library.pendingDeletion = undefined;
      library.pendingStandardExport = undefined; library.exportTrigger = undefined;
      schemaExportChoices?.close(); schemaExportReview?.close(); schemaExportChoices?.replaceChildren(); schemaExportReview?.replaceChildren();
      if (buildSpecificationButton) buildSpecificationButton.onclick = null;
      if (buildHistoricalSpecificationButton) buildHistoricalSpecificationButton.onclick = null;
      if (schemaSpecificationBuilder) { schemaSpecificationBuilder.hidden = true; schemaSpecificationBuilder.replaceChildren(); }
      closeCompactCanonicalEditor(false); canonicalController.disposeState();
      sidePanelLayeredProfileEditor?.dispose(); sidePanelLayeredProfileEditor = undefined;
      guidedValidationFlow.close(); guidedController.dispose();
      validationController.dispose();
      guidedValidationRoot?.replaceChildren();
      const disposed = new Error("Schemas controller disposed before durable persistence settled");
      pendingLocalRulePromotionPersistence?.reject(disposed); pendingGuidedValidationPersistence?.reject(disposed);
      ruleController.dispose(); localRulePromotionDialog.close();
      unsubscribe?.(); unsubscribe = undefined;
      unsubscribeSchemaPersistence?.(); unsubscribeSchemaPersistence = undefined;
      activeSchemaProjectHydration.reset();
      relationshipTreeController.dispose();
      for (const dispose of schemaPropertyRowDisposers.splice(0)) dispose();
      schemaList?.replaceChildren();
      schemaAssignmentList?.replaceChildren();
      schemaAssignmentDataConditions?.replaceChildren();
    },
    open(id: string): void {
      if (!library.schemas.some((schema) => schema.id === id)) throw new Error(`Unknown schema ${id}`);
      library.activeSchemaId = id;
      library.draft = structuredClone(active()); renderSchemas();
    },
    beginDraft(): void { replaceActive(updateSchemaWorkingDraft(active(), {})); persistSchemaLibrary(); renderSchemas(); },
    updateDraft(changes: Partial<Pick<SchemaWorkingDraft, "name" | "document" | "assignments" | "attachedRules" | "parentSchemaId" | "inheritedRuleOverrides" | "documentation" | "canonicalSchema">>, change?: string): void {
      replaceActive(updateSchemaWorkingDraft(active(), changes, change)); persistSchemaLibrary(); renderSchemas();
    },
    publish(): SchemaDefinition { return structuredClone(publishActiveSchema()); },
    discard(): void { replaceActive(discardSchemaWorkingDraft(active())); persistSchemaLibrary(); renderSchemas(); },
    add(schema: SchemaDefinition): void { library.schemas = [...library.schemas, structuredClone(schema)]; library.activeSchemaId = schema.id; library.draft = structuredClone(schema); persistSchemaLibrary(); renderSchemas(); },
    replace(next: readonly SchemaDefinition[]): void { library.schemas = structuredClone([...next]); if (!library.schemas.some(({ id }) => id === library.activeSchemaId)) { library.activeSchemaId = undefined; library.draft = undefined; } persistSchemaLibrary(); renderSchemas(); },
    validate:(event: Parameters<typeof validateEvent>[0]) => validateEvent(event, library.schemas),
    validateAgainstSchema:(event: Parameters<typeof validateEvent>[0], schemaId:string) => {
      const schema = library.schemas.find((candidate) => candidate.id === schemaId);
      if (!schema) return { message:"Select a schema to refresh Library draft validation." };
      const result = validateWithSchema(event, schema, library.schemas);
      return { message:`Library draft validation: ${result.state} · ${schema.name} v${schema.version}.`, result };
    },
    runGuidedValidation:async () => { const event = guidedValidationRoot?.dataset.eventId;
      if (event) { const captured={ id:event, sourceId:"", name:"", pageUrl:"", payload:{}, rawInput:{} };
        guidedValidationFlow.open(guidedUiEvent(captured), library.activeSchemaId ? guidedUiCandidate(active()) : undefined); } },
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
    configureRule:(ruleType:RuleConfiguration["ruleType"]) => { if (!ruleController.configuration) return false;
      ruleController.configuration = createRuleConfiguration(ruleType, ruleController.configuration.propertyType); renderSchemaPropertyRulePicker(); return true; },
    openCanonicalPropertyActions:openCompactCanonicalPropertyActions,
    compactPropertyAction:(propertyId:string, action:Parameters<SchemaCanonicalEditorController["propertyAction"]>[1], value?:string) => canonicalController.propertyAction(propertyId, action, value),
    configuredRule:configuredRuleInput,
    conditionPredicate:sampledConditionPredicate,
    createConfiguredRule:createConfiguredSchemaRule,
    requestRuleRevision:(id:string, changes:Partial<Omit<ReusableSchemaRule, "id" | "version" | "revisionHistory">>) => ruleController.requestRevision(id, changes),
    requestRuleUpgrade:(id:string, schemaIds:readonly string[]) => ruleController.requestUpgrade(id, schemaIds),
    requestRuleSync:(id:string) => ruleController.requestSync(id),
    confirmRuleSync:() => ruleController.confirmSync(),
    requestRuleDeletion:(id:string) => ruleController.requestDeletion(id),
    editReusableRule:(id:string) => ruleController.edit(id),
    openAttachedRule:openAttachedSchemaRuleEditor,
    attachReusableRule,
    updateAttachedRule,
    focusPropertyRule:focusSchemaPropertyRule,
    focusPropertyRow:focusSchemaPropertyRow,
    promotionRules:promotionReusableRules,
    renderWorkflow:renderSchemaWorkflowRows,
    editAssignment:(schemaId:string, assignment:SchemaAssignment) => assignmentController.edit(schemaId, assignment),
    reviewLibraryImport:(serialized:string) => library.reviewImport(serialized),
    requestDeletion:(id:string) => library.requestDeletion(id),
    openExportChoices:(schemaId?:string) => { if (!exportSchemaButton) return false;
      const schema = schemaId ? library.schemas.find(({ id }) => id === schemaId) : undefined; if (schemaId && !schema) return false;
      library.openExportChoices(exportSchemaButton, schema); return true; },
    requestLocalRulePromotion:openLocalRulePromotionReview,
    persistGuidedValidation:(result:PublishedGuidedValidation) => persistPublishedGuidedValidation(result).then(() => finishGuidedValidationSave(result)),
    openGuidedEvent:openGuidedValidationForEvent,
    openGuidedProperty:openGuidedValidationForProperty,
    openGuidedLiveProperty:async(event:GuidedCapturedEvent,path:string) => {
      guidedController.propertyReturn={kind:"capture",eventId:event.id,propertyPath:path,generation:lifecycle.generation()};
      await openGuidedValidationForProperty(event, selectedGuidedContinuation(guidedController.selections,event,library.schemas), path, false);
      guidedController.propertyReturn={kind:"capture",eventId:event.id,propertyPath:path,generation:lifecycle.generation()};
    },
    openLivePropertyDeclaration,
    livePropertyDeclaration:(event:GuidedCapturedEvent,path:string) => { const schema = selectedGuidedContinuation(guidedController.selections,event,library.schemas);
      if (!schema?.workingDraft) return {}; const canonical=canonicalLivePropertyPath(path);
      return { destination:schema.name, alreadyDeclared:Boolean(schemaPropertyAt(schema.workingDraft.document,canonical)) }; },
    liveValidationAvailable:(event:GuidedCapturedEvent) => { const manual=library.schemas.find(({id})=>id===validationController.manualOverrides[event.id]);
      return Boolean(manual??validateEvent({sourceId:event.sourceId,eventName:event.name,payload:event.payload,rawInput:event.rawInput},library.schemas,event.pageUrl).schema); },
    validateLive:(event:GuidedCapturedEvent) => { const input={sourceId:event.sourceId,eventName:event.name,payload:event.payload,rawInput:event.rawInput};
      const manual=library.schemas.find(({id})=>id===validationController.manualOverrides[event.id]);return manual?validateWithSchema(input,manual,library.schemas):validateEvent(input,library.schemas,event.pageUrl); },
    liveSchemaChoices:() => assignableSchemas(library.schemas).map(({id,name,version})=>({id,label:`${name} v${version}`})),
    openAllowedValueExpansionReview,
    closeGuided:guidedValidationFlow.close,
    guidedDraft:guidedValidationFlow.currentDraft,
    guidedState:() => ({ selections:structuredClone(guidedController.selections), selectedSchemaPropertyPath:propertyController.selectedPath,
      hasPropertyReturn:Boolean(guidedController.propertyReturn), dialogListenerCount:guidedController.dialogListenerCount() }),
    guidedContinuation:guidedDraftContinuationForEvent,
    recheckCaptured:recheckCapturedSchemaValidation,
    recordCapturedValidation:(record:SchemaValidationRecord):void => { validationController.addRecord(record); renderSchemaValidationRecords(); },
    refreshCurrentLiveAfterSchemaPublication,
    reviewCapturedValidationContinuation,
    setManualSchemaOverride:(eventId:string, schemaId?:string) => validationController.setManualOverride(eventId, schemaId),
    hydrateActiveProjectForSchemas,
    openSavedCanonical:(schemaId:string) => { const schema = library.schemas.find(({ id }) => id === schemaId); if (!schema) return false;
      openSavedSchemaInUnifiedEditor(schema); return true; },
    openCanonical:openCompactCanonicalEditor,
    closeCanonical:closeCompactCanonicalEditor,
    show():void { renderSchemas(); relationshipTreeController.restoreScroll(); },
    dispatchCanonical:(command:CompactCanonicalCommand) => canonicalController.dispatchCommand(command),
    persistCanonicalProjection:(projection:SchemaDefinition, change?:string) => canonicalController.editor
      ? canonicalController.persistProjection(canonicalController.editor, projection, change) : Promise.resolve(false),
    resumeCanonicalProjection:() => canonicalController.editor ? canonicalController.resumeProjectionPersistence(canonicalController.editor) : Promise.resolve(false),
    retryCanonical:() => canonicalController.retryCommand(),
    rejectCanonical:() => canonicalController.rejectCommand(),
    canonicalProjection:() => canonicalController.editor ? compactCanonicalProjection(canonicalController.editor) : undefined,
    canonicalDocument:() => canonicalController.editor ? structuredClone(canonicalController.editor.load()) : undefined,
    canonicalFacet:(propertyId:string) => { const document = canonicalController.editor?.load(), node = document?.nodes[propertyId];
      return document && node ? compactCanonicalFacetText(document, node) : undefined; },
    canonicalCommandScope:(command:CompactCanonicalCommand) => canonicalController.editor
      ? canonicalController.commandScope(command, canonicalController.editor.load()) : undefined,
    canonicalQueueUnavailable:() => canonicalController.editor ? canonicalController.projectionQueueUnavailable(canonicalController.editor) : false,
    beginCanonicalHistory:(projectId:string, label:string, before:CanonicalSchemaDocument, after:CanonicalSchemaDocument) => {
      if (!canonicalController.editor) return undefined; const key = compactCanonicalHistoryKey(projectId, canonicalController.editor.key);
      const history = recordCompactCanonicalMutation(canonicalController.historyState.history, key, before, after);
      return canonicalController.beginPendingHistory(projectId, canonicalController.editor.key, label, history); },
    completeCanonicalHistory:(identity:CompactCanonicalHistoryTransitionIdentity) => canonicalController.completePendingHistory(identity),
    rejectCanonicalHistory:(identity:CompactCanonicalHistoryTransitionIdentity) => canonicalController.rejectPendingHistory(identity),
    pendingCanonicalHistory:(projectId:string, label:string) => canonicalController.pendingHistoryFor(projectId, label),
    canonicalState:() => ({ open:Boolean(canonicalController.editor), pending:Boolean(canonicalController.pendingCommand),
      settlementPending:canonicalController.settlementPending, reviewVisible:canonicalController.reviewVisible,
      feedback:canonicalController.commandFeedback, reopenSelection:canonicalController.reopenSelection,
      projectionPending:Boolean(canonicalController.projectionRequest), historyPending:Boolean(canonicalController.historyState.pending) }),
    renderCanonical:renderCompactCanonicalEditor,
    rulePickerState:() => ({ path:ruleController.pickerPath, renderSequence:propertyController.renderSequence,
      ...(ruleController.configuration ? { configuration:structuredClone(ruleController.configuration) } : {}) }),
    rules:(): readonly ReusableSchemaRule[] => structuredClone(ruleController.rules),
    ruleState:() => ({ editingReusableSchemaRuleId:ruleController.editingReusableId,
      approvedRuleRevisionId:ruleController.approvedRevisionId,
      approvedRuleAttachmentUpdateId:ruleController.approvedAttachmentUpdateId,
      pendingRuleSnapshotMetadata:ruleController.pendingSnapshot ? structuredClone(ruleController.pendingSnapshot) : undefined }),
    omittedRuleStatus:(count:number) => library.omittedStatus(count),
    storePromotionRules:storedPromotionRules,
    schemas:(): readonly SchemaDefinition[] => structuredClone(library.schemas),
    state:() => ({ ...(library.activeSchemaId ? { activeSchemaId:library.activeSchemaId } : {}), draftDirty:Boolean((library.activeSchemaId || library.draft) && active().workingDraft),
      ...(activeIndex() < 0 && library.draft ? { transientDraft:structuredClone(library.draft) } : {}), schemaCount:library.schemas.length, mounted:lifecycle.isMounted() }),
  };
  function restoreGuidedPropertyReturn():void {
    const snapshot = guidedController.propertyReturn; if (!snapshot || snapshot.generation !== lifecycle.generation()) return;
    if(snapshot.kind === "capture"){guidedController.propertyReturn=undefined;ports.restoreGuidedCapture(snapshot.eventId,snapshot.propertyPath);return;}
    guidedController.propertyReturn = undefined;
    propertyController.selectedPath = snapshot.propertyPath; library.activeSchemaId = snapshot.schemaId; renderSchemas();
  }
  function persistGuidedContinuation(event:Pick<GuidedCapturedEvent, "sourceId" | "name">, schemaId:string):void {
    guidedController.select(event, schemaId);
  }
  function openGuidedDraft(schema:SchemaDefinition):void {
    library.activeSchemaId = schema.id; library.draft = schemaEditorDraft(schema); ports.showSchemasView(); renderSchemas();
  }
  function openGuidedContinuationPicker(event:GuidedCapturedEvent):void {
    if (!guidedValidationRoot || !schemaOwnerDocument) return;
    guidedController.clearDialog(); guidedValidationRoot.replaceChildren();
    const dialog = schemaOwnerDocument.createElement("dialog"), heading = schemaOwnerDocument.createElement("h5"), choices = schemaOwnerDocument.createElement("div");
    dialog.id = "guided-continuation-schema-picker"; dialog.setAttribute("aria-labelledby", "guided-continuation-schema-picker-heading");
    heading.id = "guided-continuation-schema-picker-heading"; heading.textContent = "Choose schema destination";
    choices.setAttribute("aria-label", "Schemas with working drafts");
    for (const schema of library.schemas.filter(({ workingDraft }) => Boolean(workingDraft))) {
      const choose = schemaOwnerDocument.createElement("button"); choose.type = "button";
      choose.textContent = `${schema.name} revision ${schema.version} · ${schema.workingDraft?.pendingChanges.length ?? 0} pending changes`;
      const select = ():void => { persistGuidedContinuation(event, schema.id); dialog.close(); guidedValidationRoot.replaceChildren();
        ports.restoreGuidedCapture(event.id); guidedController.clearDialog(); };
      choose.addEventListener("click", select); guidedController.ownDialog(() => choose.removeEventListener("click", select)); choices.append(choose);
    }
    const cancel = schemaOwnerDocument.createElement("button"); cancel.type = "button"; cancel.textContent = "Cancel";
    const close = ():void => { dialog.close(); guidedValidationRoot.replaceChildren(); guidedController.clearDialog(); };
    cancel.addEventListener("click", close); guidedController.ownDialog(() => cancel.removeEventListener("click", close));
    dialog.append(heading, choices, cancel); guidedValidationRoot.append(dialog); dialog.showModal(); heading.focus({ preventScroll:true });
  }
  function openLivePropertyDeclaration(event:GuidedCapturedEvent, path:string, trigger:HTMLButtonElement):boolean {
    if (!guidedValidationRoot || !schemaOwnerDocument) return false;
    guidedController.clearLiveProperty(); guidedValidationRoot.replaceChildren();
    const dialog = schemaOwnerDocument.createElement("dialog"), feedback = schemaOwnerDocument.createElement("output");
    dialog.className = "live-schema-property-declaration-review"; dialog.setAttribute("aria-labelledby", "live-schema-property-declaration-heading");
    const close = (restoreFocus=true):void => { guidedController.clearLiveProperty();
      dialog.close(); guidedValidationRoot.replaceChildren(); if (restoreFocus) trigger.focus({ preventScroll:true }); };
    const listen = (control:HTMLButtonElement, action:() => void):void => { control.addEventListener("click", action);
      guidedController.ownLiveProperty(() => control.removeEventListener("click", action)); };
    const showReview = (schema:SchemaDefinition):void => {
      const heading = schemaOwnerDocument.createElement("h5"), review = schemaOwnerDocument.createElement("p"), confirm = schemaOwnerDocument.createElement("button"), cancel = schemaOwnerDocument.createElement("button");
      heading.id = "live-schema-property-declaration-heading"; heading.textContent = "Review schema property declaration";
      try {
        const declaration = createLiveSchemaPropertyDeclaration(event.payload, path, schema);
        review.textContent = `${declaration.canonicalPath} · ${declaration.detectedType} · ${schema.name} revision ${schema.version}. No validation rule will be added.`;
        confirm.type = cancel.type = "button"; confirm.textContent = `Add property to ${schema.name} draft`; cancel.textContent = "Cancel";
        listen(confirm, () => { try { library.schemas = library.schemas.map((candidate) => candidate.id === schema.id
            ? addLiveSchemaPropertyDeclaration(candidate, declaration) : candidate); persistSchemaLibrary(); renderSchemas(); close(false);
            ports.scheduleFrame(() => ports.restoreGuidedCapture(event.id, declaration.concretePath, "declaration")); }
          catch (error) { feedback.textContent = error instanceof Error ? error.message : "The property could not be added to the schema draft."; } });
        listen(cancel, () => close()); dialog.replaceChildren(heading, review, feedback, confirm, cancel);
      } catch (error) { feedback.textContent = error instanceof Error ? error.message : "The observed property is unavailable.";
        cancel.type = "button"; cancel.textContent = "Cancel"; listen(cancel, () => close()); dialog.replaceChildren(heading, feedback, cancel); }
      heading.focus({ preventScroll:true });
    };
    const selected = selectedGuidedContinuation(guidedController.selections, event, library.schemas);
    if (selected?.workingDraft) showReview(selected);
    else {
      const heading = schemaOwnerDocument.createElement("h5"), choices = library.schemas.filter(({ workingDraft }) => Boolean(workingDraft)).map((schema) => {
        const choose = schemaOwnerDocument.createElement("button"); choose.type = "button"; choose.textContent = schema.name; listen(choose, () => showReview(schema)); return choose; }),
        cancel = schemaOwnerDocument.createElement("button"); heading.id = "live-schema-property-declaration-heading"; heading.textContent = "Choose schema destination";
      cancel.type = "button"; cancel.textContent = "Cancel"; listen(cancel, () => close()); dialog.replaceChildren(heading, ...choices, cancel); heading.focus({ preventScroll:true });
    }
    guidedValidationRoot.append(dialog); dialog.showModal(); return true;
  }
  function openAllowedValueExpansionReview(eventId:string, assignedSchemaId:string, evaluation:ValidationEvaluation, trigger:HTMLButtonElement):boolean {
    const inspector = ports.root.querySelector<HTMLElement>("#live-event-inspector");
    if (!inspector) return false;
    const inspectorScroll = inspector.scrollTop;
    const expandedPaths = Array.from(inspector.querySelectorAll<HTMLDetailsElement>("details[open][data-property-path]"),
      ({ dataset }) => dataset.propertyPath).filter((path):path is string => Boolean(path));
    const restoreLiveAction = ():void => { ports.restoreGuidedCapture(eventId, evaluation.propertyPath);
      ports.scheduleFrame(() => { const restoredInspector = ports.root.querySelector<HTMLElement>("#live-event-inspector");
        for (const path of expandedPaths) restoredInspector?.querySelector<HTMLDetailsElement>(`details[data-property-path="${CSS.escape(path)}"]`)?.setAttribute("open", "");
        if (restoredInspector) restoredInspector.scrollTop = inspectorScroll;
        const restoredAction = restoredInspector?.querySelector<HTMLButtonElement>(`.live-allowed-value-expansion[data-rule-id="${CSS.escape(evaluation.ruleId ?? "")}"]`);
        restoredAction?.focus({ preventScroll:true }); });
    };
    const input = { schemas:library.schemas, reusableRules:expansionReusableRules(), assignedSchemaId, evidence:evaluation };
    let review:ReturnType<typeof reviewAllowedValueExpansion>;
    try { review = reviewAllowedValueExpansion(input); }
    catch (error) { if (schemaResult) schemaResult.textContent = error instanceof Error ? error.message : "The allowed value review is unavailable."; return false; }
    guidedController.clearAllowedValue();
    const disposeDialog = openAllowedValueExpansionDialog({ inspector, review, trigger,
      confirm:(destination:AllowedValueExpansionDestination) => { const applied = applyAllowedValueExpansion({ ...input, destination });
        library.schemas = applied.schemas; ruleController.rules = storedPromotionRules(applied.reusableRules.map((rule) => ({ ...rule,
          name:rule.name ?? rule.id, enabled:rule.enabled !== false })) as unknown as readonly PromotableReusableRule[]); persistSchemaAndRuleLibraries();
        library.activeSchemaId = applied.affectedSchemaId; library.draft = schemaEditorDraft(active()); renderSchemas();
        if (schemaResult) schemaResult.textContent = applied.changed ? `${String(review.proposedValue)} was added to the working draft.` : "The allowed value was already pending; no duplicate was created.";
        return () => ports.scheduleFrame(restoreLiveAction); },
      openDraft:(destination:AllowedValueExpansionDestination) => { const targetId = destination === "parent-schema-draft" ? evaluation.schemaId : assignedSchemaId,
          target = library.schemas.find(({ id }) => id === targetId); trigger.focus({ preventScroll:true }); if (!target) return;
        library.activeSchemaId = target.id; library.draft = schemaEditorDraft(target); ports.showSchemasView(); renderSchemas(); schemaEditorName?.focus({ preventScroll:true }); },
    });
    guidedController.ownAllowedValue(disposeDialog);
    return true;
  }
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
    ports.renderSchemaSpecification(schemaSpecificationBuilder, structuredClone(schema), structuredClone(library.schemas), surface, () => {
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
    return ruleController.rules.find(({ id }) => id === entry.rule.id)?.name ?? entry.rule.id;
  }
  function displaySchemaRule(entry: DisplayedSchemaRule): string {
    return `${schemaRuleLabel(entry)} v${entry.rule.version} · ${entry.path} · ${entry.origin.name} v${entry.origin.version}`;
  }
  function renderSchemaInheritancePresentation(draft: SchemaDefinition): void {
    if (!schemaInheritedRuleGroups || !schemaEffectiveRulePreview || !schemaOwnerDocument) return;
    const ancestors: SchemaDefinition[] = [], seen = new Set<string>([draft.id]); let parentId = draft.parentSchemaId;
    while (parentId && !seen.has(parentId)) { seen.add(parentId); const parent = library.schemas.find(({ id }) => id === parentId);
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
