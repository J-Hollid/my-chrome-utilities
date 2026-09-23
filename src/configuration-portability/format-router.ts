import {readStoredZip} from "../flow-visual-zip.js";
import {legacyRecoveryBlockers} from "./legacy-recovery.js";

export type ConfigurationImportRoute="complete-configuration"|"project"|"repository-recovery"|"schema-library";
export interface ConfigurationImportRouting {route:ConfigurationImportRoute;format:string;blockers:string[];}

const decoder=new TextDecoder();
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value&&typeof value==="object"&&!Array.isArray(value));
const jsonRoute=(value:unknown):ConfigurationImportRouting=>{
  if(!record(value))throw new DOMException("Choose a supported configuration, project, recovery, or Schema Library file.","DataError");
  const format=String(value.format??"");
  if(["my-chrome-utilities.specification-project","my-chrome-utilities.specification-project-state","my-chrome-utilities.project-bundle","my-chrome-utilities.durable-project-bundle"].includes(format))return{route:"project",format,blockers:[]};
  if(format==="my-chrome-utilities.durable-repository-recovery-bundle"){
    return{route:"repository-recovery",format,blockers:legacyRecoveryBlockers(value)};
  }
  if(format==="my-chrome-utilities.schema-library"||format==="my-chrome-utilities.schema-library-backup"||Array.isArray(value.schemas)&&Array.isArray(value.rules))return{route:"schema-library",format:format||"schema-library",blockers:[]};
  throw new DOMException("The selected JSON format is not supported by configuration setup.","NotSupportedError");
};

export async function inspectConfigurationImportRoute(source:Blob):Promise<ConfigurationImportRouting>{
  const prefix=new Uint8Array(await source.slice(0,4).arrayBuffer());
  if(prefix[0]===80&&prefix[1]===75){
    const entries=await readStoredZip(source),manifestEntry=entries.get("manifest.json");
    if(!manifestEntry)throw new DOMException("The selected ZIP has no manifest.","DataError");
    const manifest=JSON.parse(decoder.decode(await manifestEntry.arrayBuffer())) as {format?:unknown};
    if(manifest.format==="my-chrome-utilities.complete-configuration")return{route:"complete-configuration",format:String(manifest.format),blockers:[]};
    if(manifest.format==="my-chrome-utilities.project-archive")return{route:"project",format:String(manifest.format),blockers:[]};
    throw new DOMException("The selected ZIP format is not supported by configuration setup.","NotSupportedError");
  }
  return jsonRoute(JSON.parse(await source.text()));
}
