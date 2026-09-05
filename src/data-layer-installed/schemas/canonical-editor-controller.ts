import {
  beginCompactCanonicalHistoryTransition,
  canonicalCommandOutcome,
  canonicalCommandsFromCompactProjection,
  compactCanonicalCommandPolicy,
  compactCanonicalHistorySettlement,
  completeCompactCanonicalHistoryTransition,
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
  readonly #state = {
    savedDocument:undefined as CanonicalSchemaDocument | undefined,
    editor:undefined as CompactCanonicalEditorAdapter | undefined,
    pendingCommand:undefined as CompactCanonicalCommand | undefined,
    pendingBase:undefined as CanonicalSchemaDocument | undefined,
    reviewVisible:false,
    commandFeedback:undefined as string | undefined,
    settlementSequence:0,
    idSequence:0,
    settlementPending:false,
    settlementSchemaId:undefined as string | undefined,
    settlementBarrier:Promise.resolve(true),
    projectionRequest:undefined as CompactCanonicalProjectionPersistenceRequest | undefined,
    projectionWorker:undefined as CompactCanonicalProjectionWorker | undefined,
    queuedLibraryPersistence:undefined as { schemaId:string; schemas:readonly SchemaDefinition[] } | undefined,
    libraryPersistenceWorker:undefined as Promise<void> | undefined,
    reopenSelection:undefined as string | undefined,
    historyState:compactCanonicalHistorySettlement(),
    pendingHistoryLabel:undefined as string | undefined,
    presenceDraft:undefined as { propertyId:string; baseRevision:number; mode:string } | undefined,
  };
  readonly #revisionSnapshots = new Map<number, CanonicalSchemaDocument>();
  readonly #settlementClaims = new Map<number, string | undefined>();
  readonly #scrollByKey = new Map<string, number>();

  get savedDocument():CanonicalSchemaDocument | undefined { return this.#state.savedDocument ? structuredClone(this.#state.savedDocument) : undefined; }
  get editorState():{ key:string; label:string; document:CanonicalSchemaDocument; canUndo:boolean; canRedo:boolean;
    actions:readonly { label:string }[]; migration?:{ summary:string; conflicts:readonly { id:string; label:string;
      choices:readonly { id:string; label:string }[] }[] } } | undefined {
    const adapter=this.#state.editor,document=adapter?.load();
    if(!adapter||!document)return undefined;
    return {key:adapter.key,label:adapter.label,document:structuredClone(document),canUndo:Boolean(adapter.onUndo),canRedo:Boolean(adapter.onRedo),
      actions:(adapter.actions??[]).map(({label})=>({label})),...(adapter.migration?{migration:{summary:adapter.migration.summary,
        conflicts:structuredClone(adapter.migration.conflicts)}}:{})};
  }
  get pendingCommand():Readonly<CompactCanonicalCommand> | undefined { return this.#state.pendingCommand ? structuredClone(this.#state.pendingCommand) : undefined; }
  get pendingBase():CanonicalSchemaDocument | undefined { return this.#state.pendingBase ? structuredClone(this.#state.pendingBase) : undefined; }
  get reviewVisible():boolean { return this.#state.reviewVisible; }
  get revisionSnapshots():ReadonlyMap<number, CanonicalSchemaDocument> { return new Map([...this.#revisionSnapshots].map(([key,value]) => [key,structuredClone(value)])); }
  get commandFeedback():string | undefined { return this.#state.commandFeedback; }
  get settlementSequence():number { return this.#state.settlementSequence; }
  get settlementClaims():ReadonlyMap<number, string | undefined> { return new Map(this.#settlementClaims); }
  get idSequence():number { return this.#state.idSequence; }
  get settlementPending():boolean { return this.#state.settlementPending; }
  get settlementSchemaId():string | undefined { return this.#state.settlementSchemaId; }
  get settlementBarrier():Promise<boolean> { return this.#state.settlementBarrier; }
  get projectionPending():boolean { return Boolean(this.#state.projectionRequest); }
  get queuedLibraryPersistence():{ schemaId:string; schemas:readonly SchemaDefinition[] } | undefined { return this.#state.queuedLibraryPersistence ? structuredClone(
    this.#state.queuedLibraryPersistence) : undefined; }
  get libraryPersistenceWorker():Promise<void> | undefined { return this.#state.libraryPersistenceWorker; }
  get reopenSelection():string | undefined { return this.#state.reopenSelection; }
  get scrollByKey():ReadonlyMap<string, number> { return new Map(this.#scrollByKey); }
  get historyState() { return structuredClone(this.#state.historyState); }
  get pendingHistoryLabel():string | undefined { return this.#state.pendingHistoryLabel; }
  get presenceDraft():{ propertyId:string; baseRevision:number; mode:string } | undefined { return this.#state.presenceDraft ? { ...this.#state.presenceDraft } : undefined; }

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

  editorDocument():CanonicalSchemaDocument|undefined { const value=this.#state.editor?.load();return value?structuredClone(value):undefined; }
  editorKey():string|undefined { return this.#state.editor?.key; }
  editorLabel():string|undefined { return this.#state.editor?.label; }
  hasEditor():boolean { return Boolean(this.#state.editor); }
  isEditorKey(key:string):boolean { return this.#state.editor?.key===key; }
  runEditorUndo():void|string|Promise<void|string> { return this.#state.editor?.onUndo?.(); }
  runEditorRedo():void|string|Promise<void|string> { return this.#state.editor?.onRedo?.(); }
  runEditorAction(index:number):void { this.#state.editor?.actions?.[index]?.run(); }
  renderEditorContext(host:HTMLElement):void { this.#state.editor?.renderContext?.(host); }
  resolveMigration(conflictId:string,choiceId:string):void { this.#state.editor?.migration?.resolve(conflictId,choiceId); }
  cancelMigration():void { this.#state.editor?.migration?.cancel(); }
  confirmMigration():Promise<void> { return this.#state.editor?.migration?.confirm()??Promise.resolve(); }
  projectEditor(fallback:(canonical:CanonicalSchemaDocument)=>SchemaDefinition):SchemaDefinition|undefined {
    const adapter=this.#state.editor;
    if (!adapter) return undefined;
    const canonical=structuredClone(adapter.load());
    const projected=adapter.projection
      ? adapter.projection(structuredClone(canonical))
      : fallback(structuredClone(canonical));
    return structuredClone(projected);
  }

  setSavedDocument(value:CanonicalSchemaDocument|undefined):void {
    this.#state.savedDocument=value?structuredClone(value):undefined;
  }
  openEditor(adapter:CompactCanonicalEditorAdapter):void {
    this.#state.editor=adapter;
    this.#state.reopenSelection=adapter.key;
    this.#revisionSnapshots.clear();
    this.recordRevision(adapter.load());
  }
  closeEditor():void { this.#state.editor=undefined; }
  setPresenceDraft(value:{ propertyId:string; baseRevision:number; mode:string } | undefined):void {
    this.#state.presenceDraft=value ? { ...value } : undefined;
  }
  setCommandFeedback(message:string|undefined):void { this.#state.commandFeedback=message; }
  showPendingComparison():void {
    this.#state.reviewVisible=true;
    const latest=this.#state.editor?.load();
    this.#state.commandFeedback=`Comparing command base revision ${this.pendingBase?.revision??"unknown"} with latest revision ${latest?.revision??"unknown"}.`;
  }
  recordRevision(document:CanonicalSchemaDocument):void {
    this.#revisionSnapshots.set(document.revision,structuredClone(document));
  }
  createCanonicalId(kind:string):string { return `schema:${kind}:${++this.#state.idSequence}`; }
  rememberScroll(key:string,scrollTop:number):void { this.#scrollByKey.set(key,scrollTop); }
  rejectDurableChange():void {
    this.#state.pendingCommand=undefined;
    this.#state.pendingBase=undefined;
    this.#state.projectionRequest=undefined;
    this.#state.commandFeedback="Durable schema change rejected; the saved state was restored.";
  }

  beginPendingHistory(projectId:string, editorKey:string, label:string,
    history:ReturnType<typeof compactCanonicalHistorySettlement>["history"]):CompactCanonicalHistoryTransitionIdentity {
    const identity = { operationId:`schema-history:${++this.#state.idSequence}`, projectId, editorKey };
    this.#state.historyState = beginCompactCanonicalHistoryTransition(this.historyState, { ...identity, history });
    this.#state.pendingHistoryLabel = label;
    return identity;
  }
  completePendingHistory(identity:CompactCanonicalHistoryTransitionIdentity):void {
    this.#state.historyState = completeCompactCanonicalHistoryTransition(this.historyState, identity);
    if (!this.historyState.pending) this.#state.pendingHistoryLabel = undefined;
  }
  rejectPendingHistory(identity:CompactCanonicalHistoryTransitionIdentity):void {
    this.#state.historyState = rejectCompactCanonicalHistoryTransition(this.historyState, identity);
    if (!this.historyState.pending) this.#state.pendingHistoryLabel = undefined;
  }
  pendingHistoryFor(projectId:string, label:string):CompactCanonicalHistoryTransitionIdentity | undefined {
    const pending = this.historyState.pending;
    return pending && pending.projectId === projectId && this.pendingHistoryLabel === label
      ? { operationId:pending.operationId, projectId:pending.projectId, editorKey:pending.editorKey } : undefined;
  }
  semanticUnresolved(owned?:CompactCanonicalProjectionPersistenceRequest):boolean {
    return Boolean(this.settlementPending || this.historyState.pending || this.#state.pendingCommand
      || (this.#state.projectionWorker && this.#state.projectionWorker.adapter !== owned?.adapter)
      || (this.#state.projectionRequest && this.#state.projectionRequest !== owned));
  }
  savedSchemaId(adapter:CompactCanonicalEditorAdapter | undefined):string | undefined {
    return adapter?.key.startsWith("saved:") ? adapter.key.slice("saved:".length) : undefined;
  }
  beginSettlement(schemaId?:string):number {
    const settlement = ++this.#state.settlementSequence;
    this.#settlementClaims.set(settlement, schemaId);
    this.#state.settlementPending = true;
    this.#state.settlementSchemaId = schemaId;
    return settlement;
  }
  clearSettlement(schemaId?:string, settlement?:number):boolean {
    if (settlement !== undefined) {
      if (!this.settlementClaims.has(settlement) || this.settlementClaims.get(settlement) !== schemaId) return false;
      this.#settlementClaims.delete(settlement);
      if (this.settlementClaims.size) {
        this.#state.settlementSchemaId = [...this.settlementClaims.values()].at(-1);
        return false;
      }
    } else this.#settlementClaims.clear();
    if (this.queuedLibraryPersistence || this.libraryPersistenceWorker) {
      this.#state.settlementPending = true;
      this.#state.settlementSchemaId = this.queuedLibraryPersistence?.schemaId ?? schemaId;
      return false;
    }
    this.#state.settlementPending = false;
    this.#state.settlementSchemaId = undefined;
    return true;
  }
  queueLibraryPersistence(schemaId:string,schemas:readonly SchemaDefinition[],fallback:()=>void):void {
    if (!this.#ports.settleLibrary || !this.#ports.writeLibrary) { fallback(); return; }
    this.#state.queuedLibraryPersistence={ schemaId,schemas:structuredClone([...schemas]) }; this.#state.settlementPending=true;
    this.#state.settlementSchemaId=schemaId; this.#ports.setBusy(true);
    void this.settlementBarrier.then((committed) => { if (committed) this.#startLibraryPersistence(); });
  }
  #startLibraryPersistence():void {
    const ports=this.#ports; if (this.libraryPersistenceWorker || !this.queuedLibraryPersistence || this.settlementClaims.size || !ports.settleLibrary || !ports.writeLibrary)
       return;
    const settle=ports.settleLibrary,write=ports.writeLibrary,queuedId=this.queuedLibraryPersistence.schemaId; this.#state.libraryPersistenceWorker=(async() => { let active:{ schemaId:
      string;schemas:readonly SchemaDefinition[] }|undefined;
      try { while ((ports.mounted?.() ?? true) && this.queuedLibraryPersistence) { active=this.queuedLibraryPersistence; this.#state.queuedLibraryPersistence=undefined; this
        .#state.settlementPending=true; this.#state.settlementSchemaId=active.schemaId; ports.setBusy(true); write(active.schemas); await settle(active.schemaId); active=undefined; } }
      catch { if (ports.blocked() && !this.queuedLibraryPersistence && active) this.#state.queuedLibraryPersistence=active; }
      finally { this.#state.libraryPersistenceWorker=undefined; if (!this.queuedLibraryPersistence) this.clearSettlement(active?.schemaId ?? queuedId); ports.renderEditor(); }
    })();
  }
  projectionQueueUnavailable(adapter:CompactCanonicalEditorAdapter):boolean {
    return Boolean(this.historyState.pending || this.#state.pendingCommand
      || (this.#state.projectionWorker && this.#state.projectionWorker.adapter !== adapter)
      || (this.#state.projectionRequest && this.#state.projectionRequest.adapter !== adapter));
  }
  currentProjectionQueueUnavailable():boolean { const adapter=this.#state.editor;return adapter?this.projectionQueueUnavailable(adapter):false; }
  currentSavedSchemaId():string|undefined { return this.savedSchemaId(this.#state.editor); }
  projectionPendingForSchema(schemaId:string):boolean {
    const request=this.#state.projectionRequest;
    return Boolean(request&&this.savedSchemaId(request.adapter)===schemaId&&request.adapter===this.#state.editor);
  }
  blockedCommand(adapter:CompactCanonicalEditorAdapter, command:CompactCanonicalCommand, message:string) {
    return { status:"conflict" as const, document:adapter.load(),
      ...(command.kind !== "policy" && "propertyId" in command ? { propertyId:command.propertyId } : {}), message };
  }
  blockedCurrentCommand(command:CompactCanonicalCommand,message:string,fallback:CanonicalSchemaDocument) {
    const adapter=this.#state.editor;
    return adapter?this.blockedCommand(adapter,command,message):{status:"conflict" as const,document:structuredClone(fallback),
      ...("propertyId" in command?{propertyId:command.propertyId}:{}),message};
  }
  beginCommand(command:CompactCanonicalCommand, owned?:CompactCanonicalProjectionPersistenceRequest) {
    const adapter = this.#state.editor;
    if (!adapter) return;
    const policy = compactCanonicalCommandPolicy(command.kind, this.semanticUnresolved(owned));
    if (!policy.allowed) {
      const message = "Resolve the current durable schema save through Retry or Reject before another semantic change.";
      this.#state.commandFeedback = message; this.#ports.renderContext();
      return { accepted:false, result:this.blockedCommand(adapter, command, message), completion:Promise.resolve(false) };
    }
    const before = structuredClone(adapter.load()); this.#revisionSnapshots.set(before.revision, before);
    let result;
    try { result = adapter.dispatch(command); }
    catch (error) {
      const message = `The canonical command was not applied. ${error instanceof Error ? error.message : String(error)}`;
      this.#state.commandFeedback = message; this.#ports.renderContext();
      return { accepted:false, result:this.blockedCommand(adapter, command, message), completion:Promise.resolve(false) };
    }
    if (result.status === "conflict" || result.status === "confirmation-required") {
      this.#state.pendingCommand = command; this.#state.pendingBase = before; this.#state.reviewVisible = false;
      this.#state.commandFeedback = result.status === "conflict" ? result.message : result.impact; this.#ports.renderContext();
      return { accepted:false, result, completion:Promise.resolve(false) };
    }
    if (policy.semantic) { this.#state.pendingCommand = undefined; this.#state.pendingBase = undefined; this.#state.reviewVisible = false;
      this.#state.presenceDraft = undefined; }
    this.#state.commandFeedback = canonicalCommandOutcome(command, result, before); this.#ports.renderContext();
    const schemaId = this.savedSchemaId(adapter);
    const settlement = policy.settles && adapter.settle && (adapter.settles?.(command) ?? true) ? this.beginSettlement(schemaId) : undefined;
    if (settlement) this.#ports.setBusy(true);
    if (!settlement || !adapter.settle) return { accepted:true, result, completion:Promise.resolve(true) };
    const generation = this.#ports.generation();
    const completion = adapter.settle().then(() => {
      adapter.onSettlementCommitted?.();
      if (this.#ports.isCurrent(generation)) {
        if (this.clearSettlement(schemaId, settlement)) this.#state.commandFeedback = `Committed to ${adapter.settlementTarget ?? "durable Saved Draft"}.`;
        this.#ports.renderEditor();
      }
      return true;
    }, (error) => {
      if (this.#ports.isCurrent(generation)) {
        if (!this.#ports.blocked() && this.clearSettlement(schemaId, settlement)) {
          this.#state.pendingCommand = command; this.#state.pendingBase = before;
          this.#state.commandFeedback = `Not saved; Retry or Reject. ${error instanceof Error ? error.message : String(error)}`;
        }
        this.#ports.renderEditor();
      }
      return false;
    });
    this.#state.settlementBarrier = completion;
    return { accepted:true, result, completion };
  }
  async dispatchCommand(command:CompactCanonicalCommand, owned?:CompactCanonicalProjectionPersistenceRequest):Promise<boolean> {
    const dispatch = this.beginCommand(command, owned);
    return Boolean(dispatch?.accepted && await dispatch.completion);
  }
  beginProjectionPersistence(adapter:CompactCanonicalEditorAdapter, projection:SchemaDefinition, change?:string):Promise<boolean> {
    if (!adapter.persistProjection) return Promise.resolve(true);
    this.#state.projectionRequest = { adapter, projection:structuredClone(projection), ...(change ? { change } : {}) };
    if (this.#ports.blocked()) {
      this.#state.commandFeedback = "Projection is waiting for the failed durable save to be retried or rejected.";
      this.#ports.renderContext(); return Promise.resolve(false);
    }
    const schemaId = this.savedSchemaId(adapter);
    this.#state.settlementPending = true; this.#state.settlementSchemaId = schemaId; this.#ports.setBusy(true);
    if (this.#state.projectionWorker?.adapter === adapter) return this.#state.projectionWorker.promise;
    const generation = this.#ports.generation();
    const worker:CompactCanonicalProjectionWorker = { adapter, promise:Promise.resolve(false), settlement:this.beginSettlement(schemaId) };
    this.#state.projectionWorker = worker;
    worker.promise = (async () => {
      let committed = false, activeRequest:CompactCanonicalProjectionPersistenceRequest | undefined;
      try {
        while (this.#ports.isCurrent(generation) && this.#state.editor === adapter) {
          const request = this.#state.projectionRequest; if (!request || request.adapter !== adapter) break; activeRequest = request;
          this.#state.projectionRequest = undefined; if (!adapter.persistProjection!(structuredClone(request.projection), request.change)) continue;
          await adapter.settle?.(); adapter.onSettlementCommitted?.(); committed = true; activeRequest = undefined;
        }
        this.#state.commandFeedback = committed ? `Saved to ${adapter.settlementTarget ?? "durable Saved Draft"}.` : "Projection already current.";
        return true;
      } catch (error) {
        if (this.#ports.blocked() && this.#ports.isCurrent(generation) && this.#state.editor === adapter && !this.#state.projectionRequest && activeRequest)
          this.#state.projectionRequest = activeRequest;
        this.#state.commandFeedback = `Projection not saved; Retry or Reject. ${error instanceof Error ? error.message : String(error)}`;
        return false;
      } finally {
        if (this.#state.projectionWorker === worker) { this.#state.projectionWorker = undefined; this.clearSettlement(schemaId, worker.settlement); this.#ports.renderEditor(); }
      }
    })();
    return worker.promise;
  }
  async persistProjection(adapter:CompactCanonicalEditorAdapter, projection:SchemaDefinition, change?:string):Promise<boolean> {
    const commands = canonicalCommandsFromCompactProjection(adapter.load(), projection, (kind) => `schema:${kind}:${++this.#state.idSequence}`);
    for (const command of commands) if (!await this.dispatchCommand({ ...command, baseRevision:adapter.load().revision }, this.#state.projectionRequest)) return false;
    return this.beginProjectionPersistence(adapter, projection, change);
  }
  persistCurrentProjection(projection:SchemaDefinition,change?:string):Promise<boolean> {
    const adapter=this.#state.editor;return adapter?this.persistProjection(adapter,projection,change):Promise.resolve(false);
  }
  discardProjectionPersistence(adapter?:CompactCanonicalEditorAdapter):void {
    if (!adapter || this.#state.projectionRequest?.adapter === adapter) this.#state.projectionRequest = undefined;
    if (this.settlementPending || (adapter && this.#state.projectionWorker?.adapter === adapter)) return;
    this.#state.settlementSequence += 1; this.clearSettlement(this.savedSchemaId(adapter));
  }
  resumeProjectionPersistence(adapter:CompactCanonicalEditorAdapter):Promise<boolean> {
    const request = this.#state.projectionRequest;
    return request?.adapter === adapter ? this.persistProjection(adapter, request.projection, request.change) : Promise.resolve(true);
  }
  resumeCurrentProjectionPersistence():Promise<boolean> { const adapter=this.#state.editor;return adapter?this.resumeProjectionPersistence(adapter):Promise.resolve(false); }
  discardCurrentProjectionPersistence():void { this.discardProjectionPersistence(this.#state.editor); }
  retryCommand():void {
    const command = this.#state.pendingCommand, adapter = this.#state.editor; if (!command || !adapter) return;
    this.#state.pendingCommand = undefined;
    if (this.#state.projectionRequest?.adapter === adapter) { void this.resumeProjectionPersistence(adapter); return; }
    void this.dispatchCommand({ ...command, baseRevision:adapter.load().revision }).then(() => this.#ports.renderEditor());
  }
  rejectCommand():void {
    this.#state.pendingCommand = undefined; this.#state.pendingBase = undefined; this.#state.reviewVisible = false; this.#state.projectionRequest = undefined;
    this.#state.commandFeedback = "Local edit rejected; durable state is unchanged."; this.#ports.renderContext();
  }
  propertyAction(propertyId:string, action:"add-child"|"no-example"|"custom-example"|"documentation"|"presence"|"rename"|"move"|"duplicate"|"expected"|"reset-expected"|"view"|"remove", value?:string):Promise<boolean> {
    const adapter = this.#state.editor, document = adapter?.load(), node = document?.nodes[propertyId];
    if (!adapter || !document || !node) return Promise.resolve(false);
    const baseRevision = document.revision;
    if (action === "add-child") return this.dispatchCommand({ kind:"add", baseRevision, parentId:propertyId, name:"New child", type:"string", id:this.#ports.createId });
    if (action === "rename") return this.dispatchCommand({ kind:"rename", baseRevision, propertyId, name:value?.trim() || node.name });
    if (action === "move") return this.dispatchCommand({ kind:"move", baseRevision, propertyId });
    if (action === "duplicate") return this.dispatchCommand({ kind:"duplicate", baseRevision, propertyId, id:this.#ports.createId });
    if (action === "view") return this.dispatchCommand({ kind:"select", baseRevision, propertyId });
    if (action === "remove") return this.dispatchCommand({ kind:"delete", baseRevision, propertyId });
    if (action === "presence") return this.dispatchCommand({ kind:"set", baseRevision, propertyId, patch:{ presence:{ ...node.presence, mode:(value || "optional") as typeof node
      .presence.mode } } });
    if (action === "documentation") return this.dispatchCommand({ kind:"set", baseRevision, propertyId, patch:{ documentation:{ ...node.documentation, description:value ?? node
      .documentation.description } } });
    if (action === "no-example") return this.dispatchCommand({ kind:"set", baseRevision, propertyId, patch:{ documentation:{ ...node.documentation, example:{ method:"blank" } } } }
      );
    if (action === "custom-example") return this.dispatchCommand({ kind:"set", baseRevision, propertyId, patch:{ documentation:{ ...node.documentation, example:{ method:"custom",
       value } } } });
    return this.dispatchCommand({ kind:"set", baseRevision, propertyId, patch:{ expectedValue:action === "expected" ? value : undefined } });
  }
  commandScope(command:CompactCanonicalCommand, document:CanonicalSchemaDocument):string {
    return "propertyId" in command ? document.nodes[command.propertyId]?.name ?? command.propertyId : command.kind;
  }
  disposeState():void {
    this.#state.savedDocument = undefined; this.#state.editor = undefined; this.#state.pendingCommand = undefined; this.#state.pendingBase = undefined; this.#state.reviewVisible = false;
    this.#revisionSnapshots.clear(); this.#state.commandFeedback = undefined; this.#state.projectionWorker = undefined; this.#state.reopenSelection = undefined;
    this.#state.presenceDraft = undefined; this.#state.historyState = compactCanonicalHistorySettlement(); this.#state.pendingHistoryLabel = undefined;
  }
}
