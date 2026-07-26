import type {CanonicalPropertyNode,CanonicalRule} from "./data-layer-canonical-schema.js";
import {focusedOwnershipActions,focusedRuleFields} from "./data-layer-focused-schema-property-ui.js";
import {renderSharedConditionTree} from "./data-layer-shared-condition-tree-editor.js";
import {schemaTableExpectedOrAllowed,schemaTableRuleConditionSummary,schemaTableRuleOutcomeSummary,schemaTableStageExpectedOrAllowed} from "./data-layer-schema-table.js";

export interface CanonicalFocusedRuleRowsContext {dom:Document;getWorking:()=>CanonicalPropertyNode|undefined;properties?:()=>readonly {id:string;name:string;type?:string}[];removedRuleIds:Set<string>;invariant:boolean;id:(kind:string)=>string;render:()=>void;feedback:(message:string)=>void;}
const clone=<T>(value:T):T=>structuredClone(value);
const labeled=(dom:Document,text:string,control:HTMLElement):HTMLLabelElement=>{const label=dom.createElement("label");label.append(text,control);return label;};
const input=(dom:Document,name:string,value="",type="text"):HTMLInputElement=>{const control=dom.createElement("input");control.name=name;control.type=type;control.value=value;return control;};
const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
const ruleKindLabel=(rule:CanonicalRule):string=>rule.name??rule.kind;

function editRule(row:HTMLElement,rule:CanonicalRule,context:CanonicalFocusedRuleRowsContext):void {
  const {dom}=context,editor=dom.createElement("fieldset"),legend=dom.createElement("legend");legend.textContent=`Edit ${ruleKindLabel(rule)}`;
  const update=(change:(next:CanonicalRule)=>void):void=>{const working=context.getWorking();if(!working)return;const index=working.rules.findIndex(({id})=>id===rule.id);if(index<0)return;const next=clone(working.rules[index]!);change(next);working.rules[index]=next;};
  const properties=context.properties?.()??[],when=dom.createElement("div"),renderWhen=():void=>{when.replaceChildren();if(!rule.condition){when.append(button(dom,"Add When",()=>{const tree=dom.createElement("div");renderSharedConditionTree(tree,{dom,properties:()=>properties,id:context.id,onChange:(condition)=>update((next)=>{if(condition)next.condition=condition;else delete next.condition;})});when.replaceChildren(tree,button(dom,"Remove When",()=>{update((next)=>{delete next.condition;});renderWhen();}));}));return;}const tree=dom.createElement("div");renderSharedConditionTree(tree,{dom,condition:rule.condition,properties:()=>properties,id:context.id,onChange:(condition)=>update((next)=>{if(condition)next.condition=condition;else delete next.condition;})});when.append(tree,button(dom,"Remove When",()=>{update((next)=>{delete next.condition;});renderWhen();}));};renderWhen();editor.append(legend,when);
  for(const field of focusedRuleFields(rule.kind)){
    if(field==="condition")continue;
    if(field==="reusableRuleId")continue;
    if(field==="presence"){const control=dom.createElement("select");control.name="editRulePresence";control.append(new Option("Required","required"),new Option("Optional","optional"),new Option("Forbidden","forbidden"));control.value=rule.presence??"required";control.addEventListener("change",()=>update((next)=>{next.presence=control.value as NonNullable<CanonicalRule["presence"]>;}));editor.append(labeled(dom,"Then presence",control));continue;}
    if(field==="ordinaryValue"){const control=input(dom,"editRuleOrdinaryValue",schemaTableExpectedOrAllowed(rule));control.addEventListener("input",()=>update((next)=>{const staged=schemaTableStageExpectedOrAllowed(next,control.value);if(staged.expectedValue===undefined)delete next.expectedValue;else next.expectedValue=staged.expectedValue;if(staged.allowedValues===undefined)delete next.allowedValues;else next.allowedValues=staged.allowedValues;}));editor.append(labeled(dom,"Then ordinary value",control));continue;}
    const numeric=["minimum","maximum","minItems","maxItems"].includes(field),control=field==="severity"?dom.createElement("select"):input(dom,`editRule${field[0]!.toUpperCase()+field.slice(1)}`,String((rule as any)[field]??""),numeric?"number":"text");
    control.name=`editRule${field[0]!.toUpperCase()+field.slice(1)}`;if(control instanceof HTMLSelectElement){control.append(new Option("error","error"),new Option("warning","warning"));control.value=rule.severity;}control.addEventListener("input",()=>update((next)=>{(next as any)[field]=control.value===""?undefined:numeric?Number(control.value):control.value;}));editor.append(labeled(dom,field,control));
  }
  row.append(editor);
}

export function renderCanonicalRuleRows(host:HTMLElement,context:CanonicalFocusedRuleRowsContext):void {
  const {dom,removedRuleIds,invariant}=context,working=context.getWorking();if(!working)return;const list=dom.createElement("div"),properties=context.properties?.()??[];list.setAttribute("aria-label","Stable rule inventory");
  for(const rule of working.rules){const row=dom.createElement("article"),summary=dom.createElement("p"),inherited=rule.provenance?.state==="inherited"||rule.provenance?.state==="shadowed",removed=removedRuleIds.has(rule.id);row.dataset.ruleId=rule.id;row.dataset.ownership=inherited?"inherited":"local";summary.textContent=`${ruleKindLabel(rule)} · ${schemaTableRuleConditionSummary(rule.condition,properties)} · Then ${schemaTableRuleOutcomeSummary(rule as unknown as Record<string,unknown>)} · ${rule.severity} · ${rule.message??"No issue message"} · source ${rule.provenance?.contributorName??"local"} · ${inherited?"inherited":"local"}${removed?" · Removed":""}`;row.append(summary,button(dom,"View",()=>{row.dataset.ruleMode="view";const detail=dom.createElement("p");detail.textContent=`Rule ${rule.id} · definition ${JSON.stringify(rule)} · effective ${rule.enabled===false?"disabled":"enabled"} · source ${rule.provenance?.contributorName??"local"}`;row.append(detail);}));
    if(inherited){const actions=focusedOwnershipActions({inherited:true,invariant:rule.enforcement==="invariant"||invariant,replaceable:rule.enforcement==="overridable"&&!invariant});if(actions.includes("Replace here"))row.append(button(dom,"Replace here",()=>replaceInheritedRule(rule,context)));if(actions.includes("Override here"))row.append(button(dom,"Override here",()=>replaceInheritedRule(rule,context)));if(actions.includes("Open source"))row.append(button(dom,"Open source",()=>{row.dataset.ruleMode="source";const source=dom.createElement("p");source.textContent=`Source rule ${rule.id} · ${ruleKindLabel(rule)} · inherited definition is read-only.`;row.append(source);}));}
    else if(removed){const impact=dom.createElement("p");impact.textContent=`Impact review: ${ruleKindLabel(rule)} · effective result falls back to parent or unset.`;row.append(impact,button(dom,"Restore",()=>{removedRuleIds.delete(rule.id);context.render();}));}
    else row.append(button(dom,"Edit",()=>{row.dataset.ruleMode="edit";editRule(row,rule,context);}),button(dom,"Remove local",()=>{removedRuleIds.add(rule.id);context.feedback(`Staged removal of ${ruleKindLabel(rule)}.`);context.render();}));
    list.append(row);
  }
  host.append(list);
}

function replaceInheritedRule(rule:CanonicalRule,context:CanonicalFocusedRuleRowsContext):void {const next=context.getWorking();if(!next)return;const inherited=next.rules.find(({id})=>id===rule.id);if(!inherited)return;const replacement=clone(inherited);replacement.id=context.id("rule");replacement.replacesRuleId=inherited.id;replacement.provenance={source:"created",state:"overridden",sourceId:inherited.id};next.rules=[...next.rules,replacement];context.feedback(`Staged replacement of ${ruleKindLabel(rule)}.`);context.render();}
