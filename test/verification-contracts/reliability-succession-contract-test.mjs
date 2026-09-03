import assert from "node:assert/strict";
import { loadTaskSuccessionGraph, resolveIncidentTaskSuccession, resolveTaskSuccessionGraph,
  taskSuccessionBoundaryDigest, verificationTaskDigest } from
  "../../scripts/verification-task-succession.mjs";
import {verificationTaskIdentity} from
  "../../scripts/verification-planner/tasks/planner.mjs";
import {loadVerificationPacks} from
  "../../scripts/verification-registry/validation.mjs";
import {receiptBoundTaskBoundary,validateReceiptBoundTaskEdge} from
  "../../scripts/verification-policy/reliability/receipt-bound-task-succession.mjs";
import {createReceiptBoundRepairTaskIdentityProvider,
  trustedRepairTaskIdentityProvider} from
  "../../scripts/verification-pack-cardinality/reliability-adapter.mjs";
import {emitCompactSuccessionRepairProtocol,emitPhase2SuccessionRepairProtocol} from
  "../../scripts/verification-policy/reliability/task-succession-repair-protocol.mjs";
import {derivePhase2AcceptanceSessionIdentities,phase2ReceiptBoundSuccessionAuthority} from
  "../../scripts/verification-evidence/governed-prelaunch-identities.mjs";
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
const source = identity("unit:test/verification-process-contract-test.mjs");
const destinations = [identity("unit:test/verification-contracts/registry-inventory-contract-test.mjs"),
  identity("unit:test/verification-contracts/ownership-impact-contract-test.mjs")];
const destinationEntries = destinations.map((current) => {
  const digest = verificationTaskDigest(current);
  const boundary = { kind:"task", taskKey:current.key, executionArgs:current.args,
    logicalTargetIds:[] };
  return { digest, boundary, boundaryDigest:taskSuccessionBoundaryDigest(boundary) };
});
const sourceDigest = verificationTaskDigest(source);
const graph = { version:1,
  identities:Object.fromEntries([[sourceDigest, source],
    ...destinations.map((current) => [verificationTaskDigest(current), current])]),
  boundaries:Object.fromEntries([[sourceDigest, { kind:"task-set", taskKey:source.key,
    successorBoundaryDigests:destinationEntries.map(({ boundaryDigest }) => boundaryDigest).sort() }],
  ...destinationEntries.map(({ digest, boundary }) => [digest, boundary])]),
  taskSetSuccessions:[{ id:"split-process-contract", sourceTaskDigest:sourceDigest,
    destinationTaskDigests:destinationEntries.map(({ digest }) => digest),
    logicalSlice:{ kind:"task" } }], edges:[] };
const succession = resolveTaskSuccessionGraph({ graph, sourceIdentity:source,
  currentIdentities:destinations, logicalSlice:{ kind:"task" } });
assert.deepEqual(succession.destinationIdentities, destinations,
  "one former task succeeds only through its complete ordered successor set");
assert.throws(() => resolveTaskSuccessionGraph({ graph, sourceIdentity:source,
  currentIdentities:destinations.slice(0, 1), logicalSlice:{ kind:"task" } }),
  /incomplete conserved boundary/u, "a missing successor blocks before execution");
const evolvedDestination = {...destinations[0], requiredCapabilities:["local-loopback"]};
const evolvedDigest = verificationTaskDigest(evolvedDestination);
const evolvedGraph = structuredClone(graph);
evolvedGraph.identities[evolvedDigest] = evolvedDestination;
evolvedGraph.boundaries[evolvedDigest] = structuredClone(destinationEntries[0].boundary);
evolvedGraph.edges.push({
  id:"registry-contract-capability-v2",
  sourceRegistryCommit:"a".repeat(40),
  sourceTaskDigest:destinationEntries[0].digest,
  destinationTaskDigest:evolvedDigest,
  logicalSlice:{kind:"task"},
  conservedBoundaryDigest:destinationEntries[0].boundaryDigest,
});
const evolvedSuccession = resolveTaskSuccessionGraph({graph:evolvedGraph, sourceIdentity:source,
  currentIdentities:[evolvedDestination, destinations[1]], logicalSlice:{kind:"task"}});
assert.deepEqual(evolvedSuccession.destinationIdentities, [evolvedDestination, destinations[1]],
  "each task-set member follows ordinary exact identity succession to one current canonical identity");
assert.equal(new Set(evolvedSuccession.destinationTaskDigests).size, destinations.length,
  "task-set identity succession preserves exact cardinality and distinct destinations");
const collapsedTaskSet = structuredClone(evolvedGraph);
collapsedTaskSet.edges[0].destinationTaskDigest = destinationEntries[1].digest;
assert.throws(() => resolveTaskSuccessionGraph({graph:collapsedTaskSet, sourceIdentity:source,
  currentIdentities:[destinations[1]], logicalSlice:{kind:"task"}}),
  /incomplete conserved boundary|preserve its conserved boundary/u,
  "task-set member succession cannot collapse distinct destinations");
const ambiguousTaskSet = structuredClone(evolvedGraph);
ambiguousTaskSet.edges.push({...structuredClone(evolvedGraph.edges[0]), id:"ambiguous-capability-v2"});
assert.throws(() => resolveTaskSuccessionGraph({graph:ambiguousTaskSet, sourceIdentity:source,
  currentIdentities:[evolvedDestination, destinations[1]], logicalSlice:{kind:"task"}}),
  /Ambiguous task succession boundary/u,
  "task-set member succession rejects ambiguous ordinary edges");

const acceptanceIdentity=(features,prerequisiteTaskKeys=undefined)=>({
  key:"acceptance-session:verification_process",stage:"acceptance-session",
  packId:"verification_process",executable:"bb",
  args:["acceptance-pack-runner","verification_process",...features.flatMap(feature=>{
    const basename=feature.slice(feature.lastIndexOf("/")+1).replace(/\.feature$/u,"");
    const slug=feature.toLowerCase().replace(/[^a-z0-9]+/gu,"-").replace(/(^-+|-+$)/gu,"");
    return[`build/acceptance/generated/${slug}_acceptance_test.clj`,
      `build/acceptance/ir/${basename}.json`];
  })],target:features.join(","),environment:null,requiredCapabilities:[],
  ...(prerequisiteTaskKeys?{prerequisiteTaskKeys}:{}),
});
const currentPacks=await loadVerificationPacks();
const processPack=currentPacks.find(({id})=>id==="verification_process");
const scopedFeatures=processPack.features.slice(0,2).sort();
const scopedSource=acceptanceIdentity(scopedFeatures.slice(0,1),["build:dist"]);
const scopedDestination=acceptanceIdentity(scopedFeatures);
const scopedIncident={id:"phase2-fixture",state:"unresolved",failure:{task:scopedSource,
  sourceReceipt:"tmp/verification-receipts/phase2-fixture.json",
  lineage:{commit:"a".repeat(40),tree:"b".repeat(40)},
  retryScope:{kind:"task",taskKey:scopedSource.key,executionArgs:scopedSource.args}}};
const scopedSourceDigest=verificationTaskDigest(scopedSource);
const scopedDestinationDigest=verificationTaskDigest(scopedDestination);
const scopedBoundary=receiptBoundTaskBoundary(scopedIncident,scopedSourceDigest);
const scopedEdge={version:1,id:"phase2-fixture-v1",incidentId:scopedIncident.id,
  sourceReceipt:scopedIncident.failure.sourceReceipt,
  sourceRegistryCommit:scopedIncident.failure.lineage.commit,
  sourceLineageTree:scopedIncident.failure.lineage.tree,sourceTaskDigest:scopedSourceDigest,
  destinationTaskDigest:scopedDestinationDigest,logicalSlice:{kind:"task"},
  conservedBoundaryDigest:taskSuccessionBoundaryDigest(scopedBoundary)};
const scopedGraph={version:1,identities:{[scopedSourceDigest]:scopedSource,
  [scopedDestinationDigest]:scopedDestination},boundaries:{
  [scopedSourceDigest]:scopedBoundary,[scopedDestinationDigest]:scopedBoundary,
},taskSetSuccessions:[],edges:[scopedEdge]};
const scopedReceipt={candidate:structuredClone(scopedIncident.failure.lineage),tasks:{
  [scopedSource.key]:{identity:structuredClone(scopedSource),status:"failed"},
}};
const injectedReceipt=async()=>structuredClone(scopedReceipt);
await validateReceiptBoundTaskEdge({edge:scopedEdge,incident:scopedIncident,graph:scopedGraph,
  currentIdentities:[scopedDestination],loadSourceReceipt:injectedReceipt,
  operations:{boundaryDigest:taskSuccessionBoundaryDigest,
    same:(left,right)=>JSON.stringify(left)===JSON.stringify(right),taskDigest:verificationTaskDigest}});
const resolveScoped=(overrides={})=>resolveIncidentTaskSuccession({incident:scopedIncident,
  currentIdentities:[scopedDestination],currentPacks,graph:scopedGraph,
  loadHistoricalPacks:async()=>currentPacks,loadSourceReceipt:injectedReceipt,...overrides});
assert.equal((await resolveScoped()).chain[0].id,scopedEdge.id,
  "the receipt-bound task uses its one explicit succession edge");
await assert.rejects(()=>resolveScoped({graph:{...scopedGraph,edges:[]}}),
  /succession|diagnosed target/iu,"a missing receipt-bound edge fails closed");
await assert.rejects(()=>resolveScoped({graph:{...scopedGraph,
  edges:[scopedEdge,{...scopedEdge,id:"phase2-fixture-copy"}]}}),/ambiguous/iu,
"an ambiguous receipt-bound edge fails closed");
const alteredOrder=acceptanceIdentity([...scopedFeatures].reverse());
await assert.rejects(()=>resolveScoped({currentIdentities:[alteredOrder]}),/receipt-bound|succession/iu,
  "an altered destination order fails closed");
const alteredPrerequisite=structuredClone(scopedIncident);
alteredPrerequisite.failure.task.prerequisiteTaskKeys.push("unit:unbound-prerequisite");
await assert.rejects(()=>resolveScoped({incident:alteredPrerequisite}),/succession|diagnosed target/iu,
  "an altered source prerequisite fails closed");
const nonAncestral=structuredClone(scopedIncident);
nonAncestral.failure.lineage.commit="c".repeat(40);
await assert.rejects(()=>resolveScoped({incident:nonAncestral}),/receipt-bound/iu,
  "a non-ancestral source identity fails closed");

const productionGraph=await loadTaskSuccessionGraph();
const compactIncident={id:"8f3ed16c-61e1-476f-b3c1-8c2aea39e78d",state:"unresolved",failure:{
  task:acceptanceIdentity([
    "features/modular-verification-packs.feature",
    "features/verification-process-compact-conservation.feature",
    "features/verification-registry-planner-modularization.feature",
  ],[
    "build:dist",
    "acceptance-parse:features/modular-verification-packs.feature",
    "acceptance-generate:features/modular-verification-packs.feature",
    "unit:test/verification-candidate-inventory-test.mjs",
    "unit:test/verification-registry-planner-modularization-acceptance-test.mjs",
    "unit:test/verification-contracts/compact-conservation-contract-test.mjs",
    "acceptance-parse:features/verification-process-compact-conservation.feature",
    "acceptance-generate:features/verification-process-compact-conservation.feature",
    "unit:test/verification-contracts/registry-core-contract-test.mjs",
    "unit:test/verification-contracts/registry-project-management-contract-test.mjs",
    "unit:test/verification-contracts/registry-durable-repository-contract-test.mjs",
    "unit:test/verification-contracts/registry-browser-routing-contract-test.mjs",
    "unit:test/verification-contracts/registry-reachability-contract-test.mjs",
    "unit:test/verification-contracts/registry-style-boundary-contract-test.mjs",
    "unit:test/verification-contracts/registry-editor-assets-contract-test.mjs",
    "acceptance-parse:features/verification-registry-planner-modularization.feature",
    "acceptance-generate:features/verification-registry-planner-modularization.feature",
  ]),sourceReceipt:"tmp/verification-receipts/1891822-8497dea5-9ca1-4a62-a635-c124928cf637.json",
  lineage:{commit:"4eb56aac2a1477bf5c2146a0895473d8cd0a0acd",
    tree:"94f8b253015626312c9890e1024adc5f2b869b07"},
  retryScope:{kind:"task",taskKey:"acceptance-session:verification_process"},
}};
const compactSourceDigest=verificationTaskDigest(compactIncident.failure.task);
assert.equal(compactSourceDigest,
  "48863bad1ff341949142b2df0e71b0e946c1b5f4a1805e473a41f6dc190487cf",
  "the stopped receipt keeps its exact failed acceptance identity");
const compactDestination=identity(
  "unit:test/verification-contracts/compact-conservation-contract-test.mjs");
const compactDestinationDigest=verificationTaskDigest(compactDestination);
assert.equal(compactDestinationDigest,
  "c29a363c012c3d73c36fa932fd87d8c427c4419fe2ddf36ebf44be16adeb7a89",
  "the selected compact contract keeps its exact current identity");
const compactBoundary=receiptBoundTaskBoundary(compactIncident,compactSourceDigest);
assert.equal(taskSuccessionBoundaryDigest(compactBoundary),
  "8bdd86773bf6298a27ca1903ea5e04d19c95488109c1489ac1ceff76291a9a50",
  "the incident, receipt, lineage, and source task have one exact boundary");
const compactEdges=productionGraph.edges.filter(({incidentId})=>incidentId===compactIncident.id);
assert.equal(compactEdges.length,1,"the compact repair has one incident-scoped successor");
emitCompactSuccessionRepairProtocol({incident:compactIncident,productionEdges:compactEdges});
assert.deepEqual(compactEdges[0],{version:1,id:"schema-editor-compact-conservation-v1",
  incidentId:compactIncident.id,sourceReceipt:compactIncident.failure.sourceReceipt,
  sourceRegistryCommit:compactIncident.failure.lineage.commit,
  sourceLineageTree:compactIncident.failure.lineage.tree,
  sourceTaskDigest:compactSourceDigest,destinationTaskDigest:compactDestinationDigest,
  logicalSlice:{kind:"task"},conservedBoundaryDigest:taskSuccessionBoundaryDigest(compactBoundary)},
"the compact successor is bound only to the stopped receipt and selected contract");
assert.deepEqual(productionGraph.identities[compactDestinationDigest],compactDestination,
  "the compact successor declares the exact destination identity");
assert.deepEqual(productionGraph.boundaries[compactSourceDigest],compactBoundary,
  "the compact source declares the exact receipt boundary");
assert.deepEqual(productionGraph.boundaries[compactDestinationDigest],compactBoundary,
  "the compact destination cannot escape the exact receipt boundary");
const compactReceipt={candidate:structuredClone(compactIncident.failure.lineage),tasks:{
  [compactIncident.failure.task.key]:{
    identity:structuredClone(compactIncident.failure.task),status:"failed"},
}};
const validateCompact=(overrides={})=>validateReceiptBoundTaskEdge({
  edge:compactEdges[0],incident:compactIncident,graph:productionGraph,
  currentIdentities:[compactDestination],loadSourceReceipt:async()=>structuredClone(compactReceipt),
  operations:{boundaryDigest:taskSuccessionBoundaryDigest,
    same:(left,right)=>JSON.stringify(left)===JSON.stringify(right),taskDigest:verificationTaskDigest},
  ...overrides,
});
await validateCompact();
for(const [field,value] of [
  ["sourceReceipt","tmp/verification-receipts/other.json"],
  ["sourceRegistryCommit","a".repeat(40)],
  ["sourceLineageTree","b".repeat(40)],
  ["sourceTaskDigest","c".repeat(64)],
  ["destinationTaskDigest","d".repeat(64)],
  ["conservedBoundaryDigest","e".repeat(64)],
]){
  await assert.rejects(()=>validateCompact({edge:{...compactEdges[0],[field]:value}}),
    /receipt-bound/u,`a changed compact ${field} fails closed`);
}
await assert.rejects(()=>validateCompact({incident:{...compactIncident,id:"changed-incident"}}),
  /receipt-bound/u,"a changed compact incident fails closed");
const productionEdges=productionGraph.edges.filter(({incidentId})=>
  incidentId===phase2ReceiptBoundSuccessionAuthority.incidentId);
assert.equal(productionEdges.length,1,"Phase 2 has one incident-scoped production declaration");
const currentProcessSessions=await derivePhase2AcceptanceSessionIdentities({packs:currentPacks,
  repositoryRoot:process.cwd(),authority:phase2ReceiptBoundSuccessionAuthority});
assert.equal(currentProcessSessions.length,1);
assert.equal(currentProcessSessions[0].prerequisiteTaskKeys?.length??0,
  productionEdges[0].destinationPrerequisiteTaskCount,
  "the production test derives the runner's exact Phase 2 prerequisite closure");
assert.equal(productionEdges[0].destinationTaskDigest,
  verificationTaskDigest(currentProcessSessions[0]),
  "the production declaration names the one current acceptance-session identity");
emitPhase2SuccessionRepairProtocol({currentSession:currentProcessSessions[0],
  productionEdge:productionEdges[0]});

const persistenceCandidate={commit:"d".repeat(40),tree:"e".repeat(40)};
const persistenceChangeSet={baseCommit:"c".repeat(40),paths:["scripts/repair.mjs"]};
const exactPersistenceIdentity=acceptanceIdentity(scopedFeatures,["build:dist","unit:repair"]);
const allPackPersistenceIdentity=acceptanceIdentity(scopedFeatures);
let currentPersistencePlan={tasks:[exactPersistenceIdentity]};
const persistenceIncident={id:"receipt-bound-persistence",failureDigest:"f".repeat(64),failure:{
  task:structuredClone(exactPersistenceIdentity),retryScope:{kind:"task",
    taskKey:exactPersistenceIdentity.key,executionArgs:exactPersistenceIdentity.args},
}};
const persistenceProvider=createReceiptBoundRepairTaskIdentityProvider({
  packs:currentPacks,plan:currentPersistencePlan,incident:persistenceIncident,
  candidate:persistenceCandidate,baseCommit:persistenceChangeSet.baseCommit,
  evidenceTask:"verification-process-exact-slice-execution",
  changedPaths:persistenceChangeSet.paths,verificationTaskIdentity:value=>value,
  currentRegistryLoader:async()=>currentPacks,
  currentCandidateLoader:async()=>persistenceCandidate,
  currentPlanLoader:async()=>currentPersistencePlan,
});
const persistenceProposal={candidate:persistenceCandidate,
  changedPaths:persistenceChangeSet.paths,checkpoint:{
    baseCommit:persistenceChangeSet.baseCommit,
    evidenceTask:"verification-process-exact-slice-execution",
  }};
const trustedPersistenceProvider=trustedRepairTaskIdentityProvider(
  persistenceProvider,async()=>[allPackPersistenceIdentity]);
assert.deepEqual(await trustedPersistenceProvider({incident:persistenceIncident,
  proposal:persistenceProposal}),[exactPersistenceIdentity],
"repair persistence retains the receipt-producing exact prerequisite closure");
assert.throws(()=>trustedRepairTaskIdentityProvider(async()=>[allPackPersistenceIdentity],
  async()=>[allPackPersistenceIdentity]),/trusted receipt-bound identity provider/u,
"an arbitrary all-pack identity provider cannot replace the exact receipt boundary");
currentPersistencePlan={tasks:[{...exactPersistenceIdentity,target:"changed.feature"}]};
await assert.rejects(()=>trustedPersistenceProvider({incident:persistenceIncident,
  proposal:persistenceProposal}),/exact plan identity changed/u,
"a changed destination identity fails before repair persistence");
currentPersistencePlan={tasks:[{...exactPersistenceIdentity,
  prerequisiteTaskKeys:["build:dist"]}]};
await assert.rejects(()=>trustedPersistenceProvider({incident:persistenceIncident,
  proposal:persistenceProposal}),/exact plan identity changed/u,
"a changed destination prerequisite list fails before repair persistence");
