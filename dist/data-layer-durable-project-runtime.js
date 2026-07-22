import { createSpecificationProject } from "./data-layer-specification-project.js";
import { PROJECT_LIBRARY_STORAGE_KEY, restoreProjectLibrary, serializeProjectLibrary } from "./data-layer-project-library.js";
import { CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, restoreCanonicalProjectEnvelope, restoreCanonicalProjectState, serializeCanonicalProjectState } from "./data-layer-specification-repository.js";
import { createPageProjectHistory, durableConflictSemanticField, durableDraftCommand, durablePatchField, durableProjectRouteForWorkspace, DurablePageHistoryConflict, LEGACY_PROJECT_KEYS, migrateLegacyProjectStorage, openIndexedDbProjectRepository } from "./data-layer-durable-project-repository.js";
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const cleanState = (state) => ({ ...structuredClone(state), history: { undo: [], redo: [] } });
const historyLabel = (state) => state.history.undo.at(-1)?.label;
const cleanRecord = (value) => ({ ...structuredClone(value), state: cleanState(value.state) });
const cleanLibrary = (value) => ({ ...structuredClone(value), projects: Object.fromEntries(Object.entries(value.projects).map(([projectId, entry]) => [projectId, cleanRecord(entry)])) });
function placeholder(metadata) {
    const state = createSpecificationProject({ name: metadata.name, site: metadata.site, id: (kind) => kind === "project" ? metadata.projectId : `placeholder:${kind}:${metadata.projectId}` });
    state.project.owner = metadata.owner;
    state.project.placeholder = true;
    return { state: cleanState(state), revision: metadata.draftSequence ?? 0, publishedRevision: metadata.publishedRevision, createdAt: metadata.lastSavedAt, lastModifiedAt: metadata.lastSavedAt, ...(metadata.navigation ? { navigation: structuredClone(metadata.navigation) } : {}) };
}
function record(loaded) { return { state: cleanState(loaded.state), revision: loaded.draftSequence, publishedRevision: loaded.publishedRevision, createdAt: loaded.lastSavedAt, lastModifiedAt: loaded.lastSavedAt, ...(loaded.navigation ? { navigation: structuredClone(loaded.navigation) } : {}) }; }
export async function createDurableProjectRuntime(repository, legacy, startup = {}) {
    const migration = await migrateLegacyProjectStorage(repository, legacy);
    const metadata = await repository.listProjectMetadata(), activeProjectId = await repository.activeProjectId(), loaded = new Map(), partialRoutes = new Map(), memory = new Map(), listeners = new Set(), schemaTokens = new Map(), projectInstalls = new Map(), locallySavingProjects = new Set(), feedInstalls = new Set(), observedProjectSequences = new Map(metadata.map(({ projectId, draftSequence }) => [projectId, draftSequence])), observedActiveTokens = new Set(), activeInstalls = new Map(), observedSchemaChanges = new Set(), pageHistories = new Map(), pendingCanonicalRevisions = new Map(), projects = Object.fromEntries(metadata.map((entry) => [entry.projectId, placeholder(entry)])), library = { format: "my-chrome-utilities.project-library", version: 1, ...(activeProjectId ? { activeProjectId } : {}), projects, singletonMigrated: true };
    let currentLibrary = library, tail = Promise.resolve(), latest = tail, failed, failedSchema, deferredActiveContext, projectionChanged = (_force = false) => { }, lastProjectionSignature = "";
    const pageHistory = (projectId) => { let value = pageHistories.get(projectId); if (!value) {
        value = createPageProjectHistory();
        pageHistories.set(projectId, value);
    } return value; };
    const installLoaded = (projectId, value, route) => { const next = { ...structuredClone(value), state: cleanState(value.state) }; loaded.set(projectId, next); observedProjectSequences.set(projectId, Math.max(observedProjectSequences.get(projectId) ?? -1, next.draftSequence)); if (route)
        partialRoutes.set(projectId, route);
    else
        partialRoutes.delete(projectId); currentLibrary = { ...currentLibrary, projects: { ...currentLibrary.projects, [projectId]: record(next) } }; memory.set(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(currentLibrary)); if (currentLibrary.activeProjectId === projectId)
        memory.set(CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, serializeCanonicalProjectState(next.state, next.draftSequence)); };
    if (activeProjectId && startup.projectId === activeProjectId) {
        const activeMetadata = metadata.find(({ projectId }) => projectId === activeProjectId), route = startup.route ?? (activeMetadata?.navigation ? durableProjectRouteForWorkspace(activeMetadata.navigation.kind, activeMetadata.navigation.id) : {});
        installLoaded(activeProjectId, await repository.loadVisibleProjectRoute(activeProjectId, route), route);
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
    const expandPartial = async (projectId, pending) => { const route = partialRoutes.get(projectId), installed = loaded.get(projectId), latest = route ? await repository.loadProject(projectId) : installed ?? await repository.loadProject(projectId), base = route && installed ? { ...latest, draftToken: installed.draftToken, draftSequence: installed.draftSequence } : latest, next = cleanState(pending); if (!route)
        return { base, next }; const merged = cleanState(latest.state), { collections: nextCollections, documentationFlowGraphs, releases: nextReleases, ...nextRoot } = next.project; merged.project = { ...merged.project, ...nextRoot, collections: merged.project.collections, documentationFlowGraphs: route.includeFlowGraphs ? structuredClone(documentationFlowGraphs) : merged.project.documentationFlowGraphs, releases: route.includeReleases ? structuredClone(nextReleases) : merged.project.releases }; for (const kind of new Set([...(route.collectionKind ? [route.collectionKind] : []), ...(route.collectionKinds ?? [])])) {
        const pendingEntries = nextCollections[kind]?.filter(entity => !entity.placeholder) ?? [], current = merged.project.collections[kind] ?? [];
        if (route.entityId && kind === route.collectionKind) {
            const selected = pendingEntries.find(({ id }) => id === route.entityId), others = pendingEntries.filter(({ id }) => id !== route.entityId && !current.some(entity => entity.id === id)), withoutSelected = current.filter(entity => entity.id !== route.entityId);
            merged.project.collections[kind] = [...withoutSelected, ...(selected ? [structuredClone(selected)] : []), ...structuredClone(others)];
        }
        else
            merged.project.collections[kind] = structuredClone(pendingEntries);
    } if (next.draft)
        merged.draft = structuredClone(next.draft);
    else
        delete merged.draft; return { base, next: merged }; };
    const installCurrent = async (projectId, route) => installLoaded(projectId, route ? await repository.loadVisibleProjectRoute(projectId, route) : await repository.loadProject(projectId), route);
    const commitSchemaBatch = async (batch, retrying = false) => { if (failedSchema && !retrying)
        throw failedSchema.error; try {
        const result = await repository.applySavedSchemaBatch({ upserts: batch.upserts, deletes: batch.deletes, label: batch.label });
        if (result.status === "conflict") {
            const error = new DOMException(`${batch.label} conflicts for ${batch.names.join(", ")}: base token ${result.baseToken ?? "new schema"}, current token ${result.currentToken}. The durable Saved Schema Library is unchanged.`, "AbortError");
            failedSchema = { kind: "saved-schema", batch: structuredClone(batch), error, conflict: structuredClone(result) };
            throw error;
        }
        failedSchema = undefined;
        await refreshSchemas();
    }
    catch (error) {
        if (!failedSchema)
            failedSchema = { kind: "saved-schema", batch: structuredClone(batch), error };
        await refreshSchemas();
        projectionChanged();
        throw error;
    } };
    const persistState = async (projectId, pending, label = "Project edit", retrying = false, recordHistory = true) => { if (failed && !retrying)
        throw failed.error; const expanded = await expandPartial(projectId, pending), base = expanded.base, next = expanded.next; if (same(base.state.project, next.project) && same(base.state.draft, next.draft))
        return; const command = durableDraftCommand(base, next, { commandId: `projection:${crypto.randomUUID()}`, label }), route = partialRoutes.get(projectId); locallySavingProjects.add(projectId); try {
        const result = await repository.saveDraft(command);
        if (result.status === "conflict") {
            const error = new DOMException(`${result.label} conflicts at ${result.conflictingFields.join(", ")}.`, "AbortError");
            failed = { projectId, projectName: next.project.name, state: structuredClone(next), command, error, conflict: structuredClone(result) };
            throw error;
        }
        failed = undefined;
        if (recordHistory)
            pageHistory(projectId).push(command);
        await installCurrent(projectId, route);
    }
    catch (error) {
        if (!failed)
            failed = { projectId, projectName: next.project.name, state: structuredClone(next), command, error };
        throw error;
    }
    finally {
        locallySavingProjects.delete(projectId);
    } };
    const forceLoad = async (projectId) => installLoaded(projectId, await repository.loadProject(projectId));
    const refreshMetadata = async (projectId) => { const entry = (await repository.listProjectMetadata()).find(candidate => candidate.projectId === projectId); if (!entry)
        return; const open = loaded.get(projectId); if (open) {
        if (entry.navigation)
            open.navigation = structuredClone(entry.navigation);
        else
            delete open.navigation;
        currentLibrary = { ...currentLibrary, projects: { ...currentLibrary.projects, [projectId]: record(open) } };
    }
    else
        currentLibrary = { ...currentLibrary, projects: { ...currentLibrary.projects, [projectId]: placeholder(entry) } }; memory.set(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(currentLibrary)); projectionChanged(); };
    const loadNow = async (projectId) => { if (!loaded.has(projectId))
        await forceLoad(projectId); };
    const storage = { getItem: key => memory.get(key) ?? null, setItem(key, value) { if (key !== PROJECT_LIBRARY_STORAGE_KEY && key !== CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY && key !== LEGACY_PROJECT_KEYS.schemas) {
            legacy.setItem(key, value);
            return;
        } if (key === PROJECT_LIBRARY_STORAGE_KEY) {
            const suppliedRaw = restoreProjectLibrary(value);
            if (!suppliedRaw)
                return;
            const labels = new Map(Object.entries(suppliedRaw.projects).map(([projectId, entry]) => [projectId, historyLabel(entry.state) ?? "Save project library command"])), supplied = cleanLibrary(suppliedRaw), prior = currentLibrary, next = { ...supplied, projects: { ...prior.projects, ...supplied.projects } }, canonicalCompanions = new Set(Object.entries(supplied.projects).filter(([projectId, entry]) => pendingCanonicalRevisions.get(projectId) === entry.revision).map(([projectId]) => projectId));
            if (same(prior, next))
                return;
            if (prior.activeProjectId !== next.activeProjectId)
                pageHistories.clear();
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
                if (!canonicalCompanions.has(projectId) && loaded.has(projectId) && (!same(priorEntry.state.project, entry.state.project) || !same(priorEntry.state.draft, entry.state.draft)))
                    await persistState(projectId, entry.state, labels.get(projectId));
                if (!same(priorEntry.navigation, entry.navigation))
                    await repository.setProjectNavigation(projectId, entry.navigation);
            } if (next.activeProjectId && next.activeProjectId !== prior.activeProjectId) {
                const notification = await repository.setActiveProject(next.activeProjectId), install = activeInstalls.get(notification.token);
                if (install)
                    await install;
            } });
        }
        else if (key === CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY) {
            const envelope = restoreCanonicalProjectEnvelope(value), raw = restoreCanonicalProjectState(value), prior = memory.get(key);
            if (prior === value)
                return;
            const state = raw ? cleanState(raw) : undefined, revision = envelope?.revision ?? 0;
            memory.set(key, state ? serializeCanonicalProjectState(state, revision) : value);
            if (state) {
                const label = envelope?.commands.at(-1)?.label ?? historyLabel(raw) ?? "Save project Draft";
                pendingCanonicalRevisions.set(state.project.id, revision);
                enqueue(label, async () => { try {
                    await persistState(state.project.id, state, label);
                }
                finally {
                    if (pendingCanonicalRevisions.get(state.project.id) === revision)
                        pendingCanonicalRevisions.delete(state.project.id);
                } });
            }
        }
        else {
            if (failedSchema)
                throw failedSchema.error;
            const schemas = JSON.parse(value), prior = JSON.parse(memory.get(key) ?? "[]"), priorById = new Map(prior.map(schema => [String(schema.id), schema])), nextById = new Map(schemas.map(schema => [String(schema.id), schema])), upserts = schemas.filter(schema => !same(priorById.get(String(schema.id)), schema)).map(schema => { const baseToken = schemaTokens.get(String(schema.id)); return { schema, ...(baseToken ? { baseToken } : {}) }; }), deletes = prior.filter(schema => !nextById.has(String(schema.id))).flatMap(schema => { const schemaId = String(schema.id), baseToken = schemaTokens.get(schemaId); return baseToken ? [{ schemaId, baseToken }] : []; });
            if (!upserts.length && !deletes.length)
                return;
            const names = [...upserts.map(({ schema }) => String(schema.name ?? schema.id)), ...deletes.map(({ schemaId }) => String(priorById.get(schemaId)?.name ?? schemaId))], batch = { schemas: structuredClone(schemas), upserts: structuredClone(upserts), deletes: structuredClone(deletes), label: `Save ${names.join(", ")} in the Saved Schema Library`, names };
            memory.set(key, value);
            enqueue(batch.label, () => commitSchemaBatch(batch));
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
    projectionChanged = (force = false) => { const active = currentLibrary.activeProjectId ? loaded.get(currentLibrary.activeProjectId) : undefined, signature = JSON.stringify([currentLibrary.activeProjectId, active?.draftToken, serializeProjectLibrary(currentLibrary), memory.get(LEGACY_PROJECT_KEYS.schemas)]); if (!force && signature === lastProjectionSignature)
        return; lastProjectionSignature = signature; const projection = { library: structuredClone(currentLibrary), ...(active ? { active: structuredClone(active) } : {}) }; notify("durable-project-projection-changed", projection); for (const listener of listeners)
        listener(structuredClone(projection)); };
    const trackFeed = (promise) => { feedInstalls.add(promise); void promise.finally(() => feedInstalls.delete(promise)); return promise; }, synchronize = (projectId, draftToken) => { if (!draftToken)
        return; const identity = `${projectId}:${draftToken}`; if (locallySavingProjects.has(projectId) || projectInstalls.has(identity))
        return; const install = trackFeed((async () => { const metadata = (await repository.listProjectMetadata()).find(candidate => candidate.projectId === projectId); if (!metadata || metadata.draftSequence <= (observedProjectSequences.get(projectId) ?? -1))
        return; observedProjectSequences.set(projectId, metadata.draftSequence); const route = partialRoutes.get(projectId), active = currentLibrary.activeProjectId === projectId; if (!loaded.has(projectId) && !active) {
        await refreshMetadata(projectId);
        return;
    } const value = route ? await repository.loadVisibleProjectRoute(projectId, route) : await repository.loadProject(projectId); if (value.draftSequence < (observedProjectSequences.get(projectId) ?? -1))
        return; installLoaded(projectId, value, route); projectionChanged(); })()); projectInstalls.set(identity, install); void install.finally(() => projectInstalls.delete(identity)); }, installMetadata = (change) => { const identity = `metadata:${change.changeToken}`; if (observedSchemaChanges.has(identity))
        return; observedSchemaChanges.add(identity); trackFeed(refreshMetadata(change.projectId)); }, installActive = (notification) => { if (!currentLibrary.projects[notification.projectId])
        return; if (failed) {
        deferredActiveContext = notification;
        return;
    } if (observedActiveTokens.has(notification.token))
        return activeInstalls.get(notification.token); observedActiveTokens.add(notification.token); if (currentLibrary.activeProjectId !== notification.projectId)
        pageHistories.clear(); const route = partialRoutes.get(notification.projectId), prepared = loaded.get(notification.projectId), prepare = prepared || !route ? Promise.resolve(prepared) : repository.loadVisibleProjectRoute(notification.projectId, route).then((value) => { installLoaded(notification.projectId, value, route); return loaded.get(notification.projectId); }), install = trackFeed(prepare.then((active) => { currentLibrary = { ...currentLibrary, activeProjectId: notification.projectId }; memory.set(PROJECT_LIBRARY_STORAGE_KEY, serializeProjectLibrary(currentLibrary)); if (active)
        memory.set(CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY, serializeCanonicalProjectState(active.state, active.draftSequence));
    else
        memory.delete(CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY); projectionChanged(); })); activeInstalls.set(notification.token, install); void install.finally(() => activeInstalls.delete(notification.token)); return install; }, installSchemaChange = (change) => { const identity = `${change.schemaId}:${change.token}`; if (observedSchemaChanges.has(identity))
        return; observedSchemaChanges.add(identity); trackFeed(refreshSchemas().then(() => projectionChanged())); };
    repository.subscribe(({ projectId, draftToken }) => synchronize(projectId, draftToken));
    repository.subscribeProjectMetadata(installMetadata);
    repository.subscribeActiveContext(notification => void installActive(notification));
    repository.subscribeSavedSchemas(installSchemaChange);
    if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("my-chrome-utilities.durable-project-changes");
        channel.addEventListener("message", (event) => { const message = event.data; if (message?.projectId)
            synchronize(message.projectId, message.draftToken); });
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
        throw new Error("There is no failed durable Draft to retry."); if (pending.conflict)
        throw new Error("Resolve the visible conflicting fields before retrying this Draft."); loaded.delete(pending.projectId); enqueue(`Retry ${pending.command.label}`, () => persistState(pending.projectId, pending.state, pending.command.label, true)); await latest; await installCurrent(pending.projectId, partialRoutes.get(pending.projectId)); projectionChanged(true); const deferred = deferredActiveContext; deferredActiveContext = undefined; if (deferred)
        await installActive(deferred); };
    const retryFailedSchemaSave = async () => { const pending = failedSchema; if (!pending)
        throw new Error("There is no failed Saved Schema Library batch to retry."); enqueue(`Retry ${pending.batch.label}`, () => commitSchemaBatch(pending.batch, true)); await latest; };
    const resolveFailedSave = async (strategy, pendingFields = []) => { const pending = failed; if (!pending)
        throw new Error("There is no failed durable Draft to resolve."); if (strategy === "reject") {
        failed = undefined;
        await installCurrent(pending.projectId, partialRoutes.get(pending.projectId));
        projectionChanged();
        return;
    } if (!pending.conflict)
        throw new Error("There is no durable Draft conflict to merge or reapply."); if (pending.command.commandId.startsWith("blocked-history:"))
        throw new Error("A newer value blocks this window Undo or Redo; reject it instead of overwriting the newer Saved Draft."); const current = await repository.loadProject(pending.projectId), selectedSemanticFields = new Set(pendingFields.map(durableConflictSemanticField)), patches = pending.command.patches.filter((patch) => { const field = durablePatchField(patch); return !pending.conflict.conflictingFields.includes(field) || strategy === "reapply" || selectedSemanticFields.has(durableConflictSemanticField(field)); }), command = { ...structuredClone(pending.command), baseToken: current.draftToken, baseSequence: current.draftSequence, patches, pendingState: cleanState(current.state), commandId: `resolve:${pending.command.commandId}` }, result = await repository.saveDraft(command); if (result.status === "conflict") {
        failed = { ...pending, conflict: result, error: new DOMException(`${result.label} still conflicts at ${result.conflictingFields.join(", ")}.`, "AbortError") };
        throw failed.error;
    } failed = undefined; pageHistory(pending.projectId).push(command); await installCurrent(pending.projectId, partialRoutes.get(pending.projectId)); projectionChanged(); };
    const exportUnsavedDraft = () => { if (!failed)
        throw new Error("There is no failed durable Draft to export."); return JSON.stringify({ format: "my-chrome-utilities.unsaved-durable-project", version: 1, projectId: failed.projectId, command: { id: failed.command.commandId, label: failed.command.label, baseToken: failed.command.baseToken }, project: failed.state.project, draft: failed.state.draft }); };
    const exportUnsavedSchemas = () => { if (!failedSchema)
        throw new Error("There is no failed Saved Schema Library batch to export."); return JSON.stringify({ format: "my-chrome-utilities.unsaved-saved-schema-batch", version: 1, label: failedSchema.batch.label, names: failedSchema.batch.names, schemas: failedSchema.batch.schemas, operations: { upserts: failedSchema.batch.upserts.map(({ schema, baseToken }) => ({ schema, ...(baseToken ? { baseToken } : {}) })), deletes: failedSchema.batch.deletes }, conflict: failedSchema.conflict }); };
    const settleFeeds = async () => { while (feedInstalls.size)
        await Promise.all([...feedInstalls]); };
    const applyHistory = async (projectId, direction) => { await latest; await settleFeeds(); const history = pageHistory(projectId), current = await repository.loadProject(projectId); let command; try {
        command = history[direction](current);
    }
    catch (error) {
        const historyConflict = error instanceof DurablePageHistoryConflict ? error : undefined, blockedCommand = { projectId, baseToken: current.draftToken, baseSequence: current.draftSequence, commandId: `blocked-history:${direction}:${historyConflict?.commandId ?? crypto.randomUUID()}`, label: `${direction === "undo" ? "Undo" : "Redo"} ${historyConflict?.label ?? "project edit"}`, patches: historyConflict?.patches ?? [], pendingState: cleanState(current.state) }, conflict = historyConflict ? { status: "conflict", projectId, baseToken: current.draftToken, currentToken: current.draftToken, commandId: blockedCommand.commandId, label: blockedCommand.label, pendingFields: [historyConflict.field], currentFields: [historyConflict.field], conflictingFields: [historyConflict.field], currentValues: { [historyConflict.field]: historyConflict.currentValue }, pendingValues: { [historyConflict.field]: historyConflict.expectedValue } } : undefined;
        failed = { projectId, projectName: current.state.project.name, state: cleanState(current.state), command: blockedCommand, error, ...(conflict ? { conflict } : {}) };
        notify("durable-project-save-failed", { label: blockedCommand.label, error });
        throw error;
    } if (!command)
        return; notify("durable-project-saving", { label: command.label }); locallySavingProjects.add(projectId); try {
        const result = await repository.saveDraft(command);
        if (result.status === "conflict")
            throw new DOMException(`${command.label} conflicts at ${result.conflictingFields.join(", ")}.`, "AbortError");
        failed = undefined;
        await installCurrent(projectId, partialRoutes.get(projectId));
        projectionChanged();
        notify("durable-project-saved", { label: command.label });
    }
    catch (error) {
        history.restoreFailed(direction);
        failed = { projectId, projectName: current.state.project.name, state: cleanState(current.state), command, error };
        notify("durable-project-save-failed", { label: command.label, error });
        throw error;
    }
    finally {
        locallySavingProjects.delete(projectId);
    } };
    const settled = async (scope = "all") => { await latest; await settleFeeds(); if (scope !== "schema" && failed)
        throw failed.error; if (scope !== "project" && failedSchema)
        throw failedSchema.error; };
    return { repository, storage, ensureProject, ensureProjectRoute, refreshProject, settled, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }, failedSave: () => failed ? structuredClone(failed) : undefined, failedSchemaSave: () => failedSchema ? structuredClone(failedSchema) : undefined, retryFailedSave, retryFailedSchemaSave, resolveFailedSave, exportUnsavedDraft, exportUnsavedSchemas, canUndo: projectId => pageHistory(projectId).snapshot().undo.length > 0, canRedo: projectId => pageHistory(projectId).snapshot().redo.length > 0, undo: projectId => applyHistory(projectId, "undo"), redo: projectId => applyHistory(projectId, "redo"), resolveMigration, migration };
}
export async function openDurableProjectRuntime(legacy, factory = globalThis.indexedDB, startup = {}) { return createDurableProjectRuntime(await openIndexedDbProjectRepository(factory), legacy, startup); }
//# sourceMappingURL=data-layer-durable-project-runtime.js.map