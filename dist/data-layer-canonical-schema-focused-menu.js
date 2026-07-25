import { canonicalPropertyPath } from "./data-layer-canonical-schema.js";
import { renderFocusedPropertyMenu } from "./data-layer-focused-schema-property-menu.js";
import { focusedConditionLabel, focusedOwnershipActions } from "./data-layer-focused-schema-property-ui.js";
export function renderCanonicalFocusedMenu(node, context) {
    const path = canonicalPropertyPath(context.current(), node.id), state = context.sourceState(node), actions = focusedOwnershipActions({ inherited: state === "inherited", local: state === "local", overridden: state === "overridden", invariant: node.enforcement === "invariant", conflict: state === "conflict", replaceable: node.enforcement !== "invariant" });
    return renderFocusedPropertyMenu({ dom: context.dom, path, actions, sectionSummary: (section) => section === "rules" ? `${node.rules.length} items` : section === "values" ? `${node.allowedValues.length} allowed values` : section === "conditions" ? focusedConditionLabel(node.presence.condition) : "View effective value", selectSection: (section) => { context.setActiveSection(section); context.ensureWorking(node); context.setMenuPropertyId(node.id); context.render(); }, runAction: (action) => { if (action === "View" || action === "View conflict" || action === "Open source" || action === "Open contributing sources") {
            context.feedback(`${action}: ${path} · ${context.provenanceText(node)}`);
            context.render();
            return;
        } if (action === "Remove local" || action === "Reset to parent") {
            context.ensureWorking(node);
            const working = context.getWorking();
            if (action === "Remove local" && working)
                working.rules = [];
            context.feedback(`Staged ${action.toLowerCase()} for ${path}.`);
            context.setActiveSection("rules");
            context.render();
            return;
        } context.setActiveSection(action === "Override here" || action === "Replace here" ? "definition" : context.activeSection); context.ensureWorking(node); context.render(); } });
}
//# sourceMappingURL=data-layer-canonical-schema-focused-menu.js.map