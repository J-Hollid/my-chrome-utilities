export function mountScopedDataLayerAdapter(root, panelIds) {
    const cleanups = [];
    const bind = (selector, listener) => { const element = root.querySelector(selector); if (!element)
        return; element.addEventListener("click", listener); cleanups.push(() => element.removeEventListener("click", listener)); };
    if (panelIds.includes("data-layer-panel-library"))
        bind("#add-new-event", () => { const editor = root.querySelector("#event-property-editor"); if (editor)
            editor.hidden = false; root.querySelector("#event-template-name")?.focus(); });
    if (panelIds.includes("data-layer-panel-schemas"))
        bind("#create-schema", () => { const editor = root.querySelector("#schema-editor"); if (editor)
            editor.hidden = false; root.querySelector("#schema-editor-name")?.focus(); });
    return () => { for (const cleanup of cleanups)
        cleanup(); };
}
//# sourceMappingURL=scoped-runtime.js.map