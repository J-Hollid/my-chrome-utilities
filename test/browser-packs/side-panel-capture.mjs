import { runSidePanelPack } from "../support/side-panel-browser-entry.mjs";

await runSidePanelPack({
  owningPack:"capture",
  moduleLoaders:{ capture:() => import("../support/side-panel-capture-targets.mjs") },
});
