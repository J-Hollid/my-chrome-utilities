import { canonicalFacetText, typedCanonicalValue } from "../data-layer-canonical-schema-facets.js";
import { schemaTableAllowedValues, schemaTableExampleControl, schemaTableStageAllowedValues } from "../data-layer-schema-table.js";
import { focusedDefinitionFacetOwnershipActions } from "../data-layer-focused-schema-property-ui.js";
import { input, labeled } from "./dom.js";
const types = ["string", "number", "integer", "boolean", "object", "array", "null"];
export function setCanonicalNestedItemType(root, arrayItemId, type, id) {
    let current = root;
    while (current && current.id !== arrayItemId)
        current = current.items;
    if (!current || current.type !== "array")
        return;
    if (type)
        current.items = { id: current.items?.id ?? id("item"), type };
    else
        delete current.items;
}
const terminalItemSchema = (root) => { let item = root; while (item?.type === "array")
    item = item.items; return item; };
export function renderDefinitionSection(host, context, working) {
    const { dom } = context, concept = input(dom, "concept", working.concept ?? ""), concepts = dom.createElement("datalist"), type = dom.createElement("select"), itemType = dom.createElement("select"), items = dom.createElement("section"), presence = dom.createElement("select"), allowed = input(dom, "ordinaryValue", schemaTableAllowedValues({ ...(working.expectedValue === undefined ? {} : { expectedValue: working.expectedValue }), allowedValues: working.allowedValues.map(({ value }) => value) })), displayText = input(dom, "displayText", working.documentation.displayText), description = dom.createElement("textarea"), comments = dom.createElement("textarea"), exampleMethod = dom.createElement("select"), exampleHost = dom.createElement("span"), installedSuggestions = Array.from(dom.querySelectorAll('datalist[id^="schema-concept-"] option')).map(({ value }) => value), fallbackSuggestions = [...new Set(Object.values(context.current().nodes).map(({ concept }) => concept?.trim()).filter(Boolean))];
    concepts.id = `focused-concepts-${working.id.replace(/[^a-z0-9_-]/gi, "-")}`;
    for (const value of context.conceptSuggestions?.() ?? (installedSuggestions.length ? installedSuggestions : fallbackSuggestions))
        concepts.append(new Option(value, value));
    concept.setAttribute("role", "combobox");
    concept.setAttribute("aria-autocomplete", "list");
    concept.setAttribute("list", concepts.id);
    concept.addEventListener("input", () => { const next = context.getWorking(), value = concept.value.trim(); if (next) {
        if (value)
            next.concept = value;
        else
            delete next.concept;
    } });
    allowed.dataset.allowedValues = "true";
    items.setAttribute("aria-label", "Items");
    items.dataset.arrayItems = "true";
    const renderItems = () => { const next = context.getWorking(); items.replaceChildren(); items.hidden = next?.type !== "array"; const heading = dom.createElement("h3"); heading.textContent = "Items"; itemType.replaceChildren(new Option("Choose item type", ""), ...types.map((entry) => new Option(entry, entry))); itemType.value = next?.itemSchema?.type ?? next?.itemType ?? ""; itemType.required = next?.type === "array"; items.append(heading, labeled(dom, "Array item type", itemType)); if (!next || next.type !== "array")
        return; let schema = next.itemSchema; while (schema?.type === "array") {
        const schemaId = schema.id, nested = dom.createElement("section"), nestedHeading = dom.createElement("h4"), selector = dom.createElement("select");
        nestedHeading.textContent = "Items";
        selector.append(new Option("Choose item type", ""), ...types.map((entry) => new Option(entry, entry)));
        selector.value = schema.items?.type ?? "";
        selector.required = true;
        selector.addEventListener("change", () => { const current = context.getWorking()?.itemSchema; if (!current)
            return; setCanonicalNestedItemType(current, schemaId, selector.value ? selector.value : undefined, context.id); renderItems(); });
        nested.append(nestedHeading, labeled(dom, "Item type", selector));
        items.append(nested);
        schema = schema.items;
    } const scalar = terminalItemSchema(next.itemSchema); if (scalar?.type && scalar.type !== "array" && scalar.type !== "object") {
        const allowedItems = input(dom, "itemAllowedValues", schemaTableAllowedValues({ allowedValues: scalar.allowedValues ?? [] }));
        allowedItems.addEventListener("input", () => { const current = terminalItemSchema(context.getWorking()?.itemSchema); if (current)
            current.allowedValues = schemaTableStageAllowedValues(current.allowedValues ?? [], allowedItems.value, current.type); });
        items.append(labeled(dom, "Item Allowed values", allowedItems));
    } };
    type.name = "propertyType";
    type.append(...types.map((entry) => new Option(entry, entry)));
    type.value = working.type;
    type.addEventListener("change", () => { const next = context.getWorking(); if (next) {
        next.type = type.value;
        if (next.type !== "array") {
            delete next.itemType;
            delete next.itemSchema;
        }
        renderItems();
    } });
    itemType.name = "itemType";
    itemType.addEventListener("change", () => { const next = context.getWorking(); if (next && next.type === "array") {
        if (itemType.value) {
            next.itemType = itemType.value;
            next.itemSchema = { id: next.itemSchema?.id ?? context.id("item"), type: itemType.value };
        }
        else {
            delete next.itemType;
            delete next.itemSchema;
        }
        renderItems();
    } });
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
            current.documentation = { ...current.documentation, example: { method: "allowed-value", value: typedCanonicalValue(current.type, select.value, current.itemSchema) } }; });
        exampleHost.append(select);
        return;
    } const control = input(dom, "exampleValue", canonicalFacetText(next.documentation.example.value), next.type === "number" || next.type === "integer" ? "number" : "text"); control.addEventListener("input", () => { const current = context.getWorking(); if (current)
        current.documentation = { ...current.documentation, example: { method: "custom", value: typedCanonicalValue(current.type, control.value, current.itemSchema) } }; }); exampleHost.append(control); };
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
    renderItems();
    host.append(labeled(dom, "Concept", concept), concepts, labeled(dom, "Type", type), items, labeled(dom, "Presence", presence), labeled(dom, "Allowed values", allowed), labeled(dom, "Display text", displayText), descriptionFacet, labeled(dom, "Comments", comments), labeled(dom, "Example method", exampleMethod), labeled(dom, "Example value", exampleHost));
}
//# sourceMappingURL=definition.js.map