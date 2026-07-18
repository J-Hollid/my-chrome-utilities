import {createCanonicalProjectEnvelope,type CanonicalProjectEnvelope} from "./data-layer-specification-model.js";
import type {ProjectState} from "./data-layer-specification-project.js";

export const CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY="my-chrome-utilities.specification-project.v1";
export interface CanonicalProjectCommandRecord{label:string;baseRevision:number;committedRevision:number;fields:string[]}
export interface PersistedCanonicalProject extends CanonicalProjectEnvelope{draft:ProjectState["draft"];history:ProjectState["history"];commands:CanonicalProjectCommandRecord[]}
export interface ProjectStorage{getItem(key:string):string|null;setItem(key:string,value:string):void}

const clone=<T>(value:T):T=>structuredClone(value);
function entityRevisions(state:ProjectState,previous?:PersistedCanonicalProject):Record<string,number>{
  const priorRevisions=previous?.entityRevisions??{},priorEntities=new Map(((Object.values(previous?.project.collections??{}) as {id:string}[][]).flat()).map((entity)=>[entity.id,entity]));
  return Object.fromEntries((Object.values(state.project.collections) as {id:string}[][]).flat().map((entity)=>{
    const prior=priorEntities.get(entity.id),revision=priorRevisions[entity.id]??0;
    return[entity.id,!prior||JSON.stringify(prior)!==JSON.stringify(entity)?revision+1:Math.max(1,revision)];
  }));
}
function envelopeFor(state:ProjectState,revision:number,previous?:PersistedCanonicalProject,command?:CanonicalProjectCommandRecord):PersistedCanonicalProject{const base=createCanonicalProjectEnvelope(state.project,state.draft?.id??`release:${state.project.currentRelease??"unpublished"}`);return{...base,revision,entityRevisions:entityRevisions(state,previous),draft:clone(state.draft),history:clone(state.history),commands:[...(previous?.commands??[]),...(command?[clone(command)]:[])]};}
export function restoreCanonicalProjectEnvelope(serialized:string|null):PersistedCanonicalProject|undefined{if(!serialized)return undefined;const parsed=JSON.parse(serialized) as PersistedCanonicalProject|ProjectState;if("format"in parsed&&parsed.format==="my-chrome-utilities.canonical-specification-project")return clone(parsed);if("project"in parsed)return envelopeFor(parsed as ProjectState,0);throw new Error("Unsupported Specification Project storage format.");}
export function restoreCanonicalProjectState(serialized:string|null):ProjectState|undefined{const envelope=restoreCanonicalProjectEnvelope(serialized);return envelope?{project:clone(envelope.project),...(envelope.draft?{draft:clone(envelope.draft)}:{}),history:clone(envelope.history??{undo:[],redo:[]})}:undefined;}
export interface CanonicalProjectStorageEvent{key:string|null;newValue:string|null}
export interface CanonicalProjectChangeTarget{addEventListener(type:"storage",listener:(event:CanonicalProjectStorageEvent)=>void):void;removeEventListener(type:"storage",listener:(event:CanonicalProjectStorageEvent)=>void):void}
export function subscribeCanonicalProjectChanges(target:CanonicalProjectChangeTarget,notify:(change:{revision:number;state:ProjectState})=>void):()=>void{
  const listener=(event:CanonicalProjectStorageEvent):void=>{
    if(event.key!==CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY||!event.newValue)return;
    const envelope=restoreCanonicalProjectEnvelope(event.newValue),state=restoreCanonicalProjectState(event.newValue);
    if(envelope&&state)notify({revision:envelope.revision,state});
  };
  target.addEventListener("storage",listener);
  return()=>target.removeEventListener("storage",listener);
}
export type CanonicalProjectConflict={status:"conflict";key:string;revision:number;base:ProjectState;current:ProjectState;pending:ProjectState;pendingLabel:string};
export type CanonicalCommitResult={status:"committed";key:string;revision:number;envelope:PersistedCanonicalProject}|CanonicalProjectConflict;

const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
const entityArray=(value:unknown):value is {id:string}[]=>Array.isArray(value)&&value.every((item)=>record(item)&&typeof item.id==="string");
function changedFields(base:unknown,next:unknown,path:string):string[]{
  if(same(base,next))return[];
  if(entityArray(base)&&entityArray(next)){const before=new Map(base.map((item)=>[item.id,item])),after=new Map(next.map((item)=>[item.id,item]));return[...new Set([...before.keys(),...after.keys()])].flatMap((id)=>changedFields(before.get(id),after.get(id),`${path}[${id}]`));}
  if(record(base)&&record(next)){const keys=new Set([...Object.keys(base),...Object.keys(next)]);return[...keys].flatMap((key)=>changedFields(base[key],next[key],`${path}.${key}`));}
  return[path];
}
function mergeValue(base:unknown,current:unknown,pending:unknown,path:string,pendingField:(path:string)=>boolean):unknown{
  if(same(pending,base))return clone(current);
  if(same(current,base))return clone(pending);
  if(same(current,pending))return clone(current);
  if(entityArray(base)&&entityArray(current)&&entityArray(pending)){const before=new Map(base.map((item)=>[item.id,item])),latest=new Map(current.map((item)=>[item.id,item])),next=new Map(pending.map((item)=>[item.id,item])),ids=[...current.map(({id})=>id),...pending.map(({id})=>id).filter((id)=>!latest.has(id))];return ids.map((id)=>mergeValue(before.get(id),latest.get(id),next.get(id),`${path}[${id}]`,pendingField)).filter((value)=>value!==undefined);}
  if(record(base)&&record(current)&&record(pending)){const keys=new Set([...Object.keys(base),...Object.keys(current),...Object.keys(pending)]);return Object.fromEntries([...keys].map((key)=>[key,mergeValue(base[key],current[key],pending[key],`${path}.${key}`,pendingField)]).filter(([,value])=>value!==undefined));}
  return clone(pendingField(path)?pending:current);
}
export function inspectCanonicalProjectConflict(conflict:CanonicalProjectConflict):{pendingFields:string[];currentFields:string[];conflictingFields:string[]}{const pendingFields=changedFields(conflict.base.project,conflict.pending.project,"project"),currentFields=changedFields(conflict.base.project,conflict.current.project,"project"),current=new Set(currentFields);return{pendingFields,currentFields,conflictingFields:pendingFields.filter((field)=>current.has(field))};}
export function resolveCanonicalProjectConflict(conflict:CanonicalProjectConflict,choice:{strategy:"reload"|"reapply"|"merge";pendingFields?:readonly string[]}):ProjectState{
  if(choice.strategy==="reload")return clone(conflict.current);
  const selected=new Set(choice.pendingFields??[]),pendingField=(path:string)=>choice.strategy==="reapply"||selected.has(path);
  const draft=conflict.current.draft?{...conflict.current.draft,status:"Saved" as const,updatedAt:new Date().toISOString()}:conflict.pending.draft;
  return{...clone(conflict.current),project:mergeValue(conflict.base.project,conflict.current.project,conflict.pending.project,"project",pendingField) as ProjectState["project"],...(draft?{draft}:{}),history:clone(conflict.pending.history)};
}
export function commitCanonicalProjectState(storage:ProjectStorage,next:ProjectState,options?:{expectedRevision?:number;pendingLabel?:string;base?:ProjectState}):CanonicalCommitResult{
  const key=CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY,previous=restoreCanonicalProjectEnvelope(storage.getItem(key)),revision=previous?.revision??0,baseRevision=options?.expectedRevision??revision,label=options?.pendingLabel??"Project edit";
  let committed=next;
  if(options?.expectedRevision!==undefined&&options.expectedRevision!==revision){
    const current=restoreCanonicalProjectState(storage.getItem(key));
    if(!current)throw new Error("The canonical project disappeared while resolving a stale command.");
    const conflict:CanonicalProjectConflict={status:"conflict",key,revision,base:clone(options.base??next),current,pending:clone(next),pendingLabel:label};
    if(!options.base||inspectCanonicalProjectConflict(conflict).conflictingFields.length)return conflict;
    committed=resolveCanonicalProjectConflict(conflict,{strategy:"reapply"});
  }
  const fields=options?.base?changedFields(options.base.project,next.project,"project"):changedFields(previous?.project,committed.project,"project"),committedRevision=revision+1;
  const envelope=envelopeFor(committed,committedRevision,previous,{label,baseRevision,committedRevision,fields});
  storage.setItem(key,JSON.stringify(envelope));
  return{status:"committed",key,revision:envelope.revision,envelope};
}
