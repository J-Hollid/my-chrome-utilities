import { canonicalDocumentationPath, setPropertyDocumentation } from "../../data-layer-schema-documentation.js";
import type { JsonSchema, SchemaDefinition } from "../../data-layer-schema-verification.js";
import { updateSchemaWorkingDraft } from "../../data-layer-schema-verification.js";

type InferredType = JsonSchema["type"];
type Scalar = string | number | boolean | null;

export interface LiveSchemaBulkRow {
  path:string;
  type:InferredType;
  example?:Scalar;
  state:"add"|"preserve"|"blocked";
  reason?:string;
}

export interface LiveSchemaBulkReview {
  rows:readonly LiveSchemaBulkRow[];
  added:readonly string[];
  preserved:readonly string[];
  blocked:readonly string[];
}

interface Observation { types:Set<InferredType|"null">; first?:Scalar; hasFirst:boolean; }

const encode=(value:string):string=>value.replaceAll("~","~0").replaceAll("/","~1");
const segments=(path:string):string[]=>path.split("/").slice(1).map((value)=>value.replaceAll("~1","/").replaceAll("~0","~"));
const observedType=(value:unknown):InferredType|"null"=>value===null?"null":Array.isArray(value)?"array":typeof value==="object"?"object":
  typeof value==="string"?"string":typeof value==="number"?"number":typeof value==="boolean"?"boolean":undefined;

function observe(payload:unknown):Map<string,Observation> {
  const values=new Map<string,Observation>();
  const visit=(value:unknown,path:string):void=>{
    const type=observedType(value); if (!type) return;
    const current=values.get(path)??{types:new Set(),hasFirst:false}; current.types.add(type);
    if (!current.hasFirst&&(type==="null"||type==="string"||type==="number"||type==="boolean")) {
      current.first=value as Scalar; current.hasFirst=true;
    }
    values.set(path,current);
    if (Array.isArray(value)) for (const item of value) visit(item,`${path}/*`);
    else if (value&&typeof value==="object") for (const [key,child] of Object.entries(value as Record<string,unknown>)) visit(child,`${path}/${encode(key)}`);
  };
  if (payload&&typeof payload==="object"&&!Array.isArray(payload)) for (const [key,value] of Object.entries(payload as Record<string,unknown>)) visit(value,`/${encode(key)}`);
  return values;
}

function inferred(observation:Observation):InferredType {
  const concrete=[...observation.types].filter((value):value is InferredType=>value!=="null");
  return new Set(concrete).size===1&&observation.types.size===1?concrete[0]:undefined;
}

function definitionAt(document:JsonSchema,path:string):JsonSchema|undefined {
  let current:JsonSchema|undefined=document;
  for (const segment of segments(path)) current=segment==="*"?current?.items:current?.properties?.[segment];
  return current;
}

function effectiveDocuments(schema:SchemaDefinition,schemas:readonly SchemaDefinition[]):JsonSchema[] {
  const result:JsonSchema[]=[schema.workingDraft?.document??schema.document],seen=new Set([schema.id]); let parentId=schema.workingDraft?.parentSchemaId??schema.parentSchemaId;
  while(parentId&&!seen.has(parentId)){seen.add(parentId);const parent=schemas.find(({id})=>id===parentId);if(!parent)break;result.push(parent.workingDraft?.document??parent.document);parentId=parent.workingDraft?.parentSchemaId??parent.parentSchemaId;}
  return result;
}

function blockedByParent(documents:readonly JsonSchema[],path:string):string|undefined {
  const parts=segments(path); let prefix="";
  for (let index=0;index<parts.length-1;index++) { prefix+=`/${parts[index]}`;
    for (const document of documents) { const parent=definitionAt(document,prefix); if(parent?.type&&parent.type!==(parts[index+1]==="*"?"array":"object")) return prefix; }
  }
}

function insert(document:JsonSchema,path:string,type:InferredType):JsonSchema {
  const root=structuredClone(document),parts=segments(path); let current=root;
  for(let index=0;index<parts.length;index++) { const part=parts[index];if(part===undefined)continue;const last=index===parts.length-1;
    if(part==="*"){current.items??={};if(last&&type)current.items.type=type;current=current.items;continue;}
    current.properties??={};current.properties[part]??={};if(last&&type)current.properties[part].type=type;
    else if(!last&&!current.properties[part].type)current.properties[part].type=parts[index+1]==="*"?"array":"object";current=current.properties[part]!;
  }
  return root;
}

export function reviewLiveSchemaBulk(payload:unknown,schema:SchemaDefinition,schemas:readonly SchemaDefinition[]):LiveSchemaBulkReview {
  const documents=effectiveDocuments(schema,schemas),rows=[...observe(payload)].map(([path,observation]):LiveSchemaBulkRow=>{
    if(documents.some((document)=>definitionAt(document,path)))return{path,type:inferred(observation),state:"preserve"};
    const blocked=blockedByParent(documents,path);if(blocked)return{path,type:inferred(observation),state:"blocked",reason:`${blocked} has an incompatible existing type`};
    return{path,type:inferred(observation),...(observation.hasFirst?{example:observation.first}:{}),state:"add"};
  }).sort((left,right)=>left.path.localeCompare(right.path));
  return{rows,added:rows.filter(({state})=>state==="add").map(({path})=>path),preserved:rows.filter(({state})=>state==="preserve").map(({path})=>path),blocked:rows.filter(({state})=>state==="blocked").map(({path})=>path)};
}

export function applyLiveSchemaBulk(schema:SchemaDefinition,review:LiveSchemaBulkReview):SchemaDefinition {
  if(!review.added.length)return structuredClone(schema);
  const editable=updateSchemaWorkingDraft(schema,{}),draft=editable.workingDraft!;let document=structuredClone(draft.document),documentation=structuredClone(draft.documentation??{});
  for(const row of review.rows.filter(({state})=>state==="add")){document=insert(document,row.path,row.type);
    if("example" in row)documentation=setPropertyDocumentation(documentation,canonicalDocumentationPath(row.path),{displayName:"",description:"",example:{value:row.example!,selectionMethod:"custom"}});}
  return updateSchemaWorkingDraft(editable,{document,documentation},`Add ${review.added.length} observed properties`);
}

export function createLiveSchemaBulkDraft(name:string,id=`schema-${crypto.randomUUID()}`):SchemaDefinition {
  const clean=name.trim();if(!clean)throw new Error("Enter a schema name");
  return{id,name:clean,version:1,document:{type:"object"},assignments:[],published:false,workingDraft:{name:clean,baseVersion:0,sourceVersion:0,
    document:{type:"object"},assignments:[],pendingChanges:[]}};
}
