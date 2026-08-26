import assert from "node:assert/strict";

import { estimatePlanMilliseconds } from
  "../../scripts/report-verification-throughput.mjs";

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
