import assert from "node:assert/strict";
import {
  copyProfileInheritanceRecipe,
  createProfileInheritanceRecipe,
  profileInheritanceImpact,
  profileInheritanceCurrentImpact,
  profileInheritanceRecipeApplied,
  markProfileInheritanceTargetStale,
  profileInheritanceSelection,
  profileInheritanceSummary,
  searchProfileInheritanceProperties,
  selectProfileInheritanceBranch,
  selectiveProfileContribution,
} from "../dist/data-layer-selective-profile-inheritance.js";
import {canonicalPropertyPath} from "../dist/data-layer-canonical-schema.js";
import {compileLayeredSchema,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";

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

const businessAncestor={...error,presence:{mode:"required"},allowedValues:[{id:"value:error",value:{code:"E"}}],rules:[{id:"rule:error-container",kind:"cardinality",minItems:2,severity:"error"}],documentation:{displayText:"Business error",description:"Business-only ancestor documentation",comments:"Do not inherit structurally",example:{method:"custom",value:{code:"E"}}},onlyDefinedFields:true};
const structuralMaster={...master,nodes:{...master.nodes,[error.id]:businessAncestor}};
const structuralConstraint=selectiveProfileContribution(structuralMaster,nestedOnly).constraints[0];
assert.deepEqual(structuralConstraint,{path:"/error",type:"object",definitionId:error.id,selectionReason:"structural"},"structural ancestors retain shape and stable provenance identity only");

const structuralArrayCases=[
  {name:"object item",shape:{type:"array",itemSchema:{id:"item:object",type:"object",allowedValues:[{business:"source-only"}]}},validPayload:{error:[{message:"anything"}]},invalidPayload:{error:["not-an-object"]},expected:{itemSchema:{id:"item:object",type:"object"}}},
  {name:"nested array",shape:{type:"array",itemSchema:{id:"item:outer",type:"array",allowedValues:[[{business:"source-only"}]],items:{id:"item:inner",type:"object",allowedValues:[{business:"source-only"}]}}},validPayload:{error:[[{message:"anything"}]]},invalidPayload:{error:[[1]]},expected:{itemSchema:{id:"item:outer",type:"array",items:{id:"item:inner",type:"object"}}}},
];
for(const structuralCase of structuralArrayCases){
  const ancestor={...businessAncestor,...structuralCase.shape},document={...master,nodes:{...master.nodes,[error.id]:ancestor}},contribution=selectiveProfileContribution(document,nestedOnly),constraint=contribution.constraints[0];
  assert.deepEqual(constraint,{path:"/error",type:"array",...structuralCase.expected,definitionId:error.id,selectionReason:"structural"},`${structuralCase.name} structural array shape survives without business facets`);
  assert.equal(JSON.stringify(constraint).includes("source-only"),false,`${structuralCase.name} structural projection drops item allowed values`);
  const compiled=compileLayeredSchema([{id:"profile:master",name:"Master",scope:"Shared Profile",constraints:contribution.constraints}],{}),validValidation=validateLayeredObservation({targetId:"page:error",targetName:"Error Page",revision:1,compiled},structuralCase.validPayload),invalidValidation=validateLayeredObservation({targetId:"page:error",targetName:"Error Page",revision:1,compiled},structuralCase.invalidPayload);
  assert.equal(validValidation.issues.some(({code})=>code==="ALLOWED_VALUE"),false,`${structuralCase.name} structural item enums are not inherited or validated`);
  assert.equal(invalidValidation.issues.some(({code,canonicalPath})=>code==="TYPE"&&canonicalPath?.startsWith("/error/*")),true,`${structuralCase.name} nested structural type shape remains enforceable`);
  const applied=profileInheritanceRecipeApplied(document,nestedOnly),enumEditedSchema=structuralCase.name==="nested array"?{...ancestor.itemSchema,allowedValues:[[{business:"edited-only"}]],items:{...ancestor.itemSchema.items,allowedValues:[{business:"edited-only"}]}}:{...ancestor.itemSchema,allowedValues:[{business:"edited-only"}]},enumEdited={...document,revision:document.revision+1,nodes:{...document.nodes,[error.id]:{...ancestor,itemSchema:enumEditedSchema}}};
  assert.equal(profileInheritanceCurrentImpact(enumEdited,applied).stale,false,`${structuralCase.name} structural item-enum-only edits stay current`);
  const shapeEditedSchema=structuralCase.name==="nested array"?{...ancestor.itemSchema,items:{...ancestor.itemSchema.items,type:"string"}}:{...ancestor.itemSchema,type:"string"},shapeEdited={...document,revision:document.revision+1,nodes:{...document.nodes,[error.id]:{...ancestor,itemSchema:shapeEditedSchema}}},shapeImpact=profileInheritanceCurrentImpact(shapeEdited,applied);
  assert.equal(shapeImpact.stale,true,`${structuralCase.name} structural item type edits stale consumers`);assert.equal(shapeImpact.changedDefinitionPropertyIds.includes(error.id),true);
}

const ordinaryPattern={id:"rule:error-code-pattern",kind:"pattern",pattern:"^SOURCE$",severity:"error",message:"Source pattern"};
const ruleMaster={...master,nodes:{...master.nodes,[errorCode.id]:{...errorCode,rules:[ordinaryPattern]}}};
const excludedPattern={...empty,propertySelections:[errorCode.id],excludedRuleIds:[ordinaryPattern.id]};
const excludedPatternConstraint=selectiveProfileContribution(ruleMaster,excludedPattern).constraints.find(({definitionId})=>definitionId===errorCode.id);
assert.equal(excludedPatternConstraint.patterns,undefined,"excluding an ordinary rule removes its projected validation facets");
const excludedCompiled=compileLayeredSchema([{id:"profile:master",name:"Master",scope:"Shared Profile",constraints:selectiveProfileContribution(ruleMaster,excludedPattern).constraints}],{});
assert.equal(validateLayeredObservation({targetId:"page:error",targetName:"Error Page",revision:1,compiled:excludedCompiled},{error:{code:"anything"}}).issues.some(({code})=>code==="PATTERN"),false);
const replacementPattern={...excludedPattern,ruleReplacements:[{sourceRuleId:ordinaryPattern.id,propertyId:errorCode.id,rule:{...ordinaryPattern,id:"rule:target-pattern",pattern:"^TARGET$",replacesRuleId:ordinaryPattern.id}}]};
const replacementPatternConstraint=selectiveProfileContribution(ruleMaster,replacementPattern).constraints.find(({definitionId})=>definitionId===errorCode.id);
assert.deepEqual(replacementPatternConstraint.patterns,["^TARGET$"],"replacement facets are derived only from the reviewed target rule");
const replacementCompiled=compileLayeredSchema([{id:"profile:master",name:"Master",scope:"Shared Profile",constraints:selectiveProfileContribution(ruleMaster,replacementPattern).constraints}],{});
assert.equal(validateLayeredObservation({targetId:"page:error",targetName:"Error Page",revision:1,compiled:replacementCompiled},{error:{code:"SOURCE"}}).issues.some(({code})=>code==="PATTERN"),true);

const dependencyC=node("property:dependency-c","dependency_c","string",0);
const dependencyB=node("property:dependency-b","dependency_b","string",1,{rules:[{id:"rule:b-needs-c",kind:"value",expectedValue:"b",condition:{kind:"predicate",id:"predicate:c",propertyId:dependencyC.id,operator:"Exists"},severity:"error"}]});
const dependencyA=node("property:dependency-a","dependency_a","string",2,{rules:[{id:"rule:a-needs-b",kind:"value",expectedValue:"a",condition:{kind:"predicate",id:"predicate:b",propertyId:dependencyB.id,operator:"Exists"},severity:"error"}]});
const transitiveMaster={...master,rootIds:[dependencyC.id,dependencyB.id,dependencyA.id],nodes:Object.fromEntries([dependencyC,dependencyB,dependencyA].map((item)=>[item.id,item]))};
const transitiveRecipe={...empty,propertySelections:[dependencyA.id],includedDependencyPropertyIds:[dependencyB.id]};
assert.deepEqual(profileInheritanceSelection(transitiveMaster,transitiveRecipe).missingRuleDependencies.map(({propertyId})=>propertyId),[dependencyC.id],"included dependencies expose their own unresolved dependencies");
const transitiveResolved={...transitiveRecipe,includedDependencyPropertyIds:[dependencyB.id,dependencyC.id]};
assert.deepEqual(profileInheritanceSelection(transitiveMaster,transitiveResolved).ruleDependencyPropertyIds,[dependencyC.id,dependencyB.id],"dependency closure reaches a stable point in source order");
const cyclicMaster={...transitiveMaster,nodes:{...transitiveMaster.nodes,[dependencyB.id]:{...dependencyB,rules:[...dependencyB.rules,{id:"rule:b-needs-a",kind:"value",expectedValue:"b",condition:{kind:"predicate",id:"predicate:a",propertyId:dependencyA.id,operator:"Exists"},severity:"error"}]}}};
assert.equal(profileInheritanceSelection(cyclicMaster,transitiveResolved).missingRuleDependencies.length,0,"cycles terminate once every stable dependency identity is selected");

const invariantRule={...ordinaryPattern,id:"rule:invariant",enforcement:"invariant"};
const invariantMaster={...master,nodes:{...master.nodes,[errorCode.id]:{...errorCode,rules:[invariantRule]}}};
const illegalInvariantExclusion={...empty,propertySelections:[errorCode.id],excludedRuleIds:[invariantRule.id]};
assert.equal(selectiveProfileContribution(invariantMaster,illegalInvariantExclusion).constraints.find(({definitionId})=>definitionId===errorCode.id).rules.some(({id})=>id===invariantRule.id),true,"stored recipes cannot weaken an invariant even if malformed externally");

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

const appliedRecipe=profileInheritanceRecipeApplied(master,{...empty,propertySelections:[errorMessage.id,errorDetails.id],excludedRuleIds:["rule:error-message"]});
assert.equal(appliedRecipe.sourceRevision,master.revision);assert.equal(JSON.stringify(appliedRecipe.sourceSnapshot).includes('"nodes"'),false,"applied snapshots retain identity/path/fingerprint metadata, not definitions");
const appliedBytes=JSON.stringify(appliedRecipe);
for(const sourceDefinition of["^ERR","Use an error message","Readable error message","ERR unavailable",'"condition"','"value":"error"'])assert.equal(appliedBytes.includes(sourceDefinition),false,`applied recipes do not copy source definition bytes: ${sourceDefinition}`);
assert.equal(Object.values(appliedRecipe.sourceSnapshot.ruleFingerprints).every((value)=>/^digest-v1:[0-9a-f]{16}$/.test(value)),true,"new snapshots store deterministic digests");
assert.equal(Object.values(appliedRecipe.sourceSnapshot.definitionFingerprints).every((value)=>/^digest-v1:[0-9a-f]{16}$/.test(value)),true,"selected definition facets are stored only as deterministic digests");
const facetEdits=[
  ["type",errorMessage.id,(candidate)=>({...candidate,type:"number"})],
  ["nullable",errorMessage.id,(candidate)=>({...candidate,nullable:true})],
  ["closed-object policy",errorDetails.id,(candidate)=>({...candidate,onlyDefinedFields:true})],
  ["item shape",errorDetails.id,(candidate)=>({...candidate,type:"array",itemSchema:{id:"item:details",type:"string"}})],
  ["allowed values",errorMessage.id,(candidate)=>({...candidate,allowedValues:[{id:"allowed:message",value:"different"}]})],
  ["unconditional presence",errorDetails.id,(candidate)=>({...candidate,presence:{mode:"required"}})],
  ["documentation",errorMessage.id,(candidate)=>({...candidate,documentation:{...candidate.documentation,description:"Changed definition documentation"}})],
  ["example",errorMessage.id,(candidate)=>({...candidate,documentation:{...candidate.documentation,example:{method:"custom",value:"Changed example"}}})],
];
for(const [facet,propertyId,edit] of facetEdits){const changed={...master,revision:master.revision+1,nodes:{...master.nodes,[propertyId]:edit(master.nodes[propertyId])}},facetImpact=profileInheritanceCurrentImpact(changed,appliedRecipe);assert.equal(facetImpact.stale,true,`${facet} changes stale selected inheritance consumers`);assert.equal(facetImpact.changedDefinitionPropertyIds.includes(propertyId),true,`${facet} changes identify the selected definition`);}
const legacyApplied=structuredClone(appliedRecipe);legacyApplied.sourceSnapshot.ruleFingerprints={
  [`presence:${errorMessage.id}`]:JSON.stringify(errorMessage.presence),
  [errorMessage.rules[0].id]:JSON.stringify(errorMessage.rules[0]),
};
delete legacyApplied.sourceSnapshot.definitionFingerprints;
assert.equal(profileInheritanceCurrentImpact(master,legacyApplied).stale,false,"legacy raw snapshots remain readable without migration");
assert.equal(profileInheritanceCurrentImpact({...master,revision:8,nodes:{...master.nodes,[errorMessage.id]:{...errorMessage,rules:[{...errorMessage.rules[0],message:"Changed legacy message"}]}}},legacyApplied).changedRuleIds.includes(errorMessage.rules[0].id),true,"legacy raw snapshots still detect changes");
const legacyDefinitionChanged={...master,revision:master.revision+1,nodes:{...master.nodes,[errorMessage.id]:{...errorMessage,type:"number"}}},legacyDefinitionImpact=profileInheritanceCurrentImpact(legacyDefinitionChanged,legacyApplied),legacyDefinitionTarget=markProfileInheritanceTargetStale({id:"page:error",name:"Error Page",profileInheritanceRecipes:[legacyApplied]},"profile:master",master,legacyDefinitionChanged);
assert.equal(legacyDefinitionImpact.stale,true,"a later legacy source revision conservatively invalidates definitions that were not fingerprinted");assert.equal(legacyDefinitionTarget.validationStale,true);assert.equal(legacyDefinitionTarget.testCasesStale,true);assert.equal(legacyDefinitionTarget.documentationStale,true);assert.equal(legacyDefinitionTarget.exportStale,true);
const currentRenameImpact=profileInheritanceCurrentImpact(renamed,appliedRecipe);
assert.equal(currentRenameImpact.stale,true);assert.deepEqual(currentRenameImpact.changedPaths,[{propertyId:errorMessage.id,before:"/error/message",after:"/error/friendly_message"}]);
const reordered={...master,revision:master.revision+1,nodes:{...master.nodes,[errorMessage.id]:{...errorMessage,order:errorDetails.order},[errorDetails.id]:{...errorDetails,order:errorMessage.order}}},reorderImpact=profileInheritanceCurrentImpact(reordered,appliedRecipe);
assert.equal(reorderImpact.stale,true,"same-parent selected sibling reorder invalidates inherited output order");assert.equal(reorderImpact.changedDefinitionPropertyIds.includes(errorMessage.id),true);assert.equal(reorderImpact.changedDefinitionPropertyIds.includes(errorDetails.id),true);
const changedExcludedRule={...master,revision:9,nodes:{...master.nodes,[errorMessage.id]:{...errorMessage,rules:[{...errorMessage.rules[0],pattern:"^CHANGED"}]}}};
const excludedRuleImpact=profileInheritanceCurrentImpact(changedExcludedRule,appliedRecipe);
assert.deepEqual(excludedRuleImpact.changedRuleIds,["rule:error-message"],"source edits to an explicitly excluded stable rule remain reviewable");assert.equal(excludedRuleImpact.stale,true);
const unrelatedEdit={...master,revision:10,nodes:{...master.nodes,[offer.id]:{...offer,name:"renamed_offer"}}};
const unrelatedImpact=profileInheritanceCurrentImpact(unrelatedEdit,appliedRecipe);
assert.equal(unrelatedImpact.stale,false,"source edits outside the selected contribution do not stale the recipe");
const newDependencyRule={...errorMessage.rules[0],id:"rule:new-dependency",condition:{kind:"predicate",id:"predicate:offer",propertyId:offer.id,operator:"Exists"}};
const addedDependency={...master,revision:10,nodes:{...master.nodes,[errorMessage.id]:{...errorMessage,rules:[...errorMessage.rules,newDependencyRule]}}};
assert.equal(profileInheritanceCurrentImpact(addedDependency,appliedRecipe).newMissingRuleDependencies.some(({propertyId})=>propertyId===offer.id),true);
const staleTarget=markProfileInheritanceTargetStale({id:"page:error",name:"Error Page",profileInheritanceRecipes:[appliedRecipe]},"profile:master",master,renamed);
assert.equal(staleTarget.validationStale,true);assert.equal(staleTarget.testCasesStale,true);assert.equal(staleTarget.documentationStale,true);assert.equal(staleTarget.exportStale,true);assert.equal(staleTarget.profileInheritanceRecipes[0].sourceImpact.changedPaths.length,1);
const changedDefinition={...master,revision:master.revision+1,nodes:{...master.nodes,[errorMessage.id]:{...errorMessage,type:"number"}}},definitionStaleTarget=markProfileInheritanceTargetStale({id:"page:error",name:"Error Page",profileInheritanceRecipes:[appliedRecipe]},"profile:master",master,changedDefinition);
assert.equal(definitionStaleTarget.validationStale,true);assert.equal(definitionStaleTarget.testCasesStale,true);assert.equal(definitionStaleTarget.documentationStale,true);assert.equal(definitionStaleTarget.exportStale,true);assert.deepEqual(definitionStaleTarget.profileInheritanceRecipes[0].sourceImpact.changedDefinitionPropertyIds,[errorMessage.id]);
const currentTarget=markProfileInheritanceTargetStale({id:"page:error",name:"Error Page",profileInheritanceRecipes:[appliedRecipe]},"profile:master",master,unrelatedEdit);
assert.equal(currentTarget.validationStale,undefined);assert.equal(currentTarget.testCasesStale,undefined);assert.equal(currentTarget.documentationStale,undefined);assert.equal(currentTarget.exportStale,undefined);

assert.equal(canonicalPropertyPath(renamed,errorMessage.id),"/error/friendly_message");

console.log("selective profile inheritance model tests passed");
