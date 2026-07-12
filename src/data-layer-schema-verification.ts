import type { ValidationState } from "./data-layer-source.js";

export type ValidationTarget = "payload" | "raw input";
export interface RuleAttachment { ruleId: string; version: number; }
export interface ReusableSchemaRule { id: string; version: number; name: string; applicableTypes: string; operator: string; parameters: string; severity?: string; message?: string; }
export interface SchemaDefinition { id: string; name: string; version: number; document: JsonSchema; assignments: readonly SchemaAssignment[]; parentId?: string; ruleAttachments?: readonly RuleAttachment[]; }
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
  manualOverride?: boolean;
}
export interface JsonSchema { type?: "object" | "string" | "number" | "boolean" | "array"; required?: readonly string[]; properties?: Record<string, JsonSchema>; items?: JsonSchema; }
export interface ValidationIssue { instancePath: string; message: string; expected: string; actual: string; schemaName: string; schemaVersion: number; schemaLocation: string; severity?: string; }
export interface ValidationResult { state: ValidationState; issues: readonly ValidationIssue[]; schema?: Pick<SchemaDefinition, "id" | "name" | "version">; target?: ValidationTarget; }
export interface SchemaValidationRecord { eventId: string; validatedAt: string; result: ValidationResult; }
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
export function reviseSchema(schema: SchemaDefinition, document: JsonSchema): SchemaDefinition { return { ...schema, id: schemaId(schema.name, schema.version + 1), version: schema.version + 1, document: clone(document) }; }
export function duplicateSchema(schema: SchemaDefinition, name: string): SchemaDefinition { return { ...clone(schema), id: schemaId(name, schema.version), name }; }
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
export const SCHEMA_VALIDATION_RECORDS_STORAGE_KEY = "my-chrome-utilities.schema-validation-records.v1";
export function saveSchemaValidationRecord(records: readonly SchemaValidationRecord[], eventId: string, result: ValidationResult, validatedAt = new Date().toISOString()): SchemaValidationRecord[] { return [...records, { eventId, validatedAt, result: clone(result) }]; }
export function restoreSchemaValidationRecords(serialized: string | null): SchemaValidationRecord[] { try { const records = JSON.parse(serialized ?? "[]"); return Array.isArray(records) ? records.filter((record): record is SchemaValidationRecord => !!record && typeof record.eventId === "string" && typeof record.validatedAt === "string" && !!record.result).map(clone) : []; } catch { return []; } }
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
    for (const [property, child] of Object.entries(schema.properties ?? {})) if (property in record) issuesFor(record[property], child, `${path}/${property}`, `${schemaPath}/properties/${property}`, result, metadata);
  }
  if (schema.type === "array" && Array.isArray(value) && schema.items) value.forEach((item, index) => issuesFor(item, schema.items as JsonSchema, `${path}/${index}`, `${schemaPath}/items`, result, metadata));
}

function inheritedDocument(schema: SchemaDefinition, schemas: readonly SchemaDefinition[], visited = new Set<string>()): JsonSchema {
  if (!schema.parentId || visited.has(schema.id)) return schema.document;
  visited.add(schema.id);
  const parent = schemas.find((candidate) => candidate.id === schema.parentId);
  if (!parent) return schema.document;
  const inherited = inheritedDocument(parent, schemas, visited);
  return { ...inherited, ...schema.document, required:[...new Set([...(inherited.required ?? []), ...(schema.document.required ?? [])])], properties:{ ...(inherited.properties ?? {}), ...(schema.document.properties ?? {}) } };
}

function inheritedRuleAttachments(schema: SchemaDefinition, schemas: readonly SchemaDefinition[], visited = new Set<string>()): readonly RuleAttachment[] {
  if (!schema.parentId || visited.has(schema.id)) return schema.ruleAttachments ?? [];
  visited.add(schema.id);
  const parent = schemas.find((candidate) => candidate.id === schema.parentId);
  const attachments = [...(parent ? inheritedRuleAttachments(parent, schemas, visited) : []), ...(schema.ruleAttachments ?? [])];
  return attachments.filter((attachment, index) => attachments.findIndex((candidate) => candidate.ruleId === attachment.ruleId && candidate.version === attachment.version) === index);
}

function ruleIssuesFor(value: unknown, schema: SchemaDefinition, schemas: readonly SchemaDefinition[], rules: readonly ReusableSchemaRule[], result: ValidationIssue[]): void {
  for (const attachment of inheritedRuleAttachments(schema, schemas)) {
    const rule = rules.find((candidate) => candidate.id === attachment.ruleId && candidate.version === attachment.version);
    const location = `#/ruleAttachments/${encodeURIComponent(attachment.ruleId)}@${attachment.version}`;
    if (!rule) {
      result.push({ instancePath: "", message: "Pinned rule unavailable", expected: `${attachment.ruleId} v${attachment.version}`, actual: "unavailable", schemaName: schema.name, schemaVersion: schema.version, schemaLocation: location });
      continue;
    }
    const types = rule.applicableTypes.split(",").map((type) => type.trim().toLowerCase()).filter(Boolean);
    if (types.length > 0 && !types.includes("any") && !types.includes(valueType(value))) continue;
    const expected = rule.operator === "required" ? "a present value" : rule.parameters || "an allowed value";
    const missing = value === undefined || value === null || (typeof value === "string" && value.trim() === "");
    const allowed = rule.parameters.split(",").map((parameter) => parameter.trim()).filter(Boolean);
    const fails = rule.operator === "required" ? missing : rule.operator === "allowed-values" && allowed.length > 0 && !allowed.includes(String(value));
    if (fails) result.push({ instancePath: "", message: rule.message || rule.name, expected, actual: missing ? "missing" : String(value), schemaName: schema.name, schemaVersion: schema.version, schemaLocation: location, ...(rule.severity ? { severity:rule.severity } : {}) });
  }
}

function validationFor(schema: SchemaDefinition, assignment: SchemaAssignment, event: ValidatableEvent, schemas: readonly SchemaDefinition[], rules: readonly ReusableSchemaRule[]): ValidationResult {
  const value = assignment.target === "payload" ? event.payload : event.rawInput;
  const issues: ValidationIssue[] = [];
  issuesFor(value, inheritedDocument(schema, schemas), "", "#", issues, schema);
  ruleIssuesFor(value, schema, schemas, rules, issues);
  return { state: issues.length === 0 ? "Valid" : `${issues.length} issues`, issues, schema: { id: schema.id, name: schema.name, version: schema.version }, target: assignment.target };
}

export function validateEvent(event: ValidatableEvent, schemas: readonly SchemaDefinition[], pageUrl?: string, rules: readonly ReusableSchemaRule[] = []): ValidationResult {
  if (pageUrl) {
    const resolution = resolveSchemaAssignment(event, pageUrl, schemas);
    if (resolution.error) return { state: "Assignment error", issues: [] };
    if (resolution.schema && resolution.assignment) {
      return validationFor(resolution.schema, resolution.assignment, event, schemas, rules);
    }
  }
  const match = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment }))).find(({ assignment }) => assignment.sourceId === event.sourceId && assignment.eventName === event.eventName);
  if (!match) return { state: "Not checked", issues: [] };
  return validationFor(match.schema, match.assignment, event, schemas, rules);
}
export function validationSummary(results: readonly ValidationResult[]): { Valid: number; Issues: number; "Not checked": number } { return { Valid: results.filter((result) => result.state === "Valid").length, Issues: results.filter((result) => result.state.endsWith("issues")).length, "Not checked": results.filter((result) => result.state === "Not checked").length }; }
export function filterByValidation<T extends { validation: ValidationState }>(events: readonly T[], state: ValidationState): T[] { return events.filter((event) => event.validation === state); }
export function revalidateExplicitly(event: ValidatableEvent, schemas: readonly SchemaDefinition[], version: number, rules: readonly ReusableSchemaRule[] = []): ValidationResult { return validateEvent(event, schemas.filter((schema) => schema.version === version), undefined, rules); }
