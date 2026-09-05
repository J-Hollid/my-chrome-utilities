import { SCHEMA_LIBRARY_STORAGE_KEY, savedSchemaCanonicalDocument, serializeSchemaLibrary, type SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule, SchemaPersistenceEvent } from "./contracts.js";
import type { SchemaPersistencePorts } from "./persistence-controller-contracts.js";

interface PendingPersistence { schemaId:string; generation:number; kind:"promotion"|"guided"; paused:boolean; settled:boolean;
  previousSchemas:readonly SchemaDefinition[]; previousRules:readonly ReusableSchemaRule[]; nextSchemas:readonly SchemaDefinition[]; nextRules:readonly ReusableSchemaRule[];
  complete():void; reject(error:unknown):void; pause():void }
export class SchemaPersistenceController {
  readonly #ports:SchemaPersistencePorts; #generation=0; #promotion:PendingPersistence|undefined; #guided:PendingPersistence|undefined;
  constructor(ports:SchemaPersistencePorts) { this.#ports=ports; }
  apply(schemas:readonly SchemaDefinition[],rules:readonly ReusableSchemaRule[]):void { const p=this.#ports; p.library.replaceSchemas(schemas); p.rules.replaceRules(rules);
     p.storage.setItem(SCHEMA_LIBRARY_STORAGE_KEY,serializeSchemaLibrary(p.library.schemas)); p.rules.persist(); p.renderAll(); p.renderRules(); }
  restore(schemas:readonly SchemaDefinition[],rules:readonly ReusableSchemaRule[]):void { const p=this.#ports; p.library.replaceSchemas(schemas); p.rules.replaceRules(rules);
     p.rules.persist(); p.renderAll(); p.renderRules(); }
  begin(kind:"promotion"|"guided",schemaId:string,previousSchemas:readonly SchemaDefinition[],previousRules:readonly ReusableSchemaRule[],nextSchemas:readonly SchemaDefinition[],
    nextRules:readonly ReusableSchemaRule[]):Promise<void> {
    const generation=++this.#generation; let resolve!:()=>void,reject!:(error:unknown)=>void; const completion=new Promise<void>((done,failed) => { resolve=done; reject=failed; });
    const transaction:PendingPersistence={ schemaId,generation,kind,paused:false,settled:false,previousSchemas:structuredClone([...previousSchemas]),
      previousRules:structuredClone([...previousRules]),nextSchemas:structuredClone([...nextSchemas]),nextRules:structuredClone([...nextRules]),
      pause:() => { if (transaction.settled || transaction.paused) return; transaction.paused=true; this.restore(transaction.previousSchemas,transaction.previousRules); },
      complete:() => { if (transaction.settled || transaction.generation !== generation) return; transaction.settled=true;
         if (transaction.paused) this.apply(transaction.nextSchemas,transaction.nextRules); this.#clear(transaction); resolve(); },
      reject:(error) => { if (transaction.settled || transaction.generation !== generation) return; transaction.settled=true; this.restore(transaction.previousSchemas,
        transaction.previousRules); this.#clear(transaction); reject(error); } };
    if (kind === "promotion") this.#promotion=transaction; else this.#guided=transaction; return completion;
  }
  settle(event:SchemaPersistenceEvent):void|Promise<void> { const p=this.#ports, position=p.property.pendingCopyPosition;
    if (position && position.settlementSchemaId === event.schemaId && ["saved","retried",
      "rejected"].includes(event.type)) { const restore=():void => { p.root.querySelector<HTMLElement>(
        `#schema-property-tree button[aria-label="Copy ${position.path} to another schema"]`)?.focus({ preventScroll:true }); const editor=p.root.querySelector<HTMLElement>(
          "#schema-editor"),tree=p.root.querySelector<HTMLElement>("#schema-property-tree"); if (editor) editor.scrollTop=position.editorScroll; if (tree) tree.scrollTop=position.treeScroll;
           };
      queueMicrotask(restore); p.scheduleFrame(() => { restore(); p.scheduleFrame(() => { restore(); p.property.clearCopyPosition(position); }); }); }
    const canonical=p.canonical;
    if (event.type === "retried" && canonical.projectionPendingForSchema(event.schemaId)) return canonical.resumeCurrentProjectionPersistence()
      .then(() => { p.renderAll(); p.renderCanonical(); });
    if (event.type === "saved") { const acknowledged=[...canonical.settlementClaims].find(([,schemaId]) => schemaId === event.schemaId)?.[0];
       if (acknowledged !== undefined) p.clearCanonicalSettlement(event.schemaId,acknowledged); if (canonical.hasEditor()) p.renderCanonical(); }
    if (canonical.settlementSchemaId === event.schemaId && (event.type === "retried" || event.type === "rejected")) { p.clearCanonicalSettlement(event.schemaId);
       if (event.type === "rejected") canonical.rejectDurableChange(); if (canonical.hasEditor()) p.renderCanonical(); }
    const pending=[this.#promotion,this.#guided], transactional=pending.some((candidate) => candidate?.schemaId === event.schemaId && !candidate.settled);
    if (event.type === "failed" && !transactional && canonical.settlementSchemaId !== event.schemaId) { p.library.reload();
       if (p.library.activeSchemaId) { const stored=p.library.schemas.find(({ id }) => id === p.library.activeSchemaId); if (stored) { p.library.setDraft(p.editorDraft(stored));
       canonical.setSavedDocument(savedSchemaCanonicalDocument(p.library.draft!,(kind) => canonical.createCanonicalId(kind))); } } p.renderAll(); }
    for (const transaction of pending) { if (!transaction || transaction.schemaId !== event.schemaId || transaction.settled) continue;
       if (event.type === "failed") { if (transaction.kind === "guided") transaction.pause(); continue; } if (event.type === "rejected") transaction.reject(event.error);
       else transaction.complete(); }
  }
  dispose(error:unknown):void { this.#promotion?.reject(error); this.#guided?.reject(error); }
  #clear(transaction:PendingPersistence):void { if (this.#promotion === transaction) this.#promotion=undefined; if (this.#guided === transaction) this.#guided=undefined; }
}
