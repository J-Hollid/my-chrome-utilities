import { canonicalPropertyPath } from "./data-layer-canonical-schema.js";
import { focusedConditionLabel, focusedOwnershipActions, focusedPropertySectionLabels, focusedPropertySections } from "./data-layer-focused-schema-property-ui.js";
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
export function renderCanonicalFocusedMenu(node, context) {
    const { dom } = context, menu = dom.createElement("div");
    menu.className = "focused-property-context-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", `${canonicalPropertyPath(context.current(), node.id)} property context menu`);
    menu.dataset.propertyContextMenu = "true";
    const state = context.sourceState(node), actions = focusedOwnershipActions({ inherited: state === "inherited", local: state === "local", overridden: state === "overridden", invariant: node.enforcement === "invariant", conflict: false, replaceable: node.enforcement !== "invariant" });
    for (const section of focusedPropertySections) {
        const entry = dom.createElement("div"), choose = button(dom, focusedPropertySectionLabels[section], () => { context.setActiveSection(section); context.ensureWorking(node); context.setMenuPropertyId(node.id); context.render(); }), summary = dom.createElement("span");
        entry.dataset.section = section;
        summary.textContent = section === "rules" ? `${node.rules.length} items` : section === "values" ? `${node.allowedValues.length} allowed values` : section === "conditions" ? focusedConditionLabel(node.presence.condition) : "View effective value";
        choose.setAttribute("role", "menuitem");
        entry.append(choose, summary);
        menu.append(entry);
    }
    const ownership = dom.createElement("div");
    ownership.className = "focused-property-ownership-actions";
    for (const action of actions) {
        const control = button(dom, action, () => { if (action === "View" || action === "View conflict" || action === "Open source" || action === "Open contributing sources") {
            context.feedback(`${action}: ${canonicalPropertyPath(context.current(), node.id)} · ${context.provenanceText(node)}`);
            context.render();
            return;
        } if (action === "Remove local" || action === "Reset to parent") {
            context.ensureWorking(node);
            const working = context.getWorking();
            if (action === "Remove local" && working)
                working.rules = [];
            context.feedback(`Staged ${action.toLowerCase()} for ${canonicalPropertyPath(context.current(), node.id)}.`);
            context.setActiveSection("rules");
            context.render();
            return;
        } context.setActiveSection(action === "Override here" || action === "Replace here" ? "definition" : context.activeSection); context.ensureWorking(node); context.render(); });
        control.dataset.ownershipAction = action;
        ownership.append(control);
    }
    menu.append(ownership);
    return menu;
}
//# sourceMappingURL=data-layer-canonical-schema-focused-menu.js.map