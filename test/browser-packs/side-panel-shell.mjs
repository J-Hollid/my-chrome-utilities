import { runSidePanelPack } from "../support/side-panel-browser-entry.mjs";
import { installedOrderPairs } from "../support/side-panel-browser-installed-order-regression.mjs";

if (JSON.stringify(installedOrderPairs.shell) !== JSON.stringify([
  "SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER",
  "WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER",
])) throw new Error("Shell installed-order regression pair does not match its registered batch");

await runSidePanelPack({
  owningPack:"shell",
  moduleLoaders:{ shell:() => import("../support/side-panel-shell-targets.mjs") },
});
