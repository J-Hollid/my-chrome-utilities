import assert from "node:assert/strict";

import {readDurablePortableProjectState,replaceDurablePortableProjectState} from
  "../dist/data-layer-durable-portable-state.js";

const stores=["projectMetadata","projectRoots","projectEntityMetadata","projectEntities","flowGraphs","fixtures",
  "releases","projectRevisions","productionManifests","schemaRevisions","changeFeed","savedSchemas","visualAssetMetadata",
  "visualAssetBodies","visualAssetThumbnails","settings"];
const backend=(initial,failAt=-1)=>{let state=new Map(stores.map(store=>[store,new Map(initial[store]??[])]));return{
  trace:()=>({reads:[],writes:[]}),clearTrace(){},snapshot:()=>structuredClone(state),
  async transaction(selected,mode,operation){const working=structuredClone(state);let writes=0,values=store=>working.get(store);
    const tx={get:async(store,key)=>structuredClone(values(store).get(key)),getAll:async store=>[...values(store)].map(([key,value])=>({key,value:structuredClone(value)})),getPrefix:async(store,prefix)=>[...values(store)].filter(([key])=>key.startsWith(prefix)).map(([key,value])=>({key,value:structuredClone(value)})),put:async(store,key,value)=>{if(++writes===failAt)throw new DOMException("Injected write failure","AbortError");values(store).set(key,structuredClone(value));},delete:async(store,key)=>{if(++writes===failAt)throw new DOMException("Injected write failure","AbortError");values(store).delete(key);}};
    const result=await operation(tx);if(mode==="readwrite")state=working;return result;},
};};

for(let index=1;index<=16;index+=1){
  const source=backend({projectMetadata:[["source",{projectId:"source",name:`Source ${index}`}]],projectRoots:[["source",{project:{id:"source"}}]],savedSchemas:[["schema:source",{schema:{id:"schema:source"}}]],settings:[["activeProjectId","source"]]}),target=backend({projectMetadata:[["target",{projectId:"target",name:`Target ${index}`}]],projectRoots:[["target",{project:{id:"target"}}]],savedSchemas:[["schema:target",{schema:{id:"schema:target"}}]],settings:[["activeProjectId","target"],["unrelated",index]]}),incoming=await readDurablePortableProjectState(source),before=target.snapshot(),failing=backend(Object.fromEntries([...before].map(([store,values])=>[store,[...values]])),index%5+1);
  await assert.rejects(()=>replaceDurablePortableProjectState(failing,incoming),/Injected write failure/u);
  assert.deepEqual(failing.snapshot(),before,"a failed write keeps the complete prior generation");
  await replaceDurablePortableProjectState(target,incoming);const result=await readDurablePortableProjectState(target);
  assert.deepEqual(result,incoming,"replacement exposes one coherent generation with its active project");
  assert.equal(target.snapshot().get("settings").get("unrelated"),index,"unrelated durable settings are conserved");
}

const cancellationSource=backend({projectMetadata:[["source",{projectId:"source"}]],
  projectRoots:[["source",{project:{id:"source"}}]],settings:[["activeProjectId","source"]]}),
  cancellationTarget=backend({projectMetadata:[["target",{projectId:"target"}]],
    projectRoots:[["target",{project:{id:"target"}}]],settings:[["activeProjectId","target"]]}),
  beforeCancellation=cancellationTarget.snapshot(),stop=new AbortController(),
  nativeTransaction=cancellationTarget.transaction.bind(cancellationTarget);
cancellationTarget.transaction=(stores,mode,operation)=>nativeTransaction(stores,mode,async transaction=>{
  let writes=0;return operation({...transaction,put:async(...args)=>{await transaction.put(...args);
    if(++writes===2)stop.abort();}});
});
const cancellationIncoming=await readDurablePortableProjectState(cancellationSource);
await assert.rejects(()=>replaceDurablePortableProjectState(cancellationTarget,
  cancellationIncoming,"cancelled",stop.signal),
({name})=>name==="AbortError","cancellation aborts a durable replacement transaction");
assert.deepEqual(cancellationTarget.snapshot(),beforeCancellation,
  "cancellation does not expose a partial durable generation or commit marker");

console.log("durable portable state properties passed");
