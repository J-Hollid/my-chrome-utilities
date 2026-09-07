import {exportJsonSchemaResource} from "../data-layer-json-schema-export.js";
import {canonicalExportDocument} from "./canonical-document.js";
import type {ContextExportSource,StandardDocument} from "./contracts.js";

function merge(base:StandardDocument,local:StandardDocument):StandardDocument {
  const result={...base,...local};
  for(const key of ["properties","$defs"]){
    const inherited=(base[key]??{}) as Record<string,StandardDocument>,own=local[key] as Record<string,StandardDocument>|undefined;
    if(own)result[key]={...inherited,...Object.fromEntries(Object.entries(own).map(([name,value])=>[name,merge(inherited[name]??{},value)]))};
  }
  if(base.items&&local.items&&typeof base.items==="object"&&typeof local.items==="object")result.items=merge(base.items as StandardDocument,local.items as StandardDocument);
  for(const key of ["required","allOf"]){const inherited=base[key] as unknown[]|undefined,own=local[key] as unknown[]|undefined;if(inherited&&own)result[key]=[...inherited,...own];}
  return result;
}

/** Keep the accepted Saved Schema projection and parent chain; canonical rules own local assertions. */
export function savedCanonicalExportDocument(source:ContextExportSource) {
  const schema=source.schema!;
  const inherited=exportJsonSchemaResource(schema,source.schemas??[schema]);
  const local=canonicalExportDocument(source.canonical!);
  const legacySupported=new Set((schema.attachedRules??[]).filter(rule=>rule.enabled!==false&&!inherited.compatibility.omitted.some(item=>item.ruleId===rule.id)).map(rule=>rule.id));
  const canonicalSupported=new Set(Object.values(source.canonical!.nodes).flatMap(node=>node.rules).filter(rule=>rule.enabled!==false&&!local.compatibility.omitted.some(item=>item.ruleId===rule.id)).map(rule=>rule.id));
  const omitted=[...inherited.compatibility.omitted.filter(item=>!canonicalSupported.has(item.ruleId)),...local.compatibility.omitted.filter(item=>!legacySupported.has(item.ruleId))];
  const unique=<T extends {ruleId:string;propertyPath:string}>(items:T[]):T[]=>[...new Map(items.map(item=>[`${item.ruleId}\0${item.propertyPath}`,item])).values()];
  return {document:merge(inherited.document,local.document),compatibility:{omitted:unique(omitted),conversions:unique([...inherited.compatibility.conversions,...local.compatibility.conversions])}};
}
