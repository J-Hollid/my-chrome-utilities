import type {ComposedFacetDraft} from "./data-layer-composed-schema-builders.js";
import type {ComposedSchemaRow,ComposedSchemaWorkspace} from "./data-layer-composed-schema-workspace.js";
import type {FocusedPropertySection} from "./data-layer-focused-schema-property-ui.js";
import {renderComposedFocusedCondition} from "./data-layer-composed-schema-workspace-focused-conditions.js";
import {renderComposedFocusedRules} from "./data-layer-composed-schema-workspace-focused-rules.js";

export interface ComposedFocusedSectionContext {
  model:ComposedSchemaWorkspace;
  dom:Document;
  row:ComposedSchemaRow;
  getDraft:()=>ComposedFacetDraft|undefined;
  activeSection:FocusedPropertySection;
  removedRuleIds:Set<string>;
  render:()=>void;
}

const labeled=(dom:Document,text:string,control:HTMLElement):HTMLLabelElement=>{const label=dom.createElement("label");label.append(text,control);return label;};
const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
const valueText=(value:unknown):string=>value===undefined?"unset":typeof value==="string"?value:JSON.stringify(value);

export function renderComposedFocusedSection(host:HTMLElement,context:ComposedFocusedSectionContext):void {
  const {dom}=context,draft=context.getDraft();if(!draft)return;host.dataset.focusedSection=context.activeSection;
  if(context.activeSection==="definition"){const type=dom.createElement("select");type.name="propertyType";type.append(new Option("Inherit type",""),...["string","number","integer","boolean","object","array","null"].map((entry)=>new Option(entry,entry)));type.value=draft.type??"";type.addEventListener("change",()=>{draft.type=type.value||undefined;});host.append(labeled(dom,"Type",type));}
  if(context.activeSection==="presence"){const presence=dom.createElement("select");presence.name="presenceMode";presence.append(new Option("Inherit presence",""),...["required","optional","forbidden","permitted"].map((entry)=>new Option(entry,entry)));presence.value=draft.presence??"";presence.addEventListener("change",()=>{draft.presence=presence.value as any||undefined;});host.append(labeled(dom,"Presence",presence));}
  if(context.activeSection==="values"){const list=dom.createElement("div");draft.allowedValues.forEach((entry,index)=>{const control=dom.createElement("input");control.value=valueText(entry);control.setAttribute("aria-label",`Allowed value ${index+1}`);control.addEventListener("input",()=>{draft.allowedValues[index]=control.value;});list.append(labeled(dom,`Value ${index+1}`,control),button(dom,"Remove",()=>{draft.allowedValues=draft.allowedValues.filter((_,candidate)=>candidate!==index);context.render();}));});host.append(list,button(dom,"Add allowed value",()=>{draft.allowedValues=[...draft.allowedValues,""];context.render();}));}
  if(context.activeSection==="conditions")renderComposedFocusedCondition(host,context);
  if(context.activeSection==="rules")renderComposedFocusedRules(host,context);
  if(context.activeSection==="documentation"){const control=dom.createElement("textarea");control.name="documentation";control.value=draft.documentation;control.addEventListener("input",()=>{draft.documentation=control.value;});host.append(labeled(dom,"Documentation",control));}
  if(context.activeSection==="example"){const control=dom.createElement("input");control.name="exampleValue";control.value=valueText(draft.exampleValue);control.addEventListener("input",()=>{draft.exampleValue=control.value;});host.append(labeled(dom,"Example",control));}
  if(context.activeSection==="structure")host.append(Object.assign(dom.createElement("p"),{textContent:`Stable identity ${context.row.path}`}));
}
