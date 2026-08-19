import {
  reorderControlModel,
  reorderPlacementIndex,
  type ReorderActionId,
  type ReorderableItem,
} from "./model.js";

export interface ReorderRequest {
  itemId:string;
  fromIndex:number;
  toIndex:number;
  method:"menu"|"dialog"|"drag";
}

export interface ReorderControlOptions<T extends ReorderableItem> {
  itemId:string;
  itemLabel:string;
  completeOrder:readonly T[];
  onMove:(request:ReorderRequest)=>void|boolean;
  dropTarget?:HTMLElement;
  orderedContainer?:HTMLElement;
  legalDestinationIds?:readonly string[];
  filterActive?:boolean;
  scopeLabel?:string;
  preserveTargetSemantics?:boolean;
}

let identity=0;
let draggedItemId:string|undefined;
const liveRegions=new WeakMap<Document,HTMLOutputElement>();

const clearDropIndicator=(target:HTMLElement):void=>{
  target.classList.remove("reorder-drop-before","reorder-drop-after");
  styles(target,{borderBlockStart:"",borderBlockEnd:""});
};

const button=(doc:Document,label:string):HTMLButtonElement=>{
  const control=doc.createElement("button");control.type="button";control.textContent=label;return control;
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

const stableTrigger=(doc:Document,itemId:string,fallback:HTMLButtonElement):HTMLButtonElement=>
  doc.querySelector?.<HTMLButtonElement>(`[data-reorder-item-id="${itemId.replaceAll('"','\\"')}"]`)??fallback;

function focusTrigger(doc:Document,itemId:string,fallback:HTMLButtonElement):void {
  queueMicrotask(()=>stableTrigger(doc,itemId,fallback).focus({preventScroll:true}));
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
  wrapper.className="reorderable-editor-control";styles(wrapper,{display:"inline-flex",position:"relative"});
  trigger.className="reorderable-editor-trigger";trigger.dataset.reorderTrigger="true";trigger.dataset.reorderItemId=options.itemId;
  trigger.setAttribute("data-reorder-trigger","true");trigger.setAttribute("data-reorder-item-id",options.itemId);
  trigger.setAttribute("aria-label",model.accessibleName);trigger.setAttribute("aria-haspopup","menu");
  trigger.setAttribute("aria-expanded","false");trigger.setAttribute("aria-controls",menuId);
  trigger.draggable=model.canDrag;styles(trigger,{minWidth:"44px",minHeight:"44px",touchAction:"manipulation"});
  menu.id=menuId;menu.setAttribute("role","menu");menu.hidden=true;menu.className="reorderable-editor-menu";
  styles(menu,{position:"absolute",zIndex:"20",maxWidth:"calc(100vw - 16px)",insetInlineStart:"0",top:"100%"});
  dialog.id=dialogId;dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");dialog.setAttribute("aria-label",`Move ${options.itemLabel}`);dialog.hidden=true;
  dialog.className="reorderable-editor-dialog";styles(dialog,{position:"fixed",zIndex:"30",maxWidth:"calc(100vw - 16px)",maxHeight:"calc(100vh - 16px)",overflow:"auto"});

  const closeMenu=()=>{menu.hidden=true;trigger.setAttribute("aria-expanded","false");};
  const openMenu=()=>{menu.hidden=false;trigger.setAttribute("aria-expanded","true");queueMicrotask(()=>menu.querySelector?.<HTMLButtonElement>('button:not([disabled])')?.focus());};
  const announceAndFocus=(fromIndex:number,toIndex:number,result:void|boolean)=>{
    if(result===false)return;
    liveRegion(doc).textContent=`${options.itemLabel} moved from position ${fromIndex+1} to position ${toIndex+1}`;
    focusTrigger(doc,options.itemId,trigger);
  };
  const move=(toIndex:number,method:ReorderRequest["method"])=>{
    const fromIndex=options.completeOrder.findIndex(({id})=>id===options.itemId);
    if(fromIndex<0||fromIndex===toIndex)return;
    const result=options.onMove({itemId:options.itemId,fromIndex,toIndex,method});
    announceAndFocus(fromIndex,toIndex,result);
  };
  const closeDialog=()=>{dialog.hidden=true;focusTrigger(doc,options.itemId,trigger);};
  const openDialog=()=>{
    closeMenu();dialog.replaceChildren();
    const summary=doc.createElement("p");summary.textContent=`${options.itemLabel}, position ${model.position} of ${model.count}`;
    dialog.append(summary);
    if(model.guidance)dialog.append(Object.assign(doc.createElement("p"),{textContent:model.guidance}));
    for(const destination of model.destinations){
      for(const placement of["before","after"] as const){
        const control=button(doc,`Move ${placement} ${destination.label}`);
        control.addEventListener("click",()=>{const toIndex=reorderPlacementIndex(options.completeOrder,options.itemId,destination.itemId,placement);dialog.hidden=true;move(toIndex,"dialog");});
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
  trigger.addEventListener("dragstart",event=>{if(!model.canDrag){event.preventDefault();return;}draggedItemId=options.itemId;event.dataTransfer?.setData("application/x-reorderable-editor-item",options.itemId);});
  trigger.addEventListener("dragend",()=>{draggedItemId=undefined;if(options.dropTarget)clearDropIndicator(options.dropTarget);});
  dialog.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();closeDialog();}});

  if(options.orderedContainer)options.orderedContainer.setAttribute("role","list");
  if(options.dropTarget){
    const target=options.dropTarget;target.draggable=false;
    if(!options.preserveTargetSemantics){target.setAttribute("role","listitem");target.setAttribute("aria-label",options.itemLabel);target.setAttribute("aria-posinset",String(model.position));target.setAttribute("aria-setsize",String(model.count));}
    target.addEventListener("dragover",event=>{if(!model.canDrag||!draggedItemId||draggedItemId===options.itemId)return;event.preventDefault();const after=event.clientY>=target.getBoundingClientRect().top+target.getBoundingClientRect().height/2;target.classList.toggle("reorder-drop-before",!after);target.classList.toggle("reorder-drop-after",after);styles(target,{borderBlockStart:after?"":"3px solid currentColor",borderBlockEnd:after?"3px solid currentColor":""});});
    target.addEventListener("dragleave",()=>clearDropIndicator(target));
    target.addEventListener("drop",event=>{const itemId=event.dataTransfer?.getData("application/x-reorderable-editor-item")||draggedItemId;if(!model.canDrag||!itemId||itemId===options.itemId)return;event.preventDefault();const after=event.clientY>=target.getBoundingClientRect().top+target.getBoundingClientRect().height/2,fromIndex=options.completeOrder.findIndex(({id})=>id===itemId),toIndex=reorderPlacementIndex(options.completeOrder,itemId,options.itemId,after?"after":"before"),itemLabel=options.completeOrder.find(({id})=>id===itemId)?.label??itemId;clearDropIndicator(target);draggedItemId=undefined;if(fromIndex<0||fromIndex===toIndex)return;const result=options.onMove({itemId,fromIndex,toIndex,method:"drag"});if(result===false)return;liveRegion(doc).textContent=`${itemLabel} moved from position ${fromIndex+1} to position ${toIndex+1}`;focusTrigger(doc,itemId,trigger);});
  }

  wrapper.append(trigger,menu,dialog);return wrapper;
}
