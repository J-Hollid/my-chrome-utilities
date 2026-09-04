import assert from "node:assert/strict";
import { createSchemaPropertyRuleAssignmentDomain } from "../../../dist/data-layer-installed/schemas/property-rule-assignment-factory.js";
import { SchemaPropertyController } from "../../../dist/data-layer-installed/schemas/property-controller.js";
import { SchemaRuleController } from "../../../dist/data-layer-installed/schemas/rule-controller.js";

const configured=[];
SchemaPropertyController.prototype.configure=function(){configured.push("property");};
SchemaRuleController.prototype.configure=function(){configured.push("rule");};
const storage={getItem(){return null;},setItem(){}};
const library={schemas:[],draft:undefined,activeSchemaId:undefined,replaceActive(){}};
const domain=createSchemaPropertyRuleAssignmentDomain(storage,{},() => [],{elements:{},schemas:() => [],replaceSchemas(){},persistAndRender(){},capturedValue(){},renderConditions(){}});
const connected=domain.connect({root:{},elements:{schemaPropertyRulePicker:null,schemaPropertyTree:null},ruleElements:{},library,canonical:{editor:undefined,idSequence:0,savedSchemaId(){},savedDocument:undefined},canonicalView:{openPropertyActions(){},openRule(){}},
  canonicalPersistence:{promote(){},queueLibraryPersistence(){}},editor(){return {showSubview(){}};},active(){return {id:"schema:one",name:"One",version:1,document:{type:"object"},assignments:[]};},persistLibrary(){},persistLibraries(){},renderAll(){},renderDraft(){},renderProperty(){},
  createRuleId(){return "id";},download(){},capturedValue(){},promotionDialog:{},scheduleFrame(run){run();},result:null,schemaEditor:null,schemaDetail:null,document:undefined});
assert.deepEqual(configured,["rule","property"]);assert.equal(domain.views().workflow,connected.workflow);
const disposed=[];connected.propertyView.dispose=() => disposed.push("view");domain.rulePresentation.dispose=() => disposed.push("presentation");domain.rule.dispose=() => disposed.push("rule");domain.property.dispose=() => disposed.push("property");domain.assignment.dispose=() => disposed.push("assignment");
domain.dispose();assert.deepEqual(disposed,["view","presentation","rule","property","assignment"]);
