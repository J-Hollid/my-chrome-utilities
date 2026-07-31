import assert from "node:assert/strict";
import {assignmentConditionControl,buildGuidedAssignmentCondition,guidedAssignmentConditionKinds} from "../dist/data-layer-assignment-routing.js";
import {saveProjectAssignment} from "../dist/data-layer-specification-project.js";

const project={
  environments:["Production","Staging"],
  collections:{
    pages:[{id:"page:cart",name:"Cart",pageGroupIds:["group:checkout"],profileInheritanceRecipes:[{id:"recipe:sitewide",profileId:"profile:sitewide",targetId:"page:cart"}],canonicalSchema:{id:"schema:cart"},localSchemaContributions:[{path:"/cart_id",type:"string"}]}],
    events:[{id:"event:page-view",name:"Page View",eventName:"page_view"},{id:"event:purchase",name:"Purchase",eventName:"purchase"}],
    applicabilitySets:[{id:"set:cart",name:"Cart pathname",condition:{kind:"all",conditions:[{kind:"predicate",field:"pathname",operator:"equals",value:"/checkout/cart"}]}}],
    assignments:[{id:"assignment:cart",name:"Cart Page View",targetKind:"Page",targetId:"page:cart",sourceId:"browser",eventId:"event:page-view",target:"payload",applicabilitySetId:"set:cart",priority:10}],
  },
};

assert.deepEqual(guidedAssignmentConditionKinds.map(({kind,guidedInput})=>[kind,guidedInput]),[
  ["Environment","one configured project environment"],
  ["Host","host comparison and host value"],
  ["Pathname","exact, starts-with, or pattern comparison and path"],
  ["Query","parameter name, comparison, and typed value"],
  ["Hash","hash comparison and value"],
  ["Context data","schema property, compatible comparison, and typed value"],
]);

assert.deepEqual(assignmentConditionControl({path:"/name",type:"string"}),{path:"/name",type:"string",comparisons:["exists","does not exist","equals","does not equal","is one of","starts with","contains","matches pattern"],valueType:"string"});
assert.deepEqual(assignmentConditionControl({path:"/total",type:"number"}),{path:"/total",type:"number",comparisons:["exists","does not exist","equals","does not equal","is greater than","is at least","is less than","is at most"],valueType:"number"});
assert.deepEqual(assignmentConditionControl({path:"/member",type:"boolean"}),{path:"/member",type:"boolean",comparisons:["exists","does not exist","equals","does not equal"],valueType:"boolean"});
assert.deepEqual(buildGuidedAssignmentCondition({kind:"Context data",property:{path:"/total",type:"number"},comparison:"is at least",value:"7"}),{kind:"predicate",field:"/total",operator:"is at least",value:7});
assert.deepEqual(buildGuidedAssignmentCondition({kind:"Context data",property:{path:"/member",type:"boolean"},comparison:"exists"}),{kind:"predicate",field:"/member",operator:"exists"});
assert.throws(()=>buildGuidedAssignmentCondition({kind:"Context data",comparison:"equals",value:"x"}),/schema property/i);
assert.throws(()=>buildGuidedAssignmentCondition({kind:"Query",comparison:"equals",value:"x"}),/parameter/i);
assert.throws(()=>buildGuidedAssignmentCondition({kind:"Pathname",comparison:"equals",value:""}),/value/i);

let sequence=0;const state={project:{id:"project:routing",name:"Routing",description:"",site:"example.test",environments:["Production"],namingConventions:{},publicationPolicy:{warningsBlock:false,fixturesRequired:false},collections:{profiles:[],pageGroups:[],pages:project.collections.pages,events:project.collections.events,applicabilitySets:project.collections.applicabilitySets,flows:[],fixtures:[],assignments:project.collections.assignments},releases:[]},draft:{id:"draft:routing",status:"Saved",updatedAt:"2026-08-01T00:00:00Z"},history:{undo:[],redo:[]}},originalCondition=structuredClone(state.project.collections.applicabilitySets[0].condition),{applicabilitySetId:_sharedSet,...assignmentInput}=state.project.collections.assignments[0],saved=saveProjectAssignment(state,{...assignmentInput,eventName:"page_view",condition:{kind:"predicate",field:"pathname",operator:"equals",value:"/new"}},(kind)=>`${kind}:new:${sequence++}`),updated=saved.project.collections.assignments[0];
assert.notEqual(updated.applicabilitySetId,"set:cart","starting a structured condition creates a distinct reusable set");assert.deepEqual(saved.project.collections.applicabilitySets.find(({id})=>id==="set:cart").condition,originalCondition,"the previously shared set is never overwritten");assert.equal(saved.project.collections.applicabilitySets.length,2);

console.log("assignment routing unit tests passed");
