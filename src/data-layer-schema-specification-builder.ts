import { resolveEffectiveSchemaDocumentation, resolvePropertyDocumentation } from "./data-layer-schema-documentation.js";
import type { JsonSchema } from "./data-layer-schema-document.js";
import type { AttachedSchemaRule, SchemaDefinition } from "./data-layer-schema-verification.js";

export interface SpecificationRow {
  canonicalPath: string; propertyName: string; description: string; mandatory: string;
  type: string; example?: string; allowedValues: readonly (string | number | boolean | null)[];
}
export interface SpecificationClipboard { html: string; plain: string; }

function typeLabel(schema: JsonSchema | undefined): string {
  if (!schema?.type) return "Unspecified";
  const type = schema.type;
  if (type === "array") { const itemType = schema.items?.type; return itemType === "object" ? "Array of Object" : `Array of ${itemType ? itemType.charAt(0).toUpperCase() + itemType.slice(1) : "Unspecified"}`; }
  return type.charAt(0).toUpperCase() + type.slice(1);
}
function requiredFor(path: string, document: JsonSchema): string {
  const segments = path.split("/").filter(Boolean); let current: JsonSchema | undefined = document; const conditions: string[] = [];
  for (const segment of segments) {
    if (!current) break;
    if (segment === "*") { current = current.items; continue; }
    if (current.required?.includes(segment)) conditions.push("Yes");
    current = current.properties?.[segment] ?? current.items;
  }
  return conditions.length ? "Yes" : "No";
}
function rulesFor(path: string, rules: readonly AttachedSchemaRule[]): AttachedSchemaRule[] {
  return rules.filter((rule) => rule.enabled !== false && rule.propertyPath === path);
}
function valuesFor(path: string, rules: readonly AttachedSchemaRule[]): (string | number | boolean | null)[] {
  return rulesFor(path, rules).filter((rule) => rule.operator === "allowed-values").flatMap((rule) => [...(rule.allowedValues ?? [])]);
}
function schemaAt(document: JsonSchema, path: string): JsonSchema | undefined {
  return path.split("/").filter(Boolean).reduce<JsonSchema | undefined>((current, segment) => segment === "*" ? current?.items : current?.properties?.[segment] ?? current?.items, document);
}

export function deriveSpecificationRows(schema: SchemaDefinition, selectedPaths: readonly string[], allSchemas: readonly SchemaDefinition[] = [schema]): SpecificationRow[] {
  const documentation = resolveEffectiveSchemaDocumentation(schema, allSchemas);
  const rules = schema.attachedRules ?? [];
  return selectedPaths.map((canonicalPath) => {
    const property = schemaAt(schema.document, canonicalPath);
    const doc = resolvePropertyDocumentation(documentation, canonicalPath);
    const example = doc?.example?.value;
    return { canonicalPath, propertyName:canonicalPath.slice(1).replaceAll("/*", "[]" ).replaceAll("/", "."), description:doc?.description ?? "", mandatory:requiredFor(canonicalPath, schema.document), type:typeLabel(property), ...(example !== undefined ? { example:String(example) } : {}), allowedValues:valuesFor(canonicalPath, rules) };
  });
}
function escape(value: unknown): string { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function cell(row: SpecificationRow, key: keyof SpecificationRow): string { const value = key === "allowedValues" ? row.allowedValues.join(" | ") : row[key] ?? ""; return String(value); }
export function renderSpecificationClipboard(rows: readonly SpecificationRow[]): SpecificationClipboard {
  const columns: (keyof SpecificationRow)[] = ["propertyName", "description", "mandatory", "type", "example", "allowedValues"];
  const labels = ["Property name", "Description", "Mandatory", "Type", "Example value", "Allowed values"];
  const html = `<table><thead><tr>${labels.map((label) => `<th>${escape(label)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((key) => `<td>${escape(cell(row, key))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const plain = [labels, ...rows.map((row) => columns.map((key) => cell(row, key)))].map((line) => line.map((value) => String(value).replaceAll("\t", " ").replaceAll("\n", " ")).join("\t")).join("\n");
  return { html, plain };
}
