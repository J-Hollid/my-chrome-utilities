import assert from "node:assert/strict";

import {
  addPropertySetApplication,
  createFlowSection,
  inspectSectionRemovalWithContents,
  moveFlowSection,
  movePageFrameToSection,
  orderedPropertySetApplications,
  removeFlowSection,
  removeFlowSectionWithContents,
  renameAndResizeFlowSection,
  reorderPropertySetApplication,
  upgradePageGroupsToPropertySets,
} from "../dist/data-layer-property-set-flow-section.js";
import {compileLayeredSchema} from "../dist/data-layer-layered-schema.js";
import {layeredContributorPath,layeredContributorsForPath} from "../dist/data-layer-layered-schema-project.js";

let sequence=0;
const id=(kind)=>`${kind}:separation:${++sequence}`;
const legacyState=()=>({
  project:{
    id:"project:shop",name:"Shop",description:"",site:"https://shop.test",environments:["Production"],
    namingConventions:{},publicationPolicy:{warningsBlock:false,fixturesRequired:false},releases:[],
    collections:{
      profiles:[{id:"profile:commerce",name:"Commerce"}],
      pageGroups:[
        {id:"group:checkout",name:"Checkout base",applicabilitySetId:"set:retail",pageIds:["page:cart"],schemaConstraints:[{path:"/funnel_step",expectedValue:"checkout"}]},
        {id:"group:retail",name:"Retail commerce",schemaConstraints:[{path:"/funnel_step",expectedValue:"retail"}]},
      ],
      pages:[
        {id:"page:cart",name:"Cart",pageGroupIds:["group:checkout","group:retail"]},
        {id:"page:product",name:"Product detail",pageGroupIds:["group:retail"]},
      ],
      events:[{id:"event:view",name:"View"}],applicabilitySets:[{id:"set:retail",name:"Retail customers",condition:{kind:"predicate",field:"segment",operator:"equals",value:"retail"}}],
      flows:[{id:"flow:checkout",name:"Checkout journey"}],fixtures:[],
      assignments:[{id:"assignment:retail",name:"Retail checkout",targetKind:"Page Group",targetId:"group:checkout"}],
    },
    documentationFlowGraphs:{
      "flow:checkout":{
        pageGroupIds:["group:checkout","group:retail"],
        pageFrames:[
          {id:"frame:cart",name:"Cart",pageId:"page:cart",pageGroupId:"group:checkout",position:{x:40,y:90}},
          {id:"frame:product",name:"Product detail",pageId:"page:product",pageGroupId:"group:retail",position:{x:340,y:250}},
        ],
        occurrences:[{id:"occurrence:view",name:"View",pageFrameId:"frame:cart",pageId:"page:cart",eventId:"event:view"}],
        relationships:[{id:"relationship:next",sourceEndpoint:{kind:"page-frame",id:"frame:cart"},targetEndpoint:{kind:"page-frame",id:"frame:product"}}],
      },
    },
  },
  draft:{id:"draft:shop",status:"Saved",updatedAt:"2026-08-02T00:00:00.000Z"},history:{undo:[],redo:[]},
});

{
  const upgraded=upgradePageGroupsToPropertySets(legacyState(),id),project=upgraded.project;
  assert.equal(Object.hasOwn(project.collections,"pageGroups"),false,"verified storage removes the legacy Page Group collection");
  assert.deepEqual(project.collections.propertySets.map(({id,name})=>({id,name})),[
    {id:"group:checkout",name:"Checkout base"},{id:"group:retail",name:"Retail commerce"},
  ],"Property Sets retain contributor identities and names");
  assert.deepEqual(orderedPropertySetApplications(project,"page:cart").map(({propertySetId,applicabilitySetId})=>({propertySetId,applicabilitySetId})),[
    {propertySetId:"group:checkout",applicabilitySetId:"set:retail"},{propertySetId:"group:retail",applicabilitySetId:undefined},
  ],"ordered memberships become Page-owned applications with copied applicability");
  const graph=project.documentationFlowGraphs["flow:checkout"];
  assert.equal(graph.sections.length,2,"each used legacy Flow lane becomes a Flow-owned Section");
  assert.equal(graph.pageFrames[0].sectionId,graph.sections[0].id,"frame placement points to the new Section identity");
  assert.equal(Object.hasOwn(graph.pageFrames[0],"pageGroupId"),false,"legacy frame placement is removed");
  assert.deepEqual(graph.relationships,legacyState().project.documentationFlowGraphs["flow:checkout"].relationships,"topology is conserved");
  assert.equal(project.collections.assignments[0].targetKind,"Property Set","Assignment kind is migrated without changing target identity");
  assert.equal(project.collections.assignments[0].targetId,"group:checkout");
  assert.strictEqual(upgradePageGroupsToPropertySets(upgraded,id),upgraded,"the verified upgrade is idempotent");
}

{
  const upgraded=upgradePageGroupsToPropertySets(legacyState(),id);
  const added=addPropertySetApplication(upgraded,"page:product","group:checkout",undefined,id);
  assert.deepEqual(orderedPropertySetApplications(added.project,"page:product").map(({propertySetId})=>propertySetId),["group:retail","group:checkout"]);
  const reordered=reorderPropertySetApplication(added,"page:product","group:checkout",-1);
  assert.deepEqual(orderedPropertySetApplications(reordered.project,"page:product").map(({propertySetId})=>propertySetId),["group:checkout","group:retail"]);
  assert.equal(reordered.history.undo.at(-1).label,"Reorder Property composition for Product detail");
}

{
  let state=upgradePageGroupsToPropertySets(legacyState(),id),page=state.project.collections.pages.find(({id})=>id==="page:cart"),path=layeredContributorPath(state,page,"Page"),contributors=layeredContributorsForPath(state,path,{segment:"retail"}),compiled=compileLayeredSchema(contributors,{eventId:"event:view",eventRole:"interaction"});
  assert.deepEqual(contributors.filter(({scope})=>scope==="Page Group").map(({name})=>name),["Checkout base","Retail commerce"],"the compiler consumes migrated Page-owned application order");
  assert.equal(compiled.properties["/funnel_step"].expectedValue,"retail");
  assert.deepEqual(compiled.properties["/funnel_step"].superseded.map(({contributorName})=>contributorName),["Checkout base"],"ordinary predecessor provenance remains visible");
  state=reorderPropertySetApplication(state,"page:cart","group:retail",-1);page=state.project.collections.pages.find(({id})=>id==="page:cart");path=layeredContributorPath(state,page,"Page");compiled=compileLayeredSchema(layeredContributorsForPath(state,path,{segment:"retail"}),{eventId:"event:view",eventRole:"interaction"});
  assert.equal(compiled.properties["/funnel_step"].expectedValue,"checkout","reordering changes the ordinary winner");
  const excluded=layeredContributorsForPath(state,path,{segment:"wholesale"}),excludedCompiled=compileLayeredSchema(excluded,{eventId:"event:view",eventRole:"interaction"});
  assert.equal(excluded.find(({name})=>name==="Checkout base").active,false,"applicability is evaluated from this Page application only");
  assert.equal(excludedCompiled.properties["/funnel_step"].expectedValue,"retail","an excluded application does not contribute to compilation");
}

{
  let state=upgradePageGroupsToPropertySets(legacyState(),id);
  state=createFlowSection(state,"flow:checkout",{name:"Review phase",bounds:{x:280,y:40,width:420,height:300}},id);
  const graph=()=>state.project.documentationFlowGraphs["flow:checkout"],review=graph().sections.at(-1),schemaBytes=JSON.stringify({pages:state.project.collections.pages,propertySets:state.project.collections.propertySets,assignments:state.project.collections.assignments});
  state=movePageFrameToSection(state,"flow:checkout","frame:cart",review.id);
  state=moveFlowSection(state,"flow:checkout",review.id,{x:40,y:25});
  assert.deepEqual(graph().pageFrames.find(({id})=>id==="frame:cart").position,{x:80,y:75},"moving a Section preserves the contained frame's relative position");
  state=renameAndResizeFlowSection(state,"flow:checkout",review.id,{name:"Review",bounds:{x:320,y:65,width:460,height:330}});
  assert.equal(JSON.stringify({pages:state.project.collections.pages,propertySets:state.project.collections.propertySets,assignments:state.project.collections.assignments}),schemaBytes,"Section commands are schema-neutral");
  const removed=removeFlowSection(state,"flow:checkout",review.id),removedGraph=removed.project.documentationFlowGraphs["flow:checkout"];
  assert.equal(removedGraph.pageFrames.some(({id,sectionId})=>id==="frame:cart"&&sectionId===undefined),true,"default removal keeps frames outside Sections");
  assert.equal(removedGraph.relationships.length,1,"default removal keeps relationships");
}

{
  let state=upgradePageGroupsToPropertySets(legacyState(),id),graph=state.project.documentationFlowGraphs["flow:checkout"],section=graph.sections[0];
  const review=inspectSectionRemovalWithContents(state.project,"flow:checkout",section.id);
  assert.deepEqual(review.pageFrames.map(({id})=>id),["frame:cart"]);
  assert.deepEqual(review.relationships.map(({id})=>id),["relationship:next"]);
  const before=JSON.stringify(state.project);
  assert.equal(JSON.stringify(state.project),before,"review is non-mutating");
  state=removeFlowSectionWithContents(state,"flow:checkout",section.id,review);
  graph=state.project.documentationFlowGraphs["flow:checkout"];
  assert.equal(graph.pageFrames.some(({id})=>id==="frame:cart"),false);
  assert.equal(graph.occurrences.some(({id})=>id==="occurrence:view"),false);
  assert.equal(graph.relationships.some(({id})=>id==="relationship:next"),false);
  assert.equal(state.history.undo.length,2,"upgrade and destructive removal are each one undoable command");
}

console.log("property set and Flow Section separation tests passed");
