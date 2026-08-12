import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";

import {
  assertNoBlockingTimeoutIncidents, createTimeoutIncidentStore,
} from "./verification-reliability-store.mjs";
import { git, repositoryRoot } from "./verification-reliability-values.mjs";
import { terminalVerificationDeferredConservation } from "./settled-final-verification-policy.mjs";

export { createTimeoutIncidentStore };

async function recordEligibleHandoffDeferrals(store, incidents, {
  commit, base, task, readiness, verified,
}) {
  if (!["review-ready", "qa-ready"].includes(readiness) || verified !== "review-ready") return;
  const { verifyReviewReadyEvidence } = await import("./settled-final-verification.mjs");
  const review = await verifyReviewReadyEvidence(commit, base, task);
  const packagePath = path.resolve(repositoryRoot, "build/package/my-chrome-utilities.zip");
  const [details, canonicalPath, bytes] = await Promise.all([
    lstat(packagePath), realpath(packagePath), readFile(packagePath),
  ]);
  if (!details.isFile() || details.isSymbolicLink() || canonicalPath !== packagePath ||
      details.mtimeMs < Date.parse(review.completedAt)) {
    throw new Error("Terminal verification deferral requires a fresh canonical package proof");
  }
  for (const incident of incidents) {
    if (incident.terminalVerificationDeferred?.candidate?.commit === review.candidateCommit) continue;
    const proof = {
      candidate:{ commit:review.candidateCommit, tree:review.candidateTree },
      reviewReady:{ task:review.task, baseCommit:review.baseCommit,
        candidateCommit:review.candidateCommit, candidateTree:review.candidateTree,
        receiptSha256:review.receipt.sha256,
        focusedTaskKeys:[...review.focusedScope.taskKeys] },
      package:{ path:path.relative(repositoryRoot, packagePath),
        digest:createHash("sha256").update(bytes).digest("hex") },
    };
    const deferredCandidate = incident.terminalVerificationDeferred?.candidate?.commit;
    const changedPaths = deferredCandidate
      ? (await git(repositoryRoot, "diff", "--name-only",
        `${deferredCandidate}..${review.candidateCommit}`)).split(/\r?\n/u).filter(Boolean)
      : [];
    const conservation = deferredCandidate &&
      terminalVerificationDeferredConservation({ incident, changedPaths });
    if (conservation?.conserved) await store.carryTerminalVerification(incident.id, proof);
    else await store.deferTerminalVerification(incident.id, proof);
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
