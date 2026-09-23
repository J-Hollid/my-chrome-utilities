import {PROJECT_LIBRARY_STORAGE_KEY,restoreProjectLibrary,serializeProjectLibrary,
  type ProjectLibrary} from "../data-layer-project-library.js";
import {SCHEMA_LIBRARY_STORAGE_KEY} from "../data-layer-schema-verification.js";
import {EVENT_TEMPLATE_LIBRARY_STORAGE_KEY} from "../data-layer-event-library-editor.js";
import {SAVED_SESSION_LIBRARY_STORAGE_KEY} from "../data-layer-saved-session-live-feed.js";
import {DEFECT_LIBRARY_STORAGE_KEY} from "../data-layer-defect-library.js";
import {HOTKEY_KEYMAP_STORAGE_KEY} from "../hotkey-keymap.js";
import {SCHEMA_RULE_STORAGE_KEY} from "../data-layer-installed/schemas/rule-controller.js";
import {COMPLETE_CONFIGURATION_DOMAINS,type CompleteConfigurationSnapshot,
  type ConfigurationDomain,type ConfigurationRecord} from "./domain-inventory.js";
import type {CompleteConfigurationPort} from "./setup-controller.js";
import type {CompleteConfigurationRepository} from "./configuration-repository.js";
import {assertKnownConfigurationStorage} from "./storage-inventory.js";

interface StoragePort {getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void;}
interface InventoryStorage {readonly length:number;key(index:number):string|null;getItem(key:string):string|null;}
interface StorageSlot {domain:ConfigurationDomain;key:string;storage:StoragePort;}
export interface ConfigurationJournalPort {
  read():Promise<unknown|undefined>;
  write(value:unknown):Promise<void>;
  clear():Promise<void>;
  marker():Promise<string|undefined>;
}
const PORTABLE_PREFERENCE_KEYS=[
  "my-chrome-utilities.saved-event-feed-filters.v1",
  "my-chrome-utilities.manual-schema-overrides.v1",
] as const;
const CONFIGURATION_JOURNAL_KEY="my-chrome-utilities.complete-configuration-journal.v1";
const clone=<T>(value:T):T=>structuredClone(value);
const parsed=(serialized:string|null):unknown=>{if(serialized===null)return undefined;
  try{return JSON.parse(serialized);}catch{return serialized;}};
const records=(domain:ConfigurationDomain,key:string,value:unknown):ConfigurationRecord[]=>{
  if(value===undefined)return[];
  if(domain==="projects"){
    const library=restoreProjectLibrary(typeof value==="string"?value:JSON.stringify(value));
    return library?Object.entries(library.projects).map(([id,entry])=>({id,value:entry})):[];
  }
  if(domain==="savedSessions"&&value&&typeof value==="object"&&!Array.isArray(value)){
    const sessions=(value as {sessions?:unknown}).sessions;
    if(!Array.isArray(sessions))throw new DOMException("The saved session library is invalid.","DataError");
    return sessions.map((session)=>{
      const id=(session as {id?:unknown})?.id;
      if(typeof id!=="string"||!id)throw new DOMException("A saved session has no identity.","DataError");
      return{id,value:session};
    });
  }
  if(domain==="defects"&&value&&typeof value==="object"&&!Array.isArray(value)){
    const defects=(value as {defects?:unknown}).defects;
    if(!Array.isArray(defects))throw new DOMException("The defect library is invalid.","DataError");
    return defects.map((defect)=>{
      const id=(defect as {id?:unknown})?.id;
      if(typeof id!=="string"||!id)throw new DOMException("A saved defect has no identity.","DataError");
      return{id,value:defect};
    });
  }
  if(Array.isArray(value))return value.map((entry,index)=>({
    id:String((entry as {id?:unknown})?.id??index),value:entry,
  }));
  return[{id:key,value}];
};

function storageValue(domain:ConfigurationDomain,key:string,items:ConfigurationRecord[],activeProjectId:string|null):string|null{
  if(!items.length)return null;
  if(domain==="projects"){
    const library:ProjectLibrary={format:"my-chrome-utilities.project-library",version:1,
      singletonMigrated:true,...(activeProjectId?{activeProjectId}:{}),
      projects:Object.fromEntries(items.map(({id,value})=>[id,clone(value)])) as ProjectLibrary["projects"]};
    return serializeProjectLibrary(library);
  }
  if(domain==="savedSessions")return JSON.stringify({sessions:items.map(({value})=>value)});
  if(domain==="defects")return JSON.stringify({defects:items.map(({value})=>value)});
  if(items.length===1&&items[0]!.id===key)return JSON.stringify(items[0]!.value);
  return JSON.stringify(items.map(({value})=>value));
}

export function createInstalledCompleteConfigurationPort(input:{
  projectStorage:StoragePort;dataLayerStorage:StoragePort;hotkeyStorage:StoragePort;
  buildIdentity:string;settle?:()=>Promise<void>;failedCommand?:()=>string|undefined;
  durableRepository?:CompleteConfigurationRepository;
  journal?:ConfigurationJournalPort;
  legacyJournalStorage?:StoragePort;
  inventoryStorage?:InventoryStorage;
}):CompleteConfigurationPort&{recover():Promise<void>}{
  const slots:StorageSlot[]=[
    {domain:"projects",key:PROJECT_LIBRARY_STORAGE_KEY,storage:input.projectStorage},
    {domain:"savedSchemas",key:SCHEMA_LIBRARY_STORAGE_KEY,storage:input.dataLayerStorage},
    {domain:"reusableRules",key:SCHEMA_RULE_STORAGE_KEY,storage:input.dataLayerStorage},
    {domain:"eventLibraries",key:EVENT_TEMPLATE_LIBRARY_STORAGE_KEY,storage:input.dataLayerStorage},
    {domain:"savedSessions",key:SAVED_SESSION_LIBRARY_STORAGE_KEY,storage:input.dataLayerStorage},
    {domain:"defects",key:DEFECT_LIBRARY_STORAGE_KEY,storage:input.dataLayerStorage},
    {domain:"hotkeys",key:HOTKEY_KEYMAP_STORAGE_KEY,storage:input.hotkeyStorage},
  ];
  const portableSlots=slots.filter(({domain})=>!(input.durableRepository&&
    (domain==="projects"||domain==="savedSchemas")));
  const legacyJournalStorage=input.legacyJournalStorage??input.projectStorage;
  type StoredValue={key:string;value:string|null;storage:"project"|"data"|"hotkey"};
  type StoredJournal={id:string;prior:StoredValue[];next:StoredValue[];
    projects:ConfigurationRecord[];activeProjectId:string|null};
  const storageFor=(name:StoredValue["storage"])=>name==="project"?input.projectStorage:name==="data"?input.dataLayerStorage:input.hotkeyStorage;
  const apply=(values:StoredValue[])=>{for(const item of values){const storage=storageFor(item.storage);
    if(item.value===null)storage.removeItem(item.key);else storage.setItem(item.key,item.value);}};
  const restore=(values:StoredValue[])=>{for(const {key,storage} of values)storageFor(storage).removeItem(key);
    apply(values);};
  const prepared=(snapshot:CompleteConfigurationSnapshot):StoredValue[]=>[
    ...portableSlots.map(({domain,key,storage})=>({
      key,value:storageValue(domain,key,snapshot.sections[domain],snapshot.activeProjectId),
      storage:storage===input.projectStorage?"project" as const:storage===input.hotkeyStorage?"hotkey" as const:"data" as const,
    })),
    ...PORTABLE_PREFERENCE_KEYS.map((key)=>({key,value:new Map(snapshot.sections.portablePreferences.map(({id,value})=>[id,value])).has(key)
      ?JSON.stringify(new Map(snapshot.sections.portablePreferences.map(({id,value})=>[id,value])).get(key)):null,storage:"data" as const})),
  ];
  const withLock=async<T>(work:()=>Promise<T>):Promise<T>=>{
    const locks=globalThis.navigator?.locks;
    return locks?locks.request("my-chrome-utilities.configuration-setup",work):work();
  };
  const recoverUnlocked=async()=>{
    const durableJournal=await input.journal?.read(),raw=legacyJournalStorage.getItem(CONFIGURATION_JOURNAL_KEY);
    if(!durableJournal&&!raw)return;
    const journal=(durableJournal??JSON.parse(raw!)) as StoredJournal;
    if(!journal||!Array.isArray(journal.prior)||!Array.isArray(journal.next))throw new DOMException(
      "The pending configuration setup journal is invalid.","DataError");
    const committed=durableJournal?await input.journal!.marker()===journal.id:
      await input.durableRepository?.read().then((durable)=>JSON.stringify(durable.sections.projects)===
        JSON.stringify(journal.projects)&&durable.activeProjectId===journal.activeProjectId);
    restore(committed?journal.next:journal.prior);
    if(durableJournal)await input.journal!.clear();
    if(raw)legacyJournalStorage.removeItem(CONFIGURATION_JOURNAL_KEY);
  };
  const readUnlocked=async(options:{signal?:AbortSignal;
    onProgress?:(completed:number,total:number)=>void}={})=>{
      await recoverUnlocked();
      await input.settle?.();
      options.signal?.throwIfAborted();
      const failed=input.failedCommand?.();if(failed)throw new DOMException(
        `Complete export is blocked by unsaved command ${failed}. Retry or discard it first.`,"InvalidStateError");
      assertKnownConfigurationStorage(input.inventoryStorage,[...slots.map(({key})=>key),...PORTABLE_PREFERENCE_KEYS]);
      const capture=()=>({slots:slots.map(({key,storage})=>storage.getItem(key)),
        preferences:PORTABLE_PREFERENCE_KEYS.map((key)=>input.dataLayerStorage.getItem(key))});
      const before=capture();
      const sections=Object.fromEntries(COMPLETE_CONFIGURATION_DOMAINS.map((domain)=>[domain,[]])) as
        unknown as CompleteConfigurationSnapshot["sections"];
      for(const [index,slot] of slots.entries())sections[slot.domain].push(...records(slot.domain,slot.key,parsed(before.slots[index]??null)));
      const library=restoreProjectLibrary(before.slots[0]??null);
      for(const [projectId,entry] of Object.entries(library?.projects??{})){
        for(const template of entry.state.project.documentation?.templates??[]){
          sections.documentationTemplates.push({id:`${projectId}/${template.id}`,value:clone(template),
            dependencies:[{domain:"projects",id:projectId}]});
        }
      }
      for(const [index,key] of PORTABLE_PREFERENCE_KEYS.entries()){const value=parsed(before.preferences[index]??null);
        if(value!==undefined)sections.portablePreferences.push({id:key,value});}
      const durable=await input.durableRepository?.read(options);
      options.signal?.throwIfAborted();
      if(JSON.stringify(before)!==JSON.stringify(capture()))throw new DOMException(
        "Saved configuration changed during export. Retry the export.","InvalidStateError");
      if(durable){sections.projects=clone(durable.sections.projects);
        if(durable.sections.savedSchemas.length)sections.savedSchemas=clone(durable.sections.savedSchemas);
        sections.documentationTemplates=clone(durable.sections.documentationTemplates);}
      return{activeProjectId:durable?.activeProjectId??library?.activeProjectId??null,sections,
        bodies:durable?.bodies??[]};
  };
  return{buildIdentity:input.buildIdentity,recover:()=>withLock(recoverUnlocked),
    read:(options={})=>withLock(()=>readUnlocked(options)),
    commit:(snapshot,options={})=>withLock(async()=>{
      await recoverUnlocked();
      if(options.expectedTarget){const current=await readUnlocked({...(options.signal?{signal:options.signal}:{})});
        const changed=COMPLETE_CONFIGURATION_DOMAINS.filter((domain)=>JSON.stringify(current.sections[domain])!==
          JSON.stringify(options.expectedTarget!.sections[domain]));
        if(current.activeProjectId!==options.expectedTarget.activeProjectId)changed.unshift("projects");
        if(changed.length)throw new DOMException(
          `Saved ${[...new Set(changed)].join(", ")} changed after review. Inspect the file again before setup.`,
          "InvalidStateError");
      }
      const prior:StoredValue[]=[...portableSlots.map(({key,storage})=>({key,value:storage.getItem(key),
        storage:storage===input.projectStorage?"project" as const:storage===input.hotkeyStorage?"hotkey" as const:"data" as const})),
        ...PORTABLE_PREFERENCE_KEYS.map((key)=>({key,value:input.dataLayerStorage.getItem(key),storage:"data" as const}))],next=prepared(snapshot);
      const priorDurable=await input.durableRepository?.read(),priorMarker=await input.journal?.marker();
      let durableCommitted=false;
      try{
        const journal:StoredJournal={id:crypto.randomUUID(),prior,next,projects:snapshot.sections.projects,
          activeProjectId:snapshot.activeProjectId};
        if(input.journal)await input.journal.write(journal);
        else legacyJournalStorage.setItem(CONFIGURATION_JOURNAL_KEY,JSON.stringify(journal));
        options.signal?.throwIfAborted();
        await input.durableRepository?.commit(snapshot,{...options,...(input.journal?{commitMarker:journal.id}:{})});
        durableCommitted=Boolean(input.durableRepository);
        options.signal?.throwIfAborted();
        apply(next);
        if(input.journal)await input.journal.clear();
        else legacyJournalStorage.removeItem(CONFIGURATION_JOURNAL_KEY);
        await input.settle?.();
      }catch(error){
        try{
          restore(prior);
          if(durableCommitted&&priorDurable)await input.durableRepository?.commit(priorDurable,
            {...(input.journal?{commitMarker:priorMarker??null}:{})});
          if(input.journal)await input.journal.clear();
          else legacyJournalStorage.removeItem(CONFIGURATION_JOURNAL_KEY);
          await input.settle?.();
        }catch(recoveryError){throw new DOMException(
          `Setup recovery could not finish. Restart the extension to complete recovery. ${String(recoveryError)}`,
          "InvalidStateError");}
        throw error;
      }
    })};
}
