import { boundsAroundItems, transformedFlowBounds, } from "./workspace.js";
export function flowControl(text, action) {
    const result = document.createElement("button");
    result.type = "button";
    result.textContent = text;
    result.addEventListener("click", action);
    return result;
}
export function svgTranslation(item) {
    const transform = item.getAttribute("transform") ?? "";
    const match = /translate\(([-\d.]+)[ ,]([-\d.]+)/u.exec(transform);
    return { x: Number(match?.[1] ?? 0), y: Number(match?.[2] ?? 0) };
}
export function renderedElementBounds(item) {
    try {
        const box = item.getBBox();
        if (![box.x, box.y, box.width, box.height].every(Number.isFinite))
            return undefined;
        const translation = svgTranslation(item);
        return transformedFlowBounds({ x: box.x, y: box.y, width: box.width, height: box.height }, { translateX: translation.x, translateY: translation.y });
    }
    catch {
        return undefined;
    }
}
export function flowCanvasBounds(canvas, selector = "[data-flow-section-id],[data-page-frame-id],[data-occurrence-id]") {
    const boxes = Array.from(canvas.querySelectorAll(selector))
        .flatMap((item) => {
        const bounds = renderedElementBounds(item);
        return bounds ? [bounds] : [];
    });
    return boxes.length ? boundsAroundItems(boxes, 0) : { x: 0, y: 0, width: 960, height: 720 };
}
export function itemIdentity(item) {
    const identified = item.closest("[data-flow-section-id],[data-page-frame-id],[data-occurrence-id],[data-relationship-id]");
    return identified?.dataset.flowSectionId
        ?? identified?.dataset.pageFrameId
        ?? identified?.dataset.occurrenceId
        ?? identified?.dataset.relationshipId;
}
export function selectedCanvasItems(canvas, selector) {
    const selected = Array.from(canvas.querySelectorAll(`${selector}.is-selected,${selector}[aria-pressed="true"]`));
    return selected.length ? selected : [];
}
//# sourceMappingURL=workspace-dom.js.map