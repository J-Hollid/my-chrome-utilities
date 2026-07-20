import { createSpecificationProject, transactProject } from "./data-layer-specification-project.js";
export const PROJECT_LIBRARY_STORAGE_KEY = "my-chrome-utilities.specification-project-library.v1";
const clone = (value) => structuredClone(value);
const projectRecord = (state, revision, createdAt, lastModifiedAt, navigation) => ({ state: clone(state), revision, createdAt, lastModifiedAt, ...(navigation ? { navigation: clone(navigation) } : {}) });
const entities = (project) => Object.values(project.collections).flat();
const graphEntities = (project) => Object.values(project.documentationFlowGraphs ?? {}).flatMap((graph) => { const value = graph; return [...(value.pageFrames ?? []), ...(value.occurrences ?? []), ...(value.relationships ?? [])]; });
const validNavigation = (state, navigation) => !navigation.id || [...entities(state.project), ...graphEntities(state.project)].some(({ id }) => id === navigation.id);
export function projectLibrary(records = [], activeProjectId) {
    const projects = Object.fromEntries(records.map((record) => [record.state.project.id, clone(record)]));
    if (activeProjectId && !projects[activeProjectId])
        throw new Error(`Active project ${activeProjectId} is not in the library.`);
    return { format: "my-chrome-utilities.project-library", version: 1, ...(activeProjectId ? { activeProjectId } : {}), projects, singletonMigrated: false };
}
export function restoreProjectLibrary(serialized) { if (!serialized)
    return undefined; const parsed = JSON.parse(serialized); if (parsed.format !== "my-chrome-utilities.project-library" || parsed.version !== 1 || !parsed.projects)
    throw new Error("Unsupported project library format."); if (parsed.activeProjectId && !parsed.projects[parsed.activeProjectId])
    throw new Error("The active project is missing from the project library."); return clone(parsed); }
export function activeProjectContextChange(serialized, currentProjectId, currentRevision = 0) { const library = restoreProjectLibrary(serialized); if (!library)
    throw new Error("Project library synchronization requires persisted library state."); const active = library.activeProjectId ? library.projects[library.activeProjectId] : undefined, changed = library.activeProjectId !== currentProjectId || (active?.revision ?? 0) !== currentRevision; return { library, changed, ...(active ? { active } : {}) }; }
export function projectRecordNeedsSynchronization(record, state, revision) { return record.revision !== revision || JSON.stringify(record.state) !== JSON.stringify(state); }
export const serializeProjectLibrary = (library) => JSON.stringify(library);
export function migrateSingletonProject(existing, singleton, now = () => new Date().toISOString()) {
    if (existing) {
        const active = existing.activeProjectId ? existing.projects[existing.activeProjectId] : undefined;
        if (!singleton || !active || active.state.project.id !== singleton.state.project.id || active.revision >= singleton.revision)
            return clone(existing);
        return { ...clone(existing), projects: { ...clone(existing.projects), [singleton.state.project.id]: { ...clone(active), state: clone(singleton.state), revision: singleton.revision, lastModifiedAt: now() } } };
    }
    if (!singleton)
        return { ...projectLibrary(), singletonMigrated: true };
    const at = now(), record = projectRecord(singleton.state, singleton.revision, at, at, singleton.navigation);
    return { ...projectLibrary([record], singleton.state.project.id), singletonMigrated: true };
}
const metadataFor = (project) => ({ name: project.name, purpose: project.description, website: project.site, owner: String(project.owner ?? ""), notes: String(project.notes ?? "") });
export const projectMetadata = (library, projectId) => { const record = library.projects[projectId]; if (!record)
    throw new Error(`Unknown project ${projectId}.`); return metadataFor(record.state.project); };
const uniqueName = (library, name, exceptId) => !Object.entries(library.projects).some(([id, { state }]) => id !== exceptId && state.project.name.trim().toLowerCase() === name.trim().toLowerCase());
const checkedMetadata = (library, metadata, exceptId) => { const next = { ...metadata, name: metadata.name.trim() }; if (!next.name)
    throw new Error("Project Name is required."); if (!uniqueName(library, next.name, exceptId))
    throw new Error("Project Name must be unique in the local library."); return next; };
export function createProjectInLibrary(library, metadata, options) {
    const values = checkedMetadata(library, metadata), state = createSpecificationProject({ name: values.name, description: values.purpose, site: values.website, id: options.id });
    state.project.owner = values.owner;
    state.project.notes = values.notes;
    const at = (options.now ?? (() => new Date().toISOString()))(), record = projectRecord(state, 0, at, at);
    return { ...clone(library), activeProjectId: state.project.id, projects: { ...clone(library.projects), [state.project.id]: record } };
}
export function updateProjectMetadata(library, projectId, metadata, now = () => new Date().toISOString()) {
    const record = library.projects[projectId];
    if (!record)
        throw new Error(`Unknown project ${projectId}.`);
    const values = checkedMetadata(library, metadata, projectId), state = transactProject(record.state, "Edit project metadata", (project) => ({ ...project, name: values.name, description: values.purpose, site: values.website, owner: values.owner, notes: values.notes }));
    return { ...clone(library), projects: { ...clone(library.projects), [projectId]: { ...clone(record), state, revision: record.revision + 1, lastModifiedAt: now() } } };
}
export function saveProjectState(library, projectId, state, revision, now = () => new Date().toISOString()) { const record = library.projects[projectId]; if (!record)
    throw new Error(`Unknown project ${projectId}.`); if (state.project.id !== projectId)
    throw new Error("Project state identity does not match its library record."); return { ...clone(library), projects: { ...clone(library.projects), [projectId]: { ...clone(record), state: clone(state), revision, lastModifiedAt: now() } } }; }
export function replaceActiveProjectState(library, state, revision, now = () => new Date().toISOString()) { const activeId = library.activeProjectId; if (!activeId)
    throw new Error("No active project can receive imported project state."); if (activeId === state.project.id)
    return saveProjectState(library, activeId, state, revision, now); const record = library.projects[activeId]; if (!record)
    throw new Error(`Unknown active project ${activeId}.`); if (library.projects[state.project.id])
    throw new Error(`Project identity ${state.project.id} already exists.`); const projects = clone(library.projects), replacement = { ...clone(record), state: clone(state), revision, lastModifiedAt: now() }; delete replacement.navigation; delete replacement.pendingWrite; delete projects[activeId]; projects[state.project.id] = replacement; return { ...clone(library), activeProjectId: state.project.id, projects }; }
export function setProjectPendingWrite(library, projectId, pendingWrite) { const record = library.projects[projectId]; if (!record)
    throw new Error(`Unknown project ${projectId}.`); return { ...clone(library), projects: { ...clone(library.projects), [projectId]: { ...clone(record), pendingWrite: clone(pendingWrite) } } }; }
const commandPath = (path) => { if (!path.startsWith("/"))
    throw new Error("A replayable project command needs an absolute project path."); const tokens = path.slice(1).split("/").map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~")); if (!tokens.length || tokens.some((token) => !token || token === "__proto__" || token === "prototype" || token === "constructor") || tokens[0] === "id")
    throw new Error(`Project command path ${path} is not writable.`); return tokens; };
export function replayProjectCommand(state, pendingWrite) { const command = pendingWrite.command; if (!command || command.kind !== "set-project-value")
    throw new Error(`Pending command ${pendingWrite.label} cannot be replayed.`); const tokens = commandPath(command.path); return transactProject(state, pendingWrite.label, (project) => { const next = clone(project); let target = next; for (const token of tokens.slice(0, -1)) {
    const child = target[token];
    if (!child || typeof child !== "object" || Array.isArray(child))
        throw new Error(`Project command path ${command.path} is unavailable at ${token}.`);
    target = child;
} target[tokens.at(-1)] = clone(command.value); return next; }); }
function mergedProjectCommandApplied(pendingWrite, merged) { const tokens = commandPath(pendingWrite.command.path); let value = merged.project; for (const token of tokens) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return false;
    value = value[token];
} const undo = merged.history.undo.at(-1); return JSON.stringify(value) === JSON.stringify(pendingWrite.command.value) && undo?.label === pendingWrite.label; }
export function resolveProjectWrite(library, projectId, choice, persisted, now = () => new Date().toISOString()) { const record = library.projects[projectId]; if (!record)
    throw new Error(`Unknown project ${projectId}.`); if (!record.pendingWrite)
    throw new Error(`Project ${projectId} has no pending write to resolve.`); let next = clone(record); if (choice === "merge") {
    if (!persisted)
        throw new Error(`Merge ${record.pendingWrite.label} needs persisted project state.`);
    if (persisted.state.project.id !== projectId || persisted.revision <= record.revision)
        throw new Error(`Merged project state must advance ${projectId} beyond revision ${record.revision}.`);
    if (!mergedProjectCommandApplied(record.pendingWrite, persisted.state))
        throw new Error(`Merged project state must apply ${record.pendingWrite.label} to the latest persisted Draft.`);
    next = { ...next, state: clone(persisted.state), revision: persisted.revision, lastModifiedAt: now() };
}
else if (choice === "retry") {
    if (record.pendingWrite.baseRevision > record.revision)
        throw new Error(`Pending command base revision ${record.pendingWrite.baseRevision} is newer than project revision ${record.revision}.`);
    next = { ...next, state: replayProjectCommand(record.state, record.pendingWrite), revision: record.revision + 1, lastModifiedAt: now() };
} delete next.pendingWrite; return { ...clone(library), projects: { ...clone(library.projects), [projectId]: next } }; }
export function activateProject(library, projectId, _now = () => new Date().toISOString()) { const target = library.projects[projectId]; if (!target)
    throw new Error(`Unknown project ${projectId}.`); const current = library.activeProjectId ? library.projects[library.activeProjectId] : undefined; if (current?.pendingWrite)
    throw new Error(`A pending write blocks switching: ${current.pendingWrite.label}. Merge, reject, or retry the exact command first.`); return { ...clone(library), activeProjectId: projectId }; }
export function recordProjectNavigation(library, projectId, navigation) { const record = library.projects[projectId]; if (!record)
    throw new Error(`Unknown project ${projectId}.`); if (!validNavigation(record.state, navigation))
    throw new Error(`Navigation ${navigation.id ?? navigation.kind} is outside project ${projectId}.`); return { ...clone(library), projects: { ...clone(library.projects), [projectId]: { ...clone(record), navigation: clone(navigation) } } }; }
export function resolveProjectNavigation(library, projectId, requested) { const record = library.projects[projectId]; if (!record)
    return undefined; const candidate = requested ?? record.navigation; return candidate && validNavigation(record.state, candidate) ? clone(candidate) : undefined; }
const transientKeys = new Set(["compiledTargets", "compiledTarget", "compiledTargetsStale", "compilationCache", "cache", "uiState", "interfaceState", "liveObservations", "observations", "permissions"]);
function portable(value) { if (Array.isArray(value))
    return value.map(portable); if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).filter(([key]) => !transientKeys.has(key)).map(([key, entry]) => [key, portable(entry)])); return clone(value); }
export function exportProjectBundle(library, projectId) { const record = library.projects[projectId]; if (!record)
    throw new Error(`Unknown project ${projectId}.`); return JSON.stringify({ format: "my-chrome-utilities.project-bundle", version: 1, sourceProjectId: projectId, sourceName: record.state.project.name, draftRevision: record.revision, project: portable(record.state.project), draft: portable(record.state.draft), externalLineage: "preserved" }); }
const importBlocker = (section, message) => ({ sourceName: "Unknown", targetName: "", sourceRevision: 0, projectId: "", state: {}, entityCounts: {}, referenceIntegrity: "blocked", migrations: [], blockers: [{ section, message }] });
const targetName = (library, source) => { let candidate = source, index = 1; while (!uniqueName(library, candidate)) {
    candidate = index === 1 ? `${source} copy` : `${source} copy ${index}`;
    index += 1;
} return candidate; };
const ownedIds = (project) => { const ids = new Set(); const visit = (value, external = false) => { if (Array.isArray(value)) {
    for (const entry of value)
        visit(entry, external);
    return;
} if (!value || typeof value !== "object")
    return; for (const [key, entry] of Object.entries(value)) {
    const outside = external || key === "sourceLineage" || key === "externalLineage";
    if (key === "id" && typeof entry === "string" && !outside)
        ids.add(entry);
    visit(entry, outside);
} }; visit(project); return ids; };
function remapOwned(value, map, external = false) { if (typeof value === "string")
    return !external && map.has(value) ? map.get(value) : value; if (Array.isArray(value))
    return value.map((entry) => remapOwned(entry, map, external)); if (!value || typeof value !== "object")
    return value; return Object.fromEntries(Object.entries(value).map(([key, entry]) => { const outside = external || key === "sourceLineage" || key === "externalLineage", mappedKey = !outside && map.has(key) ? map.get(key) : key; return [mappedKey, remapOwned(entry, map, outside)]; })); }
function referenceBlockers(project) { const pages = new Set(project.collections.pages.map(({ id }) => id)), groups = new Set(project.collections.pageGroups.map(({ id }) => id)), events = new Set(project.collections.events.map(({ id }) => id)), issues = []; for (const [flowId, graph] of Object.entries(project.documentationFlowGraphs ?? {})) {
    const typed = graph;
    for (const frame of typed.pageFrames ?? []) {
        if (frame.pageId && !pages.has(String(frame.pageId)))
            issues.push({ section: `project.documentationFlowGraphs.${flowId}.pageFrames`, message: `Missing Page ${String(frame.pageId)} referenced by Flow ${flowId}; restore the missing Page and export again.` });
        if (frame.pageGroupId && !groups.has(String(frame.pageGroupId)))
            issues.push({ section: `project.documentationFlowGraphs.${flowId}.pageFrames`, message: `Missing Page Group ${String(frame.pageGroupId)} referenced by Flow ${flowId}.` });
    }
    for (const occurrence of typed.occurrences ?? [])
        if (occurrence.eventId && !events.has(String(occurrence.eventId)))
            issues.push({ section: `project.documentationFlowGraphs.${flowId}.occurrences`, message: `Missing Event ${String(occurrence.eventId)} referenced by Flow ${flowId}.` });
} return issues; }
export function stageProjectImport(serialized, library, options) {
    let parsed;
    try {
        parsed = JSON.parse(serialized);
    }
    catch {
        return importBlocker("bundle", "Choose a readable project bundle.");
    }
    if (parsed.format !== "my-chrome-utilities.project-bundle")
        return importBlocker("bundle.format", "Choose a readable project bundle.");
    if (parsed.version !== 1)
        return importBlocker("bundle.version", "Use a supported version or migrate externally.");
    if (!parsed.project || typeof parsed.project !== "object")
        return importBlocker("bundle.project", "Restore the complete project section and export again.");
    const source = clone(parsed.project), references = referenceBlockers(source);
    if (references.length)
        return { ...importBlocker(references[0].section, references[0].message), sourceName: String(parsed.sourceName ?? source.name), sourceRevision: Number(parsed.draftRevision ?? 0), blockers: references };
    const ids = ownedIds(source);
    ids.add(source.id);
    const map = new Map([...ids].map((oldId) => [oldId, options.id(oldId)])), project = remapOwned(source, map), name = targetName(library, String(parsed.sourceName ?? source.name));
    project.name = name;
    const draft = parsed.draft && typeof parsed.draft === "object" ? remapOwned(parsed.draft, map) : undefined, state = { project, ...(draft ? { draft } : {}), history: { undo: [], redo: [] } }, entityCounts = Object.fromEntries(Object.entries(project.collections).map(([kind, entries]) => [kind, entries.length]));
    return { sourceName: String(parsed.sourceName ?? source.name), targetName: name, sourceRevision: Number(parsed.draftRevision ?? 0), projectId: project.id, state, entityCounts, referenceIntegrity: "valid", migrations: [], blockers: [] };
}
export function commitProjectImport(library, staged, now = () => new Date().toISOString()) { if (staged.blockers.length)
    throw new Error("Project import is blocked."); if (library.projects[staged.projectId])
    throw new Error("Imported project identity already exists."); const at = now(), record = projectRecord(staged.state, staged.sourceRevision, at, at); return { ...clone(library), projects: { ...clone(library.projects), [staged.projectId]: record } }; }
//# sourceMappingURL=data-layer-project-library.js.map