import {canonicalConstraints,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import {compileLayeredSchema,type CompiledLayeredSchema,type LayerConstraint,type LayerContributor,type LayerContext,type LayerScope} from "./data-layer-layered-schema.js";
import {orderedPageGroupIds} from "./data-layer-page-group-membership.js";
import {transactProject,type Condition,type ProjectEntity,type ProjectState} from "./data-layer-specification-project.js";

export interface LayeredContributorPath {profileId?:string;eventId?:string;pageGroupId?:string;pageGroupIds?:string[];pageId?:string;flowId?:string;pageFrameId?:string;occurrenceId?:string;}
export type AssignmentContributorKind="Shared Profile"|"Page Group"|"Page"|"Event"|"Flow Page instance";
export interface AssignmentContributorTarget {id:string;name:string;kind:AssignmentContributorKind;flowId?:string;}

const contributionFor=(entity:ProjectEntity,scope:LayerScope):LayerContributor=>{
  const canonical=entity.canonicalSchema as CanonicalSchemaDocument|undefined;
  const requirements=((entity.requirements as Record<string,unknown>[]|undefined)??[]).map((requirement)=>({...requirement,...(requirement.required?{presence:"required"}:requirement.forbidden?{presence:"forbidden"}:{})})) as LayerConstraint[];
  const base=canonical?canonicalConstraints(canonical):((entity.schemaConstraints as LayerConstraint[]|undefined)??requirements),sparse=(entity.localSchemaContributions as LayerConstraint[]|undefined)??[];
  return{id:entity.id,name:entity.name,scope,constraints:[...base,...sparse]};
};
const referencedId=(entity:Record<string,unknown>,key:string):string|undefined=>typeof entity[key]==="string"?String(entity[key]):undefined;
const referencedProfileId=(state:ProjectState,entity:ProjectEntity):string|undefined=>{
  const direct=referencedId(entity,"profileId")??((entity.profileIds as string[]|undefined)?.length===1?String((entity.profileIds as string[])[0]):undefined);
  if(direct)return direct;
  const page=state.project.collections.pages.find(({id})=>id===referencedId(entity,"pageId")),pageDirect=page&&referencedId(page,"profileId"),pageProfiles=(page?.profileIds as string[]|undefined)??[];
  return pageDirect??(pageProfiles.length===1?pageProfiles[0]:state.project.collections.profiles.length===1?state.project.collections.profiles[0]!.id:undefined);
};
const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
function conditionMatches(condition:Condition|undefined,observation:Record<string,unknown>):boolean{if(!condition)return true;if(condition.kind==="predicate"){const actual=observation[condition.field];if(condition.operator==="equals")return same(actual,condition.value);if(condition.operator==="does not equal")return!same(actual,condition.value);if(condition.operator==="exists")return actual!==undefined;if(condition.operator==="does not exist")return actual===undefined;if(condition.operator==="contains")return String(actual??"").includes(String(condition.value??""));if(condition.operator==="matches pattern"||condition.operator==="regex")try{return new RegExp(String(condition.pattern??condition.value??"")).test(String(actual??""));}catch{return false;}return false;}if(condition.kind==="all")return condition.conditions.every((child)=>conditionMatches(child,observation));if(condition.kind==="any")return condition.conditions.some((child)=>conditionMatches(child,observation));return!condition.conditions.some((child)=>conditionMatches(child,observation));}

export function flowPageFrameContributor(state:ProjectState,flowId:string,pageFrameId:string):ProjectEntity|undefined{
  const graph=(state.project.documentationFlowGraphs as Record<string,{pageFrames?:ProjectEntity[]}>|undefined)?.[flowId],frame=graph?.pageFrames?.find(({id})=>id===pageFrameId);if(!frame)return;
  const page=state.project.collections.pages.find(({id})=>id===frame.pageId),flow=state.project.collections.flows.find(({id})=>id===flowId);
  return{...frame,name:typeof frame.name==="string"&&frame.name.trim()?frame.name:`${page?.name??"Page"} in ${flow?.name??"Flow"}`};
}

export function layeredContributorPath(state:ProjectState,entity:ProjectEntity,scope:LayerScope,flowId?:string):LayeredContributorPath{
  const selectedFlowId=flowId??(scope==="Flow Page-instance"?entity.id:undefined),flowGraph=selectedFlowId?(state.project.documentationFlowGraphs as Record<string,{pageGroupIds?:string[];pageFrames?:ProjectEntity[]}>|undefined)?.[selectedFlowId]:undefined,flowPageGroupIds=flowGraph?.pageGroupIds??[],referencedFrameId=referencedId(entity,"pageFrameId")??(scope==="Flow Page-instance"?entity.id:undefined),referencedFrame=flowGraph?.pageFrames?.find(({id})=>id===referencedFrameId),flowPageGroupId=referencedId(referencedFrame??entity,"pageGroupId")??(flowPageGroupIds.length===1?flowPageGroupIds[0]:undefined),flowPageGroup=state.project.collections.pageGroups.find(({id})=>id===flowPageGroupId),flowPageIds=(flowPageGroup?.pageIds as string[]|undefined)??[],flowPageId=referencedId(referencedFrame??entity,"pageId")??(flowPageIds.length===1?flowPageIds[0]:undefined),profileId=scope==="Shared Profile"?entity.id:referencedProfileId(state,entity),pageId=referencedId(entity,"pageId")??(scope==="Page"?entity.id:scope==="Flow Page-instance"?flowPageId:undefined),pageGroupIds=pageId?orderedPageGroupIds(state.project,pageId):scope==="Page Group"?[entity.id]:[],pageGroupId=referencedId(referencedFrame??{},"pageGroupId")??referencedId(entity,"pageGroupId")??(scope==="Page Group"?entity.id:pageGroupIds.length===1?pageGroupIds[0]:scope==="Flow Page-instance"?flowPageGroupId:undefined),selectedPage=pageId?state.project.collections.pages.find(({id})=>id===pageId):undefined,contextBinding=((selectedPage?.contextEventBindings as ProjectEntity[]|undefined)??[]).find(({id})=>id===entity.contextBindingId),eventId=referencedId(entity,"eventId")??referencedId(contextBinding??{id:"",name:""},"eventId")??(scope==="Event"?entity.id:undefined);
  return{...(profileId?{profileId}:{}),...(eventId?{eventId}:{}),...(pageGroupId?{pageGroupId}:{}),...(pageGroupIds.length?{pageGroupIds}:{}),...(pageId?{pageId}:{}),...(selectedFlowId?{flowId:selectedFlowId}:{}),...(referencedFrame?{pageFrameId:referencedFrame.id}:{}),...(scope==="Event-occurrence"?{occurrenceId:entity.id}:{})};
}

export function layeredContributorsForPath(state:ProjectState,path:LayeredContributorPath,observation:Record<string,unknown>={}):LayerContributor[]{
  const graph=path.flowId?(state.project.documentationFlowGraphs as Record<string,{pageFrames?:ProjectEntity[];occurrences?:ProjectEntity[]}>|undefined)?.[path.flowId]:undefined,pageFrame=graph?.pageFrames?.find(({id})=>id===path.pageFrameId),occurrence=graph?.occurrences?.find(({id})=>id===path.occurrenceId);
  const one=(entities:ProjectEntity[],id:string|undefined,scope:LayerScope)=>id?entities.filter((entity)=>entity.id===id).map((entity)=>contributionFor(entity,scope)):[];
  const groupIds=path.pageGroupIds??(path.pageGroupId?[path.pageGroupId]:[]),groups=groupIds.flatMap((groupId)=>state.project.collections.pageGroups.filter(({id})=>id===groupId).map((group)=>{const contributor=contributionFor(group,"Page Group"),applicability=(state.project.collections.applicabilitySets??[]).find(({id})=>id===group.applicabilitySetId),conditional=Boolean(applicability),active=conditionMatches(applicability?.condition as Condition|undefined,observation);return{...contributor,...(conditional?{active,applicabilityConditional:true,...(!active?{exclusionReason:`${applicability!.name} did not match`}:{})}:{})};}));
  return[...one(state.project.collections.profiles,path.profileId,"Shared Profile"),...one(state.project.collections.events,path.eventId,"Event"),...groups,...one(state.project.collections.pages,path.pageId,"Page"),...(pageFrame?[contributionFor(pageFrame,"Flow Page-instance")]:[]),...(occurrence?[contributionFor(occurrence,occurrence.freePageFrame?"Flow Page-instance":"Event-occurrence")]:[])];
}

export function assignmentContributorTargets(state:ProjectState):AssignmentContributorTarget[]{
  const collection=(entities:readonly ProjectEntity[],kind:AssignmentContributorKind)=>entities.map(({id,name})=>({id,name,kind}));
  const frames=Object.entries(state.project.documentationFlowGraphs??{}).flatMap(([flowId,graph])=>((graph as {pageFrames?:ProjectEntity[]}).pageFrames??[]).map(({id,name})=>({id,name,kind:"Flow Page instance" as const,flowId})));
  return[...collection(state.project.collections.profiles,"Shared Profile"),...collection(state.project.collections.pageGroups,"Page Group"),...collection(state.project.collections.pages,"Page"),...collection(state.project.collections.events,"Event"),...frames];
}

export function compileAssignmentContributorTarget(state:ProjectState,assignment:ProjectEntity,context:LayerContext,observation:Record<string,unknown>={}):{target:AssignmentContributorTarget;contributors:LayerContributor[];compiled:CompiledLayeredSchema}{
  const target=assignmentContributorTargets(state).find(({id,kind})=>id===assignment.targetId&&kind===assignment.targetKind);if(!target)throw new Error(`Assignment ${assignment.name} has an unavailable contributor target.`);
  const source=target.kind==="Shared Profile"?state.project.collections.profiles.find(({id})=>id===target.id):target.kind==="Page Group"?state.project.collections.pageGroups.find(({id})=>id===target.id):target.kind==="Page"?state.project.collections.pages.find(({id})=>id===target.id):target.kind==="Event"?state.project.collections.events.find(({id})=>id===target.id):flowPageFrameContributor(state,target.flowId!,target.id),scope:LayerScope=target.kind==="Flow Page instance"?"Flow Page-instance":target.kind;
  if(!source)throw new Error(`Contributor target ${target.id} is unavailable.`);const path=layeredContributorPath(state,source,scope,target.flowId),contributors=layeredContributorsForPath(state,path,observation);return{target,contributors,compiled:compileLayeredSchema(contributors,context)};
}

export function layeredContributionDetails(state:ProjectState,entity:ProjectEntity,scope:LayerScope,flowId?:string){
  return layeredContributorsForPath(state,layeredContributorPath(state,entity,scope,flowId)).flatMap((contributor)=>contributor.constraints.map((constraint)=>({contributorId:contributor.id,contributorName:contributor.name,scope:contributor.scope,path:constraint.path,target:constraint.target??"all",condition:constraint.condition?JSON.stringify(constraint.condition):"Always",enforcement:constraint.enforcement??"not set",usedById:entity.id,usedByName:entity.name,usedByScope:scope})));
}

export function saveFlowPageInstanceLocalFacets(state:ProjectState,flowId:string,pageFrameId:string,path:string,facets:Omit<LayerConstraint,"path">):ProjectState{
  const graph=(state.project.documentationFlowGraphs as Record<string,{pageFrames?:ProjectEntity[]}>)[flowId],frame=graph?.pageFrames?.find(({id})=>id===pageFrameId);if(!frame)throw new Error(`Flow Page instance ${pageFrameId} is unavailable.`);const sparse=Object.fromEntries(Object.entries(facets).filter(([,value])=>value!==undefined&&value!==""));
  return transactProject(state,`Override ${path} at Flow Page instance`,(project)=>{const graphs=project.documentationFlowGraphs as Record<string,{pageFrames?:ProjectEntity[]}>;return{...project,documentationFlowGraphs:{...graphs,[flowId]:{...graphs[flowId],pageFrames:graphs[flowId]!.pageFrames!.map((candidate)=>candidate.id===pageFrameId?{...candidate,localSchemaContributions:[...((candidate.localSchemaContributions as LayerConstraint[]|undefined)??[]).filter((constraint)=>constraint.path!==path),...(Object.keys(sparse).length?[{path,...structuredClone(sparse)}]:[])],compiledTargetsStale:true}:candidate)}}};});
}

export function resetFlowPageInstanceLocalProperty(state:ProjectState,flowId:string,pageFrameId:string,path:string):ProjectState{
  const graph=(state.project.documentationFlowGraphs as Record<string,{pageFrames?:ProjectEntity[]}>)[flowId],frame=graph?.pageFrames?.find(({id})=>id===pageFrameId);if(!frame)throw new Error(`Flow Page instance ${pageFrameId} is unavailable.`);
  return transactProject(state,`Reset ${path} to parents at Flow Page instance`,(project)=>{const graphs=project.documentationFlowGraphs as Record<string,{pageFrames?:ProjectEntity[]}>;return{...project,documentationFlowGraphs:{...graphs,[flowId]:{...graphs[flowId],pageFrames:graphs[flowId]!.pageFrames!.map((candidate)=>candidate.id===pageFrameId?{...candidate,localSchemaContributions:((candidate.localSchemaContributions as LayerConstraint[]|undefined)??[]).filter((constraint)=>constraint.path!==path),compiledTargetsStale:true}:candidate)}}};});
}
