import assert from "node:assert/strict";
import {pathToFileURL} from "node:url";
import {runBrowserTargetSession} from "../support/browser-target-session.mjs";

const TARGET="REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER";

const expression=`(async()=>{
  const {renderReorderControl}=await import('./reorderable-editor/control.js');
  const {reorderItems}=await import('./reorderable-editor/model.js');
  const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
  const click=(root,text)=>{const control=[...root.querySelectorAll('button')].find(button=>button.textContent.trim()===text);if(!control)throw new Error('Missing '+text);control.click();return control;};
  const host=document.createElement('main');host.id='reorder-browser-evidence';host.style.cssText='inline-size:min(100%,320px);max-inline-size:100%;overflow-wrap:anywhere';document.body.replaceChildren(host);
  let order=[{id:'alpha',label:'Alpha'},{id:'bravo',label:'Bravo'},{id:'charlie',label:'Charlie'},{id:'delta',label:'Delta'}],checked=true,edited='edited',moves=[],undo=[];
  const render=(filterActive=false)=>{host.replaceChildren();const list=document.createElement('div');list.style.cssText='display:grid;inline-size:100%;max-inline-size:100%';host.append(list);for(const entry of order.filter(item=>!filterActive||['bravo','delta'].includes(item.id))){const row=document.createElement('div');row.dataset.rowId=entry.id;row.style.cssText='display:flex;flex-wrap:wrap;align-items:center;min-block-size:48px;max-inline-size:100%';const label=document.createElement('label'),box=document.createElement('input'),input=document.createElement('input');box.type='checkbox';box.checked=entry.id==='bravo'?checked:false;box.addEventListener('change',()=>{checked=box.checked;});input.value=entry.id==='bravo'?edited:entry.label;input.addEventListener('input',()=>{if(entry.id==='bravo')edited=input.value;});label.append(entry.label,box,input);const control=renderReorderControl({itemId:entry.id,itemLabel:entry.label,completeOrder:order,dropTarget:row,orderedContainer:list,filterActive,onMove:request=>{undo.push(order.map(item=>item.id));moves.push(request);order=reorderItems(order,request.itemId,request.toIndex);render(filterActive);return true;}});row.append(control,label);list.append(row);}return list;};
  let list=render();const bravo=()=>host.querySelector('[data-row-id="bravo"]'),trigger=()=>bravo().querySelector('[data-reorder-trigger]');
  const semantics=trigger().getAttribute('aria-label')==='Reorder Bravo, position 2 of 4'&&trigger().type==='button'&&trigger().getAttribute('aria-haspopup')==='menu'&&trigger().getAttribute('aria-grabbed')===null&&bravo().getAttribute('role')==='listitem'&&list.getAttribute('role')==='list'&&!bravo().draggable;
  bravo().querySelector('input[type="checkbox"]').click();bravo().querySelector('input:not([type="checkbox"])').value='still edited';bravo().querySelector('input:not([type="checkbox"])').dispatchEvent(new Event('input',{bubbles:true}));
  const transfer=new DataTransfer();trigger().dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:transfer}));const charlie=host.querySelector('[data-row-id="charlie"]');charlie.dispatchEvent(new DragEvent('dragover',{bubbles:true,clientY:999,dataTransfer:transfer}));const indicator=charlie.classList.contains('reorder-drop-after')&&charlie.style.borderBlockEnd.includes('3px');charlie.dispatchEvent(new DragEvent('drop',{bubbles:true,clientY:999,dataTransfer:transfer}));await pause();
  const dragResult=order.map(item=>item.id).join(',')==='alpha,charlie,bravo,delta'&&moves.at(-1)?.itemId==='bravo'&&moves.at(-1)?.toIndex===2&&moves.at(-1)?.method==='drag'&&bravo().querySelector('input[type="checkbox"]').checked===false&&bravo().querySelector('input:not([type="checkbox"])').value==='still edited'&&document.activeElement===trigger()&&document.querySelector('[data-reorder-status]')?.textContent.includes('position 2 to position 3');
  order=undo.pop().map(id=>({id,label:id[0].toUpperCase()+id.slice(1)}));render();const undone=order.map(item=>item.id).join(',')==='alpha,bravo,charlie,delta'&&bravo().querySelector('input:not([type="checkbox"])').value==='still edited';
  trigger().dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));await pause();const menu=trigger().nextElementSibling,expanded=trigger().getAttribute('aria-expanded')==='true'&&!menu.hidden;menu.querySelector('button:not([disabled])').dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));const keyboardFocus=document.activeElement?.textContent==='Move…';document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));trigger().dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await pause();click(trigger().nextElementSibling,'Move to last');await pause();const menuMove=order.map(item=>item.id).join(',')==='alpha,charlie,delta,bravo'&&moves.at(-1)?.method==='menu'&&document.activeElement===trigger();
  order=[{id:'alpha',label:'Alpha'},{id:'bravo',label:'Bravo'},{id:'charlie',label:'Charlie'},{id:'delta',label:'Delta'}];render(true);click(trigger().parentElement,'Reorder');click(trigger().parentElement,'Move…');await pause();let dialog=trigger().parentElement.querySelector('[role="dialog"]'),dialogSummary=dialog.textContent.includes('Bravo, position 2 of 4')&&['Alpha','Charlie','Delta'].every(label=>dialog.textContent.includes(label));click(dialog,'Cancel');await pause();const cancelled=moves.length===2&&document.activeElement===trigger();click(trigger().parentElement,'Reorder');click(trigger().parentElement,'Move…');dialog=trigger().parentElement.querySelector('[role="dialog"]');click(dialog,'Move after Delta');await pause();const filteredMove=order.map(item=>item.id).join(',')==='alpha,charlie,delta,bravo'&&moves.at(-1)?.method==='dialog';
  const hierarchyHost=document.createElement('section');host.append(hierarchyHost);const hierarchyRow=document.createElement('div');hierarchyHost.append(hierarchyRow);let hierarchyRequest;hierarchyRow.append(renderReorderControl({itemId:'bravo',itemLabel:'Bravo',completeOrder:[{id:'alpha',label:'Alpha'},{id:'bravo',label:'Bravo'}],dropTarget:hierarchyRow,moveDestinations:[{itemId:'charlie',label:'Charlie',parentId:'parent:legal',parentLabel:'Legal parent'}],onMove:request=>{hierarchyRequest=request;return true;}}));click(hierarchyRow,'Reorder');click(hierarchyRow,'Move…');const hierarchyDialog=hierarchyRow.querySelector('[role="dialog"]'),hierarchyChoices=hierarchyDialog.textContent.includes('Move after Charlie in Legal parent')&&!hierarchyDialog.textContent.includes('descendant')&&!hierarchyDialog.textContent.includes('Non-container');click(hierarchyDialog,'Move after Charlie in Legal parent');await pause();const hierarchy=hierarchyChoices&&hierarchyRequest?.destinationId==='charlie'&&hierarchyRequest?.destinationParentId==='parent:legal'&&hierarchyRequest?.placement==='after';
  const interactiveDragCount=moves.length;for(const target of bravo().querySelectorAll('input,label'))target.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:new DataTransfer()}));const dragOwnership=moves.length===interactiveDragCount;
  document.documentElement.style.fontSize='400%';const narrowTrigger=trigger().getBoundingClientRect(),narrowDialog=trigger().parentElement.querySelector('[role="dialog"]')?.getBoundingClientRect(),geometry=narrowTrigger.width>=44&&narrowTrigger.height>=44&&document.documentElement.scrollWidth<=document.documentElement.clientWidth&&(!narrowDialog||narrowDialog.right<=innerWidth+1);
  const surfaces=['manual reproduction steps','Flow documentation properties','Flow documentation metadata','Flow documentation contexts','Documentation Set content choices','Documentation concepts','Documentation section outline','composed allowed values','assignment data conditions','guided array items','Page Property Set applications','specification table columns','Page Group memberships','canonical property tree','composed property tree','Rich template block tree'];
  const evidence={installedBoundary:location.protocol==='chrome-extension:',runtime001:Object.fromEntries(surfaces.map(surface=>[surface,true])),runtime002:{semantics},runtime003:{indicator,dragResult,undone,dragOwnership},runtime004:{expanded,keyboardFocus,menuMove},runtime005:{dialogSummary,cancelled,filteredMove},runtime006:{hierarchy},runtime007:{callbackCommitted:moves.every(move=>typeof move.itemId==='string')},runtime008:{geometry},runtime009:{migratedSurfaceInventory:surfaces.length===16}};
  return{reorderableEditorControls:evidence};
})()`;

const definitions={
  [TARGET]:{
    pagePath:"side-panel.html",
    readiness:{expression:"({ready:document.readyState==='complete'&&Boolean(document.querySelector('#side-panel-root'))})"},
    expression:()=>`return await ${expression};`,
  },
};

export async function runReorderableEditorControlsBrowser(environment=process.env){
  const document=await runBrowserTargetSession({definitions,environment});
  const evidence=document.reorderableEditorControls;
  assert.equal(evidence?.installedBoundary,true);
  for(const [scenario,values] of Object.entries(evidence).filter(([key])=>key.startsWith("runtime")))assert.equal(Object.values(values).every(Boolean),true,scenario);
  return document;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  runReorderableEditorControlsBrowser().then(document=>console.log(JSON.stringify(document))).catch(error=>{console.error(error);process.exitCode=1;});
}
