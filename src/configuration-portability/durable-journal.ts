import type {DurableBackend} from "../data-layer-durable-project-repository.js";

export const CONFIGURATION_JOURNAL_KEY="completeConfigurationJournal";
export const CONFIGURATION_COMMIT_MARKER_KEY="completeConfigurationCommitId";

export async function readDurableConfigurationJournal<T>(backend:DurableBackend):Promise<T|undefined>{
  return backend.transaction(["settings"],"readonly",(transaction)=>
    transaction.get<T>("settings",CONFIGURATION_JOURNAL_KEY));
}

export async function writeDurableConfigurationJournal(
  backend:DurableBackend,value:unknown,
):Promise<void>{
  await backend.transaction(["settings"],"readwrite",async(transaction)=>{
    if(await transaction.get("settings",CONFIGURATION_JOURNAL_KEY))throw new DOMException(
      "Another configuration setup is pending. Reload before starting a new setup.","InvalidStateError");
    await transaction.put("settings",CONFIGURATION_JOURNAL_KEY,value);
  });
}

export async function clearDurableConfigurationJournal(backend:DurableBackend):Promise<void>{
  await backend.transaction(["settings"],"readwrite",(transaction)=>
    transaction.delete("settings",CONFIGURATION_JOURNAL_KEY));
}

export async function readDurableConfigurationCommitMarker(backend:DurableBackend):Promise<string|undefined>{
  return backend.transaction(["settings"],"readonly",(transaction)=>
    transaction.get<string>("settings",CONFIGURATION_COMMIT_MARKER_KEY));
}
