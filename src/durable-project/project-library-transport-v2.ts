import {stageProjectImport,type ProjectLibrary,type ProjectLibraryImportSource,type ProjectLibraryInspectedImport,type ProjectLibraryPreparedExport,type ProjectLibraryTransport} from "../data-layer-project-library.js";
import type {SpecificationProject} from "../data-layer-specification-project.js";
import {importFlowVisualArchive,migrateVersion2VisualAssets,type FlowVisualArchiveProgress,type FlowVisualStoredAsset} from "../flow-visual-asset-portability.js";

interface Version2Repository{
  exportProject(projectId:string):Promise<Record<string,unknown>>;
  importProject(bundle:Record<string,unknown>,input:{projectId:string;name:string}):Promise<unknown>;
}
interface Version3Repository extends Version2Repository{
  prepareProjectArchive(projectId:string):Promise<{estimatedBytes:number;write(sink:{write(chunk:Uint8Array):Promise<void>},options?:{signal?:AbortSignal;onProgress?:(progress:FlowVisualArchiveProgress)=>void}):Promise<unknown>}>;
  importProject(bundle:Record<string,unknown>,input:{projectId:string;name:string},visualAssets?:readonly FlowVisualStoredAsset[]):Promise<unknown>;
}

const cancelled=()=>new DOMException("Project transport was cancelled.","AbortError");
const assertSignal=(signal?:AbortSignal)=>{if(signal?.aborted)throw cancelled();};
const WRITE_CHUNK_BYTES=64*1024;

export function createVersion2ProjectLibraryTransport(options:{repository:Version2Repository;library:()=>ProjectLibrary;id:(oldId:string)=>string;now?:()=>string}):ProjectLibraryTransport{
  return{
    async prepareExport(projectId:string):Promise<ProjectLibraryPreparedExport>{
      let bytes:Uint8Array|undefined=new TextEncoder().encode(JSON.stringify(await options.repository.exportProject(projectId))),started=false,released=false;
      return{formatVersion:2,mediaType:"application/json",extension:"json",estimatedBytes:bytes.byteLength,async write(sink,input={}){if(released||!bytes)throw new Error("Prepared project export was released.");if(started)throw new Error("Prepared project export already started.");started=true;assertSignal(input.signal);input.onProgress?.({phase:"write",completed:0,total:bytes.byteLength,message:"Writing project export…"});for(let offset=0;offset<bytes.byteLength;offset+=WRITE_CHUNK_BYTES){assertSignal(input.signal);await sink.write(bytes.subarray(offset,Math.min(offset+WRITE_CHUNK_BYTES,bytes.byteLength)));input.onProgress?.({phase:"write",completed:Math.min(offset+WRITE_CHUNK_BYTES,bytes.byteLength),total:bytes.byteLength,message:"Writing project export…"});}assertSignal(input.signal);input.onProgress?.({phase:"write",completed:bytes.byteLength,total:bytes.byteLength,message:"Project export written."});},release(){released=true;bytes=undefined;}};
    },
    async inspectImport(source:ProjectLibraryImportSource):Promise<ProjectLibraryInspectedImport>{
      let serialized:string|undefined=await source.text(),bundle:Record<string,unknown>|undefined;try{bundle=JSON.parse(serialized) as Record<string,unknown>;}catch{/* stageProjectImport owns the readable-bundle diagnostic */}
      const staged=stageProjectImport(serialized,options.library(),{id:options.id,...(options.now?{now:options.now}:{})}),formatVersion=Number(bundle?.version??0);let started=false,released=false;
      return{formatVersion,sourceName:staged.sourceName,targetName:staged.targetName,projectId:staged.projectId,entityCounts:staged.entityCounts,referenceIntegrity:staged.referenceIntegrity,migrations:staged.migrations,blockers:staged.blockers,async commit(input){if(released||!serialized||!bundle)throw new Error("Inspected project import was released.");if(started)throw new Error("Inspected project import already started.");started=true;assertSignal(input.signal);if(staged.blockers.length)throw new Error("Project import is blocked.");input.onProgress?.({phase:"commit",completed:0,total:1,message:"Importing project into durable storage…"});await options.repository.importProject(bundle,{projectId:staged.projectId,name:input.name});assertSignal(input.signal);input.onProgress?.({phase:"commit",completed:1,total:1,message:"Project import committed."});},release(){released=true;serialized=undefined;bundle=undefined;}};
    },
  };
}

const uniqueTargetName=(library:ProjectLibrary,sourceName:string):string=>{let candidate=sourceName,index=1;const names=new Set(Object.values(library.projects).map(({state})=>state.project.name.trim().toLowerCase()));while(names.has(candidate.trim().toLowerCase())){candidate=index===1?`${sourceName} copy`:`${sourceName} copy ${index}`;index+=1;}return candidate;};
const entityCounts=(project:SpecificationProject):Record<string,number>=>Object.fromEntries(Object.entries(project.collections).map(([kind,entries])=>[kind,entries.length]));
const progress=(value:FlowVisualArchiveProgress)=>({phase:value.phase,completed:value.completed,total:value.total,message:`${value.phase} ${value.entry??"project"} ${value.completed}/${value.total}`});
const importBundle=(project:SpecificationProject,publishedProject:SpecificationProject|undefined,sourceName:string):Record<string,unknown>=>{const publishedRevision=Math.max(0,...project.releases.map(({revision})=>revision));return{format:"my-chrome-utilities.durable-project-bundle",version:2,sourceProjectId:project.id,sourceName,publishedRevision,baseProjectRevision:publishedRevision,project,...(publishedProject?{publishedProject}:{})};};
type Version3Options={repository:Version3Repository;library:()=>ProjectLibrary;id:(oldId:string)=>string;now?:()=>string};
type InspectOptions={signal?:AbortSignal;onProgress?:(value:{phase:string;completed:number;total:number;message:string})=>void};
interface Version3Stage {archive:boolean;project?:SpecificationProject;publishedProject?:SpecificationProject;assets?:FlowVisualStoredAsset[];bundle?:Record<string,unknown>;sourceName:string;targetName:string;projectId:string;migrations:string[];counts:Record<string,number>;blockers:{section:string;message:string}[];}
const embeddedVisuals=(project:SpecificationProject|undefined)=>{const assets=(project as SpecificationProject&{conceptVisualAssets?:unknown[]}|undefined)?.conceptVisualAssets;return Array.isArray(assets)&&assets.some(value=>Boolean(value&&typeof value==="object"&&typeof (value as {bytes?:unknown}).bytes==="string"));};
const publishedFromBundle=(bundle:Record<string,unknown>)=>bundle.publishedProject&&typeof bundle.publishedProject==="object"?bundle.publishedProject as SpecificationProject:undefined;

async function stageArchiveImport(options:Version3Options,blob:Blob,input:InspectOptions):Promise<Version3Stage>{
  const staged=await importFlowVisualArchive(blob,{projectId:options.id("project"),id:options.id,...(input.signal?{signal:input.signal}:{}),onProgress:value=>input.onProgress?.(progress(value))}),sourceName=staged.project.name;
  return{archive:true,project:staged.project,...(staged.publishedProject?{publishedProject:staged.publishedProject}:{}),assets:staged.assets,sourceName,targetName:uniqueTargetName(options.library(),sourceName),projectId:staged.project.id,migrations:staged.migrations,counts:entityCounts(staged.project),blockers:[]};
}

async function stageJsonImport(options:Version3Options,source:ProjectLibraryImportSource,input:InspectOptions):Promise<Version3Stage>{
  const serialized=await source.text();assertSignal(input.signal);const bundle=JSON.parse(serialized) as Record<string,unknown>,rawProject=bundle.project as SpecificationProject|undefined,projectId=options.id("project");
  if(embeddedVisuals(rawProject)&&rawProject)return stageEmbeddedJsonImport(options,bundle,rawProject,projectId);
  return stagePlainJsonImport(options,serialized,bundle,rawProject,projectId);
}
const stageEmbeddedJsonImport=async(options:Version3Options,bundle:Record<string,unknown>,rawProject:SpecificationProject,projectId:string):Promise<Version3Stage>=>{const published=publishedFromBundle(bundle),staged=await migrateVersion2VisualAssets({format:String(bundle.format),version:Number(bundle.version),project:rawProject,...(published?{publishedProject:published}:{})},{projectId,id:options.id}),sourceName=String(bundle.sourceName??rawProject.name);return{archive:false,project:staged.project,...(staged.publishedProject?{publishedProject:staged.publishedProject}:{}),assets:staged.assets,bundle,sourceName,targetName:uniqueTargetName(options.library(),sourceName),projectId:staged.project.id,migrations:staged.migrations,counts:entityCounts(staged.project),blockers:[]};};
const stagePlainJsonImport=(options:Version3Options,serialized:string,bundle:Record<string,unknown>,rawProject:SpecificationProject|undefined,projectId:string):Version3Stage=>{const staged=stageProjectImport(serialized,options.library(),{id:oldId=>oldId===rawProject?.id?projectId:options.id(oldId),...(options.now?{now:options.now}:{})});return{archive:false,bundle,sourceName:staged.sourceName,targetName:staged.targetName,projectId:staged.projectId,migrations:staged.migrations,counts:staged.entityCounts,blockers:staged.blockers};};

async function stageVersion3Import(options:Version3Options,source:ProjectLibraryImportSource,input:InspectOptions):Promise<Version3Stage>{
  assertSignal(input.signal);const blob=source instanceof Blob?source:source.slice?.(0,source.size),prefix=blob?new Uint8Array(await blob.slice(0,4).arrayBuffer()):undefined;assertSignal(input.signal);const archive=prefix?.[0]===80&&prefix[1]===75;
  if(archive){if(!blob)throw new DOMException("Choose a stream-readable version 3 project archive.","DataError");return stageArchiveImport(options,blob,input);}
  return stageJsonImport(options,source,input);
}

function inspectedVersion3Import(options:Version3Options,stage:Version3Stage):ProjectLibraryInspectedImport{
  let started=false,released=false,{project,publishedProject,assets,bundle}=stage;
  return{formatVersion:stage.archive?3:Number(bundle?.version??2),sourceName:stage.sourceName,targetName:stage.targetName,projectId:stage.projectId,entityCounts:stage.counts,referenceIntegrity:stage.blockers.length?"blocked":"valid",migrations:stage.migrations,blockers:stage.blockers,async commit(commitInput){if(released)throw new Error("Inspected project import was released.");if(started)throw new Error("Inspected project import already started.");started=true;assertSignal(commitInput.signal);if(stage.blockers.length)throw new Error("Project import is blocked.");commitInput.onProgress?.({phase:"commit",completed:0,total:1,message:"Importing project into durable storage…"});if(project)await options.repository.importProject(importBundle(project,publishedProject,stage.sourceName),{projectId:stage.projectId,name:commitInput.name},assets);else if(bundle)await options.repository.importProject(bundle,{projectId:stage.projectId,name:commitInput.name});else throw new Error("Inspected project import was released.");commitInput.onProgress?.({phase:"commit",completed:1,total:1,message:"Project import committed."});},release(){released=true;project=undefined;publishedProject=undefined;assets=undefined;bundle=undefined;}};
}

export function createVersion3ProjectLibraryTransport(options:Version3Options):ProjectLibraryTransport{
  return{
    async prepareExport(projectId){const prepared=await options.repository.prepareProjectArchive(projectId);let started=false,released=false;return{formatVersion:3,mediaType:"application/zip",extension:"zip",estimatedBytes:prepared.estimatedBytes,async write(sink,input={}){if(released)throw new Error("Prepared project export was released.");if(started)throw new Error("Prepared project export already started.");started=true;assertSignal(input.signal);await prepared.write(sink,{...(input.signal?{signal:input.signal}:{}),onProgress:value=>input.onProgress?.(progress(value))});assertSignal(input.signal);},release(){released=true;}};},
    async inspectImport(source,input={}){
      return inspectedVersion3Import(options,await stageVersion3Import(options,source,input));
    },
  };
}
