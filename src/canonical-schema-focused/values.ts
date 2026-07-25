import type {CanonicalPropertyNode} from "../data-layer-canonical-schema.js";
import type {CanonicalFocusedSectionContext} from "../data-layer-canonical-schema-focused-sections.js";
import {canonicalFacetText,typedCanonicalValue} from "../data-layer-canonical-schema-facets.js";
import {button,input,labeled} from "./dom.js";

export function renderValuesFacet(host:HTMLElement,context:CanonicalFocusedSectionContext,working:CanonicalPropertyNode):void {
  const {dom}=context;
  const expected=input(dom,"expectedValue",canonicalFacetText(working.expectedValue));
  expected.setAttribute("aria-label","Expected value");
  expected.addEventListener("input",()=>{const next=context.getWorking();if(!next)return;try{next.expectedValue=expected.value===""?undefined:typedCanonicalValue(next.type,expected.value);expected.setCustomValidity("");}catch{expected.setCustomValidity("Value does not match the property type.");}});
  const list=dom.createElement("div");
  working.allowedValues.forEach((entry,index)=>{
    const row=dom.createElement("article"),value=input(dom,`allowedValue-${entry.id}`,canonicalFacetText(entry.value)),removed=context.removedValueIds.has(entry.id),inherited=entry.provenance?.some(({state})=>state==="inherited"||state==="shadowed")??working.provenance.some(({state})=>state==="inherited"||state==="shadowed"),overridden=Boolean(entry.provenance?.some(({state})=>state==="effective")&&inherited);
    row.dataset.valueId=entry.id;row.dataset.ownership=overridden?"overridden":inherited?"inherited":"local";value.setAttribute("aria-label",`Allowed value ${index+1}`);value.disabled=removed||inherited&&!overridden;
    value.addEventListener("input",()=>{const next=context.getWorking();if(!next)return;try{next.allowedValues[index]={...entry,value:typedCanonicalValue(next.type,value.value)};value.setCustomValidity("");}catch{value.setCustomValidity("Value does not match the property type.");}});
    const ownership=row.dataset.ownership;
    const actions:HTMLButtonElement[]=ownership==="inherited"?[button(dom,"Override here",()=>nextOverride(context,entry)),button(dom,"Open source",()=>{row.dataset.valueMode="source";})]:ownership==="overridden"?[button(dom,"Edit",()=>value.focus()),removed?button(dom,"Restore",()=>{context.removedValueIds.delete(entry.id);context.render();}):button(dom,"Reset to parent",()=>{context.removedValueIds.add(entry.id);context.render();})]:[removed?button(dom,"Restore",()=>{context.removedValueIds.delete(entry.id);context.render();}):button(dom,"Edit",()=>value.focus()),removed?Object.assign(dom.createElement("button"),{type:"button",textContent:"Removed"}):button(dom,"Remove local",()=>{context.removedValueIds.add(entry.id);context.render();})];
    row.append(labeled(dom,`Value ${index+1}`,value),button(dom,"View",()=>{row.dataset.valueMode="view";const detail=dom.createElement("p");detail.textContent=`Value ${entry.id} · ${canonicalFacetText(entry.value)} · ${ownership}`;row.append(detail);}),...actions);list.append(row);
  });
  host.append(labeled(dom,"Expected value",expected),list,button(dom,"Add allowed value",()=>{const next=context.getWorking();if(next){next.allowedValues.push({id:context.id("allowed-value"),value:next.type==="number"||next.type==="integer"?0:next.type==="boolean"?false:next.type==="null"?null:""});context.render();}}));
}

function nextOverride(context:CanonicalFocusedSectionContext,entry:CanonicalPropertyNode["allowedValues"][number]):void {const next=context.getWorking();if(!next)return;next.allowedValues=next.allowedValues.map((candidate)=>candidate.id===entry.id?{...candidate,provenance:[{source:"created",state:"effective"}]}:candidate);context.feedback(`Staged override for allowed value ${entry.id}.`);context.render();}
