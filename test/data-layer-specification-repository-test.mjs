import assert from "node:assert/strict";
import {createSpecificationProject,transactProject} from "../dist/data-layer-specification-project.js";
import {commitCanonicalProjectState,inspectCanonicalProjectConflict,resolveCanonicalProjectConflict,restoreCanonicalProjectState,subscribeCanonicalProjectChanges} from "../dist/data-layer-specification-repository.js";

let sequence=0;const id=(kind)=>`${kind}:${++sequence}`;
const initial=createSpecificationProject({name:"Canonical",site:"shop.example",id}),values=new Map(),storage={getItem:(key)=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
const first=commitCanonicalProjectState(storage,initial);assert.equal(first.status,"committed");assert.equal(first.revision,1);assert.equal(JSON.parse(values.get(first.key)).format,"my-chrome-utilities.canonical-specification-project");
let storageListener,observedRevision=0,observedName="";const target={addEventListener:(type,listener)=>{assert.equal(type,"storage");storageListener=listener;},removeEventListener:(type,listener)=>{assert.equal(type,"storage");assert.equal(listener,storageListener);storageListener=undefined;}};
const unsubscribe=subscribeCanonicalProjectChanges(target,({revision,state})=>{observedRevision=revision;observedName=state.project.name;});
storageListener({key:"unrelated",newValue:values.get(first.key)});assert.equal(observedRevision,0,"unrelated storage changes must not rerender project surfaces");
storageListener({key:first.key,newValue:values.get(first.key)});assert.equal(observedRevision,1);assert.equal(observedName,"Canonical");unsubscribe();assert.equal(storageListener,undefined);
const edited=transactProject(initial,"Rename",(project)=>({...project,name:"Current"}));const second=commitCanonicalProjectState(storage,edited,{expectedRevision:1});assert.equal(second.status,"committed");assert.equal(second.revision,2);
assert.equal(Object.values(second.envelope.entityRevisions).every((revision)=>revision===1),true,"project metadata edits must not invent entity revisions");
const stale=transactProject(initial,"Stale rename",(project)=>({...project,name:"Stale"}));const conflict=commitCanonicalProjectState(storage,stale,{expectedRevision:1,pendingLabel:"Rename project"});assert.equal(conflict.status,"conflict");assert.equal(conflict.current.project.name,"Current");assert.equal(conflict.pending.project.name,"Stale");assert.equal(conflict.pendingLabel,"Rename project");assert.equal(restoreCanonicalProjectState(values.get(first.key)).project.name,"Current");
const before=values.get(first.key),failing={getItem:storage.getItem,setItem:()=>{throw new Error("quota")}};assert.throws(()=>commitCanonicalProjectState(failing,stale,{expectedRevision:2}),/quota/);assert.equal(values.get(first.key),before);

const conflictBase=restoreCanonicalProjectState(values.get(first.key));
const currentDescription=transactProject(conflictBase,"Describe",(project)=>({...project,description:"Current description"}));
const third=commitCanonicalProjectState(storage,currentDescription,{expectedRevision:2,base:conflictBase});assert.equal(third.status,"committed");
const pendingName=transactProject(conflictBase,"Rename pending",(project)=>({...project,name:"Pending name"}));
const nonOverlapping=commitCanonicalProjectState(storage,pendingName,{expectedRevision:2,base:conflictBase,pendingLabel:"Rename project"});assert.equal(nonOverlapping.status,"committed","disjoint stale commands must merge without a conflict dialog");
assert.equal(nonOverlapping.revision,4);
assert.equal(nonOverlapping.envelope.project.name,"Pending name");
assert.equal(nonOverlapping.envelope.project.description,"Current description","a stale command must preserve unrelated newer fields");
assert.deepEqual(nonOverlapping.envelope.commands.at(-1),{
  label:"Rename project",
  baseRevision:2,
  committedRevision:4,
  fields:["project.name"],
},"canonical storage must retain the command's declared base revision and exact patch fields");

const pendingDescription=transactProject(conflictBase,"Describe pending",(project)=>({...project,description:"Pending description"}));
const overlapping=commitCanonicalProjectState(storage,pendingDescription,{expectedRevision:2,base:conflictBase,pendingLabel:"Describe project"});
assert.deepEqual(inspectCanonicalProjectConflict(overlapping).conflictingFields,["project.description"]);
assert.equal(resolveCanonicalProjectConflict(overlapping,{strategy:"merge",pendingFields:[]}).project.description,"Current description");
assert.equal(resolveCanonicalProjectConflict(overlapping,{strategy:"merge",pendingFields:["project.description"]}).project.description,"Pending description");

const entityValues=new Map(),entityStorage={getItem:(key)=>entityValues.get(key)??null,setItem:(key,value)=>entityValues.set(key,value)};
const entityBase=commitCanonicalProjectState(entityStorage,initial);assert.equal(entityBase.status,"committed");
const entityState=transactProject(initial,"Add profile",(project)=>({...project,collections:{...project.collections,profiles:[{id:"profile:sitewide",name:"Sitewide",requirements:[]}]}}));
const entityCommit=commitCanonicalProjectState(entityStorage,entityState,{expectedRevision:1,base:initial});assert.equal(entityCommit.status,"committed");assert.equal(entityCommit.envelope.entityRevisions["profile:sitewide"],1);
const changedEntityState=transactProject(entityState,"Rename profile",(project)=>({...project,collections:{...project.collections,profiles:project.collections.profiles.map((profile)=>({...profile,name:"Sitewide context"}))}}));
const changedEntityCommit=commitCanonicalProjectState(entityStorage,changedEntityState,{expectedRevision:2,base:entityState});assert.equal(changedEntityCommit.status,"committed");assert.equal(changedEntityCommit.envelope.entityRevisions["profile:sitewide"],2,"changed entities must advance their own revision");
console.log("canonical Specification Project repository tests passed");
