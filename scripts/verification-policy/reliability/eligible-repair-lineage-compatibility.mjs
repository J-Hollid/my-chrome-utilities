import { execFile } from "node:child_process";

import { verificationTaskIdentity } from "../../verification-packs.mjs";
import { receiptDocument } from "../../verification-reliability-receipts.mjs";
import { normalized, timeoutIncidentDigest } from "../../verification-reliability-values.mjs";
import {
  resolveIncidentTaskSuccession,
  verificationTaskDigest,
} from "../../verification-task-succession.mjs";

const digestPattern = /^[a-f0-9]{64}$/u;
const packageTaskKey = "package:extension";

function same(left, right) {
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

function gitAncestor(root, ancestor, descendant) {
  return new Promise((resolve) => execFile("git",
    ["merge-base", "--is-ancestor", ancestor, descendant], { cwd:root },
    (error) => resolve(error === null)));
}

export function eligibleRepairCandidateMatches(incident, candidate) {
  let current = incident?.repair?.candidate;
  if (!current) return false;
  for (const transition of incident.lineageTransitions ?? []) {
    if (transition.kind === "rebase" && transition.fromCommit === current.commit) {
      current = { commit:transition.toCommit, tree:transition.toTree };
    }
  }
  return current.commit === candidate?.commit && current.tree === candidate?.tree;
}

async function loadAuthenticatedReceipt(root, incident, descriptor, sourceTask, loadReceipt) {
  const document = await loadReceipt(root, descriptor.receiptPath);
  const receipt = document?.receipt;
  const result = receipt?.tasks?.[sourceTask.key];
  if (document?.sha256 !== descriptor.receiptSha256 ||
      receipt?.completedAt === undefined || receipt?.runIntent !== "repair-focused" ||
      receipt?.candidate?.commit !== incident.repair.candidate.commit ||
      receipt?.candidate?.tree !== incident.repair.candidate.tree ||
      receipt?.candidate?.baseCommit !== incident.repair.checkpoint.baseCommit ||
      receipt?.candidate?.evidenceTask !== incident.repair.checkpoint.evidenceTask ||
      receipt?.plan?.mode !== "timeout-repair-focused" ||
      receipt?.plan?.incidentId !== incident.id ||
      receipt?.plan?.causalCategory !== incident.repair.causalCategory ||
      receipt?.plan?.causalExplanation !== incident.repair.causalExplanation ||
      !same(receipt?.plan?.taskPlan, incident.repair.focusedTaskPlan) ||
      Object.values(receipt?.tasks ?? {}).some((task) =>
        task?.status !== "passed" || task?.provenance !== "fresh") ||
      result?.status !== "passed" || result?.provenance !== "fresh" ||
      verificationTaskDigest(result?.identity) !== verificationTaskDigest(sourceTask)) {
    throw new Error(`Eligible repair admission ${incident.id} ancestor receipt identity changed`);
  }
  return document;
}

function sourceCausalTask(incident) {
  const matches = (incident.repair?.focusedTaskPlan ?? []).filter(({ identity, roles = [] }) =>
    identity?.key === incident.repair.regression?.key &&
    (roles.includes("causal-regression") || roles.includes("diagnosed-boundary")));
  if (matches.length !== 1) {
    throw new Error(`Eligible repair admission ${incident.id} lacks one original causal task`);
  }
  return verificationTaskIdentity(matches[0].identity);
}

function compatiblePackageTask(selectedIdentities) {
  const matches = selectedIdentities.filter(({ key }) => key === packageTaskKey);
  if (matches.length !== 1 || matches[0].stage !== "package" ||
      matches[0].executable !== "node" || !same(matches[0].args, ["scripts/package.mjs"])) {
    throw new Error(`Ancestor eligible repair admission requires exact ${packageTaskKey}`);
  }
  return matches[0];
}

export async function authenticateAncestorEligibleRepair({
  incident, plan, packs, candidate, root = process.cwd(),
  isAncestor = (ancestor, descendant) => gitAncestor(root, ancestor, descendant),
  loadReceipt = (repositoryRoot, receiptPath) => receiptDocument(repositoryRoot, receiptPath),
  resolveSuccession = resolveIncidentTaskSuccession, canonicalIdentities,
}) {
  const repairCandidate = incident?.repair?.candidate;
  if (!repairCandidate?.commit || !repairCandidate.tree ||
      repairCandidate.commit === candidate?.commit ||
      !await isAncestor(repairCandidate.commit, candidate?.commit)) {
    throw new Error(`Eligible repair admission ${incident?.id ?? "unknown"} does not match the exact candidate and its repair candidate is not an ancestor`);
  }
  const selectedIdentities = plan.tasks.map(verificationTaskIdentity);
  const selectedByDigest = new Map(selectedIdentities.map((identity) =>
    [verificationTaskDigest(identity), identity]));
  const packageTask = compatiblePackageTask(selectedIdentities);
  const sourceTask = sourceCausalTask(incident);
  const sourceTaskDigest = verificationTaskDigest(sourceTask);
  const receiptCache = new Map();
  const authenticatedReceipt = async(descriptor) => {
    if (!receiptCache.has(descriptor.receiptPath)) {
      receiptCache.set(descriptor.receiptPath,
        loadAuthenticatedReceipt(root, incident, descriptor, sourceTask, loadReceipt));
    }
    return receiptCache.get(descriptor.receiptPath);
  };
  await Promise.all([
    authenticatedReceipt(incident.repair.regression),
    authenticatedReceipt(incident.repair.focusedReceipt),
  ]);

  let selected = selectedByDigest.get(sourceTaskDigest);
  let coverageKind = "regression";
  let succession;
  if (!selected) {
    const catalogue = canonicalIdentities ?? selectedIdentities;
    try {
      succession = await resolveSuccession({ incident, currentIdentities:catalogue,
        currentPacks:packs });
      selected = selectedByDigest.get(succession.destinationTaskDigest);
    } catch {
      // The stable boundary error below covers missing or invalid succession.
    }
    coverageKind = "successor";
  }
  if (!selected) {
    throw new Error(`Eligible repair admission ${incident.id} ancestor causal task is not conserved`);
  }

  const identity = {
    version:1, kind:"ancestor-eligible-repair",
    repairCandidateCommit:repairCandidate.commit, repairCandidateTree:repairCandidate.tree,
    currentCandidateCommit:candidate.commit, currentCandidateTree:candidate.tree,
    ancestry:"git-merge-base-is-ancestor",
    regressionReceiptSha256:incident.repair.regression.receiptSha256,
    focusedReceiptSha256:incident.repair.focusedReceipt.receiptSha256,
    repairDigest:timeoutIncidentDigest(incident.repair), sourceTaskDigest,
    selectedTaskDigest:verificationTaskDigest(selected),
    packageTaskDigest:verificationTaskDigest(packageTask), coverageKind,
    ...(succession ? { destinationTaskDigest:succession.destinationTaskDigest,
      conservationDigest:succession.conservationDigest } : {}),
  };
  return { selected, coverageKind, succession,
    compatibility:{ ...identity, digest:timeoutIncidentDigest(identity) } };
}

export function validateAncestorRepairCompatibility(compatibility, entry, candidate) {
  const successor = compatibility?.coverageKind === "successor";
  const keys = ["version", "kind", "repairCandidateCommit", "repairCandidateTree",
    "currentCandidateCommit", "currentCandidateTree", "ancestry",
    "regressionReceiptSha256", "focusedReceiptSha256", "repairDigest",
    "sourceTaskDigest", "selectedTaskDigest", "packageTaskDigest", "coverageKind",
    ...(successor ? ["destinationTaskDigest", "conservationDigest"] : []), "digest"];
  const unsigned = { ...compatibility }; delete unsigned.digest;
  return compatibility?.version === 1 && compatibility.kind === "ancestor-eligible-repair" &&
    JSON.stringify(Object.keys(compatibility).sort()) === JSON.stringify(keys.sort()) &&
    compatibility.ancestry === "git-merge-base-is-ancestor" &&
    [compatibility.regressionReceiptSha256, compatibility.focusedReceiptSha256,
      compatibility.repairDigest, compatibility.sourceTaskDigest,
      compatibility.selectedTaskDigest, compatibility.packageTaskDigest,
      compatibility.digest].every((value) => digestPattern.test(value ?? "")) &&
    compatibility.currentCandidateCommit === candidate?.commit &&
    compatibility.currentCandidateTree === candidate?.tree &&
    compatibility.repairDigest === entry?.repairDigest &&
    compatibility.selectedTaskDigest === entry?.selectedTaskDigest &&
    compatibility.coverageKind === entry?.coverageKind &&
    (!successor || compatibility.destinationTaskDigest === entry?.destinationTaskDigest &&
      compatibility.conservationDigest === entry?.conservationDigest &&
      digestPattern.test(compatibility.conservationDigest ?? "")) &&
    compatibility.digest === timeoutIncidentDigest(unsigned);
}
