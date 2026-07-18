import { advanceFlowInstance, conditionMatches as projectConditionMatches, startFlowInstance } from "./data-layer-specification-project.js";
export { applyCanonicalCommand, applyCanonicalSchemaDraftEdits, createCanonicalProjectEnvelope, migrateCanonicalProject } from "./data-layer-specification-model.js";
const clone = (value) => structuredClone(value);
function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value))
        freeze(child);
} return value; }
function index(entities) { return Object.fromEntries(entities.map((entity) => [entity.id, clone(entity)])); }
function requirementDocument(profiles) { const root = { type: "object", properties: {}, required: [] }, effective = new Map(), origins = new Map(), conflicts = []; for (const profile of profiles)
    for (const requirement of profile.requirements) {
        const prior = effective.get(requirement.path), pathOrigins = origins.get(requirement.path) ?? [];
        if (prior?.type && requirement.type && prior.type !== requirement.type)
            conflicts.push({ path: requirement.path, origins: [...pathOrigins, profile.id], reason: `Incompatible types ${prior.type} and ${requirement.type}` });
        if (prior && (prior.required && requirement.forbidden || prior.forbidden && requirement.required))
            conflicts.push({ path: requirement.path, origins: [...pathOrigins, profile.id], reason: "Required and Forbidden are incompatible" });
        const allowedValues = prior?.allowedValues && requirement.allowedValues ? prior.allowedValues.filter((value) => requirement.allowedValues.some((candidate) => Object.is(candidate, value))) : requirement.allowedValues ?? prior?.allowedValues;
        if (prior?.allowedValues && requirement.allowedValues && !allowedValues.length)
            conflicts.push({ path: requirement.path, origins: [...pathOrigins, profile.id], reason: "Allowed-value intersection is empty" });
        const rules = [...(prior?.rules ?? [])];
        for (const rule of requirement.rules ?? []) {
            const existing = rules.find((candidate) => candidate.id === rule.id);
            if (existing && JSON.stringify(existing) !== JSON.stringify(rule))
                conflicts.push({ path: requirement.path, origins: [...pathOrigins, profile.id], reason: `Rule ${String(rule.id)} is incompatible` });
            else if (!existing)
                rules.push(clone(rule));
        }
        effective.set(requirement.path, { ...prior, ...clone(requirement), ...(allowedValues ? { allowedValues } : {}), ...(rules.length ? { rules } : {}) });
        origins.set(requirement.path, [...pathOrigins, profile.id]);
    } for (const requirement of effective.values()) {
    const parts = requirement.path.split("/").filter(Boolean);
    let node = root;
    for (let at = 0; at < parts.length; at += 1) {
        const part = parts[at], last = at === parts.length - 1;
        if (last) {
            node.properties[part] = { type: requirement.type ?? "string", ...(requirement.allowedValues ? { enum: requirement.allowedValues } : {}), ...(requirement.description ? { description: requirement.description } : {}), ...(requirement.examples ? { examples: requirement.examples } : {}), ...(requirement.rules?.length ? { "x-rules": requirement.rules } : {}), ...(requirement.forbidden ? { "x-forbidden": true } : {}) };
            if (requirement.required && !node.required.includes(part))
                node.required.push(part);
        }
        else {
            node.properties[part] ??= { type: "object", properties: {}, required: [] };
            if (requirement.required && !node.required.includes(part))
                node.required.push(part);
            node = node.properties[part];
        }
    }
} return { document: root, required: root.required, conflicts }; }
function referencedProfiles(project, schema) { const ids = schema.workingDraft?.profileIds ?? schema.profileIds ?? []; return ids.map((id) => project.collections.profiles.find((profile) => profile.id === id)).filter((profile) => Boolean(profile)); }
function graphDiagnostics(project) { const pages = new Set(project.collections.pages.map(({ id }) => id)), events = new Set(project.collections.events.map(({ id }) => id)), profiles = new Set(project.collections.profiles.map(({ id }) => id)), schemas = new Set(project.collections.schemaDrafts.map(({ id }) => id)), applicability = new Set(project.collections.applicabilitySets.map(({ id }) => id)), result = []; for (const flow of project.collections.flows)
    for (const step of flow.steps ?? []) {
        if (step.pageId && !pages.has(String(step.pageId)))
            result.push({ code: "dangling-reference", entityId: step.id, field: "pageId", referenceId: String(step.pageId) });
        if (step.eventId && !events.has(String(step.eventId)))
            result.push({ code: "dangling-reference", entityId: step.id, field: "eventId", referenceId: String(step.eventId) });
        for (const profileId of step.profileIds ?? [])
            if (!profiles.has(profileId))
                result.push({ code: "dangling-reference", entityId: step.id, field: "profileIds", referenceId: profileId });
    } for (const assignment of project.collections.assignments) {
    const references = [["schemaDraftId", assignment.schemaDraftId ?? assignment.schemaId, schemas], ["applicabilitySetId", assignment.applicabilitySetId, applicability], ["eventId", assignment.eventId, events]];
    for (const [field, value, identities] of references)
        if (!value || !identities.has(String(value)))
            result.push({ code: "dangling-reference", entityId: assignment.id, field, referenceId: String(value ?? "") });
} return result; }
export function compileSpecificationProject(envelope) { const diagnostics = graphDiagnostics(envelope.project); if (diagnostics.length)
    return { status: "blocked", diagnostics }; const schemas = {}, provenance = {}; for (const schema of envelope.project.collections.schemaDrafts) {
    const profiles = referencedProfiles(envelope.project, schema), compiled = requirementDocument(profiles);
    if (compiled.conflicts.length)
        return { status: "blocked", diagnostics: compiled.conflicts.map((conflict) => ({ code: "profile-conflict", entityId: schema.id, field: conflict.path, referenceId: `${conflict.origins.join(",")}: ${conflict.reason}` })) };
    const working = schema.workingDraft?.document, document = profiles.length ? compiled.document : clone(working ?? schema.document ?? compiled.document), revision = Number(schema.version ?? 1);
    schemas[schema.id] = { schemaId: schema.id, revision, document, required: compiled.required, profileIds: profiles.map(({ id }) => id) };
    profiles.forEach((profile, position) => profile.requirements.forEach((requirement) => { provenance[`${schema.id}:${requirement.path}`] ??= []; provenance[`${schema.id}:${requirement.path}`].push({ profileId: profile.id, profileName: profile.name, position }); }));
} const assignments = envelope.project.collections.assignments.map((assignment) => ({ assignmentId: assignment.id, schemaDraftId: String(assignment.schemaDraftId ?? assignment.schemaId), applicabilitySetId: String(assignment.applicabilitySetId), eventId: String(assignment.eventId), priority: Number(assignment.priority ?? 0), schemaRevision: Number(assignment.schemaRevision) })); const plan = { projectId: envelope.project.id, draftId: envelope.draftId, revision: envelope.revision, sourceProject: clone(envelope.project), pages: index(envelope.project.collections.pages), events: index(envelope.project.collections.events), applicability: index(envelope.project.collections.applicabilitySets), flows: index(envelope.project.collections.flows), schemas, assignments, provenance }; return { status: "compiled", plan: freeze(plan), diagnostics: [] }; }
function readField(observation, field) { return field.split(".").reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, observation); }
function conditionMatches(condition, observation) { if (!condition)
    return true; if (condition.kind === "predicate") {
    const actual = readField(observation, condition.field);
    if (condition.operator === "equals")
        return actual === condition.value;
    if (condition.operator === "not equals")
        return actual !== condition.value;
    if (condition.operator === "exists")
        return actual !== undefined;
    return false;
} if (condition.kind === "all")
    return condition.conditions.every((child) => conditionMatches(child, observation)); if (condition.kind === "any")
    return condition.conditions.some((child) => conditionMatches(child, observation)); return !condition.conditions.some((child) => conditionMatches(child, observation)); }
function validationIssues(value, document, path = "") { if (!value || typeof value !== "object")
    return [`${path || "/"}: expected object`]; const result = []; for (const required of document.required ?? [])
    if (!(required in value))
        result.push(`${path}/${required}: required`); for (const [key, child] of Object.entries(document.properties ?? {})) {
    const nested = value[key];
    if (nested !== undefined && child.type === "object")
        result.push(...validationIssues(nested, child, `${path}/${key}`));
} return result; }
function flowTransition(plan, observation, prior) { const sessionId = String(observation.sessionId ?? ""), correlationKey = typeof observation.correlationKey === "string" ? observation.correlationKey : undefined, same = (instance) => instance.sessionId === sessionId && (correlationKey === undefined || instance.correlationKey === correlationKey), session = prior.filter((instance) => same(instance) && instance.status === "active"), others = prior.filter((instance) => !same(instance)), eventId = String(observation.eventId ?? ""), pageId = String(observation.pageId ?? ""); if (!eventId && !pageId)
    return { instances: [...prior], ...(session.length === 1 ? { active: session[0] } : {}) }; const matches = (step) => Boolean(step.eventId || step.pageId) && (!step.eventId || step.eventId === eventId) && (!step.pageId || step.pageId === pageId), existing = new Set(session.map(({ flowId }) => flowId)), started = Object.values(plan.flows).filter((flow) => !existing.has(flow.id) && matches((flow.steps ?? [])[0] ?? { id: "", name: "" }) && (!flow.entryCondition || projectConditionMatches(flow.entryCondition, observation))).map((flow) => startFlowInstance(plan.sourceProject, flow.id, sessionId, { ...(correlationKey ? { correlationKey } : {}), ...(typeof observation.observedAt === "string" ? { startedAt: observation.observedAt } : {}) })), sources = [...session, ...started], advanced = sources.map((instance) => advanceFlowInstance(plan.sourceProject, instance, observation)), changed = advanced.filter((instance, index) => instance.history.length > (sources[index]?.history.length ?? 0)); if (changed.length > 1)
    return { instances: [...prior], ambiguity: { instanceIds: changed.map(({ id }) => id), reason: "Multiple flow instances are equally eligible; no instance was advanced." } }; return { instances: [...others, ...advanced.filter((instance) => instance.history.length > 0)], ...(changed[0] ? { active: changed[0] } : {}) }; }
export function evaluateSpecificationObservation(plan, observation, priorInstances) { const stateTransition = priorInstances ? flowTransition(plan, observation, priorInstances) : undefined, active = stateTransition?.active, effectiveObservation = { ...observation, ...(active ? { flowId: active.flowId, activeStepId: active.currentStepId } : {}) }, candidates = plan.assignments.map((assignment) => { const reasons = [], event = plan.events[assignment.eventId], applicability = plan.applicability[assignment.applicabilitySetId]; if (!event || event.eventName !== effectiveObservation.eventName || event.sourceId !== effectiveObservation.sourceId)
    reasons.push("event did not match"); if (!applicability || !conditionMatches(applicability.condition, effectiveObservation))
    reasons.push("applicability did not match"); return { ...assignment, rejectionReasons: reasons }; }), matching = stateTransition?.ambiguity ? [] : candidates.filter(({ rejectionReasons }) => rejectionReasons.length === 0).sort((left, right) => right.priority - left.priority), highest = matching[0]?.priority, ties = matching.filter(({ priority }) => priority === highest), selected = ties.length === 1 ? ties[0] : undefined, schema = selected ? plan.schemas[selected.schemaDraftId] : undefined, winner = selected && schema ? { assignmentId: selected.assignmentId, schemaId: schema.schemaId, schemaRevision: selected.schemaRevision } : undefined; return { candidates, ...(winner ? { winner } : {}), ties: ties.map(({ assignmentId }) => assignmentId), activeFlowId: effectiveObservation.flowId, activeStepId: effectiveObservation.activeStepId, effectiveProfiles: schema?.profileIds ?? [], ...(schema ? { effectiveSchemaRevision: schema.revision } : {}), issues: schema ? validationIssues(effectiveObservation.payload, schema.document) : [], provenance: schema ? Object.fromEntries(Object.entries(plan.provenance).filter(([key]) => key.startsWith(`${schema.schemaId}:`))) : {}, ...(stateTransition ? { stateTransition } : {}) }; }
//# sourceMappingURL=data-layer-specification-engine.js.map