import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";

import {
  assertNoBlockingTimeoutIncidents, createTimeoutIncidentStore,
} from "./verification-reliability-store.mjs";
import { terminalProjectionCoverage } from "./verification-reliability-deferred.mjs";
import {baselineDiagnosticDocument} from
  "./verification-policy/reliability/baseline-evidence-admission.mjs";
import {produceBaselineDiagnosticPair} from
  "./verification-policy/reliability/baseline-diagnostic-producer.mjs";
import { git, repositoryRoot } from "./verification-reliability-values.mjs";

export { createTimeoutIncidentStore };

function reviewHandoffRequested(readiness, verified) {
  return [verified === "review-ready", ["review-ready", "qa-ready"].includes(readiness)].every(Boolean);
}

export function packageProofValid({ details, canonicalPath, packagePath, review }) {
  return [details.isFile(), !details.isSymbolicLink(), canonicalPath === packagePath,
    details.mtimeMs >= Date.parse(review.startedAt)].every(Boolean);
}

export async function canonicalPackageProof(review, { root = repositoryRoot } = {}) {
  const packagePath = path.resolve(root, "build/package/my-chrome-utilities.zip");
  const [details, canonicalPath, bytes] = await Promise.all([
    lstat(packagePath), realpath(packagePath), readFile(packagePath),
  ]);
  if (!packageProofValid({ details, canonicalPath, packagePath, review })) {
    throw new Error("Terminal verification deferral requires a fresh canonical package proof");
  }
  return { path:path.relative(root, packagePath),
    digest:createHash("sha256").update(bytes).digest("hex") };
}

async function boundReviewReceipt(review) {
  if(!/^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u.test(review.receipt.path))
    throw new Error("Terminal verification deferral requires a canonical review receipt path");
  const receiptPath=path.resolve(repositoryRoot,review.receipt.path),bytes=await readFile(receiptPath);
  if (createHash("sha256").update(bytes).digest("hex")!==review.receipt.sha256) {
    throw new Error("Terminal verification deferral review receipt digest changed");
  }
  return JSON.parse(bytes);
}

function terminalDeferralProof(review, packageProof, incident, receipt) {
  const projectionCoverage=terminalProjectionCoverage(incident,receipt.tasks);
  return {
    candidate:{ commit:review.candidateCommit, tree:review.candidateTree },
    reviewReady:{ task:review.task, baseCommit:review.baseCommit,
      candidateCommit:review.candidateCommit, candidateTree:review.candidateTree,
      receiptSha256:review.receipt.sha256,
      focusedTaskKeys:[...review.focusedScope.taskKeys] },
    ...(review.runIntentBootstrap
      ? { runIntentBootstrap:structuredClone(review.runIntentBootstrap) } : {}),
    ...(projectionCoverage ? { projectionCoverage } : {}),
    package:packageProof,
  };
}

export function reviewAdmissionTransactionOwnsDeferrals(review) {
  const bootstrapObligations = (review?.runIntentBootstrap?.coverage ?? []).some(
    ({ admission, terminalObligation }) =>
      admission?.kind === "bootstrap-terminal-obligation" && terminalObligation === true);
  return Boolean(review?.eligibleRepairAdmissions || review?.confirmedFlakyAdmissions ||
    review?.deterministicBaselineAdmission||bootstrapObligations);
}

export async function recordEligibleIncidentDeferral(store, incident, review, proof) {
  const deferredCandidate = incident.terminalVerificationDeferred?.candidate?.commit;
  const exactRepairCandidate = incident.repair?.candidate?.commit === review.candidateCommit;
  if (deferredCandidate && (!exactRepairCandidate || deferredCandidate === review.candidateCommit)) return;
  await store.deferTerminalVerification(incident.id, proof);
}

async function recordEligibleHandoffDeferrals(store, incidents, {
  commit, base, task, readiness, verified,
}) {
  if (!reviewHandoffRequested(readiness, verified)) return;
  const { verifyReviewReadyEvidence } = await import("./settled-final-verification.mjs");
  const review = await verifyReviewReadyEvidence(commit, base, task);
  if (reviewAdmissionTransactionOwnsDeferrals(review)) {
    // Admission recording owns the transaction. Handoff validation is read-only.
    return;
  }
  const [packageProof,receipt]=await Promise.all([
    canonicalPackageProof(review),boundReviewReceipt(review),
  ]);
  for (const incident of incidents) {
    const proof = terminalDeferralProof(review, packageProof, incident, receipt);
    await recordEligibleIncidentDeferral(store, incident, review, proof);
  }
}

async function assertReliabilityHandoff(commit, base, task, readiness, verified, sender) {
  const canonical = await git(repositoryRoot, "rev-parse", `${commit}^{commit}`);
  const store = createTimeoutIncidentStore();
  const incidents = await store.blocking({ commit:canonical });
  await recordEligibleHandoffDeferrals(store, incidents,
    { commit:canonical, base, task, readiness, verified });
  const blocked = await store.blockingForHandoff({
    commit:canonical, base, readiness, sender, verified,
  });
  if (blocked.length) {
    throw new Error(`Unresolved reliability incident(s) block verification evidence and Git handoff: ${
      blocked.map(({ id }) => id).join(", ")}. Complete a causal repair and fresh checkpoint.`);
  }
}

export async function runReliabilityIncidentCli(args) {
  const [command, commit = "HEAD"] = args;
  if (command === "assert-handoff") {
    const [, handoffCommit, base, task, readiness, verified, sender] = args;
    if (base && task && readiness && verified) {
      await assertReliabilityHandoff(handoffCommit, base, task, readiness, verified, sender);
    } else await assertNoBlockingTimeoutIncidents(handoffCommit);
    console.log("reliability incident gate passed");
    return;
  }
  if (command === "assert-evidence") {
    await assertNoBlockingTimeoutIncidents(commit);
    console.log("reliability incident gate passed");
    return;
  }
  if (command === "list") {
    console.log(JSON.stringify(await createTimeoutIncidentStore().list(), null, 2));
    return;
  }
  if (command === "propose-repair") {
    const [, id, causalCategory, causalExplanation, regressionKey, regressionReceiptPath,
      focusedReceiptPath] = args;
    const incident = await createTimeoutIncidentStore().proposeRepair(id, {
      causalCategory, causalExplanation, regressionKey, regressionReceiptPath, focusedReceiptPath,
    });
    console.log(JSON.stringify({ incidentId:incident.id, repair:incident.repair }, null, 2));
    return;
  }
  if(command==="record-baseline-proof") {
    const [,id,bindingPath]=args;
    const resolvedBinding=path.resolve(repositoryRoot,bindingPath??"");
    if(!resolvedBinding.startsWith(`${path.resolve(repositoryRoot,"tmp")}${path.sep}`)) {
      throw new Error("Baseline binding must be under tmp");
    }
    const binding=JSON.parse(await readFile(resolvedBinding,"utf8"));
    const produced=await produceBaselineDiagnosticPair(repositoryRoot,binding);
    const [baseDocument,candidateDocument]=await Promise.all([
      baselineDiagnosticDocument(repositoryRoot,produced.base.path),
      baselineDiagnosticDocument(repositoryRoot,produced.candidate.path),
    ]);
    const incident=await createTimeoutIncidentStore().recordDeterministicBaselineProof(id,{
      binding,baseReceipt:baseDocument.receipt,candidateReceipt:candidateDocument.receipt,
      baseSource:baseDocument.source,candidateSource:candidateDocument.source});
    console.log(JSON.stringify({incidentId:id,
      deterministicBaselineProof:incident.deterministicBaselineProof},null,2));
    return;
  }
  if (command === "record-rebase") {
    const [, id, fromCommit, toCommit, toTree] = args;
    const incident = await createTimeoutIncidentStore().recordLineageTransition(id, {
      kind:"rebase", fromCommit, toCommit, toTree,
    });
    console.log(JSON.stringify({ incidentId:incident.id,
      lineageTransition:incident.lineageTransitions.at(-1) }, null, 2));
    return;
  }
  if (command === "record-abandon") {
    if (process.env.SWARMFORGE_ROLE !== "specifier") {
      throw new Error("Only the specifier can record a separate user-approved abandonment decision");
    }
    const [, id, fromCommit, reference] = args;
    const incident = await createTimeoutIncidentStore().recordLineageTransition(id, {
      kind:"abandon", fromCommit,
      userDecision:{ approved:true, approvedBy:"specifier", reference },
    });
    console.log(JSON.stringify({ incidentId:incident.id,
      lineageTransition:incident.lineageTransitions.at(-1) }, null, 2));
    return;
  }
  if (command === "retire-audited") {
    if (process.env.SWARMFORGE_ROLE !== "specifier") {
      throw new Error("Only the specifier can apply audited lineage retirements");
    }
    const [, rawExpectedCount] = args;
    const expectedCount = Number(rawExpectedCount);
    const incidents = await createTimeoutIncidentStore().retireAuditedLineages({ expectedCount });
    console.log(JSON.stringify({ retiredCount:incidents.length,
      incidentIds:incidents.map(({ id }) => id).sort() }, null, 2));
    return;
  }
  if (command === "recover-invalid-feature-resolutions") {
    const [, checkpointCommit, rawPackIds, rawExpectedCount] = args;
    const incidents = await createTimeoutIncidentStore().recoverInvalidFeatureResolutions({
      checkpointCommit, packIds:String(rawPackIds ?? "").split(",").filter(Boolean),
      expectedCount:Number(rawExpectedCount),
    });
    console.log(JSON.stringify({ correctedCount:incidents.length,
      incidentIds:incidents.map(({id}) => id).sort() }, null, 2));
    return;
  }
  throw new Error("Use: verification-reliability-incidents.mjs assert-handoff <commit> [base task readiness verified] | assert-evidence [commit] | list | propose-repair <id> <causal-category> <causal-explanation> <regression-key> <regression-receipt> <focused-receipt> | record-baseline-proof <id> <binding-json> | record-rebase <id> <from-commit> <to-commit> <to-tree> | record-abandon <id> <from-commit> <user-decision-reference> | retire-audited <expected-count> | recover-invalid-feature-resolutions <checkpoint-commit> <comma-pack-ids> <expected-count>");
}
