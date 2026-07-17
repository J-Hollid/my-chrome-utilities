function showEditor(root, editorSelector, focusSelector) {
    const editor = root.querySelector(editorSelector);
    if (editor)
        editor.hidden = false;
    root.querySelector(focusSelector)?.focus();
}
export function mountScopedDataLayerAdapter(root, panelIds) {
    const cleanups = [];
    const bind = (selector, listener) => {
        const element = root.querySelector(selector);
        if (!element)
            return;
        element.addEventListener("click", listener);
        cleanups.push(() => element.removeEventListener("click", listener));
    };
    if (panelIds.includes("data-layer-panel-library")) {
        bind("#add-new-event", () => showEditor(root, "#event-property-editor", "#event-template-name"));
    }
    if (panelIds.includes("data-layer-panel-schemas")) {
        bind("#create-schema", () => showEditor(root, "#schema-editor", "#schema-editor-name"));
    }
    return () => {
        for (const cleanup of cleanups)
            cleanup();
    };
}
//# sourceMappingURL=scoped-runtime.js.map