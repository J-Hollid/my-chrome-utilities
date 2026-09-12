import assert from "node:assert/strict";

import { SchemaGuidedValidationController } from "../../../dist/data-layer-installed/schemas/guided-validation-controller.js";

class Element extends EventTarget {
  children=[];dataset={};hidden=false;value="";textContent="";open=false;disabled=false;
  append(...children){this.children.push(...children);} replaceChildren(...children){this.children=children;}
  setAttribute(name,value){this[name]=value;} showModal(){this.open=true;} close(){this.open=false;} focus(){this.focused=true;}
}
const document={createElement:()=>new Element()},host=new Element(),trigger=new Element(),storage={getItem:()=>null,setItem(){}};
let schemas=[{id:"saved",name:"Saved",version:2,published:true,document:{type:"object",properties:{}},assignments:[],workingDraft:{baseVersion:2,sourceVersion:2,document:{type:"object",properties:{}},assignments:[],pendingChanges:[]}}];
let durableCalls=0,restored=false,message="";
const controller=new SchemaGuidedValidationController(storage);controller.configure({root:{querySelector:()=>null},guidedRoot:host,document,schemas:()=>schemas,
  replaceSchemas:(next)=>{schemas=structuredClone(next);},persistSchemas(){},renderSchemas(){},openDraft(){},restoreCapture:()=>{restored=true;},scheduleFrame:(run)=>run(),generation:()=>1,
  selectSchema(){},result:(value)=>{message=value;},expansionRules:()=>[],replaceExpansionRules(){},rules:()=>[],replaceRules(){},applyPersistence(next){schemas=structuredClone(next);},
  beginPersistence:async()=>{durableCalls+=1;}});
controller.select({sourceId:"page",name:"purchase"},"saved");
const event={id:"event",sourceId:"page",name:"purchase",payload:{product:{name:"Phone",price:25},consent:false},rawInput:{}};
assert.equal(controller.openLiveSchemaBulk(event,trigger),true);assert.equal(host.hidden,false);
let dialog=host.children[0],form=dialog.children[1],destination=form.children[0];assert.equal(destination.value,"saved");
assert.match(dialog.children[3].textContent,/add/u);dialog.children[4].dispatchEvent(new Event("click"));await new Promise((resolve)=>setTimeout(resolve,0));
assert.equal(durableCalls,1);assert.equal(schemas[0].workingDraft.document.properties.product.properties.price.type,"number");assert.equal(restored,true);
assert.match(message,/observed properties were added/u);assert.equal(trigger.focused,true);assert.equal(host.children.length,0);

controller.openLiveSchemaBulk(event,trigger);dialog=host.children[0];dialog.children[4].dispatchEvent(new Event("click"));await new Promise((resolve)=>setTimeout(resolve,0));
assert.equal(durableCalls,1,"a repeated import makes no durable write");
dialog.dispatchEvent(new Event("cancel",{cancelable:true}));assert.equal(host.children.length,0);assert.equal(trigger.focused,true);
console.log("live Add all to schema controller tests passed");
