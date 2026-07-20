import { createCanonicalSchema } from "./data-layer-canonical-schema.js";
import { addProjectEntity, transactProject } from "./data-layer-specification-project.js";
export const projectCollectionDefinitions = {
    profiles: { kind: "profiles", overview: "Shared Profiles", singular: "Shared Profile", addAction: "Add Shared Profile", purpose: "reusable schema rules and documentation", example: "Sitewide", prerequisites: ["project Draft"], consumers: ["Pages", "Page Groups", "Events", "Flows"] },
    pageGroups: { kind: "pageGroups", overview: "Page Groups", singular: "Page Group", addAction: "Add Page Group", purpose: "shared Page context and inherited requirements", example: "Checkout", prerequisites: ["optional Shared Profiles"], consumers: ["Pages", "Flow lanes"] },
    pages: { kind: "pages", overview: "Pages", singular: "Page", addAction: "Add Page", purpose: "observable Page context and specific requirements", example: "Cart", prerequisites: ["optional Page Groups"], consumers: ["Flows", "Fixtures"] },
    events: { kind: "events", overview: "Events", singular: "Event", addAction: "Add Event", purpose: "reusable interaction or context-setting event", example: "Purchase", prerequisites: ["optional Schemas"], consumers: ["Flows", "Assignments", "Fixtures"] },
    applicabilitySets: { kind: "applicabilitySets", overview: "Applicability", singular: "Applicability Set", addAction: "Add Applicability Set", purpose: "named observation matching and assignment eligibility", example: "Retail checkout", prerequisites: ["observable context fields"], consumers: ["Pages", "Events", "Assignments"] },
    flows: { kind: "flows", overview: "Flows", singular: "Flow", addAction: "Add Flow", purpose: "documentary journey topology", example: "Checkout journey", prerequisites: ["Pages", "Events"], consumers: ["documentation", "Fixtures"] },
    fixtures: { kind: "fixtures", overview: "Fixtures", singular: "Fixture", addAction: "Add Fixture", purpose: "saved per-Event validation evidence", example: "Valid purchase", prerequisites: ["Events", "optional Flows"], consumers: ["preflight", "release evidence"] },
    schemaDrafts: { kind: "schemaDrafts", overview: "Schemas", singular: "Schema", addAction: "Add Schema", purpose: "canonical payload definition and Draft lineage", example: "Purchase payload", prerequisites: ["project Draft"], consumers: ["Events", "Assignments"] },
    assignments: { kind: "assignments", overview: "Assignments", singular: "Assignment", addAction: "Add Assignment", purpose: "production schema selection for matching observations", example: "Retail Purchase", prerequisites: ["Schema", "Event", "Applicability Set"], consumers: ["production evaluator"] },
};
export const projectCollectionCreationFields = {
    profiles: [{ key: "description", label: "Profile purpose", control: "textarea" }],
    pageGroups: [{ key: "matcher", label: "Membership matcher" }],
    pages: [{ key: "pathname", label: "Path matcher" }, { key: "pageGroupIds", label: "Page Groups", control: "select", collection: "pageGroups", multiple: true }],
    events: [{ key: "eventName", label: "Canonical event name" }, { key: "role", label: "Documentary role", control: "select", options: [{ value: "interaction", label: "Interaction" }, { value: "context-setting", label: "Context-setting" }], defaultValue: "interaction" }],
    applicabilitySets: [{ key: "priority", label: "Priority", control: "number", defaultValue: 0 }, { key: "fallback", label: "Fallback", control: "checkbox", defaultValue: false }],
    flows: [{ key: "correlationField", label: "Correlation field" }],
    fixtures: [{ key: "mode", label: "Fixture mode", control: "select", options: [{ value: "event", label: "Event" }, { value: "flow", label: "Flow" }], defaultValue: "event" }, { key: "eventId", label: "Event", control: "select", collection: "events" }, { key: "pageId", label: "Page", control: "select", collection: "pages" }, { key: "flowId", label: "Flow", control: "select", collection: "flows" }, { key: "releasePolicy", label: "Release policy", control: "select", options: [{ value: "required", label: "Required" }, { value: "optional", label: "Optional" }], defaultValue: "required" }],
    schemaDrafts: [{ key: "description", label: "Schema description", control: "textarea" }],
    assignments: [{ key: "schemaDraftId", label: "Schema", control: "select", collection: "schemaDrafts" }, { key: "eventId", label: "Event", control: "select", collection: "events" }, { key: "applicabilitySetId", label: "Applicability Set", control: "select", collection: "applicabilitySets" }, { key: "priority", label: "Priority", control: "number", defaultValue: 10 }, { key: "versionPolicy", label: "Version policy", control: "select", options: [{ value: "follow latest", label: "Follow latest" }, { value: "pinned", label: "Pinned" }], defaultValue: "follow latest" }],
};
export function hasSavedSchemaAdoptionActions(kind, selectedId) { return kind === "profiles" && !selectedId; }
export function projectCollectionOverviewActionLabels(kind) { return [projectCollectionDefinitions[kind].addAction]; }
export function projectInspectorTogglePresentation(open) { return { label: open ? "Hide Inspector" : "Show Inspector", expanded: open ? "true" : "false" }; }
export function projectCollectionCreationRoute(kind) { const definition = projectCollectionDefinitions[kind]; return { kind, heading: `Create ${definition.singular}`, label: `Create ${definition.singular} for ${definition.overview}`, backAction: `Back to ${definition.overview}` }; }
export function projectEntityWorkspaceRoute(kind, entityId, name) { const definition = projectCollectionDefinitions[kind]; return { kind, entityId, heading: `${definition.singular}: ${name}`, label: `${definition.singular} workspace for ${name}`, backAction: `Back to ${definition.overview}` }; }
const containsIdentity = (value, identity) => { if (value === identity)
    return true; if (Array.isArray(value))
    return value.some((entry) => containsIdentity(entry, identity)); if (value && typeof value === "object")
    return Object.values(value).some((entry) => containsIdentity(entry, identity)); return false; };
export function projectEntityDependencies(project, kind, identity) { const dependencies = []; for (const [collection, entities] of Object.entries(project.collections))
    for (const entity of entities)
        if (entity.id !== identity && containsIdentity(entity, identity))
            dependencies.push({ kind: collection, id: entity.id, name: entity.name, relationship: `${projectCollectionDefinitions[collection].singular} ${entity.name} references ${projectCollectionDefinitions[kind].singular}` }); for (const [flowId, graph] of Object.entries(project.documentationFlowGraphs ?? {})) {
    if (!containsIdentity(graph, identity))
        continue;
    const flow = project.collections.flows.find(({ id }) => id === flowId);
    if (!dependencies.some(({ id }) => id === flowId))
        dependencies.push({ kind: "flowGraph", id: flowId, name: flow?.name ?? flowId, relationship: `Flow ${flow?.name ?? flowId} topology references ${projectCollectionDefinitions[kind].singular}` });
} return dependencies; }
export function inspectProjectEntityRemoval(state, kind, identity) { const entity = state.project.collections[kind].find(({ id }) => id === identity); if (!entity)
    throw new Error(`Unknown ${projectCollectionDefinitions[kind].singular} ${identity}.`); const dependencies = projectEntityDependencies(state.project, kind, identity); return { kind, id: identity, name: entity.name, dependencies, blocked: Boolean(dependencies.length), summary: `${entity.name} · one ${projectCollectionDefinitions[kind].singular} removal · ${dependencies.length} dependent reference${dependencies.length === 1 ? "" : "s"} · project remains Draft and evidence becomes stale.` }; }
export function removeProjectCollectionEntity(state, kind, identity) { const review = inspectProjectEntityRemoval(state, kind, identity); if (review.blocked)
    throw new Error(`Remove ${review.name} is blocked by ${review.dependencies.map(({ name }) => name).join(", ")}.`); return transactProject(state, `Remove ${review.name}`, (project) => ({ ...project, collections: { ...project.collections, [kind]: project.collections[kind].filter(({ id }) => id !== identity) } })); }
const firstId = (project, kind) => project.collections[kind][0]?.id;
function projectCreationAttributes(state, kind, values) { const attributes = {}; for (const field of projectCollectionCreationFields[kind]) {
    const value = values[field.key];
    if (value === undefined)
        continue;
    if (field.multiple) {
        const identities = Array.isArray(value) ? value.map(String).filter(Boolean) : [];
        if (field.collection) {
            const known = new Set(state.project.collections[field.collection].map(({ id }) => id));
            if (identities.some((identity) => !known.has(identity)))
                throw new Error(`${field.label} contains an unknown project reference.`);
        }
        attributes[field.key] = identities;
        continue;
    }
    if (field.control === "checkbox") {
        attributes[field.key] = Boolean(value);
        continue;
    }
    if (field.control === "number") {
        const numeric = Number(value);
        if (!Number.isFinite(numeric))
            throw new Error(`${field.label} must be a number.`);
        attributes[field.key] = numeric;
        continue;
    }
    const text = String(value).trim();
    if (!text)
        continue;
    if (field.collection && !state.project.collections[field.collection].some(({ id }) => id === text))
        throw new Error(`${field.label} does not exist in this project.`);
    if (field.options && !field.options.some(({ value: option }) => option === text))
        throw new Error(`${field.label} has an unsupported value.`);
    attributes[field.key] = text;
} if (kind === "assignments") {
    if (typeof attributes.schemaDraftId === "string")
        attributes.schemaId = attributes.schemaDraftId;
    if (typeof attributes.eventId === "string") {
        const selectedEvent = state.project.collections.events.find(({ id }) => id === attributes.eventId);
        attributes.eventName = selectedEvent?.eventName ?? selectedEvent?.name;
    }
} return attributes; }
export function createProjectCollectionEntity(state, kind, name, id, values = {}) { const clean = name.trim(); if (!clean)
    throw new Error(`${projectCollectionDefinitions[kind].singular} name is required.`); if (state.project.collections[kind].some((entity) => entity.name.toLowerCase() === clean.toLowerCase()))
    throw new Error(`${projectCollectionDefinitions[kind].singular} name must be unique in this project.`); const event = state.project.collections.events[0], eventId = event?.id, pageId = firstId(state.project, "pages"), flowId = firstId(state.project, "flows"), schemaId = firstId(state.project, "schemaDrafts"), applicabilitySetId = firstId(state.project, "applicabilitySets"), attributes = projectCreationAttributes(state, kind, values), defaults = { profiles: { requirements: [], canonicalSchema: createCanonicalSchema({ id: id("canonical-schema"), contributorId: "", contributorName: clean }) }, pageGroups: { pageIds: [] }, pages: { pageGroupIds: [] }, events: { eventName: clean.toLowerCase().replace(/[^a-z0-9]+/g, "_"), sourceId: "event-history", target: "payload", role: "interaction", ...(schemaId ? { schemaDraftId: schemaId } : {}) }, applicabilitySets: { priority: 0, condition: { kind: "all", conditions: [] } }, flows: { steps: [] }, fixtures: { mode: "event", observations: [], expected: {}, releasePolicy: "required", ...(eventId ? { eventId } : {}), ...(pageId ? { pageId } : {}), ...(flowId ? { flowId } : {}) }, schemaDrafts: { published: false, version: 0, document: { type: "object", properties: {} }, workingDraft: { document: { type: "object", properties: {} }, pendingChanges: [] }, canonicalSchema: createCanonicalSchema({ id: id("canonical-schema"), contributorId: "", contributorName: clean }) }, assignments: { ...(schemaId ? { schemaDraftId: schemaId, schemaId } : {}), ...(eventId ? { eventId, eventName: event?.eventName ?? event?.name } : {}), ...(applicabilitySetId ? { applicabilitySetId } : {}), sourceId: "event-history", target: "payload", priority: 10, versionPolicy: "follow latest" } }; return addProjectEntity(state, kind, { name: clean, ...defaults[kind], ...attributes }, id); }
//# sourceMappingURL=data-layer-project-entity-lifecycle.js.map