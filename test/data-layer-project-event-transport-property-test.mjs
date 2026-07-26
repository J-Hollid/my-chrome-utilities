import assert from "node:assert/strict";

import {
  configureProjectEventTransport,
  observeProjectHistory,
  projectEventTransport,
  pushProjectEvent,
  seedLibraryDestination,
} from "../dist/data-layer-project-event-transport.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";

let identity=0;
const base=createSpecificationProject({
  name:"Transport properties",
  site:"transport.example",
  id:(kind)=>`${kind}:transport-property:${++identity}`,
});

for(let index=0;index<200;index+=1){
  const observationHistoryPath=`source${index}.history`,defaultPushPath=`destination${index}`;
  const state=configureProjectEventTransport(base,{observationHistoryPath:` ${observationHistoryPath} `,defaultPushPath:` ${defaultPushPath} `});
  const observedEntry=[`event_${index}`,{index}],wrongEntry=[`wrong_${index}`,{index}],sent=[];
  const page={
    [`source${index}`]:{history:[observedEntry]},
    [`other${index}`]:{history:[wrongEntry]},
    [defaultPushPath]:{push:(value)=>sent.push(value)},
  };

  assert.deepEqual(projectEventTransport(state.project),{observationHistoryPath,defaultPushPath});
  assert.equal(seedLibraryDestination(state.project),defaultPushPath);

  const observation=observeProjectHistory(state.project,page);
  assert.deepEqual(observation,{status:"Observation ready",entries:[observedEntry]});
  observation.entries.push(["mutated",{}]);
  assert.deepEqual(page[`source${index}`].history,[observedEntry],
    "returned observations must not mutate the selected page history");

  const payload={index,nested:{value:`value_${index}`}};
  const pushed=pushProjectEvent(state.project,page,`event_${index}`,payload);
  assert.equal(pushed.pushed,true);
  assert.deepEqual(sent,[[`event_${index}`,payload]]);
  assert.deepEqual(page[`source${index}`].history,[observedEntry]);
  assert.deepEqual(page[`other${index}`].history,[wrongEntry]);
  sent[0][1].nested.value="changed";
  assert.equal(payload.nested.value,`value_${index}`,
    "pushed payloads must be isolated from their source values");
}

for(const invalidPath of [""," ","__proto__.polluted","constructor.prototype","prototype.value",".history","source..history"]){
  const state=configureProjectEventTransport(base,{observationHistoryPath:invalidPath,defaultPushPath:invalidPath});
  const page={source:{history:[]},destination:[]};
  assert.deepEqual(observeProjectHistory(state.project,page),{status:"Waiting for observation path",entries:[]});
  assert.equal(pushProjectEvent(state.project,page,"event",{}).pushed,false);
  assert.deepEqual(page,{source:{history:[]},destination:[]});
}

const returned=projectEventTransport(base.project);
returned.observationHistoryPath="mutated";
assert.notEqual(projectEventTransport(base.project).observationHistoryPath,"mutated");
assert.equal(seedLibraryDestination(undefined),"");

console.log("Project event transport property tests passed");
