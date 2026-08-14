import { FLOW_ITEM_MENU_SPECS, flowItemMenuRequest, } from "./workspace-item-menu.js";
export const FLOW_SECTION_ACTION_LABELS = FLOW_ITEM_MENU_SPECS.section.commands;
export function flowSectionMenuRequest(event) {
    return flowItemMenuRequest(event);
}
//# sourceMappingURL=workspace-section-menu.js.map