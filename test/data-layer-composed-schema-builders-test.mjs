import assert from "node:assert/strict";
import {
  addComposedAllowedValue,
  addComposedConditionGroup,
  addComposedConditionPredicate,
  addComposedRule,
  composedFacetDraft,
  evaluateComposedCondition,
  moveComposedAllowedValue,
  removeComposedAllowedValue,
  removeComposedConditionBranch,
  sparseComposedFacets,
  typedComposedValue,
} from "../dist/data-layer-composed-schema-builders.js";

const inherited={path:"/funnel_step",type:"string",presence:"required",allowedValues:["2","3a","3b"],documentation:"Checkout step"};
let draft=composedFacetDraft({path:"/funnel_step",expectedValue:"2"},inherited);
assert.deepEqual(draft.allowedValues,["2","3a","3b"]);
assert.equal(draft.exampleMethod,"blank");

draft=addComposedAllowedValue(draft,"4");
draft=moveComposedAllowedValue(draft,3,-1);
assert.deepEqual(draft.allowedValues,["2","3a","4","3b"]);
draft=removeComposedAllowedValue(draft,2);
assert.deepEqual(draft.allowedValues,["2","3a","3b"]);

draft=addComposedConditionGroup(draft,[],"any");
draft=addComposedConditionGroup(draft,[],"not");
draft=addComposedConditionPredicate(draft,[0],{propertyId:"/customer_type",operator:"Equals",value:"retail"});
draft=addComposedConditionPredicate(draft,[1],{propertyId:"/privacy_mode",operator:"Equals",value:"anonymous"});
assert.deepEqual(draft.condition,{kind:"all",children:[
  {kind:"any",children:[{kind:"predicate",propertyId:"/customer_type",operator:"Equals",value:"retail"}]},
  {kind:"not",children:[{kind:"predicate",propertyId:"/privacy_mode",operator:"Equals",value:"anonymous"}]},
]});
assert.equal(evaluateComposedCondition(draft.condition,{customer_type:"retail",privacy_mode:"identified"}),true);
assert.equal(evaluateComposedCondition(draft.condition,{customer_type:"trade",privacy_mode:"identified"}),false);
draft=removeComposedConditionBranch(draft,[1,0]);
assert.deepEqual(draft.condition.children[1],{kind:"not",children:[]});
draft=addComposedConditionPredicate(draft,[1],{propertyId:"/privacy_mode",operator:"Equals",value:"anonymous"});

draft=addComposedRule(draft,{kind:"pattern",pattern:"^[0-9a-z]+$",severity:"error",message:"Use a known step"});
draft=addComposedRule(draft,{kind:"range",minimum:1,maximum:4,severity:"warning",message:"Review step range",reusableRuleId:"rule:step"});
assert.equal(draft.rules.length,2);
assert.equal(draft.rules[1].reusableRuleId,"rule:step");

draft={...draft,exampleMethod:"allowed-value",exampleValue:"3a"};
const sparse=sparseComposedFacets(draft,inherited);
assert.deepEqual(sparse,{expectedValue:"2",condition:draft.condition,rules:draft.rules,examples:["3a"]},"unchanged inherited facets are not copied locally");
assert.equal(typedComposedValue("number","2.5"),2.5);
assert.equal(typedComposedValue("integer","2"),2);
assert.equal(typedComposedValue("boolean","false"),false);
assert.equal(typedComposedValue("null","anything"),null);
assert.equal(typedComposedValue("string","02"),"02");
assert.throws(()=>typedComposedValue("integer","2.5"),/whole number/);
assert.throws(()=>typedComposedValue("boolean","maybe"),/true or false/);

console.log("data-layer composed schema builder tests passed");
