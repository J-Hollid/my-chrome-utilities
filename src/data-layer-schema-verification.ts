import type { ValidationState } from "./data-layer-source.js";

export type ValidationTarget = "payload" | "raw input";
export interface SchemaDefinition { id: string; name: string; version: number; document: JsonSchema; assignments: readonly SchemaAssignment[]; }
export interface SchemaAssignment { sourceId: string; eventName: string; target: ValidationTarget; }
export interface JsonSchema { type?: "object" | "string" | "number" | "boolean" | "array"; required?: readonly string[]; properties?: Record<string, JsonSchema>; items?: JsonSchema; }
export interface ValidationIssue { instancePath: string; message: string; expected: string; actual: string; schemaName: string; schemaVersion: number; schemaLocation: string; }
export interface ValidationResult { state: ValidationState; issues: readonly ValidationIssue[]; schema?: Pick<SchemaDefinition, "id" | "name" | "version">; target?: ValidationTarget; }
export interface ValidatableEvent { sourceId: string; eventName: string; payload: unknown; rawInput: unknown; }

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

function issuesFor(value: unknown, schema: JsonSchema, path: string, schemaPath: string, result: ValidationIssue[], metadata: Pick<SchemaDefinition, "name" | "version">): void {
  if (schema.type && valueType(value) !== schema.type) result.push({ instancePath: path, message: "Type mismatch", expected: schema.type, actual: valueType(value), schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: schemaPath });
  if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const property of schema.required ?? []) if (!(property in record)) result.push({ instancePath: `${path}/${property}`, message: "Required value", expected: schema.properties?.[property]?.type ?? "value", actual: "missing", schemaName: metadata.name, schemaVersion: metadata.version, schemaLocation: `${schemaPath}/required` });
    for (const [property, child] of Object.entries(schema.properties ?? {})) if (property in record) issuesFor(record[property], child, `${path}/${property}`, `${schemaPath}/properties/${property}`, result, metadata);
  }
  if (schema.type === "array" && Array.isArray(value) && schema.items) value.forEach((item, index) => issuesFor(item, schema.items as JsonSchema, `${path}/${index}`, `${schemaPath}/items`, result, metadata));
}

export function validateEvent(event: ValidatableEvent, schemas: readonly SchemaDefinition[]): ValidationResult {
  const match = schemas.flatMap((schema) => schema.assignments.map((assignment) => ({ schema, assignment }))).find(({ assignment }) => assignment.sourceId === event.sourceId && assignment.eventName === event.eventName);
  if (!match) return { state: "Not checked", issues: [] };
  const value = match.assignment.target === "payload" ? event.payload : event.rawInput;
  const issues: ValidationIssue[] = [];
  issuesFor(value, match.schema.document, "", "#", issues, match.schema);
  return { state: issues.length === 0 ? "Valid" : `${issues.length} issues`, issues, schema: { id: match.schema.id, name: match.schema.name, version: match.schema.version }, target: match.assignment.target };
}
export function validationSummary(results: readonly ValidationResult[]): { Valid: number; Issues: number; "Not checked": number } { return { Valid: results.filter((result) => result.state === "Valid").length, Issues: results.filter((result) => result.state.endsWith("issues")).length, "Not checked": results.filter((result) => result.state === "Not checked").length }; }
export function filterByValidation<T extends { validation: ValidationState }>(events: readonly T[], state: ValidationState): T[] { return events.filter((event) => event.validation === state); }
export function revalidateExplicitly(event: ValidatableEvent, schemas: readonly SchemaDefinition[], version: number): ValidationResult { return validateEvent(event, schemas.filter((schema) => schema.version === version)); }
