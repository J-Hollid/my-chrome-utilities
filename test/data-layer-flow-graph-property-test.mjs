import assert from "node:assert/strict";
import {addFlowPageFrame,documentaryFlowGraph,inferFlowRelationshipKind,migrateLegacyFlowRelationshipKinds,removeFlowRelationship,setFlowPageGroupLanes} from "../dist/data-layer-flow-graph.js";
import {resetFlowPageInstanceLocalProperty,saveFlowPageInstanceLocalFacets} from "../dist/data-layer-layered-schema-project.js";
import {addProjectEntity,createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";

const sides=["left","right","top","bottom"];
const expected=new Map([
  ["right:left","expected_next"],
  ["top:bottom","alternative"],
  ["bottom:top","merge"],
]);

let seed=0x5eed1234;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/0x100000000;};

for(let sample=0;sample<512;sample+=1){
  const sourcePort=sides[Math.floor(random()*sides.length)];
  const targetPort=sides[Math.floor(random()*sides.length)];
  const key=`${sourcePort}:${targetPort}`;
  assert.equal(
    inferFlowRelationshipKind(sourcePort,targetPort),
    expected.get(key),
    `${key} must ${expected.has(key)?"infer exactly one canonical kind":"remain invalid"}`,
  );
}

for(const sourcePort of sides)for(const targetPort of sides){
  const key=`${sourcePort}:${targetPort}`;
  assert.equal(inferFlowRelationshipKind(sourcePort,targetPort),expected.get(key),key);
}

let identity=0,base=createSpecificationProject({name:"Migration properties",site:"example.test",id:(kind)=>`${kind}:property-${++identity}`});
base=addProjectEntity(base,"flows",{name:"Migrated Flow"},(kind)=>`${kind}:property-${++identity}`);
const flow=base.project.collections.flows[0];
const graph={pageGroupIds:[],pageFrames:[],occurrences:[],relationships:[]};
const randomText=(prefix)=>`${prefix}-${Math.floor(random()*1_000_000)}`;

for(let sample=0;sample<128;sample+=1){
  const relationship={
    id:`relationship:legacy-${sample}`,
    sourceEndpoint:{kind:sample%2?"page-frame":"event-occurrence",id:`source:${sample}`},
    targetEndpoint:{kind:sample%3?"event-occurrence":"page-frame",id:`target:${sample}`},
    kind:"parallel",
    group:randomText("group"),
    ...(sample%2?{label:randomText("label")}:{}),
    documentationCondition:randomText("condition"),
    expectation:randomText("expectation"),
    geometry:{bendX:Math.floor(random()*500),bendY:Math.floor(random()*500)},
  };
  const state={...base,project:{...base.project,documentationFlowGraphs:{[flow.id]:{...graph,relationships:[relationship]}}}},preserved={...relationship};
  delete preserved.kind;
  const migrated=migrateLegacyFlowRelationshipKinds(state,flow.id),stored=migrated.project.documentationFlowGraphs[flow.id].relationships[0],conserved={...stored};
  delete conserved.kind;delete conserved.sourcePort;delete conserved.targetPort;
  assert.deepEqual(conserved,preserved,`migration sample ${sample} must conserve identity, endpoints, optional metadata, and geometry`);
  assert.deepEqual({kind:stored.kind,sourcePort:stored.sourcePort,targetPort:stored.targetPort},{kind:"alternative",sourcePort:"top",targetPort:"bottom"});
  assert.equal(migrateLegacyFlowRelationshipKinds(migrated,flow.id),migrated,`migration sample ${sample} must be referentially idempotent`);
}

const current={...base,project:{...base.project,documentationFlowGraphs:{[flow.id]:{...graph,relationships:[{id:"relationship:current",kind:"alternative",sourcePort:"top",targetPort:"bottom"}]}}}};
assert.equal(migrateLegacyFlowRelationshipKinds(current,flow.id),current,"a current graph must remain an exact no-op");

for(let sample=0;sample<128;sample+=1){
  const relationships=Array.from({length:2+Math.floor(random()*12)},(_,index)=>({
    id:`relationship:deletion-${sample}-${index}`,
    sourceEndpoint:{kind:index%2?"page-frame":"event-occurrence",id:`source:${sample}:${index}`},
    targetEndpoint:{kind:index%3?"event-occurrence":"page-frame",id:`target:${sample}:${index}`},
    sourcePort:index%2?"top":"right",
    targetPort:index%2?"bottom":"left",
    kind:index%2?"alternative":"expected_next",
    group:randomText("group"),
    ...(index%2?{label:randomText("label")}:{}),
    documentationCondition:randomText("condition"),
    expectation:randomText("expectation"),
  })),removed=relationships[Math.floor(random()*relationships.length)],state={...base,project:{...base.project,documentationFlowGraphs:{[flow.id]:{...graph,relationships}}}};
  const deleted=removeFlowRelationship(state,flow.id,removed.id),remaining=deleted.project.documentationFlowGraphs[flow.id].relationships;
  assert.deepEqual(remaining,relationships.filter(({id})=>id!==removed.id),`deletion sample ${sample} must remove only the selected stable identity`);
  assert.deepEqual(undoProjectTransaction(deleted).project,state.project,`deletion sample ${sample} must round-trip the complete graph through one Undo`);
}

for(let sample=0;sample<64;sample+=1){
  let propertyIdentity=0,state=createSpecificationProject({name:`Instance properties ${sample}`,site:"example.test",id:(kind)=>`${kind}:instance-${sample}-${++propertyIdentity}`});
  const instanceId=(kind)=>`${kind}:instance-${sample}-${++propertyIdentity}`;
  state=addProjectEntity(state,"pageGroups",{name:"Checkout"},instanceId);
  const group=state.project.collections.pageGroups[0];
  state=addProjectEntity(state,"pages",{name:"Confirmation",pageGroupIds:[group.id],schemaConstraints:[{path:"/status",type:"string",expectedValue:"pending"}]},instanceId);
  state=addProjectEntity(state,"flows",{name:"Repeated instances"},instanceId);
  const page=state.project.collections.pages[0],instanceFlow=state.project.collections.flows[0],count=2+Math.floor(random()*7);
  state=setFlowPageGroupLanes(state,instanceFlow.id,[group.id]);
  for(let index=0;index<count;index+=1)state=addFlowPageFrame(state,instanceFlow.id,{pageId:page.id,pageGroupId:group.id,x:40+index*20,y:40},instanceId);
  const instances=documentaryFlowGraph(state.project,instanceFlow.id).pageFrames,target=instances[Math.floor(random()*instances.length)],pageBefore=JSON.stringify(page),siblingsBefore=Object.fromEntries(instances.filter(({id})=>id!==target.id).map(({id})=>[id,JSON.stringify(documentaryFlowGraph(state.project,instanceFlow.id).pageFrames.find((frame)=>frame.id===id))]));
  assert.equal(instances.length,count,`instance sample ${sample} must preserve every repeated insertion`);
  assert.equal(new Set(instances.map(({id})=>id)).size,count,`instance sample ${sample} must allocate distinct identities`);
  state=saveFlowPageInstanceLocalFacets(state,instanceFlow.id,target.id,"/status",{expectedValue:randomText("status")});
  assert.equal(JSON.stringify(state.project.collections.pages[0]),pageBefore,`instance sample ${sample} must not mutate the Page`);
  for(const [id,before] of Object.entries(siblingsBefore))assert.equal(JSON.stringify(documentaryFlowGraph(state.project,instanceFlow.id).pageFrames.find((frame)=>frame.id===id)),before,`instance sample ${sample} must not mutate sibling ${id}`);
  state=resetFlowPageInstanceLocalProperty(state,instanceFlow.id,target.id,"/status");
  assert.ok(!documentaryFlowGraph(state.project,instanceFlow.id).pageFrames.find(({id})=>id===target.id).localSchemaContributions.some(({path})=>path==="/status"),`instance sample ${sample} must reset only its local property`);
}

console.log("Flow graph property tests passed");
