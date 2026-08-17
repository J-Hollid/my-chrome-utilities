import type {SpecificationProject} from "./data-layer-specification-project.js";
import {validateFlowVisualMetadata,type FlowVisualAssetMetadata} from "./flow-visual-asset-validation.js";
import {projectAssetBodyArchiveEntry} from "./project-asset-body-contribution.js";

export type FlowVisualManifestAsset=FlowVisualAssetMetadata&{entry:string};
export interface FlowVisualArchiveManifest {format:string;version:number;requiredFeatures:string[];draftEntry:string;publishedEntry?:string;assets:FlowVisualManifestAsset[];}

export const flowVisualArchiveExtension=(type:string)=>type==="image/png"?"png":type==="image/jpeg"?"jpg":"webp";
export const withoutEmbeddedFlowVisualBodies=(project:SpecificationProject):SpecificationProject=>{const value=structuredClone(project) as SpecificationProject&{conceptVisualAssets?:Record<string,unknown>[]};if(value.conceptVisualAssets)value.conceptVisualAssets=value.conceptVisualAssets.map(({bytes,...metadata})=>metadata);return value;};
export const flowVisualJsonBlob=(value:unknown)=>new Blob([JSON.stringify(value)],{type:"application/json"});
export const parseFlowVisualArchiveJson=async<T>(entries:Map<string,Blob>,name:string):Promise<T>=>{const value=entries.get(name);if(!value)throw new DOMException(`The archive is missing ${name}.`,"DataError");try{return JSON.parse(await value.text()) as T;}catch{throw new DOMException(`Archive entry ${name} is not readable JSON.`,"DataError");}};

const assertArchiveIdentity=(value:FlowVisualArchiveManifest)=>{if(!value||typeof value!=="object"||value.format!=="my-chrome-utilities.project-archive"||value.version!==3)throw new DOMException("Use a supported project archive version.","NotSupportedError");};
const assertArchiveFeatures=(features:unknown)=>{if(!Array.isArray(features)||features.some(feature=>feature!=="digest-addressed-visual-assets"))throw new DOMException("The project archive requires unsupported features.","NotSupportedError");};
const validArchiveEntries=(value:FlowVisualArchiveManifest)=>value.draftEntry==="draft.json"&&(value.publishedEntry===undefined||value.publishedEntry==="published.json")&&Array.isArray(value.assets)&&value.assets.length<=10_000;
const assertArchiveAssetEntry=(asset:FlowVisualManifestAsset)=>{validateFlowVisualMetadata(asset);if(asset.entry!==projectAssetBodyArchiveEntry({namespace:"flow-visual",digest:asset.digest.slice(7),extension:flowVisualArchiveExtension(asset.mediaType)}))throw new DOMException(`Visual ${asset.id} does not use its digest-addressed archive entry.`,"DataError");};

export function assertFlowVisualArchiveManifest(value:FlowVisualArchiveManifest):void{
  assertArchiveIdentity(value);assertArchiveFeatures(value.requiredFeatures);
  if(!validArchiveEntries(value))throw new DOMException("The project archive manifest has an unsupported structure.","DataError");
  for(const asset of value.assets)assertArchiveAssetEntry(asset);
}
