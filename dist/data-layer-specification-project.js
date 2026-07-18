const clone = (value) => structuredClone(value);
const now = () => new Date().toISOString();
export function createSpecificationProject(input) {
    const project = {
        id: input.id("project"), name: input.name, description: input.description ?? "", site: input.site,
        environments: [...(input.environments ?? ["Production"])],
        namingConventions: { property: "snake_case", event: "snake_case" },
        publicationPolicy: { warningsBlock: false, fixturesRequired: true },
        collections: { profiles: [], pages: [], pageGroups: [], events: [], applicabilitySets: [], flows: [], fixtures: [], schemaDrafts: [], assignments: [] },
        releases: [],
    };
    return { project, draft: { id: input.id("draft"), status: "Saved", updatedAt: now() }, history: { undo: [], redo: [] } };
}
export function transactProject(state, label, update) {
    if (!state.draft)
        throw new Error("Create or restore a project draft before editing.");
    const before = clone(state.project);
    const project = update(clone(state.project));
    if (project.id !== state.project.id)
        throw new Error("A project transaction cannot replace project identity.");
    return { project, draft: { ...state.draft, status: "Saved", updatedAt: now() }, history: { undo: [...state.history.undo, { label, project: before }], redo: [] } };
}
export function undoProjectTransaction(state) {
    const entry = state.history.undo.at(-1);
    if (!entry)
        return state;
    return { ...state, project: clone(entry.project), history: { undo: state.history.undo.slice(0, -1), redo: [...state.history.redo, { label: entry.label, project: clone(state.project) }] } };
}
export function redoProjectTransaction(state) {
    const entry = state.history.redo.at(-1);
    if (!entry)
        return state;
    return { ...state, project: clone(entry.project), history: { undo: [...state.history.undo, { label: entry.label, project: clone(state.project) }], redo: state.history.redo.slice(0, -1) } };
}
export function addProjectEntity(state, kind, entity, id) {
    return transactProject(state, `Add ${entity.name}`, (project) => ({ ...project, collections: { ...project.collections, [kind]: [...project.collections[kind], { ...clone(entity), id: id(kind.slice(0, -1) || kind) }] } }));
}
export function composeRequirementProfiles(profiles) {
    const requirements = new Map();
    const conflicts = [];
    for (const profile of profiles)
        for (const requirement of profile.requirements) {
            const prior = requirements.get(requirement.path);
            if (prior && prior.type && requirement.type && prior.type !== requirement.type)
                conflicts.push({ path: requirement.path, origins: [prior.origin ?? "unknown", profile.id], reason: `Incompatible types ${prior.type} and ${requirement.type}` });
            if (prior?.required && requirement.forbidden || prior?.forbidden && requirement.required)
                conflicts.push({ path: requirement.path, origins: [prior.origin ?? "unknown", profile.id], reason: "Required and forbidden conflict" });
            const allowedValues = prior?.allowedValues && requirement.allowedValues ? prior.allowedValues.filter((value) => requirement.allowedValues.some((candidate) => Object.is(candidate, value))) : requirement.allowedValues ?? prior?.allowedValues;
            if (prior?.allowedValues && requirement.allowedValues && !allowedValues?.length)
                conflicts.push({ path: requirement.path, origins: [prior.origin ?? "unknown", profile.id], reason: "Allowed-value intersection is empty" });
            requirements.set(requirement.path, { ...prior, ...clone(requirement), ...(allowedValues ? { allowedValues } : {}), origin: profile.id });
        }
    return { requirements: [...requirements.values()], conflicts };
}
function fieldValue(context, field) {
    if (field.startsWith("payload."))
        return field.slice(8).split(".").reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, context.payload);
    return context[field];
}
function predicateMatches(predicate, context) {
    const actual = fieldValue(context, predicate.field), expected = predicate.value;
    if (predicate.operator === "exists")
        return actual !== undefined;
    if (predicate.operator === "equals")
        return String(actual) === String(expected);
    if (predicate.operator === "contains")
        return String(actual).includes(String(expected));
    if (predicate.operator === "glob")
        return new RegExp(`^${String(expected).replace(/[.+^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*")}$`).test(String(actual));
    if (predicate.operator === "regex") {
        try {
            return new RegExp(String(expected)).test(String(actual));
        }
        catch {
            return false;
        }
    }
    return false;
}
export function conditionMatches(condition, context) {
    if (condition.kind === "predicate")
        return predicateMatches(condition, context);
    if (condition.kind === "all")
        return condition.conditions.every((item) => conditionMatches(item, context));
    if (condition.kind === "any")
        return condition.conditions.some((item) => conditionMatches(item, context));
    return !condition.conditions.some((item) => conditionMatches(item, context));
}
function lifecycleAssignments(project) {
    if (project.collections.assignments.length)
        return project.collections.assignments;
    const embedded = project.collections.schemaDrafts.flatMap((entry) => {
        const schema = entry;
        return [...(schema.workingDraft?.assignments ?? schema.assignments ?? [])].map((assignment) => ({ ...clone(assignment), id: assignment.id ?? `${schema.id}:${assignment.sourceId}:${assignment.eventName}:${assignment.target}`, name: assignment.name ?? assignment.eventName, schemaId: schema.id, ...(assignment.schemaVersion !== undefined ? { schemaRevision: assignment.schemaVersion } : {}) }));
    });
    return embedded.length ? embedded : project.collections.assignments;
}
export function resolveApplicability(project, context) {
    const candidates = [...project.collections.applicabilitySets, ...lifecycleAssignments(project)].map((entry) => { const condition = entry.condition; const matched = condition ? conditionMatches(condition, context) : false; return { id: entry.id, name: entry.name, matched, priority: Number(entry.priority ?? 0), evidence: matched ? "All configured predicates matched" : "At least one predicate did not match" }; });
    const matched = candidates.filter(({ matched }) => matched).sort((a, b) => b.priority - a.priority), top = matched[0]?.priority, ties = matched.filter(({ priority }) => priority === top).map(({ id, name }) => ({ id, name }));
    return { candidates, ...(ties.length === 1 ? { winner: ties[0] } : {}), ties };
}
const valueAtPath = (payload, path) => path.split("/").filter(Boolean).reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, payload);
export function runProjectFixture(project, fixture) {
    const profiles = (fixture.profileIds ?? []).map((id) => project.collections.profiles.find((profile) => profile.id === id)).filter((profile) => Boolean(profile));
    const composed = composeRequirementProfiles(profiles), payload = fixture.payload, issues = [...composed.conflicts.map(({ reason, path }) => `${path}: ${reason}`)];
    for (const requirement of composed.requirements) {
        const value = valueAtPath(payload, requirement.path);
        if (requirement.required && value === undefined)
            issues.push(`${requirement.path}: Required value`);
        if (requirement.forbidden && value !== undefined)
            issues.push(`${requirement.path}: Forbidden value`);
        if (value !== undefined && requirement.allowedValues && !requirement.allowedValues.some((candidate) => Object.is(candidate, value)))
            issues.push(`${requirement.path}: Value is not allowed`);
    }
    const applicability = resolveApplicability(project, fixture.context ?? {});
    if (applicability.ties.length > 1)
        issues.push("Applicability is ambiguous");
    return { status: issues.length ? "fail" : "pass", issues, applicability };
}
function conditionConstraints(condition, negated = false) { const equals = new Map(), notEquals = new Map(); if (!condition)
    return { equals, notEquals }; if (condition.kind === "predicate" && condition.operator === "equals") {
    const value = String(condition.value);
    if (negated) {
        const values = notEquals.get(condition.field) ?? new Set();
        values.add(value);
        notEquals.set(condition.field, values);
    }
    else
        equals.set(condition.field, value);
    return { equals, notEquals };
} if (condition.kind === "all" || condition.kind === "not")
    for (const item of condition.conditions) {
        const child = conditionConstraints(item, condition.kind === "not" ? !negated : negated);
        for (const [field, value] of child.equals)
            equals.set(field, value);
        for (const [field, values] of child.notEquals) {
            const current = notEquals.get(field) ?? new Set();
            for (const value of values)
                current.add(value);
            notEquals.set(field, current);
        }
    } return { equals, notEquals }; }
function conditionsProvablyExclusive(left, right) { const a = conditionConstraints(left), b = conditionConstraints(right); for (const [field, value] of a.equals) {
    if (b.equals.has(field) && b.equals.get(field) !== value)
        return true;
    if (b.notEquals.get(field)?.has(value))
        return true;
} for (const [field, value] of b.equals)
    if (a.notEquals.get(field)?.has(value))
        return true; return false; }
export function projectPreflight(project) {
    const blockers = [];
    for (const conflict of searchProjectAssignments(project, "").conflicts)
        blockers.push({ kind: "assignment-ambiguity", message: conflict.message, ids: conflict.ids });
    const sets = project.collections.applicabilitySets;
    for (let left = 0; left < sets.length; left += 1)
        for (let right = left + 1; right < sets.length; right += 1) {
            const a = sets[left], b = sets[right];
            if (Number(a.priority ?? 0) !== Number(b.priority ?? 0))
                continue;
            if (!conditionsProvablyExclusive(a.condition, b.condition))
                blockers.push({ kind: "ambiguous-applicability", message: `${a.name} and ${b.name} can tie`, ids: [a.id, b.id] });
        }
    for (const fixture of project.collections.fixtures) {
        const result = runProjectFixture(project, fixture), expected = fixture.expect ?? "pass";
        if (result.status !== expected)
            blockers.push({ kind: "fixture-outcome", message: `${fixture.name} was ${result.status}, expected ${expected}`, ids: [fixture.id] });
    }
    return { blockers, warnings: [] };
}
const supportedTypes = new Set(["string", "number", "boolean", "object", "array"]);
export function commitBulkProperties(state, profileId, properties) { const errors = properties.flatMap((property, index) => !property.path.startsWith("/") ? [{ index, path: property.path, message: "Use a canonical /path" }] : !supportedTypes.has(property.type) ? [{ index, path: property.path, message: "Choose a supported type" }] : []); if (errors.length)
    return { state, errors }; return { errors: [], state: transactProject(state, `Import ${properties.length} properties`, (project) => ({ ...project, collections: { ...project.collections, profiles: project.collections.profiles.map((profile) => profile.id === profileId ? { ...profile, requirements: [...profile.requirements, ...properties.map((property) => ({ ...property }))] } : profile) } })) }; }
export function applyBulkRequirement(state, profileId, paths, update) { return transactProject(state, `Update ${paths.length} requirements`, (project) => ({ ...project, collections: { ...project.collections, profiles: project.collections.profiles.map((profile) => profile.id === profileId ? { ...profile, requirements: profile.requirements.map((requirement) => paths.includes(requirement.path) ? { ...requirement, ...update } : requirement) } : profile) } })); }
export function publishProjectRelease(state, options) { if (!state.draft)
    throw new Error("There is no project draft to publish."); const preflight = projectPreflight(state.project); if (preflight.blockers.length)
    throw new Error(`Project preflight has ${preflight.blockers.length} blockers.`); const publishedSchemas = state.project.collections.schemaDrafts.map((entry) => { const schema = entry; return (schema.workingDraft ? publishSchemaWorkingDraft(schema) : schema); }), collections = { ...state.project.collections, schemaDrafts: publishedSchemas }; const revision = state.project.releases.length + 1, release = { id: options.id("release"), name: `Release ${revision}`, revision, createdAt: now(), snapshot: clone(collections) }; const project = { ...state.project, collections, releases: [...state.project.releases, release], currentRelease: release.id }; options.write(project); return { project, history: { undo: [], redo: [] } }; }
export function exportSpecificationProject(project) { return JSON.stringify({ format: "my-chrome-utilities.specification-project", version: 1, project }); }
export function importSpecificationProject(serialized, options) { const parsed = JSON.parse(serialized); if (parsed.format !== "my-chrome-utilities.specification-project" || parsed.version !== 1 || !parsed.project)
    throw new Error("Unsupported Specification Project format."); const collisions = options.existingProjects.some(({ id }) => id === parsed.project.id) ? [parsed.project.id] : []; return { project: clone(parsed.project), collisions }; }
export function migrateLegacyLibrary(legacy, options) { const state = createSpecificationProject({ name: "Legacy Schema Library", site: "compatibility.local", id: options.id }); const issues = []; const events = (legacy.schemas ?? []).flatMap((schema) => (schema.assignments ?? []).flatMap((assignment) => { if (!assignment.id || !assignment.eventName)
    return issues.push({ sourceId: String(assignment.id ?? schema.id ?? "unknown"), message: "Assignment identity or event name is unresolved" }), []; return [{ id: String(assignment.id), name: String(assignment.eventName), eventName: assignment.eventName, sourceId: assignment.sourceId, target: assignment.target, legacySchemaId: schema.id }]; })); const profiles = (legacy.schemas ?? []).map((schema) => ({ id: String(schema.id), name: String(schema.name ?? schema.id), requirements: [], legacyVersion: schema.version })); return { project: { ...state.project, collections: { ...state.project.collections, profiles, events }, compatibility: { legacySnapshot: JSON.stringify(legacy) } }, issues }; }
export function createProjectSchemaDraft(state, input, _id) {
    return transactProject(state, `Create ${input.name} schema draft`, (project) => {
        if (project.collections.schemaDrafts.some(({ id }) => id === input.schemaId))
            throw new Error(`Schema ${input.schemaId} already exists.`);
        const published = { ...createSchema(input.name, input.baseRevision, { type: "object", properties: {} }), id: input.schemaId, published: true, documentation: { description: input.description } };
        const schema = createSchemaWorkingDraft(published);
        return { ...project, collections: { ...project.collections, schemaDrafts: [...project.collections.schemaDrafts, schema] } };
    });
}
function canonicalAssignmentCondition(project, condition) { if (!condition)
    return undefined; if (condition.kind !== "predicate")
    return { ...condition, conditions: condition.conditions.map((child) => canonicalAssignmentCondition(project, child)) }; if (condition.field !== "flowId" || typeof condition.value !== "string")
    return clone(condition); const normalized = condition.value.trim().toLowerCase(), flow = project.collections.flows.find((candidate) => candidate.id === condition.value || candidate.name.trim().toLowerCase() === normalized); return { ...condition, ...(flow ? { value: flow.id } : {}) }; }
export function saveProjectAssignment(state, input, id) {
    if (!input.schemaId.trim() || !input.eventName.trim() || !input.sourceId.trim() || !input.target.trim())
        throw new Error("Assignment routing fields must not be blank.");
    if (input.versionPolicy === "pinned" && !Number.isInteger(input.schemaRevision))
        throw new Error("Pinned assignments require a real schema revision.");
    const schemaEntry = state.project.collections.schemaDrafts.find(({ id: schemaId }) => schemaId === input.schemaId);
    if (!schemaEntry)
        throw new Error(`Schema ${input.schemaId} does not have a project working draft.`);
    const existing = input.id ? state.project.collections.assignments.find((assignment) => assignment.id === input.id) : undefined, identity = existing?.id ?? id("assignment"), generatedApplicabilityId = input.applicabilitySetId ?? String(existing?.applicabilitySetId ?? id("applicability")), resolvedEventId = input.eventId ?? String(existing?.eventId ?? state.project.collections.events.find((event) => event.eventName === input.eventName && event.sourceId === input.sourceId)?.id ?? "");
    const { condition: rawCondition, ...compatible } = clone(input), condition = canonicalAssignmentCondition(state.project, rawCondition), saved = { ...existing, ...compatible, id: identity, schemaDraftId: input.schemaId, schemaId: input.schemaId, eventId: resolvedEventId, applicabilitySetId: generatedApplicabilityId, ...(input.versionPolicy === "pinned" ? { schemaRevision: input.schemaRevision } : { schemaRevision: Number(schemaEntry.version ?? 1) }) };
    delete saved.condition;
    return transactProject(state, `${existing ? "Update" : "Create"} assignment ${input.name}`, (project) => { const applicabilitySets = condition ? (project.collections.applicabilitySets.some(({ id: applicabilityId }) => applicabilityId === generatedApplicabilityId) ? project.collections.applicabilitySets.map((entry) => entry.id === generatedApplicabilityId ? { ...entry, condition: clone(condition) } : entry) : [...project.collections.applicabilitySets, { id: generatedApplicabilityId, name: `${input.name} applicability`, priority: input.priority, condition: clone(condition) }]) : project.collections.applicabilitySets; if (!applicabilitySets.some(({ id: applicabilityId }) => applicabilityId === generatedApplicabilityId))
        throw new Error(`Applicability Set ${generatedApplicabilityId} does not exist.`); return { ...project, collections: { ...project.collections, applicabilitySets, assignments: existing ? project.collections.assignments.map((assignment) => assignment.id === identity ? saved : assignment) : [...project.collections.assignments, saved] } }; });
}
export function searchProjectAssignments(project, query) { const normalized = query.trim().toLowerCase(), rows = lifecycleAssignments(project).filter((assignment) => (assignment.schemaDraftId ?? assignment.schemaId) && assignment.eventName && assignment.sourceId && assignment.target && (!normalized || JSON.stringify(assignment).toLowerCase().includes(normalized))), conflicts = []; for (let left = 0; left < rows.length; left += 1)
    for (let right = left + 1; right < rows.length; right += 1) {
        const a = rows[left], b = rows[right];
        if (a.eventId === b.eventId && Number(a.priority) === Number(b.priority)) {
            const applicability = (assignment) => project.collections.applicabilitySets.find(({ id }) => id === assignment.applicabilitySetId)?.condition;
            if (!conditionsProvablyExclusive(applicability(a), applicability(b)))
                conflicts.push({ ids: [a.id, b.id], message: `${a.name} and ${b.name} are equal-priority candidates` });
        }
    } return { rows, count: rows.length, empty: rows.length === 0, conflicts }; }
export function addFlowStep(state, flowId, input, id) { if (input.minimum < 0 || input.maximum < input.minimum)
    throw new Error("Flow occurrence bounds are invalid."); const normalized = { ...clone(input), ...(input.pageId ? { pageId: input.pageId } : {}), ...(input.eventId ? { eventId: input.eventId } : {}) }; if (!input.pageId)
    delete normalized.pageId; if (!input.eventId)
    delete normalized.eventId; return transactProject(state, `Add ${input.name} flow step`, (project) => ({ ...project, collections: { ...project.collections, flows: project.collections.flows.map((flow) => flow.id === flowId ? { ...flow, steps: [...(flow.steps ?? []), { ...normalized, id: id("flow-step") }] } : flow) } })); }
export function reorderFlowStep(state, flowId, from, to) { return transactProject(state, "Reorder flow step", (project) => ({ ...project, collections: { ...project.collections, flows: project.collections.flows.map((flow) => { if (flow.id !== flowId)
            return flow; const steps = [...(flow.steps ?? [])], moved = steps.splice(from, 1)[0]; if (!moved)
            return flow; steps.splice(Math.max(0, Math.min(to, steps.length)), 0, moved); return { ...flow, steps }; }) } })); }
export function exportDocumentation(project, options) {
    const header = ["Path", ...options.fields.filter((field) => field !== "path").map((field) => field.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase()))];
    const rows = project.collections.profiles.flatMap((profile) => profile.requirements.map((requirement) => {
        const usage = Object.entries(project.collections).flatMap(([kind, entities]) => entities.filter((entity) => JSON.stringify(entity).includes(profile.id)).map((entity) => `${kind}/${entity.name}`));
        return options.fields.map((field) => field === "path" ? requirement.path : field === "type" ? (requirement.type ?? "") : field === "provenance" ? `${profile.name} (${profile.id})` : field === "whereUsed" ? usage.join(", ") : String(requirement[field] ?? ""));
    }));
    const lossyCategories = ['applicability', 'flows', 'fixtures'].filter((category) => !options.include[category]);
    if (!options.include.releases)
        lossyCategories.push("releases");
    const warnings = lossyCategories.length ? `\n\nLossy documentation export: omitted ${lossyCategories.join(", ")}. Use Full-fidelity Specification Project for complete interchange.` : "";
    const metadata = options.include.releases && project.currentRelease ? `\n\nRelease: ${project.currentRelease}; revision ${project.releases.length}` : "";
    const table = [header, ...rows].map((row) => `| ${row.join(" | ")} |`).join("\n");
    const preview = `${table}${metadata}${warnings}`;
    return { preview, clipboard: preview, lossyCategories };
}
export function startFlowInstance(project, flowId, sessionId, options) { const flow = project.collections.flows.find(({ id }) => id === flowId); if (!flow)
    throw new Error(`Unknown flow ${flowId}`); return { id: `${flowId}:${sessionId}:${options?.correlationKey ?? "tab"}`, flowId, selector: flow.name.toLowerCase(), sessionId, ...(options?.correlationKey ? { correlationKey: options.correlationKey } : {}), ...(options?.startedAt ? { startedAt: options.startedAt, lastObservedAt: options.startedAt } : {}), occurrences: {}, history: [], status: "active" }; }
export function advanceFlowInstance(project, instance, input) {
    if (instance.status !== "active")
        return instance;
    const flow = project.collections.flows.find(({ id }) => id === instance.flowId);
    if (!flow)
        throw new Error(`Unknown flow ${instance.flowId}`);
    const steps = flow.steps ?? [], observedAt = typeof input.observedAt === "string" ? input.observedAt : undefined, lastAt = instance.lastObservedAt ?? instance.startedAt, timeout = Number(flow.timeoutMinutes ?? 0);
    if (timeout > 0 && observedAt && lastAt && Date.parse(observedAt) - Date.parse(lastAt) > timeout * 60_000)
        return { ...instance, lastObservedAt: observedAt, status: "failed", failureReason: `Flow timed out after ${timeout} minutes at ${instance.currentStepId ?? "entry"}.` };
    const matches = (candidate) => Boolean(candidate.eventId || candidate.pageId) && (!candidate.eventId || candidate.eventId === input.eventId) && (!candidate.pageId || candidate.pageId === input.pageId), partiallyMatches = (candidate) => Boolean(candidate.eventId && candidate.pageId) && (input.eventId === undefined || input.pageId === undefined) && ((input.eventId !== undefined && candidate.eventId === input.eventId) || (input.pageId !== undefined && candidate.pageId === input.pageId)) && (input.eventId === undefined || candidate.eventId === input.eventId) && (input.pageId === undefined || candidate.pageId === input.pageId), currentIndex = instance.currentStepId ? steps.findIndex(({ id }) => id === instance.currentStepId) : -1, current = currentIndex >= 0 ? steps[currentIndex] : undefined, nextObservable = current ? steps.slice(currentIndex + 1).find((candidate) => Boolean(candidate.eventId || candidate.pageId)) : undefined;
    if (current && nextObservable && partiallyMatches(nextObservable))
        return observedAt ? { ...instance, lastObservedAt: observedAt } : instance;
    let step = current && matches(current) ? current : undefined, transitionId;
    if (!step && current) {
        const count = instance.occurrences[current.id] ?? 0, minimum = Number(current.minimum ?? (current.optional ? 0 : 1));
        if (count < minimum)
            return { ...instance, status: "failed", failureReason: `Cannot leave ${current.name}; minimum ${minimum}, observed ${count}.` };
        const transitions = current.transitions ?? [];
        if (transitions.length) {
            const candidates = transitions.filter((transition) => conditionMatches(transition.condition ?? { kind: "all", conditions: [] }, input)).map((transition) => ({ transition, step: steps.find(({ id }) => id === transition.toStepId) })).filter((candidate) => Boolean(candidate.step)).filter(({ step: candidate }) => matches(candidate));
            if (candidates.length !== 1)
                return { ...instance, status: "failed", failureReason: candidates.length ? `Ambiguous transition from ${current.name}.` : `No valid transition from ${current.name}; observed ${String(input.eventId ?? input.pageId ?? "unknown")}.` };
            step = candidates[0].step;
            transitionId = candidates[0].transition.id;
        }
        else
            for (let index = currentIndex + 1; index < steps.length; index += 1) {
                const candidate = steps[index];
                if (matches(candidate)) {
                    step = candidate;
                    break;
                }
                if (!candidate.optional)
                    return { ...instance, status: "failed", failureReason: `Invalid transition: expected ${candidate.name}; observed ${String(input.eventId ?? input.pageId ?? "unknown")}.` };
            }
    }
    if (!step && !current) {
        for (const candidate of steps) {
            if (matches(candidate)) {
                step = candidate;
                break;
            }
            if (!candidate.optional)
                break;
        }
    }
    if (!step)
        return observedAt ? { ...instance, lastObservedAt: observedAt } : instance;
    const count = (instance.occurrences[step.id] ?? 0) + 1, maximum = Number(step.maximum ?? 1), occurrences = { ...instance.occurrences, [step.id]: count }, history = [...instance.history, { stepId: step.id, ...(input.eventId ? { eventId: String(input.eventId) } : {}), ...(input.pageId ? { pageId: String(input.pageId) } : {}), ...(observedAt ? { observedAt } : {}), ...(transitionId ? { transitionId } : {}) }];
    if (count > maximum)
        return { ...instance, currentStepId: step.id, occurrences, history, ...(observedAt ? { lastObservedAt: observedAt } : {}), status: "failed", failureReason: `${step.name} exceeded maximum ${maximum} with ${count} occurrences.` };
    const last = steps.at(-1)?.id === step.id, minimum = Number(step.minimum ?? (step.optional ? 0 : 1)), exit = flow.exitCondition ? conditionMatches(flow.exitCondition, input) : false;
    return { ...instance, currentStepId: step.id, occurrences, history, ...(observedAt ? { lastObservedAt: observedAt } : {}), status: (last && count >= minimum) || exit ? "complete" : "active" };
}
export function buildReleaseReview(previous, next) { const sections = []; for (const kind of Object.keys(next.collections)) {
    const beforeEntities = previous.collections[kind], afterEntities = next.collections[kind];
    const before = new Map(beforeEntities.map((entity) => [entity.id, entity])), after = new Map(afterEntities.map((entity) => [entity.id, entity]));
    for (const [id, entity] of after) {
        const prior = before.get(id);
        if (!prior)
            sections.push({ kind: "added", entityKind: kind, id, after: entity.name });
        else if (prior.name !== entity.name)
            sections.push({ kind: "renamed", entityKind: kind, id, before: prior.name, after: entity.name });
        else if (JSON.stringify(prior) !== JSON.stringify(entity))
            sections.push({ kind: "changed", entityKind: kind, id, before: prior.name, after: entity.name });
    }
    for (const [id, entity] of before)
        if (!after.has(id))
            sections.push({ kind: "removed", entityKind: kind, id, before: entity.name });
} const changedIds = new Set(sections.map(({ id }) => id)); const affectedConsumers = Object.values(next.collections).flatMap((entities) => entities.filter((entity) => changedIds.has(entity.id) || [...changedIds].some((id) => JSON.stringify(entity).includes(id))).map(({ id, name }) => ({ id, name }))); return { sections, affectedConsumers, breaking: sections.some(({ kind }) => kind === "removed"), preflight: projectPreflight(next) }; }
export function restoreReleaseAsDraft(state, releaseId, id) { const release = state.project.releases.find((candidate) => candidate.id === releaseId); if (!release)
    throw new Error(`Unknown release ${releaseId}`); return { project: { ...state.project, collections: clone(release.snapshot) }, draft: { id: id("draft"), status: "Saved", updatedAt: now(), restoredFromRelease: releaseId }, history: { undo: [], redo: [] } }; }
export function exportSpecificationProjectState(state) { return JSON.stringify({ format: "my-chrome-utilities.specification-project-state", version: 2, state, migrations: [] }); }
export function stageProjectImport(serialized, current, options) {
    const parsed = JSON.parse(serialized);
    if (parsed.format !== "my-chrome-utilities.specification-project-state" || (parsed.version !== 1 && parsed.version !== 2) || !parsed.state)
        throw new Error("Unsupported Specification Project format; supported versions are 1 and 2.");
    const sourceVersion = parsed.version, migrations = sourceVersion === 1 ? ["project-state-v1-to-v2"] : [...(parsed.migrations ?? [])], imported = clone(parsed.state);
    if (options?.projectId)
        imported.project.id = options.projectId;
    const blockers = imported.project.id === current.project.id ? [{ kind: "project-id-collision", message: "Choose replace or remap for the conflicting project identity.", ids: [imported.project.id] }] : [];
    return { state: imported, diff: buildReleaseReview(current.project, imported.project), blockers, source: serialized, sourceVersion, targetVersion: 2, migrations };
}
export function commitStagedProjectImport(current, staged, options) { if (staged.blockers.length)
    throw new Error(`Import has ${staged.blockers.length} unresolved blockers.`); const next = clone(staged.state); options.write(next); return next; }
export function buildCoverageMatrix(project, options) { const all = Object.entries(project.collections).flatMap(([kind, entities]) => entities.map((entity) => ({ id: entity.id, kind, name: entity.name, state: (kind === "profiles" && entity.requirements.length === 0 ? "issue" : "covered"), issueLink: `?kind=${encodeURIComponent(kind)}&entity=${encodeURIComponent(entity.id)}&field=${kind === "profiles" ? "requirements" : "name"}` }))); return { rows: all.slice(0, options.rowLimit), totalRows: all.length }; }
export function mergeProjectSchemasIntoLibrary(existing, projectSchemas) { const projectIds = new Set(projectSchemas.map(({ id }) => id)); return [...existing.filter(({ id }) => !projectIds.has(id)), ...projectSchemas]; }
import { createSchema, createSchemaWorkingDraft, publishSchemaWorkingDraft, } from "./data-layer-schema-verification.js";
//# sourceMappingURL=data-layer-specification-project.js.map