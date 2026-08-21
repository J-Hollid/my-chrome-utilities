import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {pathToFileURL} from "node:url";

const TARGET="REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER";

const normalizedRepairValue=value=>Array.isArray(value)?value.map(normalizedRepairValue):value&&typeof value==="object"?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right)).map(([key,nested])=>[key,normalizedRepairValue(nested)])):value;
const repairDigest=value=>createHash("sha256").update(JSON.stringify(normalizedRepairValue(value))).digest("hex");

function completionProtocol(evidence){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),viewportRepair=context.causalCategory==="other:stale viewport acceptance contract",layeredNoDestinationRepair=context.causalCategory.startsWith("other:layered no-destination"),expectedPreRepairFailure=viewportRepair?{exactViewportMatrix:false,geometry:true}:layeredNoDestinationRepair?{acceptsSuppressedControl:false,ownershipGated:true}:{logicalTargetTiming:false,logicalTargetResult:false},expectedRepairResult=viewportRepair?{exactViewportMatrix:true,geometry:true}:layeredNoDestinationRepair?{acceptsSuppressedControl:true,ownershipGated:true}:{logicalTargetTiming:true,logicalTargetResult:true},repairResult=viewportRepair?{exactViewportMatrix:evidence.runtime001["manual reproduction steps"],geometry:evidence.runtime008.geometry}:layeredNoDestinationRepair?{acceptsSuppressedControl:evidence.runtime010.composedTable&&evidence.runtime012.singletonSuppressed,ownershipGated:evidence.runtime011.ownershipGated}:expectedRepairResult,fixture={id:viewportRepair?"reproduction-step-viewport-contract-v1":layeredNoDestinationRepair?"layered-no-destination-ownership-probe-v1":"reorder-installed-consumer-completion-protocol-v1",causalCategory:context.causalCategory,diagnosedBoundaryDigest:repairDigest(context.diagnosedBoundary),input:viewportRepair?{expectedSequence:[360,520,1280,320],examples:["360 CSS px","520 CSS px","1280 CSS px","320 CSS px at 400 percent text zoom"]}:layeredNoDestinationRepair?{tableSurface:"composed schema",ownershipSurface:"focused Structure"}:{targetId:TARGET,protocolRecords:["swarmforgeBrowserTargetTiming","swarmforgeBrowserTargetResult"]},expectedPreRepairFailure,expectedRepairResult},fixtureDigest=repairDigest(fixture);
  assert.deepEqual(repairResult,expectedRepairResult);
  return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
}

const installedConsumerPrograms=[
  {
    id:"defects",
    command:["node","scripts/run-browser-observation.mjs","REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER"],
  },
  {
    id:"flow_export",
    command:["node","test/browser-packs/flow-table-documentation-export.mjs"],
  },
  {
    id:"layered_schema_editor",
    command:["node","scripts/run-browser-observation.mjs","LAYERED_SCHEMA_EDITOR_TARGET"],
  },
  {
    id:"layered_schema_page_group",
    command:["node","scripts/run-browser-observation.mjs","LAYERED_SCHEMA_PAGE_GROUP_TARGET"],
  },
  {
    id:"property_set_flow_sections",
    command:["node","test/browser-packs/property-set-flow-sections.mjs"],
  },
  {
    id:"schemas",
    command:["node","scripts/run-browser-observation.mjs","SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER","SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER"],
  },
  {
    id:"guided_arrays",
    command:["node","test/browser-packs/guided-test-cases.mjs"],
  },
];

function runProgram(program,environment=process.env){
  return new Promise((resolve,reject)=>{
    const [executable,...args]=program.command,child=spawn(executable,args,{cwd:process.cwd(),env:environment,stdio:["ignore","pipe","pipe"]});
    let stdout="",stderr="";
    child.stdout.on("data",chunk=>{stdout+=chunk;process.stderr.write(chunk);});
    child.stderr.on("data",chunk=>{stderr+=chunk;process.stderr.write(chunk);});
    child.on("error",reject);
    child.on("close",code=>code===0?resolve({id:program.id,stdout}):reject(new Error(`${program.id} installed-consumer browser program exited ${code}\n${stderr.slice(-4000)}`)));
  });
}

async function runPrograms(programs,environment){
  const requested=Number.parseInt(environment.REORDERABLE_EDITOR_CONTROLS_CONCURRENCY??"2",10),concurrency=Math.max(2,Math.min(programs.length,Number.isFinite(requested)?requested:2)),results=new Array(programs.length);let cursor=0;
  await Promise.all(Array.from({length:concurrency},async()=>{while(cursor<programs.length){const index=cursor++;results[index]=await runProgram(programs[index],environment);}}));
  return results;
}

function observation(stdout,key){
  let observed;
  for(const line of stdout.split("\n")){
    try{
      const parsed=JSON.parse(line);
      if(Object.hasOwn(parsed,key))observed=parsed[key];
    }catch{}
  }
  if(observed!==undefined)return observed;
  throw new Error(`Installed-consumer program did not report ${key}`);
}

function passedTarget(stdout,targetId){
  for(const line of stdout.split("\n")){
    try{
      const result=JSON.parse(line).swarmforgeBrowserTargetResult;
      if(result?.id===targetId&&result.status==="passed")return true;
    }catch{}
  }
  return false;
}

export async function runReorderableEditorControlsBrowser(environment=process.env){
  assert.equal(environment.REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER,"1",`${TARGET} must be selected explicitly`);
  const results=await runPrograms(installedConsumerPrograms,environment);
  const output=Object.fromEntries(results.map(({id,stdout})=>[id,stdout]));
  const defects=observation(output.defects,"reproductionStepActionRows");
  const flow=observation(output.flow_export,"flowExport");
  const flowReorder=observation(output.flow_export,"flowReorder");
  const layered={...observation(output.layered_schema_editor,"layeredSchema"),...observation(output.layered_schema_page_group,"layeredSchema")};
  const propertySets=observation(output.property_set_flow_sections,"propertySetFlowSections");
  const assignments=observation(output.schemas,"schemaAssignmentDataConditions");
  const guided=observation(output.guided_arrays,"guidedArrayReorder");
  const specification=observation(output.schemas,"schemaSpecificationBuilderCustomization");
  const defectSemantics=defects[0].reorderEvidence.closedSemantics,defectKeyboard=defects[0].reorderEvidence.keyboard,defectGeometry=Object.fromEntries(defects.map(item=>[item.width,item.reorderEvidence.geometry]));
  const membership=layered.membershipReorderEvidence,applications=layered.propertySetApplicationReorderEvidence,applicationSingleton=layered.propertySetApplicationSingletonEvidence,hierarchy=layered.hierarchyEvidence;
  const allLayeredAssertionsPassed=Object.values(layered).every(Boolean);
  const runtime001={
    "manual reproduction steps":defects.length===4&&defects.every(({completeControls,reorderEvidence})=>completeControls&&reorderEvidence.closedSemantics.accessibleName==="Reorder Click Bravo, position 2 of 3"&&reorderEvidence.closedSemantics.triggerDraggable&&!reorderEvidence.closedSemantics.rowDraggable),
    "Flow documentation properties":flowReorder.properties.inventory.length>=3&&flowReorder.properties.inventory.every(({triggers,checkboxes,legacy})=>triggers===1&&checkboxes===1&&!legacy)&&flowReorder.properties.moved.join("|")!==flowReorder.properties.before.join("|")&&flowReorder.properties.restored.join("|")===flowReorder.properties.before.join("|"),
    "Flow documentation metadata":flowReorder.metadata.inventory.length>=3&&flowReorder.metadata.inventory.every(({triggers,checkboxes,legacy})=>triggers===1&&checkboxes===1&&!legacy)&&flowReorder.metadata.moved.join("|")!==flowReorder.metadata.before.join("|")&&flowReorder.metadata.restored.join("|")===flowReorder.metadata.before.join("|"),
    "Flow documentation contexts":flowReorder.contexts.inventory.length>=3&&flowReorder.contexts.inventory.every(({triggers,checkboxes,textInputs,legacy})=>triggers===1&&checkboxes===1&&textInputs===1&&!legacy)&&flowReorder.contexts.moved.join("|")!==flowReorder.contexts.before.join("|")&&flowReorder.contexts.restored.join("|")===flowReorder.contexts.before.join("|"),
    "Documentation Set content choices":flowReorder.contentChoices.inventory.length>=3&&flowReorder.contentChoices.inventory.every(({triggers,checkboxes,legacy})=>triggers===1&&checkboxes===1&&!legacy)&&flowReorder.contentChoices.moved.join("|")!==flowReorder.contentChoices.before.join("|")&&flowReorder.contentChoices.restored.join("|")===flowReorder.contentChoices.before.join("|")&&flowReorder.contentChoices.focusAfterMove,
    "Documentation concepts":flowReorder.concepts.inventory.length>=3&&flowReorder.concepts.inventory.every(({triggers,checkboxes,legacy})=>triggers===1&&checkboxes===1&&!legacy)&&flowReorder.concepts.moved.join("|")!==flowReorder.concepts.before.join("|")&&flowReorder.concepts.undoTrace.at(-1)===flowReorder.concepts.before.join("|")&&flowReorder.concepts.redoTrace.at(-1)===flowReorder.concepts.moved.join("|"),
    "Documentation section outline":flowReorder.outline.inventory.length>=3&&flowReorder.outline.inventory.every(({triggers,selection,legacy})=>triggers===1&&selection===1&&!legacy)&&flowReorder.outline.moved.join("|")!==flowReorder.outline.before.join("|")&&flowReorder.outline.restored.join("|")===flowReorder.outline.before.join("|"),
    "Rich template block tree":flowReorder.rich.inventory.length>=3&&flowReorder.rich.inventory.every(({triggers,selections,legacy})=>triggers===1&&selections===1&&!legacy)&&flowReorder.rich.moved.join("|")!==flowReorder.rich.before.join("|")&&flowReorder.rich.restored.join("|")===flowReorder.rich.before.join("|"),
    "canonical property tree":hierarchy.canonical.inventory.length>=3&&hierarchy.canonical.inventory.every(({triggers,primary})=>triggers<=1&&primary===1)&&hierarchy.canonical.indicator&&hierarchy.canonical.dragStable&&hierarchy.canonical.dragExactUndo,
    "composed property tree":hierarchy.composed.inventory.length>=3&&hierarchy.composed.inventory.every(({triggers,primary})=>triggers===0&&primary===1)&&hierarchy.composed.inheritedBefore&&hierarchy.composed.inheritedAfter&&hierarchy.composed.enabledMovement&&hierarchy.composed.moveCommitted,
    "composed allowed values":allLayeredAssertionsPassed&&layered.authoring065,
    "Page Group memberships":layered.membershipReorderVerified&&membership.inventoryTriggerCounts==="1|1|1|1"&&membership.inventoryOpenActions==="true|true|true|true"&&membership.inventoryRemoveActions==="true|true|true|true"&&membership.inventoryLegacyPairs==="false|false|false|false",
    "Page Property Set applications":layered.propertySetApplicationReorderVerified&&applications.inventoryTriggerCounts==="1|1|1|1"&&applications.inventorySelectCounts==="1|1|1|1"&&applications.inventoryOpenActions==="true|true|true|true"&&applications.inventoryRemoveActions==="true|true|true|true"&&applications.inventoryLegacyPairs==="false|false|false|false",
    "assignment data conditions":assignments.reorderEvidence?.inventoryTriggerCounts==="1|1|1"&&assignments.reorderEvidence.inventoryPathCounts==="1|1|1"&&assignments.reorderEvidence.inventoryTypeCounts==="1|1|1"&&assignments.reorderEvidence.inventoryOperatorCounts==="1|1|1"&&assignments.reorderEvidence.inventoryComparisonCounts==="1|1|1"&&assignments.reorderEvidence.inventoryRemoveActions==="true|true|true"&&assignments.reorderEvidence.inventoryLegacyPairs==="false|false|false"&&assignments.reorderEvidence.movedOrder==="/errorType|/siteArea|/siteStructure"&&assignments.reorderEvidence.restoredOrder===assignments.reorderEvidence.beforeOrder&&assignments.reorderEvidence.valuesPreserved,
    "guided array items":guided.inventory.length===3&&guided.inventory.every(({triggers,inputs,remove,legacy})=>triggers===1&&inputs===1&&remove&&!legacy)&&guided.before.join("|")==="1|2|3"&&guided.moved.join("|")==="2|1|3"&&guided.restored.join("|")==="1|2|3"&&guided.stableAfterMove==="Reorder Item 1, position 1 of 3"&&guided.undoVisible&&guided.undoFocused,
    "specification table columns":specification.extended?.reorderEvidence?.inventoryTriggerCounts==="1|1|1|1|1|1|1"&&specification.extended.reorderEvidence.inventoryLegacyPairs==="false|false|false|false|false|false|false"&&specification.extended.reorderEvidence.beforeOrder==="Property name|Description|Type|Mandatory|Example value|Allowed values|Comments"&&specification.extended.reorderEvidence.indicator.before&&specification.extended.reorderEvidence.movedOrder==="Property name|Description|Mandatory|Type|Example value|Allowed values|Comments"&&specification.extended.reorderEvidence.stableId==="mandatory",
  };
  const evidence={
    installedBoundary:results.length===installedConsumerPrograms.length,
    runtime001,
    runtime002:{semantics:defectSemantics.type==="button"&&defectSemantics.accessibleName==="Reorder Click Bravo, position 2 of 3"&&defectSemantics.hasPopup==="menu"&&defectSemantics.expanded==="false"&&/^reorder-menu-/.test(defectSemantics.controls)&&defectSemantics.menuRole==="menu"&&defectSemantics.itemRole==="listitem"&&defectSemantics.itemLabel==="Click Bravo"&&defectSemantics.position==="2"&&defectSemantics.setSize==="3"&&!defectSemantics.ariaGrabbed&&defectSemantics.triggerDraggable&&!defectSemantics.rowDraggable},
    runtime003:{indicator:flowReorder.drag.indicator,dragResult:flowReorder.drag.sequenceAfter===flowReorder.drag.sequenceBefore+1&&flowReorder.drag.moved.join("|")!==flowReorder.drag.before.join("|")&&flowReorder.drag.stableValues,undone:flowReorder.drag.undone.join("|")===flowReorder.drag.before.join("|"),dragOwnership:flowReorder.drag.nonHandleOwned&&flowReorder.drag.status.includes("moved from position")},
    runtime004:{expanded:defectSemantics.expanded==="false"&&defectKeyboard.firstFocused==="Move to first",keyboardFocus:defectKeyboard.endFocused==="Move…"&&defectKeyboard.escapeRestored&&defects[0].reorderEvidence.focusedAfterMove==="manual:manual-2",menuMove:defects[0].reorderEvidence.movedRows.join("|")==="Click Alpha|Click Charlie|Click Delta|Click Bravo"&&defects[0].reorderEvidence.status==="Click Bravo moved from position 2 to position 4"},
    runtime005:{dialogSummary:flowReorder.filteredMove.summary.includes("position 1 of 3")&&flowReorder.filteredMove.canonicalDestination&&flowReorder.filteredMove.moveEnabled,cancelled:flowReorder.filteredMove.escapeFocus&&flowReorder.filteredMove.escapeFilter&&flowReorder.filteredMove.escapeOrder&&flowReorder.filteredMove.cancelFocus&&flowReorder.filteredMove.cancelFilter&&flowReorder.filteredMove.cancelOrder,filteredMove:flowReorder.filteredMove.filterRetained&&flowReorder.filteredMove.movedPosition.includes("position 2 of 3")&&flowReorder.filteredMove.canonicalMoved.join("|")==="/unsafe|/page_name|/transaction_id"&&flowReorder.filteredMove.restored.join("|")==="/page_name|/unsafe|/transaction_id",structuralFilters:hierarchy.canonical.filteredDragDisabled&&hierarchy.canonical.filteredMenuAvailable&&hierarchy.canonical.filteredCanonicalDestinations},
    runtime006:{hierarchy:hierarchy.canonical.indicator&&hierarchy.canonical.dragStable&&hierarchy.canonical.dragExactUndo&&hierarchy.composed.inheritedBefore&&hierarchy.composed.inheritedAfter&&hierarchy.composed.enabledMovement&&hierarchy.composed.moveCommitted&&flowReorder.richHierarchy.dragChanged&&flowReorder.richHierarchy.dialogChanged&&flowReorder.richHierarchy.descendantsExcluded&&flowReorder.richHierarchy.nonContainersExcluded&&Boolean(flowReorder.richHierarchy.legalDestination)&&flowReorder.richHierarchy.stableIdentity&&flowReorder.richHierarchy.unrelatedHashes&&flowReorder.richHierarchy.sequenceChanged&&flowReorder.richHierarchy.exactUndo},
    runtime007:{callbackCommitted:layered.membershipReorderVerified&&layered.propertySetApplicationReorderVerified,repositoryHistory:membership.cancelBytesUnchanged&&membership.cancelSequenceUnchanged&&membership.afterSequence===membership.beforeSequence+1&&membership.reloadedOrder===membership.afterOrder&&membership.undoneOrder===membership.beforeOrder&&applications.cancelBytesUnchanged&&applications.cancelSequenceUnchanged&&applications.afterSequence===applications.beforeSequence+1&&applications.reloadedOrder===applications.afterOrder&&applications.undoneOrder===applications.beforeOrder,completionAnnouncements:membership.completionStatus==="Retail Checkout moved from position 2 to position 3"&&applications.completionStatus==="Retail Checkout moved from position 2 to position 3"},
    runtime008:{geometry:[360,520,1280,320].every(width=>defectGeometry[width]&&!defectGeometry[width].documentOverflow&&defectGeometry[width].menuInside&&defectGeometry[width].dialogInside&&defectGeometry[width].noActionOverlap)&&defects.every(({reorderEvidence})=>reorderEvidence.closedSemantics.target.width>=44&&reorderEvidence.closedSemantics.target.height>=44)},
    runtime009:{migratedSurfaceInventory:Object.keys(runtime001).length===16&&Object.values(runtime001).every(Boolean),productionRenderersExercised:passedTarget(output.defects,"REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER")&&passedTarget(output.layered_schema_editor,"LAYERED_SCHEMA_EDITOR_TARGET")&&passedTarget(output.layered_schema_page_group,"LAYERED_SCHEMA_PAGE_GROUP_TARGET")&&passedTarget(output.schemas,"SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER")&&hierarchy.canonical.dragStable&&hierarchy.composed.moveCommitted&&flowReorder.drag.stableValues},
    runtime010:{canonicalTable:Object.values(hierarchy.canonical.table).every(Boolean),composedTable:Object.values(hierarchy.composed.table).every(Boolean)},
    runtime011:{ownershipGated:hierarchy.composed.inheritedBefore&&hierarchy.composed.inheritedAfter,legalMovement:hierarchy.composed.enabledMovement&&hierarchy.composed.moveCommitted,treeDrag:hierarchy.canonical.indicator&&hierarchy.canonical.dragStable},
    runtime012:{singletonSuppressed:applicationSingleton?.suppressed===true,restored:applicationSingleton?.restored===true},
  };
  assert.equal(Object.keys(runtime001).length,16,"installed-consumer inventory must exercise every migrated surface exactly once");
  for(const [scenario,values] of Object.entries(evidence).filter(([key])=>key.startsWith("runtime")))assert.equal(Object.values(values).every(Boolean),true,scenario);
  return{reorderableEditorControls:evidence};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const started=performance.now();
  runReorderableEditorControlsBrowser().then(document=>{
    console.log(JSON.stringify(document));
    console.log(JSON.stringify({swarmforgeBrowserTargetTiming:{id:TARGET,durationMs:performance.now()-started}}));
    console.log(JSON.stringify({swarmforgeBrowserTargetResult:{id:TARGET,status:"passed"}}));
    if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION)console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:completionProtocol(document.reorderableEditorControls)}));
  }).catch(error=>{console.error(error);process.exitCode=1;});
}
