import { compactCanonicalHistoryKey, recordCompactCanonicalMutation } from "../../utilities/data-layer/schemas.js";
/** Projects the canonical editor controller as installed public operations. */
export function createCanonicalPublicOperations(ports) {
    const controller = ports.controller;
    return {
        openSavedCanonical: (schemaId) => {
            const schema = ports.schema(schemaId);
            if (!schema)
                return false;
            ports.openSaved(schema);
            return true;
        },
        openCanonical: ports.open, closeCanonical: ports.close,
        dispatchCanonical: (command) => controller.dispatchCommand(command),
        persistCanonicalProjection: (projection, change) => controller.persistCurrentProjection(projection, change),
        resumeCanonicalProjection: () => controller.resumeCurrentProjectionPersistence(),
        retryCanonical: () => controller.retryCommand(), rejectCanonical: () => controller.rejectCommand(),
        canonicalProjection: () => controller.projectEditor(ports.projection),
        canonicalDocument: () => controller.editorDocument(),
        canonicalFacet: (propertyId) => {
            const document = controller.editorDocument(), node = document?.nodes[propertyId];
            return document && node ? ports.facet(document, node) : undefined;
        },
        canonicalCommandScope: (command) => {
            const document = controller.editorDocument();
            return document
                ? controller.commandScope(command, document) : undefined;
        },
        canonicalQueueUnavailable: () => controller.currentProjectionQueueUnavailable(),
        beginCanonicalHistory: (projectId, label, before, after) => {
            const editorKey = controller.editorKey();
            if (!editorKey)
                return undefined;
            const key = compactCanonicalHistoryKey(projectId, editorKey);
            const history = recordCompactCanonicalMutation(controller.historyState.history, key, before, after);
            return controller.beginPendingHistory(projectId, editorKey, label, history);
        },
        completeCanonicalHistory: (identity) => controller.completePendingHistory(identity),
        rejectCanonicalHistory: (identity) => controller.rejectPendingHistory(identity),
        pendingCanonicalHistory: (projectId, label) => controller.pendingHistoryFor(projectId, label),
        canonicalState: () => ({ open: controller.hasEditor(), pending: Boolean(controller.pendingCommand),
            settlementPending: controller.settlementPending, reviewVisible: controller.reviewVisible,
            feedback: controller.commandFeedback, reopenSelection: controller.reopenSelection,
            projectionPending: controller.projectionPending, historyPending: Boolean(controller.historyState.pending) }),
        renderCanonical: ports.render,
    };
}
//# sourceMappingURL=canonical-public-operations.js.map