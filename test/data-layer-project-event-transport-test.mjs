import assert from "node:assert/strict";

import {
  configureProjectEventTransport,
  observeProjectHistory,
  projectEventTransport,
  pushProjectEvent,
  seedLibraryDestination,
} from "../dist/data-layer-project-event-transport.js";
import {
  createSpecificationProject,
  exportSpecificationProjectState,
  stageProjectImport,
} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:transport:${++sequence}`;
const project=(name,observationHistoryPath,defaultPushPath)=>
  configureProjectEventTransport(
    createSpecificationProject({name,site:`${name}.example`,id}),
    {observationHistoryPath,defaultPushPath},
  );

const retail=project("Retail","queue.history","queue");
const trade=project("Trade","event.history","dataLayer");

assert.deepEqual(projectEventTransport(retail.project),{
  observationHistoryPath:"queue.history",
  defaultPushPath:"queue",
});
assert.deepEqual(projectEventTransport(trade.project),{
  observationHistoryPath:"event.history",
  defaultPushPath:"dataLayer",
});
assert.equal(seedLibraryDestination(retail.project),"queue");
assert.equal(seedLibraryDestination(undefined),"");

const retailPage={
  queue:{history:[["existing",{value:1}]],pushes:[],push(value){this.pushes.push(value);}},
  event:{history:[["wrong",{}]]},
};
const observed=observeProjectHistory(retail.project,retailPage);
assert.equal(observed.status,"Observation ready");
assert.deepEqual(observed.entries,[["existing",{value:1}]]);

const pushed=pushProjectEvent(retail.project,retailPage,"purchase",{id:"order-1"});
assert.equal(pushed.status,"Pushed to queue");
assert.deepEqual(retailPage.queue.pushes,[["purchase",{id:"order-1"}]]);
assert.deepEqual(retailPage.queue.history,[["existing",{value:1}]],
  "direct push must not substitute the observation path");

assert.deepEqual(
  observeProjectHistory(
    configureProjectEventTransport(retail,{observationHistoryPath:"missing.path",defaultPushPath:"queue"}).project,
    retailPage,
  ),
  {status:"Waiting for observation path",entries:[]},
);
assert.equal(
  pushProjectEvent(
    configureProjectEventTransport(retail,{observationHistoryPath:"queue.history",defaultPushPath:"queue.value"}).project,
    {queue:{history:[],value:3}},
    "purchase",
    {},
  ).status,
  "Push path is not push-capable",
);

const explicit={destination:"analyticsQueue",payload:{id:"saved"}};
assert.equal(explicit.destination,"analyticsQueue");
assert.equal(
  seedLibraryDestination(
    configureProjectEventTransport(retail,{observationHistoryPath:"queue.history",defaultPushPath:"eventBus"}).project,
  ),
  "eventBus",
);
assert.equal(explicit.destination,"analyticsQueue",
  "changing a project default must not rewrite a global Library event");

const exported=exportSpecificationProjectState(trade);
const imported=stageProjectImport(exported,retail,{projectId:"project:trade-copy"}).state;
assert.deepEqual(projectEventTransport(imported.project),projectEventTransport(trade.project));
assert.deepEqual(projectEventTransport(trade.project),{
  observationHistoryPath:"event.history",
  defaultPushPath:"dataLayer",
});

console.log("Project event transport tests passed");
