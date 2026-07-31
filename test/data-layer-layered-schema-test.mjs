import assert from "node:assert/strict";
import {
  compileLayeredSchema,
  resolveConditionalLayeredSchema,
  resolveLayeredTarget,
  validateLayeredObservation,
  exportLayeredSchema,
} from "../dist/data-layer-layered-schema.js";
import {appendSharedProfileConstraint,canonicalLayerEditorSurface,compareLayeredRevisions,composeStructuredRules,effectivePropertySummary,layeredEventRole} from "../dist/data-layer-layered-schema-ui.js";
import {assignmentContributorTargets,compileAssignmentContributorTarget,flowPageFrameContributor,layeredContributionDetails,layeredContributorPath,layeredContributorsForPath} from "../dist/data-layer-layered-schema-project.js";
import {canonicalConstraints,createCanonicalSchema} from "../dist/data-layer-canonical-schema.js";
import {createSpecificationProject,transactProject} from "../dist/data-layer-specification-project.js";
import {compileSpecificationProject,createCanonicalProjectEnvelope,evaluateSpecificationObservation} from "../dist/data-layer-specification-engine.js";
import {documentPageGroupStructure,evaluatePageGroupFixture,pageGroupStructuralSchema} from "../dist/data-layer-page-group-structural-authoring.js";
import {composedSchemaWorkspace} from "../dist/data-layer-composed-schema-workspace.js";
import {flowDocumentationSnapshotFromState} from "../dist/data-layer-flow-table-documentation-export-ui.js";

const contribution=(id,name,scope,constraints)=>({id,name,scope,constraints});
const legacyRoleState=createSpecificationProject({name:"Record-scoped transaction",site:"shop.example",id:(kind)=>`${kind}:record-scope`});legacyRoleState.project.collections.events=[{id:"event:legacy-role",name:"Legacy",eventName:"legacy",role:"interaction"}];const recordScoped=transactProject(legacyRoleState,"Update an unrelated graph",(project)=>({...project,documentationFlowGraphs:{}}));assert.equal(recordScoped.project.collections.events[0].role,"interaction","an unrelated transaction cannot perform an implicit Event migration");
const base=contribution("profile:sitewide","Sitewide","Shared Profile",[
  {path:"/funnel_step",type:"string",allowedValues:["1","2","3a","3b"],presence:"optional",enforcement:"invariant"},
]);
const checkout=contribution("group:checkout","Checkout","Page Group",[
  {path:"/funnel_step",presence:"required",enforcement:"invariant",target:"all"},
  {path:"/funnel_name",type:"string",expectedValue:"checkout",enforcement:"invariant",target:"all"},
]);
const shipping=contribution("page:shipping","Shipping","Page",[
  {path:"/funnel_step",expectedValue:"3a",enforcement:"overridable",target:"event:purchase"},
]);
const alternative=contribution("frame:alternative","Alternative shipping","Flow Page-instance",[
  {path:"/funnel_step",expectedValue:"3b",enforcement:"overridable",target:"event:purchase"},
]);
const occurrence=contribution("occurrence:purchase","Alternative shipping Purchase","Event-occurrence",[
  {path:"/order_id",type:"string",presence:"required",enforcement:"invariant",target:"occurrence:purchase"},
]);

const ready=compileLayeredSchema([base,checkout,shipping,alternative,occurrence],{eventId:"event:purchase",eventRole:"interaction",occurrenceId:"occurrence:purchase"});
assert.equal(ready.status,"ready");
assert.equal(ready.properties["/funnel_step"].allowedValues,undefined,"a more-specific expected value replaces the inherited allowed-value facet");
assert.equal(ready.properties["/funnel_step"].presence,"required");
assert.equal(ready.properties["/funnel_step"].expectedValue,"3b");
assert.deepEqual(ready.properties["/funnel_step"].superseded.map(({contributorName})=>contributorName),["Shipping"]);
assert.deepEqual(ready.provenance.map(({scope})=>scope),["Shared Profile","Page Group","Page","Flow Page-instance","Event-occurrence"]);
assert.equal(ready.properties["/order_id"].presence,"required");
const closed=compileLayeredSchema([{...base,onlyDefinedFields:true}],{eventId:"event:purchase",eventRole:"interaction"});
assert.equal(closed.onlyDefinedFields,true,"the effective closed-field policy is inherited with the contributor chain");
assert.deepEqual(validateLayeredObservation({targetId:"closed",targetName:"Closed",revision:1,compiled:closed},{funnel_step:"2",debug:true}).issues.map(({path,code})=>({path,code})),[{path:"/debug",code:"UNDECLARED_PROPERTY"}]);
const reopened=compileLayeredSchema([{...base,onlyDefinedFields:true},{...shipping,onlyDefinedFields:false}],{eventId:"event:purchase",eventRole:"interaction"});
assert.equal(validateLayeredObservation({targetId:"open",targetName:"Open",revision:1,compiled:reopened},{debug:true}).issues.some(({code})=>code==="UNDECLARED_PROPERTY"),false,"a more-specific disabled policy permits an otherwise undeclared field");

const compilePair=(baseConstraint,specificConstraint)=>compileLayeredSchema([
  contribution("base","Sitewide","Shared Profile",[{path:"/value",...baseConstraint}]),
  contribution("specific","Shipping","Page",[{path:"/value",...specificConstraint}]),
],{eventId:"event:purchase",eventRole:"interaction"});
assert.match(compilePair({type:"string"},{type:"number"}).conflicts[0].message,/type cannot change/);
assert.deepEqual(compilePair({allowedValues:["3a","3b"]},{allowedValues:["3b"]}).properties["/value"].allowedValues,["3b"]);
assert.match(compilePair({allowedValues:["3a","3b"]},{allowedValues:["4"]}).conflicts[0].message,/outside the base allowed universe/);
assert.match(compilePair({presence:"required"},{presence:"optional"}).conflicts[0].message,/required cannot be silently relaxed/);
assert.match(compilePair({presence:"forbidden"},{presence:"permitted"}).conflicts[0].message,/forbidden property cannot be re-enabled/);
assert.deepEqual(compilePair({patterns:["^[a-z]+$"]},{patterns:["shipping$"]}).properties["/value"].patterns,["^[a-z]+$","shipping$"]);
assert.equal(compilePair({rules:[{condition:"base"}]},{rules:[{condition:"specific"}]}).properties["/value"].rules.length,2);
const bounded=compilePair({minimum:0,maximum:10,minItems:1,maxItems:8,reusableRules:[{id:"rule:base"}]},{minimum:2,maximum:7,minItems:3,maxItems:5,reusableRules:[{id:"rule:specific"}]}).properties["/value"];
assert.deepEqual({minimum:bounded.minimum,maximum:bounded.maximum,minItems:bounded.minItems,maxItems:bounded.maxItems},{minimum:2,maximum:7,minItems:3,maxItems:5});
assert.deepEqual(bounded.reusableRules,[{id:"rule:base"},{id:"rule:specific"}]);

const invariant=compileLayeredSchema([base,checkout,{...shipping,constraints:[{...shipping.constraints[0],enforcement:"invariant"}]},alternative],{eventId:"event:purchase",eventRole:"interaction"});
assert.equal(invariant.status,"blocked");
assert.equal(invariant.conflicts[0].path,"/funnel_step");
assert.deepEqual(invariant.conflicts[0].contributors,["Shipping","Alternative shipping"]);

const parallel=compileLayeredSchema([
  contribution("page:article","Article","Page",[{path:"/consent_state",definitionId:"definition:page-consent",expectedValue:"granted",enforcement:"invariant"}]),
  contribution("event:opened","Article Opened","Event",[{path:"/consent_state",definitionId:"definition:event-consent",expectedValue:"denied",enforcement:"invariant"}]),
],{eventId:"event:opened",eventRole:"interaction",occurrenceId:"occurrence:summer"});
assert.equal(parallel.status,"blocked");
assert.match(parallel.conflicts[0].message,/parallel Page and Event branches/);
assert.equal(parallel.properties["/consent_state"],undefined,"an unresolved parallel conflict must not silently choose a branch");
const resolvedParallel=compileLayeredSchema([
  contribution("event:opened","Article Opened","Event",[{path:"/consent_state",definitionId:"definition:event-consent",expectedValue:"denied",enforcement:"invariant"}]),
  contribution("page:article","Article","Page",[{path:"/consent_state",definitionId:"definition:page-consent",expectedValue:"granted",enforcement:"invariant"}]),
  contribution("occurrence:summer","Summer article Article Opened","Event-occurrence",[{path:"/consent_state",expectedValue:"granted",overrideReferences:["definition:page-consent","definition:event-consent"]}]),
],{eventId:"event:opened",eventRole:"interaction",occurrenceId:"occurrence:summer"});
assert.equal(resolvedParallel.status,"ready");
assert.equal(resolvedParallel.properties["/consent_state"].expectedValue,"granted");
assert.deepEqual(resolvedParallel.properties["/consent_state"].overrideReferences,["definition:page-consent","definition:event-consent"]);

const peerProfiles=[
  {...contribution("profile:audience-a","Audience A","Shared Profile",[{path:"/tier",type:"string",expectedValue:"a"}]),peerGroup:"shared-profiles"},
  {...contribution("profile:audience-b","Audience B","Shared Profile",[{path:"/tier",type:"string",expectedValue:"b"}]),peerGroup:"shared-profiles"},
];
for(const peers of [peerProfiles,[...peerProfiles].reverse()]){
  const peerConflict=compileLayeredSchema(peers,{eventId:"pageview",eventRole:"context"});
  assert.equal(peerConflict.status,"blocked","incompatible Shared Profile peers block in every list order");
  assert.match(peerConflict.conflicts[0].message,/parallel Shared Profile peers/);
  assert.equal(peerConflict.properties["/tier"],undefined,"a peer conflict has no list-order winner");
}
const peer=(id,constraint,policy)=>({...contribution(`profile:${id}`,id,"Shared Profile",[{path:"/value",...constraint}]),peerGroup:"shared-profiles",...(policy===undefined?{}:{onlyDefinedFields:policy})});
for(const contributors of [
  [peer("a",{allowedValues:["a"]}),peer("b",{expectedValue:"b"})],
  [peer("a",{expectedValue:"b"}),peer("b",{allowedValues:["a"]})],
  [peer("a",{minimum:10}),peer("b",{maximum:5})],
  [peer("a",{maximum:5}),peer("b",{minimum:10})],
  [peer("a",{minItems:4}),peer("b",{maxItems:2})],
  [peer("a",{maxItems:2}),peer("b",{minItems:4})],
  [peer("a",{},true),peer("b",{},false)],
  [peer("a",{},false),peer("b",{},true)],
]){
  const peerConflict=compileLayeredSchema(contributors,{eventId:"pageview",eventRole:"context"});
  assert.equal(peerConflict.status,"blocked","cross-facet, crossed-bound, and policy-incompatible peers block without stable-ID precedence");
  assert.equal(peerConflict.properties["/value"],undefined);
}
const aggregatePeerConflict=compileLayeredSchema([
  peer("a",{allowedValues:["a","b"]}),
  peer("b",{allowedValues:["b","c"]}),
  peer("c",{allowedValues:["a","c"]}),
],{eventId:"pageview",eventRole:"context"});
assert.equal(aggregatePeerConflict.status,"blocked","an empty aggregate peer intersection blocks even when every pair overlaps");
const policyPeerConflict=compileLayeredSchema([peer("a",{},true),peer("b",{},false)],{eventId:"pageview",eventRole:"context"});
assert.equal(policyPeerConflict.onlyDefinedFields,undefined,"a blocked peer policy has no stable-ID-selected effective value");
for(const contributors of [
  [peer("a",{allowedValues:["a","b"]}),peer("b",{expectedValue:"a"})],
  [peer("a",{expectedValue:"a"}),peer("b",{allowedValues:["a","b"]})],
]){
  const compatiblePeer=compileLayeredSchema(contributors,{eventId:"pageview",eventRole:"context"});
  assert.equal(compatiblePeer.status,"ready");
  assert.equal(compatiblePeer.properties["/value"].expectedValue,"a","a compatible peer expectation narrows allowed values independently of stable identity");
  assert.equal(compatiblePeer.properties["/value"].allowedValues,undefined);
}
for(const contributors of [
  [peer("a",{expectedValue:"same",enforcement:"invariant"}),peer("b",{expectedValue:"same",enforcement:"overridable"})],
  [peer("a",{expectedValue:"same",enforcement:"overridable"}),peer("b",{expectedValue:"same",enforcement:"invariant"})],
]){
  const compatiblePeer=compileLayeredSchema(contributors,{eventId:"pageview",eventRole:"context"});
  assert.equal(compatiblePeer.status,"ready");
  assert.equal(compatiblePeer.properties["/value"].enforcement,"invariant","peer enforcement composes to the stricter invariant without identity precedence");
  assert.deepEqual(compatiblePeer.properties["/value"].expectedContributors,["a","b"]);
  assert.equal(compatiblePeer.properties["/value"].expectedContributor,"a + b");
}
for(const contributors of [
  [peer("a",{expectedValue:"same",definitionId:"definition:a"}),peer("b",{expectedValue:"same",definitionId:"definition:b"})],
  [peer("a",{allowedValues:["same"],allowedValueIds:["value:a"]}),peer("b",{allowedValues:["same"],allowedValueIds:["value:b"]})],
  [peer("a",{allowedValues:["same"],allowedValueProvenance:[{id:"source:a",state:"inherited"}]}),peer("b",{allowedValues:["same"],allowedValueProvenance:[{id:"source:b",state:"inherited"}]})],
  [peer("a",{type:"number"}),peer("b",{expectedValue:"text"})],
  [peer("a",{minimum:10}),peer("b",{expectedValue:5})],
  [peer("a",{presence:"forbidden"}),peer("b",{expectedValue:"x"})],
  [peer("a",{patterns:["^a"]}),peer("b",{expectedValue:"b"})],
  [peer("a",{type:"array",minItems:2}),peer("b",{expectedValue:["one"]})],
]){
  for(const order of [contributors,[...contributors].reverse()]){
    const incompatiblePeer=compileLayeredSchema(order,{eventId:"pageview",eventRole:"context"});
    assert.equal(incompatiblePeer.status,"blocked","identity-bearing and expectation-incompatible peer facets block in every order");
    assert.equal(incompatiblePeer.properties["/value"],undefined);
  }
}
for(const contributors of [
  [peer("a",{overrideReferences:["definition:z"]}),peer("b",{overrideReferences:["definition:a"]})],
  [peer("a",{overrideReferences:["definition:a"]}),peer("b",{overrideReferences:["definition:z"]})],
]){
  const compatiblePeer=compileLayeredSchema(contributors,{eventId:"pageview",eventRole:"context"});
  assert.deepEqual(compatiblePeer.properties["/value"].overrideReferences,["definition:a","definition:z"],"peer reference sets combine canonically");
}
const falseCondition={kind:"predicate",propertyId:"/value",operator:"Equals",value:"yes"};
const conditionalPresencePeers=[
  peer("a",{type:"string"}),
  peer("b",{presence:"required",condition:falseCondition}),
];
for(const contributors of [conditionalPresencePeers,[...conditionalPresencePeers].reverse()]){
  const compiled=compileLayeredSchema(contributors,{eventId:"pageview",eventRole:"context"}),ordinary=resolveConditionalLayeredSchema(compiled,{}),matching=resolveConditionalLayeredSchema(compiled,{value:"yes"});
  assert.equal(compiled.status,"ready","an unconditional type and conditional presence are compatible peer facets");
  assert.equal(ordinary.status,"ready");
  assert.equal(ordinary.properties["/value"].type,"string");
  assert.notEqual(ordinary.properties["/value"].presence,"required");
  assert.equal(matching.properties["/value"].presence,"required");
}
const unconditionalRule=(id,outcome)=>({id,name:id,...outcome});
const selfConditional=compileLayeredSchema([peer("self",{presence:"required",condition:falseCondition,rules:[unconditionalRule("rule:self-pattern",{kind:"pattern",pattern:"^ok"})]})],{eventId:"pageview",eventRole:"context"});
assert.equal(selfConditional.status,"ready","conditional presence and an unconditional rule owned by one Profile do not self-conflict");
assert.equal(resolveConditionalLayeredSchema(selfConditional,{flag:false}).properties["/value"].patterns[0],"^ok");
const alwaysCondition={kind:"all",children:[]};
for(const [staticConstraint,conditionalOutcome,retained] of [
  [{expectedValue:"a",enforcement:"invariant"},{kind:"value",expectedValue:"b"},{expectedValue:"a",expectedContributor:"a"}],
  [{presence:"required"},{kind:"presence",presence:"forbidden"},{presence:"required"}],
]){
  const compiled=compileLayeredSchema([
    peer("a",staticConstraint),
    peer("b",{rules:[unconditionalRule("rule:conditional",{...conditionalOutcome,condition:alwaysCondition})]}),
  ],{eventId:"pageview",eventRole:"context"}),resolved=resolveConditionalLayeredSchema(compiled,{});
  assert.equal(compiled.status,"ready","conditional peer outcomes remain deferred until observation");
  assert.equal(resolved.status,"blocked","a matching conditional peer outcome cannot override an incompatible static peer facet");
  for(const [field,value] of Object.entries(retained))assert.deepEqual(resolved.properties["/value"][field],value,"blocked resolution preserves the static peer value and provenance");
}
const operatorRule=(id,operator,expectedValue)=>unconditionalRule(id,{kind:"value",operator,expectedValue});
for(const rules of [
  [operatorRule("equals:a","Equals","a"),operatorRule("equals:b","Equals","b")],
  [operatorRule("set:a","Is one of",["a","b"]),operatorRule("set:b","Is one of",["c","d"])],
  [operatorRule("prefix:a","Starts with","order-"),operatorRule("prefix:b","Starts with","payment-")],
  [operatorRule("suffix:a","Ends with",".com"),operatorRule("suffix:b","Ends with",".org")],
  [operatorRule("numeric:min","Greater than",10),operatorRule("numeric:max","At most",5)],
]){
  const contributors=[peer("a",{rules:[rules[0]]}),peer("b",{rules:[rules[1]]})];
  for(const order of [contributors,[...contributors].reverse()])assert.equal(compileLayeredSchema(order,{eventId:"pageview",eventRole:"context"}).status,"blocked","incompatible unconditional Value operators block without peer precedence");
}
for(const rules of [
  [operatorRule("prefix:a","Starts with","order"),operatorRule("prefix:b","Starts with","order-")],
  [operatorRule("suffix:a","Ends with","com"),operatorRule("suffix:b","Ends with",".com")],
  [operatorRule("numeric:min","At least",5),operatorRule("numeric:max","Less than",10)],
]){
  assert.equal(compileLayeredSchema([peer("a",{rules:[rules[0]]}),peer("b",{rules:[rules[1]]})],{eventId:"pageview",eventRole:"context"}).status,"ready","compatible Value operator conjunctions remain ready");
}
for(const contributors of [
  [
    peer("a",{rules:[unconditionalRule("rule:a",{kind:"value",expectedValue:"a"})]}),
    peer("b",{rules:[unconditionalRule("rule:b",{kind:"value",expectedValue:"b"})]}),
  ],
  [
    peer("a",{rules:[unconditionalRule("rule:a",{kind:"presence",presence:"required"})]}),
    peer("b",{rules:[unconditionalRule("rule:b",{kind:"presence",presence:"forbidden"})]}),
  ],
  [
    peer("a",{expectedValue:"a"}),
    peer("b",{rules:[unconditionalRule("rule:b",{kind:"value",expectedValue:"b"})]}),
  ],
  [
    peer("a",{allowedValues:["a"]}),
    peer("b",{rules:[unconditionalRule("rule:b",{kind:"allowed-values",allowedValues:["b"]})]}),
  ],
  [
    peer("a",{minimum:10}),
    peer("b",{rules:[unconditionalRule("rule:b",{kind:"range",maximum:5})]}),
  ],
  [
    peer("a",{minItems:4}),
    peer("b",{rules:[unconditionalRule("rule:b",{kind:"cardinality",maxItems:2})]}),
  ],
  [
    peer("a",{expectedValue:"a"}),
    peer("b",{rules:[unconditionalRule("rule:use-b",{kind:"reusable",reusableRuleId:"reusable:b"})],reusableRules:[unconditionalRule("reusable:b",{kind:"value",expectedValue:"b"})]}),
  ],
  [
    peer("a",{itemSchema:{id:"items",allowedValues:["a"]}}),
    peer("b",{expectedValue:["b"]}),
  ],
  [
    peer("a",{itemSchema:{id:"items",items:{id:"nested",allowedValues:["a"]}}}),
    peer("b",{expectedValue:[["b"]]}),
  ],
]){
  for(const order of [contributors,[...contributors].reverse()]){
    const compiled=compileLayeredSchema(order,{eventId:"pageview",eventRole:"context"}),resolved=resolveConditionalLayeredSchema(compiled,{});
    assert.equal(compiled.status,"blocked","unconditional peer rule and recursive item contradictions block before observation");
    assert.equal(resolved.status,"blocked");
    assert.equal(compiled.properties["/value"],undefined);
  }
}

const targeted=compileLayeredSchema([contribution("targets","Checkout","Page Group",[
  {path:"/all",target:"all"},{path:"/context",target:"context"},{path:"/interaction",target:"interaction"},{path:"/purchase",target:"event:purchase"},
])],{eventId:"event:purchase",eventRole:"interaction"});
assert.deepEqual(Object.keys(targeted.properties),["/all","/interaction","/purchase"]);
assert.ok(targeted.exclusions.some(({path,target})=>path==="/context"&&target==="context"));

const candidates=[
  {id:"target:alternative",name:"Alternative shipping Purchase",activation:"automatic",priority:10,applicability:[
    {name:"Shipping path",field:"pathname",operator:"matches",value:"/checkout/shipping"},
    {name:"Shipping page",field:"page_name",operator:"equals",value:"shipping"},
    {name:"Alternative variant",field:"checkout_variant",operator:"equals",value:"alternative"},
    {name:"Purchase Event",field:"eventName",operator:"equals",value:"Purchase"},
  ],compiled:ready},
  {id:"target:other",name:"Other Purchase",activation:"automatic",priority:10,applicability:[],compiled:ready},
];
const observation={pathname:"/checkout/shipping",page_name:"shipping",checkout_variant:"alternative",eventName:"Purchase",payload:{funnel_step:"3a",funnel_name:"checkout",order_id:"A"}};
assert.equal(resolveLayeredTarget(candidates.slice(0,1),observation).winner.id,"target:alternative");
assert.match(resolveLayeredTarget(candidates.slice(0,1),{...observation,page_name:"billing"}).candidates[0].reasons[0],/Shipping page/);
assert.deepEqual(resolveLayeredTarget(candidates,observation).ties,["target:alternative","target:other"]);
assert.equal(resolveLayeredTarget([{...candidates[0],priority:20},candidates[1]],observation).winner.id,"target:alternative");
assert.equal(resolveLayeredTarget([{...candidates[0],activation:"manual"}],observation,{manualTargetId:"target:alternative"}).selectionMode,"manual");
assert.equal(resolveLayeredTarget([{...candidates[0],activation:"documentation-only"}],observation).candidates.length,0);

const invalid=validateLayeredObservation({targetId:"target:alternative",targetName:"Alternative shipping Purchase",revision:7,compiled:ready},observation.payload);
assert.deepEqual(invalid.issues.find(({path})=>path==="/funnel_step"),{path:"/funnel_step",code:"EXPECTED_VALUE",severity:"error",expected:"3b",actual:"3a",provenance:"Alternative shipping"});
assert.equal(invalid.flowCompletionClaim,undefined);
assert.match(exportLayeredSchema({targetName:"Alternative shipping branch",pageName:"Shipping Page",eventName:"Purchase Event",activation:"documentation-only",compiled:ready}),/Documentation only — not automatically validated/);
const richValidation=validateLayeredObservation({targetId:"target:rich",targetName:"Rich",revision:9,compiled:compileLayeredSchema([contribution("profile:rich","Rich profile","Shared Profile",[
  {path:"/required",type:"string",presence:"required"},{path:"/forbidden",presence:"forbidden"},{path:"/choice",type:"string",allowedValues:["News","Guide"]},{path:"/pattern",type:"string",patterns:["^[A-Z]"]},{path:"/count",type:"number",minimum:1,maximum:3},{path:"/items",type:"array",minItems:1,maxItems:2},
])],{eventId:"event:rich",eventRole:"interaction"})},{forbidden:true,choice:"Other",pattern:"lower",count:8,items:[]});
assert.deepEqual(richValidation.issues.map(({path,code})=>({path,code})),[
  {path:"/required",code:"REQUIRED"},{path:"/forbidden",code:"FORBIDDEN"},{path:"/choice",code:"ALLOWED_VALUE"},{path:"/pattern",code:"PATTERN"},{path:"/count",code:"MAXIMUM"},{path:"/items",code:"MIN_ITEMS"},
]);
const richExport=exportLayeredSchema({targetName:"Rich target",pageName:"Article",eventName:"Article Opened",activation:"manual",compiled:richValidation.provenance&&compileLayeredSchema([contribution("profile:documented","Documented","Shared Profile",[{path:"/article_name",type:"string",presence:"required",allowedValues:["Summer sale"],condition:{kind:"predicate",propertyId:"property:type",operator:"Equals",value:"News"},documentation:"Opened article title",examples:["Summer sale"]}])],{eventId:"event:opened",eventRole:"interaction"})});
assert.match(richExport,/condition/);assert.match(richExport,/Opened article title/);assert.match(richExport,/Summer sale/);assert.match(richExport,/Shared Profile Documented/);

const canonicalOnly=createCanonicalSchema({id:"canonical:event:fresh",contributorId:"event:fresh",contributorName:"Fresh purchase"});
canonicalOnly.revision=1;canonicalOnly.rootIds=["definition:purchase-count","definition:order-id","definition:total"];
canonicalOnly.nodes={
  "definition:purchase-count":{id:"definition:purchase-count",name:"purchase_count",order:0,type:"integer",presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"Purchase count",description:"Number of purchases",comments:"",example:{method:"custom",value:1}},provenance:[{source:"created"}],overrideReferences:[]},
  "definition:order-id":{id:"definition:order-id",name:"order_id",order:1,type:"string",presence:{mode:"required-when",condition:{kind:"predicate",propertyId:"definition:purchase-count",operator:"At least",value:1}},allowedValues:[],rules:[{id:"rule:order",kind:"pattern",pattern:"^ORD-",severity:"error",message:"Use the order prefix"}],documentation:{displayText:"Order ID",description:"Canonical order identity",comments:"Runtime contract",example:{method:"custom",value:"ORD-1"}},provenance:[{source:"saved-schema",sourceId:"schema:purchase",revision:4}],overrideReferences:[]},
  "definition:total":{id:"definition:total",name:"total",order:2,type:"number",presence:{mode:"optional"},allowedValues:[],rules:[{id:"rule:total",kind:"range",minimum:10,maximum:20,severity:"error",message:"Expected order total"}],documentation:{displayText:"Total",description:"Canonical purchase total",comments:"",example:{method:"custom",value:15}},provenance:[{source:"created"}],overrideReferences:[]},
};
const canonicalOnlyState={project:{collections:{profiles:[],events:[{id:"event:fresh",name:"Fresh purchase",canonicalSchema:canonicalOnly}],pageGroups:[],pages:[],flows:[]},documentationFlowGraphs:{}}},canonicalOnlyContributors=layeredContributorsForPath(canonicalOnlyState,{eventId:"event:fresh"}),canonicalOnlyCompiled=compileLayeredSchema(canonicalOnlyContributors,{eventId:"event:fresh",eventRole:"interaction"});
assert.deepEqual(canonicalOnlyContributors.map(({id,constraints})=>({id,paths:constraints.map(({path})=>path)})),[{id:"event:fresh",paths:["/purchase_count","/order_id","/total"]}],"the compatibility contributor projection is derived from canonical storage alone");
assert.deepEqual({condition:canonicalOnlyCompiled.properties["/order_id"].condition,rules:canonicalOnlyCompiled.properties["/order_id"].rules,patterns:canonicalOnlyCompiled.properties["/order_id"].patterns,documentation:canonicalOnlyCompiled.properties["/order_id"].documentation,examples:canonicalOnlyCompiled.properties["/order_id"].examples,definitionId:canonicalOnlyCompiled.properties["/order_id"].definitionId,origins:canonicalOnlyCompiled.properties["/order_id"].origins},{condition:{kind:"predicate",propertyId:"definition:purchase-count",operator:"At least",value:1},rules:[{id:"rule:order",kind:"pattern",pattern:"^ORD-",severity:"error",message:"Use the order prefix"}],patterns:["^ORD-"],documentation:"Canonical order identity",examples:["ORD-1"],definitionId:"definition:order-id",origins:[{contributorId:"event:fresh",contributorName:"Fresh purchase",scope:"Event"}]},"compiler retains canonical conditions, structured rules, documentation, examples, stable identity, and contributor provenance");
const canonicalTarget={targetId:"target:fresh",targetName:"Fresh purchase",revision:canonicalOnly.revision,compiled:canonicalOnlyCompiled};
assert.deepEqual(validateLayeredObservation(canonicalTarget,{purchase_count:0}).issues,[],"a nonmatching canonical presence condition remains optional");
assert.deepEqual(validateLayeredObservation(canonicalTarget,{purchase_count:1}).issues.map(({path,code})=>({path,code})),[{path:"/order_id",code:"REQUIRED"}],"numeric canonical presence predicates drive runtime validation");
assert.deepEqual(validateLayeredObservation(canonicalTarget,{purchase_count:1,order_id:"bad",total:5}).issues.map(({path,code})=>({path,code})),[{path:"/order_id",code:"PATTERN"},{path:"/total",code:"MINIMUM"}],"canonical structured rules drive runtime validation");

const pageCanonical=createCanonicalSchema({id:"canonical:page",contributorId:"page:selected",contributorName:"Selected page"}),flowCanonical=createCanonicalSchema({id:"canonical:flow",contributorId:"flow:selected",contributorName:"Selected flow"}),frameCanonical=createCanonicalSchema({id:"canonical:frame",contributorId:"frame:selected",contributorName:"Selected page instance"});
const pathState={project:{collections:{
  profiles:[{id:"profile:selected",name:"Selected"},{id:"profile:unrelated",name:"Unrelated"}],
  events:[{id:"event:selected",name:"Selected event",profileId:"profile:selected"},{id:"event:unrelated",name:"Unrelated event"}],
  pageGroups:[{id:"group:selected",name:"Selected group",profileId:"profile:selected",pageIds:["page:selected"]},{id:"group:unrelated",name:"Unrelated group",pageIds:["page:unrelated"]}],
  pages:[{id:"page:selected",name:"Selected page",profileId:"profile:selected",pageGroupIds:["group:selected"],canonicalSchema:pageCanonical,contextEventBindings:[{id:"binding:selected",name:"Selected binding",eventId:"event:selected"}]},{id:"page:unrelated",name:"Unrelated page"}],
  flows:[{id:"flow:selected",name:"Selected flow",canonicalSchema:flowCanonical},{id:"flow:unrelated",name:"Unrelated flow"}],
},documentationFlowGraphs:{"flow:selected":{pageGroupIds:["group:selected"],pageFrames:[{id:"frame:selected",name:"Selected page instance",profileId:"profile:selected",pageId:"page:selected",pageGroupId:"group:selected",canonicalSchema:frameCanonical}],occurrences:[{id:"occurrence:selected",name:"Selected occurrence",profileId:"profile:selected",eventId:"event:selected",pageFrameId:"frame:selected",pageGroupId:"group:selected",pageId:"page:selected"},{id:"occurrence:sibling",name:"Sibling occurrence",eventId:"event:unrelated",pageGroupId:"group:selected",pageId:"page:selected"}]},"flow:unrelated":{occurrences:[{id:"occurrence:unrelated",name:"Unrelated occurrence",eventId:"event:unrelated",pageGroupId:"group:unrelated",pageId:"page:unrelated"}]}}}};
const selectedOccurrence=pathState.project.documentationFlowGraphs["flow:selected"].occurrences[0],selectedPath=layeredContributorPath(pathState,selectedOccurrence,"Event-occurrence","flow:selected"),selectedContributors=layeredContributorsForPath(pathState,selectedPath);
assert.deepEqual(selectedPath,{profileId:"profile:selected",eventId:"event:selected",pageGroupId:"group:selected",pageGroupIds:["group:selected"],pageId:"page:selected",flowId:"flow:selected",pageFrameId:"frame:selected",occurrenceId:"occurrence:selected"});
assert.deepEqual(selectedContributors.map(({id})=>id),["profile:selected","group:selected","page:selected","frame:selected","event:selected","occurrence:selected"]);
const selectedFrame=flowPageFrameContributor(pathState,"flow:selected","frame:selected");
assert.deepEqual(layeredContributorPath(pathState,selectedFrame,"Flow Page-instance","flow:selected"),{profileId:"profile:selected",pageGroupId:"group:selected",pageGroupIds:["group:selected"],pageId:"page:selected",flowId:"flow:selected",pageFrameId:"frame:selected"});
const inheritedFrameState=structuredClone(pathState);delete inheritedFrameState.project.documentationFlowGraphs["flow:selected"].pageFrames[0].profileId;
assert.equal(layeredContributorPath(inheritedFrameState,flowPageFrameContributor(inheritedFrameState,"flow:selected","frame:selected"),"Flow Page-instance","flow:selected").profileId,"profile:selected","a Flow Page instance inherits the selected Page's singular Shared Profile reference");
assert.deepEqual({id:selectedFrame.id,name:selectedFrame.name,canonicalSchemaId:selectedFrame.canonicalSchema.id},{id:"frame:selected",name:"Selected page instance",canonicalSchemaId:"canonical:frame"});
assert.notEqual(selectedFrame.canonicalSchema.id,pathState.project.collections.pages[0].canonicalSchema.id);
assert.notEqual(selectedFrame.canonicalSchema.id,pathState.project.collections.flows[0].canonicalSchema.id);
assert.deepEqual(assignmentContributorTargets(pathState).filter(({id})=>id.endsWith(":selected")).map(({id,kind})=>({id,kind})),[
  {id:"profile:selected",kind:"Shared Profile"},{id:"group:selected",kind:"Page Group"},{id:"page:selected",kind:"Page"},{id:"event:selected",kind:"Event"},{id:"frame:selected",kind:"Flow Page instance"},
]);
for(const [targetKind,targetId,expected] of [
  ["Shared Profile","profile:selected",["profile:selected"]],
  ["Page Group","group:selected",["profile:selected","group:selected"]],
  ["Page","page:selected",["profile:selected","group:selected","page:selected"]],
  ["Event","event:selected",["profile:selected","event:selected"]],
  ["Flow Page instance","frame:selected",["profile:selected","group:selected","page:selected","frame:selected"]],
]){
  const assignment={id:`assignment:${targetId}`,name:"Retail Purchase",targetKind,targetId},result=compileAssignmentContributorTarget(pathState,assignment,{eventId:"event:selected",eventRole:"interaction"});
  assert.deepEqual(result.contributors.map(({id})=>id),expected,`${targetKind} compiles its live inheritance`);assert.equal(result.compiled.status,"ready");assert.equal("schemaDraftId" in assignment,false);assert.equal("schemaId" in assignment,false);
}
assert.equal(canonicalLayerEditorSurface("pageGroups"),"Builder");assert.equal(canonicalLayerEditorSurface("pages"),"Builder");assert.equal(canonicalLayerEditorSurface("events"),"Builder");assert.equal(canonicalLayerEditorSurface("flows"),"Flow workspace");
assert.equal(layeredContributorPath(pathState,{id:"occurrence:context",name:"Context occurrence",pageGroupId:"group:selected",pageId:"page:selected",contextBindingId:"binding:selected"},"Event-occurrence","flow:selected").eventId,"event:selected");
assert.equal(layeredEventRole({id:"occurrence:context",name:"Context occurrence",contextBindingId:"binding:selected"}),"context");
assert.equal(effectivePropertySummary({type:"string",allowedValues:["3b"],patterns:["^[a-z]+$","shipping$"],rules:[{condition:"base"},{condition:"specific"}]}),'type string · allowed ["3b"] · patterns ["^[a-z]+$","shipping$"] · rules 2');

const profileDraft=createSpecificationProject({name:"Layered profile editor",site:"shop.example",id:(kind)=>`${kind}:layered-editor`});
profileDraft.project.collections.profiles.push({id:"profile:sitewide",name:"Sitewide",requirements:[],schemaConstraints:[{path:"/existing",type:"string"}]});
const editedProfileDraft=appendSharedProfileConstraint(profileDraft,"profile:sitewide",{path:"/nested/value",type:"number",presence:"required",documentation:"Nested value"});
assert.equal("schemaConstraints" in editedProfileDraft.project.collections.profiles[0],false);
assert.deepEqual(canonicalConstraints(editedProfileDraft.project.collections.profiles[0].canonicalSchema).map(({path,type,presence,documentation})=>({path,type,...(presence?{presence}:{}),...(documentation?{documentation}:{})})),[
  {path:"/existing",type:"string"},{path:"/nested",type:"object"},{path:"/nested/value",type:"number",presence:"required",documentation:"Nested value"},
]);
assert.equal(editedProfileDraft.project.collections.profiles[0].compiledTargetsStale,true);
assert.equal(editedProfileDraft.history.undo.at(-1).label,"Save canonical schema contribution for Sitewide");
assert.throws(()=>appendSharedProfileConstraint(profileDraft,"profile:missing",{path:"/value"}),/Shared Profile profile:missing is unavailable/);

const revisionProfile={
  id:"profile:revision",
  name:"Revision profile",
  sourceRevision:4,
  structuredSchema:{properties:{existing:{type:"string"},nested:{type:"object",properties:{value:{type:"number"}}}}},
  schemaConstraints:[{path:"/nested/value",minimum:1},{path:"/draft_only",presence:"required"}],
};
assert.deepEqual(compareLayeredRevisions(revisionProfile,"source","draft"),{
  fromLabel:"Source revision 4",
  toLabel:"Current draft",
  addedPaths:["/draft_only"],
  removedPaths:[],
  retainedPaths:["/existing","/nested","/nested/value"],
  constraintChanges:2,
});
assert.deepEqual(composeStructuredRules(
  [{kind:"advanced"}],
  [{id:"rule:advanced"}],
  {field:"country",operator:"equals",value:"NL",reusableRuleId:"rule:shipping"},
),{
  rules:[{kind:"advanced"},{field:"country",operator:"equals",value:"NL"}],
  reusableRules:[{id:"rule:advanced"},{id:"rule:shipping"}],
});

const detailState=structuredClone(pathState),detailOccurrence=detailState.project.documentationFlowGraphs["flow:selected"].occurrences[0];
detailState.project.collections.profiles[0].schemaConstraints=[{path:"/profile_value",target:"all",condition:{field:"country",equals:"NL"},enforcement:"invariant"}];
detailState.project.collections.events[0].schemaConstraints=[{path:"/event_value",target:"event:selected",enforcement:"overridable"}];
const detailRows=layeredContributionDetails(detailState,detailOccurrence,"Event-occurrence","flow:selected");
assert.deepEqual(detailRows.slice(0,2),[
  {contributorId:"profile:selected",contributorName:"Selected",scope:"Shared Profile",path:"/profile_value",target:"all",condition:'{"field":"country","equals":"NL"}',enforcement:"invariant",usedById:"occurrence:selected",usedByName:"Selected occurrence",usedByScope:"Event-occurrence"},
  {contributorId:"event:selected",contributorName:"Selected event",scope:"Event",path:"/event_value",target:"event:selected",condition:"Always",enforcement:"overridable",usedById:"occurrence:selected",usedByName:"Selected occurrence",usedByScope:"Event-occurrence"},
]);

const isolatedProject={
  id:"project:isolated",name:"Isolated targets",site:"example.test",environments:["Production"],namingConventions:{},publicationPolicy:{warningsBlock:false,fixturesRequired:false},releases:[],
  collections:{
    profiles:[{id:"profile:shared",name:"Shared target",requirements:[
      {path:"/nested/value",type:"string",required:true,target:"event:alpha"},
      {path:"/beta",type:"string",required:true,target:"event:beta"},
    ]}],
    pageGroups:[],pages:[],events:[
      {id:"event:alpha",name:"Alpha",sourceId:"history",eventName:"alpha"},
      {id:"event:beta",name:"Beta",sourceId:"history",eventName:"beta"},
    ],applicabilitySets:[],flows:[],fixtures:[],assignments:[
      {id:"assignment:alpha",name:"Alpha target",targetKind:"Shared Profile",targetId:"profile:shared",eventId:"event:alpha",priority:10},
      {id:"assignment:beta",name:"Beta target",targetKind:"Shared Profile",targetId:"profile:shared",eventId:"event:beta",priority:10},
    ],
  },
};
const isolatedEnvelope=createCanonicalProjectEnvelope(isolatedProject,"draft:isolated");
Object.defineProperty(isolatedEnvelope.project.collections,"schemaDrafts",{enumerable:false,get(){throw new Error("active compilation read schemaDrafts");}});
const isolatedCompilation=compileSpecificationProject(isolatedEnvelope);
assert.equal(isolatedCompilation.status,"compiled","active contributor-target compilation never reads legacy schemaDrafts");
assert.equal(new Set(isolatedCompilation.plan.assignments.map(({schemaKey})=>schemaKey)).size,2,"assignments sharing one contributor keep isolated effective schemas");
assert.deepEqual(
  evaluateSpecificationObservation(isolatedCompilation.plan,{sourceId:"history",eventName:"alpha",payload:{}}).issueDetails.map(({path,code})=>({path,code})),
  [{path:"/nested/value",code:"required"}],
  "a required nested leaf retains its exact path when its container is absent without leaking the other event target",
);
assert.deepEqual(evaluateSpecificationObservation(isolatedCompilation.plan,{sourceId:"history",eventName:"alpha",payload:{nested:{value:"present"}}}).issueDetails,[]);
assert.deepEqual(evaluateSpecificationObservation(isolatedCompilation.plan,{sourceId:"history",eventName:"beta",payload:{beta:"present"}}).issueDetails,[]);

const structuralState={project:{collections:{
  profiles:[],
  events:[],
  pageGroups:[
    {id:"group:checkout",name:"Checkout",schemaConstraints:[{path:"/funnel_name",type:"string",expectedValue:"checkout"}]},
    {id:"group:retail",name:"Retail Checkout",applicabilitySetId:"set:retail",schemaConstraints:[{path:"/funnel_step",type:"string",allowedValues:["3a"]},{path:"/retail",type:"boolean"}]},
    {id:"group:signed-in",name:"Signed-in Checkout",applicabilitySetId:"set:signed-in",schemaConstraints:[{path:"/account_id",type:"string"}]},
    {id:"group:trade",name:"Trade Checkout",applicabilitySetId:"set:trade",schemaConstraints:[{path:"/funnel_step",type:"string",allowedValues:["3b"]},{path:"/trade",type:"boolean"}]},
  ],
  pages:[{id:"page:cart",name:"Cart",pageGroupIds:["group:checkout","group:retail","group:signed-in","group:trade"],schemaConstraints:[{path:"/cart_id",type:"string"}]}],
  applicabilitySets:[
    {id:"set:retail",name:"Retail customers",condition:{kind:"predicate",field:"customer_type",operator:"equals",value:"retail"}},
    {id:"set:signed-in",name:"Signed-in visitors",condition:{kind:"predicate",field:"signed_in",operator:"equals",value:true}},
    {id:"set:trade",name:"Trade customers",condition:{kind:"predicate",field:"customer_type",operator:"equals",value:"trade"}},
  ],
  flows:[],
  fixtures:[
    {id:"fixture:retail",name:"Retail Cart example",pageId:"page:cart",payload:{customer_type:"retail",signed_in:true,funnel_name:"checkout",funnel_step:"3a"}},
    {id:"fixture:trade",name:"Trade Cart example",pageId:"page:cart",payload:{customer_type:"trade",funnel_name:"checkout",funnel_step:"3b"}},
  ],
  assignments:[],
},documentationFlowGraphs:{}}};
const structuralBefore=structuredClone(structuralState);
const structural=pageGroupStructuralSchema(structuralState,"page:cart");
assert.deepEqual(structural.memberships.map(({groupName,applicabilitySetName})=>[groupName,applicabilitySetName]),[
  ["Checkout","Always"],
  ["Retail Checkout","Retail customers"],
  ["Signed-in Checkout","Signed-in visitors"],
  ["Trade Checkout","Trade customers"],
],"Page authoring preserves every ordered membership and its named applicability without an observation");
assert.deepEqual(structural.applicabilityPreviews.map(({applicabilitySetName,checked})=>[applicabilitySetName,checked]),[
  ["Retail customers",true],
  ["Signed-in visitors",true],
  ["Trade customers",true],
],"every distinct referenced Applicability Set is independently checked by default");
assert.deepEqual(Object.keys(structural.compiled.properties).sort(),["/account_id","/cart_id","/funnel_name","/funnel_step","/retail","/trade"]);
assert.deepEqual(structural.compiled.properties["/funnel_step"].allowedValues,["3b"],"the later ordinary Page Group value wins");
assert.deepEqual(structural.compiled.properties["/funnel_step"].superseded.map(({contributorName,value})=>[contributorName,value]),[["Retail Checkout",["3a"]]],"the earlier ordinary value remains as superseded provenance");
const previewed=pageGroupStructuralSchema(structuralState,"page:cart",["set:signed-in","set:trade"]);
assert.deepEqual(previewed.includedMemberships.map(({groupName})=>groupName),["Checkout","Signed-in Checkout","Trade Checkout"]);
assert.deepEqual(previewed.excludedMemberships.map(({groupName})=>groupName),["Retail Checkout"]);
assert.equal("/retail" in previewed.compiled.properties,false);
assert.equal("/trade" in previewed.compiled.properties,true);
assert.deepEqual(structuralState,structuralBefore,"applicability preview never mutates project records");
const reordered=structuredClone(structuralState);
reordered.project.collections.pages[0].pageGroupIds=["group:checkout","group:trade","group:signed-in","group:retail"];
const reorderedStructure=pageGroupStructuralSchema(reordered,"page:cart");
assert.deepEqual(reorderedStructure.compiled.properties["/funnel_step"].allowedValues,["3a"]);
assert.deepEqual(reorderedStructure.compiled.properties["/funnel_step"].superseded.map(({contributorName,value})=>[contributorName,value]),[["Trade Checkout",["3b"]]]);
const invariantStructure=structuredClone(structuralState);
invariantStructure.project.collections.pageGroups[1].schemaConstraints[0].enforcement="invariant";
assert.match(pageGroupStructuralSchema(invariantStructure,"page:cart").compiled.conflicts.find(({path})=>path==="/funnel_step").message,/invariant allowed values cannot be replaced/);
const incompatibleStructure=structuredClone(structuralState);
incompatibleStructure.project.collections.pageGroups[3].schemaConstraints[0].type="number";
assert.match(pageGroupStructuralSchema(incompatibleStructure,"page:cart").compiled.conflicts.find(({path})=>path==="/funnel_step").message,/type cannot change/);
for(const [fixtureId,included,excluded] of [
  ["fixture:retail",["Checkout","Retail Checkout","Signed-in Checkout"],["Trade Checkout"]],
  ["fixture:trade",["Checkout","Trade Checkout"],["Retail Checkout","Signed-in Checkout"]],
]){
  const evaluated=evaluatePageGroupFixture(structuralState,fixtureId);
  assert.deepEqual(evaluated.includedStack,included);
  assert.deepEqual(evaluated.inactiveGroups,excluded);
  assert.equal(evaluated.compiled.status,"ready");
  assert.equal(evaluated.compiled.conflicts.some(({message})=>message.includes("ambiguous Page Group applicability")),false);
  assert.equal(evaluated.mode,"evaluated-example");
}
const structuralDocument=documentPageGroupStructure(structural);
assert.match(structuralDocument,/Complete Page specification: Cart/);
assert.match(structuralDocument,/Retail Checkout · Applicability Set Retail customers/);
assert.match(structuralDocument,/Signed-in Checkout · Applicability Set Signed-in visitors/);
assert.match(structuralDocument,/funnel_step.*Trade Checkout.*superseded Retail Checkout/s);
assert.doesNotMatch(structuralDocument,/Inactive/);
assert.match(documentPageGroupStructure(evaluatePageGroupFixture(structuralState,"fixture:retail")),/Evaluated example: Retail Cart example/);

const transitiveState={project:{collections:{
  profiles:[
    {id:"profile:commerce",name:"Commerce",schemaConstraints:[{path:"/currency",type:"string",presence:"required"}]},
    {id:"profile:experience",name:"Experience",schemaConstraints:[{path:"/locale",type:"string"}]},
    {id:"profile:customer",name:"Customer",schemaConstraints:[{path:"/customer_id",type:"string"}]},
  ],
  events:[],
  pageGroups:[
    {id:"group:checkout",name:"Checkout",profileIds:["profile:commerce","profile:experience"],schemaConstraints:[{path:"/funnel_name",type:"string"}]},
    {id:"group:retail",name:"Retail Checkout",profileIds:["profile:commerce","profile:customer"],applicabilitySetId:"set:retail",schemaConstraints:[{path:"/retail_only",type:"boolean"}]},
  ],
  pages:[{id:"page:cart",name:"Cart",eventName:"pageview",profileIds:["profile:commerce"],pageGroupIds:["group:checkout","group:retail"],schemaConstraints:[{path:"/page_name",type:"string"}]}],
  applicabilitySets:[{id:"set:retail",name:"Retail customers",condition:{kind:"predicate",field:"customer_type",operator:"equals",value:"retail"}}],
  flows:[{id:"flow:checkout",name:"Checkout Flow"}],
  fixtures:[{id:"fixture:retail-profile",name:"Retail profile example",pageId:"page:cart",payload:{customer_type:"retail",currency:"EUR"}}],
  assignments:[],
},documentationFlowGraphs:{"flow:checkout":{pageFrames:[{id:"frame:cart",name:"Cart instance",pageId:"page:cart",pageGroupId:"group:checkout",localSchemaContributions:[]}]}}}};
const checkoutEntity=transitiveState.project.collections.pageGroups[0],checkoutWorkspace=composedSchemaWorkspace(transitiveState,checkoutEntity,"Page Group"),allProfiles=pageGroupStructuralSchema(transitiveState,"page:cart"),currency=allProfiles.compiled.properties["/currency"];
assert.deepEqual(checkoutWorkspace.rows.map(({path})=>path),["/currency","/funnel_name","/locale"],"a Page Group workspace composes every referenced Shared Profile before its local schema");
assert.deepEqual(Object.keys(allProfiles.compiled.properties).sort(),["/currency","/customer_id","/funnel_name","/locale","/page_name","/retail_only"],"Page compilation carries complete Page Group effective schemas into the Page");
assert.equal(currency.origins.filter(({contributorId})=>contributorId==="profile:commerce").length,1,"stable Shared Profile identity contributes one effective value without a self-conflict");
assert.deepEqual(currency.origins.find(({contributorId})=>contributorId==="profile:commerce").inheritanceRoutes,["Commerce → Cart","Commerce → Checkout → Cart","Commerce → Retail Checkout → Cart"],"deduplicated provenance retains every direct and Page Group route");
const withoutRetail=pageGroupStructuralSchema(transitiveState,"page:cart",[]);
assert.equal("/customer_id" in withoutRetail.compiled.properties,false,"an unchecked group excludes a profile reachable only through that group");
assert.equal("/retail_only" in withoutRetail.compiled.properties,false,"an unchecked group excludes its local contribution");
assert.deepEqual(withoutRetail.compiled.properties["/currency"].origins[0].inheritanceRoutes,["Commerce → Cart","Commerce → Checkout → Cart"],"a profile reachable by remaining routes survives with only participating provenance");
const frame=transitiveState.project.documentationFlowGraphs["flow:checkout"].pageFrames[0],frameWorkspace=composedSchemaWorkspace(transitiveState,frame,"Flow Page-instance",undefined,"flow:checkout"),fixtureProfile=evaluatePageGroupFixture(transitiveState,"fixture:retail-profile"),profileDocument=documentPageGroupStructure(allProfiles),fixtureDocument=documentPageGroupStructure(fixtureProfile);
assert.ok(frameWorkspace.rows.some(({path,effective})=>path==="/currency"&&effective.origins.some(({inheritanceRoutes})=>inheritanceRoutes?.includes("Commerce → Checkout → Cart → Cart instance"))),"a Flow Page instance retains the complete downstream inheritance route");
assert.equal(fixtureProfile.validation.issues.some(({path})=>path==="/currency"),false,"Fixture validation consumes the inherited required Shared Profile property");
assert.match(profileDocument,/Commerce → Checkout → Cart/,"Page documentation preserves transitive Shared Profile provenance");
assert.match(fixtureDocument,/Commerce → Checkout → Cart/,"Fixture documentation preserves the same transitive Shared Profile provenance");
const flowSnapshot=flowDocumentationSnapshotFromState(transitiveState,"flow:checkout","2026-07-30T00:00:00.000Z"),flowContext=flowSnapshot.contexts.find(({id})=>id==="context:frame:frame:cart");
assert.ok(flowContext.compiled.properties["/customer_id"],"Flow documentation composes every Page membership, not only the frame placement lane");
assert.ok(flowContext.compiled.properties["/currency"].origins.some(({inheritanceRoutes})=>inheritanceRoutes?.includes("Commerce → Retail Checkout → Cart → Cart instance")),"Flow documentation preserves the complete downstream inheritance route");
const flowDeveloperExport=exportLayeredSchema({targetName:"Checkout Flow",pageName:"Cart",eventName:"pageview",activation:"manual",compiled:flowContext.compiled});
assert.match(flowDeveloperExport,/Commerce → Checkout → Cart → Cart instance/,"developer export preserves inheritance-route provenance");
const revisedTransitiveState=structuredClone(transitiveState),previousEffectiveRevision=flowContext.effectiveRevision;
revisedTransitiveState.project.collections.profiles.find(({id})=>id==="profile:customer").schemaConstraints.push({path:"/loyalty_tier",type:"string"});
const revisedFlowContext=flowDocumentationSnapshotFromState(revisedTransitiveState,"flow:checkout","2026-07-30T00:00:00.000Z").contexts.find(({id})=>id==="context:frame:frame:cart");
assert.notEqual(revisedFlowContext.effectiveRevision,previousEffectiveRevision,"changing a transitively inherited profile changes the documentation effective revision");

console.log("data-layer layered schema tests passed");
