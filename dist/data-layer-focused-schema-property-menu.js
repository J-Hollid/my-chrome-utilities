import { focusedPropertySectionLabels, focusedPropertySections } from "./data-layer-focused-schema-property-ui.js";
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
/** The single menu boundary shared by canonical and composed focused-property editors. */
export function renderFocusedPropertyMenu(options) {
    const { dom } = options, menu = dom.createElement("div");
    menu.className = "focused-property-context-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", `${options.path} property context menu`);
    menu.dataset.propertyContextMenu = "true";
    for (const section of focusedPropertySections) {
        const entry = dom.createElement("div"), choose = button(dom, focusedPropertySectionLabels[section], () => options.selectSection(section)), summary = dom.createElement("span");
        entry.dataset.section = section;
        choose.disabled = Boolean(options.sectionsDisabled);
        choose.setAttribute("role", "menuitem");
        summary.textContent = options.sectionSummary(section);
        entry.append(choose, summary);
        menu.append(entry);
    }
    const ownership = dom.createElement("div");
    ownership.className = "focused-property-ownership-actions";
    for (const action of options.actions) {
        const control = button(dom, action, () => options.runAction(action));
        control.dataset.ownershipAction = action;
        ownership.append(control);
    }
    menu.append(ownership);
    if (options.close)
        menu.append(button(dom, "Cancel", options.close));
    return menu;
}
//# sourceMappingURL=data-layer-focused-schema-property-menu.js.map