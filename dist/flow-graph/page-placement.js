export function flowPointerDelta(start, current, zoom) {
    return { x: (current.x - start.x) / zoom, y: (current.y - start.y) / zoom };
}
export function flowBoundsContains(outer, inner) {
    return inner.x >= outer.x && inner.y >= outer.y &&
        inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
}
//# sourceMappingURL=page-placement.js.map