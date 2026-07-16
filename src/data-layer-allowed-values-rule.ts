export type AllowedValue = string | number | boolean | null;
export type AllowedValueType = "string" | "number" | "boolean" | "array" | "object" | undefined;

export interface ParameterBackedRule {
  operator?: string | undefined;
  parameters?: string | undefined;
  allowedValues?: readonly AllowedValue[] | undefined;
  migrationIssue?: string | undefined;
}

function isAllowedValuesOperator(operator: string | undefined): boolean {
  return operator?.trim().replaceAll("_", "-").replaceAll(" ", "-").toLowerCase() === "allowed-values";
}

function convertToken(token: string, type: AllowedValueType): AllowedValue | undefined {
  if (type === "number") {
    if (!token || !Number.isFinite(Number(token))) return undefined;
    return Number(token);
  }
  if (type === "boolean") {
    if (token === "true") return true;
    if (token === "false") return false;
    return undefined;
  }
  return token;
}

export function normalizeAllowedValuesRule<T extends ParameterBackedRule>(rule: T, type?: AllowedValueType): T & ParameterBackedRule {
  if (!isAllowedValuesOperator(rule.operator)) return structuredClone(rule);
  if (rule.allowedValues !== undefined) {
    const { parameters:_parameters, migrationIssue:_migrationIssue, ...canonical } = structuredClone(rule);
    return canonical as T & ParameterBackedRule;
  }
  if (rule.parameters === undefined) return structuredClone(rule);
  const tokens = rule.parameters.split(",").map((token) => token.trim()).filter(Boolean);
  const converted = tokens.map((token) => convertToken(token, type));
  const invalidIndex = converted.findIndex((value) => value === undefined);
  if (invalidIndex >= 0) return { ...structuredClone(rule), migrationIssue:`Allowed values migration could not convert ${tokens[invalidIndex]} to ${type ?? "string"}` };
  const { parameters:_parameters, migrationIssue:_migrationIssue, ...withoutLegacy } = structuredClone(rule);
  return { ...withoutLegacy, allowedValues:converted as AllowedValue[] } as unknown as T & ParameterBackedRule;
}

export function typedAllowedValues(values: readonly string[], type?: AllowedValueType): AllowedValue[] {
  const tokens = values.map((value) => value.trim()).filter(Boolean);
  const converted = tokens.map((token) => convertToken(token, type));
  if (converted.some((value) => value === undefined)) throw new Error(`Allowed values must all be valid ${type ?? "string"} values.`);
  return converted as AllowedValue[];
}

export function allowedValuesRuleLibraryMetadata(rule: ParameterBackedRule): string | undefined {
  if (!isAllowedValuesOperator(rule.operator) || rule.allowedValues === undefined) return undefined;
  return `Allowed values: ${rule.allowedValues.map(String).join(", ")}`;
}

export function allowedValuesRuleLibrarySearchText(rule: ParameterBackedRule): string {
  return isAllowedValuesOperator(rule.operator) && rule.allowedValues !== undefined
    ? rule.allowedValues.map(String).join(" ")
    : "";
}
