import {canonicalConstraints,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import type {LayerConstraint,LayerContributor,LayerScope} from "./data-layer-layered-schema.js";
import {orderedPageGroupIds} from "./data-layer-page-group-membership.js";
import type {Condition,ProjectEntity,ProjectState} from "./data-layer-specification-project.js";

export interface LayeredContributorPath {profileId?:string;eventId?:string;pageGroupId?:string;pageGroupIds?:string[];pageId?:string;flowId?:string;occurrenceId?:string;}

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
const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
function conditionMatches(condition:Condition|undefined,observation:Record<string,unknown>):boolean{if(!condition)return true;if(condition.kind==="predicate"){const actual=observation[condition.field];if(condition.operator==="equals")return same(actual,condition.value);if(condition.operator==="does not equal")return!same(actual,condition.value);if(condition.operator==="exists")return actual!==undefined;if(condition.operator==="does not exist")return actual===undefined;if(condition.operator==="contains")return String(actual??"").includes(String(condition.value??""));if(condition.operator==="matches pattern"||condition.operator==="regex")try{return new RegExp(String(condition.pattern??condition.value??"")).test(String(actual??""));}catch{return false;}return false;}if(condition.kind==="all")return condition.conditions.every((child)=>conditionMatches(child,observation));if(condition.kind==="any")return condition.conditions.some((child)=>conditionMatches(child,observation));return!condition.conditions.some((child)=>conditionMatches(child,observation));}

export function layeredContributorPath(state:ProjectState,entity:ProjectEntity,scope:LayerScope,flowId?:string):LayeredContributorPath{
  const selectedFlowId=flowId??(scope==="Flow Page-instance"?entity.id:undefined),flowGraph=selectedFlowId?(state.project.documentationFlowGraphs as Record<string,{pageGroupIds?:string[];pageFrames?:ProjectEntity[]}>|undefined)?.[selectedFlowId]:undefined,flowPageGroupIds=flowGraph?.pageGroupIds??[],referencedFrame=flowGraph?.pageFrames?.find(({id})=>id===referencedId(entity,"pageFrameId")),flowPageGroupId=referencedId(referencedFrame??entity,"pageGroupId")??(flowPageGroupIds.length===1?flowPageGroupIds[0]:undefined),flowPageGroup=state.project.collections.pageGroups.find(({id})=>id===flowPageGroupId),flowPageIds=(flowPageGroup?.pageIds as string[]|undefined)??[],flowPageId=referencedId(referencedFrame??entity,"pageId")??(flowPageIds.length===1?flowPageIds[0]:undefined),profileId=scope==="Shared Profile"?entity.id:referencedProfileId(state,entity),pageId=referencedId(entity,"pageId")??(scope==="Page"?entity.id:scope==="Flow Page-instance"?flowPageId:undefined),pageGroupIds=pageId?orderedPageGroupIds(state.project,pageId):scope==="Page Group"?[entity.id]:[],pageGroupId=referencedId(entity,"pageGroupId")??referencedId(referencedFrame??{},"pageGroupId")??(scope==="Page Group"?entity.id:pageGroupIds.length===1?pageGroupIds[0]:scope==="Flow Page-instance"?flowPageGroupId:undefined),selectedPage=pageId?state.project.collections.pages.find(({id})=>id===pageId):undefined,contextBinding=((selectedPage?.contextEventBindings as ProjectEntity[]|undefined)??[]).find(({id})=>id===entity.contextBindingId),eventId=referencedId(entity,"eventId")??referencedId(contextBinding??{id:"",name:""},"eventId")??(scope==="Event"?entity.id:undefined);
  return{...(profileId?{profileId}:{}),...(eventId?{eventId}:{}),...(pageGroupId?{pageGroupId}:{}),...(pageGroupIds.length?{pageGroupIds}:{}),...(pageId?{pageId}:{}),...(flowId||scope==="Flow Page-instance"?{flowId:flowId??entity.id}:{}),...(scope==="Event-occurrence"?{occurrenceId:entity.id}:{})};
}

export function layeredContributorsForPath(state:ProjectState,path:LayeredContributorPath,observation:Record<string,unknown>={}):LayerContributor[]{
  const graph=path.flowId?(state.project.documentationFlowGraphs as Record<string,{occurrences?:ProjectEntity[]}>|undefined)?.[path.flowId]:undefined,occurrence=graph?.occurrences?.find(({id})=>id===path.occurrenceId);
  const one=(entities:ProjectEntity[],id:string|undefined,scope:LayerScope)=>id?entities.filter((entity)=>entity.id===id).map((entity)=>contributionFor(entity,scope)):[];
  const groupIds=path.pageGroupIds??(path.pageGroupId?[path.pageGroupId]:[]),groups=groupIds.flatMap((groupId)=>state.project.collections.pageGroups.filter(({id})=>id===groupId).map((group)=>{const contributor=contributionFor(group,"Page Group"),applicability=(state.project.collections.applicabilitySets??[]).find(({id})=>id===group.applicabilitySetId),conditional=Boolean(applicability),active=conditionMatches(applicability?.condition as Condition|undefined,observation);return{...contributor,...(conditional?{active,applicabilityConditional:true,...(!active?{exclusionReason:`${applicability!.name} did not match`}:{})}:{})};}));
  return[...one(state.project.collections.profiles,path.profileId,"Shared Profile"),...one(state.project.collections.events,path.eventId,"Event"),...groups,...one(state.project.collections.pages,path.pageId,"Page"),...one(state.project.collections.flows,path.flowId,"Flow Page-instance"),...(occurrence?[contributionFor(occurrence,occurrence.freePageFrame?"Flow Page-instance":"Event-occurrence")]:[])];
}

export function layeredContributionDetails(state:ProjectState,entity:ProjectEntity,scope:LayerScope,flowId?:string){
  return layeredContributorsForPath(state,layeredContributorPath(state,entity,scope,flowId)).flatMap((contributor)=>contributor.constraints.map((constraint)=>({contributorId:contributor.id,contributorName:contributor.name,scope:contributor.scope,path:constraint.path,target:constraint.target??"all",condition:constraint.condition?JSON.stringify(constraint.condition):"Always",enforcement:constraint.enforcement??"not set",usedById:entity.id,usedByName:entity.name,usedByScope:scope})));
}
