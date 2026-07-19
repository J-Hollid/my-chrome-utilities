import assert from "node:assert/strict";
import {
  compileLayeredSchema,
  resolveLayeredTarget,
  validateLayeredObservation,
  exportLayeredSchema,
} from "../dist/data-layer-layered-schema.js";
import {appendSharedProfileConstraint,effectivePropertySummary,layeredContributionDetails,layeredContributorPath,layeredContributorsForPath,layeredEventRole} from "../dist/data-layer-layered-schema-ui.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";

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

const pathState={project:{collections:{
  profiles:[{id:"profile:selected",name:"Selected"},{id:"profile:unrelated",name:"Unrelated"}],
  events:[{id:"event:selected",name:"Selected event"},{id:"event:unrelated",name:"Unrelated event"}],
  pageGroups:[{id:"group:selected",name:"Selected group",pageIds:["page:selected"]},{id:"group:unrelated",name:"Unrelated group",pageIds:["page:unrelated"]}],
  pages:[{id:"page:selected",name:"Selected page",contextEventBindings:[{id:"binding:selected",name:"Selected binding",eventId:"event:selected"}]},{id:"page:unrelated",name:"Unrelated page"}],
  flows:[{id:"flow:selected",name:"Selected flow"},{id:"flow:unrelated",name:"Unrelated flow"}],
},documentationFlowGraphs:{"flow:selected":{pageGroupIds:["group:selected"],occurrences:[{id:"occurrence:selected",name:"Selected occurrence",profileId:"profile:selected",eventId:"event:selected",pageGroupId:"group:selected",pageId:"page:selected"},{id:"occurrence:sibling",name:"Sibling occurrence",eventId:"event:unrelated",pageGroupId:"group:selected",pageId:"page:selected"}]},"flow:unrelated":{occurrences:[{id:"occurrence:unrelated",name:"Unrelated occurrence",eventId:"event:unrelated",pageGroupId:"group:unrelated",pageId:"page:unrelated"}]}}}};
const selectedOccurrence=pathState.project.documentationFlowGraphs["flow:selected"].occurrences[0],selectedPath=layeredContributorPath(pathState,selectedOccurrence,"Event-occurrence","flow:selected"),selectedContributors=layeredContributorsForPath(pathState,selectedPath);
assert.deepEqual(selectedPath,{profileId:"profile:selected",eventId:"event:selected",pageGroupId:"group:selected",pageId:"page:selected",flowId:"flow:selected",occurrenceId:"occurrence:selected"});
assert.deepEqual(selectedContributors.map(({id})=>id),["profile:selected","event:selected","group:selected","page:selected","flow:selected","occurrence:selected"]);
assert.deepEqual(layeredContributorPath(pathState,pathState.project.collections.flows[0],"Flow Page-instance"),{pageGroupId:"group:selected",pageId:"page:selected",flowId:"flow:selected"});
assert.equal(layeredContributorPath(pathState,{id:"occurrence:context",name:"Context occurrence",pageGroupId:"group:selected",pageId:"page:selected",contextBindingId:"binding:selected"},"Event-occurrence","flow:selected").eventId,"event:selected");
assert.equal(layeredEventRole({id:"occurrence:context",name:"Context occurrence",contextBindingId:"binding:selected"}),"context");
assert.equal(effectivePropertySummary({type:"string",allowedValues:["3b"],patterns:["^[a-z]+$","shipping$"],rules:[{condition:"base"},{condition:"specific"}]}),'type string · allowed ["3b"] · patterns ["^[a-z]+$","shipping$"] · rules 2');

const profileDraft=createSpecificationProject({name:"Layered profile editor",site:"shop.example",id:(kind)=>`${kind}:layered-editor`});
profileDraft.project.collections.profiles.push({id:"profile:sitewide",name:"Sitewide",requirements:[],schemaConstraints:[{path:"/existing",type:"string"}]});
const editedProfileDraft=appendSharedProfileConstraint(profileDraft,"profile:sitewide",{path:"/nested/value",type:"number",presence:"required",documentation:"Nested value"});
assert.deepEqual(editedProfileDraft.project.collections.profiles[0].schemaConstraints,[
  {path:"/existing",type:"string"},
  {path:"/nested/value",type:"number",presence:"required",documentation:"Nested value"},
]);
assert.equal(editedProfileDraft.project.collections.profiles[0].compiledTargetsStale,true);
assert.equal(editedProfileDraft.history.undo.at(-1).label,"Save schema constraint for Sitewide");
assert.throws(()=>appendSharedProfileConstraint(profileDraft,"profile:missing",{path:"/value"}),/Shared Profile profile:missing is unavailable/);

const detailState=structuredClone(pathState),detailOccurrence=detailState.project.documentationFlowGraphs["flow:selected"].occurrences[0];
detailState.project.collections.profiles[0].schemaConstraints=[{path:"/profile_value",target:"all",condition:{field:"country",equals:"NL"},enforcement:"invariant"}];
detailState.project.collections.events[0].schemaConstraints=[{path:"/event_value",target:"event:selected",enforcement:"overridable"}];
const detailRows=layeredContributionDetails(detailState,detailOccurrence,"Event-occurrence","flow:selected");
assert.deepEqual(detailRows.slice(0,2),[
  {contributorId:"profile:selected",contributorName:"Selected",scope:"Shared Profile",path:"/profile_value",target:"all",condition:'{"field":"country","equals":"NL"}',enforcement:"invariant",usedById:"occurrence:selected",usedByName:"Selected occurrence",usedByScope:"Event-occurrence"},
  {contributorId:"event:selected",contributorName:"Selected event",scope:"Event",path:"/event_value",target:"event:selected",condition:"Always",enforcement:"overridable",usedById:"occurrence:selected",usedByName:"Selected occurrence",usedByScope:"Event-occurrence"},
]);

console.log("data-layer layered schema tests passed");
