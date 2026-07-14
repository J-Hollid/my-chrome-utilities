import {
  saveCompletedSession,
  type CompletedSession,
  type SavedSessionLibrary,
} from "./data-layer-saved-sessions.js";
import type { LiveEvent } from "./data-layer-live-observer.js";

export const DEFECT_LIBRARY_STORAGE_KEY = "my-chrome-utilities.defect-library.v1";

export type DefectStatus = "Reported" | "Resolved" | "Archived";
export type DefectType = "Validation issue" | "Missing event";
export type IssueTriageState = "Reported" | "New" | "Review required" | "Possible regression treated New";
export type DefectReportAction = "Copy for Jira Cloud" | "Save as reported defect" | "Save as reported defect and copy";

export interface IssueMatchIdentity {
  sourceId: string;
  eventName: string;
  schemaId: string;
  validationTarget: string;
  canonicalPath: string;
  ruleId: string;
  ruleRevision: number;
}

export interface CurrentDefectIssue {
  sourceId: string;
  eventName: string;
  schemaId: string;
  validationTarget: string;
  concretePath: string;
  templatePath?: string;
  ruleId: string;
  ruleRevision: number;
  actual?: unknown;
  expected?: string;
  pageUrl?: string;
  captureTime?: string;
  sourceName?: string;
  schemaName?: string;
  ruleName?: string;
}

export interface StoredDefectIssue {
  match: IssueMatchIdentity;
  evidence: CurrentDefectIssue;
}

export interface ReportedDefect {
  id: string;
  type: DefectType;
  status: DefectStatus;
  createdAt: string;
  updatedAt: string;
  report: any;
  notes: string;
  issues: StoredDefectIssue[];
  savedSession?: { id:string; containsMatchingIssue:boolean };
}

export interface DefectLibrary {
  defects: ReportedDefect[];
  deletionConfirmationId?: string;
}

export interface DefectSearch {
  query?: string;
  status?: DefectStatus | "All";
  type?: DefectType | "All";
  eventName?: string;
  schema?: string;
  path?: string;
}

export interface IssueTriage {
  state: IssueTriageState;
  defects: ReportedDefect[];
}

export interface EventTriage {
  state: string;
  newCount: number;
  reportedCount: number;
  reviewRequiredCount: number;
  issues: IssueTriageState[];
}

export interface PresentedIssueTriage {
  state: IssueTriageState;
  concretePath: string;
  canonicalPath: string;
  defectLinks: readonly { id:string; label:string }[];
}

export interface PresentedEventTriage extends EventTriage {
  issueDetails: PresentedIssueTriage[];
}

function clone<T>(value: T): T { return structuredClone(value); }

function slug(value: string): string {
  return value.toLowerCase().replace(/\s+v\d+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ruleRevision(rule: string | undefined, schemaVersion: number): number {
  return Number(rule?.match(/ v(\d+)$/)?.[1] ?? schemaVersion);
}

export function currentDefectIssues(event: LiveEvent): CurrentDefectIssue[] {
  const schema = event.validationDetails?.schema;
  const assignment = event.validationDetails?.assignment;
  return (event.validationDetails?.issues ?? []).map((issue) => ({
    sourceId:event.sourceId,
    eventName:event.name,
    schemaId:schema?.id ?? `schema:${slug(issue.schemaName)}`,
    validationTarget:assignment?.target ?? "payload",
    concretePath:issue.instancePath,
    ...(issue.templatePath ? { templatePath:issue.templatePath } : {}),
    ruleId:`rule:${slug(issue.rule ?? issue.schemaLocation)}`,
    ruleRevision:ruleRevision(issue.rule, issue.schemaVersion ?? schema?.version ?? 0),
    actual:issue.actual,
    expected:issue.expected,
    ...(event.pageUrl ? { pageUrl:event.pageUrl } : {}),
    captureTime:event.captureTime,
    ...(event.sourceName ? { sourceName:event.sourceName } : {}),
    schemaName:schema?.name ?? issue.schemaName,
    ...(issue.rule ? { ruleName:issue.rule.replace(/ v\d+$/, "") } : {}),
  }));
}

export function presentedEventTriage(event: LiveEvent, library: DefectLibrary): PresentedEventTriage {
  const issues = currentDefectIssues(event);
  const aggregate = triageEvent(issues, library);
  return {
    ...aggregate,
    issueDetails:issues.map((issue) => {
      const triage = issueTriage(issue, library);
      return {
        state:triage.state,
        concretePath:issue.concretePath,
        canonicalPath:canonicalAffectedPath(issue.concretePath, issue.templatePath),
        defectLinks:triage.defects.map((defect) => ({
          id:defect.id,
          label:String(defect.report?.summary ?? defect.id),
        })),
      };
    }),
  };
}

export function canonicalAffectedPath(concretePath: string, templatePath?: string): string {
  return templatePath?.trim() || concretePath;
}

export function issueMatchIdentity(issue: CurrentDefectIssue): IssueMatchIdentity {
  return {
    sourceId:issue.sourceId,
    eventName:issue.eventName,
    schemaId:issue.schemaId,
    validationTarget:issue.validationTarget,
    canonicalPath:canonicalAffectedPath(issue.concretePath, issue.templatePath),
    ruleId:issue.ruleId,
    ruleRevision:issue.ruleRevision,
  };
}

function sameBase(left: IssueMatchIdentity, right: IssueMatchIdentity): boolean {
  return left.sourceId === right.sourceId
    && left.eventName === right.eventName
    && left.schemaId === right.schemaId
    && left.validationTarget === right.validationTarget
    && left.canonicalPath === right.canonicalPath
    && left.ruleId === right.ruleId;
}

function sameIdentity(left: IssueMatchIdentity, right: IssueMatchIdentity): boolean {
  return sameBase(left, right) && left.ruleRevision === right.ruleRevision;
}

function createDefect(options: {
  id: string;
  now: string;
  type: DefectType;
  report: unknown;
  notes?: string;
  issues?: readonly CurrentDefectIssue[];
}): ReportedDefect {
  return clone({
    id:options.id,
    type:options.type,
    status:"Reported" as const,
    createdAt:options.now,
    updatedAt:options.now,
    report:options.report,
    notes:options.notes ?? "",
    issues:(options.issues ?? []).map((evidence) => ({ match:issueMatchIdentity(evidence), evidence })),
  });
}

export function createValidationDefect(options: {
  id: string;
  now: string;
  report: unknown;
  notes?: string;
  issues: readonly CurrentDefectIssue[];
}): ReportedDefect {
  return createDefect({ ...options, type:"Validation issue" });
}

export function createMissingEventDefect(options: {
  id: string;
  now: string;
  report: unknown;
  notes?: string;
}): ReportedDefect {
  return createDefect({ ...options, type:"Missing event", issues:[] });
}

export function createDefectLibrary(): DefectLibrary { return { defects:[] }; }

function activeIdentityMatches(defect: ReportedDefect, identity: IssueMatchIdentity): boolean {
  return defect.type === "Validation issue"
    && defect.status === "Reported"
    && defect.issues.some(({ match }) => sameIdentity(match, identity));
}

export function matchingDefects(issue: CurrentDefectIssue, library: DefectLibrary): ReportedDefect[] {
  const identity = issueMatchIdentity(issue);
  return library.defects.filter((defect) => activeIdentityMatches(defect, identity)).map(clone);
}

export function issueTriage(issue: CurrentDefectIssue, library: DefectLibrary): IssueTriage {
  const identity = issueMatchIdentity(issue);
  const reported = library.defects.filter((defect) => activeIdentityMatches(defect, identity));
  if (reported.length) return { state:"Reported", defects:reported.map(clone) };
  const resolved = library.defects.filter((defect) => defect.type === "Validation issue"
    && defect.status === "Resolved"
    && defect.issues.some(({ match }) => sameIdentity(match, identity)));
  if (resolved.length) return { state:"Possible regression treated New", defects:resolved.map(clone) };
  const changedRevision = library.defects.filter((defect) => defect.type === "Validation issue"
    && defect.status === "Reported"
    && defect.issues.some(({ match }) => sameBase(match, identity) && match.ruleRevision !== identity.ruleRevision));
  if (changedRevision.length) return { state:"Review required", defects:changedRevision.map(clone) };
  return { state:"New", defects:[] };
}

export function triageEvent(issues: readonly CurrentDefectIssue[], library: DefectLibrary): EventTriage {
  const states = issues.map((issue) => issueTriage(issue, library).state);
  const reportedCount = states.filter((state) => state === "Reported").length;
  const reviewRequiredCount = states.filter((state) => state === "Review required").length;
  const newCount = states.length - reportedCount;
  const state = reportedCount === issues.length && issues.length
    ? `all ${issues.length} issues reported`
    : reportedCount
      ? `${newCount} new and ${reportedCount} reported`
      : `${newCount} new issues`;
  return { state, newCount, reportedCount, reviewRequiredCount, issues:states };
}

export function addDefect(library: DefectLibrary, defect: ReportedDefect, saveSeparately = false): {
  library: DefectLibrary;
  defect: ReportedDefect;
  added: boolean;
  existing: ReportedDefect[];
} {
  const existing = defect.issues.flatMap(({ evidence }) => matchingDefects(evidence, library));
  const unique = [...new Map(existing.map((candidate) => [candidate.id, candidate])).values()];
  if (unique.length && !saveSeparately) return { library, defect:clone(defect), added:false, existing:unique };
  return { library:{ ...library, defects:[...library.defects, clone(defect)] }, defect:clone(defect), added:true, existing:unique };
}

export function editDefect(
  library: DefectLibrary,
  defectId: string,
  edits: Partial<Pick<ReportedDefect, "report" | "notes">>,
  now: string,
): DefectLibrary {
  return {
    ...library,
    defects:library.defects.map((defect) => defect.id === defectId
      ? clone({ ...defect, ...edits, updatedAt:now })
      : defect),
  };
}

export function updateDefectStatus(
  library: DefectLibrary,
  defectId: string,
  status: DefectStatus,
  now: string,
): DefectLibrary {
  return {
    ...library,
    defects:library.defects.map((defect) => defect.id === defectId
      ? { ...defect, status, updatedAt:now }
      : defect),
  };
}

export function defectLifecycleAction(defect: ReportedDefect): "Resolve" | "Reopen" | "none" {
  return defect.status === "Reported" ? "Resolve" : defect.status === "Resolved" ? "Reopen" : "none";
}

export function serializeDefectLibrary(library: DefectLibrary): string {
  return JSON.stringify({ defects:library.defects });
}

function isDefect(value: unknown): value is ReportedDefect {
  if (!value || typeof value !== "object") return false;
  const defect = value as Partial<ReportedDefect>;
  return typeof defect.id === "string"
    && (defect.type === "Validation issue" || defect.type === "Missing event")
    && (defect.status === "Reported" || defect.status === "Resolved" || defect.status === "Archived")
    && typeof defect.createdAt === "string"
    && typeof defect.updatedAt === "string"
    && typeof defect.notes === "string"
    && Array.isArray(defect.issues);
}

export function restoreDefectLibrary(serialized: string | null): DefectLibrary {
  if (!serialized) return createDefectLibrary();
  try {
    const parsed = JSON.parse(serialized) as { defects?: unknown };
    return Array.isArray(parsed.defects) && parsed.defects.every(isDefect)
      ? { defects:clone(parsed.defects) }
      : createDefectLibrary();
  } catch {
    return createDefectLibrary();
  }
}

export function searchDefects(library: DefectLibrary, filters: DefectSearch = {}): ReportedDefect[] {
  const includes = (value: unknown, query: string | undefined) => !query || String(value ?? "").toLowerCase().includes(query.trim().toLowerCase());
  return library.defects.filter((defect) => {
    const searchable = JSON.stringify([defect.report, defect.notes, defect.issues]);
    return (!filters.status || filters.status === "All" || defect.status === filters.status)
      && (!filters.type || filters.type === "All" || defect.type === filters.type)
      && includes(searchable, filters.query)
      && includes(defect.issues.map(({ evidence }) => evidence.eventName).join(" "), filters.eventName)
      && includes(defect.issues.map(({ evidence }) => `${evidence.schemaName ?? ""} ${evidence.schemaId}`).join(" "), filters.schema)
      && includes(defect.issues.map(({ match }) => match.canonicalPath).join(" "), filters.path);
  }).map(clone);
}

export function requestDefectDeletion(library: DefectLibrary, defectId: string): DefectLibrary {
  return library.defects.some(({ id }) => id === defectId) ? { ...library, deletionConfirmationId:defectId } : library;
}

export function cancelDefectDeletion(library: DefectLibrary): DefectLibrary {
  const { deletionConfirmationId:_ignored, ...remaining } = library;
  return remaining;
}

export function confirmDefectDeletion(library: DefectLibrary): DefectLibrary {
  const id = library.deletionConfirmationId;
  const { deletionConfirmationId:_ignored, ...remaining } = library;
  return id ? { ...remaining, defects:library.defects.filter((defect) => defect.id !== id) } : remaining;
}

function currentIssueFromSavedEvent(event: CompletedSession["events"][number], issue: NonNullable<CompletedSession["events"][number]["validationDetails"]>["issues"][number]): CurrentDefectIssue {
  const schema = event.validationDetails?.schema;
  const assignment = event.validationDetails?.assignment;
  const revision = ruleRevision(issue.rule, issue.schemaVersion ?? schema?.version ?? 0);
  return {
    sourceId:event.sourceId,
    eventName:event.name,
    schemaId:schema?.id ?? `schema:${slug(issue.schemaName)}`,
    validationTarget:assignment?.target ?? "payload",
    concretePath:issue.instancePath,
    ...(issue.templatePath ? { templatePath:issue.templatePath } : {}),
    ruleId:`rule:${slug(issue.rule ?? issue.schemaLocation)}`,
    ruleRevision:revision,
    actual:issue.actual,
    expected:issue.expected,
    ...(event.pageUrl ? { pageUrl:event.pageUrl } : {}),
    ...(event.captureTime ? { captureTime:event.captureTime } : {}),
    ...(event.sourceName ? { sourceName:event.sourceName } : {}),
    schemaName:schema?.name ?? issue.schemaName,
    ...(issue.rule ? { ruleName:issue.rule } : {}),
  };
}

function savedSessionContainsDefectIssue(completed: CompletedSession, defect: ReportedDefect): boolean {
  return completed.events.some((event) => (event.validationDetails?.issues ?? []).some((issue) => {
    const current = issueMatchIdentity(currentIssueFromSavedEvent(event, issue));
    return defect.issues.some(({ match }) => sameIdentity(match, current));
  }));
}

export function attachSavedSessionToDefect(
  library: DefectLibrary,
  savedSessions: SavedSessionLibrary,
  defectId: string,
  completed: CompletedSession,
  name: string,
  now: string,
): { library:DefectLibrary; savedSessions:SavedSessionLibrary } {
  const defect = library.defects.find(({ id }) => id === defectId);
  if (!defect) throw new Error(`Unknown defect: ${defectId}`);
  const nextSessions = saveCompletedSession(savedSessions, completed, name);
  const saved = nextSessions.sessions.at(-1)!;
  return {
    savedSessions:nextSessions,
    library:{
      ...library,
      defects:library.defects.map((candidate) => candidate.id === defectId
        ? { ...candidate, updatedAt:now, savedSession:{ id:saved.id, containsMatchingIssue:savedSessionContainsDefectIssue(completed, defect) } }
        : candidate),
    },
  };
}

export async function completeDefectReportAction(
  library: DefectLibrary,
  defect: ReportedDefect,
  action: DefectReportAction,
  clipboard: { writeText?(text:string):Promise<void> },
  representation: () => string,
): Promise<{ library:DefectLibrary; copied:boolean; added:boolean; existing:ReportedDefect[] }> {
  let next = library;
  let added = false;
  let existing: ReportedDefect[] = [];
  if (action !== "Copy for Jira Cloud") {
    const result = addDefect(next, defect);
    next = result.library;
    added = result.added;
    existing = result.existing;
  }
  const shouldCopy = action !== "Save as reported defect";
  if (shouldCopy) {
    if (!clipboard.writeText) throw new Error("Clipboard access is unavailable.");
    await clipboard.writeText(representation());
  }
  return { library:next, copied:shouldCopy, added, existing };
}
