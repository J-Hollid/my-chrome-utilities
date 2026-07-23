import { canonicalConstraints, canonicalPropertyPath, canonicalRequirements, canonicalSchemaWithConstraint, createCanonicalSchema, migrateLegacyProfile } from "./data-layer-canonical-schema.js";
import { savedSchemaCanonicalDocument, savedSchemaFromCanonical } from "./data-layer-saved-schema-canonical.js";
const clone = (value) => structuredClone(value);
const now = () => new Date().toISOString();
export function createSpecificationProject(input) {
    const project = {
        id: input.id("project"), name: input.name, description: input.description ?? "", site: input.site,
        environments: [...(input.environments ?? ["Production"])],
        namingConventions: { property: "snake_case", event: "snake_case" },
        publicationPolicy: { warningsBlock: false, fixturesRequired: true },
        collections: { profiles: [], pages: [], pageGroups: [], events: [], applicabilitySets: [], flows: [], fixtures: [], assignments: [] },
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
    project.collections.events = project.collections.events.map((event) => {
        const normalized = clone(event);
        delete normalized.role;
        return normalized;
    });
    return { project, draft: { ...state.draft, status: "Saved", updatedAt: now() }, history: { undo: [...state.history.undo, { label, project: before }], redo: [] } };
}
export function confirmCanonicalMigration(state, plan) {
    if (plan.conflicts.length)
        throw new Error(`Resolve ${plan.conflicts.length} canonical migration conflict${plan.conflicts.length === 1 ? "" : "s"} before confirming.`);
    return transactProject(state, "Migrate legacy schema to canonical document", (project) => ({ ...project, collections: { ...project.collections, profiles: project.collections.profiles.map((profile) => {
                if (profile.id !== plan.profileId)
                    return profile;
                const next = { ...profile, requirements: [], canonicalSchema: clone(plan.document) };
                delete next.structuredSchema;
                delete next.structuredDraft;
                delete next.schemaConstraints;
                return next;
            }) } }));
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
    const identity = id(kind.slice(0, -1) || kind), cloned = clone(entity);
    if (kind === "events")
        delete cloned.role;
    const added = { ...cloned, id: identity }, canonical = added.canonicalSchema;
    if (canonical) {
        canonical.contributorId = identity;
        canonical.contributorName = String(entity.name);
    }
    return transactProject(state, `Add ${entity.name}`, (project) => ({ ...project, collections: { ...project.collections, [kind]: [...project.collections[kind], added] } }));
}
export function composeRequirementProfiles(profiles) {
    const requirements = new Map();
    const conflicts = [];
    for (const profile of profiles)
        for (const requirement of profile.canonicalSchema ? canonicalRequirements(profile.canonicalSchema) : profile.requirements) {
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
    if (field.startsWith("/"))
        return field.split("/").filter(Boolean).reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, context.payload ?? context);
    if (field.startsWith("payload."))
        return field.slice(8).split(".").reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, context.payload);
    return field.split(".").reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, context);
}
function predicateMatches(predicate, context) {
    const actual = fieldValue(context, predicate.field), expected = predicate.valuePath ? fieldValue(context, predicate.valuePath) : predicate.value, operator = predicate.operator.toLowerCase().replaceAll("_", "-");
    if (operator === "exists")
        return actual !== undefined;
    if (operator === "does not exist")
        return actual === undefined;
    if (operator === "equals")
        return Object.is(actual, expected);
    if (operator === "does not equal" || operator === "not equals")
        return !Object.is(actual, expected);
    if (operator === "is one of")
        return (predicate.values ?? (Array.isArray(expected) ? expected : [])).some((candidate) => Object.is(candidate, actual));
    if (operator === "contains")
        return String(actual).includes(String(expected));
    if (operator === "glob")
        return new RegExp(`^${String(expected).replace(/[.+^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*")}$`).test(String(actual));
    if (operator === "regex" || operator === "matches pattern") {
        try {
            return new RegExp(predicate.pattern ?? String(expected)).test(String(actual));
        }
        catch {
            return false;
        }
    }
    if (typeof actual === "number" && typeof expected === "number") {
        if (operator === "is greater than")
            return actual > expected;
        if (operator === "is at least")
            return actual >= expected;
        if (operator === "is less than")
            return actual < expected;
        if (operator === "is at most")
            return actual <= expected;
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
    return project.collections.assignments;
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
export function commitBulkProperties(state, profileId, properties) {
    const errors = properties.flatMap((property, index) => !property.path.startsWith("/") ? [{ index, path: property.path, message: "Use a generated canonical /path" }] : !supportedTypes.has(property.type) ? [{ index, path: property.path, message: "Choose a supported type" }] : []);
    if (errors.length)
        return { state, errors };
    const profile = state.project.collections.profiles.find(({ id }) => id === profileId);
    if (!profile)
        throw new Error(`Unknown Profile ${profileId}.`);
    let sequence = 0;
    const migratedCanonical = profile.canonicalSchema ?? migrateLegacyProfile(profile, { id: (kind) => `${kind}:${profile.id}:bulk-migration:${++sequence}` }).document;
    const migratedState = profile.canonicalSchema && profile.requirements.length === 0 ? state : { ...state, project: { ...state.project, collections: { ...state.project.collections, profiles: state.project.collections.profiles.map((candidate) => candidate.id === profileId ? { ...candidate, canonicalSchema: migratedCanonical, requirements: [] } : candidate) } } };
    let canonical = migratedCanonical;
    for (const property of properties)
        canonical = canonicalSchemaWithConstraint(canonical, property, (kind) => `${kind}:${profile.id}:bulk:${++sequence}`);
    return { errors: [], state: transactProject(migratedState, `Import ${properties.length} canonical properties`, (project) => ({ ...project, collections: { ...project.collections, profiles: project.collections.profiles.map((candidate) => candidate.id === profileId ? { ...candidate, canonicalSchema: canonical, requirements: [] } : candidate) } })) };
}
export function applyBulkRequirement(state, profileId, paths, update) { const profile = state.project.collections.profiles.find(({ id }) => id === profileId); if (!profile?.canonicalSchema)
    throw new Error(`Profile ${profileId} has no canonical schema.`); let canonical = profile.canonicalSchema, sequence = 0; const existing = new Map(canonicalConstraints(canonical).map((constraint) => [constraint.path, constraint])), { required, ...canonicalUpdate } = update; for (const path of paths) {
    const prior = existing.get(path);
    if (!prior)
        throw new Error(`Canonical property ${path} is unavailable.`);
    canonical = canonicalSchemaWithConstraint(canonical, { ...prior, ...canonicalUpdate, ...(required === undefined ? {} : { presence: required ? "required" : "optional" }), path }, (kind) => `${kind}:${profile.id}:bulk-update:${++sequence}`);
} return transactProject(state, `Update ${paths.length} canonical properties`, (project) => ({ ...project, collections: { ...project.collections, profiles: project.collections.profiles.map((candidate) => candidate.id === profileId ? { ...candidate, canonicalSchema: canonical, requirements: [] } : candidate) } })); }
export function publishProjectRelease(state, options) { if (!state.draft)
    throw new Error("There is no project draft to publish."); const preflight = projectPreflight(state.project); if (preflight.blockers.length)
    throw new Error(`Project preflight has ${preflight.blockers.length} blockers.`); const { schemaDrafts: _legacySchemaDrafts, ...collections } = clone(state.project.collections), revision = Math.max(0, ...state.project.releases.map((release) => release.revision)) + 1, release = { id: options.id("release"), name: `Release ${revision}`, revision, createdAt: now(), snapshot: clone(collections) }; const project = { ...state.project, collections, releases: [...state.project.releases, release], currentRelease: release.id }; options.write(project); return { project, history: { undo: [], redo: [] } }; }
export function exportSpecificationProject(project) { return JSON.stringify({ format: "my-chrome-utilities.specification-project", version: 1, project }); }
export function importSpecificationProject(serialized, options) { const parsed = JSON.parse(serialized); if (parsed.format !== "my-chrome-utilities.specification-project" || parsed.version !== 1 || !parsed.project)
    throw new Error("Unsupported Specification Project format."); const collisions = options.existingProjects.some(({ id }) => id === parsed.project.id) ? [parsed.project.id] : []; return { project: clone(parsed.project), collisions }; }
export function migrateLegacyLibrary(legacy, options) { const state = createSpecificationProject({ name: "Legacy Schema Library", site: "compatibility.local", id: options.id }); const issues = []; const events = (legacy.schemas ?? []).flatMap((schema) => (schema.assignments ?? []).flatMap((assignment) => { if (!assignment.id || !assignment.eventName)
    return issues.push({ sourceId: String(assignment.id ?? schema.id ?? "unknown"), message: "Assignment identity or event name is unresolved" }), []; return [{ id: String(assignment.id), name: String(assignment.eventName), eventName: assignment.eventName, sourceId: assignment.sourceId, target: assignment.target, legacySchemaId: schema.id }]; })); const profiles = (legacy.schemas ?? []).map((schema) => ({ id: String(schema.id), name: String(schema.name ?? schema.id), requirements: [], legacyVersion: schema.version })); return { project: { ...state.project, collections: { ...state.project.collections, profiles, events }, compatibility: { legacySnapshot: JSON.stringify(legacy) } }, issues }; }
export function createProjectSchemaDraft(state, input, id) {
    return transactProject(state, `Create ${input.name} Shared Profile`, (project) => {
        const profileId = input.schemaId?.trim() || id("profile");
        if (project.collections.profiles.some(({ id }) => id === profileId))
            throw new Error(`Shared Profile ${profileId} already exists.`);
        const profile = { id: profileId, name: input.name, requirements: [], description: input.description, canonicalSchema: createCanonicalSchema({ id: id("canonical-schema"), contributorId: profileId, contributorName: input.name }) };
        return { ...project, collections: { ...project.collections, profiles: [...project.collections.profiles, profile] } };
    });
}
const equalJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const recordValue = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
function documentChanges(before, after, path = "") { if (equalJson(before, after))
    return []; if (recordValue(before) && recordValue(after)) {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap((key) => documentChanges(before[key], after[key], `${path}/${key}`));
} return [{ path: path || "/", before: clone(before), after: clone(after) }]; }
function synchronizeDocument(base, current, next) { if (equalJson(current, base))
    return clone(next); if (recordValue(base) && recordValue(current) && recordValue(next)) {
    const merged = {};
    for (const key of new Set([...Object.keys(base), ...Object.keys(current), ...Object.keys(next)])) {
        const value = synchronizeDocument(base[key], current[key], next[key]);
        if (value !== undefined)
            merged[key] = value;
    }
    return merged;
} return clone(current); }
function synchronizeSavedSchemaRules(base, current, next) {
    const baseById = new Map(base.map((rule) => [rule.id, rule])), currentById = new Map(current.map((rule) => [rule.id, rule])), nextById = new Map(next.map((rule) => [rule.id, rule])), ids = [...next.map(({ id }) => id), ...current.map(({ id }) => id).filter((id) => !nextById.has(id))];
    return ids.flatMap((id) => { const oldRule = baseById.get(id), localRule = currentById.get(id), newRule = nextById.get(id); if (!oldRule)
        return [clone(localRule ?? newRule)]; if (!localRule)
        return []; if (!newRule)
        return equalJson(localRule, oldRule) ? [] : [clone(localRule)]; return [synchronizeDocument(oldRule, localRule, newRule)]; });
}
function preserveCanonicalPropertyIds(current, next) {
    const currentByPath = new Map(Object.values(current.nodes).map((node) => [canonicalPropertyPath(current, node.id), node.id])), ids = new Map(Object.values(next.nodes).map((node) => [node.id, currentByPath.get(canonicalPropertyPath(next, node.id)) ?? node.id])), propertyId = (id) => ids.get(id) ?? id, predicate = (value) => value.kind === "predicate" ? { ...value, propertyId: propertyId(value.propertyId) } : { ...value, children: value.children.map(predicate) }, nodes = {};
    for (const node of Object.values(next.nodes)) {
        const stableId = propertyId(node.id), embeddedId = (id) => id.replace(node.id, stableId);
        nodes[stableId] = { ...clone(node), id: stableId, ...(node.parentId ? { parentId: propertyId(node.parentId) } : {}), presence: { ...clone(node.presence), ...(node.presence.condition ? { condition: predicate(node.presence.condition) } : {}) }, allowedValues: node.allowedValues.map((entry) => ({ ...clone(entry), id: embeddedId(entry.id) })), rules: node.rules.map((rule) => ({ ...clone(rule), id: embeddedId(rule.id), ...(rule.condition ? { condition: predicate(rule.condition) } : {}) })) };
    }
    const definitions = next.sourceContent?.definitionsByNodeId, sourceContent = next.sourceContent ? { ...clone(next.sourceContent), ...(definitions ? { definitionsByNodeId: Object.fromEntries(Object.entries(definitions).map(([id, definition]) => [propertyId(id), clone(definition)])) } : {}) } : undefined, selected = current.selectedPropertyId && nodes[current.selectedPropertyId] ? current.selectedPropertyId : next.selectedPropertyId ? propertyId(next.selectedPropertyId) : undefined;
    return { ...clone(next), nodes, rootIds: next.rootIds.map(propertyId), ...(selected ? { selectedPropertyId: selected } : {}), ...(sourceContent ? { sourceContent } : {}), changes: next.changes.map((change) => ({ ...clone(change), propertyIds: change.propertyIds.map(propertyId) })) };
}
export function adoptSavedSchema(state, source) {
    if (!source.published)
        throw new Error("Only a published saved schema can be adopted.");
    return transactProject(state, `Adopt saved schema ${source.name}`, (project) => {
        if (project.collections.profiles.some(({ sourceIdentity }) => sourceIdentity === source.id))
            throw new Error(`Saved schema ${source.name} is already adopted.`);
        const preferredProfileId = `profile:${source.id}`, occupiedProfileIds = new Set(project.collections.profiles.map(({ id }) => id));
        let profileId = preferredProfileId, suffix = 0;
        while (occupiedProfileIds.has(profileId)) {
            suffix += 1;
            profileId = `${preferredProfileId}:saved-schema-contributor${suffix === 1 ? "" : `-${suffix}`}`;
        }
        let canonicalSequence = 0;
        const canonicalSchema = savedSchemaCanonicalDocument({ id: source.id, name: source.name, version: source.version, document: clone(source.document), attachedRules: clone(source.rules ?? []), ...(source.documentation === undefined ? {} : { documentation: clone(source.documentation) }) }, (kind) => `${profileId}:${kind}:${++canonicalSequence}`, { id: `canonical:${source.id}`, contributorId: profileId, contributorName: source.name });
        canonicalSchema.sourceContent = { ...canonicalSchema.sourceContent, document: clone(source.document), rules: clone(source.rules ?? []), documentation: clone(source.documentation ?? ""), examples: clone(source.examples ?? []) };
        const profile = { id: profileId, name: source.name, requirements: [], canonicalSchema, sourceIdentity: source.id, sourceRevision: source.version, adoptionProvenance: { kind: "saved-schema-library", schemaId: source.id, revision: source.version } };
        return { ...project, collections: { ...project.collections, profiles: [...project.collections.profiles, profile] } };
    });
}
export function stageSavedSchemaSynchronization(state, source) {
    const adopted = state.project.collections.profiles.find(({ sourceIdentity }) => sourceIdentity === source.id), canonical = adopted?.canonicalSchema;
    if (!adopted || !canonical || canonical.source?.identity !== source.id)
        throw new Error(`Saved schema ${source.name} has not been adopted.`);
    const fromRevision = Number(adopted.sourceRevision ?? canonical.source.revision), base = canonical.sourceContent?.document ?? {}, projected = savedSchemaFromCanonical({ id: source.id, name: adopted.name, version: fromRevision, document: clone(base), assignments: [], attachedRules: clone(canonical.sourceContent?.rules ?? []) }, canonical), current = projected.document;
    if (source.version <= fromRevision)
        throw new Error(`Saved schema ${source.name} has no newer revision.`);
    const changes = documentChanges(base, source.document), localOverrides = documentChanges(base, current).map(({ path }) => path);
    return { schemaId: source.id, fromRevision, toRevision: source.version, changes, localOverrides, source: clone(source) };
}
export function commitSavedSchemaSynchronization(state, review) {
    return transactProject(state, `Synchronize saved schema ${review.schemaId} to revision ${review.toRevision}`, (project) => {
        const adopted = project.collections.profiles.find(({ sourceIdentity }) => sourceIdentity === review.schemaId), canonical = adopted?.canonicalSchema;
        if (!adopted || !canonical || canonical.source?.identity !== review.schemaId || Number(adopted.sourceRevision ?? canonical.source.revision) !== review.fromRevision)
            throw new Error("Saved-schema synchronization review is stale.");
        const priorContent = canonical.sourceContent ?? { document: {}, rules: [], documentation: {}, examples: [] }, projected = savedSchemaFromCanonical({ id: review.schemaId, name: adopted.name, version: review.fromRevision, document: clone(priorContent.document), assignments: [], attachedRules: clone(priorContent.rules), documentation: clone(priorContent.documentation) }, canonical), document = synchronizeDocument(priorContent.document, projected.document, review.source.document), rules = synchronizeSavedSchemaRules(priorContent.rules, projected.attachedRules ?? [], review.source.rules ?? []), documentation = synchronizeDocument(priorContent.documentation, projected.documentation ?? {}, review.source.documentation ?? {}), examples = synchronizeDocument(priorContent.examples, priorContent.examples, review.source.examples ?? []);
        let sequence = 0;
        const generated = savedSchemaCanonicalDocument({ id: review.schemaId, name: adopted.name, version: review.toRevision, document, attachedRules: rules, ...(documentation === undefined ? {} : { documentation: clone(documentation) }) }, (kind) => `${adopted.id}:sync:${review.toRevision}:${kind}:${++sequence}`, { id: canonical.id, contributorId: adopted.id, contributorName: adopted.name });
        generated.sourceContent = { ...generated.sourceContent, document: clone(review.source.document), rules: clone(review.source.rules ?? []), documentation: clone(review.source.documentation ?? {}), examples: clone(review.source.examples ?? examples) };
        const synchronized = preserveCanonicalPropertyIds(canonical, generated);
        const profiles = project.collections.profiles.map((profile) => profile === adopted ? { ...profile, sourceRevision: review.toRevision, adoptionProvenance: { kind: "saved-schema-library", schemaId: review.schemaId, revision: review.toRevision }, canonicalSchema: synchronized } : profile);
        const fixtures = project.collections.fixtures.map((fixture) => fixture.contributorId === adopted.id || JSON.stringify(fixture).includes(review.schemaId) ? { ...fixture, evidenceStatus: "stale", staleReason: `Contributor ${adopted.id} synchronized to source revision ${review.toRevision}` } : fixture);
        return { ...project, collections: { ...project.collections, profiles, fixtures } };
    });
}
export function commitSavedSchemaReview(state, review) {
    const next = review.kind === "adopt" ? adoptSavedSchema(state, review.source) : commitSavedSchemaSynchronization(state, review.review), sourceId = review.kind === "adopt" ? review.source.id : review.review.schemaId, profileId = next.project.collections.profiles.find(({ sourceIdentity }) => sourceIdentity === sourceId)?.id;
    if (!profileId)
        throw new Error(`Saved schema ${sourceId} did not resolve its Shared Profile.`);
    return { state: next, profileId };
}
export function capturedValidationDestinationChoices(project, capture) {
    const named = (entities) => entities.map(({ id, name }) => ({ id, name })), events = named(project.collections.events.filter((event) => event.eventName === capture.eventName && event.sourceId === capture.sourceId));
    const flowSteps = project.collections.flows.flatMap((flow) => (flow.steps ?? []).map((step) => ({ id: step.id, name: `${flow.name} / ${step.name}` })));
    return { events, pages: named(project.collections.pages), flowSteps, profiles: named(project.collections.profiles), suggestedFixtureName: `${capture.eventName.replace(/(^|[_-])(\w)/g, (_match, _prefix, letter) => letter.toUpperCase())} captured validation` };
}
function assertedEvaluation(input) {
    if (input.evaluated.winner?.schemaId !== input.contributorId)
        throw new Error(`Evaluator result ${input.evaluated.resultIdentity} does not prove contributor ${input.contributorId}.`);
    const issueCodes = [...new Set(input.evaluated.issueDetails.map(({ code }) => code))];
    return { status: input.evaluated.issueDetails.length ? "fail" : "pass", issueCodes };
}
export function createFixtureFromCapturedValidation(state, input, id) {
    if (!state.project.collections.profiles.some(({ id }) => id === input.contributorId))
        throw new Error(`Select a canonical contributor before creating its captured Fixture.`);
    const expected = assertedEvaluation(input), fixture = { id: id("fixture"), name: input.name, mode: "event", contributorId: input.contributorId, ...(input.eventId ? { eventId: input.eventId } : {}), ...(input.pageId ? { pageId: input.pageId } : {}), ...(input.flowStepId ? { flowStepId: input.flowStepId } : {}), observations: [{ sourceId: input.sourceId, eventName: input.eventName, payload: clone(input.payload) }], expected, assertions: [{ field: "status", equals: expected.status }, { field: "issueCodes", equals: clone(expected.issueCodes) }], evaluationResultIdentity: input.evaluated.resultIdentity, provenance: { kind: "captured-validation", captureId: input.captureId }, releasePolicy: "required", evidenceStatus: "current" };
    return transactProject(state, `Create Fixture from capture ${input.captureId}`, (project) => ({ ...project, collections: { ...project.collections, fixtures: [...project.collections.fixtures, fixture] } }));
}
export function capturedValidationProfileRequirements(project, input) {
    assertedEvaluation(input);
    const contributor = project.collections.profiles.find(({ id }) => id === input.contributorId);
    if (!contributor)
        throw new Error(`Select contributor ${input.contributorId} before creating Profile requirements.`);
    const requirements = composeRequirementProfiles([contributor]).requirements;
    if (!requirements.length)
        throw new Error(`Contributor ${input.contributorId} has no evaluated requirements.`);
    return requirements.map((requirement) => ({ ...clone(requirement), origin: `captured-validation:${input.captureId}`, evaluationResultIdentity: input.evaluated.resultIdentity }));
}
export function applyCapturedValidationToProfile(state, input) {
    const profile = state.project.collections.profiles.find(({ id }) => id === input.profileId);
    if (!profile)
        throw new Error(`Unknown Profile ${input.profileId}.`);
    const proposed = capturedValidationProfileRequirements(state.project, input);
    let canonical = profile.canonicalSchema ?? createCanonicalSchema({ id: `canonical:${profile.id}`, contributorId: profile.id, contributorName: profile.name }), sequence = 0;
    for (const requirement of proposed)
        canonical = canonicalSchemaWithConstraint(canonical, requirement, (kind) => `${kind}:${profile.id}:capture:${++sequence}`);
    return transactProject(state, `Add evaluated capture ${input.captureId} canonical properties to ${profile.name}`, (project) => ({ ...project, collections: { ...project.collections, profiles: project.collections.profiles.map((candidate) => candidate.id !== profile.id ? candidate : { ...candidate, canonicalSchema: canonical, requirements: [] }) } }));
}
function canonicalAssignmentCondition(project, condition) { if (!condition)
    return undefined; if (condition.kind !== "predicate")
    return { ...condition, conditions: condition.conditions.map((child) => canonicalAssignmentCondition(project, child)) }; if (condition.field !== "flowId" || typeof condition.value !== "string")
    return clone(condition); const normalized = condition.value.trim().toLowerCase(), flow = project.collections.flows.find((candidate) => candidate.id === condition.value || candidate.name.trim().toLowerCase() === normalized); return { ...condition, ...(flow ? { value: flow.id } : {}) }; }
function assignmentTarget(project, kind, identity) { if (kind === "Shared Profile")
    return project.collections.profiles.find(({ id }) => id === identity); if (kind === "Page Group")
    return project.collections.pageGroups.find(({ id }) => id === identity); if (kind === "Page")
    return project.collections.pages.find(({ id }) => id === identity); if (kind === "Event")
    return project.collections.events.find(({ id }) => id === identity); return Object.values(project.documentationFlowGraphs ?? {}).flatMap((graph) => (graph.pageFrames ?? [])).find(({ id }) => id === identity); }
export function saveProjectAssignment(state, input, id) {
    if (!input.targetId.trim() || !input.eventName.trim() || !input.sourceId.trim() || !input.target.trim())
        throw new Error("Assignment routing fields must not be blank.");
    if (!assignmentTarget(state.project, input.targetKind, input.targetId))
        throw new Error(`${input.targetKind} ${input.targetId} is unavailable.`);
    const existing = input.id ? state.project.collections.assignments.find((assignment) => assignment.id === input.id) : undefined, identity = existing?.id ?? id("assignment"), generatedApplicabilityId = input.applicabilitySetId ?? String(existing?.applicabilitySetId ?? id("applicability")), resolvedEventId = input.eventId ?? String(existing?.eventId ?? state.project.collections.events.find((event) => event.eventName === input.eventName && event.sourceId === input.sourceId)?.id ?? "");
    const { condition: rawCondition, ...compatible } = clone(input), condition = canonicalAssignmentCondition(state.project, rawCondition), saved = { ...existing, ...compatible, id: identity, eventId: resolvedEventId, applicabilitySetId: generatedApplicabilityId };
    delete saved.condition;
    delete saved.schemaDraftId;
    delete saved.schemaId;
    delete saved.schemaRevision;
    delete saved.schemaDocument;
    delete saved.compiledSchema;
    return transactProject(state, `${existing ? "Update" : "Create"} assignment ${input.name}`, (project) => { const defaultCondition = { kind: "all", conditions: [] }, applicabilitySets = project.collections.applicabilitySets.some(({ id: applicabilityId }) => applicabilityId === generatedApplicabilityId) ? project.collections.applicabilitySets.map((entry) => entry.id === generatedApplicabilityId && condition ? { ...entry, condition: clone(condition) } : entry) : [...project.collections.applicabilitySets, { id: generatedApplicabilityId, name: `${input.name} applicability`, priority: input.priority, condition: clone(condition ?? defaultCondition) }]; return { ...project, collections: { ...project.collections, applicabilitySets, assignments: existing ? project.collections.assignments.map((assignment) => assignment.id === identity ? saved : assignment) : [...project.collections.assignments, saved] } }; });
}
export function searchProjectAssignments(project, query) { const normalized = query.trim().toLowerCase(), rows = lifecycleAssignments(project).filter((assignment) => assignment.targetId && assignment.targetKind && assignment.eventName && assignment.sourceId && assignment.target && (!normalized || JSON.stringify(assignment).toLowerCase().includes(normalized))), conflicts = []; for (let left = 0; left < rows.length; left += 1)
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
export function saveFlowStep(state, flowId, stepId, input) { if (input.minimum < 0 || input.maximum < input.minimum)
    throw new Error("Flow occurrence bounds are invalid."); return transactProject(state, `Save flow step ${stepId}`, (project) => ({ ...project, collections: { ...project.collections, flows: project.collections.flows.map((flow) => { if (flow.id !== flowId)
            return flow; const steps = flow.steps ?? []; if (!steps.some(({ id }) => id === stepId))
            throw new Error(`Unknown flow step ${stepId}.`); return { ...flow, steps: steps.map((step) => { if (step.id !== stepId)
                return step; const updated = { ...step, ...clone(input) }; if (!input.pageId)
                delete updated.pageId; if (!input.eventId)
                delete updated.eventId; return updated; }) }; }) } })); }
export function saveFlowTransition(state, flowId, fromStepId, transition) { return transactProject(state, `Save flow transition ${transition.id}`, (project) => ({ ...project, collections: { ...project.collections, flows: project.collections.flows.map((flow) => { if (flow.id !== flowId)
            return flow; const steps = flow.steps ?? []; if (!steps.some(({ id }) => id === fromStepId))
            throw new Error(`Unknown source step ${fromStepId}.`); if (!steps.some(({ id }) => id === transition.toStepId))
            throw new Error(`Unknown target step ${transition.toStepId}.`); return { ...flow, steps: steps.map((step) => { if (step.id !== fromStepId)
                return step; const transitions = step.transitions ?? [], existing = transitions.some(({ id }) => id === transition.id); return { ...step, transitions: existing ? transitions.map((candidate) => candidate.id === transition.id ? clone(transition) : candidate) : [...transitions, clone(transition)] }; }) }; }) } })); }
export function reorderFlowStep(state, flowId, from, to) { return transactProject(state, "Reorder flow step", (project) => ({ ...project, collections: { ...project.collections, flows: project.collections.flows.map((flow) => { if (flow.id !== flowId)
            return flow; const steps = [...(flow.steps ?? [])], moved = steps.splice(from, 1)[0]; if (!moved)
            return flow; steps.splice(Math.max(0, Math.min(to, steps.length)), 0, moved); return { ...flow, steps }; }) } })); }
export function exportDocumentation(project, options) {
    const header = ["Path", ...options.fields.filter((field) => field !== "path").map((field) => field.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase()))];
    const rows = project.collections.profiles.flatMap((profile) => (profile.canonicalSchema ? canonicalRequirements(profile.canonicalSchema) : profile.requirements).map((requirement) => {
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
export function exportSpecificationProjectState(state) { return JSON.stringify({ format: "my-chrome-utilities.specification-project-state", version: 2, state: { ...clone(state), history: { undo: [], redo: [] } }, migrations: [] }); }
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
export function buildCoverageMatrix(project, options) { const all = Object.entries(project.collections).flatMap(([kind, entities]) => entities.map((entity) => ({ id: entity.id, kind, name: entity.name, state: (kind === "profiles" && (!entity.canonicalSchema || canonicalRequirements(entity.canonicalSchema).length === 0) ? "issue" : "covered"), issueLink: `?kind=${encodeURIComponent(kind)}&entity=${encodeURIComponent(entity.id)}&field=${kind === "profiles" ? "canonicalSchema" : "name"}` }))); return { rows: all.slice(0, options.rowLimit), totalRows: all.length }; }
export function mergeProjectSchemasIntoLibrary(existing, projectSchemas) { const projectIds = new Set(projectSchemas.map(({ id }) => id)); return [...existing.filter(({ id }) => !projectIds.has(id)), ...projectSchemas]; }
//# sourceMappingURL=data-layer-specification-project.js.map