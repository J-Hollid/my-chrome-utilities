import assert from "node:assert/strict";
import { createSchemaCanonicalGuidedValidationDomain } from "../../../dist/data-layer-installed/schemas/canonical-guided-validation-factory.js";
import { SchemaGuidedValidationController } from "../../../dist/data-layer-installed/schemas/guided-validation-controller.js";

let configured=false;SchemaGuidedValidationController.prototype.configure=function(){configured=true;};
const storage={getItem(){return null;},setItem(){},removeItem(){}};
const library={schemas:[],draft:undefined,activeSchemaId:undefined,serialize(){return "[]";},persist(){}};
const domain=createSchemaCanonicalGuidedValidationDomain({root:{querySelector(){return null;}},storage,library,property:{selectedPath:""},rule:{rules:[],render(){},persist(){}},lifecycle:{generation(){return 1;},isCurrent(){return true;},isMounted(){return true;}},editorRoute:{close(){}},editor(){return {openDraft(){},openRevision(){}};},propertyWorkflow(){return {close(){}};},
  renderAll(){},renderDraft(){},persistLibrary(){},persistLibraries(){},expansionRules(){return [];},refreshLive(){return 0;},createId(){return "id";},scheduleFrame(run){run();},changed(){},restoreCapture(){},conceptSuggestions(){return [];},
  elements:{context:null,editor:null,detail:null,detailEmpty:null,save:null,list:null,guidedRoot:null,issues:null,records:null,result:null,document:undefined,rulePicker:null}});
// retired-schema-assertion: guided-selection-continuation-promotion-001
assert.equal(configured,true);
// retired-schema-assertion: guided-selection-continuation-promotion-005
assert.equal(typeof domain.persistence.render,"function");
const disposed=[];domain.guidedWorkflow.flow.close=() => disposed.push("flow");domain.persistence.close=() => disposed.push("close");domain.view.dispose=() => disposed.push("view");domain.guided.dispose=() => disposed.push("guided");domain.validation.dispose=() => disposed.push("validation");domain.canonical.disposeState=() => disposed.push("canonical");domain.persistence.dispose=() => disposed.push("persistence");
domain.dispose();
// retired-schema-assertion: guided-selection-continuation-promotion-002
assert.deepEqual(disposed,["flow","close","view","guided","validation","canonical","persistence"]);
