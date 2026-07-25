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
  return Object.keys(focusedPropertyPatch(node,original,removedRuleIds,removedValueIds)).map((key)=>({label:key==="rules"?"Edit rules":key==="allowedValues"?"Edit values":`Edit ${key}`,detail:`${key} staged for ${path}`}));
}
