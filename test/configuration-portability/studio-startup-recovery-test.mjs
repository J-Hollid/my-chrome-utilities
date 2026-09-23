import assert from "node:assert/strict";
import {recoverStudioConfiguration} from
  "../../dist/configuration-portability/studio-startup-recovery.js";

function memoryStorage(){
  const values=new Map();
  return{get length(){return values.size;},clear(){values.clear();},
    key(index){return [...values.keys()][index]??null;},
    getItem(key){return values.get(key)??null;},
    setItem(key,value){values.set(key,String(value));},
    removeItem(key){values.delete(key);}};
}

const storage=memoryStorage(),key="my-chrome-utilities.schema-rule-library.v1";
storage.setItem(key,"partial value");
const journal={id:"studio-recovery-test",prior:[{key,value:"old value",storage:"data"}],
  next:[{key,value:"new value",storage:"data"}],projects:[],activeProjectId:null};
let pending=journal;
const runtime={storage:memoryStorage(),settled:async()=>{},repository:{
  readConfigurationJournal:async()=>pending,
  readConfigurationCommitMarker:async()=>journal.id,
  clearConfigurationJournal:async()=>{pending=undefined;},
}};
assert.equal(await recoverStudioConfiguration(runtime,storage),true,
  "Studio detects a pending setup before it shows saved data");
assert.equal(storage.getItem(key),"new value","Studio restores the committed library value");
assert.equal(pending,undefined,"Studio clears the completed journal");
assert.equal(await recoverStudioConfiguration(runtime,storage),false,
  "Studio does not request another reload without a pending setup");
console.log("Studio startup recovery tests passed");
