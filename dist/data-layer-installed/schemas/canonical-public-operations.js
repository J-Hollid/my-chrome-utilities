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
        persistCanonicalProjection: (projection, change) => controller.editor
            ? controller.persistProjection(controller.editor, projection, change) : Promise.resolve(false),
        resumeCanonicalProjection: () => controller.editor ? controller.resumeProjectionPersistence(controller.editor) : Promise.resolve(false),
        retryCanonical: () => controller.retryCommand(), rejectCanonical: () => controller.rejectCommand(),
        canonicalProjection: () => controller.editor ? ports.projection(controller.editor) : undefined,
        canonicalDocument: () => controller.editor ? structuredClone(controller.editor.load()) : undefined,
        canonicalFacet: (propertyId) => {
            const document = controller.editor?.load(), node = document?.nodes[propertyId];
            return document && node ? ports.facet(document, node) : undefined;
        },
        canonicalCommandScope: (command) => controller.editor
            ? controller.commandScope(command, controller.editor.load()) : undefined,
        canonicalQueueUnavailable: () => controller.editor ? controller.projectionQueueUnavailable(controller.editor) : false,
        beginCanonicalHistory: (projectId, label, before, after) => {
            if (!controller.editor)
                return undefined;
            const key = compactCanonicalHistoryKey(projectId, controller.editor.key);
            const history = recordCompactCanonicalMutation(controller.historyState.history, key, before, after);
            return controller.beginPendingHistory(projectId, controller.editor.key, label, history);
        },
        completeCanonicalHistory: (identity) => controller.completePendingHistory(identity),
        rejectCanonicalHistory: (identity) => controller.rejectPendingHistory(identity),
        pendingCanonicalHistory: (projectId, label) => controller.pendingHistoryFor(projectId, label),
        canonicalState: () => ({ open: Boolean(controller.editor), pending: Boolean(controller.pendingCommand),
            settlementPending: controller.settlementPending, reviewVisible: controller.reviewVisible,
            feedback: controller.commandFeedback, reopenSelection: controller.reopenSelection,
            projectionPending: Boolean(controller.projectionRequest), historyPending: Boolean(controller.historyState.pending) }),
        renderCanonical: ports.render,
    };
}
//# sourceMappingURL=canonical-public-operations.js.map