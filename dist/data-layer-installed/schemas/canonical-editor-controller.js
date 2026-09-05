import { beginCompactCanonicalHistoryTransition, canonicalCommandOutcome, canonicalCommandsFromCompactProjection, compactCanonicalCommandPolicy, compactCanonicalHistorySettlement, completeCompactCanonicalHistoryTransition, rejectCompactCanonicalHistoryTransition, } from "../../utilities/data-layer/schemas.js";
/** Owns the mutable state for compact canonical editing and settlement. */
export class SchemaCanonicalEditorController {
    #ports;
    #state = {
        savedDocument: undefined,
        editor: undefined,
        pendingCommand: undefined,
        pendingBase: undefined,
        reviewVisible: false,
        commandFeedback: undefined,
        settlementSequence: 0,
        idSequence: 0,
        settlementPending: false,
        settlementSchemaId: undefined,
        settlementBarrier: Promise.resolve(true),
        projectionRequest: undefined,
        projectionWorker: undefined,
        queuedLibraryPersistence: undefined,
        libraryPersistenceWorker: undefined,
        reopenSelection: undefined,
        historyState: compactCanonicalHistorySettlement(),
        pendingHistoryLabel: undefined,
        presenceDraft: undefined,
    };
    #revisionSnapshots = new Map();
    #settlementClaims = new Map();
    #scrollByKey = new Map();
    get savedDocument() { return this.#state.savedDocument ? structuredClone(this.#state.savedDocument) : undefined; }
    get editorState() {
        const adapter = this.#state.editor, document = adapter?.load();
        if (!adapter || !document)
            return undefined;
        return { key: adapter.key, label: adapter.label, document: structuredClone(document), canUndo: Boolean(adapter.onUndo), canRedo: Boolean(adapter.onRedo),
            actions: (adapter.actions ?? []).map(({ label }) => ({ label })), ...(adapter.migration ? { migration: { summary: adapter.migration.summary,
                    conflicts: structuredClone(adapter.migration.conflicts) } } : {}) };
    }
    get pendingCommand() { return this.#state.pendingCommand ? structuredClone(this.#state.pendingCommand) : undefined; }
    get pendingBase() { return this.#state.pendingBase ? structuredClone(this.#state.pendingBase) : undefined; }
    get reviewVisible() { return this.#state.reviewVisible; }
    get revisionSnapshots() { return new Map([...this.#revisionSnapshots].map(([key, value]) => [key, structuredClone(value)])); }
    get commandFeedback() { return this.#state.commandFeedback; }
    get settlementSequence() { return this.#state.settlementSequence; }
    get settlementClaims() { return new Map(this.#settlementClaims); }
    get idSequence() { return this.#state.idSequence; }
    get settlementPending() { return this.#state.settlementPending; }
    get settlementSchemaId() { return this.#state.settlementSchemaId; }
    get settlementBarrier() { return this.#state.settlementBarrier; }
    get projectionPending() { return Boolean(this.#state.projectionRequest); }
    get queuedLibraryPersistence() {
        return this.#state.queuedLibraryPersistence ? structuredClone(this.#state.queuedLibraryPersistence) : undefined;
    }
    get libraryPersistenceWorker() { return this.#state.libraryPersistenceWorker; }
    get reopenSelection() { return this.#state.reopenSelection; }
    get scrollByKey() { return new Map(this.#scrollByKey); }
    get historyState() { return structuredClone(this.#state.historyState); }
    get pendingHistoryLabel() { return this.#state.pendingHistoryLabel; }
    get presenceDraft() { return this.#state.presenceDraft ? { ...this.#state.presenceDraft } : undefined; }
    constructor(ports) { this.#ports = ports; }
    editorDocument() { const value = this.#state.editor?.load(); return value ? structuredClone(value) : undefined; }
    editorKey() { return this.#state.editor?.key; }
    editorLabel() { return this.#state.editor?.label; }
    hasEditor() { return Boolean(this.#state.editor); }
    isEditorKey(key) { return this.#state.editor?.key === key; }
    runEditorUndo() { return this.#state.editor?.onUndo?.(); }
    runEditorRedo() { return this.#state.editor?.onRedo?.(); }
    runEditorAction(index) { this.#state.editor?.actions?.[index]?.run(); }
    renderEditorContext(host) { this.#state.editor?.renderContext?.(host); }
    resolveMigration(conflictId, choiceId) { this.#state.editor?.migration?.resolve(conflictId, choiceId); }
    cancelMigration() { this.#state.editor?.migration?.cancel(); }
    confirmMigration() { return this.#state.editor?.migration?.confirm() ?? Promise.resolve(); }
    projectEditor(fallback) {
        const adapter = this.#state.editor;
        if (!adapter)
            return undefined;
        const canonical = structuredClone(adapter.load());
        const projected = adapter.projection
            ? adapter.projection(structuredClone(canonical))
            : fallback(structuredClone(canonical));
        return structuredClone(projected);
    }
    setSavedDocument(value) {
        this.#state.savedDocument = value ? structuredClone(value) : undefined;
    }
    openEditor(adapter) {
        this.#state.editor = adapter;
        this.#state.reopenSelection = adapter.key;
        this.#revisionSnapshots.clear();
        this.recordRevision(adapter.load());
    }
    closeEditor() { this.#state.editor = undefined; }
    setPresenceDraft(value) {
        this.#state.presenceDraft = value ? { ...value } : undefined;
    }
    setCommandFeedback(message) { this.#state.commandFeedback = message; }
    showPendingComparison() {
        this.#state.reviewVisible = true;
        const latest = this.#state.editor?.load();
        this.#state.commandFeedback = `Comparing command base revision ${this.pendingBase?.revision ?? "unknown"} with latest revision ${latest?.revision ?? "unknown"}.`;
    }
    recordRevision(document) {
        this.#revisionSnapshots.set(document.revision, structuredClone(document));
    }
    createCanonicalId(kind) { return `schema:${kind}:${++this.#state.idSequence}`; }
    rememberScroll(key, scrollTop) { this.#scrollByKey.set(key, scrollTop); }
    rejectDurableChange() {
        this.#state.pendingCommand = undefined;
        this.#state.pendingBase = undefined;
        this.#state.projectionRequest = undefined;
        this.#state.commandFeedback = "Durable schema change rejected; the saved state was restored.";
    }
    beginPendingHistory(projectId, editorKey, label, history) {
        const identity = { operationId: `schema-history:${++this.#state.idSequence}`, projectId, editorKey };
        this.#state.historyState = beginCompactCanonicalHistoryTransition(this.historyState, { ...identity, history });
        this.#state.pendingHistoryLabel = label;
        return identity;
    }
    completePendingHistory(identity) {
        this.#state.historyState = completeCompactCanonicalHistoryTransition(this.historyState, identity);
        if (!this.historyState.pending)
            this.#state.pendingHistoryLabel = undefined;
    }
    rejectPendingHistory(identity) {
        this.#state.historyState = rejectCompactCanonicalHistoryTransition(this.historyState, identity);
        if (!this.historyState.pending)
            this.#state.pendingHistoryLabel = undefined;
    }
    pendingHistoryFor(projectId, label) {
        const pending = this.historyState.pending;
        return pending && pending.projectId === projectId && this.pendingHistoryLabel === label
            ? { operationId: pending.operationId, projectId: pending.projectId, editorKey: pending.editorKey } : undefined;
    }
    semanticUnresolved(owned) {
        return Boolean(this.settlementPending || this.historyState.pending || this.#state.pendingCommand
            || (this.#state.projectionWorker && this.#state.projectionWorker.adapter !== owned?.adapter)
            || (this.#state.projectionRequest && this.#state.projectionRequest !== owned));
    }
    savedSchemaId(adapter) {
        return adapter?.key.startsWith("saved:") ? adapter.key.slice("saved:".length) : undefined;
    }
    beginSettlement(schemaId) {
        const settlement = ++this.#state.settlementSequence;
        this.#settlementClaims.set(settlement, schemaId);
        this.#state.settlementPending = true;
        this.#state.settlementSchemaId = schemaId;
        return settlement;
    }
    clearSettlement(schemaId, settlement) {
        if (settlement !== undefined) {
            if (!this.settlementClaims.has(settlement) || this.settlementClaims.get(settlement) !== schemaId)
                return false;
            this.#settlementClaims.delete(settlement);
            if (this.settlementClaims.size) {
                this.#state.settlementSchemaId = [...this.settlementClaims.values()].at(-1);
                return false;
            }
        }
        else
            this.#settlementClaims.clear();
        if (this.queuedLibraryPersistence || this.libraryPersistenceWorker) {
            this.#state.settlementPending = true;
            this.#state.settlementSchemaId = this.queuedLibraryPersistence?.schemaId ?? schemaId;
            return false;
        }
        this.#state.settlementPending = false;
        this.#state.settlementSchemaId = undefined;
        return true;
    }
    queueLibraryPersistence(schemaId, schemas, fallback) {
        if (!this.#ports.settleLibrary || !this.#ports.writeLibrary) {
            fallback();
            return;
        }
        this.#state.queuedLibraryPersistence = { schemaId, schemas: structuredClone([...schemas]) };
        this.#state.settlementPending = true;
        this.#state.settlementSchemaId = schemaId;
        this.#ports.setBusy(true);
        void this.settlementBarrier.then((committed) => { if (committed)
            this.#startLibraryPersistence(); });
    }
    #startLibraryPersistence() {
        const ports = this.#ports;
        if (this.libraryPersistenceWorker || !this.queuedLibraryPersistence || this.settlementClaims.size || !ports.settleLibrary || !ports.writeLibrary)
            return;
        const settle = ports.settleLibrary, write = ports.writeLibrary, queuedId = this.queuedLibraryPersistence.schemaId;
        this.#state.libraryPersistenceWorker = (async () => {
            let active;
            try {
                while ((ports.mounted?.() ?? true) && this.queuedLibraryPersistence) {
                    active = this.queuedLibraryPersistence;
                    this.#state.queuedLibraryPersistence = undefined;
                    this
                        .#state.settlementPending = true;
                    this.#state.settlementSchemaId = active.schemaId;
                    ports.setBusy(true);
                    write(active.schemas);
                    await settle(active.schemaId);
                    active = undefined;
                }
            }
            catch {
                if (ports.blocked() && !this.queuedLibraryPersistence && active)
                    this.#state.queuedLibraryPersistence = active;
            }
            finally {
                this.#state.libraryPersistenceWorker = undefined;
                if (!this.queuedLibraryPersistence)
                    this.clearSettlement(active?.schemaId ?? queuedId);
                ports.renderEditor();
            }
        })();
    }
    projectionQueueUnavailable(adapter) {
        return Boolean(this.historyState.pending || this.#state.pendingCommand
            || (this.#state.projectionWorker && this.#state.projectionWorker.adapter !== adapter)
            || (this.#state.projectionRequest && this.#state.projectionRequest.adapter !== adapter));
    }
    currentProjectionQueueUnavailable() { const adapter = this.#state.editor; return adapter ? this.projectionQueueUnavailable(adapter) : false; }
    currentSavedSchemaId() { return this.savedSchemaId(this.#state.editor); }
    projectionPendingForSchema(schemaId) {
        const request = this.#state.projectionRequest;
        return Boolean(request && this.savedSchemaId(request.adapter) === schemaId && request.adapter === this.#state.editor);
    }
    blockedCommand(adapter, command, message) {
        return { status: "conflict", document: adapter.load(),
            ...(command.kind !== "policy" && "propertyId" in command ? { propertyId: command.propertyId } : {}), message };
    }
    blockedCurrentCommand(command, message, fallback) {
        const adapter = this.#state.editor;
        return adapter ? this.blockedCommand(adapter, command, message) : { status: "conflict", document: structuredClone(fallback),
            ...("propertyId" in command ? { propertyId: command.propertyId } : {}), message };
    }
    beginCommand(command, owned) {
        const adapter = this.#state.editor;
        if (!adapter)
            return;
        const policy = compactCanonicalCommandPolicy(command.kind, this.semanticUnresolved(owned));
        if (!policy.allowed) {
            const message = "Resolve the current durable schema save through Retry or Reject before another semantic change.";
            this.#state.commandFeedback = message;
            this.#ports.renderContext();
            return { accepted: false, result: this.blockedCommand(adapter, command, message), completion: Promise.resolve(false) };
        }
        const before = structuredClone(adapter.load());
        this.#revisionSnapshots.set(before.revision, before);
        let result;
        try {
            result = adapter.dispatch(command);
        }
        catch (error) {
            const message = `The canonical command was not applied. ${error instanceof Error ? error.message : String(error)}`;
            this.#state.commandFeedback = message;
            this.#ports.renderContext();
            return { accepted: false, result: this.blockedCommand(adapter, command, message), completion: Promise.resolve(false) };
        }
        if (result.status === "conflict" || result.status === "confirmation-required") {
            this.#state.pendingCommand = command;
            this.#state.pendingBase = before;
            this.#state.reviewVisible = false;
            this.#state.commandFeedback = result.status === "conflict" ? result.message : result.impact;
            this.#ports.renderContext();
            return { accepted: false, result, completion: Promise.resolve(false) };
        }
        if (policy.semantic) {
            this.#state.pendingCommand = undefined;
            this.#state.pendingBase = undefined;
            this.#state.reviewVisible = false;
            this.#state.presenceDraft = undefined;
        }
        this.#state.commandFeedback = canonicalCommandOutcome(command, result, before);
        this.#ports.renderContext();
        const schemaId = this.savedSchemaId(adapter);
        const settlement = policy.settles && adapter.settle && (adapter.settles?.(command) ?? true) ? this.beginSettlement(schemaId) : undefined;
        if (settlement)
            this.#ports.setBusy(true);
        if (!settlement || !adapter.settle)
            return { accepted: true, result, completion: Promise.resolve(true) };
        const generation = this.#ports.generation();
        const completion = adapter.settle().then(() => {
            adapter.onSettlementCommitted?.();
            if (this.#ports.isCurrent(generation)) {
                if (this.clearSettlement(schemaId, settlement))
                    this.#state.commandFeedback = `Committed to ${adapter.settlementTarget ?? "durable Saved Draft"}.`;
                this.#ports.renderEditor();
            }
            return true;
        }, (error) => {
            if (this.#ports.isCurrent(generation)) {
                if (!this.#ports.blocked() && this.clearSettlement(schemaId, settlement)) {
                    this.#state.pendingCommand = command;
                    this.#state.pendingBase = before;
                    this.#state.commandFeedback = `Not saved; Retry or Reject. ${error instanceof Error ? error.message : String(error)}`;
                }
                this.#ports.renderEditor();
            }
            return false;
        });
        this.#state.settlementBarrier = completion;
        return { accepted: true, result, completion };
    }
    async dispatchCommand(command, owned) {
        const dispatch = this.beginCommand(command, owned);
        return Boolean(dispatch?.accepted && await dispatch.completion);
    }
    beginProjectionPersistence(adapter, projection, change) {
        if (!adapter.persistProjection)
            return Promise.resolve(true);
        this.#state.projectionRequest = { adapter, projection: structuredClone(projection), ...(change ? { change } : {}) };
        if (this.#ports.blocked()) {
            this.#state.commandFeedback = "Projection is waiting for the failed durable save to be retried or rejected.";
            this.#ports.renderContext();
            return Promise.resolve(false);
        }
        const schemaId = this.savedSchemaId(adapter);
        this.#state.settlementPending = true;
        this.#state.settlementSchemaId = schemaId;
        this.#ports.setBusy(true);
        if (this.#state.projectionWorker?.adapter === adapter)
            return this.#state.projectionWorker.promise;
        const generation = this.#ports.generation();
        const worker = { adapter, promise: Promise.resolve(false), settlement: this.beginSettlement(schemaId) };
        this.#state.projectionWorker = worker;
        worker.promise = (async () => {
            let committed = false, activeRequest;
            try {
                while (this.#ports.isCurrent(generation) && this.#state.editor === adapter) {
                    const request = this.#state.projectionRequest;
                    if (!request || request.adapter !== adapter)
                        break;
                    activeRequest = request;
                    this.#state.projectionRequest = undefined;
                    if (!adapter.persistProjection(structuredClone(request.projection), request.change))
                        continue;
                    await adapter.settle?.();
                    adapter.onSettlementCommitted?.();
                    committed = true;
                    activeRequest = undefined;
                }
                this.#state.commandFeedback = committed ? `Saved to ${adapter.settlementTarget ?? "durable Saved Draft"}.` : "Projection already current.";
                return true;
            }
            catch (error) {
                if (this.#ports.blocked() && this.#ports.isCurrent(generation) && this.#state.editor === adapter && !this.#state.projectionRequest && activeRequest)
                    this.#state.projectionRequest = activeRequest;
                this.#state.commandFeedback = `Projection not saved; Retry or Reject. ${error instanceof Error ? error.message : String(error)}`;
                return false;
            }
            finally {
                if (this.#state.projectionWorker === worker) {
                    this.#state.projectionWorker = undefined;
                    this.clearSettlement(schemaId, worker.settlement);
                    this.#ports.renderEditor();
                }
            }
        })();
        return worker.promise;
    }
    async persistProjection(adapter, projection, change) {
        const commands = canonicalCommandsFromCompactProjection(adapter.load(), projection, (kind) => `schema:${kind}:${++this.#state.idSequence}`);
        for (const command of commands)
            if (!await this.dispatchCommand({ ...command, baseRevision: adapter.load().revision }, this.#state.projectionRequest))
                return false;
        return this.beginProjectionPersistence(adapter, projection, change);
    }
    persistCurrentProjection(projection, change) {
        const adapter = this.#state.editor;
        return adapter ? this.persistProjection(adapter, projection, change) : Promise.resolve(false);
    }
    discardProjectionPersistence(adapter) {
        if (!adapter || this.#state.projectionRequest?.adapter === adapter)
            this.#state.projectionRequest = undefined;
        if (this.settlementPending || (adapter && this.#state.projectionWorker?.adapter === adapter))
            return;
        this.#state.settlementSequence += 1;
        this.clearSettlement(this.savedSchemaId(adapter));
    }
    resumeProjectionPersistence(adapter) {
        const request = this.#state.projectionRequest;
        return request?.adapter === adapter ? this.persistProjection(adapter, request.projection, request.change) : Promise.resolve(true);
    }
    resumeCurrentProjectionPersistence() { const adapter = this.#state.editor; return adapter ? this.resumeProjectionPersistence(adapter) : Promise.resolve(false); }
    discardCurrentProjectionPersistence() { this.discardProjectionPersistence(this.#state.editor); }
    retryCommand() {
        const command = this.#state.pendingCommand, adapter = this.#state.editor;
        if (!command || !adapter)
            return;
        this.#state.pendingCommand = undefined;
        if (this.#state.projectionRequest?.adapter === adapter) {
            void this.resumeProjectionPersistence(adapter);
            return;
        }
        void this.dispatchCommand({ ...command, baseRevision: adapter.load().revision }).then(() => this.#ports.renderEditor());
    }
    rejectCommand() {
        this.#state.pendingCommand = undefined;
        this.#state.pendingBase = undefined;
        this.#state.reviewVisible = false;
        this.#state.projectionRequest = undefined;
        this.#state.commandFeedback = "Local edit rejected; durable state is unchanged.";
        this.#ports.renderContext();
    }
    propertyAction(propertyId, action, value) {
        const adapter = this.#state.editor, document = adapter?.load(), node = document?.nodes[propertyId];
        if (!adapter || !document || !node)
            return Promise.resolve(false);
        const baseRevision = document.revision;
        if (action === "add-child")
            return this.dispatchCommand({ kind: "add", baseRevision, parentId: propertyId, name: "New child", type: "string", id: this.#ports.createId });
        if (action === "rename")
            return this.dispatchCommand({ kind: "rename", baseRevision, propertyId, name: value?.trim() || node.name });
        if (action === "move")
            return this.dispatchCommand({ kind: "move", baseRevision, propertyId });
        if (action === "duplicate")
            return this.dispatchCommand({ kind: "duplicate", baseRevision, propertyId, id: this.#ports.createId });
        if (action === "view")
            return this.dispatchCommand({ kind: "select", baseRevision, propertyId });
        if (action === "remove")
            return this.dispatchCommand({ kind: "delete", baseRevision, propertyId });
        if (action === "presence")
            return this.dispatchCommand({ kind: "set", baseRevision, propertyId, patch: { presence: { ...node.presence, mode: (value || "optional") } } });
        if (action === "documentation")
            return this.dispatchCommand({ kind: "set", baseRevision, propertyId, patch: { documentation: { ...node.documentation, description: value ?? node
                            .documentation.description } } });
        if (action === "no-example")
            return this.dispatchCommand({ kind: "set", baseRevision, propertyId, patch: { documentation: { ...node.documentation, example: { method: "blank" } } } });
        if (action === "custom-example")
            return this.dispatchCommand({ kind: "set", baseRevision, propertyId, patch: { documentation: { ...node.documentation, example: { method: "custom",
                            value } } } });
        return this.dispatchCommand({ kind: "set", baseRevision, propertyId, patch: { expectedValue: action === "expected" ? value : undefined } });
    }
    commandScope(command, document) {
        return "propertyId" in command ? document.nodes[command.propertyId]?.name ?? command.propertyId : command.kind;
    }
    disposeState() {
        this.#state.savedDocument = undefined;
        this.#state.editor = undefined;
        this.#state.pendingCommand = undefined;
        this.#state.pendingBase = undefined;
        this.#state.reviewVisible = false;
        this.#revisionSnapshots.clear();
        this.#state.commandFeedback = undefined;
        this.#state.projectionWorker = undefined;
        this.#state.reopenSelection = undefined;
        this.#state.presenceDraft = undefined;
        this.#state.historyState = compactCanonicalHistorySettlement();
        this.#state.pendingHistoryLabel = undefined;
    }
}
//# sourceMappingURL=canonical-editor-controller.js.map