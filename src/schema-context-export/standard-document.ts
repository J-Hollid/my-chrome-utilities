import type {JsonSchema} from "../data-layer-schema-verification.js";
import type {StandardDocument} from "./contracts.js";
const scalarKeywords=["$ref","$anchor","type","const","enum","description","title","examples","minimum","maximum","exclusiveMinimum","exclusiveMaximum","multipleOf","minLength","maxLength","pattern","minItems","maxItems","uniqueItems","minContains","maxContains","minProperties","maxProperties","x-concept"];
const singleSchemas=["items","contains","not","if","then","else","propertyNames","unevaluatedProperties","unevaluatedItems"];
const arraySchemas=["allOf","anyOf","oneOf","prefixItems"];
const maps=["properties","patternProperties","$defs","dependentSchemas"];

/** Standard keywords only; payload property names are never treated as metadata. */
export function standardDocument(source:JsonSchema,closeObjects:boolean):StandardDocument {
  const value=source as Record<string,unknown>,result:StandardDocument={};
  for(const key of scalarKeywords)if(value[key]!==undefined)result[key]=structuredClone(value[key]);
  if(source.required?.length)result.required=[...source.required];
  for(const key of maps)if(value[key]&&typeof value[key]==="object")result[key]=Object.fromEntries(Object.entries(value[key] as Record<string,JsonSchema>).map(([name,child])=>[name,typeof child==="boolean"?child:standardDocument(child,closeObjects)]));
  for(const key of singleSchemas)if(value[key]!==undefined)result[key]=typeof value[key]==="boolean"?value[key]:standardDocument(value[key] as JsonSchema,closeObjects);
  for(const key of arraySchemas)if(Array.isArray(value[key]))result[key]=(value[key] as JsonSchema[]).map(child=>typeof child==="boolean"?child:standardDocument(child,closeObjects));
  if(value.dependentRequired)result.dependentRequired=structuredClone(value.dependentRequired);
  if(source.type==="object"&&closeObjects)result.additionalProperties=false;
  else if(source.additionalProperties!==undefined)result.additionalProperties=typeof source.additionalProperties==="boolean"?source.additionalProperties:standardDocument(source.additionalProperties as JsonSchema,closeObjects);
  if(source.forbidden?.length)result.not={anyOf:source.forbidden.map(name=>({required:[name]}))};
  return result;
}
