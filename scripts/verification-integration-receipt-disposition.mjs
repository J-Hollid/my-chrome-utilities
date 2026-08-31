import { createHash } from "node:crypto";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

import { atomicWriteFile } from "./dist-artifact.mjs";
import {
  applyReceiptDisposition,
  createSharedEvidenceRetention,
  receiptRetentionDecision,
} from "./verification-reliability-evidence-retention.mjs";
import { createTimeoutIncidentStore } from "./verification-reliability-store.mjs";

function inside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return Boolean(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative);
}

function dispositionId(entry) {
  return createHash("sha256").update(JSON.stringify({ path:entry.path,
    identity:entry.receiptIdentity })).digest("hex");
}

function receiptIdentity(receipt) {
  const identity={ candidateCommit:receipt?.candidate?.commit,
    baseCommit:receipt?.candidate?.baseCommit, tree:receipt?.candidate?.tree,
    task:receipt?.candidate?.evidenceTask,
    planDigest:receipt?.plan?.taskPlanDigest, runIntent:receipt?.runIntent };
  if (Object.values(identity).some((value)=>typeof value!=="string"||!value)) {
    throw new Error("Receipt disposition target has no authoritative receipt identity");
  }
  return identity;
}

function sameIdentity(left,right) {
  return JSON.stringify(left)===JSON.stringify(right);
}

function incidentEvidenceReferences(value, key = "", references = { paths:new Set(),
  digests:new Set() }) {
  if (typeof value === "string") {
    if (/^(?:sourceReceipt|receiptPath)$/u.test(key)) {
      references.paths.add(value.split(path.sep).join("/"));
    }
    if (/^(?:sourceReceiptSha256|receiptSha256)$/u.test(key) && /^[a-f0-9]{64}$/u.test(value)) {
      references.digests.add(`sha256:${value}`);
    }
    return references;
  }
  if (!value || typeof value !== "object") return references;
  for (const [childKey, child] of Object.entries(value)) {
    incidentEvidenceReferences(child, childKey, references);
  }
  return references;
}

async function defaultActiveObligations({ repositoryRoot, contentIdentity, relativePath }) {
  const incidents=await createTimeoutIncidentStore({root:repositoryRoot}).list();
  return incidents.filter((incident)=>{
    if (incident.state!=="unresolved") return false;
    const references=incidentEvidenceReferences(incident);
    return references.paths.has(relativePath)||references.digests.has(contentIdentity);
  }).map(({id,state})=>({incidentId:id,status:state,contentIdentity}));
}

async function loadState(statePath) {
  try { return JSON.parse(await readFile(statePath, "utf8")); }
  catch (error) {
    if (error.code === "ENOENT") return { version:1, results:{} };
    throw error;
  }
}

async function storeState(statePath, state) {
  await mkdir(path.dirname(statePath), { recursive:true });
  await atomicWriteFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

export async function runIntegrationReceiptDispositionManifest(manifestPath, {
  repositoryRoot = process.cwd(),
  statePath = path.join(repositoryRoot, ".swarmforge", "verification-receipt-dispositions.json"),
  sharedStatePath = path.join(repositoryRoot, ".swarmforge", "verification-shared-evidence.json"),
  remove = (target) => rm(target, { force:true }),
  loadActiveObligations = defaultActiveObligations,
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
  const shared=createSharedEvidenceRetention({statePath:sharedStatePath});
  const results = [];
  for (const entry of manifest.receipts) {
    const target = path.resolve(repositoryRoot, entry.path ?? "");
    if (!inside(repositoryRoot, target) || target === resolvedManifest || target === statePath) {
      throw new Error("Receipt disposition target must be project-local durable evidence");
    }
    const relativePath=path.relative(repositoryRoot,target).split(path.sep).join("/");
    const expectedId=dispositionId({path:relativePath,receiptIdentity:entry.receiptIdentity});
    const priorResult = state.results[expectedId];
    if (["removal-pending", "removed"].includes(priorResult?.status)) {
      try { await readFile(target); }
      catch (error) {
        if (error.code==="ENOENT") {
          const completed = priorResult.status === "removed" ? priorResult : {
            ...priorResult, status:"removed", removedAt:new Date().toISOString(),
          };
          if (priorResult.status !== "removed") {
            state.results[expectedId] = completed;
            await storeState(statePath, state);
          }
          results.push(structuredClone(completed));
          continue;
        }
        throw error;
      }
    }
    const bytes=await readFile(target);
    let receipt;
    try { receipt=JSON.parse(bytes); }
    catch { throw new Error("Receipt disposition target is not a valid receipt document"); }
    const authoritativeIdentity=receiptIdentity(receipt);
    const contentIdentity=`sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    const obligations=await loadActiveObligations({repositoryRoot,contentIdentity,relativePath,
      identity:authoritativeIdentity});
    const consumers=obligations.filter((obligation)=>obligation.status!=="resolved"&&
      obligation.contentIdentity===contentIdentity)
      .map(({incidentId})=>`incident:${incidentId}`);
    await shared.replaceConsumers(contentIdentity,consumers);
    const decision = receiptRetentionDecision({ receiptIdentity:authoritativeIdentity,
      identityMatches:sameIdentity(authoritativeIdentity,entry.receiptIdentity),
      currentConsumer:null, activeObligation:obligations[0],
      integrationComplete:manifest.integrationComplete });
    const id = expectedId;
    const result = await applyReceiptDisposition({ path:target,
      identity:authoritativeIdentity, decision, priorResult:state.results[id],
      recordCompactFact:async(compactFact) => {
        state.results[id] = structuredClone(compactFact);
        await storeState(statePath, state);
      }, remove });
    results.push(result);
  }
  return { version:1, results };
}
