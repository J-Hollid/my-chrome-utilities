import {
  resolveApplicability,
  type FlowInstance,
  type ProjectState,
  type SpecificationProject,
} from "./data-layer-specification-project.js";
import {compileSpecificationProject,createCanonicalProjectEnvelope,evaluateSpecificationObservation,type SpecificationEvaluationResult} from "./data-layer-specification-engine.js";

export const SPECIFICATION_PROJECT_STORAGE_KEY="my-chrome-utilities.specification-project.v1";
export const FLOW_INSTANCES_STORAGE_KEY="my-chrome-utilities.flow-instances.v1";
export const FLOW_ROUTING_STORAGE_KEY="my-chrome-utilities.flow-routing.v1";

export interface SpecificationRuntimeStorage { getItem(key:string):string|null;setItem(key:string,value:string):void; }
export interface SpecificationRuntimeObservation { sessionId:string;correlationKey?:string;observedAt?:string;pageUrl?:string;sourceId?:string;eventName?:string;payload?:unknown; }
export interface SpecificationRuntimeResult { instances:FlowInstance[];active?:FlowInstance;applicability?:ReturnType<typeof resolveApplicability>;evaluation?:SpecificationEvaluationResult;ambiguity?:{instanceIds:string[];reason:string}; }

function restoreProject(storage:SpecificationRuntimeStorage):SpecificationProject|undefined{
  const serialized=storage.getItem(SPECIFICATION_PROJECT_STORAGE_KEY);if(!serialized)return undefined;
  try{const parsed=JSON.parse(serialized) as ProjectState|{project?:SpecificationProject};return parsed.project;}catch{return undefined;}
}
function restoreInstances(storage:SpecificationRuntimeStorage):FlowInstance[]{const serialized=storage.getItem(FLOW_INSTANCES_STORAGE_KEY);if(!serialized)return[];try{const value=JSON.parse(serialized);return Array.isArray(value)?value:[];}catch{return[];}}
function eventId(project:SpecificationProject,observation:SpecificationRuntimeObservation):string|undefined{const observed=observation.eventName?.trim();if(!observed)return undefined;const normalized=observed.toLowerCase();return project.collections.events.find((event)=>event.id===observed||String(event.eventName??"").toLowerCase()===normalized||event.name.toLowerCase()===normalized)?.id;}
function pageId(project:SpecificationProject,pageUrl:string|undefined):string|undefined{if(!pageUrl)return undefined;let url:URL;try{url=new URL(pageUrl);}catch{return undefined;}return project.collections.pages.find((page)=>page.url===pageUrl||page.pathname===url.pathname||page.path===url.pathname)?.id;}
export function recordSpecificationRuntimeObservation(storage:SpecificationRuntimeStorage,observation:SpecificationRuntimeObservation):SpecificationRuntimeResult{
  const project=restoreProject(storage);if(!project)return{instances:restoreInstances(storage)};
  const observedEventId=eventId(project,observation),observedPageId=pageId(project,observation.pageUrl);
  const prior=restoreInstances(storage),payload=observation.payload&&typeof observation.payload==="object"?observation.payload as Record<string,unknown>:{},url=observation.pageUrl?new URL(observation.pageUrl,globalThis.location?.href):undefined,compiled=compileSpecificationProject(createCanonicalProjectEnvelope(project,"runtime"));if(compiled.status==="blocked")return{instances:prior};const evaluation=evaluateSpecificationObservation(compiled.plan,{...observation,...payload,payload:observation.payload??{},pathname:url?.pathname??"",...(observedEventId?{eventId:observedEventId}:{}),...(observedPageId?{pageId:observedPageId}:{})},prior),transition=evaluation.stateTransition!,instances=transition.instances;storage.setItem(FLOW_INSTANCES_STORAGE_KEY,JSON.stringify(instances));
  const active=transition.active,ambiguity=transition.ambiguity,applicability={candidates:evaluation.candidates.map((candidate)=>({id:candidate.assignmentId,name:candidate.assignmentId,matched:candidate.rejectionReasons.length===0,priority:candidate.priority,evidence:candidate.rejectionReasons.join("; ")||"All configured predicates matched"})),...(evaluation.winner?{winner:{id:evaluation.winner.assignmentId,name:evaluation.winner.assignmentId}}:{}),ties:evaluation.ties.map((id)=>({id,name:id}))},priorRouting=storage.getItem(FLOW_ROUTING_STORAGE_KEY);let routing:unknown[]=[];try{const parsed=JSON.parse(priorRouting??"[]");if(Array.isArray(parsed))routing=parsed;}catch{/* replace invalid evidence */}routing.push({sessionId:observation.sessionId,sourceId:observation.sourceId,eventId:observedEventId,...(active?{instanceId:active.id,flowId:active.flowId,stepId:active.currentStepId}:{}),pageUrl:observation.pageUrl,eventName:observation.eventName,winner:evaluation.winner,ties:evaluation.ties,candidates:evaluation.candidates,...(ambiguity?{ambiguity}:{})});storage.setItem(FLOW_ROUTING_STORAGE_KEY,JSON.stringify(routing));
  return{instances,...(active?{active}:{}),applicability,evaluation,...(ambiguity?{ambiguity}:{})};
}

export function recordSpecificationCapture(storage:SpecificationRuntimeStorage,input:{sessionId:string;correlationKey?:string;observedAt?:string;pageUrl:string;sourceId:string;rawValue:unknown}):SpecificationRuntimeResult{const raw=input.rawValue&&typeof input.rawValue==="object"?input.rawValue as Record<string,unknown>:{};const eventName=typeof raw.event==="string"?raw.event:typeof raw.eventName==="string"?raw.eventName:undefined;return recordSpecificationRuntimeObservation(storage,{...input,...(eventName?{eventName}:{}),payload:raw});}
export function recordSpecificationNavigation(storage:SpecificationRuntimeStorage,input:{sessionId:string;pageUrl:string}):SpecificationRuntimeResult{return recordSpecificationRuntimeObservation(storage,input);}
