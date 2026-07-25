export const schemaTableColumns = [
    { key: "property", label: "Property" },
    { key: "path", label: "Path" },
    { key: "type", label: "Type" },
    { key: "presence", label: "Presence" },
    { key: "description", label: "Description" },
    { key: "expected-or-allowed", label: "Expected or allowed value" },
    { key: "example", label: "Example" },
    { key: "source", label: "Source" },
    { key: "local-effective-state", label: "Local/effective state" },
    { key: "validation-state", label: "Validation state" },
];
export const schemaTableCellMetadata = schemaTableColumns.map(({ key, label }) => ({ key, label }));
export const schemaTableOverlayStyle = "position:absolute;left:0;top:100%;z-index:10;width:min(42rem,calc(100vw - 3rem));max-width:calc(100vw - 3rem);box-sizing:border-box;overflow:auto;background:Canvas;border:1px solid ButtonBorder;padding:0.75rem;";
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
export function schemaTableValueFacet(value) {
    if (value.expectedValue !== undefined)
        return { kind: "expected", text: String(value.expectedValue), value: value.expectedValue };
    const values = value.allowedValues ?? [];
    return { kind: "allowed", text: values.map(String).join(", "), values };
}
export function schemaTableExpectedOrAllowed(value) {
    return schemaTableValueFacet(value).text;
}
const parsedScalar = (text, previous) => {
    if (typeof previous === "string")
        return text;
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
};
export function schemaTableStageExpectedOrAllowed(source, text) {
    const facet = schemaTableValueFacet(source);
    const entries = text.split(",").map((entry) => entry.trim()).filter(Boolean), { expectedValue: _, allowedValues: __, ...rest } = source;
    if (entries.length > 1)
        return { ...rest, allowedValues: entries.map((entry) => parsedScalar(entry, facet.kind === "expected" ? facet.value : facet.values[0])) };
    if (!entries.length)
        return { ...rest, allowedValues: [] };
    return { ...rest, expectedValue: parsedScalar(entries[0], facet.kind === "expected" ? facet.value : facet.values[0]) };
}
//# sourceMappingURL=data-layer-schema-table.js.map