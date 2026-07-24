import type {CanonicalPropertyNode,CanonicalRule} from "./data-layer-canonical-schema.js";
import {focusedRuleFields} from "./data-layer-focused-schema-property-ui.js";

export interface CanonicalFocusedRulesContext {
  dom:Document;
  getWorking:()=>CanonicalPropertyNode|undefined;
  removedRuleIds:Set<string>;
  id:(kind:string)=>string;
  render:()=>void;
  feedback:(message:string)=>void;
}

const clone=<T>(value:T):T=>structuredClone(value);
const labeled=(dom:Document,text:string,control:HTMLElement):HTMLLabelElement=>{const label=dom.createElement("label");label.append(text,control);return label;};
const input=(dom:Document,name:string,value="",type="text"):HTMLInputElement=>{const control=dom.createElement("input");control.name=name;control.type=type;control.value=value;return control;};
const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
const ruleKindLabel=(rule:CanonicalRule):string=>rule.name??rule.kind;

function renderRuleEdit(row:HTMLElement,rule:CanonicalRule,context:CanonicalFocusedRulesContext):void {
  const {dom}=context,editor=dom.createElement("fieldset"),legend=dom.createElement("legend");legend.textContent=`Edit ${ruleKindLabel(rule)}`;
  for(const field of focusedRuleFields(rule.kind)) {
    if(field==="condition")continue;
    const value=String((rule as any)[field]??""),control=input(dom,`editRule${field[0]!.toUpperCase()+field.slice(1)}`,value,["minimum","maximum","minItems","maxItems"].includes(field)?"number":"text");
    control.addEventListener("input",()=>{const working=context.getWorking();if(!working)return;const index=working.rules.findIndex(({id})=>id===rule.id);if(index<0)return;const next=clone(working.rules[index]!);(next as any)[field]=control.value===""?undefined:["minimum","maximum","minItems","maxItems"].includes(field)?Number(control.value):control.value;working.rules[index]=next;});editor.append(labeled(dom,field,control));
  }
  row.append(editor);
}

export function renderCanonicalFocusedRules(host:HTMLElement,context:CanonicalFocusedRulesContext):void {
  const {dom}=context,working=context.getWorking();if(!working)return;
  const list=dom.createElement("div");list.setAttribute("aria-label","Stable rule inventory");
  working.rules.forEach((rule)=>{
    const row=dom.createElement("article"),summary=dom.createElement("p"),inherited=rule.provenance?.state==="inherited"||rule.provenance?.state==="shadowed"||working.provenance.some(({state})=>state==="inherited"||state==="shadowed"),removed=context.removedRuleIds.has(rule.id);row.dataset.ruleId=rule.id;row.dataset.ownership=inherited?"inherited":"local";summary.textContent=`${ruleKindLabel(rule)} · ${rule.kind} · ${rule.severity} · ${rule.message??"No issue message"} · source ${rule.provenance?.contributorName??"local"}${removed?" · Removed":""}`;row.append(summary,button(dom,"View",()=>{row.dataset.ruleMode="view";}));
    if(inherited)row.append(button(dom,"Override here",()=>{}),button(dom,"Open source",()=>{}));else if(removed){const impact=dom.createElement("p");impact.textContent=`Impact review: ${ruleKindLabel(rule)} · effective result falls back to parent or unset.`;row.append(impact,button(dom,"Restore",()=>{context.removedRuleIds.delete(rule.id);context.render();}));}else row.append(button(dom,"Edit",()=>{row.dataset.ruleMode="edit";renderRuleEdit(row,rule,context);}),button(dom,"Remove local",()=>{context.removedRuleIds.add(rule.id);context.feedback(`Staged removal of ${ruleKindLabel(rule)}.`);context.render();}));list.append(row);
  });
  const addPanel=dom.createElement("fieldset"),legend=dom.createElement("legend"),kind=dom.createElement("select"),fields=dom.createElement("div");legend.textContent="Add rule";kind.name="ruleKind";kind.append(...(["pattern","range","cardinality","condition","custom"] as const).map((entry)=>new Option(entry,entry)));
  const renderFields=()=>{fields.replaceChildren();for(const field of focusedRuleFields(kind.value)){if(field==="condition")continue;if(field==="reusableRuleId"){const search=input(dom,"reusableRuleSearch");search.placeholder="Search reusable rules by name";const reusable=dom.createElement("select");reusable.name="newRuleReusableRuleId";reusable.setAttribute("aria-label","Reusable rule name");reusable.append(new Option("No reusable rule",""),...working.rules.filter(({reusableRuleId},index,array)=>reusableRuleId&&array.findIndex((candidate)=>candidate.reusableRuleId===reusableRuleId)===index).map((candidate)=>new Option(candidate.name??candidate.reusableRuleId!,candidate.reusableRuleId!)));fields.append(labeled(dom,"Search reusable rules",search),labeled(dom,"Reusable rule",reusable));continue;}fields.append(labeled(dom,field,input(dom,`newRule${field[0]!.toUpperCase()+field.slice(1)}`,"",["minimum","maximum","minItems","maxItems"].includes(field)?"number":"text")));}};kind.addEventListener("change",renderFields);renderFields();
  addPanel.append(legend,labeled(dom,"Rule kind",kind),fields,button(dom,"Add rule",()=>{const next=context.getWorking();if(!next)return;const rule:CanonicalRule={id:context.id("rule"),kind:kind.value as CanonicalRule["kind"],severity:"error",message:""};for(const field of ["pattern","minimum","maximum","minItems","maxItems"]){const control=fields.querySelector<HTMLInputElement>(`[name="newRule${field[0]!.toUpperCase()+field.slice(1)}"]`);if(control?.value)Object.assign(rule,{[field]:field.includes("Items")||["minimum","maximum"].includes(field)?Number(control.value):control.value});}const message=fields.querySelector<HTMLInputElement>("[name=\"newRuleMessage\"]");if(message)rule.message=message.value;const reusable=fields.querySelector<HTMLSelectElement>("[name=\"newRuleReusableRuleId\"]");if(reusable?.value)rule.reusableRuleId=reusable.value;next.rules=[...next.rules,rule];context.feedback("Staged rule addition.");context.render();}));host.append(list,addPanel);
}
