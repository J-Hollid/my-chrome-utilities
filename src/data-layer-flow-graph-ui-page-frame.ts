import type {DocumentaryFlowGraph,DocumentaryPageFrameRecord} from "./data-layer-flow-graph.js";
import type {ProjectEntity,ProjectState} from "./utilities/data-layer/schemas.js";

type SelectedPageFrame={kind:"page-frame";id:string};

export interface FlowPageFrameCardContext {
  card:HTMLElement;
  title:HTMLButtonElement;
  state:ProjectState;
  flow:ProjectEntity;
  graph:DocumentaryFlowGraph;
  frame:DocumentaryPageFrameRecord;
  entityName:(entities:readonly ProjectEntity[],id:unknown,fallback?:string)=>string;
  pageExampleDetails:(state:ProjectState,flowId:string,frameId:string,label:string)=>HTMLElement;
  saveSelection:(value:SelectedPageFrame)=>void;
  openOccurrenceSchema?:(occurrenceId:string,path?:string,originFocus?:HTMLElement)=>boolean;
  persist:(next:ProjectState)=>void;
  duplicatePageFrame:(next:ProjectState,flowId:string,frameId:string)=>ProjectState;
  removePageFrame:(next:ProjectState,flowId:string,frameId:string)=>ProjectState;
}

const button=(text:string,action:()=>void):HTMLButtonElement=>{const control=document.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",action);return control;};

/** Render the semantic actions shared by every Page-frame card. */
export function appendFlowPageFrameCardControls(context:FlowPageFrameCardContext):void {
  const {card,title,state,flow,graph,frame}=context;
  card.append(title);
  const open=button("Open schema contribution",()=>{const originFocus=document.activeElement instanceof HTMLElement?document.activeElement:open;context.saveSelection({kind:"page-frame",id:frame.id});context.openOccurrenceSchema?.(frame.id,undefined,originFocus);});
  open.dataset.flowSchemaContribution="true";
  card.append(context.pageExampleDetails(state,flow.id,frame.id,context.entityName(state.project.collections.pages,frame.pageId)),open,button("Duplicate Page frame",()=>context.persist(context.duplicatePageFrame(state,flow.id,frame.id))),button("Remove Page frame",()=>context.persist(context.removePageFrame(state,flow.id,frame.id))));
}
