import {verificationPacksAtCommit} from "../verification-changes.mjs";
import {intentOwnershipReadiness} from "../verification-ownership-readiness-core.mjs";
import {activeVerificationSliceQuarantineIds} from "../verification-slice-quarantine.mjs";

export async function immutableBasePlannerResult(registry,{repositoryRoot}) {
  const packs=await verificationPacksAtCommit(registry.baseCommit,{repositoryRoot,
    historicalRegistryFallback:true});
  const quarantinedSliceIds=await activeVerificationSliceQuarantineIds(registry.baseCommit,
    {repositoryRoot});
  return intentOwnershipReadiness({intent:{version:1,baseCommit:registry.baseCommit,
    task:registry.task,...structuredClone(registry.baseIntent)},packs,quarantinedSliceIds});
}
