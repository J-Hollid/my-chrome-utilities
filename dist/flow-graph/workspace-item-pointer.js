export const FLOW_ITEM_DRAG_THRESHOLD = 3;
const distance = (from, to) => Math.hypot(to.x - from.x, to.y - from.y);
export function startFlowItemPointerGesture(input) {
    if (input.button !== 0 || input.interactive)
        return undefined;
    const point = { x: input.clientX, y: input.clientY };
    return { pointerId: input.pointerId, origin: point, previous: point, travel: 0, dragging: false };
}
export function advanceFlowItemPointerGesture(gesture, input) {
    if (!gesture || gesture.pointerId !== input.pointerId)
        return gesture;
    const point = { x: input.clientX, y: input.clientY };
    const travel = gesture.travel + distance(gesture.previous, point);
    return { ...gesture, previous: point, travel, dragging: travel > FLOW_ITEM_DRAG_THRESHOLD };
}
export function completeFlowItemPointerGesture(gesture, input) {
    const completed = advanceFlowItemPointerGesture(gesture, input);
    if (!completed || completed.pointerId !== input.pointerId)
        return undefined;
    if (!completed.dragging)
        return { kind: "activate" };
    return {
        kind: "drag",
        delta: { x: input.clientX - completed.origin.x, y: input.clientY - completed.origin.y },
    };
}
//# sourceMappingURL=workspace-item-pointer.js.map