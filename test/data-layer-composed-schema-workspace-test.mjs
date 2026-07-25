import assert from "node:assert/strict";
import {
  composedCanonicalSchema,
  composedSchemaWorkspace,
  resetComposedSchemaLocalProperty,
  saveComposedCanonicalDocument,
  saveComposedEventCanonicalDocument,
  saveComposedSchemaLocalFacets,
  saveComposedSchemaLocalFacetsAndStructures,
} from "../dist/data-layer-composed-schema-workspace.js";
import {applyCanonicalCommand,canonicalPropertyPath} from "../dist/data-layer-canonical-schema.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {composedReviewFacetDelta,composedReviewLifecycleInventory} from "../dist/data-layer-composed-schema-workspace-rows.js";
import {composedFacetDraft} from "../dist/data-layer-composed-schema-builders.js";
import {saveFlowPageInstanceLocalFacetsAndStructures} from "../dist/data-layer-layered-schema-project.js";

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
const reviewDelta=composedReviewFacetDelta(step,{type:"number",itemType:undefined,presence:"required",expectedValue:"3b",allowedValues:[],condition:{kind:"all",children:[{kind:"predicate",propertyId:"/page_type",operator:"Exists"}]},rules:[],documentation:"changed",exampleMethod:"custom",exampleValue:"3b"});
assert.ok(reviewDelta.some(({label})=>label==="Edited type"));
assert.ok(reviewDelta.some(({label})=>label==="Edited presence"));
assert.ok(reviewDelta.some(({label})=>label==="Edited expected value"));
assert.ok(reviewDelta.some(({label})=>label==="Edited condition"));
assert.ok(reviewDelta.some(({label})=>label==="Edited documentation"));
assert.ok(reviewDelta.some(({label})=>label==="Edited example"));
assert.deepEqual(composedReviewFacetDelta(step,composedFacetDraft(step.local,step.effective)),[],"unchanged normalized condition and example facets do not appear as edits");
assert.deepEqual(composedReviewLifecycleInventory(true,"reset",new Set(["rule:restored"]),new Set(["value:restored"])),["Reset to parents","Restored rule rule:restored","Restored value value:restored"],"Review inventories reset and restored lifecycle transitions explicitly");
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

const structuredPage=saveComposedSchemaLocalFacetsAndStructures(inheritedAgain,"pages","page:cart","/page_name",{},[{kind:"add-child",path:"/page_name",name:"locale"}],(kind)=>`${kind}:workspace`);
assert.deepEqual(structuredPage.project.collections.pages[0].localSchemaContributions,[{path:"/page_name/locale",type:"string",definitionId:"property:workspace"}],"Page structure changes are stored as sparse local contributions");
assert.ok(composedSchemaWorkspace(structuredPage,structuredPage.project.collections.pages[0],"Page").rows.some(({path})=>path==="/page_name/locale"),"Page structure changes immediately reproject into the composed workspace");
const deletePageState=structuredClone(inheritedAgain),deletePage=deletePageState.project.collections.pages[0];deletePage.localSchemaContributions=[{path:"/local",type:"string"},{path:"/local/child",type:"number"},{path:"/keep",type:"boolean"}];const deletePageHistory=deletePageState.history.undo.length,deletedPageProperty=saveComposedSchemaLocalFacetsAndStructures(deletePageState,"pages","page:cart","/local",{type:"string",documentation:"staged focused-row value"},[{kind:"delete",path:"/local"}],(kind)=>`${kind}:workspace`);
assert.deepEqual(deletedPageProperty.project.collections.pages[0].localSchemaContributions,[{path:"/keep",type:"boolean"}],"a reviewed Page delete suppresses the ordinary focused-row facet save for the deleted property and its subtree");
assert.equal(deletedPageProperty.history.undo.length,deletePageHistory+1,"a Page structure delete and focused-row save remain one project command");
const deleteFrameState=structuredClone(inheritedAgain);deleteFrameState.project.documentationFlowGraphs={"flow:delete":{pageFrames:[{id:"frame:delete",name:"Delete frame",localSchemaContributions:[{path:"/local",type:"string"},{path:"/local/child",type:"number"},{path:"/keep",type:"boolean"}]}]}};const deleteFrameHistory=deleteFrameState.history.undo.length,deletedFrameProperty=saveFlowPageInstanceLocalFacetsAndStructures(deleteFrameState,"flow:delete","frame:delete","/local",{type:"string",documentation:"staged focused-row value"},[{kind:"delete",path:"/local"}],(kind)=>`${kind}:workspace`);
assert.deepEqual(deletedFrameProperty.project.documentationFlowGraphs["flow:delete"].pageFrames[0].localSchemaContributions,[{path:"/keep",type:"boolean"}],"a reviewed Flow Page-instance delete suppresses the ordinary focused-row facet save for the deleted property and its subtree");
assert.equal(deletedFrameProperty.history.undo.length,deleteFrameHistory+1,"a Flow Page-instance structure delete and focused-row save remain one project command");

const eventState=structuredClone(inheritedAgain);
eventState.project.collections.events.push({id:"event:purchase",name:"Purchase",profileId:"profile:sitewide",canonicalSchema:{id:"canonical:event",contributorId:"event:purchase",contributorName:"Purchase",revision:0,rootIds:[],nodes:{},changes:[],source:{identity:"event:purchase",revision:0,provenance:"project"}}});
const purchase=eventState.project.collections.events[0],eventDocument=composedCanonicalSchema(eventState,purchase,"Event"),eventPageName=Object.values(eventDocument.nodes).find((node)=>canonicalPropertyPath(eventDocument,node.id)==="/page_name");
assert.ok(eventPageName,"the Event canonical editor projection includes inherited properties");
const eventRuleResult=applyCanonicalCommand(eventDocument,{kind:"set",baseRevision:eventDocument.revision,propertyId:eventPageName.id,patch:{documentation:{...eventPageName.documentation,description:"Purchase page name"}}});
assert.equal(eventRuleResult.status,"applied");
const savedEvent=saveComposedEventCanonicalDocument(eventState,purchase.id,eventRuleResult.document);
assert.equal(savedEvent.project.collections.events.length,1);
assert.deepEqual(savedEvent.project.collections.events[0].localSchemaContributions,[{path:"/page_name",documentation:"Purchase page name"}],"an inherited Event edit persists only its sparse local difference");
assert.ok(savedEvent.project.collections.events[0].canonicalSchema,"the Event retains its canonical editor identity after saving a composed projection");

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

const ownershipState=createSpecificationProject({name:"Ownership projection",site:"shop.example",id:(kind)=>`${kind}:ownership`});
ownershipState.project.collections.profiles.push({id:"profile:ownership",name:"Ownership profile",schemaConstraints:[{path:"/owned",type:"string",allowedValues:["parent"],allowedValueIds:["value:parent"],allowedValueProvenance:[{id:"value:parent",state:"local",source:"profile"}],rules:[{id:"rule:parent",kind:"pattern",pattern:"^parent",severity:"error",message:"Parent rule",provenance:{source:"path-constraint",state:"local"}}]}]});
ownershipState.project.collections.pageGroups.push({id:"group:ownership",name:"Ownership group",profileId:"profile:ownership",localSchemaContributions:[{path:"/owned",allowedValues:["parent"],allowedValueIds:["value:group"],allowedValueProvenance:[{id:"value:group",state:"overridden",source:"group"}],rules:[{id:"rule:group",kind:"custom",severity:"warning",message:"Group rule",provenance:{source:"created",state:"local"}}]}]});
ownershipState.project.collections.pages.push({id:"page:ownership",name:"Ownership page",profileId:"profile:ownership",pageGroupIds:["group:ownership"],localSchemaContributions:[{path:"/owned",rules:[{id:"rule:page",kind:"custom",severity:"error",message:"Page rule",provenance:{source:"created",state:"local"}}]}]});
const ownershipGroup=ownershipState.project.collections.pageGroups[0],groupProjection=composedCanonicalSchema(ownershipState,ownershipGroup,"Page Group"),groupOwned=Object.values(groupProjection.nodes).find((node)=>canonicalPropertyPath(groupProjection,node.id)==="/owned");
assert.deepEqual(groupOwned.rules.map(({id,provenance})=>({id,state:provenance?.state})),[{id:"rule:parent",state:"inherited"},{id:"rule:group",state:"local"}],"Page Group compact projection retains per-rule inherited/local ownership");
assert.deepEqual(groupOwned.allowedValues.map(({id,provenance})=>({id,state:provenance?.[0]?.state})),[{id:"value:group",state:"local"}],"Page Group compact projection retains stable value identity and local ownership");
const ownershipPage=ownershipState.project.collections.pages[0],pageProjection=composedCanonicalSchema(ownershipState,ownershipPage,"Page"),pageOwned=Object.values(pageProjection.nodes).find((node)=>canonicalPropertyPath(pageProjection,node.id)==="/owned");
assert.deepEqual(pageOwned.rules.map(({id,provenance})=>({id,state:provenance?.state})),[{id:"rule:parent",state:"inherited"},{id:"rule:group",state:"inherited"},{id:"rule:page",state:"local"}],"Page compact projection exposes the complete inherited/local rule action matrix");
assert.deepEqual(pageOwned.allowedValues.map(({id,provenance})=>({id,state:provenance?.[0]?.state})),[{id:"value:group",state:"inherited"}],"Page compact projection rebases parent-local value ownership to inherited without changing identity");
const ownershipRoundTrip=saveComposedCanonicalDocument(ownershipState,"pages",ownershipPage.id,pageProjection),storedOwnership=ownershipRoundTrip.project.collections.pages[0].localSchemaContributions;
assert.deepEqual(storedOwnership.map(({path,rules,allowedValues})=>({path,ruleIds:rules?.map(({id})=>id),ruleStates:rules?.map(({provenance})=>provenance?.state),allowedValues})),[{path:"/owned",ruleIds:["rule:page"],ruleStates:["local"],allowedValues:undefined}],"unchanged compact persistence stores only locally owned items and never materializes inherited rules or values");

const blocked=structuredClone(localOnly);
blocked.project.collections.pageGroups.push({id:"group:partner",name:"Partner Checkout",schemaConstraints:[{path:"/funnel_name",type:"number"},{path:"/funnel_step",type:"number"}]});
blocked.project.collections.pages[0].pageGroupIds.push("group:partner");
const blockedWorkspace=composedSchemaWorkspace(blocked,blocked.project.collections.pages[0],"Page");
assert.equal(blockedWorkspace.status,"blocked");
assert.equal(blockedWorkspace.rows.find(({path})=>path==="/funnel_step").local.expectedValue,"2","the sparse local expectation survives an uncovered parent type conflict");
assert.equal(blockedWorkspace.rows.find(({path})=>path==="/funnel_step").validationState,"blocked");
assert.ok(blockedWorkspace.rows.find(({path})=>path==="/funnel_name").repairs.some((repair)=>repair.contributorId==="group:partner"));

console.log("data-layer composed schema workspace tests passed");
