import {
  pathConditionResult,
  pathConditionsResult,
  type PathCondition,
  type PathMatchType,
} from "./data-layer-path-conditions.js";
import { parseTargetExpression, resolveTargetValues } from "./data-layer-recursive-property-tree.js";

export type GuidedValidationStage = "property" | "requirement" | "scope" | "destination" | "review";
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

export interface GuidedSchemaCandidate {
  id: string;
  name: string;
  version: number;
  target: "payload" | "raw input";
  propertyTypes: Readonly<Record<string, GuidedValueType>>;
  assignments?: readonly {
    id?: string;
    name?: string;
    sourceId: string;
    eventName: string;
    target: "payload" | "raw input";
    domainCondition?: string;
    pathnameCondition?: string;
    pathConditions?: readonly GuidedPathCondition[];
    enabled?: boolean;
  }[];
}

export interface GuidedAssignmentIdentity {
  id?: string;
  name?: string;
  sourceId: string;
  eventName: string;
  target: "payload" | "raw input";
  domainCondition?: string;
  pathnameCondition?: string;
  pathConditions?: readonly GuidedPathCondition[];
}

export type GuidedSchemaDestination =
  | { kind: "new"; schemaName: string }
  | { kind: "existing"; schemaId: string; schemaName: string; schemaVersion: number; matchingAssignment: boolean };

export interface GuidedSchemaDestinationOption extends GuidedSchemaCandidate {
  available: boolean;
  explanation: string;
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
  destination?: GuidedSchemaDestination;
  continuation?: { schemaId: string; schemaName: string; schemaVersion: number };
  assignmentResolution?: {
    selection: "Create a new assignment" | "the compatible assignment" | "required from readable assignment choices";
    compatibleAssignments: readonly GuidedAssignmentIdentity[];
    selectedAssignmentId?: string;
  };
  prefillSources: Readonly<Record<string, string>>;
  scopeEdited: boolean;
  prefillReplacementReview?: readonly { field: string; currentValue: string; proposedValue: string }[];
  pendingPrefill?: {
    scope: GuidedScope;
    sources: Readonly<Record<string, string>>;
  };
  advanced: {
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
  propertyEntry?: true;
  targetReplacementReview?: { previous: GuidedProperty; proposed: GuidedProperty };
}

export interface PublishedGuidedValidation {
  schema: {
    id: string;
    name: string;
    version: number;
    pending: true;
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
  destination: {
    kind: "new" | "existing";
    previousSchemaId?: string;
    previousVersion?: number;
    assignmentAction: "reuse the matching enabled assignment" | "add the reviewed assignment as a pending change";
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

const stageOrder: readonly GuidedValidationStage[] = ["property", "destination", "requirement", "scope", "review"];
const continuationStageOrder: readonly GuidedValidationStage[] = ["property", "requirement", "scope", "review"];

export function guidedValidationStages(draft: GuidedValidationDraft): readonly GuidedValidationStage[] {
  const order = draft.continuation ? continuationStageOrder : stageOrder;
  return draft.propertyEntry ? order.filter((stage) => stage !== "property") : order;
}

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
  if (path.startsWith("/") || path.startsWith("$")) return resolveTargetValues(payload, path)[0];
  return path.split(".").reduce<unknown>((value, key) =>
    value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, payload);
}

export function createGuidedValidationForProperty(event: GuidedValidationDraft["event"], path: string): GuidedValidationDraft {
  return { ...selectGuidedProperty(createGuidedValidationDraft(event), path), stage:"destination", propertyEntry:true };
}

export function createGuidedContinuationForProperty(event: GuidedValidationDraft["event"], candidate: GuidedSchemaCandidate, path: string): GuidedValidationDraft {
  return { ...selectGuidedContinuationProperty(createGuidedContinuationDraft(event, candidate), path, candidate), stage:"requirement", propertyEntry:true };
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
    prefillSources:{},
    scopeEdited:false,
    scope:{ kind:"domain-all-paths", domain:url.hostname, pathname:url.pathname || "/", conditions:[] },
    advanced:{
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

export function createGuidedContinuationDraft(
  event: GuidedValidationDraft["event"],
  candidate: GuidedSchemaCandidate,
): GuidedValidationDraft {
  const applied = applyGuidedSchemaCandidate(createGuidedValidationDraft(event), candidate);
  return {
    ...applied,
    continuation:{ schemaId:candidate.id, schemaName:candidate.name, schemaVersion:candidate.version },
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

export function retargetGuidedValidation(
  draft: GuidedValidationDraft,
  path: string,
  expectedType?: GuidedValueType,
): GuidedValidationDraft {
  const observedValues = resolveTargetValues(draft.event.payload, path);
  const observedValue = observedValues[0];
  const detectedType = observedValue === undefined
    ? expectedType ?? draft.property?.detectedType ?? "String"
    : detectedValueType(observedValue);
  const chosenType = expectedType ?? detectedType;
  const property: GuidedProperty = {
    path,
    observedValue,
    detectedType,
    expectedType:chosenType,
    typeSource:expectedType ? "explicit override" : "detected from this event",
  };
  const incompatible = draft.requirement !== undefined && !compatibleRequirements(chosenType).includes(draft.requirement);
  return {
    ...draft,
    property,
    ...(draft.property && draft.property.path !== path ? { targetReplacementReview:{ previous:draft.property, proposed:property } } : {}),
    allowedValues:draft.requirement === "Must be one of these values" && observedValue !== undefined ? [String(observedValue)] : draft.allowedValues,
    requirementCorrectionRequired:incompatible,
    preview:previewFor(property),
  };
}

export function resolveGuidedTargetReplacement(
  draft: GuidedValidationDraft,
  choice: "keep" | "accept",
): GuidedValidationDraft {
  const { targetReplacementReview: _review, ...rest } = draft;
  if (choice === "accept" && rest.requirementCorrectionRequired) {
    const { requirement: _requirement, ...withoutRequirement } = rest;
    return { ...withoutRequirement, allowedValues:[], requirementCorrectionRequired:false };
  }
  return rest;
}

export function selectGuidedContinuationProperty(
  draft: GuidedValidationDraft,
  path: string,
  candidate: GuidedSchemaCandidate,
): GuidedValidationDraft {
  return applyGuidedSchemaCandidate(selectGuidedProperty(draft, path), candidate);
}

export function setExpectedType(draft: GuidedValidationDraft, expectedType: GuidedValueType): GuidedValidationDraft {
  if (!draft.property) return draft;
  const property: GuidedProperty = { ...draft.property, expectedType, typeSource:"explicit override" };
  const correction = draft.requirement !== undefined && !compatibleRequirements(expectedType).includes(draft.requirement);
  const { expectedType: _source, ...prefillSources } = draft.prefillSources;
  return { ...draft, property, prefillSources, requirementCorrectionRequired:correction, preview:previewFor(property) };
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
  const { domain: _domain, pathname: _pathname, pathConditions: _conditions, ...prefillSources } = draft.prefillSources;
  return { ...draft, scope:{ ...scope, conditions:[...scope.conditions] }, prefillSources, scopeEdited:true };
}

export function validateNewSchemaName(
  schemaName: string,
  existingNames: readonly string[],
): { valid: boolean; assistance: string } {
  const name = schemaName.trim();
  if (!name) return { valid:false, assistance:"Enter a name for the new schema" };
  if (existingNames.some((candidate) => candidate.toLowerCase() === name.toLowerCase())) {
    return { valid:false, assistance:"Choose the existing schema or enter another name" };
  }
  return { valid:true, assistance:`New schema ${name} will be created` };
}

function samePathConditions(
  left: readonly GuidedPathCondition[] | undefined,
  right: readonly GuidedPathCondition[] | undefined,
): boolean {
  const leftConditions = left ?? [];
  const rightConditions = right ?? [];
  return leftConditions.length === rightConditions.length
    && leftConditions.every((condition, index) =>
      condition.matchType === rightConditions[index]?.matchType
      && condition.expression === rightConditions[index]?.expression);
}

export function guidedAssignmentsMatch(
  left: GuidedAssignmentIdentity,
  right: GuidedAssignmentIdentity,
): boolean {
  return left.sourceId === right.sourceId
    && left.eventName === right.eventName
    && left.target === right.target
    && left.domainCondition === right.domainCondition
    && left.pathnameCondition === right.pathnameCondition
    && samePathConditions(left.pathConditions, right.pathConditions);
}

function reviewedAssignment(draft: GuidedValidationDraft): GuidedAssignmentIdentity {
  return {
    sourceId:draft.event.sourceId,
    eventName:draft.event.name,
    target:draft.advanced.target,
    ...(draft.scope.kind === "everywhere" ? {} : { domainCondition:draft.scope.domain }),
    ...(draft.scope.kind === "current-path" ? { pathnameCondition:draft.scope.pathname } : {}),
    ...(draft.scope.kind === "selected-paths" ? { pathConditions:draft.scope.conditions } : {}),
  };
}

function matchingAssignment(draft: GuidedValidationDraft, candidate: GuidedSchemaCandidate): boolean {
  const reviewed = reviewedAssignment(draft);
  return candidate.assignments?.some((assignment) =>
    assignment.enabled !== false
    && guidedAssignmentsMatch(assignment, reviewed)) ?? false;
}

export function schemaDestinationOptions(
  draft: GuidedValidationDraft,
  candidates: readonly GuidedSchemaCandidate[],
): GuidedSchemaDestinationOption[] {
  return candidates.map((candidate) => {
    const propertyType = draft.property ? candidatePropertyType(candidate, draft.property.path) : undefined;
    const propertyLabel = draft.property?.path.startsWith("/") && !draft.property.path.slice(1).includes("/")
      ? draft.property.path.slice(1)
      : draft.property?.path;
    const targetMismatch = candidate.target !== draft.advanced.target;
    const typeMismatch = Boolean(propertyType && draft.property && propertyType !== draft.property.expectedType);
    const explanation = targetMismatch
      ? `schema validates ${candidate.target}, not ${draft.advanced.target}`
      : typeMismatch
        ? `${propertyLabel} expects ${propertyType}`
        : propertyType
          ? `${propertyLabel} accepts ${draft.property?.expectedType} rules`
          : `${propertyLabel ?? "property"} will be added`;
    return { ...candidate, available:!targetMismatch && !typeMismatch, explanation };
  });
}

function candidatePropertyType(candidate: GuidedSchemaCandidate, path: string): GuidedValueType | undefined {
  const alternatives = [path];
  if (path.startsWith("/")) alternatives.push(path.slice(1).replaceAll("/", "."));
  if (path.startsWith("$")) {
    try { alternatives.push(parseTargetExpression(path).map((segment) => segment.kind === "property" ? segment.value : segment.kind === "every" ? "*" : String(segment.value)).join(".")); } catch { /* invalid paths have no schema prefill */ }
  }
  return alternatives.map((candidatePath) => candidate.propertyTypes[candidatePath]).find((value) => value !== undefined);
}

export function assignmentScopeSummary(assignments: GuidedSchemaCandidate["assignments"]): string {
  const assignment = assignments?.find(({ enabled }) => enabled !== false);
  if (!assignment) return "No assignments";
  const paths = assignment.pathConditions?.map(({ expression }) => expression)
    ?? (assignment.pathnameCondition ? [assignment.pathnameCondition] : []);
  const summary = [assignment.eventName, assignment.domainCondition ?? "every domain", ...paths].join(" · ");
  const additional = (assignments?.filter(({ enabled }) => enabled !== false).length ?? 1) - 1;
  return additional > 0 ? `${summary} · ${additional} more` : summary;
}

export function searchSchemaDestinationOptions(
  draft: GuidedValidationDraft,
  candidates: readonly GuidedSchemaCandidate[],
  query: string,
): GuidedSchemaDestinationOption[] {
  const normalized = query.trim().toLowerCase();
  const options = schemaDestinationOptions(draft, candidates);
  if (!normalized) return options;
  return options.filter((candidate) => {
    const searchable = [
      candidate.name,
      `version ${candidate.version}`,
      candidate.target,
      ...Object.keys(candidate.propertyTypes),
      ...(candidate.assignments ?? []).flatMap((assignment) => [
        assignment.name,
        assignment.sourceId,
        assignment.eventName,
        assignment.target,
        assignment.domainCondition,
        assignment.pathnameCondition,
        ...(assignment.pathConditions?.map(({ expression }) => expression) ?? []),
      ]),
    ].filter((value): value is string => Boolean(value)).join(" ").toLowerCase();
    return searchable.includes(normalized);
  });
}

export function setGuidedSchemaDestination(
  draft: GuidedValidationDraft,
  destination: GuidedSchemaDestination,
): GuidedValidationDraft {
  return { ...draft, destination };
}

function assignmentLabel(assignment: GuidedAssignmentIdentity): string {
  return `${assignment.name ?? assignment.id ?? `${assignment.eventName} on ${assignment.domainCondition ?? "every domain"}`} assignment`;
}

function compatibleCapturedAssignments(
  draft: GuidedValidationDraft,
  candidate: GuidedSchemaCandidate,
): GuidedAssignmentIdentity[] {
  return (candidate.assignments ?? []).filter((assignment) =>
    assignment.enabled !== false
    && assignment.sourceId === draft.event.sourceId
    && assignment.eventName === draft.event.name
    && assignment.target === candidate.target)
    .map((assignment) => ({
      ...assignment,
      ...(assignment.pathConditions ? { pathConditions:[...assignment.pathConditions] } : {}),
    }));
}

function scopeFromAssignment(draft: GuidedValidationDraft, assignment: GuidedAssignmentIdentity): GuidedScope {
  const conditions = assignment.pathConditions ? [...assignment.pathConditions] : [];
  const kind: GuidedScopeKind = conditions.length
    ? "selected-paths"
    : assignment.pathnameCondition
      ? "current-path"
      : assignment.domainCondition
        ? "domain-all-paths"
        : "everywhere";
  return {
    kind,
    domain:assignment.domainCondition ?? draft.scope.domain,
    pathname:assignment.pathnameCondition ?? draft.scope.pathname,
    conditions,
  };
}

function scopeReplacementReview(current: GuidedScope, proposed: GuidedScope): { field: string; currentValue: string; proposedValue: string }[] {
  const values: readonly [string, string, string][] = [
    ["domain", current.domain, proposed.domain],
    ["pathname", current.pathname, proposed.pathname],
    ["path conditions", JSON.stringify(current.conditions), JSON.stringify(proposed.conditions)],
  ];
  return values.flatMap(([field, currentValue, proposedValue]) =>
    currentValue === proposedValue ? [] : [{ field, currentValue, proposedValue }]);
}

export function applyGuidedSchemaCandidate(
  draft: GuidedValidationDraft,
  candidate: GuidedSchemaCandidate,
  assignmentId?: string,
): GuidedValidationDraft {
  const compatibleAssignments = compatibleCapturedAssignments(draft, candidate);
  const selectedAssignment = assignmentId
    ? compatibleAssignments.find((assignment) => assignment.id === assignmentId)
    : compatibleAssignments.length === 1
      ? compatibleAssignments[0]
      : undefined;
  const selection = compatibleAssignments.length === 0
    ? "Create a new assignment" as const
    : selectedAssignment
      ? "the compatible assignment" as const
      : "required from readable assignment choices" as const;
  const schemaSource = `${candidate.name} version ${candidate.version}`;
  const expectedType = draft.property ? candidatePropertyType(candidate, draft.property.path) : undefined;
  const property = draft.property && expectedType
    ? { ...draft.property, expectedType, typeSource:"explicit override" as const }
    : draft.property;
  const schemaSources = {
    ...draft.prefillSources,
    target:schemaSource,
    ...(expectedType ? { expectedType:schemaSource } : {}),
  };
  const destination: GuidedSchemaDestination = {
    kind:"existing",
    schemaId:candidate.id,
    schemaName:candidate.name,
    schemaVersion:candidate.version,
    matchingAssignment:Boolean(selectedAssignment),
  };
  const base: GuidedValidationDraft = {
    ...draft,
    ...(property ? { property } : {}),
    advanced:{ ...draft.advanced, target:candidate.target },
    destination,
    assignmentResolution:{
      selection,
      compatibleAssignments,
      ...(selectedAssignment?.id ? { selectedAssignmentId:selectedAssignment.id } : {}),
    },
    prefillSources:schemaSources,
    preview:previewFor(property),
  };
  if (!selectedAssignment) {
    const { prefillReplacementReview: _review, pendingPrefill: _pending, ...withoutProposal } = base;
    return withoutProposal;
  }
  const proposedScope = scopeFromAssignment(draft, selectedAssignment);
  const source = assignmentLabel(selectedAssignment);
  const assignmentSources = {
    ...schemaSources,
    sourceId:source,
    eventName:source,
    domain:source,
    pathname:source,
    pathConditions:source,
  };
  const proposed = {
    ...base,
    event:{ ...base.event, name:selectedAssignment.eventName },
    advanced:{ ...base.advanced, sourceId:selectedAssignment.sourceId, target:selectedAssignment.target },
  };
  const replacementReview = draft.scopeEdited ? scopeReplacementReview(draft.scope, proposedScope) : [];
  if (replacementReview.length) {
    return {
      ...proposed,
      prefillReplacementReview:replacementReview,
      pendingPrefill:{ scope:proposedScope, sources:assignmentSources },
    };
  }
  const { prefillReplacementReview: _review, pendingPrefill: _pending, ...withoutProposal } = proposed;
  return { ...withoutProposal, scope:proposedScope, prefillSources:assignmentSources, scopeEdited:false };
}

export function resolveGuidedPrefillReplacement(
  draft: GuidedValidationDraft,
  choice: "keep" | "accept",
): GuidedValidationDraft {
  const { prefillReplacementReview: _review, pendingPrefill, ...rest } = draft;
  if (choice === "accept" && pendingPrefill) {
    return { ...rest, scope:pendingPrefill.scope, prefillSources:pendingPrefill.sources, scopeEdited:false };
  }
  return rest;
}

function selectedAssignmentStillMatches(draft: GuidedValidationDraft): boolean {
  if (draft.destination?.kind !== "existing") return false;
  const resolution = draft.assignmentResolution;
  if (!resolution) return draft.destination.matchingAssignment;
  const selected = resolution.selectedAssignmentId
    ? resolution.compatibleAssignments.find(({ id }) => id === resolution.selectedAssignmentId)
    : resolution.selection === "the compatible assignment" && resolution.compatibleAssignments.length === 1
      ? resolution.compatibleAssignments[0]
      : undefined;
  return selected ? guidedAssignmentsMatch(selected, reviewedAssignment(draft)) : false;
}

export function existingSchemaDestination(
  draft: GuidedValidationDraft,
  candidate: GuidedSchemaCandidate,
): GuidedSchemaDestination {
  return {
    kind:"existing",
    schemaId:candidate.id,
    schemaName:candidate.name,
    schemaVersion:candidate.version,
    matchingAssignment:matchingAssignment(draft, candidate),
  };
}

function reviewText(draft: GuidedValidationDraft): string {
  if (!draft.property || !draft.requirement || !draft.destination) return "Complete the property, requirement, scope, and schema destination stages.";
  const requirement = draft.requirement === "Must be one of these values"
    ? `to be ${draft.allowedValues.join(" or ")}`
    : draft.requirement.toLowerCase();
  const destination = draft.destination.kind === "new"
    ? `New schema draft ${draft.destination.schemaName} will be created and remain unavailable until publication.`
    : `The rule will be added to the ${draft.destination.schemaName} working draft based on version ${draft.destination.schemaVersion}. ${draft.destination.schemaName} version ${draft.destination.schemaVersion} remains current until the working draft is published. Assignment action: ${selectedAssignmentStillMatches(draft) ? "reuse the matching enabled assignment" : "add the reviewed assignment as a pending change"}.`;
  return `${draft.event.name} on ${draft.scope.domain} requires ${draft.property.path} ${requirement}. ${draft.preview.message} Rule attachment path: ${draft.property.path}. ${destination}`;
}

export function advanceGuidedValidation(draft: GuidedValidationDraft): GuidedValidationDraft {
  const stages = guidedValidationStages(draft);
  const index = stages.indexOf(draft.stage);
  const next = stages[Math.min(stages.length - 1, index + 1)] ?? "review";
  return { ...draft, stage:next, review:next === "review" ? reviewText(draft) : draft.review };
}

export function backGuidedValidation(draft: GuidedValidationDraft): GuidedValidationDraft {
  const stages = guidedValidationStages(draft);
  const index = stages.indexOf(draft.stage);
  return { ...draft, stage:stages[Math.max(0, index - 1)] ?? "property" };
}

export function publishGuidedValidation(draft: GuidedValidationDraft, reusable: boolean): PublishedGuidedValidation {
  if (!draft.property || !draft.requirement || !draft.destination || draft.requirementCorrectionRequired) throw new Error("Guided validation draft is incomplete.");
  const schemaName = draft.destination.schemaName;
  const schemaVersion = draft.destination.kind === "existing" ? draft.destination.schemaVersion : 1;
  const schemaId = draft.destination.kind === "existing" ? draft.destination.schemaId : `schema:${slug(schemaName)}:1`;
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
    schema:{ id:schemaId, name:schemaName, version:schemaVersion, pending:true, rules:[rule] },
    reusableRules:reusable && reusableRuleId ? [{ id:reusableRuleId, name:draft.advanced.ruleName, requirement:draft.requirement, values:[...draft.allowedValues] }] : [],
    assignment,
    destination:{
      kind:draft.destination.kind,
      ...(draft.destination.kind === "existing"
        ? { previousSchemaId:draft.destination.schemaId, previousVersion:draft.destination.schemaVersion }
        : {}),
      assignmentAction:draft.destination.kind === "existing" && selectedAssignmentStillMatches(draft)
        ? "reuse the matching enabled assignment"
        : "add the reviewed assignment as a pending change",
    },
    readableRequirement:`${draft.property.path} must be ${draft.allowedValues.join(" or ") || draft.requirement.toLowerCase()}`,
  };
}
