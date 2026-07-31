import assert from "node:assert/strict";
import {compileLayeredSchema,resolveConditionalLayeredSchema,resolveLayeredTarget,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";
import {flowPageFrameContributor,layeredContributorPath,layeredContributorsForPath} from "../dist/data-layer-layered-schema-project.js";
import {documentPageGroupStructure,evaluatePageGroupFixture,pageGroupStructuralSchema,resetDepartedPageApplicabilityPreview} from "../dist/data-layer-page-group-structural-authoring.js";
import {compileSpecificationProject,createCanonicalProjectEnvelope,evaluateSpecificationObservation} from "../dist/data-layer-specification-engine.js";

let seed=0x51a7e;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/0x100000000;};
const pickSubset=(values)=>values.filter(()=>random()>=0.5);
let nestedRequiredConserved=true,eventTargetsIsolated=true,definedFieldsPolicyConserved=true;

for(let iteration=0;iteration<200;iteration+=1){
  const universe=Array.from({length:2+Math.floor(random()*7)},(_,index)=>`value-${iteration}-${index}`),selected=pickSubset(universe),narrowed=selected.length?selected:[universe[0]];
  const contributors=[
    {id:`base:${iteration}`,name:"Base",scope:"Shared Profile",constraints:[{path:"/choice",type:"string",allowedValues:universe}]},
    {id:`specific:${iteration}`,name:"Specific",scope:"Event",constraints:[{path:"/choice",allowedValues:narrowed}]},
    {id:`excluded:${iteration}`,name:"Excluded",scope:"Page",constraints:[{path:"/excluded",type:"number",target:"other-event"}]},
  ],context={eventId:"selected-event",eventRole:"interaction"},first=compileLayeredSchema(contributors,context),roundTrip=compileLayeredSchema(JSON.parse(JSON.stringify(contributors)),context);
  assert.equal(first.status,"ready");
  assert.deepEqual(first.properties["/choice"].allowedValues,narrowed,"a valid specific subset is conserved exactly");
  assert.equal("/excluded" in first.properties,false,"a non-targeted contribution never leaks into the effective schema");
  assert.deepEqual(roundTrip,first,"JSON persistence preserves deterministic compilation");

  const closed=random()>=0.5,policyCompiled=compileLayeredSchema([
    {id:`policy-base:${iteration}`,name:"Policy base",scope:"Shared Profile",constraints:[{path:"/declared",type:"object"},{path:"/declared/value",type:"string"}],onlyDefinedFields:!closed},
    {id:`policy-local:${iteration}`,name:"Policy local",scope:"Event",constraints:[],onlyDefinedFields:closed},
  ],context),policyIssues=validateLayeredObservation({targetId:`policy:${iteration}`,targetName:"Policy",revision:iteration,compiled:policyCompiled},{declared:{value:"kept",extra:"unknown"},rootExtra:true}).issues.filter(({code})=>code==="UNDECLARED_PROPERTY");
  definedFieldsPolicyConserved&&=policyCompiled.onlyDefinedFields===closed&&(closed?policyIssues.map(({path})=>path).sort().join("|")==="/declared/extra|/rootExtra":policyIssues.length===0);

  const priority=1+Math.floor(random()*50),compiled=first,automatic={id:`auto:${iteration}`,name:"Automatic",activation:"automatic",priority,applicability:[],compiled},lower={...automatic,id:`lower:${iteration}`,name:"Lower",priority:priority-1},documentation={...automatic,id:`docs:${iteration}`,name:"Docs",activation:"documentation-only",priority:priority+100},resolution=resolveLayeredTarget([lower,documentation,automatic],{});
  assert.equal(resolution.winner?.id,automatic.id,"the unique highest automatic priority wins");
  assert.equal(resolution.candidates.some(({id})=>id===documentation.id),false,"documentation-only targets never enter automatic candidates");

  const actual=Math.floor(random()*101),expected=Math.floor(random()*101),operator=["Greater than","At least","Less than","At most"][Math.floor(random()*4)],matches={"Greater than":actual>expected,"At least":actual>=expected,"Less than":actual<expected,"At most":actual<=expected}[operator],conditional=compileLayeredSchema([{id:`numeric:${iteration}`,name:"Numeric",scope:"Event",constraints:[{path:"/actual",definitionId:`definition:actual:${iteration}`,type:"number"},{path:"/conditional",type:"string",presence:"required",condition:{kind:"predicate",propertyId:`definition:actual:${iteration}`,operator,value:expected}}]}],context),conditionalIssues=validateLayeredObservation({targetId:`numeric:${iteration}`,targetName:"Numeric",revision:1,compiled:conditional},{actual}).issues;
  assert.equal(conditionalIssues.some(({path,code})=>path==="/conditional"&&code==="REQUIRED"),matches,`${operator} remains truthful for ${actual} and ${expected}`);

  const flowId=`flow:${iteration}`,pageId=`page:${iteration}`,groupId=`group:${iteration}`,frameId=`frame:${iteration}`,frameName=random()>=0.5?`Named frame ${iteration}`:"",frame={id:frameId,name:frameName,pageId,pageGroupId:groupId,canonicalSchema:{id:`schema:${iteration}`}},state={project:{collections:{profiles:[],events:[],pageGroups:[{id:groupId,name:`Group ${iteration}`,pageIds:[pageId]}],pages:[{id:pageId,name:`Page ${iteration}`}],flows:[{id:flowId,name:`Flow ${iteration}`}],applicabilitySets:[],fixtures:[],schemaDrafts:[],assignments:[]},documentationFlowGraphs:{[flowId]:{pageGroupIds:[groupId],pageFrames:[frame],occurrences:[],relationships:[]}}}},contributor=flowPageFrameContributor(state,flowId,frameId);
  assert.deepEqual({id:contributor.id,pageId:contributor.pageId,pageGroupId:contributor.pageGroupId,schemaId:contributor.canonicalSchema.id},{id:frameId,pageId,pageGroupId:groupId,schemaId:`schema:${iteration}`},"frame projection conserves every stable reference");
  assert.equal(contributor.name,frameName||`Page ${iteration} in Flow ${iteration}`,"blank frame names derive from stable human context");
  assert.deepEqual(layeredContributorPath(state,contributor,"Flow Page-instance",flowId),{pageGroupId:groupId,pageGroupIds:[groupId],pageId,flowId,pageFrameId:frameId},"frame contributor paths retain the selected lane and ordered Page Group inheritance path");
  assert.equal(flowPageFrameContributor(state,flowId,`missing:${iteration}`),undefined,"unknown frame IDs never fall back to a Page or Flow entity");

  const project={id:`project:${iteration}`,name:`Project ${iteration}`,site:"example.test",environments:["Production"],namingConventions:{property:"snake_case",event:"snake_case"},publicationPolicy:{warningsBlock:false,fixturesRequired:false},releases:[],collections:{profiles:[{id:`profile:${iteration}`,name:"Target profile",requirements:[{path:"/value",type:"string",required:true}]}],pageGroups:[],pages:[],events:[{id:`event:${iteration}`,name:"Event",sourceId:"event-history",eventName:"event"}],applicabilitySets:[],flows:[],fixtures:[],assignments:[{id:`assignment:${iteration}`,name:"Target assignment",targetKind:"Shared Profile",targetId:`profile:${iteration}`,eventId:`event:${iteration}`,priority:10}]}};
  const projectCompilation=compileSpecificationProject(createCanonicalProjectEnvelope(project,`draft:${iteration}`));
  assert.equal(projectCompilation.status,"compiled","current contributor-target Assignments compile without legacy schemaDrafts");

  project.collections.profiles[0].requirements=[{path:"/nested/value",type:"string",required:true}];
  const nestedCompilation=compileSpecificationProject(createCanonicalProjectEnvelope(project,`draft:nested:${iteration}`));
  assert.equal(nestedCompilation.status,"compiled");
  nestedRequiredConserved&&=evaluateSpecificationObservation(nestedCompilation.plan,{sourceId:"event-history",eventName:"event",payload:{}}).issueDetails.some(({path,code})=>path==="/nested/value"&&code==="required");

  project.collections.profiles[0].requirements=[{path:"/alpha",type:"string",required:true,target:`event:${iteration}`},{path:"/beta",type:"string",required:true,target:`event:other:${iteration}`}];
  project.collections.events.push({id:`event:other:${iteration}`,name:"Other event",sourceId:"event-history",eventName:"other_event"});
  project.collections.assignments.push({id:`assignment:other:${iteration}`,name:"Other target assignment",targetKind:"Shared Profile",targetId:`profile:${iteration}`,eventId:`event:other:${iteration}`,priority:10});
  const contextualCompilation=compileSpecificationProject(createCanonicalProjectEnvelope(project,`draft:context:${iteration}`));
  assert.equal(contextualCompilation.status,"compiled");
  const alpha=evaluateSpecificationObservation(contextualCompilation.plan,{sourceId:"event-history",eventName:"event",payload:{alpha:"present"}}),beta=evaluateSpecificationObservation(contextualCompilation.plan,{sourceId:"event-history",eventName:"other_event",payload:{beta:"present"}});
  eventTargetsIsolated&&=alpha.issueDetails.length===0&&beta.issueDetails.length===0;

  const membershipCount=2+Math.floor(random()*6),activeIndex=Math.floor(random()*(membershipCount-1)),pageGroupIds=Array.from({length:membershipCount},(_,index)=>`group:structural:${iteration}:${index}`),applicabilitySets=pageGroupIds.slice(1).map((groupId,index)=>({id:`set:structural:${iteration}:${index}`,name:`Audience ${iteration}-${index}`,condition:{kind:"predicate",field:"audience",operator:"equals",value:`audience-${index}`},groupId})),structuralState={project:{id:`project:structural:${iteration}`,collections:{profiles:[],events:[],flows:[],schemaDrafts:[],assignments:[],applicabilitySets,pageGroups:pageGroupIds.map((id,index)=>({id,name:`Group ${iteration}-${index}`,...(index?{applicabilitySetId:applicabilitySets[index-1].id}:{}),schemaConstraints:[{path:"/ordinary_winner",type:"string",allowedValues:[`winner-${iteration}-${index}`]},{path:`/property_${index}`,type:"string",expectedValue:`value-${index}`}]})),pages:[{id:`page:structural:${iteration}`,name:`Page ${iteration}`,eventName:"pageview",pageGroupIds}],fixtures:[{id:`fixture:structural:${iteration}`,name:`Fixture ${iteration}`,pageId:`page:structural:${iteration}`,payload:{audience:`audience-${activeIndex}`}}]},documentationFlowGraphs:{}}},before=structuredClone(structuralState),structural=pageGroupStructuralSchema(structuralState,`page:structural:${iteration}`),evaluated=evaluatePageGroupFixture(structuralState,`fixture:structural:${iteration}`),genericDocumentation=documentPageGroupStructure(structural);
  assert.deepEqual(structural.memberships.map(({groupId})=>groupId),pageGroupIds,"structural authoring preserves every stored membership in exact order");
  assert.deepEqual(structural.conditionalBranches.map(({groupId})=>groupId),pageGroupIds.slice(1),"generic structure preserves every conditional branch without evaluating a payload");
  assert.ok(applicabilitySets.every(({name})=>genericDocumentation.includes(name)),"generic documentation names every conditional branch");
  const previewSetIds=applicabilitySets.filter(()=>random()>=0.5).map(({id})=>id),previewed=pageGroupStructuralSchema(structuralState,`page:structural:${iteration}`,previewSetIds),includedIndexes=[0,...applicabilitySets.flatMap(({id},index)=>previewSetIds.includes(id)?[index+1]:[])],winnerIndex=includedIndexes.at(-1);
  assert.deepEqual(previewed.applicabilityPreviews.filter(({checked})=>checked).map(({applicabilitySetId})=>applicabilitySetId),previewSetIds,"an arbitrary transient preview subset is conserved exactly");
  assert.deepEqual(previewed.includedMemberships.map(({groupId})=>groupId),includedIndexes.map((index)=>pageGroupIds[index]),"an arbitrary preview subset retains stored membership order");
  assert.deepEqual(previewed.compiled.properties["/ordinary_winner"].allowedValues,[`winner-${iteration}-${winnerIndex}`],"the last participating ordinary value wins");
  assert.deepEqual(previewed.compiled.properties["/ordinary_winner"].superseded.map(({contributorName})=>contributorName),includedIndexes.slice(0,-1).map((index)=>`Group ${iteration}-${index}`),"every superseded ordinary contributor remains in stored order");
  const previews=new Map([[`page:structural:${iteration}`,new Set(previewSetIds)]]),pageRoute={projectId:structuralState.project.id,pageId:`page:structural:${iteration}`};
  assert.deepEqual(resetDepartedPageApplicabilityPreview(previews,pageRoute,pageRoute),pageRoute,"rerendering the same Page retains its transient preview");
  assert.deepEqual([...previews.get(pageRoute.pageId)],previewSetIds,"the same Page rerender retains the exact arbitrary subset");
  assert.equal(resetDepartedPageApplicabilityPreview(previews,pageRoute,undefined),undefined,"leaving the Page ends its preview route");
  assert.equal(previews.has(pageRoute.pageId),false,"every Page departure discards its transient applicability preview");
  assert.deepEqual(evaluated.includedStack,[`Group ${iteration}-0`,`Group ${iteration}-${activeIndex+1}`],"Fixture evaluation selects the unconditional group and exactly the matching conditional group");
  assert.deepEqual(evaluated.inactiveGroups,pageGroupIds.slice(1).map((_,index)=>({index,name:`Group ${iteration}-${index+1}`})).filter(({index})=>index!==activeIndex).map(({name})=>name),"Fixture evaluation preserves the stored order of inactive groups");
  assert.deepEqual(structuralState,before,"structural authoring and Fixture evaluation do not mutate the saved project");
}

for(let iteration=0;iteration<120;iteration+=1){
  const commonId=`profile:common:${iteration}`,leftId=`profile:left:${iteration}`,rightId=`profile:right:${iteration}`,leftGroupId=`group:left:${iteration}`,rightGroupId=`group:right:${iteration}`,pageId=`page:fan:${iteration}`,flowId=`flow:fan:${iteration}`,frameId=`frame:fan:${iteration}`;
  const fanState={project:{collections:{
    profiles:[
      {id:commonId,name:`Common ${iteration}`,schemaConstraints:[{path:"/shared",type:"string"}]},
      {id:leftId,name:`Left ${iteration}`,schemaConstraints:[{path:"/tier",type:"string",expectedValue:`left-${iteration}`}]},
      {id:rightId,name:`Right ${iteration}`,schemaConstraints:[{path:"/tier",type:"string",expectedValue:`right-${iteration}`}]},
    ],
    pageGroups:[
      {id:leftGroupId,name:`Left group ${iteration}`,profileIds:[commonId,leftId],schemaConstraints:[]},
      {id:rightGroupId,name:`Right group ${iteration}`,profileIds:[commonId,rightId],applicabilitySetId:`set:right:${iteration}`,schemaConstraints:[]},
    ],
    pages:[{id:pageId,name:`Fan page ${iteration}`,profileIds:[commonId],pageGroupIds:[leftGroupId,rightGroupId],schemaConstraints:[]}],
    events:[],flows:[{id:flowId,name:`Fan flow ${iteration}`}],fixtures:[],assignments:[],
    applicabilitySets:[{id:`set:right:${iteration}`,name:`Right audience ${iteration}`,condition:{kind:"predicate",field:"audience",operator:"equals",value:"right"}}],
  },documentationFlowGraphs:{[flowId]:{pageFrames:[{id:frameId,name:`Fan instance ${iteration}`,pageId,pageGroupId:leftGroupId}],occurrences:[],relationships:[]}}}};
  const page=fanState.project.collections.pages[0],pagePath=layeredContributorPath(fanState,page,"Page"),all=layeredContributorsForPath(fanState,pagePath),peers=all.filter(({scope})=>scope==="Shared Profile"),forward=compileLayeredSchema(peers,{eventId:"pageview",eventRole:"context"}),reverse=compileLayeredSchema([...peers].reverse(),{eventId:"pageview",eventRole:"context"});
  assert.equal(forward.status,"blocked","generated incompatible profile fan-in blocks");
  assert.deepEqual(reverse.conflicts,forward.conflicts,"peer conflict evidence is independent of profile permutation");
  const peerContribution=(id,constraint,onlyDefinedFields)=>({id:`profile:${id}:${iteration}`,name:`${id} ${iteration}`,scope:"Shared Profile",peerGroup:"shared-profiles",constraints:[{path:"/generated",...constraint}],...(onlyDefinedFields===undefined?{}:{onlyDefinedFields})}),compilePeers=(peers)=>compileLayeredSchema(peers,{eventId:"pageview",eventRole:"context"});
  const allowed=`allowed-${iteration}`,expected=`expected-${iteration}`,crossed=[
    peerContribution("a",{allowedValues:[allowed]}),
    peerContribution("b",{expectedValue:expected}),
  ],crossedSwapped=[
    peerContribution("a",{expectedValue:expected}),
    peerContribution("b",{allowedValues:[allowed]}),
  ],minimum=5+Math.floor(random()*20),maximum=Math.floor(random()*5),numeric=[
    peerContribution("a",{minimum}),
    peerContribution("b",{maximum}),
  ],cardinality=[
    peerContribution("a",{minItems:minimum}),
    peerContribution("b",{maxItems:maximum}),
  ],policy=[
    peerContribution("a",{},true),
    peerContribution("b",{},false),
  ];
  for(const incompatible of [crossed,crossedSwapped,numeric,cardinality,policy]){
    const result=compilePeers(incompatible),permuted=compilePeers([...incompatible].reverse());
    assert.equal(result.status,"blocked","generated incompatible peer facets never acquire stable-ID precedence");
    assert.deepEqual(permuted.conflicts,result.conflicts,"generated peer conflict evidence is permutation-independent");
  }
  const expectation=`same-${iteration}`,enforcementA=peerContribution("a",{expectedValue:expectation,enforcement:"invariant"}),enforcementB=peerContribution("b",{expectedValue:expectation,enforcement:"overridable"}),enforcementForward=compilePeers([enforcementA,enforcementB]),enforcementOwnershipSwapped=compilePeers([peerContribution("a",{expectedValue:expectation,enforcement:"overridable"}),peerContribution("b",{expectedValue:expectation,enforcement:"invariant"})]);
  for(const result of [enforcementForward,enforcementOwnershipSwapped]){
    assert.equal(result.status,"ready");
    assert.equal(result.properties["/generated"].expectedValue,expectation);
    assert.equal(result.properties["/generated"].enforcement,"invariant");
    assert.deepEqual(result.properties["/generated"].expectedContributors,[`a ${iteration}`,`b ${iteration}`],"generated peer expectation provenance includes every owner");
  }
  const identityFacets=[
    [peerContribution("a",{expectedValue:expectation,definitionId:`definition:a:${iteration}`}),peerContribution("b",{expectedValue:expectation,definitionId:`definition:b:${iteration}`})],
    [peerContribution("a",{allowedValues:[expectation],allowedValueIds:[`value:a:${iteration}`]}),peerContribution("b",{allowedValues:[expectation],allowedValueIds:[`value:b:${iteration}`]})],
    [peerContribution("a",{type:"number"}),peerContribution("b",{expectedValue:"text"})],
    [peerContribution("a",{minimum:minimum}),peerContribution("b",{expectedValue:maximum})],
    [peerContribution("a",{presence:"forbidden"}),peerContribution("b",{expectedValue:expectation})],
  ];
  for(const owned of identityFacets){
    const forward=compilePeers(owned),swappedOwnership=compilePeers([
      {...owned[0],constraints:structuredClone(owned[1].constraints)},
      {...owned[1],constraints:structuredClone(owned[0].constraints)},
    ]);
    assert.equal(forward.status,"blocked");
    assert.equal(swappedOwnership.status,"blocked","generated facet ownership permutation cannot create a peer winner");
  }
  const expectationValue=`same-${iteration}`,generatedCondition={kind:"predicate",propertyId:"/generated",operator:"Equals",value:expectationValue},rule=(id,outcome)=>({id:`rule:${id}:${iteration}`,name:`Rule ${id} ${iteration}`,...outcome}),reusableId=`reusable:${iteration}`,conditionalPresence=[peerContribution("a",{type:"string"}),peerContribution("b",{presence:"required",condition:generatedCondition})];
  for(const generated of [conditionalPresence,[...conditionalPresence].reverse()]){
    const compiled=compilePeers(generated),ordinary=resolveConditionalLayeredSchema(compiled,{}),matching=resolveConditionalLayeredSchema(compiled,{generated:expectationValue});
    assert.equal(compiled.status,"ready","generated unconditional type and conditional presence peers remain compatible");
    assert.equal(ordinary.properties["/generated"].presence,undefined);
    assert.equal(matching.properties["/generated"].presence,"required");
  }
  const selfConditional=compilePeers([peerContribution("self",{presence:"required",condition:generatedCondition,rules:[rule("self-pattern",{kind:"pattern",pattern:"^same"})]})]);
  assert.equal(selfConditional.status,"ready","generated conditional and ordinary facets owned by one Profile do not self-conflict");
  const ruleFacets=[
    [peerContribution("a",{rules:[rule("a",{kind:"value",expectedValue:`a-${iteration}`})]}),peerContribution("b",{rules:[rule("b",{kind:"value",expectedValue:`b-${iteration}`})]})],
    [peerContribution("a",{rules:[rule("a",{kind:"presence",presence:"required"})]}),peerContribution("b",{rules:[rule("b",{kind:"presence",presence:"forbidden"})]})],
    [peerContribution("a",{expectedValue:`a-${iteration}`}),peerContribution("b",{rules:[rule("b",{kind:"value",expectedValue:`b-${iteration}`})]})],
    [peerContribution("a",{minimum:minimum}),peerContribution("b",{rules:[rule("b",{kind:"range",maximum})]})],
    [peerContribution("a",{minItems:minimum}),peerContribution("b",{rules:[rule("b",{kind:"cardinality",maxItems:maximum})]})],
    [peerContribution("a",{expectedValue:`a-${iteration}`}),peerContribution("b",{rules:[rule("use",{kind:"reusable",reusableRuleId:reusableId})],reusableRules:[rule("reusable",{id:reusableId,kind:"value",expectedValue:`b-${iteration}`})]})],
    [peerContribution("a",{itemSchema:{id:`items:${iteration}`,allowedValues:[`a-${iteration}`]}}),peerContribution("b",{expectedValue:[`b-${iteration}`]})],
    [peerContribution("a",{itemSchema:{id:`items:${iteration}`,items:{id:`nested:${iteration}`,allowedValues:[`a-${iteration}`]}}}),peerContribution("b",{expectedValue:[[`b-${iteration}`]]})],
  ];
  for(const generated of ruleFacets){
    const forward=compilePeers(generated),reverse=compilePeers([...generated].reverse());
    assert.equal(forward.status,"blocked","generated condition, rule, reusable, and recursive item facets cannot create silent peer precedence");
    assert.deepEqual(reverse.conflicts,forward.conflicts,"generated rule-algebra evidence is peer-order independent");
  }
  const always={kind:"all",children:[]},conditionalRulePeers=[
    peerContribution("a",{rules:[rule("conditional-a",{kind:"value",expectedValue:`a-${iteration}`,condition:always})]}),
    peerContribution("b",{rules:[rule("conditional-b",{kind:"value",expectedValue:`b-${iteration}`,condition:always})]}),
  ],conditionalCompiled=compilePeers(conditionalRulePeers),conditionalResolved=resolveConditionalLayeredSchema(conditionalCompiled,{});
  assert.equal(conditionalCompiled.status,"ready","conditional peer rule outcomes remain deferred until their condition is evaluated");
  assert.equal(conditionalResolved.status,"blocked","simultaneously matching generated conditional peer rules block without precedence");
  const staticConditional=compilePeers([
    peerContribution("a",{expectedValue:`static-${iteration}`,enforcement:"invariant"}),
    peerContribution("b",{rules:[rule("conditional-static",{kind:"value",expectedValue:`conditional-${iteration}`,condition:always})]}),
  ]),staticConditionalResolved=resolveConditionalLayeredSchema(staticConditional,{});
  assert.equal(staticConditional.status,"ready");
  assert.equal(staticConditionalResolved.status,"blocked","generated matching conditional outcomes cannot replace static peer values");
  assert.equal(staticConditionalResolved.properties["/generated"].expectedValue,`static-${iteration}`);
  assert.equal(staticConditionalResolved.properties["/generated"].expectedContributor,`a ${iteration}`,"generated blocked resolution retains static ownership");
  const recomposedCases=[
    [{allowedValues:[`a-${iteration}`,`b-${iteration}`]},{kind:"allowed-values",allowedValues:[`b-${iteration}`,`c-${iteration}`]},{allowedValues:[`b-${iteration}`]}],
    [{expectedValue:`b-${iteration}`},{kind:"allowed-values",allowedValues:[`b-${iteration}`,`c-${iteration}`]},{expectedValue:`b-${iteration}`,expectedContributor:`a ${iteration}`}],
    [{minimum:minimum},{kind:"range",minimum:maximum},{minimum}],
    [{maximum:minimum},{kind:"range",maximum:minimum+10},{maximum:minimum}],
    [{minItems:minimum},{kind:"cardinality",minItems:maximum},{minItems:minimum}],
    [{patterns:[`^a-${iteration}`]},{kind:"pattern",pattern:`b-${iteration}$`},{patterns:[`^a-${iteration}`,`b-${iteration}$`]}],
  ];
  for(const [staticFacet,conditionalFacet,expectedFacets] of recomposedCases){
    const generated=[
      peerContribution("a",staticFacet),
      peerContribution("b",{rules:[rule("recompose",{...conditionalFacet,condition:always})]}),
    ];
    for(const order of [generated,[...generated].reverse()]){
      const resolved=resolveConditionalLayeredSchema(compilePeers(order),{});
      assert.equal(resolved.status,"ready");
      for(const [field,value] of Object.entries(expectedFacets))assert.deepEqual(resolved.properties["/generated"][field],value,"generated matching peer facets are recomposed without weakening or widening");
    }
  }
  const operatorRule=(id,operator,expectedValue)=>rule(id,{kind:"value",operator,expectedValue}),operatorPairs=[
    [operatorRule("equals-a","Equals",`a-${iteration}`),operatorRule("equals-b","Equals",`b-${iteration}`)],
    [operatorRule("set-a","Is one of",[`a-${iteration}`,`b-${iteration}`]),operatorRule("set-b","Is one of",[`c-${iteration}`])],
    [operatorRule("prefix-a","Starts with",`left-${iteration}`),operatorRule("prefix-b","Starts with",`right-${iteration}`)],
    [operatorRule("suffix-a","Ends with",`.left-${iteration}`),operatorRule("suffix-b","Ends with",`.right-${iteration}`)],
    [operatorRule("numeric-min","Greater than",minimum),operatorRule("numeric-max","At most",maximum)],
    [operatorRule("equals","Equals",`a-${iteration}`),operatorRule("not-equals","Does not equal",`a-${iteration}`)],
    [operatorRule("prefix","Starts with",`a-${iteration}`),operatorRule("not-prefix","Does not start with",`a-${iteration}`)],
    [operatorRule("suffix","Ends with",`a-${iteration}`),operatorRule("not-suffix","Does not end with",`a-${iteration}`)],
    [operatorRule("includes","Includes",`a-${iteration}`),operatorRule("not-includes","Does not include",`a-${iteration}`)],
  ];
  for(const operators of operatorPairs){
    const generated=[peerContribution("a",{rules:[operators[0]]}),peerContribution("b",{rules:[operators[1]]})],forward=compilePeers(generated),reverse=compilePeers([...generated].reverse());
    assert.equal(forward.status,"blocked","generated incompatible Value operators have no peer winner");
    assert.deepEqual(reverse.conflicts,forward.conflicts,"generated Value-operator conflicts are peer-order independent");
  }
  const compatibleOperators=[
    [operatorRule("prefix-a","Starts with",`order-${iteration}`),operatorRule("prefix-b","Starts with",`order-${iteration}-detail`)],
    [operatorRule("suffix-a","Ends with",`${iteration}`),operatorRule("suffix-b","Ends with",`-${iteration}`)],
    [operatorRule("numeric-min","At least",maximum),operatorRule("numeric-max","Less than",minimum+10)],
    [operatorRule("equals","Equals",`a-${iteration}`),operatorRule("not-equals","Does not equal",`b-${iteration}`)],
    [operatorRule("prefix","Starts with",`a-${iteration}`),operatorRule("not-prefix","Does not start with",`a-${iteration}-excluded`)],
    [operatorRule("suffix","Ends with",`a-${iteration}`),operatorRule("not-suffix","Does not end with",`excluded-a-${iteration}`)],
    [operatorRule("includes","Includes",`a-${iteration}`),operatorRule("not-includes","Does not include",`b-${iteration}`)],
  ];
  for(const operators of compatibleOperators)assert.equal(compilePeers([peerContribution("a",{rules:[operators[0]]}),peerContribution("b",{rules:[operators[1]]})]).status,"ready","generated compatible Value conjunctions remain ready");
  const common=peers.find(({id})=>id===commonId);
  assert.equal(peers.filter(({id})=>id===commonId).length,1,"fan-out deduplicates a repeated stable profile identity");
  assert.equal(common.inheritanceRoutes.length,3,"fan-out retains the direct route and every participating group route");
  const previewed=layeredContributorsForPath(fanState,pagePath,{audience:"other"}),previewCommon=previewed.find(({id})=>id===commonId);
  assert.equal(previewed.some(({id})=>id===rightId),false,"preview exclusion removes a profile with no remaining route");
  assert.equal(previewCommon.inheritanceRoutes.length,2,"preview exclusion conserves every surviving route");
  const frame=fanState.project.documentationFlowGraphs[flowId].pageFrames[0],framePath=layeredContributorPath(fanState,frame,"Flow Page-instance",flowId);
  assert.deepEqual(framePath.pageGroupIds,[leftGroupId,rightGroupId],"downstream Page instances retain complete ordered membership independently of placement");
  assert.ok(layeredContributorsForPath(fanState,framePath).some(({id})=>id===rightId),"downstream compilation receives profiles from non-placement memberships");
}

assert.deepEqual(
  {nestedRequiredConserved,eventTargetsIsolated,definedFieldsPolicyConserved},
  {nestedRequiredConserved:true,eventTargetsIsolated:true,definedFieldsPolicyConserved:true},
  "project-plan compilation conserves nested presence, event-specific targets, and the most-specific defined-fields policy",
);

console.log("data-layer layered schema property tests passed");
