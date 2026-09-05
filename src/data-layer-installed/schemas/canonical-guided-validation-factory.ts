import { SCHEMA_LIBRARY_STORAGE_KEY, proposeSchemaWorkingDraftName, type PromotableReusableRule, type SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { SchemasInstalledPorts } from "./contracts.js";
import { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import { SchemaCanonicalInstalledView } from "./canonical-installed-view.js";
import { SchemaCanonicalPersistenceWorkflow } from "./canonical-persistence-workflow.js";
import { SchemaGuidedInstalledWorkflow } from "./guided-installed-workflow.js";
import { SchemaGuidedValidationController } from "./guided-validation-controller.js";
import type { SchemaInstalledEditorWorkflow } from "./installed-editor-workflow.js";
import type { SchemaLibraryController } from "./library-controller.js";
import type { SchemaPropertyController } from "./property-controller.js";
import type { SchemaPropertyRuleWorkflow } from "./property-rule-workflow.js";
import type { SchemaRuleController } from "./rule-controller.js";
import { schemaEditorDraft, schemaPropertyAt, storedPromotionRules } from "./schema-model.js";
import { SchemaValidationController } from "./validation-controller.js";

interface CanonicalElements {
  context:HTMLElement|null;editor:HTMLElement|null;detail:HTMLElement|null;detailEmpty:HTMLElement|null;save:HTMLButtonElement|null;list:HTMLElement|null;
  guidedRoot:HTMLElement|null;issues:HTMLElement|null;records:HTMLElement|null;result:HTMLElement|null;document:Document|undefined;rulePicker:HTMLDialogElement|null;
}

interface CanonicalDomainLinks {
  root:ParentNode;storage:Pick<Storage,"getItem"|"setItem"|"removeItem">;elements:CanonicalElements;library:SchemaLibraryController;property:SchemaPropertyController;
    rule:SchemaRuleController;
  lifecycle:{generation():number;isCurrent(generation:number):boolean;isMounted():boolean};editorRoute:{close(resolve:(referenceKey:string)=>HTMLElement|undefined):void};
    editor():SchemaInstalledEditorWorkflow;propertyWorkflow():SchemaPropertyRuleWorkflow;
  renderAll():void;renderDraft():void;persistLibrary():void;persistLibraries():void;expansionRules():readonly PromotableReusableRule[];refreshLive():number;
  createId:SchemasInstalledPorts["createRuleId"];scheduleFrame:SchemasInstalledPorts["scheduleFrame"];changed:SchemasInstalledPorts["changed"];
  prepare?:SchemasInstalledPorts["prepareCapturedValidationContinuation"];restoreCapture:SchemasInstalledPorts["restoreGuidedCapture"];saved?:SchemasInstalledPorts["guidedSaved"];
  conceptSuggestions:SchemasInstalledPorts["canonicalConceptSuggestions"];createTableEditor?:SchemasInstalledPorts["createCanonicalTableEditor"];
    settle?:SchemasInstalledPorts["settleCanonical"];blocked?:SchemasInstalledPorts["blocked"];
  guidedFlowFactory?:ConstructorParameters<typeof SchemaGuidedInstalledWorkflow>[0]["flowFactory"];
}

/** Owns complete canonical, guided-validation, and validation composition. */
export function createSchemaCanonicalGuidedValidationDomain(p:CanonicalDomainLinks) {
  let persistence!:SchemaCanonicalPersistenceWorkflow,guidedWorkflow!:SchemaGuidedInstalledWorkflow;
  const validation=new SchemaValidationController(p.storage,{list:p.elements.records,issues:p.elements.issues,result:p.elements.result,guidedRoot:p.elements.guidedRoot,
    document:p.elements.document,
    ...(p.prepare?{prepare:p.prepare}:{}),schemas:() => p.library.schemas,generation:() => p.lifecycle.generation(),isCurrent:(generation) => p.lifecycle.isCurrent(generation)});
  const guided=new SchemaGuidedValidationController(p.storage);
  const canonical=new SchemaCanonicalEditorController({blocked:() => Boolean(p.blocked?.()),generation:() => p.lifecycle.generation(),
    isCurrent:(generation) => p.lifecycle.isCurrent(generation),
    setBusy:(busy) => {p.elements.editor?.setAttribute("aria-busy",String(busy));if(busy&&p.elements.save)p.elements.save.disabled=true;},
      renderContext:() => persistence.renderContext(),renderEditor:() => persistence.render(),createId:p.createId,
    writeLibrary:(schemas) => {p.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY,p.library.serialize(schemas));p.changed(schemas);},...(p.settle?{settleLibrary:p.settle}:{}),
      mounted:() => p.lifecycle.isMounted()});
  const proposeName=(schema:SchemaDefinition,proposed:string):SchemaDefinition => {const updated=proposeSchemaWorkingDraftName(schema,proposed),draft=updated.workingDraft;
    return !draft?.canonicalSchema||!proposed?updated:{...updated,workingDraft:{...draft,canonicalSchema:{...draft.canonicalSchema,contributorName:proposed}}};};
  const view=new SchemaCanonicalInstalledView({controller:canonical,elements:{context:p.elements.context,editor:p.elements.editor,detail:p.elements.detail,
    detailEmpty:p.elements.detailEmpty,save:p.elements.save,list:p.elements.list,document:p.elements.document},
    activeSchemaId:() => p.library.activeSchemaId,setActiveSchemaId:(id) => {if(id)p.library.select(id);else p.library.clearSelection();},draft:() => p.library.draft,
      setDraft:(schema) => p.library.setDraft(schema),schemas:() => p.library.schemas,replaceSchemas:(schemas) => p.library.replaceSchemas(schemas),
    editorDraft:schemaEditorDraft,propertyAt:schemaPropertyAt,selectedPath:() => p.property.selectedPath,setSelectedPath:(path) => p.property.selectPath(path),
      renderDraft:p.renderDraft,renderAll:p.renderAll,persistLibrary:p.persistLibrary,
    proposeName,createId:(kind) => canonical.createCanonicalId(kind),conceptSuggestions:p.conceptSuggestions,...(p.createTableEditor?{createTableEditor:p.createTableEditor}:{}),
      ...(p.settle?{settle:p.settle}:{}),
    closeRoute:(resolve) => p.editorRoute.close(resolve),generation:() => p.lifecycle.generation(),isCurrent:(generation) => p.lifecycle.isCurrent(generation),
      rulePicker:p.elements.rulePicker,
    setRulePicker:(path,trigger) => {p.rule.setPicker(path,trigger);p.rule.setConfiguration(undefined);p.rule.setEditingAttached(undefined);},
      closeRulePicker:() => p.propertyWorkflow().close()});
  persistence=new SchemaCanonicalPersistenceWorkflow({root:p.root,storage:p.storage,library:p.library,rules:p.rule,property:p.property,canonical,view,editor:p.elements.editor,
    save:p.elements.save,scheduleFrame:p.scheduleFrame,renderAll:p.renderAll,editorDraft:schemaEditorDraft});
  guided.configure({root:p.root,guidedRoot:p.elements.guidedRoot,document:p.elements.document??null,schemas:() => p.library.schemas,
    replaceSchemas:(schemas) => p.library.replaceSchemas(schemas),persistSchemas:p.persistLibraries,renderSchemas:p.renderAll,
    openDraft:(schema) => guidedWorkflow.openDraft(schema),restoreCapture:p.restoreCapture,scheduleFrame:p.scheduleFrame,generation:() => p.lifecycle.generation(),
      selectSchema:(schemaId,propertyPath) => {p.property.selectPath(propertyPath);const schema=p.library.schemas.find(({id}) => id===schemaId);p.library.select(schemaId,
      schema&&schemaEditorDraft(schema));p.renderAll();},
    result:(message) => {if(p.elements.result)p.elements.result.textContent=message;},expansionRules:p.expansionRules,
      replaceExpansionRules:(rules) => p.rule.replaceRules(storedPromotionRules(rules.map((rule) => ({...rule,name:rule.name??rule.id,
      enabled:rule.enabled!==false})) as unknown as readonly PromotableReusableRule[])),
    rules:() => p.rule.rules,replaceRules:(rules) => p.rule.replaceRules(rules),applyPersistence:(schemas,rules) => persistence.apply(schemas,rules),beginPersistence:(schemaId,
      previousSchemas,previousRules,nextSchemas,nextRules) => persistence.begin("guided",schemaId,previousSchemas,previousRules,nextSchemas,nextRules)});
  guidedWorkflow=new SchemaGuidedInstalledWorkflow({controller:guided,root:p.elements.guidedRoot,schemas:() => p.library.schemas,generation:() => p.lifecycle.generation(),
    result:p.elements.result,...(p.saved?{saved:p.saved}:{}),restoreCapture:p.restoreCapture,openDraft:(schema) => p.editor().openDraft(schema),
    openRevisionReview:() => p.editor().openRevision(),...(p.guidedFlowFactory?{flowFactory:p.guidedFlowFactory}:{})});
  return {validation,guided,canonical,view,persistence,guidedWorkflow,proposeName,dispose:() => {guidedWorkflow.dispose();persistence.close(false);view.dispose();
    guided.dispose();validation.dispose();canonical.disposeState();persistence.dispose(new Error("Schemas controller disposed before durable persistence settled"));}};
}
