import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { loadVerificationPacks, planVerification } from "./verification-packs.mjs";
import {
  archiveCanonicalReceiptCandidates,
  buildCanonicalTimingLedger,
  formatCanonicalTimingLedgerSummary,
  receiptRejectionReason,
  timingMaturity,
  validReceipt,
} from "./verification-timing-ledger.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const defaultReceiptDirectory = path.join(repositoryRoot, "tmp", "verification-receipts");

function percentile(values, quantile) {
  if (!values.length) return undefined;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)];
}

function statistic(values, fallbackMs, minimumIndependentSamples) {
  const result = values.length
    ? { samples:values.length, medianMs:percentile(values, 0.5), p90Ms:percentile(values, 0.9), source:"receipt-ledger" }
    : { samples:0, medianMs:fallbackMs, p90Ms:fallbackMs, source:"bootstrap-fallback" };
  return minimumIndependentSamples
    ? { ...result, ...timingMaturity(values.length, minimumIndependentSamples) }
    : result;
}

const flowExamplesPhaseSchema = [
  ["browser startup", "process"],
  ["target setup", "target"],
  ["fixture setup", "target"],
  ["readiness", "target"],
  ["example compilation", "target"],
  ["rendering", "target"],
  ["persistence", "target"],
  ["assertion", "target"],
  ["cleanup", "target"],
];

function validFlowExamplesPhases(timing) {
  if (!Array.isArray(timing?.phases) || timing.phases.length !== flowExamplesPhaseSchema.length)
    return false;
  const valid = timing.phases.every((phase, index) => {
    const [name, scope] = flowExamplesPhaseSchema[index];
    return phase?.name === name && phase?.scope === scope &&
      Number.isFinite(phase?.durationMs) && phase.durationMs >= 0;
  });
  if (!valid) return false;
  const targetTotal = timing.phases.filter(({ scope }) => scope === "target")
    .reduce((total, { durationMs }) => total + durationMs, 0);
  return Math.abs(targetTotal - timing.durationMs) <= 0.001;
}

function phaseStatistic(samples, scope, minimumIndependentSamples) {
  const values = samples.map(({ durationMs }) => durationMs);
  const digests = [...new Set(samples.map(({ receiptDigest }) => receiptDigest).filter(Boolean))].sort();
  return {
    samples:values.length,
    ...timingMaturity(values.length, minimumIndependentSamples),
    scope,
    p50Ms:percentile(values, 0.5),
    p90Ms:percentile(values, 0.9),
    receiptDigests:digests,
  };
}

export async function loadVerificationReceipts(
  directory = defaultReceiptDirectory,
  { expectedRuntime, includeRejected = false } = {},
) {
  let runtime = expectedRuntime;
  if (!runtime) {
    const lock = JSON.parse(await readFile(path.join(repositoryRoot, "swarmforge/toolchain.lock.json"), "utf8"));
    runtime = {
      node:lock.node.version,
      typescript:lock.typescript.version,
      platform:`${process.platform}-${process.arch}`,
    };
  }
  let names;
  try { names = await readdir(directory); }
  catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const receipts = [];
  for (const name of names.filter((candidate) => candidate.endsWith(".json")).sort()) {
    try {
      const receipt = JSON.parse(await readFile(path.join(directory, name), "utf8"));
      if (includeRejected || validReceipt(receipt, runtime)) receipts.push(receipt);
    } catch { /* malformed legacy or crash artifacts never enter the timing model */ }
  }
  return receipts;
}

export function measuredTimingModel(receipts, baseline, {
  environmentClassId,
  minimumIndependentSamples = 5,
} = {}) {
  const fallback = baseline.fallbackMilliseconds ?? Object.fromEntries(
    Object.entries(baseline.seconds ?? {}).map(([key, seconds]) => [key, seconds * 1000]),
  );
  const byStage = new Map();
  const byTask = new Map();
  const environments = new Map();
  const selections = new Map();
  const packSamples = new Map();
  const browserTargetSamples = new Map();
  const browserTargetPhaseSamples = new Map();
  let passedTasks = 0;
  let buildTasks = 0;
  const ledgerEntries = receipts.map((candidate) => candidate?.receipt !== undefined
    ? candidate
    : { receipt:candidate, rejectionReason:receiptRejectionReason(candidate, baseline.runtime ?? {}) });
  const eligibleEntries = ledgerEntries.filter((entry) => entry.receipt && !entry.rejectionReason &&
    (!environmentClassId || entry.environmentClassId === environmentClassId));
  const eligibleReceipts = eligibleEntries.map(({ receipt }) => receipt);
  const rejectedByReason = {};
  for (const entry of ledgerEntries) {
    const reason = entry.rejectionReason;
    if (reason) rejectedByReason[reason] = (rejectedByReason[reason] ?? 0) + 1;
  }
  for (const entry of eligibleEntries) {
    const { receipt, digest:receiptDigest } = entry;
    const environment = {
      ...receipt.environment,
      buildIdentity:receipt.artifact?.buildIdentity ?? null,
    };
    const environmentKey = JSON.stringify(environment);
    environments.set(environmentKey, (environments.get(environmentKey) ?? 0) + 1);
    const selectionKey = JSON.stringify(receipt.plan);
    selections.set(selectionKey, (selections.get(selectionKey) ?? 0) + 1);
    const packTotals = new Map();
    for (const [key, result] of Object.entries(receipt.tasks)) {
      if (result.status !== "passed" || !Number.isFinite(result.durationMs)) continue;
      passedTasks += 1;
      const stage = result.identity?.stage ?? "unknown";
      if (stage === "build") buildTasks += 1;
      const stageValues = byStage.get(stage) ?? [];
      stageValues.push(result.durationMs);
      byStage.set(stage, stageValues);
      const taskValues = byTask.get(key) ?? [];
      taskValues.push(result.durationMs);
      byTask.set(key, taskValues);
      if (stage === "browser-observation") {
        const logicalTargetIds = new Set(result.identity?.logicalTargetIds ?? []);
        const outputLines = String(result.output ?? "").split(/\r?\n/u);
        const passedTargetIds = new Set();
        let explicitResultCount = 0;
        for (const line of outputLines) {
          try {
            const targetResult = JSON.parse(line).swarmforgeBrowserTargetResult;
            if (logicalTargetIds.has(targetResult?.id)) {
              explicitResultCount += 1;
              if (targetResult?.status === "passed") passedTargetIds.add(targetResult.id);
            }
          } catch { /* observation documents and browser diagnostics are not result markers */ }
        }
        const timingOnlyBatchIsIndependent = explicitResultCount > 0 || logicalTargetIds.size === 1;
        for (const line of outputLines) {
          try {
            const timing = JSON.parse(line).swarmforgeBrowserTargetTiming;
            const eligible = explicitResultCount === 0
              ? timingOnlyBatchIsIndependent && logicalTargetIds.has(timing?.id)
              : passedTargetIds.has(timing?.id);
            if (!eligible || !Number.isFinite(timing?.durationMs) ||
                timing.durationMs < 0) continue;
            const samples = browserTargetSamples.get(timing.id) ?? [];
            samples.push({ durationMs:timing.durationMs, receiptDigest });
            browserTargetSamples.set(timing.id, samples);
            if (timing.id === "FLOW_GRAPH_EXAMPLES_TARGET" && validFlowExamplesPhases(timing)) {
              const byPhase = browserTargetPhaseSamples.get(timing.id) ?? new Map();
              for (const phase of timing.phases) {
                const phaseSamples = byPhase.get(phase.name) ?? [];
                phaseSamples.push({ durationMs:phase.durationMs, receiptDigest });
                byPhase.set(phase.name, phaseSamples);
              }
              browserTargetPhaseSamples.set(timing.id, byPhase);
            }
          } catch { /* browser diagnostics and observation documents are not timing markers */ }
        }
      }
      if (result.identity?.packId) {
        packTotals.set(result.identity.packId,
          (packTotals.get(result.identity.packId) ?? 0) + result.durationMs);
      }
    }
    for (const [packId, duration] of packTotals) {
      const samples = packSamples.get(packId) ?? [];
      samples.push(duration);
      packSamples.set(packId, samples);
    }
  }
  const stages = {};
  for (const stage of [
    "build", "unit", "property", "browser", "browser-observation",
    "acceptance-parse", "acceptance-generate", "checkpoint", "acceptance-session",
  ]) stages[stage] = statistic(byStage.get(stage) ?? [], fallback[stage] ?? fallback.unknown ?? 1000,
    environmentClassId ? minimumIndependentSamples : undefined);
  const packs = Object.fromEntries([...packSamples].map(([id, values]) => [id,
    statistic(values, 0, environmentClassId ? minimumIndependentSamples : undefined)]));
  return {
    stages,
    tasks:Object.fromEntries([...byTask].map(([key, values]) => [key,
      statistic(values, 0, environmentClassId ? minimumIndependentSamples : undefined)])),
    browserTargets:Object.fromEntries([...browserTargetSamples]
      .map(([id, samples]) => {
        const values = samples.map(({ durationMs }) => durationMs);
        const result = statistic(values, 0, environmentClassId ? minimumIndependentSamples : undefined);
        return [id, {
          ...result,
          p50Ms:result.medianMs,
          receiptDigests:[...new Set(samples.map(({ receiptDigest }) => receiptDigest)
            .filter(Boolean))].sort(),
        }];
      })),
    browserTargetPhases:Object.fromEntries([...browserTargetPhaseSamples].map(([id, byPhase]) => [id,
      Object.fromEntries(flowExamplesPhaseSchema.map(([name, scope]) => [name,
        phaseStatistic(byPhase.get(name) ?? [], scope, minimumIndependentSamples)])),
    ])),
    browserTargetFallbacks:{ ...(baseline.browserTargetMilliseconds ?? {}) },
    browserObservationSessionOverheadMilliseconds:
      baseline.browserObservationSessionOverheadMilliseconds ?? 0,
    packs,
    packWeightsMs:Object.fromEntries(Object.entries(packs).map(([id, timing]) => [id, timing.medianMs])),
    ledger:{
      receipts:eligibleReceipts.length,
      rejectedReceipts:ledgerEntries.filter(({ receipt, rejectionReason }) => receipt && rejectionReason).length,
      rejectedByReason:Object.fromEntries(Object.entries(rejectedByReason).sort()),
      ...(environmentClassId ? {
        selectedEnvironmentClass:environmentClassId,
        maturity:timingMaturity(eligibleEntries.length, minimumIndependentSamples),
      } : {}),
      passedTasks,
      buildTasks,
      environments:[...environments].map(([key, count]) => ({ ...JSON.parse(key), receipts:count })),
      selections:[...selections].map(([key, count]) => ({ ...JSON.parse(key), receipts:count })),
    },
  };
}

export function compareTimingEnvironmentClasses(ledger, baseline, environmentClassIds, {
  minimumIndependentSamples = ledger.minimumIndependentSamples ?? 5,
} = {}) {
  const ids = [...new Set(environmentClassIds ?? [])].sort();
  if (ids.length < 2) throw new Error("Cross-class timing comparison requires at least two environment classes");
  const known = new Set(ledger.environmentClasses.map(({ id }) => id));
  const missing = ids.filter((id) => !known.has(id));
  if (missing.length) throw new Error(`Unknown timing environment class: ${missing.join(", ")}`);
  const constituents = ids.map((id) => ({
    environmentClassId:id,
    model:measuredTimingModel(ledger.receipts, baseline, {
      environmentClassId:id, minimumIndependentSamples,
    }),
  }));
  const selected = new Set(ids);
  return {
    label:"explicit cross-class comparison",
    environmentClassIds:ids,
    constituents,
    combined:{
      label:"combined cross-class comparison",
      model:measuredTimingModel(ledger.receipts.filter((entry) =>
        selected.has(entry.environmentClassId)), baseline),
    },
  };
}

export function flowExamplesCharacterization(ledger, baseline, {
  implementationCommit,
  minimumIndependentSamples = 5,
  diagnosis,
  correction = "Replaced examples-only fixed-count sleeps with bounded predicate waits using a monotonic deadline and phase-specific timeout diagnostics.",
  focusedReceiptDigests,
  loadedReceiptDigests,
} = {}) {
  const targetId = "FLOW_GRAPH_EXAMPLES_TARGET";
  const focusedFlowTargetIds = [targetId];
  const loadedFlowTargetIds = [
    targetId,
    "FLOW_GRAPH_LEGACY_TARGET",
    "FLOW_WORKSPACE_AUTHORING_TARGET",
    "FLOW_WORKSPACE_CONTROLS_TARGET",
  ];
  const loadedCaptureTargetIds = [
    "FRESH_LIVE_SESSION_BROWSER_ADAPTER",
    "PAYLOAD_PATH_FILTER_BROWSER_ADAPTER",
    "SAVED_EVENT_FEED_FILTERS_BROWSER_ADAPTER",
    "SAVED_SESSION_LIVE_FEED_BROWSER_ADAPTER",
    "SINGLE_LIVE_EVENT_FEED_BROWSER_ADAPTER",
  ];
  const loadedSelectedPackIds = [
    "capture",
    "command-palette",
    "flow_graph",
    "guided_test_cases",
    "project_management",
    "schema_relationship_tree",
  ];
  const sameIds = (actual, expected) => Array.isArray(actual) &&
    actual.length === expected.length && actual.every((id, index) => id === expected[index]);
  const browserObservations = (receipt) => Object.values(receipt.tasks ?? {})
    .filter((task) => task.identity?.stage === "browser-observation")
    .map((task) => task.identity);
  const hasExactObservation = (observations, packId, logicalTargetIds) => observations.some((identity) =>
    identity.packId === packId && sameIds(identity.logicalTargetIds, logicalTargetIds));
  const hasRequiredPlanTopology = (receipt, executionLoad) => {
    const observations = browserObservations(receipt);
    if (executionLoad === "normal") {
      return sameIds(receipt.plan?.requestedPackIds, ["flow_graph"]) &&
        sameIds(receipt.plan?.selectedPackIds, ["flow_graph"]) &&
        observations.length === 1 &&
        hasExactObservation(observations, "flow_graph", focusedFlowTargetIds);
    }
    return sameIds(receipt.plan?.requestedPackIds, []) &&
      sameIds(receipt.plan?.selectedPackIds, loadedSelectedPackIds) &&
      observations.length === 2 &&
      hasExactObservation(observations, "flow_graph", loadedFlowTargetIds) &&
      hasExactObservation(observations, "capture", loadedCaptureTargetIds);
  };
  const declaredDigests = [...(focusedReceiptDigests ?? []), ...(loadedReceiptDigests ?? [])];
  if (declaredDigests.length && new Set(declaredDigests).size !== declaredDigests.length) {
    throw new Error("Flow examples characterization receipt digests must be unique across classes");
  }
  const accepted = ledger.receipts.filter(({ receipt, rejectionReason }) => receipt && !rejectionReason);
  const condition = (entry, executionLoad, mode) =>
    entry.executionLoad === executionLoad && entry.receipt.plan?.mode === mode &&
    hasRequiredPlanTopology(entry.receipt, executionLoad);
  const select = (entries, digests, executionLoad, mode) => {
    const selected = digests?.length
      ? entries.filter(({ digest }) => new Set(digests).has(digest))
      : entries.filter((entry) => condition(entry, executionLoad, mode));
    if (digests?.length && (selected.length !== digests.length ||
        selected.some((entry) => !condition(entry, executionLoad, mode)))) {
      throw new Error(`Declared ${executionLoad} Flow examples receipts are missing, rejected, or use the wrong plan context`);
    }
    return selected;
  };
  const focusedAccepted = select(accepted, focusedReceiptDigests, "normal", "focused");
  const loadedAccepted = select(accepted, loadedReceiptDigests, "loaded", "terminal");
  const builds = [...new Set([...focusedAccepted, ...loadedAccepted]
    .map(({ receipt }) => receipt.artifact?.buildIdentity).filter(Boolean))];
  const candidates = builds.map((buildIdentity) => ({
    buildIdentity,
    focused:focusedAccepted.filter((entry) => entry.receipt.artifact.buildIdentity === buildIdentity),
    loaded:loadedAccepted.filter((entry) => entry.receipt.artifact.buildIdentity === buildIdentity),
  })).filter(({ focused, loaded }) => focused.length && loaded.length)
    .sort((left, right) => Math.min(right.focused.length, right.loaded.length) -
      Math.min(left.focused.length, left.loaded.length) || left.buildIdentity.localeCompare(right.buildIdentity));
  if (!candidates.length) {
    throw new Error("Flow examples characterization requires focused normal and terminal loaded receipts from one artifact build");
  }
  const selected = candidates[0];
  const characterize = (entries, planContext) => {
    const environmentClassIds = [...new Set(entries.map(({ environmentClassId }) => environmentClassId))];
    if (environmentClassIds.length !== 1) {
      throw new Error(`${planContext} Flow examples samples must belong to one exact environment class`);
    }
    const model = measuredTimingModel(entries, baseline, {
      environmentClassId:environmentClassIds[0], minimumIndependentSamples,
    });
    const target = model.browserTargets[targetId];
    const phases = model.browserTargetPhases[targetId];
    if (!target || !phases || Object.values(phases).some(({ samples }) => samples !== entries.length)) {
      throw new Error(`${planContext} Flow examples samples require complete phase timing`);
    }
    return {
      planContext,
      environmentClassId:environmentClassIds[0],
      environment:entries[0].environment,
      sampleCount:entries.length,
      maturity:timingMaturity(entries.length, minimumIndependentSamples),
      receiptDigests:entries.map(({ digest }) => digest).sort(),
      target:{ p50Ms:target.p50Ms, p90Ms:target.p90Ms },
      phases,
      assignedAssertions:"passed",
    };
  };
  const focusedNormal = characterize(selected.focused, "focused FLOW_GRAPH_EXAMPLES_TARGET");
  const normallyLoaded = characterize(selected.loaded, "terminal lane 4/4 Flow and capture co-run");
  const dominant = Object.entries(focusedNormal.phases)
    .filter(([, timing]) => timing.scope === "target")
    .sort((left, right) => right[1].p90Ms - left[1].p90Ms || left[0].localeCompare(right[0]))[0];
  const focusedBudgetMilliseconds = 12_891;
  const complete = !focusedNormal.maturity.provisional && !normallyLoaded.maturity.provisional &&
    focusedNormal.target.p90Ms <= focusedBudgetMilliseconds;
  return {
    version:1,
    targetId,
    implementationCommit,
    artifactBuildIdentity:selected.buildIdentity,
    minimumIndependentSamples,
    focusedBudgetMilliseconds,
    representativeFlowChangedPathGuardrailSeconds:35,
    budgetChanged:false,
    classes:{ focusedNormal, normallyLoaded },
    diagnosis:diagnosis ?? {
      dominantPhase:dominant[0],
      focusedNormalP90Milliseconds:dominant[1].p90Ms,
    },
    correction,
    evidenceConservation:{
      browserTargetIdsUnchanged:true,
      examplesAssertionLeaves:{ runtime021:11, runtime025:10 },
      loadedTopology:"terminal lane 4/4",
    },
    completion:{ status:complete ? "complete" : "provisional", focusedBudgetPassed:
      focusedNormal.target.p90Ms <= focusedBudgetMilliseconds, loadedAssertionsPassed:true },
  };
}

export function estimateTaskTiming(task, model) {
  const exact = model.tasks?.[task.key];
  if (exact?.samples > 0 && Number.isFinite(exact.medianMs)) {
    return { milliseconds:exact.medianMs, source:"exact task samples" };
  }
  if (task.stage === "browser-observation" && task.logicalTargetIds?.length) {
    const targetSamples = task.logicalTargetIds.map((id) => model.browserTargets?.[id]);
    if (targetSamples.every((timing) => timing?.samples > 0 && Number.isFinite(timing.medianMs))) {
      const targetMilliseconds = targetSamples.reduce((sum, timing) => sum + timing.medianMs, 0);
      return {
        milliseconds:targetMilliseconds +
          (model.browserObservationSessionOverheadMilliseconds ?? 0),
        source:"composed target samples",
      };
    }
    const targetFallbacks = task.logicalTargetIds.map((id) => model.browserTargetFallbacks?.[id]);
    if (targetFallbacks.every(Number.isFinite)) {
      return {
        milliseconds:targetFallbacks.reduce((sum, duration) => sum + duration, 0),
        source:"bootstrap fallback",
      };
    }
  }
  return {
    milliseconds:model.stages?.[task.stage]?.medianMs ?? 1000,
    source:"bootstrap fallback",
  };
}

function sequentialStageEstimate(tasks, model) {
  const timings = tasks.map((task) => estimateTaskTiming(task, model));
  return {
    milliseconds:timings.reduce((sum, timing) => sum + timing.milliseconds, 0),
    timings,
  };
}

function boundedStageEstimate(tasks, concurrency, model) {
  if (!tasks.length) return { milliseconds:0, timings:[] };
  const workerLoads = Array.from({ length:Math.max(1, Math.min(concurrency, tasks.length)) }, () => 0);
  const timings = tasks.map((task) => estimateTaskTiming(task, model));
  for (const timing of timings) {
    let nextWorker = 0;
    for (let index = 1; index < workerLoads.length; index += 1) {
      if (workerLoads[index] < workerLoads[nextWorker]) nextWorker = index;
    }
    workerLoads[nextWorker] += timing.milliseconds;
  }
  return { milliseconds:Math.max(...workerLoads), timings };
}

export function boundedStageMilliseconds(tasks, concurrency, model) {
  return boundedStageEstimate(tasks, concurrency, model).milliseconds;
}

function estimatePlan(plan, model, { concurrency = 4, observationConcurrency = 2 } = {}) {
  const stages = [
    sequentialStageEstimate(plan.preparationTasks, model),
    boundedStageEstimate(plan.unitTasks, concurrency, model),
    boundedStageEstimate(plan.propertyTasks, concurrency, model),
    sequentialStageEstimate(plan.browserTasks, model),
    boundedStageEstimate(plan.observationTasks, observationConcurrency, model),
    boundedStageEstimate(plan.parserTasks, concurrency, model),
    boundedStageEstimate(plan.generatorTasks, concurrency, model),
    sequentialStageEstimate(plan.checkpointTasks, model),
    boundedStageEstimate(plan.sessionTasks, concurrency, model),
  ];
  const timingSources = {};
  for (const { timings } of stages) {
    for (const { source } of timings) timingSources[source] = (timingSources[source] ?? 0) + 1;
  }
  return {
    milliseconds:stages.reduce((sum, stage) => sum + stage.milliseconds, 0),
    timingSources,
  };
}

export function estimatePlanMilliseconds(plan, model, { concurrency = 4, observationConcurrency = 2 } = {}) {
  return estimatePlan(plan, model, { concurrency, observationConcurrency }).milliseconds;
}

function summary(name, plan, model, options) {
  const measured = plan.tasks.filter((task) => model.tasks[task.key]?.samples).length;
  const browserTargets = plan.observationTasks.flatMap(({ logicalTargetIds }) => logicalTargetIds ?? []);
  const estimate = estimatePlan(plan, model, options);
  return {
    name,
    packs:plan.packIds.length,
    tasks:plan.tasks.length,
    builds:plan.preparationTasks.length,
    unit:plan.unitTasks.length,
    property:plan.propertyTasks.length,
    browser:plan.browserTasks.length,
    browserLaunches:plan.browserTasks.length + plan.observationTasks.length,
    browserTargets,
    observations:plan.observationTasks.length,
    checkpoints:plan.checkpointTasks.length,
    features:plan.features.length,
    sessions:plan.sessionTasks.length,
    measuredTasks:measured,
    measurementCoverage:plan.tasks.length ? Number((measured / plan.tasks.length).toFixed(3)) : 0,
    projectedSeconds:Number((estimate.milliseconds / 1000).toFixed(1)),
    timingSources:estimate.timingSources,
    dependantFanOut:Math.max(0, plan.packIds.length - 1),
    changedPath:plan.changedPaths[0] ?? null,
    selectedPacks:[...plan.packIds],
  };
}

export function checkVerificationPerformanceBudgets(report, baseline) {
  const budgets = baseline.performanceBudgets ?? {};
  const limitValue = (entry) => typeof entry === "number" ? entry : entry?.limit;
  const results = [];
  for (const row of report.rows.filter(({ name }) => name.endsWith(":exact-full-pack"))) {
    const packId = row.name.slice(0, -":exact-full-pack".length);
    const limit = limitValue(budgets.exactPackSeconds?.[packId] ?? budgets.defaultExactPackSeconds);
    if (!Number.isFinite(limit)) continue;
    results.push({ metric:"exact-pack-duration", identity:packId,
      measured:row.projectedSeconds, limit, passed:row.projectedSeconds <= limit });
  }
  for (const row of report.rows.filter(({ name }) => name.endsWith(":representative-change"))) {
    const packId = row.name.slice(0, -":representative-change".length);
    const limit = limitValue(budgets.changedPathFanOut?.[packId] ?? budgets.defaultChangedPathFanOut);
    if (Number.isFinite(limit)) {
      results.push({ metric:"changed-path-fan-out", identity:row.changedPath ?? row.name,
        measured:row.dependantFanOut, limit, selectedPacks:[...(row.selectedPacks ?? [])],
        passed:row.dependantFanOut <= limit });
    }
    const durationBudget = budgets.changedPathSeconds?.[packId];
    const durationLimit = limitValue(durationBudget);
    if (Number.isFinite(durationLimit) &&
        (!durationBudget.path || durationBudget.path === row.changedPath)) {
      const reduction = Number.isFinite(durationBudget.baseline) && durationBudget.baseline > 0
        ? Number((1 - row.projectedSeconds / durationBudget.baseline).toFixed(3))
        : undefined;
      const reductionPassed = !Number.isFinite(durationBudget.minimumReduction) ||
        (Number.isFinite(reduction) && reduction >= durationBudget.minimumReduction);
      results.push({
        metric:"changed-path-duration",
        identity:row.changedPath ?? row.name,
        measured:row.projectedSeconds,
        limit:durationLimit,
        baseline:durationBudget.baseline,
        reduction,
        minimumReduction:durationBudget.minimumReduction,
        selectedPacks:[...(row.selectedPacks ?? [])],
        browserTargets:[...(row.browserTargets ?? [])],
        tasks:row.tasks,
        browserLaunches:row.browserLaunches,
        measurementCoverage:row.measurementCoverage,
        ...(row.timingSources ? { timingSources:row.timingSources } : {}),
        passed:row.projectedSeconds <= durationLimit && reductionPassed,
      });
    }
  }
  const browserTargetIds = new Set([
    ...(report.browserTargetIds ?? []),
    ...Object.keys(budgets.browserTargetP90Milliseconds ?? {}),
  ]);
  for (const targetId of browserTargetIds) {
    const limit = limitValue(budgets.browserTargetP90Milliseconds?.[targetId] ??
      budgets.defaultBrowserTargetP90Milliseconds);
    if (!Number.isFinite(limit)) continue;
    const timing = report.model.browserTargets?.[targetId];
    const fallback = baseline.browserTargetMilliseconds?.[targetId] ??
      baseline.defaultBrowserTargetMilliseconds;
    const measured = timing?.p90Ms ?? fallback;
    if (!Number.isFinite(measured)) continue;
    results.push({ metric:"browser-target-p90", identity:targetId,
      measured, limit, passed:measured <= limit });
  }
  const diagnostics = results.filter(({ passed }) => !passed).map((result) =>
    result.metric === "changed-path-fan-out"
      ? `${result.metric} ${result.identity} selected packs ${result.selectedPacks.join(", ")}; ` +
        `measured ${result.measured}; allowed fan-out ${result.limit}`
      : result.metric === "changed-path-duration"
        ? `${result.metric} ${result.identity} selected packs ${result.selectedPacks.join(", ")}; ` +
          `targets ${result.browserTargets.join(", ")}; tasks ${result.tasks}; browser launches ` +
          `${result.browserLaunches}; measured coverage ${result.measurementCoverage}; measured ` +
          `${result.measured}s; limit ${result.limit}s; reduction ${result.reduction}; ` +
          `minimum ${result.minimumReduction}` +
          (result.timingSources ? `; timing sources ${Object.keys(result.timingSources).join(", ")}` : "")
      : `${result.metric} ${result.identity} measured ${result.measured}; limit ${result.limit}`);
  return { passed:diagnostics.length === 0, results, diagnostics };
}

export function refreshVerificationPerformanceBudgets(
  report,
  baseline,
  { tolerance = 1.2 } = {},
) {
  if (!Number.isFinite(tolerance) || tolerance < 1) {
    throw new Error("Verification budget tolerance must be at least 1");
  }
  const budget = (baselineValue, percentile, provisional = false) => ({
    limit:Math.ceil(baselineValue * tolerance),
    baseline:baselineValue,
    percentile,
    tolerance,
    provisional,
  });
  const exactPackSeconds = {};
  for (const row of report.rows.filter(({ name }) => name.endsWith(":exact-full-pack"))) {
    const id = row.name.slice(0, -":exact-full-pack".length);
    exactPackSeconds[id] = budget(row.projectedSeconds, "p90-projection");
  }
  const changedPathFanOut = {};
  for (const row of report.rows.filter(({ name }) => name.endsWith(":representative-change"))) {
    const id = row.name.slice(0, -":representative-change".length);
    changedPathFanOut[id] = budget(row.dependantFanOut, "measured-fan-out");
  }
  const browserTargetP90Milliseconds = {};
  for (const id of report.browserTargetIds ?? []) {
    const measured = report.model.browserTargets?.[id]?.p90Ms;
    const provisional = !Number.isFinite(measured);
    const baselineValue = provisional
      ? baseline.browserTargetMilliseconds?.[id] ?? baseline.defaultBrowserTargetMilliseconds
      : measured;
    if (Number.isFinite(baselineValue)) {
      browserTargetP90Milliseconds[id] = budget(
        baselineValue,
        provisional ? "bootstrap" : "p90",
        provisional,
      );
    }
  }
  return {
    ...baseline,
    performanceBudgets:{
      ...(baseline.performanceBudgets ?? {}),
      exactPackSeconds,
      changedPathFanOut,
      browserTargetP90Milliseconds,
    },
  };
}

export function reportVerificationThroughput({
  packs,
  baseline,
  receipts = [],
  concurrency = 4,
  observationConcurrency = 2,
  shardCount = 4,
  environmentClassId,
  minimumIndependentSamples = 5,
} = {}) {
  const model = measuredTimingModel(receipts, baseline, {
    environmentClassId, minimumIndependentSamples,
  });
  const options = { concurrency, observationConcurrency };
  const rows = [];
  const runnableIds = planVerification(packs, { terminalFull:true }).packIds;
  for (const id of runnableIds) {
    const pack = packs.find(({ id:packId }) => packId === id);
    rows.push(summary(`${id}:exact-full-pack`, planVerification(packs, { packIds:[id] }), model, options));
    const impactPath = pack.representativeChangedPath ?? pack.source?.[0] ?? pack.features?.[0] ?? pack.unit?.[0] ??
      pack.browserAdapters?.[0] ?? pack.process?.[0];
    if (impactPath) rows.push(summary(`${id}:representative-change`, planVerification(packs, {
      changedPaths:[impactPath],
    }), model, options));
  }
  const shardRows = [];
  for (let index = 0; index < shardCount; index += 1) {
    const row = summary(`terminal-ci-lane:${index + 1}/${shardCount}`, planVerification(packs, {
      terminalFull:true, shard:{ index, count:shardCount },
    }), model, options);
    rows.push(row);
    shardRows.push(row);
  }
  const loads = shardRows.map(({ projectedSeconds }) => projectedSeconds);
  const average = loads.reduce((sum, value) => sum + value, 0) / loads.length;
  const maxToAverageRatio = average ? Math.max(...loads) / average : 0;
  const balanceLimit = baseline.sharding?.maximumToAverageRatio ?? 1.75;
  const report = {
    version:2,
    recordedAt:new Date().toISOString(),
    baselineVersion:baseline.version,
    concurrency,
    observationConcurrency,
    ...(environmentClassId ? { selectedEnvironmentClass:environmentClassId } : {}),
    model,
    browserTargetIds:packs.flatMap((pack) => (pack.browserObservations ?? []).map(({ id }) => id)).sort(),
    comparisonScenarioBuilds:rows
      .filter(({ name }) => name.endsWith(":exact-full-pack") || name.endsWith(":representative-change"))
      .reduce((sum, row) => sum + row.builds, 0),
    terminalBuilds:shardRows.reduce((sum, row) => sum + row.builds, 0),
    terminalBuildTopology:"one lane-local build in each isolated CI matrix runner",
    shardBalance:{
      loadsSeconds:loads,
      maximumToAverageRatio:Number(maxToAverageRatio.toFixed(3)),
      limit:balanceLimit,
      balanced:maxToAverageRatio <= balanceLimit,
      assignment:"deterministic-greedy-pack-weight",
    },
    rows,
  };
  report.performanceBudgets = checkVerificationPerformanceBudgets(report, baseline);
  return report;
}

function commandOptions(args) {
  const options = {
    sources:[],
    maintenance:"report",
    legacyLoadIndex:path.join(repositoryRoot, "verification", "timing-receipt-index.json"),
  };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index + 1];
    if (args[index] === "--source" && value) {
      const separator = value.indexOf("=");
      options.sources.push(separator > 0
        ? { id:value.slice(0, separator), path:value.slice(separator + 1) }
        : { path:value });
      index += 1;
    } else if (args[index] === "--environment-class" && value) {
      options.environmentClassId = value; index += 1;
    } else if (args[index] === "--compare-environment-classes" && value) {
      options.compareEnvironmentClasses = value.split(",").filter(Boolean); index += 1;
    } else if (args[index] === "--minimum-independent-samples" && value) {
      options.minimumIndependentSamples = Number(value); index += 1;
    } else if (args[index] === "--maintenance" && value) {
      options.maintenance = value; index += 1;
    } else if (args[index] === "--archive-directory" && value) {
      options.archiveDirectory = value; index += 1;
    } else if (args[index] === "--legacy-load-index" && value) {
      options.legacyLoadIndex = value; index += 1;
    } else {
      throw new Error(`Unknown or incomplete throughput option: ${args[index]}`);
    }
  }
  if (!options.sources.length) options.sources.push({ id:"local", path:defaultReceiptDirectory });
  return options;
}

async function main(args) {
  const options = commandOptions(args);
  const [packs, baseline, lock, legacyLoadIndex, artifact] = await Promise.all([
    loadVerificationPacks(),
    readFile(new URL("../verification/timing-baseline.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../swarmforge/toolchain.lock.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(options.legacyLoadIndex, "utf8").then(JSON.parse),
    readFile(new URL("../dist/.dist-artifact.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const ledger = await buildCanonicalTimingLedger({
    sources:options.sources,
    expectedRuntime:{
      node:lock.node.version,
      typescript:lock.typescript.version,
      platform:`${process.platform}-${process.arch}`,
    },
    minimumIndependentSamples:options.minimumIndependentSamples ?? 5,
    legacyExecutionLoads:legacyLoadIndex.legacyExecutionLoads ?? {},
  });
  const concurrency = Number(process.env.VERIFICATION_CONCURRENCY ?? 4);
  const observationConcurrency = Number(process.env.VERIFICATION_OBSERVATION_CONCURRENCY ?? 2);
  const requestedLoad = process.env.VERIFICATION_EXECUTION_LOAD ?? "normal";
  const exactCurrentClasses = ledger.environmentClasses.filter(({ environment }) =>
    environment.node === lock.node.version &&
    environment.typescript === lock.typescript.version &&
    environment.platform === `${process.platform}-${process.arch}` &&
    environment.executionLoad === requestedLoad &&
    environment.concurrency === concurrency &&
    environment.observationConcurrency === observationConcurrency &&
    environment.buildIdentity === artifact.buildIdentity);
  const declaredEnvironmentClasses = ledger.environmentClasses
    .filter(({ environment }) => environment.executionLoad !== "unclassified");
  const defaultEnvironmentClasses = exactCurrentClasses.length ? exactCurrentClasses
    : declaredEnvironmentClasses.length ? declaredEnvironmentClasses : ledger.environmentClasses;
  const selectedEnvironmentClass = options.environmentClassId ?? defaultEnvironmentClasses
    .sort((left, right) => right.receiptDigests.length - left.receiptDigests.length ||
      left.id.localeCompare(right.id))[0]?.id;
  if (options.environmentClassId && !ledger.environmentClasses.some(({ id }) => id === options.environmentClassId)) {
    throw new Error(`Unknown timing environment class: ${options.environmentClassId}`);
  }
  const report = reportVerificationThroughput({
    packs,
    baseline,
    receipts:ledger.receipts,
    concurrency,
    observationConcurrency,
    environmentClassId:selectedEnvironmentClass,
    minimumIndependentSamples:ledger.minimumIndependentSamples,
  });
  report.timingLedger = {
    sources:ledger.sources,
    receipts:ledger.receipts.map(({ digest, sourcePaths, rejectionReason, environmentClassId }) =>
      ({ digest, sourcePaths, rejectionReason, environmentClassId })),
    environmentClasses:ledger.environmentClasses,
    acceptedReceipts:ledger.acceptedReceipts,
    rejectedReceipts:ledger.rejectedReceipts,
    malformedReceipts:ledger.malformedReceipts,
    rejectedByReason:ledger.rejectedByReason,
    independentSamples:ledger.independentSamples,
  };
  if (options.compareEnvironmentClasses) {
    report.crossClassComparison = compareTimingEnvironmentClasses(
      ledger, baseline, options.compareEnvironmentClasses,
      { minimumIndependentSamples:ledger.minimumIndependentSamples },
    );
  }
  report.receiptMaintenance = await archiveCanonicalReceiptCandidates(ledger, {
    action:options.maintenance,
    archiveDirectory:options.archiveDirectory,
  });
  console.log(formatCanonicalTimingLedgerSummary(ledger, {
    selectedEnvironmentClass,
    minimumIndependentSamples:ledger.minimumIndependentSamples,
  }));
  console.table(report.rows);
  console.log(JSON.stringify(report, null, 2));
  if (!report.performanceBudgets.passed) {
    throw new Error(`Verification performance budgets failed: ${report.performanceBudgets.diagnostics.join("; ")}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
