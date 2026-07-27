import { canonicalFacetText, typedCanonicalValue } from "../data-layer-canonical-schema-facets.js";
import { schemaTableAllowedValues, schemaTableExampleControl, schemaTableStageAllowedValues } from "../data-layer-schema-table.js";
import { focusedDefinitionFacetOwnershipActions } from "../data-layer-focused-schema-property-ui.js";
import { input, labeled } from "./dom.js";
const types = ["string", "number", "integer", "boolean", "object", "array", "null"];
export function renderDefinitionSection(host, context, working) {
    const { dom } = context, type = dom.createElement("select"), itemType = dom.createElement("select"), presence = dom.createElement("select"), allowed = input(dom, "ordinaryValue", schemaTableAllowedValues({ ...(working.expectedValue === undefined ? {} : { expectedValue: working.expectedValue }), allowedValues: working.allowedValues.map(({ value }) => value) })), displayText = input(dom, "displayText", working.documentation.displayText), description = dom.createElement("textarea"), comments = dom.createElement("textarea"), exampleMethod = dom.createElement("select"), exampleHost = dom.createElement("span");
    allowed.dataset.allowedValues = "true";
    type.name = "propertyType";
    type.append(...types.map((entry) => new Option(entry, entry)));
    type.value = working.type;
    type.addEventListener("change", () => { const next = context.getWorking(); if (next) {
        next.type = type.value;
        itemType.disabled = next.type !== "array";
    } });
    itemType.name = "itemType";
    itemType.append(new Option("No item type", ""), ...types.map((entry) => new Option(entry, entry)));
    itemType.value = working.itemType ?? "";
    itemType.disabled = working.type !== "array";
    itemType.addEventListener("change", () => { const next = context.getWorking(); if (next && next.type === "array")
        next.itemType = itemType.value || undefined; });
    presence.name = "presenceMode";
    presence.append(new Option("Required", "required"), new Option("Optional", "optional"), new Option("Forbidden", "forbidden"));
    presence.value = working.presence.mode.startsWith("required") ? "required" : working.presence.mode.startsWith("forbidden") ? "forbidden" : "optional";
    presence.addEventListener("change", () => { const next = context.getWorking(); if (next)
        next.presence = { mode: presence.value }; });
    allowed.addEventListener("input", () => { const next = context.getWorking(); if (!next)
        return; const values = schemaTableStageAllowedValues(next.allowedValues.map(({ value }) => value), allowed.value, next.type); delete next.expectedValue; next.allowedValues = values.map((value, index) => ({ id: next.allowedValues[index]?.id ?? context.id("allowed-value"), value })); if (next.documentation.example.method === "allowed-value" && !values.some((value) => JSON.stringify(value) === JSON.stringify(next.documentation.example.value)))
        next.documentation = { ...next.documentation, example: { method: "allowed-value", value: values[0] } }; renderExample(); });
    description.name = "description";
    description.value = working.documentation.description;
    comments.name = "comments";
    comments.value = working.documentation.comments;
    for (const [control, key] of [[displayText, "displayText"], [description, "description"], [comments, "comments"]])
        control.addEventListener("input", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, [key]: control.value }; });
    const renderExample = () => { const next = context.getWorking(); if (!next)
        return; exampleHost.replaceChildren(); const projection = schemaTableExampleControl(next.documentation.example.method, next.allowedValues.map(({ value }) => value)); if (projection.kind === "none")
        return; if (projection.kind === "select") {
        const select = dom.createElement("select");
        select.name = "exampleValue";
        for (const value of projection.values)
            select.append(new Option(canonicalFacetText(value), canonicalFacetText(value)));
        select.value = canonicalFacetText(next.documentation.example.value);
        select.addEventListener("change", () => { const current = context.getWorking(); if (current)
            current.documentation = { ...current.documentation, example: { method: "allowed-value", value: typedCanonicalValue(current.type, select.value) } }; });
        exampleHost.append(select);
        return;
    } const control = input(dom, "exampleValue", canonicalFacetText(next.documentation.example.value), next.type === "number" || next.type === "integer" ? "number" : "text"); control.addEventListener("input", () => { const current = context.getWorking(); if (current)
        current.documentation = { ...current.documentation, example: { method: "custom", value: typedCanonicalValue(current.type, control.value) } }; }); exampleHost.append(control); };
    exampleMethod.name = "exampleMethod";
    exampleMethod.append(new Option("Blank", "blank"), new Option("Allowed value", "allowed-value"), new Option("Custom value", "custom"));
    exampleMethod.value = working.documentation.example.method;
    exampleMethod.addEventListener("change", () => { const next = context.getWorking(); if (next) {
        next.documentation = { ...next.documentation, example: exampleMethod.value === "blank" ? { method: "blank" } : exampleMethod.value === "allowed-value" ? { method: "allowed-value", value: next.allowedValues[0]?.value } : { method: "custom", value: undefined } };
        renderExample();
    } });
    renderExample();
    const descriptionFacet = dom.createElement("article"), descriptionTarget = "Definition facet Description";
    descriptionFacet.dataset.definitionFacet = "description";
    descriptionFacet.append(labeled(dom, "Description", description));
    for (const action of focusedDefinitionFacetOwnershipActions({ inherited: Boolean(working.inheritedDefinition), local: working.localDefinitionFacets?.includes("documentation") ?? false })) {
        const reset = dom.createElement("button");
        reset.type = "button";
        reset.textContent = action;
        reset.dataset.ownershipAction = action;
        reset.dataset.ownershipTarget = descriptionTarget;
        reset.setAttribute("aria-label", `${action} · ${descriptionTarget}`);
        reset.addEventListener("click", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, description: next.inheritedDefinition?.description ?? "" }; context.render(); });
        descriptionFacet.append(reset);
    }
    host.append(labeled(dom, "Type", type), labeled(dom, "Array item type", itemType), labeled(dom, "Presence", presence), labeled(dom, "Allowed values", allowed), labeled(dom, "Display text", displayText), descriptionFacet, labeled(dom, "Comments", comments), labeled(dom, "Example method", exampleMethod), labeled(dom, "Example value", exampleHost));
}
//# sourceMappingURL=definition.js.map