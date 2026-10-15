import {canonicalTableRows,canonicalSchemaFromJsonSchema,type CanonicalSchemaDocument} from "../data-layer-canonical-schema.js";
import {record} from "./contract.js";

export function agentCanonicalSchema(id:string,name:string,schema:Record<string,unknown>,previous?:CanonicalSchemaDocument):CanonicalSchemaDocument {
  let sequence=0;
  const revision=(previous?.revision??0)+1;
  const document=canonicalSchemaFromJsonSchema({id:previous?.id??`schema:${id}`,contributorId:id,contributorName:name,sourceIdentity:`agent:${id}`,sourceRevision:revision,document:schema,idFactory:kind=>`${kind}:${id}:r${revision}:${++sequence}`});
  if(!previous)return {...document,revision};
  const prior=new Map(canonicalTableRows(previous).map(row=>[row.path,row.node.id]));
  const ids=new Map(canonicalTableRows(document).flatMap(row=>prior.has(row.path)?[[row.node.id,prior.get(row.path)!] as const]:[]));
  const rewrite=(value:unknown,key=""):unknown=>{
    if(typeof value==="string"&&["id","parentId","propertyId","rootIds","selectedPropertyId","propertyIds","overrideReferences"].includes(key))return ids.get(value)??value;
    if(Array.isArray(value))return value.map(item=>rewrite(item,key));
    if(record(value))return Object.fromEntries(Object.entries(value).map(([field,item])=>[["nodes","definitionsByNodeId","pathsByNodeId"].includes(key)?ids.get(field)??field:field,rewrite(item,field)]));
    return value;
  };
  return {...rewrite(document) as CanonicalSchemaDocument,revision};
}
