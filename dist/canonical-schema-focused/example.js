import { canonicalFacetText } from "../data-layer-canonical-schema-facets.js";
import { input, labeled } from "./dom.js";
export function renderExampleFacet(host, context, working) {
    const { dom } = context, method = dom.createElement("select"), value = input(dom, "exampleValue", canonicalFacetText(working.documentation.example.value));
    method.name = "exampleMethod";
    method.append(...["allowed-value", "custom", "blank"].map((entry) => new Option(entry, entry)));
    method.value = working.documentation.example.method;
    method.addEventListener("change", () => { const next = context.getWorking(); if (next)
        next.documentation = { ...next.documentation, example: { method: method.value, value: method.value === "blank" ? undefined : value.value } }; });
    value.addEventListener("input", () => { const next = context.getWorking(); if (next)
        next.documentation = { ...next.documentation, example: { method: method.value, value: value.value } }; });
    host.append(labeled(dom, "Example method", method), labeled(dom, "Example value", value));
}
//# sourceMappingURL=example.js.map