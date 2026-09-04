import { beginCompactCanonicalHistoryTransition, canonicalCommandOutcome, canonicalCommandsFromCompactProjection, compactCanonicalCommandPolicy, compactCanonicalHistorySettlement, completeCompactCanonicalHistoryTransition, rejectCompactCanonicalHistoryTransition, } from "../../utilities/data-layer/schemas.js";
/** Owns the mutable state for compact canonical editing and settlement. */
export class SchemaCanonicalEditorController {
    #ports;
    savedDocument;
    editor;
    pendingCommand;
    pendingBase;
    reviewVisible = false;
    revisionSnapshots = new Map();
    commandFeedback;
    settlementSequence = 0;
    settlementClaims = new Map();
    idSequence = 0;
    settlementPending = false;
    settlementSchemaId;
    settlementBarrier = Promise.resolve(true);
    projectionRequest;
    projectionWorker;
    queuedLibraryPersistence;
    libraryPersistenceWorker;
    reopenSelection;
    scrollByKey = new Map();
    historyState = compactCanonicalHistorySettlement();
    pendingHistoryLabel;
    presenceDraft;
    constructor(ports) { this.#ports = ports; }
    beginPendingHistory(projectId, editorKey, label, history) {
        const identity = { operationId: `schema-history:${++this.idSequence}`, projectId, editorKey };
        this.historyState = beginCompactCanonicalHistoryTransition(this.historyState, { ...identity, history });
        this.pendingHistoryLabel = label;
        return identity;
    }
    completePendingHistory(identity) {
        this.historyState = completeCompactCanonicalHistoryTransition(this.historyState, identity);
        if (!this.historyState.pending)
            this.pendingHistoryLabel = undefined;
    }
    rejectPendingHistory(identity) {
        this.historyState = rejectCompactCanonicalHistoryTransition(this.historyState, identity);
        if (!this.historyState.pending)
            this.pendingHistoryLabel = undefined;
    }
    pendingHistoryFor(projectId, label) {
        const pending = this.historyState.pending;
        return pending && pending.projectId === projectId && this.pendingHistoryLabel === label
            ? { operationId: pending.operationId, projectId: pending.projectId, editorKey: pending.editorKey } : undefined;
    }
    semanticUnresolved(owned) {
        return Boolean(this.settlementPending || this.historyState.pending || this.pendingCommand
            || (this.projectionWorker && this.projectionWorker.adapter !== owned?.adapter)
            || (this.projectionRequest && this.projectionRequest !== owned));
    }
    savedSchemaId(adapter) {
        return adapter?.key.startsWith("saved:") ? adapter.key.slice("saved:".length) : undefined;
    }
    beginSettlement(schemaId) {
        const settlement = ++this.settlementSequence;
        this.settlementClaims.set(settlement, schemaId);
        this.settlementPending = true;
        this.settlementSchemaId = schemaId;
        return settlement;
    }
    clearSettlement(schemaId, settlement) {
        if (settlement !== undefined) {
            if (!this.settlementClaims.has(settlement) || this.settlementClaims.get(settlement) !== schemaId)
                return false;
            this.settlementClaims.delete(settlement);
            if (this.settlementClaims.size) {
                this.settlementSchemaId = [...this.settlementClaims.values()].at(-1);
                return false;
            }
        }
        else
            this.settlementClaims.clear();
        if (this.queuedLibraryPersistence || this.libraryPersistenceWorker) {
            this.settlementPending = true;
            this.settlementSchemaId = this.queuedLibraryPersistence?.schemaId ?? schemaId;
            return false;
        }
        this.settlementPending = false;
        this.settlementSchemaId = undefined;
        return true;
    }
    queueLibraryPersistence(schemaId, schemas, fallback) {
        if (!this.#ports.settleLibrary || !this.#ports.writeLibrary) {
            fallback();
            return;
        }
        this.queuedLibraryPersistence = { schemaId, schemas: structuredClone([...schemas]) };
        this.settlementPending = true;
        this.settlementSchemaId = schemaId;
        this.#ports.setBusy(true);
        void this.settlementBarrier.then((committed) => { if (committed)
            this.#startLibraryPersistence(); });
    }
    #startLibraryPersistence() {
        const ports = this.#ports;
        if (this.libraryPersistenceWorker || !this.queuedLibraryPersistence || this.settlementClaims.size || !ports.settleLibrary || !ports.writeLibrary)
            return;
        const settle = ports.settleLibrary, write = ports.writeLibrary, queuedId = this.queuedLibraryPersistence.schemaId;
        this.libraryPersistenceWorker = (async () => {
            let active;
            try {
                while ((ports.mounted?.() ?? true) && this.queuedLibraryPersistence) {
                    active = this.queuedLibraryPersistence;
                    this.queuedLibraryPersistence = undefined;
                    this.settlementPending = true;
                    this.settlementSchemaId = active.schemaId;
                    ports.setBusy(true);
                    write(active.schemas);
                    await settle(active.schemaId);
                    active = undefined;
                }
            }
            catch {
                if (ports.blocked() && !this.queuedLibraryPersistence && active)
                    this.queuedLibraryPersistence = active;
            }
            finally {
                this.libraryPersistenceWorker = undefined;
                if (!this.queuedLibraryPersistence)
                    this.clearSettlement(active?.schemaId ?? queuedId);
                ports.renderEditor();
            }
        })();
    }
    projectionQueueUnavailable(adapter) {
        return Boolean(this.historyState.pending || this.pendingCommand
            || (this.projectionWorker && this.projectionWorker.adapter !== adapter)
            || (this.projectionRequest && this.projectionRequest.adapter !== adapter));
    }
    blockedCommand(adapter, command, message) {
        return { status: "conflict", document: adapter.load(),
            ...(command.kind !== "policy" && "propertyId" in command ? { propertyId: command.propertyId } : {}), message };
    }
    beginCommand(command, owned) {
        const adapter = this.editor;
        if (!adapter)
            return;
        const policy = compactCanonicalCommandPolicy(command.kind, this.semanticUnresolved(owned));
        if (!policy.allowed) {
            const message = "Resolve the current durable schema save through Retry or Reject before another semantic change.";
            this.commandFeedback = message;
            this.#ports.renderContext();
            return { accepted: false, result: this.blockedCommand(adapter, command, message), completion: Promise.resolve(false) };
        }
        const before = structuredClone(adapter.load());
        this.revisionSnapshots.set(before.revision, before);
        let result;
        try {
            result = adapter.dispatch(command);
        }
        catch (error) {
            const message = `The canonical command was not applied. ${error instanceof Error ? error.message : String(error)}`;
            this.commandFeedback = message;
            this.#ports.renderContext();
            return { accepted: false, result: this.blockedCommand(adapter, command, message), completion: Promise.resolve(false) };
        }
        if (result.status === "conflict" || result.status === "confirmation-required") {
            this.pendingCommand = command;
            this.pendingBase = before;
            this.reviewVisible = false;
            this.commandFeedback = result.status === "conflict" ? result.message : result.impact;
            this.#ports.renderContext();
            return { accepted: false, result, completion: Promise.resolve(false) };
        }
        if (policy.semantic) {
            this.pendingCommand = undefined;
            this.pendingBase = undefined;
            this.reviewVisible = false;
            this.presenceDraft = undefined;
        }
        this.commandFeedback = canonicalCommandOutcome(command, result, before);
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
                    this.commandFeedback = `Committed to ${adapter.settlementTarget ?? "durable Saved Draft"}.`;
                this.#ports.renderEditor();
            }
            return true;
        }, (error) => {
            if (this.#ports.isCurrent(generation)) {
                if (!this.#ports.blocked() && this.clearSettlement(schemaId, settlement)) {
                    this.pendingCommand = command;
                    this.pendingBase = before;
                    this.commandFeedback = `Not saved; Retry or Reject. ${error instanceof Error ? error.message : String(error)}`;
                }
                this.#ports.renderEditor();
            }
            return false;
        });
        this.settlementBarrier = completion;
        return { accepted: true, result, completion };
    }
    async dispatchCommand(command, owned) {
        const dispatch = this.beginCommand(command, owned);
        return Boolean(dispatch?.accepted && await dispatch.completion);
    }
    beginProjectionPersistence(adapter, projection, change) {
        if (!adapter.persistProjection)
            return Promise.resolve(true);
        this.projectionRequest = { adapter, projection: structuredClone(projection), ...(change ? { change } : {}) };
        if (this.#ports.blocked()) {
            this.commandFeedback = "Projection is waiting for the failed durable save to be retried or rejected.";
            this.#ports.renderContext();
            return Promise.resolve(false);
        }
        const schemaId = this.savedSchemaId(adapter);
        this.settlementPending = true;
        this.settlementSchemaId = schemaId;
        this.#ports.setBusy(true);
        if (this.projectionWorker?.adapter === adapter)
            return this.projectionWorker.promise;
        const generation = this.#ports.generation();
        const worker = { adapter, promise: Promise.resolve(false), settlement: this.beginSettlement(schemaId) };
        this.projectionWorker = worker;
        worker.promise = (async () => {
            let committed = false, activeRequest;
            try {
                while (this.#ports.isCurrent(generation) && this.editor === adapter) {
                    const request = this.projectionRequest;
                    if (!request || request.adapter !== adapter)
                        break;
                    activeRequest = request;
                    this.projectionRequest = undefined;
                    if (!adapter.persistProjection(structuredClone(request.projection), request.change))
                        continue;
                    await adapter.settle?.();
                    adapter.onSettlementCommitted?.();
                    committed = true;
                    activeRequest = undefined;
                }
                this.commandFeedback = committed ? `Saved to ${adapter.settlementTarget ?? "durable Saved Draft"}.` : "Projection already current.";
                return true;
            }
            catch (error) {
                if (this.#ports.blocked() && this.#ports.isCurrent(generation) && this.editor === adapter && !this.projectionRequest && activeRequest)
                    this.projectionRequest = activeRequest;
                this.commandFeedback = `Projection not saved; Retry or Reject. ${error instanceof Error ? error.message : String(error)}`;
                return false;
            }
            finally {
                if (this.projectionWorker === worker) {
                    this.projectionWorker = undefined;
                    this.clearSettlement(schemaId, worker.settlement);
                    this.#ports.renderEditor();
                }
            }
        })();
        return worker.promise;
    }
    async persistProjection(adapter, projection, change) {
        const commands = canonicalCommandsFromCompactProjection(adapter.load(), projection, (kind) => `schema:${kind}:${++this.idSequence}`);
        for (const command of commands)
            if (!await this.dispatchCommand({ ...command, baseRevision: adapter.load().revision }, this.projectionRequest))
                return false;
        return this.beginProjectionPersistence(adapter, projection, change);
    }
    discardProjectionPersistence(adapter) {
        if (!adapter || this.projectionRequest?.adapter === adapter)
            this.projectionRequest = undefined;
        if (this.settlementPending || (adapter && this.projectionWorker?.adapter === adapter))
            return;
        this.settlementSequence += 1;
        this.clearSettlement(this.savedSchemaId(adapter));
    }
    resumeProjectionPersistence(adapter) {
        const request = this.projectionRequest;
        return request?.adapter === adapter ? this.persistProjection(adapter, request.projection, request.change) : Promise.resolve(true);
    }
    retryCommand() {
        const command = this.pendingCommand, adapter = this.editor;
        if (!command || !adapter)
            return;
        this.pendingCommand = undefined;
        if (this.projectionRequest?.adapter === adapter) {
            void this.resumeProjectionPersistence(adapter);
            return;
        }
        void this.dispatchCommand({ ...command, baseRevision: adapter.load().revision }).then(() => this.#ports.renderEditor());
    }
    rejectCommand() {
        this.pendingCommand = undefined;
        this.pendingBase = undefined;
        this.reviewVisible = false;
        this.projectionRequest = undefined;
        this.commandFeedback = "Local edit rejected; durable state is unchanged.";
        this.#ports.renderContext();
    }
    propertyAction(propertyId, action, value) {
        const adapter = this.editor, document = adapter?.load(), node = document?.nodes[propertyId];
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
            return this.dispatchCommand({ kind: "set", baseRevision, propertyId, patch: { documentation: { ...node.documentation, description: value ?? node.documentation.description } } });
        if (action === "no-example")
            return this.dispatchCommand({ kind: "set", baseRevision, propertyId, patch: { documentation: { ...node.documentation, example: { method: "blank" } } } });
        if (action === "custom-example")
            return this.dispatchCommand({ kind: "set", baseRevision, propertyId, patch: { documentation: { ...node.documentation, example: { method: "custom", value } } } });
        return this.dispatchCommand({ kind: "set", baseRevision, propertyId, patch: { expectedValue: action === "expected" ? value : undefined } });
    }
    commandScope(command, document) {
        return "propertyId" in command ? document.nodes[command.propertyId]?.name ?? command.propertyId : command.kind;
    }
    disposeState() {
        this.savedDocument = undefined;
        this.pendingCommand = undefined;
        this.pendingBase = undefined;
        this.reviewVisible = false;
        this.revisionSnapshots.clear();
        this.commandFeedback = undefined;
        this.projectionWorker = undefined;
        this.reopenSelection = undefined;
        this.presenceDraft = undefined;
        this.historyState = compactCanonicalHistorySettlement();
        this.pendingHistoryLabel = undefined;
    }
}
//# sourceMappingURL=canonical-editor-controller.js.map