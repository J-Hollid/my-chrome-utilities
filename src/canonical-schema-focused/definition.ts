import type {CanonicalPropertyNode,CanonicalPropertyType} from "../data-layer-canonical-schema.js";
import type {CanonicalFocusedSectionContext} from "../data-layer-canonical-schema-focused-sections.js";
import {applyStructure,renderCanonicalStructuralControls} from "./structure.js";
import {button,input,labeled} from "./dom.js";

const types:CanonicalPropertyType[]=["string","number","integer","boolean","object","array","null"];

export function renderDefinitionSection(host:HTMLElement,context:CanonicalFocusedSectionContext,working:CanonicalPropertyNode):void {
  const {dom}=context,name=input(dom,"propertyName",working.name),type=dom.createElement("select"),itemType=dom.createElement("select");type.name="propertyType";type.append(...types.map((entry)=>new Option(entry,entry)));type.value=working.type;name.addEventListener("input",()=>{const next=context.getWorking();if(next)next.name=name.value;});type.addEventListener("change",()=>{const next=context.getWorking();if(next)next.type=type.value as CanonicalPropertyType;});
  const rename=button(dom,"Rename",()=>{const next=context.getWorking();if(next){context.feedback(`Staged rename for ${next.name}. Review changes to confirm.`);context.render();}}),addChild=button(dom,"Add child",()=>{const next=context.getWorking();if(!next)return;context.stageStructure({kind:"add",propertyId:next.id,parentId:next.id,name:"child",type:"string",id:context.id});}),addSibling=button(dom,"Add sibling",()=>{const next=context.getWorking();if(!next)return;context.stageStructure({kind:"add",propertyId:next.id,...(next.parentId?{parentId:next.parentId}:{}),afterId:next.id,name:"property",type:"string",id:context.id});});
  itemType.name="itemType";itemType.append(new Option("No item type",""),...types.map((entry)=>new Option(entry,entry)));itemType.value=working.itemType??"";itemType.disabled=working.type!=="array";itemType.addEventListener("change",()=>{const next=context.getWorking();if(next&&next.type==="array")next.itemType=itemType.value as CanonicalPropertyType||undefined;});host.append(labeled(dom,"Property name",name),labeled(dom,"Type",type),labeled(dom,"Array item type",itemType),rename,addChild,addSibling,...renderCanonicalStructuralControls(dom,context,working));
}
