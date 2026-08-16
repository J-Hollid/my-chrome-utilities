import type {SpecificationProject} from "./data-layer-specification-project.js";
import {readStoredZip} from "./flow-visual-zip.js";
import {validateFlowVisualBody,validateFlowVisualMetadata,type FlowVisualAssetMetadata} from "./flow-visual-asset-validation.js";
import {assertFlowVisualArchiveManifest,parseFlowVisualArchiveJson as parseJson,withoutEmbeddedFlowVisualBodies as withoutEmbeddedBodies,type FlowVisualArchiveManifest as ArchiveManifest} from "./flow-visual-archive-format.js";
import {flowVisualAssetReferences as assetReferences,flowVisualProjectMapping as projectMapping,remapFlowVisualProject as remap} from "./flow-visual-project-identity.js";
export {createMemoryFlowVisualAssetStore} from "./flow-visual-asset-memory-store.js";
export {createFlowVisualArchive,estimateFlowVisualArchiveSize,writeFlowVisualArchive} from "./flow-visual-archive-export.js";

export type {FlowVisualAssetMetadata} from "./flow-visual-asset-validation.js";
export interface FlowVisualStoredAsset {metadata:FlowVisualAssetMetadata;body:Blob;}
export interface FlowVisualArchiveAsset {metadata:FlowVisualAssetMetadata;body:Blob|(()=>Promise<Blob>);}
export interface FlowVisualAssetTrace {metadataReads:number;bodyReads:number;metadataWrites:number;bodyWrites:number;bodyDeletes:number;}
export interface FlowVisualArchiveImport {formatVersion:3;project:SpecificationProject;publishedProject?:SpecificationProject;assets:FlowVisualStoredAsset[];migrations:string[];}
export interface FlowVisualArchiveProgress {phase:"manifest"|"validate"|"write"|"read";entry?:string;completed:number;total:number;}
const clone=<T>(value:T):T=>structuredClone(value);
type ArchiveInput=Partial<{projectId:string;id:(oldId:string)=>string;signal:AbortSignal;onProgress:(progress:FlowVisualArchiveProgress)=>void}>;

const assertUniqueAssetIds=(manifest:ArchiveManifest)=>{if(new Set(manifest.assets.map(({id})=>id)).size!==manifest.assets.length)throw new DOMException("The archive manifest contains duplicate visual asset identities.","DataError");};
const assetContract=(asset:FlowVisualAssetMetadata)=>JSON.stringify([asset.digest,asset.mediaType,asset.width,asset.height,asset.byteLength]);
const archiveEntryContracts=(manifest:ArchiveManifest)=>{const contracts=new Map<string,string>();for(const asset of manifest.assets){validateFlowVisualMetadata(asset);const contract=assetContract(asset),prior=contracts.get(asset.entry);if(prior&&prior!==contract)throw new DOMException(`Archive entry ${asset.entry} has inconsistent asset declarations.`,"DataError");contracts.set(asset.entry,contract);}return contracts;};
const assertDeclaredEntries=(entries:Map<string,Blob>,manifest:ArchiveManifest,contracts:Map<string,string>)=>{const allowed=new Set(["manifest.json",manifest.draftEntry,...(manifest.publishedEntry?[manifest.publishedEntry]:[]),...contracts.keys()]);for(const name of entries.keys())if(!allowed.has(name))throw new DOMException(`The archive contains undeclared entry ${name}.`,"DataError");};
const mappedAssetId=(declared:FlowVisualAssetMetadata,mapping:Map<string,string>,input:ArchiveInput)=>mapping.get(declared.id)??input.id?.(declared.id)??declared.id;
const readDeclaredAsset=async(entries:Map<string,Blob>,declared:ArchiveManifest["assets"][number],mapping:Map<string,string>,input:ArchiveInput)=>{const body=entries.get(declared.entry);if(!body)throw new DOMException(`Restore the missing asset ${declared.id} and export again.`,"DataError");await validateFlowVisualBody(declared,body);return{metadata:{id:mappedAssetId(declared,mapping,input),mediaType:declared.mediaType,width:declared.width,height:declared.height,byteLength:declared.byteLength,digest:declared.digest},body:body.slice(0,body.size,declared.mediaType)};};
const readArchiveAssets=async(entries:Map<string,Blob>,manifest:ArchiveManifest,mapping:Map<string,string>,input:ArchiveInput)=>{const assets:FlowVisualStoredAsset[]=[];for(const[index,declared]of manifest.assets.entries()){if(input.signal?.aborted)throw new DOMException("Project archive work was cancelled.","AbortError");assets.push(await readDeclaredAsset(entries,declared,mapping,input));input.onProgress?.({phase:"validate",entry:declared.entry,completed:index+1,total:manifest.assets.length});}return assets;};
const assertAssetReferences=(manifest:ArchiveManifest,projects:SpecificationProject[])=>{const declaredIds=new Set(manifest.assets.map(({id})=>id));for(const referenced of projects.flatMap(assetReferences))if(!declaredIds.has(referenced))throw new DOMException(`Restore the missing asset ${referenced} and export again.`,"DataError");};
const readArchiveSource=async(source:Uint8Array|Blob,input:ArchiveInput)=>{const blob=source instanceof Blob?source:new Blob([Uint8Array.from(source)]);return readStoredZip(blob,undefined,{...(input.signal?{signal:input.signal}:{}),onEntry:(entry,index)=>input.onProgress?.({phase:"read",entry,completed:index,total:0})});};
const readArchiveProjects=async(entries:Map<string,Blob>,manifest:ArchiveManifest)=>{const project=await parseJson<SpecificationProject>(entries,manifest.draftEntry),published=manifest.publishedEntry?await parseJson<SpecificationProject>(entries,manifest.publishedEntry):undefined;return{project,published};};
const archiveMapping=(project:SpecificationProject,input:ArchiveInput)=>projectMapping(project,input.projectId??project.id,input.id??(oldId=>oldId));
const importedArchive=(project:SpecificationProject,published:SpecificationProject|undefined,mapping:Map<string,string>,assets:FlowVisualStoredAsset[]):FlowVisualArchiveImport=>({formatVersion:3,project:remap(project,mapping) as SpecificationProject,...(published?{publishedProject:remap(published,mapping) as SpecificationProject}:{}),assets,migrations:[]});

export async function importFlowVisualArchive(source:Uint8Array|Blob,input:ArchiveInput={}):Promise<FlowVisualArchiveImport>{
  const entries=await readArchiveSource(source,input),manifest=await parseJson<ArchiveManifest>(entries,"manifest.json");
  assertFlowVisualArchiveManifest(manifest);assertUniqueAssetIds(manifest);assertDeclaredEntries(entries,manifest,archiveEntryContracts(manifest));
  const{project:sourceProject,published}=await readArchiveProjects(entries,manifest),mapping=archiveMapping(sourceProject,input),assets=await readArchiveAssets(entries,manifest,mapping,input);
  assertAssetReferences(manifest,[sourceProject,...(published?[published]:[])]);
  return importedArchive(sourceProject,published,mapping,assets);
}

export async function migrateVersion2VisualAssets(bundle:{format:string;version:number;project:SpecificationProject;publishedProject?:SpecificationProject},input:{projectId:string;id:(oldId:string)=>string}):Promise<FlowVisualArchiveImport>{
  if(bundle.version!==2)throw new DOMException("Use a supported version 2 project bundle.","NotSupportedError");const source=clone(bundle.project) as SpecificationProject&{conceptVisualAssets?:({bytes?:string}&FlowVisualAssetMetadata)[]},mapping=projectMapping(source,input.projectId,input.id),assets:FlowVisualStoredAsset[]=[];
  for(const asset of source.conceptVisualAssets??[])assets.push(await migrateLegacyAsset(asset,mapping,input.id));
  return{formatVersion:3,project:remap(withoutEmbeddedBodies(source),mapping) as SpecificationProject,...(bundle.publishedProject?{publishedProject:remap(withoutEmbeddedBodies(bundle.publishedProject),mapping) as SpecificationProject}:{}),assets,migrations:["Embedded concept visuals moved to separate original Blob bodies"]};
}

const migrateLegacyAsset=async(asset:{bytes?:string}&FlowVisualAssetMetadata,mapping:Map<string,string>,id:(oldId:string)=>string):Promise<FlowVisualStoredAsset>=>{if(typeof asset.bytes!=="string"||!asset.bytes.startsWith(`data:${asset.mediaType};base64,`))throw new DOMException(`Legacy visual ${asset.id} has unreadable embedded bytes.`,"DataError");const raw=atob(asset.bytes.slice(asset.bytes.indexOf(",")+1)),body=new Blob([Uint8Array.from(raw,character=>character.charCodeAt(0))],{type:asset.mediaType});await validateFlowVisualBody(asset,body);return{metadata:{id:mapping.get(asset.id)??id(asset.id),mediaType:asset.mediaType,width:asset.width,height:asset.height,byteLength:asset.byteLength,digest:asset.digest},body};};
