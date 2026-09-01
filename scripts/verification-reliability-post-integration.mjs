import { rm } from "node:fs/promises";
import path from "node:path";

import {
  createCheckpointAttemptStore,
  defaultCheckpointAttemptDirectory,
  defaultLegacyCheckpointAttemptDirectory,
} from "./verification-checkpoint-attempt.mjs";
import { validateCanonicalMasterEvidenceRecord } from "./verification-evidence/core.mjs";
import { planVerification, verificationPacksAtCommit } from "./verification-packs.mjs";
import {
  archiveNames,
  defaultLegacyStoreDirectory,
  defaultStoreDirectory,
} from "./verification-reliability-persistence.mjs";
import { createTimeoutIncidentStore } from "./verification-reliability-store.mjs";
import { git, shaPattern } from "./verification-reliability-values.mjs";
import { exactIntegratedResolution } from
  "./verification-policy/reliability/integrated-resolution.mjs";

const finalNotesRef = "refs/notes/swarmforge-verification";

function collectStrings(value, output = new Set()) {
  if (typeof value === "string") output.add(value);
  else if (value && typeof value === "object") {
    for (const child of Object.values(value)) collectStrings(child, output);
  }
  return output;
}

function archiveEntries(directory, compact) {
  const names = archiveNames(compact.incidentId);
  return [
    { path:path.join(directory, names.checkpointReceipt),
      contentIdentity:compact.checkpointReceiptSha256 },
    { path:path.join(directory, names.packageReceipt),
      contentIdentity:compact.packageReceiptSha256 },
    { path:path.join(directory, names.packageZip), contentIdentity:compact.packageDigest },
  ];
}

function activeReferenceMatches(references, entries, repositoryRoot) {
  return entries.some((entry) => {
    const relative = path.relative(repositoryRoot, entry.path).split(path.sep).join("/");
    return references.has(entry.path) || references.has(relative) ||
      references.has(path.basename(entry.path)) || references.has(entry.contentIdentity) ||
      references.has(`sha256:${entry.contentIdentity}`);
  });
}

export function validatePostIntegrationFinalNote({
  note, masterCommit, masterTree, canonicalPackIds,
}) {
  if (note?.version !== 2 || !Array.isArray(note.records)) {
    throw new Error("Post-integration cleanup requires the version 2 final Git note");
  }
  const records = note.records.filter((record) => record?.commit === masterCommit);
  const valid = records.filter((record) => {
    try {
      validateCanonicalMasterEvidenceRecord(record, {
        candidateCommit:masterCommit, candidateTree:masterTree,
        masterBaseCommit:record.baseCommit, canonicalPackIds,
      });
      return true;
    } catch { return false; }
  });
  if (valid.length !== 1) {
    throw new Error("Post-integration cleanup requires one exact canonical master Git-note record");
  }
  const record = valid[0];
  if (!shaPattern.test(record.checkpointAttempt?.id ?? "") ||
      !shaPattern.test(record.checkpointAttempt?.identityDigest ?? "") ||
      !Array.isArray(record.reliabilityResolutions) ||
      record.reliabilityResolutions.some((entry) =>
        typeof entry?.incidentId !== "string" || !entry.incidentId ||
        ![entry.failureDigest, entry.checkpointReceiptSha256, entry.packageReceiptSha256,
          entry.packageDigest, entry.resolutionDigest].every((value) => shaPattern.test(value ?? "")))) {
    throw new Error("Final Git note lacks compact checkpoint or incident identities");
  }
  return record;
}

async function defaultFinalContext(repositoryRoot) {
  const [masterCommit, qaCommit] = await Promise.all([
    git(repositoryRoot, "rev-parse", "refs/heads/master^{commit}"),
    git(repositoryRoot, "rev-parse", "refs/heads/qa^{commit}"),
  ]);
  const [masterTree, note, packs] = await Promise.all([
    git(repositoryRoot, "rev-parse", `${masterCommit}^{tree}`),
    git(repositoryRoot, "notes", `--ref=${finalNotesRef}`, "show", masterCommit)
      .then((value) => JSON.parse(value)),
    verificationPacksAtCommit(masterCommit, { repositoryRoot }),
  ]);
  const canonicalPackIds = planVerification(packs, {
    terminalFull:true, includeProperties:true,
  }).selectedPackIds;
  return { masterCommit, masterTree, qaCommit, note, canonicalPackIds };
}

async function defaultIsIntegratedCommit(candidateCommit, masterCommit, repositoryRoot) {
  if (candidateCommit === masterCommit) return true;
  try {
    await git(repositoryRoot, "merge-base", "--is-ancestor", candidateCommit, masterCommit);
    return true;
  } catch { return false; }
}

export async function runPostIntegrationRuntimeDisposition({
  repositoryRoot = process.cwd(), expectedMasterCommit,
  loadFinalContext = defaultFinalContext,
  listCheckpointAttempts,
  listIncidents,
  checkpointDirectory,
  incidentDirectory,
  remove = (target) => rm(target, { force:true }),
  isIntegratedCommit = defaultIsIntegratedCommit,
} = {}) {
  const context = await loadFinalContext(repositoryRoot);
  if (context.masterCommit !== expectedMasterCommit) {
    throw new Error("Post-integration cleanup requires the exact master commit");
  }
  const record = validatePostIntegrationFinalNote(context);
  const resolvedCheckpointDirectory = checkpointDirectory ??
    await defaultCheckpointAttemptDirectory(repositoryRoot);
  const resolvedIncidentDirectory = incidentDirectory ?? await defaultStoreDirectory(repositoryRoot);
  const checkpointStore = listCheckpointAttempts ? null : createCheckpointAttemptStore({
    directory:resolvedCheckpointDirectory,
    legacyDirectories:[await defaultLegacyCheckpointAttemptDirectory(repositoryRoot)],
  });
  const incidentStore = listIncidents ? null : createTimeoutIncidentStore({
    root:repositoryRoot,
    storeDirectory:resolvedIncidentDirectory,
    legacyStoreDirectories:[await defaultLegacyStoreDirectory(repositoryRoot)],
  });
  const [attempts, incidents] = await Promise.all([
    listCheckpointAttempts ? listCheckpointAttempts() : checkpointStore.list(),
    listIncidents ? listIncidents() : incidentStore.list(),
  ]);
  const unresolved = incidents.filter(({ state }) => state === "unresolved");
  const activeReferences = collectStrings(unresolved);
  const removed = [], retained = [];
  for (const attempt of attempts) {
    const target = path.join(resolvedCheckpointDirectory, `${attempt.id}.json`);
    const entry = { path:target, contentIdentity:attempt.identityDigest };
    const finalAttempt = attempt.id === record.checkpointAttempt.id;
    if (finalAttempt && (attempt.state !== "promoted" ||
        attempt.identityDigest !== record.checkpointAttempt.identityDigest ||
        attempt.identity?.candidate?.commit !== context.masterCommit)) {
      throw new Error("Final Git-note checkpoint attempt does not match completed master evidence");
    }
    const terminal = ["interrupted", "tasks-complete", "promoted"].includes(attempt.state);
    const candidateCommit = attempt.identity?.candidate?.commit;
    const integrated = terminal && await isIntegratedCommit(candidateCommit,
      context.masterCommit, repositoryRoot);
    if (!finalAttempt && !integrated) {
      retained.push({ kind:"checkpoint-attempt", path:target, identity:attempt.id,
        reason:candidateCommit === context.qaCommit ? "current unintegrated QA attempt" :
          terminal ? "unintegrated attempt" : "nonterminal attempt" });
      continue;
    }
    if (activeReferenceMatches(activeReferences, [entry], repositoryRoot)) {
      retained.push({ kind:"checkpoint-attempt", path:target, identity:attempt.id,
        reason:"active incident obligation" });
      continue;
    }
    await remove(target);
    await remove(path.join(resolvedCheckpointDirectory, `${attempt.id}.legacy-source`));
    removed.push({ kind:"checkpoint-attempt", path:target, identity:attempt.id });
  }
  for (const compact of record.reliabilityResolutions) {
    const incident = incidents.find(({ id }) => id === compact.incidentId);
    if (!exactIntegratedResolution(compact, incident)) {
      throw new Error(`Final Git-note incident identity does not match ${compact.incidentId}`);
    }
    const entries = archiveEntries(resolvedIncidentDirectory, compact);
    if (activeReferenceMatches(activeReferences, entries, repositoryRoot)) {
      retained.push(...entries.map((entry) => ({ kind:"incident-archive", path:entry.path,
        identity:compact.incidentId, reason:"active incident obligation" })));
      continue;
    }
    for (const entry of entries) {
      await remove(entry.path);
      removed.push({ kind:"incident-archive", path:entry.path, identity:compact.incidentId });
    }
  }
  return { version:1, masterCommit:context.masterCommit, qaCommit:context.qaCommit,
    finalEvidenceId:record.evidenceId ?? null, removed, retained };
}
