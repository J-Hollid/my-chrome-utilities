import type { SchemaAssignment, SchemaDefinition, PublishedGuidedValidation } from "../../utilities/data-layer/schemas.js";
import type { ValidationEvaluation } from "../../data-layer-validation-model.js";
import { createSchemaAuthoringPublicOperations } from "./authoring-public-operations.js";
import { createCanonicalPublicOperations } from "./canonical-public-operations.js";
import type { SchemaCanonicalInstalledView } from "./canonical-installed-view.js";
import type { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import type { SchemaCanonicalPersistenceWorkflow } from "./canonical-persistence-workflow.js";
import { createGuidedPublicOperations } from "./guided-public-operations.js";
import type { GuidedCapturedEvent, SchemaGuidedValidationController } from "./guided-validation-controller.js";
import type { SchemaGuidedInstalledWorkflow } from "./guided-installed-workflow.js";
import type { SchemaInstalledEditorWorkflow } from "./installed-editor-workflow.js";
import type { SchemaLibraryController } from "./library-controller.js";
import { createSchemaLibraryPublicOperations } from "./library-public-operations.js";
import type { SchemaProjectHydrationCoordinator } from "./project-hydration.js";
import type { SchemaPropertyController } from "./property-controller.js";
import type { SchemaPropertyRuleWorkflow } from "./property-rule-workflow.js";
import { createSchemaRelationshipTreeController } from "./relationship-tree-controller.js";
import type { SchemaRuleController } from "./rule-controller.js";
import type { SchemaSourceController } from "./source-controller.js";
import type { SchemaValidationController } from "./validation-controller.js";
import type { ReusableSchemaRule, SchemaSourceDraftInput } from "./contracts.js";

interface PublicFacadeLinks {
  library:SchemaLibraryController;property:SchemaPropertyController;rule:SchemaRuleController;assignment:{edit(schemaId:string,assignment:SchemaAssignment):void;render():void};canonical:SchemaCanonicalEditorController;
  canonicalView:SchemaCanonicalInstalledView;canonicalPersistence:SchemaCanonicalPersistenceWorkflow;guided:SchemaGuidedValidationController;validation:SchemaValidationController;
  propertyWorkflow:SchemaPropertyRuleWorkflow;guidedWorkflow:SchemaGuidedInstalledWorkflow;editorWorkflow:SchemaInstalledEditorWorkflow;source:SchemaSourceController;
  relationshipTree:ReturnType<typeof createSchemaRelationshipTreeController>;projectHydration:SchemaProjectHydrationCoordinator;guidedRoot:HTMLElement|null;exportButton:HTMLButtonElement|null;
  lifecycle:{isMounted():boolean;generation():number};render():void;refreshLive():number;
}

/** Builds the installed controller's public operation surface from domain facades. */
export function createSchemasInstalledPublicFacade(p:PublicFacadeLinks) {
  const active=():SchemaDefinition => p.library.active(),activeIndex=():number => p.library.activeIndex();
  const promotionRules=():readonly ReusableSchemaRule[] => structuredClone(p.rule.rules);
  const focus=(path:string):void => {p.property.selectedPath=path.replace(/^\//,"").replaceAll("/", ".");p.render();};
  return {
    ...createSchemaLibraryPublicOperations({library:p.library,active,activeIndex,persist:() => p.library.persist(),render:p.render,publish:() => p.editorWorkflow.publish(),exportButton:p.exportButton,mounted:() => p.lifecycle.isMounted()}),
    ...createSchemaAuthoringPublicOperations({property:p.property,rule:p.rule,canonical:p.canonical,renderRulePicker:() => p.propertyWorkflow.render()},{
      openSchemaFromSource:(source:SchemaSourceDraftInput) => p.source.open(source),requestPropertyRemoval:(path:string,trigger?:HTMLButtonElement) => p.editorWorkflow.requestRemoval(path,trigger),requestDocumentationRemoval:(path:string,trigger?:HTMLElement) => p.editorWorkflow.requestDocumentationRemoval(path,trigger),
      requestPropertyCopy:(path:string,target:HTMLButtonElement|string) => p.editorWorkflow.openCopy(path,target),confirmPropertyCopy:() => p.editorWorkflow.confirmCopy(),openSpecificIndex:(path:string,trigger?:HTMLButtonElement) => p.editorWorkflow.openSpecificIndex(path,trigger),openManualProperty:(path?:string,trigger?:HTMLButtonElement) => p.editorWorkflow.openManual(path,trigger),openContextualManualProperty:(path:string,trigger?:HTMLButtonElement) => p.editorWorkflow.openManual(path,trigger),
      capturePropertyReturn:(path:string,label:string) => p.propertyWorkflow.captureReturn(path,label),restorePropertyReturn:() => p.propertyWorkflow.restoreReturn(),closeRulePickerForCommit:() => p.propertyWorkflow.closeForCommit(),openRulePicker:(path:string,trigger?:HTMLButtonElement) => p.propertyWorkflow.open(path,trigger),
      openCanonicalRuleEditor:(path:string,trigger?:HTMLButtonElement) => p.canonicalView.openRule(path,trigger),openCanonicalPropertyActions:(path:string,trigger?:HTMLButtonElement) => p.canonicalView.openPropertyActions(path,trigger),configuredRule:() => p.propertyWorkflow.configuredRule(),conditionPredicate:(path:string) => p.propertyWorkflow.sampledCondition(path),createConfiguredRule:() => p.propertyWorkflow.createConfigured(),
      openAttachedRule:(schemaId:string,ruleId:string,path?:string,trigger?:HTMLButtonElement) => p.propertyWorkflow.openAttached(schemaId,ruleId,path,trigger),attachReusableRule:(schemaId:string,ruleId:string,path?:string,rule?:ReusableSchemaRule) => p.rule.attach(schemaId,ruleId,path,rule),updateAttachedRule:(schemaId:string,ruleId:string,enabled:boolean) => p.rule.updateAttached(schemaId,ruleId,enabled),
      focusPropertyRule:focus,focusPropertyRow:focus,promotionRules,renderWorkflow:() => {p.rule.render();p.assignment.render();},editAssignment:(schemaId:string,assignment:SchemaAssignment) => p.assignment.edit(schemaId,assignment),requestLocalRulePromotion:(path:string,ruleId:string) => p.rule.openPromotion(path,ruleId)}),
    ...createGuidedPublicOperations({guided:p.guided,validation:p.validation,property:p.property,schemas:() => p.library.schemas,active,activeSchemaId:() => p.library.activeSchemaId,root:p.guidedRoot,generation:() => p.lifecycle.generation(),flow:p.guidedWorkflow.flow,candidate:(schema) => p.guidedWorkflow.candidate(schema),openProperty:(event,schema,path,restore) => p.guidedWorkflow.openProperty(event,schema,path,restore)}, {
      persistGuidedValidation:(result:PublishedGuidedValidation) => p.guidedWorkflow.persistAndFinish(result),openGuidedEvent:(event:GuidedCapturedEvent,schema?:SchemaDefinition) => p.guidedWorkflow.openEvent(event,schema),openGuidedProperty:(event:GuidedCapturedEvent,schema:SchemaDefinition|undefined,path:string,restore?:boolean) => p.guidedWorkflow.openProperty(event,schema,path,restore),
      openLivePropertyDeclaration:(event:GuidedCapturedEvent,path:string,trigger:HTMLButtonElement) => p.guided.openLivePropertyDeclaration(event,path,trigger),openAllowedValueExpansionReview:(eventId:string,schemaId:string,evaluation:ValidationEvaluation,trigger:HTMLButtonElement) => p.guided.openAllowedValueExpansion(eventId,schemaId,evaluation,trigger),guidedContinuation:(event:GuidedCapturedEvent) => p.guidedWorkflow.continuation(event),refreshCurrentLiveAfterSchemaPublication:p.refreshLive,hydrateActiveProjectForSchemas:() => p.projectHydration.hydrateActive()}),
    show():void {p.render();p.relationshipTree.restoreScroll();},
    ...createCanonicalPublicOperations({controller:p.canonical,schema:(id) => p.library.schemas.find((schema) => schema.id===id),openSaved:(schema) => p.canonicalPersistence.openSaved(schema),open:(adapter) => p.canonicalPersistence.open(adapter),close:(clear) => p.canonicalPersistence.close(clear),show:() => {p.render();p.relationshipTree.restoreScroll();},projection:(adapter) => p.canonicalPersistence.projection(adapter),facet:(canonical,node) => p.canonicalPersistence.facet(canonical,node),render:() => p.canonicalPersistence.render()})
  };
}
