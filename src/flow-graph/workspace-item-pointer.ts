export const FLOW_ITEM_DRAG_THRESHOLD = 3;

interface FlowItemPointerInput {
  pointerId: number;
  clientX: number;
  clientY: number;
}

interface FlowItemPointerStartInput extends FlowItemPointerInput {
  button: number;
  interactive?: boolean;
}

export interface FlowItemPointerGesture {
  pointerId: number;
  origin: { x: number; y: number };
  previous: { x: number; y: number };
  travel: number;
  dragging: boolean;
}

const distance = (from: { x: number; y: number }, to: { x: number; y: number }): number =>
  Math.hypot(to.x - from.x, to.y - from.y);

export function startFlowItemPointerGesture(input: FlowItemPointerStartInput): FlowItemPointerGesture | undefined {
  if (input.button !== 0 || input.interactive) return undefined;
  const point = { x: input.clientX, y: input.clientY };
  return { pointerId: input.pointerId, origin: point, previous: point, travel: 0, dragging: false };
}

export function advanceFlowItemPointerGesture(
  gesture: FlowItemPointerGesture | undefined,
  input: FlowItemPointerInput,
): FlowItemPointerGesture | undefined {
  if (!gesture || gesture.pointerId !== input.pointerId) return gesture;
  const point = { x: input.clientX, y: input.clientY };
  const travel = gesture.travel + distance(gesture.previous, point);
  return { ...gesture, previous: point, travel, dragging: travel > FLOW_ITEM_DRAG_THRESHOLD };
}

export function completeFlowItemPointerGesture(
  gesture: FlowItemPointerGesture | undefined,
  input: FlowItemPointerInput,
): { kind: "activate" } | { kind: "drag"; delta: { x: number; y: number } } | undefined {
  const completed = advanceFlowItemPointerGesture(gesture, input);
  if (!completed || completed.pointerId !== input.pointerId) return undefined;
  if (!completed.dragging) return { kind: "activate" };
  return {
    kind: "drag",
    delta: { x: input.clientX - completed.origin.x, y: input.clientY - completed.origin.y },
  };
}
