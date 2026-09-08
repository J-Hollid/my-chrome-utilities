import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import vm from "node:vm";
import {timeoutIncidentDigest as digest} from "../../scripts/verification-reliability-values.mjs";

export const installedSchemaDirectOwners = [
  "test/data-layer-installed/schemas-composition-test.mjs",
  "test/data-layer-installed/schemas/assignment-controller-test.mjs",
  "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
  "test/data-layer-installed/schemas/editor-route-controller-test.mjs",
  "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
  "test/data-layer-installed/schemas/library-controller-test.mjs",
  "test/data-layer-installed/schemas/library-public-operations-test.mjs",
  "test/data-layer-installed/schemas/library-policy-test.mjs",
  "test/data-layer-installed/schemas/retired-controller-assertion-inventory-test.mjs",
  "test/data-layer-installed/schemas/source-controller-test.mjs",
  "test/data-layer-installed/schemas/library-import-workflow-test.mjs",
  "test/data-layer-installed/schemas/library-deletion-workflow-test.mjs",
  "test/data-layer-installed/schemas/library-export-workflow-test.mjs",
  "test/data-layer-installed/schemas/lifecycle-test.mjs",
  "test/data-layer-installed/schemas/property-controller-test.mjs",
  "test/data-layer-installed/schemas/project-hydration-test.mjs",
  "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
  "test/data-layer-installed/schemas/canonical-persistence-workflow-test.mjs",
  "test/data-layer-installed/schemas/rule-attachment-workflow-test.mjs",
  "test/data-layer-installed/schemas/rule-promotion-workflow-test.mjs",
  "test/data-layer-installed/schemas/property-rule-assignment-factory-test.mjs",
  "test/data-layer-installed/schemas/canonical-guided-validation-factory-test.mjs",
  "test/data-layer-installed/schemas/library-editor-relationship-factory-test.mjs",
  "test/data-layer-installed/schemas/library-editor-test.mjs",
  "test/data-layer-installed/schemas/property-rule-workflow-test.mjs",
  "test/data-layer-installed/schemas/property-view-test.mjs",
  "test/data-layer-installed/schemas/relationship-tree-controller-test.mjs",
  "test/data-layer-installed/schemas/rule-controller-test.mjs",
  "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
  "test/data-layer-installed/schemas/validation-controller-test.mjs",
];

const wheelUnit = "test/side-panel-schema-wheel-observation-test.mjs";
export const isSchemaWheelUnit = path => path === wheelUnit;

export function schemaWheelTaskCount(tasks) {
  const count = tasks.filter(({key}) => key === `unit:${wheelUnit}`).length;
  assert.equal(count, 1, "The approved wheel regression is registered exactly once");
  return count;
}

export function verifySchemaWheelConservationRegression() {
  const source = execFileSync("git", ["show",
    "9258f4f1:test/verification-contracts/ownership-schemas-contract-test.mjs"],
  {encoding: "utf8", maxBuffer: 200_000});
  const start = source.indexOf("const schemasEvidenceProfile =");
  const end = source.indexOf("assert.deepEqual(schemasEvidenceProfile", start);
  assert.ok(start >= 0 && end > start);
  const retained = "test/retained-schema-fixture-test.mjs";
  const current = {unit: [retained, wheelUnit], property: ["retained-property"]};
  const prior = vm.runInNewContext(`${source.slice(start, end)}; schemasEvidenceProfile;`, {
    currentSchemasEvidenceProfile: current, installedSchemaDirectOwnerSet: new Set(),
    approvedSchemaContextExportTaskKeys: new Set(),
  });
  const projected = {...current, unit: current.unit.filter(path => !isSchemaWheelUnit(path))};
  assert.deepEqual([...prior.unit], [retained, wheelUnit],
    "The actual failed projection includes the new regression in the historical profile");
  assert.deepEqual(projected, {unit: [retained], property: ["retained-property"]});
  assert.equal(schemaWheelTaskCount([{key: `unit:${wheelUnit}`}]), 1);
  assert.throws(() => schemaWheelTaskCount([]), /exactly once/);
  assert.throws(() => schemaWheelTaskCount(Array(2).fill({key: `unit:${wheelUnit}`})), /exactly once/);
  assert.equal(isSchemaWheelUnit("test/unapproved-addition.mjs"), false,
    "An unknown addition cannot be removed from the historical comparison");
  const context = process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
    ? JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) : undefined;
  if (context?.causalCategory !== "other:schema wheel regression conservation") return;
  const before = {unexpectedUnits: [...prior.unit].filter(path => path !== retained)};
  const after = {unexpectedUnits: projected.unit.filter(path => path !== retained)};
  const fixture = {id: "schema-wheel-historical-owner-projection",
    causalCategory: context.causalCategory,
    diagnosedBoundaryDigest: digest(context.diagnosedBoundary),
    input: {failedCommit: "9258f4f1", sourceDigest: digest(source), addedUnit: wheelUnit},
    expectedPreRepairFailure: {unexpectedUnits: [wheelUnit]},
    expectedRepairResult: {unexpectedUnits: []}};
  const fixtureDigest = digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression: {version: 2,
    incidentId: context.incidentId, failureDigest: context.failureDigest, fixture,
    preRepairResult: {status: "failed", fixtureDigest, observed: before},
    repairResult: {status: "passed", fixtureDigest, observed: after}}}));
}
