import { canonicalFacetText, typedCanonicalValue } from "../data-layer-canonical-schema-facets.js";
import { button, input, labeled } from "./dom.js";
export function renderValuesFacet(host, context, working) {
    const { dom } = context, expected = input(dom, "expectedValue", canonicalFacetText(working.expectedValue));
    expected.setAttribute("aria-label", "Expected value");
    expected.addEventListener("input", () => { const next = context.getWorking(); if (!next)
        return; try {
        next.expectedValue = expected.value === "" ? undefined : typedCanonicalValue(next.type, expected.value);
        expected.setCustomValidity("");
    }
    catch {
        expected.setCustomValidity("Value does not match the property type.");
    } });
    const list = dom.createElement("div");
    working.allowedValues.forEach((entry, index) => { const row = dom.createElement("div"), value = input(dom, `allowedValue-${entry.id}`, canonicalFacetText(entry.value)); value.setAttribute("aria-label", `Allowed value ${index + 1}`); value.addEventListener("input", () => { const next = context.getWorking(); if (!next)
        return; try {
        next.allowedValues[index] = { ...entry, value: typedCanonicalValue(next.type, value.value) };
        value.setCustomValidity("");
    }
    catch {
        value.setCustomValidity("Value does not match the property type.");
    } }); row.append(labeled(dom, `Value ${index + 1}`, value), button(dom, "Remove", () => { const next = context.getWorking(); if (next) {
        next.allowedValues.splice(index, 1);
        context.render();
    } })); list.append(row); });
    host.append(labeled(dom, "Expected value", expected), list, button(dom, "Add allowed value", () => { const next = context.getWorking(); if (next) {
        next.allowedValues.push({ id: context.id("allowed-value"), value: next.type === "number" || next.type === "integer" ? 0 : next.type === "boolean" ? false : next.type === "null" ? null : "" });
        context.render();
    } }));
}
//# sourceMappingURL=values.js.map