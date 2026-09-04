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
  projection(adapter:CompactCanonicalEditorAdapter):SchemaDefinition;
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
    persistCanonicalProjection:(projection:SchemaDefinition, change?:string) => controller.editor
      ? controller.persistProjection(controller.editor, projection, change) : Promise.resolve(false),
    resumeCanonicalProjection:() => controller.editor ? controller.resumeProjectionPersistence(controller.editor) : Promise.resolve(false),
    retryCanonical:() => controller.retryCommand(), rejectCanonical:() => controller.rejectCommand(),
    canonicalProjection:() => controller.editor ? ports.projection(controller.editor) : undefined,
    canonicalDocument:() => controller.editor ? structuredClone(controller.editor.load()) : undefined,
    canonicalFacet:(propertyId:string) => { const document=controller.editor?.load(), node=document?.nodes[propertyId];
      return document && node ? ports.facet(document,node) : undefined; },
    canonicalCommandScope:(command:CompactCanonicalCommand) => controller.editor
      ? controller.commandScope(command,controller.editor.load()) : undefined,
    canonicalQueueUnavailable:() => controller.editor ? controller.projectionQueueUnavailable(controller.editor) : false,
    beginCanonicalHistory:(projectId:string,label:string,before:CanonicalSchemaDocument,after:CanonicalSchemaDocument) => {
      if (!controller.editor) return undefined; const key=compactCanonicalHistoryKey(projectId,controller.editor.key);
      const history=recordCompactCanonicalMutation(controller.historyState.history,key,before,after);
      return controller.beginPendingHistory(projectId,controller.editor.key,label,history); },
    completeCanonicalHistory:(identity:Parameters<SchemaCanonicalEditorController["completePendingHistory"]>[0]) => controller.completePendingHistory(identity),
    rejectCanonicalHistory:(identity:Parameters<SchemaCanonicalEditorController["rejectPendingHistory"]>[0]) => controller.rejectPendingHistory(identity),
    pendingCanonicalHistory:(projectId:string,label:string) => controller.pendingHistoryFor(projectId,label),
    canonicalState:() => ({ open:Boolean(controller.editor),pending:Boolean(controller.pendingCommand),
      settlementPending:controller.settlementPending,reviewVisible:controller.reviewVisible,
      feedback:controller.commandFeedback,reopenSelection:controller.reopenSelection,
      projectionPending:Boolean(controller.projectionRequest),historyPending:Boolean(controller.historyState.pending) }),
    renderCanonical:ports.render,
  };
}
