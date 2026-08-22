import assert from "node:assert/strict";
import {focusableOverlayControls,overlayFocusabilityRepairProtocol} from "./support/layered-schema-overlay-focusability.mjs";

class FakeElement {
  constructor(tagName,ownerDocument) {
    this.tagName=tagName.toUpperCase();
    this.ownerDocument=ownerDocument;
    this.children=[];
    this.attributes=new Map();
    this.listeners=new Map();
    this.dataset={};
    this.style={setProperty:(name,value)=>this.style[name]=value};
    this.classList={add:(...names)=>names.forEach(name=>this.classes.add(name)),remove:(...names)=>names.forEach(name=>this.classes.delete(name)),toggle:(name,enabled)=>enabled?this.classes.add(name):this.classes.delete(name)};
    this.classes=new Set();
    this.textContent="";
    this.hidden=false;
    this.disabled=false;
    this.draggable=false;
  }
  append(...children){for(const child of children){if(child instanceof FakeElement){child.remove();child.parent=this;}this.children.push(child);}}
  prepend(...children){for(const child of children){if(child instanceof FakeElement){child.remove();child.parent=this;}}this.children=[...children,...this.children];}
  replaceChildren(...children){for(const child of this.children)if(child instanceof FakeElement)child.parent=undefined;this.children=[];this.append(...children);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=undefined;}
  setAttribute(name,value){this.attributes.set(name,String(value));}
  getAttribute(name){return this.attributes.get(name)??null;}
  removeAttribute(name){this.attributes.delete(name);}
  addEventListener(name,listener){const listeners=this.listeners.get(name)??[];listeners.push(listener);this.listeners.set(name,listeners);}
  dispatch(name,values={}){const event={target:this,currentTarget:this,key:"",clientY:0,preventDefault(){this.defaultPrevented=true;},stopPropagation(){},...values};for(const listener of this.listeners.get(name)??[])listener(event);return event;}
  click(){this.dispatch("click");}
  focus(){this.ownerDocument.activeElement=this;}
  get isConnected(){for(let node=this;node;node=node.parent)if(node===this.ownerDocument.body)return true;return false;}
  querySelector(selector){return descendants(this).find(element=>matches(element,selector))??null;}
  querySelectorAll(selector){return descendants(this).filter(element=>matches(element,selector));}
  getBoundingClientRect(){return{top:0,height:40,left:0,width:200};}
}

const matches=(element,selector)=>{
  if(selector==="button")return element.tagName==="BUTTON";
  const attribute=selector.match(/^\[([^=\]]+)(?:=['"]?([^'"]+)['"]?)?\]$/);
  if(!attribute)return false;
  const value=element.getAttribute(attribute[1])??element.dataset[attribute[1].replace(/^data-/u,"").replace(/-([a-z])/gu,(_,letter)=>letter.toUpperCase())];
  return attribute[2]===undefined?value!==undefined:value===attribute[2];
};
const descendants=(root)=>root.children.flatMap(child=>child instanceof FakeElement?[child,...descendants(child)]:[]);

class FakeDocument {
  constructor(){this.body=new FakeElement("body",this);this.activeElement=this.body;}
  createElement(tagName){return new FakeElement(tagName,this);}
  createElementNS(_namespace,tagName){return this.createElement(tagName);}
  querySelector(selector){return this.body.querySelector(selector);}
}

const document=new FakeDocument();
globalThis.document=document;

const {announceReorderCompletion,renderReorderControl}=await import("../dist/reorderable-editor/control.js");
const order=[{id:"alpha",label:"Alpha"},{id:"bravo",label:"Bravo"},{id:"charlie",label:"Charlie"}];
const row=document.createElement("li"),moves=[];
document.body.append(row);
const control=renderReorderControl({
  itemId:"bravo",
  itemLabel:"Bravo",
  completeOrder:order,
  dropTarget:row,
  filterActive:true,
  onMove:(request)=>{moves.push(request);return true;},
});
row.append(control);

const trigger=control.querySelector("[data-reorder-trigger]");
assert.ok(trigger);
assert.equal(trigger.getAttribute("aria-label"),"Reorder Bravo, position 2 of 3");
assert.equal(trigger.getAttribute("aria-haspopup"),"menu");
assert.equal(trigger.getAttribute("aria-expanded"),"false");
assert.equal(trigger.draggable,false,"filtering disables direct dragging");
assert.equal(trigger.textContent,"","the grip button has no visible Reorder text");
const grip=trigger.querySelector("[data-reorder-grip]");
assert.ok(grip,"the pointer target contains an inline grip");
assert.equal(grip.tagName,"SVG");
assert.equal(grip.getAttribute("aria-hidden"),"true");
assert.equal(grip.getAttribute("viewBox"),"0 0 16 16");
assert.equal(grip.style.width,"16px");
assert.equal(grip.style.height,"16px");
assert.equal(grip.children.length,6,"the vertical grip contains six dots");
assert.equal(trigger.style.width,"44px");
assert.equal(trigger.style.height,"44px");
assert.equal(trigger.style.padding,"0px");
assert.equal(trigger.style.background,"transparent");
assert.equal(trigger.style.border,"0px");
assert.equal(trigger.style.boxShadow,"none");
trigger.dispatch("pointerenter");
assert.equal(trigger.dataset.reorderHover,"true");
assert.match(trigger.style.background,/color-mix/u);
trigger.dispatch("pointerleave");
assert.equal(trigger.dataset.reorderHover,undefined);
assert.equal(trigger.style.background,"transparent");
assert.equal(row.draggable,false,"interactive row body never becomes the drag source");
assert.equal(row.getAttribute("role"),"listitem");
assert.equal(row.getAttribute("aria-posinset"),"2");
assert.equal(row.getAttribute("aria-setsize"),"3");
assert.ok(!trigger.attributes.has("aria-grabbed"));
assert.ok(Number(trigger.style.minWidth.replace("px",""))>=44);
assert.ok(Number(trigger.style.minHeight.replace("px",""))>=44);
const filteredTransfer={setCalls:0,setData(){this.setCalls+=1;}};
const filteredDrag=trigger.dispatch("dragstart",{dataTransfer:filteredTransfer});
assert.equal(filteredDrag.defaultPrevented,true,"an active filter rejects dragstart, not only draggable styling");
assert.equal(filteredTransfer.setCalls,0,"a filtered control cannot publish a drag session");

trigger.click();
assert.equal(trigger.getAttribute("aria-expanded"),"true");
const menu=control.querySelector("[role=menu]");
assert.equal(menu.hidden,false);
const actions=menu.querySelectorAll("button");
assert.deepEqual(actions.map(({textContent})=>textContent),[
  "Move to first","Move one position earlier","Move one position later","Move to last","Move…",
]);
actions[3].click();
assert.deepEqual(moves,[{itemId:"bravo",fromIndex:1,toIndex:2,method:"menu"}]);
await new Promise(resolve=>queueMicrotask(resolve));
assert.equal(document.activeElement,trigger,"focus returns to the stable trigger");
assert.equal(document.querySelector("[data-reorder-status]").textContent,
  "Bravo moved from position 2 to position 3");

trigger.click();
actions[4].click();
const dialog=control.querySelector("[role=dialog]");
assert.equal(dialog.hidden,false);
assert.match(dialog.textContent+descendants(dialog).map(({textContent})=>textContent).join(""),/position 2 of 3/u);
assert.deepEqual(dialog.querySelectorAll("button").map(({textContent})=>textContent),[
  "Move before Alpha","Move after Alpha","Move before Charlie","Move after Charlie","Cancel",
]);
dialog.querySelectorAll("button").at(-1).click();
assert.equal(dialog.hidden,true);
assert.equal(document.activeElement,trigger);

const menuOwnedDocument=new FakeDocument(),menuOwnedRow=menuOwnedDocument.createElement("article"),
  actionsTrigger=menuOwnedDocument.createElement("button"),actionsMenu=menuOwnedDocument.createElement("div");
actionsTrigger.textContent="Property actions";actionsTrigger.setAttribute("aria-label","Property actions for /bravo");actionsMenu.setAttribute("role","menu");
menuOwnedDocument.body.append(menuOwnedRow,actionsMenu);
const menuOwnedControl=renderReorderControl({
  focusScopeId:"property-tree",itemId:"bravo",itemLabel:"Bravo",completeOrder:order,
  dropTarget:menuOwnedRow,existingActionsMenu:{trigger:actionsTrigger,menu:actionsMenu,expanded:true},onMove:()=>true,
});
menuOwnedRow.append(menuOwnedControl,actionsTrigger);
const menuOwnedHandle=menuOwnedControl.querySelector("[data-reorder-trigger]");
assert.equal(menuOwnedHandle.tagName,"SPAN","an existing actions menu makes the grip a non-button drag target");
assert.equal(menuOwnedHandle.attributes.has("tabindex"),false,"the non-button grip adds no focus stop");
assert.equal(menuOwnedHandle.draggable,true);
assert.equal(actionsTrigger.getAttribute("aria-haspopup"),"menu");
assert.equal(actionsTrigger.getAttribute("aria-expanded"),"true");
assert.equal(actionsTrigger.getAttribute("aria-controls"),actionsMenu.id);
assert.equal(actionsTrigger.getAttribute("aria-label"),"Property actions for /bravo","existing menu identity remains intact");
assert.equal(actionsTrigger.dataset.reorderMenuButton,"true");
assert.deepEqual(actionsMenu.querySelectorAll("button").map(({textContent})=>textContent),[
  "Move to first","Move one position earlier","Move one position later","Move to last","Move…",
]);
assert.equal(descendants(menuOwnedRow).filter(element=>element.tagName==="BUTTON"&&element.getAttribute("aria-haspopup")==="menu").length,1,
  "the existing actions trigger is the sole movement-menu button");

const dragDocument=new FakeDocument(),dragList=dragDocument.createElement("ol"),dragMoves=[];
dragDocument.body.append(dragList);
let commitDrop=false;
const dragOrder=[{id:"one",label:"One"},{id:"two",label:"Two"},{id:"three",label:"Three"}];
const dragRows=new Map();
for(const entry of dragOrder){
  const dragRow=dragDocument.createElement("li");
  const dragControl=renderReorderControl({
    itemId:entry.id,itemLabel:entry.label,completeOrder:dragOrder,
    legalDestinationIds:entry.id==="two"?["one","two"]:undefined,
    dropTarget:dragRow,orderedContainer:dragList,
    onMove:entry.id==="two"?(request)=>{dragMoves.push(request);return commitDrop;}:
      ()=>{throw new Error("a drop must be committed by the dragged item's callback");},
  });
  dragRow.append(dragControl);dragList.append(dragRow);dragRows.set(entry.id,dragRow);
}
const transfer={value:"",setData(_type,value){this.value=value;},getData(){return this.value;}};
const dragTrigger=dragRows.get("two").querySelector("[data-reorder-trigger]");
assert.equal(dragTrigger.style.cursor,"grab");
dragTrigger.dispatch("dragstart",{dataTransfer:transfer});
assert.equal(dragTrigger.dataset.reorderDragging,"true");
assert.equal(dragTrigger.style.cursor,"grabbing");
dragTrigger.dispatch("dragend");
assert.equal(dragTrigger.dataset.reorderDragging,undefined);
assert.equal(dragTrigger.style.cursor,"grab");
dragTrigger.dispatch("dragstart",{dataTransfer:transfer});
const illegalDrop=dragRows.get("three").dispatch("drop",{dataTransfer:transfer,clientY:39});
assert.equal(illegalDrop.defaultPrevented,undefined,"a target outside the dragged item's legal scope rejects the drop");
assert.deepEqual(dragMoves,[]);

dragTrigger.dispatch("dragstart",{dataTransfer:transfer});
dragRows.get("one").dispatch("drop",{dataTransfer:transfer,clientY:0});
assert.equal(dragMoves.length,1,"the dragged item's callback evaluates a legal drop");
assert.equal(dragDocument.querySelector("[data-reorder-status]"),null,
  "a rejected/no-op callback cannot announce a successful move");

commitDrop=true;
dragTrigger.dispatch("dragstart",{dataTransfer:transfer});
dragRows.get("one").dispatch("drop",{dataTransfer:transfer,clientY:0});
assert.equal(dragMoves.length,2);
assert.equal(dragDocument.querySelector("[data-reorder-status]").textContent,
  "Two moved from position 2 to position 1");

const scopeDocument=new FakeDocument(),leftList=scopeDocument.createElement("ol"),rightList=scopeDocument.createElement("ol"),crossMoves=[];
scopeDocument.body.append(leftList,rightList);
for(const [list,prefix] of [[leftList,"left"],[rightList,"right"]])for(const entry of dragOrder.slice(0,2)){
  const target=scopeDocument.createElement("li"),entryControl=renderReorderControl({
    itemId:entry.id,itemLabel:`${prefix} ${entry.label}`,completeOrder:dragOrder.slice(0,2),dropTarget:target,orderedContainer:list,
    focusScopeId:prefix,
    onMove:(request)=>{crossMoves.push({prefix,request});return true;},
  });
  target.append(entryControl);list.append(target);
}
const scopedTransfer={value:"",setData(_type,value){this.value=value;},getData(){return this.value;}};
leftList.children[1].querySelector("[data-reorder-trigger]").dispatch("dragstart",{dataTransfer:scopedTransfer});
const crossDrop=rightList.children[0].dispatch("drop",{dataTransfer:scopedTransfer,clientY:0});
assert.equal(crossDrop.defaultPrevented,undefined,"a second list with overlapping item identities rejects the foreign session");
assert.deepEqual(crossMoves,[],"a drop never invokes a callback across ordered-container boundaries");
const rightTwo=rightList.children[1].querySelector("[data-reorder-trigger]");
announceReorderCompletion(scopeDocument,{itemId:"two",itemLabel:"right Two",fromIndex:1,toIndex:0,fallbackTrigger:rightTwo});
await new Promise(resolve=>queueMicrotask(resolve));
assert.equal(scopeDocument.activeElement===rightTwo,true,"completion focus stays in the originating ordered container when identities overlap");
const replacementLeft=scopeDocument.createElement("ol"),replacementRight=scopeDocument.createElement("ol");
for(const [list,prefix] of [[replacementLeft,"left"],[replacementRight,"right"]])for(const entry of dragOrder.slice(0,2)){
  const target=scopeDocument.createElement("li"),entryControl=renderReorderControl({
    itemId:entry.id,itemLabel:`${prefix} ${entry.label}`,completeOrder:dragOrder.slice(0,2),dropTarget:target,orderedContainer:list,
    focusScopeId:prefix,onMove:()=>true,
  });
  target.append(entryControl);list.append(target);
}
scopeDocument.body.replaceChildren(replacementLeft,replacementRight);
announceReorderCompletion(scopeDocument,{itemId:"two",itemLabel:"right Two",fromIndex:1,toIndex:0,fallbackTrigger:rightTwo});
await new Promise(resolve=>queueMicrotask(resolve));
const replacementRightTwo=replacementRight.children[1].querySelector("[data-reorder-trigger]");
assert.equal(scopeDocument.activeElement===replacementRightTwo,true,"completion focus stays in the originating list after both ordered containers are replaced");

const undoDocument=new FakeDocument(),undoList=undoDocument.createElement("ol"),undoRow=undoDocument.createElement("li"),undoMoves=[];
undoDocument.body.append(undoList);undoList.append(undoRow);
const undoControl=renderReorderControl({focusScopeId:"undo",itemId:"bravo",itemLabel:"Bravo",completeOrder:order,dropTarget:undoRow,orderedContainer:undoList,localDraftUndo:true,onMove:(request)=>{undoMoves.push(request);return true;}});
undoRow.append(undoControl);undoControl.querySelector("[data-reorder-trigger]").click();undoControl.querySelector("[role=menu]").querySelectorAll("button")[3].click();
const undoMove=undoDocument.querySelector("[data-reorder-undo]");
assert.equal(undoMove.hidden,false,"a successful local-draft move exposes Undo move");
undoMove.querySelector("button").click();
assert.deepEqual(undoMoves.at(-1),{itemId:"bravo",fromIndex:2,toIndex:1,method:"menu"},"Undo move applies the exact inverse position");
assert.equal(undoMove.hidden,true);

announceReorderCompletion(undoDocument,{focusScopeId:"undo",itemId:"bravo",itemLabel:"Bravo",fromIndex:1,toIndex:2});
assert.equal(undoDocument.querySelector("[data-reorder-status]").textContent,"Bravo moved from position 2 to position 3");
await new Promise(resolve=>queueMicrotask(resolve));
assert.equal(undoDocument.activeElement,undoControl.querySelector("[data-reorder-trigger]"),"a deferred consequential completion restores the stable trigger");

const overlayBoundaryControls=[
  {label:"Definition",disabled:false},
  {label:"Move one position later",disabled:true},
  {label:"Move to last",disabled:true},
];
assert.deepEqual(focusableOverlayControls(overlayBoundaryControls).map(({label})=>label),["Definition"],
  "disabled boundary movement commands are not included in an overlay focusability probe");
if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION)console.log(JSON.stringify({
  swarmforgeTimeoutRepairRegression:overlayFocusabilityRepairProtocol(overlayBoundaryControls),
}));

console.log("reorderable editor control tests passed");
