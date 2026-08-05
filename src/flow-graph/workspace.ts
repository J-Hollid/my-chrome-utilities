import type {FlowPortSide} from "../data-layer-flow-graph.js";

export const FLOW_MANUAL_ZOOM={minimum:.25,maximum:2} as const;
export type FlowWorkspaceSurface="add"|"outline"|"details"|"tidy";
export interface FlowCamera{x:number;y:number;zoom:number}
export interface FlowWorkspaceView{camera:FlowCamera;surface:FlowWorkspaceSurface|undefined;minimap:boolean;focusCanvas:boolean}
export interface FlowPoint{x:number;y:number}
export interface FlowBounds extends FlowPoint{width:number;height:number}
export interface FlowSurfacePlacement{left:number;top:number;width:number;maxHeight:number}

export function flowWorkspaceKey(projectId:string,flowId:string):string{return `${projectId}\u0000${flowId}`;}

export function initialFlowWorkspaceView():FlowWorkspaceView{return{camera:{x:0,y:0,zoom:1},surface:undefined,minimap:false,focusCanvas:false};}
export function openFlowSurface(view:FlowWorkspaceView,surface:FlowWorkspaceSurface):FlowWorkspaceView{return{...view,surface};}
export function closeFlowSurface(view:FlowWorkspaceView):FlowWorkspaceView{return{...view,surface:undefined};}
export function flowDetailLevel(zoom:number):"identity"|"events"{return zoom<.5?"identity":"events";}

const rounded=(value:number)=>Math.round(value*100)/100;
export function zoomFlowCamera(camera:FlowCamera,factor:number,anchor:FlowPoint):FlowCamera{
  const zoom=rounded(Math.min(FLOW_MANUAL_ZOOM.maximum,Math.max(FLOW_MANUAL_ZOOM.minimum,camera.zoom*factor))),world={x:camera.x+anchor.x/camera.zoom,y:camera.y+anchor.y/camera.zoom};
  return{x:rounded(world.x-anchor.x/zoom),y:rounded(world.y-anchor.y/zoom),zoom};
}

export function panFlowCamera(camera:FlowCamera,screenDelta:FlowPoint):FlowCamera{return{x:rounded(camera.x-screenDelta.x/camera.zoom),y:rounded(camera.y-screenDelta.y/camera.zoom),zoom:camera.zoom};}

export function clientPointToFlowPoint(rect:{left:number;top:number;width:number;height:number},camera:FlowCamera,client:FlowPoint):FlowPoint{
  return{x:rounded(camera.x+(client.x-rect.left)/camera.zoom),y:rounded(camera.y+(client.y-rect.top)/camera.zoom)};
}

export function fitFlowBounds(bounds:FlowBounds,viewport:{width:number;height:number},padding=24):FlowCamera{
  const width=Math.max(1,bounds.width+padding*2),height=Math.max(1,bounds.height+padding*2),scale=Math.min(1,viewport.width/width,viewport.height/height),zoom=rounded(scale)||scale;
  return{x:bounds.x-padding,y:bounds.y-padding,zoom};
}

export function placeFlowSurface(viewport:{width:number;height:number},requested?:FlowPoint):FlowSurfacePlacement{
  const margin=6,width=Math.min(380,Math.max(280,viewport.width-margin*2));
  const left=requested?Math.max(margin,Math.min(viewport.width-width-margin,requested.x)):Math.max(margin,viewport.width-width-margin);
  const requestedTop=requested?.y??margin,availableBelow=viewport.height-requestedTop-margin;
  const top=availableBelow>=180?Math.max(margin,requestedTop):margin;
  return{left,top,width,maxHeight:Math.max(1,viewport.height-top-margin)};
}

export function cameraFromMinimapPoint(bounds:FlowBounds,viewport:{width:number;height:number},point:{x:number;y:number},zoom:number):FlowCamera{
  const center={x:bounds.x+bounds.width*Math.min(1,Math.max(0,point.x)),y:bounds.y+bounds.height*Math.min(1,Math.max(0,point.y))};
  return{x:rounded(center.x-viewport.width/(zoom*2)),y:rounded(center.y-viewport.height/(zoom*2)),zoom:rounded(zoom)};
}

export function sectionBoundsFromDrag(start:FlowPoint,end:FlowPoint,minimum=40):FlowBounds{
  const x=Math.min(start.x,end.x),y=Math.min(start.y,end.y);
  return{x:rounded(x),y:rounded(y),width:rounded(Math.max(minimum,Math.abs(end.x-start.x))),height:rounded(Math.max(minimum,Math.abs(end.y-start.y)))};
}

export function boundsAroundItems(items:readonly FlowBounds[],padding=24):FlowBounds{
  if(!items.length)return{x:0,y:0,width:padding*2,height:padding*2};
  const left=Math.min(...items.map(({x})=>x)),top=Math.min(...items.map(({y})=>y)),right=Math.max(...items.map(({x,width})=>x+width)),bottom=Math.max(...items.map(({y,height})=>y+height));
  return{x:rounded(left-padding),y:rounded(top-padding),width:rounded(right-left+padding*2),height:rounded(bottom-top+padding*2)};
}

export function transformedFlowBounds(bounds:FlowBounds,transform:{translateX:number;translateY:number;scaleX?:number;scaleY?:number}):FlowBounds{
  const scaleX=transform.scaleX??1,scaleY=transform.scaleY??1;
  return{x:rounded(bounds.x*scaleX+transform.translateX),y:rounded(bounds.y*scaleY+transform.translateY),width:rounded(bounds.width*Math.abs(scaleX)),height:rounded(bounds.height*Math.abs(scaleY))};
}

export function relationshipDropTarget(sourcePort:FlowPortSide,position:FlowPoint):{position:FlowPoint;targetPort:FlowPortSide;kind:"expected_next"|"alternative"|"merge"}|undefined{
  if(sourcePort==="right")return{position,targetPort:"left",kind:"expected_next"};
  if(sourcePort==="top")return{position,targetPort:"bottom",kind:"alternative"};
  if(sourcePort==="bottom")return{position,targetPort:"top",kind:"merge"};
  return undefined;
}

export function tidyFlowItems<T extends {id:string;position:FlowPoint}>(items:readonly T[],direction:"horizontal"|"vertical",origin:{x:number;y:number;gap:number}):{id:string;position:FlowPoint}[]{
  const ordered=[...items].sort((left,right)=>direction==="horizontal"?left.position.x-right.position.x||left.position.y-right.position.y||left.id.localeCompare(right.id):left.position.y-right.position.y||left.position.x-right.position.x||left.id.localeCompare(right.id));
  return ordered.map(({id},index)=>({id,position:{x:origin.x+(direction==="horizontal"?origin.gap*index:0),y:origin.y+(direction==="vertical"?origin.gap*index:0)}}));
}
