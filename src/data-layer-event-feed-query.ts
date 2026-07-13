export const coreEventFeedQueryFields = [
  "Event name", "Source", "Adapter kind", "Pathname",
] as const;
export const validationEventFeedQueryFields = [
  "Validation state", "Schema", "Validation rule", "Rule severity", "Affected property",
] as const;

export type EventFeedQueryField =
  | (typeof coreEventFeedQueryFields)[number]
  | (typeof validationEventFeedQueryFields)[number]
  | "Payload property"
  | `Payload · ${string}`;
export type TextQueryOperator = "is" | "is not" | "contains" | "does not contain";
export type RuleQueryOperator = "failed" | "warned" | "passed" | "was evaluated" | "was not evaluated";
export type EventFeedQueryOperator = TextQueryOperator | RuleQueryOperator;

type TextEventFeedQueryField = Exclude<EventFeedQueryField, "Validation rule" | "Payload property">;

export type EventFeedQueryCondition = {
  id: string;
  field: TextEventFeedQueryField;
  operator: TextQueryOperator;
  values: readonly string[];
} | {
  id: string;
  field: "Validation rule";
  operator: RuleQueryOperator;
  values: readonly string[];
};

export interface EventFeedQueryConditionDraft {
  id?: string;
  field?: EventFeedQueryField;
  operator?: EventFeedQueryOperator;
  values?: readonly string[];
}

export interface EventFeedQuery {
  conditions: readonly EventFeedQueryCondition[];
}

interface QueryableEvent {
  name: string;
  sourceId: string;
  sourceName?: string;
  sourceKind?: string;
  pageUrl?: string;
  payload?: unknown;
  validation?: string;
  validationDetails?: {
    schema?: { name: string };
    evaluations?: readonly {
      rule: string;
      severity: string;
      propertyPath: string;
      status: "pass" | "warning" | "error";
    }[];
    issues?: readonly { severity?: string; instancePath: string }[];
  };
}

function distinct(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function uniqueValues(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function payloadEntries(value: unknown, prefix = ""): Array<[string, unknown]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return prefix ? [[prefix, value]] : [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" && !Array.isArray(child) ? payloadEntries(child, path) : [[path, child]];
  });
}

function pathname(pageUrl: string | undefined): string {
  if (!pageUrl) return "";
  try { return new URL(pageUrl).pathname; }
  catch { return pageUrl; }
}

function affectedProperty(path: string): string {
  return path.replace(/^\//, "").replaceAll("/", ".");
}

function payloadPath(field: EventFeedQueryField): string | undefined {
  if (!field.startsWith("Payload · ")) return undefined;
  return field.slice("Payload · ".length).trim() || undefined;
}

function eventValues(event: QueryableEvent, field: EventFeedQueryField): string[] {
  if (field === "Event name") return [event.name];
  if (field === "Source") return [event.sourceName ?? event.sourceId];
  if (field === "Adapter kind") return [event.sourceKind ?? ""];
  if (field === "Pathname") return [pathname(event.pageUrl)];
  if (field === "Validation state") return [event.validation ?? "Not checked"];
  if (field === "Schema") return event.validationDetails?.schema ? [event.validationDetails.schema.name] : [];
  if (field === "Validation rule") return (event.validationDetails?.evaluations ?? []).map(({ rule }) => rule);
  if (field === "Rule severity") return [
    ...(event.validationDetails?.evaluations ?? []).map(({ severity }) => severity),
    ...(event.validationDetails?.issues ?? []).map(({ severity }) => severity ?? "error"),
  ];
  if (field === "Affected property") return [
    ...(event.validationDetails?.evaluations ?? []).map(({ propertyPath }) => affectedProperty(propertyPath)),
    ...(event.validationDetails?.issues ?? []).map(({ instancePath }) => affectedProperty(instancePath)),
  ];
  if (field === "Payload property") return [];
  const path = payloadPath(field);
  if (!path) return [];
  const match = payloadEntries(event.payload).find(([candidate]) => candidate === path);
  return match ? [String(match[1])] : [];
}

export function eventFeedQueryFields(): EventFeedQueryField[] {
  return [...coreEventFeedQueryFields, "Payload property", ...validationEventFeedQueryFields];
}

export function observedPayloadPaths(events: readonly QueryableEvent[]): string[] {
  return distinct(events.flatMap((event) => payloadEntries(event.payload).map(([path]) => path)));
}

export function eventFeedQueryOperators(field: EventFeedQueryField): EventFeedQueryOperator[] {
  if (field === "Payload property") return [];
  return field === "Validation rule"
    ? ["failed", "warned", "passed", "was evaluated", "was not evaluated"]
    : ["is", "is not", "contains", "does not contain"];
}

export function eventFeedQuerySuggestions(events: readonly QueryableEvent[], field: EventFeedQueryField): string[] {
  if (field === "Payload property") return [];
  return distinct(events.flatMap((event) => eventValues(event, field)));
}

export function queryConditionComplete(condition: EventFeedQueryConditionDraft): condition is EventFeedQueryCondition {
  if (!condition.id || !condition.field || condition.field === "Payload property" ||
      (condition.field.startsWith("Payload · ") && !payloadPath(condition.field)) ||
      !condition.operator || !condition.values?.some((value) => value.trim())) return false;
  return (eventFeedQueryOperators(condition.field) as readonly EventFeedQueryOperator[]).includes(condition.operator);
}

export function applyQueryCondition(query: EventFeedQuery, condition: EventFeedQueryCondition): EventFeedQuery {
  if (!queryConditionComplete(condition)) throw new Error("Complete Field, Operator, and Value before applying the condition.");
  return { conditions: [...query.conditions.filter(({ id }) => id !== condition.id), { ...condition, values: uniqueValues(condition.values.map((value) => value.trim())) }] };
}

export function removeQueryCondition(query: EventFeedQuery, id: string): EventFeedQuery {
  return { conditions: query.conditions.filter((condition) => condition.id !== id) };
}

export function clearEventFeedQuery(_query: EventFeedQuery): EventFeedQuery {
  return { conditions: [] };
}

function textMatches(actual: string, operator: TextQueryOperator, expected: string): boolean {
  const value = actual.toLocaleLowerCase();
  const query = expected.toLocaleLowerCase();
  if (operator === "is") return value === query;
  if (operator === "is not") return value !== query;
  if (operator === "contains") return value.includes(query);
  return !value.includes(query);
}

function validationStateMatches(actual: string, operator: TextQueryOperator, expected: string): boolean {
  if (expected.toLocaleLowerCase() === "warnings") {
    const warnings = actual.toLocaleLowerCase().includes("warning") && !actual.toLocaleLowerCase().includes("error");
    return operator === "is" || operator === "contains" ? warnings : !warnings;
  }
  if (expected.toLocaleLowerCase() !== "issues") return textMatches(actual, operator, expected);
  const hasIssues = !["valid", "not checked", "assignment error"].includes(actual.toLocaleLowerCase());
  return operator === "is" || operator === "contains" ? hasIssues : !hasIssues;
}

function ruleMatches(event: QueryableEvent, condition: Extract<EventFeedQueryCondition, { field: "Validation rule" }>): boolean {
  const evaluations = event.validationDetails?.evaluations ?? [];
  const matchesRule = (rule: string) => {
    const matches = evaluations.filter((evaluation) => evaluation.rule.toLocaleLowerCase() === rule.toLocaleLowerCase());
    if (condition.operator === "was evaluated") return matches.length > 0;
    const status = condition.operator === "failed" ? "error" : condition.operator === "warned" ? "warning" : "pass";
    return matches.some((evaluation) => evaluation.status === status);
  };
  if (condition.operator === "was not evaluated") {
    return condition.values.every((rule) => evaluations.every((evaluation) => evaluation.rule.toLocaleLowerCase() !== rule.toLocaleLowerCase()));
  }
  return condition.values.some(matchesRule);
}

export function eventMatchesQueryCondition(event: QueryableEvent, condition: EventFeedQueryCondition): boolean {
  if (condition.field === "Validation rule") return ruleMatches(event, condition);
  const actualValues = eventValues(event, condition.field);
  const matches = (actual: string, expected: string) => condition.field === "Validation state"
    ? validationStateMatches(actual, condition.operator, expected)
    : textMatches(actual, condition.operator, expected);
  if (condition.operator === "is not" || condition.operator === "does not contain") {
    return condition.values.every((expected) => actualValues.every((actual) => matches(actual, expected)));
  }
  return condition.values.some((expected) => actualValues.some((actual) => matches(actual, expected)));
}

export function filterEventsByQuery<Event extends QueryableEvent>(events: readonly Event[], query: EventFeedQuery): Event[] {
  if (query.conditions.length === 0) return [...events];
  return events.filter((event) => query.conditions.every((condition) => eventMatchesQueryCondition(event, condition)));
}

export function queryConditionSummary(condition: EventFeedQueryCondition): string {
  const values = condition.values.join(" or ");
  return condition.field === "Validation rule"
    ? `Validation rule ${values} ${condition.operator}`
    : `${condition.field} ${condition.operator} ${values}`;
}

export function activeQuerySummary(query: EventFeedQuery): string {
  return query.conditions.length ? "Match all conditions · Match any selected value" : "No active filters";
}
