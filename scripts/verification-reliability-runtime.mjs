import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";

import {
  assertNoBlockingTimeoutIncidents, createTimeoutIncidentStore,
} from "./verification-reliability-store.mjs";
import { git, repositoryRoot } from "./verification-reliability-values.mjs";
import { terminalVerificationDeferredConservation } from "./verification-reliability-deferred.mjs";

export { createTimeoutIncidentStore };

function reviewHandoffRequested(readiness, verified) {
  return [verified === "review-ready", ["review-ready", "qa-ready"].includes(readiness)].every(Boolean);
}

function packageProofValid({ details, canonicalPath, packagePath, review }) {
  return [details.isFile(), !details.isSymbolicLink(), canonicalPath === packagePath,
    details.mtimeMs >= Date.parse(review.completedAt)].every(Boolean);
}

async function canonicalPackageProof(review) {
  const packagePath = path.resolve(repositoryRoot, "build/package/my-chrome-utilities.zip");
  const [details, canonicalPath, bytes] = await Promise.all([
    lstat(packagePath), realpath(packagePath), readFile(packagePath),
  ]);
  if (!packageProofValid({ details, canonicalPath, packagePath, review })) {
    throw new Error("Terminal verification deferral requires a fresh canonical package proof");
  }
  return { path:path.relative(repositoryRoot, packagePath),
    digest:createHash("sha256").update(bytes).digest("hex") };
}

function terminalDeferralProof(review, packageProof) {
  return {
    candidate:{ commit:review.candidateCommit, tree:review.candidateTree },
    reviewReady:{ task:review.task, baseCommit:review.baseCommit,
      candidateCommit:review.candidateCommit, candidateTree:review.candidateTree,
      receiptSha256:review.receipt.sha256,
      focusedTaskKeys:[...review.focusedScope.taskKeys] },
    ...(review.runIntentBootstrap
      ? { runIntentBootstrap:structuredClone(review.runIntentBootstrap) } : {}),
    package:packageProof,
  };
}

async function recordIncidentDeferral(store, incident, review, proof) {
  const deferredCandidate = incident.terminalVerificationDeferred?.candidate?.commit;
  if (deferredCandidate === review.candidateCommit) return;
  if (!deferredCandidate) {
    await store.deferTerminalVerification(incident.id, proof);
    return;
  }
  const changedPaths = (await git(repositoryRoot, "diff", "--name-only",
    `${deferredCandidate}..${review.candidateCommit}`)).split(/\r?\n/u).filter(Boolean);
  const conservation = terminalVerificationDeferredConservation({ incident, changedPaths });
  const bootstrapCovers = review.runIntentBootstrap?.coverage
    .some(({ incidentId }) => incidentId === incident.id);
  const operation = bootstrapCovers ? "deferTerminalVerification"
    : conservation.conserved ? "carryTerminalVerification" : "deferTerminalVerification";
  await store[operation](incident.id, proof);
}

async function recordEligibleHandoffDeferrals(store, incidents, {
  commit, base, task, readiness, verified,
}) {
  if (!reviewHandoffRequested(readiness, verified)) return;
  const { verifyReviewReadyEvidence } = await import("./settled-final-verification.mjs");
  const review = await verifyReviewReadyEvidence(commit, base, task);
  const proof = terminalDeferralProof(review, await canonicalPackageProof(review));
  for (const incident of incidents) {
    await recordIncidentDeferral(store, incident, review, proof);
  }
}

async function assertReliabilityHandoff(commit, base, task, readiness, verified, sender) {
  const canonical = await git(repositoryRoot, "rev-parse", `${commit}^{commit}`);
  const store = createTimeoutIncidentStore();
  const incidents = await store.blocking({ commit:canonical });
  await recordEligibleHandoffDeferrals(store, incidents,
    { commit:canonical, base, task, readiness, verified });
  const blocked = await store.blockingForHandoff({ commit:canonical, readiness, sender, verified });
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
  throw new Error("Use: verification-reliability-incidents.mjs assert-handoff <commit> [base task readiness verified] | assert-evidence [commit] | list | propose-repair <id> <causal-category> <causal-explanation> <regression-key> <regression-receipt> <focused-receipt> | record-rebase <id> <from-commit> <to-commit> <to-tree> | record-abandon <id> <from-commit> <user-decision-reference>");
}
