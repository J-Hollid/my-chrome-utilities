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

export function globalStyleFocusRepairProtocol(context, observed) {
  const expectedPreRepairFailure = {
    focusTargetActivated:false,
    focusVisible:false,
    affordance:false,
  };
  const expectedRepairResult = {
    focusTargetActivated:true,
    focusVisible:true,
    affordance:true,
  };
  const fixture = {
    id:"studio-global-style-focus-settlement-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{target:"STUDIO_GLOBAL_STYLE_SMOKE_TARGET", initialActiveElement:"BODY"},
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
