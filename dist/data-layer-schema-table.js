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
export const schemaTableEditableFacets = ["description", "expected-or-allowed", "example"];
export function schemaTableExpectedOrAllowed(value) {
    if (value.expectedValue !== undefined)
        return String(value.expectedValue);
    return (value.allowedValues ?? []).map(String).join(", ");
}
//# sourceMappingURL=data-layer-schema-table.js.map