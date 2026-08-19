import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { loadVerificationPacks, planVerification } from "../scripts/verification-packs.mjs";
import { canonicalVerificationChangeSet } from "../scripts/verification-changes.mjs";

import {
  consumeTerminalFullObligations,
  createReviewReadyRecord,
  deliveryScorecard,
  finalEvidenceEffect,
  formatReviewReadyScopePreflight,
  handoffReadinessPolicy,
  reviewReadyProductCandidatePath,
  reviewReadyScopePreflight,
  terminalVerificationDeferredRoute,
  terminalVerificationDeferredConservation,
  recordReviewReadyEvidence,
  recordEligibleRepairReviewTransaction,
  runSettledFinalVerificationCommand,
  validateReviewReadyRecord,
  verifyQaReleaseCandidate,
  verifyCommittedReviewTransaction,
  verifyReviewReadyEvidence,
} from "../scripts/settled-final-verification.mjs";
import { canonicalTerminalPlanEligible, validateCanonicalMasterEvidenceRecord } from "../scripts/verification-evidence.mjs";
import { granularityPortfolioFreezeStatusSync } from
  "../scripts/campsite-granularity-observations.mjs";
import { timeoutIncidentDigest } from "../scripts/verification-reliability-values.mjs";
import { verificationTaskDigest } from "../scripts/verification-task-succession.mjs";
import { packageProofValid } from "../scripts/verification-reliability-runtime.mjs";
import { withVerificationNotesLock } from "../scripts/verification-git-notes.mjs";
import {
  classifyLegacyIncidentRunIntent,
  requireVerificationRunIntent,
  verificationRunIntent,
  verificationRunIntents,
} from "../scripts/verification-run-intent.mjs";

const exec = promisify(execFile);

const allPacks = [
  "branding_polish", "capture", "command-palette", "defects", "durable_project_repository",
  "event-library", "flow_export", "flow_graph", "guided_test_cases", "hotkeys",
  "layered_schema", "live_flow_testing", "project_assurance_severity",
  "project_event_transport", "project_management", "property_set_flow_sections", "replay",
  "schema_relationship_tree", "schemas", "shell",
];
const baseCommit = "1".repeat(40);
const candidateCommit = "2".repeat(40);
const candidateTree = "3".repeat(40);
const packs = await loadVerificationPacks();

assert.equal(packageProofValid({
  details:{ isFile:()=>true, isSymbolicLink:()=>false,
    mtimeMs:Date.parse("2026-08-18T10:00:30.000Z") }, canonicalPath:"/tmp/package.zip",
  packagePath:"/tmp/package.zip", review:{ startedAt:"2026-08-18T10:00:00.000Z",
    completedAt:"2026-08-18T10:01:00.000Z" },
}), true, "handoff package proof is fresh when produced after run start but before receipt completion");

assert.equal(verificationRunIntent({}), verificationRunIntents.development);
assert.equal(verificationRunIntent({ prepareEvidence:"slice" }), verificationRunIntents.review);
assert.equal(verificationRunIntent({ timeoutRepairFocused:"incident", prepareEvidence:"slice" }),
  verificationRunIntents.repair);
assert.equal(verificationRunIntent({ terminalFull:true }), verificationRunIntents.terminal);
assert.throws(() => requireVerificationRunIntent({}), /missing a valid immutable run intent/i);
assert.throws(() => requireVerificationRunIntent({ runIntent:verificationRunIntents.development },
  verificationRunIntents.review), /cannot support review-evidence/i);

const compatibilityRepository = await mkdtemp(path.join(os.tmpdir(), "run-intent-compatibility-"));
try {
  const receiptDirectory = path.join(compatibilityRepository, "tmp", "verification-receipts");
  await mkdir(receiptDirectory, { recursive:true });
  const sourceReceipt = "tmp/verification-receipts/legacy.json";
  const legacyReceipt = {
    version:2, runId:"legacy-run", startedAt:"2026-08-10T10:00:00.000Z",
    candidate:{ commit:baseCommit, tree:candidateTree, evidenceTask:null },
    plan:{ mode:"focused-task" }, tasks:{},
  };
  await writeFile(path.join(compatibilityRepository, sourceReceipt), JSON.stringify(legacyReceipt));
  const incident = { failure:{ sourceReceipt } };
  const compatible = await classifyLegacyIncidentRunIntent({ root:compatibilityRepository, incident });
  assert.equal(compatible.blocking, false);
  assert.equal(compatible.reason, "receipt-proven-development-diagnostic");
  await writeFile(path.join(compatibilityRepository, sourceReceipt), JSON.stringify({
    ...legacyReceipt, candidate:{ ...legacyReceipt.candidate, evidenceTask:undefined },
  }));
  assert.equal((await classifyLegacyIncidentRunIntent({
    root:compatibilityRepository, incident,
  })).blocking, true, "ambiguous legacy authority remains blocking");
  assert.equal((await classifyLegacyIncidentRunIntent({
    root:compatibilityRepository,
    incident:{ ...incident, terminalVerificationDeferred:{ status:"terminal-verification-deferred" } },
  })).reason, "terminal-verification-deferred",
  "eligible deferred incidents are never reclassified as diagnostics");
} finally {
  await rm(compatibilityRepository, { recursive:true, force:true });
}

for (const productPath of ["src/commands.ts", "dist/commands.js", "side-panel.html",
  "side-panel.css", "manifest.json", "assets/brand/icon.svg"]) {
  assert.equal(reviewReadyProductCandidatePath(productPath), true,
    `${productPath} is recognized as a product or delivery-asset change`);
}
assert.equal(reviewReadyProductCandidatePath("scripts/run-focused-acceptance.mjs"), false,
  "verification tooling alone is not misclassified as a product candidate");

const focusedScopePreflight = reviewReadyScopePreflight({
  approvedPackIds:["flow_graph"], plannedPackIds:["flow_graph"], taskCount:17,
  criticalPathEstimateMs:34_900,
  changedOwners:{ "src/flow-graph/workspace-section-ui.ts":["flow_graph"] },
  startedAtMs:1_000, nowMs:6_000, effortCeilingMs:60 * 60 * 1000, allPackIds:allPacks,
});
assert.deepEqual(focusedScopePreflight, {
  status:"authorized", approvedPacks:["flow_graph"], plannedPacks:["flow_graph"],
  taskCount:17, criticalPathEstimateMs:34_900, expansionCausingPaths:[], elapsedMs:5_000,
  remainingEffortCeilingMs:3_595_000, launchAuthorizationCount:1,
  omittedOwnedPacks:[], terminalClaim:false,
});
const expandedScopePreflight = reviewReadyScopePreflight({
  approvedPackIds:["flow_graph"], plannedPackIds:allPacks, taskCount:842,
  criticalPathEstimateMs:1_008_000,
  changedOwners:{
    "src/flow-graph/workspace-section-ui.ts":["flow_graph"],
    "scripts/run-focused-acceptance.mjs":allPacks,
  },
  startedAtMs:1_000, nowMs:6_000, effortCeilingMs:60 * 60 * 1000, allPackIds:allPacks,
});
assert.equal(expandedScopePreflight.status, "blocked");
assert.deepEqual(expandedScopePreflight.expansionCausingPaths,
  ["scripts/run-focused-acceptance.mjs"]);
assert.equal(expandedScopePreflight.launchAuthorizationCount, 0);
assert.deepEqual(expandedScopePreflight.omittedOwnedPacks, []);
assert.equal(expandedScopePreflight.terminalClaim, false);
assert.match(formatReviewReadyScopePreflight(expandedScopePreflight),
  /approved packs: flow_graph.*planned packs: branding_polish.*842 tasks.*1008000ms.*scripts\/run-focused-acceptance\.mjs.*elapsed: 5000ms.*remaining effort ceiling: 3595000ms/is);
const deferredIncident = {
  state:"unresolved", repair:{ status:"eligible", candidate:{ commit:candidateCommit } },
  terminalVerificationDeferred:{ status:"terminal-verification-deferred",
    candidate:{ commit:candidateCommit, tree:candidateTree },
    reviewReady:{ task:"future-slice", baseCommit, receiptSha256:"4".repeat(64) },
    package:{ digest:"5".repeat(64) },
  },
};
assert.deepEqual(terminalVerificationDeferredRoute({ incident:deferredIncident,
  readiness:"review-ready", candidateCommit }), { permitted:true, mode:"focused-review" });
assert.deepEqual(terminalVerificationDeferredRoute({ incident:deferredIncident,
  readiness:"qa-ready", candidateCommit }), { permitted:true, mode:"qa-integration" });
assert.deepEqual(terminalVerificationDeferredRoute({ incident:deferredIncident,
  readiness:"review-ready", candidateCommit:"independent-feature-candidate" }),
{ permitted:true, mode:"focused-review" },
"an eligible deferral on a parallel candidate does not block focused feature review");
assert.deepEqual(terminalVerificationDeferredRoute({ incident:deferredIncident,
  readiness:"qa-ready", candidateCommit:"independent-feature-candidate" }),
{ permitted:true, mode:"qa-integration" },
"an eligible deferral on a parallel candidate does not block QA integration");
assert.deepEqual(terminalVerificationDeferredRoute({ incident:deferredIncident,
  readiness:"release-candidate", candidateCommit:"later-qa-head",
  candidateDescendsFromDeferred:true }), { permitted:true, mode:"master-checkpoint" });
assert.deepEqual(terminalVerificationDeferredRoute({ incident:deferredIncident,
  readiness:"final-ready", candidateCommit }), { permitted:false, mode:"terminal-blocked" });
assert.deepEqual(terminalVerificationDeferredConservation({
  incident:{ ...deferredIncident, failure:{ task:{ target:"test/verification-process-contract-test.mjs" } },
    repair:{ ...deferredIncident.repair,
      changedPaths:["scripts/run-focused-acceptance.mjs"], focusedTaskPlan:[{
        identity:{ target:"test/verification-process-contract-test.mjs" },
      }] } },
  changedPaths:["docs/slice-2.md", "features/flow.feature"],
}), { conserved:true, relevantChangedPaths:[], changedPaths:["docs/slice-2.md", "features/flow.feature"] });
assert.deepEqual(terminalVerificationDeferredConservation({
  incident:{ ...deferredIncident, failure:{ task:{ target:"test/verification-process-contract-test.mjs" } },
    repair:{ ...deferredIncident.repair,
      changedPaths:["scripts/run-focused-acceptance.mjs"], focusedTaskPlan:[{
        identity:{ target:"test/verification-process-contract-test.mjs" },
      }] } },
  changedPaths:["src/independent-flow.ts", "test/independent-flow-test.mjs"],
}), { conserved:true, relevantChangedPaths:[],
  changedPaths:["src/independent-flow.ts", "test/independent-flow-test.mjs"] });
assert.deepEqual(terminalVerificationDeferredConservation({
  incident:{ ...deferredIncident, failure:{ task:{ target:"test/verification-process-contract-test.mjs" } },
    repair:{ ...deferredIncident.repair,
      changedPaths:["scripts/run-focused-acceptance.mjs"], focusedTaskPlan:[{
        identity:{ target:"test/verification-process-contract-test.mjs" },
      }] } },
  changedPaths:["scripts/verification-reliability-store.mjs"],
}), { conserved:false, relevantChangedPaths:["scripts/verification-reliability-store.mjs"],
  changedPaths:["scripts/verification-reliability-store.mjs"] });
for (const sharedVerificationPath of [
  "scripts/future-verification-helper.mjs",
  "swarmforge/scripts/future-handoff-helper.bb",
  "verification/future-contract.json",
  "swarmforge/toolchain.lock.json",
  "package-lock.json",
]) {
  assert.deepEqual(terminalVerificationDeferredConservation({
    incident:deferredIncident, changedPaths:[sharedVerificationPath],
  }), { conserved:false, relevantChangedPaths:[sharedVerificationPath],
    changedPaths:[sharedVerificationPath] },
  `${sharedVerificationPath} invalidates carried proof without a filename allowlist update`);
}
const repositoryWideIncident = {
  ...deferredIncident,
  failure:{ task:{ target:"src/relevant-boundary.ts" } },
  repair:{ ...deferredIncident.repair,
    changedPaths:["assets/relevant-icon.svg", "test/acceptance/relevant_steps.clj"],
    causalProtocol:{ fixture:{ nested:{ evidencePath:"features/relevant.feature" } } },
    focusedTaskPlan:[{ identity:{ target:"project-briefs/relevant.md" } }],
  },
};
for (const relevantPath of [
  "src/relevant-boundary.ts", "assets/relevant-icon.svg",
  "test/acceptance/relevant_steps.clj", "features/relevant.feature",
  "project-briefs/relevant.md",
]) {
  const changedPaths = ["docs/unrelated.md", relevantPath].toReversed();
  assert.deepEqual(terminalVerificationDeferredConservation({
    incident:repositoryWideIncident, changedPaths,
  }), { conserved:false, relevantChangedPaths:[relevantPath],
    changedPaths:[...changedPaths].sort() },
  `bound incident input ${relevantPath} requires fresh incident-focused proof`);
}
for (const workflowPath of [
  "scripts/settled-final-verification.mjs",
  "scripts/settled-final-verification-review.mjs",
  "scripts/run-focused-acceptance.mjs",
]) {
  assert.deepEqual(planVerification(packs, { changedPaths:[workflowPath] }).packIds.toSorted(), allPacks,
    `${workflowPath} retains global workflow impact`);
}
const flowUiPlan = planVerification(packs, { changedPaths:["src/data-layer-flow-graph-ui.ts"] });
for (const focusedPolicyPath of [
  "scripts/settled-final-verification-policy.mjs",
  "scripts/verification-packs.mjs",
  "scripts/verification-reliability-runtime.mjs",
  "scripts/verification-reliability-store.mjs",
]) {
  assert.deepEqual(planVerification(packs, { changedPaths:[focusedPolicyPath] }).packIds.toSorted(),
    allPacks,
  `${focusedPolicyPath} retains global impact without explicit focused-pack authorization`);
  const mixedPlan = planVerification(packs, {
    changedPaths:["src/data-layer-flow-graph-ui.ts", focusedPolicyPath],
  });
  assert.deepEqual(mixedPlan.packIds, flowUiPlan.packIds,
    `${focusedPolicyPath} does not suppress or expand an accompanying product boundary`);
  assert.deepEqual(mixedPlan.changedOwners[focusedPolicyPath], [],
    `${focusedPolicyPath} remains visible without claiming product-pack ownership`);
  const canonicalPlan = planVerification(packs, {
    packIds:allPacks, changedPaths:[focusedPolicyPath],
  });
  assert.deepEqual(canonicalPlan.packIds.toSorted(), allPacks,
    `${focusedPolicyPath} retains canonical runnable-pack planning outside feature review`);
  assert.deepEqual(canonicalPlan.changedOwners[focusedPolicyPath].toSorted(), allPacks,
    `${focusedPolicyPath} retains its terminal global-impact identity`);
}
const receipt = {
  version:2,
  runIntent:verificationRunIntents.review,
  runId:"focused-run",
  startedAt:"2026-08-11T10:01:00.000Z",
  completedAt:"2026-08-11T10:02:30.000Z",
  candidate:{ commit:candidateCommit, tree:candidateTree },
  plan:{
    mode:"exact", requestedPackIds:["shell"], changedPaths:["scripts/workflow.mjs"],
  },
  tasks:{
    "unit:test/workflow-test.mjs":{
      identity:{ key:"unit:test/workflow-test.mjs" }, status:"passed", durationMs:90000,
    },
  },
};
assert.throws(() => createReviewReadyRecord({
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
  changeSet:{ version:1, baseCommit, commit:candidateCommit, paths:["scripts/workflow.mjs"] },
  receipt:{ ...receipt, runIntent:verificationRunIntents.development },
  receiptPath:"tmp/verification-receipts/diagnostic.json", receiptSha256:"4".repeat(64),
}), /immutable review-evidence receipt intent/i,
"a passing diagnostic receipt cannot be retrospectively upgraded to review evidence");

const reviewRecord = createReviewReadyRecord({
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
  changeSet:{ version:1, baseCommit, commit:candidateCommit, paths:["scripts/workflow.mjs"] },
  receipt, receiptPath:"tmp/verification-receipts/focused.json", receiptSha256:"4".repeat(64),
  recordedAt:"2026-08-11T10:03:00.000Z",
});
assert.deepEqual(reviewRecord.focusedScope, {
  changedPaths:["scripts/workflow.mjs"], packIds:["shell"],
  taskKeys:["unit:test/workflow-test.mjs"],
});
assert.equal(reviewRecord.result, "passed");
assert.equal(reviewRecord.startedAt, receipt.startedAt);
assert.equal(reviewRecord.completedAt, receipt.completedAt);
assert.equal(validateReviewReadyRecord(reviewRecord, {
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
}), true);
assert.throws(() => validateReviewReadyRecord(reviewRecord, {
  task:"another-task", baseCommit, candidateCommit, candidateTree,
}), /task/i);
assert.throws(() => validateReviewReadyRecord({ ...reviewRecord, finalRegressionClaim:true }, {
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
}), /invalid review-ready/i);
assert.throws(() => validateReviewReadyRecord({
  ...reviewRecord, focusedScope:{ ...reviewRecord.focusedScope, taskKeys:[] },
}, { task:"future-slice", baseCommit, candidateCommit, candidateTree }), /incomplete/i);
const obligationReceipt = {
  ...receipt,
  runId:"style-focused-run",
  plan:{ ...receipt.plan,
    changedPaths:["specification-builder-brand.css"],
    terminalFullObligations:["specification-builder-brand.css"],
  },
};
const obligationRecord = createReviewReadyRecord({
  task:"style-slice", baseCommit, candidateCommit, candidateTree,
  changeSet:{ version:1, baseCommit, commit:candidateCommit,
    paths:["specification-builder-brand.css"] },
  receipt:obligationReceipt, receiptPath:"tmp/verification-receipts/style.json",
  receiptSha256:"6".repeat(64), recordedAt:"2026-08-11T10:03:00.000Z",
});
assert.deepEqual(obligationRecord.terminalObligations, {
  status:"pending-master-checkpoint", paths:["specification-builder-brand.css"],
  candidateCommit, candidateTree, receiptRunId:"style-focused-run",
}, "review evidence durably carries unresolved stylesheet terminal obligations");
const integratedNote = JSON.parse((await exec(
  "git", ["notes", "--ref=refs/notes/swarmforge-verification", "show", "723ebf6e"],
  { maxBuffer:64 * 1024 * 1024 },
)).stdout);
const integratedEvidence = integratedNote.records.find(({ task }) => task === "vtd017-shared-artifact-parallel");
assert.ok(integratedEvidence, "the integrated final note supplies the production evidence shape");
assert.equal(validateCanonicalMasterEvidenceRecord(integratedEvidence, {
  canonicalPackIds:allPacks,
}), integratedEvidence);
assert.throws(() => validateCanonicalMasterEvidenceRecord({
  status:"passed", candidate:{ commit:candidateCommit, tree:candidateTree },
  plan:{ mode:"terminal", selectedPackIds:allPacks, includeProperties:true },
}), /canonical master evidence record/i,
"invented proof-shaped objects cannot satisfy terminal evidence validation");
assert.equal(canonicalTerminalPlanEligible({ ...integratedEvidence.plan,
  selectedPackIds:integratedEvidence.plan.selectedPackIds.slice(1),
}, packs), false,
"terminal eligibility is bound to the candidate registry, not a 20-pack count");
assert.throws(() => createReviewReadyRecord({
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
  changeSet:{ version:1, baseCommit, commit:candidateCommit, paths:["scripts/workflow.mjs"] },
  receipt:{ ...receipt, tasks:{ bad:{ identity:{ key:"bad" }, status:"failed" } } },
  receiptPath:"tmp/verification-receipts/failed.json", receiptSha256:"5".repeat(64),
}), /passed/i);
assert.throws(() => createReviewReadyRecord({
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
  changeSet:{ version:1, baseCommit, commit:candidateCommit, paths:["src/side-panel.ts"] },
  receipt, receiptPath:"tmp/verification-receipts/unrelated.json", receiptSha256:"5".repeat(64),
}), /changed paths/i);
assert.throws(() => createReviewReadyRecord({
  task:"future-slice", baseCommit, candidateCommit, candidateTree,
  changeSet:{ version:2, baseCommit, commit:candidateCommit, paths:["scripts/workflow.mjs"] },
  receipt, receiptPath:"tmp/verification-receipts/version.json", receiptSha256:"5".repeat(64),
}), /canonical candidate change set/i);

assert.deepEqual(handoffReadinessPolicy({
  sender:"coder", recipients:["refactorer"], task:"future-slice",
  readiness:"review-ready", verified:"review-ready", allPackIds:allPacks,
}), { mode:"review", requiredEvidence:"review-ready" });
assert.deepEqual(handoffReadinessPolicy({
  sender:"refactorer", recipients:["architect"], task:"future-slice",
  readiness:"review-ready", verified:"review-ready", allPackIds:allPacks,
}), { mode:"review", requiredEvidence:"review-ready" });
assert.deepEqual(handoffReadinessPolicy({
  sender:"architect", recipients:["specifier"], task:"future-slice",
  readiness:"qa-ready", verified:"review-ready", allPackIds:allPacks,
}), { mode:"qa-integration", requiredEvidence:"review-ready" });
assert.deepEqual(handoffReadinessPolicy({
  sender:"specifier", recipients:["architect"], task:"qa-master-promotion",
  readiness:"release-candidate", verified:"qa-candidate", allPackIds:allPacks,
  granularityPortfolioStatus:{ready:true,blocking:[]},
}), { mode:"master-integration", requiredEvidence:"qa-candidate" });
assert.throws(() => handoffReadinessPolicy({
  sender:"specifier", recipients:["architect"], task:"qa-master-promotion",
  readiness:"release-candidate", verified:"qa-candidate", allPackIds:allPacks,
  granularityPortfolioStatus:{ready:false,blocking:["undisposed:observation-1"]},
}), /granularity.*portfolio|undisposed/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"specifier", recipients:["architect"], task:"qa-master-promotion",
  readiness:"release-candidate", verified:"qa-candidate", allPackIds:allPacks,
  granularityPortfolioStatus:{ready:false,blocking:["selected-hardening-not-on-qa:route-hardening"]},
}), /selected-hardening-not-on-qa/i);
const malformedPortfolioRepository=await mkdtemp(path.join(os.tmpdir(),"granularity-malformed-"));
let malformedPortfolioRuntime;
let malformedPortfolioRegressionResult;
try {
  await exec("git",["init"],{cwd:malformedPortfolioRepository});
  const commonDirectory=(await exec("git",["rev-parse","--git-common-dir"],
    {cwd:malformedPortfolioRepository,encoding:"utf8"})).stdout.trim();
  const repositoryIdentity=createHash("sha256").update(
    path.resolve(malformedPortfolioRepository,commonDirectory)).digest("hex");
  malformedPortfolioRuntime=path.join(os.tmpdir(),"swarmforge-repository-runtime",repositoryIdentity);
  await mkdir(malformedPortfolioRuntime,{recursive:true});
  await writeFile(path.join(malformedPortfolioRuntime,"granularity-portfolio.json"),JSON.stringify({
    version:1,observations:{},hardeningProofs:[],
  }));
  let policyError;
  try {
    handoffReadinessPolicy({sender:"specifier",recipients:["architect"],
      task:"qa-master-promotion",readiness:"release-candidate",verified:"qa-candidate",
      allPackIds:allPacks,granularityPortfolioStatus:granularityPortfolioFreezeStatusSync(
        malformedPortfolioRepository,"qa-master-promotion")});
  } catch (error) { policyError=error; }
  assert.match(policyError?.message??"",/portfolio is malformed/i,
    "release-candidate policy fails closed when persisted portfolio schema is invalid");
  malformedPortfolioRegressionResult={malformedStoreRejected:true,
    fixtureResolvedToRepositoryRuntime:malformedPortfolioRuntime.includes(
      `${path.sep}swarmforge-repository-runtime${path.sep}`)};
} finally {
  await rm(malformedPortfolioRepository,{recursive:true,force:true});
  if (malformedPortfolioRuntime) await rm(malformedPortfolioRuntime,{recursive:true,force:true});
}
assert.deepEqual(handoffReadinessPolicy({
  sender:"architect", recipients:["specifier"], task:"future-slice",
  readiness:"final-ready", verified:allPacks.join(","), allPackIds:allPacks,
}), { mode:"final", requiredEvidence:"final-ready" });
assert.deepEqual(handoffReadinessPolicy({
  sender:"coder", recipients:["refactorer"], task:"vtd015-settled-final-verification",
  readiness:undefined, verified:allPacks.join(","), allPackIds:allPacks,
}), { mode:"legacy-bootstrap", requiredEvidence:"legacy-exact" });
assert.throws(() => handoffReadinessPolicy({
  sender:"coder", recipients:["refactorer"], task:"vtd015-settled-final-verification",
  readiness:undefined, verified:"review-ready", allPackIds:allPacks,
}), /legacy exact/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"architect", recipients:["specifier"], task:"future-slice",
  readiness:"review-ready", verified:"review-ready", allPackIds:allPacks,
}), /qa-ready/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"coder", recipients:["refactorer"], task:"future-slice",
  readiness:"final-ready", verified:allPacks.join(","), allPackIds:allPacks,
}), /review-ready/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"coder", recipients:["architect"], task:"future-slice",
  readiness:"review-ready", verified:"review-ready", allPackIds:allPacks,
}), /next review role/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"refactorer", recipients:["specifier"], task:"future-slice",
  readiness:undefined, verified:allPacks.join(","), allPackIds:allPacks,
}), /next review role/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"specifier", recipients:["coder"], task:"future-slice",
  readiness:"final-ready", verified:allPacks.join(","), allPackIds:allPacks,
}), /architect.*specifier/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"architect", recipients:["refactorer"], task:"future-slice",
  readiness:"qa-ready", verified:"review-ready", allPackIds:allPacks,
}), /QA-ready.*architect-to-specifier/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"specifier", recipients:["coder"], task:"qa-master-promotion",
  readiness:"release-candidate", verified:"qa-candidate", allPackIds:allPacks,
}), /QA release candidates.*specifier-to-architect/i);
assert.throws(() => handoffReadinessPolicy({
  sender:"architect", recipients:["specifier"], task:"future-slice",
  readiness:"final-ready", verified:allPacks.slice(1).join(","), allPackIds:allPacks,
}), /every canonical verification pack/i);
assert.deepEqual(handoffReadinessPolicy({
  sender:"specifier", recipients:["coder"], task:"future-slice",
  readiness:undefined, verified:"not-required", allPackIds:allPacks,
}), { mode:"ordinary", requiredEvidence:"legacy" });

assert.deepEqual(finalEvidenceEffect({
  changedPaths:["src/side-panel.ts"], boundIdentitiesEqual:false,
}), { eligible:false, action:"settle-and-rerun-all-20" });
assert.deepEqual(finalEvidenceEffect({
  changedPaths:["docs/scorecard.md"], boundIdentitiesEqual:true,
}), { eligible:true, action:"promote-or-integrate" });
assert.deepEqual(finalEvidenceEffect({
  changedPaths:["features/changed-contract.feature"], boundIdentitiesEqual:true,
}), { eligible:false, action:"settle-and-rerun-all-20" });
assert.deepEqual(finalEvidenceEffect({
  changedPaths:["manifest.json"], boundIdentitiesEqual:true,
}), { eligible:false, action:"settle-and-rerun-all-20" });
assert.deepEqual(finalEvidenceEffect({
  changedPaths:["docs/scorecard.md", "verification/packs.json"], boundIdentitiesEqual:false,
}), { eligible:false, action:"settle-and-rerun-all-20" });

const scorecard = deliveryScorecard({
  approvedAt:"2026-08-11T10:00:00.000Z", integratedAt:"2026-08-11T11:00:00.000Z",
  handoffs:[
    { role:"coder", startedAt:"2026-08-11T10:00:00.000Z", completedAt:"2026-08-11T10:15:00.000Z" },
    { role:"refactorer", startedAt:"2026-08-11T10:15:00.000Z", completedAt:"2026-08-11T10:30:00.000Z" },
  ],
  receipts:[
    { kind:"review-ready", durationMs:60000, status:"passed" },
    { kind:"final-ready", durationMs:1200000, status:"passed", terminalLeavesPreserved:true },
    { kind:"final-ready", durationMs:1000000, status:"passed", invalidated:true },
    { kind:"final-ready", durationMs:10000, status:"failed", repaired:true, rerun:true },
  ],
  historicalSuccessfulFullRuns:2,
});
assert.equal(scorecard.approvalToIntegrationMs, 3600000);
assert.equal(scorecard.focusedVerificationMs, 60000);
assert.equal(scorecard.finalGateMs, 2210000);
assert.equal(scorecard.successfulFullRuns, 2);
assert.equal(scorecard.invalidatedFullRuns, 1);
assert.equal(scorecard.failures, 1);
assert.equal(scorecard.repairs, 1);
assert.equal(scorecard.reruns, 1);
assert.equal(scorecard.terminalEvidencePreserved, true);
assert.equal(scorecard.modeledAvoidedSuccessfulFullRuns, 1);
await runSettledFinalVerificationCommand([
  "validate-handoff", "coder", "refactorer", "vtd015-settled-final-verification",
  "legacy", allPacks.join(","),
]);
await assert.rejects(() => runSettledFinalVerificationCommand(["unknown"]), /use:/i);

const evidenceRepository = await mkdtemp(path.join(os.tmpdir(), "review-ready-evidence-"));
try {
  await exec("git", ["init", "-q"], { cwd:evidenceRepository });
  await exec("git", ["config", "user.name", "Review Evidence Test"], { cwd:evidenceRepository });
  await exec("git", ["config", "user.email", "review-evidence@example.test"], { cwd:evidenceRepository });
  await writeFile(path.join(evidenceRepository, ".gitignore"), "tmp/\n");
  await writeFile(path.join(evidenceRepository, "README.md"), "base\n");
  await exec("git", ["add", ".gitignore", "README.md"], { cwd:evidenceRepository });
  await exec("git", ["commit", "-qm", "base"], { cwd:evidenceRepository });
  const { stdout:base } = await exec("git", ["rev-parse", "HEAD"], { cwd:evidenceRepository });
  await mkdir(path.join(evidenceRepository, "scripts"));
  await writeFile(path.join(evidenceRepository, "scripts", "workflow.mjs"), "export const ready = true;\n");
  await exec("git", ["add", "scripts/workflow.mjs"], { cwd:evidenceRepository });
  await exec("git", ["commit", "-qm", "candidate"], { cwd:evidenceRepository });
  const [{ stdout:candidate }, { stdout:tree }] = await Promise.all([
    exec("git", ["rev-parse", "HEAD"], { cwd:evidenceRepository }),
    exec("git", ["rev-parse", "HEAD^{tree}"], { cwd:evidenceRepository }),
  ]);
  const receiptDirectory = path.join(evidenceRepository, "tmp", "verification-receipts");
  await mkdir(receiptDirectory, { recursive:true });
  const receiptFile = path.join(receiptDirectory, "focused.json");
  await writeFile(receiptFile, JSON.stringify({
    ...receipt,
    candidate:{ commit:candidate.trim(), tree:tree.trim() },
  }));
  const recorded = await recordReviewReadyEvidence(
    receiptFile, base.trim(), "future-slice", { repositoryRoot:evidenceRepository },
  );
  assert.equal(recorded.changeSet.paths[0], "scripts/workflow.mjs");
  const verified = await verifyReviewReadyEvidence(
    candidate.trim(), base.trim(), "future-slice", { repositoryRoot:evidenceRepository },
  );
  assert.equal(verified.receipt.sha256, recorded.receipt.sha256);
  await assert.rejects(() => verifyReviewReadyEvidence(
    candidate.trim(), base.trim(), "another-task", { repositoryRoot:evidenceRepository },
  ), /no bound review-ready evidence/i);
} finally {
  await rm(evidenceRepository, { recursive:true, force:true });
}

const admissionRepository = await mkdtemp(path.join(os.tmpdir(), "eligible-repair-review-"));
try {
  await exec("git", ["init", "-q"], { cwd:admissionRepository });
  await exec("git", ["config", "user.name", "Admission Transaction Test"],
    { cwd:admissionRepository });
  await exec("git", ["config", "user.email", "admission@example.test"],
    { cwd:admissionRepository });
  await writeFile(path.join(admissionRepository, "README.md"), "base\n");
  await exec("git", ["add", "README.md"], { cwd:admissionRepository });
  await exec("git", ["commit", "-qm", "base"], { cwd:admissionRepository });
  const { stdout:admissionBase } = await exec("git", ["rev-parse", "HEAD"],
    { cwd:admissionRepository });
  await writeFile(path.join(admissionRepository, "runner.mjs"), "export const admission = true;\n");
  await exec("git", ["add", "runner.mjs"], { cwd:admissionRepository });
  await exec("git", ["commit", "-qm", "candidate"], { cwd:admissionRepository });
  const [{ stdout:admissionCommit }, { stdout:admissionTree }] = await Promise.all([
    exec("git", ["rev-parse", "HEAD"], { cwd:admissionRepository }),
    exec("git", ["rev-parse", "HEAD^{tree}"], { cwd:admissionRepository }),
  ]);
  const commit = admissionCommit.trim(), tree = admissionTree.trim(), base = admissionBase.trim();
  const lockOrder = [];
  let enterFirst, releaseFirst;
  const firstEntered = new Promise((resolve)=>{ enterFirst = resolve; });
  const firstRelease = new Promise((resolve)=>{ releaseFirst = resolve; });
  const firstWriter = withVerificationNotesLock(admissionRepository, async()=>{
    lockOrder.push("first-enter"); enterFirst(); await firstRelease; lockOrder.push("first-exit");
  });
  await firstEntered;
  const secondWriter = withVerificationNotesLock(admissionRepository, async()=>{
    lockOrder.push("second-enter");
  });
  await new Promise((resolve)=>setTimeout(resolve, 20));
  assert.deepEqual(lockOrder, ["first-enter"], "the canonical notes lock serializes valid writers");
  releaseFirst();
  await Promise.all([firstWriter, secondWriter]);
  assert.deepEqual(lockOrder, ["first-enter", "first-exit", "second-enter"]);
  const admissionChangeSet = await canonicalVerificationChangeSet({
    base, commit, repositoryRoot:admissionRepository,
  });
  await mkdir(path.join(admissionRepository, "build", "package"), { recursive:true });
  await writeFile(path.join(admissionRepository, "build", "package", "my-chrome-utilities.zip"),
    "fresh package");
  const selectedIdentity = { key:"unit:test/admission.mjs", stage:"unit", executable:"node",
    args:["test/admission.mjs"], target:"test/admission.mjs", packId:null, environment:null,
    requiredCapabilities:[] };
  const repairSourceCommit = "a".repeat(40), repairSourceTree = "b".repeat(40);
  const repair = { status:"eligible",
    candidate:{ commit:repairSourceCommit, tree:repairSourceTree },
    checkpoint:{ baseCommit:base, evidenceTask:"eligible-repair-admission" },
    causalCategory:"review transaction", causalExplanation:"The exact admission is rederived.",
    regression:{ key:selectedIdentity.key, status:"passed", commit:repairSourceCommit,
      receiptSha256:"6".repeat(64) },
    focusedReceipt:{ status:"passed", commit:repairSourceCommit, provenance:"fresh",
      receiptSha256:"7".repeat(64) },
    causalProtocol:{ version:2, incidentId:"incident-admission",
      failureDigest:"3".repeat(64), preRepairResult:{ status:"failed" },
      repairResult:{ status:"passed" } } };
  const admissions = { version:1, evidenceTask:"eligible-repair-admission", baseCommit:base,
    candidateCommit:commit, candidateTree:tree, changeSetDigest:"1".repeat(64),
    planDigest:"2".repeat(64), entries:[{ incidentId:"incident-admission",
      failureDigest:"3".repeat(64), causalKey:"4".repeat(64),
      repairDigest:timeoutIncidentDigest(repair),
      governedTaskDigest:verificationTaskDigest(selectedIdentity), regressionKey:selectedIdentity.key,
      selectedTaskKey:selectedIdentity.key,
      selectedTaskDigest:verificationTaskDigest({
        args:selectedIdentity.args, environment:null, executable:"node", key:selectedIdentity.key,
        packId:null, requiredCapabilities:[], stage:"unit", target:selectedIdentity.target,
      }), coverageKind:"regression" }] };
  const transactionReceipt = { ...receipt,
    candidate:{ commit, tree, baseCommit:base, evidenceTask:"eligible-repair-admission",
      changeSetDigest:"1".repeat(64) },
    eligibleRepairAdmissions:admissions, plan:{ ...receipt.plan, changedPaths:["runner.mjs"],
      changeSetDigest:"1".repeat(64), taskPlanDigest:"2".repeat(64) },
    tasks:{ [selectedIdentity.key]:{ identity:selectedIdentity, status:"passed", provenance:"fresh" },
      "package:canonical":{ identity:{ key:"package:canonical", stage:"package" },
        status:"passed", provenance:"fresh" } } };
  const admitted = createReviewReadyRecord({
    task:"eligible-repair-admission", baseCommit:base, candidateCommit:commit,
    candidateTree:tree, changeSet:admissionChangeSet, receipt:transactionReceipt,
    receiptPath:"tmp/verification-receipts/admitted.json", receiptSha256:"5".repeat(64),
    recordedAt:"2026-08-11T10:03:00.000Z",
  });
  const incident = { id:"incident-admission", state:"unresolved",
    failureDigest:"3".repeat(64), failure:{ causalKey:"4".repeat(64), task:selectedIdentity }, repair,
    lineageTransitions:[{ kind:"rebase", fromCommit:repairSourceCommit,
      toCommit:commit, toTree:tree, at:"2026-08-19T13:57:12.536Z" }] };
  const deferrals = [];
  let persistedIncident = structuredClone(incident);
  let blockingIncidents = [persistedIncident];
  const store = { read:async()=>structuredClone(persistedIncident),
    blocking:async()=>blockingIncidents.map((item)=>structuredClone(item)),
    withAdmissionRecordingLock:async(operation)=>operation(),
    deferTerminalVerification:async(id, proof)=>{
      deferrals.push({ id, proof });
      persistedIncident.terminalVerificationDeferred = {
        status:"terminal-verification-deferred",
        repairDigest:timeoutIncidentDigest(persistedIncident.repair),
        ...structuredClone(proof),
      };
    } };
  const transactionOptions = { repositoryRoot:admissionRepository, store,
    receiptLoader:async()=>structuredClone(transactionReceipt), packsLoader:async()=>[] };
  const newIncident = structuredClone(incident);
  newIncident.id = "incident-newly-applicable";
  newIncident.failureDigest = "8".repeat(64);
  newIncident.failure.causalKey = "9".repeat(64);
  newIncident.repair.causalProtocol = { ...newIncident.repair.causalProtocol,
    incidentId:newIncident.id, failureDigest:newIncident.failureDigest };
  blockingIncidents = [persistedIncident, newIncident];
  await assert.rejects(()=>recordEligibleRepairReviewTransaction(admitted,
    { version:1, records:[] }, transactionOptions), /admission set changed/i,
  "a newly applicable unresolved incident blocks incomplete transaction recording");
  const alreadyDeferredIncident = { ...structuredClone(newIncident), id:"incident-already-deferred",
    terminalVerificationDeferred:{ status:"terminal-verification-deferred",
      candidate:{ commit:"6".repeat(40), tree:"7".repeat(40) },
      repairDigest:timeoutIncidentDigest(newIncident.repair) } };
  blockingIncidents = [persistedIncident, alreadyDeferredIncident];
  await assert.rejects(()=>recordEligibleRepairReviewTransaction(admitted,
    { version:1, records:[] }, { ...transactionOptions,
      afterDeferrals:async()=>{ throw new Error("simulated crash"); } }), /simulated crash/,
  "an older terminal deferral remains nonblocking while the admitted transaction records");
  await assert.rejects(()=>verifyReviewReadyEvidence(commit, base, "eligible-repair-admission",
    { repositoryRoot:admissionRepository }), /no bound review-ready evidence/i,
  "a prepared transaction cannot authorize handoff");
  await exec("git", ["notes", "--ref=refs/notes/swarmforge-review-ready", "add", "-f", "-m",
    JSON.stringify({ version:1, records:[{ competing:true }] }), commit],
  { cwd:admissionRepository });
  await assert.rejects(()=>recordEligibleRepairReviewTransaction(admitted,
    { version:1, records:[] }, transactionOptions),
  /competing review note/i, "a prepared transaction cannot overwrite a competing writer");
  await exec("git", ["notes", "--ref=refs/notes/swarmforge-review-ready", "remove", commit],
    { cwd:admissionRepository });
  const completed = await recordEligibleRepairReviewTransaction(admitted,
    { version:1, records:[] }, transactionOptions);
  assert.equal(completed.journal.status, "committed");
  assert.equal(deferrals.length, 3, "resume revalidates the idempotent incident disposition");
  assert.equal((await verifyCommittedReviewTransaction(completed.record, admissionRepository,
    { store })).eligibleRepairTransaction.status, "committed");
  const replayed = await recordEligibleRepairReviewTransaction(admitted,
    completed.note, transactionOptions);
  assert.equal(replayed.journal.status, "committed");
  assert.equal(deferrals.length, 3, "committed replay is validation-only and cannot downgrade evidence");
  const committedDeferral = structuredClone(persistedIncident.terminalVerificationDeferred);
  delete persistedIncident.terminalVerificationDeferred;
  await assert.rejects(()=>verifyCommittedReviewTransaction(completed.record, admissionRepository,
    { store }), /lacks its exact committed deferral/i,
  "a missing committed deferral invalidates the review transaction");
  persistedIncident.terminalVerificationDeferred = {
    ...committedDeferral, candidate:{ ...committedDeferral.candidate, tree:"replaced-tree" },
  };
  await assert.rejects(()=>verifyCommittedReviewTransaction(completed.record, admissionRepository,
    { store }), /lacks its exact committed deferral/i,
  "a replaced committed deferral invalidates the review transaction");
} finally {
  await rm(admissionRepository, { recursive:true, force:true });
}

const releaseRepository = await mkdtemp(path.join(os.tmpdir(), "qa-release-candidate-"));
try {
  await exec("git", ["init", "-q", "--initial-branch=master"], { cwd:releaseRepository });
  await exec("git", ["config", "user.name", "QA Release Test"], { cwd:releaseRepository });
  await exec("git", ["config", "user.email", "qa-release@example.test"], { cwd:releaseRepository });
  await writeFile(path.join(releaseRepository, "README.md"), "master\n");
  await exec("git", ["add", "README.md"], { cwd:releaseRepository });
  await exec("git", ["commit", "-qm", "master base"], { cwd:releaseRepository });
  const { stdout:releaseBase } = await exec("git", ["rev-parse", "HEAD"], { cwd:releaseRepository });
  await exec("git", ["switch", "-q", "-c", "qa"], { cwd:releaseRepository });
  await writeFile(path.join(releaseRepository, "feature.txt"), "qa feature\n");
  await exec("git", ["add", "feature.txt"], { cwd:releaseRepository });
  await exec("git", ["commit", "-qm", "QA feature"], { cwd:releaseRepository });
  const { stdout:releaseCandidate } = await exec("git", ["rev-parse", "HEAD"], { cwd:releaseRepository });
  const verifiedRelease = await verifyQaReleaseCandidate(
    releaseCandidate.trim(), releaseBase.trim(), { repositoryRoot:releaseRepository },
  );
  assert.equal(verifiedRelease.qaHead, releaseCandidate.trim());
  assert.equal(verifiedRelease.masterHead, releaseBase.trim());
  await assert.rejects(() => verifyQaReleaseCandidate(
    releaseBase.trim(), releaseBase.trim(), { repositoryRoot:releaseRepository },
  ), /exact QA head/u);
} finally {
  await rm(releaseRepository, { recursive:true, force:true });
}

console.log(JSON.stringify({
  vtd015Acceptance:{
    reviewReady:{
      bound:true, focusedOnly:true, finalClaim:false,
      roles:{ coder:"refactorer", refactorer:"architect" },
      fields:["task", "baseCommit", "candidateCommit", "candidateTree", "changeSet",
        "focusedScope", "result", "startedAt", "completedAt", "recordedAt"],
    },
    finalReady:{
      packCount:allPacks.length, propertyRequired:true, packageRequired:true,
      terminalEvidencePreserved:true, sealedTreeOnly:true,
      bindings:["base", "task", "candidateTree", "completePlan", "artifact", "toolchain",
        "receipt", "timestamps"],
    },
    invalidation:{
      rows:{
        "production, test, build, registry, runner, or workflow input changes":{
          effect:"final evidence is invalid", action:"settle the changed tree and run all 20 packs freshly" },
        "documentation-only recording preserves every bound identity":{
          effect:"final product evidence remains eligible", action:"promote or integrate without another product run" },
      },
    },
    failure:{ recorded:true, causalFocusedProof:true, freshAll20:true, package:true,
      noRetry:true, noLowerConcurrency:true, noCarriedLeaf:true, noUnrelatedReceipt:true },
    actions:{
      "focused refactorer or architect review":"permit the next named review role",
      "QA integration after an exact architect QA-ready handoff":"permit only the QA fast-forward",
      "integration into master":"block because final evidence is absent",
      "completion broadcast to the specifier":"block because final evidence is absent",
      "promotion of another task or base receipt as final":"block because its bound identity does not match",
    },
    historical:{
      "Command Palette controller":{ successfulFullRuns:3, avoidedFullRuns:2 },
      "workspace-tabs controller":{ successfulFullRuns:2, avoidedFullRuns:1 },
    },
    bootstrap:{ task:"vtd015-settled-final-verification", mode:"legacy-bootstrap",
      inactiveUntilIntegration:true, firstPayback:"VTD-012", noBypass:true },
    completedFeatureDelta:0,
    recommendationRequired:true,
    qaPilot:{
      scopePreflight:{ authorized:focusedScopePreflight, blocked:expandedScopePreflight },
      terminalVerificationDeferred:{
        unresolved:true, abandoned:false, focusedReview:true, qaIntegration:true,
        releaseCandidate:true, finalReady:false, all20Launched:false,
      },
      deferredCarryForward:{
        specificationOnlyStart:true, changedPathConservation:true,
        independentDescendant:true, relevantInputRequiresFreshProof:true,
        unresolved:true, masterOnlyResolution:true,
      },
      qaReady:{ exactTreeOnly:true, focusedOnly:true, boundFocusedEvidence:true,
        qaFastForwardOnly:true, fullRegressionClaim:false, masterCompletionClaim:false },
      masterIntegration:{ explicitUserRequest:true, qaHeadFrozen:true, masterBaseBound:true,
        cleanLineage:true, exactPromotionOnly:true, branchesConverge:true,
        bindings:["masterBase", "releaseTask", "candidateTree", "completePlan", "artifact",
          "toolchain", "receipt", "timestamps"] },
      scorecard:{
        deliveryIntervals:{ approvalToQa:true, qaQueue:true, approvalToMaster:true },
        verificationMeasures:{ focused:true, finalAttempts:true, failures:true, repairs:true,
          reverts:true, reruns:true, amortizedFinalGate:true },
        baselineComparison:true, userControlsPromotion:true,
      },
    },
    scorecard,
  },
}));
if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const expectedPreRepairFailure={malformedStoreRejected:false,
    fixtureResolvedToRepositoryRuntime:false};
  const expectedRepairResult={malformedStoreRejected:true,
    fixtureResolvedToRepositoryRuntime:true};
  assert.deepEqual(malformedPortfolioRegressionResult,expectedRepairResult);
  const fixture={id:"repository-runtime-malformed-portfolio-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    input:{policy:"release-candidate",store:"granularity-portfolio.json"},
    expectedPreRepairFailure,expectedRepairResult};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:malformedPortfolioRegressionResult}}}));
}
console.log("settled final verification workflow tests passed");
