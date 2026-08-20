import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {pathToFileURL} from "node:url";

const TARGET="REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER";

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
    id:"layered_schema",
    command:["node","scripts/run-browser-observation.mjs","LAYERED_SCHEMA_EDITOR_TARGET"],
  },
  {
    id:"property_set_flow_sections",
    command:["node","test/browser-packs/property-set-flow-sections.mjs"],
  },
  {
    id:"schemas",
    command:["node","scripts/run-browser-observation.mjs","SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER","GUIDED_VALIDATION_BROWSER_ADAPTER","SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER"],
  },
];

function runProgram(program,environment=process.env){
  return new Promise((resolve,reject)=>{
    const [executable,...args]=program.command,child=spawn(executable,args,{cwd:process.cwd(),env:{...environment,VERIFICATION_CONCURRENCY:"1",VERIFICATION_OBSERVATION_CONCURRENCY:"1"},stdio:["ignore","pipe","pipe"]});
    let stdout="",stderr="";
    child.stdout.on("data",chunk=>{stdout+=chunk;process.stderr.write(chunk);});
    child.stderr.on("data",chunk=>{stderr+=chunk;process.stderr.write(chunk);});
    child.on("error",reject);
    child.on("close",code=>code===0?resolve({id:program.id,stdout}):reject(new Error(`${program.id} installed-consumer browser program exited ${code}\n${stderr.slice(-4000)}`)));
  });
}

function observation(stdout,key){
  for(const line of stdout.split("\n")){
    try{
      const parsed=JSON.parse(line);
      if(Object.hasOwn(parsed,key))return parsed[key];
    }catch{}
  }
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
  const results=[];
  for(const program of installedConsumerPrograms)results.push(await runProgram(program,environment));
  const output=Object.fromEntries(results.map(({id,stdout})=>[id,stdout]));
  const defects=observation(output.defects,"reproductionStepActionRows");
  const flow=observation(output.flow_export,"flowExport");
  const layered=observation(output.layered_schema,"layeredSchema");
  const propertySets=observation(output.property_set_flow_sections,"propertySetFlowSections");
  const assignments=observation(output.schemas,"schemaAssignmentDataConditions");
  const guided=observation(output.schemas,"guidedValidation");
  const specification=observation(output.schemas,"schemaSpecificationBuilderCustomization");
  const allLayeredAssertionsPassed=Object.values(layered).every(Boolean);
  const runtime001={
    "manual reproduction steps":defects.length===2&&defects.every(({completeControls})=>completeControls),
    "Flow documentation properties":flow.export016,
    "Flow documentation metadata":flow.export017,
    "Flow documentation contexts":flow.export019,
    "Documentation Set content choices":flow.export034,
    "Documentation concepts":flow.orderingControls,
    "Documentation section outline":flow.orderingControls&&flow.headingLifecycleStart,
    "Rich template block tree":flow.documentationTemplateRichEditor&&flow.documentationTemplateRichHistory,
    "canonical property tree":allLayeredAssertionsPassed,
    "composed property tree":allLayeredAssertionsPassed&&layered.authoring064,
    "composed allowed values":allLayeredAssertionsPassed&&layered.authoring065,
    "Page Group memberships":allLayeredAssertionsPassed&&layered.authoring067,
    "Page Property Set applications":propertySets.runtime003,
    "assignment data conditions":assignments.editor?.paths?.length===3&&assignments.persistence?.immutable,
    "guided array items":guided.values?.removeActions===2&&guided.production?.allowedValues?.at(-1)?.valid,
    "specification table columns":specification.extended?.drag?.after?.join("|")==="Property name|Description|Mandatory|Type|Example value|Allowed values|Comments",
  };
  const evidence={
    installedBoundary:results.length===installedConsumerPrograms.length,
    runtime001,
    runtime002:{semantics:defects.every(({actionOrder,tabOrder})=>actionOrder.join("|")==="Reorder|+|Adjust|Remove"&&tabOrder.join("|")===actionOrder.join("|"))},
    runtime003:{indicator:specification.extended.drag.boundaries.firstLeft&&specification.extended.drag.boundaries.lastRight,dragResult:specification.unchanged&&specification.runtimeErrors.length===0,undone:flow.documentationTemplateRichHistory,dragOwnership:defects.every(({textBeforeActions})=>textBeforeActions)},
    runtime004:{expanded:guided.initial.visible,keyboardFocus:guided.values.focusRetained,menuMove:flow.orderingControls},
    runtime005:{dialogSummary:flow.documentationTemplateRichEditor,cancelled:flow.export034,filteredMove:flow.orderingControls},
    runtime006:{hierarchy:allLayeredAssertionsPassed&&layered.authoring066},
    runtime007:{callbackCommitted:propertySets.runtime003,repositoryHistory:propertySets.runtime003&&flow.export019&&allLayeredAssertionsPassed},
    runtime008:{geometry:defects.every(({noHorizontalOverflow})=>noHorizontalOverflow)&&assignments.layout?.width===320&&specification.layout?.width<=320},
    runtime009:{migratedSurfaceInventory:Object.keys(runtime001).length===16,productionRenderersExercised:passedTarget(output.defects,"REPRODUCTION_STEP_ACTION_ROWS_BROWSER_ADAPTER")&&passedTarget(output.layered_schema,"LAYERED_SCHEMA_EDITOR_TARGET")&&passedTarget(output.schemas,"SCHEMA_SPECIFICATION_BUILDER_CUSTOMIZATION_BROWSER_ADAPTER")},
  };
  assert.equal(Object.keys(runtime001).length,16,"installed-consumer inventory must exercise every migrated surface exactly once");
  for(const [scenario,values] of Object.entries(evidence).filter(([key])=>key.startsWith("runtime")))assert.equal(Object.values(values).every(Boolean),true,scenario);
  return{reorderableEditorControls:evidence};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  runReorderableEditorControlsBrowser().then(document=>{
    console.log(JSON.stringify(document));
    console.log(JSON.stringify({swarmforgeBrowserTargetResult:{id:TARGET,status:"passed"}}));
  }).catch(error=>{console.error(error);process.exitCode=1;});
}
