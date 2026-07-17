import { mountScopedDefectWorkflow } from "./scoped/defect-runtime.js";
import { mountScopedEventLibraryWorkflow } from "./scoped/event-library-runtime.js";
import { mountScopedSchemaWorkflow } from "./scoped/schema-runtime.js";
import { showScopedEditor } from "./scoped/runtime-support.js";
function bindClicks(root, cleanups) {
    return (selector, listener) => {
        const element = root.querySelector(selector);
        if (!element)
            return;
        element.addEventListener("click", listener);
        cleanups.push(() => element.removeEventListener("click", listener));
    };
}
export function mountScopedDataLayerAdapter(root, panelIds, storage) {
    const cleanups = [];
    const bind = bindClicks(root, cleanups);
    if (panelIds.includes("data-layer-panel-library")) {
        mountScopedEventLibraryWorkflow(root, storage, bind);
    }
    if (panelIds.includes("data-layer-panel-schemas")) {
        bind("#create-schema", () => showScopedEditor(root, "#schema-editor", "#schema-editor-name"));
        mountScopedSchemaWorkflow(root, storage, bind);
    }
    if (panelIds.includes("data-layer-panel-defects")) {
        mountScopedDefectWorkflow(root, storage, cleanups);
    }
    return () => {
        for (const cleanup of cleanups)
            cleanup();
    };
}
//# sourceMappingURL=scoped-runtime.js.map