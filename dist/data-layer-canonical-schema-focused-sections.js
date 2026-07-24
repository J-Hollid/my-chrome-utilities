import { renderCanonicalFacetSection } from "./data-layer-canonical-schema-focused-facets-ui.js";
import { renderDefinitionSection } from "./canonical-schema-focused/definition.js";
export function renderCanonicalFocusedSection(host, context) {
    const { dom } = context, working = context.getWorking();
    if (!working)
        return;
    host.dataset.focusedSection = context.activeSection;
    if (context.activeSection !== "definition") {
        renderCanonicalFacetSection(host, context, working);
        return;
    }
    renderDefinitionSection(host, context, working);
}
//# sourceMappingURL=data-layer-canonical-schema-focused-sections.js.map