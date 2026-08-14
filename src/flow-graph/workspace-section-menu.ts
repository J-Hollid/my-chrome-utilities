import {
  FLOW_ITEM_MENU_SPECS,
  flowItemMenuRequest,
  type FlowItemMenuRequest,
} from "./workspace-item-menu.js";

export type FlowSectionMenuRequest = FlowItemMenuRequest;

export const FLOW_SECTION_ACTION_LABELS = FLOW_ITEM_MENU_SPECS.section.commands;

export function flowSectionMenuRequest(event: {
  type: string;
  key?: string;
  shiftKey?: boolean;
  clientX?: number;
  clientY?: number;
}): FlowSectionMenuRequest | undefined {
  return flowItemMenuRequest(event);
}
