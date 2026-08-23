import {transactProject,type ProjectEntity,type ProjectState,type SpecificationProject} from "./data-layer-specification-project.js";
import {announceReorderCompletion,renderReorderControl,renderReorderableItemRow,type ReorderRequest} from "./reorderable-editor/control.js";

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

export interface PageGroupMembershipMoveReview {
  pageId:string;
  pageName:string;
  pageGroupId:string;
  pageGroupName:string;
  currentPageGroupIds:string[];
  proposedPageGroupIds:string[];
  summary:string;
}

const storedIds=(page:ProjectEntity):string[]|undefined=>Array.isArray(page.pageGroupIds)?page.pageGroupIds.map(String):undefined;
const unique=(values:readonly string[]):string[]=>[...new Set(values)];
const legacyIds=(project:SpecificationProject,pageId:string):string[]=>project.collections.propertySets.filter((group)=>((group.pageIds as string[]|undefined)??[]).includes(pageId)).map(({id})=>id);

export function requiresPageGroupMembershipMigration(project:SpecificationProject,pageId:string):boolean{
  const review=stagePageGroupMembershipMigration(project,pageId);return legacyIds(project,pageId).length>0||review.missingPageGroupIds.length>0||review.duplicatePageGroupIds.length>0;
}

export function orderedPageGroupIds(project:SpecificationProject,pageId:string):string[]{
  const page=project.collections.pages.find(({id})=>id===pageId);if(!page)return[];
  return unique([...(storedIds(page)??[]),...legacyIds(project,pageId)]);
}

export function pageGroupMembers(project:SpecificationProject,pageGroupId:string):ProjectEntity[]{
  const legacyIds=(project.collections.propertySets.find(({id})=>id===pageGroupId)?.pageIds as string[]|undefined)??[];
  return project.collections.pages.filter((page)=>(storedIds(page)??[]).includes(pageGroupId)||legacyIds.includes(page.id));
}

function writeMemberships(state:ProjectState,pageId:string,pageGroupIds:readonly string[],label:string):ProjectState{
  return transactProject(state,label,(project)=>({...project,collections:{...project.collections,pages:project.collections.pages.map((page)=>page.id===pageId?{...page,pageGroupIds:[...pageGroupIds]}:page),propertySets:project.collections.propertySets.map((group)=>{if(!Array.isArray(group.pageIds)||(group.pageIds as string[]).every((id)=>id!==pageId))return group;const retained=(group.pageIds as string[]).filter((id)=>id!==pageId),next={...group};if(retained.length)next.pageIds=retained;else delete next.pageIds;return next;})}}));
}

export function addPageGroupMembership(state:ProjectState,pageId:string,pageGroupId:string):ProjectState{
  const page=state.project.collections.pages.find(({id})=>id===pageId);if(!page)throw new Error(`Unknown Page ${pageId}.`);
  const group=state.project.collections.propertySets.find(({id})=>id===pageGroupId);if(!group)throw new Error(`Unknown Property Set ${pageGroupId}.`);
  if(requiresPageGroupMembershipMigration(state.project,pageId))return state;
  const current=orderedPageGroupIds(state.project,pageId);if(current.includes(pageGroupId))throw new Error(`${page.name} already belongs to ${group.name}.`);
  return writeMemberships(state,pageId,[...current,pageGroupId],`Add ${page.name} to Property Set ${group.name}`);
}

export function previewPageGroupMembershipMove(project:SpecificationProject,pageId:string,pageGroupId:string,delta:number):string[]{
  const current=orderedPageGroupIds(project,pageId),from=current.indexOf(pageGroupId);if(from<0||requiresPageGroupMembershipMigration(project,pageId))return current;
  const to=Math.max(0,Math.min(current.length-1,from+delta));if(to===from)return current;const next=[...current],moved=next.splice(from,1)[0]!;next.splice(to,0,moved);return next;
}

export function inspectPageGroupMembershipMove(project:SpecificationProject,pageId:string,pageGroupId:string,delta:number):PageGroupMembershipMoveReview{
  const page=project.collections.pages.find(({id})=>id===pageId);if(!page)throw new Error(`Unknown Page ${pageId}.`);
  const pageGroup=project.collections.propertySets.find(({id})=>id===pageGroupId);if(!pageGroup)throw new Error(`Unknown Property Set ${pageGroupId}.`);
  const currentPageGroupIds=orderedPageGroupIds(project,pageId),proposedPageGroupIds=previewPageGroupMembershipMove(project,pageId,pageGroupId,delta);
  return{pageId,pageName:page.name,pageGroupId,pageGroupName:pageGroup.name,currentPageGroupIds,proposedPageGroupIds,summary:`Reordering ${pageGroup.name} changes effective property composition for ${page.name}; affected Page instances and compiled targets are recomputed, and documentation exports become stale.`};
}

export function movePageGroupMembership(state:ProjectState,pageId:string,pageGroupId:string,delta:number):ProjectState{
  if(requiresPageGroupMembershipMigration(state.project,pageId))return state;
  const page=state.project.collections.pages.find(({id})=>id===pageId),current=orderedPageGroupIds(state.project,pageId),next=previewPageGroupMembershipMove(state.project,pageId,pageGroupId,delta);if(!page||next===current||next.join("\0")===current.join("\0"))return state;
  return writeMemberships(state,pageId,next,`Reorder Property Set rules for ${page.name}`);
}

export function inspectPageGroupMembershipRemoval(project:SpecificationProject,pageId:string,pageGroupId:string):PageGroupMembershipRemovalReview{
  const page=project.collections.pages.find(({id})=>id===pageId),group=project.collections.propertySets.find(({id})=>id===pageGroupId),memberships=orderedPageGroupIds(project,pageId),groups=new Map(project.collections.propertySets.map((candidate)=>[candidate.id,candidate]));
  const graphs=(project.documentationFlowGraphs as Record<string,{pageGroupIds?:string[];pageFrames?:{id:string;pageId:string;pageGroupId?:string}[]}>|undefined)??{},uses=Object.entries(graphs).flatMap(([flowId,graph])=>(graph.pageFrames??[]).filter((frame)=>frame.pageId===pageId&&frame.pageGroupId===pageGroupId).map((frame)=>({flowId,graph,frame})));
  const actions=uses.flatMap(({flowId,graph,frame})=>{const alternatives=(graph.pageGroupIds??[]).filter((id)=>id!==pageGroupId&&memberships.includes(id));return[...alternatives.slice(0,1).map((id)=>({label:`Move to ${groups.get(id)?.name??id}`,kind:"move-frame" as const,flowId,frameId:frame.id,pageGroupId:id})),{label:"Remove Page frame",kind:"remove-frame" as const,flowId,frameId:frame.id}];});
  const affectedTargets=uses.map(({flowId})=>project.collections.flows.find(({id})=>id===flowId)?.name??flowId),blocked=uses.length>0;
  return{blocked,message:blocked?`${affectedTargets[0]??"Flow"} uses ${page?.name??pageId} in ${group?.name??pageGroupId}; move or remove that Page frame before removing membership.`:`${page?.name??pageId} can leave ${group?.name??pageGroupId}.`,actions,affectedTargets};
}

export function removePageGroupMembership(state:ProjectState,pageId:string,pageGroupId:string):ProjectState{
  if(requiresPageGroupMembershipMigration(state.project,pageId))return state;
  const review=inspectPageGroupMembershipRemoval(state.project,pageId,pageGroupId);if(review.blocked)return state;
  const page=state.project.collections.pages.find(({id})=>id===pageId);if(!page)return state;const current=orderedPageGroupIds(state.project,pageId);if(!current.includes(pageGroupId))return state;
  const group=state.project.collections.propertySets.find(({id})=>id===pageGroupId);
  return writeMemberships(state,pageId,current.filter((id)=>id!==pageGroupId),`Remove ${page.name} from Property Set ${group?.name??pageGroupId}`);
}

export function stagePageGroupMembershipMigration(project:SpecificationProject,pageId:string):PageGroupMembershipMigration{
  const page=project.collections.pages.find(({id})=>id===pageId);if(!page)throw new Error(`Unknown Page ${pageId}.`);
  const owned=storedIds(page)??[],legacy=legacyIds(project,pageId),combined=[...owned,...legacy],counts=new Map<string,number>();for(const id of combined)counts.set(id,(counts.get(id)??0)+1);
  const known=new Set(project.collections.propertySets.map(({id})=>id));return{pageId,pageName:page.name,proposedPageGroupIds:unique(combined),missingPageGroupIds:unique(combined.filter((id)=>!known.has(id))),duplicatePageGroupIds:[...counts].filter(([,count])=>count>1).map(([id])=>id).filter((id)=>owned.filter((candidate)=>candidate===id).length>1)};
}

export function confirmPageGroupMembershipMigration(state:ProjectState,review:PageGroupMembershipMigration):ProjectState{
  if(review.missingPageGroupIds.length)throw new Error(`Cannot migrate missing Property Set ${review.missingPageGroupIds.join(", ")}.`);if(review.duplicatePageGroupIds.length)throw new Error(`Cannot migrate duplicate Property Set ${review.duplicatePageGroupIds.join(", ")}.`);
  const page=state.project.collections.pages.find(({id})=>id===review.pageId);if(!page)throw new Error(`Unknown Page ${review.pageId}.`);
  return transactProject(state,`Migrate ordered Property Set membership for ${page.name}`,(project)=>({...project,collections:{...project.collections,pages:project.collections.pages.map((candidate)=>candidate.id===page.id?{...candidate,pageGroupIds:[...review.proposedPageGroupIds]}:candidate),propertySets:project.collections.propertySets.map((group)=>{if(!Array.isArray(group.pageIds))return group;const pageIds=(group.pageIds as string[]).filter((id)=>id!==page.id),next={...group};if(pageIds.length)next.pageIds=pageIds;else delete next.pageIds;return next;})}}));
}

export interface PageGroupMembershipPresentationRow {
  id:string;
  label:string;
  position:number;
  count:number;
}

export interface PageGroupMembershipUiOptions {
  current:()=>ProjectState;
  pageId:string;
  persist:(state:ProjectState)=>void;
  open:(pageGroupId:string)=>void;
  remove:(pageGroupId:string)=>void;
}

export function pageGroupMembershipPresentation(project:SpecificationProject,pageId:string):PageGroupMembershipPresentationRow[]{
  const ids=orderedPageGroupIds(project,pageId),groups=new Map(project.collections.propertySets.map((group)=>[group.id,group]));
  return ids.map((id,index)=>({id,label:groups.get(id)?.name??id,position:index+1,count:ids.length}));
}

export function mountPageGroupMembershipEditor(host:HTMLElement,options:PageGroupMembershipUiOptions):{render:()=>void}{
  let pending:{request:ReorderRequest;delta:number}|undefined;
  const doc=host.ownerDocument;
  const focusTrigger=(id:string)=>queueMicrotask(()=>host.querySelector<HTMLButtonElement>(`[data-page-group-membership-id="${CSS.escape(id)}"] [data-reorder-trigger="true"]`)?.focus({preventScroll:true}));
  const button=(label:string,action:()=>void)=>{const control=doc.createElement("button");control.type="button";control.textContent=label;control.addEventListener("click",action);return control;};
  const render=()=>{
    const state=options.current(),page=state.project.collections.pages.find(({id})=>id===options.pageId),rows=pageGroupMembershipPresentation(state.project,options.pageId),section=doc.createElement("section"),list=doc.createElement("ol"),heading=doc.createElement("h2");
    if(!page){host.replaceChildren();return;}
    section.setAttribute("aria-label","Page Group memberships");heading.textContent="Page Group memberships";list.setAttribute("aria-label",`${page.name} Page Group membership stack`);section.append(heading,list);
    for(const row of rows){
      const item=doc.createElement("li"),open=button("Open Page Group",()=>options.open(row.id)),remove=button("Remove",()=>options.remove(row.id)),reorder=renderReorderControl({focusScopeId:`page-group-memberships:${options.pageId}`,
        itemId:row.id,itemLabel:row.label,completeOrder:rows.map(({id,label})=>({id,label})),dropTarget:item,orderedContainer:list,
        onMove:(request)=>{pending={request,delta:request.toIndex-request.fromIndex};render();return false;},
      });
      const identity=Object.assign(doc.createElement("span"),{textContent:row.label}),actions=doc.createElement("span");actions.append(open,remove);
      item.dataset.pageGroupMembershipId=row.id;item.append(renderReorderableItemRow({control:reorder,primaryContent:identity,trailingContent:actions}));list.append(item);
    }
    if(pending){
      const review=inspectPageGroupMembershipMove(state.project,options.pageId,pending.request.itemId,pending.delta),dialog=doc.createElement("dialog"),summary=doc.createElement("p"),order=doc.createElement("p");
      dialog.setAttribute("aria-label","Page Group membership reorder review");summary.textContent=review.summary;order.textContent=`${review.currentPageGroupIds.join(" → ")} becomes ${review.proposedPageGroupIds.join(" → ")}.`;
      const cancel=button("Cancel membership reorder",()=>{const id=pending!.request.itemId;pending=undefined;render();focusTrigger(id);}),confirm=button("Confirm membership reorder",()=>{const request=pending!.request,label=rows.find(({id})=>id===request.itemId)?.label??request.itemId,next=movePageGroupMembership(options.current(),options.pageId,request.itemId,pending!.delta);pending=undefined;options.persist(next);render();announceReorderCompletion(doc,{focusScopeId:`page-group-memberships:${options.pageId}`,itemId:request.itemId,itemLabel:label,fromIndex:request.fromIndex,toIndex:request.toIndex});});
      dialog.append(summary,order,cancel,confirm);section.append(dialog);queueMicrotask(()=>{if(typeof dialog.showModal==="function")dialog.showModal();else dialog.setAttribute("open","");confirm.focus();});
    }
    host.replaceChildren(section);
  };
  render();return{render};
}
