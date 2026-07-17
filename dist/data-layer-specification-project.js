const clone = (value) => structuredClone(value);
const now = () => new Date().toISOString();
export function createSpecificationProject(input) {
    const project = {
        id: input.id("project"), name: input.name, description: input.description ?? "", site: input.site,
        environments: [...(input.environments ?? ["Production"])],
        namingConventions: { property: "snake_case", event: "snake_case" },
        publicationPolicy: { warningsBlock: false, fixturesRequired: true },
        collections: { profiles: [], pages: [], pageGroups: [], events: [], applicabilitySets: [], flows: [], fixtures: [] },
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
    const candidates = project.collections.applicabilitySets.map((entry) => { const condition = entry.condition; const matched = condition ? conditionMatches(condition, context) : false; return { id: entry.id, name: entry.name, matched, priority: Number(entry.priority ?? 0), evidence: matched ? "All configured predicates matched" : "At least one predicate did not match" }; });
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
//# sourceMappingURL=data-layer-specification-project.js.map