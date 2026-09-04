import {
  beginCompactCanonicalHistoryTransition,
  canonicalCommandOutcome,
  canonicalCommandsFromCompactProjection,
  compactCanonicalCommandPolicy,
  compactCanonicalHistorySettlement,
  completeCompactCanonicalHistoryTransition,
  mountCanonicalSchemaEditor,
  rejectCompactCanonicalHistoryTransition,
  type CanonicalSchemaDocument,
  type CompactCanonicalHistoryTransitionIdentity,
  type SchemaDefinition,
} from "../../utilities/data-layer/schemas.js";
import type {
  CompactCanonicalCommand,
  CompactCanonicalEditorAdapter,
  CompactCanonicalProjectionPersistenceRequest,
  CompactCanonicalProjectionWorker,
} from "./contracts.js";

/** Owns the mutable state for compact canonical editing and settlement. */
export class SchemaCanonicalEditorController {
  readonly #ports:{
    blocked():boolean;
    generation():number;
    isCurrent(generation:number):boolean;
    setBusy(busy:boolean):void;
    renderContext():void;
    renderEditor():void;
    createId():string;
    writeLibrary?(schemas:readonly SchemaDefinition[]):void;
    settleLibrary?(schemaId:string):Promise<void>;
    mounted?():boolean;
  };
  savedDocument:CanonicalSchemaDocument | undefined;
  editor:CompactCanonicalEditorAdapter | undefined;
  pendingCommand:CompactCanonicalCommand | undefined;
  pendingBase:CanonicalSchemaDocument | undefined;
  reviewVisible = false;
  readonly revisionSnapshots = new Map<number, CanonicalSchemaDocument>();
  commandFeedback:string | undefined;
  settlementSequence = 0;
  readonly settlementClaims = new Map<number, string | undefined>();
  idSequence = 0;
  settlementPending = false;
  settlementSchemaId:string | undefined;
  settlementBarrier:Promise<boolean> = Promise.resolve(true);
  projectionRequest:CompactCanonicalProjectionPersistenceRequest | undefined;
  projectionWorker:CompactCanonicalProjectionWorker | undefined;
  queuedLibraryPersistence:{ schemaId:string; schemas:readonly SchemaDefinition[] } | undefined;
  libraryPersistenceWorker:Promise<void> | undefined;
  reopenSelection:string | undefined;
  readonly scrollByKey = new Map<string, number>();
  historyState = compactCanonicalHistorySettlement();
  pendingHistoryLabel:string | undefined;
  presenceDraft:{ propertyId:string; baseRevision:number; mode:string } | undefined;
  readonly contextDisposers:Array<() => void> = [];
  propertyMenuId:string | undefined;
  tableHost:HTMLElement | undefined;
  tableEditor:ReturnType<typeof mountCanonicalSchemaEditor> | undefined;
  tableKey:string | undefined;

  constructor(ports:{
    blocked():boolean;
    generation():number;
    isCurrent(generation:number):boolean;
    setBusy(busy:boolean):void;
    renderContext():void;
    renderEditor():void;
    createId():string;
    writeLibrary?(schemas:readonly SchemaDefinition[]):void;
    settleLibrary?(schemaId:string):Promise<void>;
    mounted?():boolean;
  }) { this.#ports = ports; }

  clearContext():void { for (const dispose of this.contextDisposers.splice(0)) dispose(); }
  beginPendingHistory(projectId:string, editorKey:string, label:string,
    history:ReturnType<typeof compactCanonicalHistorySettlement>["history"]):CompactCanonicalHistoryTransitionIdentity {
    const identity = { operationId:`schema-history:${++this.idSequence}`, projectId, editorKey };
    this.historyState = beginCompactCanonicalHistoryTransition(this.historyState, { ...identity, history });
    this.pendingHistoryLabel = label;
    return identity;
  }
  completePendingHistory(identity:CompactCanonicalHistoryTransitionIdentity):void {
    this.historyState = completeCompactCanonicalHistoryTransition(this.historyState, identity);
    if (!this.historyState.pending) this.pendingHistoryLabel = undefined;
  }
  rejectPendingHistory(identity:CompactCanonicalHistoryTransitionIdentity):void {
    this.historyState = rejectCompactCanonicalHistoryTransition(this.historyState, identity);
    if (!this.historyState.pending) this.pendingHistoryLabel = undefined;
  }
  pendingHistoryFor(projectId:string, label:string):CompactCanonicalHistoryTransitionIdentity | undefined {
    const pending = this.historyState.pending;
    return pending && pending.projectId === projectId && this.pendingHistoryLabel === label
      ? { operationId:pending.operationId, projectId:pending.projectId, editorKey:pending.editorKey } : undefined;
  }
  semanticUnresolved(owned?:CompactCanonicalProjectionPersistenceRequest):boolean {
    return Boolean(this.settlementPending || this.historyState.pending || this.pendingCommand
      || (this.projectionWorker && this.projectionWorker.adapter !== owned?.adapter)
      || (this.projectionRequest && this.projectionRequest !== owned));
  }
  savedSchemaId(adapter:CompactCanonicalEditorAdapter | undefined):string | undefined {
    return adapter?.key.startsWith("saved:") ? adapter.key.slice("saved:".length) : undefined;
  }
  beginSettlement(schemaId?:string):number {
    const settlement = ++this.settlementSequence;
    this.settlementClaims.set(settlement, schemaId);
    this.settlementPending = true;
    this.settlementSchemaId = schemaId;
    return settlement;
  }
  clearSettlement(schemaId?:string, settlement?:number):boolean {
    if (settlement !== undefined) {
      if (!this.settlementClaims.has(settlement) || this.settlementClaims.get(settlement) !== schemaId) return false;
      this.settlementClaims.delete(settlement);
      if (this.settlementClaims.size) {
        this.settlementSchemaId = [...this.settlementClaims.values()].at(-1);
        return false;
      }
    } else this.settlementClaims.clear();
    if (this.queuedLibraryPersistence || this.libraryPersistenceWorker) {
      this.settlementPending = true;
      this.settlementSchemaId = this.queuedLibraryPersistence?.schemaId ?? schemaId;
      return false;
    }
    this.settlementPending = false;
    this.settlementSchemaId = undefined;
    return true;
  }
  queueLibraryPersistence(schemaId:string,schemas:readonly SchemaDefinition[],fallback:()=>void):void {
    if (!this.#ports.settleLibrary || !this.#ports.writeLibrary) { fallback(); return; }
    this.queuedLibraryPersistence={ schemaId,schemas:structuredClone([...schemas]) }; this.settlementPending=true; this.settlementSchemaId=schemaId; this.#ports.setBusy(true);
    void this.settlementBarrier.then((committed) => { if (committed) this.#startLibraryPersistence(); });
  }
  #startLibraryPersistence():void {
    const ports=this.#ports; if (this.libraryPersistenceWorker || !this.queuedLibraryPersistence || this.settlementClaims.size || !ports.settleLibrary || !ports.writeLibrary) return;
    const settle=ports.settleLibrary,write=ports.writeLibrary,queuedId=this.queuedLibraryPersistence.schemaId; this.libraryPersistenceWorker=(async() => { let active:{ schemaId:string;schemas:readonly SchemaDefinition[] }|undefined;
      try { while ((ports.mounted?.() ?? true) && this.queuedLibraryPersistence) { active=this.queuedLibraryPersistence; this.queuedLibraryPersistence=undefined; this.settlementPending=true; this.settlementSchemaId=active.schemaId; ports.setBusy(true); write(active.schemas); await settle(active.schemaId); active=undefined; } }
      catch { if (ports.blocked() && !this.queuedLibraryPersistence && active) this.queuedLibraryPersistence=active; }
      finally { this.libraryPersistenceWorker=undefined; if (!this.queuedLibraryPersistence) this.clearSettlement(active?.schemaId ?? queuedId); ports.renderEditor(); }
    })();
  }
  projectionQueueUnavailable(adapter:CompactCanonicalEditorAdapter):boolean {
    return Boolean(this.historyState.pending || this.pendingCommand
      || (this.projectionWorker && this.projectionWorker.adapter !== adapter)
      || (this.projectionRequest && this.projectionRequest.adapter !== adapter));
  }
  blockedCommand(adapter:CompactCanonicalEditorAdapter, command:CompactCanonicalCommand, message:string) {
    return { status:"conflict" as const, document:adapter.load(),
      ...(command.kind !== "policy" && "propertyId" in command ? { propertyId:command.propertyId } : {}), message };
  }
  beginCommand(command:CompactCanonicalCommand, owned?:CompactCanonicalProjectionPersistenceRequest) {
    const adapter = this.editor;
    if (!adapter) return;
    const policy = compactCanonicalCommandPolicy(command.kind, this.semanticUnresolved(owned));
    if (!policy.allowed) {
      const message = "Resolve the current durable schema save through Retry or Reject before another semantic change.";
      this.commandFeedback = message; this.#ports.renderContext();
      return { accepted:false, result:this.blockedCommand(adapter, command, message), completion:Promise.resolve(false) };
    }
    const before = structuredClone(adapter.load()); this.revisionSnapshots.set(before.revision, before);
    let result;
    try { result = adapter.dispatch(command); }
    catch (error) {
      const message = `The canonical command was not applied. ${error instanceof Error ? error.message : String(error)}`;
      this.commandFeedback = message; this.#ports.renderContext();
      return { accepted:false, result:this.blockedCommand(adapter, command, message), completion:Promise.resolve(false) };
    }
    if (result.status === "conflict" || result.status === "confirmation-required") {
      this.pendingCommand = command; this.pendingBase = before; this.reviewVisible = false;
      this.commandFeedback = result.status === "conflict" ? result.message : result.impact; this.#ports.renderContext();
      return { accepted:false, result, completion:Promise.resolve(false) };
    }
    if (policy.semantic) { this.pendingCommand = undefined; this.pendingBase = undefined; this.reviewVisible = false; this.presenceDraft = undefined; }
    this.commandFeedback = canonicalCommandOutcome(command, result, before); this.#ports.renderContext();
    const schemaId = this.savedSchemaId(adapter);
    const settlement = policy.settles && adapter.settle && (adapter.settles?.(command) ?? true) ? this.beginSettlement(schemaId) : undefined;
    if (settlement) this.#ports.setBusy(true);
    if (!settlement || !adapter.settle) return { accepted:true, result, completion:Promise.resolve(true) };
    const generation = this.#ports.generation();
    const completion = adapter.settle().then(() => {
      adapter.onSettlementCommitted?.();
      if (this.#ports.isCurrent(generation)) {
        if (this.clearSettlement(schemaId, settlement)) this.commandFeedback = `Committed to ${adapter.settlementTarget ?? "durable Saved Draft"}.`;
        this.#ports.renderEditor();
      }
      return true;
    }, (error) => {
      if (this.#ports.isCurrent(generation)) {
        if (!this.#ports.blocked() && this.clearSettlement(schemaId, settlement)) {
          this.pendingCommand = command; this.pendingBase = before;
          this.commandFeedback = `Not saved; Retry or Reject. ${error instanceof Error ? error.message : String(error)}`;
        }
        this.#ports.renderEditor();
      }
      return false;
    });
    this.settlementBarrier = completion;
    return { accepted:true, result, completion };
  }
  async dispatchCommand(command:CompactCanonicalCommand, owned?:CompactCanonicalProjectionPersistenceRequest):Promise<boolean> {
    const dispatch = this.beginCommand(command, owned);
    return Boolean(dispatch?.accepted && await dispatch.completion);
  }
  beginProjectionPersistence(adapter:CompactCanonicalEditorAdapter, projection:SchemaDefinition, change?:string):Promise<boolean> {
    if (!adapter.persistProjection) return Promise.resolve(true);
    this.projectionRequest = { adapter, projection:structuredClone(projection), ...(change ? { change } : {}) };
    if (this.#ports.blocked()) {
      this.commandFeedback = "Projection is waiting for the failed durable save to be retried or rejected.";
      this.#ports.renderContext(); return Promise.resolve(false);
    }
    const schemaId = this.savedSchemaId(adapter);
    this.settlementPending = true; this.settlementSchemaId = schemaId; this.#ports.setBusy(true);
    if (this.projectionWorker?.adapter === adapter) return this.projectionWorker.promise;
    const generation = this.#ports.generation();
    const worker:CompactCanonicalProjectionWorker = { adapter, promise:Promise.resolve(false), settlement:this.beginSettlement(schemaId) };
    this.projectionWorker = worker;
    worker.promise = (async () => {
      let committed = false, activeRequest:CompactCanonicalProjectionPersistenceRequest | undefined;
      try {
        while (this.#ports.isCurrent(generation) && this.editor === adapter) {
          const request = this.projectionRequest; if (!request || request.adapter !== adapter) break; activeRequest = request;
          this.projectionRequest = undefined; if (!adapter.persistProjection!(structuredClone(request.projection), request.change)) continue;
          await adapter.settle?.(); adapter.onSettlementCommitted?.(); committed = true; activeRequest = undefined;
        }
        this.commandFeedback = committed ? `Saved to ${adapter.settlementTarget ?? "durable Saved Draft"}.` : "Projection already current.";
        return true;
      } catch (error) {
        if (this.#ports.blocked() && this.#ports.isCurrent(generation) && this.editor === adapter && !this.projectionRequest && activeRequest)
          this.projectionRequest = activeRequest;
        this.commandFeedback = `Projection not saved; Retry or Reject. ${error instanceof Error ? error.message : String(error)}`;
        return false;
      } finally {
        if (this.projectionWorker === worker) { this.projectionWorker = undefined; this.clearSettlement(schemaId, worker.settlement); this.#ports.renderEditor(); }
      }
    })();
    return worker.promise;
  }
  async persistProjection(adapter:CompactCanonicalEditorAdapter, projection:SchemaDefinition, change?:string):Promise<boolean> {
    const commands = canonicalCommandsFromCompactProjection(adapter.load(), projection, (kind) => `schema:${kind}:${++this.idSequence}`);
    for (const command of commands) if (!await this.dispatchCommand({ ...command, baseRevision:adapter.load().revision }, this.projectionRequest)) return false;
    return this.beginProjectionPersistence(adapter, projection, change);
  }
  discardProjectionPersistence(adapter?:CompactCanonicalEditorAdapter):void {
    if (!adapter || this.projectionRequest?.adapter === adapter) this.projectionRequest = undefined;
    if (this.settlementPending || (adapter && this.projectionWorker?.adapter === adapter)) return;
    this.settlementSequence += 1; this.clearSettlement(this.savedSchemaId(adapter));
  }
  resumeProjectionPersistence(adapter:CompactCanonicalEditorAdapter):Promise<boolean> {
    const request = this.projectionRequest;
    return request?.adapter === adapter ? this.persistProjection(adapter, request.projection, request.change) : Promise.resolve(true);
  }
  retryCommand():void {
    const command = this.pendingCommand, adapter = this.editor; if (!command || !adapter) return;
    this.pendingCommand = undefined;
    if (this.projectionRequest?.adapter === adapter) { void this.resumeProjectionPersistence(adapter); return; }
    void this.dispatchCommand({ ...command, baseRevision:adapter.load().revision }).then(() => this.#ports.renderEditor());
  }
  rejectCommand():void {
    this.pendingCommand = undefined; this.pendingBase = undefined; this.reviewVisible = false; this.projectionRequest = undefined;
    this.commandFeedback = "Local edit rejected; durable state is unchanged."; this.#ports.renderContext();
  }
  propertyAction(propertyId:string, action:"add-child"|"no-example"|"custom-example"|"documentation"|"presence"|"rename"|"move"|"duplicate"|"expected"|"reset-expected"|"view"|"remove", value?:string):Promise<boolean> {
    const adapter = this.editor, document = adapter?.load(), node = document?.nodes[propertyId];
    if (!adapter || !document || !node) return Promise.resolve(false);
    const baseRevision = document.revision;
    if (action === "add-child") return this.dispatchCommand({ kind:"add", baseRevision, parentId:propertyId, name:"New child", type:"string", id:this.#ports.createId });
    if (action === "rename") return this.dispatchCommand({ kind:"rename", baseRevision, propertyId, name:value?.trim() || node.name });
    if (action === "move") return this.dispatchCommand({ kind:"move", baseRevision, propertyId });
    if (action === "duplicate") return this.dispatchCommand({ kind:"duplicate", baseRevision, propertyId, id:this.#ports.createId });
    if (action === "view") return this.dispatchCommand({ kind:"select", baseRevision, propertyId });
    if (action === "remove") return this.dispatchCommand({ kind:"delete", baseRevision, propertyId });
    if (action === "presence") return this.dispatchCommand({ kind:"set", baseRevision, propertyId, patch:{ presence:{ ...node.presence, mode:(value || "optional") as typeof node.presence.mode } } });
    if (action === "documentation") return this.dispatchCommand({ kind:"set", baseRevision, propertyId, patch:{ documentation:{ ...node.documentation, description:value ?? node.documentation.description } } });
    if (action === "no-example") return this.dispatchCommand({ kind:"set", baseRevision, propertyId, patch:{ documentation:{ ...node.documentation, example:{ method:"blank" } } } });
    if (action === "custom-example") return this.dispatchCommand({ kind:"set", baseRevision, propertyId, patch:{ documentation:{ ...node.documentation, example:{ method:"custom", value } } } });
    return this.dispatchCommand({ kind:"set", baseRevision, propertyId, patch:{ expectedValue:action === "expected" ? value : undefined } });
  }
  commandScope(command:CompactCanonicalCommand, document:CanonicalSchemaDocument):string {
    return "propertyId" in command ? document.nodes[command.propertyId]?.name ?? command.propertyId : command.kind;
  }
  renderContext(options:{
    host:HTMLElement | null;
    document:Document | undefined;
    generation:number;
    isCurrent(generation:number):boolean;
    dispatch(command:CompactCanonicalCommand):unknown;
    propertyAction(propertyId:string, action:"add-child"|"no-example"|"custom-example"|"documentation"|"presence"|"rename"|"move"|"duplicate"|"expected"|"reset-expected"|"view"|"remove", value?:string):unknown;
    retry():unknown;
    reject():unknown;
    rerender():void;
  }):void {
    const { host, document } = options;
    if (!host) return;
    this.clearContext();
    const adapter = this.editor;
    host.hidden = !adapter;
    host.replaceChildren();
    if (!adapter || !document) return;
    const identity = document.createElement("p"), feedback = document.createElement("output");
    identity.textContent = `${adapter.label} · revision ${adapter.load().revision}`;
    feedback.setAttribute("aria-label", "Compact canonical command result");
    feedback.textContent = this.commandFeedback ?? "Canonical editor ready.";
    host.append(identity, feedback);
    const own = (control:HTMLElement, action:EventListener, type="click"):void => {
      this.contextDisposers.push(() => control.removeEventListener(type, action));
    };
    const runHistoryAction = (action:() => void|string|Promise<void|string>):void => {
      void Promise.resolve(action()).then((message) => {
        if (message) { this.commandFeedback = message; options.rerender(); }
      }, (error) => {
        this.commandFeedback = `The page-scoped canonical command failed. ${error instanceof Error ? error.message : String(error)}`;
        options.rerender();
      });
    };
    if (adapter.onUndo) {
      const undo = document.createElement("button"), action = ():void => runHistoryAction(adapter.onUndo!);
      undo.type = "button"; undo.textContent = "Undo"; undo.addEventListener("click", action); own(undo, action); host.append(undo);
    }
    if (adapter.onRedo) {
      const redo = document.createElement("button"), action = ():void => runHistoryAction(adapter.onRedo!);
      redo.type = "button"; redo.textContent = "Redo"; redo.addEventListener("click", action); own(redo, action); host.append(redo);
    }
    for (const configured of adapter.actions ?? []) {
      const control = document.createElement("button"), action = ():void => configured.run();
      control.type = "button"; control.textContent = configured.label; control.addEventListener("click", action); own(control, action); host.append(control);
    }
    const table = document.createElement("button"), tree = document.createElement("button");
    table.type = tree.type = "button"; table.textContent = "Table"; tree.textContent = "Tree";
    const showTable = ():void => { const current = adapter.load(); options.dispatch({ kind:"view", baseRevision:current.revision, view:"table" }); };
    const showTree = ():void => { const current = adapter.load(); options.dispatch({ kind:"view", baseRevision:current.revision, view:"tree" }); };
    table.addEventListener("click", showTable); tree.addEventListener("click", showTree); own(table, showTable); own(tree, showTree); host.append(table, tree);
    adapter.renderContext?.(host);
    if (adapter.migration) {
      const migration = adapter.migration, review = document.createElement("section"), summary = document.createElement("p"),
        cancel = document.createElement("button"), confirm = document.createElement("button");
      review.setAttribute("aria-label", "Canonical schema migration review"); summary.textContent = migration.summary;
      for (const conflict of migration.conflicts) {
        const resolution = document.createElement("select"); resolution.setAttribute("aria-label", conflict.label);
        resolution.append(...conflict.choices.map(({ id, label }) => { const option = document.createElement("option"); option.value = id; option.textContent = label; return option; }));
        const select = ():void => { if (resolution.value) migration.resolve(conflict.id, resolution.value); };
        resolution.addEventListener("change", select); own(resolution, select, "change"); review.append(resolution);
      }
      cancel.type = confirm.type = "button"; cancel.textContent = "Cancel migration"; confirm.textContent = "Confirm canonical migration";
      confirm.disabled = migration.conflicts.length > 0;
      const cancelMigration = ():void => { migration.cancel(); options.rerender(); };
      const confirmMigration = ():void => { confirm.disabled = true; void migration.confirm().then(() => {
        if (options.isCurrent(options.generation) && this.editor === adapter) options.rerender();
      }, () => { if (options.isCurrent(options.generation) && this.editor === adapter) { confirm.disabled = false; options.rerender(); } }); };
      cancel.addEventListener("click", cancelMigration); confirm.addEventListener("click", confirmMigration);
      own(cancel, cancelMigration); own(confirm, confirmMigration); review.append(summary, cancel, confirm); host.append(review);
    }
    if (this.propertyMenuId && adapter.load().nodes[this.propertyMenuId]) {
      const propertyId = this.propertyMenuId;
      for (const [label, action, value] of [
        ["Add child", "add-child"], ["Clear example", "no-example"], ["Use custom example", "custom-example", "example"],
        ["Save documentation", "documentation", "Documented property"], ["Required", "presence", "required"],
        ["Rename", "rename", `${adapter.load().nodes[propertyId]!.name} renamed`], ["Move to root", "move"], ["Duplicate", "duplicate"],
        ["Save expected value", "expected", "expected"], ["Reset expected value", "reset-expected"], ["View", "view"], ["Remove", "remove"],
      ] as const) {
        const control = document.createElement("button"), run = ():void => { options.propertyAction(propertyId, action, value); };
        control.type = "button"; control.textContent = label; control.addEventListener("click", run); own(control, run); host.append(control);
      }
    }
    if (this.pendingCommand) {
      const compare = document.createElement("button"), retry = document.createElement("button"), reject = document.createElement("button");
      compare.type = retry.type = reject.type = "button"; compare.textContent = "Compare latest property"; retry.textContent = "Retry local edit"; reject.textContent = "Reject local edit";
      const compareLatest = ():void => { this.reviewVisible = true; const base = this.pendingBase, latest = adapter.load();
        this.commandFeedback = `Comparing command base revision ${base?.revision ?? "unknown"} with latest revision ${latest.revision}.`; options.rerender(); };
      const retryAction = ():void => { options.retry(); }, rejectAction = ():void => { options.reject(); };
      compare.addEventListener("click", compareLatest); retry.addEventListener("click", retryAction); reject.addEventListener("click", rejectAction);
      own(compare, compareLatest); own(retry, retryAction); own(reject, rejectAction); host.append(compare, retry, reject);
    }
  }
  disposeState():void {
    this.savedDocument = undefined; this.pendingCommand = undefined; this.pendingBase = undefined; this.reviewVisible = false;
    this.revisionSnapshots.clear(); this.commandFeedback = undefined; this.projectionWorker = undefined; this.reopenSelection = undefined;
    this.presenceDraft = undefined; this.historyState = compactCanonicalHistorySettlement(); this.pendingHistoryLabel = undefined;
    this.clearContext();
  }
}
