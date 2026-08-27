import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { estimatePlanMilliseconds } from
  "../../scripts/verification-performance/report-throughput.mjs";

const unitTasks = [{ key:"unit:registry", stage:"unit" }, { key:"unit:ownership", stage:"unit" }];
const estimate = estimatePlanMilliseconds({
  preparationTasks:[], unitTasks, propertyTasks:[], browserTasks:[], observationTasks:[],
  parserTasks:[], generatorTasks:[], checkpointTasks:[], sessionTasks:[],
}, { tasks:{
  "unit:registry":{ samples:1, medianMs:1200 },
  "unit:ownership":{ samples:1, medianMs:800 },
} });
assert.ok(Number.isFinite(estimate) && estimate >= 0,
  "timing policy returns a finite critical-path estimate for boundary tasks");

const scorecard = JSON.parse(await readFile(
  new URL("../../verification/vtd012-adoption-scorecard.json", import.meta.url), "utf8"));
assert.equal(scorecard.version, 3);
assert.deepEqual(scorecard.reconstruction, {
  sourcePatchReference:"962affc8c2fb281036a221020910a503ed96bb6b",
  repairedQaBase:"db157699df9cecde5b323b0efafe2d43a5c250a7",
  integratedRepairCandidate:"bb8d05ae64a1d1484cd45c0509eccf79394cc5ae",
  excludedRepairPatchReferences:[
    "15f110217b36c7f79c674d3b07f75c55b0e5e7a7",
    "31fc1b814f8f73a0297c01efd8be6af6b44f48a6",
    "1bb4ae05e367aba92105088cfb622570e620faff",
    "bdfab2fa4fdb4a9f72aa1032db95ed202db43342",
  ],
  carriedQaRepairAssertions:[
    "6f9411dac1ffeed47f5811e5758e8f0694e36bde",
    "2b4e7df2a302ac50170bbf65c75bb5494f9d1a86",
  ],
  rule:"Port only the conserved VTD-012 product remainder onto the repaired QA base; preserve integrated repair behavior and do not inherit stopped ancestry.",
}, "the adoption scorecard binds the repaired-base reconstruction and excluded repair ancestry");
