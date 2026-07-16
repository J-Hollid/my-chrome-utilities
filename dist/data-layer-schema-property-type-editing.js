const segments = (path) => path.split("/").filter(Boolean);
function propertyAt(document, path) { return segments(path).reduce((current, segment) => segment === "*" ? current?.items : current?.properties?.[segment], document); }
function capital(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
export function schemaPropertyTypeLabel(property) { if (!property?.type)
    return "Unspecified"; if (property.type !== "array")
    return capital(property.type); return property.items?.type ? `Array of ${capital(property.items.type)}` : "Array"; }
function compatibleExample(value, type, itemType) { if (type === "array")
    return Array.isArray(value) && (!itemType || value.every((item) => itemType === "object" ? !!item && typeof item === "object" && !Array.isArray(item) : typeof item === itemType)); if (type === "object")
    return !!value && typeof value === "object" && !Array.isArray(value); return typeof value === type; }
export function inspectSchemaPropertyTypeEdit(schema, path, type, itemType) { const property = propertyAt(schema.document, path), documentation = schema.documentation?.properties?.[path], incompatible = []; if (documentation?.example && !compatibleExample(documentation.example.value, type, itemType))
    incompatible.push("example value"); for (const rule of schema.attachedRules ?? [])
    if (rule.propertyPath === path && ((rule.operator ?? "").includes("range") && type !== "number"))
        incompatible.push(`rule ${rule.id}`); const structural = Boolean(property?.properties || property?.items?.properties); if (structural && (type !== property?.type || (type === "array" && itemType !== "object"))) {
    incompatible.push("descendant definitions");
    if (Object.keys(schema.documentation?.properties ?? {}).some((candidate) => candidate.startsWith(`${path}/`)))
        incompatible.push("descendant documentation");
    if ((schema.attachedRules ?? []).some(({ propertyPath }) => propertyPath?.startsWith(`${path}/`)))
        incompatible.push("descendant rules");
} return { from: schemaPropertyTypeLabel(property), to: type === "array" && itemType ? `Array of ${capital(itemType)}` : capital(type), compatible: [...(segments(path).length && schema.document.required?.includes(segments(path)[0]) ? ["required membership"] : []), ...(documentation ? ["documentation"] : [])], incompatible }; }
function replaceProperty(document, path, replacement) { const parts = segments(path); const visit = (current, index) => { const segment = parts[index]; if (!segment)
    return replacement; if (segment === "*")
    return { ...current, items: visit(current.items ?? {}, index + 1) }; return { ...current, properties: { ...(current.properties ?? {}), [segment]: visit(current.properties?.[segment] ?? {}, index + 1) } }; }; return visit(document, 0); }
export function applySchemaPropertyTypeEdit(schema, edit) { const property = propertyAt(schema.document, edit.path) ?? {}, impact = inspectSchemaPropertyTypeEdit(schema, edit.path, edit.type, edit.itemType); if (impact.incompatible.length && !edit.removeIncompatible)
    throw new Error("Resolve incompatible schema data before saving the type change"); let replacement = { type: edit.type, typeMismatchTreatment: edit.treatment }; if (edit.type === "array" && edit.itemType)
    replacement = { ...replacement, items: { type: edit.itemType, typeMismatchTreatment: edit.treatment, ...(edit.itemType === "object" && property.items?.properties ? { properties: structuredClone(property.items.properties), ...(property.items.required ? { required: structuredClone(property.items.required) } : {}) } : {}) } }; if (edit.type === "object" && property.type === "object")
    replacement = { ...replacement, ...(property.properties ? { properties: structuredClone(property.properties) } : {}), ...(property.required ? { required: structuredClone(property.required) } : {}) }; const documentation = structuredClone(schema.documentation ?? {}), currentDoc = documentation.properties?.[edit.path]; if (currentDoc?.example && !compatibleExample(currentDoc.example.value, edit.type, edit.itemType)) {
    const { example: _example, ...retained } = currentDoc;
    documentation.properties = { ...documentation.properties, [edit.path]: retained };
} if (edit.removeIncompatible && documentation.properties)
    documentation.properties = Object.fromEntries(Object.entries(documentation.properties).filter(([key]) => !key.startsWith(`${edit.path}/`))); const attachedRules = (schema.attachedRules ?? []).filter((rule) => !(impact.incompatible.includes(`rule ${rule.id}`) || (edit.removeIncompatible && rule.propertyPath?.startsWith(`${edit.path}/`)))); return { ...schema, document: replaceProperty(schema.document, edit.path, replacement), ...(schema.documentation ? { documentation } : {}), ...(schema.attachedRules ? { attachedRules } : {}) }; }
//# sourceMappingURL=data-layer-schema-property-type-editing.js.map