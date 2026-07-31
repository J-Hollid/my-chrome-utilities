import { compileSpecificationProject, evaluateSpecificationObservation } from "./data-layer-specification-engine.js";
import { assignmentContributorTargets, compileAssignmentContributorTarget } from "./data-layer-layered-schema-project.js";
import { guidedTestCaseFinding } from "./data-layer-guided-test-cases.js";
import { publishProjectRelease } from "./data-layer-specification-project.js";
function differences(actual, expected) { if (!expected)
    return []; const result = [], status = actual.issueDetails.length ? "fail" : "pass", issueCodes = [...new Set(actual.issueDetails.map(({ code }) => code))], reviewedIssues = Array.isArray(expected.issues) && expected.issues.every((issue) => issue && typeof issue === "object") ? expected.issues : undefined, actualIssues = actual.issueDetails.map(({ path, code }) => ({ path, code })); if (expected.winner !== undefined && actual.winner?.assignmentId !== expected.winner)
    result.push(`winner: expected ${String(expected.winner)}, actual ${actual.winner?.assignmentId ?? "none"}`); if (expected.step !== undefined && actual.activeStepId !== expected.step)
    result.push(`step: expected ${String(expected.step)}, actual ${String(actual.activeStepId)}`); if (expected.schemaRevision !== undefined && actual.effectiveSchemaRevision !== expected.schemaRevision)
    result.push(`schemaRevision: expected ${String(expected.schemaRevision)}, actual ${String(actual.effectiveSchemaRevision)}`); if (expected.issues !== undefined && !equalIssues(reviewedIssues ?? expected.issues, reviewedIssues ? actualIssues : actual.issues))
    result.push(`issues: expected ${JSON.stringify(expected.issues)}, actual ${JSON.stringify(reviewedIssues ? actualIssues : actual.issues)}`); if (expected.status !== undefined && status !== expected.status)
    result.push(`status: expected ${String(expected.status)}, actual ${status}`); if (expected.outcome !== undefined && (actual.issueDetails.length ? "Invalid" : "Valid") !== expected.outcome)
    result.push(`outcome: expected ${String(expected.outcome)}, actual ${actual.issueDetails.length ? "Invalid" : "Valid"}`); if (expected.issueCodes !== undefined && JSON.stringify(issueCodes) !== JSON.stringify(expected.issueCodes))
    result.push(`issueCodes: expected ${JSON.stringify(expected.issueCodes)}, actual ${JSON.stringify(issueCodes)}`); return result; }
const equalIssues = (left, right) => JSON.stringify(left) === JSON.stringify(right);
export function runProductionFixture(plan, fixture) { const guided = fixture.testType === "event-validation", event = guided ? plan.events[String(fixture.eventId ?? "")] : undefined, declared = fixture.observations, guidedObservation = guided && event ? [{ sessionId: fixture.id, sourceId: String(event.sourceId ?? "event-history"), eventName: String(event.eventName ?? event.name), eventId: event.id, ...(fixture.pageId ? { pageId: fixture.pageId } : {}), payload: structuredClone(fixture.input ?? {}) }] : undefined, fallback = { ...(fixture.context ?? {}), payload: fixture.payload }, observations = guidedObservation ?? declared ?? (fixture.payload !== undefined ? [fallback] : []), expected = (guided ? fixture.reviewedExpectations : fixture.expected), stepExpectations = fixture.stepExpectations ?? [], blockers = [...(observations.length ? [] : [guided ? "Add at least one input." : "Add at least one observation."]), ...(Object.keys(expected ?? {}).length || stepExpectations.some((item) => Object.keys(item).length) ? [] : [guided ? "Add at least one reviewed assertion." : "Add at least one expected assertion."])]; if (blockers.length)
    return { fixtureId: fixture.id, status: "blocked", compiledRevision: plan.revision, steps: [], blockers }; let instances = []; const steps = observations.map((observation, index) => { const actual = evaluateSpecificationObservation(plan, observation, instances); instances = actual.stateTransition?.instances ?? instances; const perStep = stepExpectations[index] ?? (index === observations.length - 1 ? expected : undefined), stepDifferences = differences(actual, perStep), capturedIdentity = fixture.evaluationResultIdentity; if (index === observations.length - 1 && capturedIdentity !== undefined && actual.resultIdentity !== capturedIdentity)
    stepDifferences.push(`resultIdentity: expected ${String(capturedIdentity)}, actual ${actual.resultIdentity}`); return { index, actual, ...(perStep ? { expected: perStep } : {}), differences: stepDifferences }; }); return { fixtureId: fixture.id, status: steps.some(({ differences }) => differences.length) ? "fail" : "pass", compiledRevision: plan.revision, steps }; }
export function buildEffectiveRequirementCoverage(plan, evidence, range) { const all = []; for (const assignment of plan.assignments) {
    const schema = plan.schemas[assignment.schemaKey], event = plan.events[assignment.eventId];
    if (!schema || !event)
        continue;
    for (const flow of Object.values(plan.flows))
        for (const step of flow.steps ?? []) {
            if (step.eventId !== event.id)
                continue;
            for (const key of Object.keys(plan.provenance).filter((key) => key.startsWith(`${assignment.schemaKey}:`))) {
                const path = key.slice(assignment.schemaKey.length + 1), proof = evidence.find(({ result }) => result.status === "pass" && result.steps.some(({ actual }) => actual.winner?.assignmentId === assignment.assignmentId && actual.activeStepId === step.id)), waiver = (step.waivers ?? []).find((item) => item.path === path);
                all.push({ id: `${step.pageId ?? "any"}:${event.id}:${flow.id}:${step.id}:${path}`, pageId: String(step.pageId ?? ""), eventId: event.id, flowId: flow.id, stepId: step.id, assignmentId: assignment.assignmentId, requirementPath: path, schemaRevision: schema.revision, profileIds: plan.provenance[key].map(({ profileId }) => profileId), state: waiver ? "waived" : proof ? "covered" : "missing", ...(proof ? { fixtureId: proof.fixture.id } : {}) });
            }
        }
} return { rows: all.slice(range.offset, range.offset + range.limit), totalRows: all.length }; }
function evidenceIdentity(prefix, value) { let hash = 2166136261; for (const character of JSON.stringify(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
} return `${prefix}:${(hash >>> 0).toString(16).padStart(8, "0")}`; }
function independentSchemaBlockers(project) {
    const state = { project, history: { undo: [], redo: [] } }, findings = [];
    for (const target of assignmentContributorTargets(state)) {
        try {
            const assignment = { id: `assurance:${target.id}`, name: target.name, targetId: target.id, targetKind: target.kind }, result = compileAssignmentContributorTarget(state, assignment, { eventId: target.id, eventRole: "interaction" });
            for (const conflict of result.compiled.conflicts)
                findings.push({ code: "contributor-conflict", message: `${conflict.message} Repair ${conflict.contributors.join(" and ")}.`, entityId: target.id, field: conflict.path });
            for (const [path, property] of Object.entries(result.compiled.properties)) {
                const patterns = [...(property.patterns ?? []), ...(property.rules ?? []).filter(({ kind, operator }) => kind === "pattern" || operator === "regular-expression").map(({ pattern, parameters }) => pattern ?? parameters)];
                for (const pattern of patterns)
                    try {
                        if (typeof pattern !== "string" || !pattern)
                            throw new Error();
                        new RegExp(pattern);
                    }
                    catch {
                        findings.push({ code: "canonical-invalid-rule", message: `Pattern rule at ${path} is malformed. Repair the invalid rule field.`, entityId: target.id, field: `${path}/rules` });
                    }
            }
        }
        catch (error) {
            findings.push({ code: "canonical-invalid-schema", message: `Canonical schema compilation failed. ${error instanceof Error ? error.message : String(error)}`, entityId: target.id, field: "canonicalSchema" });
        }
    }
    return [...new Map(findings.map((finding) => [`${finding.code}:${finding.entityId}:${finding.field}`, finding])).values()];
}
export function assertDeveloperSchemaExportAvailable(preflight) { if (preflight.blockers.length || !preflight.plan)
    throw new Error(`Developer schema export has ${preflight.blockers.length} blocking issues. Repair canonical or effective-schema validation first.`); }
export function specificationPreflight(envelope) {
    const warnings = [
        ...(envelope.project.collections.fixtures.length ? [] : [{ code: "no-fixtures", message: "No Test cases. Add one to provide optional evaluation evidence.", entityId: envelope.project.id, field: "collections.fixtures" }]),
        ...(envelope.project.collections.assignments.length ? [] : [{ code: "no-assignments", message: "No Assignments. Add one when routing this schema is useful.", entityId: envelope.project.id, field: "collections.assignments" }]),
    ], assignmentIds = new Set(envelope.project.collections.assignments.map(({ id }) => id));
    let compiled = compileSpecificationProject(envelope);
    if (compiled.status === "blocked") {
        const unresolved = compiled.diagnostics.filter(({ code, entityId }) => code === "dangling-reference" && assignmentIds.has(entityId));
        for (const diagnostic of unresolved)
            warnings.push({ code: "assignment-unresolved", message: `Assignment ${diagnostic.entityId} cannot be evaluated. Repair ${diagnostic.field}: ${diagnostic.referenceId}.`, entityId: diagnostic.entityId, field: `collections.assignments/${diagnostic.entityId}/${diagnostic.field}` });
        if (unresolved.length) {
            const rejected = new Set(unresolved.map(({ entityId }) => entityId)), project = { ...envelope.project, collections: { ...envelope.project.collections, assignments: envelope.project.collections.assignments.filter(({ id }) => !rejected.has(id)) } };
            compiled = compileSpecificationProject({ ...envelope, project });
        }
    }
    if (compiled.status === "blocked") {
        const blockers = compiled.diagnostics.map((diagnostic) => ({ code: diagnostic.code, message: `Repair ${diagnostic.field}: ${diagnostic.referenceId}.`, entityId: diagnostic.entityId, field: diagnostic.field }));
        return { contentIdentity: evidenceIdentity("preflight", { revision: envelope.revision, warnings, blockers }), blockers, warnings, fixtures: [] };
    }
    const probes = new Map();
    for (const assignment of compiled.plan.assignments) {
        const key = `${assignment.eventId}:${assignment.priority}:${assignment.applicabilitySetId}`, ids = probes.get(key) ?? [];
        ids.push(assignment.assignmentId);
        probes.set(key, ids);
    }
    const ambiguous = new Set();
    for (const ids of probes.values())
        if (ids.length > 1) {
            ids.forEach((assignmentId) => ambiguous.add(assignmentId));
            warnings.push({ code: "assignment-tie", message: `Equal candidates ${ids.join(", ")}. Repair assignment priority or applicability.`, entityId: ids[0], field: `collections.assignments/${ids[0]}/priority` });
        }
    if (ambiguous.size) {
        const project = { ...envelope.project, collections: { ...envelope.project.collections, assignments: envelope.project.collections.assignments.filter(({ id }) => !ambiguous.has(id)) } };
        compiled = compileSpecificationProject({ ...envelope, project });
        if (compiled.status === "blocked")
            throw new Error("Excluding ambiguous optional Assignments unexpectedly blocked the production plan.");
    }
    const fixtures = envelope.project.collections.fixtures.map((fixture) => runProductionFixture(compiled.plan, fixture)), blockers = independentSchemaBlockers(envelope.project);
    for (const fixture of fixtures)
        if (fixture.status !== "pass") {
            const entity = envelope.project.collections.fixtures.find(({ id }) => id === fixture.fixtureId), guidedFinding = entity?.testType ? guidedTestCaseFinding({ ...entity, status: fixture.status === "blocked" ? "Blocked" : "Mismatched", differences: fixture.steps.flatMap(({ differences }) => differences.map((difference) => ({ field: difference.split(":")[0] ?? "expectation", expected: undefined, actual: undefined }))) }) : undefined;
            warnings.push(guidedFinding ?? { code: fixture.status === "blocked" ? "fixture-incomplete" : "fixture-failed", message: fixture.blockers?.join(" ") ?? `Fixture ${fixture.fixtureId} does not match production evaluation. Repair its expected result.`, entityId: fixture.fixtureId, field: `collections.fixtures/${fixture.fixtureId}/${fixture.status === "blocked" ? "observations" : "expected"}` });
            if (fixture.steps.some(({ differences }) => differences.some((difference) => difference.startsWith("resultIdentity:"))))
                warnings.push({ code: "stale-coverage", message: `Fixture ${fixture.fixtureId} evidence was captured against an older schema. Rerun the Fixture.`, entityId: fixture.fixtureId, field: `collections.fixtures/${fixture.fixtureId}/evaluationResultIdentity` });
        }
    const proving = envelope.project.collections.fixtures.map((fixture, index) => ({ fixture, result: fixtures[index] })).filter(({ result }) => result.status === "pass"), coverage = buildEffectiveRequirementCoverage(compiled.plan, proving, { offset: 0, limit: Number.MAX_SAFE_INTEGER });
    if (!proving.length)
        warnings.push({ code: "zero-proving-evidence", message: "No current assertion-bearing passing Fixture. Add or repair optional evidence.", entityId: envelope.project.id, field: "collections.fixtures" });
    if (!coverage.totalRows)
        warnings.push({ code: "no-coverage", message: "No Coverage. Add an Assignment, Flow step, or Fixture to create optional evidence cells.", entityId: envelope.project.id, field: "collections.assignments" });
    for (const row of coverage.rows)
        if (row.state === "missing")
            warnings.push({ code: "uncovered-requirement", message: `${row.requirementPath} is not proven for ${row.flowId}/${row.stepId}. Add Fixture evidence.`, entityId: row.flowId, field: `collections.flows/${row.flowId}/steps/${row.stepId}` });
    const fixtureBytes = fixtures.map(({ fixtureId, status, steps, blockers: fixtureBlockers }) => ({ fixtureId, status, results: steps.map(({ actual }) => actual.resultIdentity), blockers: fixtureBlockers })), contentIdentity = evidenceIdentity("preflight", { plan: compiled.plan.contentIdentity, fixtures: fixtureBytes, warnings, blockers });
    return { contentIdentity, blockers, warnings, plan: compiled.plan, fixtures };
}
export function publishCompiledRelease(state, options) { const nextRevision = Math.max(0, ...state.project.releases.map((release) => release.revision)) + 1, envelope = { format: "my-chrome-utilities.canonical-specification-project", version: 2, revision: nextRevision, draftId: state.draft?.id ?? "release", project: state.project, entityRevisions: {} }, current = specificationPreflight(envelope), preflight = options.preflight ?? current; if (options.preflight && current.contentIdentity !== preflight.contentIdentity)
    throw new Error("The reviewed preflight is stale; run preflight again before publication."); if (preflight.blockers.length || !preflight.plan)
    throw new Error(`Production preflight has ${preflight.blockers.length} blockers.`); const published = publishProjectRelease(state, { id: options.id, write: () => { } }), release = published.project.releases.at(-1), pinnedPlan = { ...structuredClone(preflight.plan), releaseId: release.id }, pinnedRelease = { ...release, preflightContentIdentity: preflight.contentIdentity, preflightWarnings: structuredClone(preflight.warnings), preflightBlockers: structuredClone(preflight.blockers), executablePlan: pinnedPlan, fixtureResults: structuredClone(preflight.fixtures) }, project = { ...published.project, releases: [...published.project.releases.slice(0, -1), pinnedRelease] }; options.write(project); return { project, history: { undo: [], redo: [] } }; }
//# sourceMappingURL=data-layer-specification-assurance.js.map