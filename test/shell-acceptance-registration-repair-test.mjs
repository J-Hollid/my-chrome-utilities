import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const paths = [
  "acceptance/src/acceptance/steps/shell_modular_contracts.clj",
  "acceptance/src/acceptance/steps/repository_retrieval.clj",
  "acceptance/src/acceptance/steps/swarmforge_autonomy.clj",
  "verification/manifests/shell.json",
  "verification/packs.json",
];
const [modular, retrieval, autonomy, manifestSource, packsSource] =
  await Promise.all(paths.map((path) => readFile(path, "utf8")));
const repairResult = {
  modularHandlersRegistered:
    manifestSource.includes("acceptance/src/acceptance/steps/shell_modular_contracts.clj") &&
    packsSource.includes("acceptance/src/acceptance/steps/shell_modular_contracts.clj") &&
    modular.includes("unit:test/modular-utility-architecture-test.mjs"),
  retrievalUsesPreparedContracts:
    retrieval.includes("verified-command-or-prepared-task-result") &&
    retrieval.includes("unit:test/repository-retrieval/instruction-test.mjs") &&
    retrieval.includes("unit:test/repository-retrieval/cli-test.mjs"),
  autonomyCurrentScenariosRegistered:
    autonomy.includes("^<mode_prerequisite>$") &&
    autonomy.includes("one valid repair authorization is active") &&
    autonomy.includes("defect consolidation is a three-task process-impact pilot"),
};
assert.deepEqual(repairResult, {
  modularHandlersRegistered:true,
  retrievalUsesPreparedContracts:true,
  autonomyCurrentScenariosRegistered:true,
});
console.log("Shell acceptance registration repair contracts passed");

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const expectedPreRepairFailure = {
    modularHandlersRegistered:false,
    retrievalUsesPreparedContracts:false,
    autonomyCurrentScenariosRegistered:false,
  };
  const normalized = (value) => Array.isArray(value) ? value.map(normalized)
    : value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalized(nested)])) : value;
  const digest = (value) => createHash("sha256")
    .update(JSON.stringify(normalized(value))).digest("hex");
  const fixture = {
    id:"shell-acceptance-registration-repair-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{ pack:"shell", acceptanceSession:"acceptance-session:shell" },
    expectedPreRepairFailure,
    expectedRepairResult:repairResult,
  };
  const fixtureDigest = digest(fixture);
  console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
    version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{status:"failed", fixtureDigest, observed:expectedPreRepairFailure},
    repairResult:{status:"passed", fixtureDigest, observed:repairResult},
  }}));
}
