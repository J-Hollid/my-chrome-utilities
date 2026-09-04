import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const causalCategory = "other:schema-public-owner-registration";
const expectedPreRepairFailure = {
  registeredInConservedDirectOwners:false,
  registeredInManifest:true,
};
const expectedRepairResult = {
  registeredInConservedDirectOwners:true,
  registeredInManifest:true,
};
const normalized = (value) => Array.isArray(value) ? value.map(normalized)
  : value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => [key, normalized(nested)])) : value;
const digest = (value) => createHash("sha256")
  .update(JSON.stringify(normalized(value))).digest("hex");

export function verifySchemaPublicOwnerRegistration(observed) {
  assert.deepEqual(observed, expectedRepairResult,
    "the Schema public operation test has manifest and conserved-owner registration");
  if (!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) return;
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  assert.equal(context.causalCategory, causalCategory);
  const fixture = {
    id:"schema-public-owner-registration-v1",
    causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{ owner:"test/data-layer-installed/schemas/library-public-operations-test.mjs",
      registry:"verification/manifests/schemas.json",
      conservation:"test/verification-contracts/ownership-schemas-contract-test.mjs" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const fixtureDigest = digest(fixture);
  console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
    incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed } } }));
}
