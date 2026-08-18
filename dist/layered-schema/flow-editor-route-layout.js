const escapeSelector = (value) => globalThis.CSS?.escape(value) ??
    value.replaceAll(/[^a-zA-Z0-9_-]/gu, (character) => `\\${character}`);
export function createFlowEditorRouteLayout(options) {
    const open = () => {
        options.workspace.hidden = true;
        options.editorHost.scrollTop = 0;
        options.editorHost.hidden = false;
        options.editor.hidden = false;
    };
    const close = () => {
        options.editor.hidden = true;
        options.editorHost.hidden = true;
        options.workspace.hidden = false;
    };
    const depart = () => {
        close();
        options.editor.replaceChildren();
    };
    const captureReturn = (kind, idValue, originFocus) => {
        const pane = options.document.querySelector("#workspace-pane"), graph = options.document.querySelector('[aria-label="Interactive directional Flow canvas"]');
        if (!pane)
            return undefined;
        const escaped = escapeSelector(idValue), exampleSelector = kind === "page-frame"
            ? `[data-page-example-for="${escaped}"]`
            : kind === "occurrence" ? `[data-event-example-for="${escaped}"]` : undefined, example = exampleSelector ? options.document.querySelector(exampleSelector) : undefined, inline = originFocus?.closest('[aria-label="Selected Page instance inline actions"]'), originSelector = originFocus ? (inline
            ? '[aria-label="Selected Page instance inline actions"] [data-flow-schema-contribution="true"]'
            : kind === "page-frame" ? `[data-page-frame-id="${escaped}"] [data-flow-schema-contribution="true"]` : undefined)
            : undefined;
        return { scrollLeft: pane.scrollLeft, scrollTop: pane.scrollTop,
            viewBox: graph?.getAttribute("viewBox") ?? "",
            ...(example ? { expandedExample: { selector: exampleSelector, open: example.open } } : {}),
            ...(originSelector ? { originSelector } : {}) };
    };
    const restoreReturn = (saved, returnFocus) => {
        if (!saved)
            return;
        const apply = () => {
            const pane = options.document.querySelector("#workspace-pane"), graph = options.document.querySelector('[aria-label="Interactive directional Flow canvas"]');
            if (pane) {
                pane.scrollLeft = saved.scrollLeft;
                pane.scrollTop = saved.scrollTop;
            }
            if (saved.expandedExample) {
                const example = options.document.querySelector(saved.expandedExample.selector);
                if (example)
                    example.open = saved.expandedExample.open;
            }
            if (graph && saved.viewBox && graph.getAttribute("viewBox") !== saved.viewBox) {
                graph.setAttribute("viewBox", saved.viewBox);
            }
            const ownedFocus = saved.originSelector
                ? options.document.querySelector(saved.originSelector)
                : undefined, target = ownedFocus ?? (returnFocus?.isConnected ? returnFocus : undefined);
            target?.focus({ preventScroll: true });
        };
        apply();
        queueMicrotask(apply);
        setTimeout(apply, 0);
        setTimeout(apply, 50);
    };
    return { open, close, depart, captureReturn, restoreReturn };
}
//# sourceMappingURL=flow-editor-route-layout.js.map