export const FLOW_MANUAL_ZOOM = { minimum: .25, maximum: 2 };
export function initialFlowWorkspaceView() { return { camera: { x: 0, y: 0, zoom: 1 }, surface: undefined, minimap: false, focusCanvas: false }; }
export function openFlowSurface(view, surface) { return { ...view, surface }; }
export function closeFlowSurface(view) { return { ...view, surface: undefined }; }
export function flowDetailLevel(zoom) { return zoom < .5 ? "identity" : "events"; }
const rounded = (value) => Math.round(value * 100) / 100;
export function zoomFlowCamera(camera, factor, anchor) {
    const zoom = Math.min(FLOW_MANUAL_ZOOM.maximum, Math.max(FLOW_MANUAL_ZOOM.minimum, camera.zoom * factor)), world = { x: camera.x + anchor.x / camera.zoom, y: camera.y + anchor.y / camera.zoom };
    return { x: rounded(world.x - anchor.x / zoom), y: rounded(world.y - anchor.y / zoom), zoom: rounded(zoom) };
}
export function fitFlowBounds(bounds, viewport, padding = 24) {
    const width = Math.max(1, bounds.width + padding * 2), height = Math.max(1, bounds.height + padding * 2), zoom = rounded(Math.min(1, viewport.width / width, viewport.height / height));
    return { x: bounds.x - padding, y: bounds.y - padding, zoom };
}
export function relationshipDropTarget(sourcePort, position) {
    if (sourcePort === "right")
        return { position, targetPort: "left", kind: "expected_next" };
    if (sourcePort === "top")
        return { position, targetPort: "bottom", kind: "alternative" };
    if (sourcePort === "bottom")
        return { position, targetPort: "top", kind: "merge" };
    return undefined;
}
export function tidyFlowItems(items, direction, origin) {
    return items.map(({ id }, index) => ({ id, position: { x: origin.x + (direction === "horizontal" ? origin.gap * index : 0), y: origin.y + (direction === "vertical" ? origin.gap * index : 0) } }));
}
//# sourceMappingURL=workspace.js.map