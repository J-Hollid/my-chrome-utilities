import assert from "node:assert/strict";

import {createMemoryDurableProjectRepository} from "../dist/data-layer-durable-project-repository.js";
import {createDurableProjectRuntime} from "../dist/data-layer-durable-project-runtime.js";
import {createSpecificationProject,transactProject} from "../dist/data-layer-specification-project.js";
import {CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY,restoreCanonicalProjectState,serializeCanonicalProjectState} from "../dist/data-layer-specification-repository.js";

const project=createSpecificationProject({name:"Asset staging",site:"asset.example",id:kind=>kind==="project"?"project-asset-staging":`${kind}:asset-staging`});
const repository=createMemoryDurableProjectRepository();
await repository.putProject(project,{draftSequence:2,active:true});
let fail=true,captured;
const proxy=new Proxy(repository,{get(target,key){if(key==="saveDraft")return async command=>{captured=command;if(fail)throw new DOMException("staged body transaction failed","AbortError");return target.saveDraft(command);};const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;}});
const values=new Map(),legacy={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
const runtime=await createDurableProjectRuntime(proxy,legacy,{projectId:project.project.id,route:{}}),identity={projectId:project.project.id,namespace:"documentation-template",digest:"atomic-body"};
runtime.stageProjectAssetBody(identity,new Blob(["exact workbook bytes"],{type:"application/octet-stream"}));
const pending=transactProject(restoreCanonicalProjectState(runtime.storage.getItem(CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY)),"Save staged body",current=>({...current,notes:"matching metadata"}));
runtime.storage.setItem(CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY,serializeCanonicalProjectState(pending,3));
await assert.rejects(()=>runtime.settled("project"),/staged body transaction failed/u);
assert.equal(await captured.assetBodies[0].body.text(),"exact workbook bytes","the failed command retains the exact staged bytes");
await assert.rejects(()=>repository.loadProjectAssetBody(identity),error=>error.name==="NotFoundError","failure leaves no durable orphan body");

fail=false;
await runtime.retryFailedSave();
assert.equal(await (await repository.loadProjectAssetBody(identity)).text(),"exact workbook bytes","Retry commits the same bytes with the retained Draft command");
assert.equal((await repository.loadProject(project.project.id)).state.project.notes,"matching metadata");

const rejectedIdentity={...identity,digest:"rejected-body"};
runtime.stageProjectAssetBody(rejectedIdentity,new Blob(["discard me"]));
const rejected=transactProject(restoreCanonicalProjectState(runtime.storage.getItem(CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY)),"Reject staged body",current=>({...current,owner:"unsaved owner"}));
fail=true;
runtime.storage.setItem(CANONICAL_SPECIFICATION_PROJECT_STORAGE_KEY,serializeCanonicalProjectState(rejected,4));
await assert.rejects(()=>runtime.settled("project"),/staged body transaction failed/u);
await runtime.resolveFailedSave("reject");
await assert.rejects(()=>repository.loadProjectAssetBody(rejectedIdentity),error=>error.name==="NotFoundError","reviewed rejection removes pending bytes without creating a durable orphan");
assert.equal((await repository.loadProject(project.project.id)).state.project.owner,undefined);

console.log("project asset-body runtime integration test passed");
