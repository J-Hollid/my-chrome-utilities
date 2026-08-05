import assert from "node:assert/strict";

import {
  FLOW_MANUAL_ZOOM,
  boundsAroundItems,
  cameraFromMinimapPoint,
  clientPointToFlowPoint,
  closeFlowSurface,
  fitFlowBounds,
  flowDetailLevel,
  flowWorkspaceKey,
  initialFlowWorkspaceView,
  panFlowCamera,
  openFlowSurface,
  relationshipDropTarget,
  sectionBoundsFromDrag,
  tidyFlowItems,
  transformedFlowBounds,
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
assert.equal(flowWorkspaceKey("project:one","flow:shared"),"project:one\u0000flow:shared");
assert.notEqual(flowWorkspaceKey("project:one","flow:shared"),flowWorkspaceKey("project:two","flow:shared"),"equal Flow IDs in different projects cannot share in-memory view state");
assert.deepEqual(panFlowCamera({x:100,y:60,zoom:2},{x:40,y:-20}),{x:80,y:70,zoom:2},"screen-space camera pan is converted to world-space movement");
assert.deepEqual(clientPointToFlowPoint({left:20,top:10,width:400,height:200},{x:100,y:50,zoom:2},{x:220,y:110}),{x:200,y:100});
assert.deepEqual(cameraFromMinimapPoint({x:0,y:0,width:2000,height:1000},{width:500,height:250},{x:.75,y:.25},.5),{x:1000,y:0,zoom:.5},"minimap navigation centers the chosen normalized world point");

assert.deepEqual(sectionBoundsFromDrag({x:420,y:300},{x:120,y:80},40),{x:120,y:80,width:300,height:220},"Section drawing works in every pointer direction");
assert.deepEqual(boundsAroundItems([{x:100,y:80,width:220,height:140},{x:420,y:240,width:180,height:120}],24),{x:76,y:56,width:548,height:328});
assert.deepEqual(transformedFlowBounds({x:10,y:20,width:100,height:50},{translateX:300,translateY:200}),{x:310,y:220,width:100,height:50},"Fit bounds include each rendered transform");

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
  {id:"page:three",position:{x:220,y:60}},
  {id:"page:two",position:{x:400,y:60}},
]);
assert.deepEqual(tidyFlowItems(items,"vertical",{x:40,y:60,gap:140}),[
  {id:"page:one",position:{x:40,y:60}},
  {id:"page:two",position:{x:40,y:200}},
  {id:"page:three",position:{x:40,y:340}},
]);
assert.deepEqual(items.map(({position})=>position),[{x:80,y:90},{x:430,y:250},{x:190,y:420}],"Tidy preview does not mutate canonical coordinates");
assert.deepEqual(tidyFlowItems([items[2],items[0]],"horizontal",{x:40,y:60,gap:180}),[
  {id:"page:one",position:{x:40,y:60}},
  {id:"page:three",position:{x:220,y:60}},
],"Tidy order is stable by current spatial order rather than selection order");

console.log("data-layer Flow workspace tests passed");
