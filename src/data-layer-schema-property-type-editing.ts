import type { JsonSchema } from "./data-layer-schema-document.js";
import type { AttachedSchemaRule, SchemaDefinition } from "./data-layer-schema-verification.js";

export type EditablePropertyType = "string" | "number" | "boolean" | "object" | "array";
export type TypeMismatchTreatment = "error" | "warning" | "ignore";

export interface SchemaPropertyTypeEdit {
  path: string;
  type: EditablePropertyType;
  itemType?: Exclude<EditablePropertyType, "array">;
  treatment: TypeMismatchTreatment;
  removeIncompatible: boolean;
  resolutions?: Readonly<Record<string, { action: "remove" | "replace"; value?: string }>>;
}

function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function propertyAt(document: JsonSchema, path: string): JsonSchema | undefined {
  return segments(path).reduce<JsonSchema | undefined>(
    (current, segment) => segment === "*" ? current?.items : current?.properties?.[segment],
    document,
  );
}

function capital(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function schemaPropertyTypeLabel(property: JsonSchema | undefined): string {
  if (!property?.type) return "Unspecified";
  if (property.type !== "array") return capital(property.type);
  return property.items?.type ? `Array of ${capital(property.items.type)}` : "Array";
}

function compatibleExample(value: unknown, type: EditablePropertyType, itemType?: Exclude<EditablePropertyType, "array">): boolean {
  if (type === "array") return Array.isArray(value) && (!itemType || value.every((item) => itemType === "object"
    ? Boolean(item) && typeof item === "object" && !Array.isArray(item)
    : typeof item === itemType));
  if (type === "object") return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  return typeof value === type;
}

function hasDescendantRequiredRelationship(property: JsonSchema | undefined): boolean {
  if (!property) return false;
  if ((property.required?.length ?? 0) > 0) return true;
  if (hasDescendantRequiredRelationship(property.items)) return true;
  return Object.values(property.properties ?? {}).some(hasDescendantRequiredRelationship);
}

function ruleDependsOnPropertyType(rule: AttachedSchemaRule, path: string): boolean {
  return rule.conditionGroup?.predicates.some((predicate) => predicate.propertyPath === path
    && predicate.operator !== "Exists"
    && predicate.operator !== "Does not exist") ?? false;
}

export function inspectSchemaPropertyTypeEdit(
  schema: SchemaDefinition,
  path: string,
  type: EditablePropertyType,
  itemType?: Exclude<EditablePropertyType, "array">,
): { from: string; to: string; compatible: string[]; incompatible: string[] } {
  const property = propertyAt(schema.document, path);
  const documentation = schema.documentation?.properties?.[path];
  const incompatible: string[] = [];
  const typeChanges = type !== property?.type || (type === "array" && itemType !== property.items?.type);
  if (documentation?.example && !compatibleExample(documentation.example.value, type, itemType)) incompatible.push("example value");
  for (const rule of schema.attachedRules ?? []) {
    if (rule.propertyPath === path && (rule.operator ?? "").includes("range") && type !== "number") incompatible.push(`rule ${rule.id}`);
    if (typeChanges && ruleDependsOnPropertyType(rule, path)) incompatible.push(`conditional dependency ${rule.id}`);
  }
  const structural = Boolean(property?.properties || property?.items?.properties);
  if (structural && (type !== property?.type || (type === "array" && itemType !== "object"))) {
    incompatible.push("descendant definitions");
    if (hasDescendantRequiredRelationship(property)) incompatible.push("descendant required relationships");
    if (Object.keys(schema.documentation?.properties ?? {}).some((candidate) => candidate.startsWith(`${path}/`))) incompatible.push("descendant documentation");
    if ((schema.attachedRules ?? []).some(({ propertyPath }) => propertyPath?.startsWith(`${path}/`))) incompatible.push("descendant rules");
  }
  return {
    from:schemaPropertyTypeLabel(property),
    to:type === "array" && itemType ? `Array of ${capital(itemType)}` : capital(type),
    compatible:[
      ...(segments(path).length && schema.document.required?.includes(segments(path)[0]!) ? ["required membership"] : []),
      ...(documentation ? ["documentation"] : []),
    ],
    incompatible,
  };
}

function replaceProperty(document: JsonSchema, path: string, replacement: JsonSchema): JsonSchema {
  const parts = segments(path);
  const visit = (current: JsonSchema, index: number): JsonSchema => {
    const segment = parts[index];
    if (!segment) return replacement;
    if (segment === "*") return { ...current, items:visit(current.items ?? {}, index + 1) };
    return { ...current, properties:{ ...(current.properties ?? {}), [segment]:visit(current.properties?.[segment] ?? {}, index + 1) } };
  };
  return visit(document, 0);
}

function replacementValue(value: string | undefined, type: EditablePropertyType): unknown {
  if (value === undefined || value.trim() === "") throw new Error("Enter a replacement value");
  if (type === "string") return value;
  if (type === "number") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error("Enter a valid Number replacement");
    return parsed;
  }
  if (type === "boolean") {
    if (value === "true") return true;
    if (value === "false") return false;
    throw new Error("Enter true or false as the replacement");
  }
  try { return JSON.parse(value) as unknown; }
  catch { throw new Error(`Enter valid JSON for the ${capital(type)} replacement`); }
}

export function applySchemaPropertyTypeEdit(schema: SchemaDefinition, edit: SchemaPropertyTypeEdit): SchemaDefinition {
  const property = propertyAt(schema.document, edit.path) ?? {};
  const impact = inspectSchemaPropertyTypeEdit(schema, edit.path, edit.type, edit.itemType);
  const resolutions: Record<string, { action: "remove" | "replace"; value?: string }> = edit.resolutions
    ? Object.fromEntries(Object.entries(edit.resolutions).map(([key, resolution]) => [key, { ...resolution }]))
    : edit.removeIncompatible ? Object.fromEntries(impact.incompatible.map((item) => [item, { action:"remove" as const }])) : {};
  if (impact.incompatible.some((item) => !resolutions[item])) throw new Error("Resolve every incompatible schema artifact before saving the type change");
  const unsupportedReplacement = impact.incompatible.find((item) => resolutions[item]?.action === "replace" && item !== "example value" && !item.startsWith("conditional dependency "));
  if (unsupportedReplacement) throw new Error(`${unsupportedReplacement} must be removed before saving the type change`);
  const remove = (item: string): boolean => resolutions[item]?.action === "remove";
  let replacement: JsonSchema = { type:edit.type, typeMismatchTreatment:edit.treatment };
  if (edit.type === "array" && edit.itemType) {
    replacement = {
      ...replacement,
      items:{
        type:edit.itemType,
        typeMismatchTreatment:edit.treatment,
        ...(edit.itemType === "object" && property.items?.properties ? {
          properties:structuredClone(property.items.properties),
          ...(property.items.required ? { required:structuredClone(property.items.required) } : {}),
        } : {}),
      },
    };
  }
  if (edit.type === "object" && property.type === "object") replacement = {
    ...replacement,
    ...(property.properties ? { properties:structuredClone(property.properties) } : {}),
    ...(property.required ? { required:structuredClone(property.required) } : {}),
  };
  const documentation = structuredClone(schema.documentation ?? {});
  const currentDocumentation = documentation.properties?.[edit.path];
  if (currentDocumentation?.example && !compatibleExample(currentDocumentation.example.value, edit.type, edit.itemType)) {
    if (remove("example value")) {
      const { example:_example, ...retained } = currentDocumentation;
      documentation.properties = { ...documentation.properties, [edit.path]:retained };
    } else {
      const value = replacementValue(resolutions["example value"]?.value, edit.type) as string | number | boolean | null;
      if (!compatibleExample(value, edit.type, edit.itemType)) throw new Error("Example replacement is not compatible with the selected type");
      documentation.properties = { ...documentation.properties, [edit.path]:{ ...currentDocumentation, example:{ ...currentDocumentation.example, value } } };
    }
  }
  if (remove("descendant documentation") && documentation.properties) documentation.properties = Object.fromEntries(Object.entries(documentation.properties).filter(([key]) => !key.startsWith(`${edit.path}/`)));
  const attachedRules = (schema.attachedRules ?? []).flatMap((rule) => {
    if (remove(`rule ${rule.id}`) || (remove("descendant rules") && rule.propertyPath?.startsWith(`${edit.path}/`))) return [];
    const dependency = `conditional dependency ${rule.id}`;
    if (!impact.incompatible.includes(dependency)) return [rule];
    if (remove(dependency)) return [];
    const value = replacementValue(resolutions[dependency]?.value, edit.type);
    return [{ ...rule, conditionGroup:{ ...rule.conditionGroup!, predicates:rule.conditionGroup!.predicates.map((predicate) => predicate.propertyPath === edit.path && predicate.operator !== "Exists" && predicate.operator !== "Does not exist" ? { ...predicate, comparison:{ type:edit.type as "string" | "number" | "boolean", value:value as string | number | boolean } } : predicate) } }];
  });
  return {
    ...schema,
    document:replaceProperty(schema.document, edit.path, replacement),
    ...(schema.documentation ? { documentation } : {}),
    ...(schema.attachedRules ? { attachedRules } : {}),
  };
}
