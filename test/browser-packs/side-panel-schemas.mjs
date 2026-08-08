import { runSidePanelPack } from "../support/side-panel-browser-entry.mjs";

await runSidePanelPack({
  owningPack:"schemas",
  moduleLoaders:{
    "schema-workspace":() => import("../support/side-panel-schema-workspace-targets.mjs"),
    "schema-guided":() => import("../support/side-panel-schema-guided-targets.mjs"),
    "schema-validation":() => import("../support/side-panel-schema-validation-targets.mjs"),
    "schema-documentation":() => import("../support/side-panel-schema-documentation-targets.mjs"),
  },
});
