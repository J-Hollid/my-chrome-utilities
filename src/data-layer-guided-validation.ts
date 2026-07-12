import {
  pathConditionResult,
  pathConditionsResult,
  type PathCondition,
  type PathMatchType,
} from "./data-layer-path-conditions.js";

export type GuidedValidationStage = "property" | "requirement" | "scope" | "review";
export type GuidedValueType = "String" | "Number" | "Array" | "Object" | "Boolean" | "Null";
export type GuidedRequirement =
  | "Must be present"
  | "Must be one of these values"
  | "Must match a pattern"
  | "Must have this length"
  | "Must be within a range"
  | "Must contain this many items"
  | "Allow only these properties"
  | "Must equal this value";
export type GuidedScopeKind = "domain-all-paths" | "current-path" | "selected-paths" | "everywhere";
export type GuidedPathMatchType = PathMatchType;

export type GuidedPathCondition = PathCondition;

export { pathConditionResult, pathConditionsResult };

export interface GuidedScope {
  kind: GuidedScopeKind;
  domain: string;
  pathname: string;
  conditions: readonly GuidedPathCondition[];
}

export interface GuidedProperty {
  path: string;
  observedValue: unknown;
  detectedType: GuidedValueType;
  expectedType: GuidedValueType;
  typeSource: "detected from this event" | "explicit override";
}

export interface GuidedValidationDraft {
  stage: GuidedValidationStage;
  event: {
    id: string;
    name: string;
    sourceId: string;
    pageUrl: string;
    payload: Record<string, unknown>;
  };
  properties: readonly { path: string; value: unknown; detectedType: GuidedValueType }[];
  property?: GuidedProperty;
  requirement?: GuidedRequirement;
  allowedValues: readonly string[];
  requirementCorrectionRequired: boolean;
  scope: GuidedScope;
  advanced: {
    schemaName: string;
    ruleName: string;
    severity: "Error" | "Warning";
    message: string;
    sourceId: string;
    target: "payload" | "raw input";
    priority: number;
    versionPolicy: "Pinned" | "Follow latest";
  };
  preview: { currentEventPasses: boolean; message: string };
  review: string;
  persisted: false;
}

export interface PublishedGuidedValidation {
  schema: {
    id: string;
    name: string;
    version: number;
    rules: readonly { path: string; expectedType: GuidedValueType; requirement: GuidedRequirement; values: readonly string[]; reusableRuleId?: string }[];
  };
  reusableRules: readonly { id: string; name: string; requirement: GuidedRequirement; values: readonly string[] }[];
  assignment: {
    id: string;
    schemaId: string;
    sourceId: string;
    eventName: string;
    target: "payload" | "raw input";
    domainCondition?: string;
    pathnameCondition?: string;
    pathConditions?: readonly GuidedPathCondition[];
    priority: number;
    versionPolicy: "pinned" | "follow latest";
    enabled: true;
  };
  readableRequirement: string;
}

const requirements: Record<GuidedValueType, readonly GuidedRequirement[]> = {
  String: ["Must be present", "Must be one of these values", "Must match a pattern", "Must have this length"],
  Number: ["Must be present", "Must be one of these values", "Must be within a range"],
  Array: ["Must be present", "Must contain this many items"],
  Object: ["Must be present", "Allow only these properties"],
  Boolean: ["Must be present", "Must equal this value"],
  Null: ["Must be present"],
};

const stageOrder: readonly GuidedValidationStage[] = ["property", "requirement", "scope", "review"];

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function detectedValueType(value: unknown): GuidedValueType {
  if (value === null) return "Null";
  if (Array.isArray(value)) return "Array";
  if (typeof value === "string") return "String";
  if (typeof value === "number") return "Number";
  if (typeof value === "boolean") return "Boolean";
  return "Object";
}

function flattenedProperties(value: Record<string, unknown>, prefix = ""): { path: string; value: unknown; detectedType: GuidedValueType }[] {
  return Object.entries(value).flatMap(([name, propertyValue]) => {
    const path = prefix ? `${prefix}.${name}` : name;
    const own = { path, value:propertyValue, detectedType:detectedValueType(propertyValue) };
    return propertyValue && typeof propertyValue === "object" && !Array.isArray(propertyValue)
      ? [own, ...flattenedProperties(propertyValue as Record<string, unknown>, path)]
      : [own];
  });
}

function valueAtPath(payload: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) =>
    value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, payload);
}

function eventPasses(property: GuidedProperty | undefined): boolean {
  return property ? detectedValueType(property.observedValue) === property.expectedType : false;
}

function previewFor(property: GuidedProperty | undefined): GuidedValidationDraft["preview"] {
  if (!property) return { currentEventPasses:false, message:"Select a property to preview validation." };
  if (eventPasses(property)) return { currentEventPasses:true, message:`${property.path} matches expected ${property.expectedType}.` };
  return {
    currentEventPasses:false,
    message:`${property.path} was observed as ${property.detectedType} but ${property.expectedType} is expected.`,
  };
}

export function createGuidedValidationDraft(event: GuidedValidationDraft["event"]): GuidedValidationDraft {
  const url = new URL(event.pageUrl);
  const eventSlug = slug(event.name) || "event";
  return {
    stage:"property",
    event:{ ...event, payload:{ ...event.payload } },
    properties:flattenedProperties(event.payload),
    allowedValues:[],
    requirementCorrectionRequired:false,
    scope:{ kind:"domain-all-paths", domain:url.hostname, pathname:url.pathname || "/", conditions:[] },
    advanced:{
      schemaName:`${event.name} validation`,
      ruleName:`${event.name} requirement`,
      severity:"Error",
      message:`Validate ${event.name} from ${event.sourceId}`,
      sourceId:event.sourceId,
      target:"payload",
      priority:100,
      versionPolicy:"Pinned",
    },
    preview:{ currentEventPasses:false, message:"Select a property to preview validation." },
    review:"",
    persisted:false,
  };
}

export function compatibleRequirements(type: GuidedValueType): readonly GuidedRequirement[] {
  return requirements[type];
}

export function selectGuidedProperty(draft: GuidedValidationDraft, path: string): GuidedValidationDraft {
  const observedValue = valueAtPath(draft.event.payload, path);
  const detectedType = detectedValueType(observedValue);
  const property: GuidedProperty = { path, observedValue, detectedType, expectedType:detectedType, typeSource:"detected from this event" };
  const { requirement: _requirement, ...withoutRequirement } = draft;
  return { ...withoutRequirement, property, allowedValues:[], requirementCorrectionRequired:false, preview:previewFor(property) };
}

export function setExpectedType(draft: GuidedValidationDraft, expectedType: GuidedValueType): GuidedValidationDraft {
  if (!draft.property) return draft;
  const property: GuidedProperty = { ...draft.property, expectedType, typeSource:"explicit override" };
  const correction = draft.requirement !== undefined && !compatibleRequirements(expectedType).includes(draft.requirement);
  return { ...draft, property, requirementCorrectionRequired:correction, preview:previewFor(property) };
}

export function setGuidedRequirement(draft: GuidedValidationDraft, requirement: GuidedRequirement): GuidedValidationDraft {
  if (!draft.property || !compatibleRequirements(draft.property.expectedType).includes(requirement)) {
    return { ...draft, requirement, requirementCorrectionRequired:true };
  }
  const allowedValues = requirement === "Must be one of these values"
    ? [String(draft.property.observedValue ?? "")]
    : [];
  return { ...draft, requirement, allowedValues, requirementCorrectionRequired:false };
}

export function addAllowedValue(draft: GuidedValidationDraft): GuidedValidationDraft {
  return { ...draft, allowedValues:[...draft.allowedValues, ""] };
}

export function setAllowedValue(draft: GuidedValidationDraft, index: number, value: string): GuidedValidationDraft {
  return { ...draft, allowedValues:draft.allowedValues.map((current, candidate) => candidate === index ? value : current) };
}

export function removeAllowedValue(draft: GuidedValidationDraft, index: number): GuidedValidationDraft {
  return { ...draft, allowedValues:draft.allowedValues.filter((_, candidate) => candidate !== index) };
}

export function validateAllowedValues(values: readonly string[]): { valid: boolean; assistance: string } {
  if (!values.length) return { valid:false, assistance:"Add at least one allowed value" };
  if (values.some((value) => value.trim() === "")) return { valid:false, assistance:"Enter a value or remove the blank item" };
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);
  if (duplicate) return { valid:false, assistance:`Remove or change the duplicate ${duplicate}` };
  return { valid:true, assistance:`${values.length} allowed values` };
}

export function setGuidedScope(draft: GuidedValidationDraft, scope: GuidedScope): GuidedValidationDraft {
  return { ...draft, scope:{ ...scope, conditions:[...scope.conditions] } };
}

function reviewText(draft: GuidedValidationDraft): string {
  if (!draft.property || !draft.requirement) return "Complete the property and requirement stages.";
  const requirement = draft.requirement === "Must be one of these values"
    ? `to be ${draft.allowedValues.join(" or ")}`
    : draft.requirement.toLowerCase();
  return `${draft.event.name} on ${draft.scope.domain} requires ${draft.property.path} ${requirement}. ${draft.preview.message}`;
}

export function advanceGuidedValidation(draft: GuidedValidationDraft): GuidedValidationDraft {
  const index = stageOrder.indexOf(draft.stage);
  const next = stageOrder[Math.min(stageOrder.length - 1, index + 1)] ?? "review";
  return { ...draft, stage:next, review:next === "review" ? reviewText(draft) : draft.review };
}

export function backGuidedValidation(draft: GuidedValidationDraft): GuidedValidationDraft {
  const index = stageOrder.indexOf(draft.stage);
  return { ...draft, stage:stageOrder[Math.max(0, index - 1)] ?? "property" };
}

export function publishGuidedValidation(draft: GuidedValidationDraft, reusable: boolean): PublishedGuidedValidation {
  if (!draft.property || !draft.requirement || draft.requirementCorrectionRequired) throw new Error("Guided validation draft is incomplete.");
  const schemaId = `schema:${slug(draft.advanced.schemaName)}`;
  const reusableRuleId = reusable ? `rule:${slug(draft.advanced.ruleName)}` : undefined;
  const rule = {
    path:draft.property.path,
    expectedType:draft.property.expectedType,
    requirement:draft.requirement,
    values:[...draft.allowedValues],
    ...(reusableRuleId ? { reusableRuleId } : {}),
  };
  const scope = draft.scope;
  const pathnameCondition = scope.kind === "current-path" ? scope.pathname : undefined;
  const domainCondition = scope.kind === "everywhere" ? undefined : scope.domain;
  const assignment = {
    id:`assignment:${schemaId}:${slug(draft.event.name)}`,
    schemaId,
    sourceId:draft.advanced.sourceId,
    eventName:draft.event.name,
    target:draft.advanced.target,
    ...(domainCondition ? { domainCondition } : {}),
    ...(pathnameCondition ? { pathnameCondition } : {}),
    ...(scope.kind === "selected-paths" ? { pathConditions:[...scope.conditions] } : {}),
    priority:draft.advanced.priority,
    versionPolicy:draft.advanced.versionPolicy === "Pinned" ? "pinned" as const : "follow latest" as const,
    enabled:true as const,
  };
  return {
    schema:{ id:schemaId, name:draft.advanced.schemaName, version:1, rules:[rule] },
    reusableRules:reusable && reusableRuleId ? [{ id:reusableRuleId, name:draft.advanced.ruleName, requirement:draft.requirement, values:[...draft.allowedValues] }] : [],
    assignment,
    readableRequirement:`${draft.property.path} must be ${draft.allowedValues.join(" or ") || draft.requirement.toLowerCase()}`,
  };
}
