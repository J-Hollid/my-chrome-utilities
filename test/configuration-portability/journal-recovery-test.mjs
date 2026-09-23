import assert from "node:assert/strict";

import {createMemoryDurableProjectRepository} from "../../dist/data-layer-durable-project-repository.js";
import {createSpecificationProject} from "../../dist/data-layer-specification-project.js";
import {createDurableProjectConfigurationRepository} from
  "../../dist/configuration-portability/durable-project-adapter.js";
import {createInstalledCompleteConfigurationPort} from
  "../../dist/configuration-portability/installed-repository.js";

const SESSION_KEY="my-chrome-utilities.saved-session-library.v1";
const session=(id)=>JSON.stringify({sessions:[{id,name:id}]});
const storage=(values=new Map())=>({
  getItem:key=>values.get(key)??null,
  setItem:(key,value)=>values.set(key,value),
  removeItem:key=>values.delete(key),
  values,
});
const project=(id)=>createSpecificationProject({name:id,site:`${id}.example`,
  id:kind=>kind==="project"?id:`${kind}:${id}`});
const sourceRepository=createMemoryDurableProjectRepository();
await sourceRepository.putProject(project("source"),{active:true});
const source=await createDurableProjectConfigurationRepository(sourceRepository).read();
source.sections.savedSessions=[{id:"next",value:{id:"next",name:"next"}}];

const recipient=createMemoryDurableProjectRepository();
await recipient.putProject(project("prior"),{active:true});
const durablePort=createDurableProjectConfigurationRepository(recipient);
const projectStorage=storage(),dataStorage=storage(new Map([[SESSION_KEY,session("prior")]])),hotkeyStorage=storage();
const journal={
  read:()=>recipient.readConfigurationJournal(),
  write:(value)=>recipient.writeConfigurationJournal(value),
  clear:()=>recipient.clearConfigurationJournal(),
  marker:()=>recipient.readConfigurationCommitMarker(),
};
const port=createInstalledCompleteConfigurationPort({projectStorage,dataLayerStorage:dataStorage,
  hotkeyStorage,buildIdentity:"journal-test",durableRepository:durablePort,journal});
const values=(id)=>[{key:SESSION_KEY,value:session(id),storage:"data"}];
const pending=(id)=>({id,prior:values("prior"),next:values("next"),projects:source.sections.projects,
  activeProjectId:source.activeProjectId});

await journal.write(pending("before-durable"));
await assert.rejects(()=>journal.write(pending("competing-setup")),/Another configuration setup is pending/u,
  "a second setup cannot overwrite a pending recovery journal");
dataStorage.setItem(SESSION_KEY,session("next"));
await port.recover();
assert.equal(dataStorage.getItem(SESSION_KEY),session("prior"),
  "startup restores the old local state when the durable commit did not occur");
assert.equal(await journal.read(),undefined);
assert.equal((await recipient.listProjectMetadata())[0].projectId,"prior");

await journal.write(pending("after-durable"));
await durablePort.commit(source,{commitMarker:"after-durable"});
await port.recover();
assert.equal(dataStorage.getItem(SESSION_KEY),session("next"),
  "startup completes the new local state after a durable commit");
assert.equal(await journal.read(),undefined);
assert.equal(await journal.marker(),"after-durable");
assert.equal((await recipient.listProjectMetadata())[0].projectId,"source");
assert.equal(projectStorage.getItem("my-chrome-utilities.complete-configuration-journal.v1"),null,
  "the recovery journal does not use local storage quota");
const projectSet=projectStorage.setItem,dataSet=dataStorage.setItem;
projectStorage.setItem=(key,value)=>{if(key==="my-chrome-utilities.specification-project-library.v1")
  throw new Error("project projection must not be rewritten");projectSet(key,value);};
dataStorage.setItem=(key,value)=>{if(key==="my-chrome-utilities.schema-library.v1")
  throw new Error("schema projection must not be rewritten");dataSet(key,value);};
await port.commit(source);
assert.equal(await journal.read(),undefined,
  "a committed setup leaves no pending recovery journal");

const rollbackRecipient=createMemoryDurableProjectRepository();
await rollbackRecipient.putProject(project("prior"),{active:true});
const rollbackDurable=createDurableProjectConfigurationRepository(rollbackRecipient);
const rollbackData=storage(new Map([[SESSION_KEY,session("prior")]]));
const nativeSet=rollbackData.setItem;let fail=true;
rollbackData.setItem=(key,value)=>{if(key===SESSION_KEY&&value===session("next")&&fail){fail=false;
  throw new DOMException("Injected local storage quota failure","QuotaExceededError");}
  nativeSet(key,value);};
const rollbackJournal={read:()=>rollbackRecipient.readConfigurationJournal(),
  write:(value)=>rollbackRecipient.writeConfigurationJournal(value),
  clear:()=>rollbackRecipient.clearConfigurationJournal(),
  marker:()=>rollbackRecipient.readConfigurationCommitMarker()};
const rollbackPort=createInstalledCompleteConfigurationPort({projectStorage:storage(),
  dataLayerStorage:rollbackData,hotkeyStorage:storage(),buildIdentity:"journal-test",
  durableRepository:rollbackDurable,journal:rollbackJournal});
await assert.rejects(()=>rollbackPort.commit(source),/Injected local storage quota failure/u);
assert.equal(rollbackData.getItem(SESSION_KEY),session("prior"));
assert.equal((await rollbackRecipient.listProjectMetadata())[0].projectId,"prior");
assert.equal(await rollbackJournal.read(),undefined);
assert.equal(await rollbackJournal.marker(),undefined);

console.log("configuration journal recovery tests passed");
