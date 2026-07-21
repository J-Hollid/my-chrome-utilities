import assert from "node:assert/strict";
import {
  composedCanonicalSchema,
  composedSchemaWorkspace,
  resetComposedSchemaLocalProperty,
  saveComposedCanonicalDocument,
  saveComposedSchemaLocalFacets,
} from "../dist/data-layer-composed-schema-workspace.js";
import {applyCanonicalCommand,canonicalPropertyPath} from "../dist/data-layer-canonical-schema.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";

const state=createSpecificationProject({name:"Composed schemas",site:"shop.example",id:(kind)=>`${kind}:workspace`});
state.project.collections.profiles.push({id:"profile:sitewide",name:"Sitewide",schemaConstraints:[
  {path:"/page_name",type:"string"},
  {path:"/funnel_name",type:"string",expectedValue:"checkout",enforcement:"invariant"},
  {path:"/funnel_step",type:"string",allowedValues:["2","3a","3b"]},
  {path:"/page_type",type:"string"},
]});
state.project.collections.pageGroups.push(
  {id:"group:checkout",name:"Checkout",profileId:"profile:sitewide",schemaConstraints:[{path:"/funnel_step",expectedValue:"3b",enforcement:"overridable"}]},
  {id:"group:retail",name:"Retail Checkout",schemaConstraints:[{path:"/funnel_step",expectedValue:"3a",enforcement:"overridable"}]},
);
state.project.collections.pages.push({id:"page:cart",name:"Cart",profileId:"profile:sitewide",pageGroupIds:["group:checkout","group:retail"],schemaConstraints:[{path:"/funnel_step",expectedValue:"2"}]});

const cart=state.project.collections.pages[0];
const workspace=composedSchemaWorkspace(state,cart,"Page");
assert.equal(workspace.heading,"Effective schema at Cart");
assert.equal(workspace.status,"ready");
assert.deepEqual(workspace.rows.map(({path})=>path),["/funnel_name","/funnel_step","/page_name","/page_type"]);
const step=workspace.rows.find(({path})=>path==="/funnel_step");
assert.equal(step.effective.expectedValue,"2");
assert.equal(step.local.expectedValue,"2");
assert.equal(step.action,"reset");
assert.equal(step.validationState,"warning");
assert.equal(step.message,"Parent difference resolved by Cart override");
assert.deepEqual(step.provenance.map(({contributorName,state})=>({contributorName,state})),[
  {contributorName:"Sitewide",state:"inherited"},
  {contributorName:"Checkout",state:"shadowed"},
  {contributorName:"Retail Checkout",state:"shadowed"},
  {contributorName:"Cart",state:"effective"},
]);
assert.equal(workspace.rows.find(({path})=>path==="/page_name").action,"override");

const reset=resetComposedSchemaLocalProperty(state,"pages","page:cart","/funnel_step");
assert.deepEqual(reset.project.collections.pages[0].schemaConstraints,[]);
assert.equal(composedSchemaWorkspace(reset,reset.project.collections.pages[0],"Page").rows.find(({path})=>path==="/funnel_step").effective.expectedValue,"3a");
assert.match(reset.history.undo.at(-1).label,/Reset \/funnel_step to parents/);

const saved=saveComposedSchemaLocalFacets(reset,"pages","page:cart","/funnel_step",{expectedValue:"2"});
assert.deepEqual(saved.project.collections.pages[0].localSchemaContributions,[{path:"/funnel_step",expectedValue:"2"}],"only the changed local facet is stored");
assert.equal(composedSchemaWorkspace(saved,saved.project.collections.pages[0],"Page").rows.find(({path})=>path==="/funnel_step").effective.expectedValue,"2");

const inheritedAgain=saveComposedSchemaLocalFacets(saved,"pages","page:cart","/funnel_step",{});
assert.deepEqual(inheritedAgain.project.collections.pages[0].localSchemaContributions,[],"an empty sparse override does not persist a path-only local contribution");
assert.equal(composedSchemaWorkspace(inheritedAgain,inheritedAgain.project.collections.pages[0],"Page").rows.find(({path})=>path==="/funnel_step").action,"override");

const effectiveDocument=composedCanonicalSchema(inheritedAgain,inheritedAgain.project.collections.pages[0],"Page"),effectiveStep=Object.values(effectiveDocument.nodes).find((node)=>canonicalPropertyPath(effectiveDocument,node.id)==="/funnel_step");
assert.equal(effectiveDocument.source.provenance,"project-composed-effective");
assert.ok(effectiveStep,"the canonical Tree/Table projection contains inherited parent properties");
assert.deepEqual(effectiveStep.provenance.map(({contributorName})=>contributorName),["Sitewide","Checkout","Retail Checkout"]);
const overriddenResult=applyCanonicalCommand(effectiveDocument,{kind:"set",baseRevision:effectiveDocument.revision,propertyId:effectiveStep.id,patch:{expectedValue:"2"}});
assert.equal(overriddenResult.status,"applied");
const effectiveOverride=saveComposedCanonicalDocument(inheritedAgain,"pages","page:cart",overriddenResult.document);
assert.deepEqual(effectiveOverride.project.collections.pages[0].localSchemaContributions,[{path:"/funnel_step",expectedValue:"2"}],"an effective-core command stores only the sparse local difference");
const overriddenProjection=composedCanonicalSchema(effectiveOverride,effectiveOverride.project.collections.pages[0],"Page"),overriddenStep=Object.values(overriddenProjection.nodes).find((node)=>canonicalPropertyPath(overriddenProjection,node.id)==="/funnel_step");
const resetResult=applyCanonicalCommand(overriddenProjection,{kind:"delete",baseRevision:overriddenProjection.revision,propertyId:overriddenStep.id});
assert.equal(resetResult.status,"applied");
const effectiveReset=saveComposedCanonicalDocument(effectiveOverride,"pages","page:cart",resetResult.document),resetProjection=composedCanonicalSchema(effectiveReset,effectiveReset.project.collections.pages[0],"Page");
assert.deepEqual(effectiveReset.project.collections.pages[0].localSchemaContributions,[]);
assert.ok(Object.values(resetProjection.nodes).some((node)=>canonicalPropertyPath(resetProjection,node.id)==="/funnel_step"&&node.expectedValue==="3a"),"reset removes the local facet and reprojects the live inherited property in the same core");

const localOnly=saveComposedSchemaLocalFacets(saved,"pages","page:cart","/cart_note",{type:"string",documentation:"Cart-only note"});
assert.equal(composedSchemaWorkspace(localOnly,localOnly.project.collections.pages[0],"Page").rows.find(({path})=>path==="/cart_note").action,"remove");

const blocked=structuredClone(localOnly);
blocked.project.collections.pageGroups.push({id:"group:partner",name:"Partner Checkout",schemaConstraints:[{path:"/funnel_name",type:"number"},{path:"/funnel_step",type:"number"}]});
blocked.project.collections.pages[0].pageGroupIds.push("group:partner");
const blockedWorkspace=composedSchemaWorkspace(blocked,blocked.project.collections.pages[0],"Page");
assert.equal(blockedWorkspace.status,"blocked");
assert.equal(blockedWorkspace.rows.find(({path})=>path==="/funnel_step").local.expectedValue,"2","the sparse local expectation survives an uncovered parent type conflict");
assert.equal(blockedWorkspace.rows.find(({path})=>path==="/funnel_step").validationState,"blocked");
assert.ok(blockedWorkspace.rows.find(({path})=>path==="/funnel_name").repairs.some((repair)=>repair.contributorId==="group:partner"));

console.log("data-layer composed schema workspace tests passed");
