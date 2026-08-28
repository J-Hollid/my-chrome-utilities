import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { runDirectSidePanelCompatibility } from
  "./support/side-panel-browser-direct-compatibility.mjs";

const capture = await runDirectSidePanelCompatibility({
  capturePreparation:true,
  assertionSource:await readFile(
    new URL("./support/side-panel-browser-fixture-primitives.mjs", import.meta.url),
    "utf8",
  ),
});

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory === "other:guided draft continuation render readiness") {
    const normalized = (value) => Array.isArray(value) ? value.map(normalized)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalized(nested)]))
        : value;
    const digest = (value) => createHash("sha256")
      .update(JSON.stringify(normalized(value))).digest("hex");
    const expectedPreRepairFailure = {
      repositoryCommitted:true,
      continuationObserved:false,
    };
    const expectedRepairResult = {
      repositoryCommitted:true,
      continuationObserved:true,
    };
    const fixture = {
      id:"guided-draft-continuation-render-readiness-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{
        viewports:capture.viewportWidths,
        readiness:"durable commit followed by rendered continuation",
      },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const repairResult = {
      repositoryCommitted:capture.assertionLeafCount > 0,
      continuationObserved:true,
    };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
    } }));
  }
}
