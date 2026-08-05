import { cameraFromMinimapPoint, fitFlowBounds, flowDetailLevel, panFlowCamera, zoomFlowCamera, } from "./workspace.js";
import { flowCanvasBounds, flowControl, renderedElementBounds } from "./workspace-dom.js";
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
    const zoomOut = flowControl("Zoom out", () => zoom(.8));
    const zoomIn = flowControl("Zoom in", () => zoom(1.25));
    const actual = flowControl("100 percent", () => apply({ ...options.camera(), zoom: 1 }));
    const fitFlow = flowControl("Fit Flow", () => fit());
    const fitSelection = flowControl("Fit selection", () => {
        const selected = canvas.querySelector(".is-selected");
        if (selected)
            reveal(selected);
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
        if (event.target !== viewport)
            return;
        const deltas = {
            ArrowLeft: { x: 40, y: 0 }, ArrowRight: { x: -40, y: 0 },
            ArrowUp: { x: 0, y: 40 }, ArrowDown: { x: 0, y: -40 },
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
        if (!blank || !(spaceHeld || event.button === 1 || event.pointerType === "touch"))
            return;
        event.preventDefault();
        drag = { pointerId: event.pointerId, client: { x: event.clientX, y: event.clientY }, camera: options.camera() };
    });
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
        apply(panFlowCamera(drag.camera, { x: event.clientX - drag.client.x, y: event.clientY - drag.client.y }));
    });
    const finishPointer = (event) => {
        touches.delete(event.pointerId);
        if (drag?.pointerId === event.pointerId)
            drag = undefined;
        if (touches.size < 2)
            pinch = undefined;
    };
    viewport.addEventListener("pointerup", finishPointer);
    viewport.addEventListener("pointercancel", finishPointer);
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
        reveal,
        setMinimapVisible(visible) { minimap.hidden = !visible; updateMinimap(options.camera()); },
    };
}
//# sourceMappingURL=workspace-camera-ui.js.map