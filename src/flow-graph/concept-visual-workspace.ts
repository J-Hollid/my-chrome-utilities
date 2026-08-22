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
  assetBytes?:(assetId:string)=>string|undefined;
  hydrate?:(assetId:string)=>Promise<void>;
  thumbnailCacheBytes?:()=>number|Promise<number>;
}

export function createFlowConceptVisualActions(options:VisualActionOptions):HTMLButtonElement[]{
  const saved=flowConceptVisual(options.project(),options.flowId,options.target),resolved=()=>{const current=flowConceptVisual(options.project(),options.flowId,options.target);if(!current)return undefined;const bytes=current.asset.bytes??options.assetBytes?.(current.asset.id);return bytes?{attachment:current.attachment,asset:{...current.asset,bytes}}:undefined;},hydrate=async()=>{if(saved&&!resolved())await options.hydrate?.(saved.asset.id);return resolved();},liveHost=()=>options.host.isConnected?options.host:document.querySelector<HTMLElement>(`[data-flow-item-id="${CSS.escape(options.target.id)}"]`)??options.host,close=()=>liveHost().dispatchEvent(new CustomEvent("flow-close-item-editor",{bubbles:true})),openEditor=async()=>{
    const current=saved?await hydrate():undefined;if(saved&&!current)return;const editor=createFlowConceptVisualEditor({project:options.project,...(options.thumbnailCacheBytes?{thumbnailCacheBytes:options.thumbnailCacheBytes}:{}),...(current?{existing:{attachment:current.attachment,raster:current.asset}}:{}),save:(value)=>{const next=attachFlowConceptVisual(options.state(),options.flowId,options.target,value,options.id);close();options.persist(next,`Saved concept visual for ${options.label}; Undo available.`);},cancel:close});
    liveHost().dispatchEvent(new CustomEvent("flow-open-item-editor",{bubbles:true,detail:{title:`${saved?"Edit":"Add"} visual for ${options.label}`,content:editor.root,firstControl:editor.firstControl}}));
  },view=async()=>{const invoker=document.activeElement;if(!await hydrate())return;const selector=options.target.kind==="page-frame"?`g[data-page-frame-id="${CSS.escape(options.target.id)}"]:not([data-occurrence-id])`:`[data-occurrence-id="${CSS.escape(options.target.id)}"]`,fallback=document.querySelector<SVGElement>(selector);if(invoker instanceof HTMLElement)openFlowConceptVisualForTarget({project:options.project(),flowId:options.flowId,target:options.target,invoker,...(fallback?{fallbackInvoker:fallback}:{}),...(options.assetBytes?{assetBytes:options.assetBytes}:{})});};
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

export function flowConceptVisualThumbnailBounds(itemWidth:number,itemHeight:number):{x:number;y:number;width:number;height:number}{
  return{...flowConceptVisualThumbnailViewport(itemWidth),y:itemHeight-96};
}

type FlowConceptVisualInvoker=HTMLElement|SVGElement;
export function openFlowConceptVisualForTarget(options:{project:SpecificationProject;flowId:string;target:FlowConceptVisualTarget;invoker:FlowConceptVisualInvoker;fallbackInvoker?:FlowConceptVisualInvoker;assetBytes?:(assetId:string)=>string|undefined}):boolean{
  const visual=flowConceptVisual(options.project,options.flowId,options.target);if(!visual)return false;
  const bytes=visual.asset.bytes??options.assetBytes?.(visual.asset.id);if(!bytes)return false;openFlowConceptVisualViewer({attachment:visual.attachment,raster:{...visual.asset,bytes}},options.invoker,options.fallbackInvoker);return true;
}

const activateVisualIndicator=(indicator:SVGElement,activate:()=>void):void=>{
  indicator.tabIndex=0;indicator.setAttribute("role","button");
  indicator.addEventListener("pointerdown",event=>{event.preventDefault();event.stopPropagation();});
  indicator.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();activate();});
  indicator.addEventListener("keydown",event=>{if(event.key!=="Enter"&&event.key!==" ")return;event.preventDefault();event.stopPropagation();activate();});
};

const svg=<K extends keyof SVGElementTagNameMap>(name:K):SVGElementTagNameMap[K]=>document.createElementNS("http://www.w3.org/2000/svg",name);
export function renderFlowConceptVisual(options:{group:SVGGElement;project:SpecificationProject;flowId:string;target:FlowConceptVisualTarget;mode:FlowVisualDisplayMode;thumbnailPixels:boolean;width:number;height:number;assetBytes?:(assetId:string)=>string|undefined;hydrate?:(assetId:string)=>Promise<void>;thumbnailBytes?:(assetId:string)=>string|undefined}):void{
  const visual=flowConceptVisual(options.project,options.flowId,options.target);if(!visual||options.mode==="Hidden")return;
  const bytes=visual.asset.bytes??options.assetBytes?.(visual.asset.id),open=async(invoker:SVGElement)=>{if(!bytes)await options.hydrate?.(visual.asset.id);openFlowConceptVisualForTarget({project:options.project,flowId:options.flowId,target:options.target,invoker,fallbackInvoker:options.group,...(options.assetBytes?{assetBytes:options.assetBytes}:{})});},badge=svg("text");badge.dataset.flowVisualBadge=options.target.id;badge.setAttribute("x","10");badge.setAttribute("y","44");badge.textContent="▧ Visual";badge.setAttribute("aria-label",`View visual: ${visual.attachment.description}`);activateVisualIndicator(badge,()=>void open(badge));
  if(options.mode!=="Thumbnails"||!options.thumbnailPixels){options.group.append(badge);return;}
  const thumbnail=options.thumbnailBytes?.(visual.asset.id),foreign=svg("foreignObject"),viewport=flowConceptVisualThumbnailBounds(options.width,options.height);foreign.dataset.flowVisualThumbnail=options.target.id;foreign.dataset.flowVisualAssetId=visual.asset.id;foreign.setAttribute("aria-label",`View visual: ${visual.attachment.description}`);foreign.setAttribute("x",String(viewport.x));foreign.setAttribute("y",String(viewport.y));foreign.setAttribute("width",String(viewport.width));foreign.setAttribute("height",String(viewport.height));activateVisualIndicator(foreign,()=>void open(foreign));
  if(thumbnail){const image=document.createElement("img");image.src=thumbnail;image.alt=visual.attachment.description;Object.assign(image.style,{width:"100%",height:"100%",objectFit:"contain"});foreign.append(image);badge.dataset.flowVisualFallback="true";badge.style.display="none";}else{foreign.dataset.flowVisualPending="true";foreign.append(document.createTextNode("Preparing preview…"));badge.dataset.flowVisualFallback="true";}
  foreign.style.setProperty("display","block","important");options.group.append(foreign,badge);
}
