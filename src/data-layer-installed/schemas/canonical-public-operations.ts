import { compactCanonicalHistoryKey, recordCompactCanonicalMutation,
  type CanonicalSchemaDocument, type SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { CompactCanonicalCommand, CompactCanonicalEditorAdapter } from "./contracts.js";
import type { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";

export interface CanonicalPublicOperationPorts {
  controller:SchemaCanonicalEditorController;
  schema(id:string):SchemaDefinition|undefined;
  openSaved(schema:SchemaDefinition):void;
  open(adapter:CompactCanonicalEditorAdapter):void;
  close(commit?:boolean):void;
  show():void;
  projection(canonical:CanonicalSchemaDocument):SchemaDefinition;
  facet(document:CanonicalSchemaDocument, node:CanonicalSchemaDocument["nodes"][string]):string;
  render():void;
}

/** Projects the canonical editor controller as installed public operations. */
export function createCanonicalPublicOperations(ports:CanonicalPublicOperationPorts) {
  const controller = ports.controller;
  return {
    openSavedCanonical:(schemaId:string) => { const schema = ports.schema(schemaId); if (!schema) return false;
      ports.openSaved(schema); return true; },
    openCanonical:ports.open, closeCanonical:ports.close,
    dispatchCanonical:(command:CompactCanonicalCommand) => controller.dispatchCommand(command),
    persistCanonicalProjection:(projection:SchemaDefinition, change?:string) => controller.persistCurrentProjection(projection,change),
    resumeCanonicalProjection:() => controller.resumeCurrentProjectionPersistence(),
    retryCanonical:() => controller.retryCommand(), rejectCanonical:() => controller.rejectCommand(),
    canonicalProjection:() => controller.projectEditor(ports.projection),
    canonicalDocument:() => controller.editorDocument(),
    canonicalFacet:(propertyId:string) => { const document=controller.editorDocument(), node=document?.nodes[propertyId];
      return document && node ? ports.facet(document,node) : undefined; },
    canonicalCommandScope:(command:CompactCanonicalCommand) => {const document=controller.editorDocument();return document
      ? controller.commandScope(command,document) : undefined;},
    canonicalQueueUnavailable:() => controller.currentProjectionQueueUnavailable(),
    beginCanonicalHistory:(projectId:string,label:string,before:CanonicalSchemaDocument,after:CanonicalSchemaDocument) => {
      const editorKey=controller.editorKey();if (!editorKey) return undefined; const key=compactCanonicalHistoryKey(projectId,editorKey);
      const history=recordCompactCanonicalMutation(controller.historyState.history,key,before,after);
      return controller.beginPendingHistory(projectId,editorKey,label,history); },
    completeCanonicalHistory:(identity:Parameters<SchemaCanonicalEditorController["completePendingHistory"]>[0]) => controller.completePendingHistory(identity),
    rejectCanonicalHistory:(identity:Parameters<SchemaCanonicalEditorController["rejectPendingHistory"]>[0]) => controller.rejectPendingHistory(identity),
    pendingCanonicalHistory:(projectId:string,label:string) => controller.pendingHistoryFor(projectId,label),
    canonicalState:() => ({ open:controller.hasEditor(),pending:Boolean(controller.pendingCommand),
      settlementPending:controller.settlementPending,reviewVisible:controller.reviewVisible,
      feedback:controller.commandFeedback,reopenSelection:controller.reopenSelection,
      projectionPending:controller.projectionPending,historyPending:Boolean(controller.historyState.pending) }),
    renderCanonical:ports.render,
  };
}
