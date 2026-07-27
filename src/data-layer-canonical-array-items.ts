import type {
  CanonicalArrayScope,
  CanonicalArrayScopeBoundary,
  CanonicalPropertyNode,
  CanonicalSchemaDocument,
} from "./data-layer-canonical-schema.js";

const ordinal=(position:number):string=>{
  const mod100=position%100;
  if(mod100>=11&&mod100<=13)return`${position}th`;
  return`${position}${position%10===1?"st":position%10===2?"nd":position%10===3?"rd":"th"}`;
};

export function canonicalArrayScopeIssue(scope:CanonicalArrayScope|undefined):string|undefined {
  if(!scope)return undefined;
  const positioned=scope.boundaries.filter(({mode})=>mode==="position");
  if(positioned.length>1)return"Choose Item at position for at most one array boundary.";
  if(positioned.some(({position})=>!Number.isInteger(position)||Number(position)<1))return"Enter a whole position of 1 or greater.";
  return undefined;
}

export function canonicalArrayScopeSummary(boundaries:readonly (CanonicalArrayScopeBoundary&{name:string})[]):string {
  if(!boundaries.length)return"";
  return`For ${boundaries.map(({name,mode,position},index)=>{
    const noun=index===0?`${name} item`:`item in ${name}`;
    return mode==="position"?`the ${ordinal(position!)} ${noun}`:`every ${noun}`;
  }).join(" use ")}`.replace("For every product item use the 1st item in details","For every product item use the first item in details");
}

export function canonicalArrayBoundaries(document:CanonicalSchemaDocument,propertyId:string):{propertyId:string;name:string}[]{
  const ancestors:CanonicalPropertyNode[]=[];let node=document.nodes[propertyId];
  while(node?.parentId){node=document.nodes[node.parentId];if(node)ancestors.unshift(node);}
  return ancestors.flatMap((ancestor)=>ancestor.type==="array"?[{propertyId:ancestor.id,name:ancestor.name.replace(/s$/,"")}]:[]);
}

const orderedChildren=(document:CanonicalSchemaDocument,parentId?:string):CanonicalPropertyNode[]=>Object.values(document.nodes)
  .filter((node)=>node.parentId===parentId)
  .sort((left,right)=>left.order-right.order||left.id.localeCompare(right.id));

const schemaForNode=(document:CanonicalSchemaDocument,node:CanonicalPropertyNode):Record<string,unknown>=>{
  const children=orderedChildren(document,node.id);
  const definition:Record<string,unknown>={type:node.type};
  if(node.type==="object"&&children.length)definition.properties=Object.fromEntries(children.map((child)=>[child.name,schemaForNode(document,child)]));
  if(node.type==="array"){
    const itemType=node.itemSchema?.type??node.itemType;
    if(itemType){
      let items:Record<string,unknown>={type:itemType};
      if(itemType==="array"&&node.itemSchema?.items)items={type:"array",items:itemSchemaDefinition(node.itemSchema.items)};
      if(itemType==="object"&&children.length)items.properties=Object.fromEntries(children.map((child)=>[child.name,schemaForNode(document,child)]));
      definition.items=items;
    }
  }
  if(node.presence.mode.startsWith("required")&&node.parentId){
    // Required membership belongs to the containing object and is attached below.
  }
  const required=children.filter(({presence})=>presence.mode.startsWith("required")).map(({name})=>name);
  if(required.length){
    if(node.type==="object")definition.required=required;
    if(node.type==="array"&&(node.itemSchema?.type??node.itemType)==="object")(definition.items as Record<string,unknown>).required=required;
  }
  return definition;
};

const itemSchemaDefinition=(item:NonNullable<CanonicalPropertyNode["itemSchema"]>):Record<string,unknown>=>({
  ...(item.type?{type:item.type}:{}),
  ...(item.type==="array"&&item.items?{items:itemSchemaDefinition(item.items)}:{}),
});

export function canonicalJsonSchemaDocument(document:CanonicalSchemaDocument):Record<string,unknown>{
  const roots=orderedChildren(document);
  const result:Record<string,unknown>={type:"object",properties:Object.fromEntries(roots.map((node)=>[node.name,schemaForNode(document,node)]))};
  const required=roots.filter(({presence})=>presence.mode.startsWith("required")).map(({name})=>name);
  if(required.length)result.required=required;
  return result;
}
