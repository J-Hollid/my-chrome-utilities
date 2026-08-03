import { upgradePageGroupsToPropertySets, verifyPropertySetFlowSectionUpgrade } from "./data-layer-property-set-flow-section.js";
import { repairCanonicalBooleanAllowedValues } from "./data-layer-canonical-schema-facets.js";
export const DURABLE_PROJECT_DATABASE = "my-chrome-utilities.project-repository";
export const DURABLE_PROJECT_DATABASE_VERSION = 6;
export const LEGACY_PROJECT_KEYS = { library: "my-chrome-utilities.specification-project-library.v1", active: "my-chrome-utilities.specification-project.v1", navigation: "my-chrome-utilities.specification-project-navigation.v1", schemas: "my-chrome-utilities.schema-library.v1" };
export const DURABLE_PROJECT_STORES = ["projectMetadata", "projectRoots", "projectEntityMetadata", "projectEntities", "savedSchemas", "flowGraphs", "fixtures", "releases", "projectRevisions", "productionManifests", "schemaRevisions", "changeFeed", "settings", "migrationReceipts", "migrationBackups"];
export function durableProjectRouteForWorkspace(collectionKind, entityId) { const dependencies = { pages: ["profiles", "propertySets", "applicabilitySets", "assignments"], propertySets: ["profiles", "pages", "applicabilitySets", "assignments"], events: ["profiles", "applicabilitySets", "assignments", "flows"], flows: ["profiles", "pages", "propertySets", "events", "applicabilitySets", "assignments"], profiles: ["applicabilitySets", "assignments"], assignments: ["profiles", "pages", "propertySets", "events", "flows", "applicabilitySets"], fixtures: ["profiles", "pages", "propertySets", "events", "flows"] }, schemaWorkspace = ["profiles", "pages", "propertySets", "events"].includes(collectionKind); return { collectionKind, ...(entityId ? { entityId } : {}), collectionKinds: dependencies[collectionKind] ?? [], includeFlowGraphs: schemaWorkspace || collectionKind === "flows" || collectionKind === "assignments", includeFixtures: collectionKind === "fixtures" }; }
const clone = (value) => structuredClone(value);
const upgradeSeparatedState = (state) => { let sequence = 0; return upgradePageGroupsToPropertySets(state, (kind) => `${kind}:${state.project.id}:separation:${++sequence}`); };
const comparable = (value) => Array.isArray(value) ? value.map(comparable) : record(value) ? Object.fromEntries(Object.keys(value).sort().map(key => [key, comparable(value[key])])) : value;
const same = (left, right) => JSON.stringify(comparable(left)) === JSON.stringify(comparable(right));
const record = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const bytes = (value) => new TextEncoder().encode(JSON.stringify(value)).byteLength;
const productionProject = (project) => { const value = clone(project); value.releases = []; delete value.currentRelease; return comparable(value); };
const legacyProductionCount = (value) => { const candidates = Array.isArray(value.productionSnapshots) ? value.productionSnapshots : Array.isArray(value.revisionHistory) ? value.revisionHistory : [], fingerprints = new Set(candidates.map(candidate => JSON.stringify(comparable(record(candidate) && (candidate.effectiveSchema !== undefined || candidate.document !== undefined) ? candidate.effectiveSchema ?? candidate.document : candidate)))); if (fingerprints.size)
    return fingerprints.size; return value.published === true || value.productionFingerprint !== undefined ? 1 : 0; };
function compactLegacyEditHistory(value) {
    const before = JSON.stringify(comparable(value));
    let entryCount = 0;
    const visit = (candidate) => { if (Array.isArray(candidate))
        return candidate.map(visit); if (!record(candidate))
        return candidate; const legacyChanges = Array.isArray(candidate.changes) ? candidate.changes : undefined, currentCanonical = candidate.state === "Draft" && record(candidate.nodes) && Array.isArray(candidate.rootIds), legacySchema = Boolean(!currentCanonical && legacyChanges && typeof candidate.revision === "number" && (record(candidate.document) || record(candidate.nodes) || Array.isArray(candidate.productionSnapshots) || Array.isArray(candidate.revisionHistory))), result = {}; for (const [key, entry] of Object.entries(candidate)) {
        if (key === "changes" && legacySchema) {
            entryCount += legacyChanges.length;
            continue;
        }
        if (legacySchema && (key === "productionSnapshots" || key === "revisionHistory"))
            continue;
        if (["commandJournal", "patchJournal", "editJournal"].includes(key) && Array.isArray(entry)) {
            entryCount += entry.length;
            continue;
        }
        if (key === "revision" && legacySchema)
            continue;
        result[key] = visit(entry);
    } if (legacySchema)
        result.schemaRevision = legacyProductionCount(candidate); return result; };
    const compacted = visit(value), after = JSON.stringify(comparable(compacted));
    return { value: compacted, entryCount, before, after };
}
function legacyProductionSchemaHistories(value) {
    const histories = new Map(), visit = (candidate) => { if (Array.isArray(candidate)) {
        candidate.forEach(visit);
        return;
    } if (!record(candidate))
        return; const sources = Array.isArray(candidate.productionSnapshots) ? candidate.productionSnapshots : Array.isArray(candidate.revisionHistory) ? candidate.revisionHistory : undefined, schemaId = typeof candidate.id === "string" ? candidate.id : undefined; if (schemaId && sources?.length) {
        const distinct = [];
        for (const source of sources) {
            const effective = record(source) && (source.effectiveSchema !== undefined || source.document !== undefined) ? source.effectiveSchema ?? source.document : source;
            if (!distinct.some(existing => same(existing, effective)))
                distinct.push(clone(effective));
        }
        if (distinct.length)
            histories.set(schemaId, distinct);
    } for (const nested of Object.values(candidate))
        visit(nested); };
    visit(value);
    return [...histories].map(([schemaId, effectiveSchemas]) => ({ schemaId, effectiveSchemas }));
}
const projectPrefix = (projectId) => `${projectId}:`;
const byDurableIndex = (left, right) => (left.value.index ?? 0) - (right.value.index ?? 0);
const fieldFor = (patch) => { const path = ["entity", "graph", "release"].includes(patch.path[0] ?? "") ? patch.path.slice(1) : patch.path; return `${patch.store}/${patch.key}${path.length ? `/${path.join("/")}` : ""}`; };
export const durablePatchField = (patch) => fieldFor(patch);
export function durableConflictSemanticField(field) {
    const match = /^(projectEntities|projectEntityMetadata)\/([^/]+)(\/.*)?$/.exec(field);
    return match ? `projectEntity/${match[2]}${match[3] ?? ""}` : field;
}
const overlaps = (left, right) => left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
function repairCanonicalBooleanValuesInEntity(entity) {
    const schema = entity.canonicalSchema;
    if (!schema)
        return { entity, repairCount: 0 };
    let repairCount = 0, next;
    for (const node of Object.values(schema.nodes)) {
        const repair = repairCanonicalBooleanAllowedValues(node, node.type);
        if (!repair.repairCount)
            continue;
        if (!next)
            next = clone(entity);
        const nextSchema = next.canonicalSchema;
        nextSchema.nodes[node.id].allowedValues = repair.allowedValues;
        repairCount += repair.repairCount;
    }
    return { entity: next ?? entity, repairCount };
}
function repairCanonicalBooleanValuesInProject(project) {
    let repairCount = 0, next;
    for (const [kind, entities] of Object.entries(project.collections)) {
        for (const [index, entity] of entities.entries()) {
            const repair = repairCanonicalBooleanValuesInEntity(entity);
            if (!repair.repairCount)
                continue;
            if (!next)
                next = clone(project);
            next.collections[kind][index] = repair.entity;
            repairCount += repair.repairCount;
        }
    }
    return { project: next ?? project, repairCount };
}
async function checksum(value) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); }
function changed(base, next, path = []) {
    if (same(base, next))
        return [];
    if (record(base) && record(next)) {
        const keys = new Set([...Object.keys(base), ...Object.keys(next)]);
        return [...keys].flatMap((key) => changed(base[key], next[key], [...path, key]));
    }
    return [{ path, before: clone(base), after: clone(next) }];
}
function putPath(value, path, replacement) {
    if (!path.length)
        return replacement === undefined ? undefined : clone(replacement);
    const root = record(value) ? clone(value) : {}, target = root;
    let cursor = target;
    for (const part of path.slice(0, -1)) {
        const child = cursor[part];
        cursor[part] = record(child) ? clone(child) : {};
        cursor = cursor[part];
    }
    const last = path.at(-1);
    if (replacement === undefined)
        delete cursor[last];
    else
        cursor[last] = clone(replacement);
    return root;
}
function projectParts(state) {
    const project = clone(state.project), { collections, documentationFlowGraphs, releases = [], ...rootProject } = project, parts = new Map(), projectId = project.id, add = (store, key, value) => parts.set(`${store}/${key}`, { identity: { store, key }, value: clone(value) });
    add("projectRoots", projectId, { project: rootProject, collectionKinds: Object.keys(collections), hasDocumentationFlowGraphs: documentationFlowGraphs !== undefined });
    for (const [kind, entries] of Object.entries(collections)) {
        for (const [index, entity] of entries.entries()) {
            const key = `${projectId}:${kind}:${entity.id}`, store = kind === "fixtures" ? "fixtures" : "projectEntities";
            add("projectEntityMetadata", key, { projectId, kind, index, id: entity.id, name: entity.name });
            add(store, key, { projectId, kind, index, entity });
        }
    }
    for (const [flowId, graph] of Object.entries((documentationFlowGraphs ?? {})))
        add("flowGraphs", `${projectId}:${flowId}`, { projectId, flowId, graph });
    for (const release of releases)
        add("releases", `${projectId}:${release.id}`, { projectId, release });
    return parts;
}
function patchesBetween(base, next) {
    if (base.project.id !== next.project.id)
        throw new Error("A Draft command cannot replace project identity.");
    const before = projectParts(base), after = projectParts(next), keys = new Set([...before.keys(), ...after.keys()]), patches = [];
    for (const key of keys) {
        const prior = before.get(key), later = after.get(key), identity = (later ?? prior).identity;
        for (const difference of changed(prior?.value, later?.value))
            patches.push({ store: identity.store, key: identity.key, ...difference });
    }
    return patches;
}
export function durableDraftCommand(base, next, input) { return { projectId: base.state.project.id, baseToken: base.draftToken, baseSequence: base.draftSequence, commandId: input.commandId, label: input.label, patches: patchesBetween(base.state, next), pendingState: clone(next) }; }
class MemoryBackend {
    stores = new Map(DURABLE_PROJECT_STORES.map((store) => [store, new Map()]));
    reads = [];
    writes = [];
    async transaction(stores, mode, operation) { const working = new Map([...this.stores].map(([store, values]) => [store, new Map([...values].map(([key, value]) => [key, clone(value)]))])), read = (store, key) => { this.reads.push({ store, key, operation: "read" }); return working.get(store).get(key); }, ordered = (store) => [...working.get(store).entries()].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0), transaction = { get: async (store, key) => { const value = read(store, key); return value === undefined ? undefined : clone(value); }, getAll: async (store) => { this.reads.push({ store, key: "*", operation: "read" }); return ordered(store).map(([key, value]) => ({ key, value: clone(value) })); }, getPrefix: async (store, prefix) => { this.reads.push({ store, key: `prefix:${prefix}`, operation: "read" }); return ordered(store).filter(([key]) => key.startsWith(prefix)).map(([key, value]) => ({ key, value: clone(value) })); }, put: async (store, key, value) => { if (mode !== "readwrite" || !stores.includes(store))
            throw new Error(`Store ${store} is not writable in this transaction.`); working.get(store).set(key, clone(value)); this.writes.push({ store, key, operation: "write" }); }, delete: async (store, key) => { if (mode !== "readwrite" || !stores.includes(store))
            throw new Error(`Store ${store} is not writable in this transaction.`); working.get(store).delete(key); this.writes.push({ store, key, operation: "delete" }); } }; const result = await operation(transaction); if (mode === "readwrite")
        this.stores = working; return result; }
    trace() { return { reads: clone(this.reads), writes: clone(this.writes) }; }
    clearTrace() { this.reads = []; this.writes = []; }
}
class IndexedDbBackend {
    database;
    reads = [];
    writes = [];
    constructor(database) {
        this.database = database;
    }
    async transaction(stores, mode, operation) { const native = this.database.transaction([...stores], mode), completion = new Promise((resolve, reject) => { native.oncomplete = () => resolve(); native.onabort = () => reject(native.error ?? new DOMException("IndexedDB transaction aborted.", "AbortError")); native.onerror = () => reject(native.error ?? new Error("IndexedDB transaction failed.")); }), request = (value) => new Promise((resolve, reject) => { value.onsuccess = () => resolve(value.result); value.onerror = () => reject(value.error ?? new Error("IndexedDB request failed.")); }), prefixEntries = (store, prefix) => new Promise((resolve, reject) => { const entries = [], range = IDBKeyRange.bound(prefix, `${prefix}\uffff`), cursor = native.objectStore(store).openCursor(range); cursor.onerror = () => reject(cursor.error ?? new Error("IndexedDB prefix read failed.")); cursor.onsuccess = () => { const current = cursor.result; if (!current) {
        resolve(entries);
        return;
    } entries.push({ key: String(current.key), value: clone(current.value) }); current.continue(); }; }), adapter = { get: async (store, key) => { this.reads.push({ store, key, operation: "read" }); const value = await request(native.objectStore(store).get(key)); return value === undefined ? undefined : clone(value); }, getAll: async (store) => { this.reads.push({ store, key: "*", operation: "read" }); const keys = await request(native.objectStore(store).getAllKeys()), values = await request(native.objectStore(store).getAll()); return values.map((value, index) => ({ key: String(keys[index]), value: clone(value) })); }, getPrefix: async (store, prefix) => { this.reads.push({ store, key: `prefix:${prefix}`, operation: "read" }); return prefixEntries(store, prefix); }, put: async (store, key, value) => { this.writes.push({ store, key, operation: "write" }); await request(native.objectStore(store).put(clone(value), key)); }, delete: async (store, key) => { this.writes.push({ store, key, operation: "delete" }); await request(native.objectStore(store).delete(key)); } }; let result; try {
        result = await operation(adapter);
    }
    catch (error) {
        try {
            native.abort();
        }
        catch { /* transaction already inactive */ }
        await completion.catch(() => { });
        throw error;
    } await completion; return result; }
    trace() { return { reads: clone(this.reads), writes: clone(this.writes) }; }
    clearTrace() { this.reads = []; this.writes = []; }
}
const allStores = [...DURABLE_PROJECT_STORES];
const replaceableProjectStores = ["projectEntityMetadata", "projectEntities", "flowGraphs", "fixtures", "releases"];
async function replaceProjectParts(transaction, projectId, parts) {
    const expected = new Set([...parts.values()].map(({ identity }) => `${identity.store}/${identity.key}`)), prefix = projectPrefix(projectId);
    for (const store of replaceableProjectStores)
        for (const { key } of await transaction.getPrefix(store, prefix))
            if (!expected.has(`${store}/${key}`))
                await transaction.delete(store, key);
    for (const { identity, value } of parts.values())
        await transaction.put(identity.store, identity.key, value);
}
async function verifyStoredProjectParts(transaction, projectId, parts) {
    for (const { identity, value } of parts.values())
        if (!same(await transaction.get(identity.store, identity.key), value))
            throw new DOMException(`Property Set migration read-back failed for ${projectId} at ${identity.store}/${identity.key}.`, "OperationError");
    const expected = new Set([...parts.values()].map(({ identity }) => `${identity.store}/${identity.key}`)), prefix = projectPrefix(projectId);
    for (const store of replaceableProjectStores)
        for (const { key } of await transaction.getPrefix(store, prefix))
            if (!expected.has(`${store}/${key}`))
                throw new DOMException(`Property Set migration read-back retained unexpected ${store}/${key}.`, "OperationError");
}
const externalLineageKeys = new Set(["sourceLineage", "externalLineage"]), identityMapContainers = new Set(["nodes", "documentationFlowGraphs"]);
const referenceField = (key) => key === "id" || key === "currentRelease" || /(?:Id|Ids|Reference|References)$/.test(key);
function projectIdentityMapping(source, targetProjectId) {
    const ids = new Set();
    const collect = (value, external = false, parentKey = "") => { if (Array.isArray(value)) {
        for (const entry of value)
            collect(entry, external, parentKey);
        return;
    } if (!record(value))
        return; for (const [key, entry] of Object.entries(value)) {
        const outside = external || externalLineageKeys.has(key);
        if (!outside && key === "id" && typeof entry === "string")
            ids.add(entry);
        if (!outside && identityMapContainers.has(parentKey))
            ids.add(key);
        collect(entry, outside, key);
    } };
    collect(source);
    return new Map([...ids].map(old => [old, old === source.id ? targetProjectId : `${targetProjectId}:${old}`]));
}
function remapProjectReferences(value, mapping, external = false, parentKey = "") {
    if (Array.isArray(value))
        return value.map(entry => typeof entry === "string" && !external && referenceField(parentKey) ? mapping.get(entry) ?? entry : remapProjectReferences(entry, mapping, external, parentKey));
    if (!record(value))
        return value;
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => { const outside = external || externalLineageKeys.has(key), mappedKey = !outside && identityMapContainers.has(parentKey) ? mapping.get(key) ?? key : key; if (typeof entry === "string" && !outside && referenceField(key))
        return [mappedKey, mapping.get(entry) ?? entry]; return [mappedKey, remapProjectReferences(entry, mapping, outside, key)]; }));
}
export class DurableProjectRepository {
    backend;
    options;
    failure;
    listeners = new Set();
    metadataListeners = new Set();
    activeListeners = new Set();
    schemaListeners = new Set();
    constructor(backend, options) {
        this.backend = backend;
        this.options = options;
    }
    trace() { return this.backend.trace(); }
    clearTrace() { this.backend.clearTrace(); }
    injectFailure(failure) { this.failure = failure; }
    clearFailure() { this.failure = undefined; }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    subscribeProjectMetadata(listener) { this.metadataListeners.add(listener); return () => this.metadataListeners.delete(listener); }
    subscribeActiveContext(listener) { this.activeListeners.add(listener); return () => this.activeListeners.delete(listener); }
    subscribeSavedSchemas(listener) { this.schemaListeners.add(listener); return () => this.schemaListeners.delete(listener); }
    fail(label) { if (!this.failure)
        return; const names = { "quota exceeded": "QuotaExceededError", "transaction aborted": "AbortError", "repository unavailable": "InvalidStateError", "corrupt record": "DataError", "verification failure": "OperationError" }, error = new DOMException(`${label} was not committed: ${this.failure}. The last Saved Draft is unchanged.`, names[this.failure]); throw error; }
    notify(notification) { for (const listener of this.listeners)
        listener(clone(notification)); if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("my-chrome-utilities.durable-project-changes");
        channel.postMessage(notification);
        channel.close();
    } if (typeof chrome !== "undefined" && chrome.runtime?.id)
        void chrome.runtime.sendMessage(notification).catch(() => { }); }
    notifyActive(notification) { for (const listener of this.activeListeners)
        listener(clone(notification)); if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("my-chrome-utilities.durable-active-context");
        channel.postMessage(notification);
        channel.close();
    } if (typeof chrome !== "undefined" && chrome.runtime?.id)
        void chrome.runtime.sendMessage(notification).catch(() => { }); }
    async putProjectMetadataOnly(state, input = {}) {
        const legacyState = state, requiresSeparation = Object.hasOwn(state.project.collections, "pageGroups");
        state = upgradeSeparatedState(state);
        const projectId = state.project.id, draftToken = input.draftToken ?? this.options.token(), lastSavedAt = this.options.now(), parts = projectParts(state), publishedRevision = input.publishedRevision ?? 0, declaredRelease = state.project.releases.find(release => release.revision === publishedRevision), publishedProject = input.publishedProject ?? (declaredRelease ? { ...clone(state.project), collections: clone(declaredRelease.snapshot), releases: state.project.releases.filter(candidate => candidate.revision <= publishedRevision), currentRelease: declaredRelease.id } : undefined);
        if (publishedRevision > 0 && (!declaredRelease || !publishedProject))
            throw new DOMException(`Project ${projectId} cannot claim Published revision ${publishedRevision} without a matching release snapshot.`, "DataError");
        if (publishedProject && (publishedProject.id !== projectId || publishedProject.currentRelease !== declaredRelease?.id || !same(publishedProject.collections, declaredRelease?.snapshot)))
            throw new DOMException(`Published project ${projectId}:${publishedRevision} does not match its declared release identity and collections.`, "DataError");
        const metadata = await this.backend.transaction(allStores, "readwrite", async (transaction) => {
            const revisionKey = `${projectId}:${publishedRevision}`, existingMetadata = await transaction.get("projectMetadata", projectId), existingRevision = publishedRevision > 0 ? await transaction.get("projectRevisions", revisionKey) : undefined;
            if (existingMetadata)
                throw new DOMException(`Project ${projectId} already exists; create/import cannot replace a durable project snapshot.`, "ConstraintError");
            if (existingRevision)
                throw new DOMException(`Published revision ${publishedRevision} for ${projectId} already exists and is immutable.`, "ConstraintError");
            const draftSequence = input.draftSequence ?? 0;
            await replaceProjectParts(transaction, projectId, parts);
            const value = { projectId, name: state.project.name, site: state.project.site, owner: String(state.project.owner ?? ""), draftToken, draftSequence, publishedRevision, lastSavedAt, fieldVersions: Object.fromEntries([...parts.keys()].map(key => [key, draftSequence])), active: Boolean(input.active), ...(state.draft ? { draft: clone(state.draft) } : {}), ...(input.navigation ? { navigation: clone(input.navigation) } : {}) };
            await transaction.put("projectMetadata", projectId, value);
            if (input.active)
                await transaction.put("settings", "activeProjectId", projectId);
            if (requiresSeparation) {
                const receiptKey = `property-set-flow-sections-v1:${projectId}`, beforeChecksum = await checksum(JSON.stringify(comparable(legacyState.project))), afterChecksum = await checksum(JSON.stringify(comparable(state.project)));
                verifyPropertySetFlowSectionUpgrade(legacyState.project, state.project);
                await verifyStoredProjectParts(transaction, projectId, parts);
                await transaction.put("migrationBackups", receiptKey, { version: 1, project: clone(legacyState.project), beforeChecksum, createdAt: lastSavedAt });
                await transaction.put("migrationReceipts", receiptKey, { version: 1, projectIds: [projectId], beforeChecksum, afterChecksum, verified: true, upgradedAt: lastSavedAt });
            }
            if (publishedRevision > 0 && declaredRelease && publishedProject && !existingRevision) {
                const revision = { projectId, revision: publishedRevision, publicationId: declaredRelease.id, publishedAt: declaredRelease.createdAt, sourceDraftToken: draftToken, state: { project: clone(publishedProject), history: { undo: [], redo: [] } } };
                await transaction.put("projectRevisions", revisionKey, revision);
            }
            if (input.production) {
                if (input.production.manifest.projectId !== projectId || input.production.manifest.projectRevision !== publishedRevision)
                    throw new DOMException("Imported production manifest does not match its Project identity.", "DataError");
                for (const snapshot of input.production.snapshots)
                    await transaction.put("schemaRevisions", `${projectId}:${snapshot.schemaId}:${snapshot.schemaRevision}`, snapshot);
                await transaction.put("productionManifests", revisionKey, input.production.manifest);
            }
            return value;
        });
        const notification = { type: "durable-project-metadata-change", projectId, draftToken, changeToken: this.options.token() };
        for (const listener of this.metadataListeners)
            listener(clone(notification));
        if (typeof BroadcastChannel !== "undefined") {
            const channel = new BroadcastChannel("my-chrome-utilities.durable-project-metadata");
            channel.postMessage(notification);
            channel.close();
        }
        return metadata;
    }
    async putProject(state, input = {}) { await this.putProjectMetadataOnly(state, input); return this.loadProject(state.project.id); }
    async listProjectMetadata() { return this.backend.transaction(["projectMetadata", "settings"], "readonly", async (transaction) => { const active = await transaction.get("settings", "activeProjectId"), entries = await transaction.getAll("projectMetadata"); return entries.map(({ value }) => ({ ...value, active: value.projectId === active })).sort((left, right) => left.name.localeCompare(right.name)); }); }
    async activeProjectId() { return this.backend.transaction(["settings"], "readonly", transaction => transaction.get("settings", "activeProjectId")); }
    async setProjectNavigation(projectId, navigation) { const changeToken = this.options.token(), metadata = await this.backend.transaction(["projectMetadata"], "readwrite", async (transaction) => { const current = await transaction.get("projectMetadata", projectId); if (!current)
        throw new Error(`Unknown durable project ${projectId}.`); const next = { ...current }; if (navigation)
        next.navigation = clone(navigation);
    else
        delete next.navigation; await transaction.put("projectMetadata", projectId, next); return next; }); const notification = { type: "durable-project-metadata-change", projectId, draftToken: metadata.draftToken, changeToken }; for (const listener of this.metadataListeners)
        listener(clone(notification)); if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("my-chrome-utilities.durable-project-metadata");
        channel.postMessage(notification);
        channel.close();
    } }
    async setActiveProject(projectId) { const token = this.options.token(), notification = { type: "durable-active-context-change", projectId, token }; await this.backend.transaction(["projectMetadata", "settings"], "readwrite", async (transaction) => { if (!await transaction.get("projectMetadata", projectId))
        throw new Error(`Unknown durable project ${projectId}.`); await transaction.put("settings", "activeProjectId", projectId); await transaction.put("settings", "activeProjectChange", { projectId, token, at: this.options.now() }); }); this.notifyActive(notification); return notification; }
    async clearActiveProject() { const token = this.options.token(), notification = { type: "durable-active-context-change", token }; await this.backend.transaction(["settings"], "readwrite", async (transaction) => { await transaction.delete("settings", "activeProjectId"); await transaction.put("settings", "activeProjectChange", { token, at: this.options.now() }); }); this.notifyActive(notification); return notification; }
    async deleteProject(input) { this.fail(input.label); await this.backend.transaction(allStores, "readwrite", async (transaction) => { const active = await transaction.get("settings", "activeProjectId"), metadata = await transaction.get("projectMetadata", input.projectId); if (!metadata)
        throw new Error(`Unknown durable project ${input.projectId}.`); if (active === input.projectId)
        throw new Error("Switch to another project before deleting the active project."); if (metadata.draftToken !== input.baseToken)
        throw new DOMException(`${input.label} requires current Draft token ${metadata.draftToken}.`, "AbortError"); for (const store of [...replaceableProjectStores, "projectRevisions", "productionManifests", "schemaRevisions"])
        for (const { key } of await transaction.getPrefix(store, projectPrefix(input.projectId)))
            await transaction.delete(store, key); await transaction.delete("changeFeed", input.projectId); await transaction.delete("projectRoots", input.projectId); await transaction.delete("projectMetadata", input.projectId); }); }
    async persistCanonicalRepairs(repairs) { if (!repairs.length)
        return true; return this.backend.transaction([...new Set(repairs.map(({ store }) => store))], "readwrite", async (transaction) => { for (const repair of repairs)
        if (!same(await transaction.get(repair.store, repair.key), repair.before))
            return false; for (const repair of repairs)
        await transaction.put(repair.store, repair.key, repair.after); return true; }); }
    async loadProject(projectId) {
        const result = await this.backend.transaction(["projectMetadata", "projectRoots", "projectEntities", "flowGraphs", "fixtures", "releases"], "readonly", async (transaction) => {
            const metadata = await transaction.get("projectMetadata", projectId), root = await transaction.get("projectRoots", projectId);
            if (!metadata || !root)
                throw new Error(`Durable project ${projectId} is unavailable.`);
            const prefix = projectPrefix(projectId), storedEntityRecords = await transaction.getPrefix("projectEntities", prefix), fixtureRecords = await transaction.getPrefix("fixtures", prefix), graphs = await transaction.getPrefix("flowGraphs", prefix), releases = await transaction.getPrefix("releases", prefix), collections = Object.fromEntries(root.collectionKinds.map(kind => [kind, []])), repairs = [];
            let canonicalRepairCount = 0;
            const entityRecords = [];
            for (const record of storedEntityRecords) {
                const repair = repairCanonicalBooleanValuesInEntity(record.value.entity), value = repair.repairCount ? { ...record.value, entity: repair.entity } : record.value;
                if (repair.repairCount)
                    repairs.push({ store: "projectEntities", key: record.key, before: record.value, after: value });
                canonicalRepairCount += repair.repairCount;
                entityRecords.push({ key: record.key, value });
            }
            for (const { value } of [...entityRecords, ...fixtureRecords].sort(byDurableIndex))
                (collections[value.kind] ??= []).push(clone(value.entity));
            const project = { ...clone(root.project), collections, ...(root.hasDocumentationFlowGraphs ? { documentationFlowGraphs: Object.fromEntries(graphs.map(({ value }) => [value.flowId, clone(value.graph)])) } : {}), releases: releases.map(({ value }) => clone(value.release)) }, state = { project, ...(metadata.draft ? { draft: clone(metadata.draft) } : {}), history: { undo: [], redo: [] } };
            return { loaded: { state, draftToken: metadata.draftToken, draftSequence: metadata.draftSequence ?? 0, publishedRevision: metadata.publishedRevision, lastSavedAt: metadata.lastSavedAt, canonicalRepairCount, ...(metadata.navigation ? { navigation: clone(metadata.navigation) } : {}) }, repairs };
        });
        return await this.persistCanonicalRepairs(result.repairs) ? result.loaded : this.loadProject(projectId);
    }
    async loadProjectRoute(projectId, route) { return this.loadVisibleProjectRoute(projectId, route); }
    async loadVisibleProjectRoute(projectId, route) {
        const result = await this.backend.transaction(["projectMetadata", "projectRoots", "projectEntityMetadata", "projectEntities", "flowGraphs", "fixtures", "releases"], "readonly", async (transaction) => {
            const metadata = await transaction.get("projectMetadata", projectId), root = await transaction.get("projectRoots", projectId);
            if (!metadata || !root)
                throw new Error(`Durable project ${projectId} is unavailable.`);
            const collections = Object.fromEntries(root.collectionKinds.map(kind => [kind, []])), compact = await transaction.getPrefix("projectEntityMetadata", projectPrefix(projectId));
            for (const { value } of compact.sort(byDurableIndex))
                (collections[value.kind] ??= []).push({ id: value.id, name: value.name, placeholder: true });
            let canonicalRepairCount = 0;
            const repairs = [], kinds = [...new Set([...(route.collectionKind ? [route.collectionKind] : []), ...(route.collectionKinds ?? [])])];
            for (const kind of kinds) {
                const store = kind === "fixtures" ? "fixtures" : "projectEntities", prefix = `${projectId}:${kind}:`, selectedKey = `${prefix}${route.entityId}`, selectedValue = route.entityId && kind === route.collectionKind ? await transaction.get(store, selectedKey) : undefined, visible = selectedValue ? [{ key: selectedKey, value: selectedValue }] : route.entityId && kind === route.collectionKind ? [] : (await transaction.getPrefix(store, prefix)).sort(byDurableIndex), target = collections[kind] ?? [];
                for (const record of visible) {
                    const repair = repairCanonicalBooleanValuesInEntity(record.value.entity), value = repair.repairCount ? { ...record.value, entity: repair.entity } : record.value;
                    if (repair.repairCount)
                        repairs.push({ store, key: record.key, before: record.value, after: value });
                    canonicalRepairCount += repair.repairCount;
                    const index = target.findIndex(({ id }) => id === value.entity.id);
                    if (index >= 0)
                        target[index] = clone(value.entity);
                    else
                        target.push(clone(value.entity));
                }
                collections[kind] = target;
            }
            const graphs = route.includeFlowGraphs ? await transaction.getPrefix("flowGraphs", projectPrefix(projectId)) : [], fixtures = route.includeFixtures && !kinds.includes("fixtures") ? await transaction.getPrefix("fixtures", projectPrefix(projectId)) : [];
            for (const { value } of fixtures.sort(byDurableIndex)) {
                const target = collections[value.kind] ??= [], index = target.findIndex(({ id }) => id === value.entity.id);
                if (index >= 0)
                    target[index] = clone(value.entity);
                else
                    target.push(clone(value.entity));
            }
            const releases = route.includeReleases ? await transaction.getPrefix("releases", projectPrefix(projectId)) : [], project = { ...clone(root.project), collections, ...(root.hasDocumentationFlowGraphs && route.includeFlowGraphs ? { documentationFlowGraphs: Object.fromEntries(graphs.map(({ value }) => [value.flowId, clone(value.graph)])) } : {}), releases: releases.map(({ value }) => clone(value.release)) };
            return { loaded: { state: { project, ...(metadata.draft ? { draft: clone(metadata.draft) } : {}), history: { undo: [], redo: [] } }, draftToken: metadata.draftToken, draftSequence: metadata.draftSequence ?? 0, publishedRevision: metadata.publishedRevision, lastSavedAt: metadata.lastSavedAt, canonicalRepairCount, ...(metadata.navigation ? { navigation: clone(metadata.navigation) } : {}) }, repairs };
        });
        return await this.persistCanonicalRepairs(result.repairs) ? result.loaded : this.loadVisibleProjectRoute(projectId, route);
    }
    async saveDraft(command) {
        this.fail(command.label);
        const stores = ["projectMetadata", "projectRoots", "projectEntityMetadata", "projectEntities", "flowGraphs", "fixtures", "releases", "changeFeed"], result = await this.backend.transaction(stores, "readwrite", async (transaction) => {
            const metadata = await transaction.get("projectMetadata", command.projectId);
            if (!metadata)
                throw new Error(`Durable project ${command.projectId} is unavailable.`);
            const pendingFields = command.patches.map(fieldFor), stale = metadata.draftToken !== command.baseToken || metadata.draftSequence !== command.baseSequence, invalidBase = command.baseSequence > metadata.draftSequence || (command.baseSequence === metadata.draftSequence && metadata.draftToken !== command.baseToken), currentFields = stale ? (invalidBase ? pendingFields : Object.entries(metadata.fieldVersions ?? {}).filter(([, sequence]) => sequence > command.baseSequence).map(([field]) => field)) : [], conflictingFields = pendingFields.filter(field => currentFields.some(current => overlaps(field, current)));
            if (conflictingFields.length) {
                const currentValues = {}, pendingValues = {};
                for (const patch of command.patches.filter(patch => conflictingFields.includes(fieldFor(patch)))) {
                    const current = await transaction.get(patch.store, patch.key);
                    currentValues[fieldFor(patch)] = patch.path.reduce((value, part) => record(value) ? value[part] : undefined, current);
                    pendingValues[fieldFor(patch)] = clone(patch.after);
                }
                return { status: "conflict", projectId: command.projectId, baseToken: command.baseToken, currentToken: metadata.draftToken, commandId: command.commandId, label: command.label, pendingFields, currentFields: [...new Set(currentFields)], conflictingFields, currentValues, pendingValues };
            }
            const changed = new Map();
            for (const patch of command.patches) {
                const current = await transaction.get(patch.store, patch.key), next = putPath(current, patch.path, patch.after);
                if (next === undefined)
                    await transaction.delete(patch.store, patch.key);
                else
                    await transaction.put(patch.store, patch.key, next);
                changed.set(`${patch.store}/${patch.key}`, { store: patch.store, key: patch.key });
            }
            const root = await transaction.get("projectRoots", command.projectId);
            if (!root)
                throw new DOMException(`Draft ${command.label} did not leave a canonical project root.`, "DataError");
            const draftToken = this.options.token(), lastSavedAt = this.options.now(), draftSequence = (metadata.draftSequence ?? 0) + 1, fieldVersions = { ...(metadata.fieldVersions ?? {}) };
            for (const field of pendingFields)
                fieldVersions[field] = draftSequence;
            const nextMetadata = { ...metadata, name: String(root.project.name), site: String(root.project.site), owner: String(root.project.owner ?? ""), draftToken, draftSequence, lastSavedAt, fieldVersions };
            if (command.pendingState.draft)
                nextMetadata.draft = clone(command.pendingState.draft);
            else
                delete nextMetadata.draft;
            const metadataIdentity = { store: "projectMetadata", key: command.projectId };
            await transaction.put("projectMetadata", command.projectId, nextMetadata);
            changed.set(`projectMetadata/${command.projectId}`, metadataIdentity);
            const changedRecords = [...changed.values()], feed = { projectId: command.projectId, draftToken, commandId: command.commandId, changedRecords: clone(changedRecords) };
            await transaction.put("changeFeed", command.projectId, feed);
            return { status: stale ? "rebased" : "committed", projectId: command.projectId, draftToken, draftSequence, publishedRevision: metadata.publishedRevision, changedRecords, notification: { type: "durable-project-change", projectId: command.projectId, draftToken, commandId: command.commandId, changedRecords } };
        });
        if (result.status !== "conflict")
            this.notify(result.notification);
        return result;
    }
    async publish(projectId, baseToken, input) {
        const current = await this.loadProject(projectId), metadata = (await this.listProjectMetadata()).find(candidate => candidate.projectId === projectId);
        if (!metadata)
            throw new Error(`Durable project ${projectId} is unavailable.`);
        if (metadata.draftToken !== baseToken)
            throw new Error(`Publish requires current Draft token ${metadata.draftToken}.`);
        const previous = await this.currentProductionManifest(projectId), previousSchemas = new Map(previous?.schemas.map(entry => [entry.schemaId, entry]) ?? []), schemaCandidates = input.schemas ? await Promise.all(input.schemas.map(async (candidate) => ({ ...clone(candidate), fingerprint: await checksum(JSON.stringify(comparable(candidate.effectiveSchema))) }))) : (previous?.schemas.map(entry => ({ schemaId: entry.schemaId, effectiveSchema: undefined, priorRevision: entry.schemaRevision, fingerprint: entry.fingerprint })) ?? []), schemaChanged = input.schemas !== undefined && (schemaCandidates.some(candidate => previousSchemas.get(candidate.schemaId)?.fingerprint !== candidate.fingerprint) || schemaCandidates.length !== (previous?.schemas.length ?? 0)), nextRevision = metadata.publishedRevision + 1, release = current.state.project.releases.find(candidate => candidate.id === input.publicationId && candidate.revision === nextRevision), candidateProject = release ? { ...clone(current.state.project), collections: clone(release.snapshot), releases: current.state.project.releases.filter(candidate => candidate.revision <= nextRevision), currentRelease: release.id } : current.state.project, projectFingerprint = await checksum(JSON.stringify({ project: productionProject(candidateProject), schemas: schemaCandidates.map(({ schemaId, fingerprint }) => ({ schemaId, fingerprint })).sort((left, right) => left.schemaId.localeCompare(right.schemaId)) })), changed = previous ? previous.projectFingerprint !== projectFingerprint : metadata.publishedRevision === 0 || Boolean(release) || schemaChanged;
        if (!changed) {
            return { status: "no-changes", draftToken: baseToken, publishedRevision: metadata.publishedRevision, manifest: clone(previous) };
        }
        this.fail("Publish project");
        if (!release)
            throw new DOMException(`Publish revision ${nextRevision} requires matching release ${input.publicationId}.`, "DataError");
        const result = await this.backend.transaction(["projectMetadata", "projectRevisions", "productionManifests", "schemaRevisions", "changeFeed"], "readwrite", async (transaction) => {
            const durableMetadata = await transaction.get("projectMetadata", projectId);
            if (!durableMetadata)
                throw new Error(`Durable project ${projectId} is unavailable.`);
            if (durableMetadata.draftToken !== baseToken)
                throw new Error(`Publish requires current Draft token ${durableMetadata.draftToken}.`);
            const publishedRevision = durableMetadata.publishedRevision + 1, draftToken = this.options.token(), at = this.options.now(), revisionKey = `${projectId}:${publishedRevision}`, draftSequence = (durableMetadata.draftSequence ?? 0) + 1, publishedProject = { ...clone(current.state.project), collections: clone(release.snapshot), releases: current.state.project.releases.filter(candidate => candidate.revision <= publishedRevision), currentRelease: release.id }, revision = { projectId, revision: publishedRevision, publicationId: input.publicationId, publishedAt: at, sourceDraftToken: baseToken, state: { project: publishedProject, history: { undo: [], redo: [] } } }, changedRecords = [{ store: "projectRevisions", key: revisionKey }, { store: "productionManifests", key: revisionKey }, { store: "projectMetadata", key: projectId }], entries = [];
            for (const candidate of schemaCandidates) {
                const prior = previousSchemas.get(candidate.schemaId), schemaRevision = prior?.fingerprint === candidate.fingerprint ? prior.schemaRevision : (prior?.schemaRevision ?? candidate.priorRevision ?? 0) + 1, snapshotKey = prior?.fingerprint === candidate.fingerprint ? prior.snapshotKey : `${projectId}:${candidate.schemaId}:${schemaRevision}`;
                entries.push({ schemaId: candidate.schemaId, schemaRevision, fingerprint: candidate.fingerprint, snapshotKey });
                if (prior?.fingerprint !== candidate.fingerprint) {
                    const snapshot = { projectId, schemaId: candidate.schemaId, schemaRevision, fingerprint: candidate.fingerprint, effectiveSchema: clone(candidate.effectiveSchema), createdAt: at };
                    await transaction.put("schemaRevisions", snapshotKey, snapshot);
                    changedRecords.push({ store: "schemaRevisions", key: snapshotKey });
                }
            }
            const manifest = { projectId, projectRevision: publishedRevision, projectFingerprint, publicationId: input.publicationId, publishedAt: at, schemas: entries.sort((left, right) => left.schemaId.localeCompare(right.schemaId)) }, fieldVersions = { ...(durableMetadata.fieldVersions ?? {}), [`projectRevisions/${revisionKey}`]: draftSequence }, feed = { projectId, draftToken, commandId: input.publicationId, changedRecords: clone(changedRecords) };
            await transaction.put("projectRevisions", revisionKey, revision);
            await transaction.put("productionManifests", revisionKey, manifest);
            await transaction.put("projectMetadata", projectId, { ...durableMetadata, publishedRevision, draftToken, draftSequence, lastSavedAt: at, fieldVersions });
            await transaction.put("changeFeed", projectId, feed);
            return { draftToken, publishedRevision, changedRecords, manifest };
        });
        this.notify({ type: "durable-project-change", projectId, draftToken: result.draftToken, commandId: input.publicationId, changedRecords: result.changedRecords });
        return { status: "published", draftToken: result.draftToken, publishedRevision: result.publishedRevision, manifest: clone(result.manifest) };
    }
    async latestProjectChange(projectId) { const value = await this.backend.transaction(["changeFeed"], "readonly", transaction => transaction.get("changeFeed", projectId)); return value ? clone(value) : undefined; }
    async loadPublishedRevision(projectId, revision) { const snapshot = await this.backend.transaction(["projectRevisions"], "readonly", transaction => transaction.get("projectRevisions", `${projectId}:${revision}`)); if (!snapshot)
        throw new Error(`Published revision ${revision} for ${projectId} is unavailable.`); return clone(snapshot); }
    async loadCurrentPublishedProject(projectId) { const metadata = (await this.listProjectMetadata()).find(entry => entry.projectId === projectId); if (!metadata?.publishedRevision)
        return undefined; const snapshot = await this.loadPublishedRevision(projectId, metadata.publishedRevision); return { revision: metadata.publishedRevision, project: clone(snapshot.state.project) }; }
    async loadProductionManifest(projectId, projectRevision) { const manifest = await this.backend.transaction(["productionManifests"], "readonly", transaction => transaction.get("productionManifests", `${projectId}:${projectRevision}`)); if (!manifest)
        throw new Error(`Production manifest ${projectId}:${projectRevision} is unavailable.`); return clone(manifest); }
    async currentProductionManifest(projectId) { const metadata = (await this.listProjectMetadata()).find(entry => entry.projectId === projectId); if (!metadata?.publishedRevision)
        return undefined; try {
        return await this.loadProductionManifest(projectId, metadata.publishedRevision);
    }
    catch {
        return undefined;
    } }
    async productionSchemaEvidence(projectId, schemaId) { const manifest = await this.currentProductionManifest(projectId), entry = manifest?.schemas.find(candidate => candidate.schemaId === schemaId); if (!manifest || !entry)
        throw new Error(`Production schema ${schemaId} for ${projectId} is unavailable.`); return { projectId, projectRevision: manifest.projectRevision, schemaId, schemaRevision: entry.schemaRevision, fingerprint: entry.fingerprint }; }
    async loadProductionSchema(evidence) { const manifest = await this.loadProductionManifest(evidence.projectId, evidence.projectRevision), entry = manifest.schemas.find(candidate => candidate.schemaId === evidence.schemaId && candidate.schemaRevision === evidence.schemaRevision && candidate.fingerprint === evidence.fingerprint); if (!entry)
        throw new DOMException("Production schema evidence does not match its immutable manifest.", "DataError"); const snapshot = await this.backend.transaction(["schemaRevisions"], "readonly", transaction => transaction.get("schemaRevisions", entry.snapshotKey)); if (!snapshot || snapshot.fingerprint !== evidence.fingerprint)
        throw new DOMException("Immutable production schema bytes are unavailable.", "DataError"); return clone(snapshot); }
    async hashRecord(store, key) { const value = await this.backend.transaction([store], "readonly", transaction => transaction.get(store, key)); return checksum(JSON.stringify(value)); }
    async hashProject(projectId) { const loaded = await this.loadProject(projectId); return checksum(JSON.stringify(loaded)); }
    async storageDiagnostics(projectId, estimate, unsavedCommand) { const loaded = await this.loadProject(projectId), prefix = projectPrefix(projectId), sizes = await this.backend.transaction(["projectEntities", "flowGraphs", "fixtures", "releases", "projectRevisions", "migrationBackups"], "readonly", async (transaction) => { const selected = async (store) => (await transaction.getPrefix(store, prefix)).reduce((total, { value }) => total + bytes(value), 0); return { projectEntityBytes: await selected("projectEntities") + await selected("flowGraphs"), releaseBytes: await selected("releases") + await selected("projectRevisions"), fixtureBytes: await selected("fixtures"), migrationBackupBytes: (await transaction.getAll("migrationBackups")).reduce((total, { value }) => total + bytes(value), 0) }; }); return { lastSavedAt: loaded.lastSavedAt, publishedRevision: loaded.publishedRevision, ...(unsavedCommand ? { unsavedCommand } : {}), ...sizes, ...(estimate ? { browserEstimate: { ...estimate, label: "Browser storage estimate" } } : {}), explanation: "Unlimited storage reduces quota risk; it does not make a failed write successful or provide infinite disk." }; }
    async upgradeLegacyPropertySetStorage() {
        const receiptKey = "property-set-flow-sections-v1", existing = await this.backend.transaction(["migrationReceipts"], "readonly", transaction => transaction.get("migrationReceipts", receiptKey));
        if (existing?.verified)
            return clone(existing);
        const metadata = await this.listProjectMetadata(), loaded = await Promise.all(metadata.map(({ projectId }) => this.loadProject(projectId))), legacy = loaded.filter(({ state }) => Object.hasOwn(state.project.collections, "pageGroups")), beforeChecksum = await checksum(JSON.stringify(comparable(legacy.map(({ state }) => state.project))));
        const upgraded = legacy.map(({ state, ...durable }) => ({ durable, state: upgradeSeparatedState(state) })), afterChecksum = await checksum(JSON.stringify(comparable(upgraded.map(({ state }) => state.project)))), receipt = { version: 1, projectIds: upgraded.map(({ state }) => state.project.id), beforeChecksum, afterChecksum, verified: true, upgradedAt: this.options.now() };
        return this.backend.transaction(allStores, "readwrite", async (transaction) => { const current = await transaction.get("migrationReceipts", receiptKey); if (current?.verified)
            return current; await transaction.put("migrationBackups", receiptKey, { version: 1, projects: legacy.map(({ state }) => clone(state.project)), beforeChecksum, createdAt: this.options.now() }); for (const candidate of upgraded) {
            const projectId = candidate.state.project.id, root = await transaction.get("projectRoots", projectId);
            if (!root?.collectionKinds.includes("pageGroups"))
                throw new DOMException(`Legacy Property Set source ${projectId} changed before upgrade.`, "AbortError");
            const source = legacy.find(({ state }) => state.project.id === projectId);
            if (!source)
                throw new DOMException(`Legacy Property Set source ${projectId} is unavailable.`, "DataError");
            verifyPropertySetFlowSectionUpgrade(source.state.project, candidate.state.project);
            const parts = projectParts(candidate.state);
            await replaceProjectParts(transaction, projectId, parts);
            await verifyStoredProjectParts(transaction, projectId, parts);
            const currentMetadata = await transaction.get("projectMetadata", projectId);
            if (!currentMetadata)
                throw new DOMException(`Property Set upgrade lost metadata for ${projectId}.`, "OperationError");
            const draftSequence = (currentMetadata.draftSequence ?? 0) + 1, draftToken = this.options.token();
            await transaction.put("projectMetadata", projectId, { ...currentMetadata, draftSequence, draftToken, lastSavedAt: this.options.now(), fieldVersions: Object.fromEntries([...parts.keys()].map(key => [key, draftSequence])) });
        } await transaction.put("migrationReceipts", receiptKey, receipt); return receipt; });
    }
    async migrationBackup() { return this.backend.transaction(["migrationBackups"], "readonly", async (transaction) => (await transaction.get("migrationBackups", "legacy-v1")) ?? { sources: [] }); }
    async repairOrphanFlowGraphs() {
        const repairVersion = await this.backend.transaction(["settings"], "readonly", transaction => transaction.get("settings", "flowGraphOwnershipRepairVersion"));
        if (repairVersion === 1)
            return [];
        const graphRecords = await this.backend.transaction(["flowGraphs"], "readonly", transaction => transaction.getAll("flowGraphs"));
        const prepared = await Promise.all(graphRecords.map(async (record) => ({ ...record, sourceChecksum: await checksum(JSON.stringify(record.value)) })));
        const receipts = await this.backend.transaction(["flowGraphs", "projectEntities", "projectMetadata", "migrationBackups", "migrationReceipts", "settings"], "readwrite", async (transaction) => {
            const repaired = [], changedProjects = new Map();
            for (const candidate of prepared) {
                const graph = await transaction.get("flowGraphs", candidate.key), ownerKey = `${candidate.value.projectId}:flows:${candidate.value.flowId}`, owner = await transaction.get("projectEntities", ownerKey);
                if (!graph || owner)
                    continue;
                if (!same(graph, candidate.value))
                    throw new DOMException(`Flow graph ${candidate.key} changed during ownership repair.`, "AbortError");
                const metadata = changedProjects.get(graph.projectId)?.metadata ?? await transaction.get("projectMetadata", graph.projectId);
                if (!metadata)
                    throw new DOMException(`Orphan Flow graph ${candidate.key} has no project metadata.`, "DataError");
                const repairKey = `flow-graph-ownership:${graph.projectId}:${graph.flowId}`, deletedRecord = { store: "flowGraphs", key: candidate.key }, repairedAt = this.options.now(), draftToken = changedProjects.get(graph.projectId)?.draftToken ?? this.options.token(), receipt = { version: 1, projectId: graph.projectId, flowId: graph.flowId, sourceChecksum: candidate.sourceChecksum, deletedRecord, draftToken, verified: true, repairedAt }, backup = { version: 1, projectId: graph.projectId, flowId: graph.flowId, sourceChecksum: candidate.sourceChecksum, record: clone(graph), deletedRecord, createdAt: repairedAt };
                await transaction.put("migrationBackups", repairKey, backup);
                this.fail("Repair orphan Flow graph");
                await transaction.delete("flowGraphs", candidate.key);
                await transaction.put("migrationReceipts", repairKey, receipt);
                if (!changedProjects.has(graph.projectId)) {
                    const nextMetadata = { ...metadata, draftToken, draftSequence: (metadata.draftSequence ?? 0) + 1, lastSavedAt: repairedAt };
                    await transaction.put("projectMetadata", graph.projectId, nextMetadata);
                    changedProjects.set(graph.projectId, { metadata: nextMetadata, draftToken });
                }
                const verifiedBackup = await transaction.get("migrationBackups", repairKey), verifiedReceipt = await transaction.get("migrationReceipts", repairKey);
                if (await transaction.get("flowGraphs", candidate.key) !== undefined || !same(verifiedBackup, backup) || !same(verifiedReceipt, receipt))
                    throw new DOMException(`Flow graph repair verification failed for ${candidate.key}.`, "OperationError");
                repaired.push(receipt);
            }
            for (const { key, value } of await transaction.getAll("flowGraphs"))
                if (!await transaction.get("projectEntities", `${value.projectId}:flows:${value.flowId}`))
                    throw new DOMException(`Flow graph ownership verification found ${key} without its Flow.`, "OperationError");
            await transaction.put("settings", "flowGraphOwnershipRepairVersion", 1);
            return repaired;
        });
        for (const receipt of receipts)
            this.notify({ type: "durable-project-change", projectId: receipt.projectId, draftToken: receipt.draftToken, commandId: `repair:flow-graph-ownership:${receipt.flowId}`, changedRecords: [receipt.deletedRecord, { store: "projectMetadata", key: receipt.projectId }] });
        return receipts;
    }
    async compactLegacyDurableSchemaHistory() {
        const receiptKey = "selective-production-revisions-v1", existing = await this.backend.transaction(["migrationReceipts"], "readonly", transaction => transaction.get("migrationReceipts", receiptKey));
        if (existing?.verified)
            return clone(existing);
        const candidateStores = ["projectRoots", "projectEntities", "releases", "savedSchemas", "projectRevisions", "productionManifests", "schemaRevisions"], records = (await this.backend.transaction(candidateStores, "readonly", async (transaction) => (await Promise.all(candidateStores.map(async (store) => (await transaction.getAll(store)).map(({ key, value }) => ({ store, key, value }))))).flat())), changed = records.map(record => ({ ...record, compaction: compactLegacyEditHistory(record.value) })).filter(({ compaction }) => compaction.entryCount > 0), entryCount = changed.reduce((total, { compaction }) => total + compaction.entryCount, 0), beforeChecksum = await checksum(JSON.stringify(changed.map(({ store, key, compaction }) => ({ store, key, value: compaction.before })))), afterChecksum = await checksum(JSON.stringify(changed.map(({ store, key, compaction }) => ({ store, key, value: compaction.after })))), receipt = { entryCount, beforeChecksum, afterChecksum, verified: true };
        if (!changed.length)
            return receipt;
        const compactedValue = (store, key, value) => changed.find(candidate => candidate.store === store && candidate.key === key)?.compaction.value ?? value, productionUpdates = [];
        for (const candidate of changed.filter(({ store }) => store === "projectRevisions")) {
            const revision = candidate.compaction.value;
            if (!revision?.state?.project || !revision.projectId || !revision.revision)
                continue;
            const manifestKey = `${revision.projectId}:${revision.revision}`, storedManifest = records.find(record => record.store === "productionManifests" && record.key === manifestKey)?.value, snapshots = [], entries = [];
            if (storedManifest) {
                for (const entry of storedManifest.schemas) {
                    const stored = records.find(record => record.store === "schemaRevisions" && record.key === entry.snapshotKey)?.value;
                    if (!stored)
                        throw new DOMException(`Legacy production schema ${entry.snapshotKey} is unavailable during compaction.`, "DataError");
                    const snapshot = compactedValue("schemaRevisions", entry.snapshotKey, stored), fingerprint = await checksum(JSON.stringify(comparable(snapshot.effectiveSchema))), updatedSnapshot = { ...clone(snapshot), fingerprint };
                    snapshots.push({ key: entry.snapshotKey, before: stored, snapshot: updatedSnapshot });
                    entries.push({ ...clone(entry), fingerprint });
                }
            }
            else
                for (const history of legacyProductionSchemaHistories(candidate.value)) {
                    for (const [revisionIndex, effectiveSchema] of history.effectiveSchemas.entries()) {
                        const schemaRevision = revisionIndex + 1, key = `${revision.projectId}:${history.schemaId}:${schemaRevision}`, before = records.find(record => record.store === "schemaRevisions" && record.key === key)?.value, fingerprint = await checksum(JSON.stringify(comparable(effectiveSchema))), snapshot = { projectId: revision.projectId, schemaId: history.schemaId, schemaRevision, fingerprint, effectiveSchema: clone(effectiveSchema), createdAt: revision.publishedAt };
                        snapshots.push({ key, ...(before ? { before } : {}), snapshot });
                        if (schemaRevision === history.effectiveSchemas.length)
                            entries.push({ schemaId: history.schemaId, schemaRevision, fingerprint, snapshotKey: key });
                    }
                }
            const sortedEntries = entries.sort((left, right) => left.schemaId.localeCompare(right.schemaId)), projectFingerprint = await checksum(JSON.stringify({ project: productionProject(revision.state.project), schemas: sortedEntries.map(({ schemaId, fingerprint }) => ({ schemaId, fingerprint })) })), manifest = { projectId: revision.projectId, projectRevision: revision.revision, projectFingerprint, publicationId: revision.publicationId, publishedAt: revision.publishedAt, schemas: sortedEntries };
            productionUpdates.push({ key: manifestKey, ...(storedManifest ? { before: storedManifest } : {}), manifest, snapshots });
        }
        return this.backend.transaction([...candidateStores, "migrationBackups", "migrationReceipts"], "readwrite", async (transaction) => { const currentReceipt = await transaction.get("migrationReceipts", receiptKey); if (currentReceipt?.verified)
            return currentReceipt; for (const candidate of changed)
            if (!same(await transaction.get(candidate.store, candidate.key), candidate.value))
                throw new DOMException(`Legacy schema history changed during startup migration at ${candidate.store}/${candidate.key}.`, "AbortError"); for (const update of productionUpdates) {
            if (!same(await transaction.get("productionManifests", update.key), update.before))
                throw new DOMException(`Legacy production manifest changed during startup migration at ${update.key}.`, "AbortError");
            for (const snapshot of update.snapshots)
                if (!same(await transaction.get("schemaRevisions", snapshot.key), snapshot.before))
                    throw new DOMException(`Legacy production schema changed during startup migration at ${snapshot.key}.`, "AbortError");
        } await transaction.put("migrationBackups", receiptKey, { version: 1, records: changed.map(({ store, key, compaction }) => ({ store, key, value: clone(compaction.value) })), entryCount, beforeChecksum, afterChecksum, createdAt: this.options.now() }); this.fail("Legacy durable schema-history migration"); for (const candidate of changed)
            await transaction.put(candidate.store, candidate.key, candidate.compaction.value); for (const update of productionUpdates) {
            for (const snapshot of update.snapshots)
                await transaction.put("schemaRevisions", snapshot.key, snapshot.snapshot);
            await transaction.put("productionManifests", update.key, update.manifest);
        } for (const candidate of changed) {
            const replacedSnapshot = candidate.store === "schemaRevisions" && productionUpdates.some(update => update.snapshots.some(snapshot => snapshot.key === candidate.key));
            if (!replacedSnapshot && !same(await transaction.get(candidate.store, candidate.key), candidate.compaction.value))
                throw new DOMException(`Legacy schema-history read-back failed at ${candidate.store}/${candidate.key}.`, "OperationError");
        } for (const update of productionUpdates) {
            if (!same(await transaction.get("productionManifests", update.key), update.manifest))
                throw new DOMException(`Legacy production-manifest read-back failed at ${update.key}.`, "OperationError");
            for (const snapshot of update.snapshots)
                if (!same(await transaction.get("schemaRevisions", snapshot.key), snapshot.snapshot))
                    throw new DOMException(`Legacy production-schema read-back failed at ${snapshot.key}.`, "OperationError");
        } await transaction.put("migrationReceipts", receiptKey, receipt); return receipt; });
    }
    async deleteMigrationBackup(input) {
        if (input.label !== "Delete retained legacy migration backup")
            throw new Error("Migration backup deletion requires its named consequence review.");
        return this.backend.transaction(["migrationBackups"], "readwrite", async (transaction) => { const existing = await transaction.get("migrationBackups", input.backupId); if (existing === undefined)
            return false; await transaction.delete("migrationBackups", input.backupId); return true; });
    }
    normalizeSavedSchema(value) { if (record(value.schema) && typeof value.token === "string") {
        const { tokenHistory: _tokenHistory, ...current } = value;
        return clone(current);
    } const token = `legacy-schema:${String(value.id)}`; return { schema: clone(value), token, revision: Number(value.version ?? 0), lastSavedAt: "legacy" }; }
    async savedSchemaRecords() { return this.backend.transaction(["savedSchemas"], "readonly", async (transaction) => (await transaction.getAll("savedSchemas")).map(({ value }) => this.normalizeSavedSchema(value))); }
    async listSavedSchemaMetadata() { return (await this.savedSchemaRecords()).map(({ schema, token }) => ({ id: String(schema.id), name: String(schema.name), version: Number(schema.version ?? 0), token })); }
    async savedSchemas() { return (await this.savedSchemaRecords()).map(({ schema }) => clone(schema)); }
    async applySavedSchemaBatch(input) { this.fail(input.label); const result = await this.backend.transaction(["savedSchemas"], "readwrite", async (transaction) => { const checked = new Map(); for (const operation of input.upserts) {
        const schemaId = String(operation.schema.id);
        if (!schemaId)
            throw new Error("A saved schema command requires an id.");
        const raw = await transaction.get("savedSchemas", schemaId), current = raw ? this.normalizeSavedSchema(raw) : undefined;
        checked.set(schemaId, current);
        if (current?.token !== operation.baseToken && Boolean(current || operation.baseToken))
            return { status: "conflict", schemaId, baseToken: operation.baseToken, currentToken: current?.token ?? "missing", current: clone(current?.schema ?? {}), pending: clone(operation.schema) };
    } for (const operation of input.deletes) {
        const raw = await transaction.get("savedSchemas", operation.schemaId), current = raw ? this.normalizeSavedSchema(raw) : undefined;
        checked.set(operation.schemaId, current);
        if (!current || current.token !== operation.baseToken)
            return { status: "conflict", schemaId: operation.schemaId, baseToken: operation.baseToken, currentToken: current?.token ?? "missing", current: clone(current?.schema ?? {}), pending: undefined };
    } const changes = []; for (const operation of input.upserts) {
        const schemaId = String(operation.schema.id), current = checked.get(schemaId), token = this.options.token(), recordValue = { schema: clone(operation.schema), token, revision: (current?.revision ?? 0) + 1, lastSavedAt: this.options.now() };
        await transaction.put("savedSchemas", schemaId, recordValue);
        changes.push({ schemaId, token, deleted: false });
    } for (const operation of input.deletes) {
        const token = this.options.token();
        await transaction.delete("savedSchemas", operation.schemaId);
        changes.push({ schemaId: operation.schemaId, token, deleted: true });
    } return { status: "committed", changes }; }); if (result.status === "committed")
        for (const change of result.changes) {
            for (const listener of this.schemaListeners)
                listener(clone(change));
            if (typeof BroadcastChannel !== "undefined") {
                const channel = new BroadcastChannel("my-chrome-utilities.durable-saved-schemas");
                channel.postMessage(change);
                channel.close();
            }
        } return result; }
    async saveSavedSchema(input) { const result = await this.applySavedSchemaBatch({ upserts: [{ schema: input.schema, ...(input.baseToken ? { baseToken: input.baseToken } : {}) }], deletes: [], label: input.label }); if (result.status === "conflict")
        return { ...result, pending: result.pending ?? clone(input.schema) }; const change = result.changes[0]; return { status: "committed", schemaId: change.schemaId, token: change.token, revision: Number(input.schema.version ?? 0) + 1 }; }
    async deleteSavedSchema(input) { const result = await this.applySavedSchemaBatch({ upserts: [], deletes: [{ schemaId: input.schemaId, baseToken: input.baseToken }], label: input.label }); if (result.status === "conflict")
        throw new DOMException(`${input.label} requires current schema token ${result.currentToken}.`, "AbortError"); }
    async claimLegacyMigration(owner) { return this.backend.transaction(["settings", "migrationReceipts"], "readwrite", async (transaction) => { const receipt = await transaction.get("migrationReceipts", "legacy-v1"); if (receipt?.verified)
        return "complete"; const lock = await transaction.get("settings", "legacyMigrationLock"); if (lock && lock.expiresAt > Date.now() && lock.owner !== owner)
        return "busy"; await transaction.put("settings", "legacyMigrationLock", { owner, at: this.options.now(), expiresAt: Date.now() + 300_000 }); return "claimed"; }); }
    async legacyMigrationComplete() { return this.backend.transaction(["migrationReceipts"], "readonly", async (transaction) => (await transaction.get("migrationReceipts", "legacy-v1"))?.verified === true); }
    async waitForLegacyMigration() { if (await this.legacyMigrationComplete())
        return true; return new Promise((resolve) => { let settled = false, timer, channel; const finish = (value) => { if (settled)
        return; settled = true; if (timer !== undefined)
        clearTimeout(timer); channel?.close(); resolve(value); }, poll = async () => { if (await this.legacyMigrationComplete()) {
        finish(true);
        return;
    } const lock = await this.backend.transaction(["settings"], "readonly", transaction => transaction.get("settings", "legacyMigrationLock")); if (!lock || lock.expiresAt <= Date.now()) {
        finish(false);
        return;
    } timer = setTimeout(poll, 250); }; if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("my-chrome-utilities.durable-migration");
        channel.addEventListener("message", () => void poll());
        channel.unref?.();
    } void poll(); }); }
    async importLegacy(owner, records) {
        records = { ...records, projects: records.projects.map((entry) => ({ ...entry, state: upgradeSeparatedState(entry.state) })) };
        await this.backend.transaction(allStores, "readwrite", async (transaction) => {
            const lock = await transaction.get("settings", "legacyMigrationLock");
            if (lock?.owner !== owner)
                throw new DOMException("Legacy migration lease is not owned by this context.", "AbortError");
            const manifests = [];
            for (const entry of records.projects) {
                const draftToken = this.options.token(), parts = projectParts(entry.state), publishedRevision = Math.max(0, ...entry.state.project.releases.map(({ revision }) => revision));
                manifests.push({ entry, parts });
                await replaceProjectParts(transaction, entry.state.project.id, parts);
                await transaction.put("projectMetadata", entry.state.project.id, { projectId: entry.state.project.id, name: entry.state.project.name, site: entry.state.project.site, owner: String(entry.state.project.owner ?? ""), draftToken, draftSequence: entry.revision, publishedRevision, lastSavedAt: this.options.now(), fieldVersions: Object.fromEntries([...parts.keys()].map(key => [key, entry.revision])), active: entry.active, ...(entry.state.draft ? { draft: clone(entry.state.draft) } : {}), ...(entry.navigation ? { navigation: clone(entry.navigation) } : {}) });
                for (const release of entry.state.project.releases) {
                    const publishedProject = { ...clone(entry.state.project), collections: clone(release.snapshot), releases: entry.state.project.releases.filter(candidate => candidate.revision <= release.revision), currentRelease: release.id }, revision = { projectId: entry.state.project.id, revision: release.revision, publicationId: release.id, publishedAt: release.createdAt, sourceDraftToken: draftToken, state: { project: publishedProject, history: { undo: [], redo: [] } } };
                    await transaction.put("projectRevisions", `${entry.state.project.id}:${release.revision}`, revision);
                }
                if (entry.active)
                    await transaction.put("settings", "activeProjectId", entry.state.project.id);
            }
            for (const schema of records.schemas) {
                const token = this.options.token();
                await transaction.put("savedSchemas", String(schema.id), { schema: clone(schema), token, revision: Number(schema.version ?? 0), lastSavedAt: this.options.now() });
            }
            await transaction.put("migrationBackups", "legacy-v1", records.backup);
            this.fail("Legacy migration verification");
            for (const { entry, parts } of manifests) {
                const metadata = await transaction.get("projectMetadata", entry.state.project.id);
                if (!metadata || metadata.draftSequence !== entry.revision || !same(metadata.navigation, entry.navigation))
                    throw new DOMException(`Migration verification failed for ${entry.state.project.id} metadata.`, "OperationError");
                for (const { identity, value } of parts.values())
                    if (!same(await transaction.get(identity.store, identity.key), value))
                        throw new DOMException(`Migration verification failed for ${identity.store}/${identity.key}.`, "OperationError");
                for (const release of entry.state.project.releases) {
                    const revision = await transaction.get("projectRevisions", `${entry.state.project.id}:${release.revision}`);
                    if (!revision || !same(revision.state.project.collections, release.snapshot))
                        throw new DOMException(`Migration verification failed for immutable release ${release.id}.`, "OperationError");
                }
            }
            for (const schema of records.schemas) {
                const saved = await transaction.get("savedSchemas", String(schema.id));
                if (!saved || !same(saved.schema, schema))
                    throw new DOMException(`Migration verification failed for saved schema ${String(schema.id)}.`, "OperationError");
            }
            const backup = await transaction.get("migrationBackups", "legacy-v1");
            if (!same(backup?.sources.map(({ key, checksum }) => ({ key, checksum })), records.backup.sources.map(({ key, checksum }) => ({ key, checksum }))))
                throw new DOMException("Migration backup manifest verification failed.", "OperationError");
            const verifiedAt = this.options.now();
            await transaction.put("migrationReceipts", "legacy-v1", { version: 1, projectIds: records.projects.map(({ state }) => state.project.id), sourceChecksums: records.backup.sources.map(({ key, checksum }) => ({ key, checksum })), legacyEditCompactions: clone(records.compactions ?? []), verified: true, phase: "verified", owner, at: verifiedAt, verifiedAt });
            await transaction.delete("settings", "legacyMigrationLock");
        });
        if (typeof BroadcastChannel !== "undefined") {
            const channel = new BroadcastChannel("my-chrome-utilities.durable-migration");
            channel.postMessage({ status: "verified" });
            channel.close();
        }
    }
    async abandonLegacyMigration(owner) { await this.backend.transaction(["settings"], "readwrite", async (transaction) => { const lock = await transaction.get("settings", "legacyMigrationLock"); if (lock?.owner === owner)
        await transaction.delete("settings", "legacyMigrationLock"); }); }
    async exportProject(projectId) { const loaded = await this.loadProject(projectId), publishedProject = loaded.publishedRevision ? (await this.loadPublishedRevision(projectId, loaded.publishedRevision)).state.project : undefined, manifest = await this.currentProductionManifest(projectId), schemaSnapshots = manifest ? await Promise.all(manifest.schemas.map(entry => this.loadProductionSchema({ projectId, projectRevision: manifest.projectRevision, schemaId: entry.schemaId, schemaRevision: entry.schemaRevision, fingerprint: entry.fingerprint }))) : [], currentRelease = loaded.state.project.releases.find(({ revision }) => revision === loaded.publishedRevision), draftProject = { ...clone(loaded.state.project), releases: currentRelease ? [clone(currentRelease)] : [], ...(currentRelease ? { currentRelease: currentRelease.id } : {}) }, productionProjectSnapshot = publishedProject ? { ...clone(publishedProject), releases: currentRelease ? [clone(currentRelease)] : [], ...(currentRelease ? { currentRelease: currentRelease.id } : {}) } : undefined; return { format: "my-chrome-utilities.durable-project-bundle", version: 2, sourceProjectId: projectId, sourceName: loaded.state.project.name, publishedRevision: loaded.publishedRevision, baseProjectRevision: loaded.publishedRevision, ...(productionProjectSnapshot ? { publishedProject: productionProjectSnapshot } : {}), ...(manifest ? { productionManifest: clone(manifest), schemaSnapshots: clone(schemaSnapshots) } : {}), project: draftProject, draft: clone(loaded.state.draft) }; }
    async exportRecoveryBundle(projectId) { const project = await this.exportProject(projectId), metadata = (await this.listProjectMetadata()).find(entry => entry.projectId === projectId), migrationBackup = await this.migrationBackup(); return { format: "my-chrome-utilities.durable-recovery-bundle", version: 1, createdAt: this.options.now(), project, metadata: metadata ? clone(metadata) : undefined, migrationBackup }; }
    async exportRepositoryRecoveryBundle() { const metadata = await this.listProjectMetadata(), projects = await Promise.all(metadata.map(({ projectId }) => this.exportProject(projectId))), savedSchemas = await this.savedSchemaRecords(), internal = await this.backend.transaction(["projectRevisions", "productionManifests", "schemaRevisions", "settings", "migrationReceipts", "migrationBackups"], "readonly", async (transaction) => ({ projectRevisions: await transaction.getAll("projectRevisions"), productionManifests: await transaction.getAll("productionManifests"), schemaRevisions: await transaction.getAll("schemaRevisions"), settings: await transaction.getAll("settings"), migrationReceipts: await transaction.getAll("migrationReceipts"), migrationBackups: await transaction.getAll("migrationBackups") })); return { format: "my-chrome-utilities.durable-repository-recovery-bundle", version: 2, createdAt: this.options.now(), metadata: clone(metadata), projects: clone(projects), savedSchemas: clone(savedSchemas), ...clone(internal) }; }
    async importProject(bundle, input) {
        if (bundle.format !== "my-chrome-utilities.durable-project-bundle" || !record(bundle.project))
            throw new Error("Choose a durable project bundle.");
        const compacted = compactLegacyEditHistory(bundle.project), sourceState = upgradeSeparatedState({ project: compacted.value, history: { undo: [], redo: [] } }), source = sourceState.project, mapping = projectIdentityMapping(source, input.projectId), mappedProject = remapProjectReferences(source, mapping);
        mappedProject.name = input.name;
        const repairedProject = repairCanonicalBooleanValuesInProject(mappedProject), project = repairedProject.project, publishedRevision = Number(bundle.publishedRevision ?? bundle.baseProjectRevision ?? 0), rawSourcePublishedProject = record(bundle.publishedProject) ? bundle.publishedProject : undefined, sourcePublishedProject = rawSourcePublishedProject ? upgradeSeparatedState({ project: compactLegacyEditHistory(rawSourcePublishedProject).value, history: { undo: [], redo: [] } }).project : undefined;
        if (publishedRevision > 0 && !record(bundle.publishedProject))
            throw new DOMException(`Imported project ${input.projectId} declares Published revision ${publishedRevision} without its immutable domain project snapshot.`, "DataError");
        const mappedPublishedProject = sourcePublishedProject ? remapProjectReferences(sourcePublishedProject, mapping) : undefined;
        if (mappedPublishedProject)
            mappedPublishedProject.name = input.name;
        const repairedPublishedProject = mappedPublishedProject ? repairCanonicalBooleanValuesInProject(mappedPublishedProject) : undefined, publishedProject = repairedPublishedProject?.project;
        let production;
        if (record(bundle.productionManifest) && Array.isArray(bundle.schemaSnapshots)) {
            const sourceManifest = bundle.productionManifest, sourceSnapshots = bundle.schemaSnapshots.filter(record), at = this.options.now(), entries = [], snapshots = [];
            if (sourceManifest.projectRevision !== publishedRevision || sourceManifest.projectId !== String(bundle.sourceProjectId ?? source.id) || !sourcePublishedProject)
                throw new DOMException("Imported production manifest does not match its Project revision identity.", "DataError");
            if (new Set(sourceManifest.schemas.map(({ schemaId }) => schemaId)).size !== sourceManifest.schemas.length)
                throw new DOMException("Imported production manifest contains duplicate schema identities.", "DataError");
            for (const entry of sourceManifest.schemas ?? []) {
                const schemaId = mapping.get(entry.schemaId) ?? entry.schemaId, snapshot = sourceSnapshots.find(candidate => candidate.projectId === sourceManifest.projectId && candidate.schemaId === entry.schemaId && candidate.schemaRevision === entry.schemaRevision && candidate.fingerprint === entry.fingerprint);
                if (!snapshot)
                    throw new DOMException(`Imported production schema ${entry.schemaId}:${entry.schemaRevision} has no matching immutable snapshot fingerprint.`, "DataError");
                const fingerprint = await checksum(JSON.stringify(comparable(snapshot.effectiveSchema)));
                if (fingerprint !== entry.fingerprint)
                    throw new DOMException(`Imported production schema ${entry.schemaId}:${entry.schemaRevision} content fingerprint does not match its bytes.`, "DataError");
                entries.push({ schemaId, schemaRevision: entry.schemaRevision, fingerprint: entry.fingerprint, snapshotKey: `${input.projectId}:${schemaId}:${entry.schemaRevision}` });
                snapshots.push({ ...clone(snapshot), projectId: input.projectId, schemaId, createdAt: at });
            }
            const sourceProjectFingerprint = await checksum(JSON.stringify({ project: productionProject(rawSourcePublishedProject), schemas: sourceManifest.schemas.map(({ schemaId, fingerprint }) => ({ schemaId, fingerprint })).sort((left, right) => left.schemaId.localeCompare(right.schemaId)) }));
            if (sourceProjectFingerprint !== sourceManifest.projectFingerprint)
                throw new DOMException("Imported production Project content fingerprint does not match its immutable snapshot.", "DataError");
            const projectFingerprint = await checksum(JSON.stringify({ project: productionProject(publishedProject), schemas: entries.map(({ schemaId, fingerprint }) => ({ schemaId, fingerprint })).sort((left, right) => left.schemaId.localeCompare(right.schemaId)) }));
            production = { manifest: { ...clone(sourceManifest), projectId: input.projectId, projectRevision: publishedRevision, projectFingerprint, publishedAt: at, schemas: entries }, snapshots };
        }
        await this.putProjectMetadataOnly({ project, ...(record(bundle.draft) ? { draft: remapProjectReferences(compactLegacyEditHistory(bundle.draft).value, mapping) } : {}), history: { undo: [], redo: [] } }, { publishedRevision, ...(publishedProject ? { publishedProject } : {}), ...(production ? { production } : {}), active: false });
        return { projectId: input.projectId, active: false, canonicalRepairCount: repairedProject.repairCount + (repairedPublishedProject?.repairCount ?? 0) };
    }
}
export function createMemoryDurableProjectRepository(options = {}) { return new DurableProjectRepository(new MemoryBackend(), { now: options.now ?? (() => new Date().toISOString()), token: options.token ?? (() => `draft:${crypto.randomUUID()}`) }); }
export async function openIndexedDbProjectRepository(factory = globalThis.indexedDB, options = {}) { if (!factory)
    throw new DOMException("IndexedDB is unavailable.", "InvalidStateError"); const request = factory.open(DURABLE_PROJECT_DATABASE, DURABLE_PROJECT_DATABASE_VERSION), database = await new Promise((resolve, reject) => { request.onupgradeneeded = (event) => { if (request.result.objectStoreNames.contains("changes"))
    request.result.deleteObjectStore("changes"); for (const store of DURABLE_PROJECT_STORES)
    if (!request.result.objectStoreNames.contains(store))
        request.result.createObjectStore(store); if (event.oldVersion === 0)
    request.transaction.objectStore("migrationReceipts").put({ entryCount: 0, beforeChecksum: "", afterChecksum: "", verified: true }, "selective-production-revisions-v1"); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error ?? new Error("Cannot open the durable project repository.")); request.onblocked = () => reject(new DOMException("The durable project repository upgrade is blocked.", "InvalidStateError")); }); const repository = new DurableProjectRepository(new IndexedDbBackend(database), { now: options.now ?? (() => new Date().toISOString()), token: options.token ?? (() => `draft:${crypto.randomUUID()}`) }); await repository.compactLegacyDurableSchemaHistory(); await repository.upgradeLegacyPropertySetStorage(); await repository.repairOrphanFlowGraphs(); return repository; }
export class DurablePageHistoryConflict extends DOMException {
    projectId;
    commandId;
    label;
    direction;
    field;
    currentValue;
    expectedValue;
    patches;
    constructor(projectId, commandId, label, direction, field, currentValue, expectedValue, patches) {
        super(`${direction === "undo" ? "Undo" : "Redo"} ${label} is blocked because ${field} changed in a newer Saved Draft.`, "AbortError");
        this.projectId = projectId;
        this.commandId = commandId;
        this.label = label;
        this.direction = direction;
        this.field = field;
        this.currentValue = currentValue;
        this.expectedValue = expectedValue;
        this.patches = patches;
    }
}
export function createPageProjectHistory() {  const undo = [], redo = [], currentValue = (current, patch) => { let value = projectParts(current.state).get(`${patch.store}/${patch.key}`)?.value; for (const part of patch.path)
    value = record(value) ? value[part] : undefined; return value; }, excludedAction = (command) => command.patches.some((patch) => patch.store === "fixtures" || patch.store === "releases" || patch.store === "projectEntityMetadata" && patch.key.startsWith(`${command.projectId}:fixtures:`) || patch.store === "projectRoots" && patch.path.includes("currentRelease")), assertExpected = (current, entry, direction) => { const expected = direction === "undo" ? entry.forward.map(({ after }) => after) : entry.forward.map(({ before }) => before), mismatch = entry.forward.findIndex((patch, index) => !same(currentValue(current, patch), expected[index])); if (mismatch >= 0) {
    const patch = entry.forward[mismatch], currentFieldValue = currentValue(current, patch), pendingPatches = direction === "undo" ? entry.inverse : entry.forward;
    throw new DurablePageHistoryConflict(entry.projectId, entry.commandId, entry.label, direction, fieldFor(patch), clone(currentFieldValue), clone(pendingPatches[mismatch]?.after), clone(pendingPatches));
} }; return { push(command) { if (excludedAction(command))
        return; const forward = command.patches.map(clone); if (!forward.length)
        return; undo.push({ projectId: command.projectId, commandId: command.commandId, label: command.label, forward, inverse: forward.map(patch => ({ ...clone(patch), before: clone(patch.after), after: clone(patch.before) })) }); redo.length = 0; }, undo(current) { const entry = undo.at(-1); if (!entry)
        return undefined; assertExpected(current, entry, "undo"); undo.pop(); redo.push(entry); return { projectId: entry.projectId, baseToken: current.draftToken, baseSequence: current.draftSequence, commandId: `undo:${entry.commandId}`, label: `Undo ${entry.label}`, patches: clone(entry.inverse), pendingState: clone(current.state) }; }, redo(current) { const entry = redo.at(-1); if (!entry)
        return undefined; assertExpected(current, entry, "redo"); redo.pop(); undo.push(entry); return { projectId: entry.projectId, baseToken: current.draftToken, baseSequence: current.draftSequence, commandId: `redo:${entry.commandId}`, label: `Redo ${entry.label}`, patches: clone(entry.forward), pendingState: clone(current.state) }; }, restoreFailed(direction) { if (direction === "undo") {
        const entry = redo.pop();
        if (entry)
            undo.push(entry);
    }
    else {
        const entry = undo.pop();
        if (entry)
            redo.push(entry);
    } }, snapshot: () => ({ undo: undo.map(({ commandId, label }) => ({ commandId, label })), redo: redo.map(({ commandId, label }) => ({ commandId, label })) }) }; }
const differingFields = (left, right, path = "project") => { if (same(left, right))
    return []; if (record(left) && record(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    return [...keys].flatMap(key => differingFields(left[key], right[key], `${path}.${key}`));
} return [path]; };
const legacyProjectErrors = (state, label) => { if (!record(state) || !record(state.project))
    return [`${label} does not contain a ProjectState project.`]; const project = state.project; if (typeof project.id !== "string" || !record(project.collections))
    return [`${label} has invalid project identity or collections.`]; const entities = Object.values(project.collections).flatMap(value => Array.isArray(value) ? value : []), ids = new Set(entities.flatMap(value => record(value) && typeof value.id === "string" ? [value.id] : [])), errors = []; for (const entity of entities) {
    if (!record(entity) || typeof entity.id !== "string" || typeof entity.name !== "string") {
        errors.push(`${label} contains an entity without stable id and name.`);
        continue;
    }
    for (const field of ["profileId", "pageId", "eventId", "flowId", "applicabilitySetId"]) {
        const value = entity[field];
        if (typeof value === "string" && value && !ids.has(value))
            errors.push(`${label} ${entity.id} references missing ${field} ${value}.`);
    }
    for (const field of ["profileIds", "pageGroupIds"]) {
        const values = entity[field];
        if (Array.isArray(values))
            for (const value of values)
                if (typeof value !== "string" || !ids.has(value))
                    errors.push(`${label} ${entity.id} references missing ${field} ${String(value)}.`);
    }
} return errors; };
export async function migrateLegacyProjectStorage(repository, storage, options = {}) {
    const raw = Object.values(LEGACY_PROJECT_KEYS).flatMap(key => { const value = storage.getItem(key); return value === null ? [] : [{ key, value }]; });
    if (!raw.length)
        return { status: "none", removedKeys: [] };
    const libraryRaw = storage.getItem(LEGACY_PROJECT_KEYS.library), activeRaw = storage.getItem(LEGACY_PROJECT_KEYS.active), navigationRaw = storage.getItem(LEGACY_PROJECT_KEYS.navigation), schemasRaw = storage.getItem(LEGACY_PROJECT_KEYS.schemas), invalid = new Map(), parse = (key, value) => { if (value === null)
        return undefined; try {
        return JSON.parse(value);
    }
    catch (error) {
        invalid.set(key, error instanceof Error ? error.message : String(error));
        return undefined;
    } }, libraryValue = parse(LEGACY_PROJECT_KEYS.library, libraryRaw), activeValue = parse(LEGACY_PROJECT_KEYS.active, activeRaw), navigationValue = parse(LEGACY_PROJECT_KEYS.navigation, navigationRaw), schemasValue = parse(LEGACY_PROJECT_KEYS.schemas, schemasRaw);
    if (libraryValue !== undefined && (!record(libraryValue) || !record(libraryValue.projects)))
        invalid.set(LEGACY_PROJECT_KEYS.library, "Project library must contain a projects object.");
    if (activeValue !== undefined && (!record(activeValue) || !record(activeValue.project)))
        invalid.set(LEGACY_PROJECT_KEYS.active, "Active projection must contain a project object.");
    if (navigationValue !== undefined && (!record(navigationValue) || typeof navigationValue.kind !== "string" || (navigationValue.id !== undefined && typeof navigationValue.id !== "string") || (navigationValue.projectId !== undefined && typeof navigationValue.projectId !== "string")))
        invalid.set(LEGACY_PROJECT_KEYS.navigation, "Project navigation must contain a route kind and optional project/entity identities.");
    if (schemasValue !== undefined && !Array.isArray(schemasValue))
        invalid.set(LEGACY_PROJECT_KEYS.schemas, "Saved schema source must be an array.");
    const library = libraryValue, active = activeValue, navigation = navigationValue, activeState = active?.project ? { project: active.project, ...(active.draft ? { draft: active.draft } : {}), history: active.history ?? { undo: [], redo: [] } } : undefined;
    for (const [projectId, entry] of Object.entries(library?.projects ?? {})) {
        for (const error of legacyProjectErrors(entry?.state, `Library project ${projectId}`))
            invalid.set(LEGACY_PROJECT_KEYS.library, error);
    }
    if (activeState)
        for (const error of legacyProjectErrors(activeState, "Active project"))
            invalid.set(LEGACY_PROJECT_KEYS.active, error);
    if (options.choice === "library" && !invalid.has(LEGACY_PROJECT_KEYS.library))
        invalid.delete(LEGACY_PROJECT_KEYS.active);
    if (options.choice === "active" && !invalid.has(LEGACY_PROJECT_KEYS.active))
        invalid.delete(LEGACY_PROJECT_KEYS.library);
    if (invalid.size)
        return { status: "invalid-source-review", sources: await Promise.all(raw.map(async ({ key, value }) => ({ key, valid: !invalid.has(key), error: invalid.get(key) ?? "Valid source preserved; choose it explicitly or repair the invalid source.", bytes: new TextEncoder().encode(value).byteLength, checksum: await checksum(value), payload: value }))), actions: ["Export preserved sources", "Repair source and retry", "Choose a valid source"] };
    const effectiveLibrary = options.choice === "active" ? undefined : library, effectiveActiveState = options.choice === "library" ? undefined : activeState, effectiveActive = options.choice === "library" ? undefined : active, projectIds = new Set([...Object.keys(effectiveLibrary?.projects ?? {}), ...(effectiveActiveState ? [effectiveActiveState.project.id] : [])]), selected = [];
    for (const projectId of projectIds) {
        const fromLibrary = effectiveLibrary?.projects?.[projectId], fromActive = effectiveActiveState?.project.id === projectId ? { state: effectiveActiveState, revision: Number(effectiveActive?.revision ?? 0) } : undefined;
        if (fromLibrary && fromActive && fromLibrary.revision === fromActive.revision && !same(fromLibrary.state.project, fromActive.state.project) && !options.choice) {
            return { status: "review-required", projectId, sources: [{ source: "library", revision: fromLibrary.revision, checksum: await checksum(JSON.stringify(fromLibrary.state.project)) }, { source: "active", revision: fromActive.revision, checksum: await checksum(JSON.stringify(fromActive.state.project)) }], conflictingFields: differingFields(fromLibrary.state.project, fromActive.state.project) };
        }
        const winner = !fromLibrary ? fromActive : !fromActive ? fromLibrary : fromActive.revision > fromLibrary.revision ? fromActive : fromLibrary, state = clone(winner.state), standaloneNavigation = navigation && (navigation.projectId === projectId || (!navigation.projectId && (effectiveLibrary?.activeProjectId === projectId || effectiveActiveState?.project.id === projectId))) ? { kind: navigation.kind, ...(navigation.id ? { id: navigation.id } : {}) } : undefined, projectNavigation = standaloneNavigation ?? fromLibrary?.navigation;
        state.history = { undo: [], redo: [] };
        selected.push({ state, revision: winner.revision, active: options.choice === "active" ? effectiveActiveState?.project.id === projectId : effectiveLibrary?.activeProjectId === projectId || (options.choice === undefined && effectiveActiveState?.project.id === projectId), ...(projectNavigation ? { navigation: clone(projectNavigation) } : {}) });
    }
    const owner = crypto.randomUUID(), claim = await repository.claimLegacyMigration(owner);
    if (claim === "busy") {
        if (!await repository.waitForLegacyMigration())
            return migrateLegacyProjectStorage(repository, storage, options);
        for (const { key } of raw)
            storage.removeItem(key);
        return { status: "migrated", removedKeys: raw.map(({ key }) => key) };
    }
    if (claim === "complete") {
        for (const { key } of raw)
            storage.removeItem(key);
        return { status: "migrated", removedKeys: raw.map(({ key }) => key) };
    }
    const backup = { sources: await Promise.all(raw.map(async ({ key, value }) => ({ key, bytes: new TextEncoder().encode(value).byteLength, checksum: await checksum(value), value }))) }, schemaSource = (schemasValue ?? []), projectCompactions = selected.map(entry => ({ entry, compaction: compactLegacyEditHistory(entry.state) })), schemaCompactions = schemaSource.map(schema => compactLegacyEditHistory(schema)), projects = projectCompactions.map(({ entry, compaction }) => ({ ...entry, state: compaction.value })), schemas = schemaCompactions.map(({ value }) => value), changed = [...projectCompactions.map(({ compaction }) => compaction), ...schemaCompactions].filter(({ entryCount }) => entryCount > 0), compactions = await Promise.all(changed.map(async ({ entryCount, before, after }) => ({ entryCount, beforeChecksum: await checksum(before), afterChecksum: await checksum(after) })));
    try {
        await repository.importLegacy(owner, { projects, schemas, backup, compactions });
    }
    catch (error) {
        await repository.abandonLegacyMigration(owner);
        throw error;
    }
    for (const { key } of raw)
        storage.removeItem(key);
    return { status: "migrated", removedKeys: raw.map(({ key }) => key) };
}
//# sourceMappingURL=data-layer-durable-project-repository.js.map