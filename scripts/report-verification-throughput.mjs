import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { loadVerificationPacks, planVerification } from "./verification-packs.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const defaultReceiptDirectory = path.join(repositoryRoot, "tmp", "verification-receipts");
const sha256Pattern = /^[a-f0-9]{64}$/u;

function artifactBuildIdentity(artifact) {
  return createHash("sha256").update(`${JSON.stringify({
    schemaVersion:artifact?.schemaVersion,
    inputDigest:artifact?.inputDigest,
    outputDigest:artifact?.outputDigest,
    toolchain:artifact?.toolchain,
  })}\n`).digest("hex");
}

function percentile(values, quantile) {
  if (!values.length) return undefined;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)];
}

function statistic(values, fallbackMs) {
  return values.length
    ? { samples:values.length, medianMs:percentile(values, 0.5), p90Ms:percentile(values, 0.9), source:"receipt-ledger" }
    : { samples:0, medianMs:fallbackMs, p90Ms:fallbackMs, source:"bootstrap-fallback" };
}

function validReceipt(receipt, expectedRuntime = {}) {
  const environment = receipt?.environment;
  const artifact = receipt?.artifact;
  const plan = receipt?.plan;
  const tasks = receipt?.tasks && !Array.isArray(receipt.tasks) ? Object.values(receipt.tasks) : [];
  const runtimeMatches = ["node", "typescript", "platform"].every((key) =>
    !expectedRuntime[key] || environment?.[key] === expectedRuntime[key]);
  return receipt?.version === 2 && receipt.tasks && !Array.isArray(receipt.tasks) && tasks.length > 0 &&
    tasks.every((result) => result?.status === "passed" && Number.isFinite(result.durationMs) &&
      result.durationMs >= 0 && result.identity?.key && result.identity?.stage) &&
    ["exact", "impact", "terminal"].includes(plan?.mode) &&
    Array.isArray(plan.requestedPackIds) && Array.isArray(plan.selectedPackIds) &&
    plan.changedOwners && !Array.isArray(plan.changedOwners) &&
    (plan.changeSetDigest === null || sha256Pattern.test(plan.changeSetDigest ?? "")) &&
    Object.hasOwn(plan, "conservativeHistoricalFallbackReason") &&
    receipt.completedAt && !Number.isNaN(Date.parse(receipt.completedAt)) &&
    runtimeMatches && Number.isInteger(environment?.concurrency) && environment.concurrency > 0 &&
    Number.isInteger(environment?.observationConcurrency) && environment.observationConcurrency > 0 &&
    artifact?.toolchain?.node === environment.node &&
    artifact?.toolchain?.typescript === environment.typescript &&
    artifact?.schemaVersion === 1 && artifact?.buildIdentity === artifactBuildIdentity(artifact) &&
    [artifact?.buildIdentity, artifact?.inputDigest, artifact?.outputDigest]
      .every((value) => sha256Pattern.test(value ?? ""));
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

export function measuredTimingModel(receipts, baseline) {
  const fallback = baseline.fallbackMilliseconds ?? Object.fromEntries(
    Object.entries(baseline.seconds ?? {}).map(([key, seconds]) => [key, seconds * 1000]),
  );
  const byStage = new Map();
  const byTask = new Map();
  const environments = new Map();
  const selections = new Map();
  const packSamples = new Map();
  let passedTasks = 0;
  let buildTasks = 0;
  const eligibleReceipts = receipts.filter((receipt) => validReceipt(receipt, baseline.runtime ?? {}));
  for (const receipt of eligibleReceipts) {
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
  ]) stages[stage] = statistic(byStage.get(stage) ?? [], fallback[stage] ?? fallback.unknown ?? 1000);
  return {
    stages,
    tasks:Object.fromEntries([...byTask].map(([key, values]) => [key, statistic(values, 0)])),
    packWeightsMs:Object.fromEntries([...packSamples].map(([id, values]) => [id, percentile(values, 0.5)])),
    ledger:{
      receipts:eligibleReceipts.length,
      rejectedReceipts:receipts.length - eligibleReceipts.length,
      passedTasks,
      buildTasks,
      environments:[...environments].map(([key, count]) => ({ ...JSON.parse(key), receipts:count })),
      selections:[...selections].map(([key, count]) => ({ ...JSON.parse(key), receipts:count })),
    },
  };
}

function taskMilliseconds(task, model) {
  return model.tasks[task.key]?.medianMs ?? model.stages[task.stage]?.medianMs ?? 1000;
}

function parallelMilliseconds(tasks, concurrency, model) {
  return tasks.reduce((sum, task) => sum + taskMilliseconds(task, model), 0) / Math.max(1, concurrency);
}

export function estimatePlanMilliseconds(plan, model, { concurrency = 4, observationConcurrency = 2 } = {}) {
  return plan.preparationTasks.reduce((sum, task) => sum + taskMilliseconds(task, model), 0)
    + parallelMilliseconds(plan.unitTasks, concurrency, model)
    + parallelMilliseconds(plan.propertyTasks, concurrency, model)
    + plan.browserTasks.reduce((sum, task) => sum + taskMilliseconds(task, model), 0)
    + parallelMilliseconds(plan.observationTasks, observationConcurrency, model)
    + parallelMilliseconds(plan.parserTasks, concurrency, model)
    + parallelMilliseconds(plan.generatorTasks, concurrency, model)
    + plan.checkpointTasks.reduce((sum, task) => sum + taskMilliseconds(task, model), 0)
    + parallelMilliseconds(plan.sessionTasks, concurrency, model);
}

function summary(name, plan, model, options) {
  const measured = plan.tasks.filter((task) => model.tasks[task.key]?.samples).length;
  return {
    name,
    packs:plan.packIds.length,
    tasks:plan.tasks.length,
    builds:plan.preparationTasks.length,
    unit:plan.unitTasks.length,
    property:plan.propertyTasks.length,
    browser:plan.browserTasks.length,
    observations:plan.observationTasks.length,
    checkpoints:plan.checkpointTasks.length,
    features:plan.features.length,
    sessions:plan.sessionTasks.length,
    measuredTasks:measured,
    measurementCoverage:plan.tasks.length ? Number((measured / plan.tasks.length).toFixed(3)) : 0,
    projectedSeconds:Number((estimatePlanMilliseconds(plan, model, options) / 1000).toFixed(1)),
  };
}

export function reportVerificationThroughput({
  packs,
  baseline,
  receipts = [],
  concurrency = 4,
  observationConcurrency = 2,
  shardCount = 4,
} = {}) {
  const model = measuredTimingModel(receipts, baseline);
  const options = { concurrency, observationConcurrency };
  const rows = [];
  for (const id of ["flow_graph", "live_flow_testing", "capture", "schemas"]
    .filter((candidate) => packs.some(({ id:packId }) => packId === candidate))) {
    const pack = packs.find(({ id:packId }) => packId === id);
    rows.push(summary(`${id}:exact-full-pack`, planVerification(packs, { packIds:[id] }), model, options));
    const impactPath = pack.source[0] ?? pack.features[0];
    if (impactPath) rows.push(summary(`${id}:impact-full-packs`, planVerification(packs, {
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
  return {
    version:2,
    recordedAt:new Date().toISOString(),
    baselineVersion:baseline.version,
    concurrency,
    observationConcurrency,
    model,
    comparisonScenarioBuilds:rows
      .filter(({ name }) => name.endsWith(":exact-full-pack") || name.endsWith(":impact-full-packs"))
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
}

async function main(args) {
  if (args.length) throw new Error("report-verification-throughput.mjs does not accept positional options");
  const [packs, baseline, receipts] = await Promise.all([
    loadVerificationPacks(),
    readFile(new URL("../verification/timing-baseline.json", import.meta.url), "utf8").then(JSON.parse),
    loadVerificationReceipts(defaultReceiptDirectory, { includeRejected:true }),
  ]);
  const report = reportVerificationThroughput({
    packs,
    baseline,
    receipts,
    concurrency:Number(process.env.VERIFICATION_CONCURRENCY ?? 4),
    observationConcurrency:Number(process.env.VERIFICATION_OBSERVATION_CONCURRENCY ?? 2),
  });
  console.table(report.rows);
  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
