import type {ComposedFacetDraft} from "./data-layer-composed-schema-builders.js";
import {typedComposedValue} from "./data-layer-composed-schema-builders.js";
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
  if(context.activeSection==="definition"){const type=dom.createElement("select"),itemType=dom.createElement("select");type.name="propertyType";type.append(new Option("Inherit type",""),...["string","number","integer","boolean","object","array","null"].map((entry)=>new Option(entry,entry)));type.value=draft.type??"";itemType.name="itemType";itemType.append(new Option("Inherit item type",""),...["string","number","integer","boolean","object","array","null"].map((entry)=>new Option(entry,entry)));itemType.value=draft.itemType??"";itemType.disabled=draft.type!=="array";type.addEventListener("change",()=>{draft.type=type.value||undefined;itemType.disabled=draft.type!=="array";});itemType.addEventListener("change",()=>{draft.itemType=itemType.value||undefined;});host.append(labeled(dom,"Type",type),labeled(dom,"Array item type",itemType));}
  if(context.activeSection==="presence"){const presence=dom.createElement("select");presence.name="presenceMode";presence.append(new Option("Inherit presence",""),...["required","optional","forbidden","permitted"].map((entry)=>new Option(entry,entry)));presence.value=draft.presence??"";presence.addEventListener("change",()=>{draft.presence=presence.value as any||undefined;});host.append(labeled(dom,"Presence",presence));}
  if(context.activeSection==="values"){const expected=dom.createElement("input"),list=dom.createElement("div");expected.name="expectedValue";expected.setAttribute("aria-label","Expected value");expected.value=valueText(draft.expectedValue);expected.addEventListener("input",()=>{try{draft.expectedValue=expected.value===""?undefined:typedComposedValue(draft.type??context.row.effective.type,expected.value);}catch{}});draft.allowedValues.forEach((entry,index)=>{const control=dom.createElement("input");control.value=valueText(entry);control.setAttribute("aria-label",`Allowed value ${index+1}`);control.addEventListener("input",()=>{try{draft.allowedValues[index]=typedComposedValue(draft.type??context.row.effective.type,control.value);}catch{draft.allowedValues[index]=control.value;}});list.append(labeled(dom,`Value ${index+1}`,control),button(dom,"Remove",()=>{draft.allowedValues=draft.allowedValues.filter((_,candidate)=>candidate!==index);context.render();}));});host.append(labeled(dom,"Expected value",expected),list,button(dom,"Add allowed value",()=>{draft.allowedValues=[...draft.allowedValues,""];context.render();}));}
  if(context.activeSection==="conditions")renderComposedFocusedCondition(host,context);
  if(context.activeSection==="rules")renderComposedFocusedRules(host,context);
  if(context.activeSection==="documentation"){const control=dom.createElement("textarea");control.name="documentation";control.value=draft.documentation;control.addEventListener("input",()=>{draft.documentation=control.value;});host.append(labeled(dom,"Documentation",control));}
  if(context.activeSection==="example"){const method=dom.createElement("select"),control=dom.createElement("input");method.name="exampleMethod";method.append(new Option("Blank","blank"),new Option("Allowed value","allowed-value"),new Option("Custom typed value","custom"));method.value=draft.exampleMethod;control.name="exampleValue";control.value=valueText(draft.exampleValue);method.addEventListener("change",()=>{draft.exampleMethod=method.value as ComposedFacetDraft["exampleMethod"];if(method.value==="blank")draft.exampleValue=undefined;context.render();});control.addEventListener("input",()=>{try{draft.exampleValue=typedComposedValue(draft.type??context.row.effective.type,control.value);draft.exampleMethod="custom";}catch{draft.exampleValue=control.value;}});host.append(labeled(dom,"Example method",method),labeled(dom,"Example value",control));}
  if(context.activeSection==="structure")host.append(Object.assign(dom.createElement("p"),{textContent:`Stable identity ${context.row.path}`}));
}
