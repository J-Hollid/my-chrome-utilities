import type { ReproductionManualStep, ReproductionPathnameStep } from "./data-layer-defect-report.js";
import { validateWithSchema, type AttachedSchemaRule, type JsonSchema, type SchemaDefinition, type ValidationResult } from "./data-layer-schema-verification.js";

export interface ExpectedPropertyChoice {
  property: string;
  pointer: string;
  required: boolean;
  type: string;
  constraint: string;
  schemaValues: readonly (string | number | boolean | null)[];
}

export type ExpectedPropertyResponse =
  | { method:"generic" }
  | { method:"schema-value"; value:string | number | boolean | null }
  | { method:"custom"; value:string | number | boolean | null };

export interface MissingEventAssertionStep {
  kind:"assertion";
  visitId:string;
  pathname:string;
  text:string;
}

export type MissingEventJourneyStep = ReproductionPathnameStep | ReproductionManualStep | MissingEventAssertionStep;

export interface ExpectedPayloadField {
  path:string;
  pointer:string;
  type:string;
  required:boolean;
  schemaValues:readonly (string | number | boolean | null)[];
}

export interface ExpectedPayloadDraft {
  payload:Record<string, unknown>;
  responseSources:Record<string, "schema-provided value" | "operator custom response">;
  responseProvenance?:ExpectedResponseProvenanceMap;
}

export type ExpectedResponseProvenance = Pick<AttachedSchemaRule, "id" | "name" | "version" | "propertyPath">;
export type ExpectedResponseProvenanceMap = Record<string, ExpectedResponseProvenance>;

function normalizedOperator(value: string | undefined): string {
  return value?.replaceAll("_", "-").replaceAll(" ", "-").toLocaleLowerCase() ?? "";
}

function templatePointer(pointer: string): string {
  return pointer.replace(/\/\d+(?=\/|$)/g, "/*");
}

function allowedValueRule(schema: SchemaDefinition, pointer: string): AttachedSchemaRule | undefined {
  const template = templatePointer(pointer);
  return schema.attachedRules?.filter((candidate) =>
    templatePointer(candidate.propertyPath ?? "") === template && normalizedOperator(candidate.operator) === "allowed-values"
  ).sort((left, right) => Number(right.propertyPath === pointer) - Number(left.propertyPath === pointer))[0];
}

function allowedValues(schema: SchemaDefinition, pointer: string): readonly (string | number | boolean | null)[] {
  const rule = allowedValueRule(schema, pointer);
  if (rule?.allowedValues) return structuredClone(rule.allowedValues);
  return rule?.parameters?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
}

function pointerSegment(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function pointerSegments(pointer: string): string[] {
  return pointer.slice(1).split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function arraySegment(segment: string | undefined): boolean {
  return segment === "*" || /^\d+$/.test(segment ?? "");
}

function mergeSchema(left: JsonSchema | undefined, right: JsonSchema): JsonSchema {
  if (!left) return structuredClone(right);
  const merged: JsonSchema = { ...structuredClone(left), ...structuredClone(right) };
  if (left.properties || right.properties) merged.properties = { ...structuredClone(left.properties ?? {}), ...structuredClone(right.properties ?? {}) };
  const items = left.items && right.items ? mergeSchema(left.items, right.items) : right.items ?? left.items;
  if (items) merged.items = structuredClone(items);
  if (left.required || right.required) merged.required = [...new Set([...(left.required ?? []), ...(right.required ?? [])])];
  return merged;
}

function insertSchemaPath(root: JsonSchema, segments: readonly string[], definition: JsonSchema): void {
  let current = root;
  segments.forEach((segment, index) => {
    const last = index === segments.length - 1;
    if (arraySegment(segment)) {
      current.type ??= "array";
      if (last) current.items = mergeSchema(current.items, definition);
      else {
        current.items ??= { type:arraySegment(segments[index + 1]) ? "array" : "object" };
        current = current.items;
      }
      return;
    }
    current.type ??= "object";
    current.properties ??= {};
    if (last) current.properties[segment] = mergeSchema(current.properties[segment], definition);
    else {
      current.properties[segment] ??= { type:arraySegment(segments[index + 1]) ? "array" : "object" };
      current = current.properties[segment];
    }
  });
}

function markRequiredPath(root: JsonSchema, segments: readonly string[]): void {
  let current = root;
  segments.forEach((segment, index) => {
    if (arraySegment(segment)) {
      if (current.items) current = current.items;
      return;
    }
    current.required = [...new Set([...(current.required ?? []), segment])];
    if (index < segments.length - 1 && current.properties?.[segment]) current = current.properties[segment];
  });
}

function normalizeExpectedPayloadDocument(document: JsonSchema): JsonSchema {
  const { properties, required, ...rest } = structuredClone(document);
  const normalized: JsonSchema = { ...rest, ...(document.type === "object" ? { properties:{} } : {}) };
  for (const [storedPath, storedDefinition] of Object.entries(properties ?? {})) {
    const definition = normalizeExpectedPayloadDocument(storedDefinition);
    const segments = storedPath.startsWith("/") ? pointerSegments(storedPath) : [storedPath];
    insertSchemaPath(normalized, segments, definition);
  }
  for (const storedPath of required ?? []) {
    const segments = storedPath.startsWith("/") ? pointerSegments(storedPath) : [storedPath];
    markRequiredPath(normalized, segments);
  }
  return normalized;
}

export function normalizedExpectedPayloadSchema(schema: SchemaDefinition): SchemaDefinition {
  return { ...structuredClone(schema), document:normalizeExpectedPayloadDocument(schema.document) };
}

function schemaAtPointer(schema: JsonSchema, pointer: string): JsonSchema | undefined {
  let current: JsonSchema | undefined = schema;
  for (const segment of pointer.split("/").filter(Boolean)) {
    const decoded = segment.replaceAll("~1", "/").replaceAll("~0", "~");
    current = /^\d+$/.test(decoded) || decoded === "*" ? current?.items : current?.properties?.[decoded];
  }
  return current;
}

function initialContainer(schema: JsonSchema): unknown {
  if (schema.type === "array") return [];
  if (schema.type !== "object") return undefined;
  const value: Record<string, unknown> = {};
  for (const property of schema.required ?? []) {
    const child = schema.properties?.[property];
    const initial = child && initialContainer(child);
    if (initial !== undefined) value[property] = initial;
  }
  return value;
}

export function expectedPayloadFields(schema: SchemaDefinition): ExpectedPayloadField[] {
  const normalized = normalizedExpectedPayloadSchema(schema);
  const result: ExpectedPayloadField[] = [];
  const visit = (definition: JsonSchema, path: string, pointer: string, required: boolean) => {
    if (path) result.push({ path, pointer, type:definition.type ?? "value", required, schemaValues:allowedValues(normalized, pointer) });
    if (definition.type === "object") {
      const requiredProperties = new Set(definition.required ?? []);
      for (const [property, child] of Object.entries(definition.properties ?? {})) {
        visit(child, path ? `${path}.${property}` : property, `${pointer}/${pointerSegment(property)}`, requiredProperties.has(property));
      }
    }
    if (definition.type === "array" && definition.items) visit(definition.items, `${path}.0`, `${pointer}/0`, true);
  };
  if (normalized.document.type === "object") visit(normalized.document, "", "", true);
  else visit(normalized.document, "value", "/value", true);
  return result;
}

export function createExpectedPayloadDraft(schema: SchemaDefinition): ExpectedPayloadDraft {
  const initial = initialContainer(normalizedExpectedPayloadSchema(schema).document);
  return {
    payload:(initial && typeof initial === "object" && !Array.isArray(initial) ? initial : {}) as Record<string, unknown>,
    responseSources:{},
  };
}

function decodedSegments(pointer: string): string[] {
  if (!pointer.startsWith("/")) throw new Error(`Invalid JSON pointer: ${pointer}`);
  return pointer.slice(1).split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function valueAtPointer(payload: unknown, pointer: string): unknown {
  let current = payload;
  for (const segment of decodedSegments(pointer)) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function assignAtPointer(payload: Record<string, unknown>, pointer: string, value: unknown): void {
  const segments = decodedSegments(pointer);
  const leaf = segments.pop();
  if (!leaf) throw new Error("Expected payload values require a property path.");
  let current: Record<string, unknown> | unknown[] = payload;
  segments.forEach((segment, index) => {
    const key = Array.isArray(current) ? Number(segment) : segment;
    const nextIsIndex = /^\d+$/.test(segments[index + 1] ?? leaf);
    let child = (current as any)[key];
    if (child === null || typeof child !== "object") {
      child = nextIsIndex ? [] : {};
      (current as any)[key] = child;
    }
    current = child as Record<string, unknown> | unknown[];
  });
  (current as any)[Array.isArray(current) ? Number(leaf) : leaf] = structuredClone(value);
}

function removeAtPointer(payload: Record<string, unknown>, pointer: string): void {
  const segments = decodedSegments(pointer);
  const leaf = segments.pop();
  if (!leaf) return;
  let current: any = payload;
  for (const segment of segments) {
    current = current?.[Array.isArray(current) ? Number(segment) : segment];
    if (current === null || typeof current !== "object") return;
  }
  if (Array.isArray(current)) current.splice(Number(leaf), 1);
  else delete current[leaf];
}

function typedValue(type: JsonSchema["type"], value: unknown): unknown {
  if (type === "string") return String(value);
  if (type === "number") {
    const parsed = typeof value === "number" ? value : Number(String(value));
    if (!Number.isFinite(parsed)) throw new Error(`${String(value)} is not a number.`);
    return parsed;
  }
  if (type === "boolean") {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    throw new Error(`${String(value)} is not a boolean.`);
  }
  return structuredClone(value);
}

function schemaOrderedValue(definition: JsonSchema, value: unknown): unknown {
  if (definition.type === "array" && Array.isArray(value)) return value.map((item) => schemaOrderedValue(definition.items ?? {}, item));
  if (definition.type !== "object" || value === null || typeof value !== "object" || Array.isArray(value)) return structuredClone(value);
  const source = value as Record<string, unknown>;
  const ordered: Record<string, unknown> = {};
  for (const [property, child] of Object.entries(definition.properties ?? {})) if (Object.hasOwn(source, property)) ordered[property] = schemaOrderedValue(child, source[property]);
  for (const [property, child] of Object.entries(source)) if (!Object.hasOwn(ordered, property)) ordered[property] = structuredClone(child);
  return ordered;
}

function orderPayload(schema: SchemaDefinition, draft: ExpectedPayloadDraft): ExpectedPayloadDraft {
  return { ...draft, payload:schemaOrderedValue(schema.document, draft.payload) as Record<string, unknown> };
}

export function setExpectedPayloadValue(
  schema: SchemaDefinition,
  draft: ExpectedPayloadDraft,
  pointer: string,
  response: Exclude<ExpectedPropertyResponse, { method:"generic" }>,
): ExpectedPayloadDraft {
  const normalized = normalizedExpectedPayloadSchema(schema);
  const definition = schemaAtPointer(normalized.document, pointer);
  if (!definition || definition.type === "object" || definition.type === "array") throw new Error(`Unknown expected payload leaf: ${pointer}`);
  const value = typedValue(definition.type, response.value);
  const choices = allowedValues(normalized, pointer);
  if (response.method === "schema-value" && !choices.some((choice) => Object.is(choice, value))) throw new Error(`${String(value)} is not a schema-provided value for ${pointer}.`);
  const next = structuredClone(draft);
  assignAtPointer(next.payload, pointer, value);
  next.responseSources[pointer] = response.method === "schema-value" ? "schema-provided value" : "operator custom response";
  if (response.method === "schema-value") {
    const rule = allowedValueRule(normalized, pointer);
    if (rule) {
      next.responseProvenance ??= {};
      next.responseProvenance[pointer] = { id:rule.id, ...(rule.name ? { name:rule.name } : {}), version:rule.version, ...(rule.propertyPath ? { propertyPath:rule.propertyPath } : {}) };
    }
  } else if (next.responseProvenance) delete next.responseProvenance[pointer];
  return orderPayload(normalized, next);
}

export function removeExpectedPayloadValue(draft: ExpectedPayloadDraft, pointer: string): ExpectedPayloadDraft {
  const next = structuredClone(draft);
  removeAtPointer(next.payload, pointer);
  for (const key of Object.keys(next.responseSources)) if (key === pointer || key.startsWith(`${pointer}/`)) delete next.responseSources[key];
  for (const key of Object.keys(next.responseProvenance ?? {})) if (key === pointer || key.startsWith(`${pointer}/`)) delete next.responseProvenance?.[key];
  return next;
}

function arrayAt(schema: SchemaDefinition, draft: ExpectedPayloadDraft, pointer: string): { definition:JsonSchema; values:unknown[] } {
  const definition = schemaAtPointer(normalizedExpectedPayloadSchema(schema).document, pointer);
  const values = valueAtPointer(draft.payload, pointer);
  if (definition?.type !== "array" || !definition.items || !Array.isArray(values)) throw new Error(`Expected array not found at ${pointer}.`);
  return { definition, values };
}

export function addExpectedArrayItem(schema: SchemaDefinition, draft: ExpectedPayloadDraft, pointer: string): ExpectedPayloadDraft {
  const normalized = normalizedExpectedPayloadSchema(schema);
  const definition = schemaAtPointer(normalized.document, pointer);
  if (definition?.type === "array" && !definition.items) throw new Error(`The array item type must be defined at ${pointer}.`);
  if (definition?.type !== "array" || !definition.items) throw new Error(`Expected array not found at ${pointer}.`);
  const next = structuredClone(draft);
  const current = valueAtPointer(next.payload, pointer);
  if (current !== undefined && !Array.isArray(current)) throw new Error(`Expected array not found at ${pointer}.`);
  if (current === undefined) assignAtPointer(next.payload, pointer, []);
  (valueAtPointer(next.payload, pointer) as unknown[]).push(initialContainer(definition.items) ?? null);
  return orderPayload(normalized, next);
}

function copyResponseSources(sourceMap: ExpectedPayloadDraft["responseSources"], destinationMap: ExpectedPayloadDraft["responseSources"], from: string, to: string): void {
  for (const [pointer, source] of Object.entries(sourceMap)) if (pointer === from || pointer.startsWith(`${from}/`)) destinationMap[`${to}${pointer.slice(from.length)}`] = source;
}

function copyResponseProvenance(sourceMap: NonNullable<ExpectedPayloadDraft["responseProvenance"]>, destinationMap: NonNullable<ExpectedPayloadDraft["responseProvenance"]>, from: string, to: string): void {
  for (const [pointer, source] of Object.entries(sourceMap)) if (pointer === from || pointer.startsWith(`${from}/`)) destinationMap[`${to}${pointer.slice(from.length)}`] = structuredClone(source);
}

export function duplicateExpectedArrayItem(schema: SchemaDefinition, draft: ExpectedPayloadDraft, pointer: string, index: number): ExpectedPayloadDraft {
  const { values } = arrayAt(schema, draft, pointer);
  if (index < 0 || index >= values.length) throw new Error(`Unknown array item ${index} at ${pointer}.`);
  const next = structuredClone(draft);
  (valueAtPointer(next.payload, pointer) as unknown[]).splice(index + 1, 0, structuredClone(values[index]));
  const prefix = `${pointer}/`;
  next.responseSources = Object.fromEntries(Object.entries(draft.responseSources).filter(([key]) => !key.startsWith(prefix)));
  const nextProvenance = Object.fromEntries(Object.entries(draft.responseProvenance ?? {}).filter(([key]) => !key.startsWith(prefix)));
  next.responseProvenance = nextProvenance;
  (valueAtPointer(next.payload, pointer) as unknown[]).forEach((_item, nextIndex) => {
    const originalIndex = nextIndex <= index ? nextIndex : nextIndex - 1;
    copyResponseSources(draft.responseSources, next.responseSources, `${pointer}/${originalIndex}`, `${pointer}/${nextIndex}`);
    copyResponseProvenance(draft.responseProvenance ?? {}, nextProvenance, `${pointer}/${originalIndex}`, `${pointer}/${nextIndex}`);
  });
  return orderPayload(normalizedExpectedPayloadSchema(schema), next);
}

export function removeExpectedArrayItem(schema: SchemaDefinition, draft: ExpectedPayloadDraft, pointer: string, index: number): ExpectedPayloadDraft {
  const { values } = arrayAt(schema, draft, pointer);
  if (index < 0 || index >= values.length) throw new Error(`Unknown array item ${index} at ${pointer}.`);
  const next = structuredClone(draft);
  (valueAtPointer(next.payload, pointer) as unknown[]).splice(index, 1);
  const prefix = `${pointer}/`;
  const retained = Object.entries(next.responseSources).filter(([key]) => !key.startsWith(prefix));
  next.responseSources = Object.fromEntries(retained);
  const nextProvenance = Object.fromEntries(Object.entries(next.responseProvenance ?? {}).filter(([key]) => !key.startsWith(prefix)));
  next.responseProvenance = nextProvenance;
  const remaining = valueAtPointer(next.payload, pointer) as unknown[];
  remaining.forEach((_item, nextIndex) => {
    const originalIndex = nextIndex >= index ? nextIndex + 1 : nextIndex;
    copyResponseSources(draft.responseSources, next.responseSources, `${pointer}/${originalIndex}`, `${pointer}/${nextIndex}`);
    copyResponseProvenance(draft.responseProvenance ?? {}, nextProvenance, `${pointer}/${originalIndex}`, `${pointer}/${nextIndex}`);
  });
  return orderPayload(normalizedExpectedPayloadSchema(schema), next);
}

function schemaValueComplete(definition: JsonSchema, value: unknown, required: boolean): boolean {
  if (value === undefined) return !required;
  if (definition.type === "string") return typeof value === "string";
  if (definition.type === "number") return typeof value === "number" && Number.isFinite(value);
  if (definition.type === "boolean") return typeof value === "boolean";
  if (definition.type === "array") return Array.isArray(value)
    && (!required || value.length > 0)
    && value.every((item) => schemaValueComplete(definition.items ?? {}, item, true));
  if (definition.type === "object") {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    const requiredProperties = new Set(definition.required ?? []);
    return Object.entries(definition.properties ?? {}).every(([property, child]) => schemaValueComplete(child, (value as Record<string, unknown>)[property], requiredProperties.has(property)));
  }
  return true;
}

export function expectedPayloadComplete(schema: SchemaDefinition, draft: ExpectedPayloadDraft): boolean {
  return schemaValueComplete(normalizedExpectedPayloadSchema(schema).document, draft.payload, true);
}

export function expectedPayloadEvaluation(schema: SchemaDefinition, draft: ExpectedPayloadDraft): ValidationResult {
  const normalized = normalizedExpectedPayloadSchema(schema);
  return validateWithSchema({ sourceId:"expected-payload", eventName:"expected-payload", payload:draft.payload, rawInput:draft.payload }, normalized, [normalized], "payload");
}

export function expectedPayloadPresentation(eventName: string, _payload: unknown): string {
  return `${eventName} is fired with`;
}

export function expectedPropertyChoices(schema: SchemaDefinition): ExpectedPropertyChoice[] {
  const required = new Set(schema.document.required ?? []);
  return Object.entries(schema.document.properties ?? {}).map(([property, definition]) => {
    const pointer = `/${property}`;
    const values = allowedValues(schema, pointer);
    return {
      property,
      pointer,
      required:required.has(property),
      type:definition.type ?? "value",
      constraint:values.length
        ? `one of ${values.map(String).join(" or ")}`
        : `${required.has(property) ? "required" : "optional"} ${definition.type ?? "value"}`,
      schemaValues:values,
    };
  });
}

export function expectedPropertyPresentation(
  property: ExpectedPropertyChoice,
  response: ExpectedPropertyResponse,
): { text:string; source:"schema constraint" | "schema-provided value" | "operator custom response" } {
  if (response.method === "generic") {
    const text = property.schemaValues.length
      ? `${property.property} is ${property.schemaValues.map(String).join(" OR ")}`
      : `${property.property} is ${property.constraint}`;
    return { text, source:"schema constraint" };
  }
  if (response.method === "schema-value" && !property.schemaValues.some((value) => Object.is(value, response.value))) {
    throw new Error(`${String(response.value)} is not a schema-provided value for ${property.property}.`);
  }
  return {
    text:`${property.property} is ${String(response.value)}`,
    source:response.method === "schema-value" ? "schema-provided value" : "operator custom response",
  };
}

export function missingEventActualPresentation(input: {
  eventName:string; sourceId:string; pathname:string; visitId?:string; startedAt?:string; endedAt?:string;
}): string {
  return `No matching ${input.eventName} event was pushed or observed in ${input.sourceId} during the selected ${input.pathname} page visit.`;
}

function renumber(steps: readonly MissingEventJourneyStep[]): MissingEventJourneyStep[] {
  return steps.map((step, index) => {
    const plain = step.kind === "pathname" ? `Visit ${step.pathname}`
      : step.kind === "assertion" ? step.text?.replace(/^\d+\.\s*/, "") ?? "Expect event"
        : step.text?.replace(/^\d+\.\s*/, "") ?? "Manual step";
    return { ...step, text:`${index + 1}. ${plain}` } as MissingEventJourneyStep;
  });
}

export function reconcileMissingEventJourney(
  visits: readonly { id:string; pathname:string }[],
  startVisitId: string,
  endpointVisitId: string,
  previous: readonly MissingEventJourneyStep[],
  expectation: { eventName:string; sourceId:string },
): MissingEventJourneyStep[] {
  return reconcileMissingEventJourneyWithReview(visits, startVisitId, endpointVisitId, previous, expectation).journey;
}

export function reconcileMissingEventJourneyWithReview(
  visits: readonly { id:string; pathname:string }[],
  startVisitId: string,
  endpointVisitId: string,
  previous: readonly MissingEventJourneyStep[],
  expectation: { eventName:string; sourceId:string },
): { journey:MissingEventJourneyStep[]; review:ReproductionManualStep[] } {
  const start = visits.findIndex(({ id }) => id === startVisitId);
  const end = visits.findIndex(({ id }) => id === endpointVisitId);
  if (start < 0 || end < start) throw new Error("Choose a reproduction start at or before the expected-event endpoint.");
  const retainedVisits = visits.slice(start, end + 1);
  const retainedIds = new Set(retainedVisits.map(({ id }) => id));
  const manualByVisit = new Map<string, ReproductionManualStep[]>();
  for (const step of previous) {
    if (step.kind !== "manual" || !retainedIds.has(step.visitId)) continue;
    manualByVisit.set(step.visitId, [...(manualByVisit.get(step.visitId) ?? []), structuredClone(step)]);
  }
  const journey: MissingEventJourneyStep[] = retainedVisits.flatMap((visit) => [
    { kind:"pathname" as const, visitId:visit.id, pathname:visit.pathname, text:`Visit ${visit.pathname}` },
    ...(manualByVisit.get(visit.id) ?? []),
  ]);
  const endpoint = retainedVisits.at(-1)!;
  journey.push({ kind:"assertion", visitId:endpoint.id, pathname:endpoint.pathname, text:`Expect ${expectation.eventName} to be pushed to ${expectation.sourceId} during ${endpoint.pathname}` });
  const review = previous.filter((step): step is ReproductionManualStep => step.kind === "manual" && !retainedIds.has(step.visitId)).map((step) => structuredClone(step));
  return { journey:renumber(journey), review };
}
