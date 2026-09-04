/** Owns the transient state for installed Schema property authoring. */
export class SchemaPropertyController {
    selectedPath = "example";
    expandedRulePaths = new Set();
    pendingRemoval;
    lastRemoval;
    lastCopy;
    pendingCopy;
    pendingCopyReview;
    pendingCopyPosition;
    pendingDocumentationRemoval;
    specificIndexArrayPath;
    specificIndexTrigger;
    pendingManualContext;
    pendingManualCanonicalBase;
    interactionReturn;
    renderSequence = 0;
    dispose(resetCopyDialog) {
        this.pendingRemoval = undefined;
        this.pendingDocumentationRemoval = undefined;
        this.lastRemoval = undefined;
        this.pendingCopyReview?.close();
        this.pendingCopyReview = undefined;
        resetCopyDialog();
        this.pendingCopy = undefined;
        this.lastCopy = undefined;
        this.pendingCopyPosition = undefined;
        this.specificIndexArrayPath = undefined;
        this.specificIndexTrigger = undefined;
        this.pendingManualContext = undefined;
        this.pendingManualCanonicalBase = undefined;
        this.interactionReturn = undefined;
        this.expandedRulePaths.clear();
    }
}
//# sourceMappingURL=property-controller.js.map