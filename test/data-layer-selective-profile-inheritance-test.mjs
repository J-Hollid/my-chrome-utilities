import assert from "node:assert/strict";
import {
  copyProfileInheritanceRecipe,
  createProfileInheritanceRecipe,
  profileInheritanceImpact,
  profileInheritanceSelection,
  profileInheritanceSummary,
  searchProfileInheritanceProperties,
  selectProfileInheritanceBranch,
  selectiveProfileContribution,
} from "../dist/data-layer-selective-profile-inheritance.js";
import {canonicalPropertyPath} from "../dist/data-layer-canonical-schema.js";
import {compileLayeredSchema} from "../dist/data-layer-layered-schema.js";

const node=(id,name,type,order,{parentId,concept,presence={mode:"optional"},rules=[],description="",example}={})=>({
  id,name,type,order,...(parentId?{parentId}:{}),...(concept?{concept}:{}),presence,allowedValues:[],rules,
  documentation:{displayText:name,description,comments:"",example:example===undefined?{method:"blank"}:{method:"custom",value:example}},
  provenance:[{source:"created",contributorId:"profile:master",contributorName:"Master",scope:"Shared Profile"}],overrideReferences:[],
});
const pageType=node("property:page-type","page_type","string",0,{concept:"page",presence:{mode:"required"},description:"Page classification",example:"error"});
const error=node("property:error","error","object",1,{concept:"error"});
const errorCode=node("property:error-code","code","string",0,{parentId:error.id,concept:"error"});
const conditional={kind:"all",children:[{kind:"predicate",id:"predicate:page-type",propertyId:pageType.id,operator:"Equals",value:"error"}]};
const errorMessage=node("property:error-message","message","string",1,{parentId:error.id,concept:"error",presence:{mode:"required-when",condition:conditional},rules:[{id:"rule:error-message",kind:"pattern",pattern:"^ERR",condition:conditional,severity:"error",message:"Use an error message"}],description:"Readable error message",example:"ERR unavailable"});
const errorDetails=node("property:error-details","details","object",2,{parentId:error.id,concept:"error"});
const offer=node("property:offer","offer_id","string",2,{concept:"offer"});
const master={id:"canonical:master",revision:7,state:"Draft",contributorId:"profile:master",contributorName:"Master",rootIds:[pageType.id,error.id,offer.id],nodes:Object.fromEntries([pageType,error,errorCode,errorMessage,errorDetails,offer].map((item)=>[item.id,item])),view:"tree",changes:[]};

const empty=createProfileInheritanceRecipe({id:"recipe:error-page",profileId:"profile:master",targetId:"page:error",startingPoint:"empty",sourceRevision:master.revision});
assert.deepEqual(profileInheritanceSelection(master,empty).directPropertyIds,[]);

const everything=createProfileInheritanceRecipe({id:"recipe:everything",profileId:"profile:master",targetId:"page:all",startingPoint:"everything",sourceRevision:master.revision});
assert.equal(profileInheritanceSelection(master,everything).directPropertyIds.length,6);

const concepts={...empty,conceptSelections:["page"]};
assert.deepEqual(profileInheritanceSelection(master,concepts).directPropertyIds,[pageType.id]);

const pinned=selectProfileInheritanceBranch(master,{...empty,propertySelections:[errorMessage.id]},error.id);
assert.deepEqual(new Set(pinned.propertySelections),new Set([error.id,errorCode.id,errorMessage.id,errorDetails.id]));
const partial={...pinned,excludedPropertyIds:[errorDetails.id]};
const partialSelection=profileInheritanceSelection(master,partial);
assert.deepEqual(new Set(partialSelection.directPropertyIds),new Set([error.id,errorCode.id,errorMessage.id]));
assert.equal(partialSelection.missingRuleDependencies.some(({propertyId})=>propertyId===pageType.id),true);
const unresolvedContribution=selectiveProfileContribution(master,{...empty,propertySelections:[errorMessage.id]});
const unresolvedCompile=compileLayeredSchema([{id:"profile:master",name:"Master",scope:"Shared Profile",constraints:unresolvedContribution.constraints,inheritanceConflicts:unresolvedContribution.conflicts}],{surface:"data-layer"});
assert.equal(unresolvedCompile.status,"blocked");
assert.equal(unresolvedCompile.conflicts.some(({message})=>message.includes("include, exclude, or replace")),true);

const nestedOnly={...empty,propertySelections:[errorMessage.id],excludedRuleIds:["presence:property:error-message","rule:error-message"]};
const nestedSelection=profileInheritanceSelection(master,nestedOnly);
assert.deepEqual(nestedSelection.structuralPropertyIds,[error.id]);
assert.deepEqual(nestedSelection.ruleDependencyPropertyIds,[]);
const nestedContribution=selectiveProfileContribution(master,nestedOnly);
assert.deepEqual(nestedContribution.constraints.map(({path})=>path),["/error","/error/message"]);
assert.equal(nestedContribution.constraints[1].presence,undefined,"excluding conditional presence makes the inherited definition optional");
assert.deepEqual(nestedContribution.constraints[1].rules,[],"excluded stable rule identities are not copied into the target");
assert.equal(JSON.stringify(nestedContribution).includes('"nodes"'),false,"recipes and filtered contributions contain no copied canonical document");

const includedDependency={...empty,propertySelections:[errorMessage.id],includedDependencyPropertyIds:[pageType.id]};
const included=profileInheritanceSelection(master,includedDependency);
assert.deepEqual(new Set(included.ruleDependencyPropertyIds),new Set([pageType.id]));
assert.deepEqual(selectiveProfileContribution(master,includedDependency).constraints.map(({path})=>path),["/page_type","/error","/error/message"]);

const replaced={...empty,propertySelections:[errorMessage.id],excludedRuleIds:["rule:error-message"],ruleReplacements:[{sourceRuleId:"rule:error-message",propertyId:errorMessage.id,rule:{id:"rule:target",kind:"pattern",pattern:"^TARGET",severity:"error",message:"Target-specific",replacesRuleId:"rule:error-message"}}],presenceReplacements:[{sourceRuleId:"presence:property:error-message",propertyId:errorMessage.id,presence:"required"}]};
const replacementConstraint=selectiveProfileContribution(master,replaced).constraints.find(({definitionId})=>definitionId===errorMessage.id);
assert.equal(replacementConstraint.presence,"required");
assert.equal(replacementConstraint.condition,undefined);
assert.equal(replacementConstraint.rules[0].replacesRuleId,"rule:error-message");

const summary=profileInheritanceSummary(master,{...concepts,propertySelections:[errorCode.id],excludedPropertyIds:[pageType.id]});
assert.deepEqual(summary,{direct:1,structural:1,ruleDependencies:0,missingDependencies:0,conflicts:0,effective:2,synchronizedConcepts:1,fixedProperties:1,exclusions:1,ruleOverrides:0,missingSelections:0});

assert.deepEqual(searchProfileInheritanceProperties(master,{query:"readable",concept:"error",type:"string",required:"any",selection:"any"},partial).map(({id})=>id),[errorMessage.id]);
assert.deepEqual(searchProfileInheritanceProperties(master,{query:"ERR unavailable",concept:"all",type:"all",required:"required",selection:"selected"},partial).map(({id})=>id),[errorMessage.id]);

const copied=copyProfileInheritanceRecipe(partial,{id:"recipe:copy",targetId:"event:error"});
assert.equal(copied.id,"recipe:copy");assert.equal(copied.targetId,"event:error");assert.deepEqual(copied.propertySelections,partial.propertySelections);copied.propertySelections.push(offer.id);assert.equal(partial.propertySelections.includes(offer.id),false);

const renamed={...master,revision:8,nodes:{...master.nodes,[errorMessage.id]:{...errorMessage,name:"friendly_message"}}};
const impact=profileInheritanceImpact(master,renamed,{...empty,propertySelections:[errorMessage.id,errorDetails.id],excludedRuleIds:["rule:error-message"]});
assert.deepEqual(impact.changedPaths,[{propertyId:errorMessage.id,before:"/error/message",after:"/error/friendly_message"}]);
assert.deepEqual(impact.removedPropertyIds,[]);
const deleted={...renamed,revision:9,nodes:Object.fromEntries(Object.entries(renamed.nodes).filter(([id])=>id!==errorDetails.id))};
assert.deepEqual(profileInheritanceImpact(renamed,deleted,{...empty,propertySelections:[errorMessage.id,errorDetails.id]}).removedPropertyIds,[errorDetails.id]);
assert.equal(profileInheritanceSelection(deleted,{...empty,propertySelections:[errorDetails.id]}).missingPropertyIds.includes(errorDetails.id),true);

assert.equal(canonicalPropertyPath(renamed,errorMessage.id),"/error/friendly_message");

console.log("selective profile inheritance model tests passed");
