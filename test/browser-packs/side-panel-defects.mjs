import { runSidePanelPack } from "../support/side-panel-browser-entry.mjs";

await runSidePanelPack({
  owningPack:"defects",
  moduleLoaders:{ defects:() => import("../support/side-panel-defect-targets.mjs") },
});
