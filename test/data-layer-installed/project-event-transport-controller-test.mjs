import assert from "node:assert/strict";
const { createProjectEventTransportInstalledController } = await import("../../dist/data-layer-installed/project-event-transport/index.js");
const listeners = new Map();
const input = {value:"",addEventListener:(type,listener)=>listeners.set(type,listener),
  removeEventListener:(type,listener)=>{if(listeners.get(type)===listener)listeners.delete(type);}};
const controller = createProjectEventTransportInstalledController({ root:{querySelector:()=>input},
  loadPaths:()=>({observationPath:"event.history",pushPath:"event.history"}), savePaths:async()=>{},
  settleTransport:async()=>{}, refreshTargetPath:async()=>{}, projectName:()=>"One" });
controller.mount(); controller.mount(); assert.equal(listeners.size, 2);
controller.dispose(); controller.dispose(); assert.equal(listeners.size, 0);
assert.equal(controller.state().observationPath, "event.history");
assert.equal(controller.state().phase, "idle");
