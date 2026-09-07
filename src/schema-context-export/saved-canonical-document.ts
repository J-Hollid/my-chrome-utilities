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
  const schema={...source.schema!,attachedRules:[]};
  const inherited=exportJsonSchemaResource(schema,source.schemas??[schema]);
  const local=canonicalExportDocument(source.canonical!);
  return {document:merge(inherited.document,local.document),compatibility:{omitted:[...inherited.compatibility.omitted,...local.compatibility.omitted],conversions:[...inherited.compatibility.conversions,...local.compatibility.conversions]}};
}
