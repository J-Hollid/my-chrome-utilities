import {canonicalConstraints,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import type {LayerConstraint,LayerContributor,LayerScope} from "./data-layer-layered-schema.js";
import type {ProjectEntity,ProjectState} from "./data-layer-specification-project.js";

export interface LayeredContributorPath {profileId?:string;eventId?:string;pageGroupId?:string;pageId?:string;flowId?:string;pageFrameId?:string;occurrenceId?:string;}

const contributionFor=(entity:ProjectEntity,scope:LayerScope):LayerContributor=>{
  const canonical=entity.canonicalSchema as CanonicalSchemaDocument|undefined;
  return{id:entity.id,name:entity.name,scope,constraints:canonical?canonicalConstraints(canonical):((entity.schemaConstraints as LayerConstraint[]|undefined)??[])};
};
const referencedId=(entity:Record<string,unknown>,key:string):string|undefined=>typeof entity[key]==="string"?String(entity[key]):undefined;
const referencedProfileId=(state:ProjectState,entity:ProjectEntity):string|undefined=>{
  const direct=referencedId(entity,"profileId")??((entity.profileIds as string[]|undefined)?.length===1?String((entity.profileIds as string[])[0]):undefined);
  if(direct)return direct;
  const page=state.project.collections.pages.find(({id})=>id===referencedId(entity,"pageId")),pageProfiles=(page?.profileIds as string[]|undefined)??[];
  return pageProfiles.length===1?pageProfiles[0]:state.project.collections.profiles.length===1?state.project.collections.profiles[0]!.id:undefined;
};

export function flowPageFrameContributor(state:ProjectState,flowId:string,pageFrameId:string):ProjectEntity|undefined{
  const graph=(state.project.documentationFlowGraphs as Record<string,{pageFrames?:ProjectEntity[]}>|undefined)?.[flowId],frame=graph?.pageFrames?.find(({id})=>id===pageFrameId);if(!frame)return;
  const page=state.project.collections.pages.find(({id})=>id===frame.pageId),flow=state.project.collections.flows.find(({id})=>id===flowId);
  return{...frame,name:typeof frame.name==="string"&&frame.name.trim()?frame.name:`${page?.name??"Page"} in ${flow?.name??"Flow"}`};
}

export function layeredContributorPath(state:ProjectState,entity:ProjectEntity,scope:LayerScope,flowId?:string):LayeredContributorPath{
  const selectedFlowId=flowId??(scope==="Flow Page-instance"?entity.id:undefined),flowGraph=selectedFlowId?(state.project.documentationFlowGraphs as Record<string,{pageGroupIds?:string[];pageFrames?:ProjectEntity[]}>|undefined)?.[selectedFlowId]:undefined,flowPageGroupIds=flowGraph?.pageGroupIds??[],referencedFrameId=referencedId(entity,"pageFrameId")??(scope==="Flow Page-instance"?entity.id:undefined),referencedFrame=flowGraph?.pageFrames?.find(({id})=>id===referencedFrameId),flowPageGroupId=referencedId(referencedFrame??entity,"pageGroupId")??(flowPageGroupIds.length===1?flowPageGroupIds[0]:undefined),flowPageGroup=state.project.collections.pageGroups.find(({id})=>id===flowPageGroupId),flowPageIds=(flowPageGroup?.pageIds as string[]|undefined)??[],flowPageId=referencedId(referencedFrame??entity,"pageId")??(flowPageIds.length===1?flowPageIds[0]:undefined),profileId=scope==="Shared Profile"?entity.id:referencedProfileId(state,entity),pageId=referencedId(entity,"pageId")??(scope==="Page"?entity.id:scope==="Flow Page-instance"?flowPageId:undefined),containingGroups=pageId?state.project.collections.pageGroups.filter((group)=>((group.pageIds as string[]|undefined)??[]).includes(pageId)):[],pageGroupId=referencedId(entity,"pageGroupId")??referencedId(referencedFrame??{},"pageGroupId")??(scope==="Page Group"?entity.id:containingGroups.length===1?containingGroups[0]!.id:scope==="Flow Page-instance"?flowPageGroupId:undefined),selectedPage=pageId?state.project.collections.pages.find(({id})=>id===pageId):undefined,contextBinding=((selectedPage?.contextEventBindings as ProjectEntity[]|undefined)??[]).find(({id})=>id===entity.contextBindingId),eventId=referencedId(entity,"eventId")??referencedId(contextBinding??{id:"",name:""},"eventId")??(scope==="Event"?entity.id:undefined);
  return{...(profileId?{profileId}:{}),...(eventId?{eventId}:{}),...(pageGroupId?{pageGroupId}:{}),...(pageId?{pageId}:{}),...(selectedFlowId?{flowId:selectedFlowId}:{}),...(referencedFrame?{pageFrameId:referencedFrame.id}:{}),...(scope==="Event-occurrence"?{occurrenceId:entity.id}:{})};
}

export function layeredContributorsForPath(state:ProjectState,path:LayeredContributorPath):LayerContributor[]{
  const graph=path.flowId?(state.project.documentationFlowGraphs as Record<string,{pageFrames?:ProjectEntity[];occurrences?:ProjectEntity[]}>|undefined)?.[path.flowId]:undefined,pageFrame=graph?.pageFrames?.find(({id})=>id===path.pageFrameId),occurrence=graph?.occurrences?.find(({id})=>id===path.occurrenceId);
  const one=(entities:ProjectEntity[],id:string|undefined,scope:LayerScope)=>id?entities.filter((entity)=>entity.id===id).map((entity)=>contributionFor(entity,scope)):[];
  return[...one(state.project.collections.profiles,path.profileId,"Shared Profile"),...one(state.project.collections.events,path.eventId,"Event"),...one(state.project.collections.pageGroups,path.pageGroupId,"Page Group"),...one(state.project.collections.pages,path.pageId,"Page"),...(pageFrame?[contributionFor(pageFrame,"Flow Page-instance")]:[]),...(occurrence?[contributionFor(occurrence,occurrence.freePageFrame?"Flow Page-instance":"Event-occurrence")]:[])];
}

export function layeredContributionDetails(state:ProjectState,entity:ProjectEntity,scope:LayerScope,flowId?:string){
  return layeredContributorsForPath(state,layeredContributorPath(state,entity,scope,flowId)).flatMap((contributor)=>contributor.constraints.map((constraint)=>({contributorId:contributor.id,contributorName:contributor.name,scope:contributor.scope,path:constraint.path,target:constraint.target??"all",condition:constraint.condition?JSON.stringify(constraint.condition):"Always",enforcement:constraint.enforcement??"not set",usedById:entity.id,usedByName:entity.name,usedByScope:scope})));
}
