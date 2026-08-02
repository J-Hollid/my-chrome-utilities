import assert from "node:assert/strict";
import {
  applyComposedSchemaContextualFacet,
  composedCanonicalSchema,
  composedSchemaScopeForKind,
  composedSchemaWorkspace,
  overrideComposedSchemaLocalRule,
  resetComposedSchemaLocalFacet,
  resetComposedSchemaLocalProperty,
  resetComposedSchemaLocalRule,
  saveComposedCanonicalDocument,
  saveComposedSchemaLocalFacets,
} from "../dist/data-layer-composed-schema-workspace.js";
import {applyCanonicalCommand,canonicalPropertyPath} from "../dist/data-layer-canonical-schema.js";
import {createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";

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
  assert.deepEqual(multiRow.decisions.map(({facet})=>facet),["Range rule"],"generated complete Allowed values remain a Ready sparse override while the independent impossible Range stays a decision");
  assert.deepEqual(multiRow.effective.allowedValues,[30],"generated complete Allowed values win exactly outside the parent universe");
  const multiAfterOne=resetComposedSchemaLocalFacet(multiState,"pageGroups",multiGroup.id,multiPath,"minimum"),multiAfterOneGroup=multiAfterOne.project.collections.pageGroups[0],multiAfterOneRow=composedSchemaWorkspace(multiAfterOne,multiAfterOneGroup,"Page Group").rows.find(({path:rowPath})=>rowPath===multiPath);
  assert.deepEqual(multiAfterOneRow.decisions.map(({facet})=>facet),[],"repairing the generated Range decision leaves the ordinary Allowed-values override Ready");
  assert.equal(multiAfterOneGroup.localSchemaContributions[0].documentation,"keep multi docs","generated decision repair conserves an unrelated facet");
  assert.equal(multiAfterOne.history.undo.length,multiState.history.undo.length+1,"one generated decision repair adds exactly one Undo action");

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
  assert.deepEqual(contextualGroup.localSchemaContributions.find(({path})=>path===unrelatedPath),{path:unrelatedPath,documentation:"peer unrelated"},"a generated contextual repair conserves unrelated sparse data");
  assert.deepEqual(contextualGroup.localSchemaContributions.find(({path})=>path===peerPath).allowedValues,[rightValue],"a generated contextual repair stores the selected sparse value");
  assert.equal(contextual.history.undo.length,peerState.history.undo.length+1,"a generated contextual repair adds one Undo action");

  for(const {collection,kind,scope} of[
    {collection:"pages",kind:"pages",scope:"Page"},
    {collection:"pageGroups",kind:"pageGroups",scope:"Page Group"},
    {collection:"events",kind:"events",scope:"Event"},
  ]){
    assert.equal(composedSchemaScopeForKind(kind),scope,`generated ${scope} targets resolve contextual repairs under their own scope`);
    const targetState=createSpecificationProject({name:`Scoped ${scope} composition ${example}`,site:"shop.example",id:(value)=>`${value}:scoped:${scope}:${example}`}),targetId=`${kind}:scoped:${example}`;
    targetState.project.collections.profiles.push(
      {id:`profile:scoped-left:${example}`,name:`Scoped left ${example}`,schemaConstraints:[{path:peerPath,type:"string",allowedValues:[leftValue]}]},
      {id:`profile:scoped-right:${example}`,name:`Scoped right ${example}`,schemaConstraints:[{path:peerPath,type:"string",allowedValues:[rightValue]}]},
    );
    targetState.project.collections[collection].push({id:targetId,name:`Scoped ${scope} ${example}`,profileIds:[`profile:scoped-left:${example}`,`profile:scoped-right:${example}`]});
    const target=targetState.project.collections[collection][0],row=composedSchemaWorkspace(targetState,target,scope).rows.find(({path:rowPath})=>rowPath===peerPath),offered=row.repairs.find(({kind:repairKind,contributorId})=>repairKind==="use-contextual"&&contributorId===`profile:scoped-right:${example}`),repaired=applyComposedSchemaContextualFacet(targetState,kind,targetId,peerPath,offered.facet,offered.value,offered),repairedTarget=repaired.project.collections[collection][0];
    assert.equal(composedSchemaWorkspace(repaired,repairedTarget,scope).status,"ready",`generated ${scope} contextual choices resolve under their own scope`);
    assert.deepEqual(repairedTarget.localSchemaContributions.find(({path})=>path===peerPath).allowedValues,[rightValue],`generated ${scope} contextual choices persist their selected facet`);
  }

  const crossCases=[
    [{allowedValues:[leftValue]},{expectedValue:rightValue},"allowedValues","expectedValue"],
    [{type:"number"},{expectedValue:rightValue},"type","expectedValue"],
    [{presence:"forbidden"},{expectedValue:rightValue},"presence","expectedValue"],
    [{rules:[{id:`pattern:${example}`,kind:"pattern",pattern:"^a"}]},{expectedValue:rightValue},"patterns","expectedValue"],
    [{rules:[{id:`range:${example}`,kind:"range",minimum:10}]},{expectedValue:5},"minimum","expectedValue"],
    [{rules:[{id:`range-max:${example}`,kind:"range",maximum:3}]},{expectedValue:5},"maximum","expectedValue"],
    [{rules:[{id:`cardinality:${example}`,kind:"cardinality",minItems:2}]},{expectedValue:[]},"minItems","expectedValue"],
    [{rules:[{id:`cardinality-max:${example}`,kind:"cardinality",maxItems:1}]},{expectedValue:[1,2]},"maxItems","expectedValue"],
    [{itemSchema:{id:`items:${example}`,type:"string"}},{expectedValue:[1]},"itemSchema","expectedValue"],
  ],crossCase=crossCases[example%crossCases.length],crossPath=`/${token("cross")}`,crossState=createSpecificationProject({name:`Cross composition ${example}`,site:"shop.example",id:(kind)=>`${kind}:cross:${example}`});
  crossState.project.collections.profiles.push(
    {id:`profile:cross-left:${example}`,name:`Cross left ${example}`,schemaConstraints:[{path:crossPath,...crossCase[0]}]},
    {id:`profile:cross-right:${example}`,name:`Cross right ${example}`,schemaConstraints:[{path:crossPath,...crossCase[1]}]},
  );
  crossState.project.collections.pageGroups.push({id:`group:cross:${example}`,name:`Cross group ${example}`,profileIds:[`profile:cross-left:${example}`,`profile:cross-right:${example}`],localSchemaContributions:[{path:unrelatedPath,documentation:"cross unrelated"}]});
  const crossGroup=crossState.project.collections.pageGroups[0],crossRow=composedSchemaWorkspace(crossState,crossGroup,"Page Group").rows.find(({path:rowPath})=>rowPath===crossPath),crossRepairs=crossRow.repairs.filter(({kind})=>kind==="use-contextual");
  assert.equal(crossRepairs.length,2,"every generated cross-facet conflict offers both exact choices");
  for(const crossRepair of crossRepairs){
    const repaired=applyComposedSchemaContextualFacet(crossState,"pageGroups",crossGroup.id,crossPath,crossRepair.facet,crossRepair.value,crossRepair),repairedGroup=repaired.project.collections.pageGroups[0],workspace=composedSchemaWorkspace(repaired,repairedGroup,"Page Group"),effective=workspace.rows.find(({path:rowPath})=>rowPath===crossPath).effective,selectedFacet=crossRepair.facet,rejectedFacet=selectedFacet===crossCase[2]?crossCase[3]:crossCase[2];
    assert.equal(workspace.status,"ready",`generated ${selectedFacet} choice is semantically resolved`);
    assert.ok(Object.hasOwn(effective,selectedFacet),`generated effective value retains selected ${selectedFacet}`);
    assert.ok(!Object.hasOwn(effective,rejectedFacet),`generated effective value removes opposing ${rejectedFacet}`);
    assert.deepEqual(repairedGroup.localSchemaContributions.find(({path})=>path===unrelatedPath),{path:unrelatedPath,documentation:"cross unrelated"},"generated contextual choice preserves unrelated sparse data");
    assert.equal(repaired.history.undo.length,crossState.history.undo.length+1,"each generated contextual choice adds exactly one Undo action");
    assert.deepEqual(undoProjectTransaction(repaired).project.collections.pageGroups[0].localSchemaContributions,crossGroup.localSchemaContributions,"one Undo restores the unresolved property without disturbing unrelated sparse data");
  }

  const guardedFirstRule=Math.floor(example/4)%2===0,orderedRules=(ordinary,invariant)=>guardedFirstRule?[ordinary,invariant]:[invariant,ordinary],guardedCases=[
    [{type:"string",protectedFacets:["type"]},{type:"number"},"type","type","number",(effective)=>effective.type==="string"],
    [{rules:orderedRules({id:`generic-pattern:${example}`,kind:"pattern",pattern:"^.{1,20}$"},{id:`guarded-pattern:${example}`,kind:"pattern",pattern:"^[a-z]+$",enforcement:"invariant"})},{rules:[{id:`loose-pattern:${example}`,kind:"pattern",pattern:"^[0-9]+$"}]},"patterns","patterns",["^[0-9]+$"],(effective)=>JSON.stringify(effective.patterns)===JSON.stringify(["^.{1,20}$","^[a-z]+$"])],
    [{rules:orderedRules({id:`generic-range:${example}`,kind:"range",minimum:0},{id:`guarded-range:${example}`,kind:"range",minimum:10,enforcement:"invariant"})},{rules:[{id:`loose-range:${example}`,kind:"range",maximum:5}]},"minimum","maximum",{maximum:5},(effective)=>effective.minimum===10&&effective.maximum===undefined],
    [{rules:orderedRules({id:`generic-cardinality:${example}`,kind:"cardinality",minItems:0},{id:`guarded-cardinality:${example}`,kind:"cardinality",minItems:2,enforcement:"invariant"})},{rules:[{id:`loose-cardinality:${example}`,kind:"cardinality",maxItems:1}]},"minItems","maxItems",{maxItems:1},(effective)=>effective.minItems===2&&effective.maxItems===undefined],
  ],guardedCase=guardedCases[example%guardedCases.length],guardedPath=`/${token("guarded")}`,guardedState=createSpecificationProject({name:`Guarded composition ${example}`,site:"shop.example",id:(kind)=>`${kind}:guarded:${example}`}),guardedFirst=example%2===0,guardedId=guardedFirst?`profile:guard-a:${example}`:`profile:guard-b:${example}`,looseId=guardedFirst?`profile:guard-b:${example}`:`profile:guard-a:${example}`,guardedProfiles=[
    {id:guardedId,name:`Guarded ${example}`,schemaConstraints:[{path:guardedPath,...guardedCase[0]}]},
    {id:looseId,name:`Loose ${example}`,schemaConstraints:[{path:guardedPath,...guardedCase[1]}]},
  ];
  guardedState.project.collections.profiles.push(...(example%3===0?[...guardedProfiles].reverse():guardedProfiles));
  guardedState.project.collections.pageGroups.push({id:`group:guarded:${example}`,name:`Guarded group ${example}`,profileIds:guardedState.project.collections.profiles.map(({id})=>id),localSchemaContributions:[{path:unrelatedPath,documentation:"guarded unrelated"}]});
  const guardedGroup=guardedState.project.collections.pageGroups[0],guardedRow=composedSchemaWorkspace(guardedState,guardedGroup,"Page Group").rows.find(({path:rowPath})=>rowPath===guardedPath),guardedRepairs=guardedRow.repairs.filter(({kind})=>kind==="use-contextual");
  assert.deepEqual(guardedRepairs.map(({contributorId})=>contributorId),[guardedId],"generated protected and invariant conflicts expose only the authority-preserving contextual choice");
  const legalGuarded=guardedRepairs[0],guardedRepaired=applyComposedSchemaContextualFacet(guardedState,"pageGroups",guardedGroup.id,guardedPath,legalGuarded.facet,legalGuarded.value,legalGuarded),guardedRepairedGroup=guardedRepaired.project.collections.pageGroups[0],guardedWorkspace=composedSchemaWorkspace(guardedRepaired,guardedRepairedGroup,"Page Group"),guardedEffective=guardedWorkspace.rows.find(({path:rowPath})=>rowPath===guardedPath).effective;
  assert.equal(guardedWorkspace.status,"ready","the generated authority-preserving contextual choice resolves the peer conflict");
  assert.ok(guardedCase[5](guardedEffective),"the generated repair retains the protected or invariant effective facet and removes only the loose facet");
  assert.deepEqual(undoProjectTransaction(guardedRepaired).project.collections.pageGroups[0].localSchemaContributions,guardedGroup.localSchemaContributions,"one generated Undo restores the guarded decision and preserves unrelated sparse data");
  const illegalRepair={kind:"use-contextual",contributorId:looseId,rejectedContributorId:guardedId,rejectedFacet:guardedCase[2]},illegal=applyComposedSchemaContextualFacet(guardedState,"pageGroups",guardedGroup.id,guardedPath,guardedCase[3],guardedCase[4],illegalRepair);
  assert.deepEqual(illegal,guardedState,"a forged generated repair cannot reject a protected or invariant peer facet");

  const ordinaryPatternState=createSpecificationProject({name:`Ordinary Pattern composition ${example}`,site:"shop.example",id:(kind)=>`${kind}:ordinary-pattern:${example}`}),ordinaryPatternPath=`/${token("ordinary_pattern")}`;
  ordinaryPatternState.project.collections.profiles.push({id:`profile:ordinary-letters:${example}`,name:`Letters ${example}`,schemaConstraints:[{path:ordinaryPatternPath,rules:[{id:`ordinary-letters:${example}`,kind:"pattern",pattern:"^[a-z]+$"}]}]},{id:`profile:ordinary-digits:${example}`,name:`Digits ${example}`,schemaConstraints:[{path:ordinaryPatternPath,rules:[{id:`ordinary-digits:${example}`,kind:"pattern",pattern:"^[0-9]+$"}]}]});
  ordinaryPatternState.project.collections.pageGroups.push({id:`group:ordinary-pattern:${example}`,name:`Ordinary Pattern group ${example}`,profileIds:[`profile:ordinary-letters:${example}`,`profile:ordinary-digits:${example}`]});
  const ordinaryPatternGroup=ordinaryPatternState.project.collections.pageGroups[0],ordinaryPatternRow=composedSchemaWorkspace(ordinaryPatternState,ordinaryPatternGroup,"Page Group").rows.find(({path:rowPath})=>rowPath===ordinaryPatternPath),lettersRepair=ordinaryPatternRow.repairs.find(({contributorId})=>contributorId===`profile:ordinary-letters:${example}`),ordinaryPatternRepaired=applyComposedSchemaContextualFacet(ordinaryPatternState,"pageGroups",ordinaryPatternGroup.id,ordinaryPatternPath,lettersRepair.facet,lettersRepair.value,lettersRepair),ordinaryPatternEffective=composedSchemaWorkspace(ordinaryPatternRepaired,ordinaryPatternRepaired.project.collections.pageGroups[0],"Page Group").rows.find(({path:rowPath})=>rowPath===ordinaryPatternPath).effective;
  assert.deepEqual(ordinaryPatternEffective.patterns,["^[a-z]+$"],"a generated same-facet Pattern choice is conserved exactly once");

  const rulePath=`/${token("rule")}`,sourceRuleId=`rule:source:${example}`,genericRuleId=`rule:generic:${example}`,localRuleId=`rule:local:${example}`,invariant=example%2===1,ruleState=createSpecificationProject({name:`Rule composition ${example}`,site:"shop.example",id:(kind)=>`${kind}:rule:${example}`});
  ruleState.project.collections.profiles.push({id:`profile:rule:${example}`,name:`Rule source ${example}`,schemaConstraints:[{path:rulePath,type:invariant?"number":"string",rules:invariant?[{id:sourceRuleId,name:`Source Range ${example}`,kind:"range",maximum:5,enforcement:"invariant"}]:[{id:genericRuleId,name:`Generic Pattern ${example}`,kind:"pattern",pattern:"^.{1,20}$"},{id:sourceRuleId,name:`Source Pattern ${example}`,kind:"pattern",pattern:"^[a-z]+$"}]}]});
  ruleState.project.collections.pageGroups.push({id:`group:rule:${example}`,name:`Rule local ${example}`,profileId:`profile:rule:${example}`,localSchemaContributions:[{path:rulePath,rules:[invariant?{id:localRuleId,name:`Local Range ${example}`,kind:"range",minimum:10}:{id:localRuleId,name:`Local Pattern ${example}`,kind:"pattern",pattern:"^[0-9]+$"}]},{path:unrelatedPath,type:"boolean"}]});
  const ruleGroup=ruleState.project.collections.pageGroups[0],ruleRow=composedSchemaWorkspace(ruleState,ruleGroup,"Page Group").rows.find(({path:rowPath})=>rowPath===rulePath),repair=ruleRow.repairs.find(({kind})=>kind===(invariant?"remove-local-rule":"override-rule"));
  assert.deepEqual({ruleId:repair.ruleId,sourceRuleId:repair.sourceRuleId},{ruleId:localRuleId,sourceRuleId},"generated named-rule repairs preserve both stable identities");
  const ruleRepaired=invariant?resetComposedSchemaLocalRule(ruleState,"pageGroups",ruleGroup.id,rulePath,localRuleId):overrideComposedSchemaLocalRule(ruleState,"pageGroups",ruleGroup.id,rulePath,localRuleId,sourceRuleId),ruleRepairedGroup=ruleRepaired.project.collections.pageGroups[0];
  assert.equal(composedSchemaWorkspace(ruleRepaired,ruleRepairedGroup,"Page Group").status,"ready","generated named-rule repair clears its conflict");
  if(!invariant){const effective=composedSchemaWorkspace(ruleRepaired,ruleRepairedGroup,"Page Group").rows.find(({path:rowPath})=>rowPath===rulePath).effective;assert.deepEqual(effective.rules.map(({id})=>id),[genericRuleId,localRuleId],"generated multiple-same-kind repair replaces only the actually conflicting identity");assert.deepEqual(effective.patterns,["^.{1,20}$","^[0-9]+$"],"generated Pattern facet remains aligned with retained rule identities");}
  assert.deepEqual(ruleRepairedGroup.localSchemaContributions.find(({path:storedPath})=>storedPath===unrelatedPath),{path:unrelatedPath,type:"boolean"},"generated named-rule repair conserves unrelated properties");
  assert.equal(ruleRepaired.history.undo.length,ruleState.history.undo.length+1,"a generated named-rule repair adds one Undo action");
}

console.log("data-layer composed schema workspace property tests passed");
