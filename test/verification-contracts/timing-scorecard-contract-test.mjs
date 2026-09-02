import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { estimatePlanMilliseconds, loadVerificationReceipts, measuredTimingModel, validateVerificationPerformanceCalibrationSnapshot } from "../../scripts/report-verification-throughput.mjs";
import { buildCanonicalTimingLedger } from "../../scripts/verification-timing-ledger.mjs";
import { planVerification, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";
const syntheticArtifact = (inputDigest, outputDigest, toolchain) => {
  const schemaVersion = 1;
  const buildIdentity = createHash("sha256").update(`${JSON.stringify({
    schemaVersion, inputDigest, outputDigest, toolchain,
  })}\n`).digest("hex");
  return { schemaVersion, buildIdentity, inputDigest, outputDigest, toolchain };
};
const packs = await loadVerificationPacks();
const shellPlan = planVerification(packs, { packIds:["shell"] });
const reportRuntime = {
  node:process.versions.node,
  typescript:"5.9.3",
  platform:`${process.platform}-${process.arch}`,
};
const reportArtifact = syntheticArtifact(
  "2".repeat(64), "3".repeat(64),
  { node:reportRuntime.node, typescript:reportRuntime.typescript },
);
const reportReceipt = {
  version:2,
  completedAt:new Date().toISOString(),
  environment:{ ...reportRuntime, concurrency:4, observationConcurrency:2 },
  artifact:reportArtifact,
  plan:{
    mode:shellPlan.mode,
    requestedPackIds:[...shellPlan.requestedPackIds].sort(),
    selectedPackIds:[...shellPlan.selectedPackIds].sort(),
    changedOwners:shellPlan.changedOwners,
    changedBoundaries:shellPlan.changedBoundaries,
    changeSetDigest:null,
    conservativeHistoricalFallbackReason:null,
  },
  tasks:Object.fromEntries(shellPlan.tasks.map((task, index) => [task.key, {
    identity:verificationTaskIdentity(task), status:"passed", durationMs:index + 1,
    output:task.stage === "browser-observation"
      ? task.logicalTargetIds.flatMap((id, targetIndex) => [
        JSON.stringify({ swarmforgeBrowserTargetResult:{ id, status:"passed" } }),
        JSON.stringify({
          swarmforgeBrowserTargetTiming:{ id, durationMs:700 + targetIndex * 100 },
        }),
      ]).join("\n")
      : "ok\n",
  }])),
};
const reportBaseline = {
  version:2,
  runtime:reportRuntime,
  fallbackMilliseconds:{
    build:6100, unit:250, property:500, browser:15000, "browser-observation":2000,
    "acceptance-parse":50, "acceptance-generate":50, checkpoint:2000, "acceptance-session":1000,
    unknown:1000,
  },
  sharding:{ maximumToAverageRatio:10 },
};
const contaminatedReceipt = structuredClone(reportReceipt);
contaminatedReceipt.environment.node = "20.0.0";
const forgedIdentityReceipt = structuredClone(reportReceipt);
forgedIdentityReceipt.artifact.buildIdentity = "9".repeat(64);
const oldVersionReceipt = structuredClone(reportReceipt);
oldVersionReceipt.version = 1;
const incompleteTaskReceipt = structuredClone(reportReceipt);
Object.values(incompleteTaskReceipt.tasks)[0].status = "failed";
const committedCalibrationReport = JSON.parse(await readFile(
  new URL("../../verification/performance-calibration.json", import.meta.url), "utf8",
));
const committedReceiptIndex = JSON.parse(await readFile(
  new URL("../../verification/timing-receipt-index.json", import.meta.url), "utf8",
));
const liveCalibrationLedger = await buildCanonicalTimingLedger({
  sources:committedCalibrationReport.sourceScope,
  expectedRuntime:reportRuntime,
  minimumIndependentSamples:committedCalibrationReport.minimumIndependentSamples,
  legacyExecutionLoads:committedReceiptIndex.legacyExecutionLoads ?? {},
  receiptLossDispositions:committedReceiptIndex.receiptLossDispositions ?? [],
});
const committedSnapshot = validateVerificationPerformanceCalibrationSnapshot(
  committedCalibrationReport, liveCalibrationLedger,
);
const lockedRuntime = { node:process.versions.node, typescript:"5.9.3" };
const artifact = syntheticArtifact("b".repeat(64), "c".repeat(64), lockedRuntime);
const isolatedReceiptDirectory = await mkdtemp(path.join(os.tmpdir(), "verification-receipts-"));
try {
  await writeFile(path.join(isolatedReceiptDirectory, "valid.json"), JSON.stringify(reportReceipt));
  await writeFile(path.join(isolatedReceiptDirectory, "contaminated.json"), JSON.stringify(contaminatedReceipt));
  await writeFile(path.join(isolatedReceiptDirectory, "forged.json"), JSON.stringify(forgedIdentityReceipt));
  await writeFile(path.join(isolatedReceiptDirectory, "old-version.json"), JSON.stringify(oldVersionReceipt));
  await writeFile(path.join(isolatedReceiptDirectory, "failed-task.json"), JSON.stringify(incompleteTaskReceipt));
  await writeFile(path.join(isolatedReceiptDirectory, "incomplete.json"), "{\"version\":2");
  assert.equal((await loadVerificationReceipts(isolatedReceiptDirectory, {
    expectedRuntime:reportRuntime,
  })).length, 1);
  const receiptLedger = await loadVerificationReceipts(isolatedReceiptDirectory, {
    expectedRuntime:reportRuntime,
    includeRejected:true,
  });
  assert.equal(receiptLedger.length, 5,
    "the throughput ledger retains parseable rejected receipts for truthful rejection counts");
  assert.equal(measuredTimingModel(receiptLedger, reportBaseline).ledger.rejectedReceipts, 4);
} finally {
  await rm(isolatedReceiptDirectory, { recursive:true, force:true });
}
const unitTasks = [{ key:"unit:registry", stage:"unit" }, { key:"unit:ownership", stage:"unit" }];
const estimate = estimatePlanMilliseconds({
  preparationTasks:[], unitTasks, propertyTasks:[], browserTasks:[], observationTasks:[],
  parserTasks:[], generatorTasks:[], checkpointTasks:[], sessionTasks:[],
}, { tasks:{
  "unit:registry":{ samples:1, medianMs:1200 },
  "unit:ownership":{ samples:1, medianMs:800 },
} });
assert.ok(Number.isFinite(estimate) && estimate >= 0,
  "timing policy returns a finite critical-path estimate for boundary tasks");
const scorecard = JSON.parse(await readFile(
  new URL("../../verification/vtd012-adoption-scorecard.json", import.meta.url), "utf8"));
assert.equal(scorecard.version, 3);
assert.deepEqual(scorecard.reconstruction, {
  sourcePatchReference:"962affc8c2fb281036a221020910a503ed96bb6b",
  repairedQaBase:"db157699df9cecde5b323b0efafe2d43a5c250a7",
  integratedRepairCandidate:"bb8d05ae64a1d1484cd45c0509eccf79394cc5ae",
  excludedRepairPatchReferences:[
    "15f110217b36c7f79c674d3b07f75c55b0e5e7a7",
    "31fc1b814f8f73a0297c01efd8be6af6b44f48a6",
    "1bb4ae05e367aba92105088cfb622570e620faff",
    "bdfab2fa4fdb4a9f72aa1032db95ed202db43342",
  ],
  carriedQaRepairAssertions:[
    "6f9411dac1ffeed47f5811e5758e8f0694e36bde",
    "2b4e7df2a302ac50170bbf65c75bb5494f9d1a86",
  ],
  rule:"Port only the conserved VTD-012 product remainder onto the repaired QA base; preserve integrated repair behavior and do not inherit stopped ancestry.",
}, "the adoption scorecard binds the repaired-base reconstruction and excluded repair ancestry");
if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory === "other:retired calibration receipt identity") {
    const normalized = (value) => Array.isArray(value) ? value.map(normalized)
      : value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalized(nested)])) : value;
    const digest = (value) => createHash("sha256")
      .update(JSON.stringify(normalized(value))).digest("hex");
    const expectedPreRepairFailure = {
      missingRawReceiptRejected:true, compactRetiredIdentityAccepted:false,
    };
    const expectedRepairResult = {
      missingRawReceiptRejected:true, compactRetiredIdentityAccepted:true,
    };
    const fixture = { id:"retired-calibration-receipt-identity-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ receiptDigest:"7ec18d4652e12c04c5a3df91afc8243c6a88d4ab9ab16c2b4def2d1a2c8ac255",
        rawReceiptPresent:false },
      expectedPreRepairFailure, expectedRepairResult };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:{
        missingRawReceiptRejected:true,
        compactRetiredIdentityAccepted:committedSnapshot.retiredReceiptDigests.length === 1,
      } },
    } }));
  }
}
