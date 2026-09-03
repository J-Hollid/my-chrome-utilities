import assert from "node:assert/strict";
import { loadTaskSuccessionGraph, resolveIncidentTaskSuccession, resolveTaskSuccessionGraph,
  taskSuccessionBoundaryDigest, verificationTaskDigest } from
  "../../scripts/verification-task-succession.mjs";
import {planVerification,verificationTaskIdentity} from
  "../../scripts/verification-planner/tasks/planner.mjs";
import {loadVerificationPacks} from
  "../../scripts/verification-registry/validation.mjs";
import {canonicalVerificationChangeSet,verificationPacksAtCommit} from
  "../../scripts/verification-changes.mjs";
import {receiptBoundTaskBoundary,validateReceiptBoundTaskEdge} from
  "../../scripts/verification-policy/reliability/receipt-bound-task-succession.mjs";
import {createReceiptBoundRepairTaskIdentityProvider,
  trustedRepairTaskIdentityProvider} from
  "../../scripts/verification-pack-cardinality/reliability-adapter.mjs";
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
const productionEdges=productionGraph.edges.filter(({incidentId})=>
  incidentId==="2e282fe6-b636-4c67-b889-5b30a00e5e7e");
assert.equal(productionEdges.length,1,"Phase 2 has one incident-scoped production declaration");
const phase2Base="4aea38cdf4899dc0a606215cc106ab743533c2fa";
const phase2ChangeSet=await canonicalVerificationChangeSet({base:phase2Base,
  repositoryRoot:process.cwd()});
const phase2BasePacks=await verificationPacksAtCommit(phase2Base,
  {repositoryRoot:process.cwd(),historicalRegistryFallback:true});
const currentProcessSessions=planVerification(currentPacks,{changedPaths:phase2ChangeSet.paths,
  changeSet:phase2ChangeSet,basePacks:phase2BasePacks,includeProperties:true}).tasks
  .map(verificationTaskIdentity).filter(({key})=>key==="acceptance-session:verification_process");
assert.equal(currentProcessSessions.length,1);
assert.equal(currentProcessSessions[0].prerequisiteTaskKeys.length,87,
  "the production test derives the runner's exact Phase 2 prerequisite closure");
assert.equal(productionEdges[0].destinationTaskDigest,
  verificationTaskDigest(currentProcessSessions[0]),
  "the production declaration names the one current acceptance-session identity");
if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  assert.equal(context.version,1);
  if (context.causalCategory === "other:phase2 acceptance-session prerequisite identity") {
    const expectedPreRepairFailure={prerequisiteTaskCount:84,
      destinationTaskDigest:"de6cdfb0c1f1d493405239bb099f130e235b3e71eafcd1b8fdc1d74f638fbaf1"};
    const expectedRepairResult={prerequisiteTaskCount:87,
      destinationTaskDigest:"39ad8474c9d8f95449e59a54f5334479784216a87f53985b18f16290e3201ed3"};
    const repairResult={prerequisiteTaskCount:currentProcessSessions[0].prerequisiteTaskKeys.length,
      destinationTaskDigest:productionEdges[0].destinationTaskDigest};
    assert.deepEqual(repairResult,expectedRepairResult,
      "Phase 2 succession uses the current exact prerequisite identity");
    const fixture={id:"phase2-acceptance-session-prerequisite-identity-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationTaskDigest(context.diagnosedBoundary),
      input:{taskKey:"acceptance-session:verification_process"},
      expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest=verificationTaskDigest(fixture);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
      incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed:repairResult}}}));
  }
}

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
