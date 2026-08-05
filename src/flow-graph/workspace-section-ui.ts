import {
  boundsAroundItems,
  clientPointToFlowPoint,
  sectionBoundsFromDrag,
  type FlowCamera,
  type FlowPoint,
} from "./workspace.js";
import { FLOW_PAGE_FRAME_SELECTOR, flowControl, renderedElementBounds } from "./workspace-dom.js";
import { sectionBoundsAfterKeyboardInput } from "./workspace-section-geometry.js";

export type FlowSectionCommand =
  | { kind: "select"; sectionId: string }
  | { kind: "create"; name: string; bounds: { x: number; y: number; width: number; height: number }; frameIds: string[] }
  | { kind: "move"; sectionId: string; position: FlowPoint }
  | { kind: "resize"; sectionId: string; bounds: { x: number; y: number; width: number; height: number } }
  | { kind: "rename"; sectionId: string; name: string }
  | { kind: "remove"; sectionId: string }
  | { kind: "remove-with-contents"; sectionId: string; review: FlowSectionRemovalImpact };

export interface FlowSectionRemovalImpact {
  flowId?: string;
  sectionId?: string;
  sectionName?: string;
  pageFrames: { id: string; name: string }[];
  occurrences: { id: string; name: string }[];
  relationships: { id: string; name: string }[];
  fingerprint?: string;
}

interface SectionUiOptions {
  root: HTMLElement;
  canvas: SVGSVGElement;
  viewport: HTMLElement;
  camera: () => FlowCamera;
  closeSurface: () => void;
}

export interface FlowSectionUi {
  addPanel(): HTMLElement;
  actions(section: SVGGraphicsElement): HTMLElement;
}

const command = (root: HTMLElement, detail: FlowSectionCommand): void => {
  root.dispatchEvent(new CustomEvent("flow-section-command", { bubbles: true, detail }));
};

const sectionBounds = (section: SVGGraphicsElement) => {
  const rect = section.querySelector<SVGRectElement>("rect");
  return {
    x: Number(rect?.getAttribute("x") ?? 0),
    y: Number(rect?.getAttribute("y") ?? 0),
    width: Number(rect?.getAttribute("width") ?? 320),
    height: Number(rect?.getAttribute("height") ?? 220),
  };
};

export function installFlowSections(options: SectionUiOptions): FlowSectionUi {
  const { root, canvas, viewport } = options;
  let drawName: string | undefined;
  let drawStart: FlowPoint | undefined;
  let preview: SVGRectElement | undefined;

  const graphPoint = (client: FlowPoint): FlowPoint => clientPointToFlowPoint(viewport.getBoundingClientRect(), options.camera(), client);
  const createPreview = (): SVGRectElement => {
    const result = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    result.classList.add("flow-section-draw-preview");
    result.setAttribute("aria-hidden", "true");
    canvas.append(result);
    return result;
  };
  const updatePreview = (bounds: { x: number; y: number; width: number; height: number }): void => {
    preview ??= createPreview();
    preview.setAttribute("x", String(bounds.x));
    preview.setAttribute("y", String(bounds.y));
    preview.setAttribute("width", String(bounds.width));
    preview.setAttribute("height", String(bounds.height));
  };
  const clearDraw = (): void => {
    drawName = undefined;
    drawStart = undefined;
    preview?.remove();
    preview = undefined;
    canvas.classList.remove("is-drawing-section");
  };

  canvas.addEventListener("pointerdown", (event) => {
    if (!drawName || event.target !== canvas) return;
    event.preventDefault();
    drawStart = graphPoint({ x: event.clientX, y: event.clientY });
    updatePreview(sectionBoundsFromDrag(drawStart, drawStart));
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drawName || !drawStart) return;
    updatePreview(sectionBoundsFromDrag(drawStart, graphPoint({ x: event.clientX, y: event.clientY })));
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!drawName || !drawStart) return;
    const name = drawName;
    const bounds = sectionBoundsFromDrag(drawStart, graphPoint({ x: event.clientX, y: event.clientY }));
    clearDraw();
    command(root, { kind: "create", name, bounds, frameIds: [] });
  });
  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawName) {
      event.preventDefault();
      clearDraw();
    }
  });

  const sectionGroups = Array.from(canvas.querySelectorAll<SVGGraphicsElement>("g[data-flow-section-id]")).filter((candidate) => candidate.querySelector(":scope > [data-section-dropzone]"));
  for (const section of sectionGroups) {
    const id = section.dataset.flowSectionId;
    if (!id || section.dataset.sectionDirectManipulation === "true") continue;
    section.dataset.sectionDirectManipulation = "true";
    section.tabIndex = 0;
    section.setAttribute("role", "button");
    const label = section.querySelector("text")?.textContent?.trim() || "Section";
    section.setAttribute("aria-label", `Section ${label}. Drag to move; use resize handle to resize.`);
    const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const initial = sectionBounds(section);
    handle.classList.add("flow-section-resize-handle");
    handle.dataset.sectionResizeFor = id;
    handle.setAttribute("x", String(initial.x + initial.width - 14));
    handle.setAttribute("y", String(initial.y + initial.height - 14));
    handle.setAttribute("width", "14");
    handle.setAttribute("height", "14");
    handle.tabIndex = 0;
    handle.setAttribute("role", "button");
    handle.setAttribute("aria-label", `Resize Section ${label}. Use Arrow keys to resize.`);
    section.append(handle);
    let drag: { pointerId: number; client: FlowPoint; bounds: ReturnType<typeof sectionBounds>; resize: boolean } | undefined;
    section.addEventListener("pointerdown", (event) => {
      if ((event.target as Element).closest("[data-page-frame-id],[data-occurrence-id]")) return;
      drag = {
        pointerId: event.pointerId,
        client: { x: event.clientX, y: event.clientY },
        bounds: sectionBounds(section),
        resize: Boolean((event.target as Element).closest("[data-section-resize-for]")),
      };
    });
    section.addEventListener("pointermove", (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const dx = (event.clientX - drag.client.x) / options.camera().zoom;
      const dy = (event.clientY - drag.client.y) / options.camera().zoom;
      const rect = section.querySelector<SVGRectElement>("rect:not(.flow-section-resize-handle)");
      if (!rect) return;
      if (drag.resize) {
        rect.setAttribute("width", String(Math.max(240, drag.bounds.width + dx)));
        rect.setAttribute("height", String(Math.max(140, drag.bounds.height + dy)));
      } else {
        rect.setAttribute("x", String(drag.bounds.x + dx));
        rect.setAttribute("y", String(drag.bounds.y + dy));
      }
    });
    const finish = (event: PointerEvent): void => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const current = drag;
      drag = undefined;
      const dx = Math.round((event.clientX - current.client.x) / options.camera().zoom);
      const dy = Math.round((event.clientY - current.client.y) / options.camera().zoom);
      if (!dx && !dy) {
        command(root, { kind: "select", sectionId: id });
        return;
      }
      if (current.resize) command(root, { kind: "resize", sectionId: id, bounds: { ...current.bounds, width: current.bounds.width + dx, height: current.bounds.height + dy } });
      else command(root, { kind: "move", sectionId: id, position: { x: current.bounds.x + dx, y: current.bounds.y + dy } });
    };
    section.addEventListener("pointerup", finish);
    section.addEventListener("pointercancel", () => { drag = undefined; });
    section.addEventListener("click", (event) => {
      if ((event.target as Element).closest("[data-page-frame-id],[data-occurrence-id]")) return;
      command(root, { kind: "select", sectionId: id });
    });
    section.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        command(root, { kind: "select", sectionId: id });
        return;
      }
      if (!event.key.startsWith("Arrow")) return;
      event.preventDefault();
      const bounds = sectionBounds(section);
      const resize = Boolean((event.target as Element).closest("[data-section-resize-for]"));
      const next = sectionBoundsAfterKeyboardInput(bounds, event.key, resize);
      if (resize) command(root, { kind: "resize", sectionId: id, bounds: next });
      else command(root, { kind: "move", sectionId: id, position: { x: next.x, y: next.y } });
    });
  }

  const addPanel = (): HTMLElement => {
    const panel = document.createElement("section");
    const name = document.createElement("input");
    const draw = flowControl("Draw Section", () => {
      drawName = name.value.trim() || "New Section";
      canvas.classList.add("is-drawing-section");
      options.closeSurface();
      canvas.focus({ preventScroll: true });
    });
    const wrap = flowControl("Wrap selection", () => {
      const frames = Array.from(canvas.querySelectorAll<SVGGraphicsElement>(`${FLOW_PAGE_FRAME_SELECTOR}.is-selected,${FLOW_PAGE_FRAME_SELECTOR}[aria-pressed="true"]`));
      const bounds = frames.flatMap((frame) => {
        const itemBounds = renderedElementBounds(frame);
        return itemBounds ? [itemBounds] : [];
      });
      if (!bounds.length) {
        name.setCustomValidity("Select at least one Page before wrapping a Section.");
        name.reportValidity();
        return;
      }
      command(root, {
        kind: "create",
        name: name.value.trim() || "New Section",
        bounds: boundsAroundItems(bounds, 24),
        frameIds: frames.map((frame) => frame.dataset.pageFrameId!).filter(Boolean),
      });
    });
    panel.setAttribute("aria-label", "New Section controls");
    name.setAttribute("aria-label", "New Section name");
    panel.append(name, draw, wrap);
    return panel;
  };

  const actions = (section: SVGGraphicsElement): HTMLElement => {
    const panel = document.createElement("section");
    const id = section.dataset.flowSectionId!;
    const label = section.querySelector("text")?.textContent?.trim() || "Section";
    const rename = flowControl("Rename", () => {
      const editor = document.createElement("label"), input = document.createElement("input");
      input.value = label;
      input.setAttribute("aria-label", `Rename Section ${label}`);
      editor.append(input, flowControl("Save Section name", () => command(root, { kind: "rename", sectionId: id, name: input.value })));
      panel.replaceChildren(editor);
      input.focus();
    });
    const move = flowControl("Move", () => section.focus({ preventScroll: true }));
    const resize = flowControl("Resize", () => section.querySelector<SVGGraphicsElement>("[data-section-resize-for]")?.focus({ preventScroll: true }));
    const wrap = flowControl("Wrap selection", () => {
      const frames = Array.from(canvas.querySelectorAll<SVGGraphicsElement>(`${FLOW_PAGE_FRAME_SELECTOR}[data-flow-section-id="${CSS.escape(id)}"]`));
      const bounds = frames.flatMap((frame) => {
        const value = renderedElementBounds(frame);
        return value ? [value] : [];
      });
      if (bounds.length) command(root, { kind: "resize", sectionId: id, bounds: boundsAroundItems(bounds, 24) });
    });
    const remove = flowControl("Remove Section", () => command(root, { kind: "remove", sectionId: id }));
    const removeContents = flowControl("Remove with contents", () => {
      root.dispatchEvent(new CustomEvent("flow-section-impact-request", { bubbles: true, detail: {
        sectionId: id,
        respond(review: FlowSectionRemovalImpact) {
          const names = (items: FlowSectionRemovalImpact["pageFrames"]): string => items.map(({ name }) => name).join(", ") || "none";
          const summary = document.createElement("p");
          summary.textContent = `Remove ${label}. Page instances: ${names(review.pageFrames)}. Event occurrences: ${names(review.occurrences)}. Relationships: ${names(review.relationships)}. Nothing changes until confirmed.`;
          panel.replaceChildren(flowControl("Confirm Remove with contents", () => command(root, { kind: "remove-with-contents", sectionId: id, review })), flowControl("Cancel", () => panel.replaceChildren(rename, move, resize, wrap, remove, removeContents)));
          panel.prepend(summary);
        },
      } }));
    });
    panel.setAttribute("aria-label", `Selected Section ${label} actions`);
    panel.append(rename, move, resize, wrap, remove, removeContents);
    return panel;
  };

  return { addPanel, actions };
}
