import assert from "node:assert/strict";

import {
  resolveIncidentTaskSuccession,
  resolveTaskSuccessionGraph,
  taskSuccessionBoundaryDigest,
  verificationTaskDigest,
} from "./verification-task-succession.mjs";

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

console.log("verification task succession tests passed");
