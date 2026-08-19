export interface ReorderableItem {
  id:string;
  label?:string;
}

export type ReorderActionId="first"|"earlier"|"later"|"last"|"move";

export interface ReorderAction {
  id:ReorderActionId;
  label:string;
  disabled:boolean;
}

export interface ReorderDestination {
  itemId:string;
  label:string;
}

export interface ReorderControlModelInput<T extends ReorderableItem> {
  itemId:string;
  itemLabel:string;
  completeOrder:readonly T[];
  legalDestinationIds?:readonly string[];
  filterActive?:boolean;
  scopeLabel?:string;
}

export interface ReorderControlModel {
  accessibleName:string;
  position:number;
  count:number;
  canDrag:boolean;
  actions:ReorderAction[];
  destinations:ReorderDestination[];
  guidance?:string;
}

const action=(id:ReorderActionId,label:string,disabled:boolean):ReorderAction=>({id,label,disabled});

export function reorderControlModel<T extends ReorderableItem>(input:ReorderControlModelInput<T>):ReorderControlModel {
  const position=input.completeOrder.findIndex(({id})=>id===input.itemId);
  if(position<0)throw new Error(`Unknown reorder item ${input.itemId}.`);
  const legalIds=new Set(input.legalDestinationIds??input.completeOrder.map(({id})=>id));
  legalIds.add(input.itemId);
  const legalOrder=input.completeOrder.filter(({id})=>legalIds.has(id));
  const legalPosition=legalOrder.findIndex(({id})=>id===input.itemId);
  const first=legalPosition<=0,last=legalPosition===legalOrder.length-1;
  return{
    accessibleName:`Reorder ${input.itemLabel}, position ${position+1} of ${input.completeOrder.length}`,
    position:position+1,
    count:input.completeOrder.length,
    canDrag:!input.filterActive,
    actions:[
      action("first","Move to first",first),
      action("earlier","Move one position earlier",first),
      action("later","Move one position later",last),
      action("last","Move to last",last),
      action("move","Move…",legalOrder.length<=1),
    ],
    destinations:legalOrder.filter(({id})=>id!==input.itemId)
      .map(({id,label})=>({itemId:id,label:label??id})),
    ...(input.scopeLabel?{guidance:`Reordering stays within ${input.scopeLabel}.`}:{}),
  };
}

export function reorderItems<T extends ReorderableItem>(items:readonly T[],itemId:string,toIndex:number):T[] {
  const from=items.findIndex(({id})=>id===itemId);
  if(from<0)return[...items];
  const target=Math.max(0,Math.min(items.length-1,toIndex));
  if(target===from)return[...items];
  const next=[...items],moved=next.splice(from,1)[0]!;
  next.splice(target,0,moved);
  return next;
}

export function reorderValues<T>(values:readonly T[],itemId:string,toIndex:number,idOf:(value:T,index:number)=>string):T[] {
  const wrapped=values.map((value,index)=>({id:idOf(value,index),value}));
  return reorderItems(wrapped,itemId,toIndex).map(({value})=>value);
}

export function reorderPlacementIndex<T extends ReorderableItem>(
  items:readonly T[],itemId:string,destinationId:string,placement:"before"|"after",
):number {
  const from=items.findIndex(({id})=>id===itemId),destination=items.findIndex(({id})=>id===destinationId);
  if(from<0||destination<0||from===destination)return Math.max(0,from);
  const without=items.filter(({id})=>id!==itemId),adjusted=without.findIndex(({id})=>id===destinationId);
  return adjusted+(placement==="after"?1:0);
}
