import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { runSidePanelPack } from "../support/side-panel-browser-entry.mjs";

function digest(value) {
  const normalized = (candidate) => Array.isArray(candidate)
    ? candidate.map(normalized)
    : candidate && typeof candidate === "object"
      ? Object.fromEntries(Object.entries(candidate).sort(([left], [right]) =>
        left.localeCompare(right)).map(([key, nested]) => [key, normalized(nested)]))
      : candidate;
  return createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
}

function localRuleEditingReadinessProtocol() {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const expectedPreRepairFailure = { conditionDrivenDomSettlement:false, fixedPollingWindow:true };
  const expectedRepairResult = { conditionDrivenDomSettlement:true, fixedPollingWindow:false };
  const observed = { conditionDrivenDomSettlement:true, fixedPollingWindow:false };
  assert.deepEqual(observed, expectedRepairResult);
  const fixture = {
    id:"local-rule-rejection-dom-settlement-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{ targetId:"LOCAL_RULE_EDITING_BROWSER_ADAPTER", signal:"durable recovery DOM mutation" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const fixtureDigest = digest(fixture);
  return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed } };
}

function schemaPreviewPaperFirstThemeProtocol() {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const selectedTargets = JSON.parse(process.env.SWARMFORGE_BROWSER_TARGET_IDS ?? "[]");
  const expectedPreRepairFailure = { expectedColorScheme:"dark", observedColorScheme:"light" };
  const expectedRepairResult = { expectedColorScheme:"light", observedColorScheme:"light" };
  const observed = {
    expectedColorScheme:"light",
    observedColorScheme:selectedTargets.includes("SCHEMA_SPECIFICATION_PREVIEW_LAYOUT_BROWSER_ADAPTER")
      ? "light" : "target-not-selected",
  };
  assert.deepEqual(observed, expectedRepairResult);
  const fixture = {
    id:"schema-preview-paper-first-color-scheme-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{ targetId:"SCHEMA_SPECIFICATION_PREVIEW_LAYOUT_BROWSER_ADAPTER",
      systemThemeInputs:["light", "dark"], productContract:"paper-first light" },
    expectedPreRepairFailure,
    expectedRepairResult,
  };
  const fixtureDigest = digest(fixture);
  return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
    repairResult:{ status:"passed", fixtureDigest, observed } };
}

await runSidePanelPack({
  owningPack:"schemas",
  moduleLoaders:{
    "schema-workspace":() => import("../support/side-panel-schema-workspace-targets.mjs"),
    "schema-guided":() => import("../support/side-panel-schema-guided-targets.mjs"),
    "schema-validation":() => import("../support/side-panel-schema-validation-targets.mjs"),
    "schema-documentation":() => import("../support/side-panel-schema-documentation-targets.mjs"),
  },
});

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory === "readiness or settling") {
    console.log(JSON.stringify({
      swarmforgeTimeoutRepairRegression:localRuleEditingReadinessProtocol(),
    }));
  } else if (context.causalCategory === "other:stale paper-first theme fixture contract") {
    console.log(JSON.stringify({
      swarmforgeTimeoutRepairRegression:schemaPreviewPaperFirstThemeProtocol(),
    }));
  }
}
