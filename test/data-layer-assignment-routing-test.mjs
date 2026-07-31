import assert from "node:assert/strict";
import {guidedAssignmentConditionKinds,testAssignmentRouting} from "../dist/data-layer-assignment-routing.js";

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

const evaluate=(observation)=>testAssignmentRouting(project,observation);
const winning=evaluate({sourceId:"browser",eventName:"page_view",pathname:"/checkout/cart",payload:{}});
assert.equal(winning.winner?.assignmentId,"assignment:cart");
assert.equal(winning.summary,"Cart Page View is the sole winner");
assert.equal(winning.candidates[0].event.accepted,true);
assert.equal(winning.candidates[0].applicability.accepted,true);

for(const [observation,summary,rejection] of [
  [{sourceId:"browser",eventName:"page_view",pathname:"/checkout/shipping"},"Cart Page View is rejected by pathname","pathname"],
  [{sourceId:"server",eventName:"page_view",pathname:"/checkout/cart"},"Cart Page View is rejected by source","source"],
  [{sourceId:"browser",eventName:"purchase",pathname:"/checkout/cart"},"Cart Page View is rejected by Event","Event"],
]){
  const result=evaluate(observation);
  assert.equal(result.summary,summary);
  assert.ok(result.candidates[0].reasons.includes(rejection));
  assert.ok(result.candidates[0].event.evidence);
  assert.ok(result.candidates[0].applicability.evidence);
}

const tied=structuredClone(project);tied.collections.assignments.push({...tied.collections.assignments[0],id:"assignment:alternative",name:"Cart Page View alternative"});
const ambiguous=testAssignmentRouting(tied,{sourceId:"browser",eventName:"page_view",pathname:"/checkout/cart"});
assert.equal(ambiguous.winner,undefined);assert.deepEqual(ambiguous.ties.map(({name})=>name),["Cart Page View","Cart Page View alternative"]);assert.match(ambiguous.summary,/ambiguous.*Cart Page View.*Cart Page View alternative/i);
tied.collections.assignments[0].priority=20;
const resolved=testAssignmentRouting(tied,{sourceId:"browser",eventName:"page_view",pathname:"/checkout/cart"});
assert.equal(resolved.winner?.name,"Cart Page View");assert.equal(resolved.candidates.find(({assignmentId})=>assignmentId==="assignment:alternative").resolution,"lower priority");

const before=JSON.stringify(project),without=structuredClone(project);without.collections.assignments=[];
assert.equal(testAssignmentRouting(without,{sourceId:"browser",eventName:"page_view",pathname:"/checkout/cart"}).winner,undefined);
assert.equal(JSON.stringify(project),before,"routing tests never mutate project bytes");
assert.deepEqual(without.collections.pages[0],project.collections.pages[0],"Assignment removal does not change the Page or its schema relationships");

console.log("assignment routing unit tests passed");
