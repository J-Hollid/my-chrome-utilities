import type { FlowBounds } from "./workspace.js";

const KEYBOARD_SECTION_STEP = 20;
const MINIMUM_SECTION_WIDTH = 240;
const MINIMUM_SECTION_HEIGHT = 140;

export function sectionBoundsAfterKeyboardInput(
  bounds: FlowBounds,
  key: string,
  resize: boolean,
): FlowBounds {
  const delta = {
    ArrowLeft: { x: -KEYBOARD_SECTION_STEP, y: 0 },
    ArrowRight: { x: KEYBOARD_SECTION_STEP, y: 0 },
    ArrowUp: { x: 0, y: -KEYBOARD_SECTION_STEP },
    ArrowDown: { x: 0, y: KEYBOARD_SECTION_STEP },
  }[key];
  if (!delta) return bounds;
  if (resize) return {
    ...bounds,
    width: Math.max(MINIMUM_SECTION_WIDTH, bounds.width + delta.x),
    height: Math.max(MINIMUM_SECTION_HEIGHT, bounds.height + delta.y),
  };
  return { ...bounds, x: bounds.x + delta.x, y: bounds.y + delta.y };
}
