import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {planVerification} from "../scripts/verification-packs.mjs";

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
import {flowPanClickSuppression,flowPanStartAllowed,flowPanToPinch} from "../dist/flow-graph/workspace-camera-ui.js";
import {FLOW_SECTION_ACTION_LABELS,flowSectionMenuRequest} from "../dist/flow-graph/workspace-section-ui.js";
import {sectionBoundsAfterKeyboardInput} from "../dist/flow-graph/workspace-section-geometry.js";
import {flowSelectionContains,primaryFlowSelection,selectionAfterActivation,selectionAfterRemoval} from "../dist/flow-graph/workspace-selection.js";
import {FLOW_PORT_SNAP_RADIUS,flowPointerSnapTarget,flowPortSnapTarget} from "../dist/flow-graph/relationship-port-snap.js";
import {createDurablePersistenceReadiness} from "../dist/durable-project/persistence-readiness.js";

const persistenceStatuses=[];
let releaseSettlement;
const pendingSettlement=new Promise((resolve)=>{releaseSettlement=resolve;});
const persistenceReadiness=createDurablePersistenceReadiness((status)=>persistenceStatuses.push(status),()=>pendingSettlement);
persistenceReadiness.saving();
persistenceReadiness.saved();
persistenceReadiness.saving();
releaseSettlement();
await Promise.resolve();
await Promise.resolve();
assert.deepEqual(persistenceStatuses,["saving","saving"],"an older save completion cannot advertise a settled reload boundary while a newer command is pending");
const settledStatuses=[];
const settledReadiness=createDurablePersistenceReadiness((status)=>settledStatuses.push(status),async()=>{});
settledReadiness.saving();
await settledReadiness.saved();
assert.deepEqual(settledStatuses,["saving","settled"],"the reload boundary becomes settled only after the durable queue and projection finish");

const initial=initialFlowWorkspaceView();
assert.deepEqual(initial,{camera:{x:0,y:0,zoom:1},cameraInitialized:false,surface:undefined,minimap:false,focusCanvas:false,navigationVisible:true});
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
const scheduled=[];
const clickSuppression=flowPanClickSuppression((callback)=>scheduled.push(callback));
clickSuppression.moved();
clickSuppression.finished();
assert.equal(clickSuppression.consume(),true,"a native click after pointerup remains suppressed");
assert.equal(clickSuppression.consume(),false,"only the click belonging to the completed drag is suppressed");
clickSuppression.moved();
clickSuppression.finished();
scheduled.at(-1)();
assert.equal(clickSuppression.consume(),false,"a drag without a native click clears suppression at the next task boundary");
const releasedPointers=[];
clickSuppression.moved();
assert.equal(flowPanToPinch(17,clickSuppression,(pointerId)=>releasedPointers.push(pointerId)),undefined);
assert.deepEqual(releasedPointers,[17],"transitioning a one-contact drag to a pinch releases its pointer lifecycle");
assert.equal(clickSuppression.consume(),false,"transitioning a moved one-contact drag to a pinch cancels pending click suppression");
assert.deepEqual(clientPointToFlowPoint({left:20,top:10,width:400,height:200},{x:100,y:50,zoom:2},{x:220,y:110}),{x:200,y:100});
assert.deepEqual(cameraFromMinimapPoint({x:0,y:0,width:2000,height:1000},{width:500,height:250},{x:.75,y:.25},.5),{x:1000,y:0,zoom:.5},"minimap navigation centers the chosen normalized world point");

assert.deepEqual(sectionBoundsFromDrag({x:420,y:300},{x:120,y:80},40),{x:120,y:80,width:300,height:220},"Section drawing works in every pointer direction");
assert.deepEqual(boundsAroundItems([{x:100,y:80,width:220,height:140},{x:420,y:240,width:180,height:120}],24),{x:76,y:56,width:548,height:328});
assert.deepEqual(transformedFlowBounds({x:10,y:20,width:100,height:50},{translateX:300,translateY:200}),{x:310,y:220,width:100,height:50},"Fit bounds include each rendered transform");

assert.deepEqual(relationshipDropTarget("right",{x:640,y:220}),{position:{x:640,y:220},targetPort:"left",kind:"expected_next"});
assert.deepEqual(relationshipDropTarget("top",{x:320,y:40}),{position:{x:320,y:40},targetPort:"bottom",kind:"alternative"});
assert.deepEqual(relationshipDropTarget("bottom",{x:320,y:640}),{position:{x:320,y:640},targetPort:"top",kind:"merge"});
assert.equal(relationshipDropTarget("left",{x:0,y:0}),undefined,"left is not a valid documentary source port");

const snapCandidates=[
  {endpointId:"page:payment",port:"left",center:{x:100,y:100},presentationOrder:1},
  {endpointId:"page:summary",port:"left",center:{x:140,y:100},presentationOrder:2},
];
assert.equal(FLOW_PORT_SNAP_RADIUS,24,"relationship ports use the approved screen-space snap radius");
assert.equal(flowPortSnapTarget({x:124,y:100},snapCandidates.slice(0,1))?.endpointId,"page:payment","the inclusive 24 CSS-pixel halo acquires its port");
assert.equal(flowPortSnapTarget({x:125,y:100},snapCandidates.slice(0,1)),undefined,"25 CSS pixels stays outside every port halo");
assert.equal(flowPortSnapTarget({x:120,y:100},snapCandidates)?.endpointId,"page:summary","frontmost presentation order breaks an exact distance tie");
assert.equal(flowPortSnapTarget({x:100,y:100},snapCandidates.filter(({endpointId})=>endpointId!=="page:payment")),undefined,"caller-filtered source and incompatible ports cannot become snap targets");
const paymentSnap=flowPortSnapTarget({x:116,y:100},snapCandidates.slice(0,1));
assert.equal(flowPointerSnapTarget({sourceId:"page:customer",compatibleSide:"left",direct:{kind:"page",endpointId:"page:payment"},snap:paymentSnap})?.endpointId,"page:payment","a target Page-body hit inside its compatible port halo acquires that port");
assert.equal(flowPointerSnapTarget({sourceId:"page:customer",compatibleSide:"left",direct:{kind:"page",endpointId:"page:payment"},snap:undefined}),undefined,"a target Page body outside every compatible halo stays invalid");
assert.equal(flowPointerSnapTarget({sourceId:"page:customer",compatibleSide:"left",direct:{kind:"page",endpointId:"page:customer"},snap:paymentSnap}),undefined,"the source Page stays invalid even when another halo overlaps it");
assert.equal(flowPointerSnapTarget({sourceId:"page:customer",compatibleSide:"left",direct:{kind:"event",endpointId:"event:payment"},snap:paymentSnap}),undefined,"an Event mini-card stays directly invalid inside an overlapping halo");
assert.equal(flowPointerSnapTarget({sourceId:"page:customer",compatibleSide:"left",direct:{kind:"port",endpointId:"page:payment",port:"right"},snap:paymentSnap}),undefined,"an incompatible Page port stays directly invalid inside an overlapping halo");
assert.equal(flowPointerSnapTarget({sourceId:"page:customer",compatibleSide:"left",direct:{kind:"port",endpointId:"page:payment",port:"left"},snap:paymentSnap})?.endpointId,"page:payment","the exact compatible port remains acquirable");

const plannerPack=(id,overrides={})=>({id,source:[`src/${id}/`],process:[],globalImpact:[],dependencies:[],sharedComponents:[],verificationInputs:[],runtimeInputs:[],unit:[`test/${id}.mjs`],property:[],features:[],handlers:[],browserAdapters:[],browserAdapterModes:[],browserObservations:[],checkpointCommands:[],...overrides});
const formerFlowPack=plannerPack("flow_graph",{source:["src/data-layer-flow-graph-ui.ts"],impactBoundaries:[{id:"flow_graph_semantic_model",prefixes:["src/data-layer-flow-graph-ui.ts"],propagateDependants:true}]}),
  currentFlowPack=plannerPack("flow_graph",{source:["src/data-layer-flow-graph-ui.ts"],impactBoundaries:[{id:"flow_workspace_relationship_port_snap",prefixes:["src/data-layer-flow-graph-ui.ts"],propagateDependants:false}]}),
  consumerPack=plannerPack("flow_consumer",{dependencies:["flow_graph"]}),
  transitionPath="src/data-layer-flow-graph-ui.ts",
  transitionChangeSet={version:1,baseCommit:"1".repeat(40),commit:"2".repeat(40),paths:[transitionPath],entries:[{status:"M",path:transitionPath}]},
  transitionPlan=planVerification([currentFlowPack,consumerPack],{packIds:["flow_graph"],changedPaths:[transitionPath],changeSet:transitionChangeSet,basePacks:[formerFlowPack,consumerPack]});
assert.deepEqual(transitionPlan.packIds,["flow_graph"],"the named Flow snap boundary supersedes its broader historical UI classification without selecting dependants");
assert.equal(transitionPlan.changedBoundaries[transitionPath],"flow_workspace_relationship_port_snap");

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
assert.deepEqual(FLOW_SECTION_ACTION_LABELS,["Rename","Move","Resize","Wrap selection","Remove Section","Remove with contents"],"the Section context menu exposes the complete existing action set");
assert.deepEqual(flowSectionMenuRequest({type:"contextmenu",clientX:420,clientY:240}),{clientPosition:{x:420,y:240}},"a secondary pointer action places the Section menu at its invocation point");
assert.deepEqual(flowSectionMenuRequest({type:"keydown",key:"ContextMenu",shiftKey:false}),{},"the dedicated keyboard context-menu command opens the focused Section menu");
assert.deepEqual(flowSectionMenuRequest({type:"keydown",key:"F10",shiftKey:true}),{},"Shift+F10 opens the focused Section menu");
assert.equal(flowSectionMenuRequest({type:"keydown",key:"F10",shiftKey:false}),undefined,"plain F10 does not open the Section menu");
assert.equal(flowSectionMenuRequest({type:"keydown",key:"Enter",shiftKey:false}),undefined,"ordinary Section activation remains distinct from its context menu");

const flowCss=[
  await readFile(new URL("../src/flow-graph/flow-workspace.css",import.meta.url),"utf8"),
  await readFile(new URL("../src/flow-graph/flow-workspace-shell.css",import.meta.url),"utf8"),
].join("\n");
const flowWorkspaceUi=await readFile(new URL("../src/flow-graph/workspace-ui.ts",import.meta.url),"utf8");
const flowGraphUi=await readFile(new URL("../src/data-layer-flow-graph-ui.ts",import.meta.url),"utf8");
const sidePanelSource=await readFile(new URL("../src/side-panel.ts",import.meta.url),"utf8");
const flowGraphStepsSource=await readFile(new URL("../acceptance/src/acceptance/steps/flow_graph.clj",import.meta.url),"utf8");
const flowBrowserEvidence=await readFile(new URL("./browser-packs/flow-graph.mjs",import.meta.url),"utf8");
const flowCorrectionEvidence=await readFile(new URL("./support/flow-r02-correction-evidence.mjs",import.meta.url),"utf8");
assert.match(flowCss,/#workspace-pane:has\(\.documentary-flow\[data-canvas-first-r02="true"\]\)[^{]*\{[^}]*display:\s*grid[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\)[^}]*overflow:\s*hidden/su,"the active Flow allocates a shared-chrome row and an explicit remaining route row");
assert.match(flowCss,/#workspace-content\s*\{[^}]*display:\s*grid[^}]*grid-template-rows:\s*minmax\(0, 1fr\)/su,"the Flow host gives its documentary workspace a definite remaining-height grid area");
assert.match(flowCss,/#project-workspace:not\(\[hidden\]\):has\(\.documentary-flow\[data-canvas-first-r02="true"\]\):has\(> nav\[hidden\]\)\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)\s+clamp\(16rem, 20vw, 21rem\)/su,"hidden Flow navigation releases its desktop grid track while the Inspector is open");
assert.match(flowCss,/#project-workspace\[data-inspector-open="false"\]:has\(\.documentary-flow\[data-canvas-first-r02="true"\]\):has\(> nav\[hidden\]\)\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/su,"hidden Flow navigation releases its desktop grid track while the Inspector is closed");
assert.match(flowCss,/#project-workspace:has\(\.documentary-flow\[data-canvas-first-r02="true"\]\) > #workspace-pane\s*\{[^}]*grid-column:\s*2/su,"the ordinary Flow workspace has explicit desktop grid placement");
assert.match(flowCss,/#project-workspace:has\(\.documentary-flow\[data-canvas-first-r02="true"\]\):has\(> nav\[hidden\]\) > #workspace-pane\s*\{[^}]*grid-column:\s*1/su,"the Flow workspace moves into the released navigation track");
assert.match(flowCss,/\.documentary-flow\[data-canvas-first-r02="true"\][^{]*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*display:\s*flex[^}]*flex-direction:\s*column[^}]*block-size:\s*100%/su,"the ordinary Flow fills its explicit remaining route instead of escaping beneath shared chrome");
assert.match(flowCss,/body\.flow-focus-canvas \.documentary-flow\[data-canvas-first-r02="true"\][^{]*\{[^}]*position:\s*fixed[^}]*inset:\s*0[^}]*block-size:\s*100dvh/su,"Focus Canvas covers the complete browser viewport");
assert.match(flowCss,/body\.flow-focus-canvas \.documentary-flow\[data-canvas-first-r02="true"\] \.flow-workspace-toolbar\s*\{[^}]*box-sizing:\s*border-box[^}]*max-inline-size:\s*calc\(100dvw - 1rem\)[^}]*flex-wrap:\s*wrap[^}]*overflow-x:\s*visible/su,"the 360px Focus Canvas toolbar wraps every control inside its viewport overlay without horizontal discovery");
assert.match(flowWorkspaceUi,/toolbar\.append\(skip, navigationToggle, add, focusCanvas, \.\.\.cameraUi\.controls, outlineButton, details, tidy, minimapToggle\)/u,"Add and the Focus Canvas entry precede secondary tools while camera controls stay immediately available");
assert.doesNotMatch(flowCss,/^\.twatility-studio \.flow-canvas-viewport\s*\{[^}]*(?:max-block-size|aspect-ratio|block-size:\s*min\()/msu,"the ordinary canvas viewport has no fixed, maximum, or aspect-ratio height cap");
assert.doesNotMatch(flowCss,/\.documentary-flow\[data-canvas-first-r02="true"\][^{]*\.flow-canvas-viewport\s*\{[^}]*block-size:\s*(?:clamp|min|max)\(/su,"later branding rules cannot restore a capped Flow canvas track");
assert.match(flowGraphUi,/function emphasizeCompatiblePort\([^)]*\).*classList\.add\("is-valid-target"\)/su,"an acquired root-level relationship port exposes semantic state to Flow-local presentation");
assert.doesNotMatch(flowGraphUi,/function emphasizeCompatiblePort\([^)]*\)[^{]*\{[^}]*\.style\./su,"compatible-port presentation is not owned by inline script");
assert.match(flowCss,/\.documentary-flow circle\[data-flow-port-for\]\.is-valid-target\s*\{[^}]*fill:\s*#[0-9a-f]+[^}]*stroke:\s*#[0-9a-f]+[^}]*stroke-width:\s*5/su,"Flow-local CSS gives the acquired root-level port a non-color shape-weight change");
const connectionStart=flowGraphUi.indexOf("const beginPortConnection="),
  connectingLayout=flowGraphUi.indexOf('canvasScroll.classList.add("is-connecting")',connectionStart),
  sourcePortFocus=flowGraphUi.indexOf("port.focus()",connectionStart);
assert.ok(connectionStart>=0&&connectingLayout>connectionStart&&connectingLayout<sourcePortFocus,
  "connection layout settles on port-down before focus or target halo measurement");
assert.match(flowGraphUi,/flowPointerSnapTarget\(\{sourceId:connection\.sourceId,compatibleSide,direct:directFlowSnapTarget\(direct\),snap:compatiblePortSnap/u,"installed pointer targeting delegates Page-body precedence to the bounded snap contract");
assert.ok(sidePanelSource.indexOf("mountUtilityShell(extensionShell, panelRoot, window)")<sidePanelSource.indexOf("await openDurableProjectRuntime(globalThis.localStorage)"),"the utility Shell becomes ready before the unrelated durable project repository opens");

if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),
    normalized=(value)=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
      ?Object.fromEntries(Object.entries(value).filter(([,nested])=>nested!==undefined)
        .sort(([left],[right])=>left.localeCompare(right)).map(([key,nested])=>[key,normalized(nested)]))
      :value,
    digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex"),
    shellReadiness=context.diagnosedBoundary?.taskKey==="browser:test/browser-packs/shell.mjs",
    flow019Allowlist=context.causalCategory==="other:mode-aware Flow 019 example allowlist",
    readiness=!shellReadiness&&context.causalCategory==="readiness or settling",
    zoomContainment=context.incidentId==="d3a49b37-e016-4bed-830c-9531045a6773",
    expectedPreRepairFailure=flow019Allowlist
      ?{modelSelectionAccepted:true,runtimeSelectionAccepted:false,modeSeparated:false}
      :shellReadiness
      ?{repositoryOpening:true,shellReady:false}
      :readiness
      ?{routeRestored:true,paintedInstanceSelected:false}
      :zoomContainment
        ?{zoomInContained:false,toolbarWrapped:false,cameraControlsImmediatelyAvailable:false}
        :{entryControlContained:false,focusToolbarWrapped:false,requiredControlsPrecedeSecondary:false},
    expectedRepairResult=flow019Allowlist
      ?{modelSelectionAccepted:true,runtimeSelectionAccepted:true,modeSeparated:true}
      :shellReadiness
      ?{repositoryOpening:true,shellReady:true}
      :readiness
      ?{routeRestored:true,paintedInstanceSelected:true}
      :zoomContainment
        ?{zoomInContained:true,toolbarWrapped:true,cameraControlsImmediatelyAvailable:true}
        :{entryControlContained:true,focusToolbarWrapped:true,requiredControlsPrecedeSecondary:true},
    fixture={id:flow019Allowlist?"mode-aware-flow019-example-allowlist-v1":shellReadiness?"shell-readiness-before-repository-v1":readiness?"flow-pan-painted-instance-readiness-v1":zoomContainment
      ?"zoom-in-360-control-containment-v1":"focus-canvas-360-control-containment-v1",
      causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:flow019Allowlist
        ?{modelRow:{scope:"the selection",arrangement:"horizontally"},runtimeRow:{scope:"selection",arrangement:"horizontally"}}
        :shellReadiness
        ?{preRepair:{shellMount:"after durable repository await",repositoryOpening:true}}
        :readiness
        ?{preRepair:{historicalCanvas:{width:0,height:0},liveCanvas:{width:360,height:800},selection:"first DOM match"}}
        :zoomContainment
          ?{viewport:{width:360,height:800},preRepair:{zoomIn:{x:480.859375,width:61.015625},toolbar:{left:0,right:360},scrollLeft:0}}
          :{viewport:{width:360,height:800},preRepair:{focusControl:{x:424.4375,width:88.765625},toolbar:{left:0,right:360},horizontalDiscoveryRequired:true}},
      expectedPreRepairFailure,expectedRepairResult},
    repairResult=flow019Allowlist?{
      modelSelectionAccepted:/\[:model \["the selection" "horizontally"\]\]/u.test(flowGraphStepsSource),
      runtimeSelectionAccepted:/\[:runtime \["selection" "horizontally"\]\]/u.test(flowGraphStepsSource),
      modeSeparated:/key \[mode row\]/u.test(flowGraphStepsSource),
    }:shellReadiness?{
      repositoryOpening:sidePanelSource.includes("await openDurableProjectRuntime(globalThis.localStorage)"),
      shellReady:sidePanelSource.indexOf("mountUtilityShell(extensionShell, panelRoot, window)")<sidePanelSource.indexOf("await openDurableProjectRuntime(globalThis.localStorage)"),
    }:readiness?{
      routeRestored:/ensureFlowPanWorkspace/u.test(flowBrowserEvidence),
      paintedInstanceSelected:/painted=\(s\)=>all\(s\)\.find/u.test(flowCorrectionEvidence)&&/const painted=\(selector\)=>\[\.\.\.document\.querySelectorAll\(selector\)\]\.find/u.test(flowBrowserEvidence),
    }:zoomContainment?{
      zoomInContained:/max-inline-size:\s*calc\(100dvw - 1rem\)[^}]*flex-wrap:\s*wrap[^}]*overflow-x:\s*visible/su.test(flowCss),
      toolbarWrapped:/flex-wrap:\s*wrap/su.test(flowCss),
      cameraControlsImmediatelyAvailable:/add, focusCanvas, \.\.\.cameraUi\.controls, outlineButton/u.test(flowWorkspaceUi),
    }:{
      entryControlContained:/toolbar\.append\(skip, navigationToggle, add, focusCanvas/u.test(flowWorkspaceUi),
      focusToolbarWrapped:/max-inline-size:\s*calc\(100dvw - 1rem\)[^}]*flex-wrap:\s*wrap[^}]*overflow-x:\s*visible/su.test(flowCss),
      requiredControlsPrecedeSecondary:/add, focusCanvas, \.\.\.cameraUi\.controls, outlineButton, details, tidy/u.test(flowWorkspaceUi),
    },fixtureDigest=digest(fixture);
  assert.deepEqual(repairResult,expectedRepairResult);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}}}));
}

console.log("data-layer Flow workspace tests passed");
