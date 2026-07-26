import {
  transactProject,
  type ProjectEventTransportSettings,
  type ProjectState,
  type SpecificationProject,
} from "./data-layer-specification-project.js";

export const defaultProjectEventTransport:ProjectEventTransportSettings={
  observationHistoryPath:"queue.history",
  defaultPushPath:"dataLayer",
};

export interface ProjectObservationResult {
  status:"Observation ready"|"Waiting for observation path";
  entries:unknown[];
}

export interface ProjectPushResult {
  status:string;
  destination:string;
  pushed:boolean;
}

type PageObject=Record<string,unknown>;

const clone=<T>(value:T):T=>structuredClone(value);
const unsafeSegments=new Set(["__proto__","prototype","constructor"]);

function pathSegments(path:string):string[] {
  const segments=path.trim().split(".");
  return segments.length&&segments.every((segment)=>segment&&!unsafeSegments.has(segment))
    ? segments
    : [];
}

function valueAtPath(root:PageObject,path:string):unknown {
  const segments=pathSegments(path);
  if(!segments.length)return undefined;
  let value:unknown=root;
  for(const segment of segments){
    if(!value||typeof value!=="object"||!Object.hasOwn(value,segment))return undefined;
    value=(value as Record<string,unknown>)[segment];
  }
  return value;
}

export function projectEventTransport(
  project:SpecificationProject,
):ProjectEventTransportSettings {
  return clone(project.eventTransport??defaultProjectEventTransport);
}

export function configureProjectEventTransport(
  state:ProjectState,
  settings:ProjectEventTransportSettings,
):ProjectState {
  const eventTransport={
    observationHistoryPath:settings.observationHistoryPath.trim(),
    defaultPushPath:settings.defaultPushPath.trim(),
  };
  return transactProject(state,"Save project event transport settings",(project)=>({
    ...project,
    eventTransport,
  }));
}

export function seedLibraryDestination(
  project:SpecificationProject|undefined,
):string {
  return project?projectEventTransport(project).defaultPushPath:"";
}

export function observeProjectHistory(
  project:SpecificationProject|undefined,
  page:PageObject,
):ProjectObservationResult {
  if(!project)return{status:"Waiting for observation path",entries:[]};
  const path=projectEventTransport(project).observationHistoryPath;
  const value=valueAtPath(page,path);
  return Array.isArray(value)
    ? {status:"Observation ready",entries:clone(value)}
    : {status:"Waiting for observation path",entries:[]};
}

export function pushProjectEvent(
  project:SpecificationProject|undefined,
  page:PageObject,
  eventName:string,
  payload:unknown,
  destination=project?projectEventTransport(project).defaultPushPath:"",
):ProjectPushResult {
  if(!destination)return{status:"Open a project or enter a Destination",destination,pushed:false};
  const target=valueAtPath(page,destination) as {push?:(value:unknown)=>unknown}|undefined;
  if(!target||typeof target.push!=="function"){
    return{status:"Push path is not push-capable",destination,pushed:false};
  }
  target.push([eventName,clone(payload)]);
  return{status:`Pushed to ${destination}`,destination,pushed:true};
}
