import assert from "node:assert/strict";

import {
  FLOW_MANUAL_ZOOM,
  closeFlowSurface,
  fitFlowBounds,
  flowDetailLevel,
  initialFlowWorkspaceView,
  openFlowSurface,
  relationshipDropTarget,
  tidyFlowItems,
  zoomFlowCamera,
} from "../dist/flow-graph/workspace.js";

const initial=initialFlowWorkspaceView();
assert.deepEqual(initial,{camera:{x:0,y:0,zoom:1},surface:undefined,minimap:false,focusCanvas:false});
assert.deepEqual(openFlowSurface(initial,"add"),{...initial,surface:"add"});
assert.deepEqual(openFlowSurface(openFlowSurface(initial,"outline"),"details"),{...initial,surface:"details"},"only one bounded transient surface is open");
assert.equal(closeFlowSurface(openFlowSurface(initial,"details")).surface,undefined);

assert.deepEqual(FLOW_MANUAL_ZOOM,{minimum:.25,maximum:2});
assert.deepEqual(zoomFlowCamera({x:100,y:60,zoom:1},2,{x:300,y:180}),{x:250,y:150,zoom:2},"zoom remains anchored under the pointer");
assert.equal(zoomFlowCamera({x:0,y:0,zoom:1},8,{x:0,y:0}).zoom,2,"manual zoom is capped at 200 percent");
assert.equal(zoomFlowCamera({x:0,y:0,zoom:1},.01,{x:0,y:0}).zoom,.25,"manual zoom is capped at 25 percent");
assert.equal(flowDetailLevel(.49),"identity");
assert.equal(flowDetailLevel(.5),"events");

assert.deepEqual(fitFlowBounds({x:100,y:50,width:2400,height:1200},{width:600,height:300},24),{x:76,y:26,zoom:.24},"Fit Flow may use a scale below the manual minimum");

assert.deepEqual(relationshipDropTarget("right",{x:640,y:220}),{position:{x:640,y:220},targetPort:"left",kind:"expected_next"});
assert.deepEqual(relationshipDropTarget("top",{x:320,y:40}),{position:{x:320,y:40},targetPort:"bottom",kind:"alternative"});
assert.deepEqual(relationshipDropTarget("bottom",{x:320,y:640}),{position:{x:320,y:640},targetPort:"top",kind:"merge"});
assert.equal(relationshipDropTarget("left",{x:0,y:0}),undefined,"left is not a valid documentary source port");

const items=[
  {id:"page:one",position:{x:80,y:90}},
  {id:"page:two",position:{x:430,y:250}},
  {id:"page:three",position:{x:190,y:420}},
];
assert.deepEqual(tidyFlowItems(items,"horizontal",{x:40,y:60,gap:180}),[
  {id:"page:one",position:{x:40,y:60}},
  {id:"page:two",position:{x:220,y:60}},
  {id:"page:three",position:{x:400,y:60}},
]);
assert.deepEqual(tidyFlowItems(items,"vertical",{x:40,y:60,gap:140}),[
  {id:"page:one",position:{x:40,y:60}},
  {id:"page:two",position:{x:40,y:200}},
  {id:"page:three",position:{x:40,y:340}},
]);
assert.deepEqual(items.map(({position})=>position),[{x:80,y:90},{x:430,y:250},{x:190,y:420}],"Tidy preview does not mutate canonical coordinates");

console.log("data-layer Flow workspace tests passed");
