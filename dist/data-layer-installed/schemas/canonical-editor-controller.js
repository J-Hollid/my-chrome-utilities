import { compactCanonicalHistorySettlement, } from "../../utilities/data-layer/schemas.js";
/** Owns the mutable state for compact canonical editing and settlement. */
export class SchemaCanonicalEditorController {
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
    contextDisposers = [];
    propertyMenuId;
    tableHost;
    tableEditor;
    tableKey;
    clearContext() { for (const dispose of this.contextDisposers.splice(0))
        dispose(); }
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
        this.clearContext();
    }
}
//# sourceMappingURL=canonical-editor-controller.js.map