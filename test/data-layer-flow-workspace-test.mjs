import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

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
  placeFlowSurface,
  openFlowSurface,
  relationshipDropTarget,
  sectionBoundsFromDrag,
  tidyFlowItems,
  transformedFlowBounds,
  zoomFlowCamera,
} from "../dist/flow-graph/workspace.js";
import {flowOutlineProjection} from "../dist/flow-graph/workspace-outline-model.js";
import {flowPanStartAllowed} from "../dist/flow-graph/workspace-camera-ui.js";
import {sectionBoundsAfterKeyboardInput} from "../dist/flow-graph/workspace-section-geometry.js";
import {flowSelectionContains,primaryFlowSelection,selectionAfterActivation,selectionAfterRemoval} from "../dist/flow-graph/workspace-selection.js";

const initial=initialFlowWorkspaceView();
assert.deepEqual(initial,{camera:{x:0,y:0,zoom:1},cameraInitialized:false,surface:undefined,minimap:false,focusCanvas:false});
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
const extremeFit=fitFlowBounds({x:0,y:0,width:100000,height:100000},{width:360,height:800},24);
assert.ok(extremeFit.zoom>0&&extremeFit.zoom<.25,"Fit Flow keeps an extreme graph camera positive below the manual minimum");
assert.ok(Number.isFinite(360/extremeFit.zoom)&&Number.isFinite(800/extremeFit.zoom),"Fit Flow produces a finite viewBox for extreme graph bounds");
assert.deepEqual(placeFlowSurface({width:360,height:800},{x:350,y:790}),{left:6,top:6,width:348,maxHeight:788},"a near-bottom palette stays fully inside the canvas viewport");
assert.deepEqual(placeFlowSurface({width:1440,height:900},{x:800,y:450}),{left:800,top:450,width:380,maxHeight:444},"a mid-canvas palette uses only the remaining viewport height");
assert.equal(flowWorkspaceKey("project:one","flow:shared"),"project:one\u0000flow:shared");
assert.notEqual(flowWorkspaceKey("project:one","flow:shared"),flowWorkspaceKey("project:two","flow:shared"),"equal Flow IDs in different projects cannot share in-memory view state");
assert.deepEqual(panFlowCamera({x:100,y:60,zoom:2},{x:40,y:-20}),{x:80,y:70,zoom:2},"screen-space camera pan is converted to world-space movement");
assert.equal(flowPanStartAllowed({blank:true,spaceHeld:false,button:0,pointerType:"mouse",authoringActive:false}),true,"an unmodified primary drag pans from unoccupied canvas");
assert.equal(flowPanStartAllowed({blank:false,spaceHeld:true,button:0,pointerType:"mouse",authoringActive:false}),true,"Space plus primary drag pans from a graph item");
assert.equal(flowPanStartAllowed({blank:true,spaceHeld:false,button:1,pointerType:"mouse",authoringActive:false}),true,"middle-button drag pans from unoccupied canvas");
assert.equal(flowPanStartAllowed({blank:true,spaceHeld:false,button:0,pointerType:"touch",authoringActive:false}),true,"one-contact touch pans the canvas");
assert.equal(flowPanStartAllowed({blank:false,spaceHeld:false,button:0,pointerType:"mouse",authoringActive:false}),false,"an ordinary primary drag on an item remains available to graph authoring");
assert.equal(flowPanStartAllowed({blank:true,spaceHeld:false,button:0,pointerType:"mouse",authoringActive:true}),false,"an active authoring tool owns blank-canvas gestures");
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

const firstPage={kind:"page-frame",id:"page:first"},secondPage={kind:"page-frame",id:"page:second"};
let selection=selectionAfterActivation([],firstPage,false);
selection=selectionAfterActivation(selection,secondPage,true);
assert.deepEqual(selection,[firstPage,secondPage],"modifier activation retains both stable Page selections");
assert.equal(primaryFlowSelection(selection),secondPage,"the last activated item owns contextual actions");
assert.equal(flowSelectionContains(selection,firstPage),true);
assert.deepEqual(selectionAfterRemoval(selection,"page:second"),[firstPage],"removing one identity preserves the other selection");
assert.deepEqual(selectionAfterActivation(selection,firstPage,true),[secondPage],"modifier activation toggles an existing identity");

const outlineProjection=flowOutlineProjection({
  sections:[{id:"section:sales"},{id:"section:checkout"}],
  frames:[
    {id:"frame:sales",sectionId:"section:sales"},
    {id:"frame:checkout",sectionId:"section:checkout"},
    {id:"frame:outside"},
  ],
  occurrences:[
    {id:"occurrence:checkout",pageFrameId:"frame:checkout"},
    {id:"occurrence:sales",pageFrameId:"frame:sales"},
  ],
  relationships:[{id:"relationship:route"}],
});
assert.deepEqual(outlineProjection.sections[0].frames[0].occurrenceIds,["occurrence:sales"]);
assert.deepEqual(outlineProjection.sections[1].frames[0].occurrenceIds,["occurrence:checkout"],"Outline nesting follows canonical pageFrameId even if canvas frames overlap");
assert.deepEqual(outlineProjection.outsideFrameIds,["frame:outside"]);
assert.deepEqual(outlineProjection.relationshipIds,["relationship:route"]);

const sectionBounds={x:100,y:80,width:320,height:220};
assert.deepEqual(sectionBoundsAfterKeyboardInput(sectionBounds,"ArrowRight",false),{x:120,y:80,width:320,height:220});
assert.deepEqual(sectionBoundsAfterKeyboardInput(sectionBounds,"ArrowRight",true),{x:100,y:80,width:340,height:220},"Arrow keys on the resize handle resize instead of moving the Section");
assert.deepEqual(sectionBoundsAfterKeyboardInput({x:0,y:0,width:240,height:140},"ArrowLeft",true),{x:0,y:0,width:240,height:140},"keyboard resize respects the minimum Section size");

const flowCss=await readFile(new URL("../specification-builder-brand.css",import.meta.url),"utf8");
assert.match(flowCss,/#workspace-pane:has\(\.documentary-flow\[data-canvas-first-r02="true"\]\)[^{]*\{[^}]*position:\s*relative[^}]*overflow:\s*hidden/su,"the active Flow owns the existing bounded project route");
assert.match(flowCss,/\.documentary-flow\[data-canvas-first-r02="true"\][^{]*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*display:\s*flex[^}]*flex-direction:\s*column[^}]*block-size:\s*100%/su,"the ordinary Flow route allocates only its toolbar and complete remaining viewport height");
assert.match(flowCss,/body\.flow-focus-canvas \.documentary-flow\[data-canvas-first-r02="true"\][^{]*\{[^}]*position:\s*fixed[^}]*inset:\s*0[^}]*block-size:\s*100dvh/su,"Focus Canvas covers the complete browser viewport");
assert.doesNotMatch(flowCss,/^\.twatility-studio \.flow-canvas-viewport\s*\{[^}]*(?:max-block-size|aspect-ratio|block-size:\s*min\()/msu,"the ordinary canvas viewport has no fixed, maximum, or aspect-ratio height cap");
assert.doesNotMatch(flowCss,/\.documentary-flow\[data-canvas-first-r02="true"\][^{]*\.flow-canvas-viewport\s*\{[^}]*block-size:\s*(?:clamp|min|max)\(/su,"later branding rules cannot restore a capped Flow canvas track");

console.log("data-layer Flow workspace tests passed");
