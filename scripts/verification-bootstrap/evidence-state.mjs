import {readBootstrapRun,validateStoredBootstrapReceipt} from "./durable-store.mjs";
import {recoverBootstrapRun} from "./recovery.mjs";
import {git} from "./repository.mjs";

export function validateBootstrapEvidenceState({run,promotion,identity}) {
  if (!run) {
    if (promotion) throw new Error("Bootstrap promotion exists without a durable receipt");
    return {eligible:true,action:"start"};
  }
  const recovery=recoverBootstrapRun(run,identity);
  if (recovery.action==="report-failure") {
    throw new Error("Bootstrap durable run is failed and is not eligible");
  }
  if (promotion&&(recovery.action!=="use-receipt"||
      promotion.receiptSha256!==run.receiptSha256)) {
    throw new Error("Bootstrap promotion does not match the durable receipt");
  }
  return {eligible:true,action:recovery.action==="attach"?"wait":recovery.action};
}

export async function bootstrapPromotionState(root,{candidateCommit,baseCommit,task}) {
  let raw;
  try { raw=await git(root,"notes","--ref=refs/notes/swarmforge-review-ready",
    "show",candidateCommit); }
  catch { return null; }
  const note=JSON.parse(raw);
  if (!Array.isArray(note.records)) throw new Error("Bootstrap promotion note is invalid");
  const record=note.records?.find((value)=>value.task===task&&value.baseCommit===baseCommit);
  return record?{receiptSha256:record.receipt?.sha256}:null;
}

export async function inspectBootstrapEvidenceState({runFile,identity,promotion}) {
  const run=await readBootstrapRun(runFile);
  if (run?.status==="completed") await validateStoredBootstrapReceipt(run);
  return validateBootstrapEvidenceState({run,promotion,identity});
}
