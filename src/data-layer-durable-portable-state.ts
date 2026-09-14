import type {DurableBackend,DurableProjectStore} from "./data-layer-durable-project-repository.js";

const PROJECT_STORES=[
  "projectMetadata","projectRoots","projectEntityMetadata","projectEntities","flowGraphs","fixtures",
  "releases","projectRevisions","productionManifests","schemaRevisions","changeFeed","visualAssetMetadata",
  "visualAssetBodies","visualAssetThumbnails",
] as const satisfies readonly DurableProjectStore[];

export interface DurablePortableProjectState {
  activeProjectId?:string;
  stores:Record<typeof PROJECT_STORES[number],{key:string;value:unknown}[]>;
}

export async function readDurablePortableProjectState(backend:DurableBackend):Promise<DurablePortableProjectState>{
  return backend.transaction([...PROJECT_STORES,"settings"],"readonly",async(transaction)=>{
    const activeProjectId=await transaction.get<string>("settings","activeProjectId");
    return{...(activeProjectId?{activeProjectId}:{}),stores:Object.fromEntries(await Promise.all(
      PROJECT_STORES.map(async(store)=>[store,await transaction.getAll(store)]))) as DurablePortableProjectState["stores"]};
  });
}

export async function replaceDurablePortableProjectState(
  backend:DurableBackend,state:DurablePortableProjectState,
):Promise<void>{
  await backend.transaction([...PROJECT_STORES,"settings"],"readwrite",async(transaction)=>{
    for(const store of PROJECT_STORES){
      for(const {key} of await transaction.getAll(store))await transaction.delete(store,key);
      for(const {key,value} of state.stores[store])await transaction.put(store,key,value);
    }
    if(state.activeProjectId)await transaction.put("settings","activeProjectId",state.activeProjectId);
    else await transaction.delete("settings","activeProjectId");
  });
}
