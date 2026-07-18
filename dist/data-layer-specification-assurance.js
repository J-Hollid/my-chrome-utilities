import { compileSpecificationProject, evaluateSpecificationObservation } from "./data-layer-specification-engine.js";
import { publishProjectRelease } from "./data-layer-specification-project.js";
function differences(actual, expected) { if (!expected)
    return []; const result = []; if (expected.winner !== undefined && actual.winner?.assignmentId !== expected.winner)
    result.push(`winner: expected ${String(expected.winner)}, actual ${actual.winner?.assignmentId ?? "none"}`); if (expected.step !== undefined && actual.activeStepId !== expected.step)
    result.push(`step: expected ${String(expected.step)}, actual ${String(actual.activeStepId)}`); if (expected.schemaRevision !== undefined && actual.effectiveSchemaRevision !== expected.schemaRevision)
    result.push(`schemaRevision: expected ${String(expected.schemaRevision)}, actual ${String(actual.effectiveSchemaRevision)}`); if (expected.issues !== undefined && JSON.stringify(actual.issues) !== JSON.stringify(expected.issues))
    result.push(`issues: expected ${JSON.stringify(expected.issues)}, actual ${JSON.stringify(actual.issues)}`); return result; }
export function runProductionFixture(plan, fixture) { const observations = fixture.observations ?? [{ ...(fixture.context ?? {}), payload: fixture.payload }], expected = fixture.expected; let instances = []; const steps = observations.map((observation, index) => { const actual = evaluateSpecificationObservation(plan, observation, instances); instances = actual.stateTransition?.instances ?? instances; const perStep = fixture.stepExpectations?.[index] ?? (index === observations.length - 1 ? expected : undefined); return { index, actual, ...(perStep ? { expected: perStep } : {}), differences: differences(actual, perStep) }; }); return { fixtureId: fixture.id, status: steps.some(({ differences }) => differences.length) ? "fail" : "pass", compiledRevision: plan.revision, steps }; }
export function buildEffectiveRequirementCoverage(plan, evidence, range) { const all = []; for (const assignment of plan.assignments) {
    const schema = plan.schemas[assignment.schemaDraftId], event = plan.events[assignment.eventId];
    if (!schema || !event)
        continue;
    for (const flow of Object.values(plan.flows))
        for (const step of flow.steps ?? []) {
            if (step.eventId !== event.id)
                continue;
            for (const key of Object.keys(plan.provenance).filter((key) => key.startsWith(`${schema.schemaId}:`))) {
                const path = key.slice(schema.schemaId.length + 1), proof = evidence.find(({ result }) => result.status === "pass" && result.steps.some(({ actual }) => actual.winner?.assignmentId === assignment.assignmentId && actual.activeStepId === step.id)), waiver = (step.waivers ?? []).find((item) => item.path === path);
                all.push({ id: `${step.pageId ?? "any"}:${event.id}:${flow.id}:${step.id}:${path}`, pageId: String(step.pageId ?? ""), eventId: event.id, flowId: flow.id, stepId: step.id, assignmentId: assignment.assignmentId, requirementPath: path, schemaRevision: schema.revision, profileIds: plan.provenance[key].map(({ profileId }) => profileId), state: waiver ? "waived" : proof ? "covered" : "missing", ...(proof ? { fixtureId: proof.fixture.id } : {}) });
            }
        }
} return { rows: all.slice(range.offset, range.offset + range.limit), totalRows: all.length }; }
export function specificationPreflight(envelope) { const compiled = compileSpecificationProject(envelope); if (compiled.status === "blocked")
    return { blockers: compiled.diagnostics.map((diagnostic) => ({ code: diagnostic.code, message: `${diagnostic.field}: ${diagnostic.referenceId}`, entityId: diagnostic.entityId, field: diagnostic.field })), warnings: [], fixtures: [] }; const fixtures = envelope.project.collections.fixtures.map((fixture) => runProductionFixture(compiled.plan, fixture)), blockers = []; for (const fixture of fixtures)
    if (fixture.status === "fail" && envelope.project.collections.fixtures.find(({ id }) => id === fixture.fixtureId)?.releasePolicy !== "optional")
        blockers.push({ code: "fixture-failed", message: `Fixture ${fixture.fixtureId} does not match production evaluation.`, entityId: fixture.fixtureId, field: "expected" }); const probes = new Map(); for (const assignment of compiled.plan.assignments) {
    const key = `${assignment.eventId}:${assignment.priority}:${assignment.applicabilitySetId}`, ids = probes.get(key) ?? [];
    ids.push(assignment.assignmentId);
    probes.set(key, ids);
} for (const ids of probes.values())
    if (ids.length > 1)
        blockers.push({ code: "assignment-tie", message: `Equal candidates ${ids.join(", ")}.`, entityId: ids[0], field: "priority" }); return { blockers, warnings: [], plan: compiled.plan, fixtures }; }
export function publishCompiledRelease(state, options) { const envelope = { format: "my-chrome-utilities.canonical-specification-project", version: 2, revision: state.project.releases.length + 1, draftId: state.draft?.id ?? "release", project: state.project, entityRevisions: {} }, preflight = specificationPreflight(envelope); if (preflight.blockers.length || !preflight.plan)
    throw new Error(`Production preflight has ${preflight.blockers.length} blockers.`); const published = publishProjectRelease(state, { id: options.id, write: () => { } }), release = published.project.releases.at(-1), pinnedRelease = { ...release, executablePlan: structuredClone(preflight.plan), fixtureResults: structuredClone(preflight.fixtures) }, project = { ...published.project, releases: [...published.project.releases.slice(0, -1), pinnedRelease] }; options.write(project); return { project, history: { undo: [], redo: [] } }; }
//# sourceMappingURL=data-layer-specification-assurance.js.map