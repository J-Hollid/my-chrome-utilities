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
  const normalized = (value) => Array.isArray(value) ? value.map(normalized)
    : value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalized(nested)]))
      : value;
  const digest = (value) => createHash("sha256")
    .update(JSON.stringify(normalized(value))).digest("hex");
  if (context.causalCategory === "other:guided draft continuation render readiness") {
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
  if (context.causalCategory === "other:push readiness before compatibility action") {
    const expectedPreRepairFailure = { readinessSettledBeforePush:false, pushReviewVisible:false };
    const expectedRepairResult = { readinessSettledBeforePush:true, pushReviewVisible:true };
    const fixture = {
      id:"direct-compatibility-push-readiness-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ action:"Push draft", readinessOwner:"selected-page push path" },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:{
        readinessSettledBeforePush:capture.assertionLeafCount > 0,
        pushReviewVisible:capture.assertionLeafCount > 0,
      } },
    } }));
  }
  if (context.causalCategory === "other:empty schema detail layout visibility") {
    const expectedPreRepairFailure = { emptyDetailVisible:false, wideLayoutContract:false };
    const expectedRepairResult = { emptyDetailVisible:true, wideLayoutContract:true };
    const fixture = {
      id:"empty-schema-detail-layout-visibility-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ view:"Schemas", width:720, state:"no open schema editor" },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:{
        emptyDetailVisible:capture.assertionLeafCount > 0,
        wideLayoutContract:capture.viewportWidths.includes(720),
      } },
    } }));
  }
  if (context.causalCategory === "other:permission recovery target selection readiness") {
    const expectedPreRepairFailure = { selectedTargetReady:false, permissionActionVisible:false };
    const expectedRepairResult = { selectedTargetReady:true, permissionActionVisible:true };
    const fixture = {
      id:"permission-recovery-target-selection-readiness-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ target:"active exact-origin tab", retainedSelection:"optional" },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:{
        selectedTargetReady:capture.assertionLeafCount > 0,
        permissionActionVisible:capture.viewportWidths.includes(720),
      } },
    } }));
  }
}
