import {fixedBootstrapRegistryDigest} from "./fixed-registry.mjs";
import {validateReviewBootstrapReceipt} from "./receipt.mjs";
import {projectBootstrapPlan} from "./transition-plan.mjs";

export function validateRecordedBootstrapReceipt(receipt,{task,baseCommit,candidateCommit,
  candidateTree,changeSet}) {
  if (!receipt?.processFastPathBootstrap) return null;
  const binding=receipt.processFastPathBootstrap;
  if (binding.task!==task||binding.baseCommit!==baseCommit||
      binding.candidateCommit!==candidateCommit||binding.candidateTree!==candidateTree) {
    throw new Error("Bootstrap review binding does not match the candidate context");
  }
  const registryDigest=fixedBootstrapRegistryDigest();
  if (binding.registryDigest!==registryDigest) {
    throw new Error("Bootstrap review binding does not match the independent fixed registry");
  }
  const plan=projectBootstrapPlan({baseCommit,candidateCommit,candidateTree,
    changedPaths:changeSet.paths,toolchainDigest:binding.toolchainDigest,
    artifactDigest:binding.artifactDigest});
  validateReviewBootstrapReceipt(receipt,plan,registryDigest);
  return {plan,registryDigest};
}
