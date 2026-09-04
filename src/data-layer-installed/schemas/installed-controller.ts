import {
  SCHEMA_LIBRARY_STORAGE_KEY,
  discardSchemaWorkingDraft,
  duplicateSchemaRevision,
  proposeSchemaWorkingDraftName,
  schemaRevisionChoices,
  assignableSchemas,
  createRuleConfiguration,
  createRuleConfigurationFromAttachedRule,
  setPropertyDocumentation,
  updateSchemaWorkingDraft,
  validateEvent,
  validateWithSchema,
  applyCanonicalCommand,
  canonicalPropertyPath,
  canonicalLivePropertyPath,
  savedSchemaCanonicalDocument,
  type AssignmentConditionTarget,
  type SchemaDefinition,
  type SchemaAssignment,
  type PromotableReusableRule,
  type PublishedGuidedValidation,
  type RuleConfiguration,
  type SchemaPropertyType,
  type SchemaWorkingDraft,
} from "../../utilities/data-layer/schemas.js";
import { createSchemaLifecycle } from "./lifecycle.js";
import { createSchemaRelationshipTreeController } from "./relationship-tree-controller.js";
import { SchemaLibraryController } from "./library-controller.js";
import { SchemaLibraryEditor } from "./library-editor.js";
import { SchemaPropertyController } from "./property-controller.js";
import { SchemaPropertyView } from "./property-view.js";
import { bindSchemaAssignmentElements, SchemaAssignmentController } from "./assignment-controller.js";
import { bindSchemaLibraryElements } from "./library-installed-view.js";
import { SchemaValidationController } from "./validation-controller.js";
import { SchemaGuidedValidationController, type GuidedCapturedEvent } from "./guided-validation-controller.js";
import { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import { SchemaCanonicalInstalledView } from "./canonical-installed-view.js";
import { SchemaProjectHydrationCoordinator } from "./project-hydration.js";
import { createSchemaEditorRouteController } from "./editor-route-controller.js";
import { createCanonicalPublicOperations } from "./canonical-public-operations.js";
import { createSchemaLibraryPublicOperations } from "./library-public-operations.js";
import { createSchemaAuthoringPublicOperations } from "./authoring-public-operations.js";
import { createGuidedPublicOperations } from "./guided-public-operations.js";
import { SchemaPropertyRuleWorkflow } from "./property-rule-workflow.js";
import { bindSchemaEditorLifecycle, bindSchemaPropertyLifecycle } from "./installed-bindings.js";
import { SchemaRelationshipViewCoordinator } from "./relationship-view-coordinator.js";
import { SchemaGuidedInstalledWorkflow } from "./guided-installed-workflow.js";
import type { ValidationEvaluation } from "../../data-layer-validation-model.js";
import type { CapturedValidationContinuation, CompactCanonicalCommand, CompactCanonicalEditorAdapter, CompactCanonicalProjectionPersistenceRequest, CompactCanonicalProjectionWorker, ReusableSchemaRule, SchemaPersistenceEvent, SchemaSourceDraftInput, SchemaValidationRecord, SchemasInstalledPorts as SchemasInstalledPortsContract } from "./contracts.js";
export type { CapturedValidationContinuation, CompactCanonicalCommand, CompactCanonicalEditorAdapter, CompactCanonicalProjectionPersistenceRequest, CompactCanonicalProjectionWorker, ReusableSchemaRule, ReusableSchemaRuleRevision, SchemaPersistenceEvent, SchemaSourceDraftInput, SchemaValidationRecord } from "./contracts.js";
export interface SchemasInstalledPorts extends SchemasInstalledPortsContract {}
import { SchemaRuleController } from "./rule-controller.js";
import { bindSchemaRuleElements, SchemaRuleInstalledPresentation } from "./rule-installed-view.js";
import { installSchemasElements } from "./installed-elements.js";
import { SchemaInstalledEditorWorkflow } from "./installed-editor-workflow.js";
import { SchemaCanonicalPersistenceWorkflow } from "./canonical-persistence-workflow.js";
import { SchemaRulePickerView } from "./rule-picker-view.js";
import { defineSchemaProperty, schemaDocumentPaths, schemaEditorDraft, schemaPropertyAt, schemaPropertyType, storedPromotionRules, withSchemaParent } from "./schema-model.js";
import { SchemaSourceController } from "./source-controller.js";
import { createSchemaLibraryEditorRelationshipDomain } from "./library-editor-relationship-factory.js";
import { createSchemaPropertyRuleAssignmentDomain } from "./property-rule-assignment-factory.js";
import { createSchemaCanonicalGuidedValidationDomain } from "./canonical-guided-validation-factory.js";
import { createSchemasInstalledPublicFacade } from "./installed-public-facade.js";
import { createSchemasInstalledLifecycleOwner } from "./installed-lifecycle-owner.js";
export function createSchemasInstalledController(ports: SchemasInstalledPorts) {
  const installedElements=installSchemasElements(ports.root),editorElements=installedElements.editor;
  const { schemaSearch,schemaCategoryFilter,schemaEmptyState,schemaCount,schemaList,schemaResult,createSchemaButton,
    schemaValidationIssues,schemaValidationRecordList,guidedValidationRoot,schemaEditor,schemaDetail,schemaTreeScrollOwner,schemaPanel,
    liveEventQuery,schemaSubviews,schemaPanels,schemaDetailEmpty,schemaEditorName,saveSchemaButton,schemaRevisionSelector,schemaOwnerDocument,schemaSpecificationBuilder,
    buildSpecificationButton, buildHistoricalSpecificationButton, compactCanonicalContext } = editorElements;
  const editorRoute = createSchemaEditorRouteController({
    panel:schemaPanel, scrollOwner:schemaTreeScrollOwner, scheduleFrame:ports.scheduleFrame,
  });
  const propertyElements=installedElements.property;
  const { schemaPropertyFilter,schemaPropertyTree,schemaPropertyRulePicker }=propertyElements;
  const createSchemaAssignmentButton=installedElements.createAssignment;
  const installedRuleElements=installedElements.rule;
  const { elements:ruleElements } = installedRuleElements;
  const assignmentElements=installedElements.assignment;
  const libraryElements=installedElements.library;
  const { importFile:schemaLibraryImportFile, importReview:schemaImportReview,importReviewSummary:schemaImportReviewSummary,
    deleteReview:schemaDeleteReview,deleteReviewSummary:schemaDeleteReviewSummary,
    exportButton:exportSchemaButton, exportChoices:schemaExportChoices, exportReview:schemaExportReview } = libraryElements;
  const lifecycle = createSchemaLifecycle();
  const localRulePromotionDialog = ports.localRulePromotionDialog;
  const libraryDomain=createSchemaLibraryEditorRelationshipDomain({ storage:ports.storage,changed:ports.changed },{
    query:schemaSearch, category:schemaCategoryFilter, scrollOwner:schemaTreeScrollOwner,
    panel:schemaPanel, list:schemaList, emptyState:schemaEmptyState, count:schemaCount,
    storage:ports.relationshipViewStorage, scheduleFrame:ports.scheduleFrame,
  });
  const relationshipTreeController=libraryDomain.relationshipTree,library=libraryDomain.library;
  let propertyRuleWorkflow!:SchemaPropertyRuleWorkflow;
  let guidedWorkflow!:SchemaGuidedInstalledWorkflow;
  let editorWorkflow:SchemaInstalledEditorWorkflow;
  let canonicalPersistenceWorkflow!:SchemaCanonicalPersistenceWorkflow;
  const propertyDomain=createSchemaPropertyRuleAssignmentDomain(ports.storage,ruleElements,() => library.schemas,{
    elements:{...assignmentElements,result:schemaResult},schemas:() => library.schemas,replaceSchemas:(schemas) => {library.schemas=schemas;},
    persistAndRender:() => {persistSchemaLibrary();renderSchemas();},capturedValue:ports.capturedAssignmentValue,renderConditions:ports.renderAssignmentConditions });
  const propertyController=propertyDomain.property,ruleController=propertyDomain.rule,rulePresentation=propertyDomain.rulePresentation,assignmentController=propertyDomain.assignment;
  const canonicalDomain=createSchemaCanonicalGuidedValidationDomain({root:ports.root,storage:ports.storage,library,property:propertyController,rule:ruleController,lifecycle,editorRoute,
    editor:() => editorWorkflow,propertyWorkflow:() => propertyRuleWorkflow,renderAll:() => renderSchemas(),renderDraft:() => renderSchemaDraft(),persistLibrary:() => persistSchemaLibrary(),
    persistLibraries:() => persistSchemaAndRuleLibraries(),expansionRules:() => expansionReusableRules(),refreshLive:() => refreshCurrentLiveAfterSchemaPublication(),
    createId:ports.createRuleId,scheduleFrame:ports.scheduleFrame,changed:ports.changed,...(ports.prepareCapturedValidationContinuation?{prepare:ports.prepareCapturedValidationContinuation}:{}),
    restoreCapture:ports.restoreGuidedCapture,...(ports.guidedSaved?{saved:ports.guidedSaved}:{}),conceptSuggestions:ports.canonicalConceptSuggestions,...(ports.blocked?{blocked:ports.blocked}:{}),
    ...(ports.createCanonicalTableEditor?{createTableEditor:ports.createCanonicalTableEditor}:{}),...(ports.settleCanonical?{settle:ports.settleCanonical}:{}),
    elements:{context:compactCanonicalContext,editor:schemaEditor,detail:schemaDetail,detailEmpty:schemaDetailEmpty,save:saveSchemaButton,list:schemaList,guidedRoot:guidedValidationRoot,
      issues:schemaValidationIssues,records:schemaValidationRecordList,result:schemaResult,document:schemaOwnerDocument,rulePicker:schemaPropertyRulePicker}});
  const {validation:validationController,guided:guidedController,canonical:canonicalController,view:canonicalView}=canonicalDomain;
  canonicalPersistenceWorkflow=canonicalDomain.persistence;
  guidedWorkflow=canonicalDomain.guidedWorkflow;
  const propertyConnected=propertyDomain.connect({root:ports.root,elements:propertyElements,ruleElements,library,canonical:canonicalController,canonicalView,
    canonicalPersistence:canonicalPersistenceWorkflow,editor:() => editorWorkflow,active:() => active(),persistLibrary:() => persistSchemaLibrary(),
    persistLibraries:() => persistSchemaAndRuleLibraries(),renderAll:() => renderSchemas(),renderDraft:() => renderSchemaDraft(),renderProperty:() => renderSchemaPropertyView(),
    createRuleId:ports.createRuleId,download:ports.downloadSchema,capturedValue:ports.capturedAssignmentValue,promotionDialog:localRulePromotionDialog,
    scheduleFrame:ports.scheduleFrame,...(ports.settleCanonical?{settleCanonical:ports.settleCanonical}:{}),result:schemaResult,schemaEditor,schemaDetail,document:schemaOwnerDocument});
  const {propertyView}=propertyConnected;
  propertyRuleWorkflow=propertyConnected.workflow;
  const libraryConnected=libraryDomain.connect({root:ports.root,document:schemaOwnerDocument,elements:{library:libraryElements,result:schemaResult,list:schemaList,detail:schemaDetail,editor:schemaEditor,detailEmpty:schemaDetailEmpty,name:schemaEditorName,
    propertyFilter:schemaPropertyFilter,subviews:schemaSubviews,panels:schemaPanels,liveEventQuery,specificationBuilder:schemaSpecificationBuilder,revisionSelector:schemaRevisionSelector,createButton:createSchemaButton},
    canonical:canonicalController,canonicalView,persistence:canonicalPersistenceWorkflow,property:propertyController,propertyView,rule:ruleController,assignment:assignmentController,lifecycle,route:editorRoute,
    download:ports.downloadSchema,showSchemas:ports.showSchemasView,renderSpecification:ports.renderSchemaSpecification,relationship:ports.relationshipTree,adopt:ports.adoptSavedSchema,openContributor:ports.openContributor,
    openContributorInStudio:ports.openContributorInStudio,openProject:ports.openProjectLibrary,reportMissing:ports.reportMissingSchemaEvent,activeProjectId:ports.activeProjectId,ensureContributors:ports.ensureProjectSchemaContributors,
    ...(ports.settleCanonical?{settle:ports.settleCanonical}:{}),refreshLive:() => refreshCurrentLiveAfterSchemaPublication(),proposeName:canonicalDomain.proposeName});
  const {source:sourceController,editor:libraryEditor,workflow,relationship:relationshipView,hydration:projectHydration}=libraryConnected;
  editorWorkflow=workflow;
  const active = (): SchemaDefinition => library.active();
  const persistSchemaLibrary = (): void => library.persist();
  const renderSchemaPropertyView = ():void => propertyView.render();
  function renderSchemaDraft():void { libraryEditor.render(); }
  const renderSchemas=libraryConnected.render,updateSchemaTreeView=libraryConnected.update,persistSchemaTreeScroll=libraryConnected.persistScroll,navigateSchemaTree=libraryConnected.navigate;
  function refreshCurrentLiveAfterSchemaPublication():number { return ports.revalidateCurrentLive?.(structuredClone(library.schemas),structuredClone(validationController.manualOverrides)) ?? 0; }
  const persistReusableSchemaRules = (): void => ruleController.persist();
  const expansionReusableRules = ():readonly PromotableReusableRule[] => structuredClone(ruleController.rules) as readonly PromotableReusableRule[];
  const persistSchemaAndRuleLibraries = ():void => { persistSchemaLibrary(); persistReusableSchemaRules(); };
  const rememberCompactCanonicalScroll = ():void => { if (canonicalController.editor && schemaDetail && schemaDetail.scrollTop > 0)
    canonicalController.scrollByKey.set(canonicalController.editor.key, schemaDetail.scrollTop); };
  const lifecycleOwner=createSchemasInstalledLifecycleOwner({lifecycle,route:editorRoute,editorElements,propertyElements,subviews:schemaSubviews,ruleElements:installedRuleElements,
    assignmentElements,createAssignment:createSchemaAssignmentButton,libraryElements,editor:editorWorkflow,propertyWorkflow:propertyRuleWorkflow,rule:ruleController,assignment:assignmentController,
    library,validation:validationController,canonical:canonicalController,persistence:canonicalPersistenceWorkflow,projectHydration,canonicalDomain,propertyDomain,libraryDomain,
    schemaPanel,schemaList,guidedRoot:guidedValidationRoot,exportChoices:schemaExportChoices,exportReview:schemaExportReview,specificationBuilder:schemaSpecificationBuilder,
    buildSpecification:buildSpecificationButton,buildHistoricalSpecification:buildHistoricalSpecificationButton,promotionDialog:localRulePromotionDialog,mountLayered:ports.mountLayeredProfileEditor,
    subscribe:ports.subscribe,subscribePersistence:ports.subscribeSchemaPersistence,render:renderSchemas,renderProperty:renderSchemaPropertyView,updateTree:updateSchemaTreeView,
    persistTreeScroll:persistSchemaTreeScroll,navigateTree:navigateSchemaTree,rememberCanonicalScroll:rememberCompactCanonicalScroll});
  return {
    mount:lifecycleOwner.mount,dispose:lifecycleOwner.dispose,
    ...createSchemasInstalledPublicFacade({library,property:propertyController,rule:ruleController,assignment:assignmentController,canonical:canonicalController,canonicalView,
      canonicalPersistence:canonicalPersistenceWorkflow,guided:guidedController,validation:validationController,propertyWorkflow:propertyRuleWorkflow,guidedWorkflow,
      editorWorkflow,source:sourceController,relationshipTree:relationshipTreeController,projectHydration,guidedRoot:guidedValidationRoot,exportButton:exportSchemaButton,
      lifecycle,render:renderSchemas,refreshLive:refreshCurrentLiveAfterSchemaPublication}),
  };
}
export const installedControllerDefinition = Object.freeze({ id:"schemas",
  capabilities:["schema and rule libraries", "drafts", "assignments", "validation", "guided validation"],
});
