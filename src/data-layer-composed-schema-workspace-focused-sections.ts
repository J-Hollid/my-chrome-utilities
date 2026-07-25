import type {ComposedFacetDraft} from "./data-layer-composed-schema-builders.js";
import {typedComposedValue} from "./data-layer-composed-schema-builders.js";
import type {ComposedSchemaRow,ComposedSchemaWorkspace} from "./data-layer-composed-schema-workspace.js";
import type {FocusedPropertySection} from "./data-layer-focused-schema-property-ui.js";
import {renderComposedFocusedCondition} from "./data-layer-composed-schema-workspace-focused-conditions.js";
import {renderComposedFocusedRules} from "./data-layer-composed-schema-workspace-focused-rules.js";
import type {FlowPageInstanceStructureKind} from "./flow-graph/page-instance-structure.js";

export interface ComposedFocusedSectionContext {
  model:ComposedSchemaWorkspace;
  dom:Document;
  row:ComposedSchemaRow;
  getDraft:()=>ComposedFacetDraft|undefined;
  activeSection:FocusedPropertySection;
  removedRuleIds:Set<string>;
  removedValueIds:Set<string>;
  stagedLocalValueIds:Set<string>;
  overriddenRuleIds:Set<string>;
  overrideRule:(index:number)=>void;
  render:()=>void;
  onStructure?:(kind:FlowPageInstanceStructureKind,path:string,name?:string)=>void|undefined;
}

const labeled=(dom:Document,text:string,control:HTMLElement):HTMLLabelElement=>{const label=dom.createElement("label");label.append(text,control);return label;};
const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
const valueText=(value:unknown):string=>value===undefined?"unset":typeof value==="string"?value:JSON.stringify(value);
const stableValueId=(owner:string,value:unknown):string=>{let hash=2166136261;for(const char of JSON.stringify(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return `allowed-value:${owner}:${(hash>>>0).toString(16)}`;};

export function renderComposedFocusedSection(host:HTMLElement,context:ComposedFocusedSectionContext):void {
  const {dom}=context,draft=context.getDraft();if(!draft)return;host.dataset.focusedSection=context.activeSection;
  if(context.activeSection==="definition"){const type=dom.createElement("select"),itemType=dom.createElement("select");type.name="propertyType";type.append(new Option("Inherit type",""),...["string","number","integer","boolean","object","array","null"].map((entry)=>new Option(entry,entry)));type.value=draft.type??"";itemType.name="itemType";itemType.append(new Option("Inherit item type",""),...["string","number","integer","boolean","object","array","null"].map((entry)=>new Option(entry,entry)));itemType.value=draft.itemType??"";itemType.disabled=draft.type!=="array";type.addEventListener("change",()=>{draft.type=type.value||undefined;itemType.disabled=draft.type!=="array";});itemType.addEventListener("change",()=>{draft.itemType=itemType.value||undefined;});host.append(labeled(dom,"Type",type),labeled(dom,"Array item type",itemType));}
  if(context.activeSection==="presence"){const presence=dom.createElement("select");presence.name="presenceMode";presence.append(new Option("Inherit presence",""),...["required","optional","forbidden","permitted"].map((entry)=>new Option(entry,entry)));presence.value=draft.presence??"";presence.addEventListener("change",()=>{draft.presence=presence.value as any||undefined;});host.append(labeled(dom,"Presence",presence));}
  if(context.activeSection==="values"){const expected=dom.createElement("input"),list=dom.createElement("div");expected.name="expectedValue";expected.setAttribute("aria-label","Expected value");expected.value=valueText(draft.expectedValue);expected.addEventListener("input",()=>{try{draft.expectedValue=expected.value===""?undefined:typedComposedValue(draft.type??context.row.effective.type,expected.value);}catch{}});const inheritedValues=context.row.effective.allowedValues??[],values=[...draft.allowedValues],ids=[...(draft.allowedValueIds??[])],localIds=new Set([...(context.row.local.allowedValueIds??[]),...(context.row.local.allowedValueProvenance??[]).filter(({state})=>state!=="inherited").map(({id})=>id),...context.stagedLocalValueIds,...(context.row.local.allowedValues??[]).map((value)=>stableValueId(`${context.row.path}:local`,value))]);for(let index=0;index<values.length;index++)if(!ids[index])ids[index]=stableValueId(`${context.row.path}:local`,values[index]);inheritedValues.forEach((entry,index)=>{if(!values.some((candidate)=>JSON.stringify(candidate)===JSON.stringify(entry))){values.push(entry);ids.push(context.row.effective.allowedValueIds?.[index]??stableValueId(`${context.row.path}:inherited`,entry));}});if(draft.allowedValueIds?.length!==ids.length)draft.allowedValueIds=ids.slice(0,draft.allowedValues.length);values.forEach((entry,index)=>{const valueId=ids[index]??stableValueId(`${context.row.path}:inherited`,entry),removed=context.removedValueIds.has(valueId),isLocal=localIds.has(valueId),control=dom.createElement("input");control.value=valueText(entry);control.setAttribute("aria-label",`Allowed value ${index+1}`);control.disabled=removed||!isLocal;control.addEventListener("input",()=>{try{const current=draft.allowedValues.findIndex((candidate)=>JSON.stringify(candidate)===JSON.stringify(entry));if(current>=0)draft.allowedValues[current]=typedComposedValue(draft.type??context.row.effective.type,control.value);}catch{}});const row=dom.createElement("article");row.dataset.valueId=valueId;row.dataset.ownership=isLocal?"local":"inherited";const lifecycle=isLocal?(removed?button(dom,"Restore",()=>{context.removedValueIds.delete(valueId);context.render();}):button(dom,"Remove local",()=>{context.removedValueIds.add(valueId);context.render();})):button(dom,"Override here",()=>{draft.allowedValues.push(entry);draft.allowedValueIds=[...(draft.allowedValueIds??[]),valueId];context.stagedLocalValueIds.add(valueId);context.render();});row.append(labeled(dom,`Value ${index+1}`,control),button(dom,"View",()=>{row.dataset.valueMode="view";const detail=dom.createElement("p");detail.textContent=`Value ${valueId} · ${valueText(entry)} · ${row.dataset.ownership}`;row.append(detail);}),isLocal?button(dom,"Edit",()=>{control.focus();}):button(dom,"Open source",()=>{row.dataset.valueMode="source";}),lifecycle);list.append(row);});host.append(labeled(dom,"Expected value",expected),list,button(dom,"Add allowed value",()=>{draft.allowedValues=[...draft.allowedValues,""];draft.allowedValueIds=[...(draft.allowedValueIds??[]),`allowed-value:${crypto.randomUUID()}`];context.stagedLocalValueIds.add(draft.allowedValueIds.at(-1)!);context.render();}));}
  if(context.activeSection==="conditions")renderComposedFocusedCondition(host,context);
  if(context.activeSection==="rules")renderComposedFocusedRules(host,context);
  if(context.activeSection==="documentation"){const control=dom.createElement("textarea");control.name="documentation";control.value=draft.documentation;control.addEventListener("input",()=>{draft.documentation=control.value;});host.append(labeled(dom,"Documentation",control));}
  if(context.activeSection==="example"){const method=dom.createElement("select"),control=dom.createElement("input");method.name="exampleMethod";method.append(new Option("Blank","blank"),new Option("Allowed value","allowed-value"),new Option("Custom typed value","custom"));method.value=draft.exampleMethod;control.name="exampleValue";control.value=valueText(draft.exampleValue);method.addEventListener("change",()=>{draft.exampleMethod=method.value as ComposedFacetDraft["exampleMethod"];if(method.value==="blank")draft.exampleValue=undefined;context.render();});control.addEventListener("input",()=>{try{draft.exampleValue=typedComposedValue(draft.type??context.row.effective.type,control.value);draft.exampleMethod="custom";}catch{draft.exampleValue=control.value;}});host.append(labeled(dom,"Example method",method),labeled(dom,"Example value",control));}
  if(context.activeSection==="structure"){
    host.append(Object.assign(dom.createElement("p"),{textContent:`Stable identity ${context.row.effective.definitionId??context.row.path}`}));
    if(context.onStructure){
      const name=dom.createElement("input");name.name="structureName";name.value=context.row.path.split("/").at(-1)??"property";name.setAttribute("aria-label","Structure property name");
      const invoke=(kind:FlowPageInstanceStructureKind)=>context.onStructure?.(kind,context.row.path,name.value);
      host.append(labeled(dom,"Property name",name),button(dom,"Add child",()=>invoke("add-child")),button(dom,"Add sibling",()=>invoke("add-sibling")),button(dom,"Rename",()=>invoke("rename")),button(dom,"Move earlier",()=>invoke("move-earlier")),button(dom,"Move later",()=>invoke("move-later")),button(dom,"Move to root",()=>invoke("move-to-root")),button(dom,"Duplicate",()=>invoke("duplicate")),button(dom,"Delete property",()=>invoke("delete")));
    }
  }
}
