import type {CanonicalIdFactory,CanonicalPredicate} from "./data-layer-canonical-schema.js";

const clone=<T>(value:T):T=>structuredClone(value);

/** Add deterministic identities only when a legacy predicate has none. Existing IDs survive reordering. */
export function canonicalPredicateWithStableIds(predicate:CanonicalPredicate|undefined,id:CanonicalIdFactory=(kind)=>`${kind}:predicate`,path="root"):CanonicalPredicate|undefined {
  if(!predicate)return undefined;
  if(predicate.kind==="predicate")return{...clone(predicate),id:predicate.id??id(`condition-${path}`)};
  return{...clone(predicate),id:predicate.id??id(`condition-${path}`),children:predicate.children.map((child,index)=>canonicalPredicateWithStableIds(child,id,`${path}.${index}`)!) };
}

export function canonicalPredicateIds(predicate:CanonicalPredicate|undefined):string[] {
  if(!predicate)return[];
  return[predicate.id??"",...(predicate.kind==="predicate"?[]:predicate.children.flatMap(canonicalPredicateIds))].filter(Boolean);
}
