import { createSpecificationProject } from "./data-layer-specification-project.js";
import { PROJECT_LIBRARY_STORAGE_KEY, restoreProjectLibrary, serializeProjectLibrary } from "./data-layer-project-library.js";
import { CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, restoreCanonicalProjectEnvelope, restoreCanonicalProjectState, serializeCanonicalProjectState } from "./data-layer-specification-repository.js";
import { durableDraftCommand, LEGACY_PROJECT_KEYS, migrateLegacyProjectStorage, openIndexedDbProjectRepository } from "./data-layer-durable-project-repository.js";
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function placeholder(metadata) {
    const state = createSpecificationProject({ name: metadata.name, site: metadata.site, id: (kind) => kind === "project" ? metadata.projectId : `placeholder:${kind}:${metadata.projectId}` });
    state.project.owner = metadata.owner;
    state.project.placeholder = true;
    return { state, revision: metadata.draftSequence ?? 0, publishedRevision: metadata.publishedRevision, createdAt: metadata.lastSavedAt, lastModifiedAt: metadata.lastSavedAt, ...(metadata.navigation ? { navigation: structuredClone(metadata.navigation) } : {}) };
}
function record(loaded) { return { state: structuredClone(loaded.state), revision: loaded.draftSequence, publishedRevision: loaded.publishedRevision, createdAt: loaded.lastSavedAt, lastModifiedAt: loaded.lastSavedAt, ...(loaded.navigation ? { navigation: structuredClone(loaded.navigation) } : {}) }; }
export async function createDurableProjectRuntime(repository, legacy, startup = {}) {
    const migration = await migrateLegacyProjectStorage(repository, legacy);
    const metadata = await repository.listProjectMetadata(), activeProjectId = await repository.activeProjectId(), loaded = new Map(), partialRoutes = new Map(), memory = new Map(), listeners = new Set(), schemaTokens = new Map(), projectInstalls = new Map(), locallySavingProjects = new Set(), feedInstalls = new Set(), observedProjectSequences = new Map(metadata.map(({ projectId, draftSequence }) => [projectId, draftSequence])), observedActiveTokens = new Set(), activeInstalls = new Map(), observedSchemaChanges = new Set(), projects = Object.fromEntries(metadata.map((entry) => [entry.projectId, placeholder(entry)])), library = { format: "my-chrome-utilities.project-library", version: 1, ...(activeProjectId ? { activeProjectId } : {}), projects, singletonMigrated: true };
    let currentLibrary = library, tail = Promise.resolve(), latest = tail, failed, deferredActiveContext, projectionChanged = () => { }, lastProjectionSignature = "";
    const installLoaded = (projectId, value, route) => { const pageHistory = currentLibrary.projects[projectId]?.state.history ?? loaded.get(projectId)?.state.history, next = structuredClone(value); if (pageHistory)
        next.state.history = structuredClone(pageHistory); loaded.set(projectId, next); observedProjectSequences.set(projectId, Math.max(observedProjectSequences.get(projectId) ?? -1, next.draftSequence)); if (route)
        partialRoutes.set(projectId, route);
    else
        partialRoutes.delete(projectId); currentLibrary = { ...currentLibrary, projects: { ...currentLibrary.projects, [projectId]: record(next) } }; memory.set(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(currentLibrary)); if (currentLibrary.activeProjectId === projectId)
        memory.set(CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, serializeCanonicalProjectState(next.state, next.draftSequence)); };
    if (activeProjectId) {
        const route = startup.projectId === activeProjectId ? startup.route : undefined;
        installLoaded(activeProjectId, route ? await repository.loadVisibleProjectRoute(activeProjectId, route) : await repository.loadProject(activeProjectId), route);
    }
    else
        memory.set(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(currentLibrary));
    const refreshSchemas = async () => { const records = await repository.savedSchemaRecords(); schemaTokens.clear(); for (const { schema, token } of records)
        schemaTokens.set(String(schema.id), token); memory.set(LEGACY_PROJECT_KEYS.schemas, JSON.stringify(records.map(({ schema }) => schema))); };
    if (migration.status === "review-required")
        memory.set(LEGACY_PROJECT_KEYS.schemas, legacy.getItem(LEGACY_PROJECT_KEYS.schemas) ?? "[]");
    else
        await refreshSchemas();
    const notify = (type, detail) => { if (typeof globalThis.dispatchEvent === "function" && typeof CustomEvent !== "undefined")
        globalThis.dispatchEvent(new CustomEvent(type, { detail })); };
    const enqueue = (label, operation) => { notify("durable-project-saving", { label }); const pending = tail.then(operation); latest = pending; tail = pending.catch(() => { }); void pending.then(() => { projectionChanged(); notify("durable-project-saved", { label }); }, error => notify("durable-project-save-failed", { label, error })); };
    const expandPartial = async (projectId, next) => { const route = partialRoutes.get(projectId), base = route ? await repository.loadProject(projectId) : loaded.get(projectId) ?? await repository.loadProject(projectId); if (!route)
        return { base, next }; const merged = structuredClone(base.state), { collections: nextCollections, documentationFlowGraphs, releases: nextReleases, ...nextRoot } = next.project; merged.project = { ...merged.project, ...nextRoot, collections: merged.project.collections, documentationFlowGraphs: route.includeFlowGraphs ? structuredClone(documentationFlowGraphs) : merged.project.documentationFlowGraphs, releases: route.includeReleases ? structuredClone(nextReleases) : merged.project.releases }; for (const kind of new Set([...(route.collectionKind ? [route.collectionKind] : []), ...(route.collectionKinds ?? [])])) {
        const pending = nextCollections[kind]?.filter(entity => !entity.placeholder) ?? [], current = merged.project.collections[kind] ?? [];
        if (route.entityId && kind === route.collectionKind) {
            const selected = pending.find(({ id }) => id === route.entityId), others = pending.filter(({ id }) => id !== route.entityId && !current.some(entity => entity.id === id)), withoutSelected = current.filter(entity => entity.id !== route.entityId);
            merged.project.collections[kind] = [...withoutSelected, ...(selected ? [structuredClone(selected)] : []), ...structuredClone(others)];
        }
        else
            merged.project.collections[kind] = structuredClone(pending);
    } if (next.draft)
        merged.draft = structuredClone(next.draft);
    else
        delete merged.draft; merged.history = structuredClone(next.history); return { base, next: merged }; };
    const persistState = async (projectId, pending, label, retrying = false) => { if (failed && !retrying)
        throw failed.error; const expanded = await expandPartial(projectId, pending), base = expanded.base, next = expanded.next; if (same(base.state.project, next.project) && same(base.state.draft, next.draft))
        return; const command = durableDraftCommand(base, next, { commandId: `projection:${crypto.randomUUID()}`, label: label ?? next.history.undo.at(-1)?.label ?? "Project edit" }), route = partialRoutes.get(projectId); locallySavingProjects.add(projectId); try {
        const result = await repository.saveDraft(command);
        if (result.status === "conflict")
            throw new DOMException(`${result.label} conflicts at ${result.conflictingFields.join(", ")}.`, "AbortError");
        failed = undefined;
        installLoaded(projectId, await repository.loadProject(projectId));
        const installed = loaded.get(projectId);
        if (installed) {
            installed.state.history = structuredClone(next.history);
            installLoaded(projectId, installed, route);
        }
    }
    catch (error) {
        failed = { projectId, projectName: next.project.name, state: structuredClone(next), command, error };
        throw error;
    }
    finally {
        locallySavingProjects.delete(projectId);
    } };
    const forceLoad = async (projectId) => installLoaded(projectId, await repository.loadProject(projectId));
    const refreshMetadata = async (projectId) => { const metadata = (await repository.listProjectMetadata()).find(entry => entry.projectId === projectId); if (!metadata)
        return; if (!loaded.has(projectId))
        currentLibrary = { ...currentLibrary, projects: { ...currentLibrary.projects, [projectId]: placeholder(metadata) } }; memory.set(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(currentLibrary)); projectionChanged(); };
    const loadNow = async (projectId) => { if (!loaded.has(projectId))
        await forceLoad(projectId); };
    const storage = { getItem: key => memory.get(key) ?? null, setItem(key, value) { if (key !== PROJECT_LIBRARY_STORAGE_KEY && key !== CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY && key !== LEGACY_PROJECT_KEYS.schemas) {
            legacy.setItem(key, value);
            return;
        } if (key === PROJECT_LIBRARY_STORAGE_KEY) {
            const supplied = restoreProjectLibrary(value);
            if (!supplied)
                return;
            const prior = currentLibrary, next = { ...supplied, projects: { ...prior.projects, ...supplied.projects } };
            if (same(prior, next))
                return;
            currentLibrary = next;
            memory.set(key, serializeProjectLibrary(next));
            enqueue("Save project library command", async () => { for (const [projectId, entry] of Object.entries(supplied.projects)) {
                const priorEntry = prior.projects[projectId];
                if (!priorEntry) {
                    if (next.activeProjectId === projectId) {
                        await repository.putProject(entry.state, { draftSequence: entry.revision, active: true, ...(entry.navigation ? { navigation: entry.navigation } : {}) });
                        installLoaded(projectId, await repository.loadProject(projectId));
                    }
                    else {
                        await repository.putProjectMetadataOnly(entry.state, { draftSequence: entry.revision, active: false, ...(entry.navigation ? { navigation: entry.navigation } : {}) });
                        await refreshMetadata(projectId);
                    }
                    continue;
                }
                if (loaded.has(projectId) && !same(priorEntry.state, entry.state))
                    await persistState(projectId, entry.state);
                if (!same(priorEntry.navigation, entry.navigation))
                    await repository.setProjectNavigation(projectId, entry.navigation);
            } if (next.activeProjectId && next.activeProjectId !== prior.activeProjectId) {
                const notification = await repository.setActiveProject(next.activeProjectId), install = activeInstalls.get(notification.token);
                if (install)
                    await install;
            } });
        }
        else if (key === CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY) {
            const envelope = restoreCanonicalProjectEnvelope(value), state = restoreCanonicalProjectState(value), prior = memory.get(key);
            if (prior === value)
                return;
            memory.set(key, value);
            if (state) {
                const label = envelope?.commands.at(-1)?.label ?? "Save project Draft";
                enqueue(label, () => persistState(state.project.id, state, label));
            }
        }
        else {
            const schemas = JSON.parse(value), prior = JSON.parse(memory.get(key) ?? "[]"), priorById = new Map(prior.map(schema => [String(schema.id), schema])), nextById = new Map(schemas.map(schema => [String(schema.id), schema])), upserts = schemas.filter(schema => !same(priorById.get(String(schema.id)), schema)).map(schema => { const baseToken = schemaTokens.get(String(schema.id)); return { schema, ...(baseToken ? { baseToken } : {}) }; }), deletes = prior.filter(schema => !nextById.has(String(schema.id))).flatMap(schema => { const schemaId = String(schema.id), baseToken = schemaTokens.get(schemaId); return baseToken ? [{ schemaId, baseToken }] : []; });
            if (!upserts.length && !deletes.length)
                return;
            enqueue("Commit reviewed saved-schema changes", async () => { try {
                const result = await repository.applySavedSchemaBatch({ upserts, deletes, label: "Commit reviewed saved-schema changes" });
                if (result.status === "conflict")
                    throw new DOMException(`Saved schema ${result.schemaId} changed in another surface; reload before applying this reviewed action.`, "AbortError");
                await refreshSchemas();
            }
            catch (error) {
                await refreshSchemas();
                throw error;
            } });
        } }, removeItem(key) { if (key === PROJECT_LIBRARY_STORAGE_KEY || key === CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY) {
            memory.delete(key);
            return;
        } if (key === LEGACY_PROJECT_KEYS.schemas)
            return; legacy.removeItem(key); } };
    const ensureProject = async (projectId) => { await latest; if (partialRoutes.has(projectId))
        await forceLoad(projectId);
    else
        await loadNow(projectId); projectionChanged(); };
    const ensureProjectRoute = async (projectId, route) => { await latest; const value = await repository.loadVisibleProjectRoute(projectId, route); installLoaded(projectId, value, route); projectionChanged(); return value; };
    const refreshProject = async (projectId) => { await latest; await forceLoad(projectId); projectionChanged(); };
    projectionChanged = () => { const active = currentLibrary.activeProjectId ? loaded.get(currentLibrary.activeProjectId) : undefined, signature = JSON.stringify([currentLibrary.activeProjectId, active?.draftToken, serializeProjectLibrary(currentLibrary), memory.get(LEGACY_PROJECT_KEYS.schemas)]); if (signature === lastProjectionSignature)
        return; lastProjectionSignature = signature; const projection = { library: structuredClone(currentLibrary), ...(active ? { active: structuredClone(active) } : {}) }; notify("durable-project-projection-changed", projection); for (const listener of listeners)
        listener(structuredClone(projection)); };
    const trackFeed = (promise) => { feedInstalls.add(promise); void promise.finally(() => feedInstalls.delete(promise)); return promise; }, synchronize = (projectId, draftToken, draftSequence) => { if (!draftToken || draftSequence === undefined)
        return; const installedSequence = observedProjectSequences.get(projectId) ?? -1; if (draftSequence <= installedSequence)
        return; observedProjectSequences.set(projectId, draftSequence); const identity = `${projectId}:${draftSequence}`; if (locallySavingProjects.has(projectId))
        return; if (projectInstalls.has(identity))
        return; const route = partialRoutes.get(projectId), active = currentLibrary.activeProjectId === projectId, install = trackFeed(!loaded.has(projectId) && !active ? refreshMetadata(projectId) : route ? repository.loadVisibleProjectRoute(projectId, route).then(value => { installLoaded(projectId, value, route); projectionChanged(); }) : forceLoad(projectId).then(projectionChanged)); projectInstalls.set(identity, install); void install.finally(() => projectInstalls.delete(identity)); }, installMetadata = (change) => { const identity = `metadata:${change.changeToken}`; if (observedSchemaChanges.has(identity))
        return; observedSchemaChanges.add(identity); trackFeed(refreshMetadata(change.projectId)); }, installActive = (notification) => { if (failed) {
        deferredActiveContext = notification;
        return;
    } if (observedActiveTokens.has(notification.token))
        return activeInstalls.get(notification.token); observedActiveTokens.add(notification.token); const install = trackFeed((loaded.has(notification.projectId) && partialRoutes.has(notification.projectId) ? Promise.resolve() : forceLoad(notification.projectId)).then(() => { currentLibrary = { ...currentLibrary, activeProjectId: notification.projectId }; memory.set(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(currentLibrary)); const active = loaded.get(notification.projectId); if (active)
        memory.set(CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, serializeCanonicalProjectState(active.state, active.draftSequence)); projectionChanged(); })); activeInstalls.set(notification.token, install); void install.finally(() => activeInstalls.delete(notification.token)); return install; }, installSchemaChange = (change) => { const identity = `${change.schemaId}:${change.token}`; if (observedSchemaChanges.has(identity))
        return; observedSchemaChanges.add(identity); trackFeed(refreshSchemas().then(projectionChanged)); };
    repository.subscribe(({ projectId, draftToken, draftSequence }) => synchronize(projectId, draftToken, draftSequence));
    repository.subscribeProjectMetadata(installMetadata);
    repository.subscribeActiveContext(notification => void installActive(notification));
    repository.subscribeSavedSchemas(installSchemaChange);
    if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("my-chrome-utilities.durable-project-changes");
        channel.addEventListener("message", (event) => { const message = event.data; if (message?.projectId)
            synchronize(message.projectId, message.draftToken, message.draftSequence); });
        channel.unref?.();
        const metadataChannel = new BroadcastChannel("my-chrome-utilities.durable-project-metadata");
        metadataChannel.addEventListener("message", (event) => { const message = event.data; if (message.projectId && message.changeToken)
            installMetadata({ projectId: message.projectId, changeToken: message.changeToken }); });
        metadataChannel.unref?.();
        const activeChannel = new BroadcastChannel("my-chrome-utilities.durable-active-context");
        activeChannel.addEventListener("message", (event) => { const message = event.data; if (message.projectId && message.token)
            void installActive({ projectId: message.projectId, token: message.token }); });
        activeChannel.unref?.();
        const schemaChannel = new BroadcastChannel("my-chrome-utilities.durable-saved-schemas");
        schemaChannel.addEventListener("message", (event) => { const message = event.data; if (message.schemaId && message.token)
            installSchemaChange({ schemaId: message.schemaId, token: message.token }); });
        schemaChannel.unref?.();
    }
    const resolveMigration = async (choice) => { const result = await migrateLegacyProjectStorage(repository, legacy, { choice }); if (result.status !== "migrated")
        throw new Error("Migration source choice did not commit."); };
    const retryFailedSave = async () => { const pending = failed; if (!pending)
        throw new Error("There is no failed durable Draft to retry."); loaded.delete(pending.projectId); enqueue(`Retry ${pending.command.label}`, () => persistState(pending.projectId, pending.state, pending.command.label, true)); await latest; const deferred = deferredActiveContext; deferredActiveContext = undefined; if (deferred)
        await installActive(deferred); };
    const exportUnsavedDraft = () => { if (!failed)
        throw new Error("There is no failed durable Draft to export."); return JSON.stringify({ format: "my-chrome-utilities.unsaved-durable-project", version: 1, projectId: failed.projectId, command: { id: failed.command.commandId, label: failed.command.label, baseToken: failed.command.baseToken }, project: failed.state.project, draft: failed.state.draft }); };
    const settled = async () => { await latest; while (feedInstalls.size)
        await Promise.all([...feedInstalls]); };
    return { repository, storage, ensureProject, ensureProjectRoute, refreshProject, settled, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }, failedSave: () => failed ? structuredClone(failed) : undefined, retryFailedSave, exportUnsavedDraft, resolveMigration, migration };
}
export async function openDurableProjectRuntime(legacy, factory = globalThis.indexedDB, startup = {}) { return createDurableProjectRuntime(await openIndexedDbProjectRepository(factory), legacy, startup); }
//# sourceMappingURL=data-layer-durable-project-runtime.js.map