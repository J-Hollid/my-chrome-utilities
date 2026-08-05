import {
  cameraFromMinimapPoint,
  boundsAroundItems,
  fitFlowBounds,
  flowDetailLevel,
  panFlowCamera,
  zoomFlowCamera,
  type FlowCamera,
  type FlowPoint,
} from "./workspace.js";
import { FLOW_PAGE_FRAME_SELECTOR, flowCanvasBounds, flowControl, renderedElementBounds, selectedCanvasItems } from "./workspace-dom.js";

interface CameraOptions {
  canvas: SVGSVGElement;
  viewport: HTMLElement;
  camera: () => FlowCamera;
  save: (camera: FlowCamera) => void;
}

export interface FlowCameraUi {
  controls: HTMLElement[];
  minimap: HTMLElement;
  apply(camera: FlowCamera): void;
  fitFlow(): void;
  reveal(target: SVGGraphicsElement): void;
  setMinimapVisible(visible: boolean): void;
}

const viewportSize = (viewport: HTMLElement) => ({
  width: Math.max(240, viewport.clientWidth || 960),
  height: Math.max(240, viewport.clientHeight || 600),
});

export function installFlowCamera(options: CameraOptions): FlowCameraUi {
  const { canvas, viewport } = options;
  const zoomValue = document.createElement("output");
  const minimap = document.createElement("aside");
  const minimapButton = document.createElement("button");
  const viewportIndicator = document.createElement("span");
  let spaceHeld = false;
  let drag: { pointerId: number; client: FlowPoint; camera: FlowCamera } | undefined;
  const touches = new Map<number, FlowPoint>();
  let pinch: { distance: number; camera: FlowCamera; center: FlowPoint } | undefined;

  zoomValue.setAttribute("aria-label", "Flow zoom percentage");
  minimap.className = "flow-minimap";
  minimap.setAttribute("aria-label", "Flow minimap");
  minimapButton.type = "button";
  minimapButton.setAttribute("aria-label", "Navigate complete Flow bounds");
  viewportIndicator.className = "flow-minimap-viewport";
  minimapButton.append(viewportIndicator);
  minimap.append(minimapButton);

  const updateMinimap = (camera: FlowCamera): void => {
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

  const apply = (camera: FlowCamera): void => {
    options.save(camera);
    const size = viewportSize(viewport);
    canvas.setAttribute("viewBox", `${camera.x} ${camera.y} ${size.width / camera.zoom} ${size.height / camera.zoom}`);
    canvas.dataset.viewport = JSON.stringify(camera);
    canvas.dataset.semanticDetail = flowDetailLevel(camera.zoom);
    zoomValue.textContent = `${Math.round(camera.zoom * 100)}%`;
    updateMinimap(camera);
  };

  const anchorAtCenter = (): FlowPoint => {
    const size = viewportSize(viewport);
    return { x: size.width / 2, y: size.height / 2 };
  };
  const zoom = (factor: number) => apply(zoomFlowCamera(options.camera(), factor, anchorAtCenter()));
  const fit = (selector?: string, padding = 24): void => {
    const target = selector ? canvas.querySelector<SVGGraphicsElement>(selector) : undefined;
    const bounds = target ? renderedElementBounds(target) : flowCanvasBounds(canvas);
    if (bounds) apply(fitFlowBounds(bounds, viewportSize(viewport), padding));
  };
  const reveal = (target: SVGGraphicsElement): void => {
    const bounds = renderedElementBounds(target);
    if (bounds) apply(fitFlowBounds(bounds, viewportSize(viewport), 100));
    target.focus({ preventScroll: true });
  };
  canvas.addEventListener("flow-reveal-item", (event) => {
    const selector = (event as CustomEvent<{ selector?: string }>).detail?.selector;
    const target = selector ? canvas.querySelector<SVGGraphicsElement>(selector) : undefined;
    if (target) reveal(target);
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
    if (selectedBounds.length) apply(fitFlowBounds(boundsAroundItems(selectedBounds, 0), viewportSize(viewport), 24));
  });

  minimapButton.addEventListener("click", (event) => {
    const rect = minimapButton.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const point = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    apply(cameraFromMinimapPoint(flowCanvasBounds(canvas), viewportSize(viewport), point, options.camera().zoom));
  });
  minimapButton.addEventListener("keydown", (event) => {
    const deltas: Record<string, FlowPoint> = {
      ArrowLeft: { x: -.1, y: 0 }, ArrowRight: { x: .1, y: 0 },
      ArrowUp: { x: 0, y: -.1 }, ArrowDown: { x: 0, y: .1 },
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    const bounds = flowCanvasBounds(canvas), camera = options.camera();
    apply({ ...camera, x: camera.x + bounds.width * delta.x, y: camera.y + bounds.height * delta.y });
  });

  const keyboardPan = (event: KeyboardEvent): void => {
    if (event.key === " ") {
      if (!(event.target as Element).closest("input,textarea,select,button")) {
        event.preventDefault();
        spaceHeld = true;
      }
      return;
    }
    if (event.target !== viewport) return;
    const deltas: Record<string, FlowPoint> = {
      ArrowLeft: { x: 40, y: 0 }, ArrowRight: { x: -40, y: 0 },
      ArrowUp: { x: 0, y: 40 }, ArrowDown: { x: 0, y: -40 },
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    apply(panFlowCamera(options.camera(), delta));
  };
  viewport.addEventListener("keydown", keyboardPan);
  viewport.addEventListener("keyup", (event) => { if (event.key === " ") spaceHeld = false; });
  viewport.addEventListener("blur", () => { spaceHeld = false; }, true);

  const touchDistance = (): { distance: number; center: FlowPoint } | undefined => {
    const points = [...touches.values()];
    if (points.length < 2) return undefined;
    const first = points[0]!, second = points[1]!;
    return {
      distance: Math.hypot(second.x - first.x, second.y - first.y),
      center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
    };
  };
  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const touchPair = touchDistance();
    if (touchPair) {
      pinch = { ...touchPair, camera: options.camera() };
      drag = undefined;
      return;
    }
    const blank = event.target === canvas || event.target === viewport;
    if (!blank || !(spaceHeld || event.button === 1 || event.pointerType === "touch")) return;
    event.preventDefault();
    drag = { pointerId: event.pointerId, client: { x: event.clientX, y: event.clientY }, camera: options.camera() };
  });
  viewport.addEventListener("pointermove", (event) => {
    if (touches.has(event.pointerId)) touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const touchPair = touchDistance();
    if (pinch && touchPair) {
      const rect = viewport.getBoundingClientRect();
      const anchor = { x: touchPair.center.x - rect.left, y: touchPair.center.y - rect.top };
      apply(zoomFlowCamera(pinch.camera, touchPair.distance / Math.max(1, pinch.distance), anchor));
      return;
    }
    if (!drag || drag.pointerId !== event.pointerId) return;
    apply(panFlowCamera(drag.camera, { x: event.clientX - drag.client.x, y: event.clientY - drag.client.y }));
  });
  const finishPointer = (event: PointerEvent): void => {
    touches.delete(event.pointerId);
    if (drag?.pointerId === event.pointerId) drag = undefined;
    if (touches.size < 2) pinch = undefined;
  };
  viewport.addEventListener("pointerup", finishPointer);
  viewport.addEventListener("pointercancel", finishPointer);
  viewport.addEventListener("wheel", (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
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
