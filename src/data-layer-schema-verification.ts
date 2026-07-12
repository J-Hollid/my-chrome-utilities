import type { ValidationState } from "./data-layer-source.js";

export type ValidationTarget = "payload" | "raw input";
export interface AttachedSchemaRule { id: string; name?: string; version: number; propertyPath?: string; operator?: string; parameters?: string; severity?: string; message?: string; enabled?: boolean; }
export interface SchemaDefinition { id: string; name: string; version: number; document: JsonSchema; assignments: readonly SchemaAssignment[]; attachedRules?: readonly AttachedSchemaRule[]; parentSchemaId?: string; inheritedRuleOverrides?: Readonly<Record<string, "inherit" | "enabled" | "disabled">>; revisionHistory?: readonly SchemaDefinition[]; }
export interface SchemaAssignment {
  sourceId: string;
  eventName: string;
  target: ValidationTarget;
  id?: string;
  name?: string;
  priority?: number;
  domainCondition?: string;
  pathnameCondition?: string;
  enabled?: boolean;
  versionPolicy?: "pinned" | "follow latest";
}
export interface JsonSchema { type?: "object" | "string" | "number" | "boolean" | "array"; required?: readonly string[]; forbidden?: readonly string[]; properties?: Record<string, JsonSchema>; items?: JsonSchema; minimum?: number; maximum?: number; additionalProperties?: boolean; }
export interface ValidationIssue { instancePath: string; message: string; expected: string; actual: string; schemaName: string; schemaVersion: number; schemaLocation: string; rule?: string; severity?: string; origin?: string; }
export interface ValidationResult { state: ValidationState; issues: readonly ValidationIssue[]; schema?: Pick<SchemaDefinition, "id" | "name" | "version">; target?: ValidationTarget; assignment?: Pick<SchemaAssignment, "id" | "name" | "sourceId" | "eventName" | "target" | "priority" | "domainCondition" | "pathnameCondition">; inheritedFrom?: readonly Pick<SchemaDefinition, "id" | "name" | "version">[]; }
export interface ValidatableEvent { sourceId: string; eventName: string; payload: unknown; rawInput: unknown; }
export interface AssignmentResolution { schema?: SchemaDefinition; assignment?: SchemaAssignment; error?: string; }

function clone<T>(value: T): T { return structuredClone(value); }
function valueType(value: unknown): string { return Array.isArray(value) ? "array" : value === null ? "null" : typeof value; }
function schemaId(name: string, version: number): string { return `schema:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${version}`; }

export function createSchema(name: string, version: number, document: JsonSchema): SchemaDefinition {
  return { id: schemaId(name, version), name, version, document: clone(document), assignments: [] };
}
export function importSchema(serialized: string): SchemaDefinition { return clone(JSON.parse(serialized) as SchemaDefinition); }
export function exportSchema(schema: SchemaDefinition): string { return JSON.stringify(schema); }
export function assignSchema(schema: SchemaDefinition, assignment: SchemaAssignment): SchemaDefinition {
  return { ...schema, assignments: [...schema.assignments.filter((item) => !(item.sourceId === assignment.sourceId && item.eventName === assignment.eventName && item.target === assignment.target)), clone(assignment)] };
}
export function reviseSchema(schema: SchemaDefinition, document: JsonSchema): SchemaDefinition { return { ...schema, id: schemaId(schema.name, schema.version + 1), version: schema.version + 1, document: clone(document), revisionHistory:[...(schema.revisionHistory ?? []), clone(schema)] }; }
export function duplicateSchema(schema: SchemaDefinition, name: string): SchemaDefinition { return { ...clone(schema), id: schemaId(name, schema.version), name }; }
export function schemaInheritanceError(schema: SchemaDefinition, schemas: readonly SchemaDefinition[]): string | undefined {
  if (!schema.parentSchemaId) return undefined;
  if (schema.parentSchemaId === schema.id) return "A schema cannot inherit from itself";
  const parents = new Map<string, string | undefined>(schemas.map((item) => [item.id, item.parentSchemaId]));
  if (!parents.has(schema.parentSchemaId)) return "The selected parent schema does not exist";
  let current: string | undefined = schema.parentSchemaId;
  while (current) { if (current === schema.id) return "Schema inheritance cannot contain a cycle"; current = parents.get(current); }
  const parent = schemas.find((candidate) => candidate.id === schema.parentSchemaId);
  const childTarget = schema.assignments[0]?.target;
  const parentTarget = parent?.assignments[0]?.target;
  if (childTarget && parentTarget && childTarget !== parentTarget) return "Parent and child validation targets must match";
  return undefined;
}
export function schemaInheritanceConflict(schema: SchemaDefinition, schemas: readonly SchemaDefinition[]): string | undefined {
  let parentId = schema.parentSchemaId;
  while (parentId) {
    const parent = schemas.find((candidate) => candidate.id === parentId);
    if (!parent) return undefined;
    for (const [property, localRule] of Object.entries(schema.document.properties ?? {})) {
      if (schema.inheritedRuleOverrides?.[property] === "disabled") continue;
      const inheritedRule = parent.document.properties?.[property];
      if (localRule.type && inheritedRule?.type && localRule.type !== inheritedRule.type) return `Inheritance conflict: ${property} is ${inheritedRule.type} in ${parent.name} but ${localRule.type} locally`;
    }
    parentId = parent.parentSchemaId;
  }
  return undefined;
}
export function searchSchemas(schemas: readonly SchemaDefinition[], query: string): SchemaDefinition[] { const q = query.toLowerCase(); return schemas.filter((schema) => [schema.name, schema.version, ...schema.assignments.flatMap((a) => [a.sourceId, a.eventName, a.target])].join(" ").toLowerCase().includes(q)); }

function glob(value: string, pattern: string | undefined): boolean {
  if (!pattern || pattern === "any") return true;
  const expression = `^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*")}$`;
  return new RegExp(expression, "i").test(value);
}

export function resolveSchemaAssignment(
  event: Pick<ValidatableEvent, "sourceId" | "eventName">,
  pageUrl: string,
  schemas: readonly SchemaDefinition[],
): AssignmentResolution {
  const url = new URL(pageUrl);
  const matches = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment })))
    .filter(({ assignment }) => assignment.enabled !== false && assignment.sourceId === event.sourceId && assignment.eventName === event.eventName)
    .filter(({ assignment }) => glob(url.hostname, assignment.domainCondition) && glob(url.pathname, assignment.pathnameCondition));
  if (matches.length === 0) return {};
  const highest = Math.max(...matches.map(({ assignment }) => assignment.priority ?? 0));
  const selected = matches.filter(({ assignment }) => (assignment.priority ?? 0) === highest);
  if (selected.length !== 1) return { error: `Assignment error: ${selected.map(({ assignment }) => assignment.name ?? assignment.id ?? "unnamed assignment").join(", ")}` };
  return selected[0] ?? {};
}

export const SCHEMA_LIBRARY_STORAGE_KEY = "my-chrome-utilities.schema-library.v1";
export function serializeSchemaLibrary(schemas: readonly SchemaDefinition[]): string { return JSON.stringify(schemas); }
export function restoreSchemaLibrary(serialized: string | null): SchemaDefinition[] {
  if (!serialized) return [];
  try { const parsed = JSON.parse(serialized); return Array.isArray(parsed) ? parsed.filter((schema): schema is SchemaDefinition => !!schema && typeof schema.id === "string" && typeof schema.name === "string" && typeof schema.version === "number").map(clone) : []; }
  catch { return []; }
}

function issuesFor(value: unknown, schema: JsonSchema, path: string, schemaPath: string, result: ValidationIssue[], metadata: Pick<SchemaDefinition, "name" | "version">): void {
  if (schema.type && valueType(value) !== schema.type) result.push({ instancePath: path, message: "Type mismatch", expected: schema.type, actual: valueType(value), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: schemaPath });
  if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const property of schema.required ?? []) if (!(property in record)) result.push({ instancePath: `${path}/${property}`, message: "Required value", expected: schema.properties?.[property]?.type ?? "value", actual: "missing", schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/required` });
    for (const property of schema.forbidden ?? []) if (property in record) result.push({ instancePath: `${path}/${property}`, message: "Forbidden property", expected: "absent", actual: valueType(record[property]), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/forbidden` });
    if (schema.additionalProperties === false) for (const property of Object.keys(record)) if (!(property in (schema.properties ?? {}))) result.push({ instancePath: `${path}/${property}`, message: "Undeclared property", expected: "declared property", actual: valueType(record[property]), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/additionalProperties` });
    for (const [property, child] of Object.entries(schema.properties ?? {})) if (property in record) issuesFor(record[property], child, `${path}/${property}`, `${schemaPath}/properties/${property}`, result, metadata);
  }
  if (schema.type === "number" && typeof value === "number") { if (schema.minimum !== undefined && value < schema.minimum) result.push({ instancePath:path, message:"Value below minimum", expected:String(schema.minimum), actual:String(value), schemaName:metadata.name, schemaVersion:metadata.version, schemaLocation:`${schemaPath}/minimum` }); if (schema.maximum !== undefined && value > schema.maximum) result.push({ instancePath:path, message:"Value above maximum", expected:String(schema.maximum), actual:String(value), schemaName:metadata.name, schemaVersion:metadata.version, schemaLocation:`${schemaPath}/maximum` }); }
  if (schema.type === "array" && Array.isArray(value) && schema.items) value.forEach((item, index) => issuesFor(item, schema.items as JsonSchema, `${path}/${index}`, `${schemaPath}/items`, result, metadata));
}

function issueFromAttachedRule(rule: AttachedSchemaRule, schema: SchemaDefinition, issue: Pick<ValidationIssue, "instancePath" | "message" | "expected" | "actual">): ValidationIssue {
  return { ...issue, message:rule.message ?? issue.message, schemaName:schema.name, schemaVersion:schema.version, schemaLocation:`#/attachedRules/${rule.id}`, rule:`${rule.name ?? rule.id} v${rule.version}`, severity:rule.severity ?? "error", origin:`${schema.name} v${schema.version}` };
}

function attachedRuleIssues(value: unknown, schema: SchemaDefinition, result: ValidationIssue[], rules = schema.attachedRules ?? []): void {
  for (const rule of rules) {
    if (rule.enabled === false) continue;
    const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
    if (rule.operator === "required") for (const property of rule.parameters?.split(",").map((item) => item.trim()).filter(Boolean) ?? []) if (!record || !(property in record)) result.push(issueFromAttachedRule(rule, schema, { instancePath:`/${property}`, message:"Required value", expected:"value", actual:"missing" }));
    const [property, constraint] = rule.parameters?.split(":", 2) ?? [];
    if (!record || !property || !(property in record)) continue;
    if (rule.operator === "allowed-values" && constraint && !constraint.split(",").map((item) => item.trim()).includes(String(record[property]))) result.push(issueFromAttachedRule(rule, schema, { instancePath:`/${property}`, message:"Value is not allowed", expected:constraint, actual:String(record[property]) }));
    if (rule.operator === "regular-expression" && constraint) { try { if (!new RegExp(constraint).test(String(record[property]))) result.push(issueFromAttachedRule(rule, schema, { instancePath:`/${property}`, message:"Value does not match pattern", expected:constraint, actual:String(record[property]) })); } catch { result.push(issueFromAttachedRule(rule, schema, { instancePath:`/${property}`, message:"Invalid regular expression", expected:constraint, actual:String(record[property]) })); } }
  }
}

function inheritedAttachedRuleIssues(value: unknown, schema: SchemaDefinition, schemas: readonly SchemaDefinition[], result: ValidationIssue[]): void {
  const disabled = new Set(Object.entries(schema.inheritedRuleOverrides ?? {}).filter(([, state]) => state === "disabled").map(([path]) => path));
  const visited = new Set<string>([schema.id]); let parentId = schema.parentSchemaId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = schemas.find((candidate) => candidate.id === parentId);
    if (!parent) break;
    attachedRuleIssues(value, parent, result, (parent.attachedRules ?? []).filter((rule) => !rule.propertyPath || !disabled.has(rule.propertyPath)));
    parentId = parent.parentSchemaId;
  }
}

function collectSchemaIssues(value: unknown, schema: SchemaDefinition, schemas: readonly SchemaDefinition[], result: ValidationIssue[]): void {
  issuesFor(value, inheritedDocument(schema, schemas), "", "#", result, schema);
  attachedRuleIssues(value, schema, result);
  inheritedAttachedRuleIssues(value, schema, schemas, result);
}

function inheritedDocument(schema: SchemaDefinition, schemas: readonly SchemaDefinition[], visited = new Set<string>()): JsonSchema {
  if (!schema.parentSchemaId || visited.has(schema.id)) return schema.document;
  visited.add(schema.id);
  const parent = schemas.find((candidate) => candidate.id === schema.parentSchemaId);
  if (!parent) return schema.document;
  const inherited = inheritedDocument(parent, schemas, visited);
  const disabled = new Set(Object.entries(schema.inheritedRuleOverrides ?? {}).filter(([, state]) => state === "disabled").map(([property]) => property));
  const inheritedProperties = Object.fromEntries(Object.entries(inherited.properties ?? {}).filter(([property]) => !disabled.has(property)));
  return {
    ...inherited,
    ...schema.document,
    required:[...new Set([...(inherited.required ?? []).filter((property) => !disabled.has(property)), ...(schema.document.required ?? [])])],
    properties:{ ...inheritedProperties, ...(schema.document.properties ?? {}) },
  };
}

function inheritedSchemaProvenance(schema: SchemaDefinition, schemas: readonly SchemaDefinition[]): Pick<SchemaDefinition, "id" | "name" | "version">[] {
  const parents: Pick<SchemaDefinition, "id" | "name" | "version">[] = [];
  const visited = new Set<string>([schema.id]); let parentId = schema.parentSchemaId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId); const parent = schemas.find((candidate) => candidate.id === parentId);
    if (!parent) break;
    parents.push({ id:parent.id, name:parent.name, version:parent.version }); parentId = parent.parentSchemaId;
  }
  return parents;
}

export function validateEvent(event: ValidatableEvent, schemas: readonly SchemaDefinition[], pageUrl?: string): ValidationResult {
  if (pageUrl) {
    const resolution = resolveSchemaAssignment(event, pageUrl, schemas);
    if (resolution.error) return { state: "Assignment error", issues: [] };
    if (resolution.schema && resolution.assignment) {
      const value = resolution.assignment.target === "payload" ? event.payload : event.rawInput;
      const issues: ValidationIssue[] = []; collectSchemaIssues(value, resolution.schema, schemas, issues);
      const inheritedFrom = inheritedSchemaProvenance(resolution.schema, schemas);
      return { state: issues.length === 0 ? "Valid" : `${issues.length} issues`, issues, schema: { id: resolution.schema.id, name: resolution.schema.name, version: resolution.schema.version }, target: resolution.assignment.target, assignment:resolution.assignment, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
    }
  }
  const match = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment }))).find(({ assignment }) => assignment.sourceId === event.sourceId && assignment.eventName === event.eventName);
  if (!match) return { state: "Not checked", issues: [] };
  const value = match.assignment.target === "payload" ? event.payload : event.rawInput;
  const issues: ValidationIssue[] = [];
  collectSchemaIssues(value, match.schema, schemas, issues);
  const inheritedFrom = inheritedSchemaProvenance(match.schema, schemas);
  return { state: issues.length === 0 ? "Valid" : `${issues.length} issues`, issues, schema: { id: match.schema.id, name: match.schema.name, version: match.schema.version }, target: match.assignment.target, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
}
export function validateWithSchema(event: ValidatableEvent, schema: SchemaDefinition, schemas: readonly SchemaDefinition[], target: ValidationTarget = schema.assignments[0]?.target ?? "payload"): ValidationResult {
  const value = target === "payload" ? event.payload : event.rawInput;
  const issues: ValidationIssue[] = [];
  collectSchemaIssues(value, schema, schemas, issues);
  const inheritedFrom = inheritedSchemaProvenance(schema, schemas);
  return { state: issues.length === 0 ? "Valid" : `${issues.length} issues`, issues, schema:{ id:schema.id, name:schema.name, version:schema.version }, target, ...(inheritedFrom.length ? { inheritedFrom } : {}) };
}
export function validationSummary(results: readonly ValidationResult[]): { Valid: number; Issues: number; "Not checked": number } { return { Valid: results.filter((result) => result.state === "Valid").length, Issues: results.filter((result) => result.state.endsWith("issues")).length, "Not checked": results.filter((result) => result.state === "Not checked").length }; }
export function filterByValidation<T extends { validation: ValidationState }>(events: readonly T[], state: ValidationState): T[] { return events.filter((event) => event.validation === state); }
export function revalidateExplicitly(event: ValidatableEvent, schemas: readonly SchemaDefinition[], version: number): ValidationResult { return validateEvent(event, schemas.filter((schema) => schema.version === version)); }
