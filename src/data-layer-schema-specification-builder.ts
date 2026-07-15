import { resolveEffectiveSchemaDocumentation, resolvePropertyDocumentation } from "./data-layer-schema-documentation.js";
import type { JsonSchema } from "./data-layer-schema-document.js";
import type { AttachedSchemaRule, SchemaDefinition } from "./data-layer-schema-verification.js";
import { schemaPropertyRows } from "./data-layer-schema-rule-property-identity.js";
import { conditionalRuleSummary } from "./data-layer-conditional-validation-rules.js";

export interface SpecificationRow {
  canonicalPath: string; propertyName: string; description: string; mandatory: string;
  type: string; example?: string; allowedValues: readonly (string | number | boolean | null)[]; allowedValuesText?: string;
}
export interface SpecificationClipboard { html: string; plain: string; }
export interface SpecificationProperty { canonicalPath: string; propertyName: string; origin: "local" | "inherited"; container: boolean; selectedByDefault: boolean; }

function typeLabel(schema: JsonSchema | undefined): string {
  if (!schema?.type) return "Unspecified";
  const type = schema.type;
  if (type === "array") { const itemType = schema.items?.type; return itemType === "object" ? "Array of Object" : `Array of ${itemType ? itemType.charAt(0).toUpperCase() + itemType.slice(1) : "Unspecified"}`; }
  return type.charAt(0).toUpperCase() + type.slice(1);
}
function requiredFor(path: string, document: JsonSchema, rules: readonly AttachedSchemaRule[]): string {
  const conditional = rulesFor(path, rules).filter((rule) => rule.operator?.replaceAll("_", "-").toLowerCase() === "required" && rule.conditionGroup);
  if (conditional.length) return conditional.map((rule) => `Yes when ${conditionalRuleSummary({ conditionGroup:rule.conditionGroup!, consequence:{ propertyPath:path, operator:"required" } }).replace(/^(When |For each [^,]+, when )/u, "").replace(/, [^,]+$/u, "")}`).join("; ");
  const segments = path.split("/").filter(Boolean); let current: JsonSchema | undefined = document; let required = false;
  for (const segment of segments) {
    if (!current) break;
    if (segment === "*") { current = current.items; continue; }
    required = current.required?.includes(segment) ?? false;
    current = current.properties?.[segment] ?? current.items;
  }
  return required ? "Yes" : "No";
}

function parentChain(schema: SchemaDefinition, allSchemas: readonly SchemaDefinition[]): SchemaDefinition[] {
  const result: SchemaDefinition[] = []; const visited = new Set<string>(); let parentId = schema.parentSchemaId;
  while (parentId && !visited.has(parentId)) { visited.add(parentId); const parent = allSchemas.find(({ id }) => id === parentId); if (!parent) break; result.push(parent); parentId = parent.parentSchemaId; }
  return result;
}
function effectiveRules(schema: SchemaDefinition, allSchemas: readonly SchemaDefinition[]): AttachedSchemaRule[] {
  const inherited = parentChain(schema, allSchemas).reverse().flatMap((parent) => parent.attachedRules ?? []).filter((rule) => schema.inheritedRuleOverrides?.[rule.propertyPath ?? ""] !== "disabled");
  const local = schema.attachedRules ?? []; const localKeys = new Set(local.map((rule) => `${rule.id}:${rule.propertyPath ?? ""}`));
  return [...inherited.filter((rule) => !localKeys.has(`${rule.id}:${rule.propertyPath ?? ""}`)), ...local].filter((rule) => rule.enabled !== false);
}
export function specificationProperties(schema: SchemaDefinition, allSchemas: readonly SchemaDefinition[] = [schema]): SpecificationProperty[] {
  const parents = parentChain(schema, allSchemas);
  return schemaPropertyRows(schema.document, parents.map(({ document }) => document)).filter(({ canonicalPath }) => !canonicalPath.endsWith("/*")).map((row) => {
    const container = row.schema.type === "object" || row.schema.type === "array";
    return { canonicalPath:row.canonicalPath, propertyName:row.canonicalPath.slice(1).replaceAll("/*", "[]").replaceAll("/", "."), origin:row.origin, container, selectedByDefault:!container };
  });
}
function rulesFor(path: string, rules: readonly AttachedSchemaRule[]): AttachedSchemaRule[] {
  return rules.filter((rule) => rule.enabled !== false && rule.propertyPath === path);
}
function allowedFor(path: string, rules: readonly AttachedSchemaRule[]): { values: (string | number | boolean | null)[]; text: string } {
  const relevant = rulesFor(path, rules).filter((rule) => rule.operator?.replaceAll("_", "-").toLowerCase() === "allowed-values" && rule.allowedValues);
  const unconditional = relevant.filter(({ conditionGroup }) => !conditionGroup); const conditional = relevant.filter(({ conditionGroup }) => conditionGroup);
  let values = unconditional.length ? [...unconditional[0]!.allowedValues!] : [];
  for (const rule of unconditional.slice(1)) values=values.filter((value)=>rule.allowedValues!.some((candidate)=>Object.is(candidate,value)));
  const conflict=unconditional.length>1&&!values.length;
  const groups:string[]=[conflict?"Conflict: no values satisfy all effective rules":values.join(" | ")];
  conditional.forEach((rule)=>groups.push(`${rule.allowedValues!.join(" | ")} when ${conditionalRuleSummary({conditionGroup:rule.conditionGroup!,consequence:{propertyPath:path,operator:"allowed-values"}}).replace(/^(When |For each [^,]+, when )/u,"").replace(/, [^,]+$/u,"")}`));
  return {values,text:groups.filter(Boolean).join("; ")};
}
function schemaAt(document: JsonSchema, path: string): JsonSchema | undefined {
  return path.split("/").filter(Boolean).reduce<JsonSchema | undefined>((current, segment) => segment === "*" ? current?.items : current?.properties?.[segment] ?? current?.items, document);
}

export function deriveSpecificationRows(schema: SchemaDefinition, selectedPaths: readonly string[], allSchemas: readonly SchemaDefinition[] = [schema]): SpecificationRow[] {
  const documentation = resolveEffectiveSchemaDocumentation(schema, allSchemas);
  const rules = effectiveRules(schema, allSchemas);
  return selectedPaths.map((canonicalPath) => {
    const documents=[schema.document,...parentChain(schema, allSchemas).map(({document})=>document)];
    const owningDocument=documents.find((document)=>schemaAt(document,canonicalPath))??schema.document;
    const property = schemaAt(owningDocument, canonicalPath);
    const doc = resolvePropertyDocumentation(documentation, canonicalPath);
    const example = doc?.example?.value;
    const allowed=allowedFor(canonicalPath,rules);
    return { canonicalPath, propertyName:canonicalPath.slice(1).replaceAll("/*", "[]" ).replaceAll("/", "."), description:doc?.description ?? "", mandatory:requiredFor(canonicalPath, owningDocument, rules), type:typeLabel(property), ...(example !== undefined ? { example:String(example) } : {}), allowedValues:allowed.values, ...(allowed.text?{allowedValuesText:allowed.text}:{}) };
  });
}
function escape(value: unknown): string { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function cell(row: SpecificationRow, key: keyof SpecificationRow): string { const value = key === "allowedValues" ? row.allowedValuesText ?? row.allowedValues.join(" | ") : row[key] ?? ""; return String(value); }
export function renderSpecificationClipboard(rows: readonly SpecificationRow[]): SpecificationClipboard {
  const columns: (keyof SpecificationRow)[] = ["propertyName", "description", "mandatory", "type", "example", "allowedValues"];
  const labels = ["Property name", "Description", "Mandatory", "Type", "Example value", "Allowed values"];
  const html = `<table><thead><tr>${labels.map((label) => `<th>${escape(label)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((key) => `<td>${escape(cell(row, key))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const plain = [labels, ...rows.map((row) => columns.map((key) => cell(row, key)))].map((line) => line.map((value) => String(value).replaceAll("\t", " ").replaceAll("\n", " ")).join("\t")).join("\n");
  return { html, plain };
}
