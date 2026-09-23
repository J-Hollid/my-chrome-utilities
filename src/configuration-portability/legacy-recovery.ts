import {COMPLETE_CONFIGURATION_DOMAINS,type CompleteConfigurationSnapshot,
  type ConfigurationRecord} from "./domain-inventory.js";

interface RecoveryBundle {
  format:string;version:number;projects:unknown[];savedSchemas:unknown[];
  metadata?:unknown[];settings?:unknown[];
}
const record=(value:unknown):value is Record<string,unknown>=>
  Boolean(value&&typeof value==="object"&&!Array.isArray(value));
const digest=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest(
  "SHA-256",Uint8Array.from(bytes).buffer)),(byte)=>byte.toString(16).padStart(2,"0")).join("");

export function legacyRecoveryBlockers(value:unknown):string[]{
  if(!record(value)||!Array.isArray(value.projects))return["The recovery file has no project list."];
  const incomplete=value.projects.some((item)=>{
    if(!record(item)||!record(item.project))return true;
    const project=item.project,assets=project.conceptVisualAssets,
      documentation=record(project.documentation)?project.documentation:undefined,
      templates=documentation?.templates;
    return Array.isArray(assets)&&assets.length>0||Array.isArray(templates)&&templates.some(
      (template)=>record(template)&&record(template.body));
  });
  return incomplete?["Export a new complete configuration ZIP from the source profile. The recovery JSON does not carry the required image or Excel bodies."]:[];
}

export async function inspectLegacyRepositoryRecovery(value:unknown):Promise<CompleteConfigurationSnapshot>{
  if(!record(value)||value.format!=="my-chrome-utilities.durable-repository-recovery-bundle"||
      value.version!==2||!Array.isArray(value.projects)||!Array.isArray(value.savedSchemas)){
    throw new DOMException("Choose a version 2 repository recovery JSON file.","DataError");
  }
  const blockers=legacyRecoveryBlockers(value);
  if(blockers.length)throw new DOMException(blockers.join(" "),"DataError");
  const bundle=value as unknown as RecoveryBundle,
    sections=Object.fromEntries(COMPLETE_CONFIGURATION_DOMAINS.map((domain)=>[domain,[]])) as
      unknown as CompleteConfigurationSnapshot["sections"],
    metadata=new Map((bundle.metadata??[]).filter(record).map((item)=>[String(item.projectId),item]));
  const bodies:CompleteConfigurationSnapshot["bodies"]=[];
  for(const item of bundle.projects){
    if(!record(item)||item.format!=="my-chrome-utilities.durable-project-bundle"||
        item.version!==2||!record(item.project)||typeof item.project.id!=="string"||
        typeof item.project.name!=="string")throw new DOMException(
      "The recovery file has an invalid durable project bundle.","DataError");
    const id=item.project.id,bytes=new TextEncoder().encode(JSON.stringify(item)),
      archiveDigest=`legacy-project:${id}`;
    bodies.push({digest:archiveDigest,mediaType:"application/json",bytes});
    sections.projects.push({id,value:{name:item.project.name,archiveDigest,
      archiveContentDigest:await digest(bytes),...(metadata.has(id)?{metadata:metadata.get(id)}:{})}});
  }
  sections.savedSchemas=bundle.savedSchemas.map((item):ConfigurationRecord=>{
    const schema=record(item)&&record(item.schema)?item.schema:item;
    if(!record(schema)||typeof schema.id!=="string"||!schema.id)throw new DOMException(
      "The recovery file has a saved schema without an identity.","DataError");
    return{id:schema.id,value:structuredClone(schema)};
  });
  const active=(bundle.settings??[]).filter(record).find((item)=>item.key==="activeProjectId")?.value;
  return{activeProjectId:typeof active==="string"?active:null,sections,bodies};
}
