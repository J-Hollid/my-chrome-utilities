import assert from "node:assert/strict";
import {createSpecificationProject,transactProject} from "../dist/data-layer-specification-project.js";
import {commitCanonicalProjectState,restoreCanonicalProjectState} from "../dist/data-layer-specification-repository.js";

let sequence=0;const id=(kind)=>`${kind}:${++sequence}`;
const initial=createSpecificationProject({name:"Canonical",site:"shop.example",id}),values=new Map(),storage={getItem:(key)=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
const first=commitCanonicalProjectState(storage,initial);assert.equal(first.status,"committed");assert.equal(first.revision,1);assert.equal(JSON.parse(values.get(first.key)).format,"my-chrome-utilities.canonical-specification-project");
const edited=transactProject(initial,"Rename",(project)=>({...project,name:"Current"}));const second=commitCanonicalProjectState(storage,edited,{expectedRevision:1});assert.equal(second.status,"committed");assert.equal(second.revision,2);
const stale=transactProject(initial,"Stale rename",(project)=>({...project,name:"Stale"}));const conflict=commitCanonicalProjectState(storage,stale,{expectedRevision:1,pendingLabel:"Rename project"});assert.equal(conflict.status,"conflict");assert.equal(conflict.current.project.name,"Current");assert.equal(conflict.pending.project.name,"Stale");assert.equal(conflict.pendingLabel,"Rename project");assert.equal(restoreCanonicalProjectState(values.get(first.key)).project.name,"Current");
const before=values.get(first.key),failing={getItem:storage.getItem,setItem:()=>{throw new Error("quota")}};assert.throws(()=>commitCanonicalProjectState(failing,stale,{expectedRevision:2}),/quota/);assert.equal(values.get(first.key),before);
console.log("canonical Specification Project repository tests passed");
