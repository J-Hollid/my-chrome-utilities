import type {CanonicalPredicate,CanonicalPropertyNode,CanonicalRule} from "./data-layer-canonical-schema.js";
import {filterFocusedReusableRules,focusedReusableOutcome,focusedRuleFields,focusedRuleIssue,readFocusedReusableRules} from "./data-layer-focused-schema-property-ui.js";
import {renderSharedConditionTree} from "./data-layer-shared-condition-tree-editor.js";
import {schemaTableStageAllowedValues} from "./data-layer-schema-table.js";

export interface CanonicalFocusedRuleAddContext {dom:Document;getWorking:()=>CanonicalPropertyNode|undefined;properties?:()=>readonly {id:string;name:string;type?:string;allowedValues?:readonly unknown[]}[];id:(kind:string)=>string;render:()=>void;feedback:(message:string)=>void;}
const labeled=(dom:Document,text:string,control:HTMLElement):HTMLLabelElement=>{const label=dom.createElement("label");label.append(text,control);return label;};
const input=(dom:Document,name:string,value="",type="text"):HTMLInputElement=>{const control=dom.createElement("input");control.name=name;control.type=type;control.value=value;return control;};
const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
const numericFields=new Set(["minimum","maximum","minItems","maxItems"]);
const fieldLabel=(field:string):string=>({ordinaryValue:"Allowed values",pattern:"Regular expression",minimum:"Minimum",maximum:"Maximum",minItems:"Minimum items",maxItems:"Maximum items",severity:"Severity",message:"Message"}[field]??field);
const section=(dom:Document,title:string):HTMLElement=>{const value=dom.createElement("section"),heading=dom.createElement("h3");heading.textContent=title;value.append(heading);return value;};

export function renderCanonicalRuleAddPanel(host:HTMLElement,context:CanonicalFocusedRuleAddContext):void {
  const {dom}=context;
  const opener=button(dom,"Add rule",()=>open());
  host.append(opener);
  const open=():void=>{
    const working=context.getWorking();if(!working)return;
    opener.remove();
    const panel=dom.createElement("fieldset"),legend=dom.createElement("legend"),details=section(dom,"Rule details"),when=section(dom,"When"),then=section(dom,"Then"),severitySection=section(dom,"Severity and message"),actions=section(dom,"Rule actions"),kind=dom.createElement("select"),fields=dom.createElement("div"),status=dom.createElement("p"),name=input(dom,"newRuleName");
    let condition:CanonicalPredicate|undefined;
    panel.dataset.ruleEditorMode="add";fields.dataset.ruleFieldGrid="true";severitySection.dataset.ruleFieldGrid="true";panel.setAttribute("aria-label","Add rule editor");legend.textContent="Add rule";status.setAttribute("role","status");kind.name="ruleKind";kind.required=true;kind.append(new Option("Choose rule type",""),...(["presence","value","pattern","range","cardinality","reusable"] as const).map((entry)=>new Option(entry,entry)));
    details.append(labeled(dom,"Rule name",name),labeled(dom,"Rule type",kind));
    const conditionHost=dom.createElement("div");when.append(conditionHost);
    const candidate=():CanonicalRule|undefined=>{
      if(!kind.value)return undefined;
      const trimmedName=name.value.trim(),rule:CanonicalRule={id:"staged-rule",kind:kind.value as CanonicalRule["kind"],severity:(severitySection.querySelector<HTMLSelectElement>("[name=\"newRuleSeverity\"]")?.value??"error") as CanonicalRule["severity"],...(trimmedName?{name:trimmedName}:{}),...(condition?{condition}:{})};
      for(const field of ["pattern","minimum","maximum","minItems","maxItems","message"]){
        const control=panel.querySelector<HTMLInputElement>(`[name="newRule${field[0]!.toUpperCase()+field.slice(1)}"]`);
        if(control&&control.value!=="")Object.assign(rule,{[field]:numericFields.has(field)?Number(control.value):control.value});
      }
      const presence=panel.querySelector<HTMLSelectElement>("[name=\"newRulePresence\"]");if(presence?.value)rule.presence=presence.value as NonNullable<CanonicalRule["presence"]>;
      const ordinary=panel.querySelector<HTMLInputElement>("[name=\"newRuleOrdinaryValue\"]");if(ordinary?.value)rule.allowedValues=schemaTableStageAllowedValues([],ordinary.value,working.type);
      const reusable=panel.querySelector<HTMLSelectElement>("[name=\"newRuleReusableRuleId\"]");
      if(reusable?.value){rule.reusableRuleId=reusable.value;const source=readFocusedReusableRules().find(({id})=>id===reusable.value),ruleName=source?.name??reusable.selectedOptions[0]?.textContent,outcome=source&&focusedReusableOutcome(source);if(ruleName)rule.name=ruleName;if(outcome)rule.reusableOutcome=outcome;}
      return rule;
    };
    const add=button(dom,"Add rule",()=>{const next=context.getWorking(),rule=candidate();if(!next||!rule)return;const issue=focusedRuleIssue(rule as unknown as Record<string,unknown>);if(issue){status.textContent=issue;return;}rule.id=context.id("rule");next.rules=[...next.rules,rule];context.feedback("Staged rule addition.");context.render();});
    const validate=():void=>{const rule=candidate(),issue=rule?focusedRuleIssue(rule as unknown as Record<string,unknown>):"Choose a rule type.";add.disabled=Boolean(issue);status.textContent=issue??"";};
    const renderOutcome=():void=>{
      fields.replaceChildren();
      for(const field of focusedRuleFields(kind.value)){
        if(field==="condition"||field==="severity"||field==="message")continue;
        if(field==="reusableRuleId"){
          const search=input(dom,"reusableRuleSearch"),reusable=dom.createElement("select");search.type="search";search.placeholder="Search reusable rules by name";reusable.name="newRuleReusableRuleId";reusable.setAttribute("aria-label","Reusable rule name");
          const renderChoices=()=>{const selected=reusable.value,choices=filterFocusedReusableRules(readFocusedReusableRules(),search.value);reusable.replaceChildren(new Option("Choose reusable rule",""),...choices.map(({id,name})=>new Option(name,id)));if(choices.some(({id})=>id===selected))reusable.value=selected;validate();};
          search.addEventListener("input",renderChoices);reusable.addEventListener("change",validate);renderChoices();fields.append(labeled(dom,"Search reusable rules",search),labeled(dom,"Reusable rule",reusable));continue;
        }
        if(field==="presence"){const control=dom.createElement("select");control.name="newRulePresence";control.append(new Option("Choose presence",""),new Option("Required","required"),new Option("Optional","optional"),new Option("Forbidden","forbidden"));control.addEventListener("change",validate);fields.append(labeled(dom,"Presence",control));continue;}
        const control=input(dom,`newRule${field[0]!.toUpperCase()+field.slice(1)}`,"",numericFields.has(field)?"number":"text");control.addEventListener("input",validate);fields.append(labeled(dom,fieldLabel(field),control));
      }
      validate();
    };
    const severity=dom.createElement("select"),message=input(dom,"newRuleMessage"),severityLabel=labeled(dom,"Severity",severity),messageLabel=labeled(dom,"Message",message);severity.name="newRuleSeverity";messageLabel.dataset.ruleMessageField="true";severity.append(new Option("error","error"),new Option("warning","warning"));severity.addEventListener("change",validate);message.addEventListener("input",validate);severitySection.append(severityLabel,messageLabel);
    name.addEventListener("input",validate);kind.addEventListener("change",renderOutcome);
    actions.setAttribute("aria-label","Rule actions");actions.append(status,button(dom,"Cancel",()=>{panel.remove();host.prepend(opener);opener.focus({preventScroll:true});}),add);
    then.append(fields);panel.append(legend,details,when,then,severitySection,actions);host.append(panel);
    renderSharedConditionTree(conditionHost,{dom,properties:()=>context.properties?.()??[],id:context.id,onChange:(next)=>{condition=next;validate();}});
    renderOutcome();name.focus({preventScroll:true});
  };
}
