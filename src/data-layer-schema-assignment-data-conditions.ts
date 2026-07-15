import {
  evaluateConditionPredicate,
  operatorsForConditionType,
  type ConditionOperator,
  type ConditionPropertyType,
  type ConditionalRuleConditionGroup,
  type ConditionalRulePredicate,
  type ObservedConditionValue,
  type TypedComparisonValue,
} from "./data-layer-conditional-validation-rules.js";

export type AssignmentConditionTarget = "payload" | "raw input";
export type AssignmentDataPredicate = ConditionalRulePredicate;
export type AssignmentDataConditionGroup = ConditionalRuleConditionGroup;

export interface AssignmentWithDataConditions {
  target: AssignmentConditionTarget;
  conditionTarget?: AssignmentConditionTarget;
  dataConditionGroup?: AssignmentDataConditionGroup;
}

export interface AssignmentObservedValue extends ObservedConditionValue {
  concretePath: string;
}

export interface AssignmentPredicateEvidence {
  propertyPath: string;
  operator: ConditionOperator;
  configuredValues: readonly TypedComparisonValue[];
  observed: readonly AssignmentObservedValue[];
  matched: boolean;
}

export interface AssignmentDataConditionEvidence {
  operator: "All" | "Any";
  configurationReady: boolean;
  assistance: string;
  matched: boolean;
  predicates: readonly AssignmentPredicateEvidence[];
}

export interface AssignmentConditionSuggestion {
  propertyPath: string;
  detectedType: ConditionPropertyType;
  observedValue: unknown;
}

const existenceOperators: readonly ConditionOperator[] = ["Exists", "Does not exist"];

function encodeSegment(segment: string): string {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

function decodeSegment(segment: string): string | undefined {
  if (/~(?:[^01]|$)/.test(segment)) return undefined;
  return segment.replaceAll("~1", "/").replaceAll("~0", "~");
}

export function canonicalAssignmentConditionPath(path: string): string | undefined {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed === "/" || trimmed.endsWith("/") || trimmed.includes("//")) return undefined;
  const decoded = trimmed.slice(1).split("/").map(decodeSegment);
  if (decoded.some((segment) => segment === undefined || segment === "")) return undefined;
  return `/${decoded.map((segment) => segment === "*" ? "*" : encodeSegment(segment as string)).join("/")}`;
}

function pointerSegments(path: string): string[] {
  const canonical = canonicalAssignmentConditionPath(path);
  return canonical ? canonical.slice(1).split("/").map((segment) => segment === "*" ? "*" : decodeSegment(segment) as string) : [];
}

function resolveObservedValues(value: unknown, propertyPath: string): AssignmentObservedValue[] {
  const segments = pointerSegments(propertyPath);
  if (!segments.length) return [];
  const visit = (current: unknown, remaining: readonly string[], concrete: readonly string[]): AssignmentObservedValue[] => {
    const [segment, ...rest] = remaining;
    if (segment === undefined) return [{ concretePath:`/${concrete.map(encodeSegment).join("/")}`, value:current, exists:true }];
    if (segment === "*") {
      if (!Array.isArray(current)) return [];
      return current.flatMap((item, index) => visit(item, rest, [...concrete, String(index)]));
    }
    if (current === null || typeof current !== "object" || Array.isArray(current)) return [];
    const record = current as Record<string, unknown>;
    return Object.prototype.hasOwnProperty.call(record, segment)
      ? visit(record[segment], rest, [...concrete, segment])
      : [];
  };
  return visit(value, segments, []);
}

function configuredValues(predicate: AssignmentDataPredicate): TypedComparisonValue[] {
  return predicate.operator === "Is one of"
    ? [...(predicate.comparisons ?? [])]
    : predicate.comparison ? [predicate.comparison] : [];
}

function evaluatePredicate(value: unknown, predicate: AssignmentDataPredicate): AssignmentPredicateEvidence {
  const observed = resolveObservedValues(value, predicate.propertyPath);
  const inputs: AssignmentObservedValue[] = observed.length
    ? observed
    : [{ concretePath:canonicalAssignmentConditionPath(predicate.propertyPath) ?? predicate.propertyPath, value:undefined, exists:false }];
  const matched = predicate.operator === "Does not exist"
    ? observed.length === 0
    : predicate.operator === "Exists"
      ? observed.length > 0
      : observed.some((match) => evaluateConditionPredicate(match, predicate));
  return {
    propertyPath:canonicalAssignmentConditionPath(predicate.propertyPath) ?? predicate.propertyPath,
    operator:predicate.operator,
    configuredValues:configuredValues(predicate),
    observed:inputs,
    matched,
  };
}

export function evaluateAssignmentDataConditions(
  value: unknown,
  group: AssignmentDataConditionGroup,
): AssignmentDataConditionEvidence {
  const validation = validateAssignmentDataConditions(group);
  const predicates = group.predicates.map((predicate) => {
    const evidence = evaluatePredicate(value, predicate);
    return validation.ready ? evidence : { ...evidence, matched:false };
  });
  return {
    operator:group.operator,
    configurationReady:validation.ready,
    assistance:validation.assistance,
    matched:validation.ready && (group.operator === "All" ? predicates.length > 0 && predicates.every(({ matched }) => matched) : predicates.some(({ matched }) => matched)),
    predicates,
  };
}

function comparisonRequired(operator: ConditionOperator): boolean {
  return !existenceOperators.includes(operator);
}

export function validateAssignmentDataConditions(
  group: AssignmentDataConditionGroup | undefined,
): { ready: boolean; assistance: string } {
  if (!group) return { ready:true, assistance:"Assignment is unrestricted by event data" };
  if (group.operator !== "All" && group.operator !== "Any") return { ready:false, assistance:"Choose All or Any" };
  if (!group.predicates.length) return { ready:false, assistance:"Add at least one condition" };
  for (const predicate of group.predicates) {
    if (!predicate.propertyPath.trim()) return { ready:false, assistance:"Choose a condition property" };
    if (!canonicalAssignmentConditionPath(predicate.propertyPath)) return { ready:false, assistance:"Correct the condition property path" };
    const detectedType = predicate.detectedType ?? "string";
    if (!operatorsForConditionType(detectedType).includes(predicate.operator)) {
      return { ready:false, assistance:`Choose an operator compatible with ${detectedType}` };
    }
    if (comparisonRequired(predicate.operator)) {
      const hasValue = predicate.operator === "Is one of" ? Boolean(predicate.comparisons?.length) : predicate.comparison !== undefined;
      if (!hasValue) return { ready:false, assistance:"Enter a comparison value" };
      if (configuredValues(predicate).some(({ type }) => type !== detectedType)) {
        return { ready:false, assistance:`Enter a ${detectedType} comparison value` };
      }
    }
    if (predicate.operator === "Matches pattern") {
      try { new RegExp(String(predicate.comparison?.value ?? "")); }
      catch { return { ready:false, assistance:"Correct the regular expression" }; }
    }
  }
  return { ready:true, assistance:"Ready to save assignment" };
}

function detectedType(value: unknown): ConditionPropertyType {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "object"
    ? typeof value as ConditionPropertyType
    : "string";
}

export function assignmentConditionSuggestions(value: unknown): AssignmentConditionSuggestion[] {
  const suggestions: AssignmentConditionSuggestion[] = [];
  const visit = (current: unknown, path: readonly string[]): void => {
    if (path.length) suggestions.push({ propertyPath:`/${path.map(encodeSegment).join("/")}`, detectedType:detectedType(current), observedValue:structuredClone(current) });
    if (Array.isArray(current)) {
      for (const item of current) visit(item, [...path, "*"]);
      return;
    }
    if (current && typeof current === "object") {
      for (const [key, child] of Object.entries(current as Record<string, unknown>)) visit(child, [...path, key]);
    }
  };
  visit(value, []);
  const unique = new Map<string, AssignmentConditionSuggestion>();
  for (const suggestion of suggestions) if (!unique.has(suggestion.propertyPath)) unique.set(suggestion.propertyPath, suggestion);
  return [...unique.values()];
}

function comparisonLabel(predicate: AssignmentDataPredicate): string {
  if (predicate.operator === "Is one of") return predicate.comparisons?.map(({ value }) => String(value)).join(",") ?? "";
  return predicate.comparison ? String(predicate.comparison.value) : "";
}

function predicateSummary(predicate: AssignmentDataPredicate): string {
  const path = pointerSegments(predicate.propertyPath).join(".");
  const comparison = comparisonLabel(predicate);
  return `${path} ${predicate.operator.toLowerCase()}${comparison ? ` ${comparison}` : ""}`;
}

export function assignmentDataConditionSummary(assignment: AssignmentWithDataConditions): string {
  const group = assignment.dataConditionGroup;
  if (!group) return "No data conditions";
  const target = assignment.conditionTarget ?? assignment.target;
  const conjunction = group.operator === "All" ? " and " : " or ";
  return `${target === "payload" ? "Payload" : "Raw input"} · ${group.operator} · ${group.predicates.map(predicateSummary).join(conjunction)}`;
}

export function duplicateSchemaAssignment<T extends AssignmentWithDataConditions & { id?: string; name?: string }>(
  assignment: T,
  id: string,
  name: string,
): T {
  return { ...structuredClone(assignment), id, name };
}
