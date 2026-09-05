import assert from "node:assert/strict";
import { createSchemaCanonicalGuidedValidationDomain } from "../../../dist/data-layer-installed/schemas/canonical-guided-validation-factory.js";
import { SchemaGuidedValidationController } from "../../../dist/data-layer-installed/schemas/guided-validation-controller.js";

let configured=false;SchemaGuidedValidationController.prototype.configure=function(){configured=true;};
const storage={getItem(){return null;},setItem(){},removeItem(){}};
const library={schemas:[],draft:undefined,activeSchemaId:undefined,serialize(){return "[]";},persist(){}};
const property={selectedPath:"",selectPath(path){this.selectedPath=path;}};
const disposed=[];
const ownedDraft={stage:"property",property:{path:"/owned"}};
const domain=createSchemaCanonicalGuidedValidationDomain({root:{querySelector(){return null;}},storage,library,property,rule:{rules:[],render(){},persist(){}},lifecycle:{generation(){return 1;},isCurrent(){return true;},isMounted(){return true;}},editorRoute:{close(){}},editor(){return {openDraft(){},openRevision(){}};},propertyWorkflow(){return {close(){}};},
  renderAll(){},renderDraft(){},persistLibrary(){},persistLibraries(){},expansionRules(){return [];},refreshLive(){return 0;},createId(){return "id";},scheduleFrame(run){run();},changed(){},restoreCapture(){},conceptSuggestions(){return [];},
  guidedFlowFactory(){return {open(){},openProperty(){},close(){disposed.push("flow");},currentDraft(){return ownedDraft;}};},
  elements:{context:null,editor:null,detail:null,detailEmpty:null,save:null,list:null,guidedRoot:null,issues:null,records:null,result:null,document:undefined,rulePicker:null}});

assert.equal(configured,true);

assert.equal(typeof domain.persistence.render,"function");
assert.equal(domain.guidedWorkflow.flow,undefined,"the mutable guided flow is private");
const draftProjection=domain.guidedWorkflow.draftProjection();
draftProjection.property.path="/external";
assert.equal(domain.guidedWorkflow.draftProjection().property.path,"/owned","guided draft projections are cloned");
domain.persistence.close=() => disposed.push("close");domain.view.dispose=() => disposed.push("view");domain.guided.dispose=() => disposed.push("guided");domain.validation.dispose=() => disposed.push("validation");domain.canonical.disposeState=() => disposed.push("canonical");domain.persistence.dispose=() => disposed.push("persistence");
domain.dispose();

assert.deepEqual(disposed,["flow","close","view","guided","validation","canonical","persistence"]);
