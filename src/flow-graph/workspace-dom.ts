import {
  boundsAroundItems,
  transformedFlowBounds,
  type FlowBounds,
  type FlowPoint,
} from "./workspace.js";

export const FLOW_PAGE_FRAME_SELECTOR = "g[data-page-frame-id]:not([data-occurrence-id])";

export function flowControl(text: string, action: () => void): HTMLButtonElement {
  const result = document.createElement("button");
  result.type = "button";
  result.textContent = text;
  result.addEventListener("click", action);
  return result;
}

export function svgTranslation(item: SVGGraphicsElement): FlowPoint {
  const transform = item.getAttribute("transform") ?? "";
  const match = /translate\(([-\d.]+)[ ,]([-\d.]+)/u.exec(transform);
  return { x: Number(match?.[1] ?? 0), y: Number(match?.[2] ?? 0) };
}

export function renderedElementBounds(item: SVGGraphicsElement): FlowBounds | undefined {
  try {
    const box = item.getBBox();
    if (![box.x, box.y, box.width, box.height].every(Number.isFinite)) return undefined;
    const translation = svgTranslation(item);
    return transformedFlowBounds(
      { x: box.x, y: box.y, width: box.width, height: box.height },
      { translateX: translation.x, translateY: translation.y },
    );
  } catch {
    return undefined;
  }
}

export function flowCanvasBounds(canvas: SVGSVGElement, selector = `[data-flow-section-id],${FLOW_PAGE_FRAME_SELECTOR},[data-occurrence-id]`): FlowBounds {
  const boxes = Array.from(canvas.querySelectorAll<SVGGraphicsElement>(selector))
    .flatMap((item) => {
      const bounds = renderedElementBounds(item);
      return bounds ? [bounds] : [];
    });
  return boxes.length ? boundsAroundItems(boxes, 0) : { x: 0, y: 0, width: 960, height: 720 };
}

export function itemIdentity(item: Element): string | undefined {
  const identified = item.closest<HTMLElement>("[data-flow-section-id],[data-page-frame-id],[data-occurrence-id],[data-relationship-id]");
  return identified?.dataset.flowSectionId
    ?? identified?.dataset.pageFrameId
    ?? identified?.dataset.occurrenceId
    ?? identified?.dataset.relationshipId;
}

export function selectedCanvasItems(canvas: SVGSVGElement, selector: string): SVGGraphicsElement[] {
  const selected = Array.from(canvas.querySelectorAll<SVGGraphicsElement>(`${selector}.is-selected,${selector}[aria-pressed="true"]`));
  return selected.length ? selected : [];
}
