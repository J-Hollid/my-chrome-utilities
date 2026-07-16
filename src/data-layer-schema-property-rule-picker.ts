import {
  validateConditionalRule,
  type ConditionalRulePredicate,
} from "./data-layer-conditional-validation-rules.js";
import { canonicalRulePropertyPath } from "./data-layer-schema-property-path.js";

export { canonicalRulePropertyPath } from "./data-layer-schema-property-path.js";

export type SchemaPropertyType = "string" | "number" | "array" | "object" | "boolean";
export type SchemaRuleType = "Required" | "Exact value" | "Allowed values" | "Regular expression" | "Text length" | "Digits only" | "Numeric range" | "Item count";

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

export interface RuleConfiguration {
  ruleType: SchemaRuleType;
  propertyType: SchemaPropertyType;
  exactValue: string;
  allowedValues: string[];
  pattern: string;
  exactLength: string;
  minimum: string;
  maximum: string;
  minimumItemCount: string;
  severity: string;
  message: string;
  saveReusable: boolean;
  reusableName: string;
  description: string;
  applyOnlyWhen: boolean;
  conditionGroupOperator: "All" | "Any";
  conditions: ConditionalRulePredicate[];
}

export interface RuleConfigurationControl {
  key: keyof Pick<RuleConfiguration, "exactValue" | "allowedValues" | "pattern" | "exactLength" | "minimum" | "maximum" | "minimumItemCount">;
  label: string;
  inputType: "text" | "number" | "select";
  minimum?: number;
  step?: number;
  repeatable?: boolean;
  optional?: boolean;
}

const compatibility: Record<SchemaRuleType, readonly SchemaPropertyType[]> = {
  "Required":["string", "number", "array", "object", "boolean"],
  "Exact value":["string", "number", "boolean"],
  "Allowed values":["string", "number", "boolean"],
  "Regular expression":["string"],
  "Text length":["string"],
  "Digits only":["string"],
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

function valueInputType(propertyType: SchemaPropertyType): RuleConfigurationControl["inputType"] {
  return propertyType === "number" ? "number" : propertyType === "boolean" ? "select" : "text";
}

export function ruleConfigurationControls(ruleType: SchemaRuleType, propertyType: SchemaPropertyType): readonly RuleConfigurationControl[] {
  if (ruleType === "Exact value") return [{ key:"exactValue", label:"Exact value", inputType:valueInputType(propertyType) }];
  if (ruleType === "Allowed values") return [{ key:"allowedValues", label:"Allowed values", inputType:valueInputType(propertyType), repeatable:true }];
  if (ruleType === "Regular expression") return [{ key:"pattern", label:"Pattern", inputType:"text" }];
  if (ruleType === "Text length") return [{ key:"exactLength", label:"Exact length", inputType:"number", minimum:0, step:1 }];
  if (ruleType === "Numeric range") return [
    { key:"minimum", label:"Minimum", inputType:"number", optional:true },
    { key:"maximum", label:"Maximum", inputType:"number", optional:true },
  ];
  if (ruleType === "Item count") return [{ key:"minimumItemCount", label:"Minimum item count", inputType:"number", minimum:0, step:1 }];
  return [];
}

export function createRuleConfiguration(ruleType: SchemaRuleType, propertyType: SchemaPropertyType): RuleConfiguration {
  return {
    ruleType,
    propertyType,
    exactValue:"",
    allowedValues:[""],
    pattern:"",
    exactLength:"",
    minimum:"",
    maximum:"",
    minimumItemCount:"",
    severity:"error",
    message:"",
    saveReusable:false,
    reusableName:"",
    description:"",
    applyOnlyWhen:false,
    conditionGroupOperator:"All",
    conditions:[],
  };
}

function nonNegativeWholeNumber(value: string): boolean {
  return value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= 0;
}

export function validateRuleConfiguration(configuration: RuleConfiguration): { ready: boolean; assistance: string } {
  if (configuration.ruleType === "Exact value" && !configuration.exactValue.trim()) return { ready:false, assistance:"Enter an exact value" };
  if (configuration.ruleType === "Allowed values" && !configuration.allowedValues.some((value) => value.trim())) return { ready:false, assistance:"Add at least one allowed value" };
  if (configuration.ruleType === "Regular expression") {
    if (!configuration.pattern) return { ready:false, assistance:"Enter a pattern" };
    try { new RegExp(configuration.pattern); } catch { return { ready:false, assistance:"Correct the regular expression" }; }
  }
  if (configuration.ruleType === "Text length" && !nonNegativeWholeNumber(configuration.exactLength)) return { ready:false, assistance:"Enter a non-negative whole number" };
  if (configuration.ruleType === "Numeric range") {
    const minimum = configuration.minimum.trim(); const maximum = configuration.maximum.trim();
    if (!minimum && !maximum) return { ready:false, assistance:"Enter at least one boundary" };
    if ((minimum && !Number.isFinite(Number(minimum))) || (maximum && !Number.isFinite(Number(maximum)))) return { ready:false, assistance:"Enter numeric boundaries" };
    if (minimum && maximum && Number(minimum) >= Number(maximum)) return { ready:false, assistance:"Make minimum less than maximum" };
  }
  if (configuration.ruleType === "Item count" && !nonNegativeWholeNumber(configuration.minimumItemCount)) return { ready:false, assistance:"Enter a non-negative whole number" };
  if (configuration.saveReusable && !configuration.reusableName.trim()) return { ready:false, assistance:"Enter a rule name" };
  if (configuration.applyOnlyWhen) {
    const details = configuredRuleDetails(configuration);
    const conditional = validateConditionalRule({
      conditionGroup:{ operator:configuration.conditionGroupOperator, predicates:configuration.conditions },
      consequence:{ propertyPath:"/consequence", operator:details.operator, ...(details.parameters !== undefined ? { parameters:details.parameters } : {}) },
    });
    if (!conditional.ready) return conditional;
  }
  return { ready:true, assistance:"Ready to create rule" };
}

export function configuredRuleDetails(configuration: RuleConfiguration): { operator: string; parameters?: string } {
  if (configuration.ruleType === "Required") return { operator:"required" };
  if (configuration.ruleType === "Exact value") return { operator:"exact-value", parameters:configuration.exactValue };
  if (configuration.ruleType === "Allowed values") return { operator:"allowed-values", parameters:configuration.allowedValues.map((value) => value.trim()).filter(Boolean).join(",") };
  if (configuration.ruleType === "Regular expression") return { operator:"regular-expression", parameters:configuration.pattern };
  if (configuration.ruleType === "Text length") return { operator:"text-length", parameters:configuration.exactLength };
  if (configuration.ruleType === "Digits only") return { operator:"digits-only" };
  if (configuration.ruleType === "Numeric range") return { operator:"numeric-range", parameters:`${configuration.minimum.trim()},${configuration.maximum.trim()}` };
  return { operator:"item-count", parameters:configuration.minimumItemCount };
}
