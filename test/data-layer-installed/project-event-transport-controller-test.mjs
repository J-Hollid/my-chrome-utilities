import assert from "node:assert/strict";
import { verifyPreparedInstalledController } from "../support/data-layer-installed-controller-contract.mjs";
await verifyPreparedInstalledController("project-event-transport");
const { createProjectEventTransportInstalledController } = await import("../../dist/data-layer-installed/project-event-transport/index.js");
const listeners = new Map();
const input = {value:"",addEventListener:(type,listener)=>listeners.set(type,listener),
  removeEventListener:(type,listener)=>{if(listeners.get(type)===listener)listeners.delete(type);}};
const controller = createProjectEventTransportInstalledController({ root:{querySelector:()=>input},
  loadPaths:()=>({observationPath:"event.history",pushPath:"event.history"}), savePaths:async()=>{},
  settleTransport:async()=>{}, readTargetObservation:async()=>undefined, applyLiveTargetPathObservation() {},
  renderTargetReadiness() {}, projectName:()=>"One" });
controller.mount(); controller.mount(); assert.equal(listeners.size, 2);
controller.dispose(); controller.dispose(); assert.equal(listeners.size, 0);
assert.equal(controller.state().observationPath, "event.history");
assert.equal(controller.state().phase, "idle");

class Field {
  listeners = new Map(); value = ""; textContent = ""; hidden = false; disabled = false;
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
  dispatch(type) { this.listeners.get(type)?.({ currentTarget:this }); }
}
const elements = new Map([
  ["#history-path", new Field()], ["#default-push-path", new Field()], ["#history-path-display", new Field()],
  ["#history-path-status", new Field()], ["#default-push-path-status", new Field()],
  ["#project-transport-context", new Field()], ["#project-transport-guidance", new Field()],
]);
let applyCount = 0, readinessRenders = 0, releaseObservation;
const targetController = createProjectEventTransportInstalledController({ root:{querySelector:(selector)=>elements.get(selector) ?? null},
  loadPaths:()=>({observationPath:"event.history",pushPath:"dataLayer.push"}), savePaths:async()=>{}, settleTransport:async()=>{},
  readTargetObservation:()=>new Promise((resolve)=>{ releaseObservation=resolve; }),
  applyLiveTargetPathObservation:()=>{applyCount += 1;}, renderTargetReadiness:()=>{readinessRenders += 1;}, projectName:()=>"One" });
targetController.mount();
assert.equal(targetController.state().pathGeneration, 0);
elements.get("#history-path").value = "event.history";
elements.get("#history-path").dispatch("input");
releaseObservation({ pageAccessStatus:"page access available", pageObject:{event:{history:[]}} });
await Promise.resolve(); await Promise.resolve();
assert.equal(targetController.state().currentTargetPathStatus, "Ready");
assert.equal(elements.get("#history-path-status").textContent, "Ready");
assert.equal(applyCount, 1); assert.equal(readinessRenders, 1);

targetController.applyTargetPathObservation({ pageAccessStatus:"page access available",
  historyPath:"event.history", pageObject:{event:{}} });
assert.equal(targetController.state().currentTargetPathStatus, "Waiting for path",
  "the already awaited post-grant observation determines configured-path readiness without another read");
assert.equal(applyCount, 2); assert.equal(readinessRenders, 2);

elements.get("#history-path").value = "event.missing";
elements.get("#history-path").dispatch("input");
assert.equal(targetController.state().pathGeneration, 1,
  "only a configured observation-path edit advances the permission settlement generation");
targetController.dispose();
releaseObservation({ pageAccessStatus:"page access available", pageObject:{event:{}} });
await Promise.resolve(); await Promise.resolve();
assert.equal(applyCount, 2, "a target observation resolving after disposal cannot apply Capture effects");
for (const element of elements.values()) assert.equal(element.listeners.size, 0);
