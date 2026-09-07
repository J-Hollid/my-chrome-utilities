import {canonicalPropertyPath,type CanonicalItemSchema,type CanonicalPropertyNode,type CanonicalSchemaDocument} from "../data-layer-canonical-schema.js";
import type {JsonSchemaCompatibilityReview} from "../data-layer-json-schema-export.js";
import type {StandardDocument} from "./contracts.js";
import {appendCanonicalRules} from "./canonical-rules.js";

export function canonicalExportDocument(document:CanonicalSchemaDocument):{document:StandardDocument;compatibility:JsonSchemaCompatibilityReview} {
  const visited=new Set<string>(),active=new Set<string>();
  const children=(parentId?:string)=>Object.values(document.nodes).filter(node=>node.parentId===parentId).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
  const object=(nodes:CanonicalPropertyNode[],closed:boolean):StandardDocument=>{
    if(new Set(nodes.map(node=>node.name)).size!==nodes.length)throw new Error("Resolve duplicate property names before export.");
    const required=nodes.filter(node=>node.presence.mode==="required").map(node=>node.name);
    return {type:"object",properties:Object.fromEntries(nodes.map(node=>[node.name,property(node,closed)])),...(required.length?{required}:{}),...(closed?{additionalProperties:false}:{})};
  };
  const items=(item:CanonicalItemSchema|undefined,node:CanonicalPropertyNode,closed:boolean):StandardDocument=>{
    if(!item?.type)throw new Error(`${canonicalPropertyPath(document,node.id)}: set the array item type.`);
    let result:StandardDocument={type:item.type};
    if(item.type==="array")result.items=items(item.items,node,closed);
    if(item.type==="object")result=object(children(node.id),closed);
    if(item.allowedValues?.length)result.enum=structuredClone(item.allowedValues);
    return result;
  };
  const property=(node:CanonicalPropertyNode,inheritedClosure:boolean):StandardDocument=>{
    if(active.has(node.id))throw new Error("Repair the cyclic property reference.");
    active.add(node.id);visited.add(node.id);
    if(node.provenance.some(origin=>origin.state==="conflict"))throw new Error(`${node.name}: resolve the effective property conflict.`);
    const closed=node.onlyDefinedFields??inheritedClosure;
    let result:StandardDocument={type:node.type};
    if(node.type==="object")result=object(children(node.id),closed);
    if(node.type==="array")result.items=items(node.itemSchema??(node.itemType?{id:node.id,type:node.itemType}:undefined),node,closed);
    if(node.nullable&&node.type!=="null")result.type=[node.type,"null"];
    if(node.allowedValues.length)result.enum=structuredClone(node.allowedValues.map(entry=>entry.value));
    if(node.expectedValue!==undefined)result.const=structuredClone(node.expectedValue);
    if(node.documentation.description)result.description=node.documentation.description;
    if(node.documentation.example.method!=="blank")result.examples=[structuredClone(node.documentation.example.value)];
    if(node.concept?.trim())result["x-concept"]=node.concept.trim();
    active.delete(node.id);return result;
  };
  const result=object(children(),document.onlyDefinedFields===true);
  if(visited.size!==Object.keys(document.nodes).length)throw new Error("Repair the broken property parent reference.");
  const compatibility:JsonSchemaCompatibilityReview={omitted:[],conversions:[]};
  appendCanonicalRules(result,document,compatibility);
  return {document:result,compatibility};
}
