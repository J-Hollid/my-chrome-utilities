import {transactProject,type ProjectEntity,type ProjectState,type SpecificationProject} from "./data-layer-specification-project.js";

export interface PageGroupMembershipMigration {
  pageId:string;
  pageName:string;
  proposedPageGroupIds:string[];
  missingPageGroupIds:string[];
  duplicatePageGroupIds:string[];
}

export interface PageGroupMembershipRemovalReview {
  blocked:boolean;
  message:string;
  actions:{label:string;kind:"move-frame"|"remove-frame";flowId:string;frameId:string;pageGroupId?:string}[];
  affectedTargets:string[];
}

const storedIds=(page:ProjectEntity):string[]|undefined=>Array.isArray(page.pageGroupIds)?page.pageGroupIds.map(String):undefined;
const unique=(values:readonly string[]):string[]=>[...new Set(values)];
const legacyIds=(project:SpecificationProject,pageId:string):string[]=>project.collections.pageGroups.filter((group)=>((group.pageIds as string[]|undefined)??[]).includes(pageId)).map(({id})=>id);

export function requiresPageGroupMembershipMigration(project:SpecificationProject,pageId:string):boolean{
  const review=stagePageGroupMembershipMigration(project,pageId);return legacyIds(project,pageId).length>0||review.missingPageGroupIds.length>0||review.duplicatePageGroupIds.length>0;
}

export function orderedPageGroupIds(project:SpecificationProject,pageId:string):string[]{
  const page=project.collections.pages.find(({id})=>id===pageId);if(!page)return[];
  return unique([...(storedIds(page)??[]),...legacyIds(project,pageId)]);
}

export function pageGroupMembers(project:SpecificationProject,pageGroupId:string):ProjectEntity[]{
  const legacyIds=(project.collections.pageGroups.find(({id})=>id===pageGroupId)?.pageIds as string[]|undefined)??[];
  return project.collections.pages.filter((page)=>(storedIds(page)??[]).includes(pageGroupId)||legacyIds.includes(page.id));
}

function writeMemberships(state:ProjectState,pageId:string,pageGroupIds:readonly string[],label:string):ProjectState{
  return transactProject(state,label,(project)=>({...project,collections:{...project.collections,pages:project.collections.pages.map((page)=>page.id===pageId?{...page,pageGroupIds:[...pageGroupIds]}:page),pageGroups:project.collections.pageGroups.map((group)=>{if(!Array.isArray(group.pageIds)||(group.pageIds as string[]).every((id)=>id!==pageId))return group;const retained=(group.pageIds as string[]).filter((id)=>id!==pageId),next={...group};if(retained.length)next.pageIds=retained;else delete next.pageIds;return next;})}}));
}

export function addPageGroupMembership(state:ProjectState,pageId:string,pageGroupId:string):ProjectState{
  const page=state.project.collections.pages.find(({id})=>id===pageId);if(!page)throw new Error(`Unknown Page ${pageId}.`);
  const group=state.project.collections.pageGroups.find(({id})=>id===pageGroupId);if(!group)throw new Error(`Unknown Page Group ${pageGroupId}.`);
  if(requiresPageGroupMembershipMigration(state.project,pageId))return state;
  const current=orderedPageGroupIds(state.project,pageId);if(current.includes(pageGroupId))throw new Error(`${page.name} already belongs to ${group.name}.`);
  return writeMemberships(state,pageId,[...current,pageGroupId],`Add ${page.name} to Page Group ${group.name}`);
}

export function previewPageGroupMembershipMove(project:SpecificationProject,pageId:string,pageGroupId:string,delta:number):string[]{
  const current=orderedPageGroupIds(project,pageId),from=current.indexOf(pageGroupId);if(from<0||requiresPageGroupMembershipMigration(project,pageId))return current;
  const to=Math.max(0,Math.min(current.length-1,from+delta));if(to===from)return current;const next=[...current],moved=next.splice(from,1)[0]!;next.splice(to,0,moved);return next;
}

export function movePageGroupMembership(state:ProjectState,pageId:string,pageGroupId:string,delta:number):ProjectState{
  if(requiresPageGroupMembershipMigration(state.project,pageId))return state;
  const page=state.project.collections.pages.find(({id})=>id===pageId),current=orderedPageGroupIds(state.project,pageId),next=previewPageGroupMembershipMove(state.project,pageId,pageGroupId,delta);if(!page||next===current||next.join("\0")===current.join("\0"))return state;
  return writeMemberships(state,pageId,next,`Reorder Page Group rules for ${page.name}`);
}

export function inspectPageGroupMembershipRemoval(project:SpecificationProject,pageId:string,pageGroupId:string):PageGroupMembershipRemovalReview{
  const page=project.collections.pages.find(({id})=>id===pageId),group=project.collections.pageGroups.find(({id})=>id===pageGroupId),memberships=orderedPageGroupIds(project,pageId),groups=new Map(project.collections.pageGroups.map((candidate)=>[candidate.id,candidate]));
  const graphs=(project.documentationFlowGraphs as Record<string,{pageGroupIds?:string[];pageFrames?:{id:string;pageId:string;pageGroupId?:string}[]}>|undefined)??{},uses=Object.entries(graphs).flatMap(([flowId,graph])=>(graph.pageFrames??[]).filter((frame)=>frame.pageId===pageId&&frame.pageGroupId===pageGroupId).map((frame)=>({flowId,graph,frame})));
  const actions=uses.flatMap(({flowId,graph,frame})=>{const alternatives=(graph.pageGroupIds??[]).filter((id)=>id!==pageGroupId&&memberships.includes(id));return[...alternatives.slice(0,1).map((id)=>({label:`Move to ${groups.get(id)?.name??id}`,kind:"move-frame" as const,flowId,frameId:frame.id,pageGroupId:id})),{label:"Remove Page frame",kind:"remove-frame" as const,flowId,frameId:frame.id}];});
  const affectedTargets=uses.map(({flowId})=>project.collections.flows.find(({id})=>id===flowId)?.name??flowId),blocked=uses.length>0;
  return{blocked,message:blocked?`${affectedTargets[0]??"Flow"} uses ${page?.name??pageId} in ${group?.name??pageGroupId}; move or remove that Page frame before removing membership.`:`${page?.name??pageId} can leave ${group?.name??pageGroupId}.`,actions,affectedTargets};
}

export function removePageGroupMembership(state:ProjectState,pageId:string,pageGroupId:string):ProjectState{
  if(requiresPageGroupMembershipMigration(state.project,pageId))return state;
  const review=inspectPageGroupMembershipRemoval(state.project,pageId,pageGroupId);if(review.blocked)return state;
  const page=state.project.collections.pages.find(({id})=>id===pageId);if(!page)return state;const current=orderedPageGroupIds(state.project,pageId);if(!current.includes(pageGroupId))return state;
  const group=state.project.collections.pageGroups.find(({id})=>id===pageGroupId);
  return writeMemberships(state,pageId,current.filter((id)=>id!==pageGroupId),`Remove ${page.name} from Page Group ${group?.name??pageGroupId}`);
}

export function stagePageGroupMembershipMigration(project:SpecificationProject,pageId:string):PageGroupMembershipMigration{
  const page=project.collections.pages.find(({id})=>id===pageId);if(!page)throw new Error(`Unknown Page ${pageId}.`);
  const owned=storedIds(page)??[],legacy=legacyIds(project,pageId),combined=[...owned,...legacy],counts=new Map<string,number>();for(const id of combined)counts.set(id,(counts.get(id)??0)+1);
  const known=new Set(project.collections.pageGroups.map(({id})=>id));return{pageId,pageName:page.name,proposedPageGroupIds:unique(combined),missingPageGroupIds:unique(combined.filter((id)=>!known.has(id))),duplicatePageGroupIds:[...counts].filter(([,count])=>count>1).map(([id])=>id).filter((id)=>owned.filter((candidate)=>candidate===id).length>1)};
}

export function confirmPageGroupMembershipMigration(state:ProjectState,review:PageGroupMembershipMigration):ProjectState{
  if(review.missingPageGroupIds.length)throw new Error(`Cannot migrate missing Page Group ${review.missingPageGroupIds.join(", ")}.`);if(review.duplicatePageGroupIds.length)throw new Error(`Cannot migrate duplicate Page Group ${review.duplicatePageGroupIds.join(", ")}.`);
  const page=state.project.collections.pages.find(({id})=>id===review.pageId);if(!page)throw new Error(`Unknown Page ${review.pageId}.`);
  return transactProject(state,`Migrate ordered Page Group membership for ${page.name}`,(project)=>({...project,collections:{...project.collections,pages:project.collections.pages.map((candidate)=>candidate.id===page.id?{...candidate,pageGroupIds:[...review.proposedPageGroupIds]}:candidate),pageGroups:project.collections.pageGroups.map((group)=>{if(!Array.isArray(group.pageIds))return group;const pageIds=(group.pageIds as string[]).filter((id)=>id!==page.id),next={...group};if(pageIds.length)next.pageIds=pageIds;else delete next.pageIds;return next;})}}));
}
