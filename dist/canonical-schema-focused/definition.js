import { schemaTableExpectedOrAllowed, schemaTableStageExpectedOrAllowed } from "../data-layer-schema-table.js";
import { input, labeled } from "./dom.js";
const types = ["string", "number", "integer", "boolean", "object", "array", "null"];
export function renderDefinitionSection(host, context, working) {
    const { dom } = context, type = dom.createElement("select"), itemType = dom.createElement("select"), presence = dom.createElement("select"), ordinary = input(dom, "ordinaryValue", schemaTableExpectedOrAllowed({ ...(working.expectedValue === undefined ? {} : { expectedValue: working.expectedValue }), allowedValues: working.allowedValues.map(({ value }) => value) })), displayText = input(dom, "displayText", working.documentation.displayText), description = dom.createElement("textarea"), comments = dom.createElement("textarea"), exampleMethod = dom.createElement("select"), exampleValue = input(dom, "exampleValue", working.documentation.example.value === undefined ? "" : String(working.documentation.example.value));
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
    ordinary.addEventListener("input", () => { const next = context.getWorking(); if (!next)
        return; const staged = schemaTableStageExpectedOrAllowed({ ...(next.expectedValue === undefined ? {} : { expectedValue: next.expectedValue }), allowedValues: next.allowedValues.map(({ value }) => value) }, ordinary.value); if (staged.expectedValue === undefined)
        delete next.expectedValue;
    else
        next.expectedValue = staged.expectedValue; next.allowedValues = (staged.allowedValues ?? []).map((value, index) => ({ id: next.allowedValues[index]?.id ?? context.id("allowed-value"), value })); });
    description.name = "description";
    description.value = working.documentation.description;
    comments.name = "comments";
    comments.value = working.documentation.comments;
    for (const [control, key] of [[displayText, "displayText"], [description, "description"], [comments, "comments"]])
        control.addEventListener("input", () => { const next = context.getWorking(); if (next)
            next.documentation = { ...next.documentation, [key]: control.value }; });
    exampleMethod.name = "exampleMethod";
    exampleMethod.append(new Option("Blank", "blank"), new Option("Allowed value", "allowed-value"), new Option("Custom typed value", "custom"));
    exampleMethod.value = working.documentation.example.method;
    exampleMethod.addEventListener("change", () => { const next = context.getWorking(); if (next)
        next.documentation = { ...next.documentation, example: { method: exampleMethod.value, ...(exampleMethod.value === "blank" ? {} : { value: exampleValue.value }) } }; });
    exampleValue.addEventListener("input", () => { const next = context.getWorking(); if (next)
        next.documentation = { ...next.documentation, example: { method: exampleMethod.value === "blank" ? "custom" : exampleMethod.value, value: exampleValue.value } }; });
    host.append(labeled(dom, "Type", type), labeled(dom, "Array item type", itemType), labeled(dom, "Presence", presence), labeled(dom, "Ordinary value", ordinary), labeled(dom, "Display text", displayText), labeled(dom, "Description", description), labeled(dom, "Comments", comments), labeled(dom, "Example method", exampleMethod), labeled(dom, "Example value", exampleValue));
}
//# sourceMappingURL=definition.js.map