import type {CanonicalItemSchema,CanonicalPropertyNode,CanonicalPropertyType,CanonicalSchemaDocument} from "../data-layer-canonical-schema.js";
import {canonicalFlatPredicateIssue} from "./predicate-policy.js";

const itemTypes=(schema:CanonicalItemSchema|undefined,fallback:CanonicalPropertyType|undefined):CanonicalPropertyType[]=>{const values:CanonicalPropertyType[]=[];let current=schema;if(!current&&fallback)values.push(fallback);while(current?.type){values.push(current.type);current=current.items;}return values;};
const itemSchema=(propertyId:string,itemType:CanonicalPropertyType):CanonicalItemSchema=>({id:`item:${propertyId}`,type:itemType});

export function canonicalSetConditionIssue(patch:Partial<CanonicalPropertyNode>):string|undefined{
  const conditions=[...(patch.presence&&Object.hasOwn(patch.presence,"condition")?[patch.presence.condition]:[]),...(patch.rules??[]).flatMap((rule)=>Object.hasOwn(rule,"condition")?[rule.condition]:[])];
  return conditions.map(canonicalFlatPredicateIssue).find(Boolean);
}

export function canonicalTypeTransition(node:CanonicalPropertyNode,nextType:CanonicalPropertyType,nextItemType:CanonicalPropertyType|undefined,nextItemSchema:CanonicalItemSchema|undefined,descendants:readonly string[],document:CanonicalSchemaDocument){
  const itemChanged=node.type==="array"&&nextType==="array"&&node.itemType!==undefined&&node.itemType!==nextItemType,recursiveItemChanged=node.type==="array"&&nextType==="array"&&!itemChanged&&node.itemSchema!==undefined&&JSON.stringify(itemTypes(node.itemSchema,node.itemType))!==JSON.stringify(itemTypes(nextItemSchema,nextItemType)),arrayBoundaryRemoved=node.type==="array"&&nextType!=="array"&&Boolean(node.itemSchema??node.itemType??descendants.length),objectChildrenRemoved=node.type==="object"&&nextType!=="object"&&descendants.length>0,removeDescendants=descendants.length>0&&(objectChildrenRemoved||arrayBoundaryRemoved||itemChanged||recursiveItemChanged),names=descendants.map((id)=>document.nodes[id]?.name).filter(Boolean).join(", "),impact=objectChildrenRemoved?"child definitions and documentation removed; destructive confirmation required":arrayBoundaryRemoved?`item boundary${names?` and item fields ${names}`:""} removed when type changes from Array to ${nextType}`:recursiveItemChanged?`item boundary${names?` and item fields ${names}`:""} removed when recursive item shape changes from ${itemTypes(node.itemSchema,node.itemType).join(" → ")} to ${itemTypes(nextItemSchema,nextItemType).join(" → ")}`:itemChanged?`${names?`item fields ${names} removed when `:""}every item changes from ${node.itemType??"unspecified"} to ${nextItemType??"unspecified"}`:undefined;
  return{confirmationRequired:Boolean(impact),removeDescendants,impact};
}

export function normalizeCanonicalTypeShape(node:CanonicalPropertyNode,nextType:CanonicalPropertyType,patchHasItemType:boolean,patchHasItemSchema:boolean):void{
  if(nextType!=="array"){delete node.itemType;delete node.itemSchema;}
  else if(patchHasItemType&&node.itemType&&!patchHasItemSchema)node.itemSchema=itemSchema(node.id,node.itemType);
}
