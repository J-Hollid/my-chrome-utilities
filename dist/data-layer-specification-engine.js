import { advanceFlowInstance, conditionMatches as projectConditionMatches, startFlowInstance } from "./data-layer-specification-project.js";
import { canonicalRequirements } from "./data-layer-canonical-schema.js";
import { conditionGroupAppliesToValue } from "./data-layer-conditional-validation-rules.js";
import { assignmentContributorTargets, compileAssignmentContributorTarget } from "./data-layer-layered-schema-project.js";
export { applyCanonicalCommand, applyCanonicalSchemaDraftEdits, createCanonicalProjectEnvelope, migrateCanonicalProject } from "./data-layer-specification-model.js";
const clone = (value) => structuredClone(value);
function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value))
        freeze(child);
} return value; }
function stableJson(value) { if (Array.isArray(value))
    return `[${value.map(stableJson).join(",")}]`; if (value && typeof value === "object")
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`; return JSON.stringify(value) ?? "null"; }
function contentIdentity(prefix, value) { let hash = 2166136261; for (const character of stableJson(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
} return `${prefix}:${(hash >>> 0).toString(16).padStart(8, "0")}`; }
function index(entities) { return Object.fromEntries(entities.map((entity) => [entity.id, clone(entity)])); }
function requirementDocument(profiles) { const root = { type: "object", properties: {}, required: [] }, effective = new Map(), origins = new Map(), conflicts = []; for (const profile of profiles)
    for (const requirement of profile.canonicalSchema ? canonicalRequirements(profile.canonicalSchema) : profile.requirements) {
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
function graphDiagnostics(project) { const pages = new Set(project.collections.pages.map(({ id }) => id)), events = new Set(project.collections.events.map(({ id }) => id)), profiles = new Set(project.collections.profiles.map(({ id }) => id)), schemas = new Set((project.collections.schemaDrafts ?? []).map(({ id }) => id)), applicability = new Set(project.collections.applicabilitySets.map(({ id }) => id)), targets = new Set(assignmentContributorTargets({ project, history: { undo: [], redo: [] } }).map(({ id, kind }) => `${kind}:${id}`)), result = []; for (const flow of project.collections.flows)
    for (const step of flow.steps ?? []) {
        if (step.pageId && !pages.has(String(step.pageId)))
            result.push({ code: "dangling-reference", entityId: step.id, field: "pageId", referenceId: String(step.pageId) });
        if (step.eventId && !events.has(String(step.eventId)))
            result.push({ code: "dangling-reference", entityId: step.id, field: "eventId", referenceId: String(step.eventId) });
        for (const profileId of step.profileIds ?? [])
            if (!profiles.has(profileId))
                result.push({ code: "dangling-reference", entityId: step.id, field: "profileIds", referenceId: profileId });
    } for (const assignment of project.collections.assignments) {
    const legacyId = assignment.schemaDraftId ?? assignment.schemaId, targetId = assignment.targetId, targetKind = assignment.targetKind;
    if (legacyId ? !schemas.has(String(legacyId)) : !targetId || !targetKind || !targets.has(`${String(targetKind)}:${String(targetId)}`))
        result.push({ code: "dangling-reference", entityId: assignment.id, field: legacyId ? "schemaDraftId" : "targetId", referenceId: String(legacyId ?? targetId ?? "") });
    if (assignment.applicabilitySetId && !applicability.has(String(assignment.applicabilitySetId)))
        result.push({ code: "dangling-reference", entityId: assignment.id, field: "applicabilitySetId", referenceId: String(assignment.applicabilitySetId) });
    if (!assignment.eventId || !events.has(String(assignment.eventId)))
        result.push({ code: "dangling-reference", entityId: assignment.id, field: "eventId", referenceId: String(assignment.eventId ?? "") });
} return result; }
function layeredDocument(compiled) { const root = { type: "object", properties: {}, required: [] }; for (const [path, property] of Object.entries(compiled.properties)) {
    const parts = path.split("/").filter(Boolean);
    let node = root;
    for (let index = 0; index < parts.length; index += 1) {
        const name = parts[index], last = index === parts.length - 1;
        if (last) {
            node.properties[name] = { type: property.type ?? "string", ...(property.allowedValues ? { enum: clone(property.allowedValues) } : {}), ...(property.expectedValue !== undefined ? { const: clone(property.expectedValue) } : {}), ...(property.patterns?.length ? { pattern: property.patterns[0] } : {}), ...(property.minimum !== undefined ? { minimum: property.minimum } : {}), ...(property.maximum !== undefined ? { maximum: property.maximum } : {}), ...(property.minItems !== undefined ? { minItems: property.minItems } : {}), ...(property.maxItems !== undefined ? { maxItems: property.maxItems } : {}), ...(property.documentation ? { description: property.documentation } : {}), ...(property.examples ? { examples: clone(property.examples) } : {}), ...(property.rules?.length ? { "x-rules": clone(property.rules) } : {}), ...(property.presence === "forbidden" ? { "x-forbidden": true } : {}) };
            if (property.presence === "required" && !node.required.includes(name))
                node.required.push(name);
        }
        else {
            node.properties[name] ??= { type: "object", properties: {}, required: [] };
            node = node.properties[name];
        }
    }
} return { document: root, required: root.required }; }
export function compileSpecificationProject(envelope) { const diagnostics = graphDiagnostics(envelope.project); if (diagnostics.length)
    return { status: "blocked", diagnostics }; const schemas = {}, provenance = {}; for (const schema of (envelope.project.collections.schemaDrafts ?? [])) {
    const profiles = referencedProfiles(envelope.project, schema), compiled = requirementDocument(profiles);
    if (compiled.conflicts.length)
        return { status: "blocked", diagnostics: compiled.conflicts.map((conflict) => ({ code: "profile-conflict", entityId: schema.id, field: conflict.path, referenceId: `${conflict.origins.join(",")}: ${conflict.reason}` })) };
    const working = schema.workingDraft?.document, document = profiles.length ? compiled.document : clone(working ?? schema.document ?? compiled.document), revision = Number(schema.version ?? 1);
    schemas[schema.id] = { schemaId: schema.id, revision, document, required: compiled.required, profileIds: profiles.map(({ id }) => id) };
    profiles.forEach((profile, position) => (profile.canonicalSchema ? canonicalRequirements(profile.canonicalSchema) : profile.requirements).forEach((requirement) => { provenance[`${schema.id}:${requirement.path}`] ??= []; provenance[`${schema.id}:${requirement.path}`].push({ profileId: profile.id, profileName: profile.name, position }); }));
} const state = { project: envelope.project, history: { undo: [], redo: [] } }; for (const assignment of envelope.project.collections.assignments) {
    if (!assignment.targetId)
        continue;
    const result = compileAssignmentContributorTarget(state, assignment, { eventId: String(assignment.eventId), eventRole: "interaction" });
    if (result.compiled.status === "blocked")
        return { status: "blocked", diagnostics: result.compiled.conflicts.map((conflict) => ({ code: "contributor-conflict", entityId: assignment.id, field: conflict.path, referenceId: `${conflict.contributors.join(",")}: ${conflict.message}` })) };
    const output = layeredDocument(result.compiled), profileIds = [...new Set(result.compiled.provenance.map(({ contributorId }) => contributorId))];
    schemas[result.target.id] = { schemaId: result.target.id, revision: envelope.revision, document: output.document, required: output.required, profileIds };
    for (const [path, property] of Object.entries(result.compiled.properties))
        provenance[`${result.target.id}:${path}`] = property.origins.map(({ contributorId, contributorName }, position) => ({ profileId: contributorId, profileName: contributorName, position }));
} const assignments = envelope.project.collections.assignments.map((assignment) => { const targetId = String(assignment.targetId ?? assignment.schemaDraftId ?? assignment.schemaId), targetKind = String(assignment.targetKind ?? "Legacy Schema"); return { assignmentId: assignment.id, targetId, targetKind, ...(assignment.applicabilitySetId ? { applicabilitySetId: String(assignment.applicabilitySetId) } : {}), eventId: String(assignment.eventId), priority: Number(assignment.priority ?? 0), schemaRevision: assignment.targetId ? envelope.revision : Number(assignment.schemaRevision) }; }), planContent = { projectId: envelope.project.id, draftId: envelope.draftId, revision: envelope.revision, sourceProject: clone(envelope.project), pages: index(envelope.project.collections.pages), events: index(envelope.project.collections.events), applicability: index(envelope.project.collections.applicabilitySets), flows: index(envelope.project.collections.flows), schemas, assignments, provenance }, executableContent = { projectId: envelope.project.id, pages: planContent.pages, events: planContent.events, applicability: planContent.applicability, flows: planContent.flows, schemas, assignments, provenance }, plan = { ...planContent, contentIdentity: contentIdentity("plan", planContent), evaluatorContentIdentity: contentIdentity("evaluator", executableContent) }; return { status: "compiled", plan: freeze(plan), diagnostics: [] }; }
function conditionMatches(condition, observation) { return condition ? projectConditionMatches(condition, observation) : true; }
function observedType(value) { return Array.isArray(value) ? "array" : value === null ? "null" : typeof value; }
function observedText(value) { if (value === undefined)
    return "absent"; if (typeof value === "string")
    return value; try {
    return JSON.stringify(value) ?? String(value);
}
catch {
    return String(value);
} }
function ruleFailure(rule, value) { const operator = String(rule.operator ?? "").replaceAll("_", "-").replaceAll(" ", "-").toLowerCase(), parameters = String(rule.parameters ?? ""); if (operator === "required")
    return value === undefined ? { code: "required", expected: "present", message: "Required value" } : undefined; if (value === undefined)
    return undefined; if (operator === "exact-value")
    return String(value) === parameters ? undefined : { code: "exact-value", expected: parameters, message: "Value is not exact" }; if (operator === "allowed-values") {
    const values = rule.allowedValues ?? parameters.split(",").map((item) => item.trim()).filter(Boolean);
    return values.some((candidate) => Object.is(candidate, value) || String(candidate) === String(value)) ? undefined : { code: "enum", expected: values.map(String).join(" or "), message: "Value is not allowed" };
} if (operator === "regular-expression") {
    try {
        return new RegExp(parameters).test(String(value)) ? undefined : { code: "pattern", expected: parameters, message: "Value does not match pattern" };
    }
    catch {
        return { code: "pattern", expected: `valid pattern ${parameters}`, message: "Invalid regular expression" };
    }
} if (operator === "text-length") {
    const [minimumText, maximumText] = parameters.split(","), minimum = Number(minimumText), maximum = maximumText === "" || maximumText === undefined ? minimum : Number(maximumText), length = typeof value === "string" ? value.length : Number.NaN;
    return Number.isFinite(length) && length >= minimum && length <= maximum ? undefined : { code: "text-length", expected: `${minimum} through ${maximum} characters`, message: "Text length mismatch" };
} if (operator === "digits-only")
    return typeof value === "string" && /^\d+$/.test(value) ? undefined : { code: "digits-only", expected: "digits only", message: "Value contains non-digits" }; if (operator === "numeric-range") {
    const [minimumText, maximumText] = parameters.split(","), minimum = Number(minimumText), maximum = Number(maximumText);
    return typeof value === "number" && value >= minimum && value <= maximum ? undefined : { code: "numeric-range", expected: `${minimum} through ${maximum}`, message: "Value is outside range" };
} if (operator === "item-count") {
    const [minimumText, maximumText] = parameters.split(","), minimum = Number(minimumText), maximum = maximumText === undefined ? minimum : Number(maximumText), length = Array.isArray(value) ? value.length : Number.NaN;
    return Number.isFinite(length) && length >= minimum && length <= maximum ? undefined : { code: "item-count", expected: `${minimum} through ${maximum} items`, message: "Item count mismatch" };
} return undefined; }
function validationIssueDetails(value, document, plan, schemaId, path = "", root = value) { const result = [], add = (issue) => { const provenance = plan.provenance[`${schemaId}:${issue.path}`] ?? [], origin = provenance.at(-1); result.push({ ...issue, provenance, field: origin ? `profiles/${origin.profileId}/requirements${issue.path}` : `schemas/${schemaId}${issue.path}` }); }, type = observedType(value); if (document.type && type !== document.type) {
    add({ path: path || "/", code: "type", severity: "error", message: "Type mismatch", expected: String(document.type), actual: type });
    return result;
} if (document.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    const record = value;
    for (const required of document.required ?? [])
        if (!(required in record))
            add({ path: `${path}/${required}`, code: "required", severity: "error", message: "Required value", expected: "present", actual: "absent" });
    for (const [property, child] of Object.entries(document.properties ?? {})) {
        const childPath = `${path}/${property}`, nested = record[property];
        if (child["x-forbidden"] && nested !== undefined)
            add({ path: childPath, code: "forbidden", severity: "error", message: "Forbidden property", expected: "absent", actual: observedText(nested) });
        if (nested === undefined)
            continue;
        if (child.enum && !child.enum.some((candidate) => Object.is(candidate, nested)))
            add({ path: childPath, code: "enum", severity: "error", message: "Value is not allowed", expected: child.enum.map(String).join(" or "), actual: observedText(nested) });
        result.push(...validationIssueDetails(nested, child, plan, schemaId, childPath, root));
        for (const storedRule of child["x-rules"] ?? []) {
            const rule = storedRule;
            if (rule.enabled === false)
                continue;
            if (rule.conditionGroup && !conditionGroupAppliesToValue(root, rule.conditionGroup))
                continue;
            const failure = ruleFailure(rule, nested);
            if (failure)
                add({ path: childPath, code: failure.code, severity: String(rule.severity ?? "error"), message: String(rule.message ?? failure.message), expected: failure.expected, actual: observedText(nested) });
        }
    }
} if (document.type === "array" && Array.isArray(value) && document.items)
    value.forEach((item, index) => result.push(...validationIssueDetails(item, document.items, plan, schemaId, `${path}/${index}`, root))); return result; }
function flowTransition(plan, observation, prior) { const sessionId = String(observation.sessionId ?? ""), correlationKey = typeof observation.correlationKey === "string" ? observation.correlationKey : undefined, same = (instance) => instance.sessionId === sessionId && (correlationKey === undefined || instance.correlationKey === correlationKey), session = prior.filter((instance) => same(instance) && instance.status === "active"), others = prior.filter((instance) => !same(instance)), eventId = String(observation.eventId ?? ""), pageId = String(observation.pageId ?? ""); if (!eventId && !pageId)
    return { instances: [...prior], ...(session.length === 1 ? { active: session[0] } : {}) }; const matches = (step) => Boolean(step.eventId || step.pageId) && (!step.eventId || step.eventId === eventId) && (!step.pageId || step.pageId === pageId), existing = new Set(session.map(({ flowId }) => flowId)), started = Object.values(plan.flows).filter((flow) => !existing.has(flow.id) && matches((flow.steps ?? [])[0] ?? { id: "", name: "" }) && (!flow.entryCondition || projectConditionMatches(flow.entryCondition, observation))).map((flow) => startFlowInstance(plan.sourceProject, flow.id, sessionId, { ...(correlationKey ? { correlationKey } : {}), ...(typeof observation.observedAt === "string" ? { startedAt: observation.observedAt } : {}) })), sources = [...session, ...started], advanced = sources.map((instance) => advanceFlowInstance(plan.sourceProject, instance, observation)), changed = advanced.filter((instance, index) => instance.history.length > (sources[index]?.history.length ?? 0)); if (changed.length > 1)
    return { instances: [...prior], ambiguity: { instanceIds: changed.map(({ id }) => id), reason: "Multiple flow instances are equally eligible; no instance was advanced." } }; return { instances: [...others, ...advanced.filter((instance) => instance.history.length > 0)], ...(changed[0] ? { active: changed[0] } : {}) }; }
export function evaluateSpecificationObservation(plan, observation, priorInstances) { const transition = priorInstances ? flowTransition(plan, observation, priorInstances) : undefined, stateTransition = transition && (transition.instances.length > 0 || transition.active !== undefined || transition.ambiguity !== undefined) ? transition : undefined, active = stateTransition?.active, effectiveObservation = { ...observation, ...(active ? { flowId: active.flowId, activeStepId: active.currentStepId } : {}) }, candidates = plan.assignments.map((assignment) => { const reasons = [], event = plan.events[assignment.eventId], applicability = assignment.applicabilitySetId ? plan.applicability[assignment.applicabilitySetId] : undefined; if (!event || event.eventName !== effectiveObservation.eventName || event.sourceId !== effectiveObservation.sourceId)
    reasons.push("event did not match"); if (assignment.applicabilitySetId && (!applicability || !conditionMatches(applicability.condition, effectiveObservation)))
    reasons.push("applicability did not match"); return { ...assignment, rejectionReasons: reasons }; }), matching = stateTransition?.ambiguity ? [] : candidates.filter(({ rejectionReasons }) => rejectionReasons.length === 0).sort((left, right) => right.priority - left.priority), highest = matching[0]?.priority, ties = matching.filter(({ priority }) => priority === highest), selected = ties.length === 1 ? ties[0] : undefined, schema = selected ? plan.schemas[selected.targetId] : undefined, winner = selected && schema ? { assignmentId: selected.assignmentId, schemaId: schema.schemaId, schemaRevision: selected.schemaRevision } : undefined, issueDetails = schema ? validationIssueDetails(effectiveObservation.payload, schema.document, plan, schema.schemaId) : [], issues = issueDetails.map(({ path, code, message }) => `${path}: ${code === "required" ? "required" : message}`), resultContent = { planContentIdentity: plan.contentIdentity, ...(plan.releaseId ? { releaseIdentity: plan.releaseId } : {}), candidates, ...(winner ? { winner } : {}), ties: ties.map(({ assignmentId }) => assignmentId), activeFlowId: effectiveObservation.flowId, activeStepId: effectiveObservation.activeStepId, effectiveProfiles: schema?.profileIds ?? [], ...(schema ? { effectiveSchemaRevision: schema.revision } : {}), issues, issueDetails, provenance: schema ? Object.fromEntries(Object.entries(plan.provenance).filter(([key]) => key.startsWith(`${schema.schemaId}:`))) : {}, ...(stateTransition ? { stateTransition } : {}) }; const evaluatorResultContent = { ...resultContent, planContentIdentity: plan.evaluatorContentIdentity }; return { resultIdentity: contentIdentity("result", evaluatorResultContent), ...resultContent }; }
//# sourceMappingURL=data-layer-specification-engine.js.map