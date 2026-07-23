import {documentaryFlowGraph,type FlowRelationshipKind} from "./utilities/data-layer/flow-graph.js";
import {compileLayeredSchema,layeredContributorPath,layeredContributorsForPath,validateLayeredObservation,type LayerScope,type ProjectEntity,type ProjectState} from "./utilities/data-layer/schemas.js";

export type LiveFlowStepKind="Page"|"Event";
export interface LiveFlowEvent {id:string;name:string;sourceId:string;sourceName?:string;captureTime:string;pageUrl?:string;payload?:unknown;rawInput?:unknown;[key:string]:unknown}
export interface LiveFlowChoice {id:string;name:string}
export interface LiveFlowStartChoice extends LiveFlowChoice {kind:"Page";pageId:string;lane:string;stableFrameId:string;recommended:boolean}
export interface LiveFlowNextStep extends LiveFlowChoice {kind:FlowRelationshipKind;stepKind:LiveFlowStepKind;relationshipId:string;displayName:string}
export interface LiveFlowGraphNode extends LiveFlowChoice {stepKind:LiveFlowStepKind;enabled:boolean;reason:string;next?:LiveFlowNextStep}
export interface LiveFlowCandidate {eventId:string;name:string;captureTime:string;eligible:boolean;selected:false;reason:string;evidence:string}
type LayerValidationIssue=ReturnType<typeof validateLayeredObservation>["issues"][number];
export interface LiveFlowMatchedPathEntry {stepId:string;stepName:string;relationshipId?:string;eventId:string;captureTime:string}
export interface LiveFlowHistoryEntry {
  projectId:string;flowId:string;flowName:string;
  stepId:string;stepKind:LiveFlowStepKind;stepName:string;eventId:string;captureTime:string;selectionMode:"Manual Flow test";
  relationshipId?:string;effectiveSchemaRevision:number;effectiveSchemaRevisionIdentity:string;issues:LayerValidationIssue[];
  provenance:{contributorId:string;contributorName:string;scope:LayerScope}[];target:{id:string;name:string};status:"Valid"|"Invalid";matchedPath:LiveFlowMatchedPathEntry[];defectId?:string;
}
export interface LiveFlowTestRun {
  id:string;projectId:string;flowId?:string|undefined;flowName?:string|undefined;startChoices:LiveFlowStartChoice[];currentStepId?:string|undefined;
  incomingRelationshipId?:string|undefined;history:LiveFlowHistoryEntry[];matchedEventIds:string[];startedAt?:string|undefined;
}
export interface CompletedLiveFlowTest {runId:string;projectId:string;flowId:string;flowName:string;label:"Completed selected path";endedAt:string;history:LiveFlowHistoryEntry[];unchosenAlternatives:{relationshipId:string;stepId:string;status:"Not tested"}[];resumeMatching:false}

const clone=<T>(value:T):T=>structuredClone(value);
const graphs=(state:ProjectState)=>state.project.documentationFlowGraphs as Record<string,{pageFrames?:ProjectEntity[];occurrences?:ProjectEntity[];relationships?:Record<string,unknown>[]}>;
const graph=(state:ProjectState,flowId:string)=>documentaryFlowGraph(state.project,flowId);
const capturedAfter=(candidate:string,prior:string)=>Date.parse(candidate)>Date.parse(prior);
const payload=(event:LiveFlowEvent):Record<string,unknown>=>{const value=event.payload??event.rawInput;return value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};};
function assertRunProject(run:LiveFlowTestRun,state:ProjectState):void{if(state.project.id!==run.projectId)throw new Error("Flow test project context changed.");}

function frameName(state:ProjectState,frame:ProjectEntity):string{return state.project.collections.pages.find(({id})=>id===frame.pageId)?.name??frame.name;}
function occurrenceName(state:ProjectState,flowId:string,occurrence:ProjectEntity):string{void flowId;return occurrence.name||(state.project.collections.events.find(({id})=>id===occurrence.eventId)?.name??occurrence.id);}
function step(state:ProjectState,flowId:string,id:string):{id:string;kind:LiveFlowStepKind;name:string;entity:ProjectEntity;scope:"Flow Page-instance"|"Event-occurrence"}{
  const current=graphs(state)[flowId];const frame=current?.pageFrames?.find((candidate)=>candidate.id===id);if(frame)return{id,kind:"Page",name:frameName(state,frame),entity:frame,scope:"Flow Page-instance"};
  const occurrence=current?.occurrences?.find((candidate)=>candidate.id===id);if(occurrence)return{id,kind:"Event",name:occurrenceName(state,flowId,occurrence),entity:occurrence,scope:"Event-occurrence"};
  throw new Error(`Flow graph step ${id} is unavailable.`);
}
function stableJson(value:unknown):string{
  if(Array.isArray(value))return`[${value.map(stableJson).join(",")}]`;
  if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).sort(([left],[right])=>left.localeCompare(right)).map(([key,item])=>`${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  return JSON.stringify(value)??"undefined";
}
function facetRevision(compiled:ReturnType<typeof compileLayeredSchema>):number{let hash=2166136261;for(const character of stableJson(compiled)){hash^=character.charCodeAt(0);hash=Math.imul(hash,16777619);}return(hash>>>0)||1;}
function revisionIdentity(revision:number):string{return`flow-schema:${revision.toString(16).padStart(8,"0")}`;}
function relationshipKind(relationship:Record<string,unknown>):FlowRelationshipKind{return relationship.kind as FlowRelationshipKind;}

export function liveFlowChoices(activeProjectId:string|undefined,projects:readonly ProjectState[]):{flows:LiveFlowChoice[];recovery:string[]}{
  if(!activeProjectId)return{flows:[],recovery:["Open project","Create project"]};const active=projects.find(({project})=>project.id===activeProjectId);return{flows:(active?.project.collections.flows??[]).map(({id,name})=>({id,name})),recovery:[]};
}
export function createLiveFlowTest(id:string,projectId:string):LiveFlowTestRun{return{id,projectId,startChoices:[],history:[],matchedEventIds:[]};}
export function selectLiveFlow(run:LiveFlowTestRun,state:ProjectState,flowId:string):LiveFlowTestRun{
  if(state.project.id!==run.projectId)throw new Error("Flow test project context changed.");const flow=state.project.collections.flows.find(({id})=>id===flowId);if(!flow)throw new Error("The selected Flow is unavailable in the active project.");const current=graph(state,flowId),incoming=new Set(current.relationships.map((relationship)=>relationship.targetEndpoint?.id).filter((id):id is string=>Boolean(id)));
  const startChoices=current.pageFrames.map((frame)=>{const page=state.project.collections.pages.find(({id})=>id===frame.pageId),lane=state.project.collections.pageGroups.find(({id})=>id===frame.pageGroupId)?.name??(frame.freePageRegion==="before-lanes"?"Before lanes":frame.freePageRegion==="after-lanes"?"After lanes":"Free");return{id:frame.id,name:page?.name??frame.id,kind:"Page" as const,pageId:frame.pageId,lane,stableFrameId:frame.id,recommended:!incoming.has(frame.id)};});
  return{...run,flowId,flowName:flow.name,startChoices,currentStepId:undefined,incomingRelationshipId:undefined,history:[],matchedEventIds:[],startedAt:undefined};
}
export function startLiveFlowPath(run:LiveFlowTestRun,pageFrameId:string):LiveFlowTestRun{if(!run.startChoices.some(({id})=>id===pageFrameId))throw new Error("A Flow test must start with a listed Page frame.");return{...run,currentStepId:pageFrameId,startedAt:undefined};}
export function liveFlowAwaitingObservation(run:LiveFlowTestRun):boolean{return Boolean(run.currentStepId)&&(run.history.length===0||run.incomingRelationshipId!==undefined);}
export function liveFlowNextSteps(run:LiveFlowTestRun,state:ProjectState):LiveFlowNextStep[]{
  assertRunProject(run,state);if(!run.flowId||!run.currentStepId||liveFlowAwaitingObservation(run)||run.history.at(-1)?.stepId!==run.currentStepId)return[];const source=step(state,run.flowId,run.currentStepId);
  return graph(state,run.flowId).relationships.filter((relationship)=>relationship.sourceEndpoint?.id===run.currentStepId&&Boolean(relationship.targetEndpoint?.id)).map((relationship)=>{const target=step(state,run.flowId!,relationship.targetEndpoint!.id),label=typeof relationship.label==="string"?relationship.label.trim():"",displayName=label||`${source.name} to ${target.name}`;return{id:target.id,name:target.name,stepKind:target.kind,kind:relationshipKind(relationship as unknown as Record<string,unknown>),relationshipId:relationship.id,displayName};});
}
export function liveFlowGraphNodes(run:LiveFlowTestRun,state:ProjectState):LiveFlowGraphNode[]{
  assertRunProject(run,state);if(!run.flowId||!run.currentStepId)return[];const current=graphs(state)[run.flowId],nextById=new Map(liveFlowNextSteps(run,state).map((next)=>[next.id,next])),nodes=[...(current?.pageFrames??[]).map((entity)=>step(state,run.flowId!,entity.id)),...(current?.occurrences??[]).map((entity)=>step(state,run.flowId!,entity.id))];
  return nodes.map(({id,name,kind:stepKind})=>{const next=nextById.get(id);if(next)return{id,name,stepKind,enabled:true,reason:`Connected by ${next.kind}`,next};return{id,name,stepKind,enabled:false,reason:id===run.currentStepId?"Current graph step":"No relationship from current step"};});
}
export function selectLiveFlowStep(run:LiveFlowTestRun,state:ProjectState,stepId:string):LiveFlowTestRun{const offered=liveFlowNextSteps(run,state).find(({id})=>id===stepId);if(!offered)throw new Error("No relationship from current step.");return{...run,currentStepId:stepId,incomingRelationshipId:offered.relationshipId};}

function compatibility(state:ProjectState,flowId:string,stepId:string,event:LiveFlowEvent):{compatible:boolean;evidence:string;reason:string}{
  const selected=step(state,flowId,stepId);if(selected.kind==="Event"){const eventEntity=state.project.collections.events.find(({id})=>id===selected.entity.eventId),expected=String(eventEntity?.eventName??eventEntity?.name??selected.name),expectedSource=typeof eventEntity?.sourceId==="string"?eventEntity.sourceId:undefined,evidence=`Event identity ${event.name} · observation source ${event.sourceName??event.sourceId}`;if(event.name!==expected)return{compatible:false,evidence,reason:`Event identity does not match ${expected}`};if(expectedSource&&event.sourceId!==expectedSource)return{compatible:false,evidence,reason:`Observation source does not match ${expectedSource}`};return{compatible:true,evidence,reason:"Eligible Event identity and observation source"};}
  const page=state.project.collections.pages.find(({id})=>id===selected.entity.pageId),pathname=String(page?.pathname??"");const observed=event.pageUrl?new URL(event.pageUrl,"https://flow.invalid").pathname:"";return !pathname||pathname===observed?{compatible:true,evidence:`Observed Page context ${observed||"available"}`,reason:"Eligible observed Page context"}:{compatible:false,evidence:`Observed Page context ${observed||"unavailable"}`,reason:`Page context does not match ${pathname}`};
}
export function liveFlowCandidateEvents(run:LiveFlowTestRun,state:ProjectState,events:readonly LiveFlowEvent[]):LiveFlowCandidate[]{
  assertRunProject(run,state);if(!run.flowId||!run.currentStepId||!liveFlowAwaitingObservation(run))return[];const prior=run.history.at(-1)?.captureTime,matched=new Set(run.matchedEventIds);return events.map((event)=>{const match=compatibility(state,run.flowId!,run.currentStepId!,event);let eligible=true,reason=match.reason;if(matched.has(event.id)){eligible=false;reason="Already matched in this run";}else if(prior&&!capturedAfter(event.captureTime,prior)){eligible=false;reason="Captured before the previous match";}else if(!match.compatible)eligible=false;return{eventId:event.id,name:event.name,captureTime:event.captureTime,eligible,selected:false,reason,evidence:match.evidence};});
}
export function matchLiveFlowEvent(run:LiveFlowTestRun,state:ProjectState,events:readonly LiveFlowEvent[],eventId:string):LiveFlowTestRun{
  assertRunProject(run,state);if(!run.flowId||!run.flowName||!run.currentStepId||!liveFlowAwaitingObservation(run))throw new Error("Select a Flow graph step before matching an observed event.");const candidate=liveFlowCandidateEvents(run,state,events).find((item)=>item.eventId===eventId),event=events.find(({id})=>id===eventId);if(!candidate?.eligible||!event)throw new Error(candidate?.reason??"Observed event is unavailable.");const selected=step(state,run.flowId,run.currentStepId),path=layeredContributorPath(state,selected.entity,selected.scope,run.flowId),contributors=layeredContributorsForPath(state,path,payload(event)),compiled=compileLayeredSchema(contributors,{eventId:String(selected.entity.eventId??event.name),eventRole:selected.kind==="Event"?"interaction":"context",...(selected.kind==="Event"?{occurrenceId:selected.id}:{})}),effectiveRevision=facetRevision(compiled),validation=validateLayeredObservation({targetId:selected.id,targetName:selected.name,revision:effectiveRevision,compiled},payload(event)),pathEntry:LiveFlowMatchedPathEntry={stepId:selected.id,stepName:selected.name,...(run.incomingRelationshipId?{relationshipId:run.incomingRelationshipId}:{}),eventId:event.id,captureTime:event.captureTime},matchedPath=[...run.history.map(({stepId,stepName,relationshipId,eventId,captureTime})=>({stepId,stepName,...(relationshipId?{relationshipId}:{}),eventId,captureTime})),pathEntry],entry:LiveFlowHistoryEntry={projectId:run.projectId,flowId:run.flowId,flowName:run.flowName,stepId:selected.id,stepKind:selected.kind,stepName:selected.name,eventId:event.id,captureTime:event.captureTime,selectionMode:"Manual Flow test",...(run.incomingRelationshipId?{relationshipId:run.incomingRelationshipId}:{}),effectiveSchemaRevision:validation.effectiveSchemaRevision,effectiveSchemaRevisionIdentity:revisionIdentity(effectiveRevision),issues:validation.issues,provenance:clone(validation.provenance),target:{id:selected.id,name:selected.name},status:validation.issues.length?"Invalid":"Valid",matchedPath};return{...run,history:[...run.history,entry],matchedEventIds:[...run.matchedEventIds,event.id],incomingRelationshipId:undefined,startedAt:run.startedAt??event.captureTime};
}
export function attachLiveFlowDefect(run:LiveFlowTestRun,stepId:string,defectId:string,eventId?:string):LiveFlowTestRun{return{...run,history:run.history.map((entry)=>entry.stepId===stepId&&(!eventId||entry.eventId===eventId)?{...entry,defectId}:entry)};}
export function completeLiveFlowTest(run:LiveFlowTestRun,state:ProjectState,endedAt:string):CompletedLiveFlowTest{assertRunProject(run,state);if(!run.flowId||!run.flowName||!run.history.length||liveFlowAwaitingObservation(run))throw new Error("Match the selected Flow step before completing its selected path.");const traversed=new Set(run.history.map(({relationshipId})=>relationshipId).filter(Boolean)),visited=new Set(run.history.map(({stepId})=>stepId)),unchosenAlternatives=graph(state,run.flowId).relationships.filter(({id,sourceEndpoint,targetEndpoint})=>Boolean(sourceEndpoint&&targetEndpoint)&&visited.has(sourceEndpoint!.id)&&!traversed.has(id)).map(({id,targetEndpoint})=>({relationshipId:id,stepId:targetEndpoint!.id,status:"Not tested" as const}));return{runId:run.id,projectId:run.projectId,flowId:run.flowId,flowName:run.flowName,label:"Completed selected path",endedAt,history:clone(run.history),unchosenAlternatives,resumeMatching:false};}
export function serializeLiveFlowSummary(summary:CompletedLiveFlowTest):string{return JSON.stringify(summary);}
export function restoreLiveFlowSummary(serialized:string):CompletedLiveFlowTest|undefined{try{const value=JSON.parse(serialized) as CompletedLiveFlowTest;return value?.label==="Completed selected path"&&Array.isArray(value.history)?clone(value):undefined;}catch{return;}}
