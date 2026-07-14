import type { JsonSchema } from "./data-layer-schema-document.js";

export type ManualPropertyValueType = "string" | "number" | "boolean" | "object" | "array";
export type ManualArrayItemType = Exclude<ManualPropertyValueType, "array">;

export interface ManualPropertyDefinition {
  path: string;
  type: ManualPropertyValueType;
  arrayItemType?: ManualArrayItemType;
}

export type ManualPropertyInspection =
  | { result:"ready"; normalizedPath:string; missingObjectPath:readonly string[] }
  | { result:"blocked"; normalizedPath:string; missingObjectPath:readonly string[]; assistance:string; existingPath?:string };

interface ParsedPath {
  segments: string[];
  normalizedPath: string;
  hasEmptySegment: boolean;
}

function parsePath(path: string): ParsedPath {
  const trimmed = path.trim();
  if (!trimmed) return { segments:[], normalizedPath:"", hasEmptySegment:false };
  const separated = trimmed.replaceAll("/", ".");
  const withoutLeadingSeparator = separated.startsWith(".") ? separated.slice(1) : separated;
  const segments = withoutLeadingSeparator.split(".").map((segment) => segment.trim());
  return {
    segments,
    normalizedPath:`/${segments.filter(Boolean).join("/")}`,
    hasEmptySegment:segments.some((segment) => !segment),
  };
}

function propertyAt(document: JsonSchema, segments: readonly string[]): JsonSchema | undefined {
  let property: JsonSchema | undefined = document;
  for (const segment of segments) property = property?.properties?.[segment];
  return property;
}

function inheritedPropertyAt(documents: readonly JsonSchema[], segments: readonly string[]): JsonSchema | undefined {
  return documents.map((document) => propertyAt(document, segments)).find(Boolean);
}

export function inspectManualProperty(
  document: JsonSchema,
  inheritedDocuments: readonly JsonSchema[],
  definition: ManualPropertyDefinition,
): ManualPropertyInspection {
  const parsed = parsePath(definition.path);
  if (!parsed.segments.length) return { result:"blocked", normalizedPath:"", missingObjectPath:[], assistance:"Enter a property path" };
  if (parsed.hasEmptySegment) return { result:"blocked", normalizedPath:parsed.normalizedPath, missingObjectPath:[], assistance:"Remove the empty path segment" };

  const missingObjectPath: string[] = [];
  for (let index = 0; index < parsed.segments.length - 1; index += 1) {
    const prefix = parsed.segments.slice(0, index + 1);
    const local = propertyAt(document, prefix);
    const inherited = inheritedPropertyAt(inheritedDocuments, prefix);
    const existing = local ?? inherited;
    if (existing && existing.type !== "object") {
      return { result:"blocked", normalizedPath:parsed.normalizedPath, missingObjectPath, assistance:`${prefix.join(".")} cannot contain child properties` };
    }
    if (!local) missingObjectPath.push(parsed.segments[index] as string);
  }

  const local = propertyAt(document, parsed.segments);
  if (local) {
    const existingPath = parsed.segments.join(".");
    return { result:"blocked", normalizedPath:parsed.normalizedPath, missingObjectPath, assistance:`Go to existing property ${existingPath}`, existingPath };
  }
  if (inheritedPropertyAt(inheritedDocuments, parsed.segments)) {
    const inheritedPath = parsed.segments.join(".");
    return { result:"blocked", normalizedPath:parsed.normalizedPath, missingObjectPath, assistance:`${inheritedPath} is defined by the parent schema` };
  }
  if (definition.type === "array" && !definition.arrayItemType) {
    return { result:"blocked", normalizedPath:parsed.normalizedPath, missingObjectPath, assistance:"Select an array item type" };
  }
  return { result:"ready", normalizedPath:parsed.normalizedPath, missingObjectPath };
}

function manualLeaf(definition: ManualPropertyDefinition): JsonSchema {
  return {
    type:definition.type,
    propertyOrigin:"manual",
    ...(definition.type === "array" && definition.arrayItemType ? { items:{ type:definition.arrayItemType } } : {}),
  };
}

function addAtPath(document: JsonSchema, segments: readonly string[], definition: ManualPropertyDefinition): JsonSchema {
  const [name, ...rest] = segments;
  if (!name) return structuredClone(document);
  const properties = document.properties ?? {};
  if (!rest.length) return { ...structuredClone(document), type:document.type ?? "object", properties:{ ...structuredClone(properties), [name]:manualLeaf(definition) } };
  const child = properties[name] ?? { type:"object", propertyOrigin:"manual" as const };
  return { ...structuredClone(document), type:document.type ?? "object", properties:{ ...structuredClone(properties), [name]:addAtPath(child, rest, definition) } };
}

export function addManualProperty(
  document: JsonSchema,
  inheritedDocuments: readonly JsonSchema[],
  definition: ManualPropertyDefinition,
): JsonSchema {
  const inspection = inspectManualProperty(document, inheritedDocuments, definition);
  if (inspection.result === "blocked") throw new Error(inspection.assistance);
  return addAtPath(document, parsePath(definition.path).segments, definition);
}

export function manualPropertyPreview(definition: ManualPropertyDefinition): string {
  const path = parsePath(definition.path).segments.join(".");
  return definition.type === "array" && definition.arrayItemType
    ? `${path} is an array of ${definition.arrayItemType}`
    : `${path} is ${definition.type}`;
}
