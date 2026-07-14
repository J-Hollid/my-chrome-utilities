import { urlConditionsMatch } from "./data-layer-path-conditions.js";
import type { SchemaAssignment, SchemaDefinition, ValidationTarget } from "./data-layer-schema-verification.js";
import { missingEventActualPresentation } from "./data-layer-unified-defect-builder.js";

export interface MissingEventScopeEvent {
  id: string;
  name: string;
  sourceId: string;
  sourceName?: string;
  pageUrl: string;
  captureTime?: string;
  validation?: string;
  payload?: unknown;
  rawInput?: unknown;
}

export interface MissingEventVisit {
  id: string;
  pageUrl: string;
  pathname: string;
  startedAt: string;
  endedAt: string;
  events: readonly MissingEventScopeEvent[];
  immutable?: boolean;
}

export interface MissingEventExpectation {
  schema: SchemaDefinition;
  assignment?: SchemaAssignment;
  assignmentChoices: readonly SchemaAssignment[];
  disabledAssignmentContext: readonly SchemaAssignment[];
  sourceId: string;
  eventName: string;
  target: ValidationTarget;
  pageUrl: string;
  explanation: string;
  confirmed: boolean;
  warningAcknowledged: boolean;
  editedFields: readonly (keyof MissingEventExpectationEdit)[];
}

export interface MissingEventExpectationEdit {
  sourceId: string;
  eventName: string;
  target: ValidationTarget;
  pageUrl: string;
  explanation: string;
  warningAcknowledged: boolean;
}

export interface MissingEventDraft {
  entryPoint: string;
  visits: readonly MissingEventVisit[];
  schemas: readonly SchemaDefinition[];
  scope: MissingEventVisit;
  expectation?: MissingEventExpectation;
  assistance: string;
  replacementReview: readonly { field: keyof MissingEventExpectationEdit; current: unknown; proposed: unknown }[];
  verification: {
    matchingCount: number;
    warningVisible: boolean;
    matches: readonly MissingEventScopeEvent[];
  };
  override?: { explanation?: string; matchingCount: number };
}

export interface MissingEventReport {
  type: "Missing event";
  capturedEventId?: string;
  actual: string;
  absenceEvidence: string;
  expected: string;
  schema: { id: string; name: string; version: number; rules: SchemaDefinition["attachedRules"]; documentation: SchemaDefinition["documentation"] };
  assignment?: SchemaAssignment;
  expectation: Pick<MissingEventExpectation, "sourceId" | "eventName" | "target" | "pageUrl" | "explanation">;
  scope: Omit<MissingEventVisit, "events">;
  capture?: never;
  payload?: never;
  validationIssues: readonly never[];
  matchingEventEvidence: readonly MissingEventScopeEvent[];
  override?: { explanation?: string; matchingCount: number };
  reproductionSteps: readonly string[];
  timeline: readonly MissingEventScopeEvent[];
}

function clone<T>(value: T): T { return structuredClone(value); }

function emptyVerification(): MissingEventDraft["verification"] {
  return { matchingCount:0, warningVisible:false, matches:[] };
}

function withoutOverride(draft: MissingEventDraft): Omit<MissingEventDraft, "override"> {
  const { override:_override, ...remaining } = draft;
  return remaining;
}

function coveringAssignments(schema: SchemaDefinition, visit: MissingEventVisit): SchemaAssignment[] {
  return schema.assignments
    .filter(({ enabled }) => enabled !== false)
    .filter((assignment) => urlConditionsMatch(visit.pageUrl, assignment))
    .map(clone);
}

function disabledCoveringAssignments(schema: SchemaDefinition, visit: MissingEventVisit): SchemaAssignment[] {
  return schema.assignments
    .filter(({ enabled }) => enabled === false)
    .filter((assignment) => urlConditionsMatch(visit.pageUrl, assignment))
    .map(clone);
}

function assignmentAssistance(assignments: readonly SchemaAssignment[], disabledAssignments: readonly SchemaAssignment[] = []): string {
  if (assignments.length === 1) return "The enabled assignment prefills the expectation. An assignment controls validation when an event appears but does not prove that the event must occur; confirm the expectation explicitly.";
  if (assignments.length > 1) return "Choose an assignment and confirm that at least one matching event was expected.";
  if (disabledAssignments.length > 0) return "Only disabled covering assignments were found. They are shown as non-authoritative context; edit the expected event details, acknowledge the warning, and confirm the expectation.";
  return "No enabled covering assignment was found. Edit the schema-referenced event details, acknowledge the warning, and confirm the expectation.";
}

export function createMissingEventDraft(
  entryPoint: string,
  visits: readonly MissingEventVisit[],
  schemas: readonly SchemaDefinition[],
): MissingEventDraft {
  const snapshotVisits = clone(visits);
  const scope = snapshotVisits[0];
  if (!scope) throw new Error("A page visit is required for a missing-event report.");
  return {
    entryPoint,
    visits:snapshotVisits,
    schemas:clone(schemas),
    scope,
    assistance:"Select the expected schema and confirm that at least one matching event was expected.",
    replacementReview:[],
    verification:emptyVerification(),
  };
}

function expectationDefaults(
  schema: SchemaDefinition,
  scope: MissingEventVisit,
  previous?: MissingEventExpectation,
): { expectation:MissingEventExpectation; replacementReview:MissingEventDraft["replacementReview"] } {
  const choices = coveringAssignments(schema, scope);
  const disabledAssignmentContext = disabledCoveringAssignments(schema, scope);
  const assignment = choices.length === 1 ? choices[0] : undefined;
  const proposed: MissingEventExpectationEdit = {
    sourceId:assignment?.sourceId ?? "",
    eventName:assignment?.eventName ?? "",
    target:assignment?.target ?? "payload",
    pageUrl:scope.pageUrl,
    explanation:previous?.explanation ?? "",
    warningAcknowledged:false,
  };
  const edited = new Set(previous?.editedFields ?? []);
  const replacementReview = previous
    ? [...edited].flatMap((field) => previous[field] !== proposed[field]
      ? [{ field, current:previous[field], proposed:proposed[field] }]
      : [])
    : [];
  return {
    expectation:{
      schema:clone(schema),
      ...(assignment ? { assignment } : {}),
      assignmentChoices:choices,
      disabledAssignmentContext,
      sourceId:edited.has("sourceId") ? previous?.sourceId ?? "" : proposed.sourceId,
      eventName:edited.has("eventName") ? previous?.eventName ?? "" : proposed.eventName,
      target:edited.has("target") ? previous?.target ?? "payload" : proposed.target,
      pageUrl:edited.has("pageUrl") ? previous?.pageUrl ?? scope.pageUrl : proposed.pageUrl,
      explanation:previous?.explanation ?? "",
      confirmed:false,
      warningAcknowledged:false,
      editedFields:[...edited],
    },
    replacementReview,
  };
}

export function selectMissingEventSchema(draft: MissingEventDraft, schemaId: string): MissingEventDraft {
  const schema = draft.schemas.find(({ id }) => id === schemaId);
  if (!schema) throw new Error(`Unknown schema: ${schemaId}`);
  const { expectation, replacementReview } = expectationDefaults(schema, draft.scope, draft.expectation);
  return {
    ...withoutOverride(draft),
    expectation,
    assistance:assignmentAssistance(expectation.assignmentChoices, expectation.disabledAssignmentContext),
    replacementReview,
    verification:emptyVerification(),
  };
}

export function selectMissingEventAssignment(draft: MissingEventDraft, assignmentId: string): MissingEventDraft {
  const expectation = draft.expectation;
  if (!expectation) throw new Error("Select a schema before choosing an assignment.");
  const assignment = expectation.assignmentChoices.find(({ id }) => id === assignmentId);
  if (!assignment) throw new Error(`Unknown assignment: ${assignmentId}`);
  const edited = new Set(expectation.editedFields);
  return {
    ...withoutOverride(draft),
    expectation:{
      ...expectation,
      assignment:clone(assignment),
      sourceId:edited.has("sourceId") ? expectation.sourceId : assignment.sourceId,
      eventName:edited.has("eventName") ? expectation.eventName : assignment.eventName,
      target:edited.has("target") ? expectation.target : assignment.target,
      confirmed:false,
    },
    assistance:assignmentAssistance([assignment]),
    verification:emptyVerification(),
  };
}

export function acceptMissingEventReplacements(draft: MissingEventDraft): MissingEventDraft {
  const expectation = draft.expectation;
  if (!expectation) throw new Error("Select a schema before reviewing replacements.");
  const accepted = { ...expectation };
  for (const replacement of draft.replacementReview) {
    if (replacement.field === "sourceId" && typeof replacement.proposed === "string") accepted.sourceId = replacement.proposed;
    if (replacement.field === "eventName" && typeof replacement.proposed === "string") accepted.eventName = replacement.proposed;
    if (replacement.field === "target" && (replacement.proposed === "payload" || replacement.proposed === "raw input")) accepted.target = replacement.proposed;
    if (replacement.field === "pageUrl" && typeof replacement.proposed === "string") accepted.pageUrl = replacement.proposed;
    if (replacement.field === "explanation" && typeof replacement.proposed === "string") accepted.explanation = replacement.proposed;
  }
  const replacedFields = new Set(draft.replacementReview.map(({ field }) => field));
  accepted.editedFields = expectation.editedFields.filter((field) => !replacedFields.has(field));
  accepted.confirmed = false;
  return {
    ...withoutOverride(draft),
    expectation:accepted,
    replacementReview:[],
    verification:emptyVerification(),
  };
}

export function editMissingEventExpectation(
  draft: MissingEventDraft,
  changes: Partial<MissingEventExpectationEdit>,
): MissingEventDraft {
  const expectation = draft.expectation;
  if (!expectation) throw new Error("Select a schema before editing the expectation.");
  const fields = Object.keys(changes) as (keyof MissingEventExpectationEdit)[];
  return {
    ...withoutOverride(draft),
    expectation:{
      ...expectation,
      ...clone(changes),
      confirmed:false,
      editedFields:[...new Set([...expectation.editedFields, ...fields.filter((field) => field !== "warningAcknowledged")])],
    },
    verification:emptyVerification(),
  };
}

export function confirmMissingEventExpectation(draft: MissingEventDraft): MissingEventDraft {
  const expectation = draft.expectation;
  if (!expectation) throw new Error("Select the expected schema.");
  if (expectation.assignmentChoices.length > 1 && !expectation.assignment) throw new Error("Choose an assignment before confirming the expectation.");
  if (!expectation.assignment && !expectation.warningAcknowledged) throw new Error("Acknowledge the missing enabled assignment warning before confirming the expectation.");
  if (!expectation.sourceId.trim() || !expectation.eventName.trim() || !expectation.pageUrl.trim()) throw new Error("Complete the expected source, event, and page visit.");
  return { ...draft, expectation:{ ...expectation, confirmed:true } };
}

function withinInterval(event: MissingEventScopeEvent, scope: MissingEventVisit): boolean {
  if (!event.captureTime) return true;
  const captured = Date.parse(event.captureTime);
  return !Number.isFinite(captured) || (captured >= Date.parse(scope.startedAt) && captured <= Date.parse(scope.endedAt));
}

export function verifyMissingEventAbsence(draft: MissingEventDraft): MissingEventDraft {
  const expectation = draft.expectation;
  if (!expectation?.confirmed) throw new Error("Confirm that at least one matching event was expected before verification.");
  const matches = draft.scope.events.filter((event) =>
    event.name === expectation.eventName
    && event.sourceId === expectation.sourceId
    && event.pageUrl === expectation.pageUrl
    && withinInterval(event, draft.scope));
  return {
    ...withoutOverride(draft),
    verification:{ matchingCount:matches.length, warningVisible:matches.length > 0, matches:clone(matches) },
  };
}

export function changeMissingEventScope(draft: MissingEventDraft, visitId: string): MissingEventDraft {
  const scope = draft.visits.find(({ id }) => id === visitId);
  if (!scope) throw new Error(`Unknown page visit: ${visitId}`);
  const expectation = draft.expectation
    ? { ...draft.expectation, pageUrl:scope.pageUrl, confirmed:draft.expectation.confirmed }
    : undefined;
  const changed = {
    ...withoutOverride(draft),
    scope:clone(scope),
    ...(expectation ? { expectation } : {}),
    verification:emptyVerification(),
  };
  return expectation?.confirmed ? verifyMissingEventAbsence(changed) : changed;
}

export function changeMissingEventInterval(draft: MissingEventDraft, startedAt: string, endedAt: string): MissingEventDraft {
  const start = Date.parse(startedAt);
  const end = Date.parse(endedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) throw new Error("Enter a valid observation interval with the start before the end.");
  return {
    ...withoutOverride(draft),
    scope:{ ...draft.scope, startedAt:new Date(start).toISOString(), endedAt:new Date(end).toISOString() },
    verification:emptyVerification(),
  };
}

export function overrideMissingEventWarning(draft: MissingEventDraft, explanation?: string): MissingEventDraft {
  if (draft.verification.matchingCount < 1) throw new Error("No matching-event warning requires an override.");
  return {
    ...draft,
    override:{ matchingCount:draft.verification.matchingCount, ...(explanation?.trim() ? { explanation:explanation.trim() } : {}) },
  };
}

export function createMissingEventReport(
  draft: MissingEventDraft,
  timelineEventIds: readonly string[] = [],
  manualSteps: readonly string[] = [],
): MissingEventReport {
  const expectation = draft.expectation;
  if (!expectation?.confirmed) throw new Error("Confirm the event expectation before creating the report.");
  if (draft.verification.matchingCount > 0 && !draft.override) throw new Error("Use Create missing-event report anyway to record an explicit override.");
  const expected = `At least one ${expectation.eventName} event matching ${expectation.schema.name} revision ${expectation.schema.version} was expected`;
  const { events:_events, ...scope } = clone(draft.scope);
  return {
    type:"Missing event",
    actual:`No matching ${expectation.eventName} event was captured`,
    absenceEvidence:`No matching ${expectation.eventName} event was captured. ${missingEventActualPresentation({ eventName:expectation.eventName, sourceId:expectation.sourceId, pathname:draft.scope.pathname, startedAt:draft.scope.startedAt, endedAt:draft.scope.endedAt })}`,
    expected,
    schema:{
      id:expectation.schema.id,
      name:expectation.schema.name,
      version:expectation.schema.version,
      rules:clone(expectation.schema.attachedRules),
      documentation:clone(expectation.schema.documentation),
    },
    ...(expectation.assignment ? { assignment:clone(expectation.assignment) } : {}),
    expectation:{ sourceId:expectation.sourceId, eventName:expectation.eventName, target:expectation.target, pageUrl:expectation.pageUrl, explanation:expectation.explanation },
    scope,
    validationIssues:[],
    matchingEventEvidence:clone(draft.verification.matches),
    ...(draft.override ? { override:clone(draft.override) } : {}),
    reproductionSteps:[`Visit ${draft.scope.pathname}`, ...manualSteps, `Expect at least one matching ${expectation.eventName} event`],
    timeline:clone(draft.scope.events.filter(({ id }) => timelineEventIds.includes(id))),
  };
}

function escapeHtml(value: unknown): string {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function generateMissingEventRepresentations(report: MissingEventReport): {
  previewHtml: string;
  previewText: string;
  jiraText: string;
} {
  const assignment = report.assignment
    ? `${report.assignment.name ?? report.assignment.id ?? "assignment"}: ${report.assignment.sourceId}/${report.assignment.eventName}/${report.assignment.target}`
    : "No enabled covering assignment; operator-confirmed expectation";
  const captureEvidence = report.override
    ? `Matching events retained: ${report.matchingEventEvidence.map(({ id, captureTime, sourceId, pageUrl, validation }) => `${id} · ${captureTime ?? "time unavailable"} · ${sourceId} · ${pageUrl} · ${validation ?? "Not checked"}`).join("; ")}\nExplicit override: ${report.override.explanation ?? "Create missing-event report anyway"}`
    : `Observed ${report.scope.startedAt} to ${report.scope.endedAt}; 0 matching events`;
  const sections: Array<[string, string]> = [
    ["Summary", `Missing event: ${report.expectation.eventName}`],
    ["Description", `${report.expectation.eventName} was expected during ${report.scope.pathname}, but no matching event was captured.`],
    ["Steps to reproduce", report.reproductionSteps.join("\n")],
    ["Actual result", report.absenceEvidence],
    ["Expected result", `${report.expected}. ${report.expectation.explanation}`.trim()],
    ["Schema expectation", `${report.schema.name} revision ${report.schema.version}\n${assignment}\nSchema rules and documentation are expectation context, not observed capture evidence.`],
    ["Capture evidence", captureEvidence],
    ["Supporting timeline", report.timeline.length ? report.timeline.map(({ captureTime, name, sourceId, pageUrl }) => `${captureTime ?? "time unavailable"} · ${name} · ${sourceId} · ${pageUrl}`).join("\n") : "No supporting captured events selected"],
  ];
  const previewText = sections.map(([heading, content]) => `${heading}\n${content}`).join("\n\n");
  const previewHtml = sections.map(([heading, content]) => `<h2>${escapeHtml(heading)}</h2><p>${escapeHtml(content).replaceAll("\n", "<br>")}</p>`).join("");
  return { previewHtml, previewText, jiraText:previewText };
}
