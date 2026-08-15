import { installFlowConceptVisualViewerInput } from "./concept-visual-viewer-input.js";
import { FLOW_CONCEPT_VISUAL_MAX_VIEWER_SCALE, clampedFlowConceptVisualViewerState, flowConceptVisualFitScale, flowConceptVisualPan, flowConceptVisualViewerPanLimit, flowConceptVisualZoomAt } from "./concept-visual-viewer-state.js";
export { FLOW_CONCEPT_VISUAL_MAX_VIEWER_SCALE, flowConceptVisualFitScale, flowConceptVisualPan, flowConceptVisualZoomAt };
const viewerButton = (label, action) => { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.addEventListener("click", action); return button; };
const addViewerMetadata = (metadata, term, text) => { if (!text)
    return; const dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = term; dd.textContent = text; metadata.append(dt, dd); };
export function openFlowConceptVisualViewer(value, invoker, fallbackInvoker) {
    const dialog = document.createElement("dialog"), header = document.createElement("header"), heading = document.createElement("h3"), viewport = document.createElement("div"), image = document.createElement("img"), description = document.createElement("p"), metadata = document.createElement("dl"), controls = document.createElement("section"), panControls = document.createElement("section"), status = document.createElement("output"), announcer = document.createElement("p"), close = document.createElement("button");
    let state = { scale: 1, x: 0, y: 0 };
    dialog.className = "flow-concept-visual-viewer";
    dialog.setAttribute("aria-label", "Concept Visual viewer");
    heading.textContent = value.attachment.caption ?? "Concept visual";
    close.type = "button";
    close.textContent = "Close";
    header.append(heading, close);
    viewport.dataset.flowVisualViewport = "true";
    viewport.setAttribute("aria-label", "Concept Visual image canvas");
    viewport.tabIndex = 0;
    image.src = value.raster.bytes;
    image.alt = value.attachment.description;
    viewport.append(image);
    description.className = "flow-concept-visual-description";
    description.textContent = value.attachment.description;
    addViewerMetadata(metadata, "Caption", value.attachment.caption);
    addViewerMetadata(metadata, "Source reference", value.attachment.sourceReference);
    const geometry = () => ({ raster: value.raster, viewport: { width: viewport.clientWidth, height: viewport.clientHeight } });
    let fit, actual, zoomIn, zoomOut, panUp, panDown, panLeft, panRight;
    const apply = () => { const { viewport: box } = geometry(); state = clampedFlowConceptVisualViewerState(geometry(), state); const limits = flowConceptVisualViewerPanLimit(geometry(), state.scale); image.style.width = `${value.raster.width * state.scale}px`; image.style.height = `${value.raster.height * state.scale}px`; image.style.left = `${(box.width - value.raster.width * state.scale) / 2 + state.x}px`; image.style.top = `${(box.height - value.raster.height * state.scale) / 2 + state.y}px`; const fitValue = flowConceptVisualFitScale(value.raster, box); viewport.dataset.viewMode = Math.abs(state.scale - fitValue) < .0001 ? "fit" : Math.abs(state.scale - 1) < .0001 ? "actual" : "zoom"; viewport.dataset.zoom = String(state.scale); viewport.dataset.panX = String(state.x); viewport.dataset.panY = String(state.y); status.value = `${Math.round(state.scale * 100)}%`; announcer.textContent = `Visual at ${status.value}; horizontal pan ${Math.round(state.x)}, vertical pan ${Math.round(state.y)}.`; fit.disabled = Math.abs(state.scale - fitValue) < .0001 && state.x === 0 && state.y === 0; actual.disabled = Math.abs(state.scale - 1) < .0001 && state.x === 0 && state.y === 0; zoomOut.disabled = state.scale <= fitValue + .0001; zoomIn.disabled = state.scale >= FLOW_CONCEPT_VISUAL_MAX_VIEWER_SCALE - .0001; panLeft.disabled = limits.x === 0 || state.x >= limits.x; panRight.disabled = limits.x === 0 || state.x <= -limits.x; panUp.disabled = limits.y === 0 || state.y >= limits.y; panDown.disabled = limits.y === 0 || state.y <= -limits.y; };
    const update = (next) => { state = next; apply(); }, center = () => ({ x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 }), zoomTo = (scale) => update(flowConceptVisualZoomAt({ ...geometry(), state }, scale, center())), pan = (x, y) => update(flowConceptVisualPan({ ...geometry(), state }, { x, y }));
    fit = viewerButton("Fit", () => update({ scale: flowConceptVisualFitScale(value.raster, geometry().viewport), x: 0, y: 0 }));
    actual = viewerButton("100 percent", () => update({ scale: 1, x: 0, y: 0 }));
    zoomOut = viewerButton("Zoom out", () => zoomTo(state.scale / 1.25));
    zoomIn = viewerButton("Zoom in", () => zoomTo(state.scale * 1.25));
    panUp = viewerButton("Pan up", () => pan(0, 80));
    panDown = viewerButton("Pan down", () => pan(0, -80));
    panLeft = viewerButton("Pan left", () => pan(80, 0));
    panRight = viewerButton("Pan right", () => pan(-80, 0));
    status.setAttribute("aria-label", "Current scale");
    announcer.setAttribute("role", "status");
    announcer.className = "flow-concept-visual-status";
    controls.setAttribute("aria-label", "Visual size and zoom controls");
    controls.append(fit, actual, zoomOut, status, zoomIn);
    panControls.setAttribute("aria-label", "Visual pan controls");
    panControls.append(panUp, panDown, panLeft, panRight);
    dialog.append(header, controls, viewport, description, metadata, panControls, announcer);
    document.body.append(dialog);
    const background = Array.from(document.body.children).filter((element) => element !== dialog && element instanceof HTMLElement).map(element => ({ element, inert: element.inert }));
    for (const { element } of background)
        element.inert = true;
    const suppressBackgroundActivation = (event) => { if (event.target instanceof Node && !dialog.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
    } };
    document.addEventListener("click", suppressBackgroundActivation, true);
    let finished = false, resizeObserver;
    const finish = () => { if (finished)
        return; finished = true; resizeObserver?.disconnect(); document.removeEventListener("click", suppressBackgroundActivation, true); for (const { element, inert } of background)
        element.inert = inert; dialog.close(); dialog.remove(); (invoker.isConnected ? invoker : fallbackInvoker)?.focus({ preventScroll: true }); };
    close.addEventListener("click", finish);
    dialog.addEventListener("cancel", event => { event.preventDefault(); finish(); });
    let backdropPointer;
    dialog.addEventListener("pointerdown", event => { backdropPointer = event.target === dialog ? event.pointerId : undefined; });
    dialog.addEventListener("pointerup", event => { if (event.target === dialog && event.pointerId === backdropPointer)
        finish(); backdropPointer = undefined; });
    dialog.addEventListener("pointercancel", () => { backdropPointer = undefined; });
    installFlowConceptVisualViewerInput({ dialog, viewport, controls: { fit, actual, panLeft, panRight, panUp, panDown }, finish, geometry, state: () => state, update });
    resizeObserver = new ResizeObserver(() => { const fitValue = flowConceptVisualFitScale(value.raster, geometry().viewport); if (viewport.dataset.viewMode === "fit")
        state = { scale: fitValue, x: 0, y: 0 }; apply(); });
    resizeObserver.observe(viewport);
    dialog.showModal();
    state = { scale: flowConceptVisualFitScale(value.raster, geometry().viewport), x: 0, y: 0 };
    apply();
    close.focus();
}
//# sourceMappingURL=concept-visual-viewer-ui.js.map