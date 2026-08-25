import assert from "node:assert/strict";
const { createLiveFlowTestingInstalledController } = await import("../../dist/data-layer-installed/live-flow-testing/index.js");
let removed = 0;
const controller = createLiveFlowTestingInstalledController({ beginTest:async()=>{}, currentSummary:()=>({id:"summary:1"}),
  projectEventResult:()=>({id:"result:1"}), openProjectEntity(){}, subscribe:() => () => { removed += 1; } });
controller.mount(); controller.refresh();
assert.deepEqual(controller.state(), {summary:{id:"summary:1"},result:{id:"result:1"},completed:[],mounted:true});
controller.complete({id:"completed:1"});
assert.deepEqual(controller.state().completed, [{id:"completed:1"}], "Live Flow owns completed test evidence");
controller.dispose(); controller.dispose(); assert.equal(removed, 1);
assert.deepEqual(controller.state(), {completed:[{id:"completed:1"}],mounted:false});
