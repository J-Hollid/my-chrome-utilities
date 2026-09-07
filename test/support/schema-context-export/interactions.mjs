export async function prepareExportEdit(){
  const {openIndexedDbProjectRepository,durableDraftCommand}=await import("/data-layer-durable-project-repository.js");
  const {applyCanonicalCommand}=await import("/data-layer-canonical-schema.js");
  const repository=await openIndexedDbProjectRepository(),base=await repository.loadProject("project:export"),next=structuredClone(base.state),profile=next.project.collections.profiles[0],document=profile.canonicalSchema,node=Object.values(document.nodes).find(node=>node.name==="amount");
  const result=applyCanonicalCommand(document,{kind:"set",baseRevision:document.revision,propertyId:node.id,patch:{expectedValue:10}});
  if(result.status!=="applied")throw new Error("Accepted fixture edit failed");profile.canonicalSchema=result.document;
  const saved=await repository.saveDraft(durableDraftCommand(base,next,{commandId:crypto.randomUUID(),label:"Prepare export edit"}));
  if(saved.status==="conflict")throw new Error("Export edit fixture conflicted");
}

export async function observeUnconfirmedExportEdit(){
  const pause=()=>new Promise(resolve=>setTimeout(resolve,60));
  const waitFor=async(read,label)=>{for(let attempt=0;attempt<120;attempt++){const result=read();if(result)return result;await pause();}throw new Error(`${label}: ${document.body.innerText.slice(-1400)}`);};
  const button=(root,label)=>[...root.querySelectorAll("button")].find(button=>button.textContent.trim()===label);
  const editor=await waitFor(()=>document.querySelector('[aria-label="Builder canonical schema editor"]'),"Canonical editor");
  const row=[...editor.querySelectorAll("[data-property-id]")].find(row=>row.textContent.includes("amount"));
  row.querySelector('[aria-label^="Property actions"]').click();
  button(await waitFor(()=>document.querySelector(':modal [data-property-context-menu]'),"Property menu"),"Definition").click();
  const focused=await waitFor(()=>document.querySelector(':modal [data-focused-property-editor]'),"Focused editor");
  const field=focused.querySelector('input[name="ordinaryValue"]');
  if(!field)throw new Error("Expected value control missing");
  const initial=field.value;field.value="20";field.dispatchEvent(new Event("input",{bubbles:true}));field.dispatchEvent(new Event("change",{bubbles:true}));
  const action=await waitFor(()=>[...document.querySelectorAll("[data-schema-context-export-action]")].find(button=>button.disabled),"Export disabled during staged edit");
  const disabled={disabled:action.disabled,reason:action.title};
  button(focused,"Review changes").click();
  button(await waitFor(()=>document.querySelector(':modal [aria-label="Review changes"]'),"Review changes"),"Confirm changes").click();
  await waitFor(()=>[...document.querySelectorAll("[data-schema-context-export-action]")].find(button=>button.getClientRects().length&&!button.disabled),"Export after save");
  const repository=await (await import("/data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
  let amount;
  for(let attempt=0;attempt<100;attempt++){const {state}=await repository.loadProject("project:export");amount=Object.values(state.project.collections.profiles[0].canonicalSchema.nodes).find(node=>node.name==="amount");if(amount.expectedValue===20||amount.allowedValues.some(entry=>entry.value===20))break;await pause();}
  return {initial,disabled,accepted:amount.expectedValue??amount.allowedValues.map(entry=>entry.value),availableWithoutReload:true};
}

export async function observeStaleAndFailedExports(downloadFailureProbe){
  const pause=()=>new Promise(resolve=>setTimeout(resolve,60));
  const waitFor=async(read,label)=>{for(let attempt=0;attempt<150;attempt++){const result=read();if(result)return result;await pause();}throw new Error(`${label}: ${document.body.innerText.slice(-1200)}`);};
  const trigger=await waitFor(()=>[...document.querySelectorAll("[data-schema-context-export-action]")].find(button=>button.getClientRects().length&&!button.disabled),"Page export");trigger.click();
  const dialog=document.querySelector('dialog[data-schema-context-export]'),button=label=>[...dialog.querySelectorAll("button")].find(button=>button.textContent===label),status=()=>dialog.querySelector("output").textContent;
  if(!button("Confirm compatibility review").hidden)button("Confirm compatibility review").click();
  const original=dialog.querySelector("pre").textContent;
  const {openIndexedDbProjectRepository,durableDraftCommand}=await import("/data-layer-durable-project-repository.js");
  const repository=await openIndexedDbProjectRepository(),base=await repository.loadProject("project:export"),next=structuredClone(base.state),canonical=next.project.collections.profiles[0].canonicalSchema,node=Object.values(canonical.nodes).find(node=>node.name==="currency");
  node.documentation.description="Updated parent currency";canonical.revision++;
  await repository.saveDraft(durableDraftCommand(base,next,{commandId:crypto.randomUUID(),label:"Change export parent"}));
  await waitFor(()=>button("Copy JSON").disabled&&!button("Refresh export").hidden,"Stale parent snapshot");
  const stale={copyDisabled:button("Copy JSON").disabled,downloadDisabled:button("Download JSON").disabled,message:status(),textUnchanged:dialog.querySelector("pre").textContent===original};
  button("Refresh export").click();
  if(!button("Confirm compatibility review").hidden)button("Confirm compatibility review").click();
  await pause();const refreshed=dialog.querySelector("pre").textContent;
  let copied,denyCopy=true;Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>{if(denyCopy)throw new Error("Clipboard denied");copied=text;}}});
  button("Copy JSON").click();await waitFor(()=>status().includes("Clipboard denied"),"Clipboard error");
  const clipboardFailure={status:status(),otherEnabled:!button("Download JSON").disabled,previewOpen:dialog.open};
  denyCopy=false;button("Copy JSON").click();await waitFor(()=>status().includes("JSON copied"),"Clipboard retry");
  const {downloadFailure,downloads}=await downloadFailureProbe();
  button("Close").click();
  return {stale,refreshed,copied,clipboardFailure,downloadFailure,downloads};
}


export async function observeDownloadFailureAndRetry(){
  const pause=()=>new Promise(resolve=>setTimeout(resolve,50));
  const waitFor=async(read,label)=>{for(let n=0;n<160;n++){if(read())return;await pause();}throw new Error(label);};
  const dialog=document.querySelector('dialog[data-schema-context-export]');
  const button=label=>[...dialog.querySelectorAll("button")].find(node=>node.textContent===label);
  const status=()=>dialog.querySelector("output").textContent;
  const text=dialog.querySelector("pre").textContent;
  const completed=[];
  const changed=delta=>{if(delta.state?.current==="complete")completed.push(delta.id);};
  chrome.downloads.onChanged.addListener(changed);
  try{
    globalThis.contextExportDownloadControl="deny";
    await waitFor(()=>globalThis.contextExportDownloadReady==="deny","CDP download denial");
    button("Download JSON").click();
    await waitFor(()=>status().includes("Try again"),"Browser download rejection");
    const downloadFailure={status:status(),otherEnabled:!button("Copy JSON").disabled,
      previewOpen:dialog.open,textUnchanged:text===dialog.querySelector("pre").textContent,
      completedBeforeRetry:completed.length};
    globalThis.contextExportDownloadControl="allow";
    await waitFor(()=>globalThis.contextExportDownloadReady==="allow","CDP download retry");
    button("Download JSON").click();
    await waitFor(()=>status().includes("Download complete"),"Completed browser download retry");
    const [item]=await chrome.downloads.search({id:completed.at(-1)});
    return {downloadFailure,downloads:completed.length,filename:item.filename,text,completion:status()};
  }finally{chrome.downloads.onChanged.removeListener(changed);globalThis.contextExportDownloadControl="done";}
}
