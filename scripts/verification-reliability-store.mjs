import { randomUUID } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";

import { diagnosticRetryScope, retryIdentity } from "./verification-reliability-progress.mjs";
import {
  archiveBytes, archivedReceiptDocument, archiveNames, atomicReplace, defaultStoreDirectory,
  ensureSafeDirectory, incidentEnvelope, safeStoreFile, transition, validateArchiveNames,
  validateEnvelope, validateIncident, withIncidentLock, writeExclusive,
} from "./verification-reliability-persistence.mjs";
import {
  defaultCanonicalCheckpointValidator, defaultCanonicalRepairTaskIdentities, freshPassingReceipt,
  receiptDocument, validatePackageReceipt,
} from "./verification-reliability-receipts.mjs";
import {
  timeoutResolutionEvidence, validateRepairReceiptSemantics, validateTimeoutRepairProposal,
  timeoutRepairCandidate,
} from "./verification-reliability-repair.mjs";
import {
  exactObject, git, normalized, repositoryRoot, retryClassifications, shaPattern,
  stableIncidentId, timeoutIncidentDigest,
} from "./verification-reliability-values.mjs";

function createStoreAccess({ root, storeDirectory }) {
  const directory = async({ create = true } = {}) => ensureSafeDirectory(
    storeDirectory ?? await defaultStoreDirectory(root), { create },
  );
  const read = async(id) => {
    stableIncidentId(id);
    const store = await directory({ create:false });
    if (!store) throw new Error(`Unknown reliability incident ${id}`);
    let envelope;
    try { envelope = JSON.parse(await safeStoreFile(path.join(store, `${id}.json`))); }
    catch (error) { throw new Error(`Cannot read reliability incident ${id}: ${error.message}`); }
    return validateEnvelope(envelope, id);
  };
  const update = async(id, operation) => {
    const store = await directory();
    return withIncidentLock(store, stableIncidentId(id), async() => {
      const current = await read(id);
      const next = validateIncident(await operation(structuredClone(current)));
      if (next.id !== id || next.failureDigest !== current.failureDigest) {
        throw new Error(`Reliability incident ${id} immutable failure record changed`);
      }
      await atomicReplace(path.join(store, `${id}.json`), incidentEnvelope(next));
      return next;
    });
  };
  return { directory, read, update };
}

function diagnosticOperations({ root, now, read, update }) {
  return {
    claimDiagnosticRetry(id, identity) {
      return update(id, (incident) => {
        if (incident.state !== "unresolved") throw new Error(`Reliability incident ${id} is resolved`);
        if (incident.retry) throw new Error(`Reliability incident ${id} diagnostic retry was already used`);
        if (!incident.failure.retryScope || identity !== incident.failure.retryIdentity) {
          throw new Error(`Reliability incident ${id} diagnostic retry identity changed`);
        }
        const at = now();
        return transition({ ...incident, retry:{ status:"claimed", identity, claimedAt:at } },
          "diagnostic-retry-claimed", at);
      });
    },
    async classifyDiagnosticRetry(id, receiptPath) {
      const document = await receiptDocument(root, receiptPath);
      return update(id, (incident) => {
        if (incident.retry?.status !== "claimed") throw new Error(`Reliability incident ${id} retry is not claimable`);
        const task = Object.values(document.receipt.tasks)[0];
        const identityChanged = document.receipt.diagnostic?.incidentId !== id ||
          document.receipt.diagnostic?.retryIdentity !== incident.failure.retryIdentity ||
          JSON.stringify(normalized(document.receipt.diagnostic?.resolvedDeadlines)) !==
            JSON.stringify(normalized(incident.failure.resolvedDeadlines)) ||
          JSON.stringify(normalized(document.receipt.diagnostic?.scope)) !==
            JSON.stringify(normalized(incident.failure.retryScope)) ||
          document.receipt.candidate.commit !== incident.failure.lineage.commit ||
          document.receipt.candidate.tree !== incident.failure.lineage.tree ||
          JSON.stringify(normalized(document.receipt.environment)) !==
            JSON.stringify(normalized(incident.failure.environment)) ||
          JSON.stringify(normalized(document.receipt.artifact)) !==
            JSON.stringify(normalized(incident.failure.artifact)) ||
          Object.keys(document.receipt.tasks).length !== 1 ||
          JSON.stringify(normalized(task?.identity)) !== JSON.stringify(normalized(incident.failure.task));
        const outcome = identityChanged ? "identityChanged"
          : task.status === "passed" ? "passed"
            : task.reliabilityFailureFingerprint === incident.failure.fingerprint
              ? "sameFailure" : "failed";
        const classification = retryClassifications[outcome];
        const at = now();
        return transition({ ...incident, retry:{ ...incident.retry, status:"classified", outcome,
          classification, receiptPath:document.path, receiptSha256:document.sha256, classifiedAt:at } },
        "diagnostic-retry-classified", at, { classification });
      });
    },
  };
}

function repairOperations({ root, now, read, update, directory, isAncestor, currentCandidate,
  changedPaths, canonicalCheckpointValidator, canonicalRepairTaskIdentities }) {
  return {
    async proposeRepair(id, { causalCategory, causalExplanation, regressionKey, regressionReceiptPath,
      focusedReceiptPath } = {}) {
      const current = await read(id);
      if (current.retry?.status === "claimed") {
        throw new Error(`Reliability incident ${id} has an incomplete diagnostic retry`);
      }
      if (current.retry && current.retry.status !== "classified") {
        throw new Error(`Reliability incident ${id} has invalid diagnostic state`);
      }
      const candidate = await currentCandidate();
      const [regressionDocument, focusedDocument, paths] = await Promise.all([
        receiptDocument(root, regressionReceiptPath), receiptDocument(root, focusedReceiptPath),
        changedPaths(current.failure.lineage.commit),
      ]);
      const regressionTasks = freshPassingReceipt(regressionDocument, candidate,
        "Deterministic regression");
      freshPassingReceipt(focusedDocument, candidate, "Fresh focused verification");
      if (!regressionTasks.some(([key]) => key === regressionKey)) {
        throw new Error("Reliability repair requires the named deterministic regression task");
      }
      const proposal = {
        candidate, changedPaths:paths, causalCategory, causalExplanation,
        checkpoint:{ baseCommit:focusedDocument.receipt.candidate.baseCommit,
          evidenceTask:focusedDocument.receipt.candidate.evidenceTask },
        regression:{ key:regressionKey, status:"passed", commit:candidate.commit,
          receiptPath:regressionDocument.path, receiptSha256:regressionDocument.sha256 },
        focusedReceipt:{ status:"passed", commit:candidate.commit, provenance:"fresh",
          receiptPath:focusedDocument.path, receiptSha256:focusedDocument.sha256 },
      };
      const semanticProposal = await validateRepairReceiptSemantics(current, proposal,
        regressionDocument, focusedDocument, canonicalRepairTaskIdentities);
      const eligible = await validateTimeoutRepairProposal(current, semanticProposal, { isAncestor });
      return update(id, (incident) => {
        const at = now();
        return transition({ ...incident,
          retry:incident.retry ?? { status:"invalidated-by-repair", classification:"not-retried-repaired",
            invalidatedAt:at }, repair:eligible },
        "repair-proposed", at, { commit:eligible.candidate.commit });
      });
    },
    claimRepairCheckpoint(id, runId) {
      return update(id, (incident) => {
        if (incident.state !== "unresolved" || incident.repair?.status !== "eligible") {
          throw new Error(`Reliability incident ${id} has no eligible repair`);
        }
        const at = now();
        if (incident.repairCheckpoint) {
          const candidate = timeoutRepairCandidate(incident);
          const reclaimCount = Number(incident.repairCheckpoint.reclaimCount ?? 0);
          const repairRebases = (incident.lineageTransitions ?? []).filter(({kind, fromCommit}) =>
            kind === "rebase" && (fromCommit === incident.repair.candidate.commit ||
              (incident.lineageTransitions ?? []).some(({toCommit}) => toCommit === fromCommit))).length;
          if (candidate.commit === incident.repair.candidate.commit || reclaimCount >= repairRebases) {
            throw new Error(`Reliability incident ${id} repair checkpoint was already used`);
          }
          return transition({ ...incident, repairCheckpoint:{ status:"claimed", runId, claimedAt:at,
            reclaimCount:reclaimCount + 1 } }, "repair-checkpoint-reclaimed", at, { runId });
        }
        return transition({ ...incident, repairCheckpoint:{ status:"claimed", runId, claimedAt:at } },
          "repair-checkpoint-claimed", at, { runId });
      });
    },
    async resolve(id, { checkpointReceiptPath, packageReceiptPath } = {}) {
      const incidentBeforeResolution = await read(id);
      const resolvedPackagePath = path.resolve(root, "build", "package", "my-chrome-utilities.zip");
      const [checkpointDocument, packageDocument, packageDetails] = await Promise.all([
        receiptDocument(root, checkpointReceiptPath), receiptDocument(root, packageReceiptPath),
        lstat(resolvedPackagePath),
      ]);
      if (!packageDetails.isFile() || packageDetails.isSymbolicLink() ||
          await realpath(resolvedPackagePath) !== resolvedPackagePath) {
        throw new Error("Package result must be a canonical regular file");
      }
      const canonicalCheckpoint = await canonicalCheckpointValidator({
        document:checkpointDocument, incident:incidentBeforeResolution, root,
      });
      validatePackageReceipt(packageDocument, checkpointDocument, incidentBeforeResolution);
      const packageBytes = await readFile(resolvedPackagePath);
      const store = await directory();
      const archive = archiveNames(id);
      await Promise.all([
        archiveBytes(path.join(store, archive.checkpointReceipt), checkpointDocument.bytes),
        archiveBytes(path.join(store, archive.packageReceipt), packageDocument.bytes),
        archiveBytes(path.join(store, archive.packageZip), packageBytes),
      ]);
      return update(id, (incident) => {
        if (incident.state !== "unresolved" || incident.repair?.status !== "eligible") {
          throw new Error(`Reliability incident ${id} has no eligible repair`);
        }
        const checkpoint = checkpointDocument.receipt;
        if (incident.repairCheckpoint?.status !== "claimed" ||
            incident.repairCheckpoint.runId !== checkpoint.runId ||
            canonicalCheckpoint.receipt.runId !== checkpoint.runId) {
          throw new Error(`Reliability incident ${id} resolution requires one canonical all-20 checkpoint and package`);
        }
        const checkpointResult = { status:"passed", commit:checkpoint.candidate.commit,
          tree:checkpoint.candidate.tree, reusedTaskCount:0,
          packIds:[...checkpoint.plan.requestedPackIds].sort(), runId:checkpoint.runId,
          receiptPath:checkpointDocument.path, receiptSha256:checkpointDocument.sha256 };
        const packageResult = { status:"passed", path:path.relative(root, resolvedPackagePath),
          receiptPath:packageDocument.path, receiptSha256:packageDocument.sha256,
          digest:timeoutIncidentDigest(packageBytes) };
        const at = now();
        const resolutionWithoutDigest = { checkpoint:checkpointResult,
          package:packageResult, archive, resolvedAt:at };
        const resolution = { ...resolutionWithoutDigest, digest:timeoutIncidentDigest(resolutionWithoutDigest) };
        return transition({ ...incident, state:"resolved", resolution }, "resolved", at,
          { resolutionDigest:resolution.digest });
      });
    },
  };
}

async function commitDescendsFrom({ root, isAncestor, ancestor, commit }) {
  if (ancestor === commit) return true;
  if (!ancestor || !commit) return false;
  if (isAncestor) return isAncestor(ancestor, commit);
  try { await git(root, "merge-base", "--is-ancestor", ancestor, commit); return true; }
  catch { return false; }
}

function activeLineageAnchors(incident) {
  const active = new Set([incident.failure?.lineage?.commit]);
  for (const mapping of incident.lineageTransitions ?? []) {
    active.delete(mapping.fromCommit);
    if (mapping.kind === "rebase") active.add(mapping.toCommit);
  }
  return active;
}

function transitionLineageAnchors(incident) {
  const active = activeLineageAnchors(incident);
  if (incident.repair?.candidate?.commit) active.add(incident.repair.candidate.commit);
  for (const mapping of incident.lineageTransitions ?? []) {
    if (mapping.kind === "rebase" && active.has(mapping.fromCommit)) {
      active.delete(mapping.fromCommit);
      active.add(mapping.toCommit);
    }
  }
  return active;
}

function recordedLineageTree(incident, commit) {
  if (incident.failure?.lineage?.commit === commit) return incident.failure.lineage.tree;
  if (incident.repair?.candidate?.commit === commit) return incident.repair.candidate.tree;
  return (incident.lineageTransitions ?? []).find(
    ({ kind, toCommit }) => kind === "rebase" && toCommit === commit)?.toTree;
}

async function lineageApplies({ root, isAncestor, incident, commit, resolution = false }) {
  const anchors = resolution
    ? [timeoutRepairCandidate(incident)?.commit]
    : [...activeLineageAnchors(incident)];
  for (const ancestor of anchors) {
    if (await commitDescendsFrom({ root, isAncestor, ancestor, commit })) return true;
  }
  return false;
}

export function createTimeoutIncidentStore({
  storeDirectory, root = repositoryRoot, now = () => new Date().toISOString(),
  randomId = () => randomUUID(), isAncestor,
  resolveCandidate = async(revision) => {
    const [commit, tree] = await Promise.all([
      git(root, "rev-parse", `${revision}^{commit}`),
      git(root, "rev-parse", `${revision}^{tree}`),
    ]);
    return { commit, tree };
  },
  currentCandidate = async() => ({
    commit:await git(root, "rev-parse", "HEAD^{commit}"),
    tree:await git(root, "rev-parse", "HEAD^{tree}"),
  }),
  changedPaths = async(failedCommit) => (await git(root, "diff", "--name-only", `${failedCommit}..HEAD`))
    .split(/\r?\n/u).filter(Boolean),
  canonicalCheckpointValidator = defaultCanonicalCheckpointValidator,
  canonicalRepairTaskIdentities = defaultCanonicalRepairTaskIdentities,
} = {}) {
  const access = createStoreAccess({ root, storeDirectory });
  const store = {
    read:access.read,
    async list() {
      const directory = await access.directory({ create:false });
      if (!directory) return [];
      const names = await readdir(directory);
      const unexpected = names.filter((name) => !name.endsWith(".lock") &&
        !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:checkpoint-receipt|package-receipt|package-zip)$/u.test(name) &&
        !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.json$/u.test(name));
      if (unexpected.length) throw new Error(`Malformed reliability incident store entry: ${unexpected[0]}`);
      const ids = names.filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -5));
      if (new Set(ids).size !== ids.length) throw new Error("Duplicate reliability incident ids");
      return Promise.all(ids.sort().map(access.read));
    },
    async create(failure) {
      exactObject(failure, "Reliability failure");
      if (typeof failure.failureClass !== "string" || !failure.failureClass ||
          !shaPattern.test(failure.fingerprint ?? "")) {
        throw new Error("Reliability failure requires a class and normalized fingerprint");
      }
      const id = stableIncidentId(randomId());
      const scoped = failure.failureClass.endsWith("contract-failure") ? undefined : (() => {
        try { return diagnosticRetryScope({ task:failure.task,
          lastProgress:failure.failedBoundary ?? failure.lastProgress }); }
        catch { return undefined; }
      })();
      const immutableFailure = structuredClone({ ...failure,
        retryScope:scoped, retryIdentity:scoped ? retryIdentity(failure) : timeoutIncidentDigest({
          lineage:failure.lineage, task:failure.task, progressContract:"untrusted",
        }),
      });
      const incident = validateIncident({
        version:1, id, createdAt:now(), state:"unresolved", failure:immutableFailure,
        lineageTransitions:[],
        failureDigest:timeoutIncidentDigest(immutableFailure), transitions:[],
      });
      const directory = await access.directory();
      try { await writeExclusive(path.join(directory, `${id}.json`), incidentEnvelope(incident)); }
      catch (error) {
        if (error.code === "EEXIST") throw new Error(`Duplicate reliability incident id ${id}`);
        throw error;
      }
      return incident;
    },
    async blocking({ commit }) {
      const applicable = [];
      for (const incident of await this.list()) {
        if (await lineageApplies({ root, isAncestor, incident, commit }) &&
            incident.state !== "resolved") applicable.push(incident);
      }
      return applicable;
    },
    async resolutions({ commit }) {
      const records = [];
      for (const incident of await this.list()) {
        if (incident.state !== "resolved" || !await lineageApplies({ root, isAncestor,
          incident, commit, resolution:true })) continue;
        const directory = await access.directory({ create:false });
        validateArchiveNames(incident.id, incident.resolution.archive);
        const checkpointDocument = await archivedReceiptDocument(
          path.join(directory, incident.resolution.archive.checkpointReceipt));
        const packageDocument = await archivedReceiptDocument(
          path.join(directory, incident.resolution.archive.packageReceipt));
        const packageBytes = await safeStoreFile(path.join(directory, incident.resolution.archive.packageZip));
        const canonical = await canonicalCheckpointValidator({
          document:checkpointDocument, incident, root, allowLegacySeparatePackage:true,
        });
        validatePackageReceipt(packageDocument, checkpointDocument, incident, {
          allowLegacyPrerequisites:true,
        });
        if (canonical.receipt.runId !== incident.resolution.checkpoint.runId ||
            checkpointDocument.sha256 !== incident.resolution.checkpoint.receiptSha256 ||
            packageDocument.sha256 !== incident.resolution.package.receiptSha256 ||
            timeoutIncidentDigest(packageBytes) !== incident.resolution.package.digest) {
          throw new Error(`Reliability incident ${incident.id} archived resolution evidence does not match`);
        }
        records.push(timeoutResolutionEvidence(incident));
      }
      return records;
    },
    recordLineageTransition(id, mapping) {
      exactObject(mapping, "Reliability lineage transition");
      return access.update(id, async(incident) => {
        if (incident.state !== "unresolved") throw new Error(`Reliability incident ${id} is resolved`);
        const transitions = incident.lineageTransitions ?? [];
        const anchors = transitionLineageAnchors(incident);
        if (typeof mapping.fromCommit !== "string" || !anchors.has(mapping.fromCommit)) {
          throw new Error(`Reliability incident ${id} lineage transition has an unknown source`);
        }
        const at = now();
        let durable;
        if (mapping.kind === "rebase") {
          if (typeof mapping.toCommit !== "string" || !mapping.toCommit ||
              typeof mapping.toTree !== "string" || !mapping.toTree ||
              mapping.toCommit === mapping.fromCommit || anchors.has(mapping.toCommit)) {
            throw new Error(`Reliability incident ${id} rebase transition requires a distinct candidate and tree`);
          }
          let source;
          let replacement;
          try {
            [source, replacement] = await Promise.all([
              resolveCandidate(mapping.fromCommit), resolveCandidate(mapping.toCommit),
            ]);
          } catch (error) {
            throw new Error(`Reliability incident ${id} rebase identity cannot be resolved by Git: ${error.message}`);
          }
          const sourceTree = recordedLineageTree(incident, mapping.fromCommit);
          if (source?.commit !== mapping.fromCommit || source?.tree !== sourceTree ||
              replacement?.commit !== mapping.toCommit || replacement?.tree !== mapping.toTree) {
            throw new Error(`Reliability incident ${id} rebase commit or tree disagrees with Git identity`);
          }
          const preservesLineage = await commitDescendsFrom({ root, isAncestor,
            ancestor:mapping.fromCommit, commit:mapping.toCommit });
          if (!preservesLineage && source.tree !== replacement.tree) {
            throw new Error(`Reliability incident ${id} rebase replacement is unrelated to the affected lineage or change set`);
          }
          durable = { kind:"rebase", fromCommit:mapping.fromCommit,
            toCommit:mapping.toCommit, toTree:mapping.toTree, at };
        } else if (mapping.kind === "abandon") {
          const decision = mapping.userDecision;
          if (decision?.approvedBy !== "specifier" || decision?.approved !== true ||
              typeof decision.reference !== "string" || !decision.reference.trim()) {
            throw new Error(`Reliability incident ${id} abandonment requires a separate specifier-approved user decision`);
          }
          durable = { kind:"abandon", fromCommit:mapping.fromCommit,
            userDecision:structuredClone(decision), at };
        } else {
          throw new Error(`Reliability incident ${id} has an unsupported lineage transition`);
        }
        return transition({ ...incident, lineageTransitions:[...transitions, durable] },
          durable.kind === "rebase" ? "lineage-rebased" : "lineage-abandoned", at,
          Object.fromEntries(Object.entries(durable).filter(([key]) => !["kind", "at"].includes(key))));
      });
    },
  };
  return Object.assign(store,
    diagnosticOperations({ root, now, read:access.read, update:access.update }),
    repairOperations({ root, now, read:access.read, update:access.update, directory:access.directory,
      isAncestor, currentCandidate, changedPaths, canonicalCheckpointValidator,
      canonicalRepairTaskIdentities }));
}

export async function assertNoBlockingTimeoutIncidents(commit = "HEAD", options = {}) {
  const root = options.root ?? repositoryRoot;
  const canonical = await git(root, "rev-parse", `${commit}^{commit}`);
  const incidents = await createTimeoutIncidentStore({ ...options, root }).blocking({ commit:canonical });
  if (incidents.length) {
    throw new Error(`Unresolved reliability incident(s) block verification evidence and Git handoff: ${
      incidents.map(({ id }) => id).join(", ")}. Complete a causal repair and fresh checkpoint.`);
  }
  return [];
}
