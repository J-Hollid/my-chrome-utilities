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
export function resolveApplicability(project, context) {
    const candidates = [...project.collections.applicabilitySets, ...project.collections.assignments].map((entry) => { const condition = entry.condition; const matched = condition ? conditionMatches(condition, context) : false; return { id: entry.id, name: entry.name, matched, priority: Number(entry.priority ?? 0), evidence: matched ? "All configured predicates matched" : "At least one predicate did not match" }; });
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
function predicateFields(condition) { const fields = new Map(); if (!condition)
    return fields; if (condition.kind === "predicate") {
    if (condition.operator === "equals")
        fields.set(condition.field, String(condition.value));
    return fields;
} for (const item of condition.conditions)
    for (const [field, value] of predicateFields(item))
        fields.set(field, value); return fields; }
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
            const af = predicateFields(a.condition), bf = predicateFields(b.condition);
            let exclusive = false;
            for (const [field, value] of af)
                if (bf.has(field) && bf.get(field) !== value)
                    exclusive = true;
            if (!exclusive)
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
    throw new Error(`Project preflight has ${preflight.blockers.length} blockers.`); const revision = state.project.releases.length + 1, release = { id: options.id("release"), name: `Release ${revision}`, revision, createdAt: now(), snapshot: clone(state.project.collections) }; const project = { ...state.project, releases: [...state.project.releases, release], currentRelease: release.id }; options.write(project); return { project, history: { undo: [], redo: [] } }; }
export function exportSpecificationProject(project) { return JSON.stringify({ format: "my-chrome-utilities.specification-project", version: 1, project }); }
export function importSpecificationProject(serialized, options) { const parsed = JSON.parse(serialized); if (parsed.format !== "my-chrome-utilities.specification-project" || parsed.version !== 1 || !parsed.project)
    throw new Error("Unsupported Specification Project format."); const collisions = options.existingProjects.some(({ id }) => id === parsed.project.id) ? [parsed.project.id] : []; return { project: clone(parsed.project), collisions }; }
export function migrateLegacyLibrary(legacy, options) { const state = createSpecificationProject({ name: "Legacy Schema Library", site: "compatibility.local", id: options.id }); const issues = []; const events = (legacy.schemas ?? []).flatMap((schema) => (schema.assignments ?? []).flatMap((assignment) => { if (!assignment.id || !assignment.eventName)
    return issues.push({ sourceId: String(assignment.id ?? schema.id ?? "unknown"), message: "Assignment identity or event name is unresolved" }), []; return [{ id: String(assignment.id), name: String(assignment.eventName), eventName: assignment.eventName, sourceId: assignment.sourceId, target: assignment.target, legacySchemaId: schema.id }]; })); const profiles = (legacy.schemas ?? []).map((schema) => ({ id: String(schema.id), name: String(schema.name ?? schema.id), requirements: [], legacyVersion: schema.version })); return { project: { ...state.project, collections: { ...state.project.collections, profiles, events }, compatibility: { legacySnapshot: JSON.stringify(legacy) } }, issues }; }
export function createProjectSchemaDraft(state, input, id) { return transactProject(state, `Create ${input.name} schema draft`, (project) => ({ ...project, collections: { ...project.collections, schemaDrafts: [...project.collections.schemaDrafts, { id: id("schema-draft"), name: input.name, schemaId: input.schemaId, baseRevision: input.baseRevision, publishedRevision: { revision: input.baseRevision, name: input.name, description: input.description }, workingDraft: { name: input.name, description: input.description, selectedProperty: null, expandedPaths: [], scrollTop: 0 } }] } })); }
export function saveProjectAssignment(state, input, id) {
    if (!input.schemaId.trim() || !input.eventName.trim() || !input.sourceId.trim() || !input.target.trim())
        throw new Error("Assignment routing fields must not be blank.");
    if (input.versionPolicy === "pinned" && !Number.isInteger(input.schemaRevision))
        throw new Error("Pinned assignments require a real schema revision.");
    const existing = input.id ? state.project.collections.assignments.find((assignment) => assignment.id === input.id) : undefined, identity = existing?.id ?? id("assignment"), saved = { ...clone(input), id: identity };
    return transactProject(state, `${existing ? "Update" : "Create"} assignment ${input.name}`, (project) => ({ ...project, collections: { ...project.collections, assignments: existing ? project.collections.assignments.map((assignment) => assignment.id === identity ? saved : assignment) : [...project.collections.assignments, saved] } }));
}
export function searchProjectAssignments(project, query) { const normalized = query.trim().toLowerCase(), rows = project.collections.assignments.filter((assignment) => assignment.schemaId && assignment.eventName && assignment.sourceId && assignment.target && (!normalized || JSON.stringify(assignment).toLowerCase().includes(normalized))), conflicts = []; for (let left = 0; left < rows.length; left += 1)
    for (let right = left + 1; right < rows.length; right += 1) {
        const a = rows[left], b = rows[right];
        if (a.schemaId === b.schemaId && a.eventName === b.eventName && Number(a.priority) === Number(b.priority))
            conflicts.push({ ids: [a.id, b.id], message: `${a.name} and ${b.name} are equal-priority candidates` });
    } return { rows, count: rows.length, empty: rows.length === 0, conflicts }; }
export function addFlowStep(state, flowId, input, id) { if (input.minimum < 0 || input.maximum < input.minimum)
    throw new Error("Flow occurrence bounds are invalid."); return transactProject(state, `Add ${input.name} flow step`, (project) => ({ ...project, collections: { ...project.collections, flows: project.collections.flows.map((flow) => flow.id === flowId ? { ...flow, steps: [...(flow.steps ?? []), { ...clone(input), id: id("flow-step") }] } : flow) } })); }
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
export function startFlowInstance(project, flowId, sessionId) { const flow = project.collections.flows.find(({ id }) => id === flowId); if (!flow)
    throw new Error(`Unknown flow ${flowId}`); return { id: `${flowId}:${sessionId}`, flowId, selector: flow.name.toLowerCase(), sessionId, occurrences: {}, history: [], status: "active" }; }
export function advanceFlowInstance(project, instance, input) {
    const flow = project.collections.flows.find(({ id }) => id === instance.flowId);
    if (!flow)
        throw new Error(`Unknown flow ${instance.flowId}`);
    const steps = flow.steps ?? [];
    const currentIndex = Math.max(0, steps.findIndex(({ id }) => id === instance.currentStepId)), candidates = steps.slice(currentIndex);
    const step = candidates.find((candidate) => !candidate.eventId || candidate.eventId === input.eventId);
    if (!step)
        return { ...instance, status: "failed" };
    const count = (instance.occurrences[step.id] ?? 0) + 1, occurrences = { ...instance.occurrences, [step.id]: count };
    const maximum = Number(step.maximum ?? 1), index = steps.indexOf(step), next = count >= maximum ? steps[index + 1] : step;
    return { ...instance, currentStepId: next?.id ?? step.id, occurrences, history: [...instance.history, { stepId: step.id, ...input }], status: next ? "active" : "complete" };
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
export function exportSpecificationProjectState(state) { return JSON.stringify({ format: "my-chrome-utilities.specification-project-state", version: 1, state }); }
export function stageProjectImport(serialized, current, options) { const parsed = JSON.parse(serialized); if (parsed.format !== "my-chrome-utilities.specification-project-state" || parsed.version !== 1 || !parsed.state)
    throw new Error("Unsupported future Specification Project format; supported version is 1."); const imported = clone(parsed.state); if (options?.projectId)
    imported.project.id = options.projectId; const blockers = imported.project.id === current.project.id ? [{ kind: "project-id-collision", message: "Choose replace or remap for the conflicting project identity.", ids: [imported.project.id] }] : []; return { state: imported, diff: buildReleaseReview(current.project, imported.project), blockers, source: serialized }; }
export function commitStagedProjectImport(current, staged, options) { if (staged.blockers.length)
    throw new Error(`Import has ${staged.blockers.length} unresolved blockers.`); const next = clone(staged.state); options.write(next); return next; }
export function buildCoverageMatrix(project, options) { const all = Object.entries(project.collections).flatMap(([kind, entities]) => entities.map((entity) => ({ id: entity.id, kind, name: entity.name, state: (kind === "profiles" && entity.requirements.length === 0 ? "issue" : "covered"), issueLink: `?kind=${encodeURIComponent(kind)}&entity=${encodeURIComponent(entity.id)}&field=${kind === "profiles" ? "requirements" : "name"}` }))); return { rows: all.slice(0, options.rowLimit), totalRows: all.length }; }
//# sourceMappingURL=data-layer-specification-project.js.map