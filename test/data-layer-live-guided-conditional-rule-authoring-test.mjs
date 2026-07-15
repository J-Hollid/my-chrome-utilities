import assert from "node:assert/strict";
import {
  addGuidedCondition,
  createGuidedConditionalDraft,
  guidedConditionGroup,
  guidedConditionPropertyOptions,
  guidedConditionalPreview,
  reconcileGuidedConditions,
  selectGuidedConditionProperty,
  setGuidedConditionComparison,
  setGuidedConditionGroupOperator,
  setGuidedConditionOperator,
  validateGuidedConditionalDraft,
} from "../dist/data-layer-live-guided-conditional-rule-authoring.js";
import {
  applyGuidedSchemaCandidate,
  createGuidedValidationForProperty,
  publishGuidedValidation,
  setGuidedRequirement,
} from "../dist/data-layer-guided-validation.js";
import { guidedAttachedRule } from "../dist/data-layer-guided-rule-parameter-integrity.js";

const payload={
  page_type:"product_detail",
  currency:"EUR",
  basket_total:125,
  consented:true,
  products:[],
  oOrder:{aProducts:[]},
};
const schemaTypes={
  page_type:"String",
  currency:"String",
  "customer.type":"String",
  "oOrder.aProducts":"Array",
};
const options=guidedConditionPropertyOptions(payload,schemaTypes,"/oOrder/aProducts/0");
assert.deepEqual(options.find(({path})=>path==="/page_type"),{
  path:"/page_type",type:"string",source:"current event",observedValue:"product_detail",
});
assert.deepEqual(options.find(({path})=>path==="/customer/type"),{
  path:"/customer/type",type:"string",source:"destination schema",
});
assert.equal(options.filter(({path})=>path==="/customer/type").length,1);
assert.equal(options.some(({path})=>path==="/oOrder/aProducts/0"),false,"the consequence must not be its own suggested trigger");

let conditional=createGuidedConditionalDraft();
assert.deepEqual(validateGuidedConditionalDraft(conditional,{propertyPath:"/oOrder/aProducts/0",operator:"required"}),{
  ready:false,assistance:"Add at least one condition",
});
conditional=addGuidedCondition(conditional);
conditional=selectGuidedConditionProperty(conditional,0,options.find(({path})=>path==="/page_type"));
assert.deepEqual(conditional.conditionGroup.predicates[0],{
  propertyPath:"/page_type",operator:"Equals",detectedType:"string",
  comparison:{type:"string",value:"product_detail"},comparisonEdited:false,
});
conditional=setGuidedConditionComparison(conditional,0,"category");
conditional=selectGuidedConditionProperty(conditional,0,options.find(({path})=>path==="/page_type"));
assert.equal(conditional.conditionGroup.predicates[0].comparison.value,"category","operator-entered comparisons must not be overwritten by observed defaults");

conditional=setGuidedConditionComparison(conditional,0,"product_detail");
conditional=addGuidedCondition(conditional);
conditional=selectGuidedConditionProperty(conditional,1,options.find(({path})=>path==="/currency"));
assert.deepEqual(guidedConditionalPreview(payload,conditional,{propertyPath:"/oOrder/aProducts/0",operator:"required"}),{result:"Failed",invocationCount:1});
assert.deepEqual(guidedConditionalPreview({...payload,page_type:"category"},conditional,{propertyPath:"/oOrder/aProducts/0",operator:"required"}),{result:"Not applicable",invocationCount:0});
assert.deepEqual(guidedConditionalPreview({...payload,oOrder:{aProducts:["sku"]}},conditional,{propertyPath:"/oOrder/aProducts/0",operator:"required"}),{result:"Passed",invocationCount:1});
conditional=setGuidedConditionComparison(conditional,1,"GBP");
assert.equal(guidedConditionalPreview(payload,conditional,{propertyPath:"/oOrder/aProducts/0",operator:"required"}).result,"Not applicable");
conditional=setGuidedConditionGroupOperator(conditional,"Any");
assert.equal(guidedConditionalPreview(payload,conditional,{propertyPath:"/oOrder/aProducts/0",operator:"required"}).result,"Failed");

let invalid=createGuidedConditionalDraft();
invalid=addGuidedCondition(invalid);
invalid=selectGuidedConditionProperty(invalid,0,options.find(({path})=>path==="/page_type"));
invalid=setGuidedConditionOperator(invalid,0,"Matches pattern");
invalid=setGuidedConditionComparison(invalid,0,"[");
assert.equal(validateGuidedConditionalDraft(invalid,{propertyPath:"/oOrder/aProducts/0",operator:"required"}).assistance,"Correct the regular expression");
invalid=setGuidedConditionOperator(invalid,0,"Is greater than");
assert.equal(validateGuidedConditionalDraft(invalid,{propertyPath:"/oOrder/aProducts/0",operator:"required"}).assistance,"Choose an operator compatible with string");

const reviewed=reconcileGuidedConditions(conditional,options.filter(({path})=>path!=="/currency"));
assert.equal(reviewed.conditionGroup.predicates[1].requiresReview,true,"missing destination paths must remain visible for explicit review");

const event={id:"event-1",name:"product_detail",sourceId:"history",pageUrl:"https://shop.test/products/1",payload};
const candidate={
  id:"schema:product",name:"Product event",version:3,target:"payload",propertyTypes:schemaTypes,
  assignments:[{id:"assignment:product",sourceId:"history",eventName:"product_detail",target:"payload",domainCondition:"shop.test",enabled:true}],
};
let draft=createGuidedValidationForProperty(event,"/oOrder/aProducts/0");
draft=applyGuidedSchemaCandidate(draft,candidate);
draft=setGuidedRequirement(draft,"Must be present");
draft={...draft,conditional:setGuidedConditionGroupOperator(conditional,"All")};
const published=publishGuidedValidation(draft,true);
const rule=published.schema.rules[0];
assert.deepEqual(rule.conditionGroup,guidedConditionGroup(draft.conditional));
assert.deepEqual(published.reusableRules[0].conditionGroup,guidedConditionGroup(draft.conditional));
const attachment=guidedAttachedRule(rule,"Product detail products");
assert.deepEqual(attachment.conditionGroup,guidedConditionGroup(draft.conditional));
assert.equal(attachment.propertyPath,"/oOrder/aProducts/0");
assert.equal(attachment.enabled,true);
assert.equal(JSON.parse(JSON.stringify(attachment)).conditionGroup.predicates[0].comparison.type,"string");

assert.throws(
  ()=>publishGuidedValidation({...draft,conditional:reviewed},true),
  /Review condition property \/currency/,
  "direct publication must not bypass explicit predicate review",
);

console.log("data-layer Live guided conditional rule authoring tests passed");
