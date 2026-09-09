import assert from "node:assert/strict";

export function assertContractCallerClosure({verificationProcessCompatibilitySuccessors,verificationPolicyContracts,verificationProcessPack,planVerification,packs}) {
  const successorTaskKeys = new Set(verificationProcessCompatibilitySuccessors
    .map((testPath) => `unit:${testPath}`));
  for (const {id,testPaths} of verificationPolicyContracts) {
    for (const testPath of testPaths) {
      const matchingSlices = verificationProcessPack.verificationSlices.filter((slice) =>
        slice.sourcePaths.includes(testPath) ||
        slice.sourcePrefixes.some((prefix) => testPath.startsWith(prefix)));
      assert.deepEqual(matchingSlices.map((slice) => slice.id), [id],
        `${testPath} has one exclusive matching verification slice`);
      const expectedIds = id === "historical_planning" ? [id,"task_batching"] : [id];
      const expectedSlices = expectedIds.map(expectedId => verificationProcessPack.verificationSlices
        .find(slice => slice.id === expectedId));
      const expectedContractTasks = [...new Set(expectedSlices.flatMap(slice => [...slice.tasks, ...slice.prerequisites]))]
        .filter((key) => successorTaskKeys.has(key)).sort();
      const directContractPlan = planVerification(packs, {changedPaths:[testPath]});
      assert.deepEqual(directContractPlan.selectedVerificationSlices.verification_process, expectedIds,
        `${testPath} selects its matching slice and declared manifest caller coverage`);
      assert.deepEqual(directContractPlan.tasks.map(({key}) => key)
        .filter((key) => successorTaskKeys.has(key)).sort(), expectedContractTasks,
      `${testPath} selects only its exact contract and declared contract prerequisites`);
    }
  }
}
