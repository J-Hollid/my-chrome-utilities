import type { JsonSchema } from "./data-layer-schema-verification.js";

export interface NestedValueMatch {
  templatePath: string;
  concretePath: string;
  value: unknown;
  exists: boolean;
}

export interface NestedTargetChoice {
  label: "Nested property" | "This item only" | "This property in every item";
  path: string;
  matchedValueCount: number;
  itemNumber?: number;
  zeroBasedIndex?: number;
}

function pathSegments(path: string): string[] {
  const canonical = path.trim().replaceAll(".", "/");
  return canonical.split("/").filter(Boolean);
}

export function canonicalNestedPath(path: string): string {
  return `/${pathSegments(path).join("/")}`;
}

export function canonicalPathForTargetIntent(intent: string): string {
  const normalized = intent.trim().toLowerCase();
  const indexed = normalized.match(/^(.+) item at zero-based index (\d+)$/);
  if (indexed) return `/${indexed[1]?.trim().replaceAll(" ", "/")}/${indexed[2]}`;
  const everyItem = normalized.match(/^(.+) in every (.+) item$/);
  if (everyItem) return `/${everyItem[2]?.trim().replaceAll(" ", "/")}/*/${everyItem[1]?.trim().replaceAll(" ", "/")}`;
  return `/${normalized.replace(/^nested\s+/, "").replaceAll(" ", "/")}`;
}

function missingMatch(templatePath: string, concrete: readonly string[], remaining: readonly string[]): NestedValueMatch[] {
  if (remaining.includes("*")) return [];
  return [{ templatePath, concretePath:`/${[...concrete, ...remaining].join("/")}`, value:undefined, exists:false }];
}

export function resolveNestedValues(value: unknown, path: string): NestedValueMatch[] {
  const segments = pathSegments(path);
  const templatePath = `/${segments.join("/")}`;
  const visit = (current: unknown, remaining: readonly string[], concrete: readonly string[]): NestedValueMatch[] => {
    const [segment, ...rest] = remaining;
    if (segment === undefined) return [{ templatePath, concretePath:`/${concrete.join("/")}`, value:current, exists:true }];
    if (segment === "*") {
      if (!Array.isArray(current)) return [];
      return current.flatMap((item, index) => visit(item, rest, [...concrete, String(index)]));
    }
    if (Array.isArray(current) && /^\d+$/.test(segment)) {
      const index = Number(segment);
      return index < current.length
        ? visit(current[index], rest, [...concrete, segment])
        : missingMatch(templatePath, [...concrete, segment], rest);
    }
    if (current && typeof current === "object" && !Array.isArray(current)) {
      const record = current as Record<string, unknown>;
      return Object.prototype.hasOwnProperty.call(record, segment)
        ? visit(record[segment], rest, [...concrete, segment])
        : missingMatch(templatePath, [...concrete, segment], rest);
    }
    return missingMatch(templatePath, [...concrete, segment], rest);
  };
  return visit(value, segments, []);
}

export function nestedTargetChoices(value: unknown, concretePath: string): NestedTargetChoice[] {
  const canonical = canonicalNestedPath(concretePath);
  const segments = pathSegments(canonical);
  let current = value;
  let arrayIndex = -1;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index] as string;
    if (Array.isArray(current) && /^\d+$/.test(segment)) { arrayIndex = index; current = current[Number(segment)]; continue; }
    current = current && typeof current === "object" ? (current as Record<string, unknown>)[segment] : undefined;
  }
  if (arrayIndex < 0) return [{ label:"Nested property", path:canonical, matchedValueCount:resolveNestedValues(value, canonical).filter(({ exists }) => exists).length }];
  const zeroBasedIndex = Number(segments[arrayIndex]);
  const wildcard = [...segments]; wildcard[arrayIndex] = "*";
  const wildcardPath = `/${wildcard.join("/")}`;
  return [
    { label:"This item only", path:canonical, matchedValueCount:1, itemNumber:zeroBasedIndex + 1, zeroBasedIndex },
    { label:"This property in every item", path:wildcardPath, matchedValueCount:resolveNestedValues(value, wildcardPath).filter(({ exists }) => exists).length },
  ];
}

export interface NestedTargetInspection {
  result: "accepted" | "blocked";
  assistance: string;
  canonicalPath: string;
  targetType?: JsonSchema["type"];
}

export function validateNestedRuleTarget(document: JsonSchema, path: string): NestedTargetInspection {
  const segments = pathSegments(path);
  const canonicalPath = `/${segments.join("/")}`;
  if (path.includes("/-") || segments.some((segment) => /^-\d+$/.test(segment))) return { result:"blocked", assistance:"Enter a non-negative array index", canonicalPath };
  let schema: JsonSchema | undefined = document;
  let containerName = "root";
  let usedWildcard = false;
  let usedIndex: number | undefined;
  for (const segment of segments) {
    if (segment === "*" || /^\d+$/.test(segment)) {
      if (schema?.type !== "array") return { result:"blocked", assistance:`${containerName} is not an array`, canonicalPath };
      usedWildcard ||= segment === "*"; if (/^\d+$/.test(segment)) usedIndex = Number(segment);
      schema = schema.items; continue;
    }
    if (schema?.type === "array") {
      if (schema.items?.type !== "object") return { result:"blocked", assistance:`${containerName} items cannot contain property ${segment}`, canonicalPath };
      schema = schema.items.properties?.[segment]; containerName = segment; continue;
    }
    if (schema?.type !== "object") return { result:"blocked", assistance:`${containerName} cannot contain child properties`, canonicalPath };
    schema = schema.properties?.[segment]; containerName = segment;
  }
  if (!schema?.type) return { result:"blocked", assistance:"Target path is not present in the schema model", canonicalPath };
  const last = segments.at(-1) ?? "value";
  const assistance = usedWildcard
    ? `Targets ${last} in every ${segments[0]} item`
    : usedIndex !== undefined
      ? `Targets item ${usedIndex + 1} at zero-based index ${usedIndex}`
      : `Targets nested property ${segments.join(" ")}`;
  return { result:"accepted", assistance, canonicalPath, targetType:schema.type };
}

export function ensureNestedSchemaPath(document: JsonSchema, path: string, targetType: NonNullable<JsonSchema["type"]>): { document:JsonSchema; createdNodes:string[] } {
  const segments = pathSegments(path);
  const createdNodes: string[] = [];
  const add = (schema: JsonSchema, remaining: readonly string[], prefix: readonly string[]): JsonSchema => {
    const [segment, ...rest] = remaining;
    if (segment === undefined) return schema;
    if (segment === "*" || /^\d+$/.test(segment)) {
      const marker = "*";
      const items = schema.items ?? (rest.length ? { type:"object" as const } : { type:targetType });
      if (!schema.items) createdNodes.push(`/${[...prefix, marker].join("/")}`);
      return { ...schema, type:"array", items:rest.length ? add(items, rest, [...prefix, marker]) : items };
    }
    const properties = schema.properties ?? {};
    const next = rest[0];
    const child = properties[segment] ?? (rest.length ? (next === "*" || /^\d+$/.test(next ?? "") ? { type:"array" as const } : { type:"object" as const }) : { type:targetType });
    if (!properties[segment]) createdNodes.push(`/${[...prefix, segment].join("/")}`);
    return { ...schema, type:"object", properties:{ ...properties, [segment]:rest.length ? add(child, rest, [...prefix, segment]) : child } };
  };
  return { document:add(structuredClone(document), segments, []), createdNodes };
}
