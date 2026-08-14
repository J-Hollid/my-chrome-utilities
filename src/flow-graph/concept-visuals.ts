import {graphIndex,saveStoredGraph,storedGraph,type DocumentaryPageFrameRecord} from "../data-layer-flow-graph.js";
import {transactProject,type IdFactory,type ProjectEntity,type ProjectState,type SpecificationProject} from "../data-layer-specification-project.js";

export const FLOW_CONCEPT_VISUAL_LIMITS={sourceBytes:5*1024*1024,dimension:4096,pixels:16_000_000,projectBytes:25*1024*1024} as const;
export type FlowConceptVisualMediaType="image/png"|"image/jpeg"|"image/webp";
export interface FlowConceptVisualRaster {mediaType:FlowConceptVisualMediaType;width:number;height:number;byteLength:number;bytes:string;digest:string}
export interface FlowConceptVisualAsset extends FlowConceptVisualRaster {id:string}
export interface FlowConceptVisualAttachment {id:string;assetId:string;description:string;caption?:string;sourceReference?:string}
export type FlowConceptVisualTarget={kind:"page-frame"|"occurrence";id:string};
type VisualProject=SpecificationProject&{conceptVisualAssets?:FlowConceptVisualAsset[]};
type VisualRecord=(DocumentaryPageFrameRecord|ProjectEntity)&{conceptVisual?:FlowConceptVisualAttachment};

export function validateFlowConceptVisualSource(input:FlowConceptVisualRaster&{sourceByteLength:number;projectStoredBytes?:number}):{valid:true}|{valid:false;diagnostic:string}{
  if(!(["image/png","image/jpeg","image/webp"] as string[]).includes(input.mediaType))return{valid:false,diagnostic:"Choose a PNG, JPEG, or WebP image"};
  if(input.sourceByteLength>FLOW_CONCEPT_VISUAL_LIMITS.sourceBytes)return{valid:false,diagnostic:"The visual is too large"};
  if(input.width>FLOW_CONCEPT_VISUAL_LIMITS.dimension||input.height>FLOW_CONCEPT_VISUAL_LIMITS.dimension)return{valid:false,diagnostic:"The visual dimensions exceed 4096 pixels"};
  if(input.width*input.height>FLOW_CONCEPT_VISUAL_LIMITS.pixels)return{valid:false,diagnostic:"The visual exceeds 16 megapixels"};
  if((input.projectStoredBytes??0)+input.byteLength>FLOW_CONCEPT_VISUAL_LIMITS.projectBytes)return{valid:false,diagnostic:"This project has reached its 25 MiB visual limit"};
  return{valid:true};
}

export const flowConceptVisualAssets=(project:SpecificationProject):readonly FlowConceptVisualAsset[]=>(project as VisualProject).conceptVisualAssets??[];
const assets=(project:SpecificationProject):FlowConceptVisualAsset[]=>[...flowConceptVisualAssets(project)];
export const flowConceptVisualAttachment=(project:SpecificationProject,flowId:string,target:FlowConceptVisualTarget):FlowConceptVisualAttachment|undefined=>{
  const graph=storedGraph(project,flowId);
  return((target.kind==="page-frame"?graph.pageFrames:graph.occurrences).find(({id})=>id===target.id) as VisualRecord|undefined)?.conceptVisual;
};
const withAttachment=(project:SpecificationProject,flowId:string,target:FlowConceptVisualTarget,next:FlowConceptVisualAttachment|undefined):SpecificationProject=>{
  const graph=storedGraph(project,flowId),update=<T extends {id:string}>(item:T):T=>item.id===target.id?({...item,...(next?{conceptVisual:next}:{}),...(!next&&"conceptVisual" in item?{conceptVisual:undefined}:{})} as T):item;
  const changed=target.kind==="page-frame"?{...graph,pageFrames:graph.pageFrames.map(update)}:{...graph,occurrences:graph.occurrences.map(update)};
  if(!(target.kind==="page-frame"?graph.pageFrames:graph.occurrences).some(({id})=>id===target.id))throw new Error(`Unknown Flow visual target ${target.id}.`);
  const saved=saveStoredGraph(project,flowId,changed);
  if(!next){const stored=graphIndex(saved),allReferences=new Set(Object.values(stored).flatMap((candidate)=>[...candidate.pageFrames,...candidate.occurrences].flatMap((item)=>{const visual=(item as VisualRecord).conceptVisual;return visual?.assetId?[visual.assetId]:[];})));return{...saved,conceptVisualAssets:assets(saved).filter(({id})=>allReferences.has(id))};}
  return saved;
};

export function attachFlowConceptVisual(state:ProjectState,flowId:string,target:FlowConceptVisualTarget,input:{raster:FlowConceptVisualRaster;description:string;caption?:string;sourceReference?:string},id:IdFactory):ProjectState{
  const description=input.description.trim();if(!description)throw new Error("Description is required");
  return transactProject(state,"Save Flow concept visual",(project)=>{
    const prior=flowConceptVisualAttachment(project,flowId,target),existing=assets(project).find(({digest})=>digest===input.raster.digest),asset=existing??{id:id("concept-visual-asset"),...structuredClone(input.raster)},visualAssets=existing?assets(project):[...assets(project),asset],saved={...project,conceptVisualAssets:visualAssets};
    return withAttachment(saved,flowId,target,{id:prior?.id??id("concept-visual-attachment"),assetId:asset.id,description,...(input.caption?.trim()?{caption:input.caption.trim()}:{}),...(input.sourceReference?.trim()?{sourceReference:input.sourceReference.trim()}: {})});
  });
}

export function flowConceptVisual(project:SpecificationProject,flowId:string,target:FlowConceptVisualTarget):{attachment:FlowConceptVisualAttachment;asset:FlowConceptVisualAsset}|undefined{
  const visual=flowConceptVisualAttachment(project,flowId,target),asset=visual&&flowConceptVisualAssets(project).find(({id})=>id===visual.assetId);
  return visual&&asset?{attachment:visual,asset}:undefined;
}

export function duplicateFlowConceptVisualAttachment(state:ProjectState,flowId:string,source:FlowConceptVisualTarget,target:FlowConceptVisualTarget,id:IdFactory):ProjectState{
  const visual=flowConceptVisualAttachment(state.project,flowId,source);if(!visual)throw new Error("The source Flow item has no concept visual.");
  return transactProject(state,"Duplicate Flow concept visual",(project)=>withAttachment(project,flowId,target,{...structuredClone(visual),id:id("concept-visual-attachment")}));
}

export function removeFlowConceptVisual(state:ProjectState,flowId:string,target:FlowConceptVisualTarget):ProjectState{
  if(!flowConceptVisualAttachment(state.project,flowId,target))return state;
  return transactProject(state,"Remove Flow concept visual",(project)=>withAttachment(project,flowId,target,undefined));
}
