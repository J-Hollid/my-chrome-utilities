import type { FlowPoint } from "./workspace.js";

export interface FlowSectionMenuRequest {
  clientPosition?: FlowPoint;
}

export const FLOW_SECTION_ACTION_LABELS = [
  "Rename",
  "Move",
  "Resize",
  "Wrap selection",
  "Remove Section",
  "Remove with contents",
] as const;

export function flowSectionMenuRequest(event: {
  type: string;
  key?: string;
  shiftKey?: boolean;
  clientX?: number;
  clientY?: number;
}): FlowSectionMenuRequest | undefined {
  if (event.type === "contextmenu") {
    return { clientPosition: { x: event.clientX ?? 0, y: event.clientY ?? 0 } };
  }
  if (event.type !== "keydown") return undefined;
  if (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)) return {};
  return undefined;
}
