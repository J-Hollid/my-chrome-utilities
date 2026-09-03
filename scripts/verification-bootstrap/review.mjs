import {fixedBootstrapRegistryDigest} from "./fixed-registry.mjs";
import {fixedBootstrapRegistry} from "./fixed-registry.mjs";
import {plannerClosureAtCommit} from "./base-planner.mjs";
import {validateReviewBootstrapReceipt} from "./receipt.mjs";
import {projectBootstrapPlan,validatePlannerClosureTransition} from "./transition-plan.mjs";

export async function validateRecordedBootstrapReceipt(receipt,{task,baseCommit,candidateCommit,
  candidateTree,changeSet,repositoryRoot}) {
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
  const registry=fixedBootstrapRegistry();
  const [baseClosure,candidateClosure]=await Promise.all([
    plannerClosureAtCommit(registry,baseCommit,{repositoryRoot}),
    plannerClosureAtCommit(registry,candidateCommit,{repositoryRoot}),
  ]);
  const plan=projectBootstrapPlan({baseCommit,candidateCommit,candidateTree,
    changedPaths:changeSet.paths,toolchainDigest:binding.toolchainDigest,
    artifactDigest:binding.artifactDigest,plannerClosure:candidateClosure});
  validatePlannerClosureTransition(baseClosure,candidateClosure,plan);
  validateReviewBootstrapReceipt(receipt,plan,registryDigest);
  return {plan,registryDigest};
}
