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
  moveComposedConditionBranch,
  removeComposedAllowedValue,
  removeComposedConditionBranch,
  overrideComposedRule,
  overrideComposedAllowedValue,
  sparseComposedFacets,
  typedComposedValue,
} from "../dist/data-layer-composed-schema-builders.js";
import {compileLayeredSchema,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";
import {sharedConditionOperators,sharedConditionValueMounted,sharedTypedConditionValue} from "../dist/data-layer-shared-condition-tree-editor.js";
import {
  filterFocusedReusableRules,
  focusedRuleFields,
  focusedOwnershipActions,
} from "../dist/data-layer-focused-schema-property-ui.js";

const inherited={path:"/funnel_step",type:"string",presence:"required",allowedValues:["2","3a","3b"],documentation:"Checkout step"};
assert.equal(sharedConditionValueMounted("Exists"),false,"Exists edits unmount the comparison input");
assert.equal(sharedConditionValueMounted("Equals"),true,"comparison edits mount the typed input");
assert.ok(sharedConditionOperators("number").includes("Greater than")&&!sharedConditionOperators("number").includes("Contains"),"predicate operators follow the selected property type");
assert.equal(sharedTypedConditionValue("number","2.5"),2.5,"predicate edits retain numeric types");
let draft=composedFacetDraft({path:"/funnel_step",expectedValue:"2"},inherited);
assert.deepEqual(draft.allowedValues,["2","3a","3b"]);
const inheritedValueDraft=composedFacetDraft({path:"/funnel_step"},{path:"/funnel_step",allowedValues:["2","3a","3b"],allowedValueIds:["parent:2","parent:3a","parent:3b"]});
const overriddenValueDraft=overrideComposedAllowedValue(inheritedValueDraft,1,"local:funnel-step:3a");
assert.deepEqual(overriddenValueDraft.allowedValues,["2","3a","3b"],"overriding an inherited value does not duplicate its effective entry");
assert.deepEqual(overriddenValueDraft.allowedValueIds,["parent:2","local:funnel-step:3a","parent:3b"],"an overridden value gets exactly one local identity in place");
assert.equal(overriddenValueDraft.allowedValueProvenance.find(({id})=>id==="local:funnel-step:3a").state,"overridden");
assert.deepEqual(sparseComposedFacets(overriddenValueDraft,{path:"/funnel_step",allowedValues:["2","3a","3b"],allowedValueIds:["parent:2","parent:3a","parent:3b"]}),{allowedValues:["2","3a","3b"],allowedValueIds:["parent:2","local:funnel-step:3a","parent:3b"],allowedValueProvenance:[{id:"local:funnel-step:3a",state:"overridden",source:"focused-editor"}]},"same-value overrides retain their local ownership identity and payload");
const inheritedRuleDraft=composedFacetDraft({path:"/note",rules:[{id:"local:l",kind:"pattern",pattern:"^l"}]},{path:"/note",rules:[{id:"parent:p",kind:"pattern",pattern:"^p"}]});
assert.deepEqual(inheritedRuleDraft.rules,[{id:"local:l",kind:"pattern",pattern:"^l"}],"composed drafts stage only local rule deltas");
const effectiveRules=compileLayeredSchema([
  {id:"profile:rules",name:"Profile",scope:"Shared Profile",constraints:[{path:"/note",rules:[{id:"parent:p",kind:"pattern",pattern:"^p"}]}]},
  {id:"page:rules",name:"Page",scope:"Page",constraints:[{path:"/note",rules:[{id:"local:l",kind:"pattern",pattern:"^l"}]}]},
],{eventId:"event:rules",eventRole:"interaction"}).properties["/note"].rules;
assert.equal(effectiveRules.filter(({id})=>id==="parent:p").length,1,"inherited rules remain singular after composition");
assert.equal(effectiveRules.filter(({id})=>id==="local:l").length,1,"local rule deltas compose exactly once");
const overriddenAllowedValue=compileLayeredSchema([
  {id:"profile:values",name:"Profile",scope:"Shared Profile",constraints:[{path:"/code",allowedValues:["a"],allowedValueIds:["parent:a"]}]},
  {id:"page:values",name:"Page",scope:"Page",constraints:[{path:"/code",allowedValueIds:["local:a"],allowedValueProvenance:[{id:"local:a",state:"overridden",source:"test"}]}]},
],{eventId:"event:values",eventRole:"interaction"}).properties["/code"];
assert.deepEqual(overriddenAllowedValue.allowedValueIds,["local:a"],"value identity overrides replace inherited identities");
assert.equal(overriddenAllowedValue.allowedValueProvenance?.[0]?.id,"local:a","value provenance follows the local identity");
assert.equal(draft.exampleMethod,"blank");

const arrayDraft=composedFacetDraft({path:"/items",type:"array",itemType:"number",expectedValue:[1,2]},{path:"/items",type:"array",itemType:"string"});
assert.equal(arrayDraft.itemType,"number","composed drafts retain an array item type override");
assert.deepEqual(arrayDraft.expectedValue,[1,2],"composed drafts retain a typed expected value override");
assert.deepEqual(sparseComposedFacets(arrayDraft,{path:"/items",type:"array",itemType:"string"}),{itemType:"number",expectedValue:[1,2]},"array item type and expected value remain sparse local facets");

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
const movedCondition=moveComposedConditionBranch(draft,[0],1);
assert.equal(movedCondition.condition.children[0].kind,"not","condition branches move within their parent group");
assert.equal(moveComposedConditionBranch(draft,[],1),draft,"moving the root condition is a true no-op");
let nestedGroupDraft=composedFacetDraft({path:"/nested"},{path:"/nested"});
nestedGroupDraft=addComposedConditionPredicate(nestedGroupDraft,[],{propertyId:"/first",operator:"Exists"});
nestedGroupDraft=addComposedConditionGroup(nestedGroupDraft,[] ,"any");
assert.deepEqual(nestedGroupDraft.condition.children.map(({kind})=>kind),["predicate","any"],"condition group actions append without replacing the existing tree");

draft=addComposedRule(draft,{id:"rule:parent",kind:"pattern",pattern:"^[0-9a-z]+$",severity:"error",message:"Use a known step"});
draft=addComposedRule(draft,{kind:"range",minimum:1,maximum:4,severity:"warning",message:"Review step range",reusableRuleId:"rule:step"});
assert.equal(draft.rules.length,2);
assert.equal(draft.rules[1].reusableRuleId,"rule:step");
const overriddenRule=overrideComposedRule(draft,0,"rule:local");
assert.equal(overriddenRule.rules[0].id,"rule:local","overriding an inherited rule gives it a local identity");
assert.equal(overriddenRule.rules[0].provenance.source,"created","overriding an inherited rule records local provenance");
assert.equal(overriddenRule.rules[0].replacesRuleId,draft.rules[0].id,"a replacement names the inherited rule it replaces");
assert.deepEqual(draft.rules[0],{id:"rule:parent",kind:"pattern",pattern:"^[0-9a-z]+$",severity:"error",message:"Use a known step"},"staging a replacement leaves the inherited rule byte-identical");
assert.equal(composedRuleIssue({kind:"pattern",severity:"error",message:""}),"Enter a regular expression.");
assert.equal(composedRuleIssue({kind:"range",minimum:10,maximum:2,severity:"error"}),"Minimum must not exceed maximum.");
assert.equal(composedRuleIssue({kind:"cardinality",minItems:4,maxItems:1,severity:"error"}),"Minimum items must not exceed maximum items.");
assert.equal(composedRuleIssue({kind:"condition",condition:{kind:"predicate",propertyId:"",operator:"Equals"}}),"Resolve the condition property.");
assert.equal(composedRuleIssue({kind:"pattern",pattern:"^ok$",severity:"error"}),undefined,"an issue message remains optional");

const reusableRules=[
  {id:"rule:postal",name:"Postal code pattern"},
  {id:"rule:customer-tier",name:"Customer tier range"},
];
assert.deepEqual(filterFocusedReusableRules(reusableRules,"Customer"),[reusableRules[1]],"reusable-rule search filters human names");
assert.deepEqual(filterFocusedReusableRules(reusableRules,""),reusableRules,"clearing reusable-rule search restores the library");
assert.deepEqual(focusedRuleFields("reusable"),["reusableRuleId"],"reusable rules expose only their named library selector");
assert.deepEqual(focusedOwnershipActions({inherited:true,invariant:true}),["View","Open source"],"invariant rule actions are shared");
assert.deepEqual(focusedOwnershipActions({inherited:true,replaceable:true}),["View","Replace here","Open source"],"replaceable rule actions are shared");

draft={...draft,exampleMethod:"allowed-value",exampleValue:"3a"};
const sparse=sparseComposedFacets(draft,inherited);
assert.deepEqual(sparse,{expectedValue:"2",condition:draft.condition,rules:draft.rules,examples:["3a"]},"unchanged inherited facets are not copied locally");
assert.equal(typedComposedValue("number","2.5"),2.5);
assert.equal(typedComposedValue("integer","2"),2);
assert.equal(typedComposedValue("boolean","false"),false);
assert.equal(typedComposedValue("null","anything"),null);
assert.equal(typedComposedValue("string","02"),"02");
assert.deepEqual(typedComposedValue("array",'["2",3]'),["2",3]);
assert.deepEqual(typedComposedValue("object",'{"step":3}'),{step:3});
assert.throws(()=>typedComposedValue("integer","2.5"),/whole number/);
assert.throws(()=>typedComposedValue("boolean","maybe"),/true or false/);
assert.throws(()=>typedComposedValue("array",'{"not":"an array"}'),/array/);
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
