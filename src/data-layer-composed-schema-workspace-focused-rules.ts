import {filterFocusedReusableRules,focusedOwnershipActions,focusedReusableOutcome,focusedRuleFields,focusedRuleIssue,readFocusedReusableRules} from "./data-layer-focused-schema-property-ui.js";
import type {ComposedFocusedSectionContext} from "./data-layer-composed-schema-workspace-focused-sections.js";
import {renderSharedConditionTree} from "./data-layer-shared-condition-tree-editor.js";
import {schemaTableExpectedOrAllowed,schemaTableReplaceExpectedOrAllowed,schemaTableStageExpectedOrAllowed} from "./data-layer-schema-table.js";

const labeled=(dom:Document,text:string,control:HTMLElement):HTMLLabelElement=>{const label=dom.createElement("label");label.append(text,control);return label;};
const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
const numericFields=new Set(["minimum","maximum","minItems","maxItems"]);
const clone=<T>(value:T):T=>structuredClone(value);

function renderRuleEditor(row:HTMLElement,rule:Record<string,unknown>,index:number,context:ComposedFocusedSectionContext):void {
  const {dom}=context,editor=dom.createElement("fieldset");editor.setAttribute("aria-label",`Edit rule ${String(rule.id??index)}`);
  for(const field of focusedRuleFields(String(rule.kind??"reusable"))){
    if(field==="condition"){
      const condition=dom.createElement("div");renderSharedConditionTree(condition,{dom,...(rule.condition?{condition:rule.condition as any}:{}),properties:()=>context.model.rows.map(({path,effective})=>({id:effective.definitionId??path,name:path,...(effective.type?{type:effective.type}: {})})),id:(kind)=>`${kind}:${crypto.randomUUID()}`,onChange:(next)=>{if(next)rule.condition=next as unknown as Record<string,unknown>;else delete rule.condition;}});editor.append(labeled(dom,"Shared condition tree",condition));continue;
    }
    if(field==="reusableRuleId")continue;
    if(field==="presence"){const control=dom.createElement("select");control.name="editRulePresence";control.append(new Option("Required","required"),new Option("Optional","optional"),new Option("Forbidden","forbidden"));control.value=String(rule.presence??"required");control.addEventListener("change",()=>{const draft=context.getDraft();if(!draft)return;const next=clone(draft.rules[index] as Record<string,unknown>);next.presence=control.value;draft.rules[index]=next;});editor.append(labeled(dom,"Then presence",control));continue;}
    if(field==="ordinaryValue"){const control=dom.createElement("input");control.name="editRuleOrdinaryValue";control.value=schemaTableExpectedOrAllowed(rule);control.addEventListener("input",()=>{const draft=context.getDraft();if(!draft)return;draft.rules[index]=schemaTableReplaceExpectedOrAllowed(clone(draft.rules[index] as Record<string,unknown>),control.value);});editor.append(labeled(dom,"Then ordinary value",control));continue;}
    const control=field==="severity"?dom.createElement("select"):dom.createElement("input");control.name=`editRule${field[0]!.toUpperCase()+field.slice(1)}`;if(control instanceof HTMLSelectElement)control.append(new Option("error","error"),new Option("warning","warning"));else if(numericFields.has(field))control.type="number";control.value=String(rule[field]??"");control.addEventListener("input",()=>{const draft=context.getDraft();if(!draft)return;const next=clone(draft.rules[index] as Record<string,unknown>);next[field]=control.value===""?undefined:numericFields.has(field)?Number(control.value):control.value;draft.rules[index]=next;});editor.append(labeled(dom,field,control));
  }
  row.append(editor);
}

function renderRuleInventory(host:HTMLElement,context:ComposedFocusedSectionContext):void {
  const {dom}=context,draft=context.getDraft();if(!draft)return;
  const list=dom.createElement("div");list.setAttribute("aria-label","Stable rule inventory");
  const localIds=new Set((context.row.local.rules??[]).map((rule)=>String(rule.id??""))),displayedById=new Map<string,Record<string,unknown>>();
  for(const rule of context.row.effective.rules??[])displayedById.set(String(rule.id??`rule:${displayedById.size}`),rule as Record<string,unknown>);
  for(const rule of draft.rules)displayedById.set(String(rule.id??`rule:${displayedById.size}`),rule);
  [...displayedById.values()].forEach((rule,index)=>{
    const row=dom.createElement("article"),summary=dom.createElement("p"),id=String(rule.id??`rule-${index}`),localIndex=draft.rules.findIndex((candidate)=>String(candidate.id??"")===id),local=localIndex>=0||localIds.has(id)||context.overriddenRuleIds.has(id),removed=context.removedRuleIds.has(id);
    row.dataset.ruleId=id;row.dataset.ownership=local?"local":"inherited";summary.textContent=`${String(rule.name??rule.kind??"rule")} · When ${rule.condition?"configured":"unresolved"} · Then ${String(rule.kind??"reusable")} · ${String(rule.severity??"error")} · ${String(rule.message??"No issue message")} · source ${local?"local":context.row.source} · ${local?"local":"inherited"}${removed?" · Removed":""}`;
    row.append(summary,button(dom,"View",()=>{row.dataset.ruleMode="view";const detail=dom.createElement("p");detail.textContent=`Rule ${id} · definition ${JSON.stringify(rule)} · effective ${rule.enabled===false?"disabled":"enabled"} · source ${local?"local":"inherited"}`;row.append(detail);}));
    if(local&&!removed)row.append(button(dom,"Edit",()=>{row.dataset.ruleMode="edit";renderRuleEditor(row,rule,localIndex,context);}),button(dom,"Remove local",()=>{context.restoredRuleIds.delete(id);context.removedRuleIds.add(id);context.render();}));
    else if(local)row.append(button(dom,"Restore",()=>{context.removedRuleIds.delete(id);context.restoredRuleIds.add(id);context.render();}));
    else {
      const actions=focusedOwnershipActions({inherited:true,invariant:rule.enforcement==="invariant",replaceable:rule.enforcement==="overridable"});
      if(actions.includes("Replace here"))row.append(button(dom,"Replace here",()=>context.overrideRule(id)));
      if(actions.includes("Override here"))row.append(button(dom,"Override here",()=>context.overrideRule(id)));
      if(actions.includes("Open source"))row.append(button(dom,"Open source",()=>{row.dataset.ruleMode="source";const detail=dom.createElement("p");detail.textContent=`Source rule ${id} · inherited definition is read-only.`;row.append(detail);}));
    }
    list.append(row);
  });
  host.append(list);
}

function renderAddPanel(host:HTMLElement,context:ComposedFocusedSectionContext):void {
  const {dom}=context,draft=context.getDraft();if(!draft)return;
  const panel=dom.createElement("fieldset"),legend=dom.createElement("legend"),kind=dom.createElement("select"),fields=dom.createElement("div"),status=dom.createElement("p");
  let condition:Record<string,unknown>|undefined;
  legend.textContent="Add rule";status.setAttribute("role","status");kind.name="ruleKind";kind.append(new Option("Choose outcome",""),...["presence","value","pattern","range","cardinality","reusable"].map((entry)=>new Option(entry,entry)));
  const candidate=():Record<string,unknown>|undefined=>{
    if(!kind.value)return undefined;const name=fields.querySelector<HTMLInputElement>("[name=\"newRuleName\"]")?.value.trim(),rule:Record<string,unknown>={id:"staged-rule",kind:kind.value,severity:"error",...(name?{name}:{})};
    for(const field of ["pattern","minimum","maximum","minItems","maxItems","message"]){const control=fields.querySelector<HTMLInputElement>(`[name="newRule${field[0]!.toUpperCase()+field.slice(1)}"]`);if(control&&control.value!=="")rule[field]=numericFields.has(field)?Number(control.value):control.value;}
    const presence=fields.querySelector<HTMLSelectElement>("[name=\"newRulePresence\"]");if(presence?.value)rule.presence=presence.value;
    const ordinary=fields.querySelector<HTMLInputElement>("[name=\"newRuleOrdinaryValue\"]");if(ordinary?.value)Object.assign(rule,schemaTableStageExpectedOrAllowed({},ordinary.value));
    if(condition)rule.condition=condition;
    const reusable=fields.querySelector<HTMLSelectElement>("[name=\"newRuleReusableRuleId\"]");if(reusable?.value){rule.reusableRuleId=reusable.value;const source=readFocusedReusableRules().find(({id})=>id===reusable.value),outcome=source&&focusedReusableOutcome(source);rule.name=source?.name??reusable.selectedOptions[0]?.textContent??undefined;if(outcome)rule.reusableOutcome=outcome;}
    return rule;
  };
  const validate=()=>{const issue=candidate()?focusedRuleIssue(candidate()!):undefined;add.disabled=!kind.value||Boolean(issue);status.textContent=issue??"";};
  const renderFields=()=>{
    fields.replaceChildren();condition=undefined;if(!kind.value){validate();return;}const name=dom.createElement("input");name.name="newRuleName";name.addEventListener("input",validate);fields.append(labeled(dom,"Rule name",name));
    for(const field of focusedRuleFields(kind.value)){
      if(field==="condition"){const tree=dom.createElement("div");renderSharedConditionTree(tree,{dom,properties:()=>context.model.rows.map(({path,effective})=>({id:effective.definitionId??path,name:path,...(effective.type?{type:effective.type}:{})})),id:(prefix)=>`${prefix}:${crypto.randomUUID()}`,onChange:(next)=>{condition=next as unknown as Record<string,unknown>|undefined;validate();}});fields.append(labeled(dom,"Condition tree",tree));continue;}
      if(field==="reusableRuleId"){const search=dom.createElement("input"),select=dom.createElement("select");search.type="search";search.name="reusableRuleSearch";search.placeholder="Search reusable rules by name";select.name="newRuleReusableRuleId";select.setAttribute("aria-label","Reusable rule name");const choices=()=>{const selected=select.value,rules=filterFocusedReusableRules(readFocusedReusableRules(),search.value);select.replaceChildren(new Option("Choose reusable rule",""),...rules.map(({id,name})=>new Option(name,id)));if(rules.some(({id})=>id===selected))select.value=selected;validate();};search.addEventListener("input",choices);select.addEventListener("change",validate);choices();fields.append(labeled(dom,"Search reusable rules",search),labeled(dom,"Reusable rule",select));continue;}
      if(field==="presence"){const control=dom.createElement("select");control.name="newRulePresence";control.append(new Option("Choose presence",""),new Option("Required","required"),new Option("Optional","optional"),new Option("Forbidden","forbidden"));control.addEventListener("change",validate);fields.append(labeled(dom,"Then presence",control));continue;}
      const control=field==="severity"?dom.createElement("select"):dom.createElement("input");control.name=`newRule${field[0]!.toUpperCase()+field.slice(1)}`;if(control instanceof HTMLSelectElement)control.append(new Option("error","error"),new Option("warning","warning"));else if(numericFields.has(field))control.type="number";control.addEventListener("input",validate);fields.append(labeled(dom,field==="ordinaryValue"?"Then ordinary value":field,control));
    }
    validate();
  };
  const add=button(dom,"Add rule",()=>{const rule=candidate();if(!rule)return;const issue=focusedRuleIssue(rule);if(issue){status.textContent=issue;return;}rule.id=`rule:${crypto.randomUUID()}`;draft.rules=[...draft.rules,rule];context.render();});
  add.disabled=true;kind.required=true;kind.addEventListener("change",renderFields);renderFields();panel.append(legend,labeled(dom,"Rule kind",kind),fields,status,add);host.append(panel);
}

export function renderComposedFocusedRules(host:HTMLElement,context:ComposedFocusedSectionContext):void {
  renderRuleInventory(host,context);renderAddPanel(host,context);
}
