import { saveCompletedSession, } from "./data-layer-saved-sessions.js";
export const DEFECT_LIBRARY_STORAGE_KEY = "my-chrome-utilities.defect-library.v1";
function clone(value) { return structuredClone(value); }
function slug(value) {
    return value.toLowerCase().replace(/\s+v\d+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function ruleRevision(rule, schemaVersion) {
    return Number(rule?.match(/ v(\d+)$/)?.[1] ?? schemaVersion);
}
export function currentDefectIssues(event) {
    const schema = event.validationDetails?.schema;
    const assignment = event.validationDetails?.assignment;
    return (event.validationDetails?.issues ?? []).map((issue) => ({
        sourceId: event.sourceId,
        eventName: event.name,
        schemaId: schema?.id ?? `schema:${slug(issue.schemaName)}`,
        validationTarget: assignment?.target ?? "payload",
        concretePath: issue.instancePath,
        ...(issue.templatePath ? { templatePath: issue.templatePath } : {}),
        ruleId: `rule:${slug(issue.rule ?? issue.schemaLocation)}`,
        ruleRevision: ruleRevision(issue.rule, issue.schemaVersion ?? schema?.version ?? 0),
        actual: issue.actual,
        expected: issue.expected,
        ...(event.pageUrl ? { pageUrl: event.pageUrl } : {}),
        captureTime: event.captureTime,
        ...(event.sourceName ? { sourceName: event.sourceName } : {}),
        schemaName: schema?.name ?? issue.schemaName,
        ...(issue.rule ? { ruleName: issue.rule.replace(/ v\d+$/, "") } : {}),
    }));
}
export function presentedEventTriage(event, library) {
    const issues = currentDefectIssues(event);
    const aggregate = triageEvent(issues, library);
    return {
        ...aggregate,
        issueDetails: issues.map((issue) => {
            const triage = issueTriage(issue, library);
            return {
                state: triage.state,
                concretePath: issue.concretePath,
                canonicalPath: canonicalAffectedPath(issue.concretePath, issue.templatePath),
                defectLinks: triage.defects.map((defect) => ({
                    id: defect.id,
                    label: String(defect.report?.summary ?? defect.id),
                })),
            };
        }),
    };
}
export function canonicalAffectedPath(concretePath, templatePath) {
    return templatePath?.trim() || concretePath;
}
export function issueMatchIdentity(issue) {
    return {
        sourceId: issue.sourceId,
        eventName: issue.eventName,
        schemaId: issue.schemaId,
        validationTarget: issue.validationTarget,
        canonicalPath: canonicalAffectedPath(issue.concretePath, issue.templatePath),
        ruleId: issue.ruleId,
        ruleRevision: issue.ruleRevision,
    };
}
function sameBase(left, right) {
    return left.sourceId === right.sourceId
        && left.eventName === right.eventName
        && left.schemaId === right.schemaId
        && left.validationTarget === right.validationTarget
        && left.canonicalPath === right.canonicalPath
        && left.ruleId === right.ruleId;
}
function sameIdentity(left, right) {
    return sameBase(left, right) && left.ruleRevision === right.ruleRevision;
}
function createDefect(options) {
    return clone({
        id: options.id,
        type: options.type,
        status: "Reported",
        createdAt: options.now,
        updatedAt: options.now,
        report: options.report,
        notes: options.notes ?? "",
        issues: (options.issues ?? []).map((evidence) => ({ match: issueMatchIdentity(evidence), evidence })),
    });
}
export function createValidationDefect(options) {
    return createDefect({ ...options, type: "Validation issue" });
}
export function createMissingEventDefect(options) {
    return createDefect({ ...options, type: "Missing event", issues: [] });
}
export function createDefectLibrary() { return { defects: [] }; }
function activeIdentityMatches(defect, identity) {
    return defect.type === "Validation issue"
        && defect.status === "Reported"
        && defect.issues.some(({ match }) => sameIdentity(match, identity));
}
export function matchingDefects(issue, library) {
    const identity = issueMatchIdentity(issue);
    return library.defects.filter((defect) => activeIdentityMatches(defect, identity)).map(clone);
}
export function issueTriage(issue, library) {
    const identity = issueMatchIdentity(issue);
    const reported = library.defects.filter((defect) => activeIdentityMatches(defect, identity));
    if (reported.length)
        return { state: "Reported", defects: reported.map(clone) };
    const resolved = library.defects.filter((defect) => defect.type === "Validation issue"
        && defect.status === "Resolved"
        && defect.issues.some(({ match }) => sameIdentity(match, identity)));
    if (resolved.length)
        return { state: "Possible regression treated New", defects: resolved.map(clone) };
    const changedRevision = library.defects.filter((defect) => defect.type === "Validation issue"
        && defect.status === "Reported"
        && defect.issues.some(({ match }) => sameBase(match, identity) && match.ruleRevision !== identity.ruleRevision));
    if (changedRevision.length)
        return { state: "Review required", defects: changedRevision.map(clone) };
    return { state: "New", defects: [] };
}
export function triageEvent(issues, library) {
    const states = issues.map((issue) => issueTriage(issue, library).state);
    const reportedCount = states.filter((state) => state === "Reported").length;
    const reviewRequiredCount = states.filter((state) => state === "Review required").length;
    const newCount = states.length - reportedCount;
    const state = reportedCount === issues.length && issues.length
        ? `all ${issues.length} issues reported`
        : reportedCount
            ? `${newCount} new and ${reportedCount} reported`
            : `${newCount} new issues`;
    return { state, newCount, reportedCount, reviewRequiredCount, issues: states };
}
export function addDefect(library, defect, saveSeparately = false) {
    const existing = defect.issues.flatMap(({ evidence }) => matchingDefects(evidence, library));
    const unique = [...new Map(existing.map((candidate) => [candidate.id, candidate])).values()];
    if (unique.length && !saveSeparately)
        return { library, defect: clone(defect), added: false, existing: unique };
    return { library: { ...library, defects: [...library.defects, clone(defect)] }, defect: clone(defect), added: true, existing: unique };
}
export function editDefect(library, defectId, edits, now) {
    return {
        ...library,
        defects: library.defects.map((defect) => defect.id === defectId
            ? clone({ ...defect, ...edits, updatedAt: now })
            : defect),
    };
}
export function updateDefectStatus(library, defectId, status, now) {
    return {
        ...library,
        defects: library.defects.map((defect) => defect.id === defectId
            ? { ...defect, status, updatedAt: now }
            : defect),
    };
}
export function defectLifecycleAction(defect) {
    return defect.status === "Reported" ? "Resolve" : defect.status === "Resolved" ? "Reopen" : "none";
}
export function serializeDefectLibrary(library) {
    return JSON.stringify({ defects: library.defects });
}
function isDefect(value) {
    if (!value || typeof value !== "object")
        return false;
    const defect = value;
    return typeof defect.id === "string"
        && (defect.type === "Validation issue" || defect.type === "Missing event")
        && (defect.status === "Reported" || defect.status === "Resolved" || defect.status === "Archived")
        && typeof defect.createdAt === "string"
        && typeof defect.updatedAt === "string"
        && typeof defect.notes === "string"
        && Array.isArray(defect.issues);
}
export function restoreDefectLibrary(serialized) {
    if (!serialized)
        return createDefectLibrary();
    try {
        const parsed = JSON.parse(serialized);
        return Array.isArray(parsed.defects) && parsed.defects.every(isDefect)
            ? { defects: clone(parsed.defects) }
            : createDefectLibrary();
    }
    catch {
        return createDefectLibrary();
    }
}
export function searchDefects(library, filters = {}) {
    const includes = (value, query) => !query || String(value ?? "").toLowerCase().includes(query.trim().toLowerCase());
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
export function requestDefectDeletion(library, defectId) {
    return library.defects.some(({ id }) => id === defectId) ? { ...library, deletionConfirmationId: defectId } : library;
}
export function cancelDefectDeletion(library) {
    const { deletionConfirmationId: _ignored, ...remaining } = library;
    return remaining;
}
export function confirmDefectDeletion(library) {
    const id = library.deletionConfirmationId;
    const { deletionConfirmationId: _ignored, ...remaining } = library;
    return id ? { ...remaining, defects: library.defects.filter((defect) => defect.id !== id) } : remaining;
}
function currentIssueFromSavedEvent(event, issue) {
    const schema = event.validationDetails?.schema;
    const assignment = event.validationDetails?.assignment;
    const revision = ruleRevision(issue.rule, issue.schemaVersion ?? schema?.version ?? 0);
    return {
        sourceId: event.sourceId,
        eventName: event.name,
        schemaId: schema?.id ?? `schema:${slug(issue.schemaName)}`,
        validationTarget: assignment?.target ?? "payload",
        concretePath: issue.instancePath,
        ...(issue.templatePath ? { templatePath: issue.templatePath } : {}),
        ruleId: `rule:${slug(issue.rule ?? issue.schemaLocation)}`,
        ruleRevision: revision,
        actual: issue.actual,
        expected: issue.expected,
        ...(event.pageUrl ? { pageUrl: event.pageUrl } : {}),
        ...(event.captureTime ? { captureTime: event.captureTime } : {}),
        ...(event.sourceName ? { sourceName: event.sourceName } : {}),
        schemaName: schema?.name ?? issue.schemaName,
        ...(issue.rule ? { ruleName: issue.rule } : {}),
    };
}
function savedSessionContainsDefectIssue(completed, defect) {
    return completed.events.some((event) => (event.validationDetails?.issues ?? []).some((issue) => {
        const current = issueMatchIdentity(currentIssueFromSavedEvent(event, issue));
        return defect.issues.some(({ match }) => sameIdentity(match, current));
    }));
}
export function attachSavedSessionToDefect(library, savedSessions, defectId, completed, name, now) {
    const defect = library.defects.find(({ id }) => id === defectId);
    if (!defect)
        throw new Error(`Unknown defect: ${defectId}`);
    const nextSessions = saveCompletedSession(savedSessions, completed, name);
    const saved = nextSessions.sessions.at(-1);
    return {
        savedSessions: nextSessions,
        library: {
            ...library,
            defects: library.defects.map((candidate) => candidate.id === defectId
                ? { ...candidate, updatedAt: now, savedSession: { id: saved.id, containsMatchingIssue: savedSessionContainsDefectIssue(completed, defect) } }
                : candidate),
        },
    };
}
export async function completeDefectReportAction(library, defect, action, clipboard, representation) {
    let next = library;
    let added = false;
    let existing = [];
    if (action !== "Copy for Jira Cloud") {
        const result = addDefect(next, defect);
        next = result.library;
        added = result.added;
        existing = result.existing;
    }
    const shouldCopy = action !== "Save as reported defect";
    if (shouldCopy) {
        if (!clipboard.writeText)
            throw new Error("Clipboard access is unavailable.");
        await clipboard.writeText(representation());
    }
    return { library: next, copied: shouldCopy, added, existing };
}
//# sourceMappingURL=data-layer-defect-library.js.map