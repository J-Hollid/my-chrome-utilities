import { createRuleConfigurationFromAttachedRule, type RuleConfiguration, type SchemaDefinition,
  type SchemaPropertyType } from "../../utilities/data-layer/schemas.js";
import type { ReusableSchemaRule } from "./contracts.js";
import type { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import type { SchemaCanonicalInstalledView } from "./canonical-installed-view.js";
import type { SchemaPropertyController } from "./property-controller.js";
import type { SchemaRuleController } from "./rule-controller.js";
import type { SchemaRulePickerView } from "./rule-picker-view.js";

export interface PropertyRuleWorkflowPorts {
  rule:SchemaRuleController; property:SchemaPropertyController; canonical:SchemaCanonicalEditorController;
  canonicalView:SchemaCanonicalInstalledView; pickerView:SchemaRulePickerView;
  picker:HTMLDialogElement|null; propertyTree:HTMLElement|null; schemaEditor:HTMLElement|null;
  schemaDetail:HTMLElement|null; document:Document|undefined;
  active():SchemaDefinition; activeSchemaId():string|undefined; draft():SchemaDefinition|undefined;
  schemas():readonly SchemaDefinition[]; renderSchemas():void; showSubview(id:string):void;
  attach(schemaId:string,ruleId:string,path?:string,rule?:ReusableSchemaRule):boolean;
  propertyType(schema:SchemaDefinition,path:string):SchemaPropertyType;
}

/** Owns installed property-to-rule picker and focus-return coordination. */
export class SchemaPropertyRuleWorkflow {
  readonly #ports:PropertyRuleWorkflowPorts;
  constructor(ports:PropertyRuleWorkflowPorts) { this.#ports=ports; }
  normalizedPath(path:string):string { return this.#ports.rule.normalizePickerPath(path); }
  sampledCondition(path:string) { return this.#ports.rule.conditionPredicate(path,true); }
  configuredRule():ReusableSchemaRule { return this.#ports.rule.configuredRule(); }
  render():void { this.#ports.pickerView.render(); this.#renderCondition(); }
  updatePreview():void { if (this.#ports.rule.pickerPath) this.render(); }
  createConfigured():boolean {
    const {rule}=this.#ports, draft=this.#ports.draft(); if (!rule.pickerPath || (!this.#ports.activeSchemaId()&&!draft)) return false;
    const configured=rule.configuredRule(), saved={...configured,version:rule.editingAttached?.version??Math.max(1,configured.version+1)};
    if (rule.configuration?.saveReusable) rule.replaceRules([...rule.rules.filter(({id})=>id!==saved.id),saved]);
    const attached=this.#ports.attach(this.#ports.activeSchemaId()??draft!.id,saved.id,rule.pickerPath,saved);
    if (attached) this.closeForCommit(); return attached;
  }
  open(path:string,trigger?:HTMLButtonElement):void {
    const {canonical,canonicalView,property,rule}=this.#ports;
    if (canonical.hasEditor()&&!canonical.editorKey()?.startsWith("saved:")&&canonicalView.openRule(path,trigger)) return;
    rule.setPicker(path,trigger); property.selectPath(path);
    property.rememberInteractionReturn({schemaId:this.#ports.active().id,path,triggerLabel:trigger?.ariaLabel??`Add rule for ${path}`,
      editorScroll:this.#ports.schemaEditor?.scrollTop??0,treeScroll:this.#ports.propertyTree?.scrollTop??0,
      detailScroll:this.#ports.schemaDetail?.scrollTop??0});
    rule.setConfiguration(undefined); this.render(); this.#ports.picker?.showModal();
    this.#ports.picker?.querySelector<HTMLInputElement>("#schema-property-rule-search")?.focus({preventScroll:true});
  }
  close():void {
    const {property,propertyTree,rule,picker}=this.#ports,
      label=rule.pickerTriggerLabel()??property.interactionReturn?.triggerLabel;
    picker?.close(); if (!rule.focusPickerTrigger()) Array.from(propertyTree?.querySelectorAll<HTMLButtonElement>("button")??[])
      .find((button)=>button.getAttribute("aria-label")===label)?.focus({preventScroll:true});
    rule.resetPickerState(); property.clearInteractionReturn();
  }
  cancel(event:Event):void { event.preventDefault(); this.close(); }
  navigate(event:KeyboardEvent):void {
    if(event.key==="Escape"){event.preventDefault();this.close();return;}
    if(!["ArrowDown","ArrowUp","Enter"].includes(event.key))return;
    const buttons=Array.from(this.#ports.picker?.querySelectorAll<HTMLButtonElement>("#schema-property-rule-results button:not(:disabled)")??[]),
      index=buttons.indexOf(this.#ports.document?.activeElement as HTMLButtonElement);
    if(event.key==="Enter"&&index>=0){event.preventDefault();buttons[index]?.click();return;}
    if(!buttons.length||event.key==="Enter")return; event.preventDefault();
    buttons[(index+(event.key==="ArrowDown"?1:-1)+buttons.length)%buttons.length]?.focus();
  }
  captureReturn(path:string,triggerLabel:string):void { const {property}=this.#ports;
    property.rememberInteractionReturn({schemaId:this.#ports.active().id,path,triggerLabel,
      editorScroll:this.#ports.schemaEditor?.scrollTop??0,treeScroll:this.#ports.propertyTree?.scrollTop??0,
      detailScroll:this.#ports.schemaDetail?.scrollTop??0}); }
  restoreReturn():void { const {property}=this.#ports,restoration=property.interactionReturn;
    if(!restoration||restoration.schemaId!==this.#ports.activeSchemaId())return; property.selectPath(restoration.path);
    if(this.#ports.schemaEditor)this.#ports.schemaEditor.scrollTop=restoration.editorScroll;
    if(this.#ports.propertyTree)this.#ports.propertyTree.scrollTop=restoration.treeScroll;
    if(this.#ports.schemaDetail)this.#ports.schemaDetail.scrollTop=restoration.detailScroll; this.#ports.renderSchemas(); }
  closeForCommit():void { this.restoreReturn(); this.#ports.property.clearInteractionReturn(); this.close(); }
  openAttached(schemaId:string,ruleId:string,path?:string,trigger?:HTMLButtonElement):boolean {
    const {rule}=this.#ports,schema=this.#ports.schemas().find(({id})=>id===schemaId),
      attached=(schema?.workingDraft?.attachedRules??schema?.attachedRules)?.find(({id})=>id===ruleId);
    if(!schema||!attached)return false; if(rule.stored(ruleId)){this.#ports.showSubview("schema-rule-library");return rule.edit(ruleId);}
    const propertyPath=path??attached.propertyPath??""; this.#ports.property.selectPath(propertyPath); rule.setPicker(propertyPath,trigger);
    rule.setEditingAttached(attached); rule.setConfiguration(createRuleConfigurationFromAttachedRule(ruleType(attached),this.#ports.propertyType(schema,propertyPath),attached));
    this.#ports.pickerView.render(); this.#ports.picker?.showModal();
    this.#ports.picker?.querySelector<HTMLElement>("input, select, textarea, button")?.focus({preventScroll:true}); return true;
  }
  #renderCondition():void { const {picker,rule}=this.#ports;if(!picker||!rule.pickerPath)return;
    picker.dataset.conditionPreview=JSON.stringify({propertyPath:this.normalizedPath(rule.pickerPath),...rule.conditionPredicate(rule.pickerPath)}); }
}

function ruleType(rule:NonNullable<SchemaDefinition["attachedRules"]>[number]):RuleConfiguration["ruleType"] {
  const operator=rule.operator?.replaceAll("_","-").toLowerCase();
  if(operator==="exact-value")return "Exact value";if(operator==="allowed-values")return "Allowed values";
  if(operator==="regular-expression"||operator==="regex")return "Regular expression";if(operator==="text-length")return "Text length";
  if(operator==="digits-only")return "Digits only";if(operator==="numeric-range")return "Numeric range";
  if(operator==="item-count")return "Item count";if(operator==="allow-undeclared-properties")return "Allow undeclared properties";return "Required";
}
