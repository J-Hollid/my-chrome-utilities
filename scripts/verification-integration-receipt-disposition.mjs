import { createHash } from "node:crypto";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

import { atomicWriteFile } from "./dist-artifact.mjs";
import {
  applyReceiptDisposition,
  receiptRetentionDecision,
} from "./verification-reliability-evidence-retention.mjs";

function inside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return Boolean(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative);
}

function dispositionId(entry) {
  return createHash("sha256").update(JSON.stringify({ path:entry.path,
    identity:entry.receiptIdentity })).digest("hex");
}

async function loadState(statePath) {
  try { return JSON.parse(await readFile(statePath, "utf8")); }
  catch (error) {
    if (error.code === "ENOENT") return { version:1, results:{} };
    throw error;
  }
}

export async function runIntegrationReceiptDispositionManifest(manifestPath, {
  repositoryRoot = process.cwd(),
  statePath = path.join(repositoryRoot, ".swarmforge", "verification-receipt-dispositions.json"),
  remove = (target) => rm(target, { force:true }),
} = {}) {
  const resolvedManifest = path.resolve(repositoryRoot, manifestPath);
  if (!inside(repositoryRoot, resolvedManifest)) {
    throw new Error("Receipt disposition manifest must be project-local");
  }
  const manifest = JSON.parse(await readFile(resolvedManifest, "utf8"));
  if (manifest?.version !== 1 || manifest.integrationComplete !== true ||
      !Array.isArray(manifest.receipts)) {
    throw new Error("Receipt disposition requires one completed integration manifest");
  }
  const state = await loadState(statePath);
  const results = [];
  for (const entry of manifest.receipts) {
    const target = path.resolve(repositoryRoot, entry.path ?? "");
    if (!inside(repositoryRoot, target) || target === resolvedManifest || target === statePath) {
      throw new Error("Receipt disposition target must be project-local durable evidence");
    }
    const decision = receiptRetentionDecision({ ...entry,
      integrationComplete:manifest.integrationComplete });
    const id = dispositionId(entry);
    const result = await applyReceiptDisposition({ path:target,
      identity:entry.receiptIdentity, decision, priorResult:state.results[id],
      recordCompactFact:async(compactFact) => {
        state.results[id] = { status:"removed", path:target, compactFact };
        await mkdir(path.dirname(statePath), { recursive:true });
        await atomicWriteFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
      }, remove });
    results.push(result);
  }
  return { version:1, results };
}
