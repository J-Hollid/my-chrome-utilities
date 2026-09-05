import assert from "node:assert/strict";
import { createSchemaLibraryFakeDocument } from "../../support/schema-library-fake-dom.mjs";

const { createRuleConfiguration } = await import("../../../dist/utilities/data-layer/schemas.js");
const { SchemaRuleController } = await import("../../../dist/data-layer-installed/schemas/rule-controller.js");
const { SchemaRulePickerView } = await import("../../../dist/data-layer-installed/schemas/rule-picker-view.js");

const { element }=createSchemaLibraryFakeDocument();
const picker=element();
const schema={id:"schema:one",name:"One",version:1,published:true,document:{type:"object",properties:{
  title:{type:"string"},quantity:{type:"number"},checkout:{type:"object",properties:{total:{type:"number"}}},
  items:{type:"array",items:{type:"object",properties:{sku:{type:"string"}}}},
}},assignments:[],attachedRules:[]};
const sample={title:"Checkout",quantity:2,checkout:{total:12},items:[{sku:"13"}]};
let capturedSample=sample;
const propertyType=(_document,path)=>path.includes("quantity")||path.includes("total")?"number":"string";
const controller=new SchemaRuleController({getItem:()=>null,setItem(){}});
controller.replaceRules([{id:"rule:one",name:"Reusable quantities",kind:"Required",version:3,
  operator:"required",applicableType:"string",enabled:true}]);
controller.setPicker("title");
controller.configure({elements:{},presentation:{},schemas:()=>[schema],replaceSchemas(){},persistRules(){},persistLibrary(){},renderAll(){},
  renderDraft(){},createId:()=>"id:one",download(){},createRuleId:()=>"rule:new",capturedValue:()=>capturedSample,editableSchema:()=>schema,
  propertyType,draft:()=>schema,replaceDraft(){},presentDraft:(value)=>value,activeSchemaId:()=>schema.id,
  promotionDialog:{open(){},close(){}},detail:null,root:{querySelector:()=>null,querySelectorAll:()=>[]},scheduleFrame:(run)=>run(),
  result(){},commitPromotion:async()=>{}});
let renders=0,closes=0,commits=0;
const ports={picker,active:()=>schema,draft:()=>schema,capturedValue:()=>sample,propertyType,
  incrementRender:()=>{renders+=1;},close:()=>{closes+=1;},closeForCommit:()=>{commits+=1;},createConfigured:()=>true};
const view=new SchemaRulePickerView(controller,ports);
const find=(root,id)=>root?.id===id?root:(root?.children??[]).map((child)=>find(child,id)).find(Boolean);

view.render();
picker.showModal();

// retired-schema-assertion: rule-choice-parameters-predicates-preview-005
assert.equal(picker.open,true);

// retired-schema-assertion: rule-choice-parameters-predicates-preview-022
assert.ok(picker.querySelector("#schema-property-rule-picker-heading"));

// retired-schema-assertion: rule-choice-parameters-predicates-preview-023
assert.ok(picker.querySelector("#schema-property-rule-results"));
const reusableChoice=picker.children[2].children[1].children[1].children[0];

// retired-schema-assertion: rule-choice-parameters-predicates-preview-002
assert.equal(reusableChoice.disabled,false);
const attachedSchema={...schema,attachedRules:[{id:"rule:one",name:"Reusable quantities",version:3,
  propertyPath:"/title",operator:"required",enabled:true}]};
ports.active=()=>attachedSchema;
ports.draft=()=>attachedSchema;
view.render();
const attachedReusableChoice=picker.children[2].children[1].children[1].children[0];

// retired-schema-assertion: rule-choice-parameters-predicates-preview-003
assert.equal(attachedReusableChoice.disabled,true);
ports.active=()=>schema;
ports.draft=()=>schema;
view.render();
picker.children[2].children[0].children[1].children[0].click();

// retired-schema-assertion: rule-choice-parameters-predicates-preview-006
assert.equal(controller.configuration.propertyType,"string");

// retired-schema-assertion: rule-choice-parameters-predicates-preview-010
assert.ok(picker.querySelector("#schema-local-rule-conditional"));

// retired-schema-assertion: rule-choice-parameters-predicates-preview-008
assert.deepEqual(controller.conditionPredicate("checkout.total",true),{operator:"All",predicates:[{
  propertyPath:"/checkout/total",operator:"Equals",comparison:{type:"number",value:12}}]});

capturedSample=undefined;
// retired-schema-assertion: rule-choice-parameters-predicates-preview-011
assert.deepEqual(controller.conditionPredicate("/quantity").predicates[0],
  {propertyPath:"/title",operator:"Exists",detectedType:"string"});
capturedSample=sample;
controller.setConfiguration({...controller.configuration,conditionGroupOperator:"Any",
  conditions:[{propertyPath:"/title",operator:"Equals",comparison:{type:"string",value:"13"}},
    {propertyPath:"/quantity",operator:"Exists",detectedType:"number"}]});

// retired-schema-assertion: rule-choice-parameters-predicates-preview-012
assert.equal(controller.configuration.conditionGroupOperator,"Any");

// retired-schema-assertion: rule-choice-parameters-predicates-preview-013
assert.deepEqual(controller.configuration.conditions[0].comparison,{type:"string",value:"13"});

// retired-schema-assertion: rule-choice-parameters-predicates-preview-014
assert.equal(controller.configuration.conditions.length,2);
controller.setConfiguration({...controller.configuration,conditions:controller.configuration.conditions.slice(0,1)});

// retired-schema-assertion: rule-choice-parameters-predicates-preview-015
assert.equal(controller.configuration.conditions.length,1);
controller.setConfiguration({...controller.configuration,conditions:[{propertyPath:"/title",operator:"Exists",detectedType:"string"}]});

// retired-schema-assertion: rule-choice-parameters-predicates-preview-016
assert.equal(controller.configuration.conditions[0].comparison,undefined);

controller.setConfiguration({...createRuleConfiguration("Allowed values","string"),allowedValues:["12","13"]});

// retired-schema-assertion: rule-choice-parameters-predicates-preview-020
assert.deepEqual(controller.configuration.allowedValues,["12","13"]);
controller.setConfiguration({...controller.configuration,allowedValues:["13"]});

// retired-schema-assertion: rule-choice-parameters-predicates-preview-021
assert.deepEqual(controller.configuration.allowedValues,["13"]);

controller.setConfiguration({...createRuleConfiguration("Exact value","string"),exactValue:"12",severity:"warning",
  saveReusable:true,reusableName:"Sampled checkout total"});

// retired-schema-assertion: rule-choice-parameters-predicates-preview-019
assert.equal(controller.configuration.exactValue,"12");
controller.replaceRules([...controller.rules,controller.configuredRule()]);

// retired-schema-assertion: rule-choice-parameters-predicates-preview-017
assert.equal(controller.rules.some(({name})=>name==="Sampled checkout total"),true);

// retired-schema-assertion: rule-choice-parameters-predicates-preview-018
assert.equal(controller.rules.find(({name})=>name==="Sampled checkout total").severity,"warning");

controller.setConfiguration(undefined);
controller.setPickerSearch("no compatible rule");
view.render();

// retired-schema-assertion: rule-choice-parameters-predicates-preview-024
assert.equal(picker.children[2].children[0].id,"schema-property-rule-empty");

// retired-schema-assertion: rule-choice-parameters-predicates-preview-025
assert.equal(picker.children[2].children[1].textContent,"Clear search");

// retired-schema-assertion: rule-choice-parameters-predicates-preview-026
assert.ok(picker.children[2].children.length>1);
controller.setPicker(undefined);

// retired-schema-assertion: rule-choice-parameters-predicates-preview-009
assert.equal(controller.pickerPath,undefined);

controller.setPicker("items.*.sku");
controller.setPickerSearch("");
view.render();
picker.children[2].children[0].children[1].children[0].click();

// retired-schema-assertion: rule-choice-parameters-predicates-preview-007
assert.match(picker.dataset.conditionPreview,/items\/\*\/sku/);

assert.equal(commits,0);
assert.equal(closes,0);
assert.ok(renders>0);
