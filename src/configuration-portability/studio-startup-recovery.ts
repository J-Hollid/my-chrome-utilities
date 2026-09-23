import type {DurableProjectRuntime} from "../data-layer-durable-project-runtime.js";
import {SCHEMA_LIBRARY_STORAGE_KEY} from "../data-layer-schema-verification.js";
import {createUtilityStorage} from "../platform/utility-storage.js";
import {utilityRegistry} from "../utility-registry.js";
import {createDurableProjectConfigurationRepository} from "./durable-project-adapter.js";
import {createInstalledCompleteConfigurationPort} from "./installed-repository.js";

export async function recoverStudioConfiguration(runtime:DurableProjectRuntime,storage:Storage):Promise<boolean>{
  const pending=Boolean(await runtime.repository.readConfigurationJournal()||
    storage.getItem("my-chrome-utilities.complete-configuration-journal.v1"));
  const contract=(id:string)=>{
    const found=utilityRegistry.find((utility)=>utility.id===id)?.storage;
    if(!found)throw new Error(`Missing utility storage contract: ${id}`);
    return found;
  };
  const data=createUtilityStorage(storage,contract("data-layer")),project=runtime.storage;
  const dataLayerStorage:Storage={
    get length(){return data.length;},key:(index)=>data.key(index),
    clear(){data.clear();project.removeItem(SCHEMA_LIBRARY_STORAGE_KEY);},
    getItem:(key)=>key===SCHEMA_LIBRARY_STORAGE_KEY?project.getItem(key):data.getItem(key),
    setItem(key,value){if(key===SCHEMA_LIBRARY_STORAGE_KEY)project.setItem(key,value);else data.setItem(key,value);},
    removeItem(key){if(key===SCHEMA_LIBRARY_STORAGE_KEY)project.removeItem(key);else data.removeItem(key);},
  };
  const port=createInstalledCompleteConfigurationPort({
    projectStorage:project,dataLayerStorage,hotkeyStorage:createUtilityStorage(storage,contract("hotkeys")),
    inventoryStorage:storage,legacyJournalStorage:storage,buildIdentity:"studio-startup-recovery",
    settle:()=>runtime.settled(),durableRepository:createDurableProjectConfigurationRepository(runtime.repository),
    journal:{read:()=>runtime.repository.readConfigurationJournal(),
      write:(value)=>runtime.repository.writeConfigurationJournal(value),
      clear:()=>runtime.repository.clearConfigurationJournal(),
      marker:()=>runtime.repository.readConfigurationCommitMarker()},
  });
  await port.recover();
  return pending;
}
