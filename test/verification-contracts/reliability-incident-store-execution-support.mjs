import {runReliabilityIncidentResolution} from "./reliability-incident-store-resolution-support.mjs";
export async function runReliabilityIncidentStore(context){
  const {artifactLockTimeoutRepairRegression,assert,boundedClosureContractRevision,browserTargetSuccessionBoundary,buildEligibleRepairAdmissions,canonicalFlowReloadIdentity,causalGroupingEvidence,causalIdentity,checkpointContractEvidence,classifyFlowReloadModes,closureDisposition,completeInput,createTimeoutIncidentStore,createVerificationProgressTracker,createVerificationReceiptContext,deriveTaskCheckpointRepairProof,diagnosticRetryScope,domainFixtures,eligibleRepairAdmissionCandidates,execFile,flowReloadCausalKey,focusedSelectorOptions,governedRepairAttemptAssociation,historicalClassification,incidentFixtureRoot,inputEquivalentTaskProof,loadTaskSuccessionGraph,loadVerificationPacks,mkdir,observeFlowReloadLifecycle,path,planVerification,prerequisiteContractEvidence,prerequisiteGateEvidence,priorPass,progressTracker,projectionPacks,rawRegisteredCommandsIneligible,readFile,recordEligibleIncidentDeferral,reliabilityFailureFingerprint,rename,resolveIncidentTaskSuccession,resolveTaskSuccessionGraph,rm,runTimeoutRepairFocused,sameTargetProjection,sidePanelPaperFirstBrandAcceptanceArtifacts,sidePanelPaperFirstBrandFeatures,symlink,taskSuccessionBoundaryDigest,terminalClosureExecution,timeoutIncidentDigest,timeoutRepairDiagnosedBoundary,timeoutRepairFocusedExecutionTaskPlan,timeoutRepairFocusedTaskPlan,timeoutRepairPackIds,timeoutRepairPackageTaskIdentity,timeoutResolutionEvidence,validateIncident,validateTimeoutRepairProposal,validateUnresolvedIncidentTaskSuccession,verificationDigest,verificationPacksAtCommit,verificationProgressEmitter,verificationTaskDigest,verificationTaskIdentity,workspaceRestrictionRecorded,writeFile}=context;
  let vtd014Evidence;
  try {
    const timeoutPackRegistry = await loadVerificationPacks();
    const timeoutChangeSet = { version:1, baseCommit:"1".repeat(40), commit:"2".repeat(40),
      entries:[{ status:"M", path:"scripts/dist-artifact-lock.mjs" }],
      paths:["scripts/dist-artifact-lock.mjs"] };
    const timeoutCanonicalPlan = planVerification(timeoutPackRegistry, {
      packIds:timeoutRepairPackIds, changedPaths:timeoutChangeSet.paths,
      changeSet:timeoutChangeSet, basePacks:timeoutPackRegistry, includeProperties:true,
    });
    const timeoutCanonicalIdentities = timeoutCanonicalPlan.tasks.map(verificationTaskIdentity);
    let canonicalRepairIdentities = timeoutCanonicalIdentities;
    let incidentNumber = 0;
    let incidentNow = "2026-08-09T00:00:00.000Z";
    let incidentCandidate = { commit:"repair-commit", tree:"repair-tree" };
    let incidentCandidateChangedPaths = [];
    let incidentCandidateChangedRange = [];
    let conservedRebasePair = [];
    const integratedResolutionIds = new Set();
    const store = createTimeoutIncidentStore({
      root:incidentFixtureRoot,
      storeDirectory:path.join(incidentFixtureRoot, "incidents"),
      now:() => incidentNow,
      randomId:() => `incident-${++incidentNumber}`,
      isAncestor:async (ancestor, descendant) => ancestor === descendant ||
        ancestor === "failed-commit" && ["repair-commit", "rebased-commit", "reclaimed-commit",
          "spec-commit", "carry-commit", "parallel-feature-commit",
          "parallel-spec-commit"].includes(descendant) ||
        ancestor === "repair-commit" && ["reclaimed-commit", "spec-commit", "carry-commit"].includes(descendant),
      resolveCandidate:async(commit) => ({
        commit,
        tree:{ "failed-commit":"failed-tree", "repair-commit":"repair-tree",
          "rebased-commit":"rebased-tree", "reclaimed-commit":"repair-tree",
          "rebased-delta-commit":"rebased-delta-tree",
          "genuinely-unrelated":"unrelated-tree" }[commit],
      }),
      currentCandidate:async() => incidentCandidate,
      changedPaths:async() => ["scripts/dist-artifact-lock.mjs"],
      candidateChangedPaths:async(fromCommit, toCommit) => {
        incidentCandidateChangedRange = [fromCommit, toCommit];
        return incidentCandidateChangedPaths;
      },
      conservesRebasedChangeSet:async({ fromCommit, toCommit }) =>
        JSON.stringify([fromCommit, toCommit]) === JSON.stringify(conservedRebasePair),
      integratedResolutionLookup:async(incident) => integratedResolutionIds.has(incident.id),
      canonicalRepairTaskIdentities:async() => canonicalRepairIdentities,
      canonicalCheckpointValidator:async({ document, incident }) => {
        const actualKeys = Object.keys(document.receipt.tasks).sort();
        const expectedKeys = timeoutCanonicalIdentities.map(({ key }) => key).sort();
        if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys) ||
            !timeoutCanonicalIdentities.every((identity) =>
              JSON.stringify(document.receipt.tasks[identity.key]?.identity) === JSON.stringify(identity)) ||
            document.receipt.plan?.mode !== "exact" ||
            JSON.stringify(document.receipt.plan.requestedPackIds) !==
              JSON.stringify([...timeoutRepairPackIds]) ||
            document.receipt.candidate.baseCommit !== incident.repair.checkpoint.baseCommit ||
            document.receipt.candidate.evidenceTask !== incident.repair.checkpoint.evidenceTask) {
          throw new Error("checkpoint task set does not match the canonical all-20 checkpoint");
        }
        return { receipt:document.receipt, plan:timeoutCanonicalPlan };
      },
    });
    const failure = {
      runnerRunId:"run-1", sourceReceipt:"tmp/verification-receipts/run-1.json",
      lineage:{ role:"coder", branch:"candidate", commit:"failed-commit", tree:"failed-tree",
        baseCommit:null, evidenceTask:null, changeSetDigest:null },
      task:{ key:"browser-observation:A+B", stage:"browser-observation", packId:"capture",
        executable:"node", args:["scripts/run-browser-observation.mjs", "A", "B"],
        logicalTargetIds:["A", "B"] },
      failureClass:"runner-timeout", fingerprint:"9".repeat(64),
      configuredTimeoutMs:600000, durationMs:600014, termination:{ signal:"SIGTERM", escalatedTo:"SIGKILL" },
      resolvedDeadlines:{ DIST_ARTIFACT_LOCK_TIMEOUT_MS:600000,
        VERIFICATION_COMMAND_TIMEOUT_MS:600000, VERIFICATION_TERMINATION_GRACE_MS:5000 },
      environment:{ node:"24.19.0", typescript:"5.9.3", platform:"linux-x64",
        executionLoad:"normal", concurrency:4, observationConcurrency:1 },
      artifact:{ inputDigest:"b".repeat(64), outputDigest:"c".repeat(64), buildIdentity:"d".repeat(64) },
      planDigest:"e".repeat(64), registryDigest:"1".repeat(64),
      outputSha256:"f".repeat(64), stderrSha256:"0".repeat(64),
      lastProgress:{ boundary:"artifact/setup", phase:"dist-artifact-lock", monotonicMs:599000,
        state:{ pending:true } },
    };
    const legacyIncidentDirectory = path.join(incidentFixtureRoot, "legacy-incidents");
    const primaryIncidentDirectory = path.join(incidentFixtureRoot, "primary-incidents");
    const legacyIncidentStore = createTimeoutIncidentStore({ root:incidentFixtureRoot,
      storeDirectory:legacyIncidentDirectory, randomId:() => "legacy-resolution",
      now:() => "2026-08-09T00:00:00.000Z" });
    const legacyNamespaceIncident = await legacyIncidentStore.create({
      ...failure, runnerRunId:"legacy-run" });
    const compatibleIncidentStore = createTimeoutIncidentStore({ root:incidentFixtureRoot,
      storeDirectory:primaryIncidentDirectory, legacyStoreDirectories:[legacyIncidentDirectory],
      randomId:() => "primary-incident", now:() => "2026-08-09T00:00:00.000Z" });
    await mkdir(primaryIncidentDirectory, { recursive:true });
    const legacyIncidentPath = path.join(legacyIncidentDirectory, "legacy-resolution.json");
    const forgedNamespaceDocument = JSON.parse(await readFile(legacyIncidentPath, "utf8"));
    forgedNamespaceDocument.incident.createdAt = "2026-08-09T00:00:01.000Z";
    forgedNamespaceDocument.digest = timeoutIncidentDigest(forgedNamespaceDocument.incident);
    const collidingIncidentPath = path.join(primaryIncidentDirectory, "legacy-resolution.json");
    await writeFile(collidingIncidentPath, `${JSON.stringify(forgedNamespaceDocument, null, 2)}\n`);
    await assert.rejects(() => compatibleIncidentStore.list(), /diverges across repository namespaces/u,
      "an unaccounted duplicate incident id fails closed");
    await rm(collidingIncidentPath);
    assert.deepEqual((await compatibleIncidentStore.list()).map(({ id }) => id),
      ["legacy-resolution"], "the authoritative incident view includes legacy resolutions");
    await compatibleIncidentStore.claimDiagnosticRetry(legacyNamespaceIncident.id,
      legacyNamespaceIncident.failure.retryIdentity);
    assert.equal((await compatibleIncidentStore.read(legacyNamespaceIncident.id)).retry.status,
      "claimed", "a legacy incident migrates before an authoritative state transition");
    await compatibleIncidentStore.create({ ...failure, runnerRunId:"primary-run" });
    assert.deepEqual((await compatibleIncidentStore.list()).map(({ id }) => id),
      ["legacy-resolution", "primary-incident"],
      "the authoritative incident view unions legacy and writable namespaces");
    canonicalRepairIdentities = [...timeoutCanonicalIdentities, failure.task];
    const first = await store.create(failure);
    const changedInnerDeadline = await store.create({ ...failure, runnerRunId:"run-inner-deadline-change",
      resolvedDeadlines:{ ...failure.resolvedDeadlines, DIST_ARTIFACT_LOCK_TIMEOUT_MS:999999 } });
    const innerDeadlineIdentityConserved = first.failure.retryIdentity !==
      changedInnerDeadline.failure.retryIdentity;
    assert.equal(innerDeadlineIdentityConserved, true,
      "resolved inner deadlines are part of the unchanged diagnostic identity");
    const registryMutation = await store.create({ ...failure, runnerRunId:"run-registry-change",
      registryDigest:"2".repeat(64) });
    const toolchainMutation = await store.create({ ...failure, runnerRunId:"run-toolchain-change",
      environment:{ ...failure.environment, node:"25.0.0" } });
    assert.notEqual(first.failure.retryIdentity, registryMutation.failure.retryIdentity,
      "the exact verification registry participates in diagnostic retry identity");
    assert.notEqual(first.failure.retryIdentity, toolchainMutation.failure.retryIdentity,
      "the exact toolchain participates in diagnostic retry identity");
    for (const task of [
      { key:"build:dist", stage:"build", packId:null, executable:"npm", args:["run", "build"] },
      { key:"acceptance-parse:features/example.feature", stage:"acceptance-parse", packId:"shell",
        executable:"bb", args:["gherkin-parser", "features/example.feature", "build/acceptance/ir/example.json"] },
      { key:"browser-observation:SHARED", stage:"browser-observation", packId:"schemas", executable:"node",
        args:["scripts/run-browser-observation.mjs", "SHARED"], logicalTargetIds:["SHARED"] },
    ]) {
      const canonicalTask = verificationTaskIdentity(task);
      const scopedFailure = { ...first.failure, task:canonicalTask,
        retryScope:diagnosticRetryScope({ task:canonicalTask, lastProgress:task.stage === "browser-observation"
          ? { boundary:"target", logicalTargetId:"SHARED", phase:"interaction" } : undefined }) };
      const scoped = { ...first, failure:scopedFailure,
        failureDigest:timeoutIncidentDigest(scopedFailure) };
      assert.doesNotThrow(() => timeoutRepairFocusedTaskPlan(scoped,
        ["src/shared-resource-lifecycle.ts"],
        "unit:test/verification-contracts/execution-binding-contract-test.mjs",
        [...timeoutCanonicalIdentities, canonicalTask]),
      `${task.key} remains repairable without guessing causal files from command arguments`);
    }
    const preCapabilityTask = verificationTaskIdentity({ ...failure.task, requiredCapabilities:[] });
    const currentCapabilityTask = verificationTaskIdentity({ ...failure.task,
      requiredCapabilities:["local-loopback"] });
    const preCapabilityFailure = { ...first.failure, task:preCapabilityTask,
      retryScope:first.failure.retryScope };
    const preCapabilityIncident = { ...first, failure:preCapabilityFailure,
      failureDigest:timeoutIncidentDigest(preCapabilityFailure) };
    const capabilityRepairPlan = timeoutRepairFocusedTaskPlan(preCapabilityIncident,
      ["verification/packs.json"], preCapabilityTask.key,
      [...timeoutCanonicalIdentities.filter(({ key }) => key !== preCapabilityTask.key),
        currentCapabilityTask]);
    assert.deepEqual(capabilityRepairPlan[0].identity, currentCapabilityTask,
      "a pre-declaration incident is repaired through the canonical current capability route");
    const browserTask = verificationTaskIdentity({ key:"browser-observation:SHARED",
      stage:"browser-observation", packId:"schemas", executable:"node",
      args:["scripts/run-browser-observation.mjs", "SHARED"], logicalTargetIds:["SHARED"] });
    const { retryScope:discardedRetryScope, ...legacyBoundaryFailure } = {
      ...first.failure, failureClass:"explicit-logical-failure", task:browserTask,
      failedBoundary:{ logicalTargetId:"SHARED" },
      retryScope:{ kind:"target", logicalTargetIds:["discarded"], executionArgs:["discarded"] },
    };
    assert.ok(discardedRetryScope);
    const legacyBoundaryIncident = { ...first, failure:legacyBoundaryFailure,
      failureDigest:timeoutIncidentDigest(legacyBoundaryFailure) };
    assert.deepEqual(timeoutRepairDiagnosedBoundary(legacyBoundaryIncident), {
      kind:"target", logicalTargetIds:["SHARED"],
      executionArgs:["scripts/run-browser-observation.mjs", "SHARED"],
    }, "an immutable explicit logical failure from the pre-boundary runner remains narrowly repairable");
    assert.doesNotThrow(() => timeoutRepairFocusedTaskPlan(legacyBoundaryIncident,
      ["scripts/run-focused-acceptance.mjs"],
      "unit:test/verification-contracts/execution-binding-contract-test.mjs",
      [...timeoutCanonicalIdentities, browserTask]));
    const checkpointTask = verificationTaskIdentity({ key:"unit:test/checkpoint-task.mjs",
      stage:"unit", packId:"verification_process", executable:"node",
      args:["test/checkpoint-task.mjs"], target:"test/checkpoint-task.mjs", environment:null,
      requiredCapabilities:[] });
    const { retryScope:discardedCheckpointRetry, registryDigest:discardedFailureRegistry,
      causalKey:discardedFailureCausalKey, ...checkpointFailureSource } = first.failure;
    assert.ok(discardedCheckpointRetry && discardedFailureRegistry);
    assert.equal(discardedFailureCausalKey, undefined);
    const checkpointFailure = { ...checkpointFailureSource,
      runnerRunId:"checkpoint-run", sourceReceipt:"tmp/verification-receipts/checkpoint-run.json",
      lineage:{ ...first.failure.lineage, commit:"failed-commit", tree:"failed-tree" },
      task:checkpointTask, failureClass:"execution-contract-failure",
      failedBoundary:{ kind:"checkpoint-identity", operation:"task", stage:"unit",
        trackedChanges:["M test/checkpoint-guard.mjs"] },
      executionPrerequisite:{ operation:{ kind:"checkpoint-identity", operation:"task", stage:"unit",
        trackedChanges:["M test/checkpoint-guard.mjs"] }, code:"IDENTITY_DRIFT",
        route:"workspace-sandbox", retryPermitted:false } };
    const { causalKey:discardedIncidentCausalKey, causalIdentity:discardedCausalIdentity,
      occurrences:discardedOccurrences, ...checkpointIncidentSource } = first;
    assert.equal(discardedIncidentCausalKey, undefined);
    assert.equal(discardedCausalIdentity, undefined);
    assert.equal(discardedOccurrences, undefined);
    const checkpointIncident = { ...checkpointIncidentSource, id:"checkpoint-task-incident",
      failure:checkpointFailure, failureDigest:timeoutIncidentDigest(checkpointFailure) };
    const checkpointRegistryDigest = "3".repeat(64);
    const checkpointTaskPlanDigest = timeoutIncidentDigest([checkpointTask]);
    const checkpointReceipt = { version:2, runId:"checkpoint-run",
      candidate:{ ...checkpointFailure.lineage }, registryDigest:checkpointRegistryDigest,
      plan:{ mode:"exact", requestedPackIds:["verification_process"],
        selectedPackIds:["verification_process"], changedPaths:["scripts/checkpoint.mjs"],
        taskPlanDigest:checkpointTaskPlanDigest,
        executionPrerequisites:[{ key:checkpointTask.key, requiredCapabilities:[],
          route:"workspace-sandbox" }] },
      checkpointAttempt:{ id:"attempt-1", action:"created", identityDigest:"4".repeat(64) },
      tasks:{} };
    const checkpointProofFailure = { ...checkpointIncident.failure,
      planDigest:timeoutIncidentDigest(checkpointReceipt.plan) };
    const checkpointProofIncident = { ...checkpointIncident, failure:checkpointProofFailure,
      failureDigest:timeoutIncidentDigest(checkpointProofFailure) };
    const sourceReceiptLoader = async() => ({
      path:checkpointFailure.sourceReceipt,
      bytes:Buffer.from(`${JSON.stringify(checkpointReceipt)}\n`),
      receipt:structuredClone(checkpointReceipt),
    });
    const historicalPlanLoader = async() => ({ commit:"failed-commit", tree:"failed-tree",
      registryDigest:checkpointRegistryDigest, taskPlanDigest:checkpointTaskPlanDigest,
      tasks:[checkpointTask] });
    const checkpointProof = await deriveTaskCheckpointRepairProof(checkpointProofIncident,
      { sourceReceiptLoader, historicalPlanLoader });
    const immutableCheckpointIncident = structuredClone(checkpointProofIncident);
    assert.deepEqual(timeoutRepairDiagnosedBoundary(checkpointProofIncident,
      { taskCheckpointProof:checkpointProof }), {
      kind:"task", taskKey:checkpointTask.key, executionArgs:[...checkpointTask.args],
    }, "receipt-bound prelaunch checkpoint identity derives a repair-only exact task boundary");
    assert.match(checkpointProof.causalKey, /^[a-f0-9]{64}$/u);
    assert.equal(checkpointProof.sourceReceipt.sha256,
      timeoutIncidentDigest(Buffer.from(`${JSON.stringify(checkpointReceipt)}\n`)));
    assert.equal(checkpointProof.registryDigest, checkpointRegistryDigest);
    assert.equal(checkpointProof.taskDigest, verificationTaskDigest(checkpointTask));
    assert.doesNotThrow(() => timeoutRepairFocusedTaskPlan(checkpointProofIncident,
      ["scripts/verification-execution/execute.mjs"], checkpointTask.key,
      [...timeoutCanonicalIdentities, checkpointTask], undefined, checkpointProof));
    await assert.rejects(() => deriveTaskCheckpointRepairProof(checkpointProofIncident, {
      sourceReceiptLoader:async() => {
        const receipt = { ...checkpointReceipt, tasks:{ [checkpointTask.key]:{
          identity:checkpointTask, status:"passed", provenance:"fresh" } } };
        return { path:checkpointFailure.sourceReceipt,
          bytes:Buffer.from(`${JSON.stringify(receipt)}\n`), receipt };
      },
      historicalPlanLoader,
    }), /prelaunch checkpoint proof/u,
    "a task that launched before drift cannot acquire repair-only compatibility");
    await assert.rejects(() => deriveTaskCheckpointRepairProof(checkpointProofIncident, {
      sourceReceiptLoader,
      historicalPlanLoader:async() => ({ ...(await historicalPlanLoader()), tasks:[] }),
    }), /canonical task proof/u,
    "a task absent from the failure registry remains blocking");
    await assert.rejects(() => deriveTaskCheckpointRepairProof(checkpointProofIncident, {
      sourceReceiptLoader:async() => ({ path:checkpointFailure.sourceReceipt,
        bytes:Buffer.from("modified receipt"), receipt:checkpointReceipt }),
      historicalPlanLoader,
    }), /immutable receipt proof/u,
    "a missing or modified receipt cannot establish compatibility");
    await assert.rejects(() => deriveTaskCheckpointRepairProof(checkpointProofIncident, {
      sourceReceiptLoader,
      historicalPlanLoader:async() => ({ ...(await historicalPlanLoader()),
        tasks:[{ ...checkpointTask, args:["test/different-task.mjs"] }] }),
    }), /canonical task proof/u,
    "a registry task digest different from the immutable incident remains blocking");
    const nonTaskBoundaryFailure = { ...checkpointProofFailure,
      failedBoundary:{ ...checkpointProofFailure.failedBoundary, operation:"artifact-binding" } };
    const nonTaskBoundaryIncident = { ...checkpointProofIncident, failure:nonTaskBoundaryFailure,
      failureDigest:timeoutIncidentDigest(nonTaskBoundaryFailure) };
    await assert.rejects(() => deriveTaskCheckpointRepairProof(nonTaskBoundaryIncident,
      { sourceReceiptLoader, historicalPlanLoader }), /no trusted task-checkpoint repair shape/u,
    "checkpoint operations other than task retain their existing boundary route");
    assert.throws(() => timeoutRepairDiagnosedBoundary(checkpointProofIncident),
      /no trusted repair boundary/u,
      "the immutable incident alone never manufactures the repair-only boundary");
    assert.deepEqual(checkpointProofIncident, immutableCheckpointIncident,
      "repair-only derivation does not add retry scope or mutate the immutable incident");
    const checkpointRepairCandidate = { commit:"repair-commit", tree:"repair-tree" };
    const checkpointEligibleIncident = { ...checkpointProofIncident, repair:{ status:"eligible",
      candidate:checkpointRepairCandidate, checkpoint:{ baseCommit:"repair-base",
        evidenceTask:"checkpoint-repair" }, causalCategory:"readiness",
      causalExplanation:"checkpoint stage now quiesces before repair planning",
      taskCheckpointProof:checkpointProof,
      regression:{ key:checkpointTask.key, status:"passed", commit:"repair-commit",
        receiptSha256:"5".repeat(64) }, focusedReceipt:{ status:"passed", commit:"repair-commit",
        provenance:"fresh", receiptSha256:"6".repeat(64) },
      causalProtocol:{ version:2, incidentId:checkpointProofIncident.id,
        failureDigest:checkpointProofIncident.failureDigest,
        preRepairResult:{ status:"failed" }, repairResult:{ status:"passed" } } } };
    const checkpointAdmission = await buildEligibleRepairAdmissions({
      incidents:[checkpointEligibleIncident], plan:{ tasks:[checkpointTask] }, packs:[],
      candidate:checkpointRepairCandidate, baseCommit:"repair-base",
      evidenceTask:"checkpoint-repair", changeSetDigest:"7".repeat(64),
      planDigest:"8".repeat(64),
    });
    assert.equal(checkpointAdmission.entries[0].causalKey, checkpointProof.causalKey,
      "fresh selected coverage admits the repair-only causal key without rewriting the incident");
    const receiptDirectory = path.join(incidentFixtureRoot, "tmp", "verification-receipts");
    await mkdir(receiptDirectory, { recursive:true });
    const writeRunnerReceipt = async(name, receipt) => {
      const target = path.join(receiptDirectory, `${name}.json`);
      const completeReceipt = { registryDigest:failure.registryDigest, ...receipt,
        ...(receipt.diagnostic ? { diagnostic:{ registryDigest:failure.registryDigest,
          ...receipt.diagnostic } } : {}) };
      await writeFile(target, `${JSON.stringify({ version:2, runId:name,
        completedAt:"2026-08-09T00:00:01.000Z", ...completeReceipt })}\n`);
      return target;
    };
    assert.equal(first.state, "unresolved");
    const concurrentIncidents = await Promise.all([
      store.create({ ...failure, runnerRunId:"run-concurrent-one" }),
      store.create({ ...failure, runnerRunId:"run-concurrent-two" }),
    ]);
    assert.equal(new Set(concurrentIncidents.map(({ id }) => id)).size, 2,
      "concurrent incident writers retain independent stable ids");
    assert.equal((await store.list()).filter(({ id }) =>
      concurrentIncidents.some((incident) => incident.id === id)).length, 2,
    "concurrent incident writers retain both immutable documents");
    assert.equal((await store.blocking({ commit:"failed-commit" })).length, 6);
    const caseProgressLines = [];
    let caseProgressNow = 100;
    const emitCaseProgress = verificationProgressEmitter({
      emit:(line) => caseProgressLines.push(line),
      now:() => caseProgressNow,
    });
    emitCaseProgress({
      boundary:"process", caseId:"scenario-17", phase:"assertion",
      executionArgs:["acceptance-pack-runner", "property-set", "scenario-17"],
      state:{ settled:false },
    });
    caseProgressNow += 1;
    const caseTask = {
      key:"acceptance:property-set-case", stage:"acceptance", packId:"property_set_flow_sections",
      executable:"bb", args:["acceptance-pack-runner", "property-set"],
    };
    const caseProgressTracker = createVerificationProgressTracker({ taskKey:caseTask.key });
    assert.equal(caseProgressTracker.acceptLine(caseProgressLines[0]), true);
    const caseStore = createTimeoutIncidentStore({
      root:incidentFixtureRoot,
      storeDirectory:path.join(incidentFixtureRoot, "case-incidents"),
      randomId:() => "case-integration-incident",
    });
    const caseIncident = await caseStore.create({
      ...failure, runnerRunId:"run-case-integration", task:caseTask,
      failedBoundary:caseProgressTracker.snapshot(), lastProgress:undefined,
    });
    assert.deepEqual(caseIncident.failure.retryScope, {
      kind:"case", caseId:"scenario-17",
      executionArgs:["acceptance-pack-runner", "property-set", "scenario-17"],
    }, "emitted executable case identity survives tracker, incident creation, and retry selection");
    const claim = await store.claimDiagnosticRetry(first.id, first.failure.retryIdentity);
    assert.equal(claim.retry.status, "claimed", "retry allowance is consumed before execution starts");
    await assert.rejects(store.claimDiagnosticRetry(first.id, first.failure.retryIdentity), /already used/u);
    const firstDiagnosticReceipt = await writeRunnerReceipt("diagnostic-first", {
      candidate:{ commit:"failed-commit", tree:"failed-tree" },
      environment:failure.environment, artifact:failure.artifact,
      diagnostic:{ incidentId:first.id, retryIdentity:first.failure.retryIdentity,
        scope:first.failure.retryScope, resolvedDeadlines:first.failure.resolvedDeadlines },
      tasks:{ [failure.task.key]:{ identity:failure.task, status:"failed", provenance:"fresh",
        runnerOwnedTimeout:true, reliabilityFailureFingerprint:failure.fingerprint } },
    });
    const classifiedFirst = await store.classifyDiagnosticRetry(first.id, firstDiagnosticReceipt);
    const classifications = {};
    let confirmedFlakyFixture;
    const fabricated = await store.create({ ...failure, runnerRunId:"run-fabricated" });
    await store.claimDiagnosticRetry(fabricated.id, fabricated.failure.retryIdentity);
    await assert.rejects(store.classifyDiagnosticRetry(fabricated.id, { outcome:"passed" }),
      /runner receipt path/u, "caller-asserted outcomes are never classification evidence");
    for (const [outcome, classification] of Object.entries({
      passed:"confirmed-flaky", sameFailure:"reproduced-failure", failed:"changed-failure",
      identityChanged:"diagnostic-contract-failure", registryChanged:"diagnostic-contract-failure",
      toolchainChanged:"diagnostic-contract-failure",
    })) {
      const separate = await store.create({ ...failure, runnerRunId:`run-${outcome}` });
      await store.claimDiagnosticRetry(separate.id, separate.failure.retryIdentity);
      const diagnosticReceipt = await writeRunnerReceipt(`diagnostic-${outcome}`, {
        candidate:{ commit:"failed-commit", tree:"failed-tree" },
        registryDigest:outcome === "registryChanged" ? "2".repeat(64) : failure.registryDigest,
        environment:outcome === "toolchainChanged"
          ? { ...failure.environment, node:"25.0.0" } : failure.environment,
        artifact:failure.artifact,
        diagnostic:{ incidentId:separate.id,
          retryIdentity:outcome === "identityChanged" ? "changed" : separate.failure.retryIdentity,
          registryDigest:outcome === "registryChanged" ? "2".repeat(64) : failure.registryDigest,
          scope:separate.failure.retryScope, resolvedDeadlines:separate.failure.resolvedDeadlines },
        tasks:{ [failure.task.key]:{ identity:failure.task,
          status:outcome === "passed" ? "passed" : "failed", provenance:"fresh",
          ...(outcome === "sameFailure"
            ? { reliabilityFailureFingerprint:failure.fingerprint }
            : { reliabilityFailureFingerprint:"8".repeat(64) }) } },
      });
      const classified = await store.classifyDiagnosticRetry(separate.id, diagnosticReceipt);
      assert.equal(classified.retry.classification, classification);
      assert.equal(classified.state, "unresolved");
      if (outcome === "passed") confirmedFlakyFixture = classified;
      classifications[outcome] = classified.retry.classification;
    }
    const nonTimeoutEvidence = {};
    const nonTimeoutFailures = [{
      name:"hit-test",
      failure:{ ...failure, runnerRunId:"run-hit-test", failureClass:"explicit-logical-failure",
        fingerprint:"6".repeat(64), failedBoundary:{ boundary:"target", logicalTargetId:"LAYOUT_TARGET",
          phase:"assertion", assertionSite:"layout-target.mjs:42:7",
          state:{ message:"center point is outside the visible control", x:412, y:37 } } },
    }, {
      name:"property-set-settling",
      failure:{ ...failure, runnerRunId:"run-property-set-settling",
        failureClass:"explicit-logical-failure", fingerprint:"7".repeat(64),
        task:{ key:"acceptance:property-set-settling", stage:"acceptance", packId:"property_set_flow_sections",
          executable:"bb", args:["acceptance-pack-runner", "property-set"] },
        failedBoundary:{ boundary:"process", caseId:"property-set-settles", phase:"assertion",
          assertionSite:"property-set-workflow.mjs:184:11",
          executionArgs:["acceptance-pack-runner", "property-set", "property-set-settles"],
          state:{ settled:false, renderedApplications:1, durableApplications:0 } } },
    }];
    for (const fixture of nonTimeoutFailures) {
      const incident = await store.create(fixture.failure);
      assert.ok(["target", "case"].includes(incident.failure.retryScope.kind),
        `${fixture.name} retains its smallest executable boundary`);
      await store.claimDiagnosticRetry(incident.id, incident.failure.retryIdentity);
      const diagnosticReceipt = await writeRunnerReceipt(`diagnostic-${fixture.name}`, {
        candidate:{ commit:"failed-commit", tree:"failed-tree" },
        environment:failure.environment, artifact:failure.artifact,
        diagnostic:{ incidentId:incident.id, retryIdentity:incident.failure.retryIdentity,
          scope:incident.failure.retryScope, resolvedDeadlines:incident.failure.resolvedDeadlines },
        tasks:{ [fixture.failure.task.key]:{ identity:fixture.failure.task,
          status:"passed", provenance:"fresh" } },
      });
      const classified = await store.classifyDiagnosticRetry(incident.id, diagnosticReceipt);
      assert.equal(classified.retry.classification, "confirmed-flaky",
        `${fixture.name} remains blocking after an unchanged pass`);
      nonTimeoutEvidence[fixture.name] = {
        classification:classified.retry.classification, state:classified.state,
        retryScope:classified.failure.retryScope,
        phase:fixture.failure.failedBoundary.phase,
        assertionSite:fixture.failure.failedBoundary.assertionSite,
        fingerprint:classified.failure.fingerprint,
        boundedState:classified.failure.failedBoundary.state,
      };
    }
    const runnerRegressionPath = path.join(incidentFixtureRoot, "artifact-lock-runner-regression.mjs");
    await writeFile(runnerRegressionPath, `
  import { createHash } from "node:crypto";
  const normalized = (value) => Array.isArray(value) ? value.map(normalized) :
    value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalized(nested)])) : value;
  const digest = (value) => createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const observe = (reclaim) => reclaim
    ? { outcome:"acquired", ownerPid:4103, remainingWaiters:0 }
    : { outcome:"blocked", ownerPid:4102, remainingWaiters:1 };
  const fixture = {
    id:"artifact-lock-dead-owner-runner-v1",
    causalCategory:"artifact/process locking",
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{ deadOwnerPid:4102, waiterPid:4103 },
    expectedPreRepairFailure:observe(false),
    expectedRepairResult:observe(true),
  };
  const fixtureDigest = digest(fixture);
  console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
    version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:observe(false) },
    repairResult:{ status:"passed", fixtureDigest, observed:observe(true) },
  } }));
  console.log("repairTmp=" + process.env.TMPDIR);
  `);
    const runnerTask = verificationTaskIdentity({
      key:"unit:artifact-lock-runner-regression", stage:"unit", packId:"shell",
      executable:"node", args:[runnerRegressionPath],
    });
    const runnerRuntimeTask = { ...runnerTask, temporaryPathClass:"chrome-short" };
    const runnerRepairCandidate = { commit:"e".repeat(40), tree:"d".repeat(40) };
    let runnerIncidentSequence = 0;
    const runnerStore = createTimeoutIncidentStore({
      root:incidentFixtureRoot,
      storeDirectory:path.join(incidentFixtureRoot, "runner-incidents"),
      now:() => "2026-08-09T00:00:00.000Z",
      randomId:() => `runner-path-incident-${runnerIncidentSequence += 1}`,
      isAncestor:async(ancestor) => ancestor !== "off-lineage",
      currentCandidate:async() => runnerRepairCandidate,
      changedPaths:async() => ["src/repair.ts"],
      canonicalRepairTaskIdentities:async() => [runnerTask],
    });
    const runnerFailure = { ...failure, runnerRunId:"runner-path-timeout", task:runnerTask,
      lastProgress:undefined };
    const runnerIncident = await runnerStore.create(runnerFailure);
    await runnerStore.claimDiagnosticRetry(runnerIncident.id, runnerIncident.failure.retryIdentity);
    const runnerDiagnosticReceipt = await writeRunnerReceipt("runner-path-diagnostic", {
      candidate:{ commit:"failed-commit", tree:"failed-tree" },
      environment:failure.environment, artifact:failure.artifact,
      diagnostic:{ incidentId:runnerIncident.id, retryIdentity:runnerIncident.failure.retryIdentity,
        scope:runnerIncident.failure.retryScope,
        resolvedDeadlines:runnerIncident.failure.resolvedDeadlines },
      tasks:{ [runnerTask.key]:{ identity:runnerTask, status:"failed", provenance:"fresh",
        runnerOwnedTimeout:true } },
    });
    await runnerStore.classifyDiagnosticRetry(runnerIncident.id, runnerDiagnosticReceipt);
    const offLineageTask = verificationTaskIdentity({
      key:"unit:off-lineage-runner-regression", stage:"unit", packId:"shell",
      executable:"node", args:[runnerRegressionPath],
    });
    await runnerStore.create({ ...runnerFailure, runnerRunId:"off-lineage-runner-path",
      lineage:{ ...runnerFailure.lineage, commit:"off-lineage", tree:"off-lineage-tree" },
      task:offLineageTask });
    const runnerReceiptDirectory = path.join(incidentFixtureRoot, "tmp", "verification-receipts");
    const runnerRepair = await runTimeoutRepairFocused(runnerIncident.id, {
      regressionKey:runnerTask.key,
      causalCategory:"artifact/process locking",
      causalExplanation:"a dead owner retains the artifact lock",
      baseCommit:"approved-base",
      evidenceTask:"vtd014-runner-path",
      store:runnerStore,
      candidateIdentity:async() => ({ ...runnerRepairCandidate, branch:"candidate" }),
      artifactIdentity:async() => failure.artifact,
      canonicalPlan:{ tasks:[runnerRuntimeTask] },
      strictToolchainValidator:async() => {},
      candidateCleanValidator:async() => {},
      changeSetLoader:async() => ({ version:1, baseCommit:"approved-base",
        commit:runnerRepairCandidate.commit,
        entries:[{ status:"M", path:"src/repair.ts" },
          { status:"M", path:"swarmforge/roles/coder.prompt" }],
        paths:["src/repair.ts", "swarmforge/roles/coder.prompt"] }),
      incidentChangedPathsLoader:async() => ["src/repair.ts"],
      verificationPacksLoader:async() => [{ id:"shell", source:["src/repair.ts"],
        unit:[runnerRegressionPath] }],
      verificationPacksValidator:async() => {},
      receiptContextFactory:(concurrency, observationConcurrency, options) => createVerificationReceiptContext(
        concurrency, observationConcurrency, { ...options, receiptDirectory:runnerReceiptDirectory }),
    });
    assert.equal(runnerRepair.incident.repair.status, "eligible",
      "the supported focused runner executes and validates the selected causal regression task");
    const runnerReceipt = JSON.parse(await readFile(runnerRepair.receiptPath, "utf8"));
    assert.match(runnerReceipt.tasks[runnerTask.key].output,
      /artifact-lock-dead-owner-runner-v1/u,
    "runner-owned evidence contains the bounded result produced by the selected causal fixture");
    assert.match(runnerReceipt.tasks[runnerTask.key].output, /repairTmp=\/tmp\/sf-chrome\//u,
      "incident replay reattaches the registered short temporary route before launch");
    const repairRejections = {};
    const captureRepairRejection = async(name, operation, pattern) => {
      try { await operation; }
      catch (error) {
        assert.match(error.message, pattern);
        repairRejections[name] = error.message;
        return;
      }
      assert.fail(`${name} repair proposal was not rejected`);
    };
    await captureRepairRejection("limitOnly", validateTimeoutRepairProposal(first, {
      candidate:{ commit:"repair-commit", tree:"repair-tree" }, changedPaths:["verification/performance-calibration.json"],
      causalCategory:"artifact/process locking", causalExplanation:"stale lock ownership",
      checkpoint:{ baseCommit:"approved-base", evidenceTask:"vtd014" },
      regression:{ key:"unit:test/verification-process-contract-test.mjs", status:"passed", commit:"repair-commit" },
      focusedReceipt:{ status:"passed", commit:"repair-commit", provenance:"fresh" },
    }, { isAncestor:async () => true }), /limit-only/u);
    await captureRepairRejection("unproven", validateTimeoutRepairProposal(first, {
      candidate:{ commit:"repair-commit", tree:"repair-tree" }, changedPaths:["scripts/dist-artifact-lock.mjs"],
      causalCategory:"artifact/process locking", causalExplanation:"stale lock ownership",
      checkpoint:{ baseCommit:"approved-base", evidenceTask:"vtd014" },
      focusedReceipt:{ status:"passed", commit:"repair-commit", provenance:"fresh" },
    }, { isAncestor:async () => true }), /deterministic regression/u);
    await captureRepairRejection("stale", validateTimeoutRepairProposal(first, {
      candidate:{ commit:"repair-commit", tree:"repair-tree" }, changedPaths:["scripts/dist-artifact-lock.mjs"],
      causalCategory:"artifact/process locking", causalExplanation:"stale lock ownership",
      checkpoint:{ baseCommit:"approved-base", evidenceTask:"vtd014" },
      regression:{ key:"unit:test/verification-process-contract-test.mjs", status:"passed", commit:"repair-commit" },
      focusedReceipt:{ status:"passed", commit:"failed-commit", provenance:"fresh" },
    }, { isAncestor:async () => true }), /fresh focused verification/u);
    await captureRepairRejection("unchangedCandidate", validateTimeoutRepairProposal(first, {
      candidate:{ commit:"failed-commit", tree:"failed-tree" }, changedPaths:["scripts/dist-artifact-lock.mjs"],
      causalCategory:"artifact/process locking", causalExplanation:"stale lock ownership",
      checkpoint:{ baseCommit:"approved-base", evidenceTask:"vtd014" },
      regression:{ key:"unit:test/verification-process-contract-test.mjs", status:"passed", commit:"failed-commit" },
      focusedReceipt:{ status:"passed", commit:"failed-commit", provenance:"fresh" },
    }, { isAncestor:async () => true }), /descendant changed candidate/u);
    const validRepairProposal = {
      candidate:{ commit:"repair-commit", tree:"repair-tree" },
      changedPaths:["scripts/verification-execution-prerequisites.mjs"],
      causalCategory:"sandbox capability declaration/first-run routing",
      causalExplanation:"the declared loopback route was missing",
      checkpoint:{ baseCommit:"approved-base", evidenceTask:"vtd014" },
      regression:{ key:"unit:test/verification-process-contract-test.mjs", status:"passed",
        commit:"repair-commit" },
      focusedReceipt:{ status:"passed", commit:"repair-commit", provenance:"fresh" },
    };
    const environmentIncident = structuredClone(first);
    environmentIncident.failure.failureClass = "environment-contract-failure";
    environmentIncident.failure.task = verificationTaskIdentity({
      key:"unit:test/environment-contract-test.mjs", stage:"unit", packId:"shell",
      executable:"node", args:["test/environment-contract-test.mjs"],
    });
    delete environmentIncident.failure.retryScope;
    environmentIncident.failureDigest = timeoutIncidentDigest(environmentIncident.failure);
    assert.deepEqual(timeoutRepairDiagnosedBoundary(environmentIncident), {
      kind:"task", taskKey:environmentIncident.failure.task.key,
      executionArgs:[...environmentIncident.failure.task.args],
    }, "an immutable pre-scope environment incident remains narrowly repairable by canonical task");
    await assert.rejects(validateTimeoutRepairProposal(environmentIncident, {
      ...validRepairProposal, causalCategory:"readiness",
    }, { isAncestor:async() => true }), /cannot relabel/u,
    "environment-contract incidents require the narrow capability-routing repair category");
    await assert.rejects(validateTimeoutRepairProposal(first, validRepairProposal,
      { isAncestor:async() => true }), /cannot relabel/u,
    "capability-routing repairs cannot resolve assertion, readiness, hit-test, or reliability incidents");
    await assert.rejects(store.proposeRepair(first.id, {
      candidate:{ commit:"repair-commit", tree:"repair-tree" },
      causalCategory:"artifact/process locking", causalExplanation:"stale lock ownership",
      regression:{ key:"unit:lock", status:"passed" },
      focusedReceipt:{ status:"passed" },
    }), /runner receipt path/u, "caller-asserted pass fields are never repair evidence");
    const repairReceiptBase = { candidate:{ commit:"repair-commit", tree:"repair-tree",
        baseCommit:"approved-base", evidenceTask:"vtd014" },
      environment:failure.environment, artifact:failure.artifact };
    const causalCategory = "artifact/process locking";
    const causalExplanation = "stale lock ownership survives a dead process";
    const regressionKey = "unit:test/verification-contracts/execution-binding-contract-test.mjs";
    const causalRegression = artifactLockTimeoutRepairRegression({
      incidentId:first.id,
      failureDigest:first.failureDigest,
      diagnosedBoundary:first.failure.retryScope,
    });
    const regressionProtocol = { swarmforgeTimeoutRepairRegression:causalRegression };
    const regressionReceiptPath = await writeRunnerReceipt("repair-regression", {
      ...repairReceiptBase, tasks:{ [regressionKey]:{ identity:timeoutCanonicalIdentities.find(
        ({ key }) => key === regressionKey),
        status:"passed", provenance:"fresh", durationMs:1,
        output:`${JSON.stringify(regressionProtocol)}\n` } },
    });
    const focusedTaskPlan = timeoutRepairFocusedTaskPlan(first,
      ["scripts/dist-artifact-lock.mjs"], regressionKey, canonicalRepairIdentities);
    const focusedExecutionTaskPlan = timeoutRepairFocusedExecutionTaskPlan(
      focusedTaskPlan, canonicalRepairIdentities);
    const buildIdentity = timeoutCanonicalIdentities.find(({ key }) => key === "build:dist");
    const focusedPassingTasks = (protocol) => Object.fromEntries(focusedExecutionTaskPlan
      .map(({ identity }) => [identity.key, {
        identity, status:"passed", provenance:"fresh", durationMs:1,
        ...(identity.key === failure.task.key
          ? { execution:{ args:first.failure.retryScope.executionArgs, logicalTargetIds:[] } }
          : {}),
        ...(identity.key === regressionKey && protocol
          ? { output:`${JSON.stringify({ swarmforgeTimeoutRepairRegression:protocol })}\n` }
          : {}),
      }]));
    const focusedReceiptPath = await writeRunnerReceipt("repair-focused", {
      ...repairReceiptBase, plan:{ mode:"timeout-repair-focused", incidentId:first.id,
        causalCategory, causalExplanation, taskPlan:focusedTaskPlan,
        executionTaskPlan:focusedExecutionTaskPlan }, tasks:focusedPassingTasks(causalRegression),
    });
    const writeFocusedCausalReceipt = async(name, protocol) => writeRunnerReceipt(name, {
      ...repairReceiptBase, plan:{ mode:"timeout-repair-focused", incidentId:first.id,
        causalCategory, causalExplanation, taskPlan:focusedTaskPlan,
        executionTaskPlan:focusedExecutionTaskPlan }, tasks:focusedPassingTasks(protocol),
    });
    const genericPassingReceipt = await writeFocusedCausalReceipt("repair-focused-generic-pass");
    await assert.rejects(store.proposeRepair(first.id, {
      causalCategory, causalExplanation, regressionKey,
      regressionReceiptPath:genericPassingReceipt, focusedReceiptPath:genericPassingReceipt,
    }), /causal regression protocol/u,
    "a generic passing task without causal output cannot authorize a repair");
    const echoedProtocolReceipt = await writeFocusedCausalReceipt("repair-focused-echoed-protocol", {
      version:1, incidentId:first.id, failureDigest:first.failureDigest,
      causalCategory, causalExplanation, diagnosedBoundary:first.failure.retryScope,
      preRepairOutcome:"reproduced-timeout", forcedFixture:true, repairOutcome:"passed",
    });
    await assert.rejects(store.proposeRepair(first.id, {
      causalCategory, causalExplanation, regressionKey,
      regressionReceiptPath:echoedProtocolReceipt, focusedReceiptPath:echoedProtocolReceipt,
    }), /cause-specific fixture evidence/u,
    "echoing runner-owned fields and success literals cannot authorize a repair");
    const mismatchedFixture = structuredClone(causalRegression);
    mismatchedFixture.fixture.causalCategory = "readiness";
    const mismatchedFixtureDigest = timeoutIncidentDigest(mismatchedFixture.fixture);
    mismatchedFixture.preRepairResult.fixtureDigest = mismatchedFixtureDigest;
    mismatchedFixture.repairResult.fixtureDigest = mismatchedFixtureDigest;
    const mismatchedFixtureReceipt = await writeFocusedCausalReceipt(
      "repair-focused-mismatched-fixture", mismatchedFixture);
    await assert.rejects(store.proposeRepair(first.id, {
      causalCategory, causalExplanation, regressionKey,
      regressionReceiptPath:mismatchedFixtureReceipt, focusedReceiptPath:mismatchedFixtureReceipt,
    }), /cause-specific fixture evidence/u,
    "a fixture for a different causal category cannot authorize a repair");
    const noObservedFailure = structuredClone(causalRegression);
    noObservedFailure.preRepairResult.status = "passed";
    const noObservedFailureReceipt = await writeFocusedCausalReceipt(
      "repair-focused-no-observed-failure", noObservedFailure);
    await assert.rejects(store.proposeRepair(first.id, {
      causalCategory, causalExplanation, regressionKey,
      regressionReceiptPath:noObservedFailureReceipt, focusedReceiptPath:noObservedFailureReceipt,
    }), /observed pre-repair failure/u,
    "a regression without an observed pre-repair failure cannot authorize a repair");
    await assert.rejects(store.proposeRepair(first.id, {
      causalCategory:"banana", causalExplanation, regressionKey, regressionReceiptPath, focusedReceiptPath,
    }), /causal category/u, "an arbitrary causal label cannot authorize a repair");
    const unrelatedFocusedReceiptPath = await writeRunnerReceipt("repair-focused-unrelated", {
      ...repairReceiptBase, plan:{ mode:"timeout-repair-focused", incidentId:first.id,
        causalCategory, causalExplanation, taskPlan:focusedTaskPlan,
        executionTaskPlan:focusedExecutionTaskPlan },
      tasks:{ "unit:totally-unrelated-pack":{ identity:{ key:"unit:totally-unrelated-pack" },
        status:"passed", provenance:"fresh", durationMs:1 } },
    });
    await captureRepairRejection("unrelated", store.proposeRepair(first.id, {
      causalCategory, causalExplanation, regressionKey, regressionReceiptPath,
      focusedReceiptPath:unrelatedFocusedReceiptPath,
    }), /focused repair plan/u);
    const forgedIdentityReceiptPath = await writeRunnerReceipt("repair-focused-forged-identity", {
      ...repairReceiptBase, plan:{ mode:"timeout-repair-focused", incidentId:first.id,
        causalCategory, causalExplanation, taskPlan:focusedTaskPlan,
        executionTaskPlan:focusedExecutionTaskPlan }, tasks:{
        [buildIdentity.key]:{ identity:buildIdentity, status:"passed", provenance:"fresh", durationMs:1 },
        [failure.task.key]:{ identity:{ ...failure.task, args:["scripts/run-browser-observation.mjs", "B"] },
          status:"passed", provenance:"fresh", durationMs:1 },
        [regressionKey]:{ identity:timeoutCanonicalIdentities.find(({ key }) => key === regressionKey),
          status:"passed", provenance:"fresh", durationMs:1,
          output:`${JSON.stringify(regressionProtocol)}\n` },
      },
    });
    await assert.rejects(store.proposeRepair(first.id, {
      causalCategory, causalExplanation, regressionKey,
      regressionReceiptPath:forgedIdentityReceiptPath, focusedReceiptPath:forgedIdentityReceiptPath,
    }), /focused repair plan/u, "caller-authored keys cannot replace canonical focused identities");
    const proposal = await store.proposeRepair(first.id, {
      causalCategory, causalExplanation, regressionKey,
      regressionReceiptPath:focusedReceiptPath, focusedReceiptPath,
    });
    assert.equal(proposal.repair.status, "eligible");
    assert.equal((await store.blockingForEvidence({ commit:"repair-commit" }))
      .some(({ id }) => id === first.id), false,
    "an exact-candidate eligible repair may produce the focused evidence required to defer it");
    assert.equal((await store.blockingForEvidence({ commit:"reclaimed-commit" }))
      .some(({ id }) => id === first.id), false,
    "an eligible ancestor repair may enter a fresh descendant review checkpoint before deferral");
    assert.equal((await store.blockingForHandoff({ commit:"reclaimed-commit",
      readiness:"review-ready" })).some(({ id }) => id === first.id), true,
    "the descendant remains handoff-blocked until fresh review and package proof defer the repair");
    await assert.rejects(store.proposeRepair(first.id, {
      causalCategory, causalExplanation, regressionKey,
      regressionReceiptPath:focusedReceiptPath, focusedReceiptPath,
    }), /already has an eligible repair/u,
    "an eligible repair is frozen and cannot be renewed after proposal");
    assert.equal(proposal.transitions.filter(({ type }) => type === "repair-proposed").length, 1);
    assert.equal(proposal.transitions.some(({ type }) => type === "repair-renewed"), false,
      "the frozen repair state machine never emits repair-renewed");
    const governedAttemptPlan = { mode:"timeout-repair-focused", incidentId:first.id,
      taskPlan:focusedTaskPlan, executionTaskPlan:focusedExecutionTaskPlan };
    const governedAttemptFailure = { ...structuredClone(first.failure),
      runnerRunId:"governed-repair-attempt-run",
      sourceReceipt:"tmp/verification-receipts/governed-repair-attempt.json",
      lineage:{ ...structuredClone(first.failure.lineage), commit:"repair-commit", tree:"repair-tree" },
      planDigest:timeoutIncidentDigest(governedAttemptPlan) };
    const governedAttemptIncident = await store.recordRepairAttemptFailure(first.id, {
      failure:governedAttemptFailure, plan:governedAttemptPlan,
      sourceReceipt:governedAttemptFailure.sourceReceipt,
      runId:governedAttemptFailure.runnerRunId,
    });
    assert.equal(governedAttemptIncident.id, first.id,
      "a failed repair task remains an attempt on its governed incident");
    assert.equal(governedAttemptIncident.repairAttempts.length, 1);
    assert.equal(governedAttemptIncident.transitions.filter(
      ({ type }) => type === "repair-attempt-failed").length, 1,
    "the governed incident durably records one failed repair attempt event");
    await assert.rejects(store.recordRepairAttemptFailure(first.id, {
      failure:governedAttemptFailure,
      plan:{ ...governedAttemptPlan, incidentId:"another-incident" },
      sourceReceipt:governedAttemptFailure.sourceReceipt,
      runId:governedAttemptFailure.runnerRunId,
    }), /exact repair plan/u,
    "a repair failure cannot be appended to a different governed incident");
  
    const associationDirectory = path.join(incidentFixtureRoot, "association-incidents");
    let associationNumber = 0;
    const associationStore = createTimeoutIncidentStore({ root:incidentFixtureRoot,
      storeDirectory:associationDirectory, now:() => incidentNow,
      randomId:() => `association-${++associationNumber}`,
      isAncestor:async(ancestor, descendant) => ancestor === descendant ||
        ancestor === "failed-commit" && descendant === "repair-commit" });
    const associationTask = structuredClone(first.failure.task);
    const associationGoverned = await associationStore.create({
      runnerRunId:"governed-origin", lineage:{ commit:"failed-commit", tree:"failed-tree" },
      task:associationTask, failureClass:"nonzero-exit", fingerprint:"a".repeat(64),
    });
    const associationPlan = { mode:"timeout-repair-focused", incidentId:associationGoverned.id,
      taskPlan:[{ identity:associationTask, roles:["diagnosed-boundary"] }],
      executionTaskPlan:[{ identity:associationTask, roles:["diagnosed-boundary"] }] };
    const associationReceiptRelative = "tmp/verification-receipts/governed-child.json";
    await mkdir(path.join(incidentFixtureRoot, "tmp/verification-receipts"), { recursive:true });
    const associationReceipt = {
      version:2, runId:"governed-child-run", runIntent:"repair-focused",
      candidate:{ commit:"repair-commit", tree:"repair-tree" }, plan:associationPlan,
      tasks:{ [associationTask.key]:{ identity:associationTask, status:"failed",
        reliabilityFailureFingerprint:"b".repeat(64) } },
    };
    await writeFile(path.join(incidentFixtureRoot, associationReceiptRelative),
      JSON.stringify(associationReceipt));
    const associationChild = await associationStore.create({
      runnerRunId:"governed-child-run", sourceReceipt:associationReceiptRelative,
      lineage:{ commit:"repair-commit", tree:"repair-tree" }, task:associationTask,
      failureClass:"nonzero-exit", fingerprint:"b".repeat(64),
      planDigest:timeoutIncidentDigest(associationPlan),
    });
    assert.equal((await governedRepairAttemptAssociation({ root:incidentFixtureRoot,
      incident:associationChild, resolveIncident:(id) => associationStore.read(id) }))
      .governedIncidentId, associationGoverned.id,
    "legacy multiplication is associated only through its receipt's resolved governed incident");
    const associationBlocking = await associationStore.blocking({ commit:"repair-commit" });
    assert.equal(associationBlocking.some(({ id }) => id === associationChild.id), false,
      "an exact receipt-proven governed repair child is retained but nonblocking");
    const associatedChild = await associationStore.read(associationChild.id);
    assert.equal(associatedChild.governedRepairAttempt.governedIncidentId, associationGoverned.id);
    assert.equal(associatedChild.transitions.filter(
      ({ type }) => type === "governed-repair-attempt-associated").length, 1);
    const rejectedAssociations = [
      ["intent", { ...structuredClone(associationReceipt), runIntent:"review-evidence" }],
      ["mode", { ...structuredClone(associationReceipt), plan:{ ...associationPlan, mode:"exact" } }],
      ["unresolved-governor", { ...structuredClone(associationReceipt),
        plan:{ ...associationPlan, incidentId:"missing-governed-incident" } }],
      ["task-membership", { ...structuredClone(associationReceipt), plan:{ ...associationPlan,
        executionTaskPlan:[] } }],
    ];
    for (const [name, receipt] of rejectedAssociations) {
      const relative = `tmp/verification-receipts/governed-child-${name}.json`;
      await writeFile(path.join(incidentFixtureRoot, relative), JSON.stringify(receipt));
      const candidate = structuredClone(associationChild);
      candidate.governedRepairAttempt = undefined;
      candidate.transitions = [];
      candidate.failure.sourceReceipt = relative;
      candidate.failure.planDigest = timeoutIncidentDigest(receipt.plan);
      candidate.failureDigest = timeoutIncidentDigest(candidate.failure);
      assert.equal(await governedRepairAttemptAssociation({ root:incidentFixtureRoot,
        incident:candidate, resolveIncident:(id) => associationStore.read(id) }), null,
      `${name} ambiguity remains blocking rather than associating a child incident`);
    }
    const deferred = await store.deferTerminalVerification(first.id, {
      candidate:{ commit:"repair-commit", tree:"repair-tree" },
      reviewReady:{ task:"qa-pilot-fanout-stop", baseCommit:"approved-base",
        candidateCommit:"repair-commit", candidateTree:"repair-tree",
        receiptSha256:"4".repeat(64),
        focusedTaskKeys:[failure.task.key, regressionKey] },
      package:{ path:"build/package/my-chrome-utilities.zip", digest:"5".repeat(64) },
    });
    assert.equal(deferred.state, "unresolved",
      "feature integration defers terminal proof without resolving the incident");
    assert.equal(deferred.terminalVerificationDeferred.status, "terminal-verification-deferred");
    const flakyAdmissionEntry = {
      incidentId:confirmedFlakyFixture.id, failureDigest:confirmedFlakyFixture.failureDigest,
      causalKey:confirmedFlakyFixture.failure.causalKey,
      registryDigest:confirmedFlakyFixture.failure.registryDigest,
      retryIdentity:confirmedFlakyFixture.retry.identity,
      retryReceiptSha256:confirmedFlakyFixture.retry.receiptSha256,
      classificationDigest:timeoutIncidentDigest(confirmedFlakyFixture.retry),
      governedTaskDigest:verificationTaskDigest(confirmedFlakyFixture.failure.task),
      selectedTaskKey:confirmedFlakyFixture.failure.task.key,
      selectedTaskDigest:verificationTaskDigest(confirmedFlakyFixture.failure.task),
      coverageKind:"governed-task",
    };
    const flakyAdmissions = { version:1, evidenceTask:"confirmed-flaky-feature-deferral",
      baseCommit:"approved-base", candidateCommit:"repair-commit", candidateTree:"repair-tree",
      changeSetDigest:"6".repeat(64), planDigest:"7".repeat(64), entries:[flakyAdmissionEntry] };
    const flakyDeferred = await store.deferTerminalVerification(confirmedFlakyFixture.id, {
      candidate:{ commit:"repair-commit", tree:"repair-tree" },
      reviewReady:{ task:"confirmed-flaky-feature-deferral", baseCommit:"approved-base",
        candidateCommit:"repair-commit", candidateTree:"repair-tree",
        receiptSha256:"8".repeat(64), focusedTaskKeys:[confirmedFlakyFixture.failure.task.key] },
      confirmedFlakyAdmissions:flakyAdmissions,
      eligibleRepairTransaction:{ version:1, id:"9".repeat(64), inputDigest:"a".repeat(64) },
      package:{ path:"build/package/my-chrome-utilities.zip", digest:"b".repeat(64) },
    });
    assert.equal(flakyDeferred.terminalVerificationDeferred.basis, "confirmed-flaky");
    assert.equal(flakyDeferred.terminalVerificationDeferred.repairDigest, undefined,
      "confirmed-flaky deferral never invents a repair digest");
    assert.equal(flakyDeferred.state, "unresolved",
      "confirmed-flaky review deferral remains a master checkpoint obligation");
    assert.equal((await store.blockingForHandoff({ commit:"repair-commit",
      readiness:"review-ready" })).some(({ id }) => id === confirmedFlakyFixture.id), false,
    "an exact atomic confirmed-flaky disposition permits normal feature review routing");
    assert.deepEqual(eligibleRepairAdmissionCandidates([deferred]), [],
      "a valid deferred-only preflight continues without creating an admission");
    const malformedDeferred = structuredClone(deferred);
    malformedDeferred.terminalVerificationDeferred.digest = "0".repeat(64);
    assert.deepEqual(eligibleRepairAdmissionCandidates([malformedDeferred]).map(({ id }) => id),
      [deferred.id], "a malformed deferred disposition remains an admission blocker");
    incidentNow = "2026-08-09T00:00:01.000Z";
    const repeatedDeferral = await store.deferTerminalVerification(first.id, {
      candidate:{ commit:"repair-commit", tree:"repair-tree" },
      reviewReady:{ task:"qa-pilot-fanout-stop", baseCommit:"approved-base",
        candidateCommit:"repair-commit", candidateTree:"repair-tree",
        receiptSha256:"4".repeat(64),
        focusedTaskKeys:[failure.task.key, regressionKey] },
      package:{ path:"build/package/my-chrome-utilities.zip", digest:"5".repeat(64) },
    });
    assert.equal(repeatedDeferral.transitions.filter(
      ({ type }) => type === "terminal-verification-deferred").length, 1,
    "revalidating the same handoff proof does not append a duplicate durable transition");
    assert.equal((await store.blockingForHandoff({ commit:"repair-commit",
      readiness:"review-ready" })).some(({ id }) => id === first.id), false,
    "exact deferred proof permits focused review routing");
    const deferredBeforeFeatureRouting = structuredClone(await store.read(first.id));
    assert.equal((await store.blockingForEvidence({ commit:"parallel-feature-commit",
      changedPaths:["scripts/verification-reliability-store.mjs"] }))
      .some(({ id }) => id === first.id), false,
    "path overlap alone does not make an eligible parallel deferral a feature evidence obligation");
    assert.equal((await store.blockingForHandoff({ commit:"parallel-feature-commit",
      readiness:"review-ready" })).some(({ id }) => id === first.id), false,
    "an eligible parallel deferral does not block focused feature review");
    assert.equal((await store.blockingForHandoff({ commit:"parallel-feature-commit",
      readiness:"qa-ready" })).some(({ id }) => id === first.id), false,
    "an eligible parallel deferral does not block QA integration");
    assert.deepEqual(await store.read(first.id), deferredBeforeFeatureRouting,
      "feature evidence and handoff routing leave the parallel disposition immutable");
    const deferralMutations = [];
    await recordEligibleIncidentDeferral({
      deferTerminalVerification:async(id) => deferralMutations.push(["defer", id]),
    }, deferredBeforeFeatureRouting, {
      candidateCommit:"parallel-feature-commit",
      focusedScope:{ taskKeys:[deferredBeforeFeatureRouting.failure.task.key] },
    }, { candidate:{ commit:"parallel-feature-commit" } });
    assert.deepEqual(deferralMutations, [],
      "a passing feature receipt never copies, carries, or re-defers an existing disposition");
    await recordEligibleIncidentDeferral({
      deferTerminalVerification:async(id) => deferralMutations.push(["defer", id]),
    }, {
      ...deferredBeforeFeatureRouting,
      repair:{ ...deferredBeforeFeatureRouting.repair,
        candidate:{ commit:"parallel-feature-commit", tree:"parallel-feature-tree" } },
    }, {
      candidateCommit:"parallel-feature-commit",
      focusedScope:{ taskKeys:[deferredBeforeFeatureRouting.failure.task.key] },
    }, { candidate:{ commit:"parallel-feature-commit" } });
    assert.deepEqual(deferralMutations, [["defer", deferredBeforeFeatureRouting.id]],
      "an explicit eligible repair on the exact current candidate retains case-by-case re-deferral");
    assert.equal((await store.blockingForHandoff({ commit:"reclaimed-commit",
      readiness:"release-candidate" })).some(({ id }) => id === first.id), false,
    "a descendant frozen QA head retains the architect's master-checkpoint route");
    assert.equal((await store.blockingForHandoff({ commit:"parallel-feature-commit",
      readiness:"release-candidate" })).some(({ id }) => id === first.id), false,
    "a parallel deferral retains the frozen QA head's architect checkpoint route");
    assert.equal((await store.blockingForHandoff({ commit:"repair-commit",
      readiness:"final-ready" })).some(({ id }) => id === first.id), true,
    "deferred proof cannot authorize final-ready routing");
    incidentCandidateChangedPaths = ["docs/approved-slice.md", "features/approved-slice.feature"];
    assert.equal((await store.blockingForHandoff({ commit:"parallel-spec-commit", base:"qa-base",
      readiness:"legacy",
      sender:"specifier", verified:"not-required" })).some(({ id }) => id === first.id), false,
    "a specification-only candidate can start from current QA without merging a parallel disposition");
    assert.deepEqual(incidentCandidateChangedRange, ["qa-base", "parallel-spec-commit"],
      "specification-only routing audits the complete handoff change set from its declared base");
    assert.equal((await store.blockingForHandoff({ commit:"spec-commit", base:"qa-base",
      readiness:"legacy",
      sender:"specifier", verified:"not-required" })).some(({ id }) => id === first.id), false,
    "a specification-only descendant can start from current QA without rewriting deferred proof");
    for (const workflowPrompt of [
      "swarmforge/roles/refactorer.prompt", "swarmforge/constitution.prompt",
    ]) {
      incidentCandidateChangedPaths = ["docs/approved-slice.md", workflowPrompt];
      assert.equal((await store.blockingForHandoff({ commit:"spec-commit", base:"qa-base",
        readiness:"legacy",
        sender:"specifier", verified:"not-required" })).some(({ id }) => id === first.id), true,
      `${workflowPrompt} cannot use the specification-only start route`);
    }
    incidentCandidateChangedPaths = ["docs/approved-slice.md", "src/unreviewed-product.ts"];
    assert.equal((await store.blockingForHandoff({ commit:"spec-commit", base:"qa-base",
      readiness:"legacy",
      sender:"specifier", verified:"not-required" })).some(({ id }) => id === first.id), true,
    "a mixed specification and product descendant cannot use the specification-start route");
    incidentCandidate = { commit:"repair-commit", tree:"repair-tree" };
    incidentCandidateChangedPaths = [];
    incidentNow = "2026-08-09T00:00:03.000Z";
    await store.deferTerminalVerification(first.id, {
      candidate:incidentCandidate,
      reviewReady:{ task:"qa-pilot-fanout-stop", baseCommit:"approved-base",
        candidateCommit:"repair-commit", candidateTree:"repair-tree",
        receiptSha256:"4".repeat(64), focusedTaskKeys:[failure.task.key, regressionKey] },
      package:{ path:"build/package/my-chrome-utilities.zip", digest:"5".repeat(64) },
    });
    const incidentState={
      get conservedRebasePair(){return conservedRebasePair;},
      set conservedRebasePair(value){conservedRebasePair=value;},
    };
    vtd014Evidence=await runReliabilityIncidentResolution({
      ...context,assert,associatedChild,boundedClosureContractRevision,browserTargetSuccessionBoundary,canonicalFlowReloadIdentity,caseIncident,causalGroupingEvidence,causalIdentity,changedInnerDeadline,checkpointContractEvidence,claim,classifications,classifiedFirst,classifyFlowReloadModes,closureDisposition,completeInput,concurrentIncidents,createTimeoutIncidentStore,diagnosticRetryScope,domainFixtures,execFile,failure,first,flakyDeferred,flowReloadCausalKey,focusedSelectorOptions,governedAttemptIncident,historicalClassification,incidentFixtureRoot,innerDeadlineIdentityConserved,inputEquivalentTaskProof,integratedResolutionIds,loadTaskSuccessionGraph,mkdir,nonTimeoutEvidence,observeFlowReloadLifecycle,path,planVerification,prerequisiteContractEvidence,prerequisiteGateEvidence,priorPass,progressTracker,projectionPacks,proposal,rawRegisteredCommandsIneligible,readFile,reliabilityFailureFingerprint,rename,repairReceiptBase,repairRejections,resolveIncidentTaskSuccession,resolveTaskSuccessionGraph,rm,sameTargetProjection,sidePanelPaperFirstBrandAcceptanceArtifacts,sidePanelPaperFirstBrandFeatures,store,symlink,taskSuccessionBoundaryDigest,terminalClosureExecution,timeoutCanonicalIdentities,timeoutIncidentDigest,timeoutPackRegistry,timeoutRepairPackIds,timeoutRepairPackageTaskIdentity,timeoutResolutionEvidence,validateIncident,validateUnresolvedIncidentTaskSuccession,verificationDigest,verificationPacksAtCommit,verificationTaskDigest,verificationTaskIdentity,workspaceRestrictionRecorded,writeFile,writeRunnerReceipt,incidentState,
    });
  } finally {
    await rm(incidentFixtureRoot, { recursive:true, force:true });
  }
  return vtd014Evidence;
}
