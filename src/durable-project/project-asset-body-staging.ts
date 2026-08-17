import {projectAssetBodyStorageKey,type ProjectAssetBodyCommandItem,type ProjectAssetBodyIdentity} from "../project-asset-body-contribution.js";

export interface ProjectAssetBodyAttachment {
  readonly operationId:string;
  readonly bodies:readonly ProjectAssetBodyCommandItem[];
  commit():void;
  discard():void;
}

export interface ProjectAssetBodyStaging {
  stage(identity:ProjectAssetBodyIdentity,body:Blob):void;
  discard(identity:ProjectAssetBodyIdentity):void;
  attach(projectId:string,bodies?:readonly ProjectAssetBodyCommandItem[]):ProjectAssetBodyAttachment;
}

export function createProjectAssetBodyStaging():ProjectAssetBodyStaging {
  const pending=new Map<string,Omit<ProjectAssetBodyCommandItem,"operationId">>();
  const remove=(items:readonly Pick<ProjectAssetBodyCommandItem,"identity"|"stagingToken">[])=>{for(const item of items){const key=projectAssetBodyStorageKey(item.identity),current=pending.get(key);if(current?.stagingToken===item.stagingToken)pending.delete(key);}};
  return{
    stage(identity,body){const key=projectAssetBodyStorageKey(identity);pending.set(key,{identity:structuredClone(identity),body:body.slice(0,body.size,body.type),stagingToken:crypto.randomUUID()});},
    discard(identity){pending.delete(projectAssetBodyStorageKey(identity));},
    attach(projectId,bodies){const operationIds=new Set(bodies?.map(({operationId})=>operationId)??[]);if(operationIds.size>1)throw new DOMException("A Draft asset-body attachment cannot combine operation identities.","DataError");const operationId=operationIds.values().next().value??crypto.randomUUID(),available=bodies??[...pending.values()].filter(item=>item.identity.projectId===projectId),selected=available.map(item=>({...structuredClone(item),body:item.body.slice(0,item.body.size,item.body.type),operationId}));remove(selected);return{operationId,bodies:selected,commit:()=>remove(selected),discard:()=>remove(selected)};},
  };
}
