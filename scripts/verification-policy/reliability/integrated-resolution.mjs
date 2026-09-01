import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { git } from "../../verification-reliability-values.mjs";

const finalNotesRef = "refs/notes/swarmforge-verification";
const executeFile = promisify(execFile);

async function finalNote(root, masterCommit) {
  const { stdout } = await executeFile("git", [
    "notes", `--ref=${finalNotesRef}`, "show", masterCommit,
  ], { cwd:root, encoding:"utf8", maxBuffer:64 * 1024 * 1024 });
  return JSON.parse(stdout);
}

export function exactIntegratedResolution(compact, incident) {
  const resolution = incident?.resolution;
  return incident?.state === "resolved" && compact?.incidentId === incident.id &&
    compact.failureDigest === incident.failureDigest &&
    compact.resolutionDigest === resolution?.digest &&
    compact.checkpointReceiptSha256 === resolution?.checkpoint?.receiptSha256 &&
    compact.packageReceiptSha256 === resolution?.package?.receiptSha256 &&
    compact.packageDigest === resolution?.package?.digest;
}

export async function integratedResolutionRecorded({ root, incident }) {
  try {
    const masterCommit = await git(root, "rev-parse", "refs/heads/master^{commit}");
    const note = await finalNote(root, masterCommit);
    if (note?.version !== 2 || !Array.isArray(note.records)) return false;
    return note.records.some((record) => record?.commit === masterCommit &&
      Array.isArray(record.reliabilityResolutions) &&
      record.reliabilityResolutions.some((compact) => exactIntegratedResolution(compact, incident)));
  } catch {
    return false;
  }
}
