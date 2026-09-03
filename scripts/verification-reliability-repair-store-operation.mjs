import {freshPassingReceipt,receiptDocument} from
  "./verification-reliability-receipts.mjs";
import {trustedRepairTaskIdentityProvider} from
  "./verification-pack-cardinality/reliability-adapter.mjs";
import {deriveTaskCheckpointRepairProof,taskCheckpointRepairRequired,
  validateRepairReceiptSemantics,validateTimeoutRepairProposal} from
  "./verification-reliability-repair.mjs";
import {normalized} from "./verification-reliability-values.mjs";
import {transition} from "./verification-reliability-persistence.mjs";

export function createProposeRepairOperation({
  root,now,read,update,isAncestor,currentCandidate,changedPaths,
  canonicalRepairTaskIdentities,commitDescendsFrom,
}) {
  return async function proposeRepair(id,{
    causalCategory,causalExplanation,regressionKey,regressionReceiptPath,
    focusedReceiptPath,allowEligibleRevalidation=false,receiptBoundTaskIdentityProvider,
  }={}) {
    const current=await read(id);
    if(current.retry?.status==="claimed"){
      throw new Error(`Reliability incident ${id} has an incomplete diagnostic retry`);
    }
    if(current.repair?.status==="eligible"&&!allowEligibleRevalidation){
      throw new Error(`Reliability incident ${id} already has an eligible repair`);
    }
    if(current.retry&&current.retry.status!=="classified"&&
        !(allowEligibleRevalidation&&current.repair?.status==="eligible"&&
          current.retry.status==="invalidated-by-repair")){
      throw new Error(`Reliability incident ${id} has invalid diagnostic state`);
    }
    const candidate=await currentCandidate();
    const [regressionDocument,focusedDocument,paths,taskCheckpointProof]=await Promise.all([
      receiptDocument(root,regressionReceiptPath),receiptDocument(root,focusedReceiptPath),
      changedPaths(current.failure.lineage.commit),taskCheckpointRepairRequired(current)
        ?deriveTaskCheckpointRepairProof(current):Promise.resolve(undefined),
    ]);
    const regressionTasks=freshPassingReceipt(regressionDocument,candidate,
      "Deterministic regression");
    freshPassingReceipt(focusedDocument,candidate,"Fresh focused verification");
    if(!regressionTasks.some(([key])=>key===regressionKey)){
      throw new Error("Reliability repair requires the named deterministic regression task");
    }
    const proposal={candidate,changedPaths:paths,causalCategory,causalExplanation,
      ...(taskCheckpointProof?{taskCheckpointProof}:{}),
      checkpoint:{baseCommit:focusedDocument.receipt.candidate.baseCommit,
        evidenceTask:focusedDocument.receipt.candidate.evidenceTask},
      regression:{key:regressionKey,status:"passed",commit:candidate.commit,
        receiptPath:regressionDocument.path,receiptSha256:regressionDocument.sha256},
      focusedReceipt:{status:"passed",commit:candidate.commit,provenance:"fresh",
        receiptPath:focusedDocument.path,receiptSha256:focusedDocument.sha256},
    };
    const repairTaskIdentities=trustedRepairTaskIdentityProvider(
      receiptBoundTaskIdentityProvider,canonicalRepairTaskIdentities);
    const semanticProposal=await validateRepairReceiptSemantics(current,proposal,
      regressionDocument,focusedDocument,repairTaskIdentities);
    const descendant=(ancestor,commit)=>
      commitDescendsFrom({root,isAncestor,ancestor,commit});
    const eligible=await validateTimeoutRepairProposal(current,semanticProposal,
      {isAncestor:descendant});
    if(current.repair?.status==="eligible"){
      const conserved=current.repair.causalCategory===eligible.causalCategory&&
        current.repair.causalExplanation===eligible.causalExplanation&&
        current.repair.regression?.key===eligible.regression?.key&&
        JSON.stringify(normalized(current.repair.causalProtocol))===
          JSON.stringify(normalized(eligible.causalProtocol));
      if(!conserved||!(await descendant(current.repair.candidate.commit,
        eligible.candidate.commit))||current.repair.candidate.commit===eligible.candidate.commit){
        throw new Error(`Reliability incident ${id} eligible repair revalidation is not an exact conserved descendant`);
      }
    }
    return update(id,(incident)=>{
      const at=now();
      return transition({...incident,retry:incident.retry??{status:"invalidated-by-repair",
        classification:"not-retried-repaired",invalidatedAt:at},repair:eligible},
      current.repair?.status==="eligible"?"repair-revalidated":"repair-proposed",at,
      {commit:eligible.candidate.commit});
    });
  };
}
