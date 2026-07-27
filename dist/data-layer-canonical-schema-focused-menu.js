import { canonicalPropertyPath } from "./data-layer-canonical-schema.js";
import { renderFocusedPropertyMenu } from "./data-layer-focused-schema-property-menu.js";
import { focusedConditionLabel } from "./data-layer-focused-schema-property-ui.js";
export function renderCanonicalFocusedMenu(node, context) {
    const path = canonicalPropertyPath(context.current(), node.id);
    return renderFocusedPropertyMenu({ dom: context.dom, path, provenance: `Provenance · ${context.provenanceText(node)}`, close: context.close, sectionSummary: (section) => section === "rules" ? `${node.rules.length} items` : section === "values" ? `${node.allowedValues.length} allowed values` : section === "conditions" ? focusedConditionLabel(node.presence.condition) : "View effective value", selectSection: (section) => { context.setActiveSection(section); context.ensureWorking(node); context.setMenuPropertyId(node.id); context.render(); } });
}
//# sourceMappingURL=data-layer-canonical-schema-focused-menu.js.map