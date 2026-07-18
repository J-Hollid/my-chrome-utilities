import {
  advanceFlowInstance,
  resolveApplicability,
  startFlowInstance,
  type FlowInstance,
  type ProjectEntity,
  type ProjectState,
  type SpecificationProject,
} from "./data-layer-specification-project.js";

export const SPECIFICATION_PROJECT_STORAGE_KEY="my-chrome-utilities.specification-project.v1";
export const FLOW_INSTANCES_STORAGE_KEY="my-chrome-utilities.flow-instances.v1";
export const FLOW_ROUTING_STORAGE_KEY="my-chrome-utilities.flow-routing.v1";

export interface SpecificationRuntimeStorage { getItem(key:string):string|null;setItem(key:string,value:string):void; }
export interface SpecificationRuntimeObservation { sessionId:string;pageUrl?:string;sourceId?:string;eventName?:string;payload?:unknown; }
export interface SpecificationRuntimeResult { instances:FlowInstance[];active?:FlowInstance;applicability?:ReturnType<typeof resolveApplicability>; }

function restoreProject(storage:SpecificationRuntimeStorage):SpecificationProject|undefined{
  const serialized=storage.getItem(SPECIFICATION_PROJECT_STORAGE_KEY);if(!serialized)return undefined;
  try{const parsed=JSON.parse(serialized) as ProjectState|{project?:SpecificationProject};return parsed.project;}catch{return undefined;}
}
function restoreInstances(storage:SpecificationRuntimeStorage):FlowInstance[]{const serialized=storage.getItem(FLOW_INSTANCES_STORAGE_KEY);if(!serialized)return[];try{const value=JSON.parse(serialized);return Array.isArray(value)?value:[];}catch{return[];}}
function eventId(project:SpecificationProject,observation:SpecificationRuntimeObservation):string|undefined{const observed=observation.eventName?.trim();if(!observed)return undefined;const normalized=observed.toLowerCase();return project.collections.events.find((event)=>event.id===observed||String(event.eventName??"").toLowerCase()===normalized||event.name.toLowerCase()===normalized)?.id;}
function pageId(project:SpecificationProject,pageUrl:string|undefined):string|undefined{if(!pageUrl)return undefined;let url:URL;try{url=new URL(pageUrl);}catch{return undefined;}return project.collections.pages.find((page)=>page.url===pageUrl||page.pathname===url.pathname||page.path===url.pathname)?.id;}
function firstStepMatches(flow:ProjectEntity,input:{eventId?:string;pageId?:string}):boolean{const step=((flow.steps as ProjectEntity[]|undefined)??[])[0];return Boolean(step&&(!step.eventId||step.eventId===input.eventId)&&(!step.pageId||step.pageId===input.pageId));}

export function recordSpecificationRuntimeObservation(storage:SpecificationRuntimeStorage,observation:SpecificationRuntimeObservation):SpecificationRuntimeResult{
  const project=restoreProject(storage);if(!project)return{instances:restoreInstances(storage)};
  const observedEventId=eventId(project,observation),observedPageId=pageId(project,observation.pageUrl);
  const input:{eventId?:string;pageId?:string}={...(observedEventId?{eventId:observedEventId}:{}),...(observedPageId?{pageId:observedPageId}:{})};
  const prior=restoreInstances(storage),others=prior.filter((instance)=>instance.sessionId!==observation.sessionId),session=prior.filter((instance)=>instance.sessionId===observation.sessionId&&instance.status==="active"),existingFlowIds=new Set(session.map(({flowId})=>flowId));
  const started=project.collections.flows.filter((flow)=>!existingFlowIds.has(flow.id)&&firstStepMatches(flow,input)).map((flow)=>startFlowInstance(project,flow.id,observation.sessionId));
  const advanced=[...session,...started].map((instance)=>advanceFlowInstance(project,instance,input));
  const changed=advanced.filter((instance,index)=>instance.history.length>([...session,...started][index]?.history.length??0));
  const instances=[...others,...advanced.filter((instance)=>instance.history.length>0)];storage.setItem(FLOW_INSTANCES_STORAGE_KEY,JSON.stringify(instances));
  const active=changed.length===1?changed[0]:undefined;if(!active)return{instances};
  const url=observation.pageUrl?new URL(observation.pageUrl,globalThis.location?.href):undefined;
  const applicability=resolveApplicability(project,{pathname:url?.pathname??"",eventName:observation.eventName??"",flowId:active.selector,payload:observation.payload??{}}),priorRouting=storage.getItem(FLOW_ROUTING_STORAGE_KEY);let routing:unknown[]=[];try{const parsed=JSON.parse(priorRouting??"[]");if(Array.isArray(parsed))routing=parsed;}catch{/* replace invalid evidence */}routing.push({sessionId:observation.sessionId,instanceId:active.id,flowId:active.selector,pageUrl:observation.pageUrl,eventName:observation.eventName,winner:applicability.winner,ties:applicability.ties});storage.setItem(FLOW_ROUTING_STORAGE_KEY,JSON.stringify(routing));
  return{instances,active,applicability};
}

export function recordSpecificationCapture(storage:SpecificationRuntimeStorage,input:{sessionId:string;pageUrl:string;sourceId:string;rawValue:unknown}):SpecificationRuntimeResult{const raw=input.rawValue&&typeof input.rawValue==="object"?input.rawValue as Record<string,unknown>:{};const eventName=typeof raw.event==="string"?raw.event:typeof raw.eventName==="string"?raw.eventName:undefined;return recordSpecificationRuntimeObservation(storage,{...input,...(eventName?{eventName}:{}),payload:raw});}
export function recordSpecificationNavigation(storage:SpecificationRuntimeStorage,input:{sessionId:string;pageUrl:string}):SpecificationRuntimeResult{return recordSpecificationRuntimeObservation(storage,input);}
