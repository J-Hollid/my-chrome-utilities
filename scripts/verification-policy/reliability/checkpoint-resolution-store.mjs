import {lstat,readFile,realpath} from "node:fs/promises";
import path from "node:path";

import {archiveBytes,archiveNames,transition} from
  "../../verification-reliability-persistence.mjs";
import {receiptDocument,validatePackageReceipt} from
  "../../verification-reliability-receipts.mjs";
import {terminalConfirmedFlakyIncident,terminalCheckpointCandidate,timeoutRepairCandidate} from
  "../../verification-reliability-repair.mjs";
import {timeoutIncidentDigest} from "../../verification-reliability-values.mjs";
import {createProposeRepairOperation} from
  "../../verification-reliability-repair-store-operation.mjs";
import {exactBootstrapTerminalObligation} from "./terminal-closure.mjs";

export function terminalCheckpointDispositionAvailable(incident) {
  return incident.repair?.status === "eligible" ||
    ["confirmed-flaky","deterministic-baseline"]
      .includes(incident.terminalVerificationDeferred?.basis) ||
    terminalConfirmedFlakyIncident(incident) ||
    exactBootstrapTerminalObligation(incident) &&
      ["blocking-product-repair", "blocking-verification-repair"]
        .includes(incident.closureAudit?.kind) && incident.closureAudit.blocking === true;
}

export function repairCheckpointClaimError(incident) {
  if (incident?.state !== "unresolved" || !terminalCheckpointDispositionAvailable(incident)) {
    return "has no terminal checkpoint disposition";
  }
  if (!incident.repairCheckpoint) return null;
  const candidate = terminalCheckpointCandidate(incident);
  const reclaimCount = Number(incident.repairCheckpoint.reclaimCount ?? 0);
  const sourceCandidate=incident.repair?.candidate?.commit??
    incident.terminalVerificationDeferred?.candidate?.commit??incident.failure.lineage.commit;
  const repairRebases = (incident.lineageTransitions ?? []).filter(({kind, fromCommit}) =>
    kind === "rebase" && (fromCommit === sourceCandidate ||
      (incident.lineageTransitions ?? []).some(({toCommit}) => toCommit === fromCommit))).length;
  return candidate.commit === sourceCandidate || reclaimCount >= repairRebases
    ? "repair checkpoint was already used" : null;
}

export function claimableRepairCheckpointIds(incidents) {
  const claimable=[];
  for (const incident of incidents) {
    const error=repairCheckpointClaimError(incident);
    if (!error) claimable.push(incident.id);
    else if (error!=="repair checkpoint was already used") {
      throw new Error(`Reliability incident ${incident.id} ${error}`);
    }
  }
  if (!claimable.length) {
    throw new Error("Reliability repair checkpoint aggregate has no unused claim");
  }
  return claimable.sort();
}

export function checkpointResolutionClaimError(incident,runId) {
  if(incident?.state!=="unresolved"||!terminalCheckpointDispositionAvailable(incident)) {
    return "has no terminal checkpoint disposition";
  }
  if(incident.repairCheckpoint?.status!=="claimed"||incident.repairCheckpoint.runId!==runId) {
    return "resolution requires the claim from this canonical checkpoint";
  }
  return null;
}

export function terminalCheckpointIncident(incident) {
  const deferred = incident.terminalVerificationDeferred;
  if (!["confirmed-flaky", "bootstrap-terminal-obligation","deterministic-baseline"]
      .includes(deferred?.basis) && !terminalConfirmedFlakyIncident(incident)) return incident;
  return { ...incident, repair:{ status:"eligible", candidate:terminalCheckpointCandidate(incident),
    checkpoint:{
      baseCommit:deferred?.reviewReady.baseCommit ?? incident.failure.lineage.baseCommit,
      evidenceTask:deferred?.reviewReady.task ?? incident.failure.lineage.evidenceTask,
    } } };
}

export async function checkpointExcludedChangedPaths(document,requiredIncidentId,
  {read,root,isAncestor,commitDescendsFrom}) {
  const ids=document.receipt.timeoutRepairCheckpoint?.incidentIds;
  if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||
      !ids.includes(requiredIncidentId)){
    throw new Error("Canonical checkpoint incident aggregate is incomplete");
  }
  const incidents=await Promise.all(ids.map((id)=>read(id)));
  const candidate=document.receipt.candidate;
  const excluded=new Set();
  for(const incident of incidents){
    const repair=incident.repair?.status==="eligible"?incident.repair:null;
    if(!repair)continue;
    const repairCandidate=timeoutRepairCandidate(incident);
    if(repair.checkpoint?.baseCommit!==candidate.baseCommit||
        repair.checkpoint?.evidenceTask!==candidate.evidenceTask||
        !await commitDescendsFrom({root,isAncestor,ancestor:repairCandidate.commit,
          commit:candidate.commit})){
      throw new Error(`Canonical checkpoint incident ${incident.id} is not compatible with the aggregate`);
    }
    for(const changedPath of repair.changedPaths??[])excluded.add(changedPath);
  }
  return [...excluded].sort();
}

export function createCheckpointResolutionOperations({root,now,read,update,directory,isAncestor,
  currentCandidate,changedPaths,canonicalCheckpointValidator,canonicalRepairTaskIdentities,
  commitDescendsFrom}) {
  const proposeRepair=createProposeRepairOperation({root,now,read,update,isAncestor,currentCandidate,
    changedPaths,canonicalRepairTaskIdentities,commitDescendsFrom});
  return {
    proposeRepair,
    async assertRepairCheckpointClaimable(id) {
      const error=repairCheckpointClaimError(await read(id));
      if(error)throw new Error(`Reliability incident ${id} ${error}`);
    },
    claimRepairCheckpoint(id, runId) {
      return update(id, (incident) => {
        const claimError=repairCheckpointClaimError(incident);
        if(claimError)throw new Error(`Reliability incident ${id} ${claimError}`);
        const at = now();
        if (incident.repairCheckpoint) {
          const reclaimCount = Number(incident.repairCheckpoint.reclaimCount ?? 0);
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
      const checkpointIncident = terminalCheckpointIncident(incidentBeforeResolution);
      const excludedChangedPaths=await checkpointExcludedChangedPaths(checkpointDocument,id,
        {read,root,isAncestor,commitDescendsFrom});
      const canonicalCheckpoint = await canonicalCheckpointValidator({
        document:checkpointDocument, incident:checkpointIncident, root, excludedChangedPaths,
      });
      validatePackageReceipt(packageDocument, checkpointDocument, checkpointIncident);
      const checkpoint = checkpointDocument.receipt;
      if (checkpointResolutionClaimError(incidentBeforeResolution,checkpoint.runId) ||
          canonicalCheckpoint.receipt.runId !== checkpoint.runId) {
        throw new Error(`Reliability incident ${id} resolution requires one canonical all-runnable-pack checkpoint and package`);
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
        if (checkpointResolutionClaimError(incident,checkpoint.runId) ||
            canonicalCheckpoint.receipt.runId !== checkpoint.runId) {
          throw new Error(`Reliability incident ${id} resolution requires one canonical all-runnable-pack checkpoint and package`);
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
        const resolution = { ...resolutionWithoutDigest,
          digest:timeoutIncidentDigest(resolutionWithoutDigest) };
        return transition({ ...incident, state:"resolved", resolution }, "resolved", at,
          { resolutionDigest:resolution.digest });
      });
    },
  };
}
