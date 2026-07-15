function decode(segment) {
    return segment.replaceAll("~1", "/").replaceAll("~0", "~");
}
function templatePointer(pointer) {
    return pointer.replace(/\/\d+(?=\/|$)/g, "/*");
}
function schemaAtPointer(document, pointer) {
    let current = document;
    for (const encoded of pointer.split("/").filter(Boolean)) {
        const segment = decode(encoded);
        current = segment === "*" || /^\d+$/.test(segment) ? current?.items : current?.properties?.[segment];
    }
    return current;
}
function schemaLineage(schema, schemas) {
    const lineage = [schema];
    const visited = new Set(schema.id ? [schema.id] : []);
    let parentSchemaId = schema.parentSchemaId;
    while (parentSchemaId && !visited.has(parentSchemaId)) {
        const parent = schemas.find(({ id }) => id === parentSchemaId);
        if (!parent)
            break;
        lineage.push(parent);
        if (parent.id)
            visited.add(parent.id);
        parentSchemaId = parent.parentSchemaId;
    }
    return lineage;
}
function inputType(definition, value) {
    if (value === null)
        return "null";
    if (definition?.type === "number" || definition?.type === "boolean" || definition?.type === "string")
        return definition.type;
    if (typeof value === "number")
        return "number";
    if (typeof value === "boolean")
        return "boolean";
    return "string";
}
export function exampleValueFromInput(input, type, selectionMethod = "custom") {
    if (type === "string")
        return { value: input, selectionMethod };
    if (type === "number") {
        const value = Number(input);
        return input.trim() && Number.isFinite(value) ? { value, selectionMethod } : undefined;
    }
    if (type === "boolean") {
        if (input === "true")
            return { value: true, selectionMethod };
        if (input === "false")
            return { value: false, selectionMethod };
        return undefined;
    }
    return input.trim() === "null" ? { value: null, selectionMethod } : undefined;
}
function normalizedOperator(rule) {
    return rule.operator?.replaceAll("_", "-").replaceAll(" ", "-").toLowerCase() ?? "";
}
function configuredAllowedValues(rule, definition) {
    if (rule.allowedValues)
        return [...structuredClone(rule.allowedValues)];
    return (rule.parameters?.split(",").map((value) => value.trim()).filter(Boolean) ?? [])
        .flatMap((value) => exampleValueFromInput(value, inputType(definition))?.value ?? []);
}
export function schemaPropertyExampleChoices(schema, pointer, schemas = [schema]) {
    const template = templatePointer(pointer);
    const lineage = schemaLineage(schema, schemas);
    const definition = lineage.map(({ document }) => schemaAtPointer(document, pointer)).find(Boolean);
    const rule = lineage.flatMap(({ attachedRules }) => attachedRules ?? []).find((candidate) => candidate.enabled !== false
        && normalizedOperator(candidate) === "allowed-values"
        && templatePointer(candidate.propertyPath ?? "") === template);
    return rule ? configuredAllowedValues(rule, definition) : [];
}
export function schemaPropertyExampleInputType(schema, pointer, value, schemas = [schema]) {
    const definition = schemaLineage(schema, schemas).map(({ document }) => schemaAtPointer(document, pointer)).find(Boolean);
    return inputType(definition, value);
}
export function schemaPropertyExampleConflicts(example, allowedValues) {
    return Boolean(example && allowedValues.length && !allowedValues.some((value) => Object.is(value, example.value)));
}
export function createExamplePrefillState() {
    return { values: {}, initialized: [] };
}
export function prefillExampleOnce(state, pointer, value) {
    if (state.initialized.includes(pointer))
        return structuredClone(state);
    return {
        values: { ...state.values, [pointer]: value === undefined ? "" : String(value) },
        initialized: [...state.initialized, pointer],
    };
}
//# sourceMappingURL=data-layer-schema-property-example-values.js.map