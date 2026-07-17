import {
  isolateUtilityDomFromSearch,
  utilityDomScopeFromSearch,
  type UtilityDomScope,
} from "./platform/utility-dom-isolation.js";
import { scopedUtilityModulePath } from "./platform/utility-bootstrap.js";
import type { UtilityModuleEntry } from "./platform/utility-contract.js";
import { createUtilityStorage } from "./platform/utility-storage.js";

function scopedUtility(
  scope: UtilityDomScope,
  module: Record<string, unknown>,
): UtilityModuleEntry {
  switch (scope.utilityId) {
    case "command-palette":
      return module.commandPaletteUtility as UtilityModuleEntry;
    case "hotkeys":
      return module.hotkeysUtility as UtilityModuleEntry;
    default:
      return module.dataLayerUtility as UtilityModuleEntry;
  }
}

const search = globalThis.location.search;
const scope = utilityDomScopeFromSearch(search);
if (!scope) {
  await import("./side-panel.js");
} else {
  const module = await import(scopedUtilityModulePath(scope)) as Record<string, unknown>;
  const utility = scopedUtility(scope, module);
  const root = document.querySelector<HTMLElement>("#side-panel-root");
  if (!root) throw new Error("Scoped utility host is missing");

  utility.lifecycle.mount(root, window);
  isolateUtilityDomFromSearch(document, search);
  if (scope.utilityId === "data-layer") {
    const { mountScopedDataLayerAdapter } = await import(
      "./utilities/data-layer/layers/browser/scoped-runtime.js"
    );
    const storage = createUtilityStorage(localStorage, utility.storage);
    mountScopedDataLayerAdapter(root, scope.panelIds, storage);
  }
  root.dataset.utilityShellReady = "true";
}
