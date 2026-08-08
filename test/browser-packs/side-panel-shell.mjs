import { runSidePanelPack } from "../support/side-panel-browser-entry.mjs";

await runSidePanelPack({
  owningPack:"shell",
  moduleLoaders:{ shell:() => import("../support/side-panel-shell-targets.mjs") },
});
