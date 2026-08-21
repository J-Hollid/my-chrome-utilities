import { same, sortedUnique } from "./settled-final-verification-review.mjs";
import { granularityPortfolioFreezeStatusSync } from "./campsite-granularity-observations.mjs";

function nonNegativeFinite(value, label) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be non-negative`);
  return value;
}

export function reviewReadyProductCandidatePath(changedPath) {
  return changedPath.startsWith("src/") || changedPath.startsWith("dist/") ||
    changedPath.startsWith("assets/") ||
    /^(?:manifest\.json|[^/]+\.(?:css|html))$/u.test(changedPath);
}

export function reviewReadyScopePreflight({
  approvedPackIds, plannedPackIds, taskCount, criticalPathEstimateMs, changedOwners = {},
  startedAtMs, nowMs = Date.now(), effortCeilingMs, allPackIds,
}) {
  const approvedPacks = sortedUnique(approvedPackIds);
  const plannedPacks = sortedUnique(plannedPackIds);
  const canonicalPacks = sortedUnique(allPackIds);
  if (!approvedPacks.length || !plannedPacks.length ||
      [...approvedPacks, ...plannedPacks].some((id) => !canonicalPacks.includes(id))) {
    throw new Error("Review-ready scope preflight requires canonical approved and planned packs");
  }
  if (!Number.isInteger(taskCount) || taskCount < 1) {
    throw new Error("Review-ready scope preflight requires a positive task count");
  }
  nonNegativeFinite(criticalPathEstimateMs, "Critical-path estimate");
  nonNegativeFinite(startedAtMs, "Effort start");
  nonNegativeFinite(nowMs, "Current time");
  nonNegativeFinite(effortCeilingMs, "Effort ceiling");
  const approved = new Set(approvedPacks);
  const expansionCausingPaths = Object.entries(changedOwners)
    .filter(([, owners]) => (owners ?? []).some((id) => !approved.has(id)))
    .map(([changedPath]) => changedPath).sort();
  const authorized = same(approvedPacks, plannedPacks);
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  return {
    status:authorized ? "authorized" : "blocked",
    approvedPacks,
    plannedPacks,
    taskCount,
    criticalPathEstimateMs,
    expansionCausingPaths,
    elapsedMs,
    remainingEffortCeilingMs:Math.max(0, effortCeilingMs - elapsedMs),
    launchAuthorizationCount:authorized ? 1 : 0,
    omittedOwnedPacks:[],
    terminalClaim:false,
  };
}

export function formatReviewReadyScopePreflight(result) {
  return `Review-ready scope preflight ${result.status}. ` +
    `Approved packs: ${result.approvedPacks.join(", ")}; ` +
    `planned packs: ${result.plannedPacks.join(", ")}; ` +
    `${result.taskCount} tasks; critical-path estimate: ${result.criticalPathEstimateMs}ms; ` +
    `expansion-causing paths: ${result.expansionCausingPaths.join(", ") || "none"}; ` +
    `elapsed: ${result.elapsedMs}ms; remaining effort ceiling: ${result.remainingEffortCeilingMs}ms; ` +
    `no owned packs omitted; terminal claim: false.`;
}

export function terminalVerificationDeferredRoute({
  incident, readiness, candidateCommit, candidateDescendsFromDeferred = false,
}) {
  const deferred = incident?.terminalVerificationDeferred;
  const exactCandidate = deferred?.candidate?.commit === candidateCommit;
  const valid = incident?.state === "unresolved" && incident?.repair?.status === "eligible" &&
    deferred?.status === "terminal-verification-deferred";
  if (valid && ["review-ready", "qa-ready"].includes(readiness)) {
    return { permitted:true, mode:readiness === "review-ready" ? "focused-review" : "qa-integration" };
  }
  if (valid && readiness === "release-candidate" &&
      (exactCandidate || candidateDescendsFromDeferred)) {
    return { permitted:true, mode:"master-checkpoint" };
  }
  return { permitted:false, mode:"terminal-blocked" };
}

function exactRecipient(recipientSet, role) {
  return recipientSet.size === 1 && recipientSet.has(role);
}

function requireFinalReady() {
  throw new Error("Only a final-ready candidate may be sent for integration or completion");
}

function bootstrapPolicy(task, readiness, verified) {
  if (task !== "vtd015-settled-final-verification" || readiness !== undefined) return null;
  if (verified === "not-required" || verified === "review-ready") {
    throw new Error("The VTD-015 bootstrap requires legacy exact verification evidence");
  }
  return { mode:"legacy-bootstrap", requiredEvidence:"legacy-exact" };
}

function reviewPolicy(sender, recipientSet, readiness, verified) {
  const nextReviewRole = { coder:"refactorer", refactorer:"architect" }[sender];
  if (!nextReviewRole) return null;
  if (!exactRecipient(recipientSet, nextReviewRole)) {
    throw new Error(`${sender} must send the candidate only to its next review role, ${nextReviewRole}`);
  }
  if (readiness !== "review-ready" || verified !== "review-ready") {
    throw new Error(`${sender} must send review-ready evidence to the next review role`);
  }
  return { mode:"review", requiredEvidence:"review-ready" };
}

function qaPolicy(sender, recipientSet, readiness, verified) {
  if (sender !== "architect" || !exactRecipient(recipientSet, "specifier")) return null;
  if (readiness === "final-ready") return null;
  if (readiness !== "qa-ready" || verified !== "review-ready") {
    throw new Error("Architect feature handoffs to the specifier require qa-ready focused evidence");
  }
  return { mode:"qa-integration", requiredEvidence:"review-ready" };
}

function releasePolicy(sender, recipientSet, task, readiness, verified,granularityPortfolioStatus) {
  if (sender !== "specifier" || !exactRecipient(recipientSet, "architect")) return null;
  if (readiness !== "release-candidate" || verified !== "qa-candidate") {
    throw new Error("Specifier master-integration handoffs to the architect require an exact QA release candidate");
  }
  const portfolio=granularityPortfolioStatus??granularityPortfolioFreezeStatusSync(process.cwd(),task);
  if (!portfolio.ready) {
    throw new Error(`Granularity observation portfolio blocks release freeze: ${portfolio.blocking.join(", ")}`);
  }
  return { mode:"master-integration", requiredEvidence:"qa-candidate" };
}

function packClaim(verified) {
  return sortedUnique(String(verified ?? "").split(",").filter(Boolean));
}

function finalPolicy(sender, recipientSet, readiness, verified, allPackIds) {
  if (sender !== "architect") return null;
  if (!exactRecipient(recipientSet, "specifier")) return null;
  if (readiness !== "final-ready") requireFinalReady();
  if (!same(packClaim(verified), sortedUnique(allPackIds))) {
    throw new Error("Final-ready evidence must cover every canonical verification pack");
  }
  return { mode:"final", requiredEvidence:"final-ready" };
}

function reviewReadyClaim(readiness, verified) {
  return readiness === "review-ready" || verified === "review-ready";
}

function assertNoUnsupportedClaim(sender, recipientSet, readiness, verified) {
  if (readiness === "qa-ready") {
    throw new Error("QA-ready evidence is limited to the architect-to-specifier route");
  }
  if (readiness === "release-candidate" || verified === "qa-candidate") {
    throw new Error("QA release candidates are limited to the specifier-to-architect route");
  }
  if (reviewReadyClaim(readiness, verified)) {
    throw new Error("Review-ready evidence is limited to the named review-role route");
  }
  if (readiness === "final-ready") {
    throw new Error("Final-ready evidence is limited to the architect-to-specifier route");
  }
  if (sender === "architect" && recipientSet.has("specifier")) {
    throw new Error("Architect-to-specifier handoffs require qa-ready or final-ready evidence");
  }
}

function recipientsOf(recipients) {
  return new Set(recipients ?? []);
}

function ordinaryPolicy(readiness) {
  return { mode:"ordinary", requiredEvidence:readiness ?? "legacy" };
}

export function handoffReadinessPolicy({ sender, recipients, task, readiness, verified, allPackIds,
  granularityPortfolioStatus }) {
  const recipientSet = recipientsOf(recipients);
  const bootstrap = bootstrapPolicy(task, readiness, verified);
  if (bootstrap) return bootstrap;
  const review = reviewPolicy(sender, recipientSet, readiness, verified);
  if (review) return review;
  const release = releasePolicy(sender, recipientSet, task, readiness, verified,granularityPortfolioStatus);
  if (release) return release;
  const qa = qaPolicy(sender, recipientSet, readiness, verified);
  if (qa) return qa;
  const final = finalPolicy(sender, recipientSet, readiness, verified, allPackIds);
  if (final) return final;
  assertNoUnsupportedClaim(sender, recipientSet, readiness, verified);
  return ordinaryPolicy(readiness);
}

export function finalEvidenceEffect({ changedPaths, boundIdentitiesEqual }) {
  const behaviorBearing = (changedPaths ?? []).some((changedPath) =>
    !changedPath.startsWith("docs/") && !(changedPath.endsWith(".md") && !changedPath.includes("/")));
  return behaviorBearing || !boundIdentitiesEqual
    ? { eligible:false, action:"settle-and-rerun-all-runnable-packs" }
    : { eligible:true, action:"promote-or-integrate" };
}

export function deliveryScorecard({ approvedAt, integratedAt, handoffs = [], receipts = [],
  historicalSuccessfulFullRuns = 0 }) {
  const finalReceipts = receipts.filter(({ kind }) => kind === "final-ready");
  const successfulFullRuns = finalReceipts.filter(({ status }) => status === "passed").length;
  return {
    approvalToIntegrationMs:Date.parse(integratedAt) - Date.parse(approvedAt),
    roleIntervals:Object.fromEntries(handoffs.map(({ role, startedAt, completedAt }) =>
      [role, Date.parse(completedAt) - Date.parse(startedAt)])),
    focusedVerificationMs:receipts.filter(({ kind }) => kind === "review-ready")
      .reduce((total, { durationMs = 0 }) => total + durationMs, 0),
    finalGateMs:finalReceipts.reduce((total, { durationMs = 0 }) => total + durationMs, 0),
    successfulFullRuns,
    invalidatedFullRuns:finalReceipts.filter(({ status, invalidated }) => status === "passed" && invalidated).length,
    failures:receipts.filter(({ status }) => status === "failed").length,
    repairs:receipts.filter(({ repaired }) => repaired).length,
    reruns:receipts.filter(({ rerun }) => rerun).length,
    terminalEvidencePreserved:finalReceipts.some(({ status, terminalLeavesPreserved }) =>
      status === "passed" && terminalLeavesPreserved),
    modeledAvoidedSuccessfulFullRuns:Math.max(0, historicalSuccessfulFullRuns - 1),
  };
}
