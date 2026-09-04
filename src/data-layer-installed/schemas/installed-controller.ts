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
  let unsubscribe: (() => void) | undefined;
  let unsubscribeSchemaPersistence: (() => void) | undefined;
  const localRulePromotionDialog = ports.localRulePromotionDialog;
  const libraryDomain=createSchemaLibraryEditorRelationshipDomain({ storage:ports.storage,changed:ports.changed },{
    query:schemaSearch, category:schemaCategoryFilter, scrollOwner:schemaTreeScrollOwner,
    panel:schemaPanel, list:schemaList, emptyState:schemaEmptyState, count:schemaCount,
    storage:ports.relationshipViewStorage, scheduleFrame:ports.scheduleFrame,
  });
  const relationshipTreeController=libraryDomain.relationshipTree,library=libraryDomain.library;
  let relationshipView:SchemaRelationshipViewCoordinator;
  const schemaContributorRoute = { collectionKinds:["profiles", "propertySets", "pages", "events", "flows"], includeFlowGraphs:true } as const;
  const listen = (target: HTMLElement, type: string, listener: EventListener): void => {
    relationshipTreeController.listen(target, type, listener);
  };
  const listenRule = (target:HTMLElement, type:string, listener:EventListener):void => {
    ruleController.listenRow(target, type, listener);
  };
  let propertyRuleWorkflow:SchemaPropertyRuleWorkflow;
  let guidedWorkflow:SchemaGuidedInstalledWorkflow;
  let editorWorkflow:SchemaInstalledEditorWorkflow;
  let canonicalPersistenceWorkflow:SchemaCanonicalPersistenceWorkflow;
  const propertyDomain=createSchemaPropertyRuleAssignmentDomain(ports.storage,ruleElements,() => library.schemas,{
    elements:{...assignmentElements,result:schemaResult},schemas:() => library.schemas,replaceSchemas:(schemas) => {library.schemas=schemas;},
    persistAndRender:() => {persistSchemaLibrary();renderSchemas();},capturedValue:ports.capturedAssignmentValue,renderConditions:ports.renderAssignmentConditions });
  const propertyController=propertyDomain.property,ruleController=propertyDomain.rule,rulePresentation=propertyDomain.rulePresentation,assignmentController=propertyDomain.assignment;
  const sourceController = new SchemaSourceController({
    setDraft:(schema) => { library.activeSchemaId=undefined; library.draft=schema; },
    setSelectedPath:(path) => { propertyController.selectedPath=path; }, showSchemas:ports.showSchemasView,
    render:() => renderSchemas(), result:(message) => { if (schemaResult) schemaResult.textContent=message; },
    focusName:() => { schemaEditorName?.focus({ preventScroll:true }); },
  });
  let pendingSchemaRestoration: { schemaId:string; version:number } | undefined;
  const canonicalDomain=createSchemaCanonicalGuidedValidationDomain(ports.storage,{
    list:schemaValidationRecordList, issues:schemaValidationIssues, result:schemaResult,
    guidedRoot:guidedValidationRoot, document:schemaOwnerDocument,
    ...(ports.prepareCapturedValidationContinuation ? { prepare:ports.prepareCapturedValidationContinuation } : {}),
    schemas:() => library.schemas, generation:() => lifecycle.generation(), isCurrent:(generation) => lifecycle.isCurrent(generation),
  },{
    blocked:() => Boolean(ports.blocked?.()),generation:() => lifecycle.generation(),isCurrent:(generation) => lifecycle.isCurrent(generation),
    setBusy:(busy) => {schemaEditor?.setAttribute("aria-busy",String(busy));if(busy&&saveSchemaButton)saveSchemaButton.disabled=true;},
    renderContext:() => canonicalPersistenceWorkflow.renderContext(),renderEditor:() => canonicalPersistenceWorkflow.render(),createId:ports.createRuleId,
    writeLibrary:(schemas) => {ports.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY,library.serialize(schemas));ports.changed(schemas);},
    ...(ports.settleCanonical?{settleLibrary:ports.settleCanonical}:{}),mounted:() => lifecycle.isMounted() });
  const validationController=canonicalDomain.validation,guidedController=canonicalDomain.guided,canonicalController=canonicalDomain.canonical;
  let commitPromotionTransaction:(schemaId:string,previousSchemas:readonly SchemaDefinition[],previousRules:readonly ReusableSchemaRule[],nextSchemas:readonly SchemaDefinition[],nextRules:readonly ReusableSchemaRule[])=>Promise<void> = () => Promise.reject(new Error("Schema persistence is not ready"));
  ruleController.configure({
    elements:ruleElements,
    presentation:rulePresentation,
    schemas:() => library.schemas, replaceSchemas:(schemas) => { library.schemas = schemas; },
    persistRules:() => ruleController.persist(), persistLibrary:() => persistSchemaLibrary(),
    renderAll:() => renderSchemas(), renderDraft:() => renderSchemaDraft(), createId:ports.createRuleId, download:ports.downloadSchema,
    createRuleId:ports.createRuleId, capturedValue:ports.capturedAssignmentValue,
    editableSchema:() => library.draft ?? schemaEditorDraft(active()),
    propertyType:(document,path) => schemaPropertyType(document,path),
    draft:() => library.draft, replaceDraft:(schema) => { library.draft=schema; }, presentDraft:(schema) => schemaEditorDraft(schema),
    activeSchemaId:() => library.activeSchemaId, promotionDialog:localRulePromotionDialog, detail:schemaDetail, root:ports.root,
    scheduleFrame:ports.scheduleFrame, result:(message) => { if (schemaResult) schemaResult.textContent=message; },
    commitPromotion:(schemaId,previousSchemas,previousRules,nextSchemas,nextRules) => commitPromotionTransaction(schemaId,previousSchemas,previousRules,nextSchemas,nextRules),
    ...(ports.settleCanonical ? { settleCanonical:ports.settleCanonical } : {}),
  });
  const rulePickerView=propertyDomain.createRulePicker({
    picker:schemaPropertyRulePicker,active:() => active(),draft:() => library.draft,capturedValue:() => ports.capturedAssignmentValue("payload"),
    propertyType:(document,path) => schemaPropertyType(document,path),incrementRender:() => { propertyController.renderSequence+=1; },
    close:() => propertyRuleWorkflow.close(),closeForCommit:() => propertyRuleWorkflow.closeForCommit(),createConfigured:() => propertyRuleWorkflow.createConfigured(),
  });
  library.configure({
    elements:{ importFile:schemaLibraryImportFile, importReview:schemaImportReview, importSummary:schemaImportReviewSummary,
      deleteReview:schemaDeleteReview, deleteSummary:schemaDeleteReviewSummary, exportButton:exportSchemaButton,
      exportChoices:schemaExportChoices, exportReview:schemaExportReview, result:schemaResult },
    rules:() => ruleController.rules, replaceRules:(rules) => { ruleController.rules = rules; },
    persistRules:() => ruleController.persist(), renderAll:() => renderSchemas(), renderRules:() => ruleController.render(),
    download:ports.downloadSchema,
  });
  let applyGuidedPersistence:(schemas:readonly SchemaDefinition[],rules:readonly ReusableSchemaRule[])=>void = () => {};
  let beginGuidedPersistence:(schemaId:string,previousSchemas:readonly SchemaDefinition[],previousRules:readonly ReusableSchemaRule[],nextSchemas:readonly SchemaDefinition[],nextRules:readonly ReusableSchemaRule[])=>Promise<void> = () => Promise.reject(new Error("Schema persistence is not ready"));
  guidedController.configure({
    root:ports.root, guidedRoot:guidedValidationRoot, document:schemaOwnerDocument,
    schemas:() => library.schemas, replaceSchemas:(schemas) => { library.schemas=structuredClone([...schemas]); },
    persistSchemas:() => persistSchemaAndRuleLibraries(), renderSchemas:() => renderSchemas(),
    openDraft:(schema) => guidedWorkflow.openDraft(schema), restoreCapture:ports.restoreGuidedCapture,
    scheduleFrame:ports.scheduleFrame, generation:() => lifecycle.generation(),
    selectSchema:(schemaId, propertyPath) => { propertyController.selectedPath=propertyPath; library.activeSchemaId=schemaId;
      const schema=library.schemas.find(({ id }) => id===schemaId); if (schema) library.draft=schemaEditorDraft(schema); renderSchemas(); },
    result:(message) => { if (schemaResult) schemaResult.textContent=message; }, expansionRules:() => expansionReusableRules(),
    replaceExpansionRules:(rules) => { ruleController.rules=storedPromotionRules(rules.map((rule) => ({ ...rule,
      name:rule.name ?? rule.id, enabled:rule.enabled !== false })) as unknown as readonly PromotableReusableRule[]); },
    rules:() => ruleController.rules,replaceRules:(rules) => { ruleController.rules=structuredClone([...rules]); },
    applyPersistence:(schemas,rules) => applyGuidedPersistence(schemas,rules),
    beginPersistence:(schemaId,previousSchemas,previousRules,nextSchemas,nextRules) => beginGuidedPersistence(schemaId,previousSchemas,previousRules,nextSchemas,nextRules),
  });
  function proposeInstalledSchemaWorkingDraftName(schema:SchemaDefinition,proposed:string):SchemaDefinition {
    const updated=proposeSchemaWorkingDraftName(schema,proposed),draft=updated.workingDraft; return !draft?.canonicalSchema || !proposed ? updated
      : { ...updated,workingDraft:{ ...draft,canonicalSchema:{ ...draft.canonicalSchema,contributorName:proposed } } };
  }
  const canonicalView=canonicalDomain.createView({ controller:canonicalController,
    elements:{ context:compactCanonicalContext,editor:schemaEditor,detail:schemaDetail,detailEmpty:schemaDetailEmpty,save:saveSchemaButton,list:schemaList,document:schemaOwnerDocument },
    activeSchemaId:() => library.activeSchemaId,setActiveSchemaId:(id) => { library.activeSchemaId=id; },draft:() => library.draft,setDraft:(schema) => { library.draft=schema; },
    schemas:() => library.schemas,replaceSchemas:(schemas) => { library.schemas=structuredClone([...schemas]); },editorDraft:schemaEditorDraft,propertyAt:schemaPropertyAt,
    selectedPath:() => propertyController.selectedPath,setSelectedPath:(path) => { propertyController.selectedPath=path; },renderDraft:() => renderSchemaDraft(),renderAll:() => renderSchemas(),
    persistLibrary:() => persistSchemaLibrary(),proposeName:proposeInstalledSchemaWorkingDraftName,createId:(kind) => `schema:${kind}:${++canonicalController.idSequence}`,
    conceptSuggestions:ports.canonicalConceptSuggestions,...(ports.createCanonicalTableEditor ? { createTableEditor:ports.createCanonicalTableEditor } : {}),...(ports.settleCanonical ? { settle:ports.settleCanonical } : {}),
    closeRoute:(resolve) => editorRoute.close(resolve),generation:() => lifecycle.generation(),isCurrent:(generation) => lifecycle.isCurrent(generation),
    rulePicker:schemaPropertyRulePicker,setRulePicker:(path,trigger) => { ruleController.pickerPath=path; ruleController.pickerTrigger=trigger; ruleController.configuration=undefined; ruleController.editingAttached=undefined; },
    closeRulePicker:() => propertyRuleWorkflow.close(),
  });
  propertyController.configure({
    root:ports.root, active:() => active(), schemas:() => library.schemas, ruleIds:() => ruleController.rules.map(({ id }) => id),
    replaceActive:(schema) => replaceActive(schema), replaceSchemas:(schemas) => { library.schemas=structuredClone([...schemas]); },
    persist:() => persistSchemaLibrary(), renderAll:() => renderSchemas(), renderView:() => renderSchemaPropertyView(), renderRules:() => ruleController.render(),
    openRulePicker:(path, trigger) => propertyRuleWorkflow.open(path, trigger), queuePersistence:(schemaId) => canonicalPersistenceWorkflow.queueLibraryPersistence(schemaId),
    canonicalUndo:() => { if (!canonicalController.editor?.onUndo) return false; canonicalController.editor.onUndo(); return true; },
    removeCanonicalDocumentation:(schema, path) => {
      const draft=schema.workingDraft!, documentation=setPropertyDocumentation(draft.documentation ?? {}, path, { displayName:"", description:"" });
      const canonicalBase=canonicalController.savedSchemaId(canonicalController.editor) === schema.id ? canonicalController.savedDocument : draft.canonicalSchema,
        canonicalNode=canonicalBase && Object.values(canonicalBase.nodes).find((candidate) => canonicalPropertyPath(canonicalBase, candidate.id) === path),
        result=canonicalBase && canonicalNode ? applyCanonicalCommand(canonicalBase, { kind:"set", baseRevision:canonicalBase.revision, propertyId:canonicalNode.id,
          patch:{ documentation:{ displayText:"", description:"", comments:"", example:{ method:"blank" } } } }) : undefined,
        canonicalSchema=result?.status === "applied" || result?.status === "rebased" ? result.document : undefined;
      if (canonicalSchema && canonicalController.savedSchemaId(canonicalController.editor) === schema.id) canonicalController.savedDocument=canonicalSchema;
      return updateSchemaWorkingDraft(schema, { documentation, ...(canonicalSchema ? { canonicalSchema } : {}) }, `Remove property documentation ${path}`);
    },
    addManualCanonical:(schema, document, path) => {
      const previous=schema.workingDraft?.canonicalSchema; if (!previous) return undefined;
      const draft=schema.workingDraft!, projected:SchemaDefinition={ ...schema, document, name:draft.name ?? schema.name, assignments:draft.assignments,
        ...(draft.attachedRules ? { attachedRules:draft.attachedRules } : {}), ...(draft.documentation ? { documentation:draft.documentation } : {}) },
        canonical=savedSchemaCanonicalDocument(projected, (kind) => `schema:${kind}:${++canonicalController.idSequence}`,
          { id:previous.id, contributorId:previous.contributorId, contributorName:previous.contributorName });
      canonical.revision=previous.revision + 1; const selected=Object.values(canonical.nodes).find((node) => canonicalPropertyPath(canonical, node.id) === path)?.id;
      if (selected) canonical.selectedPropertyId=selected; return canonical;
    }, scheduleFrame:ports.scheduleFrame, ...(ports.settleCanonical ? { settle:ports.settleCanonical } : {}),
  });
  const propertyView = propertyDomain.createPropertyView({
    root:ports.root, document:schemaOwnerDocument, library, property:propertyController, rules:ruleController, canonical:canonicalController,
    active:() => active(), editorDraft:(schema) => schemaEditorDraft(schema), parentDocuments:() => propertyController.parentDocuments(),
    normalizedPath:(path) => propertyRuleWorkflow.normalizedPath(path), replaceActive:(schema) => replaceActive(schema),
    persistLibrary:() => persistSchemaLibrary(), persistLibraries:() => persistSchemaAndRuleLibraries(),
    queuePersistence:(schemaId) => canonicalPersistenceWorkflow.queueLibraryPersistence(schemaId), renderAll:() => renderSchemas(), createId:ports.createRuleId,
    settleCanonical:Boolean(ports.settleCanonical), openCanonicalActions:(path, trigger) => { canonicalView.openPropertyActions(path, trigger); },
    openCanonicalRule:(path, trigger) => { canonicalView.openRule(path, trigger); }, openManual:(path, trigger) => propertyController.openManual(path, trigger),
    openRulePicker:(path, trigger) => propertyRuleWorkflow.open(path, trigger), openSpecificIndex:(path, trigger) => propertyController.openSpecificIndex(path, trigger),
    openCopy:(path, trigger) => propertyController.openCopy(path, trigger), requestRemoval:(path, trigger) => propertyController.requestRemoval(path, trigger),
    requestDocumentationRemoval:(path, trigger) => propertyController.requestDocumentationRemoval(path, trigger),
    updateAttachedRule:(schemaId, ruleId, enabled) => { updateAttachedRule(schemaId, ruleId, enabled); },
    openAttachedRule:(schemaId, ruleId, path, trigger) => { propertyRuleWorkflow.openAttached(schemaId, ruleId, path, trigger); },
    promoteRule:(path, ruleId) => { openLocalRulePromotionReview(path, ruleId); },
  });
  const libraryEditor = libraryDomain.createEditor({
    root:ports.root, document:schemaOwnerDocument, library, canonical:canonicalController, active:() => active(),
    editorDraft:(schema) => schemaEditorDraft(schema), replaceActive:(schema) => replaceActive(schema), persist:() => persistSchemaLibrary(),
    renderAll:() => renderSchemas(), renderProperty:() => renderSchemaPropertyView(),
    revisionVersion:() => revisionVersion(), openSpecification:(schema, surface, trigger) => editorWorkflow.openSpecification(schema, surface, trigger), listen,
    proposeName:(schema, name) => proposeInstalledSchemaWorkingDraftName(schema, name), persistIfStored:() => persistEditedSchemaIfStored(),
    persistLibraries:() => persistSchemaAndRuleLibraries(), closeCanonical:() => canonicalPersistenceWorkflow.close(),
    beginSettlement:(schemaId) => canonicalPersistenceWorkflow.beginSettlement(schemaId), clearSettlement:(schemaId, settlement) => { canonicalPersistenceWorkflow.clearSettlement(schemaId, settlement); },
    ...(ports.settleCanonical ? { settle:ports.settleCanonical } : {}), mounted:() => lifecycle.isMounted(), renderCanonical:() => canonicalPersistenceWorkflow.render(),
    revalidate:() => refreshCurrentLiveAfterSchemaPublication(), rules:() => ruleController.rules,
    addPublishedRules:(published) => { let changed=false; for (const rule of published.attachedRules ?? []) { if (!rule.id.startsWith("rule:") || ruleController.rules.some(({ id }) => id === rule.id)) continue;
      ruleController.rules=[...ruleController.rules,{ id:rule.id,name:rule.name ?? rule.id,kind:rule.operator ?? "required",version:rule.version,enabled:rule.enabled !== false,
        ...(rule.operator ? { operator:rule.operator } : {}),...(rule.parameters ? { parameters:rule.parameters } : {}),...(rule.severity ? { severity:rule.severity } : {}),
        ...(rule.message ? { message:rule.message } : {}),attachments:[published.id] }]; changed=true; } return changed; },
    withParent:(schema, parentSchemaId) => withSchemaParent(schema, parentSchemaId),
  });
  editorWorkflow=new SchemaInstalledEditorWorkflow({ root:ports.root,library,editor:libraryEditor,property:propertyController,
    schemaEditor,schemaDetailEmpty,schemaEditorName,propertyFilter:schemaPropertyFilter,subviews:schemaSubviews,panels:schemaPanels,
    liveEventQuery,specificationBuilder:schemaSpecificationBuilder,renderProperty:() => propertyView.render(),renderAll:() => renderSchemas(),
    showSchemas:ports.showSchemasView,openRoute:() => editorRoute.open(createSchemaButton ?? undefined),createEmpty:() => sourceController.createEmpty(),
    settleCanonical:Boolean(ports.settleCanonical),renderSpecification:ports.renderSchemaSpecification });
  relationshipView=libraryDomain.createRelationship({ controller:relationshipTreeController,library,route:editorRoute,
    canonical:canonicalController,list:schemaList,detail:schemaDetail,mounted:()=>lifecycle.isMounted(),relationship:ports.relationshipTree,
    renderDraft:()=>libraryEditor.render(),renderAssignments:()=>{assignmentController.render();},persist:()=>library.persist(),
    openSaved:(schema)=>canonicalView.openSaved(schema),adopt:(schema,trigger)=>ports.adoptSavedSchema(schema,trigger),
    build:(schema,trigger)=>editorWorkflow.openSpecification(schema,`published:${schema.version}`,trigger),openContributor:ports.openContributor,
    openContributorInStudio:ports.openContributorInStudio,openProject:ports.openProjectLibrary,reportMissing:ports.reportMissingSchemaEvent });
  canonicalPersistenceWorkflow=new SchemaCanonicalPersistenceWorkflow({ root:ports.root,storage:ports.storage,library,rules:ruleController,property:propertyController,
    canonical:canonicalController,view:canonicalView,editor:schemaEditor,save:saveSchemaButton,scheduleFrame:ports.scheduleFrame,
    renderAll:() => renderSchemas(),editorDraft:schemaEditorDraft });
  commitPromotionTransaction=(...args) => canonicalPersistenceWorkflow.promote(...args);
  applyGuidedPersistence=(schemas,rules) => canonicalPersistenceWorkflow.apply(schemas,rules);
  beginGuidedPersistence=(schemaId,previousSchemas,previousRules,nextSchemas,nextRules) => canonicalPersistenceWorkflow.begin("guided",schemaId,previousSchemas,previousRules,nextSchemas,nextRules);
  propertyRuleWorkflow=new SchemaPropertyRuleWorkflow({ rule:ruleController,property:propertyController,
    canonical:canonicalController,canonicalView,pickerView:rulePickerView,picker:schemaPropertyRulePicker,
    propertyTree:schemaPropertyTree,schemaEditor,schemaDetail,document:schemaOwnerDocument,active:()=>library.active(),
    activeSchemaId:()=>library.activeSchemaId,draft:()=>library.draft,schemas:()=>library.schemas,
    renderSchemas:()=>renderSchemas(),showSubview:(subview) => editorWorkflow.showSubview(subview),
    attach:(schemaId,ruleId,path,rule)=>ruleController.attach(schemaId,ruleId,path,rule),
    propertyType:(schema,path)=>ruleController.typeForAttachment(schema,path) });
  const activeIndex = (): number => library.activeIndex();
  const active = (): SchemaDefinition => library.active();
  const serializeChangedSchemaLibrary = (nextSchemas:readonly SchemaDefinition[]):string => library.serialize(nextSchemas);
  const persistSchemaLibrary = (): void => library.persist();
  const persistEditedSchemaIfStored = (): void => { if (activeIndex() >= 0) persistSchemaLibrary(); };
  const replaceActive = (schema: SchemaDefinition): void => library.replaceActive(schema);
  const revisionVersion = (): number => Number(schemaRevisionSelector?.value || active().version);
  const renderSchemaPropertyView = ():void => propertyView.render();
  function renderSchemaDraft():void { libraryEditor.render(); }
  const renderSchemas=():void=>relationshipView.render();
  const updateSchemaTreeView=():void=>relationshipView.update();
  const persistSchemaTreeScroll=():void=>relationshipView.persistScroll();
  const navigateSchemaTree=(event:KeyboardEvent):void=>relationshipView.navigate(event);
  function refreshCurrentLiveAfterSchemaPublication():number { return ports.revalidateCurrentLive?.(structuredClone(library.schemas),structuredClone(validationController.manualOverrides)) ?? 0; }
  const persistReusableSchemaRules = (): void => ruleController.persist();
  const openLocalRulePromotionReview = (propertyPath:string,sourceRuleId:string):boolean => ruleController.openPromotion(propertyPath,sourceRuleId);
  const expansionReusableRules = ():readonly PromotableReusableRule[] => structuredClone(ruleController.rules) as readonly PromotableReusableRule[];
  const promotionReusableRules = expansionReusableRules;
  const persistSchemaAndRuleLibraries = ():void => { persistSchemaLibrary(); persistReusableSchemaRules(); };
  const attachReusableRule = (schemaId:string, ruleId:string, propertyPath?:string, suppliedRule?:ReusableSchemaRule):boolean => ruleController.attach(schemaId,ruleId,propertyPath,suppliedRule);
  const updateAttachedRule = (schemaId:string, ruleId:string, enabled:boolean):boolean => ruleController.updateAttached(schemaId,ruleId,enabled);
  const focusSchemaPropertyRule = (propertyPath:string):void => { propertyController.selectedPath = propertyPath.replace(/^\//, "").replaceAll("/", "."); renderSchemas(); };
  const focusSchemaPropertyRow = focusSchemaPropertyRule;
  const renderSchemaWorkflowRows = ():void => { ruleController.render(); assignmentController.render(); };
  const rememberCompactCanonicalScroll = ():void => { if (canonicalController.editor && schemaDetail && schemaDetail.scrollTop > 0)
    canonicalController.scrollByKey.set(canonicalController.editor.key, schemaDetail.scrollTop); };
  const projectHydration=new SchemaProjectHydrationCoordinator({ activeProjectId:ports.activeProjectId,
    generation:() => lifecycle.generation(),isMounted:() => lifecycle.isMounted(),
    ensure:(projectId) => ports.ensureProjectSchemaContributors(projectId,schemaContributorRoute),
    invalidate:() => relationshipTreeController.invalidateProject(),render:renderSchemas,result:schemaResult });
  let sidePanelLayeredProfileEditor:{ dispose():void } | undefined;
  guidedWorkflow=new SchemaGuidedInstalledWorkflow({ controller:guidedController,root:guidedValidationRoot,
    schemas:() => library.schemas,generation:() => lifecycle.generation(),result:schemaResult,
    ...(ports.guidedSaved ? { saved:ports.guidedSaved } : {}),
    restoreCapture:ports.restoreGuidedCapture,openDraft:(schema) => editorWorkflow.openDraft(schema),openRevisionReview:() => editorWorkflow.openRevision() });
  return {
    mount(): void {
      if (!lifecycle.mount()) return;
      editorRoute.mount();
      sidePanelLayeredProfileEditor = ports.mountLayeredProfileEditor();
      bindSchemaEditorLifecycle(lifecycle,editorElements,editorWorkflow.editorBindings({ updateTree:updateSchemaTreeView,recheck:()=>validationController.recheck(),persistTreeScroll:persistSchemaTreeScroll,navigateTree:navigateSchemaTree,rememberCanonicalScroll:rememberCompactCanonicalScroll }));
      bindSchemaPropertyLifecycle(lifecycle,propertyElements,schemaSubviews,editorWorkflow.propertyBindings({ render:renderSchemaPropertyView,undoCopy:() => editorWorkflow.undoCopy(),cancelRulePicker:(event)=>propertyRuleWorkflow.cancel(event),navigateRulePicker:(event)=>propertyRuleWorkflow.navigate(event) }));
      bindSchemaRuleElements(lifecycle, installedRuleElements, ruleController, () => propertyRuleWorkflow.updatePreview());
      bindSchemaAssignmentElements(lifecycle, assignmentElements, createSchemaAssignmentButton, assignmentController);
      bindSchemaLibraryElements(lifecycle, libraryElements, library);
      unsubscribe = ports.subscribe((activeProjectId) => {
        library.reload();
        ruleController.reload();
        if (library.activeSchemaId) { const activeStored = library.schemas.find(({ id }) => id === library.activeSchemaId); if (activeStored) library.draft = schemaEditorDraft(activeStored); }
        if (!schemaPanel?.hidden && activeProjectId && projectHydration.needs(activeProjectId)) void projectHydration.hydrate(activeProjectId);
        renderSchemas(); ruleController.render();
        if (canonicalController.editor) canonicalPersistenceWorkflow.render();
      });
      unsubscribeSchemaPersistence = ports.subscribeSchemaPersistence((event) => canonicalPersistenceWorkflow.settle(event));
      renderSchemas(); ruleController.render(); validationController.render();
    },
    dispose(): void {
      if (!lifecycle.dispose()) return;
      editorRoute.dispose();
      pendingSchemaRestoration = undefined;
      library.pendingImport = undefined; library.pendingDeletion = undefined;
      library.pendingStandardExport = undefined; library.exportTrigger = undefined;
      schemaExportChoices?.close(); schemaExportReview?.close(); schemaExportChoices?.replaceChildren(); schemaExportReview?.replaceChildren();
      if (buildSpecificationButton) buildSpecificationButton.onclick = null;
      if (buildHistoricalSpecificationButton) buildHistoricalSpecificationButton.onclick = null;
      if (schemaSpecificationBuilder) { schemaSpecificationBuilder.hidden = true; schemaSpecificationBuilder.replaceChildren(); }
      canonicalPersistenceWorkflow.close(false);canonicalView.dispose();
      sidePanelLayeredProfileEditor?.dispose(); sidePanelLayeredProfileEditor = undefined;
      guidedWorkflow.flow.close();canonicalDomain.dispose();
      guidedValidationRoot?.replaceChildren();
      const disposed = new Error("Schemas controller disposed before durable persistence settled");
      canonicalPersistenceWorkflow.dispose(disposed);
      propertyDomain.dispose();localRulePromotionDialog.close();
      unsubscribe?.(); unsubscribe = undefined;
      unsubscribeSchemaPersistence?.(); unsubscribeSchemaPersistence = undefined;
      projectHydration.reset();
      relationshipTreeController.dispose();
      propertyView.dispose();
      schemaList?.replaceChildren();
      assignmentElements.list?.replaceChildren();
      assignmentElements.conditions?.replaceChildren();
    },
    ...createSchemaLibraryPublicOperations({ library, active, activeIndex, persist:persistSchemaLibrary,
      render:renderSchemas, publish:() => editorWorkflow.publish(), exportButton:exportSchemaButton, mounted:() => lifecycle.isMounted() }),
    ...createSchemaAuthoringPublicOperations({ property:propertyController, rule:ruleController,
      canonical:canonicalController, renderRulePicker:() => propertyRuleWorkflow.render() }, {
      openSchemaFromSource:(source:SchemaSourceDraftInput) => sourceController.open(source), requestPropertyRemoval:(path:string,trigger?:HTMLButtonElement) => editorWorkflow.requestRemoval(path,trigger),
      requestDocumentationRemoval:(path:string,trigger?:HTMLElement) => editorWorkflow.requestDocumentationRemoval(path,trigger), requestPropertyCopy:(path:string,target:HTMLButtonElement|string) => editorWorkflow.openCopy(path,target),
      confirmPropertyCopy:() => editorWorkflow.confirmCopy(), openSpecificIndex:(path:string,trigger?:HTMLButtonElement) => editorWorkflow.openSpecificIndex(path,trigger),
      openManualProperty:(path?:string,trigger?:HTMLButtonElement) => editorWorkflow.openManual(path,trigger), openContextualManualProperty:(path:string,trigger?:HTMLButtonElement) => editorWorkflow.openManual(path,trigger),
      capturePropertyReturn:(path:string,label:string) => propertyRuleWorkflow.captureReturn(path,label), restorePropertyReturn:() => propertyRuleWorkflow.restoreReturn(),
      closeRulePickerForCommit:() => propertyRuleWorkflow.closeForCommit(), openRulePicker:(path:string,trigger?:HTMLButtonElement) => propertyRuleWorkflow.open(path,trigger),
      openCanonicalRuleEditor:(path:string,trigger?:HTMLButtonElement) => canonicalView.openRule(path,trigger),
      openCanonicalPropertyActions:(path:string,trigger?:HTMLButtonElement) => canonicalView.openPropertyActions(path,trigger), configuredRule:() => propertyRuleWorkflow.configuredRule(),
      conditionPredicate:(path:string) => propertyRuleWorkflow.sampledCondition(path), createConfiguredRule:() => propertyRuleWorkflow.createConfigured(),
      openAttachedRule:(schemaId:string,ruleId:string,path?:string,trigger?:HTMLButtonElement) => propertyRuleWorkflow.openAttached(schemaId,ruleId,path,trigger), attachReusableRule, updateAttachedRule,
      focusPropertyRule:focusSchemaPropertyRule, focusPropertyRow:focusSchemaPropertyRow,
      promotionRules:promotionReusableRules, renderWorkflow:renderSchemaWorkflowRows,
      editAssignment:(schemaId:string,assignment:SchemaAssignment) => assignmentController.edit(schemaId,assignment),
      requestLocalRulePromotion:openLocalRulePromotionReview }),
    ...createGuidedPublicOperations({ guided:guidedController, validation:validationController,
      property:propertyController, schemas:() => library.schemas, active, activeSchemaId:() => library.activeSchemaId,
      root:guidedValidationRoot, generation:() => lifecycle.generation(), flow:guidedWorkflow.flow,
      candidate:(schema) => guidedWorkflow.candidate(schema), openProperty:(event,schema,path,restore) => guidedWorkflow.openProperty(event,schema,path,restore) }, {
      persistGuidedValidation:(result:PublishedGuidedValidation) => guidedWorkflow.persistAndFinish(result),
      openGuidedEvent:(event:GuidedCapturedEvent,schema?:SchemaDefinition) => guidedWorkflow.openEvent(event,schema),
      openGuidedProperty:(event:GuidedCapturedEvent,schema:SchemaDefinition|undefined,path:string,restore?:boolean) => guidedWorkflow.openProperty(event,schema,path,restore),
      openLivePropertyDeclaration:(event:GuidedCapturedEvent,path:string,trigger:HTMLButtonElement) => guidedController.openLivePropertyDeclaration(event,path,trigger),
      openAllowedValueExpansionReview:(eventId:string,schemaId:string,evaluation:ValidationEvaluation,trigger:HTMLButtonElement) => guidedController.openAllowedValueExpansion(eventId,schemaId,evaluation,trigger),
      guidedContinuation:(event:GuidedCapturedEvent) => guidedWorkflow.continuation(event), refreshCurrentLiveAfterSchemaPublication,
      hydrateActiveProjectForSchemas:() => projectHydration.hydrateActive() }),
    show():void { renderSchemas(); relationshipTreeController.restoreScroll(); },
    ...createCanonicalPublicOperations({ controller:canonicalController,
      schema:(id) => library.schemas.find((schema) => schema.id === id), openSaved:(schema) => canonicalPersistenceWorkflow.openSaved(schema),
      open:(adapter) => canonicalPersistenceWorkflow.open(adapter), close:(clearSelection) => canonicalPersistenceWorkflow.close(clearSelection),
      show:() => { renderSchemas(); relationshipTreeController.restoreScroll(); },
      projection:(adapter) => canonicalPersistenceWorkflow.projection(adapter), facet:(canonical,node) => canonicalPersistenceWorkflow.facet(canonical,node), render:() => canonicalPersistenceWorkflow.render() }),
  };
}
export const installedControllerDefinition = Object.freeze({ id:"schemas",
  capabilities:["schema and rule libraries", "drafts", "assignments", "validation", "guided validation"],
});
