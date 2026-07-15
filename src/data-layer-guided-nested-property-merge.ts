import type { GuidedValueType } from "./data-layer-guided-validation-types.js";
import { parseTargetExpression } from "./data-layer-recursive-property-tree.js";
import type { JsonSchema } from "./data-layer-schema-document.js";

function guidedType(type: GuidedValueType): JsonSchema["type"] {
  return type === "String" ? "string"
    : type === "Number" ? "number"
      : type === "Boolean" ? "boolean"
        : type === "Array" ? "array"
          : type === "Object" ? "object"
            : undefined;
}

export function guidedPropertyDocument(path: string, type: GuidedValueType): JsonSchema {
  const segments = path.startsWith("$")
    ? parseTargetExpression(path).map((segment) => segment.kind === "property" ? String(segment.value) : segment.kind === "every" ? "*" : String(segment.value))
    : path.startsWith("/")
      ? path.slice(1).split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
      : path.replace(/^\$\.?/, "").split(".").filter(Boolean);
  const leafType = guidedType(type);
  const build = (remaining: readonly string[]): JsonSchema => {
    const [segment, ...rest] = remaining;
    if (segment === undefined) return leafType ? { type:leafType } : {};
    const child = build(rest);
    return segment === "*" || /^\d+$/.test(segment)
      ? { type:"array", items:child }
      : { type:"object", properties:{ [segment]:child } };
  };
  return build(segments);
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
