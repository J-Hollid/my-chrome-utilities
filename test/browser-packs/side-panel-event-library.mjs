import { runSidePanelPack } from "../support/side-panel-browser-entry.mjs";

await runSidePanelPack({
  owningPack:"event-library",
  moduleLoaders:{
    "event-library":() => import("../support/side-panel-event-library-targets.mjs"),
  },
});
