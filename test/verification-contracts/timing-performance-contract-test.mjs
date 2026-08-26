import assert from "node:assert/strict";

import { estimatePlanMilliseconds } from
  "../../scripts/report-verification-throughput.mjs";
import { verificationPolicySelectionSummary } from
  "../../scripts/verification-performance/policy-avoidance.mjs";

const unitTasks = [
  { key:"unit:registry", stage:"unit" },
  { key:"unit:ownership", stage:"unit" },
];
const estimate = estimatePlanMilliseconds({
  preparationTasks:[], unitTasks, propertyTasks:[], browserTasks:[], observationTasks:[],
  parserTasks:[], generatorTasks:[], checkpointTasks:[], sessionTasks:[],
}, { tasks:{
  "unit:registry":{ samples:1, medianMs:1200 },
  "unit:ownership":{ samples:1, medianMs:800 },
} });
assert.ok(Number.isFinite(estimate) && estimate >= 0,
  "timing policy returns a finite critical-path estimate for boundary tasks");

const productOnly = verificationPolicySelectionSummary({
  selectedPackIds:["shell"], tasks:[{ key:"unit:test/shell.mjs" }],
});
assert.equal(productOnly.selectedTasks.length, 0,
  "product-only plans report zero selected policy tasks");
assert.equal(productOnly.avoidedTasks.length, 9,
  "product-only plans report every avoided boundary contract");
assert.deepEqual(productOnly.comparableHistoricalDuration, {
  task:"unit:test/verification-process-contract-test.mjs",
  durationMs:181447,
  environmentClass:"accepted comparable normal-load receipt",
  baselineCommit:"fc552224f290a39dbbd6e27a27f6c3c336b3d2e9",
}, "avoided work retains the accepted comparable umbrella duration");
