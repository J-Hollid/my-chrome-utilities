import { bindSchemaAssignmentElements } from "./assignment-controller.js";
import { bindSchemaEditorLifecycle, bindSchemaPropertyLifecycle } from "./installed-bindings.js";
import { bindSchemaLibraryElements } from "./library-installed-view.js";
import type { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import type { SchemaCanonicalPersistenceWorkflow } from "./canonical-persistence-workflow.js";
import type { SchemasInstalledPorts } from "./contracts.js";
import type { SchemaInstalledEditorWorkflow } from "./installed-editor-workflow.js";
import type { SchemaLibraryController } from "./library-controller.js";
import type { SchemaProjectHydrationCoordinator } from "./project-hydration.js";
import type { SchemaPropertyRuleWorkflow } from "./property-rule-workflow.js";
import { bindSchemaRuleElements } from "./rule-installed-view.js";
import { schemaEditorDraft } from "./schema-model.js";
import type { SchemaRuleController } from "./rule-controller.js";
import type { SchemaValidationController } from "./validation-controller.js";

interface LifecycleOwnerLinks {
  lifecycle:Parameters<typeof bindSchemaEditorLifecycle>[0];route:{mount():void;dispose():void};editorElements:Parameters<typeof bindSchemaEditorLifecycle>[1];propertyElements:Parameters<typeof bindSchemaPropertyLifecycle>[1];subviews:Parameters<typeof bindSchemaPropertyLifecycle>[2];
  ruleElements:Parameters<typeof bindSchemaRuleElements>[1];assignmentElements:Parameters<typeof bindSchemaAssignmentElements>[1];createAssignment:HTMLButtonElement|null;libraryElements:Parameters<typeof bindSchemaLibraryElements>[1];
  editor:SchemaInstalledEditorWorkflow;propertyWorkflow:SchemaPropertyRuleWorkflow;rule:SchemaRuleController;assignment:Parameters<typeof bindSchemaAssignmentElements>[3];library:SchemaLibraryController;validation:SchemaValidationController;
  canonical:SchemaCanonicalEditorController;persistence:SchemaCanonicalPersistenceWorkflow;projectHydration:SchemaProjectHydrationCoordinator;canonicalDomain:{dispose():void};propertyDomain:{dispose():void};libraryDomain:{dispose():void};
  schemaPanel:HTMLElement|null;schemaList:HTMLElement|null;guidedRoot:HTMLElement|null;exportChoices:HTMLDialogElement|null;exportReview:HTMLDialogElement|null;specificationBuilder:HTMLElement|null;buildSpecification:HTMLButtonElement|null;buildHistoricalSpecification:HTMLButtonElement|null;
  promotionDialog:{close():void};mountLayered:SchemasInstalledPorts["mountLayeredProfileEditor"];subscribe:SchemasInstalledPorts["subscribe"];subscribePersistence:SchemasInstalledPorts["subscribeSchemaPersistence"];
  render():void;renderProperty():void;updateTree():void;persistTreeScroll():void;navigateTree(event:KeyboardEvent):void;rememberCanonicalScroll():void;
}

/** Owns installed listener assembly, subscriptions, mount order, and teardown order. */
export function createSchemasInstalledLifecycleOwner(p:LifecycleOwnerLinks) {
  let unsubscribe:(()=>void)|undefined,unsubscribePersistence:(()=>void)|undefined,layered:{dispose():void}|undefined;
  return {mount():void {
    if(!p.lifecycle.mount())return;p.route.mount();layered=p.mountLayered();
    bindSchemaEditorLifecycle(p.lifecycle,p.editorElements,p.editor.editorBindings({updateTree:p.updateTree,recheck:() => p.validation.recheck(),persistTreeScroll:p.persistTreeScroll,navigateTree:p.navigateTree,rememberCanonicalScroll:p.rememberCanonicalScroll}));
    bindSchemaPropertyLifecycle(p.lifecycle,p.propertyElements,p.subviews,p.editor.propertyBindings({render:p.renderProperty,undoCopy:() => p.editor.undoCopy(),cancelRulePicker:(event) => p.propertyWorkflow.cancel(event),navigateRulePicker:(event) => p.propertyWorkflow.navigate(event)}));
    bindSchemaRuleElements(p.lifecycle,p.ruleElements,p.rule,() => p.propertyWorkflow.updatePreview());bindSchemaAssignmentElements(p.lifecycle,p.assignmentElements,p.createAssignment,p.assignment);bindSchemaLibraryElements(p.lifecycle,p.libraryElements,p.library);
    unsubscribe=p.subscribe((activeProjectId) => {p.library.reload();p.rule.reload();if(p.library.activeSchemaId){const active=p.library.schemas.find(({id}) => id===p.library.activeSchemaId);if(active)p.library.setDraft(schemaEditorDraft(active));}if(!p.schemaPanel?.hidden&&activeProjectId&&p.projectHydration.needs(activeProjectId))void p.projectHydration.hydrate(activeProjectId);p.render();p.rule.render();if(p.canonical.editor)p.persistence.render();});
    unsubscribePersistence=p.subscribePersistence((event) => p.persistence.settle(event));p.render();p.rule.render();p.validation.render();
  },dispose():void {
    if(!p.lifecycle.dispose())return;p.route.dispose();p.library.pendingImport=undefined;p.library.pendingDeletion=undefined;p.library.pendingStandardExport=undefined;p.library.exportTrigger=undefined;
    p.exportChoices?.close();p.exportReview?.close();p.exportChoices?.replaceChildren();p.exportReview?.replaceChildren();if(p.buildSpecification)p.buildSpecification.onclick=null;if(p.buildHistoricalSpecification)p.buildHistoricalSpecification.onclick=null;if(p.specificationBuilder){p.specificationBuilder.hidden=true;p.specificationBuilder.replaceChildren();}
    layered?.dispose();layered=undefined;p.canonicalDomain.dispose();p.guidedRoot?.replaceChildren();p.propertyDomain.dispose();p.promotionDialog.close();unsubscribe?.();unsubscribe=undefined;unsubscribePersistence?.();unsubscribePersistence=undefined;p.libraryDomain.dispose();p.schemaList?.replaceChildren();p.assignmentElements.list?.replaceChildren();p.assignmentElements.conditions?.replaceChildren();
  }};
}
