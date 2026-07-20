import assert from "node:assert/strict";
import {
  addComposedAllowedValue,
  addComposedConditionGroup,
  addComposedConditionPredicate,
  addComposedRule,
  composedRuleIssue,
  composedConditionPredicate,
  composedFacetDraft,
  evaluateComposedCondition,
  moveComposedAllowedValue,
  removeComposedAllowedValue,
  removeComposedConditionBranch,
  sparseComposedFacets,
  typedComposedValue,
} from "../dist/data-layer-composed-schema-builders.js";
import {compileLayeredSchema,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";

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
assert.match(composedRuleIssue({kind:"pattern",severity:"error",message:""}),/issue message/);
assert.match(composedRuleIssue({kind:"pattern",severity:"error",message:"Mismatch"}),/regular expression/);

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
assert.throws(()=>sparseComposedFacets({...draft,exampleMethod:"allowed-value",exampleValue:undefined},inherited),/Choose an allowed-value example/);
assert.equal(composedFacetDraft({path:"/note",allowedValues:["brief"],examples:["brief"]},{path:"/note"}).exampleMethod,"allowed-value","reload reconstructs an allowed-value example method from structured storage");

const propertyChoice={path:"/customer_type",definitionId:"definition:customer-type",type:"string"};
let validationDraft=composedFacetDraft({path:"/discount",type:"number",presence:"required"},{path:"/discount",type:"number",presence:"required"});
validationDraft=addComposedConditionPredicate(validationDraft,[],composedConditionPredicate(propertyChoice,"Equals","retail"));
const savedBuilderFacets=sparseComposedFacets(validationDraft,{path:"/discount"});
assert.equal(savedBuilderFacets.condition.children[0].propertyId,"definition:customer-type","builder-authored predicates persist the stable canonical definition ID");
const builderCompiled=compileLayeredSchema([{id:"page:cart",name:"Cart",scope:"Page",constraints:[
  {path:"/customer_type",definitionId:"definition:customer-type",type:"string"},
  {path:"/discount",definitionId:"definition:discount",...savedBuilderFacets},
]}],{eventId:"event:cart",eventRole:"interaction"});
const validateBuilderPayload=(payload)=>validateLayeredObservation({targetId:"target:cart",targetName:"Cart",revision:1,compiled:builderCompiled},payload).issues;
assert.deepEqual(validateBuilderPayload({customer_type:"retail"}).map(({path,code})=>({path,code})),[{path:"/discount",code:"REQUIRED"}],"matching observations activate the saved condition in the production validator");
assert.deepEqual(validateBuilderPayload({customer_type:"trade"}),[],"nonmatching observations leave the saved condition inactive");

const ruleCompiled=compileLayeredSchema([{id:"page:rules",name:"Rules",scope:"Page",constraints:[{path:"/note",type:"string",rules:[{kind:"pattern",pattern:"^cart",severity:"warning",message:"Start with cart"}]}]}],{eventId:"event:cart",eventRole:"interaction"});
assert.deepEqual(validateLayeredObservation({targetId:"target:rules",targetName:"Rules",revision:1,compiled:ruleCompiled},{note:"other"}).issues.map(({path,code})=>({path,code})),[{path:"/note",code:"PATTERN"}],"structured pattern rules feed the production validator");

console.log("data-layer composed schema builder tests passed");
