import assert from "node:assert/strict";
import {canonicalRequirements} from "../dist/data-layer-canonical-schema.js";

import {
  applyCapturedValidationToProfile,
  capturedValidationProfileRequirements,
  createFixtureFromCapturedValidation,
  createSpecificationProject,
  transactProject,
} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:${++sequence}`;
let state=createSpecificationProject({name:"Contributor continuation",site:"shop.example",id});
state=transactProject(state,"Add contributor destinations",(project)=>({
  ...project,
  collections:{
    ...project.collections,
    profiles:[
      {id:"profile:evaluated",name:"Evaluated contributor",requirements:[{path:"/order_id",type:"string",required:true}],workingDraft:{document:{type:"object",properties:{legacy:{type:"string"}}}},profileIds:["profile:legacy"],document:{type:"object",properties:{legacy:{type:"string"}}}},
      {id:"profile:destination",name:"Destination",requirements:[]},
      {id:"profile:legacy",name:"Legacy fallback",requirements:[{path:"/legacy",type:"string"}]},
    ],
  },
}));

const evaluated={resultIdentity:"result:contributor",winner:{schemaId:"profile:evaluated",schemaRevision:7},issueDetails:[]};
const requirements=capturedValidationProfileRequirements(state.project,{captureId:"capture:1",contributorId:"profile:evaluated",evaluated});
assert.deepEqual(requirements.map(({path})=>path),["/order_id"],
  "continuation must read only the contributor's canonical requirements");

state=createFixtureFromCapturedValidation(state,{
  name:"Captured contributor proof",
  captureId:"capture:1",
  sourceId:"event-history",
  eventName:"purchase",
  payload:{order_id:"A-1"},
  contributorId:"profile:evaluated",
  eventId:"event:purchase",
  pageId:"page:confirmation",
  flowStepId:"step:confirmation",
  evaluated,
},id);
const fixture=state.project.collections.fixtures[0];
assert.equal(fixture.contributorId,"profile:evaluated");
assert.equal("schemaId" in fixture,false);
assert.equal("schemaDraftId" in fixture,false);
assert.equal("schemaDocument" in fixture,false);
assert.equal("profileIds" in fixture,false);

state=applyCapturedValidationToProfile(state,{
  captureId:"capture:1",
  profileId:"profile:destination",
  contributorId:"profile:evaluated",
  evaluated,
});
const destination=state.project.collections.profiles.find(({id:profileId})=>profileId==="profile:destination");
assert.deepEqual(destination.requirements,[]);
assert.deepEqual(canonicalRequirements(destination.canonicalSchema).map(({path})=>path),["/order_id"]);
assert.throws(()=>capturedValidationProfileRequirements(state.project,{
  captureId:"capture:2",
  contributorId:"profile:legacy",
  evaluated:{...evaluated,winner:{schemaId:"profile:evaluated",schemaRevision:7}},
}),/does not prove contributor/);

console.log("contributor-native captured continuation tests passed");
