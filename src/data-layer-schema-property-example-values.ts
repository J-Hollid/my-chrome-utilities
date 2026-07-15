import type { JsonSchema } from "./data-layer-schema-document.js";
import type { SchemaPropertyExample, SchemaPropertyExampleScalar } from "./data-layer-schema-documentation.js";
import type { AttachedSchemaRule, SchemaDefinition } from "./data-layer-schema-verification.js";

export type SchemaPropertyExampleInputType = "string" | "number" | "boolean" | "null";

export interface ExamplePrefillState {
  values: Readonly<Record<string, string>>;
  initialized: readonly string[];
}

function decode(segment: string): string {
  return segment.replaceAll("~1", "/").replaceAll("~0", "~");
}

function templatePointer(pointer: string): string {
  return pointer.replace(/\/\d+(?=\/|$)/g, "/*");
}

function schemaAtPointer(document: JsonSchema, pointer: string): JsonSchema | undefined {
  let current: JsonSchema | undefined = document;
  for (const encoded of pointer.split("/").filter(Boolean)) {
    const segment = decode(encoded);
    current = segment === "*" || /^\d+$/.test(segment) ? current?.items : current?.properties?.[segment];
  }
  return current;
}

function inputType(definition: JsonSchema | undefined, value?: unknown): SchemaPropertyExampleInputType {
  if (value === null) return "null";
  if (definition?.type === "number" || definition?.type === "boolean" || definition?.type === "string") return definition.type;
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "string";
}

export function exampleValueFromInput(
  input: string,
  type: SchemaPropertyExampleInputType,
  selectionMethod: SchemaPropertyExample["selectionMethod"] = "custom",
): SchemaPropertyExample | undefined {
  if (type === "string") return { value:input, selectionMethod };
  if (type === "number") {
    const value = Number(input);
    return input.trim() && Number.isFinite(value) ? { value, selectionMethod } : undefined;
  }
  if (type === "boolean") {
    if (input === "true") return { value:true, selectionMethod };
    if (input === "false") return { value:false, selectionMethod };
    return undefined;
  }
  return input.trim() === "null" ? { value:null, selectionMethod } : undefined;
}

function normalizedOperator(rule: AttachedSchemaRule): string {
  return rule.operator?.replaceAll("_", "-").replaceAll(" ", "-").toLowerCase() ?? "";
}

function configuredAllowedValues(rule: AttachedSchemaRule, definition: JsonSchema | undefined): SchemaPropertyExampleScalar[] {
  if (rule.allowedValues) return [...structuredClone(rule.allowedValues)];
  return (rule.parameters?.split(",").map((value) => value.trim()).filter(Boolean) ?? [])
    .flatMap((value) => exampleValueFromInput(value, inputType(definition))?.value ?? []);
}

export function schemaPropertyExampleChoices(
  schema: Pick<SchemaDefinition, "id" | "parentSchemaId" | "document" | "attachedRules">,
  pointer: string,
  schemas: readonly Pick<SchemaDefinition, "id" | "parentSchemaId" | "document" | "attachedRules">[] = [schema],
): SchemaPropertyExampleScalar[] {
  const template = templatePointer(pointer);
  const lineage = [schema];
  const visited = new Set([schema.id]);
  let parentSchemaId = schema.parentSchemaId;
  while (parentSchemaId && !visited.has(parentSchemaId)) {
    const parent = schemas.find(({ id }) => id === parentSchemaId);
    if (!parent) break;
    lineage.push(parent);
    visited.add(parent.id);
    parentSchemaId = parent.parentSchemaId;
  }
  const definition = lineage.map(({ document }) => schemaAtPointer(document, pointer)).find(Boolean);
  const rule = lineage.flatMap(({ attachedRules }) => attachedRules ?? []).find((candidate) => candidate.enabled !== false
    && normalizedOperator(candidate) === "allowed-values"
    && templatePointer(candidate.propertyPath ?? "") === template);
  return rule ? configuredAllowedValues(rule, definition) : [];
}

export function schemaPropertyExampleInputType(
  schema: Pick<SchemaDefinition, "document">,
  pointer: string,
  value?: unknown,
): SchemaPropertyExampleInputType {
  return inputType(schemaAtPointer(schema.document, pointer), value);
}

export function schemaPropertyExampleConflicts(
  example: SchemaPropertyExample | undefined,
  allowedValues: readonly SchemaPropertyExampleScalar[],
): boolean {
  return Boolean(example && allowedValues.length && !allowedValues.some((value) => Object.is(value, example.value)));
}

export function createExamplePrefillState(): ExamplePrefillState {
  return { values:{}, initialized:[] };
}

export function prefillExampleOnce(
  state: ExamplePrefillState,
  pointer: string,
  value: SchemaPropertyExampleScalar | undefined,
): ExamplePrefillState {
  if (state.initialized.includes(pointer)) return structuredClone(state);
  return {
    values:{ ...state.values, [pointer]:value === undefined ? "" : String(value) },
    initialized:[...state.initialized, pointer],
  };
}
