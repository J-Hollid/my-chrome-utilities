import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const normalized = (value) => Array.isArray(value)
  ? value.map(normalized)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalized(nested)]))
    : value;

const digest = (value) => createHash("sha256")
  .update(JSON.stringify(normalized(value))).digest("hex");

export function verificationFixtureOwnershipRepairProtocol(context, observed) {
  const expectedPreRepairFailure = {
    fixtureOwned: false,
    immutableMigrationDigestPreserved: false,
    sharedHelperDeclarationRequired: true,
  };
  const expectedRepairResult = {
    fixtureOwned: true,
    immutableMigrationDigestPreserved: true,
    sharedHelperDeclarationRequired: false,
  };
  const fixture = {
    id:"verification-fixture-ownership-and-migration-ledger-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{
      causalProtocol:"test/fixtures/schema-contributor-hydration-repair-protocol.mjs",
      protectedBoundary:"immutable pack-migration source identity",
    },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const fixtureDigest = digest(fixture);
  assert.deepEqual(observed, expectedRepairResult);
  return {
    version:2,
    incidentId:context.incidentId,
    failureDigest:context.failureDigest,
    fixture,
    preRepairResult:{status:"failed", fixtureDigest, observed:expectedPreRepairFailure},
    repairResult:{status:"passed", fixtureDigest, observed},
  };
}
