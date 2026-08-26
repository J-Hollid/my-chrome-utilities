import {execFile} from "node:child_process";
import {readFile} from "node:fs/promises";
import {planVerification,verificationTaskIdentity} from "../../verification-packs.mjs";
import {sameTargetPlannerProjection,sourcePlannerReceipt} from
  "../../verification-same-target-planner-projection.mjs";
import {
  completeTaskBoundary, declaredBoundaryDigest, declaredTaskBoundary,
  executionFor, resolveTaskSuccessionGraph,
} from "./task-succession-graph.mjs";
import {
  canonicalSuccessionValue as canonical,
  sameSuccessionValue as same, successionDigest as digest,
  taskSuccessionBoundaryDigest, verificationTaskDigest,
} from "./task-succession-values.mjs";

export {
  resolveTaskSuccessionGraph, taskSuccessionBoundaryDigest, verificationTaskDigest,
};

const graphUrl=new URL("../../../verification/task-succession.json",import.meta.url);

export function successionDestinationIdentities(succession){
  if(Array.isArray(succession?.destinationIdentities))return succession.destinationIdentities;
  return succession?.destinationIdentity?[succession.destinationIdentity]:[];
}
export function successionExecutions(succession){
  if(Array.isArray(succession?.executions))return succession.executions;
  return succession?.execution?[succession.execution]:[];
}
export function successionDestinationTaskDigests(succession){
  if(Array.isArray(succession?.destinationTaskDigests))return succession.destinationTaskDigests;
  return succession?.destinationTaskDigest?[succession.destinationTaskDigest]:[];
}

export async function loadTaskSuccessionGraph(){
  return JSON.parse(await readFile(graphUrl,"utf8"));
}

export function browserTargetSuccessionBoundary(packs,targetId){
  const owners=packs.flatMap(pack=>(pack.browserObservations??[])
    .filter(({id})=>id===targetId).map(observation=>({pack,observation})));
  if(owners.length!==1)throw new Error(`Task succession requires one browser target owner: ${targetId}`);
  const {pack,observation}=owners[0];
  const partitions=(pack.browserEvidencePartitions??[]).filter(partition=>
    partition.path===observation.path&&partition.sessionBatch===observation.sessionBatch);
  const targetPartitions=partitions.flatMap(partition=>(partition.targets??[])
    .filter(({id})=>id===targetId).map(target=>({partition,target})));
  const limits=(pack.browserAdapterPerformance??[]).filter(row=>
    row.path===observation.path&&row.sessionBatch===observation.sessionBatch&&row.targetIds?.includes(targetId));
  if(targetPartitions.length!==1||limits.length!==1)
    throw new Error(`Task succession browser boundary is incomplete or ambiguous: ${targetId}`);
  return canonical({kind:"browser-target",targetId,program:observation.path,
    environment:observation.environment,impactBoundaries:observation.impactBoundaries,
    observationKeys:observation.observationKeys,features:observation.features,
    assertionLeaves:targetPartitions[0].target.leaves,
    resultSemantics:{keys:observation.observationKeys,status:"explicit-logical-target-result"},
    maximumMilliseconds:limits[0].maximumSingleTargetP90Milliseconds,
    requiredCapabilities:["local-loopback"],route:"scoped-command-approval"});
}

function gitShowJson(revision,path){
  return new Promise((resolve,reject)=>execFile("git",["show",`${revision}:${path}`],
    {maxBuffer:16*1024*1024},(error,stdout,stderr)=>error
      ?reject(new Error(stderr.trim()||error.message)):resolve(JSON.parse(stdout))));
}

function acceptanceArtifacts(feature){
  const basename=feature.slice(feature.lastIndexOf("/")+1).replace(/\.feature$/u,"");
  const slug=feature.toLowerCase().replace(/[^a-z0-9]+/gu,"-").replace(/(^-+|-+$)/gu,"");
  return{ir:`build/acceptance/ir/${basename}.json`,
    generated:`build/acceptance/generated/${slug}_acceptance_test.clj`};
}

function historicalRegistryDeclaresTask(identity,packs,plannedIdentities){
  if(plannedIdentities.some(candidate=>verificationTaskDigest(candidate)===verificationTaskDigest(identity)&&
      same(candidate,identity)))return true;
  if(identity.stage==="browser-observation"&&plannedIdentities.some(candidate=>{
    if(candidate.stage!=="browser-observation")return false;
    const historical={...identity},planned={...candidate};
    delete historical.aliasCommands;delete planned.aliasCommands;
    return same(historical,planned);
  }))return true;
  if(identity.stage!=="acceptance-session"||identity.key!==`acceptance-session:${identity.packId}`)
    return false;
  const pack=packs.find(candidate=>candidate.id===identity.packId);
  const features=typeof identity.target==="string"?identity.target.split(",").filter(Boolean):[];
  if(!pack||features.length===0||new Set(features).size!==features.length||
      features.some(feature=>!(pack.features??[]).includes(feature)))return false;
  const expected={key:`acceptance-session:${pack.id}`,stage:"acceptance-session",packId:pack.id,
    executable:"bb",args:["acceptance-pack-runner",pack.id,...features.flatMap(feature=>{
      const artifacts=acceptanceArtifacts(feature);return[artifacts.generated,artifacts.ir];})],
    target:features.join(","),environment:null,requiredCapabilities:[]};
  return same(expected,identity);
}


function acceptanceSessionFeatures(identity){
  if(identity?.stage!=="acceptance-session"||identity.executable!=="bb"||
      identity.key!==`acceptance-session:${identity.packId}`||
      identity.args?.[0]!=="acceptance-pack-runner"||identity.args?.[1]!==identity.packId||
      typeof identity.target!=="string")return undefined;
  const features=identity.target.split(",").filter(Boolean);
  if(features.length===0||new Set(features).size!==features.length||
      identity.args.length!==2+(features.length*2))return undefined;
  const expectedArtifacts=features.flatMap(feature=>{
    const artifacts=acceptanceArtifacts(feature);return[artifacts.generated,artifacts.ir];
  });
  if(new Set(expectedArtifacts).size!==expectedArtifacts.length||
      !same(identity.args.slice(2),expectedArtifacts))return undefined;
  return features;
}

function stableAcceptanceSessionContract(source,current){
  return ["key","stage","packId","executable"].every(field=>source[field]===current[field])&&
    same(source.environment,current.environment)&&
    same(source.requiredCapabilities,current.requiredCapabilities)&&
    same(source.args?.slice(0,2),current.args?.slice(0,2));
}

function registryBindsCompleteAcceptanceSession(identity,features,packs){
  const owners=packs.filter(pack=>pack.id===identity.packId);
  const registered=owners[0]?.features??[];
  return owners.length===1&&registered.length===features.length&&
    new Set(registered).size===registered.length&&
    registered.every(feature=>features.includes(feature))&&
    historicalRegistryDeclaresTask(identity,packs,[]);
}

function terminalDeferralBindsEligibleRepair(incident){
  const deferred=incident.terminalVerificationDeferred,admissions=deferred?.eligibleRepairAdmissions?.entries;
  return deferred?.status==="terminal-verification-deferred"&&
    typeof incident.failureDigest==="string"&&typeof deferred.repairDigest==="string"&&
    Array.isArray(admissions)&&admissions.some(entry=>entry.incidentId===incident.id&&
      entry.failureDigest===incident.failureDigest&&entry.repairDigest===deferred.repairDigest);
}

async function monotonicDeferredAcceptanceSessionExpansion({incident,currentIdentities,currentPacks,
  loadHistoricalPacks,loadSourceReceipt}){
  const source=incident.failure?.task;
  if(incident.repair?.status!=="eligible"||
      incident.terminalVerificationDeferred?.status!=="terminal-verification-deferred"||
      !completeTaskBoundary(incident.failure?.retryScope,source)||
      !completeTaskBoundary(incident.repair?.diagnosedBoundary,source))return false;
  const historicalFeatures=acceptanceSessionFeatures(source);
  if(!historicalFeatures)return false;
  const currentMatches=currentIdentities.filter(identity=>stableAcceptanceSessionContract(source,identity));
  if(currentMatches.length!==1)return false;
  const current=currentMatches[0],currentFeatures=acceptanceSessionFeatures(current);
  if(!currentFeatures||currentFeatures.length<=historicalFeatures.length)return false;
  let historicalPacks;
  try{historicalPacks=await loadHistoricalPacks(
    incident.failure.lineage?.commit,"verification/packs.json");}
  catch{return false;}
  let receipt;
  try{receipt=await loadSourceReceipt(incident.failure.sourceReceipt);}
  catch{if(!terminalDeferralBindsEligibleRepair(incident))return false;}
  const recorded=receipt?.tasks?.[source.key],sourceReceiptBound=receipt?(
    receipt.candidate?.commit===incident.failure.lineage?.commit&&
    receipt.candidate?.tree===incident.failure.lineage?.tree&&recorded?.status==="failed"&&
    same(recorded.identity,source)):terminalDeferralBindsEligibleRepair(incident);
  if(!sourceReceiptBound||
      !registryBindsCompleteAcceptanceSession(source,historicalFeatures,historicalPacks)||
      !registryBindsCompleteAcceptanceSession(current,currentFeatures,currentPacks))return false;
  let historicalIndex=0;
  for(const feature of currentFeatures){
    if(feature===historicalFeatures[historicalIndex])historicalIndex+=1;
  }
  return historicalIndex===historicalFeatures.length;
}

export async function resolveIncidentTaskSuccession({incident,currentIdentities,currentPacks,
  graph=undefined,loadHistoricalPacks=gitShowJson,loadSourceReceipt=sourcePlannerReceipt}){
  const diagnosedTarget=incident.failure.retryScope?.logicalTargetIds?.length===1
    ?incident.failure.retryScope.logicalTargetIds[0]:incident.failure.failedBoundary?.logicalTargetId;
  const logicalSlice=diagnosedTarget
    ?{kind:"browser-target",logicalTargetIds:[diagnosedTarget]}:{kind:"task"};
  const successionGraph=structuredClone(graph??await loadTaskSuccessionGraph());
  const sourceTaskDigest=verificationTaskDigest(incident.failure.task);
  const firstEdges=successionGraph.edges.filter(edge=>edge.sourceTaskDigest===sourceTaskDigest&&
    same(edge.logicalSlice,logicalSlice));
  const taskSetEdges=(successionGraph.taskSetSuccessions??[]).filter(edge=>
    edge.sourceTaskDigest===sourceTaskDigest&&same(edge.logicalSlice,logicalSlice));
  if(firstEdges.length===0&&taskSetEdges.length===0){
    if(!incident.failure.sourceReceipt||!incident.failure.lineage?.commit||!incident.failure.lineage?.tree)
      throw new Error("Undeclared task succession or missing registry history");
    return sameTargetPlannerProjection({incident,currentIdentities,currentPacks,
      loadHistoricalPacks,loadSourceReceipt,operations:{
        browserTargetBoundary:browserTargetSuccessionBoundary,
        boundaryDigest:taskSuccessionBoundaryDigest,digest,executionFor,same,
        taskDigest:verificationTaskDigest,
      }});
  }
  if(firstEdges.length+taskSetEdges.length!==1)throw new Error("Ambiguous task succession boundary");
  const resolution=resolveTaskSuccessionGraph({graph:successionGraph,
    sourceIdentity:incident.failure.task,currentIdentities,logicalSlice});
  for(const step of resolution.chain){
    const edge=successionGraph.edges.find(candidate=>candidate.id===step.id&&
      candidate.sourceTaskDigest===step.sourceTaskDigest&&
      candidate.destinationTaskDigest===step.destinationTaskDigest)??
      (successionGraph.taskSetSuccessions??[]).find(candidate=>candidate.id===step.id&&
        candidate.sourceTaskDigest===step.sourceTaskDigest);
    if(typeof edge?.sourceRegistryCommit!=="string"||!edge.sourceRegistryCommit)
      throw new Error("Task succession edge lacks source registry history");
    const historicalPacks=await loadHistoricalPacks(edge.sourceRegistryCommit,"verification/packs.json");
    const focusedHistoricalPlan=logicalSlice.kind==="browser-target"
      ?planVerification(historicalPacks,{packIds:[historicalPacks.find(pack=>
        (pack.browserObservations??[]).some(({id})=>id===diagnosedTarget)).id],
        browserTargetIds:[diagnosedTarget],historicalRegistryFallback:true})
      :planVerification(historicalPacks,{terminalFull:true,historicalRegistryFallback:true});
    const historicalIdentities=(logicalSlice.kind==="browser-target"
      ?[...focusedHistoricalPlan.tasks,...planVerification(historicalPacks,
        {terminalFull:true,historicalRegistryFallback:true}).tasks]
      :focusedHistoricalPlan.tasks).map(verificationTaskIdentity);
    if(!historicalRegistryDeclaresTask(successionGraph.identities[step.sourceTaskDigest]??edge.sourceIdentity,
      historicalPacks,historicalIdentities))
      throw new Error("Task succession source identity is absent from declared registry history");
    if(logicalSlice.kind==="browser-target"){
      const sourceBoundary=browserTargetSuccessionBoundary(historicalPacks,diagnosedTarget);
      if(declaredBoundaryDigest(declaredTaskBoundary(successionGraph,step.sourceTaskDigest,logicalSlice))!==
          taskSuccessionBoundaryDigest(sourceBoundary))
        throw new Error("Task succession source registry boundary differs from its declaration");
    }
  }
  if(logicalSlice.kind==="browser-target"){
    const destinationBoundary=browserTargetSuccessionBoundary(currentPacks,diagnosedTarget);
    if(declaredBoundaryDigest(declaredTaskBoundary(successionGraph,resolution.destinationTaskDigest,logicalSlice))!==
        taskSuccessionBoundaryDigest(destinationBoundary))
      throw new Error("Task succession current registry boundary differs from its declaration");
  }
  return resolution;
}

export async function validateUnresolvedIncidentTaskSuccession({incidents,currentIdentities,currentPacks,
  graph=undefined,loadHistoricalPacks=gitShowJson,loadSourceReceipt=sourcePlannerReceipt}){
  const identitiesForIncident=typeof currentIdentities==="function"
    ?currentIdentities:()=>currentIdentities;
  const mappings=[];
  for(const incident of incidents){
    if(incident.state!=="unresolved"||incident.closureAudit?.blocking===false)continue;
    if(incident.failure?.failureClass==="execution-contract-failure"&&
        incident.failure?.task?.stage==="promotion")continue;
    const incidentIdentities=await identitiesForIncident(incident);
    if(!Array.isArray(incidentIdentities))
      throw new Error("Task succession requires canonical identities for each incident");
    const currentDigests=new Set(incidentIdentities.map(verificationTaskDigest));
    if(currentDigests.has(verificationTaskDigest(incident.failure.task)))continue;
    const diagnosedTargets=incident.failure.retryScope?.logicalTargetIds??[];
    try {
      mappings.push({incidentId:incident.id,mapping:await resolveIncidentTaskSuccession({incident,
        currentIdentities:incidentIdentities,currentPacks,graph,loadHistoricalPacks,loadSourceReceipt})});
    } catch(error) {
      if(error?.message==="Same-target planner projection requires one diagnosed target"&&
          await monotonicDeferredAcceptanceSessionExpansion({incident,currentIdentities:incidentIdentities,currentPacks,
            loadHistoricalPacks,loadSourceReceipt}))continue;
      const selectedTargetSuccessors=incidentIdentities.filter(identity=>diagnosedTargets.length===1&&
        identity.logicalTargetIds?.includes(diagnosedTargets[0]));
      const boundaryExpanded=error?.message==="Task succession edge does not preserve its conserved boundary"||
        error?.message==="Task succession current registry boundary differs from its declaration"||
        (diagnosedTargets.length===1&&
          error?.message===`Changed target boundary for ${diagnosedTargets[0]}`);
      if(incident.repair?.status==="eligible"&&
          incident.terminalVerificationDeferred?.status==="terminal-verification-deferred"&&
          selectedTargetSuccessors.length===1&&boundaryExpanded)continue;
      throw error;
    }
  }
  return mappings;
}
