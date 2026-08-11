import {createHash} from "node:crypto";
import {execFile} from "node:child_process";
import {readFile} from "node:fs/promises";
import {planVerification,verificationTaskIdentity} from "./verification-packs.mjs";

const graphUrl=new URL("../verification/task-succession.json",import.meta.url);

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
function declaredBoundaryDigest(boundary){
  return typeof boundary==="string"&&/^[a-f0-9]{64}$/u.test(boundary)
    ?boundary:taskSuccessionBoundaryDigest(boundary);
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

export async function resolveIncidentTaskSuccession({incident,currentIdentities,currentPacks,
  graph=undefined,loadHistoricalPacks=gitShowJson}){
  const diagnosedTarget=incident.failure.retryScope?.logicalTargetIds?.length===1
    ?incident.failure.retryScope.logicalTargetIds[0]:incident.failure.failedBoundary?.logicalTargetId;
  const logicalSlice=diagnosedTarget
    ?{kind:"browser-target",logicalTargetIds:[diagnosedTarget]}:{kind:"task"};
  const successionGraph=structuredClone(graph??await loadTaskSuccessionGraph());
  const sourceTaskDigest=verificationTaskDigest(incident.failure.task);
  const firstEdges=successionGraph.edges.filter(edge=>edge.sourceTaskDigest===sourceTaskDigest&&
    same(edge.logicalSlice,logicalSlice));
  if(firstEdges.length!==1)throw new Error(firstEdges.length
    ?"Ambiguous task succession boundary":"Undeclared task succession or missing registry history");
  const resolution=resolveTaskSuccessionGraph({graph:successionGraph,
    sourceIdentity:incident.failure.task,currentIdentities,logicalSlice});
  for(const step of resolution.chain){
    const edge=successionGraph.edges.find(candidate=>candidate.id===step.id&&
      candidate.sourceTaskDigest===step.sourceTaskDigest&&
      candidate.destinationTaskDigest===step.destinationTaskDigest);
    if(typeof edge?.sourceRegistryCommit!=="string"||!edge.sourceRegistryCommit)
      throw new Error("Task succession edge lacks source registry history");
    const historicalPacks=await loadHistoricalPacks(edge.sourceRegistryCommit,"verification/packs.json");
    const historicalPlan=logicalSlice.kind==="browser-target"
      ?planVerification(historicalPacks,{packIds:[historicalPacks.find(pack=>
        (pack.browserObservations??[]).some(({id})=>id===diagnosedTarget)).id],
        browserTargetIds:[diagnosedTarget]})
      :planVerification(historicalPacks,{terminalFull:true});
    const historicalIdentities=historicalPlan.tasks
      .map(verificationTaskIdentity);
    if(!historicalRegistryDeclaresTask(successionGraph.identities[step.sourceTaskDigest],
      historicalPacks,historicalIdentities))
      throw new Error("Task succession source identity is absent from declared registry history");
    if(logicalSlice.kind==="browser-target"){
      const sourceBoundary=browserTargetSuccessionBoundary(historicalPacks,diagnosedTarget);
      if(declaredBoundaryDigest(successionGraph.boundaries[step.sourceTaskDigest])!==
          taskSuccessionBoundaryDigest(sourceBoundary))
        throw new Error("Task succession source registry boundary differs from its declaration");
    }
  }
  if(logicalSlice.kind==="browser-target"){
    const destinationBoundary=browserTargetSuccessionBoundary(currentPacks,diagnosedTarget);
    if(declaredBoundaryDigest(successionGraph.boundaries[resolution.destinationTaskDigest])!==
        taskSuccessionBoundaryDigest(destinationBoundary))
      throw new Error("Task succession current registry boundary differs from its declaration");
  }
  return resolution;
}

export async function validateUnresolvedIncidentTaskSuccession({incidents,currentIdentities,currentPacks,
  graph=undefined,loadHistoricalPacks=gitShowJson}){
  const currentDigests=new Set(currentIdentities.map(verificationTaskDigest)),mappings=[];
  for(const incident of incidents){
    if(incident.state!=="unresolved"||incident.closureAudit?.blocking===false)continue;
    if(currentDigests.has(verificationTaskDigest(incident.failure.task)))continue;
    mappings.push({incidentId:incident.id,mapping:await resolveIncidentTaskSuccession({incident,
      currentIdentities,currentPacks,graph,loadHistoricalPacks})});
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

export function resolveTaskSuccessionGraph({graph,sourceIdentity,currentIdentities,logicalSlice}){
  if(graph?.version!==1||!graph.identities||!graph.boundaries||!Array.isArray(graph.edges))
    throw new Error("Task succession graph version or shape is invalid");
  if(!validLogicalSlice(logicalSlice))throw new Error("Task succession requires an exact logical slice");
  const sourceTaskDigest=verificationTaskDigest(sourceIdentity);
  if(!same(graph.identities[sourceTaskDigest],sourceIdentity))
    throw new Error("Task succession graph does not bind the exact immutable source identity");
  const currentByDigest=new Map(currentIdentities.map(identity=>[verificationTaskDigest(identity),identity]));
  const visited=new Set(),chain=[];
  let cursor=sourceTaskDigest;
  while(!currentByDigest.has(cursor)){
    if(visited.has(cursor))throw new Error("Task succession graph contains a cycle");
    visited.add(cursor);
    const sourceBoundary=graph.boundaries[cursor];
    if(!sourceBoundary)throw new Error("Task succession registry history is unavailable");
    const conservedBoundaryDigest=declaredBoundaryDigest(sourceBoundary);
    const candidates=graph.edges.filter(edge=>edge.sourceTaskDigest===cursor&&
      same(edge.logicalSlice,logicalSlice)&&edge.conservedBoundaryDigest===conservedBoundaryDigest);
    if(candidates.length===0)throw new Error("Undeclared task succession or incomplete conserved boundary");
    if(candidates.length!==1)throw new Error("Ambiguous task succession boundary");
    const edge=candidates[0],destinationIdentity=graph.identities[edge.destinationTaskDigest],
      destinationBoundary=graph.boundaries[edge.destinationTaskDigest];
    if(typeof edge.id!=="string"||!edge.id||!destinationIdentity||!destinationBoundary||
        verificationTaskDigest(destinationIdentity)!==edge.destinationTaskDigest||
        declaredBoundaryDigest(destinationBoundary)!==edge.conservedBoundaryDigest)
      throw new Error("Task succession edge does not preserve its conserved boundary");
    chain.push({id:edge.id,sourceTaskDigest:cursor,destinationTaskDigest:edge.destinationTaskDigest,
      conservedBoundaryDigest:edge.conservedBoundaryDigest,logicalSlice:structuredClone(logicalSlice)});
    cursor=edge.destinationTaskDigest;
  }
  const destinationIdentity=currentByDigest.get(cursor);
  if(!same(graph.identities[cursor],destinationIdentity))
    throw new Error("Task succession destination is not the exact current canonical identity");
  const destinationTaskDigest=verificationTaskDigest(destinationIdentity);
  const conservationDigest=digest({version:graph.version,sourceTaskDigest,destinationTaskDigest,
    chain,logicalSlice,boundaryDigest:declaredBoundaryDigest(graph.boundaries[cursor])});
  return{version:graph.version,sourceTaskDigest,destinationTaskDigest,chain,
    logicalSlice:structuredClone(logicalSlice),conservationDigest,
    destinationIdentity:structuredClone(destinationIdentity),execution:executionFor(destinationIdentity,logicalSlice)};
}
