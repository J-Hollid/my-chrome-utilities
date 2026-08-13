import type {FlowPortSide} from "../data-layer-flow-graph.js";
import type {FlowPoint} from "./workspace.js";

export interface FlowPortSnapCandidate{endpointId:string;port:FlowPortSide;center:FlowPoint;presentationOrder:number}
export type FlowPointerDirectTarget=
  |{kind:"port";endpointId:string;port:FlowPortSide}
  |{kind:"page";endpointId:string}
  |{kind:"event";endpointId:string};

export const FLOW_PORT_SNAP_RADIUS=24;

export function flowPortSnapTarget<T extends FlowPortSnapCandidate>(point:FlowPoint,candidates:readonly T[]):T|undefined{
  const radiusSquared=FLOW_PORT_SNAP_RADIUS*FLOW_PORT_SNAP_RADIUS;
  return candidates.reduce<T|undefined>((nearest,candidate)=>{
    const distanceSquared=(candidate.center.x-point.x)**2+(candidate.center.y-point.y)**2;
    if(distanceSquared>radiusSquared+1e-9)return nearest;
    if(!nearest)return candidate;
    const nearestDistanceSquared=(nearest.center.x-point.x)**2+(nearest.center.y-point.y)**2;
    return distanceSquared<nearestDistanceSquared||distanceSquared===nearestDistanceSquared&&candidate.presentationOrder>nearest.presentationOrder?candidate:nearest;
  },undefined);
}

export function flowPointerSnapTarget<T extends FlowPortSnapCandidate>({sourceId,compatibleSide,direct,snap}:{sourceId:string;compatibleSide:FlowPortSide|undefined;direct:FlowPointerDirectTarget|undefined;snap:T|undefined}):T|undefined{
  if(!compatibleSide||!snap)return undefined;
  if(!direct)return snap;
  if(direct.kind==="event"||direct.kind==="page"&&direct.endpointId===sourceId)return undefined;
  if(direct.kind==="port"&&direct.port!==compatibleSide)return undefined;
  return snap;
}
