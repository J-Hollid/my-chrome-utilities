import assert from "node:assert/strict";
import {
  applyComposedSchemaContextualFacet,
  composedCanonicalSchema,
  composedSchemaWorkspace,
  overrideComposedSchemaLocalRule,
  resetComposedSchemaLocalFacet,
  resetComposedSchemaLocalProperty,
  resetComposedSchemaLocalRule,
  saveComposedCanonicalDocument,
  saveComposedSchemaLocalFacets,
} from "../dist/data-layer-composed-schema-workspace.js";
import {applyCanonicalCommand,canonicalPropertyPath} from "../dist/data-layer-canonical-schema.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";

let seed=0x636f6d70;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/0x100000000);
const token=(prefix)=>`${prefix}_${Math.floor(random()*1_000_000)}`;

for(let example=0;example<150;example+=1){
  const path=`/${token("property")}`,unrelatedPath=`/${token("unrelated")}`,parentValue=token("parent"),localValue=token("local"),state=createSpecificationProject({name:`Composition ${example}`,site:"shop.example",id:(kind)=>`${kind}:${example}`});
  state.project.collections.profiles.push({id:`profile:${example}`,name:`Profile ${example}`,schemaConstraints:[{path,type:"string",expectedValue:parentValue},{path:unrelatedPath,type:"string"}]});
  state.project.collections.pageGroups.push({id:`group:${example}`,name:`Group ${example}`,profileId:`profile:${example}`});
  state.project.collections.pages.push({id:`page:${example}`,name:`Page ${example}`,profileId:`profile:${example}`,pageGroupIds:[`group:${example}`],localSchemaContributions:[{path:unrelatedPath,documentation:"preserve me"}]});

  const saved=saveComposedSchemaLocalFacets(state,"pages",`page:${example}`,path,{expectedValue:localValue,documentation:""}),savedPage=saved.project.collections.pages[0],savedRows=composedSchemaWorkspace(saved,savedPage,"Page").rows;
  assert.deepEqual(savedPage.localSchemaContributions,[{path:unrelatedPath,documentation:"preserve me"},{path,expectedValue:localValue}]);
  assert.deepEqual(savedRows.map(({path:rowPath})=>rowPath),[...new Set(savedRows.map(({path:rowPath})=>rowPath))].sort((left,right)=>left.localeCompare(right)));
  assert.equal(savedRows.find(({path:rowPath})=>rowPath===path).effective.expectedValue,localValue);

  const reset=resetComposedSchemaLocalProperty(saved,"pages",`page:${example}`,path),resetPage=reset.project.collections.pages[0],resetRows=composedSchemaWorkspace(reset,resetPage,"Page").rows;
  assert.deepEqual(resetPage.localSchemaContributions,[{path:unrelatedPath,documentation:"preserve me"}]);
  assert.equal(resetRows.find(({path:rowPath})=>rowPath===path).effective.expectedValue,parentValue);

  const projected=composedCanonicalSchema(reset,resetPage,"Page"),node=Object.values(projected.nodes).find((candidate)=>canonicalPropertyPath(projected,candidate.id)===path);
  assert.ok(node,`example ${example} projects its inherited property into the canonical core`);
  const edited=applyCanonicalCommand(projected,{kind:"set",baseRevision:projected.revision,propertyId:node.id,patch:{expectedValue:localValue}});
  assert.equal(edited.status,"applied");
  const written=saveComposedCanonicalDocument(reset,"pages",`page:${example}`,edited.document),writtenPage=written.project.collections.pages[0];
  assert.equal(writtenPage.localSchemaContributions.length,2);
  assert.deepEqual(writtenPage.localSchemaContributions.find(({path:storedPath})=>storedPath===unrelatedPath),{path:unrelatedPath,documentation:"preserve me"},`example ${example} conserves an unrelated sparse contribution`);
  assert.deepEqual(writtenPage.localSchemaContributions.find(({path:storedPath})=>storedPath===path),{path,expectedValue:localValue},`example ${example} stores only its sparse local difference from the effective core`);
  assert.equal(composedSchemaWorkspace(written,writtenPage,"Page").rows.find(({path:rowPath})=>rowPath===path).effective.expectedValue,localValue);

  const facet=random()>=0.5?"type":"presence",sourceValue=facet==="type"?"string":"required",localFacetValue=facet==="type"?"number":"forbidden",protectedState=createSpecificationProject({name:`Protected composition ${example}`,site:"shop.example",id:(kind)=>`${kind}:protected:${example}`});
  protectedState.project.collections.profiles.push({id:`profile:protected:${example}`,name:`Protected profile ${example}`,schemaConstraints:[{path,[facet]:sourceValue,protectedFacets:[facet]}]});
  protectedState.project.collections.pageGroups.push({id:`group:protected:${example}`,name:`Protected group ${example}`,profileId:`profile:protected:${example}`,localSchemaContributions:[{path,[facet]:localFacetValue,documentation:"preserve local documentation"},{path:unrelatedPath,type:"boolean"}]});
  const protectedGroup=protectedState.project.collections.pageGroups[0],protectedWorkspace=composedSchemaWorkspace(protectedState,protectedGroup,"Page Group"),decision=protectedWorkspace.rows.find(({path:rowPath})=>rowPath===path);
  assert.equal(protectedWorkspace.status,"blocked");
  assert.equal(decision.decisionFacet,facet[0].toUpperCase()+facet.slice(1));
  assert.ok(decision.repairs.some((repair)=>repair.kind==="use-source"&&repair.facet===facet),"every generated protected conflict offers its exact inherited facet repair");
  const repairedFacet=resetComposedSchemaLocalFacet(protectedState,"pageGroups",protectedGroup.id,path,facet),repairedGroup=repairedFacet.project.collections.pageGroups[0];
  assert.deepEqual(repairedGroup.localSchemaContributions,[{path,documentation:"preserve local documentation"},{path:unrelatedPath,type:"boolean"}],"a generated targeted repair conserves unrelated facets and properties");
  assert.equal(repairedFacet.history.undo.length,protectedState.history.undo.length+1,"a generated targeted repair creates exactly one Undo action");
  assert.equal(composedSchemaWorkspace(repairedFacet,repairedGroup,"Page Group").status,"ready");

  const multiPath=`/${token("multi")}`,multiState=createSpecificationProject({name:`Multi composition ${example}`,site:"shop.example",id:(kind)=>`${kind}:multi:${example}`});
  multiState.project.collections.profiles.push({id:`profile:multi:${example}`,name:`Multi source ${example}`,schemaConstraints:[{path:multiPath,allowedValues:[1,2],maximum:5}]});
  multiState.project.collections.pageGroups.push({id:`group:multi:${example}`,name:`Multi local ${example}`,profileId:`profile:multi:${example}`,localSchemaContributions:[{path:multiPath,allowedValues:[30],minimum:10,documentation:"keep multi docs"}]});
  const multiGroup=multiState.project.collections.pageGroups[0],multiRow=composedSchemaWorkspace(multiState,multiGroup,"Page Group").rows.find(({path:rowPath})=>rowPath===multiPath);
  assert.deepEqual(multiRow.decisions.map(({facet})=>facet),["Allowed values","Range rule"],"generated multi-issue rows conserve every independent decision");
  const multiAfterOne=resetComposedSchemaLocalFacet(multiState,"pageGroups",multiGroup.id,multiPath,"allowedValues"),multiAfterOneGroup=multiAfterOne.project.collections.pageGroups[0],multiAfterOneRow=composedSchemaWorkspace(multiAfterOne,multiAfterOneGroup,"Page Group").rows.find(({path:rowPath})=>rowPath===multiPath);
  assert.deepEqual(multiAfterOneRow.decisions.map(({facet})=>facet),["Range rule"],"repairing one generated issue conserves the other issue on the property");
  assert.equal(multiAfterOneGroup.localSchemaContributions[0].documentation,"keep multi docs","generated multi-issue repair conserves an unrelated facet");
  assert.equal(multiAfterOne.history.undo.length,multiState.history.undo.length+1,"one generated multi-issue repair adds exactly one Undo action");

  const peerPath=`/${token("peer")}`,leftValue=token("left"),rightValue=token("right"),peerState=createSpecificationProject({name:`Peer composition ${example}`,site:"shop.example",id:(kind)=>`${kind}:peer:${example}`});
  peerState.project.collections.profiles.push(
    {id:`profile:left:${example}`,name:`Left ${example}`,schemaConstraints:[{path:peerPath,type:"string",allowedValues:[leftValue]}]},
    {id:`profile:right:${example}`,name:`Right ${example}`,schemaConstraints:[{path:peerPath,type:"string",allowedValues:[rightValue]}]},
  );
  peerState.project.collections.pageGroups.push({id:`group:peer:${example}`,name:`Peer group ${example}`,profileIds:[`profile:left:${example}`,`profile:right:${example}`],localSchemaContributions:[{path:unrelatedPath,documentation:"peer unrelated"}]});
  const peerGroup=peerState.project.collections.pageGroups[0],peerRow=composedSchemaWorkspace(peerState,peerGroup,"Page Group").rows.find(({path:rowPath})=>rowPath===peerPath),chosen=peerRow.repairs.find(({kind,contributorId})=>kind==="use-contextual"&&contributorId===`profile:right:${example}`);
  assert.deepEqual({facet:chosen.facet,value:chosen.value},{facet:"allowedValues",value:[rightValue]},"generated parallel conflicts retain their contextual value");
  const contextual=applyComposedSchemaContextualFacet(peerState,"pageGroups",peerGroup.id,peerPath,chosen.facet,chosen.value),contextualGroup=contextual.project.collections.pageGroups[0];
  assert.equal(composedSchemaWorkspace(contextual,contextualGroup,"Page Group").status,"ready","every generated contextual choice recompiles ready");
  assert.deepEqual(contextualGroup.localSchemaContributions,[{path:unrelatedPath,documentation:"peer unrelated"},{path:peerPath,allowedValues:[rightValue]}],"a generated contextual repair conserves unrelated sparse data");
  assert.equal(contextual.history.undo.length,peerState.history.undo.length+1,"a generated contextual repair adds one Undo action");

  const rulePath=`/${token("rule")}`,sourceRuleId=`rule:source:${example}`,localRuleId=`rule:local:${example}`,invariant=example%2===1,ruleState=createSpecificationProject({name:`Rule composition ${example}`,site:"shop.example",id:(kind)=>`${kind}:rule:${example}`});
  ruleState.project.collections.profiles.push({id:`profile:rule:${example}`,name:`Rule source ${example}`,schemaConstraints:[{path:rulePath,type:invariant?"number":"string",rules:[invariant?{id:sourceRuleId,name:`Source Range ${example}`,kind:"range",maximum:5,enforcement:"invariant"}:{id:sourceRuleId,name:`Source Pattern ${example}`,kind:"pattern",pattern:"^[a-z]+$"}]}]});
  ruleState.project.collections.pageGroups.push({id:`group:rule:${example}`,name:`Rule local ${example}`,profileId:`profile:rule:${example}`,localSchemaContributions:[{path:rulePath,rules:[invariant?{id:localRuleId,name:`Local Range ${example}`,kind:"range",minimum:10}:{id:localRuleId,name:`Local Pattern ${example}`,kind:"pattern",pattern:"^[0-9]+$"}]},{path:unrelatedPath,type:"boolean"}]});
  const ruleGroup=ruleState.project.collections.pageGroups[0],ruleRow=composedSchemaWorkspace(ruleState,ruleGroup,"Page Group").rows.find(({path:rowPath})=>rowPath===rulePath),repair=ruleRow.repairs.find(({kind})=>kind===(invariant?"remove-local-rule":"override-rule"));
  assert.deepEqual({ruleId:repair.ruleId,sourceRuleId:repair.sourceRuleId},{ruleId:localRuleId,sourceRuleId},"generated named-rule repairs preserve both stable identities");
  const ruleRepaired=invariant?resetComposedSchemaLocalRule(ruleState,"pageGroups",ruleGroup.id,rulePath,localRuleId):overrideComposedSchemaLocalRule(ruleState,"pageGroups",ruleGroup.id,rulePath,localRuleId,sourceRuleId),ruleRepairedGroup=ruleRepaired.project.collections.pageGroups[0];
  assert.equal(composedSchemaWorkspace(ruleRepaired,ruleRepairedGroup,"Page Group").status,"ready","generated named-rule repair clears its conflict");
  assert.deepEqual(ruleRepairedGroup.localSchemaContributions.find(({path:storedPath})=>storedPath===unrelatedPath),{path:unrelatedPath,type:"boolean"},"generated named-rule repair conserves unrelated properties");
  assert.equal(ruleRepaired.history.undo.length,ruleState.history.undo.length+1,"a generated named-rule repair adds one Undo action");
}

console.log("data-layer composed schema workspace property tests passed");
