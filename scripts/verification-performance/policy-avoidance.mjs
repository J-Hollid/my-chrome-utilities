import { verificationPolicyContracts } from "../verification-policy/contracts.mjs";

const formerUmbrellaTiming = Object.freeze({
  task:"unit:test/verification-process-contract-test.mjs",
  durationMs:181_447,
  environmentClass:"accepted comparable normal-load receipt",
  baselineCommit:"fc552224f290a39dbbd6e27a27f6c3c336b3d2e9",
});

export const verificationPolicyTaskKeys = Object.freeze(
  verificationPolicyContracts.map(({ testPath }) => `unit:${testPath}`),
);

export function verificationPolicySelectionSummary(plan) {
  const planned = new Set((plan.tasks ?? []).map(({ key }) => key));
  const selectedTasks = verificationPolicyTaskKeys.filter((key) => planned.has(key));
  const avoidedTasks = verificationPolicyTaskKeys.filter((key) => !planned.has(key));
  return {
    selectedTasks,
    avoidedTasks,
    comparableHistoricalDuration:{ ...formerUmbrellaTiming },
  };
}
