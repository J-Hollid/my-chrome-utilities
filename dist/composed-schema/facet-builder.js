import { composedFacetDraft, sparseComposedFacets } from "../data-layer-composed-schema-builders.js";
import { button } from "./facet-builder-context.js";
import { renderAllowedValues, renderCommonFacets } from "./facet-builder-common.js";
import { renderConditionBuilder } from "./facet-builder-condition.js";
import { renderExampleBuilder } from "./facet-builder-example.js";
import { renderRulesBuilder } from "./facet-builder-rules.js";
export function mountComposedSchemaFacetBuilder(options) { let draft = composedFacetDraft(options.local, options.effective), feedback = ""; const render = () => { options.host.replaceChildren(); options.host.setAttribute("aria-label", `${options.path} complete facet builders`); const context = { options, draft: () => draft, setDraft: (next) => { draft = next; }, feedback: () => feedback, setFeedback: (value) => { feedback = value; }, render }, save = button("Save local facets", () => { try {
    options.onSave(sparseComposedFacets(draft, options.inherited ?? { path: options.path }));
    feedback = "";
}
catch (error) {
    feedback = error instanceof Error ? error.message : String(error);
    render();
} }), status = document.createElement("output"); status.setAttribute("role", "status"); status.textContent = feedback; options.host.append(renderCommonFacets(context), renderAllowedValues(context), renderConditionBuilder(context), renderRulesBuilder(context), renderExampleBuilder(context), save, status); }; render(); }
//# sourceMappingURL=facet-builder.js.map