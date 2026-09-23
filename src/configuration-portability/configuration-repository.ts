import type {
  CompleteConfigurationSnapshot,ConfigurationDomain,ConfigurationRecord,
} from "./domain-inventory.js";
import type {InspectedCompleteConfiguration} from "./archive-format.js";

export type ConfigurationConflictPolicy="cancel"|"non-conflicting"|"replace-all";
export interface ConfigurationConflict extends ConfigurationRecord {
  domain:ConfigurationDomain;recipientId:string;reason:"identity"|"name";
}
export interface CompleteConfigurationRepository {
  read(options?:{signal?:AbortSignal;onProgress?:(completed:number,total:number)=>void}):Promise<CompleteConfigurationSnapshot>;
  commit(snapshot:CompleteConfigurationSnapshot,options?:{
    signal?:AbortSignal;onProgress?:(completed:number,total:number)=>void;commitMarker?:string|null;
    expectedTarget?:CompleteConfigurationSnapshot;
  }):Promise<void>;
}

const same=(left:unknown,right:unknown)=>JSON.stringify(left)===JSON.stringify(right);
const sameRecord=(left:ConfigurationRecord,right:ConfigurationRecord)=>
  same(left.value,right.value)&&same(left.dependencies??[],right.dependencies??[]);
const clone=<T>(value:T):T=>structuredClone(value);
const key=(domain:ConfigurationDomain,id:string)=>`${domain}/${id}`;
const sameBody=(left:CompleteConfigurationSnapshot["bodies"][number],
  right:CompleteConfigurationSnapshot["bodies"][number])=>left.mediaType===right.mediaType&&
  left.bytes.byteLength===right.bytes.byteLength&&left.bytes.every((byte,index)=>byte===right.bytes[index]);
const bodyReferences=(value:unknown):Set<string>=>{
  const digests=new Set<string>();
  const visit=(item:unknown):void=>{if(Array.isArray(item)){item.forEach(visit);return;}
    if(!item||typeof item!=="object")return;
    for(const [name,nested] of Object.entries(item)){
      if(typeof nested==="string"&&/(?:bodyDigest|assetDigest|archiveDigest)$/u.test(name))digests.add(nested);
      else visit(nested);
    }
  };visit(value);return digests;
};
const assertBodyIdentities=(source:CompleteConfigurationSnapshot,target:CompleteConfigurationSnapshot,
  protectedRecords:ConfigurationRecord[])=>{
  const local=new Map(target.bodies.map((body)=>[body.digest,body]));
  for(const body of source.bodies){const prior=local.get(body.digest);
    if(prior&&!sameBody(prior,body)&&protectedRecords.some((record)=>bodyReferences(record.value).has(body.digest))){
      throw new DOMException(
      `Configuration body ${body.digest} has different content in the recipient.`,"DataError");
    }
  }
};
const recordName=(record:ConfigurationRecord):string|undefined=>{
  const value=record.value;
  return value&&typeof value==="object"&&!Array.isArray(value)&&typeof (value as {name?:unknown}).name==="string"
    ?(value as {name:string}).name.trim().toLocaleLowerCase():undefined;
};

function conflictInventory(source:CompleteConfigurationSnapshot,target:CompleteConfigurationSnapshot){
  const conflicts:ConfigurationConflict[]=[];
  for(const [domain,records] of Object.entries(source.sections) as [ConfigurationDomain,ConfigurationRecord[]][]){
    const local=new Map(target.sections[domain].map((record)=>[record.id,record]));
    for(const record of records){
      const current=local.get(record.id);
      if(current){if(!sameRecord(current,record))conflicts.push({...clone(record),domain,
        recipientId:current.id,reason:"identity"});continue;}
      if(!["projects","savedSchemas","eventLibraries","documentationTemplates"].includes(domain))continue;
      const name=recordName(record);
      const named=name&&target.sections[domain].find((candidate)=>recordName(candidate)===name);
      if(named)conflicts.push({...clone(record),domain,recipientId:named.id,reason:"name"});
    }
  }
  return conflicts;
}

function skippedIncoming(source:CompleteConfigurationSnapshot,conflicts:ConfigurationConflict[]):Set<string>{
  const skipped=new Set(conflicts.map(({domain,id})=>key(domain,id)));
  let changed=true;
  while(changed){changed=false;for(const [domain,records] of Object.entries(source.sections) as [ConfigurationDomain,ConfigurationRecord[]][]){
    for(const record of records){const own=key(domain,record.id);if(skipped.has(own))continue;
      if((record.dependencies??[]).some((dependency)=>skipped.has(key(dependency.domain,dependency.id)))){
        skipped.add(own);changed=true;
      }
    }
  }}
  return skipped;
}

function mergeNonConflicting(source:CompleteConfigurationSnapshot,target:CompleteConfigurationSnapshot,
  conflicts:ConfigurationConflict[]):CompleteConfigurationSnapshot{
  const skipped=skippedIncoming(source,conflicts),next=clone(target);
  assertBodyIdentities(source,target,Object.entries(source.sections).flatMap(([domain,records])=>
    records.filter((record)=>!skipped.has(key(domain as ConfigurationDomain,record.id)))));
  for(const [domain,records] of Object.entries(source.sections) as [ConfigurationDomain,ConfigurationRecord[]][]){
    const local=new Map(next.sections[domain].map((record)=>[record.id,record]));
    for(const record of records)if(!skipped.has(key(domain,record.id))&&!local.has(record.id)){
      next.sections[domain].push(clone(record));
    }
  }
  const digests=new Set(next.bodies.map(({digest})=>digest));
  for(const body of source.bodies)if(!digests.has(body.digest)){next.bodies.push(clone(body));digests.add(body.digest);}
  if(!next.activeProjectId&&source.activeProjectId&&next.sections.projects.some(({id})=>id===source.activeProjectId)){
    next.activeProjectId=source.activeProjectId;
  }
  return next;
}

function replaceAll(source:CompleteConfigurationSnapshot,target:CompleteConfigurationSnapshot,
  conflicts:ConfigurationConflict[]):CompleteConfigurationSnapshot{
  const replaced=new Set(conflicts.map(({domain,recipientId})=>key(domain,recipientId)));
  const incoming=new Set(Object.entries(source.sections).flatMap(([domain,records])=>
    records.map(({id})=>key(domain as ConfigurationDomain,id))));
  assertBodyIdentities(source,target,Object.entries(target.sections).flatMap(([domain,records])=>
    records.filter((record)=>!replaced.has(key(domain as ConfigurationDomain,record.id))&&
      !incoming.has(key(domain as ConfigurationDomain,record.id)))));
  for(const [domain,records] of Object.entries(target.sections) as [ConfigurationDomain,ConfigurationRecord[]][]){
    for(const record of records){
      if(replaced.has(key(domain,record.id)))continue;
      const dependency=(record.dependencies??[]).find((item)=>replaced.has(key(item.domain,item.id)));
      if(dependency)throw new DOMException(
        `Replace all conflicts would rebind retained recipient content to ${dependency.id}.`,"InvalidStateError");
    }
  }
  const next=clone(target);
  for(const [domain,records] of Object.entries(source.sections) as [ConfigurationDomain,ConfigurationRecord[]][]){
    const incoming=new Map(records.map((record)=>[record.id,record]));
    next.sections[domain]=next.sections[domain].filter(({id})=>!incoming.has(id)&&!replaced.has(key(domain,id)));
    next.sections[domain].push(...clone(records));
  }
  const incomingBodies=new Map(source.bodies.map((body)=>[body.digest,body]));
  next.bodies=next.bodies.filter(({digest})=>!incomingBodies.has(digest));
  next.bodies.push(...clone(source.bodies));
  const recipientActiveIsValid=Boolean(target.activeProjectId&&next.sections.projects.some(({id})=>id===target.activeProjectId));
  if(!recipientActiveIsValid&&source.activeProjectId&&next.sections.projects.some(({id})=>id===source.activeProjectId)){
    next.activeProjectId=source.activeProjectId;
  }
  return next;
}

export async function stageCompleteConfigurationSetup(
  inspected:Pick<InspectedCompleteConfiguration,"snapshot">,repository:CompleteConfigurationRepository,
){
  const target=await repository.read(),source=clone(inspected.snapshot);
  const conflicts=conflictInventory(source,target);let finished=false;
  return{
    conflicts:clone(conflicts),
    skippedRecords:[...skippedIncoming(source,conflicts)],
    async commit(policy:ConfigurationConflictPolicy,options:{signal?:AbortSignal;onProgress?:(completed:number,total:number)=>void}={}){
      if(finished)throw new Error("Configuration setup already finished.");
      if(!["cancel","non-conflicting","replace-all"].includes(policy))throw new DOMException(
        "Choose a supported configuration conflict action.","DataError");
      if(policy==="cancel"){finished=true;return "cancelled" as const;}
      const next=policy==="non-conflicting"?mergeNonConflicting(source,target,conflicts)
        :replaceAll(source,target,conflicts);
      if(same(next,target)){finished=true;return "no-change" as const;}
      options.signal?.throwIfAborted();await repository.commit(next,{...options,expectedTarget:target});
      finished=true;return "committed" as const;
    },
  };
}
