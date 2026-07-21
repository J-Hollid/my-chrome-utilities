import { parseTargetExpression } from "./data-layer-recursive-property-tree.js";

export type ConditionValueType = "string" | "number" | "boolean" | "null";
export type ConditionPropertyType = ConditionValueType | "array" | "object";
export type ConditionOperator =
  | "Exists"
  | "Does not exist"
  | "Equals"
  | "Does not equal"
  | "Starts with"
  | "Contains"
  | "Is one of"
  | "Matches pattern"
  | "Is greater than"
  | "Is at least"
  | "Is less than"
  | "Is at most";

export interface TypedComparisonValue {
  type: ConditionValueType;
  value: string | number | boolean | null;
}

export interface ConditionalRulePredicate {
  propertyPath: string;
  operator: ConditionOperator;
  comparison?: TypedComparisonValue;
  comparisons?: readonly TypedComparisonValue[];
  detectedType?: ConditionPropertyType;
}

export interface ConditionalRuleConditionGroup {
  operator: "All" | "Any";
  predicates: readonly ConditionalRulePredicate[];
}

export interface ConditionalRuleConsequence {
  propertyPath: string;
  operator: string;
  parameters?: string;
}

export interface ConditionalRuleDefinition {
  conditionGroup: ConditionalRuleConditionGroup;
  consequence: ConditionalRuleConsequence;
}

export interface ObservedConditionValue {
  value: unknown;
  exists: boolean;
}

const existenceOperators: readonly ConditionOperator[] = ["Exists", "Does not exist"];
const equalityOperators: readonly ConditionOperator[] = ["Equals", "Does not equal", "Is one of"];
const numericOperators: readonly ConditionOperator[] = ["Is greater than", "Is at least", "Is less than", "Is at most"];

export function typedComparisonValue(value: string | number | boolean | null): TypedComparisonValue {
  return { type:value === null ? "null" : typeof value, value } as TypedComparisonValue;
}

export function comparisonValueFromInput(
  input: string,
  type: ConditionPropertyType,
): TypedComparisonValue | undefined {
  const value = input.trim();
  if (!value) return undefined;
  if (type === "number") {
    const number = Number(value);
    return Number.isFinite(number) ? typedComparisonValue(number) : undefined;
  }
  if (type === "boolean") {
    return value === "true" ? typedComparisonValue(true)
      : value === "false" ? typedComparisonValue(false)
        : undefined;
  }
  if (type === "null") return value === "null" ? typedComparisonValue(null) : undefined;
  return type === "string" ? typedComparisonValue(input) : undefined;
}

export function operatorsForConditionType(type: ConditionPropertyType): readonly ConditionOperator[] {
  if (type === "string") return [...existenceOperators, ...equalityOperators, "Starts with", "Contains", "Matches pattern"];
  if (type === "number") return [...existenceOperators, ...equalityOperators, ...numericOperators];
  if (type === "boolean" || type === "null") return [...existenceOperators, ...equalityOperators];
  return existenceOperators;
}

function sameTypedValue(observed: unknown, comparison: TypedComparisonValue | undefined): boolean {
  return comparison !== undefined
    && (observed === null ? "null" : typeof observed) === comparison.type
    && Object.is(observed, comparison.value);
}

export function evaluateConditionPredicate(
  observed: ObservedConditionValue,
  predicate: Pick<ConditionalRulePredicate, "operator" | "comparison" | "comparisons">,
): boolean {
  if (predicate.operator === "Exists") return observed.exists;
  if (predicate.operator === "Does not exist") return !observed.exists;
  if (!observed.exists) return false;
  if (predicate.operator === "Equals") return sameTypedValue(observed.value, predicate.comparison);
  if (predicate.operator === "Does not equal") return !sameTypedValue(observed.value, predicate.comparison);
  if (predicate.operator === "Starts with") return typeof observed.value === "string" && predicate.comparison?.type === "string" && observed.value.startsWith(String(predicate.comparison.value));
  if (predicate.operator === "Contains") return typeof observed.value === "string" && predicate.comparison?.type === "string" && observed.value.includes(String(predicate.comparison.value));
  if (predicate.operator === "Is one of") return predicate.comparisons?.some((value) => sameTypedValue(observed.value, value)) ?? false;
  if (predicate.operator === "Matches pattern") {
    if (typeof observed.value !== "string" || predicate.comparison?.type !== "string") return false;
    try { return new RegExp(String(predicate.comparison.value)).test(observed.value); }
    catch { return false; }
  }
  if (typeof observed.value !== "number" || predicate.comparison?.type !== "number") return false;
  const configured = predicate.comparison.value as number;
  if (predicate.operator === "Is greater than") return observed.value > configured;
  if (predicate.operator === "Is at least") return observed.value >= configured;
  if (predicate.operator === "Is less than") return observed.value < configured;
  return observed.value <= configured;
}

export function conditionGroupApplies(
  group: ConditionalRuleConditionGroup,
  evaluate: (predicate: ConditionalRulePredicate) => boolean,
): boolean {
  return group.operator === "All"
    ? group.predicates.every(evaluate)
    : group.predicates.some(evaluate);
}

function pointerSegments(path: string): string[] {
  return path.replace(/^\//, "").split("/").filter(Boolean).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function pointerPath(segments: readonly string[]): string {
  return `/${segments.map((segment) => segment.replaceAll("~", "~0").replaceAll("/", "~1")).join("/")}`;
}

export function conditionValueAtPath(value: unknown, path: string): ObservedConditionValue {
  let current = value;
  for (const segment of pointerSegments(path)) {
    if (current === null || typeof current !== "object" || !(segment in current)) return { value:undefined, exists:false };
    current = (current as Record<string, unknown>)[segment];
  }
  return { value:current, exists:true };
}

export function conditionGroupAppliesToValue(value: unknown, group: ConditionalRuleConditionGroup): boolean {
  return conditionGroupApplies(group, (predicate) =>
    evaluateConditionPredicate(conditionValueAtPath(value, predicate.propertyPath), predicate));
}

function wildcardIndexes(segments: readonly string[]): number[] {
  return segments.flatMap((segment, index) => segment === "*" ? [index] : []);
}

function sharesWildcardContext(candidate: readonly string[], template: readonly string[], wildcardIndex: number): boolean {
  return candidate[wildcardIndex] === "*"
    && candidate.slice(0, wildcardIndex).every((segment, index) => segment === template[index]);
}

function correlatedPredicatePath(
  predicatePath: string,
  consequenceTemplatePath: string,
  consequenceConcretePath: string,
): string {
  const predicate = pointerSegments(predicatePath);
  const template = pointerSegments(consequenceTemplatePath);
  const concrete = pointerSegments(consequenceConcretePath);
  const templateWildcards = wildcardIndexes(template);
  const predicateWildcards = wildcardIndexes(predicate);
  if (!predicateWildcards.length || predicateWildcards.length > templateWildcards.length) return predicatePath;
  const sharesContexts = predicateWildcards.every((index, ordinal) =>
    templateWildcards[ordinal] === index && sharesWildcardContext(predicate, template, index));
  if (!sharesContexts) return predicatePath;
  let wildcard = 0;
  return pointerPath(predicate.map((segment) =>
    segment === "*" ? concrete[templateWildcards[wildcard++] as number] ?? segment : segment));
}

export function conditionGroupAppliesToConsequence(
  value: unknown,
  group: ConditionalRuleConditionGroup,
  consequenceTemplatePath: string,
  consequenceConcretePath: string,
): boolean {
  return conditionGroupApplies(group, (predicate) => {
    const path = correlatedPredicatePath(predicate.propertyPath, consequenceTemplatePath, consequenceConcretePath);
    return evaluateConditionPredicate(conditionValueAtPath(value, path), predicate);
  });
}

export function evaluateConditionalRule(
  value: unknown,
  rule: ConditionalRuleDefinition,
  evaluateConsequence: (consequence: ConditionalRuleConsequence) => boolean,
): { result: "Passed" | "Failed" | "Not applicable"; invocationCount: 0 | 1 } {
  if (!conditionGroupAppliesToValue(value, rule.conditionGroup)) return { result:"Not applicable", invocationCount:0 };
  return { result:evaluateConsequence(rule.consequence) ? "Passed" : "Failed", invocationCount:1 };
}

function pathLabel(path: string): string {
  if (path.startsWith("$")) {
    return parseTargetExpression(path).map((segment) => segment.kind === "property" ? String(segment.value) : segment.kind === "every" ? "*" : String(segment.value)).join(".");
  }
  return pointerSegments(path).join(".");
}

function configuredLabel(predicate: ConditionalRulePredicate): string {
  if (predicate.operator === "Is one of") return predicate.comparisons?.map(({ value }) => String(value)).join(", ") ?? "";
  return predicate.comparison ? String(predicate.comparison.value) : "";
}

export function conditionPredicateSummary(predicate: ConditionalRulePredicate): string {
  const suffix = configuredLabel(predicate);
  return `${pathLabel(predicate.propertyPath)} ${predicate.operator.toLowerCase()}${suffix ? ` ${suffix}` : ""}`;
}

function consequenceSummary(consequence: ConditionalRuleConsequence): string {
  const path = pathLabel(consequence.propertyPath);
  const operator = consequence.operator.replaceAll("_", "-").toLowerCase();
  if (operator === "item-count") return `${path} must contain at least ${consequence.parameters ?? "0"} item` + (consequence.parameters === "1" ? "" : "s");
  if (operator === "required") return `${path} must be present`;
  if (operator === "exact-value") return `${path} must equal ${consequence.parameters ?? ""}`;
  return `${path} must satisfy ${operator}${consequence.parameters ? ` ${consequence.parameters}` : ""}`;
}

export function conditionalRuleSummary(rule: ConditionalRuleDefinition): string {
  const conjunction = rule.conditionGroup.operator === "All" ? " and " : " or ";
  const consequenceSegments = pointerSegments(rule.consequence.propertyPath);
  const wildcardIndex = consequenceSegments.indexOf("*");
  const correlated = wildcardIndex > 0 && rule.conditionGroup.predicates.every((predicate) =>
    sharesWildcardContext(pointerSegments(predicate.propertyPath), consequenceSegments, wildcardIndex));
  if (correlated) {
    const localPredicate = (predicate: ConditionalRulePredicate): ConditionalRulePredicate => ({
      ...predicate,
      propertyPath:`/${pointerSegments(predicate.propertyPath).slice(wildcardIndex + 1).join("/")}`,
    });
    const localConsequence = {
      ...rule.consequence,
      propertyPath:`/${consequenceSegments.slice(wildcardIndex + 1).join("/")}`,
    };
    return `For each ${consequenceSegments[wildcardIndex - 1]} item, when ${rule.conditionGroup.predicates.map((predicate) => conditionPredicateSummary(localPredicate(predicate))).join(conjunction)}, ${consequenceSummary(localConsequence)}`;
  }
  return `When ${rule.conditionGroup.predicates.map(conditionPredicateSummary).join(conjunction)}, ${consequenceSummary(rule.consequence)}`;
}

function comparisonRequired(operator: ConditionOperator): boolean {
  return !existenceOperators.includes(operator);
}

function consequenceValid(consequence: ConditionalRuleConsequence): boolean {
  const operator = consequence.operator.replaceAll("_", "-").toLowerCase();
  if (!consequence.propertyPath.trim()) return false;
  if (operator === "required" || operator === "digits-only" || operator === "non-empty-string") return true;
  if (operator === "item-count" || operator === "text-length") {
    return consequence.parameters !== undefined
      && Number.isInteger(Number(consequence.parameters))
      && Number(consequence.parameters) >= 0;
  }
  if (operator === "regular-expression") {
    try { new RegExp(consequence.parameters ?? ""); return Boolean(consequence.parameters); }
    catch { return false; }
  }
  return consequence.parameters !== undefined && consequence.parameters.trim() !== "";
}

export function validateConditionalRule(rule: Partial<ConditionalRuleDefinition>): { ready: boolean; assistance: string } {
  const predicates = rule.conditionGroup?.predicates ?? [];
  if (!predicates.length) return { ready:false, assistance:"Add at least one condition" };
  for (const predicate of predicates) {
    if (!predicate.propertyPath.trim()) return { ready:false, assistance:"Choose a condition property" };
    if (!operatorsForConditionType(predicate.detectedType ?? "string").includes(predicate.operator)) {
      return { ready:false, assistance:`Choose an operator compatible with ${predicate.detectedType ?? "string"}` };
    }
    if (comparisonRequired(predicate.operator)) {
      const hasValue = predicate.operator === "Is one of" ? Boolean(predicate.comparisons?.length) : predicate.comparison !== undefined;
      if (!hasValue) return { ready:false, assistance:"Enter a comparison value" };
    }
    if (predicate.operator === "Matches pattern") {
      try { new RegExp(String(predicate.comparison?.value ?? "")); }
      catch { return { ready:false, assistance:"Correct the regular expression" }; }
    }
  }
  if (!rule.consequence || !consequenceValid(rule.consequence)) return { ready:false, assistance:"Correct the consequence rule" };
  return { ready:true, assistance:"Ready to create conditional rule" };
}
