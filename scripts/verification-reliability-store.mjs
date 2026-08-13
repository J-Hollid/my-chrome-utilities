import { randomUUID } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";

import { diagnosticRetryScope, retryIdentity } from "./verification-reliability-progress.mjs";
import {
  archiveBytes, archivedReceiptDocument, archiveNames, atomicReplace, defaultLegacyStoreDirectory,
  defaultStoreDirectory,
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
import { terminalVerificationDeferredConservation } from "./verification-reliability-deferred.mjs";
import { classifyLegacyIncidentRunIntent } from "./verification-run-intent.mjs";
import {
  exactObject, git, normalized, repositoryRoot, retryClassifications, shaPattern,
  stableIncidentId, timeoutIncidentDigest,
} from "./verification-reliability-values.mjs";

function createStoreAccess({ root, storeDirectory, legacyStoreDirectories }) {
  const directory = async({ create = true } = {}) => ensureSafeDirectory(
    storeDirectory ?? await defaultStoreDirectory(root), { create },
  );
  const legacyDirectories = async() => Promise.all((legacyStoreDirectories ??
    (storeDirectory === undefined ? [await defaultLegacyStoreDirectory(root)] : []))
    .map((entry) => ensureSafeDirectory(entry, { create:false })));
  const readableDirectories = async() => [await directory(), ...(await legacyDirectories()).filter(Boolean)];
  const markerTarget = async(id) => path.join(await directory(), `${id}.legacy-source`);
  const matches = async(id) => {
    const found = [];
    for (const store of await readableDirectories()) {
      try { found.push({ store, bytes:await safeStoreFile(path.join(store, `${id}.json`)) }); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    if (found.length > 1 && found.some(({ bytes }) => !bytes.equals(found[0].bytes))) {
      let marker;
      try { marker = JSON.parse(await safeStoreFile(await markerTarget(id))); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
      const primary = await directory();
      const legacyDigests = found.filter(({ store }) => store !== primary)
        .map(({ bytes }) => timeoutIncidentDigest(bytes)).sort();
      if (marker?.version !== 1 || marker.id !== id ||
          JSON.stringify(marker.legacyDigests) !== JSON.stringify(legacyDigests) ||
          found[0].store !== primary) {
        throw new Error(`Reliability incident ${id} diverges across repository namespaces`);
      }
    }
    return found;
  };
  const read = async(id) => {
    stableIncidentId(id);
    const found = await matches(id);
    if (!found.length) throw new Error(`Unknown reliability incident ${id}`);
    let envelope;
    try { envelope = JSON.parse(found[0].bytes); }
    catch (error) { throw new Error(`Cannot read reliability incident ${id}: ${error.message}`); }
    return validateEnvelope(envelope, id);
  };
  const sourceDirectory = async(id) => (await matches(stableIncidentId(id)))[0]?.store;
  const update = async(id, operation) => {
    const store = await directory();
    return withIncidentLock(store, stableIncidentId(id), async() => {
      const found = await matches(id);
      const current = await read(id);
      const next = validateIncident(await operation(structuredClone(current)));
      if (next.id !== id || next.failureDigest !== current.failureDigest) {
        throw new Error(`Reliability incident ${id} immutable failure record changed`);
      }
      await atomicReplace(path.join(store, `${id}.json`), incidentEnvelope(next));
      const legacyDigests = found.filter(({ store:source }) => source !== store)
        .map(({ bytes }) => timeoutIncidentDigest(bytes)).sort();
      if (legacyDigests.length) {
        await atomicReplace(await markerTarget(id), { version:1, id, legacyDigests });
      }
      return next;
    });
  };
  return { directory, legacyDirectories, readableDirectories, sourceDirectory, read, update };
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
      focusedReceiptPath, allowEligibleRevalidation = false } = {}) {
      const current = await read(id);
      if (current.retry?.status === "claimed") {
        throw new Error(`Reliability incident ${id} has an incomplete diagnostic retry`);
      }
      if (current.repair?.status === "eligible" && !allowEligibleRevalidation) {
        throw new Error(`Reliability incident ${id} already has an eligible repair`);
      }
      if (current.retry && current.retry.status !== "classified" &&
          !(allowEligibleRevalidation && current.repair?.status === "eligible" &&
            current.retry.status === "invalidated-by-repair")) {
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
      const descendant = (ancestor, commit) =>
        commitDescendsFrom({ root, isAncestor, ancestor, commit });
      const eligible = await validateTimeoutRepairProposal(current, semanticProposal,
        { isAncestor:descendant });
      if (current.repair?.status === "eligible") {
        const conserved = current.repair.causalCategory === eligible.causalCategory &&
          current.repair.causalExplanation === eligible.causalExplanation &&
          current.repair.regression?.key === eligible.regression?.key &&
          JSON.stringify(normalized(current.repair.causalProtocol)) ===
            JSON.stringify(normalized(eligible.causalProtocol));
        if (!conserved || !(await descendant(
          current.repair.candidate.commit, eligible.candidate.commit)) ||
            current.repair.candidate.commit === eligible.candidate.commit) {
          throw new Error(`Reliability incident ${id} eligible repair revalidation is not an exact conserved descendant`);
        }
      }
      return update(id, (incident) => {
        const at = now();
        return transition({ ...incident,
          retry:incident.retry ?? { status:"invalidated-by-repair", classification:"not-retried-repaired",
            invalidatedAt:at }, repair:eligible },
        current.repair?.status === "eligible" ? "repair-revalidated" : "repair-proposed", at,
        { commit:eligible.candidate.commit });
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
      if (incidentBeforeResolution.state !== "unresolved" ||
          incidentBeforeResolution.repair?.status !== "eligible") {
        throw new Error(`Reliability incident ${id} has no eligible repair`);
      }
      const checkpoint = checkpointDocument.receipt;
      if (incidentBeforeResolution.repairCheckpoint?.status !== "claimed" ||
          incidentBeforeResolution.repairCheckpoint.runId !== checkpoint.runId ||
          canonicalCheckpoint.receipt.runId !== checkpoint.runId) {
        throw new Error(`Reliability incident ${id} resolution requires one canonical all-20 checkpoint and package`);
      }
      const packageBytes = await readFile(resolvedPackagePath);
      const store = await directory();
      const archive = archiveNames(id);
      const replaceExisting = Number(incidentBeforeResolution.repairCheckpoint.reclaimCount ?? 0) > 0;
      await Promise.all([
        archiveBytes(path.join(store, archive.checkpointReceipt), checkpointDocument.bytes,
          { replaceExisting }),
        archiveBytes(path.join(store, archive.packageReceipt), packageDocument.bytes,
          { replaceExisting }),
        archiveBytes(path.join(store, archive.packageZip), packageBytes, { replaceExisting }),
      ]);
      return update(id, (incident) => {
        if (incident.state !== "unresolved" || incident.repair?.status !== "eligible") {
          throw new Error(`Reliability incident ${id} has no eligible repair`);
        }
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

const specificationPathPrefixes = Object.freeze(["docs/", "features/", "project-briefs/"]);

function approvedSpecificationPath(changedPath) {
  if (changedPath === "README.md") return true;
  return specificationPathPrefixes.some((prefix) => changedPath.startsWith(prefix));
}

function eligibleDeferredIncident(incident) {
  return [
    incident.terminalVerificationDeferred?.status === "terminal-verification-deferred",
    incident.repair?.status === "eligible",
  ].every(Boolean);
}

async function handoffCandidateRelationship({ root, isAncestor, candidateChangedPaths,
  incident, commit, readiness, sender, verified }) {
  const deferredCommit = incident.terminalVerificationDeferred?.candidate?.commit;
  const exact = deferredCommit === commit;
  const descendant = Boolean(deferredCommit) && await commitDescendsFrom({
    root, isAncestor, ancestor:deferredCommit, commit,
  });
  const specificationRoute = [sender === "specifier", verified === "not-required",
    readiness === "legacy", descendant].every(Boolean);
  const specificationOnly = specificationRoute &&
    (await candidateChangedPaths(deferredCommit, commit)).every(approvedSpecificationPath);
  return { exact, descendant, specificationOnly };
}

function permittedHandoffRelationship(readiness, relationship) {
  const routes = new Map([
    ["review-ready", relationship.exact],
    ["qa-ready", relationship.exact],
    ["release-candidate", relationship.descendant],
    ["legacy", relationship.specificationOnly],
  ]);
  return routes.get(readiness) ?? false;
}

function carrySource(incident, id) {
  const prior = incident.terminalVerificationDeferred;
  if ([incident.state === "unresolved", incident.repair?.status === "eligible",
    prior?.status === "terminal-verification-deferred"].every(Boolean)) return prior;
  throw new Error(`Reliability incident ${id} has no deferred proof to carry`);
}

function candidateProofMatches(proof, candidate) {
  return [proof.candidate?.commit === candidate.commit, proof.candidate?.tree === candidate.tree,
    proof.reviewReady?.candidateCommit === candidate.commit,
    proof.reviewReady?.candidateTree === candidate.tree].every(Boolean);
}

function reviewProofComplete(reviewReady) {
  return [Boolean(reviewReady?.task), Boolean(reviewReady?.baseCommit),
    shaPattern.test(String(reviewReady?.receiptSha256)),
    Array.isArray(reviewReady?.focusedTaskKeys),
    Boolean(reviewReady?.focusedTaskKeys?.length)].every(Boolean);
}

function carryProofComplete(proof, candidate) {
  return [candidateProofMatches(proof, candidate), reviewProofComplete(proof.reviewReady),
    shaPattern.test(String(proof.package?.digest))].every(Boolean);
}

async function requireConservedCarry({ root, isAncestor, incident, id, prior, candidate,
  proof, changedPaths }) {
  const conservation = terminalVerificationDeferredConservation({ incident, changedPaths });
  const descendant = await commitDescendsFrom({
    root, isAncestor, ancestor:prior.candidate.commit, commit:candidate.commit,
  });
  if ([conservation.conserved, carryProofComplete(proof, candidate), descendant].every(Boolean)) {
    return conservation;
  }
  throw new Error(`Reliability incident ${id} deferred inputs changed; fresh incident-focused proof is required`);
}

function carriedDisposition({ prior, proof, conservation, at }) {
  const withoutDigest = {
    status:"terminal-verification-deferred",
    candidate:structuredClone(proof.candidate), repairDigest:prior.repairDigest,
    reviewReady:structuredClone(proof.reviewReady), package:structuredClone(proof.package),
    carryForward:{ ancestorDisposition:structuredClone(prior),
      fromCandidate:structuredClone(prior.candidate),
      fromDispositionDigest:prior.digest, conservation }, recordedAt:at,
  };
  return { ...withoutDigest, digest:timeoutIncidentDigest(withoutDigest) };
}

export function createTimeoutIncidentStore({
  storeDirectory, legacyStoreDirectories, root = repositoryRoot, now = () => new Date().toISOString(),
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
  candidateChangedPaths = async(fromCommit, toCommit) =>
    (await git(root, "diff", "--name-only", `${fromCommit}..${toCommit}`))
      .split(/\r?\n/u).filter(Boolean),
  canonicalCheckpointValidator = defaultCanonicalCheckpointValidator,
  canonicalRepairTaskIdentities = defaultCanonicalRepairTaskIdentities,
} = {}) {
  const access = createStoreAccess({ root, storeDirectory, legacyStoreDirectories });
  const store = {
    read:access.read,
    async list() {
      const names = (await Promise.all((await access.readableDirectories()).map((entry) =>
        readdir(entry)))).flat();
      const unexpected = names.filter((name) => !name.endsWith(".lock") &&
        !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.legacy-source$/u.test(name) &&
        !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:checkpoint-receipt|package-receipt|package-zip)$/u.test(name) &&
        !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.json$/u.test(name));
      if (unexpected.length) throw new Error(`Malformed reliability incident store entry: ${unexpected[0]}`);
      const ids = [...new Set(names.filter((name) => name.endsWith(".json"))
        .map((name) => name.slice(0, -5)))];
      return Promise.all(ids.sort().map(access.read));
    },
    async create(failure) {
      exactObject(failure, "Reliability failure");
      if (typeof failure.failureClass !== "string" || !failure.failureClass ||
          !shaPattern.test(failure.fingerprint ?? "")) {
        throw new Error("Reliability failure requires a class and normalized fingerprint");
      }
      const boundedClosure = failure.contractRevision !== undefined;
      if (boundedClosure && (failure.failureDomain === "environment-prerequisite" ||
          failure.contractRevision !== "2f609d7a19fd966eb82c54b2938df1fd78e2d836" ||
          !shaPattern.test(failure.causalKey ?? "") ||
          failure.causalIdentity?.key !== failure.causalKey ||
          failure.occurrence?.commit !== failure.lineage?.commit ||
          failure.occurrence?.tree !== failure.lineage?.tree)) {
        throw new Error("Bounded reliability failure has an invalid causal contract or prelaunch domain");
      }
      const scoped = failure.failureClass === "execution-contract-failure" ? undefined : (() => {
        try { return diagnosticRetryScope({ task:failure.task,
          lastProgress:failure.failedBoundary ?? failure.lastProgress }); }
        catch { return undefined; }
      })();
      const immutableFailure = structuredClone({ ...failure,
        retryScope:scoped, retryIdentity:scoped ? retryIdentity(failure) : timeoutIncidentDigest({
          lineage:failure.lineage, task:failure.task, progressContract:"untrusted",
        }),
      });
      const directory = await access.directory();
      return withIncidentLock(directory, boundedClosure ? "causal-index" : `create-${randomUUID()}`, async() => {
        if (boundedClosure) {
          let matching;
          for (const incident of await store.list()) {
            if (incident.state !== "unresolved" || incident.causalKey !== failure.causalKey ||
                incident.closureAudit?.blocking === false) continue;
            const descendantOccurrence = await Promise.all(incident.occurrences.map((occurrence) =>
              commitDescendsFrom({ root, isAncestor, ancestor:occurrence.commit,
                commit:failure.occurrence.commit })));
            if (descendantOccurrence.some(Boolean)) { matching = incident; break; }
          }
          if (matching) {
            if (matching.occurrences.some(({ resultDigest }) =>
              resultDigest === failure.occurrence.resultDigest)) return matching;
            return access.update(matching.id, (incident) => {
              const at = now();
              return transition({ ...incident,
                occurrences:[...incident.occurrences, structuredClone(failure.occurrence)] },
              "occurrence-appended", at, {
                commit:failure.occurrence.commit,
                tree:failure.occurrence.tree,
                resultDigest:failure.occurrence.resultDigest,
              });
            });
          }
        }
        const id = stableIncidentId(randomId());
        const incident = validateIncident({
          version:1, id, createdAt:now(), state:"unresolved", failure:immutableFailure,
          lineageTransitions:[],
          ...(boundedClosure ? {
            contractRevision:failure.contractRevision,
            failureDomain:failure.failureDomain,
            causalIdentity:structuredClone(failure.causalIdentity),
            causalKey:failure.causalKey,
            occurrences:[structuredClone(failure.occurrence)],
          } : {}),
          failureDigest:timeoutIncidentDigest(immutableFailure), transitions:[],
        });
        try { await writeExclusive(path.join(directory, `${id}.json`), incidentEnvelope(incident)); }
        catch (error) {
          if (error.code === "EEXIST") throw new Error(`Duplicate reliability incident id ${id}`);
          throw error;
        }
        return incident;
      });
    },
    async blocking({ commit }) {
      const applicable = [];
      for (let incident of await this.list()) {
        if (await lineageApplies({ root, isAncestor, incident, commit }) &&
            incident.state !== "resolved" && incident.closureAudit?.blocking !== false) {
          if (!incident.runIntentCompatibility && !incident.terminalVerificationDeferred) {
            const classification = await classifyLegacyIncidentRunIntent({ root, incident });
            if (classification.applicable) {
              incident = await access.update(incident.id, (current) => {
                const classifiedAt = now();
                const withoutDigest = {
                  version:1,
                  status:classification.blocking
                    ? "blocking-ambiguous" : "nonblocking-development-diagnostic",
                  reason:classification.reason,
                  sourceReceipt:classification.sourceReceipt ?? current.failure.sourceReceipt ?? null,
                  ...(classification.receiptSha256
                    ? { receiptSha256:classification.receiptSha256 } : {}),
                  ...(classification.proof ? { proof:classification.proof } : {}),
                  classifiedAt,
                };
                const disposition = { ...withoutDigest,
                  digest:timeoutIncidentDigest(withoutDigest) };
                return transition({ ...current, runIntentCompatibility:disposition },
                  "run-intent-compatibility-classified", classifiedAt,
                  { dispositionDigest:disposition.digest });
              });
            }
          }
          if (incident.runIntentCompatibility?.status !== "nonblocking-development-diagnostic") {
            applicable.push(incident);
          }
        }
      }
      return applicable;
    },
    async blockingForEvidence({ commit, changedPaths = [] }) {
      const blocked = [];
      for (const incident of await this.blocking({ commit })) {
        const conservedDeferred = eligibleDeferredIncident(incident) &&
          terminalVerificationDeferredConservation({ incident, changedPaths }).conserved;
        if (!conservedDeferred) blocked.push(incident);
      }
      return blocked;
    },
    async blockingForHandoff({ commit, readiness, sender, verified }) {
      const blocked = [];
      for (const incident of await this.blocking({ commit })) {
        const relationship = await handoffCandidateRelationship({ root, isAncestor,
          candidateChangedPaths, incident, commit, readiness, sender, verified });
        const permitted = eligibleDeferredIncident(incident) &&
          permittedHandoffRelationship(readiness, relationship);
        if (!permitted) blocked.push(incident);
      }
      return blocked;
    },
    async deferTerminalVerification(id, proof) {
      exactObject(proof, "Terminal verification deferral proof");
      const candidate = await currentCandidate();
      return access.update(id, async(incident) => {
        if (incident.state !== "unresolved" || incident.repair?.status !== "eligible") {
          throw new Error(`Reliability incident ${id} has no eligible repair to defer`);
        }
        if (proof.candidate?.commit !== candidate.commit || proof.candidate?.tree !== candidate.tree ||
            !await commitDescendsFrom({ root, isAncestor,
              ancestor:timeoutRepairCandidate(incident)?.commit, commit:candidate.commit }) ||
            proof.reviewReady?.candidateCommit !== candidate.commit ||
            proof.reviewReady?.candidateTree !== candidate.tree || !proof.reviewReady?.task ||
            !proof.reviewReady?.baseCommit ||
            !shaPattern.test(proof.reviewReady?.receiptSha256 ?? "") ||
            !Array.isArray(proof.reviewReady?.focusedTaskKeys) ||
            !(proof.reviewReady.focusedTaskKeys.includes(incident.failure.task.key) ||
              proof.runIntentBootstrap?.coverage?.some(({ incidentId, selectedTaskKey }) =>
                incidentId === id && proof.reviewReady.focusedTaskKeys.includes(selectedTaskKey))) ||
            !shaPattern.test(proof.package?.digest ?? "")) {
          throw new Error(`Reliability incident ${id} terminal deferral proof is stale or incomplete`);
        }
        const proofDisposition = {
          status:"terminal-verification-deferred",
          candidate:structuredClone(proof.candidate),
          repairDigest:timeoutIncidentDigest(incident.repair),
          reviewReady:structuredClone(proof.reviewReady),
          ...(proof.runIntentBootstrap
            ? { runIntentBootstrap:structuredClone(proof.runIntentBootstrap) } : {}),
          package:structuredClone(proof.package),
        };
        const currentProof = incident.terminalVerificationDeferred && {
          status:incident.terminalVerificationDeferred.status,
          candidate:incident.terminalVerificationDeferred.candidate,
          repairDigest:incident.terminalVerificationDeferred.repairDigest,
          reviewReady:incident.terminalVerificationDeferred.reviewReady,
          ...(incident.terminalVerificationDeferred.runIntentBootstrap
            ? { runIntentBootstrap:incident.terminalVerificationDeferred.runIntentBootstrap } : {}),
          package:incident.terminalVerificationDeferred.package,
        };
        if (currentProof && timeoutIncidentDigest(currentProof) ===
            timeoutIncidentDigest(proofDisposition)) return incident;
        const at = now();
        const withoutDigest = { ...proofDisposition, recordedAt:at };
        const disposition = { ...withoutDigest, digest:timeoutIncidentDigest(withoutDigest) };
        return transition({ ...incident, terminalVerificationDeferred:disposition },
          "terminal-verification-deferred", at, { dispositionDigest:disposition.digest,
            commit:candidate.commit });
      });
    },
    async carryTerminalVerification(id, proof) {
      exactObject(proof, "Terminal verification carry-forward proof");
      const candidate = await currentCandidate();
      return access.update(id, async(incident) => {
        const prior = carrySource(incident, id);
        const paths = await candidateChangedPaths(prior.candidate.commit, candidate.commit);
        const conservation = await requireConservedCarry({ root, isAncestor, incident, id,
          prior, candidate, proof, changedPaths:paths });
        const at = now();
        const disposition = carriedDisposition({ prior, proof, conservation, at });
        return transition({ ...incident, terminalVerificationDeferred:disposition },
          "terminal-verification-deferred", at, { dispositionDigest:disposition.digest,
            commit:candidate.commit, carried:true });
      });
    },
    async resolutions({ commit }) {
      const records = [];
      for (const incident of await this.list()) {
        if (incident.state !== "resolved" || !await lineageApplies({ root, isAncestor,
          incident, commit, resolution:true })) continue;
        const directory = await access.sourceDirectory(incident.id);
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
    recordClosureDisposition(id, disposition) {
      exactObject(disposition, "Reliability closure disposition");
      return access.update(id, (incident) => {
        if (incident.state !== "unresolved") throw new Error(`Reliability incident ${id} is resolved`);
        if (incident.closureAudit) throw new Error(`Reliability incident ${id} was already audited`);
        if (!["lineage-retired", "blocking-product-repair", "blocking-verification-repair",
          "verifier-cause-superseded"].includes(disposition.kind) ||
            typeof disposition.blocking !== "boolean" || disposition.resolved !== false) {
          throw new Error(`Reliability incident ${id} has an invalid bounded closure disposition`);
        }
        if (disposition.kind === "lineage-retired" &&
            (typeof disposition.selectedLineage?.commit !== "string" ||
             typeof disposition.selectedLineage?.tree !== "string" ||
             typeof disposition.reason !== "string" || !disposition.reason.trim())) {
          throw new Error(`Reliability incident ${id} lineage retirement is not audited`);
        }
        if (disposition.kind === "verifier-cause-superseded" &&
            (!shaPattern.test(disposition.causalKey ?? "") ||
             !shaPattern.test(disposition.regressionReceiptSha256 ?? ""))) {
          throw new Error(`Reliability incident ${id} verifier supersession lacks exact causal proof`);
        }
        const at = now();
        return transition({ ...incident, closureAudit:structuredClone(disposition) },
          "closure-audited", at, { kind:disposition.kind, blocking:disposition.blocking });
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
  const store = createTimeoutIncidentStore({ ...options, root });
  const incidents = options.changedPaths
    ? await store.blockingForEvidence({ commit:canonical, changedPaths:options.changedPaths })
    : await store.blocking({ commit:canonical });
  if (incidents.length) {
    throw new Error(`Unresolved reliability incident(s) block verification evidence and Git handoff: ${
      incidents.map(({ id }) => id).join(", ")}. Complete a causal repair and fresh checkpoint.`);
  }
  return [];
}
