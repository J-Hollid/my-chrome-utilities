import type { AttachedSchemaRule, JsonSchema } from "./data-layer-schema-verification.js";

export interface SchemaPropertyRemovalInspection {
  propertyPath: string;
  descendants: string[];
  affectedRuleAttachments: AttachedSchemaRule[];
  requiresConfirmation: boolean;
}

export interface SchemaPropertyRemoval {
  propertyPath: string;
  document: JsonSchema;
  attachedRules: AttachedSchemaRule[];
  previousDocument: JsonSchema;
  previousAttachedRules: AttachedSchemaRule[];
}

function segments(path: string): string[] {
  return path.replaceAll(".", "/").split("/").map((segment) => segment.trim()).filter(Boolean);
}

function canonical(path: string): string {
  return `/${segments(path).join("/")}`;
}

function propertyAt(document: JsonSchema, path: readonly string[]): JsonSchema | undefined {
  return path.reduce<JsonSchema | undefined>((current, segment) => current?.properties?.[segment], document);
}

function descendantPaths(property: JsonSchema | undefined, prefix: string): string[] {
  return Object.entries(property?.properties ?? {}).flatMap(([name, child]) => {
    const path = `${prefix}/${name}`;
    return [path, ...descendantPaths(child, path)];
  });
}

function normalizedRulePath(rule: AttachedSchemaRule): string {
  return canonical(rule.propertyPath ?? "");
}

export function inspectSchemaPropertyRemoval(
  document: JsonSchema,
  attachedRules: readonly AttachedSchemaRule[],
  path: string,
): SchemaPropertyRemovalInspection {
  const propertyPath = canonical(path);
  const descendants = descendantPaths(propertyAt(document, segments(path)), propertyPath);
  const affectedRuleAttachments = attachedRules
    .filter((rule) => {
      const rulePath = normalizedRulePath(rule);
      return rulePath === propertyPath || rulePath.startsWith(`${propertyPath}/`);
    })
    .map((rule) => structuredClone(rule))
    .sort((left, right) => normalizedRulePath(left).localeCompare(normalizedRulePath(right)));
  return {
    propertyPath,
    descendants,
    affectedRuleAttachments,
    requiresConfirmation:descendants.length > 0 || affectedRuleAttachments.length > 0,
  };
}

function withoutReference(values: readonly string[] | undefined, property: string): readonly string[] | undefined {
  return values ? values.filter((value) => value !== property) : undefined;
}

function removeAtPath(document: JsonSchema, path: readonly string[]): JsonSchema {
  const [name, ...rest] = path;
  if (!name) return structuredClone(document);
  const properties = structuredClone(document.properties ?? {});
  let removedChild = false;
  if (rest.length === 0) {
    removedChild = name in properties;
    delete properties[name];
  } else if (properties[name]) {
    const child = removeAtPath(properties[name], rest);
    if (child.propertyOrigin === "manual" && Object.keys(child.properties ?? {}).length === 0) {
      delete properties[name];
      removedChild = true;
    }
    else properties[name] = child;
  }
  const required = removedChild ? withoutReference(document.required, name) : document.required;
  const forbidden = removedChild ? withoutReference(document.forbidden, name) : document.forbidden;
  return {
    ...structuredClone(document),
    properties,
    ...(required === undefined ? {} : { required }),
    ...(forbidden === undefined ? {} : { forbidden }),
  };
}

export function removeSchemaProperty(
  document: JsonSchema,
  attachedRules: readonly AttachedSchemaRule[],
  path: string,
): SchemaPropertyRemoval {
  const propertyPath = canonical(path);
  const inspection = inspectSchemaPropertyRemoval(document, attachedRules, propertyPath);
  const affected = new Set(inspection.affectedRuleAttachments.map(normalizedRulePath));
  return {
    propertyPath,
    document:removeAtPath(document, segments(propertyPath)),
    attachedRules:attachedRules.filter((rule) => !affected.has(normalizedRulePath(rule))).map((rule) => structuredClone(rule)),
    previousDocument:structuredClone(document),
    previousAttachedRules:attachedRules.map((rule) => structuredClone(rule)),
  };
}

export function undoSchemaPropertyRemoval(removal: SchemaPropertyRemoval): Pick<SchemaPropertyRemoval, "document" | "attachedRules"> {
  return {
    document:structuredClone(removal.previousDocument),
    attachedRules:removal.previousAttachedRules.map((rule) => structuredClone(rule)),
  };
}
