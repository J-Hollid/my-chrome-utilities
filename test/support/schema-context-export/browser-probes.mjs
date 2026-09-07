export async function openSidePanelHost(key,revision=false){
  document.querySelector("#data-layer-view-schemas").click();
  const pause=()=>new Promise(resolve=>setTimeout(resolve,60));
  for(let attempt=0;attempt<80;attempt++){
    const row=[...document.querySelectorAll("[data-schema-entry-key]")].find(row=>row.dataset.schemaEntryKey===key);
    if(row){
      const label=key.startsWith("saved:")?"Edit working draft":"Open schema";
      [...row.querySelectorAll("button")].find(button=>button.textContent.trim()===label).click();
      await pause();
      if(revision){const button=[...document.querySelectorAll("button")].find(button=>button.textContent==="View revision schema");if(!button)throw new Error("Revision schema control missing");button.click();await pause();}
      return;
    }
    const search=document.querySelector("#schema-search");
    if(search){search.value=key.startsWith("saved:")?"Saved purchase":key.startsWith("profiles:")?"Sitewide":key.startsWith("propertySets:")?"Checkout properties":key.startsWith("pages:")?"Cart":key.startsWith("events:")?"Purchase":key.startsWith("flowInstances:")?"Cart step":"Purchase occurrence";search.dispatchEvent(new Event("input",{bubbles:true}));}
    for(const group of document.querySelectorAll('#schema-list [data-schema-group][aria-expanded="false"]'))group.querySelector("button")?.click();
    await pause();
  }
  throw new Error(`Schema host not found: ${key}; ${document.querySelector("#schema-list")?.textContent}`);
}

export async function observeContextExport(keyboard=false){
  const pause=()=>new Promise(resolve=>setTimeout(resolve,50));
  const visible=element=>Boolean(element?.getClientRects().length)&&getComputedStyle(element).visibility!=="hidden";
  let trigger;
  for(let attempt=0;attempt<100;attempt++){const scope=[...document.querySelectorAll("dialog[open]")].at(-1)??document;trigger=[...scope.querySelectorAll("[data-schema-context-export-action]")].find(visible);if(trigger&&!trigger.disabled)break;await pause();}
  if(!trigger||trigger.disabled)throw new Error(`Export action unavailable: ${document.body.innerText.slice(-2200)}`);
  const search=[...document.querySelectorAll('input[aria-label="Canonical property search"]')].find(visible);
  if(search){search.value="no_matching_export_property";search.dispatchEvent(new Event("input",{bubbles:true}));await pause();}
  const root=trigger.closest('[data-canonical-schema-id]')??trigger.parentElement;
  const repository=await (await import("/data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
  const stored=async()=>JSON.stringify({project:await repository.loadProject("project:export"),schemas:await repository.savedSchemaRecords()});
  const before=await stored(),route=location.href;
  let clipboard;Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>{clipboard=text;}}});
  let downloaded;
  const capture=async item=>{const response=await fetch(item.url);downloaded={id:item.id,text:await response.text(),mime:response.headers.get("content-type"),filename:item.filename.split(/[\\/]/).at(-1)};};
  chrome.downloads.onCreated.addListener(capture);
  trigger.focus();
  if(keyboard){window.contextExportKeyboardReady=true;for(let attempt=0;attempt<100&&!document.querySelector('dialog[data-schema-context-export]');attempt++)await pause();}
  else trigger.click();
  const dialog=document.querySelector('dialog[data-schema-context-export]');
  if(!dialog?.open)throw new Error("Export preview did not open");
  const button=label=>[...dialog.querySelectorAll("button")].find(item=>item.textContent===label);
  if(!button("Confirm compatibility review").hidden)button("Confirm compatibility review").click();
  button("Copy JSON").click();for(let attempt=0;attempt<60&&(!clipboard||button("Download JSON").disabled);attempt++)await pause();
  button("Download JSON").click();for(let attempt=0;attempt<60&&(!downloaded||!dialog.querySelector("output").textContent.includes("Download complete"));attempt++)await pause();
  if(!downloaded||!dialog.querySelector("output").textContent.includes("Download complete"))throw new Error("Download did not complete");
  const [item]=await chrome.downloads.search({id:downloaded.id});downloaded.filename=item.filename.split(/[\\/]/).at(-1);
  const result={label:dialog.querySelector("p").textContent,text:dialog.querySelector("pre").textContent,clipboard,downloaded,
    controls:[...dialog.querySelectorAll("button")].filter(visible).map(control=>{const box=control.getBoundingClientRect();return {name:control.textContent,left:box.left,right:box.right,top:box.top,bottom:box.bottom};}),
    filtered:Boolean(search),width:innerWidth,height:innerHeight,header:Boolean(trigger.closest("header,.composed-schema-inventory-actions,#compact-canonical-context")),
    unchanged:before===await stored(),routeUnchanged:route===location.href,source:root.dataset.canonicalSchemaId,
    jsonScrolls:dialog.querySelector("pre").scrollWidth>dialog.querySelector("pre").clientWidth||dialog.querySelector("pre").scrollHeight>dialog.querySelector("pre").clientHeight};
  button("Close").click();result.focusReturned=document.activeElement===trigger;
  chrome.downloads.onCreated.removeListener(capture);return result;
}

export async function openFlowExportHost(kind,id){
  const pause=()=>new Promise(resolve=>setTimeout(resolve,70));
  for(let attempt=0;attempt<100;attempt++){
    const target=document.querySelector(`[aria-label="Interactive directional Flow canvas"] [${kind==="page"?"data-page-frame-id":"data-occurrence-id"}="${id}"]`);
    if(target){target.focus();target.dispatchEvent(new KeyboardEvent("keydown",{key:"ContextMenu",bubbles:true,cancelable:true}));await pause();
      const action=[...document.querySelectorAll("button")].find(button=>button.textContent==="Open schema contribution"&&button.getClientRects().length);
      if(action){action.click();await pause();return;}}
    await pause();
  }
  throw new Error(`Flow schema control is unavailable: ${kind}; ${JSON.stringify([...document.querySelectorAll("[data-page-frame-id],[data-occurrence-id],svg")].map(node=>({tag:node.tagName,label:node.getAttribute("aria-label"),data:{...node.dataset}})))}; ${document.body.innerText.slice(-1000)}`);
}

export async function productionOccurrenceOutcomes(payloads){
  const repository=await (await import("/data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
  const {state}=await repository.loadProject("project:export");
  const {layeredContributorsForPath,layeredContributorPath}=await import("/data-layer-layered-schema-project.js");
  const {compileLayeredSchema,validateLayeredObservation}=await import("/data-layer-layered-schema.js");
  const entity=state.project.documentationFlowGraphs["flow:checkout"].occurrences[0];
  const compiled=compileLayeredSchema(layeredContributorsForPath(state,layeredContributorPath(state,entity,"Event-occurrence","flow:checkout")),{eventId:entity.eventId,eventRole:"interaction",occurrenceId:entity.id});
  return payloads.map(payload=>{const result=validateLayeredObservation({targetId:entity.id,targetName:entity.name,revision:1,compiled},payload);return result.status!=="blocked"&&!result.issues.some(issue=>issue.severity==="error");});
}
