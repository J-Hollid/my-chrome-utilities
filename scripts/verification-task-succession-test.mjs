import assert from "node:assert/strict";
import {mkdir,rm,writeFile} from "node:fs/promises";

import {
  resolveIncidentTaskSuccession,
  resolveTaskSuccessionGraph,
  validateUnresolvedIncidentTaskSuccession,
  taskSuccessionBoundaryDigest,
  verificationTaskDigest,
} from "./verification-task-succession.mjs";
import {planVerification,verificationTaskIdentity} from "./verification-packs.mjs";

const task=(key,extra={})=>({
  key,stage:"unit",packId:"shell",executable:"node",args:[`${key}.mjs`],target:`${key}.mjs`,
  environment:null,requiredCapabilities:[],...extra,
});
const boundary=(id)=>({kind:"task",id,resultSemantics:"pass-or-fail",requiredCapabilities:[],route:"workspace-sandbox"});
const identity=(value)=>[verificationTaskDigest(value),value];
const edge=(id,source,destination,logicalBoundary)=>({
  id,sourceTaskDigest:verificationTaskDigest(source),destinationTaskDigest:verificationTaskDigest(destination),
  logicalSlice:{kind:"task"},conservedBoundaryDigest:taskSuccessionBoundaryDigest(logicalBoundary),
});
const graph=(identities,edges,boundaries)=>({version:1,identities:Object.fromEntries(identities.map(identity)),edges,boundaries});

const renamedSource=task("unit:old-name"),renamedDestination=task("unit:new-name");
const renamedBoundary=boundary("rename-boundary");
const renamedGraph=graph([renamedSource,renamedDestination],
  [edge("rename-v1",renamedSource,renamedDestination,renamedBoundary)],
  Object.fromEntries([renamedSource,renamedDestination].map(value=>[verificationTaskDigest(value),renamedBoundary])));
const renamed=resolveTaskSuccessionGraph({
  graph:renamedGraph,sourceIdentity:renamedSource,currentIdentities:[renamedDestination],logicalSlice:{kind:"task"},
});
assert.equal(renamed.destinationIdentity.key,"unit:new-name");
assert.equal(renamed.chain.length,1);
assert.match(renamed.conservationDigest,/^[a-f0-9]{64}$/u);

const standalone=task("browser-observation:FLOW",{
  stage:"browser-observation",packId:"flow_graph",args:["scripts/run-browser-observation.mjs","FLOW"],
  target:"FLOW",environment:{FLOW:"1"},requiredCapabilities:["local-loopback"],logicalTargetIds:["FLOW"],
});
const batch=task("browser-observation:OTHER+FLOW",{
  stage:"browser-observation",packId:"flow_graph",args:["scripts/run-browser-observation.mjs","OTHER","FLOW"],
  target:"OTHER,FLOW",environment:{OTHER:"1",FLOW:"1"},requiredCapabilities:["local-loopback"],logicalTargetIds:["OTHER","FLOW"],
});
const flowBoundary={kind:"browser-target",targetId:"FLOW",program:"test/browser.mjs",environment:{FLOW:"1"},
  assertionLeaves:["flow.ready"],observationKeys:["flow"],maximumMilliseconds:35000,
  requiredCapabilities:["local-loopback"],route:"scoped-command-approval"};
const batchGraph=graph([standalone,batch],[{
  ...edge("standalone-to-batch-v1",standalone,batch,flowBoundary),logicalSlice:{kind:"browser-target",logicalTargetIds:["FLOW"]},
}],Object.fromEntries([standalone,batch].map(value=>[verificationTaskDigest(value),flowBoundary])));
const mapped=resolveTaskSuccessionGraph({graph:batchGraph,sourceIdentity:standalone,currentIdentities:[batch],
  logicalSlice:{kind:"browser-target",logicalTargetIds:["FLOW"]}});
assert.deepEqual(mapped.execution,{identity:batch,args:["scripts/run-browser-observation.mjs","FLOW"],logicalTargetIds:["FLOW"]});
assert.deepEqual(mapped.logicalSlice,{kind:"browser-target",logicalTargetIds:["FLOW"]});
assert.deepEqual(await validateUnresolvedIncidentTaskSuccession({incidents:[{
  state:"unresolved",failure:{failureClass:"execution-contract-failure",
    task:task("promotion:artifact-binding",{stage:"promotion",executable:"internal",args:[]})},
}],currentIdentities:[batch],currentPacks:[],graph:batchGraph}),[],
"internal promotion execution contracts do not invent registry task succession");
const expandedBatch={...batch,environment:{...batch.environment,FLOW_EVIDENCE_REVISION:"2"}};
await assert.rejects(()=>validateUnresolvedIncidentTaskSuccession({incidents:[{
  state:"unresolved",repair:{status:"eligible"},
  terminalVerificationDeferred:{status:"terminal-verification-deferred"},
  failure:{failureClass:"nonzero-exit",task:batch,
    retryScope:{kind:"target",logicalTargetIds:["FLOW"]}},
}],currentIdentities:[expandedBatch],currentPacks:[],graph:batchGraph,
loadHistoricalPacks:async()=>{throw new Error("missing historical source");},
loadSourceReceipt:async()=>{throw new Error("missing source receipt");}}),
/missing registry history|unverified planner-projection source identity/iu,
"a same-key deferred target without a governed source receipt remains blocking");
const strengthenedBatchGraph=structuredClone(batchGraph);
strengthenedBatchGraph.boundaries[verificationTaskDigest(batch)]={...flowBoundary,
  assertionLeaves:[...flowBoundary.assertionLeaves,"flow.expanded"]};
assert.deepEqual(await validateUnresolvedIncidentTaskSuccession({incidents:[{
  state:"unresolved",repair:{status:"eligible"},
  terminalVerificationDeferred:{status:"terminal-verification-deferred"},
  failure:{failureClass:"nonzero-exit",task:standalone,
    retryScope:{kind:"target",logicalTargetIds:["FLOW"]}},
}],currentIdentities:[batch],currentPacks:[],graph:strengthenedBatchGraph}),[],
"an eligible deferred target remains pending when its unique declared successor adds assertion coverage");
await assert.rejects(()=>validateUnresolvedIncidentTaskSuccession({incidents:[{
  state:"unresolved",repair:{status:"eligible"},
  terminalVerificationDeferred:{status:"terminal-verification-deferred"},
  failure:{failureClass:"nonzero-exit",task:batch,
    retryScope:{kind:"target",logicalTargetIds:["FLOW"]}},
}],currentIdentities:[expandedBatch,{...expandedBatch,environment:{...expandedBatch.environment,variant:"ambiguous"}}],
currentPacks:[],graph:batchGraph}),/registry history|succession/iu,
"ambiguous current target reassessment remains fail closed");
await assert.rejects(()=>validateUnresolvedIncidentTaskSuccession({incidents:[{
  state:"unresolved",repair:{status:"proposed"},
  terminalVerificationDeferred:{status:"terminal-verification-deferred"},
  failure:{failureClass:"nonzero-exit",task:batch,
    retryScope:{kind:"target",logicalTargetIds:["FLOW"]}},
}],currentIdentities:[expandedBatch],currentPacks:[],graph:batchGraph}),/registry history|succession/iu,
"a noneligible repair cannot use deferred focused reassessment");

const projectionPack=(leaves)=>({id:"flow_graph",browserObservations:[{
  id:"FLOW",path:"test/browser.mjs",sessionBatch:"flow",environment:{FLOW:"1"},
  impactBoundaries:["flow"],observationKeys:["flow"],features:["features/flow.feature"],
}],browserEvidencePartitions:[{path:"test/browser.mjs",sessionBatch:"flow",
  targets:[{id:"FLOW",leaves}]}],browserAdapterPerformance:[{
  path:"test/browser.mjs",sessionBatch:"flow",targetIds:["FLOW"],
  maximumSingleTargetP90Milliseconds:35000,
}]});
const batchProjectionPack=(flowLeaves)=>({id:"flow_graph",browserObservations:[
  {id:"OTHER",path:"test/browser.mjs",sessionBatch:"flow",environment:{OTHER:"1"},
    impactBoundaries:["other"],observationKeys:["other"],features:["features/flow.feature"]},
  {id:"FLOW",path:"test/browser.mjs",sessionBatch:"flow",environment:{FLOW:"1"},
    impactBoundaries:["flow"],observationKeys:["flow"],features:["features/flow.feature"]},
],browserEvidencePartitions:[{path:"test/browser.mjs",sessionBatch:"flow",targets:[
  {id:"OTHER",leaves:["other.ready"]},{id:"FLOW",leaves:flowLeaves},
]}],browserAdapterPerformance:[{path:"test/browser.mjs",sessionBatch:"flow",
  targetIds:["OTHER","FLOW"],maximumSingleTargetP90Milliseconds:35000}]});
const projectionReceipt=`tmp/verification-receipts/task-succession-${process.pid}.json`;
await mkdir(new URL("../tmp/verification-receipts/",import.meta.url),{recursive:true});
await writeFile(new URL(`../${projectionReceipt}`,import.meta.url),JSON.stringify({
  candidate:{commit:"historical-commit",tree:"historical-tree"},
  tasks:{[standalone.key]:{identity:standalone,status:"failed"}},
}));
try{
  let sameKeyReceiptLoaded=false,sameKeyHistoryLoaded=false;
  const sameKeyIncident={state:"unresolved",repair:{status:"eligible"},
    terminalVerificationDeferred:{status:"terminal-verification-deferred"},failure:{
      failureClass:"nonzero-exit",task:batch,sourceReceipt:projectionReceipt,
      lineage:{commit:"historical-commit",tree:"historical-tree"},
      retryScope:{kind:"target",logicalTargetIds:["FLOW"]},
    }};
  assert.deepEqual(await validateUnresolvedIncidentTaskSuccession({incidents:[sameKeyIncident],
    currentIdentities:[expandedBatch],currentPacks:[batchProjectionPack(["flow.ready","flow.expanded"])],
    graph:batchGraph,
    loadHistoricalPacks:async()=>{sameKeyHistoryLoaded=true;return[batchProjectionPack(["flow.ready"])];},
    loadSourceReceipt:async()=>{sameKeyReceiptLoaded=true;return{
      candidate:{commit:"historical-commit",tree:"historical-tree"},
      tasks:{[batch.key]:{identity:batch,status:"failed"}},
    };}}),[],
  "a receipt-bound same-key deferred target remains pending only for an expanded verified boundary");
  assert.equal(sameKeyReceiptLoaded&&sameKeyHistoryLoaded,true,
    "same-key deferred projection verifies its governed receipt and historical registry");
  const projectionIncident={state:"unresolved",repair:{status:"eligible"},
    terminalVerificationDeferred:{status:"terminal-verification-deferred"},failure:{
      task:standalone,sourceReceipt:projectionReceipt,
      lineage:{commit:"historical-commit",tree:"historical-tree"},
      retryScope:{kind:"target",logicalTargetIds:["FLOW"]},
    }};
  assert.deepEqual(await validateUnresolvedIncidentTaskSuccession({incidents:[projectionIncident],
    currentIdentities:[batch],currentPacks:[projectionPack(["flow.ready","flow.expanded"])],
    graph:{version:1,identities:{},boundaries:{},edges:[]},
    loadHistoricalPacks:async()=>[projectionPack(["flow.ready"])]}),[],
  "an eligible deferred target remains pending when verified planner projection finds an expanded boundary");
}finally{
  await rm(new URL(`../${projectionReceipt}`,import.meta.url),{force:true});
}

const splitSource=task("unit:combined"),splitOne=task("unit:split-one"),splitTwo=task("unit:split-two");
const splitBoundary=boundary("complete-failed-boundary"),otherBoundary=boundary("unrelated-boundary");
const splitGraph=graph([splitSource,splitOne,splitTwo],[
  edge("unique-split-v1",splitSource,splitOne,splitBoundary),
  edge("other-split-v1",splitSource,splitTwo,otherBoundary),
],{
  [verificationTaskDigest(splitSource)]:splitBoundary,
  [verificationTaskDigest(splitOne)]:splitBoundary,
  [verificationTaskDigest(splitTwo)]:otherBoundary,
});
assert.equal(resolveTaskSuccessionGraph({graph:splitGraph,sourceIdentity:splitSource,currentIdentities:[splitOne,splitTwo],
  logicalSlice:{kind:"task"}}).destinationIdentity.key,"unit:split-one");

assert.throws(()=>resolveTaskSuccessionGraph({graph:{version:1,
  identities:{[verificationTaskDigest(renamedSource)]:renamedSource},edges:[],
  boundaries:{[verificationTaskDigest(renamedSource)]:renamedBoundary}},
  sourceIdentity:renamedSource,currentIdentities:[renamedDestination],logicalSlice:{kind:"task"}}),/undeclared task succession/iu);
const ambiguous={...renamedGraph,edges:[...renamedGraph.edges,{...renamedGraph.edges[0],id:"rename-v2"}]};
assert.throws(()=>resolveTaskSuccessionGraph({graph:ambiguous,sourceIdentity:renamedSource,
  currentIdentities:[renamedDestination],logicalSlice:{kind:"task"}}),/ambiguous task succession/iu);
const cycle={...renamedGraph,edges:[...renamedGraph.edges,edge("cycle-v1",renamedDestination,renamedSource,renamedBoundary)]};
assert.throws(()=>resolveTaskSuccessionGraph({graph:cycle,sourceIdentity:renamedSource,
  currentIdentities:[],logicalSlice:{kind:"task"}}),/cycle/u);
const relaxed=structuredClone(batchGraph);
relaxed.boundaries[verificationTaskDigest(batch)]={...flowBoundary,assertionLeaves:[]};
assert.throws(()=>resolveTaskSuccessionGraph({graph:relaxed,sourceIdentity:standalone,currentIdentities:[batch],
  logicalSlice:{kind:"browser-target",logicalTargetIds:["FLOW"]}}),/conserved boundary/u);
await assert.rejects(()=>resolveIncidentTaskSuccession({incident:{failure:{task:standalone,
  retryScope:{logicalTargetIds:["FLOW"]}}},currentIdentities:[batch],currentPacks:[],graph:batchGraph,
  loadHistoricalPacks:async()=>{throw new Error("history should not be inferred");}}),/registry history/u);

const runtimeFeature="features/data-layer-directional-flow-specification-graph-runtime.feature";
const modelFeature="features/data-layer-directional-flow-specification-graph.feature";
const acceptanceTask=(features)=>({key:"acceptance-session:flow_graph",stage:"acceptance-session",
  packId:"flow_graph",executable:"bb",args:["acceptance-pack-runner","flow_graph",
    ...features.flatMap(feature=>{const basename=feature.slice(feature.lastIndexOf("/")+1)
      .replace(/\.feature$/u,"");const slug=feature.toLowerCase().replace(/[^a-z0-9]+/gu,"-")
      .replace(/(^-+|-+$)/gu,"");return[`build/acceptance/generated/${slug}_acceptance_test.clj`,
        `build/acceptance/ir/${basename}.json`];})],target:features.join(","),environment:null,
  requiredCapabilities:[]});
const runtimeAcceptance=acceptanceTask([runtimeFeature]);
const combinedAcceptance=acceptanceTask([runtimeFeature,modelFeature]);
const acceptanceBoundary=boundary("flow-runtime-acceptance");
const acceptanceGraph=graph([runtimeAcceptance,combinedAcceptance],[{
  ...edge("flow-runtime-to-combined-v1",runtimeAcceptance,combinedAcceptance,acceptanceBoundary),
  sourceRegistryCommit:"historical-flow-registry",
}],Object.fromEntries([runtimeAcceptance,combinedAcceptance]
  .map(value=>[verificationTaskDigest(value),acceptanceBoundary])));
const acceptanceMapped=await resolveIncidentTaskSuccession({incident:{failure:{task:runtimeAcceptance,
  retryScope:{kind:"task"}}},currentIdentities:[combinedAcceptance],currentPacks:[],graph:acceptanceGraph,
  loadHistoricalPacks:async()=>[{id:"flow_graph",features:[modelFeature,runtimeFeature]}]});
assert.equal(acceptanceMapped.destinationIdentity.target,`${runtimeFeature},${modelFeature}`,
  "a receipt-selected acceptance subset can succeed to the registry-declared combined session");

const historicalFlowExportRegistryFeatures=[
  "features/data-layer-flow-table-documentation-export.feature",
  "features/data-layer-flow-table-documentation-export-runtime.feature",
  "features/data-layer-project-documentation-workspace.feature",
  "features/data-layer-project-documentation-workspace-runtime.feature",
];
const documentationTemplateRegistryFeatures=[
  "features/data-layer-documentation-template-library.feature",
  "features/data-layer-documentation-template-library-runtime.feature",
  "features/data-layer-excel-documentation-templates.feature",
  "features/data-layer-excel-documentation-templates-runtime.feature",
  "features/data-layer-rich-page-documentation-templates.feature",
  "features/data-layer-rich-page-documentation-templates-runtime.feature",
];
const flowExportAcceptance=(features)=>({...acceptanceTask(features),key:"acceptance-session:flow_export",
  packId:"flow_export",args:["acceptance-pack-runner","flow_export",
    ...acceptanceTask(features).args.slice(2)]});
const flowExportPack=(features)=>({id:"flow_export",features,
  source:["src/data-layer-project-documentation-workspace-ui.ts"],
  verificationInputs:["test/data-layer-flow-table-documentation-export-test.mjs"]});
const plannedFlowExportAcceptance=(packs)=>verificationTaskIdentity(planVerification(packs,
  {packIds:["flow_export"]}).tasks.find(({key})=>key==="acceptance-session:flow_export"));
const historicalFlowExportPacks=[flowExportPack(historicalFlowExportRegistryFeatures)];
const expandedFlowExportPacks=[flowExportPack([
  ...historicalFlowExportRegistryFeatures,...documentationTemplateRegistryFeatures,
])];
const historicalFlowExport=plannedFlowExportAcceptance(historicalFlowExportPacks);
const expandedFlowExport=plannedFlowExportAcceptance(expandedFlowExportPacks);
const historicalFlowExportFeatures=historicalFlowExport.target.split(",");
const documentationTemplateFeatures=expandedFlowExport.target.split(",")
  .filter(feature=>!historicalFlowExportFeatures.includes(feature));
assert.notDeepEqual(historicalFlowExportRegistryFeatures,historicalFlowExportFeatures,
  "the live registry declaration order differs from the canonical planner order");
const flowExportReceipt={candidate:{commit:"historical-flow-export",tree:"historical-tree"},tasks:{
  [historicalFlowExport.key]:{identity:historicalFlowExport,status:"failed"},
}};
const deferredFlowExportIncident={id:"d723a7c4-1116-4887-b60a-21aded1ab5d8",state:"unresolved",
  repair:{status:"eligible",diagnosedBoundary:{kind:"task",taskKey:historicalFlowExport.key,
    executionArgs:historicalFlowExport.args}},
  terminalVerificationDeferred:{status:"terminal-verification-deferred"},failure:{
    failureClass:"nonzero-exit",task:historicalFlowExport,sourceReceipt:"historical-receipt.json",
    lineage:{commit:"historical-flow-export",tree:"historical-tree"},
    retryScope:{kind:"task",taskKey:historicalFlowExport.key,executionArgs:historicalFlowExport.args},
  }};
const emptySuccessionGraph={version:1,identities:{},boundaries:{},edges:[]};
const validateExpandedFlowExport=(incident=deferredFlowExportIncident,
  currentIdentities=[expandedFlowExport],currentPacks=expandedFlowExportPacks,overrides={})=>
  validateUnresolvedIncidentTaskSuccession({incidents:[incident],currentIdentities,currentPacks,
    graph:emptySuccessionGraph,loadHistoricalPacks:async()=>historicalFlowExportPacks,
    loadSourceReceipt:async()=>flowExportReceipt,...overrides});
const deferredFlowExportBefore=structuredClone(deferredFlowExportIncident);
assert.deepEqual(await validateExpandedFlowExport(),[],
  "a receipt-bound deferred acceptance session remains pending after complete feature pairs are added");
assert.deepEqual(deferredFlowExportIncident,deferredFlowExportBefore,
  "monotonic acceptance-session preflight does not mutate the inherited incident");
await assert.rejects(()=>resolveIncidentTaskSuccession({incident:deferredFlowExportIncident,
  currentIdentities:[expandedFlowExport],currentPacks:expandedFlowExportPacks,
  graph:emptySuccessionGraph,loadHistoricalPacks:async()=>historicalFlowExportPacks,
  loadSourceReceipt:async()=>flowExportReceipt}),/one diagnosed target/iu,
"direct task succession does not infer a mapping from acceptance-session expansion");

const rejectedExpansionCases=[
  ["missing source history",{...deferredFlowExportIncident,failure:{...deferredFlowExportIncident.failure,
    sourceReceipt:undefined}},[expandedFlowExport],expandedFlowExportPacks],
  ["missing registry feature",deferredFlowExportIncident,[expandedFlowExport],[flowExportPack(
    expandedFlowExportPacks[0].features.slice(1))]],
  ["duplicate registry feature",deferredFlowExportIncident,[expandedFlowExport],[flowExportPack([
    ...expandedFlowExportPacks[0].features,expandedFlowExportPacks[0].features[0]])]],
  ["removed historical feature",deferredFlowExportIncident,
    [flowExportAcceptance([...historicalFlowExportFeatures.slice(1),...documentationTemplateFeatures])],
    expandedFlowExportPacks],
  ["replaced historical feature",deferredFlowExportIncident,
    [flowExportAcceptance(["features/replacement.feature",...historicalFlowExportFeatures.slice(1),
      ...documentationTemplateFeatures])],[{id:"flow_export",features:["features/replacement.feature",
      ...historicalFlowExportFeatures.slice(1),...documentationTemplateFeatures]}]],
  ["duplicate historical feature",deferredFlowExportIncident,
    [flowExportAcceptance([...historicalFlowExportFeatures,historicalFlowExportFeatures[0],
      ...documentationTemplateFeatures])],expandedFlowExportPacks],
  ["reordered historical features",deferredFlowExportIncident,
    [flowExportAcceptance([historicalFlowExportFeatures[1],historicalFlowExportFeatures[0],
      ...historicalFlowExportFeatures.slice(2),...documentationTemplateFeatures])],
    [{id:"flow_export",features:[historicalFlowExportFeatures[1],historicalFlowExportFeatures[0],
      ...historicalFlowExportFeatures.slice(2),...documentationTemplateFeatures]}]],
  ["changed executable",deferredFlowExportIncident,[{...expandedFlowExport,executable:"node"}],
    expandedFlowExportPacks],
  ["changed key",deferredFlowExportIncident,[{...expandedFlowExport,key:"acceptance-session:renamed"}],
    expandedFlowExportPacks],
  ["changed stage",deferredFlowExportIncident,[{...expandedFlowExport,stage:"unit"}],
    expandedFlowExportPacks],
  ["changed pack",deferredFlowExportIncident,[{...expandedFlowExport,packId:"other"}],
    expandedFlowExportPacks],
  ["changed runner",deferredFlowExportIncident,[{...expandedFlowExport,
    args:["other-runner",...expandedFlowExport.args.slice(1)]}],expandedFlowExportPacks],
  ["changed environment",deferredFlowExportIncident,[{...expandedFlowExport,environment:{CI:"1"}}],
    expandedFlowExportPacks],
  ["changed capabilities",deferredFlowExportIncident,
    [{...expandedFlowExport,requiredCapabilities:["local-loopback"]}],expandedFlowExportPacks],
  ["replaced artifact",deferredFlowExportIncident,[{...expandedFlowExport,
    args:expandedFlowExport.args.map((value,index)=>index===2?"build/acceptance/generated/replaced.clj":value)}],
    expandedFlowExportPacks],
  ["removed artifact",deferredFlowExportIncident,[{...expandedFlowExport,
    args:expandedFlowExport.args.slice(0,-1)}],expandedFlowExportPacks],
  ["duplicate artifact",deferredFlowExportIncident,[{...expandedFlowExport,
    args:expandedFlowExport.args.map((value,index)=>index===3?expandedFlowExport.args[2]:value)}],
    expandedFlowExportPacks],
  ["ambiguous current identity",deferredFlowExportIncident,
    [expandedFlowExport,{...expandedFlowExport,target:`${expandedFlowExport.target},features/extra.feature`,
      args:[...expandedFlowExport.args,"build/acceptance/generated/features-extra-feature_acceptance_test.clj",
        "build/acceptance/ir/extra.json"]}],expandedFlowExportPacks],
  ["noneligible repair",{...deferredFlowExportIncident,repair:{...deferredFlowExportIncident.repair,
    status:"proposed"}},[expandedFlowExport],expandedFlowExportPacks],
  ["nondeferred incident",{...deferredFlowExportIncident,terminalVerificationDeferred:undefined},
    [expandedFlowExport],expandedFlowExportPacks],
  ["target-scoped incident",{...deferredFlowExportIncident,failure:{...deferredFlowExportIncident.failure,
    retryScope:{kind:"target",logicalTargetIds:["FLOW"]}}},[expandedFlowExport],expandedFlowExportPacks],
  ["mismatched diagnosed boundary",{...deferredFlowExportIncident,repair:{
    ...deferredFlowExportIncident.repair,diagnosedBoundary:{kind:"task",taskKey:"other",
      executionArgs:historicalFlowExport.args}}},[expandedFlowExport],expandedFlowExportPacks],
];
for(const [label,incident,currentIdentities,currentPacks] of rejectedExpansionCases){
  await assert.rejects(()=>validateExpandedFlowExport(incident,currentIdentities,currentPacks),
    /succession|projection|history|acceptance|monotonic|diagnosed target|target boundary/iu,
    `${label} remains fail closed`);
}
await assert.rejects(()=>validateExpandedFlowExport(deferredFlowExportIncident,[expandedFlowExport],
  expandedFlowExportPacks,{loadSourceReceipt:async()=>({...flowExportReceipt,
    candidate:{...flowExportReceipt.candidate,tree:"wrong-tree"}})}),/diagnosed target/iu,
"an unverifiable source receipt remains fail closed");
await assert.rejects(()=>validateExpandedFlowExport(deferredFlowExportIncident,[expandedFlowExport],
  [{id:"flow_export",features:[...historicalFlowExportFeatures,...documentationTemplateFeatures,
    "features/unplanned.feature"]}]),/diagnosed target/iu,
"a current task that omits a registered feature is not a monotonic complete-session expansion");
const reorderedCompleteFlowExport=flowExportAcceptance([
  historicalFlowExportFeatures[1],historicalFlowExportFeatures[0],
  ...historicalFlowExportFeatures.slice(2),...documentationTemplateFeatures,
]);
await assert.rejects(()=>validateExpandedFlowExport(deferredFlowExportIncident,
  [reorderedCompleteFlowExport],expandedFlowExportPacks),/diagnosed target/iu,
"a complete unordered registry set cannot excuse a reordered planner feature sequence");

const siblingAcceptance=flowExportAcceptance([documentationTemplateFeatures[0]]);
const projectedIncidents=[
  {...deferredFlowExportIncident,id:"d723a7c4-1116-4887-b60a-21aded1ab5d8"},
  {id:"cd60309c-cd27-4800-93a9-cf40a81efac5",state:"unresolved",failure:{
    task:siblingAcceptance,retryScope:{kind:"task",taskKey:siblingAcceptance.key,
      executionArgs:siblingAcceptance.args},
  }},
];
const projectedIncidentIds=[];
assert.deepEqual(await validateUnresolvedIncidentTaskSuccession({incidents:projectedIncidents,
  currentIdentities:(incident)=>{
    projectedIncidentIds.push(incident.id);
    return [structuredClone(incident.failure.task)];
  },currentPacks:[],graph:emptySuccessionGraph}),[],
"each unresolved incident is checked against its own canonical repair identity projection");
assert.deepEqual(projectedIncidentIds,projectedIncidents.map(({id})=>id),
  "canonical repair identity projection is resolved once for each blocking incident");

console.log("verification task succession tests passed");
