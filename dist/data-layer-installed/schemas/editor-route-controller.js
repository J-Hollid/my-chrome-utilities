export function createSchemaEditorRouteController(ports) {
    let mounted = false;
    let trigger;
    let referenceKey;
    let treeScrollTop;
    const handleEditorKeydown = (event) => {
        if (event.key !== "PageDown" || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
            ports.panel?.dataset.schemaEditorRoute !== "active")
            return;
        const detail = ports.panel.querySelector("#schema-detail");
        if (!detail)
            return;
        detail.scrollBy({ top: Math.max(1, Math.floor(detail.clientHeight * 0.85)), behavior: "auto" });
        event.preventDefault();
    };
    return {
        mount() {
            if (mounted)
                return;
            mounted = true;
            ports.panel?.addEventListener("keydown", handleEditorKeydown);
        },
        dispose() {
            if (!mounted)
                return;
            mounted = false;
            ports.panel?.removeEventListener("keydown", handleEditorKeydown);
            if (ports.panel)
                delete ports.panel.dataset.schemaEditorRoute;
            trigger = undefined;
            referenceKey = undefined;
            treeScrollTop = undefined;
        },
        open(nextTrigger, nextReferenceKey) {
            if (treeScrollTop === undefined)
                treeScrollTop = ports.scrollOwner?.scrollTop ?? 0;
            trigger = nextTrigger ?? trigger;
            referenceKey = nextReferenceKey ?? referenceKey;
            if (ports.panel)
                ports.panel.dataset.schemaEditorRoute = "active";
            if (ports.scrollOwner)
                ports.scrollOwner.scrollTop = 0;
        },
        close(resolveReference) {
            const restoreTrigger = trigger;
            const restoreReferenceKey = referenceKey;
            const restoreScrollTop = treeScrollTop;
            if (ports.panel)
                delete ports.panel.dataset.schemaEditorRoute;
            trigger = undefined;
            referenceKey = undefined;
            treeScrollTop = undefined;
            ports.scheduleFrame(() => {
                if (ports.scrollOwner && restoreScrollTop !== undefined)
                    ports.scrollOwner.scrollTop = restoreScrollTop;
                (restoreReferenceKey ? resolveReference(restoreReferenceKey) : restoreTrigger)?.focus({ preventScroll: true });
            });
        },
        invokingReference: () => referenceKey,
    };
}
//# sourceMappingURL=editor-route-controller.js.map