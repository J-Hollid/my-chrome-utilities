import type {CanonicalPredicate,CanonicalPropertyNode,CanonicalRule} from "./data-layer-canonical-schema.js";
import {filterFocusedReusableRules,focusedRuleFields,focusedRuleIssue,readFocusedReusableRules} from "./data-layer-focused-schema-property-ui.js";
import {renderSharedConditionTree} from "./data-layer-shared-condition-tree-editor.js";

export interface CanonicalFocusedRuleAddContext {dom:Document;getWorking:()=>CanonicalPropertyNode|undefined;properties?:()=>readonly {id:string;name:string;type?:string}[];id:(kind:string)=>string;render:()=>void;feedback:(message:string)=>void;}
const labeled=(dom:Document,text:string,control:HTMLElement):HTMLLabelElement=>{const label=dom.createElement("label");label.append(text,control);return label;};
const input=(dom:Document,name:string,value="",type="text"):HTMLInputElement=>{const control=dom.createElement("input");control.name=name;control.type=type;control.value=value;return control;};
const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
const numericFields=new Set(["minimum","maximum","minItems","maxItems"]);

export function renderCanonicalRuleAddPanel(host:HTMLElement,context:CanonicalFocusedRuleAddContext):void {
  const {dom}=context,working=context.getWorking();if(!working)return;
  const panel=dom.createElement("fieldset"),legend=dom.createElement("legend"),kind=dom.createElement("select"),fields=dom.createElement("div"),status=dom.createElement("p");
  let condition:CanonicalPredicate|undefined;
  legend.textContent="Add rule";status.setAttribute("role","status");kind.name="ruleKind";kind.append(new Option("Choose rule kind",""),...(["pattern","range","cardinality","condition","reusable","custom"] as const).map((entry)=>new Option(entry,entry)));
  const candidate=():CanonicalRule|undefined=>{
    if(!kind.value)return undefined;
    const rule:CanonicalRule={id:"staged-rule",kind:kind.value as CanonicalRule["kind"],severity:"error"};
    for(const field of ["pattern","minimum","maximum","minItems","maxItems","message"]){
      const control=fields.querySelector<HTMLInputElement>(`[name="newRule${field[0]!.toUpperCase()+field.slice(1)}"]`);
      if(control&&control.value!=="")Object.assign(rule,{[field]:numericFields.has(field)?Number(control.value):control.value});
    }
    if(condition)rule.condition=condition;
    const reusable=fields.querySelector<HTMLSelectElement>("[name=\"newRuleReusableRuleId\"]");
    if(reusable?.value){rule.reusableRuleId=reusable.value;const name=reusable.selectedOptions[0]?.textContent;if(name)rule.name=name;}
    return rule;
  };
  const validate=()=>{const issue=candidate()?focusedRuleIssue(candidate() as unknown as Record<string,unknown>):undefined;addRule.disabled=!kind.value||Boolean(issue);status.textContent=issue??"";};
  const renderFields=()=>{
    fields.replaceChildren();condition=undefined;if(!kind.value){validate();return;}
    for(const field of focusedRuleFields(kind.value)){
      if(field==="condition"){const tree=dom.createElement("div");renderSharedConditionTree(tree,{dom,properties:()=>context.properties?.()??[],id:context.id,onChange:(next)=>{condition=next as CanonicalPredicate|undefined;validate();}});fields.append(labeled(dom,"Condition tree",tree));continue;}
      if(field==="reusableRuleId"){
        const search=input(dom,"reusableRuleSearch");search.type="search";search.placeholder="Search reusable rules by name";
        const reusable=dom.createElement("select");reusable.name="newRuleReusableRuleId";reusable.setAttribute("aria-label","Reusable rule name");
        const renderChoices=()=>{const selected=reusable.value,choices=filterFocusedReusableRules(readFocusedReusableRules(),search.value);reusable.replaceChildren(new Option("Choose reusable rule",""),...choices.map(({id,name})=>new Option(name,id)));if(choices.some(({id})=>id===selected))reusable.value=selected;validate();};
        search.addEventListener("input",renderChoices);reusable.addEventListener("change",validate);renderChoices();fields.append(labeled(dom,"Search reusable rules",search),labeled(dom,"Reusable rule",reusable));continue;
      }
      const control=input(dom,`newRule${field[0]!.toUpperCase()+field.slice(1)}`,"",numericFields.has(field)?"number":"text");control.addEventListener("input",validate);fields.append(labeled(dom,field,control));
    }
    validate();
  };
  const addRule=button(dom,"Add rule",()=>{
    const next=context.getWorking(),rule=candidate();if(!next||!rule)return;
    const issue=focusedRuleIssue(rule as unknown as Record<string,unknown>);if(issue){status.textContent=issue;return;}
    rule.id=context.id("rule");next.rules=[...next.rules,rule];context.feedback("Staged rule addition.");context.render();
  });
  addRule.disabled=true;kind.required=true;kind.addEventListener("change",renderFields);renderFields();
  panel.append(legend,labeled(dom,"Rule kind",kind),fields,status,addRule);host.append(panel);
}
