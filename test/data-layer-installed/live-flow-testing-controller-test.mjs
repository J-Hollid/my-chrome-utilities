import assert from "node:assert/strict";
import { verifyPreparedInstalledController } from "../support/data-layer-installed-controller-contract.mjs";
await verifyPreparedInstalledController("live-flow-testing");
const { createLiveFlowTestingInstalledController } = await import("../../dist/data-layer-installed/live-flow-testing/index.js");
let removed = 0;
let reset = 0, opened = 0;
const ui = { open:async()=>{opened+=1;}, refreshProject:async()=>{}, render(){}, renderEventDetails(){},
  reset:()=>{reset+=1;}, attachDefect(){}, run:()=>({history:[{id:"result:1"}]}), summary:()=>({id:"summary:1"}) };
const controller = createLiveFlowTestingInstalledController({ root:{querySelector:()=>null}, activeProject:async()=>undefined,
  events:()=>[], saveSummary(){}, subscribe:() => () => { removed += 1; }, createUi:()=>ui });
controller.mount(); controller.refresh(); await Promise.resolve();
assert.deepEqual(controller.state(), {summary:{id:"summary:1"},result:{id:"result:1"},completed:[{id:"summary:1"}],mounted:true});
await controller.begin(); assert.equal(opened, 1, "Live Flow delegates opening to the real UI capability boundary");
controller.complete({id:"completed:1"});
assert.deepEqual(controller.state().completed, [{id:"completed:1"}], "Live Flow owns completed test evidence");
controller.dispose(); controller.dispose(); assert.equal(removed, 1);
assert.equal(reset, 1, "disposal resets the mounted Live Flow UI exactly once");
assert.deepEqual(controller.state(), {completed:[],mounted:false}, "disposed Live Flow state cannot retain stale UI projections");
