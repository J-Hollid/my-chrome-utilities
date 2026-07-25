import {createDurableProjectRuntime} from "./durable-project/runtime-core.js";
export {createDurableProjectRuntime} from "./durable-project/runtime-core.js";
import {createSpecificationProject,type ProjectState} from "./data-layer-specification-project.js";
import {PROJECT_LIBRARY_STORAGE_KEY,restoreProjectLibrary,serializeProjectLibrary,type ProjectLibrary,type ProjectLibraryRecord} from "./data-layer-project-library.js";
import {CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY,restoreCanonicalProjectEnvelope,restoreCanonicalProjectState,serializeCanonicalProjectState} from "./data-layer-specification-repository.js";
import {createPageProjectHistory,durableConflictSemanticField,durableDraftCommand,durablePatchField,durableProjectRouteForWorkspace,DurablePageHistoryConflict,LEGACY_PROJECT_KEYS,migrateLegacyProjectStorage,openIndexedDbProjectRepository,type DurableDraftCommand,type DurableDraftConflict,type DurableLoadedProject,type DurableProjectRepository,type DurableProjectRoute,type DurableSavedSchemaBatchResult} from "./data-layer-durable-project-repository.js";

export interface LegacyStorage{getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void;}
export interface DurableRuntimeFailedSave{projectId:string;projectName:string;state:ProjectState;command:DurableDraftCommand;error:unknown;conflict?:DurableDraftConflict;}
export interface DurableSchemaBatch{schemas:Record<string,unknown>[];upserts:{schema:Record<string,unknown>;baseToken?:string}[];deletes:{schemaId:string;baseToken:string}[];label:string;names:string[];}
export interface DurableRuntimeFailedSchemaSave{kind:"saved-schema";batch:DurableSchemaBatch;error:unknown;conflict?:Extract<DurableSavedSchemaBatchResult,{status:"conflict"}>;}
export interface DurableProjectProjection{library:ProjectLibrary;active?:DurableLoadedProject;}
export interface DurableProjectRuntime{
  repository:DurableProjectRepository;
  storage:LegacyStorage;
  ensureProject(projectId:string):Promise<void>;
  prepareProjectRoute(projectId:string,route:DurableProjectRoute):void;
  ensureProjectRoute(projectId:string,route:DurableProjectRoute):Promise<DurableLoadedProject>;
  refreshProject(projectId:string):Promise<void>;
  settled(scope?:"all"|"project"|"schema"):Promise<void>;
  subscribe(listener:(projection:DurableProjectProjection)=>void):()=>void;
  failedSave():DurableRuntimeFailedSave|undefined;
  failedSchemaSave():DurableRuntimeFailedSchemaSave|undefined;
  retryFailedSave():Promise<void>;
  retryFailedSchemaSave():Promise<void>;
  resolveFailedSave(strategy:"reject"|"reapply"|"merge",pendingFields?:readonly string[]):Promise<void>;
  exportUnsavedDraft():string;
  exportUnsavedSchemas():string;
  historyInspection(projectId:string):{undo:{commandId:string;label:string}[];redo:{commandId:string;label:string}[]};
  canUndo(projectId:string):boolean;
  canRedo(projectId:string):boolean;
  undo(projectId:string):Promise<void>;
  redo(projectId:string):Promise<void>;
  resolveMigration(choice:"library"|"active"):Promise<void>;
  migration:Awaited<ReturnType<typeof migrateLegacyProjectStorage>>;
}

export async function openDurableProjectRuntime(legacy:LegacyStorage,factory:IDBFactory=globalThis.indexedDB,startup:{projectId?:string;route?:DurableProjectRoute}={}):Promise<DurableProjectRuntime>{return createDurableProjectRuntime(await openIndexedDbProjectRepository(factory),legacy,startup);}
