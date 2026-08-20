import {
  reorderControlModel,
  reorderPlacementIndex,
  type ReorderActionId,
  type ReorderDestination,
  type ReorderableItem,
} from "./model.js";

export interface ReorderRequest {
  itemId:string;
  fromIndex:number;
  toIndex:number;
  method:"menu"|"dialog"|"drag";
  destinationId?:string;
  destinationParentId?:string|null;
  placement?:"before"|"after";
}

export interface ReorderControlOptions<T extends ReorderableItem> {
  itemId:string;
  itemLabel:string;
  completeOrder:readonly T[];
  onMove:(request:ReorderRequest)=>boolean;
  dropTarget?:HTMLElement;
  orderedContainer?:HTMLElement;
  focusScope?:ParentNode;
  focusScopeId?:string;
  legalDestinationIds?:readonly string[];
  moveDestinations?:readonly ReorderDestination[];
  dragScopeId?:string;
  filterActive?:boolean;
  localDraftUndo?:boolean;
  scopeLabel?:string;
  preserveTargetSemantics?:boolean;
}

let identity=0;
interface DragSession {
  itemId:string;
  itemLabel:string;
  completeOrder:readonly ReorderableItem[];
  legalDestinationIds:ReadonlySet<string>;
  dragScope:string|HTMLElement;
  onMove:(request:ReorderRequest)=>boolean;
  offerUndo?:(fromIndex:number,toIndex:number)=>void;
  trigger:HTMLButtonElement;
}
let dragSession:DragSession|undefined;
const liveRegions=new WeakMap<Document,HTMLOutputElement>();
const undoRegions=new WeakMap<Document,HTMLElement>();
const localDraftMoves=new WeakMap<HTMLButtonElement,(request:ReorderRequest)=>boolean>();
interface TriggerScope {root:ParentNode;id?:string}
const triggerScopes=new WeakMap<HTMLButtonElement,TriggerScope>();

const focusKey=(scopeId:string,itemId:string):string=>`${encodeURIComponent(scopeId)}|${encodeURIComponent(itemId)}`;

const clearDropIndicator=(target:HTMLElement):void=>{
  target.classList.remove("reorder-drop-before","reorder-drop-after");
  styles(target,{borderBlockStart:"",borderBlockEnd:""});
};

const button=(doc:Document,label:string):HTMLButtonElement=>{
  const control=doc.createElement("button");control.type="button";control.textContent=label;
  styles(control,{boxSizing:"border-box",maxWidth:"100%",whiteSpace:"normal",overflowWrap:"anywhere"});return control;
};

const styles=(element:HTMLElement,values:Record<string,string>):void=>{
  if(!element.style)return;
  Object.assign(element.style,values);
};

function liveRegion(doc:Document):HTMLOutputElement {
  const existing=liveRegions.get(doc);if(existing)return existing;
  const output=doc.createElement("output");output.dataset.reorderStatus="true";
  output.setAttribute("data-reorder-status","true");output.setAttribute("aria-live","polite");output.setAttribute("aria-atomic","true");
  styles(output,{position:"absolute",width:"1px",height:"1px",overflow:"hidden",clipPath:"inset(50%)"});
  (doc.body??doc.documentElement)?.append?.(output);liveRegions.set(doc,output);return output;
}

const stableTrigger=(doc:Document,itemId:string,fallback:HTMLButtonElement):HTMLButtonElement=>{
  const origin=triggerScopes.get(fallback),itemSelector=`[data-reorder-item-id="${itemId.replaceAll('"','\\"')}"]`,
    selector=origin?.id?`[data-reorder-focus-key="${focusKey(origin.id,itemId)}"]`:itemSelector;
  const scoped=origin?.root.querySelector?.<HTMLButtonElement>(selector);
  return scoped?.isConnected?scoped:doc.querySelector?.<HTMLButtonElement>(selector)??fallback;
};

function focusTrigger(doc:Document,itemId:string,fallback:HTMLButtonElement):void {
  const origin=triggerScopes.get(fallback);
  if(origin?.id&&typeof MutationObserver!=="undefined"){
    const observer=new MutationObserver(()=>{
      if(fallback.isConnected)return;
      const replacement=stableTrigger(doc,itemId,fallback);
      if(replacement===fallback||!replacement.isConnected)return;
      observer.disconnect();clearTimeout(expiry);replacement.focus({preventScroll:true});
    }),expiry=setTimeout(()=>observer.disconnect(),1000);
    observer.observe(doc.documentElement??origin.root as Node,{childList:true,subtree:true});
  }
  queueMicrotask(()=>stableTrigger(doc,itemId,fallback).focus({preventScroll:true}));
}

export interface ReorderCompletion {
  itemId:string;
  itemLabel:string;
  fromIndex:number;
  toIndex:number;
  fallbackTrigger?:HTMLButtonElement;
}

export function announceReorderCompletion(doc:Document,completion:ReorderCompletion):void {
  liveRegion(doc).textContent=`${completion.itemLabel} moved from position ${completion.fromIndex+1} to position ${completion.toIndex+1}`;
  const fallback=completion.fallbackTrigger??doc.querySelector?.<HTMLButtonElement>(`[data-reorder-item-id="${completion.itemId.replaceAll('"','\\"')}"]`);
  if(fallback)focusTrigger(doc,completion.itemId,fallback);
}

function undoRegion(doc:Document):HTMLElement {
  const existing=undoRegions.get(doc);if(existing)return existing;
  const region=doc.createElement("div");region.dataset.reorderUndo="true";region.setAttribute("data-reorder-undo","true");region.hidden=true;
  (doc.body??doc.documentElement)?.append?.(region);undoRegions.set(doc,region);return region;
}

function legalOrder<T extends ReorderableItem>(options:ReorderControlOptions<T>):readonly T[] {
  if(!options.legalDestinationIds)return options.completeOrder;
  const ids=new Set([...options.legalDestinationIds,options.itemId]);
  return options.completeOrder.filter(({id})=>ids.has(id));
}

function actionIndex<T extends ReorderableItem>(options:ReorderControlOptions<T>,action:Exclude<ReorderActionId,"move">):number {
  const scoped=legalOrder(options),index=scoped.findIndex(({id})=>id===options.itemId);
  if(index<0)return options.completeOrder.findIndex(({id})=>id===options.itemId);
  const target=action==="first"?scoped[0]:action==="last"?scoped.at(-1):
    action==="earlier"?scoped[index-1]:scoped[index+1];
  if(!target)return options.completeOrder.findIndex(({id})=>id===options.itemId);
  return reorderPlacementIndex(options.completeOrder,options.itemId,target.id,
    action==="first"||action==="earlier"?"before":"after");
}

export function renderReorderControl<T extends ReorderableItem>(options:ReorderControlOptions<T>):HTMLElement {
  const doc=options.dropTarget?.ownerDocument??globalThis.document,model=reorderControlModel(options);
  const wrapper=doc.createElement("span"),trigger=button(doc,"Reorder"),menu=doc.createElement("div"),dialog=doc.createElement("div");
  const menuId=`reorder-menu-${++identity}`,dialogId=`reorder-dialog-${identity}`;
  wrapper.className="reorderable-editor-control";styles(wrapper,{display:"inline-flex",position:"relative",maxWidth:"100%"});
  trigger.className="reorderable-editor-trigger";trigger.dataset.reorderTrigger="true";trigger.dataset.reorderItemId=options.itemId;
  if(options.focusScopeId){const key=focusKey(options.focusScopeId,options.itemId);trigger.dataset.reorderFocusKey=key;trigger.setAttribute("data-reorder-focus-key",key);}
  if(options.localDraftUndo)localDraftMoves.set(trigger,options.onMove);
  triggerScopes.set(trigger,{root:options.focusScope??options.orderedContainer??options.dropTarget?.parentElement??options.dropTarget??doc,...(options.focusScopeId?{id:options.focusScopeId}:{})});
  trigger.setAttribute("data-reorder-trigger","true");trigger.setAttribute("data-reorder-item-id",options.itemId);
  trigger.setAttribute("aria-label",model.accessibleName);trigger.setAttribute("aria-haspopup","menu");
  trigger.setAttribute("aria-expanded","false");trigger.setAttribute("aria-controls",menuId);
  const currentDragScope=()=>options.dragScopeId??options.orderedContainer??options.dropTarget?.parentElement??undefined;
  trigger.draggable=model.canDrag&&Boolean(options.dragScopeId??options.orderedContainer??options.dropTarget);styles(trigger,{minWidth:"44px",minHeight:"44px",touchAction:"manipulation"});
  menu.id=menuId;menu.setAttribute("role","menu");menu.hidden=true;menu.className="reorderable-editor-menu";
  styles(menu,{position:"absolute",zIndex:"20",maxWidth:"calc(100vw - 16px)",insetInlineStart:"0",top:"100%"});
  dialog.id=dialogId;dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");dialog.setAttribute("aria-label",`Move ${options.itemLabel}`);dialog.hidden=true;
  dialog.className="reorderable-editor-dialog";styles(dialog,{position:"fixed",zIndex:"30",inset:"8px",maxWidth:"calc(100vw - 16px)",maxHeight:"calc(100vh - 16px)",overflow:"auto",overflowWrap:"anywhere"});

  const closeMenu=()=>{menu.hidden=true;trigger.setAttribute("aria-expanded","false");};
  const openMenu=()=>{menu.hidden=false;trigger.setAttribute("aria-expanded","true");queueMicrotask(()=>menu.querySelector?.<HTMLButtonElement>('button:not([disabled])')?.focus());};
  const announceAndFocus=(fromIndex:number,toIndex:number,result:boolean)=>{
    if(result!==true)return;
    announceReorderCompletion(doc,{itemId:options.itemId,itemLabel:options.itemLabel,fromIndex,toIndex,fallbackTrigger:trigger});
  };
  const offerUndo=(fromIndex:number,toIndex:number)=>{
    if(!options.localDraftUndo)return;
    const region=undoRegion(doc),undo=button(doc,"Undo move");region.replaceChildren(undo);region.hidden=false;
    undo.addEventListener("click",()=>{const currentTrigger=stableTrigger(doc,options.itemId,trigger),apply=localDraftMoves.get(currentTrigger)??options.onMove,result=apply({itemId:options.itemId,fromIndex:toIndex,toIndex:fromIndex,method:"menu"});if(result!==true)return;region.hidden=true;announceReorderCompletion(doc,{itemId:options.itemId,itemLabel:options.itemLabel,fromIndex:toIndex,toIndex:fromIndex,fallbackTrigger:currentTrigger});});
  };
  const move=(toIndex:number,method:ReorderRequest["method"],destination?:ReorderDestination,placement?:"before"|"after")=>{
    const fromIndex=options.completeOrder.findIndex(({id})=>id===options.itemId);
    if(fromIndex<0||(fromIndex===toIndex&&destination?.parentId===undefined))return;
    const result=options.onMove({itemId:options.itemId,fromIndex,toIndex,method,
      ...(destination?{destinationId:destination.itemId,...(destination.parentId!==undefined?{destinationParentId:destination.parentId}:{}),...(placement?{placement}:{})}: {})});
    announceAndFocus(fromIndex,toIndex,result);
    if(result===true)offerUndo(fromIndex,toIndex);
  };
  const closeDialog=()=>{dialog.hidden=true;focusTrigger(doc,options.itemId,trigger);};
  const openDialog=()=>{
    closeMenu();dialog.replaceChildren();
    const summary=doc.createElement("p");summary.textContent=`${options.itemLabel}, position ${model.position} of ${model.count}`;
    dialog.append(summary);
    if(model.guidance)dialog.append(Object.assign(doc.createElement("p"),{textContent:model.guidance}));
    for(const destination of model.destinations){
      for(const placement of["before","after"] as const){
        const location=destination.parentLabel?` in ${destination.parentLabel}`:"";
        const control=button(doc,`Move ${placement} ${destination.label}${location}`);
        control.addEventListener("click",()=>{const toIndex=reorderPlacementIndex(options.completeOrder,options.itemId,destination.itemId,placement);dialog.hidden=true;move(toIndex,"dialog",destination,placement);});
        dialog.append(control);
      }
    }
    const cancel=button(doc,"Cancel");cancel.addEventListener("click",closeDialog);dialog.append(cancel);dialog.hidden=false;
    queueMicrotask(()=>dialog.querySelector?.<HTMLButtonElement>("button")?.focus());
  };

  for(const item of model.actions){
    const control=button(doc,item.label);control.setAttribute("role","menuitem");control.disabled=item.disabled;
    control.addEventListener("click",()=>{if(item.disabled)return;if(item.id==="move"){openDialog();return;}closeMenu();move(actionIndex(options,item.id),"menu");});
    control.addEventListener("keydown",event=>{
      const controls=Array.from(menu.querySelectorAll<HTMLButtonElement>("button")).filter(candidate=>!candidate.disabled),current=controls.indexOf(control);
      if(event.key==="Escape"){event.preventDefault();closeMenu();trigger.focus();return;}
      const next=event.key==="ArrowDown"?current+1:event.key==="ArrowUp"?current-1:event.key==="Home"?0:event.key==="End"?controls.length-1:-1;
      if(next<0)return;event.preventDefault();controls[(next+controls.length)%controls.length]?.focus();
    });
    menu.append(control);
  }
  trigger.addEventListener("click",()=>menu.hidden?openMenu():closeMenu());
  trigger.addEventListener("keydown",event=>{if([" ","Enter","ArrowDown"].includes(event.key)){event.preventDefault();openMenu();}else if(event.key==="Escape")closeMenu();});
  trigger.addEventListener("dragstart",event=>{const dragScope=currentDragScope();if(!model.canDrag||dragScope===undefined){event.preventDefault();dragSession=undefined;return;}dragSession={itemId:options.itemId,itemLabel:options.itemLabel,completeOrder:options.completeOrder,legalDestinationIds:new Set(options.legalDestinationIds??options.completeOrder.map(({id})=>id)),dragScope,onMove:options.onMove,...(options.localDraftUndo?{offerUndo}:{}),trigger};event.dataTransfer?.setData("application/x-reorderable-editor-item",options.itemId);});
  trigger.addEventListener("dragend",()=>{dragSession=undefined;if(options.dropTarget)clearDropIndicator(options.dropTarget);});
  dialog.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();closeDialog();}});

  if(options.orderedContainer)options.orderedContainer.setAttribute("role","list");
  if(options.dropTarget){
    const target=options.dropTarget;target.draggable=false;
    if(!options.preserveTargetSemantics){target.setAttribute("role","listitem");target.setAttribute("aria-label",options.itemLabel);target.setAttribute("aria-posinset",String(model.position));target.setAttribute("aria-setsize",String(model.count));}
    const legalDrag=():DragSession|undefined=>{const session=dragSession,dragScope=currentDragScope();if(!session||session.itemId===options.itemId||!session.legalDestinationIds.has(options.itemId)||dragScope===undefined||session.dragScope!==dragScope)return undefined;return session;};
    target.addEventListener("dragover",event=>{if(!legalDrag())return;event.preventDefault();const after=event.clientY>=target.getBoundingClientRect().top+target.getBoundingClientRect().height/2;target.classList.toggle("reorder-drop-before",!after);target.classList.toggle("reorder-drop-after",after);styles(target,{borderBlockStart:after?"":"3px solid currentColor",borderBlockEnd:after?"3px solid currentColor":""});});
    target.addEventListener("dragleave",()=>clearDropIndicator(target));
    target.addEventListener("drop",event=>{const session=legalDrag(),transferId=event.dataTransfer?.getData("application/x-reorderable-editor-item");if(!session||transferId&&transferId!==session.itemId)return;event.preventDefault();const after=event.clientY>=target.getBoundingClientRect().top+target.getBoundingClientRect().height/2,fromIndex=session.completeOrder.findIndex(({id})=>id===session.itemId),toIndex=reorderPlacementIndex(session.completeOrder,session.itemId,options.itemId,after?"after":"before");clearDropIndicator(target);dragSession=undefined;if(fromIndex<0||fromIndex===toIndex)return;const result=session.onMove({itemId:session.itemId,fromIndex,toIndex,method:"drag",destinationId:options.itemId,placement:after?"after":"before"});if(result!==true)return;announceReorderCompletion(doc,{itemId:session.itemId,itemLabel:session.itemLabel,fromIndex,toIndex,fallbackTrigger:session.trigger});session.offerUndo?.(fromIndex,toIndex);});
  }

  wrapper.append(trigger,menu,dialog);return wrapper;
}

export function renderLocalDraftReorderControl<T extends ReorderableItem>(options:ReorderControlOptions<T>):HTMLElement {
  return renderReorderControl({...options,localDraftUndo:true});
}
