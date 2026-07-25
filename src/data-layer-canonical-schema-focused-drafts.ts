import type {CanonicalPropertyNode} from "./data-layer-canonical-schema.js";

const clone=<T>(value:T):T=>structuredClone(value);
const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
export type CanonicalFocusedPatch=Partial<Omit<CanonicalPropertyNode,"id"|"parentId"|"order"|"provenance">>;

export function focusedSourceState(node:CanonicalPropertyNode):"inherited"|"local"|"overridden"|"conflict" {
  if(node.provenance.some(({state})=>state==="shadowed"))return "overridden";
  if(node.provenance.some(({state})=>state==="inherited"))return "inherited";
  return "local";
}

export function focusedPropertyPatch(node:CanonicalPropertyNode,original:CanonicalPropertyNode,removedRuleIds:Set<string>,removedValueIds:Set<string>=new Set()):CanonicalFocusedPatch {
  const patch:CanonicalFocusedPatch={};
  for(const key of ["name","type","itemType","presence","allowedValues","documentation","overrideReferences","expectedValue","enforcement","target"] as const)if(!same(node[key],original[key]))Object.assign(patch,{[key]:clone(node[key])});
  const nextRules=node.rules.filter(({id})=>!removedRuleIds.has(id));if(!same(nextRules,original.rules)||removedRuleIds.size)patch.rules=clone(nextRules);
  const nextValues=node.allowedValues.filter(({id})=>!removedValueIds.has(id));if(!same(nextValues,original.allowedValues)||removedValueIds.size)patch.allowedValues=clone(nextValues);
  return patch;
}

export function focusedStagedChanges(node:CanonicalPropertyNode,original:CanonicalPropertyNode,removedRuleIds:Set<string>,path:string,removedValueIds:Set<string>=new Set()):{label:string;detail:string}[] {
  const changes=Object.keys(focusedPropertyPatch(node,original,removedRuleIds,removedValueIds)).filter((key)=>key!=="rules"&&key!=="allowedValues").map((key)=>({label:key==="name"?"Edited name":`Edited ${key}`,detail:`${key} staged for ${path}`}));
  const originalRules=new Map(original.rules.map((rule)=>[rule.id,rule])),nextRules=new Map(node.rules.map((rule)=>[rule.id,rule]));for(const rule of original.rules){if(removedRuleIds.has(rule.id)||!nextRules.has(rule.id))changes.push({label:"Removed rule",detail:`${rule.id} · affected consumers recompile`});else if(JSON.stringify(rule)!==JSON.stringify(nextRules.get(rule.id)))changes.push({label:"Edited rule",detail:`${rule.id} · prospective result ${JSON.stringify(nextRules.get(rule.id))}`});}for(const rule of node.rules)if(!originalRules.has(rule.id))changes.push({label:"Added rule",detail:`${rule.id} · prospective result ${JSON.stringify(rule)}`});
  const originalValues=new Map(original.allowedValues.map((value)=>[value.id,value])),nextValues=new Map(node.allowedValues.map((value)=>[value.id,value]));for(const value of original.allowedValues){if(removedValueIds.has(value.id)||!nextValues.has(value.id))changes.push({label:"Removed value",detail:`${value.id} · affected consumers recompile`});else if(JSON.stringify(value)!==JSON.stringify(nextValues.get(value.id)))changes.push({label:"Edited value",detail:`${value.id} · prospective result ${JSON.stringify(nextValues.get(value.id))}`});}for(const value of node.allowedValues)if(!originalValues.has(value.id))changes.push({label:"Added value",detail:`${value.id} · prospective result ${JSON.stringify(value.value)}`});return changes;
}
