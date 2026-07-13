export type SchemaPropertyType = "string" | "number" | "array" | "object" | "boolean";
export type SchemaRuleType = "Required" | "Allowed values" | "Regular expression" | "Numeric range" | "Item count";

export interface PropertyRuleChoice {
  id: string;
  name: string;
  kind: string;
  operator?: string;
  parameters?: string;
  description?: string;
  applicableType?: SchemaPropertyType;
  version?: number;
  enabled?: boolean;
}

export interface ReusablePropertyRuleChoice extends PropertyRuleChoice {
  alreadyAttached: boolean;
}

const compatibility: Record<SchemaRuleType, readonly SchemaPropertyType[]> = {
  "Required":["string", "number", "array", "object", "boolean"],
  "Allowed values":["string", "number", "boolean"],
  "Regular expression":["string"],
  "Numeric range":["number"],
  "Item count":["array"],
};

const builtIns: readonly PropertyRuleChoice[] = (Object.keys(compatibility) as SchemaRuleType[]).map((name) => ({
  id:`built-in:${name.toLowerCase().replace(/\s+/g, "-")}`,
  name,
  kind:name,
  operator:name.toLowerCase(),
}));

export function ruleTypeAvailability(propertyType: SchemaPropertyType, ruleType: SchemaRuleType): "available" | "unavailable" {
  return compatibility[ruleType].includes(propertyType) ? "available" : "unavailable";
}

export function builtInRulesForProperty(propertyType: SchemaPropertyType): readonly PropertyRuleChoice[] {
  return builtIns
    .filter(({ name }) => ruleTypeAvailability(propertyType, name as SchemaRuleType) === "available")
    .map((rule) => ({ ...rule, applicableType:propertyType }));
}

export function applicablePropertyTypesForRule(rule: PropertyRuleChoice): readonly SchemaPropertyType[] {
  if (rule.applicableType) return [rule.applicableType];
  const metadata = `${rule.kind} ${rule.operator ?? ""}`.toLowerCase();
  if (metadata.includes("string")) return ["string"];
  if (metadata.includes("number")) return ["number"];
  if (metadata.includes("array")) return ["array"];
  if (metadata.includes("object")) return ["object"];
  if (metadata.includes("boolean")) return ["boolean"];
  const ruleType = (Object.keys(compatibility) as SchemaRuleType[])
    .find((candidate) => metadata.includes(candidate.toLowerCase()));
  return ruleType ? compatibility[ruleType] : [];
}

export function reusableRulesForProperty<T extends PropertyRuleChoice>(
  rules: readonly T[],
  propertyType: SchemaPropertyType,
  query: string,
  attachedIds: ReadonlySet<string>,
): readonly (T & ReusablePropertyRuleChoice)[] {
  const normalized = query.trim().toLowerCase();
  return rules
    .filter((rule) => rule.enabled !== false && applicablePropertyTypesForRule(rule).includes(propertyType))
    .filter((rule) => !normalized || [rule.name, rule.kind, rule.operator, rule.parameters, rule.description, ...applicablePropertyTypesForRule(rule), `version ${rule.version ?? 1}`]
      .filter(Boolean).join(" ").toLowerCase().includes(normalized))
    .map((rule) => ({ ...rule, alreadyAttached:attachedIds.has(rule.id) }));
}
