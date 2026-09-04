import {
  compactCanonicalHistorySettlement,
  mountCanonicalSchemaEditor,
  type CanonicalSchemaDocument,
  type SchemaDefinition,
} from "../../utilities/data-layer/schemas.js";
import type {
  CompactCanonicalCommand,
  CompactCanonicalEditorAdapter,
  CompactCanonicalProjectionPersistenceRequest,
  CompactCanonicalProjectionWorker,
} from "./index.js";

/** Owns the mutable state for compact canonical editing and settlement. */
export class SchemaCanonicalEditorController {
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

  clearContext():void { for (const dispose of this.contextDisposers.splice(0)) dispose(); }
  disposeState():void {
    this.savedDocument = undefined; this.pendingCommand = undefined; this.pendingBase = undefined; this.reviewVisible = false;
    this.revisionSnapshots.clear(); this.commandFeedback = undefined; this.projectionWorker = undefined; this.reopenSelection = undefined;
    this.presenceDraft = undefined; this.historyState = compactCanonicalHistorySettlement(); this.pendingHistoryLabel = undefined;
    this.clearContext();
  }
}
