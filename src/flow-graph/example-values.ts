import {clone} from "../data-layer-flow-graph.js";

export interface FlowExampleIssue {path:string;code:"REQUIRED_EXAMPLE"|"TYPE"|"CONFLICT"|string;message:string;editHref:string}
export interface FlowOccurrenceExample {status:"Complete"|"Incomplete"|"Invalid"|"Blocked";payload:Record<string,unknown>;formattedJson:string;provenance:Record<string,string>;issues:FlowExampleIssue[]}
export interface FlowOccurrenceExampleEditorRow {path:string;type?:string;value:unknown}
export const pointerParts=(path:string):string[]=>path.split("/").filter(Boolean).map((part)=>part.replaceAll("~1","/").replaceAll("~0","~"));
const compatibleContainer=(value:unknown,array:boolean):value is Record<string,unknown>|unknown[]=>
  array?Array.isArray(value):Boolean(value)&&typeof value==="object"&&!Array.isArray(value);

export const setAtPath=(payload:Record<string,unknown>,path:string,value:unknown):void=>{
  const parts=pointerParts(path);if(!parts.length)return;
  let parent:Record<string,unknown>|unknown[]=payload;
  for(let index=0;index<parts.length;index+=1){
    const part=parts[index]!,last=index===parts.length-1,key=part==="*"?0:part;
    if(last){(parent as Record<string|number,unknown>)[key]=clone(value);return;}
    const array=parts[index+1]==="*",current=(parent as Record<string|number,unknown>)[key];
    if(!compatibleContainer(current,array))(parent as Record<string|number,unknown>)[key]=array?[]:{};
    parent=(parent as Record<string|number,Record<string,unknown>|unknown[]>)[key]!;
  }
};
export const valueAtPath=(payload:Record<string,unknown>,path:string):unknown=>pointerParts(path).reduce<unknown>((value,part)=>{
  if(part==="*")return Array.isArray(value)?value[0]:undefined;
  return value&&typeof value==="object"&&!Array.isArray(value)?(value as Record<string,unknown>)[part]:undefined;
},payload);
export const applicableExample=(constraint:{target?:string},occurrence:{id:string},eventId:string,role:"context-setting"|"interaction"):boolean=>!constraint.target||constraint.target==="all"||constraint.target===occurrence.id||constraint.target===eventId||constraint.target===(role==="context-setting"?"context":"interaction");
export const exampleEditHref=(flowId:string,occurrenceId:string,path:string)=>`?kind=flow-page-instances&flow=${encodeURIComponent(flowId)}&entity=${encodeURIComponent(occurrenceId)}&field=${encodeURIComponent(`canonicalSchema.properties${path}.example`)}`;
