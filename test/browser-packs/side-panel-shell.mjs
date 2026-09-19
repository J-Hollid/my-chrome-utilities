import { runSidePanelPack } from "../support/side-panel-browser-entry.mjs";
import { installedOrderPairs } from "../support/side-panel-browser-installed-order-regression.mjs";
import { timeoutIncidentDigest as digest } from "../../scripts/verification-reliability-values.mjs";

if (JSON.stringify(installedOrderPairs.shell) !== JSON.stringify([
  "SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER",
  "WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER",
])) throw new Error("Shell installed-order regression pair does not match its registered batch");

await runSidePanelPack({
  owningPack:"shell",
  moduleLoaders:{ shell:() => import("../support/side-panel-shell-targets.mjs") },
});

const raw=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION;
const context=raw?JSON.parse(raw):null;
if(context?.causalCategory==='other:hidden-panel-stale-focus') {
  const preRepair={hiddenControlReportedFocusable:true};
  const repair={hiddenControlReportedFocusable:false};
  const fixture={id:'hidden-panel-stale-focus-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{panelDisplay:'none',priorActiveElementInsidePanel:true},
    expectedPreRepairFailure:preRepair,expectedRepairResult:repair};
  const fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:preRepair},
    repairResult:{status:'passed',fixtureDigest,observed:repair}}}));
}
