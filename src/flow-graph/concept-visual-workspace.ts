import type {IdFactory,ProjectState,SpecificationProject} from "../data-layer-specification-project.js";
import {attachFlowConceptVisual,flowConceptVisual,removeFlowConceptVisual,type FlowConceptVisualTarget} from "./concept-visuals.js";
import {createFlowConceptVisualEditor,openFlowConceptVisualViewer,type FlowVisualDisplayMode} from "./concept-visual-ui.js";

interface VisualActionOptions{
  host:HTMLElement;
  project:()=>SpecificationProject;
  state:()=>ProjectState;
  flowId:string;
  target:FlowConceptVisualTarget;
  label:string;
  id:IdFactory;
  action:(label:string,invoke:()=>void)=>HTMLButtonElement;
  persist:(state:ProjectState,message:string)=>void;
}

export function createFlowConceptVisualActions(options:VisualActionOptions):HTMLButtonElement[]{
  const saved=flowConceptVisual(options.project(),options.flowId,options.target),close=()=>options.host.dispatchEvent(new CustomEvent("flow-close-item-editor",{bubbles:true})),openEditor=()=>{
    const editor=createFlowConceptVisualEditor({project:options.project,...(saved?{existing:{attachment:saved.attachment,raster:saved.asset}}:{}),save:(value)=>{const next=attachFlowConceptVisual(options.state(),options.flowId,options.target,value,options.id);close();options.persist(next,`Saved concept visual for ${options.label}; Undo available.`);},cancel:close});
    options.host.dispatchEvent(new CustomEvent("flow-open-item-editor",{bubbles:true,detail:{title:`${saved?"Edit":"Add"} visual for ${options.label}`,content:editor.root,firstControl:editor.firstControl}}));
  },view=()=>{const invoker=document.activeElement,selector=options.target.kind==="page-frame"?`g[data-page-frame-id="${CSS.escape(options.target.id)}"]:not([data-occurrence-id])`:`[data-occurrence-id="${CSS.escape(options.target.id)}"]`,fallback=document.querySelector<SVGElement>(selector);if(invoker instanceof HTMLElement)openFlowConceptVisualForTarget({project:options.project(),flowId:options.flowId,target:options.target,invoker,...(fallback?{fallbackInvoker:fallback}:{})});};
  if(!saved)return[options.action("Add visual",openEditor)];
  return[options.action("View visual",view),options.action("Edit visual",openEditor),options.action("Replace visual",openEditor),options.action("Remove visual",()=>options.persist(removeFlowConceptVisual(options.state(),options.flowId,options.target),`Removed concept visual from ${options.label}; Undo available.`))];
}

export function flowConceptVisualHeightExtension(project:SpecificationProject,flowId:string,target:FlowConceptVisualTarget,mode:FlowVisualDisplayMode,zoom:number):number{
  return mode==="Thumbnails"&&zoom>=.5&&Boolean(flowConceptVisual(project,flowId,target))?104:0;
}

export const FLOW_CONCEPT_VISUAL_ASPECT_RATIO=16/10;
const FLOW_CONCEPT_VISUAL_THUMBNAIL_HEIGHT=88;
export function flowConceptVisualThumbnailViewport(itemWidth:number):{x:number;width:number;height:number}{
  const height=FLOW_CONCEPT_VISUAL_THUMBNAIL_HEIGHT,width=height*FLOW_CONCEPT_VISUAL_ASPECT_RATIO;
  return{x:(itemWidth-width)/2,width,height};
}

type FlowConceptVisualInvoker=HTMLElement|SVGElement;
export function openFlowConceptVisualForTarget(options:{project:SpecificationProject;flowId:string;target:FlowConceptVisualTarget;invoker:FlowConceptVisualInvoker;fallbackInvoker?:FlowConceptVisualInvoker}):boolean{
  const visual=flowConceptVisual(options.project,options.flowId,options.target);if(!visual)return false;
  openFlowConceptVisualViewer({attachment:visual.attachment,raster:visual.asset},options.invoker,options.fallbackInvoker);return true;
}

const activateVisualIndicator=(indicator:SVGElement,activate:()=>void):void=>{
  indicator.tabIndex=0;indicator.setAttribute("role","button");
  indicator.addEventListener("pointerdown",event=>{event.preventDefault();event.stopPropagation();});
  indicator.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();activate();});
  indicator.addEventListener("keydown",event=>{if(event.key!=="Enter"&&event.key!==" ")return;event.preventDefault();event.stopPropagation();activate();});
};

const svg=<K extends keyof SVGElementTagNameMap>(name:K):SVGElementTagNameMap[K]=>document.createElementNS("http://www.w3.org/2000/svg",name);
export function renderFlowConceptVisual(options:{group:SVGGElement;project:SpecificationProject;flowId:string;target:FlowConceptVisualTarget;mode:FlowVisualDisplayMode;thumbnailPixels:boolean;width:number;height:number}):void{
  const visual=flowConceptVisual(options.project,options.flowId,options.target);if(!visual||options.mode==="Hidden")return;
  const open=(invoker:SVGElement)=>openFlowConceptVisualForTarget({project:options.project,flowId:options.flowId,target:options.target,invoker,fallbackInvoker:options.group}),badge=svg("text");badge.dataset.flowVisualBadge=options.target.id;badge.setAttribute("x","10");badge.setAttribute("y","44");badge.textContent="▧ Visual";badge.setAttribute("aria-label",`View visual: ${visual.attachment.description}`);activateVisualIndicator(badge,()=>open(badge));
  if(options.mode!=="Thumbnails"){options.group.append(badge);return;}
  badge.dataset.flowVisualFallback="true";badge.style.display="none";
  const foreign=svg("foreignObject"),image=document.createElement("img"),viewport=flowConceptVisualThumbnailViewport(options.width);foreign.dataset.flowVisualThumbnail=options.target.id;foreign.setAttribute("aria-label",`View visual: ${visual.attachment.description}`);foreign.setAttribute("x",String(viewport.x));foreign.setAttribute("y",String(options.height-96));foreign.setAttribute("width",String(viewport.width));foreign.setAttribute("height",String(viewport.height));image.src=visual.asset.bytes;image.alt=visual.attachment.description;Object.assign(image.style,{width:"100%",height:"100%",objectFit:"contain"});foreign.append(image);activateVisualIndicator(foreign,()=>open(foreign));
  foreign.style.setProperty("display","block","important");options.group.append(foreign,badge);
}
