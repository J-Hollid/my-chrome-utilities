import type {CanonicalPredicate,CanonicalPropertyType} from "./data-layer-canonical-schema.js";
import {typedCanonicalValue} from "./data-layer-canonical-schema-facets.js";
export {bindSchemaTableQuickEdit,schemaTableEditableFacets,schemaTableQuickEditCommitsOnChange,schemaTableQuickEditDestination,schemaTableQuickEditIntent} from "./data-layer-schema-table-quick-edit.js";
export type {SchemaTableEditableFacet,SchemaTableQuickEditBinding,SchemaTableQuickEditCell,SchemaTableQuickEditIntent,SchemaTableQuickEditResult} from "./data-layer-schema-table-quick-edit.js";

export const schemaTableColumns=[
  {key:"property-editor",label:"Property editor"},
  {key:"path",label:"Path"},
  {key:"type",label:"Type"},
  {key:"presence",label:"Presence"},
  {key:"description",label:"Description"},
  {key:"expected-or-allowed",label:"Allowed values"},
  {key:"example",label:"Example"},
  {key:"source",label:"Source"},
  {key:"local-effective-state",label:"Local or effective state"},
  {key:"validation-state",label:"Validation state"},
] as const;
export const schemaTableCellMetadata=schemaTableColumns.map(({key,label})=>({key,label}));
export const schemaTableOverlayStyle="position:fixed;right:auto;bottom:auto;margin:0;box-sizing:border-box;max-width:calc(100vw - 1rem);max-height:calc(100vh - 1rem);overflow:hidden;background:Canvas;border:1px solid ButtonBorder;padding:0.75rem;";

interface OverlayRectangle {left:number;right:number;top:number;bottom:number;width:number;height:number;}
interface OverlaySize {width:number;height:number;}
interface OverlayViewport {width:number;height:number;}
export interface SchemaTableOverlayPlacement {left:number;top:number;width:number;height:number;maxHeight:number;}

const overlayPadding=8,overlayGap=8;
const clamp=(value:number,minimum:number,maximum:number):number=>Math.min(Math.max(value,minimum),Math.max(minimum,maximum));

export function schemaTableOverlayPlacement(anchor:OverlayRectangle,size:OverlaySize,viewport:OverlayViewport):SchemaTableOverlayPlacement {
  const maxWidth=Math.max(0,viewport.width-overlayPadding*2),maxHeight=Math.max(0,viewport.height-overlayPadding*2),width=Math.min(size.width,maxWidth),height=Math.min(size.height,maxHeight),right=anchor.right+overlayGap,left=anchor.left-overlayGap-width;
  const preferredLeft=right+width<=viewport.width-overlayPadding?right:left>=overlayPadding?left:anchor.left;
  return{left:clamp(preferredLeft,overlayPadding,viewport.width-overlayPadding-width),top:clamp(anchor.top,overlayPadding,viewport.height-overlayPadding-height),width,height,maxHeight};
}

type MountedSchemaTableOverlay={owner:HTMLElement;dialog:HTMLDialogElement;abort:AbortController;resizeObserver?:ResizeObserver;resizeFrame?:number};
const mountedSchemaTableOverlays=new WeakMap<HTMLElement,MountedSchemaTableOverlay>();
const mountedSchemaTableOverlayInventory=new Set<MountedSchemaTableOverlay>();

export function clearSchemaTableOverlay(owner:HTMLElement):void {
  const mounted=mountedSchemaTableOverlays.get(owner);if(!mounted)return;
  mounted.abort.abort();mounted.resizeObserver?.disconnect();if(mounted.resizeFrame!==undefined)owner.ownerDocument.defaultView?.cancelAnimationFrame(mounted.resizeFrame);if(mounted.dialog.open)mounted.dialog.close();mounted.dialog.remove();const owned=(owner.getAttribute("aria-owns")??"").split(/\s+/).filter((id)=>id&&id!==mounted.dialog.id);if(owned.length)owner.setAttribute("aria-owns",owned.join(" "));else owner.removeAttribute("aria-owns");mountedSchemaTableOverlays.delete(owner);mountedSchemaTableOverlayInventory.delete(mounted);
}

export function schemaTableOverlayTarget<T extends HTMLElement=HTMLElement>(owner:HTMLElement,selector:string):T|undefined {
  return mountedSchemaTableOverlays.get(owner)?.dialog.querySelector<T>(selector)??undefined;
}

export function mountSchemaTableOverlay(owner:HTMLElement,trigger:HTMLElement,path:string,layers:readonly HTMLElement[],onCancel:()=>void):HTMLDialogElement {
  for(const mounted of Array.from(mountedSchemaTableOverlayInventory))if(mounted.owner!==owner)clearSchemaTableOverlay(mounted.owner);
  clearSchemaTableOverlay(owner);
  const dom=owner.ownerDocument,dialog=dom.createElement("dialog"),stack=dom.createElement("section"),abort=new AbortController();
  const ownerId=owner.id||`schema-overlay-owner-${crypto.randomUUID()}`,dialogId=`schema-property-overlay-${crypto.randomUUID()}`;if(!owner.id)owner.id=ownerId;dialog.id=dialogId;
  dialog.dataset.schemaRowOverlay="true";dialog.dataset.schemaPropertyOverlayHost="true";dialog.dataset.schemaOverlayOwner=ownerId;dialog.setAttribute("aria-label",`${path} property overlay`);dialog.style.cssText=schemaTableOverlayStyle;
  stack.dataset.schemaOverlayStack="true";stack.style.cssText="display:flex;align-items:flex-start;gap:0.5rem;max-width:100%;overflow:hidden;";
  layers.forEach((layer,index)=>{layer.style.boxSizing="border-box";layer.style.minWidth="0";layer.style.maxWidth=layers.length===1?"min(42rem,calc(100vw - 2.5rem))":`calc((100vw - ${1.5+0.5*(layers.length-1)}rem) / ${layers.length})`;layer.style.maxHeight="calc(100vh - 2.5rem)";layer.style.overflowY=index===layers.length-1?"auto":"hidden";layer.style.overscrollBehavior="contain";});
  stack.append(...layers);dialog.append(stack);dom.body.append(dialog);owner.setAttribute("aria-owns",owner.getAttribute("aria-owns")?[owner.getAttribute("aria-owns"),dialogId].join(" "):dialogId);const mounted:MountedSchemaTableOverlay={owner,dialog,abort};mountedSchemaTableOverlays.set(owner,mounted);mountedSchemaTableOverlayInventory.add(mounted);
  const place=(remeasureWidth=false):void=>{
    if(!dialog.isConnected||!trigger.isConnected)return;
    if(remeasureWidth)dialog.style.removeProperty("width");
    const anchor=trigger.getBoundingClientRect(),bounds=dialog.getBoundingClientRect(),view=dom.defaultView,placement=schemaTableOverlayPlacement(anchor,{width:bounds.width,height:Math.max(bounds.height,dialog.scrollHeight)},{width:Math.min(view?.innerWidth??dom.documentElement.clientWidth,dom.documentElement.clientWidth),height:Math.min(view?.innerHeight??dom.documentElement.clientHeight,dom.documentElement.clientHeight)});
    dialog.style.left=`${placement.left}px`;dialog.style.top=`${placement.top}px`;dialog.style.width=`${placement.width}px`;dialog.style.maxHeight=`${placement.maxHeight}px`;
  };
  dialog.addEventListener("cancel",(event)=>{event.preventDefault();onCancel();},{signal:abort.signal});
  dom.defaultView?.addEventListener("resize",()=>place(true),{signal:abort.signal});
  queueMicrotask(()=>{
    if(!dialog.isConnected||!trigger.isConnected)return;
    const scrollNodes=[dom.scrollingElement,...Array.from(owner.querySelectorAll<HTMLElement>("[data-schema-editor-scroll-region]"))].filter((node):node is Element&{scrollTop:number;scrollLeft:number}=>Boolean(node)),scrollState=scrollNodes.map((node)=>({node,top:node.scrollTop,left:node.scrollLeft})),restoreScroll=():void=>scrollState.forEach(({node,top,left})=>{node.scrollTop=top;node.scrollLeft=left;});
    if(!dialog.open)dialog.showModal();
    place(true);
    restoreScroll();
    const view=dom.defaultView,schedulePlace=():void=>{
      if(!view)return;
      if(mounted.resizeFrame!==undefined)view.cancelAnimationFrame(mounted.resizeFrame);
      mounted.resizeFrame=view.requestAnimationFrame(()=>{delete mounted.resizeFrame;place();restoreScroll();});
    };
    schedulePlace();
    if(view?.ResizeObserver){
      mounted.resizeObserver=new view.ResizeObserver(schedulePlace);
      mounted.resizeObserver.observe(dialog);
      mounted.resizeObserver.observe(stack);
      const active=layers.at(-1);if(active)mounted.resizeObserver.observe(active);
    }
    const active=layers.at(-1),focus=active?.querySelector<HTMLElement>("button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1'])");
    focus?.focus({preventScroll:true});
  });
  return dialog;
}

export type SchemaTableOverlayState=
  |{phase:"closed";restorePath?:string}
  |{phase:"menu"|"focused"|"review";path:string};
export type SchemaTableOverlayEvent=
  |{kind:"open";path:string}
  |{kind:"focus"|"review"|"cancel"|"escape"};

export function schemaTableOverlayTransition(state:SchemaTableOverlayState,event:SchemaTableOverlayEvent):SchemaTableOverlayState {
  if(event.kind==="open")return{phase:"menu",path:event.path};
  if(event.kind==="cancel"||event.kind==="escape")return{phase:"closed",...("path" in state?{restorePath:state.path}:{})};
  if(!("path" in state))return state;
  return{phase:event.kind==="focus"?"focused":"review",path:state.path};
}

export type SchemaTableValueFacet=
  |{kind:"expected";text:string;value:unknown}
  |{kind:"allowed";text:string;values:readonly unknown[]};

const formattedOrdinaryValue=(value:unknown):string=>{
  if(typeof value!=="string")return JSON.stringify(value);
  return value===""||value.trim()!==value||/[,\\"[\]{}]/.test(value)?JSON.stringify(value):value;
};

export function schemaTableValueFacet(value:{expectedValue?:unknown;allowedValues?:readonly unknown[]}):SchemaTableValueFacet {
  if(value.expectedValue!==undefined)return{kind:"expected",text:formattedOrdinaryValue(value.expectedValue),value:value.expectedValue};
  const values=value.allowedValues??[];
  return{kind:"allowed",text:values.map(formattedOrdinaryValue).join(", "),values};
}

export function schemaTableExpectedOrAllowed(value:{expectedValue?:unknown;allowedValues?:readonly unknown[]}):string {
  return schemaTableValueFacet(value).text;
}

const parsedScalar=(text:string,previous:unknown):unknown=>{
  if(typeof previous==="string"){try{const parsed=JSON.parse(text) as unknown;return typeof parsed==="string"?parsed:text;}catch{return text;}}
  try{return JSON.parse(text) as unknown;}catch{return text;}
};

const ordinaryEntries=(text:string):string[]=>{
  const entries:string[]=[];let start=0,depth=0,quote=false,escaped=false;
  for(let index=0;index<text.length;index+=1){
    const character=text[index]!;
    if(quote){if(escaped)escaped=false;else if(character==="\\")escaped=true;else if(character==='"')quote=false;continue;}
    if(character==='"'){quote=true;continue;}
    if(character==="["||character==="{")depth+=1;
    else if(character==="]"||character==="}")depth=Math.max(0,depth-1);
    else if(character===","&&depth===0){entries.push(text.slice(start,index).trim());start=index+1;}
  }
  entries.push(text.slice(start).trim());return entries.filter((entry)=>entry.length>0);
};

export function schemaTableAllowedValues(value:{expectedValue?:unknown;allowedValues?:readonly unknown[]}):string {
  const values=value.allowedValues?.length?value.allowedValues:value.expectedValue===undefined?[]:[value.expectedValue];
  return values.map(formattedOrdinaryValue).join(", ");
}

export function schemaTableStageAllowedValues(
  previous:readonly unknown[],
  text:string,
  type:CanonicalPropertyType|undefined,
):unknown[] {
  const entries=ordinaryEntries(text);
  return entries.map((entry,index)=>{
    if(type==="string"||type===undefined)return parsedScalar(entry,typeof previous[index]==="string"?previous[index]:"");
    return typedCanonicalValue(type,entry);
  });
}

export type SchemaTableExampleControl=
  |{kind:"none"}
  |{kind:"select";values:readonly unknown[]}
  |{kind:"input"};

export function schemaTableExampleControl(
  method:"blank"|"allowed-value"|"custom",
  allowedValues:readonly unknown[],
):SchemaTableExampleControl {
  if(method==="blank")return{kind:"none"};
  if(method==="allowed-value")return{kind:"select",values:allowedValues};
  return{kind:"input"};
}

export function schemaTableRuleConditionSummary(
  condition:CanonicalPredicate|undefined,
  properties:readonly {id:string;name:string}[],
):string {
  if(!condition)return"Always";
  if(condition.kind==="predicate"){
    const property=properties.find(({id,name})=>id===condition.propertyId||name===condition.propertyId)?.name??condition.propertyId;
    const operator=!condition.operator?"choose operator":condition.operator==="Exists"?"exists":condition.operator==="Does not exist"?"does not exist":condition.operator.toLowerCase();
    return`${property} ${operator}${condition.value===undefined?"":` ${formattedOrdinaryValue(condition.value)}`}`;
  }
  const relation=condition.kind==="all"?"All":condition.kind==="any"?"Any":"Not";
  return`${relation}: ${condition.children.map((child)=>schemaTableRuleConditionSummary(child,properties)).join(condition.kind==="any"?" or ":" and ")}`;
}

export function schemaTableRuleOutcomeSummary(rule:Record<string,unknown>):string {
  if(rule.kind==="cardinality"){
    const parts=[rule.minItems===undefined?"":`minimum items ${rule.minItems}`,rule.maxItems===undefined?"":`maximum items ${rule.maxItems}`].filter(Boolean);
    return parts.join(", ")||"cardinality";
  }
  if(rule.kind==="range"){
    const parts=[rule.minimum===undefined?"":`minimum ${rule.minimum}`,rule.maximum===undefined?"":`maximum ${rule.maximum}`].filter(Boolean);
    return parts.join(", ")||"range";
  }
  if(rule.kind==="presence")return String(rule.presence??"presence");
  if(rule.kind==="pattern")return`pattern ${String(rule.pattern??"")}`.trim();
  if(rule.kind==="value")return`allowed values ${schemaTableAllowedValues(rule)}`.trim();
  return String(rule.name??rule.kind??"reusable rule");
}

export function schemaTableStageExpectedOrAllowed<T extends {expectedValue?:unknown;allowedValues?:readonly unknown[]}>(source:T,text:string):T {
  const facet=schemaTableValueFacet(source);
  const entries=ordinaryEntries(text),{expectedValue:_,allowedValues:__,...rest}=source,previous=facet.kind==="expected"?facet.value:facet.values[0];
  if(entries.length>1)return{...rest,allowedValues:entries.map((entry)=>parsedScalar(entry,previous))} as unknown as T;
  if(!entries.length)return{...rest,allowedValues:[]} as unknown as T;
  return{...rest,expectedValue:parsedScalar(entries[0]!,previous)} as unknown as T;
}

export function schemaTableReplaceExpectedOrAllowed<T extends {
  expectedValue?:unknown;
  allowedValues?:readonly unknown[];
  allowedValueIds?:readonly string[];
  allowedValueProvenance?:readonly unknown[];
}>(source:T,text:string):T {
  const staged=schemaTableStageExpectedOrAllowed(source,text);
  if(staged.expectedValue===undefined)return staged;
  const {allowedValueIds:_,allowedValueProvenance:__,...expected}=staged;
  return{...expected,allowedValues:[]} as unknown as T;
}
