import type {
  CanonicalSchemaDocument,
  SchemaDefinition,
} from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule } from "./contracts.js";

export interface SchemaPersistenceLibraryPort {
  readonly schemas:readonly SchemaDefinition[];
  readonly activeSchemaId:string|undefined;
  readonly draft:SchemaDefinition|undefined;
  replaceSchemas(schemas:readonly SchemaDefinition[]):void;
  reload():void;
  setDraft(schema:SchemaDefinition):void;
}

export interface SchemaPersistenceRulePort {
  replaceRules(rules:readonly ReusableSchemaRule[]):void;
  persist():void;
}

export interface SchemaPersistencePropertyPort {
  readonly pendingCopyPosition:Readonly<{
    schemaId:string;
    settlementSchemaId:string;
    path:string;
    editorScroll:number;
    treeScroll:number;
  }>|undefined;
  clearCopyPosition(position:Readonly<{
    schemaId:string;
    settlementSchemaId:string;
    path:string;
    editorScroll:number;
    treeScroll:number;
  }>):void;
}

export interface SchemaPersistenceCanonicalPort {
  readonly settlementClaims:ReadonlyMap<number,string|undefined>;
  readonly settlementSchemaId:string|undefined;
  projectionPendingForSchema(schemaId:string):boolean;
  resumeCurrentProjectionPersistence():Promise<boolean>;
  hasEditor():boolean;
  rejectDurableChange():void;
  setSavedDocument(document:CanonicalSchemaDocument|undefined):void;
  createCanonicalId(kind:string):string;
}

export interface SchemaPersistencePorts {
  root:ParentNode;
  storage:Pick<Storage,"setItem">;
  library:SchemaPersistenceLibraryPort;
  rules:SchemaPersistenceRulePort;
  property:SchemaPersistencePropertyPort;
  canonical:SchemaPersistenceCanonicalPort;
  scheduleFrame(callback:()=>void):void;
  renderAll():void;
  renderRules():void;
  renderCanonical():void;
  clearCanonicalSettlement(schemaId?:string,settlement?:number):void;
  editorDraft(schema:SchemaDefinition):SchemaDefinition;
}
