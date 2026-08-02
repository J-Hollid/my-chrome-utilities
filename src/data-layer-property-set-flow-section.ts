import {transactProject,type IdFactory,type ProjectEntity,type ProjectState,type SpecificationProject} from "./data-layer-specification-project.js";

export interface PropertySetApplication extends ProjectEntity {
  propertySetId:string;
  applicabilitySetId?:string;
}
export interface FlowSectionBounds {x:number;y:number;width:number;height:number;}
export interface FlowSection extends ProjectEntity {bounds:FlowSectionBounds;order:number;}
export interface SectionPageFrame extends ProjectEntity {pageId:string;sectionId?:string;position:{x?:number;y:number};}
export interface FlowSectionRemovalReview {
  flowId:string;
  sectionId:string;
  sectionName:string;
  pageFrames:{id:string;name:string}[];
  relationships:{id:string;name:string}[];
  fingerprint:string;
}

type LegacyCollections=SpecificationProject["collections"]&{pageGroups?:ProjectEntity[]};
type SectionGraph={
  sections?:FlowSection[];
  pageGroupIds?:string[];
  pageFrames?:SectionPageFrame[];
  occurrences?:ProjectEntity[];
  relationships?:ProjectEntity[];
  [key:string]:unknown;
};

const clone=<T>(value:T):T=>structuredClone(value);
const legacyCollections=(project:SpecificationProject):LegacyCollections=>project.collections as LegacyCollections;
const graphs=(project:SpecificationProject):Record<string,SectionGraph>=>(project.documentationFlowGraphs??{}) as Record<string,SectionGraph>;
const unique=(values:readonly string[]):string[]=>[...new Set(values)];
const applications=(page:ProjectEntity):PropertySetApplication[]=>Array.isArray(page.propertySetApplications)?clone(page.propertySetApplications as PropertySetApplication[]):[];

export function orderedPropertySetApplications(project:SpecificationProject,pageId:string):PropertySetApplication[]{
  return applications(project.collections.pages.find(({id})=>id===pageId)??{id:"",name:""});
}

const updatePage=(state:ProjectState,pageId:string,label:string,update:(page:ProjectEntity)=>ProjectEntity):ProjectState=>transactProject(state,label,(project)=>{
  if(!project.collections.pages.some(({id})=>id===pageId))throw new Error(`Unknown Page ${pageId}.`);
  return{...project,collections:{...project.collections,pages:project.collections.pages.map((page)=>page.id===pageId?update(page):page)}};
});

export function addPropertySetApplication(state:ProjectState,pageId:string,propertySetId:string,applicabilitySetId: string|undefined,id:IdFactory):ProjectState{
  const page=state.project.collections.pages.find(({id})=>id===pageId),propertySet=state.project.collections.propertySets.find(({id})=>id===propertySetId);
  if(!page)throw new Error(`Unknown Page ${pageId}.`);if(!propertySet)throw new Error(`Unknown Property Set ${propertySetId}.`);
  if(applicabilitySetId&&!state.project.collections.applicabilitySets.some(({id})=>id===applicabilitySetId))throw new Error(`Unknown Applicability Set ${applicabilitySetId}.`);
  if(applications(page).some((application)=>application.propertySetId===propertySetId))throw new Error(`${page.name} already applies ${propertySet.name}.`);
  return updatePage(state,pageId,`Apply Property Set ${propertySet.name} to ${page.name}`,(candidate)=>({...candidate,propertySetApplications:[...applications(candidate),{id:id("property-set-application"),name:propertySet.name,propertySetId,...(applicabilitySetId?{applicabilitySetId}:{})}]}));
}

export function reorderPropertySetApplication(state:ProjectState,pageId:string,propertySetId:string,delta:number):ProjectState{
  const page=state.project.collections.pages.find(({id})=>id===pageId);if(!page)throw new Error(`Unknown Page ${pageId}.`);const current=applications(page),from=current.findIndex((application)=>application.propertySetId===propertySetId);if(from<0)return state;const to=Math.max(0,Math.min(current.length-1,from+delta));if(to===from)return state;const next=[...current],moved=next.splice(from,1)[0]!;next.splice(to,0,moved);return updatePage(state,pageId,`Reorder Property composition for ${page.name}`,(candidate)=>({...candidate,propertySetApplications:next}));
}

export function removePropertySetApplication(state:ProjectState,pageId:string,propertySetId:string):ProjectState{
  const page=state.project.collections.pages.find(({id})=>id===pageId);if(!page)return state;const current=applications(page);if(!current.some((application)=>application.propertySetId===propertySetId))return state;const propertySet=state.project.collections.propertySets.find(({id})=>id===propertySetId);return updatePage(state,pageId,`Remove Property Set ${propertySet?.name??propertySetId} from ${page.name}`,(candidate)=>({...candidate,propertySetApplications:current.filter((application)=>application.propertySetId!==propertySetId)}));
}

export function propertySetPages(project:SpecificationProject,propertySetId:string):ProjectEntity[]{return project.collections.pages.filter((page)=>applications(page).some((application)=>application.propertySetId===propertySetId));}

export function changePropertySetSchema(state:ProjectState,propertySetId:string,constraints:readonly Record<string,unknown>[]):ProjectState{
  const propertySet=state.project.collections.propertySets.find(({id})=>id===propertySetId);if(!propertySet)throw new Error(`Unknown Property Set ${propertySetId}.`);return transactProject(state,`Change Property Set schema for ${propertySet.name}`,(project)=>({...project,collections:{...project.collections,propertySets:project.collections.propertySets.map((candidate)=>candidate.id===propertySetId?{...candidate,schemaConstraints:clone(constraints),compiledTargetsStale:true}:candidate)}}));
}

export function stagePropertySetParentAddition(state:ProjectState,propertySetId:string,profileId:string,constraint:Record<string,unknown>):ProjectState{
  const propertySet=state.project.collections.propertySets.find(({id})=>id===propertySetId),profile=state.project.collections.profiles.find(({id})=>id===profileId),path=String(constraint.path??"");if(!propertySet)throw new Error(`Unknown Property Set ${propertySetId}.`);if(!profile)throw new Error(`Unknown Shared Profile ${profileId}.`);if(!path)throw new Error("A Parent addition requires a property path.");return transactProject(state,`Add ${path} to ${profile.name} for ${propertySet.name} review`,(project)=>({...project,collections:{...project.collections,profiles:project.collections.profiles.map((candidate)=>candidate.id===profileId?{...candidate,parentAdditions:[...((candidate.parentAdditions as Record<string,unknown>[]|undefined)??[]).filter((entry)=>entry.path!==path),clone(constraint)]}:candidate),propertySets:project.collections.propertySets.map((candidate)=>candidate.id===propertySetId?{...candidate,parentAdditions:[...((candidate.parentAdditions as Record<string,unknown>[]|undefined)??[]).filter((entry)=>entry.path!==path),{...clone(constraint),profileId}]}:candidate)}}));
}

export function includePropertySetParentAddition(state:ProjectState,propertySetId:string,path:string):ProjectState{
  const propertySet=state.project.collections.propertySets.find(({id})=>id===propertySetId),addition=(propertySet?.parentAdditions as Record<string,unknown>[]|undefined)?.find((entry)=>entry.path===path);if(!propertySet)throw new Error(`Unknown Property Set ${propertySetId}.`);if(!addition)throw new Error(`Parent addition ${path} is unavailable.`);const{profileId:_profileId,...constraint}=addition;return transactProject(state,`Include Parent addition ${path} in ${propertySet.name}`,(project)=>({...project,collections:{...project.collections,propertySets:project.collections.propertySets.map((candidate)=>candidate.id!==propertySetId?candidate:{...candidate,schemaConstraints:[...((candidate.schemaConstraints as Record<string,unknown>[]|undefined)??[]).filter((entry)=>entry.path!==path),constraint],parentAdditions:((candidate.parentAdditions as Record<string,unknown>[]|undefined)??[]).filter((entry)=>entry.path!==path),compiledTargetsStale:true})}}));
}

const sectionGraph=(project:SpecificationProject,flowId:string):SectionGraph=>{if(!project.collections.flows.some(({id})=>id===flowId))throw new Error(`Unknown Flow ${flowId}.`);return graphs(project)[flowId]??{sections:[],pageFrames:[],occurrences:[],relationships:[]};};
const saveGraph=(state:ProjectState,flowId:string,label:string,update:(graph:SectionGraph)=>SectionGraph):ProjectState=>transactProject(state,label,(project)=>({...project,documentationFlowGraphs:{...graphs(project),[flowId]:update(clone(sectionGraph(project,flowId)))}}));
const cleanBounds=(bounds:FlowSectionBounds):FlowSectionBounds=>({x:Math.round(bounds.x),y:Math.round(bounds.y),width:Math.max(240,Math.round(bounds.width)),height:Math.max(140,Math.round(bounds.height))});
const withoutSection=(frame:SectionPageFrame):SectionPageFrame=>{const{sectionId:_sectionId,...outside}=frame;return outside;};

export function createFlowSection(state:ProjectState,flowId:string,input:{name:string;bounds:FlowSectionBounds},id:IdFactory):ProjectState{
  const name=input.name.trim();if(!name)throw new Error("A Flow Section requires a name.");return saveGraph(state,flowId,`Create Section ${name}`,(graph)=>({...graph,sections:[...(graph.sections??[]),{id:id("flow-section"),name,bounds:cleanBounds(input.bounds),order:(graph.sections??[]).length}]}));
}

export function movePageFrameToSection(state:ProjectState,flowId:string,frameId:string,sectionId?:string):ProjectState{
  const graph=sectionGraph(state.project,flowId),frame=graph.pageFrames?.find(({id})=>id===frameId);if(!frame)throw new Error(`Unknown Page frame ${frameId}.`);const section=sectionId?graph.sections?.find(({id})=>id===sectionId):undefined;if(sectionId&&!section)throw new Error(`Unknown Flow Section ${sectionId}.`);return saveGraph(state,flowId,section?`Move ${frame.name} to Section ${section.name}`:`Move ${frame.name} outside Sections`,(next)=>({...next,pageFrames:(next.pageFrames??[]).map((candidate)=>candidate.id!==frameId?candidate:section?{...candidate,sectionId:section.id,position:{x:section.bounds.x+40,y:section.bounds.y+50}}:withoutSection(candidate))}));
}

export function moveFlowSection(state:ProjectState,flowId:string,sectionId:string,position:{x:number;y:number}):ProjectState{
  const section=sectionGraph(state.project,flowId).sections?.find(({id})=>id===sectionId);if(!section)throw new Error(`Unknown Flow Section ${sectionId}.`);const dx=Math.round(position.x)-section.bounds.x,dy=Math.round(position.y)-section.bounds.y;return saveGraph(state,flowId,`Move Section ${section.name}`,(graph)=>({...graph,sections:(graph.sections??[]).map((candidate)=>candidate.id===sectionId?{...candidate,bounds:{...candidate.bounds,x:position.x,y:position.y}}:candidate),pageFrames:(graph.pageFrames??[]).map((frame)=>frame.sectionId===sectionId?{...frame,position:{...(frame.position.x===undefined?{}:{x:frame.position.x+dx}),y:frame.position.y+dy}}:frame)}));
}

export function renameAndResizeFlowSection(state:ProjectState,flowId:string,sectionId:string,input:{name:string;bounds:FlowSectionBounds}):ProjectState{
  const section=sectionGraph(state.project,flowId).sections?.find(({id})=>id===sectionId),name=input.name.trim();if(!section)throw new Error(`Unknown Flow Section ${sectionId}.`);if(!name)throw new Error("A Flow Section requires a name.");return saveGraph(state,flowId,`Resize and rename Section ${section.name}`,(graph)=>({...graph,sections:(graph.sections??[]).map((candidate)=>candidate.id===sectionId?{...candidate,name,bounds:cleanBounds(input.bounds)}:candidate)}));
}

export function removeFlowSection(state:ProjectState,flowId:string,sectionId:string):ProjectState{
  const section=sectionGraph(state.project,flowId).sections?.find(({id})=>id===sectionId);if(!section)return state;return saveGraph(state,flowId,`Remove Section ${section.name} and retain Page frames`,(graph)=>({...graph,sections:(graph.sections??[]).filter(({id})=>id!==sectionId).map((candidate,order)=>({...candidate,order})),pageFrames:(graph.pageFrames??[]).map((frame)=>frame.sectionId===sectionId?withoutSection(frame):frame)}));
}

const endpointId=(relationship:ProjectEntity,side:"source"|"target"):string|undefined=>String((relationship[`${side}Endpoint`] as {id?:unknown}|undefined)?.id??relationship[`${side}NodeId`]??"")||undefined;
const sectionRemovalFingerprint=(graph:SectionGraph,sectionId:string):string=>JSON.stringify({section:graph.sections?.find(({id})=>id===sectionId),frames:(graph.pageFrames??[]).filter((frame)=>frame.sectionId===sectionId),occurrences:graph.occurrences??[],relationships:graph.relationships??[]});
export function inspectSectionRemovalWithContents(project:SpecificationProject,flowId:string,sectionId:string):FlowSectionRemovalReview{
  const graph=sectionGraph(project,flowId),section=graph.sections?.find(({id})=>id===sectionId);if(!section)throw new Error(`Unknown Flow Section ${sectionId}.`);const frames=(graph.pageFrames??[]).filter((frame)=>frame.sectionId===sectionId),ids=new Set(frames.map(({id})=>id)),relationships=(graph.relationships??[]).filter((relationship)=>ids.has(endpointId(relationship,"source")??"")||ids.has(endpointId(relationship,"target")??""));return{flowId,sectionId,sectionName:section.name,pageFrames:frames.map(({id,name})=>({id,name})),relationships:relationships.map(({id,name})=>({id,name:name||id})),fingerprint:sectionRemovalFingerprint(graph,sectionId)};
}

export function removeFlowSectionWithContents(state:ProjectState,flowId:string,sectionId:string,review:FlowSectionRemovalReview):ProjectState{
  const graph=sectionGraph(state.project,flowId);if(review.flowId!==flowId||review.sectionId!==sectionId||review.fingerprint!==sectionRemovalFingerprint(graph,sectionId))throw new Error("Review the current Section impact before destructive removal.");const frameIds=new Set(review.pageFrames.map(({id})=>id)),occurrenceIds=new Set((graph.occurrences??[]).filter((occurrence)=>frameIds.has(String(occurrence.pageFrameId??""))).map(({id})=>id)),removedIds=new Set([...frameIds,...occurrenceIds]);return saveGraph(state,flowId,`Remove Section ${review.sectionName} with contents`,(next)=>({...next,sections:(next.sections??[]).filter(({id})=>id!==sectionId).map((candidate,order)=>({...candidate,order})),pageFrames:(next.pageFrames??[]).filter(({id})=>!frameIds.has(id)),occurrences:(next.occurrences??[]).filter(({id})=>!occurrenceIds.has(id)),relationships:(next.relationships??[]).filter((relationship)=>!removedIds.has(endpointId(relationship,"source")??"")&&!removedIds.has(endpointId(relationship,"target")??""))}));
}

const verifyUpgrade=(before:SpecificationProject,after:SpecificationProject):void=>{
  const legacy=legacyCollections(before).pageGroups??[],sets=after.collections.propertySets;if(legacy.length!==sets.length||legacy.some((group)=>!sets.some(({id})=>id===group.id)))throw new Error("Property Set upgrade did not preserve contributor identities.");
  for(const[flowId,beforeGraph]of Object.entries(graphs(before))){const afterGraph=graphs(after)[flowId];if(!afterGraph)throw new Error(`Flow ${flowId} was not preserved.`);const keys=(values:readonly ProjectEntity[]|undefined)=>JSON.stringify((values??[]).map(({id})=>id));if(keys(beforeGraph.pageFrames)!==keys(afterGraph.pageFrames)||keys(beforeGraph.occurrences)!==keys(afterGraph.occurrences)||JSON.stringify(beforeGraph.relationships??[])!==JSON.stringify(afterGraph.relationships??[]))throw new Error(`Flow ${flowId} identities or topology changed during upgrade.`);}
};

export function upgradePageGroupsToPropertySets(state:ProjectState,id:IdFactory):ProjectState{
  const legacy=legacyCollections(state.project).pageGroups;if(!legacy)return state;
  return transactProject(state,"Upgrade Page Groups to Property Sets and Flow Sections",(project)=>{
    const legacySets=legacyCollections(project).pageGroups??[],propertySets=legacySets.map((group)=>{const next=clone(group);delete next.pageIds;delete next.applicabilitySetId;return next;}),applicabilityBySet=new Map(legacySets.map((group)=>[group.id,typeof group.applicabilitySetId==="string"?group.applicabilitySetId:undefined])),legacyMembers=new Map(legacySets.map((group)=>[group.id,new Set(((group.pageIds as string[]|undefined)??[]).map(String))]));
    const pages=project.collections.pages.map((page)=>{const stored=Array.isArray(page.pageGroupIds)?page.pageGroupIds.map(String):[],fromGroups=legacySets.filter((group)=>legacyMembers.get(group.id)?.has(page.id)).map(({id})=>id),ordered=unique([...stored,...fromGroups]),next:ProjectEntity={...page,propertySetApplications:ordered.map((propertySetId)=>{const set=propertySets.find(({id})=>id===propertySetId)!;return{id:id("property-set-application"),name:set.name,propertySetId,...(applicabilityBySet.get(propertySetId)?{applicabilitySetId:applicabilityBySet.get(propertySetId)}:{})};})};delete next.pageGroupIds;return next;});
    const documentationFlowGraphs=Object.fromEntries(Object.entries(graphs(project)).map(([flowId,graph])=>{const laneIds=unique([...(graph.pageGroupIds??[]),...(graph.pageFrames??[]).flatMap((frame)=>typeof frame.pageGroupId==="string"?[frame.pageGroupId]:[])]),sectionByLane=new Map<string,string>(),sections=laneIds.map((groupId,order)=>{const group=legacySets.find(({id})=>id===groupId),sectionId=id("flow-section");sectionByLane.set(groupId,sectionId);return{id:sectionId,name:group?.name??groupId,order,bounds:{x:20,y:40+order*220,width:1000,height:200}};}),pageFrames=(graph.pageFrames??[]).map((frame)=>{const legacyFrame=frame as SectionPageFrame&{pageGroupId?:string},next:SectionPageFrame={...legacyFrame,...(typeof legacyFrame.pageGroupId==="string"&&sectionByLane.has(legacyFrame.pageGroupId)?{sectionId:sectionByLane.get(legacyFrame.pageGroupId)!}:{})};delete (next as SectionPageFrame&{pageGroupId?:string}).pageGroupId;return next;}),next:SectionGraph={...graph,sections,pageFrames};delete next.pageGroupIds;return[flowId,next];})),assignments=project.collections.assignments.map((assignment)=>assignment.targetKind==="Page Group"?{...assignment,targetKind:"Property Set"}:assignment),nextCollections={...project.collections,propertySets,pages,assignments} as LegacyCollections;delete nextCollections.pageGroups;const next={...project,collections:nextCollections,documentationFlowGraphs,propertySetFlowSectionVersion:1};verifyUpgrade(project,next);return next;
  });
}
