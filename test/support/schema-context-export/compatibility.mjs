export async function prepareCompatibilityExport(){
  const {openIndexedDbProjectRepository,durableDraftCommand}=await import("/data-layer-durable-project-repository.js");
  const repository=await openIndexedDbProjectRepository(),base=await repository.loadProject("project:export"),next=structuredClone(base.state),canonical=next.project.collections.profiles[0].canonicalSchema;
  const amount=Object.values(canonical.nodes).find(node=>node.name==="amount");
  amount.rules.push({id:"unsupported-export",name:"Partner amount check",kind:"custom",severity:"error",enabled:true});canonical.revision++;
  await repository.saveDraft(durableDraftCommand(base,next,{commandId:crypto.randomUUID(),label:"Prepare compatibility fixture"}));
}

export async function observeCompatibilityExport(){
  const pause=()=>new Promise(resolve=>setTimeout(resolve,60));
  const waitFor=async(read,label)=>{for(let n=0;n<150;n++){const value=read();if(value)return value;await pause();}throw new Error(label);};
  const repository=await (await import("/data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
  const trigger=await waitFor(()=>[...document.querySelectorAll("[data-schema-context-export-action]")].find(node=>node.getClientRects().length&&!node.disabled),"Export trigger");
  await pause();const before=JSON.stringify(await repository.loadProject("project:export"));
  let writes=0,downloads=0,clipboard,downloaded;
  Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>{writes++;clipboard=text;}}});
  const capture=async event=>{const link=event.target.closest?.("a[download]");if(link){downloads++;downloaded=await(await fetch(link.href)).text();}};document.addEventListener("click",capture,true);
  const open=()=>{trigger.click();const dialog=document.querySelector('dialog[data-schema-context-export]');return {dialog,button:label=>[...dialog.querySelectorAll("button")].find(node=>node.textContent===label)};};
  let view=open();const review=view.dialog.querySelector("section").textContent;
  const blocked=view.button("Copy JSON").disabled&&view.button("Download JSON").disabled;
  view.button("Close").click();await pause();const cancelled={writes,downloads};
  view=open();view.button("Confirm compatibility review").click();
  view.button("Copy JSON").click();await waitFor(()=>writes===1&&!view.button("Download JSON").disabled,"Copy after review");
  view.button("Download JSON").click();await waitFor(()=>downloaded,"Download after review");
  const completion=view.dialog.querySelector("output").textContent;
  view.button("Close").click();document.removeEventListener("click",capture,true);
  return {review,blocked,cancelled,clipboard,downloaded,completion,unchanged:before===JSON.stringify(await repository.loadProject("project:export"))};
}

export async function prepareLongRevision(){
  const repository=await (await import("/data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
  const record=(await repository.savedSchemaRecords()).find(record=>record.schema.id==="schema:export"),schema=structuredClone(record.schema);
  schema.document.properties=Object.fromEntries(Array.from({length:50},(_,i)=>[`long_property_${i}_${"nested_content_".repeat(12)}`,{type:"array",items:{type:"array",items:{type:"number"}}}]));
  await repository.saveSavedSchema({schema,baseToken:record.token,label:"Prepare long published fixture"});
  return Object.keys(schema.document.properties);
}
