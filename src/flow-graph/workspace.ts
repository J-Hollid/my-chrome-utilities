import type {FlowPortSide} from "../data-layer-flow-graph.js";

export const FLOW_MANUAL_ZOOM={minimum:.25,maximum:2} as const;
export type FlowWorkspaceSurface="add"|"outline"|"details"|"tidy";
export interface FlowCamera{x:number;y:number;zoom:number}
export interface FlowWorkspaceView{camera:FlowCamera;surface:FlowWorkspaceSurface|undefined;minimap:boolean;focusCanvas:boolean}
export interface FlowPoint{x:number;y:number}
export interface FlowBounds extends FlowPoint{width:number;height:number}

export function initialFlowWorkspaceView():FlowWorkspaceView{return{camera:{x:0,y:0,zoom:1},surface:undefined,minimap:false,focusCanvas:false};}
export function openFlowSurface(view:FlowWorkspaceView,surface:FlowWorkspaceSurface):FlowWorkspaceView{return{...view,surface};}
export function closeFlowSurface(view:FlowWorkspaceView):FlowWorkspaceView{return{...view,surface:undefined};}
export function flowDetailLevel(zoom:number):"identity"|"events"{return zoom<.5?"identity":"events";}

const rounded=(value:number)=>Math.round(value*100)/100;
export function zoomFlowCamera(camera:FlowCamera,factor:number,anchor:FlowPoint):FlowCamera{
  const zoom=Math.min(FLOW_MANUAL_ZOOM.maximum,Math.max(FLOW_MANUAL_ZOOM.minimum,camera.zoom*factor)),world={x:camera.x+anchor.x/camera.zoom,y:camera.y+anchor.y/camera.zoom};
  return{x:rounded(world.x-anchor.x/zoom),y:rounded(world.y-anchor.y/zoom),zoom:rounded(zoom)};
}

export function fitFlowBounds(bounds:FlowBounds,viewport:{width:number;height:number},padding=24):FlowCamera{
  const width=Math.max(1,bounds.width+padding*2),height=Math.max(1,bounds.height+padding*2),zoom=rounded(Math.min(1,viewport.width/width,viewport.height/height));
  return{x:bounds.x-padding,y:bounds.y-padding,zoom};
}

export function relationshipDropTarget(sourcePort:FlowPortSide,position:FlowPoint):{position:FlowPoint;targetPort:FlowPortSide;kind:"expected_next"|"alternative"|"merge"}|undefined{
  if(sourcePort==="right")return{position,targetPort:"left",kind:"expected_next"};
  if(sourcePort==="top")return{position,targetPort:"bottom",kind:"alternative"};
  if(sourcePort==="bottom")return{position,targetPort:"top",kind:"merge"};
  return undefined;
}

export function tidyFlowItems<T extends {id:string;position:FlowPoint}>(items:readonly T[],direction:"horizontal"|"vertical",origin:{x:number;y:number;gap:number}):{id:string;position:FlowPoint}[]{
  return items.map(({id},index)=>({id,position:{x:origin.x+(direction==="horizontal"?origin.gap*index:0),y:origin.y+(direction==="vertical"?origin.gap*index:0)}}));
}
