import { isolateUtilityDomFromSearch, utilityDomScopeFromSearch, } from "./platform/utility-dom-isolation.js";
import { scopedUtilityModulePath } from "./platform/utility-bootstrap.js";
import { createUtilityStorage } from "./platform/utility-storage.js";
function scopedUtility(scope, module) {
    switch (scope.utilityId) {
        case "command-palette":
            return module.commandPaletteUtility;
        case "hotkeys":
            return module.hotkeysUtility;
        default:
            return module.dataLayerUtility;
    }
}
const search = globalThis.location.search;
const scope = utilityDomScopeFromSearch(search);
if (!scope) {
    await import("./side-panel.js");
}
else {
    const module = await import(scopedUtilityModulePath(scope));
    const utility = scopedUtility(scope, module);
    const root = document.querySelector("#side-panel-root");
    if (!root)
        throw new Error("Scoped utility host is missing");
    utility.lifecycle.mount(root, window);
    isolateUtilityDomFromSearch(document, search);
    if (scope.utilityId === "data-layer") {
        const { mountScopedDataLayerAdapter } = await import("./utilities/data-layer/layers/browser/scoped-runtime.js");
        const storage = createUtilityStorage(localStorage, utility.storage);
        mountScopedDataLayerAdapter(root, scope.panelIds, storage);
    }
    root.dataset.utilityShellReady = "true";
}
//# sourceMappingURL=side-panel-bootstrap.js.map