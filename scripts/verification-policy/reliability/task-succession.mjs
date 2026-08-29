import {createHash} from "node:crypto";
import {execFile} from "node:child_process";
import {readFile} from "node:fs/promises";
import {planVerification,verificationTaskIdentity} from "../../verification-packs.mjs";
import {sameTargetPlannerProjection,sourcePlannerReceipt} from
  "../../verification-same-target-planner-projection.mjs";

const graphUrl=new URL("../../../verification/task-succession.json",import.meta.url);

function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
  return value;
}

function digest(value){
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

function same(left,right){return JSON.stringify(canonical(left))===JSON.stringify(canonical(right));}

export function verificationTaskDigest(identity){return digest(identity);}
export function taskSuccessionBoundaryDigest(boundary){return digest(boundary);}
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
function declaredBoundaryDigest(boundary){
  return typeof boundary==="string"&&/^[a-f0-9]{64}$/u.test(boundary)
    ?boundary:taskSuccessionBoundaryDigest(boundary);
}

function declaredTaskBoundary(graph,taskDigest,logicalSlice){
  if(logicalSlice.kind==="browser-target"&&logicalSlice.logicalTargetIds.length===1){
    const target=logicalSlice.logicalTargetIds[0];
    return graph.targetBoundaries?.[taskDigest]?.[target]??graph.boundaries[taskDigest];
  }
  return graph.boundaries[taskDigest];
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

function completeTaskBoundary(boundary,identity){
  return Boolean(identity)&&boundary?.kind==="task"&&boundary.taskKey===identity.key&&
    same(boundary.executionArgs,identity.args)&&
    (!Array.isArray(boundary.logicalTargetIds)||boundary.logicalTargetIds.length===0);
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
      !registryBindsCompleteAcceptanceSession(source,historicalFeatures,historicalPacks))return false;
  if(currentMatches.length===1){
    const current=currentMatches[0],currentFeatures=acceptanceSessionFeatures(current);
    if(currentFeatures?.length>historicalFeatures.length&&
        registryBindsCompleteAcceptanceSession(current,currentFeatures,currentPacks)){
      let historicalIndex=0;
      for(const feature of currentFeatures){
        if(feature===historicalFeatures[historicalIndex])historicalIndex+=1;
      }
      if(historicalIndex===historicalFeatures.length)return true;
    }
  }
  const historicalSet=new Set(historicalFeatures),currentSessions=currentIdentities
    .map(identity=>({identity,features:acceptanceSessionFeatures(identity)}))
    .filter(({features})=>features?.some(feature=>historicalSet.has(feature)));
  if(currentSessions.length<2||currentSessions.some(({identity,features})=>
    !registryBindsCompleteAcceptanceSession(identity,features,currentPacks)))return false;
  return historicalFeatures.every(feature=>currentSessions
    .filter(({features})=>features.includes(feature)).length===1);
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

function validLogicalSlice(slice){
  return slice?.kind==="task"||
    (slice?.kind==="browser-target"&&Array.isArray(slice.logicalTargetIds)&&slice.logicalTargetIds.length>0&&
      slice.logicalTargetIds.every(id=>typeof id==="string"&&id));
}

function executionFor(identity,logicalSlice){
  if(logicalSlice.kind!=="browser-target")return{identity:structuredClone(identity),args:[...identity.args],logicalTargetIds:[]};
  return{identity:structuredClone(identity),args:["scripts/run-browser-observation.mjs",...logicalSlice.logicalTargetIds],
    logicalTargetIds:[...logicalSlice.logicalTargetIds]};
}

function resolveOrdinaryTaskSuccession({graph,sourceTaskDigest,currentByDigest,logicalSlice}){
  const visited=new Set(),chain=[];
  let cursor=sourceTaskDigest;
  while(!currentByDigest.has(cursor)){
    if(visited.has(cursor))throw new Error("Task succession graph contains a cycle");
    visited.add(cursor);
    const sourceBoundary=declaredTaskBoundary(graph,cursor,logicalSlice);
    if(!sourceBoundary)throw new Error("Undeclared task succession or incomplete conserved boundary");
    const conservedBoundaryDigest=declaredBoundaryDigest(sourceBoundary);
    const candidates=graph.edges.filter(edge=>edge.sourceTaskDigest===cursor&&
      same(edge.logicalSlice,logicalSlice)&&edge.conservedBoundaryDigest===conservedBoundaryDigest);
    if(candidates.length===0)throw new Error("Undeclared task succession or incomplete conserved boundary");
    if(candidates.length!==1)throw new Error("Ambiguous task succession boundary");
    const edge=candidates[0],destinationIdentity=graph.identities[edge.destinationTaskDigest],
      destinationBoundary=declaredTaskBoundary(graph,edge.destinationTaskDigest,logicalSlice);
    if(typeof edge.id!=="string"||!edge.id||!destinationIdentity||!destinationBoundary||
        verificationTaskDigest(destinationIdentity)!==edge.destinationTaskDigest||
        declaredBoundaryDigest(destinationBoundary)!==edge.conservedBoundaryDigest)
      throw new Error("Task succession edge does not preserve its conserved boundary");
    chain.push({id:edge.id,sourceTaskDigest:cursor,destinationTaskDigest:edge.destinationTaskDigest,
      conservedBoundaryDigest:edge.conservedBoundaryDigest,logicalSlice:structuredClone(logicalSlice)});
    cursor=edge.destinationTaskDigest;
  }
  const identity=currentByDigest.get(cursor),declaredIdentity=graph.identities[cursor]??identity;
  if(!same(declaredIdentity,identity))
    throw new Error("Task succession destination is not the exact current canonical identity");
  const boundary=declaredTaskBoundary(graph,cursor,logicalSlice)??
    {kind:"task",taskKey:identity.key,executionArgs:identity.args,logicalTargetIds:[]};
  return{destinationTaskDigest:cursor,identity,boundary,
    boundaryDigest:declaredBoundaryDigest(boundary),chain};
}

function resolveTaskSetSuccession({graph,sourceTaskDigest,currentByDigest,logicalSlice}){
  const candidates=[...graph.edges.filter(edge=>edge.sourceTaskDigest===sourceTaskDigest&&
    Array.isArray(edge.destinationTaskDigests)&&same(edge.logicalSlice,logicalSlice)),
  ...(graph.taskSetSuccessions??[]).filter(edge=>edge.sourceTaskDigest===sourceTaskDigest&&
    same(edge.logicalSlice,logicalSlice))];
  if(candidates.length===0)return null;
  if(candidates.length!==1)throw new Error("Ambiguous task succession boundary");
  const edge=candidates[0],sourceBoundary=declaredTaskBoundary(graph,sourceTaskDigest,logicalSlice)??
    (Array.isArray(edge.destinationBoundaryDigests)?{kind:"task-set",taskKey:edge.sourceIdentity?.key,
      successorBoundaryDigests:edge.destinationBoundaryDigests}:undefined);
  const destinationDigests=edge.destinationTaskDigests;
  if(typeof edge.id!=="string"||!edge.id||sourceBoundary?.kind!=="task-set"||
      !Array.isArray(sourceBoundary.successorBoundaryDigests)||!destinationDigests.length||
      new Set(destinationDigests).size!==destinationDigests.length||
      destinationDigests.includes(sourceTaskDigest)){
    throw new Error("Undeclared task succession or incomplete conserved boundary");
  }
  const destinationEntries=destinationDigests.map((destinationTaskDigest)=>
    resolveOrdinaryTaskSuccession({graph,sourceTaskDigest:destinationTaskDigest,
      currentByDigest,logicalSlice}));
  if(destinationEntries.some(({identity,boundary})=>!completeTaskBoundary(boundary,identity)))
    throw new Error("Undeclared task succession or incomplete conserved boundary");
  if(new Set(destinationEntries.map(({destinationTaskDigest})=>destinationTaskDigest)).size!==
      destinationDigests.length)
    throw new Error("Undeclared task succession or incomplete conserved boundary");
  const expected=[...sourceBoundary.successorBoundaryDigests].sort();
  const actual=destinationEntries.map(({boundaryDigest})=>boundaryDigest).sort();
  if(!same(expected,actual)){
    throw new Error("Task succession edge does not preserve its conserved boundary");
  }
  const destinationIdentities=destinationEntries.map(({identity})=>structuredClone(identity));
  const executions=destinationEntries.map(({identity})=>executionFor(identity,logicalSlice));
  const chain=[{id:edge.id,sourceTaskDigest,
    destinationTaskDigests:[...destinationDigests],logicalSlice:structuredClone(logicalSlice),
    conservedBoundaryDigests:actual},...destinationEntries.flatMap(({chain})=>chain)];
  const currentDestinationDigests=destinationEntries.map(({destinationTaskDigest})=>destinationTaskDigest);
  return{version:graph.version,sourceTaskDigest,destinationTaskDigests:currentDestinationDigests,
    chain,logicalSlice:structuredClone(logicalSlice),destinationIdentities,executions,
    conservationDigest:digest({version:graph.version,sourceTaskDigest,
      destinationTaskDigests:currentDestinationDigests,chain,logicalSlice})};
}

export function resolveTaskSuccessionGraph({graph,sourceIdentity,currentIdentities,logicalSlice}){
  if(graph?.version!==1||!graph.identities||!graph.boundaries||!Array.isArray(graph.edges))
    throw new Error("Task succession graph version or shape is invalid");
  if(!validLogicalSlice(logicalSlice))throw new Error("Task succession requires an exact logical slice");
  const sourceTaskDigest=verificationTaskDigest(sourceIdentity);
  const taskSetSource=(graph.taskSetSuccessions??[])
    .find(({sourceTaskDigest:digest})=>digest===sourceTaskDigest)?.sourceIdentity;
  if(!same(graph.identities[sourceTaskDigest]??taskSetSource,sourceIdentity))
    throw new Error("Task succession graph does not bind the exact immutable source identity");
  const currentByDigest=new Map(currentIdentities.map(identity=>[verificationTaskDigest(identity),identity]));
  const taskSetResolution=resolveTaskSetSuccession({graph,sourceTaskDigest,currentByDigest,logicalSlice});
  if(taskSetResolution)return taskSetResolution;
  const resolved=resolveOrdinaryTaskSuccession({graph,sourceTaskDigest,currentByDigest,logicalSlice});
  const {destinationTaskDigest,identity:destinationIdentity,chain}=resolved;
  const conservationDigest=digest({version:graph.version,sourceTaskDigest,destinationTaskDigest,
    chain,logicalSlice,boundaryDigest:resolved.boundaryDigest});
  return{version:graph.version,sourceTaskDigest,destinationTaskDigest,chain,
    logicalSlice:structuredClone(logicalSlice),conservationDigest,
    destinationIdentity:structuredClone(destinationIdentity),execution:executionFor(destinationIdentity,logicalSlice)};
}
