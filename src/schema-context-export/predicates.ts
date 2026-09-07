import {canonicalPropertyPath,type CanonicalPredicate,type CanonicalSchemaDocument} from "../data-layer-canonical-schema.js";
import type {StandardDocument} from "./contracts.js";

export const pointerParts=(path:string):string[]=>path.split("/").slice(1).map(value=>value.replaceAll("~1","/").replaceAll("~0","~"));
export const literalPattern=(value:unknown):string=>String(value??"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

/** Wrap an assertion at a payload path. Array item boundaries are explicit. */
export function assertionAt(parts:readonly string[],assertion:StandardDocument,requirePath=false):StandardDocument {
  const [name,...rest]=parts;
  if(name===undefined)return assertion;
  if(name==="*")return {items:assertionAt(rest,assertion,requirePath)};
  return {properties:{[name]:assertionAt(rest,assertion,requirePath)},...(requirePath?{required:[name]}:{})};
}

export function predicateSchema(document:CanonicalSchemaDocument,predicate:CanonicalPredicate,base:readonly string[]=[]):StandardDocument {
  if(predicate.kind!=="predicate"){
    const children=predicate.children.map(child=>predicateSchema(document,child,base));
    if(!children.length)throw new Error("Repair the empty condition.");
    if(predicate.kind==="not")return {not:children.length===1?children[0]:{allOf:children}};
    return {[predicate.kind==="all"?"allOf":"anyOf"]:children};
  }
  const node=document.nodes[predicate.propertyId];
  if(!node)throw new Error("Repair the broken condition property reference.");
  const full=pointerParts(canonicalPropertyPath(document,node.id));
  if(base.some((part,index)=>full[index]!==part))throw new Error("This cross-array condition needs compatibility review.");
  const parts=full.slice(base.length),value=structuredClone(predicate.value);
  let assertion:StandardDocument;
  switch(predicate.operator){
    case "Exists":return assertionAt(parts,{},true);
    case "Does not exist":return {not:assertionAt(parts,{},true)};
    case "Equals":assertion={const:value};break;
    case "Does not equal":assertion={not:{const:value}};break;
    case "Is one of":assertion={enum:value};break;
    case "Starts with":assertion={pattern:`^${literalPattern(value)}`};break;
    case "Contains":assertion=node.type==="array"?{contains:{const:value}}:{pattern:literalPattern(value)};break;
    case "Contains any of":assertion={contains:{enum:value}};break;
    case "Matches pattern":assertion={pattern:String(value)};break;
    case "Greater than":assertion={exclusiveMinimum:value};break;
    case "At least":assertion={minimum:value};break;
    case "Less than":assertion={exclusiveMaximum:value};break;
    case "At most":assertion={maximum:value};break;
  }
  return assertionAt(parts,assertion,true);
}
