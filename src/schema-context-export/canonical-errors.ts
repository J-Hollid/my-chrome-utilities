import type {CanonicalPredicate,CanonicalRule,CanonicalSchemaDocument} from "../data-layer-canonical-schema.js";

export function assertConditionReferences(document:CanonicalSchemaDocument,condition:CanonicalPredicate|undefined):void {
  if(!condition)return;
  if(condition.kind==="predicate"){
    if(!document.nodes[condition.propertyId])throw new Error("Repair the broken condition property reference.");
    if(condition.operator==="Matches pattern")new RegExp(String(condition.value));
    return;
  }
  if(!condition.children.length)throw new Error("Repair the empty condition.");
  condition.children.forEach(child=>assertConditionReferences(document,child));
}

export function assertRuleValidity(rule:CanonicalRule,path:string):void {
  if(rule.presence?.endsWith("-when")&&!rule.condition)throw new Error(`${path}: repair the missing condition.`);
  if(rule.kind==="value"&&rule.expectedValue===undefined)throw new Error(`${path}: set the expected value.`);
  if(rule.kind==="allowed-values"&&!rule.allowedValues?.length)throw new Error(`${path}: set the allowed values.`);
  for(const key of ["minimum","maximum","minItems","maxItems"] as const){
    const value=rule[key];
    if(value!==undefined&&(!Number.isFinite(value)||(key.endsWith("Items")&&(!Number.isInteger(value)||value<0))))throw new Error(`${path}: repair the invalid ${key}.`);
  }
  if(rule.minimum!==undefined&&rule.maximum!==undefined&&rule.minimum>rule.maximum)throw new Error(`${path}: repair the conflicting numeric limits.`);
  if(rule.minItems!==undefined&&rule.maxItems!==undefined&&rule.minItems>rule.maxItems)throw new Error(`${path}: repair the conflicting cardinality limits.`);
}
