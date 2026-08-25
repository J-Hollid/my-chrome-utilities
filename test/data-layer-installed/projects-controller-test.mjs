import assert from "node:assert/strict";
const { createProjectsInstalledController } = await import("../../dist/data-layer-installed/projects/index.js");
let subscribed = 0, disposed = 0;
const controller = createProjectsInstalledController({ loadProjects:() => [{id:"project:1",name:"One"}],
  activeProjectId:() => "project:1", subscribe:() => { subscribed += 1; return () => { disposed += 1; }; },
  openProject:async()=>{}, navigateToProjectArea() {} });
controller.mount(); controller.mount(); assert.equal(subscribed, 1);
controller.dispose(); controller.dispose(); assert.equal(disposed, 1);
assert.equal(controller.state().activeProjectId, "project:1");
