import type {ContextExportSource} from "./contracts.js";

export function assertSourceReferences(source:ContextExportSource):void {
  const schema=source.schema;
  if(!schema)return;
  const seen=new Set<string>(),chain:typeof schema[]=[];let current:typeof schema|undefined=schema;
  while(current){
    if(seen.has(current.id))throw new Error("Repair the cyclic parent schema reference.");
    seen.add(current.id);
    chain.push(current);
    if(!current.parentSchemaId)break;
    current=source.schemas?.find(item=>item.id===current!.parentSchemaId);
    if(!current)throw new Error("Repair the missing parent schema reference.");
  }
  for(const owner of chain){
  const root=owner.document as Record<string,unknown>;
  const visit=(value:unknown,path:string):void=>{
    if(value===null||typeof value!=="object"||Array.isArray(value))return;
    const node=value as Record<string,unknown>;
    if(node.$ref!==undefined){
      if(typeof node.$ref!=="string"||!(node.$ref==="#"||node.$ref.startsWith("#/")))throw new Error(`${path}: repair the schema reference; export needs a local reference.`);
      let target:unknown=root;
      for(const part of node.$ref==="#"?[]:node.$ref.slice(2).split("/")){const key=part.replaceAll("~1","/").replaceAll("~0","~");target=target&&typeof target==="object"?Object.getOwnPropertyDescriptor(target,key)?.value:undefined;}
      if(target===undefined)throw new Error(`${path}: repair the broken schema reference ${node.$ref}.`);
    }
    if(node.type==="array"&&node.items===undefined&&!node.$ref)throw new Error(`${path}: set the array item type.`);
    if(typeof node.pattern==="string"){try{new RegExp(node.pattern);}catch{throw new Error(`${path}: repair the invalid pattern.`);}}
    for(const key of ["properties","$defs","patternProperties","dependentSchemas"]){const map=node[key];if(map&&typeof map==="object")for(const[name,child]of Object.entries(map))visit(child,`${path}/${name}`);}
    for(const key of ["items","contains","additionalProperties","not","if","then","else"])visit(node[key],`${path}/${key}`);
    for(const key of ["allOf","anyOf","oneOf","prefixItems"])if(Array.isArray(node[key]))(node[key] as unknown[]).forEach((child,index)=>visit(child,`${path}/${key}/${index}`));
  };
  visit(root,"");
  }
}
