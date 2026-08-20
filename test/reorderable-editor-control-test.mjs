import assert from "node:assert/strict";

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
  replaceChildren(...children){this.children=[];this.append(...children);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=undefined;}
  setAttribute(name,value){this.attributes.set(name,String(value));}
  getAttribute(name){return this.attributes.get(name)??null;}
  removeAttribute(name){this.attributes.delete(name);}
  addEventListener(name,listener){const listeners=this.listeners.get(name)??[];listeners.push(listener);this.listeners.set(name,listeners);}
  dispatch(name,values={}){const event={target:this,currentTarget:this,key:"",clientY:0,preventDefault(){this.defaultPrevented=true;},stopPropagation(){},...values};for(const listener of this.listeners.get(name)??[])listener(event);return event;}
  click(){this.dispatch("click");}
  focus(){this.ownerDocument.activeElement=this;}
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
  querySelector(selector){return this.body.querySelector(selector);}
}

const document=new FakeDocument();
globalThis.document=document;

const {renderReorderControl}=await import("../dist/reorderable-editor/control.js");
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
assert.equal(row.draggable,false,"interactive row body never becomes the drag source");
assert.equal(row.getAttribute("role"),"listitem");
assert.equal(row.getAttribute("aria-posinset"),"2");
assert.equal(row.getAttribute("aria-setsize"),"3");
assert.ok(!trigger.attributes.has("aria-grabbed"));
assert.ok(Number(trigger.style.minWidth.replace("px",""))>=44);
assert.ok(Number(trigger.style.minHeight.replace("px",""))>=44);

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

console.log("reorderable editor control tests passed");
