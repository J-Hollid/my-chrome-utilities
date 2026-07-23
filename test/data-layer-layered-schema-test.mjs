import assert from "node:assert/strict";
import {
  compileLayeredSchema,
  resolveLayeredTarget,
  validateLayeredObservation,
  exportLayeredSchema,
} from "../dist/data-layer-layered-schema.js";
import {appendSharedProfileConstraint,canonicalLayerEditorSurface,compareLayeredRevisions,composeStructuredRules,effectivePropertySummary,layeredEventRole} from "../dist/data-layer-layered-schema-ui.js";
import {assignmentContributorTargets,compileAssignmentContributorTarget,flowPageFrameContributor,layeredContributionDetails,layeredContributorPath,layeredContributorsForPath} from "../dist/data-layer-layered-schema-project.js";
import {canonicalConstraints,createCanonicalSchema} from "../dist/data-layer-canonical-schema.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {compileSpecificationProject,createCanonicalProjectEnvelope,evaluateSpecificationObservation} from "../dist/data-layer-specification-engine.js";

const contribution=(id,name,scope,constraints)=>({id,name,scope,constraints});
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
assert.deepEqual(ready.properties["/funnel_step"].allowedValues,["1","2","3a","3b"]);
assert.equal(ready.properties["/funnel_step"].presence,"required");
assert.equal(ready.properties["/funnel_step"].expectedValue,"3b");
assert.deepEqual(ready.properties["/funnel_step"].superseded.map(({contributorName})=>contributorName),["Shipping"]);
assert.deepEqual(ready.provenance.map(({scope})=>scope),["Shared Profile","Page Group","Page","Flow Page-instance","Event-occurrence"]);
assert.equal(ready.properties["/order_id"].presence,"required");

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

console.log("data-layer layered schema tests passed");
