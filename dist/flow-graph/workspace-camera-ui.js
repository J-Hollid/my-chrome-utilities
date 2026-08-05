import { cameraFromMinimapPoint, boundsAroundItems, fitFlowBounds, flowDetailLevel, panFlowCamera, zoomFlowCamera, } from "./workspace.js";
import { FLOW_PAGE_FRAME_SELECTOR, flowCanvasBounds, flowControl, renderedElementBounds, selectedCanvasItems } from "./workspace-dom.js";
export function flowPanStartAllowed(start) {
    if (start.authoringActive)
        return false;
    if (start.pointerType === "touch")
        return start.blank;
    if (start.spaceHeld)
        return start.button === 0;
    return start.blank && (start.button === 0 || start.button === 1);
}
const viewportSize = (viewport) => ({
    width: Math.max(240, viewport.clientWidth || 960),
    height: Math.max(240, viewport.clientHeight || 600),
});
export function installFlowCamera(options) {
    const { canvas, viewport } = options;
    const zoomValue = document.createElement("output");
    const minimap = document.createElement("aside");
    const minimapButton = document.createElement("button");
    const viewportIndicator = document.createElement("span");
    let spaceHeld = false;
    let drag;
    let suppressClick = false;
    const touches = new Map();
    let pinch;
    zoomValue.setAttribute("aria-label", "Flow zoom percentage");
    minimap.className = "flow-minimap";
    minimap.setAttribute("aria-label", "Flow minimap");
    minimapButton.type = "button";
    minimapButton.setAttribute("aria-label", "Navigate complete Flow bounds");
    viewportIndicator.className = "flow-minimap-viewport";
    minimapButton.append(viewportIndicator);
    minimap.append(minimapButton);
    const updateMinimap = (camera) => {
        const bounds = flowCanvasBounds(canvas), size = viewportSize(viewport);
        const left = (camera.x - bounds.x) / Math.max(1, bounds.width);
        const top = (camera.y - bounds.y) / Math.max(1, bounds.height);
        const width = size.width / camera.zoom / Math.max(1, bounds.width);
        const height = size.height / camera.zoom / Math.max(1, bounds.height);
        Object.assign(viewportIndicator.style, {
            left: `${Math.max(0, Math.min(1, left)) * 100}%`,
            top: `${Math.max(0, Math.min(1, top)) * 100}%`,
            width: `${Math.max(4, Math.min(1, width) * 100)}%`,
            height: `${Math.max(4, Math.min(1, height) * 100)}%`,
        });
    };
    const apply = (camera) => {
        options.save(camera);
        const size = viewportSize(viewport);
        canvas.setAttribute("viewBox", `${camera.x} ${camera.y} ${size.width / camera.zoom} ${size.height / camera.zoom}`);
        canvas.dataset.viewport = JSON.stringify(camera);
        canvas.dataset.semanticDetail = flowDetailLevel(camera.zoom);
        zoomValue.textContent = `${Math.round(camera.zoom * 100)}%`;
        updateMinimap(camera);
    };
    const anchorAtCenter = () => {
        const size = viewportSize(viewport);
        return { x: size.width / 2, y: size.height / 2 };
    };
    const zoom = (factor) => apply(zoomFlowCamera(options.camera(), factor, anchorAtCenter()));
    const fit = (selector, padding = 24) => {
        const target = selector ? canvas.querySelector(selector) : undefined;
        const bounds = target ? renderedElementBounds(target) : flowCanvasBounds(canvas);
        if (bounds)
            apply(fitFlowBounds(bounds, viewportSize(viewport), padding));
    };
    const reveal = (target) => {
        const bounds = renderedElementBounds(target);
        if (bounds)
            apply(fitFlowBounds(bounds, viewportSize(viewport), 100));
        target.focus({ preventScroll: true });
    };
    canvas.addEventListener("flow-reveal-item", (event) => {
        const selector = event.detail?.selector;
        const target = selector ? canvas.querySelector(selector) : undefined;
        if (target)
            reveal(target);
    });
    const zoomOut = flowControl("Zoom out", () => zoom(.8));
    const zoomIn = flowControl("Zoom in", () => zoom(1.25));
    const actual = flowControl("100 percent", () => apply({ ...options.camera(), zoom: 1 }));
    const fitFlow = flowControl("Fit Flow", () => fit());
    const fitSelection = flowControl("Fit selection", () => {
        const selectedBounds = selectedCanvasItems(canvas, FLOW_PAGE_FRAME_SELECTOR).flatMap((item) => {
            const bounds = renderedElementBounds(item);
            return bounds ? [bounds] : [];
        });
        if (selectedBounds.length)
            apply(fitFlowBounds(boundsAroundItems(selectedBounds, 0), viewportSize(viewport), 24));
    });
    minimapButton.addEventListener("click", (event) => {
        const rect = minimapButton.getBoundingClientRect();
        if (!rect.width || !rect.height)
            return;
        const point = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
        apply(cameraFromMinimapPoint(flowCanvasBounds(canvas), viewportSize(viewport), point, options.camera().zoom));
    });
    minimapButton.addEventListener("keydown", (event) => {
        const deltas = {
            ArrowLeft: { x: -.1, y: 0 }, ArrowRight: { x: .1, y: 0 },
            ArrowUp: { x: 0, y: -.1 }, ArrowDown: { x: 0, y: .1 },
        };
        const delta = deltas[event.key];
        if (!delta)
            return;
        event.preventDefault();
        const bounds = flowCanvasBounds(canvas), camera = options.camera();
        apply({ ...camera, x: camera.x + bounds.width * delta.x, y: camera.y + bounds.height * delta.y });
    });
    const keyboardPan = (event) => {
        if (event.key === " ") {
            if (!event.target.closest("input,textarea,select,button")) {
                event.preventDefault();
                spaceHeld = true;
            }
            return;
        }
        if (event.target !== viewport && event.target !== canvas)
            return;
        const deltas = {
            ArrowLeft: { x: -20, y: 0 }, ArrowRight: { x: 20, y: 0 },
            ArrowUp: { x: 0, y: -20 }, ArrowDown: { x: 0, y: 20 },
        };
        const delta = deltas[event.key];
        if (!delta)
            return;
        event.preventDefault();
        apply(panFlowCamera(options.camera(), delta));
    };
    viewport.addEventListener("keydown", keyboardPan);
    viewport.addEventListener("keyup", (event) => { if (event.key === " ")
        spaceHeld = false; });
    viewport.addEventListener("blur", () => { spaceHeld = false; }, true);
    const touchDistance = () => {
        const points = [...touches.values()];
        if (points.length < 2)
            return undefined;
        const first = points[0], second = points[1];
        return {
            distance: Math.hypot(second.x - first.x, second.y - first.y),
            center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
        };
    };
    viewport.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "touch")
            touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const touchPair = touchDistance();
        if (touchPair) {
            pinch = { ...touchPair, camera: options.camera() };
            drag = undefined;
            return;
        }
        const blank = event.target === canvas || event.target === viewport;
        const authoringActive = viewport.classList.contains("is-connecting") || canvas.classList.contains("is-drawing-section");
        if (!flowPanStartAllowed({ blank, spaceHeld, button: event.button, pointerType: event.pointerType, authoringActive }))
            return;
        event.preventDefault();
        event.stopPropagation();
        drag = { pointerId: event.pointerId, client: { x: event.clientX, y: event.clientY }, camera: options.camera() };
        try {
            viewport.setPointerCapture(event.pointerId);
        }
        catch { /* Synthetic pointers have no active device to capture. */ }
    }, true);
    viewport.addEventListener("pointermove", (event) => {
        if (touches.has(event.pointerId))
            touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const touchPair = touchDistance();
        if (pinch && touchPair) {
            const rect = viewport.getBoundingClientRect();
            const anchor = { x: touchPair.center.x - rect.left, y: touchPair.center.y - rect.top };
            apply(zoomFlowCamera(pinch.camera, touchPair.distance / Math.max(1, pinch.distance), anchor));
            return;
        }
        if (!drag || drag.pointerId !== event.pointerId)
            return;
        const delta = { x: event.clientX - drag.client.x, y: event.clientY - drag.client.y };
        event.preventDefault();
        event.stopPropagation();
        if (delta.x || delta.y)
            suppressClick = true;
        apply(panFlowCamera(drag.camera, delta));
    }, true);
    const finishPointer = (event) => {
        touches.delete(event.pointerId);
        if (drag?.pointerId === event.pointerId) {
            event.preventDefault();
            event.stopPropagation();
            drag = undefined;
            if (viewport.hasPointerCapture(event.pointerId))
                viewport.releasePointerCapture(event.pointerId);
            queueMicrotask(() => { suppressClick = false; });
        }
        if (touches.size < 2)
            pinch = undefined;
    };
    viewport.addEventListener("pointerup", finishPointer, true);
    viewport.addEventListener("pointercancel", finishPointer, true);
    viewport.addEventListener("click", (event) => {
        if (!suppressClick)
            return;
        suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
    }, true);
    viewport.addEventListener("wheel", (event) => {
        if (!event.ctrlKey && !event.metaKey)
            return;
        event.preventDefault();
        const rect = viewport.getBoundingClientRect();
        apply(zoomFlowCamera(options.camera(), event.deltaY < 0 ? 1.1 : .9, { x: event.clientX - rect.left, y: event.clientY - rect.top }));
    }, { passive: false });
    return {
        controls: [zoomOut, zoomValue, zoomIn, actual, fitFlow, fitSelection],
        minimap,
        apply,
        fitFlow() { fit(); },
        reveal,
        setMinimapVisible(visible) { minimap.hidden = !visible; updateMinimap(options.camera()); },
    };
}
//# sourceMappingURL=workspace-camera-ui.js.map