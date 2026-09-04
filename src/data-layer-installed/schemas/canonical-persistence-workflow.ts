import { persistLocalRulePromotion } from "../../data-layer-local-rule-promotion.js";
import { SCHEMA_LIBRARY_STORAGE_KEY, serializeSchemaLibrary, type CanonicalSchemaDocument, type SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { CompactCanonicalEditorAdapter, ReusableSchemaRule, SchemaPersistenceEvent } from "./contracts.js";
import type { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import type { SchemaCanonicalInstalledView } from "./canonical-installed-view.js";
import type { SchemaLibraryController } from "./library-controller.js";
import { SchemaPersistenceController } from "./persistence-controller.js";
import type { SchemaPropertyController } from "./property-controller.js";
import { SCHEMA_RULE_STORAGE_KEY, type SchemaRuleController } from "./rule-controller.js";

interface CanonicalPersistenceWorkflowPorts {
  root:ParentNode;
  storage:Pick<Storage,"getItem"|"setItem"|"removeItem">;
  library:SchemaLibraryController;
  rules:SchemaRuleController;
  property:SchemaPropertyController;
  canonical:SchemaCanonicalEditorController;
  view:SchemaCanonicalInstalledView;
  editor:HTMLElement|null;
  save:HTMLButtonElement|null;
  scheduleFrame(callback:()=>void):void;
  renderAll():void;
  editorDraft(schema:SchemaDefinition):SchemaDefinition;
}

/** Coordinates canonical editor delegation with durable settlement transactions. */
export class SchemaCanonicalPersistenceWorkflow {
  readonly #ports:CanonicalPersistenceWorkflowPorts;
  readonly #persistence:SchemaPersistenceController;
  constructor(ports:CanonicalPersistenceWorkflowPorts) {
    this.#ports=ports;
    this.#persistence=new SchemaPersistenceController({ root:ports.root,storage:ports.storage,library:ports.library,rules:ports.rules,
      property:ports.property,canonical:ports.canonical,scheduleFrame:ports.scheduleFrame,renderAll:ports.renderAll,
      renderRules:() => ports.rules.render(),renderCanonical:() => this.render(),clearCanonicalSettlement:(schemaId,settlement) => { this.clearSettlement(schemaId,settlement); },editorDraft:ports.editorDraft });
  }
  projection(adapter:CompactCanonicalEditorAdapter,canonical=adapter.load()):SchemaDefinition { return this.#ports.view.projection(adapter,canonical); }
  facet(canonical:CanonicalSchemaDocument,node:CanonicalSchemaDocument["nodes"][string]):string { return this.#ports.view.facet(canonical,node); }
  renderContext():void { this.#ports.view.renderContext(); }
  render():void { this.#ports.view.render(); }
  open(adapter:CompactCanonicalEditorAdapter):void { this.#ports.view.open(adapter); }
  close(clearSchemaSelection=true):void { this.#ports.view.close(clearSchemaSelection); }
  openSaved(schema:SchemaDefinition):void { this.#ports.view.openSaved(schema); }
  beginSettlement(schemaId?:string):number { const settlement=this.#ports.canonical.beginSettlement(schemaId);this.#ports.editor?.setAttribute("aria-busy","true");if(this.#ports.save)this.#ports.save.disabled=true;return settlement; }
  clearSettlement(schemaId?:string,settlement?:number):boolean { return this.#ports.canonical.clearSettlement(schemaId,settlement); }
  queueLibraryPersistence(schemaId:string):void { this.#ports.canonical.queueLibraryPersistence(schemaId,this.#ports.library.schemas,() => this.#ports.library.persist()); }
  apply(schemas:readonly SchemaDefinition[],rules:readonly ReusableSchemaRule[]):void { this.#persistence.apply(schemas,rules); }
  begin(kind:"guided"|"promotion",schemaId:string,previousSchemas:readonly SchemaDefinition[],previousRules:readonly ReusableSchemaRule[],nextSchemas:readonly SchemaDefinition[],nextRules:readonly ReusableSchemaRule[]):Promise<void> {
    return this.#persistence.begin(kind,schemaId,previousSchemas,previousRules,nextSchemas,nextRules);
  }
  promote(schemaId:string,previousSchemas:readonly SchemaDefinition[],previousRules:readonly ReusableSchemaRule[],nextSchemas:readonly SchemaDefinition[],nextRules:readonly ReusableSchemaRule[]):Promise<void> {
    const completion=this.begin("promotion",schemaId,previousSchemas,previousRules,nextSchemas,nextRules);
    persistLocalRulePromotion(this.#ports.storage,{ schemaKey:SCHEMA_LIBRARY_STORAGE_KEY,schemaValue:serializeSchemaLibrary(nextSchemas),ruleKey:SCHEMA_RULE_STORAGE_KEY,ruleValue:JSON.stringify(nextRules) });
    this.#ports.library.replaceSchemas(nextSchemas);this.#ports.rules.replaceRules(nextRules);this.#ports.renderAll();this.#ports.rules.render();return completion;
  }
  settle(event:SchemaPersistenceEvent):void|Promise<void> { return this.#persistence.settle(event); }
  dispose(error:unknown):void { this.#persistence.dispose(error); }
}
