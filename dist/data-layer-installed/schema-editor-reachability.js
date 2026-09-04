function installReachabilityStylesheet(panel) {
    const document = panel?.ownerDocument;
    if (!document?.head || document.querySelector("link[data-schema-editor-reachability-style]"))
        return;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "/side-panel-schema-editor-reachability.css";
    stylesheet.dataset.schemaEditorReachabilityStyle = "true";
    document.head.append(stylesheet);
}
export function createSchemaEditorReachability({ panel, scrollOwner, scheduleFrame }) {
    installReachabilityStylesheet(panel);
    let trigger;
    let referenceKey;
    let treeScrollTop;
    const handleEditorKeydown = (event) => {
        if (event.key !== "PageDown" || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
            panel?.dataset.schemaEditorRoute !== "active")
            return;
        const detail = panel.querySelector("#schema-detail");
        if (!detail)
            return;
        detail.scrollBy({ top: Math.max(1, Math.floor(detail.clientHeight * 0.85)), behavior: "auto" });
        event.preventDefault();
    };
    panel?.addEventListener("keydown", handleEditorKeydown);
    return {
        open(nextTrigger, nextReferenceKey) {
            if (treeScrollTop === undefined)
                treeScrollTop = scrollOwner?.scrollTop ?? 0;
            trigger = nextTrigger ?? trigger;
            referenceKey = nextReferenceKey ?? referenceKey;
            if (panel)
                panel.dataset.schemaEditorRoute = "active";
            if (scrollOwner)
                scrollOwner.scrollTop = 0;
        },
        close(resolveReference) {
            const restoreTrigger = trigger;
            const restoreReferenceKey = referenceKey;
            const restoreScrollTop = treeScrollTop;
            if (panel)
                delete panel.dataset.schemaEditorRoute;
            trigger = undefined;
            referenceKey = undefined;
            treeScrollTop = undefined;
            scheduleFrame(() => {
                if (scrollOwner && restoreScrollTop !== undefined)
                    scrollOwner.scrollTop = restoreScrollTop;
                (restoreReferenceKey ? resolveReference(restoreReferenceKey) : restoreTrigger)?.focus({ preventScroll: true });
            });
        },
        reset() {
            panel?.removeEventListener("keydown", handleEditorKeydown);
            if (panel)
                delete panel.dataset.schemaEditorRoute;
            trigger = undefined;
            referenceKey = undefined;
            treeScrollTop = undefined;
        },
    };
}
//# sourceMappingURL=schema-editor-reachability.js.map