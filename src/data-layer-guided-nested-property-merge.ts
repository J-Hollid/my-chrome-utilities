import type { GuidedValueType } from "./data-layer-guided-validation-types.js";
import { parseTargetExpression } from "./data-layer-recursive-property-tree.js";
import type { JsonSchema } from "./data-layer-schema-document.js";

const schemaTypeByGuidedType: Partial<Record<GuidedValueType, JsonSchema["type"]>> = {
  String:"string",
  Number:"number",
  Boolean:"boolean",
  Array:"array",
  Object:"object",
};

function guidedType(type: GuidedValueType): JsonSchema["type"] {
  return schemaTypeByGuidedType[type];
}

function guidedPathSegments(path: string): string[] {
  return path.startsWith("$")
    ? parseTargetExpression(path).map((segment) => segment.kind === "property" ? String(segment.value) : segment.kind === "every" ? "*" : String(segment.value))
    : path.startsWith("/")
      ? path.slice(1).split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
      : path.replace(/^\$\.?/, "").split(".").filter(Boolean);
}

function propertyDocument(segments: readonly string[], leafType: JsonSchema["type"]): JsonSchema {
  const [segment, ...rest] = segments;
  if (segment === undefined) return leafType ? { type:leafType } : {};
  const child = propertyDocument(rest, leafType);
  return segment === "*" || /^\d+$/.test(segment)
    ? { type:"array", items:child }
    : { type:"object", properties:{ [segment]:child } };
}

export function guidedPropertyDocument(path: string, type: GuidedValueType): JsonSchema {
  const leafType = guidedType(type);
  return propertyDocument(guidedPathSegments(path), leafType);
}

export function mergeGuidedDocument(current: JsonSchema, addition: JsonSchema): JsonSchema {
  const propertyNames = new Set([...Object.keys(current.properties ?? {}), ...Object.keys(addition.properties ?? {})]);
  const properties = Object.fromEntries([...propertyNames].map((name) => {
    const currentChild = current.properties?.[name];
    const additionChild = addition.properties?.[name];
    return [name, currentChild && additionChild ? mergeGuidedDocument(currentChild, additionChild) : currentChild ?? additionChild ?? {}];
  }));
  const items = current.items && addition.items
    ? mergeGuidedDocument(current.items, addition.items)
    : current.items ?? addition.items;
  return {
    ...addition,
    ...current,
    ...(propertyNames.size ? { properties } : {}),
    ...(items ? { items } : {}),
  };
}
