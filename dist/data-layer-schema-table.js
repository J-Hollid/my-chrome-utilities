import { typedCanonicalValue } from "./data-layer-canonical-schema-facets.js";
export const schemaTableColumns = [
    { key: "property", label: "Property" },
    { key: "path", label: "Path" },
    { key: "type", label: "Type" },
    { key: "presence", label: "Presence" },
    { key: "description", label: "Description" },
    { key: "expected-or-allowed", label: "Allowed values" },
    { key: "example", label: "Example" },
    { key: "source", label: "Source" },
    { key: "local-effective-state", label: "Local/effective state" },
    { key: "validation-state", label: "Validation state" },
];
export const schemaTableCellMetadata = schemaTableColumns.map(({ key, label }) => ({ key, label }));
export const schemaTableOverlayStyle = "position:absolute;left:0;top:100%;z-index:10;width:min(42rem,calc(100vw - 1rem));max-width:calc(100vw - 1rem);max-height:calc(100vh - 1rem);box-sizing:border-box;overflow:auto;background:Canvas;border:1px solid ButtonBorder;padding:0.75rem;";
export function revealSchemaTableOverlay(layer) {
    queueMicrotask(() => layer.scrollIntoView({ block: "nearest", inline: "nearest" }));
}
export const schemaTableEditableFacets = ["description", "expected-or-allowed", "example"];
export function schemaTableOverlayTransition(state, event) {
    if (event.kind === "open")
        return { phase: "menu", path: event.path };
    if (event.kind === "cancel" || event.kind === "escape")
        return { phase: "closed", ...("path" in state ? { restorePath: state.path } : {}) };
    if (!("path" in state))
        return state;
    return { phase: event.kind === "focus" ? "focused" : "review", path: state.path };
}
const formattedOrdinaryValue = (value) => {
    if (typeof value !== "string")
        return JSON.stringify(value);
    return value === "" || value.trim() !== value || /[,\\"[\]{}]/.test(value) ? JSON.stringify(value) : value;
};
export function schemaTableValueFacet(value) {
    if (value.expectedValue !== undefined)
        return { kind: "expected", text: formattedOrdinaryValue(value.expectedValue), value: value.expectedValue };
    const values = value.allowedValues ?? [];
    return { kind: "allowed", text: values.map(formattedOrdinaryValue).join(", "), values };
}
export function schemaTableExpectedOrAllowed(value) {
    return schemaTableValueFacet(value).text;
}
const parsedScalar = (text, previous) => {
    if (typeof previous === "string") {
        try {
            const parsed = JSON.parse(text);
            return typeof parsed === "string" ? parsed : text;
        }
        catch {
            return text;
        }
    }
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
};
const ordinaryEntries = (text) => {
    const entries = [];
    let start = 0, depth = 0, quote = false, escaped = false;
    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        if (quote) {
            if (escaped)
                escaped = false;
            else if (character === "\\")
                escaped = true;
            else if (character === '"')
                quote = false;
            continue;
        }
        if (character === '"') {
            quote = true;
            continue;
        }
        if (character === "[" || character === "{")
            depth += 1;
        else if (character === "]" || character === "}")
            depth = Math.max(0, depth - 1);
        else if (character === "," && depth === 0) {
            entries.push(text.slice(start, index).trim());
            start = index + 1;
        }
    }
    entries.push(text.slice(start).trim());
    return entries.filter((entry) => entry.length > 0);
};
export function schemaTableAllowedValues(value) {
    const values = value.allowedValues?.length ? value.allowedValues : value.expectedValue === undefined ? [] : [value.expectedValue];
    return values.map(formattedOrdinaryValue).join(", ");
}
export function schemaTableStageAllowedValues(previous, text, type) {
    const entries = ordinaryEntries(text);
    return entries.map((entry, index) => {
        if (type === "string" || type === undefined)
            return parsedScalar(entry, typeof previous[index] === "string" ? previous[index] : "");
        return typedCanonicalValue(type, entry);
    });
}
export function schemaTableExampleControl(method, allowedValues) {
    if (method === "blank")
        return { kind: "none" };
    if (method === "allowed-value")
        return { kind: "select", values: allowedValues };
    return { kind: "input" };
}
export function schemaTableRuleConditionSummary(condition, properties) {
    if (!condition)
        return "Always";
    if (condition.kind === "predicate") {
        const property = properties.find(({ id, name }) => id === condition.propertyId || name === condition.propertyId)?.name ?? condition.propertyId;
        const operator = condition.operator === "Exists" ? "exists" : condition.operator === "Does not exist" ? "does not exist" : condition.operator.toLowerCase();
        return `${property} ${operator}${condition.value === undefined ? "" : ` ${formattedOrdinaryValue(condition.value)}`}`;
    }
    const relation = condition.kind === "all" ? "All" : condition.kind === "any" ? "Any" : "Not";
    return `${relation}: ${condition.children.map((child) => schemaTableRuleConditionSummary(child, properties)).join(condition.kind === "any" ? " or " : " and ")}`;
}
export function schemaTableRuleOutcomeSummary(rule) {
    if (rule.kind === "cardinality") {
        const parts = [rule.minItems === undefined ? "" : `minimum items ${rule.minItems}`, rule.maxItems === undefined ? "" : `maximum items ${rule.maxItems}`].filter(Boolean);
        return parts.join(", ") || "cardinality";
    }
    if (rule.kind === "range") {
        const parts = [rule.minimum === undefined ? "" : `minimum ${rule.minimum}`, rule.maximum === undefined ? "" : `maximum ${rule.maximum}`].filter(Boolean);
        return parts.join(", ") || "range";
    }
    if (rule.kind === "presence")
        return String(rule.presence ?? "presence");
    if (rule.kind === "pattern")
        return `pattern ${String(rule.pattern ?? "")}`.trim();
    if (rule.kind === "value")
        return `allowed values ${schemaTableAllowedValues(rule)}`.trim();
    return String(rule.name ?? rule.kind ?? "reusable rule");
}
export function schemaTableStageExpectedOrAllowed(source, text) {
    const facet = schemaTableValueFacet(source);
    const entries = ordinaryEntries(text), { expectedValue: _, allowedValues: __, ...rest } = source, previous = facet.kind === "expected" ? facet.value : facet.values[0];
    if (entries.length > 1)
        return { ...rest, allowedValues: entries.map((entry) => parsedScalar(entry, previous)) };
    if (!entries.length)
        return { ...rest, allowedValues: [] };
    return { ...rest, expectedValue: parsedScalar(entries[0], previous) };
}
export function schemaTableReplaceExpectedOrAllowed(source, text) {
    const staged = schemaTableStageExpectedOrAllowed(source, text);
    if (staged.expectedValue === undefined)
        return staged;
    const { allowedValueIds: _, allowedValueProvenance: __, ...expected } = staged;
    return { ...expected, allowedValues: [] };
}
//# sourceMappingURL=data-layer-schema-table.js.map