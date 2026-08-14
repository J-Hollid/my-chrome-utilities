import type {FlowBounds,FlowPoint} from "./workspace.js";

export function flowPointerDelta(start:FlowPoint,current:FlowPoint,zoom:number):FlowPoint{
  return{x:(current.x-start.x)/zoom,y:(current.y-start.y)/zoom};
}

export function flowBoundsContains(outer:FlowBounds,inner:FlowBounds):boolean{
  return inner.x>=outer.x&&inner.y>=outer.y&&
    inner.x+inner.width<=outer.x+outer.width&&inner.y+inner.height<=outer.y+outer.height;
}
