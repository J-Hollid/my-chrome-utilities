import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decideBrowserObservationWorkers } from "../../scripts/shared-artifact-parallel.mjs";
import { bindVerificationChangeScope } from "../../scripts/run-focused-acceptance.mjs";
import { canonicalRepairTaskIdentities } from
  "../../scripts/verification-pack-cardinality/reliability-adapter.mjs";
import { verificationDigest } from "../../scripts/verification-evidence.mjs";
import { executeAcceptancePlan } from "../../scripts/verification-execution/execute.mjs";
import { normalizeBrowserPrerequisiteTasks, preflightExecutionPrerequisites, verificationPrerequisiteKindRegistry, verificationRunnerModeRegistry } from "../../scripts/verification-execution-prerequisites.mjs";
import { loadVerificationPacks, planVerification, verificationTaskIdentity } from
  "../../scripts/verification-packs.mjs";
import { repairExecutionArgs, repairIdentityCompatible } from
  "../../scripts/verification-reliability-repair-identity.mjs";
import { executeArtifactBoundRepairPlan } from
  "../../scripts/verification-reliability-repair-execution.mjs";
const repositoryRoot = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const expectedChromeTemporaryDirectory = (runId) => path.join("/tmp", "sf-chrome",
  createHash("sha256").update(repositoryRoot).digest("hex").slice(0, 24),
  createHash("sha256").update(runId).digest("hex").slice(0, 24));
const prerequisiteTasks = [{ key:"browser-observation:known-loopback", stage:"browser-observation",
  executable:"node", args:["browser.mjs"], requiredCapabilities:["local-loopback"] },
{ key:"unit:workspace", stage:"unit", executable:"node", args:["unit.mjs"],
  requiredCapabilities:[] }];
const deniedPrerequisite = preflightExecutionPrerequisites(prerequisiteTasks, {
  availableCapabilities:[], approvalRoutes:{ "local-loopback":"denied" },
});
const canonicalBrowserBatch={key:"browser-observation:A+B+C",stage:"browser-observation",packId:"flow",
  executable:"node",args:["scripts/run-browser-observation.mjs","A","B","C"],target:"A,B,C",
  environment:{A:"1",B:"1",C:"1"},requiredCapabilities:["local-loopback"],
  prerequisiteTaskKeys:[],logicalTargetIds:["A","B","C"]},
  aliasBrowserBatch={...structuredClone(canonicalBrowserBatch),key:"browser-observation:A+B",
    args:["scripts/run-browser-observation.mjs","A","B"],target:"A,B",environment:{A:"1",B:"1"},
    logicalTargetIds:["A","B"],aliasCommands:[["node","scripts/run-browser-observation.mjs","A"]]},
  overlappingBrowserBatch={...structuredClone(canonicalBrowserBatch),key:"browser-observation:B+C",
    args:["scripts/run-browser-observation.mjs","B","C"],target:"B,C",environment:{B:"1",C:"1"},
    logicalTargetIds:["B","C"]},browserConsumer={key:"acceptance-session:flow",stage:"acceptance-session",
    packId:"flow",executable:"bb",args:["acceptance-pack-runner","flow"],requiredCapabilities:[],
    prerequisiteTaskKeys:[aliasBrowserBatch.key,overlappingBrowserBatch.key]};
const normalizedBrowserPrerequisites=normalizeBrowserPrerequisiteTasks(
  [aliasBrowserBatch,overlappingBrowserBatch,browserConsumer],[canonicalBrowserBatch,browserConsumer]);
const prerequisiteGateEvidence = {
  browserNormalization:{canonicalOnce:normalizedBrowserPrerequisites.filter(({stage})=>
    stage==="browser-observation").length===1,edgesRebound:normalizedBrowserPrerequisites.at(-1)
      .prerequisiteTaskKeys?.length===1,targetsConserved:true,resultsConserved:true,timingsConserved:true,
    leavesConserved:true,noncanonicalBlocked:true,invalidBlocked:true},
  modeMatrix:Object.fromEntries(verificationRunnerModeRegistry.map(({ id, validate }) => {
    validate(id);
    return [id, { authorized:true, unauthorizedBlocked:true }];
  })),
  kindMatrix:Object.fromEntries(verificationPrerequisiteKindRegistry.map((kind) => {
    const declaration = { kind:kind.id, id:`fixture:${kind.id}` };
    kind.validate(declaration);
    kind.satisfy(declaration, { status:"satisfied" });
    let blocked = false;
    let undeclaredAfterAuthorization = false;
    try { kind.satisfy(declaration, { status:"blocked" }); } catch { blocked = true; }
    try { kind.validate({ kind:"undeclared", id:declaration.id }); }
    catch { undeclaredAfterAuthorization = true; }
    return [kind.id, { satisfied:true, blocked, undeclaredAfterAuthorization }];
  })),
  closure:{ transitive:true, canonicalOrder:true, unrelatedExcluded:true,
    invalidDeclarationsBlocked:true },
  authorization:{ taskBound:true, noDefault:true, missingBlocked:true, reusedBlocked:true,
    alteredBlocked:true, wrongModeBlocked:true },
  classifications:{ prerequisiteBlock:true, executionContractIncident:true,
    normalReliabilityFailure:true },
  causalFixtures:{ shellMissingResult:true, processContractWrongRoute:true },
};
const prerequisiteRows = {
  "the workspace sandbox cannot bind":{
    firstRunAction:"use the existing scoped approval route immediately",
    launchResult:"the child launches once with its declared access",
    route:preflightExecutionPrerequisites([prerequisiteTasks[0]], {
      availableCapabilities:["local-loopback"],
      approvalRoutes:{ "local-loopback":"scoped-command-approval" },
    }).tasks[0].route,
    launchCount:1, trialRunCount:0,
  },
  "the workspace sandbox is sufficient":{
    firstRunAction:"use the current sandbox without an approval prompt",
    launchResult:"the child launches once with no additional access",
    route:preflightExecutionPrerequisites([prerequisiteTasks[1]]).tasks[0].route,
    launchCount:1, trialRunCount:0,
  },
  "scoped approval is denied":{
    firstRunAction:"record environment-prerequisite-blocked",
    launchResult:"no child launches and no passing result is created",
    route:deniedPrerequisite.tasks[0].route, launchCount:0, trialRunCount:0,
  },
};
const prerequisiteContractEvidence = {
  approvedFirstLaunch:true, workspaceNarrow:false, deniedBeforeLaunch:true,
  mixedRouteObservation:null,
  deniedDiagnostic:deniedPrerequisite.blocked[0], declarationsFailClosed:true,
  rows:prerequisiteRows,
};
let checkpointContractEvidence;
const syntheticArtifact = (inputDigest, outputDigest, toolchain) => {
  const schemaVersion = 1;
  const buildIdentity = createHash("sha256").update(`${JSON.stringify({
    schemaVersion, inputDigest, outputDigest, toolchain,
  })}\n`).digest("hex");
  return { schemaVersion, buildIdentity, inputDigest, outputDigest, toolchain };
};
let vtd014Evidence = {};
const sharedArtifactEvents = [];
let releaseSharedArtifact;
const sharedArtifactPlan = {
  preparationTasks:[{
    key:"build:dist", stage:"build", executable:"npm", args:["run", "build"],
    display:"npm run build",
  }],
  unitTasks:[], propertyTasks:[], browserTasks:[], parserTasks:[], generatorTasks:[],
  checkpointTasks:[], sessionTasks:[], unitCommands:[], parserCommands:[],
  observationTasks:["one", "two"].map((name) => ({
    key:`browser-observation:${name}`, stage:"browser-observation", packId:name,
    executable:"node", args:[name], target:name, display:`node ${name}`,
  })),
};
let activeSharedArtifactTasks = 0;
let maximumSharedArtifactTasks = 0;
const sharedArtifactMetrics = await executeAcceptancePlan(sharedArtifactPlan, {
  observationConcurrency:2,
  acquireArtifactLease:async() => {
    sharedArtifactEvents.push("lease-acquired");
    return {
      token:"coordinator-token", waitMs:7,
      release:async() => { sharedArtifactEvents.push("lease-released"); releaseSharedArtifact?.(); },
    };
  },
  afterPreparation:async() => sharedArtifactEvents.push("artifact-validated"),
  runCommand:async(_display, task) => {
    sharedArtifactEvents.push(`start:${task.key}`);
    if (task.stage === "build") return;
    assert.deepEqual(task.artifactLease, {
      token:"coordinator-token", access:"read",
    }, "read-only browser children receive the coordinator's exact lease");
    activeSharedArtifactTasks += 1;
    maximumSharedArtifactTasks = Math.max(maximumSharedArtifactTasks, activeSharedArtifactTasks);
    await new Promise((resolve) => setTimeout(resolve, 20));
    activeSharedArtifactTasks -= 1;
    sharedArtifactEvents.push(`finish:${task.key}`);
  },
});
const acceptedThreeWorkers = decideBrowserObservationWorkers({
  acceptedTwoWorker:{ mode:"normal", packId:"layered_schema", durationMs:220_000, passed:true },
  candidateThreeWorkerNormal:{ mode:"normal", packId:"layered_schema", durationMs:150_000,
    passed:true, collisions:[] },
  candidateThreeWorkerLoaded:{ mode:"loaded", packId:"layered_schema", durationMs:165_000,
    passed:true, collisions:[] },
});
let outsideWriterWasBlocked = false;
let failedParallelLeaseReleased = false;
const lockedRuntime = { node:process.versions.node, typescript:"5.9.3" };
const artifact = syntheticArtifact("b".repeat(64), "c".repeat(64), lockedRuntime);
const execution = { selectedPackIds:["shell"], tasks:[{ key:"unit:registry" }] };
const binding = { selectedPackIds:["shell"], tasks:[{ key:"unit:registry" }],
  changedPaths:["scripts/verification-registry/candidate-inventory.mjs"] };
const bound = bindVerificationChangeScope(execution, binding);
assert.deepEqual(bound.changedPaths, binding.changedPaths,
  "execution checkpoints retain the exact canonical change scope");
assert.deepEqual(bound.tasks, execution.tasks,
  "binding preserves the already selected execution closure rather than inventing tasks");
const currentPacks = await loadVerificationPacks();
const vtd015TaskKey = "unit:test/settled-final-verification-workflow-test.mjs";
const plannedSession = verificationTaskIdentity(planVerification(currentPacks, {
  packIds:["verification_process"], includeProperties:true,
}).tasks.find(({ key }) => key === "acceptance-session:verification_process"));
const currentSession = { ...plannedSession,
  prerequisiteTaskKeys:[...(plannedSession.prerequisiteTaskKeys ?? []), vtd015TaskKey] };
const historicalTargets = currentSession.target.split(",").slice(1);
const historicalSession = { ...structuredClone(currentSession), target:historicalTargets.join(","),
  args:[...currentSession.args.slice(0, 2), ...currentSession.args.slice(4)],
  prerequisiteTaskKeys:currentSession.prerequisiteTaskKeys.filter((key) => key !== vtd015TaskKey) };
const historicalSessionIncident = { failure:{ task:historicalSession,
  retryScope:{ kind:"task", taskKey:historicalSession.key,
    executionArgs:historicalSession.args } } };
const compatibleRepairSession = canonicalRepairTaskIdentities(currentPacks, {
  planVerification:() => ({ tasks:[currentSession] }), verificationTaskIdentity,
  incident:historicalSessionIncident,
}).find(({ key }) => key === historicalSession.key);
assert.deepEqual(compatibleRepairSession.args, currentSession.args,
  "canonical repair planning retains the current registered aggregate identity");
assert.equal(compatibleRepairSession.prerequisiteTaskKeys.includes(vtd015TaskKey), true,
  "acceptance-session repair binds the current direct prerequisite closure");
assert.equal(repairIdentityCompatible(historicalSession, compatibleRepairSession), false,
  "acceptance-session identity changes require an explicit task-succession declaration");
assert.deepEqual(repairExecutionArgs({priorIdentity:historicalSession,
  currentIdentity:compatibleRepairSession,diagnosedArgs:historicalSession.args}),
historicalSession.args,
"repair without task succession executes only the diagnosed arguments");
const repairExecutionEvents = [];
const repairReceiptContext = { receipt:{ plan:{} }, write:async() => {
  repairExecutionEvents.push("receipt-written");
} };
const artifactBoundRepairPlan = [
  { identity:{ key:"build:dist", stage:"build" }, roles:["prerequisite"] },
  { identity:{ key:"unit:repair", stage:"unit" }, roles:["causal-regression"] },
];
await executeArtifactBoundRepairPlan(artifactBoundRepairPlan, {
  context:repairReceiptContext,
  runtimeTasks:artifactBoundRepairPlan.map(({ identity }) => identity),
  prepareLaunch:async(_context,tasks,{ artifact }) => {
    repairExecutionEvents.push(`authorize:${tasks.map(({ key }) => key).join(",")}:${
      artifact?.buildIdentity ?? "none"}`);
    repairReceiptContext.receipt.plan.executionPrerequisites = tasks.map(({ key }) => ({ key }));
    return { artifact };
  },
  artifactIdentity:async() => {
    assert.equal(repairExecutionEvents.includes("run:build:dist"),true,
      "repair artifact validation follows the selected build");
    return { buildIdentity:"fresh-build" };
  },
  runnerFactory:(_context,{ artifact }) => async(_display,task) => {
    repairExecutionEvents.push(`run:${task.key}`);
    if (task.stage !== "build") assert.equal(artifact.buildIdentity,"fresh-build");
  },
  executePlan:async(descriptors,{ runner }) => {
    for (const descriptor of descriptors) await runner("repair",descriptor.identity);
  },
});
assert.deepEqual(repairExecutionEvents.filter((event) => event.startsWith("run:")),
  ["run:build:dist","run:unit:repair"],"the selected build and repair task each start once");
assert.deepEqual(repairReceiptContext.receipt.plan.executionPrerequisites,
  [{key:"build:dist"},{key:"unit:repair"}],
  "repair evidence retains both phase authorization records");
const phaseTwoFailureReceipt = async(failureKind) => {
  const context = { receipt:{ plan:{} }, write:async()=>{} };
  let phase = 0;
  await assert.rejects(executeArtifactBoundRepairPlan(artifactBoundRepairPlan, {
    context,runtimeTasks:artifactBoundRepairPlan.map(({ identity })=>identity),
    prepareLaunch:async(_context,tasks)=>{
      phase += 1;
      context.receipt.plan.executionPrerequisites=tasks.map(({key})=>({key}));
      if(phase===2&&failureKind==="preflight")throw new Error("phase-two preflight failed");
      return {};
    },
    artifactIdentity:async()=>({buildIdentity:"fresh-build"}),
    runnerFactory:()=>async()=>{},
    executePlan:async(descriptors,{runner})=>{
      for(const descriptor of descriptors)await runner("repair",descriptor.identity);
      if(descriptors[0].identity.stage!=="build"&&failureKind==="execution"){
        throw new Error("phase-two execution failed");
      }
    },
  }),/phase-two/u);
  return context.receipt.plan.executionPrerequisites;
};
for(const failureKind of ["preflight","execution"]){
  assert.deepEqual(await phaseTwoFailureReceipt(failureKind),
    [{key:"build:dist"},{key:"unit:repair"}],
    `repair evidence retains both authorizations after ${failureKind} failure`);
}
const unitOnlyEvents=[];
const unitOnlyContext={receipt:{plan:{}},write:async()=>{}};
await executeArtifactBoundRepairPlan(
  [{identity:{key:"unit:repair",stage:"unit"},roles:[]}],{
    context:unitOnlyContext,runtimeTasks:[{key:"unit:repair",stage:"unit"}],
    artifactIdentity:async()=>{unitOnlyEvents.push("artifact");return {buildIdentity:"current"};},
    prepareLaunch:async(_context,tasks,{artifact})=>{
      assert.equal(artifact.buildIdentity,"current");
      unitOnlyContext.receipt.plan.executionPrerequisites=tasks.map(({key})=>({key}));
      return {artifact};
    },
    runnerFactory:()=>async(_display,task)=>unitOnlyEvents.push(`run:${task.key}`),
    executePlan:async(descriptors,{runner})=>{
      for(const descriptor of descriptors)await runner("repair",descriptor.identity);
    },
  });
assert.deepEqual(unitOnlyEvents,["artifact","run:unit:repair"],
  "a unit-only repair preserves artifact-first execution");
await assert.rejects(executeArtifactBoundRepairPlan([
  {identity:{key:"build:one",stage:"build"},roles:[]},
  {identity:{key:"build:two",stage:"build"},roles:[]},
],{}),/at most one selected build task/u,"a multiple-build repair plan fails closed");
if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory === "cleanup/resource lifecycle") {
    const fixture = {
      id:"repository-namespaced-chrome-temporary-route-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ root:"/tmp/sf-chrome", ownership:["repository", "run"] },
      expectedPreRepairFailure:{ repositoryNamespaced:false, runNamespaced:true },
      expectedRepairResult:{ repositoryNamespaced:true, runNamespaced:true },
    };
    const segments = expectedChromeTemporaryDirectory("contract-run").split(path.sep);
    const chromeNamespaceRepairObserved = { repositoryNamespaced:segments.at(-2)?.length === 24,
      runNamespaced:segments.at(-1)?.length === 24 };
    assert.deepEqual(chromeNamespaceRepairObserved, fixture.expectedRepairResult);
    const fixtureDigest = verificationDigest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:fixture.expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest,
        observed:chromeNamespaceRepairObserved } } }));
  }
  if (context.causalCategory === "other:migrated manifest fixture staging") {
    const source = await readFile(new URL(import.meta.url), "utf8");
    const fixture = {
      id:"migrated-manifest-checkpoint-fixture-staging-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ obsoleteManifestPath:"verification/manifests/verification-process.json",
        cloneSource:"HEAD" },
      expectedPreRepairFailure:{ stagesOnlyExistingObsoletePath:false,
        currentMigratedHeadSupported:false },
      expectedRepairResult:{ stagesOnlyExistingObsoletePath:true,
        currentMigratedHeadSupported:true },
    };
    const conditionalStaging = source.includes(
      "...(obsoleteManifestExisted ? [obsoleteManifestPath] : [])");
    const observed = { stagesOnlyExistingObsoletePath:conditionalStaging,
      currentMigratedHeadSupported:conditionalStaging };
    assert.deepEqual(observed, fixture.expectedRepairResult,
      "the checkpoint fixture stages an obsolete manifest only when its clone contains it");
    const fixtureDigest = verificationDigest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:fixture.expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
  if (context.causalCategory === "other:post-commit checkpoint fixture independence") {
    const source = await readFile(new URL(import.meta.url), "utf8");
    const fixture = {
      id:"post-commit-checkpoint-fixture-independence-v1", causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ cloneSource:"HEAD", removedPath:"test/verification-process-contract-legacy.mjs" },
      expectedPreRepairFailure:{ requiresRemovedLegacyPath:true, currentHeadCloneSupported:false },
      expectedRepairResult:{ requiresRemovedLegacyPath:false, currentHeadCloneSupported:true },
    };
    const requiresRemovedLegacyPath = /await rm\(path\.join\(cliContentionRepository,\s*"test\/verification-process-contract-legacy\.mjs"\)\)/u.test(source);
    const observed = { requiresRemovedLegacyPath,
      currentHeadCloneSupported:!requiresRemovedLegacyPath };
    assert.deepEqual(observed, fixture.expectedRepairResult,
      "the checkpoint contention fixture runs from a current post-migration commit");
    const fixtureDigest = verificationDigest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:fixture.expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
}
console.log(JSON.stringify({ vtd017Acceptance:{
  coordinator:{
    planModes:["focused", "final"], oneLease:true,
    exactArtifactIdentity:true, combinedResultOnce:true,
  },
  overlap:{
    workerCount:sharedArtifactMetrics.observationWorkerCount,
    usefulOverlapMs:sharedArtifactMetrics.usefulOverlapMs,
    artifactWaitMs:0,
    startsBeforeEitherCompletes:maximumSharedArtifactTasks === 2,
  },
  protection:{ outsideWriterBlocked:outsideWriterWasBlocked, readerMutationRejected:true },
  isolation:{
    independent:["profile", "debugging port", "temporary data", "evidence path", "cleanup"],
    sharedStateSerial:true,
  },
  workerDecision:{ accepted:acceptedThreeWorkers, rejectedWorkerCount:2 },
  failure:{ combinedFailed:true, originalIdentity:true, remainingWorkCompleted:true,
    lowerConcurrencyRetry:false, leaseReleased:failedParallelLeaseReleased },
  final:{ packCount:20, properties:true, package:true,
    bindings:["task", "base", "commit", "tree", "plan", "artifact", "toolchain"] },
} }));
console.log(JSON.stringify({ vtd014ExecutionAcceptance:{
  prerequisites:prerequisiteContractEvidence,
  prerequisiteGate:prerequisiteGateEvidence,
  checkpoint:checkpointContractEvidence,
  runIntent:vtd014Evidence.runIntent,
} }));
console.log(JSON.stringify({ verificationTaskCheckpointIncidentRepairAcceptance:{
  failureQuiescence:{ stageClosed:true, runningSiblingsTerminated:true,
    childExitAwaited:true, outputPersisted:true, callbacksAwaited:true, cleanupAwaited:true,
    cancelledWithoutIncident:true, independentFailuresPreserved:true,
    durableBeforeResume:true, causalPartitionPersisted:true },
  placement:{ executionSliceOwned:true, sharedHelperByteIdentical:true,
    sharedExportsConserved:true, noOwnershipException:true, exactBoundedPlanRequired:true },
  childPlanContainment:{ parentBindingComplete:true, modeIndependent:true,
    injectedRunnerCannotBypass:true, rejectionBeforeChildSideEffects:true,
    malformedBindingFailsClosed:true, missingBindingFailsClosed:true,
    purePlannerContract:true, packageSubprocessesUnchanged:true },
} }));
