import type { ReproductionManualStep, ReproductionPathnameStep } from "./data-layer-defect-report.js";
import type { SchemaDefinition } from "./data-layer-schema-verification.js";

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

function normalizedOperator(value: string | undefined): string {
  return value?.replaceAll("_", "-").replaceAll(" ", "-").toLocaleLowerCase() ?? "";
}

function allowedValues(schema: SchemaDefinition, pointer: string): readonly (string | number | boolean | null)[] {
  const rule = schema.attachedRules?.find((candidate) =>
    candidate.propertyPath === pointer && normalizedOperator(candidate.operator) === "allowed-values"
  );
  if (rule?.allowedValues) return structuredClone(rule.allowedValues);
  return rule?.parameters?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
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
  eventName:string; sourceId:string; pathname:string; startedAt:string; endedAt:string;
}): string {
  return `No matching ${input.eventName} event was pushed or observed in ${input.sourceId} during ${input.pathname} from ${input.startedAt} to ${input.endedAt}.`;
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
  return renumber(journey);
}
