import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  boundedClosureContractRevision,
  causalFailureIdentity,
  closureDisposition,
} from "./verification-reliability-closure.mjs";
import { createTimeoutIncidentStore } from "./verification-reliability-store.mjs";
import { loadVerificationPacks, planVerification,
  verificationTaskIdentity } from "./verification-packs.mjs";
import { resolveIncidentTaskSuccession } from "./verification-task-succession.mjs";
import { git, normalized, timeoutIncidentDigest,
  timeoutRepairPackIds } from "./verification-reliability-values.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const defaultManifest = path.join(repositoryRoot, "verification", "vtd014-closure-audit.json");

function same(left, right) {
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

async function isAncestor(ancestor, descendant, root) {
  try { await git(root, "merge-base", "--is-ancestor", ancestor, descendant); return true; }
  catch { return false; }
}

async function passingRegression(receiptPath, root) {
  const resolved = path.resolve(root, receiptPath);
  const bytes = await readFile(resolved);
  const receipt = JSON.parse(bytes);
  if (receipt?.version !== 2 || !receipt.candidate?.commit ||
      !receipt.tasks || Object.values(receipt.tasks).some((task) =>
        task.status !== "passed" || task.provenance !== "fresh")) {
    throw new Error("Closure audit requires one fresh passing focused receipt");
  }
  return { receipt, path:resolved, sha256:timeoutIncidentDigest(bytes) };
}

export async function auditVtd014Closure({
  manifestPath = defaultManifest,
  regressionReceiptPath,
  candidate = "HEAD",
  root = repositoryRoot,
  store = createTimeoutIncidentStore({ root }),
} = {}) {
  if (!regressionReceiptPath) throw new Error("Closure audit requires --regression-receipt");
  const [manifest, regression, candidateCommit, candidateTree] = await Promise.all([
    readFile(manifestPath, "utf8").then(JSON.parse),
    passingRegression(regressionReceiptPath, root),
    git(root, "rev-parse", `${candidate}^{commit}`),
    git(root, "rev-parse", `${candidate}^{tree}`),
  ]);
  if (manifest.version !== 1 || manifest.contractRevision !== boundedClosureContractRevision ||
      manifest.approvedAssessedCount !== 17 || manifest.repositoryCommonOpenCount < 17 ||
      typeof manifest.additionalOpenRecordReason !== "string" ||
      !manifest.additionalOpenRecordReason.trim()) {
    throw new Error("VTD-014 closure audit manifest does not match the frozen contract");
  }
  if (regression.receipt.candidate.commit !== candidateCommit) {
    throw new Error("Closure audit regression does not belong to the selected candidate");
  }
  if (!await isAncestor(manifest.assessmentCandidate, candidateCommit, root)) {
    throw new Error("Closure audit candidate does not descend from the approved assessment candidate");
  }
  const incidents = (await store.list()).filter(({ state }) => state === "unresolved");
  const manifestIds = Object.keys(manifest.records).sort();
  const incidentIds = incidents.map(({ id }) => id).sort();
  if (!same(manifestIds, incidentIds) || incidentIds.length !== manifest.repositoryCommonOpenCount) {
    throw new Error("Closure audit manifest does not exactly cover repository-common open records");
  }
  const selectedLineage = { commit:candidateCommit, tree:candidateTree,
    assessmentCandidate:manifest.assessmentCandidate };
  const packs = await loadVerificationPacks();
  const currentIdentities = planVerification(packs, {
    packIds:timeoutRepairPackIds, includeProperties:true,
  }).tasks.map(verificationTaskIdentity);
  const results = [];
  for (const incident of incidents) {
    const declaration = manifest.records[incident.id];
    const ancestor = await isAncestor(incident.failure.lineage.commit, candidateCommit, root);
    let disposition;
    if (declaration.disposition === "lineage-retired") {
      if (ancestor) throw new Error(`Incident ${incident.id} is not off the selected assessment lineage`);
      disposition = closureDisposition({ lineageCondition:"off-lineage",
        selectedLineage:{ commit:candidateCommit, tree:candidateTree }, reason:declaration.reason });
    } else {
      if (!ancestor) throw new Error(`Incident ${incident.id} cannot be carried from an unrelated lineage`);
      if (declaration.domain !== "verification-execution") {
        if (declaration.disposition !== "blocking-product-repair" ||
            declaration.domain !== "product-runtime") {
          throw new Error(`Incident ${incident.id} lacks a declared failure domain`);
        }
      }
      if (declaration.disposition === "blocking-product-repair") {
        disposition = { ...closureDisposition({ lineageCondition:"ancestor-product-runtime" }),
          failureDomain:declaration.domain };
      } else if (declaration.disposition === "blocking-verification-repair") {
        disposition = { kind:"blocking-verification-repair", blocking:true, resolved:false,
          failureDomain:declaration.domain };
      } else if (declaration.disposition === "verifier-cause-superseded") {
        let receiptTask = regression.receipt.tasks[incident.failure.task.key];
        let receiptTaskKey = incident.failure.task.key;
        if (!receiptTask) {
          const succession = await resolveIncidentTaskSuccession({ incident,
            currentIdentities, currentPacks:packs });
          receiptTaskKey = succession.destinationIdentity.key;
          receiptTask = regression.receipt.tasks[receiptTaskKey];
        }
        if (receiptTask?.status !== "passed" || receiptTask.provenance !== "fresh") {
          throw new Error(`Regression receipt lacks fresh influenced task ${receiptTaskKey}`);
        }
        const causal = causalFailureIdentity({ domain:declaration.domain,
          task:incident.failure.task, executableBoundary:incident.failure.task.target,
          caseId:declaration.caseId, assertionSite:declaration.assertionSite,
          diagnostic:declaration.diagnosticShape });
        disposition = { ...closureDisposition({ lineageCondition:"grouped-verifier-cause",
          causalKey:causal.key, regressionReceiptSha256:regression.sha256 }),
          failureDomain:declaration.domain, causalIdentity:causal,
          regression:{ receiptPath:path.relative(root, regression.path),
            receiptSha256:regression.sha256, taskKey:receiptTaskKey,
            resultDigest:timeoutIncidentDigest(receiptTask) } };
      } else {
        throw new Error(`Incident ${incident.id} has an unsupported audit disposition`);
      }
    }
    if (incident.closureAudit) {
      if (!same(incident.closureAudit, disposition)) {
        throw new Error(`Incident ${incident.id} closure audit differs from the frozen manifest`);
      }
      results.push(incident);
    } else {
      results.push(await store.recordClosureDisposition(incident.id, disposition));
    }
  }
  return { contractRevision:boundedClosureContractRevision, selectedLineage,
    audited:results.length,
    retired:results.filter(({ closureAudit }) => closureAudit.kind === "lineage-retired").length,
    superseded:results.filter(({ closureAudit }) =>
      closureAudit.kind === "verifier-cause-superseded").length,
    blocking:results.filter(({ closureAudit }) => closureAudit.blocking).map(({ id }) => id).sort() };
}

async function runCli(arguments_) {
  let regressionReceiptPath;
  let manifestPath = defaultManifest;
  let candidate = "HEAD";
  for (let index = 0; index < arguments_.length; index += 1) {
    if (arguments_[index] === "--regression-receipt") regressionReceiptPath = arguments_[++index];
    else if (arguments_[index] === "--manifest") manifestPath = path.resolve(arguments_[++index]);
    else if (arguments_[index] === "--candidate") candidate = arguments_[++index];
    else throw new Error(`Unknown closure audit option: ${arguments_[index]}`);
  }
  console.log(JSON.stringify(await auditVtd014Closure({
    manifestPath, regressionReceiptPath, candidate,
  }), null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
