import type {CanonicalPredicate,CanonicalPropertyType} from "./data-layer-canonical-schema.js";
import {typedCanonicalValue} from "./data-layer-canonical-schema-facets.js";

export const schemaTableColumns=[
  {key:"property",label:"Property"},
  {key:"path",label:"Path"},
  {key:"type",label:"Type"},
  {key:"presence",label:"Presence"},
  {key:"description",label:"Description"},
  {key:"expected-or-allowed",label:"Allowed values"},
  {key:"example",label:"Example"},
  {key:"source",label:"Source"},
  {key:"local-effective-state",label:"Local/effective state"},
  {key:"validation-state",label:"Validation state"},
] as const;
export const schemaTableCellMetadata=schemaTableColumns.map(({key,label})=>({key,label}));
export const schemaTableOverlayStyle="position:absolute;left:0;top:100%;z-index:10;width:min(42rem,calc(100vw - 1rem));max-width:calc(100vw - 1rem);max-height:calc(100vh - 1rem);box-sizing:border-box;overflow:auto;background:Canvas;border:1px solid ButtonBorder;padding:0.75rem;";

export function revealSchemaTableOverlay(layer:HTMLElement):void {
  queueMicrotask(()=>layer.scrollIntoView({block:"nearest",inline:"nearest"}));
}

export const schemaTableEditableFacets=["description","expected-or-allowed","example"] as const;
export type SchemaTableEditableFacet=typeof schemaTableEditableFacets[number];

export interface SchemaTableQuickEditCell {path:string;facet:SchemaTableEditableFacet;}
export type SchemaTableQuickEditIntent={kind:"commit";direction?:1|-1}|{kind:"cancel"};
export type SchemaTableQuickEditResult={status:"committed"|"unchanged"}|{status:"invalid";diagnostic:string};

export function schemaTableQuickEditIntent(key:string,shiftKey:boolean):SchemaTableQuickEditIntent|undefined {
  if(key==="Escape")return{kind:"cancel"};
  if(key==="Enter")return{kind:"commit"};
  if(key==="Tab")return{kind:"commit",direction:shiftKey?-1:1};
  return undefined;
}

export function schemaTableQuickEditDestination(
  cells:readonly SchemaTableQuickEditCell[],
  origin:SchemaTableQuickEditCell,
  direction:1|-1,
):SchemaTableQuickEditCell|undefined {
  const index=cells.findIndex(({path,facet})=>path===origin.path&&facet===origin.facet);
  return index<0?undefined:cells[index+direction];
}

export interface SchemaTableQuickEditBinding {
  root:()=>ParentNode;
  scope:string;
  path:string;
  facet:SchemaTableEditableFacet;
  savedValue:string;
  commit:(value:string)=>SchemaTableQuickEditResult;
  cancel:()=>void;
  diagnostic:(message:string)=>void;
}

const quickEditControls=(root:ParentNode):HTMLInputElement[]=>Array.from(root.querySelectorAll<HTMLInputElement>("input[data-inline-schema-facet][data-inline-schema-path]"));
const quickEditCell=(control:HTMLInputElement):SchemaTableQuickEditCell=>({path:control.dataset.inlineSchemaPath!,facet:control.dataset.inlineSchemaFacet as SchemaTableEditableFacet});
const quickEditFocusGeneration=new WeakMap<Document,number>();
const pendingQuickEditFocus=new WeakMap<Document,{scope:string;cell:SchemaTableQuickEditCell;expires:number}>();
const focusQuickEditCell=(binding:SchemaTableQuickEditBinding,cell:SchemaTableQuickEditCell):void=>{
  const target=quickEditControls(binding.root()).find((control)=>control.dataset.inlineSchemaPath===cell.path&&control.dataset.inlineSchemaFacet===cell.facet);
  target?.focus({preventScroll:true});
};
const quickEditDocument=(binding:SchemaTableQuickEditBinding):Document=>binding.root() instanceof Document?binding.root() as Document:(binding.root() as Node).ownerDocument!;
const rememberQuickEditFocus=(binding:SchemaTableQuickEditBinding,cell:SchemaTableQuickEditCell):void=>{pendingQuickEditFocus.set(quickEditDocument(binding),{scope:binding.scope,cell,expires:Date.now()+5000});};
const restoreQuickEditFocus=(binding:SchemaTableQuickEditBinding,cell:SchemaTableQuickEditCell):void=>{
  const document=quickEditDocument(binding),generation=(quickEditFocusGeneration.get(document)??0)+1;quickEditFocusGeneration.set(document,generation);rememberQuickEditFocus(binding,cell);
  const restore=()=>{if(quickEditFocusGeneration.get(document)===generation)focusQuickEditCell(binding,cell);};
  queueMicrotask(restore);
  for(const delay of [0,25,75,150,300,600])setTimeout(restore,delay);
};

export function bindSchemaTableQuickEdit(control:HTMLInputElement,binding:SchemaTableQuickEditBinding):void {
  const origin={path:binding.path,facet:binding.facet},destination=(direction:1|-1):SchemaTableQuickEditCell|undefined=>schemaTableQuickEditDestination(quickEditControls(control.closest("table")??binding.root()).map(quickEditCell),origin,direction);
  let settled=false;
  const pending=pendingQuickEditFocus.get(control.ownerDocument);
  if(pending&&pending.expires>=Date.now()&&pending.scope===binding.scope&&pending.cell.path===origin.path&&pending.cell.facet===origin.facet)queueMicrotask(()=>{if(control.isConnected)control.focus({preventScroll:true});});
  const commit=(target?:SchemaTableQuickEditCell):void=>{
    if(settled)return;
    if(control.value===binding.savedValue){
      settled=true;binding.diagnostic("");
      if(target)restoreQuickEditFocus(binding,target);
      return;
    }
    if(target)rememberQuickEditFocus(binding,target);
    settled=true;
    const result=binding.commit(control.value);
    if(result.status==="invalid"){
      settled=false;binding.diagnostic(result.diagnostic);
      restoreQuickEditFocus(binding,origin);
      return;
    }
    binding.diagnostic("");
    if(target)restoreQuickEditFocus(binding,target);
  };
  control.addEventListener("input",()=>{settled=false;});
  control.addEventListener("focus",()=>{const document=control.ownerDocument,current=pendingQuickEditFocus.get(document);quickEditFocusGeneration.set(document,(quickEditFocusGeneration.get(document)??0)+1);if(current&&(current.scope!==binding.scope||current.cell.path!==origin.path||current.cell.facet!==origin.facet))pendingQuickEditFocus.delete(document);});
  control.addEventListener("keydown",(event)=>{
    const intent=schemaTableQuickEditIntent(event.key,event.shiftKey);if(!intent)return;
    event.preventDefault();
    if(intent.kind==="cancel"){
      event.stopPropagation();settled=true;control.value=binding.savedValue;binding.diagnostic("");binding.cancel();restoreQuickEditFocus(binding,origin);return;
    }
    commit(intent.direction?destination(intent.direction):undefined);
  });
  control.addEventListener("blur",()=>commit());
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
    const operator=condition.operator==="Exists"?"exists":condition.operator==="Does not exist"?"does not exist":condition.operator.toLowerCase();
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
