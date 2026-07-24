import {clone} from "../data-layer-flow-graph.js";

export interface FlowExampleIssue {path:string;code:"REQUIRED_EXAMPLE"|"TYPE"|"CONFLICT"|string;message:string;editHref:string}
export interface FlowOccurrenceExample {status:"Complete"|"Incomplete"|"Invalid"|"Blocked";payload:Record<string,unknown>;formattedJson:string;provenance:Record<string,string>;issues:FlowExampleIssue[]}
export interface FlowOccurrenceExampleEditorRow {path:string;type?:string;value:unknown}
export const pointerParts=(path:string):string[]=>path.split("/").filter(Boolean).map((part)=>part.replaceAll("~1","/").replaceAll("~0","~"));
export const setAtPath=(payload:Record<string,unknown>,path:string,value:unknown):void=>{const parts=pointerParts(path);if(!parts.length)return;let parent=payload;for(const part of parts.slice(0,-1)){const next=parent[part];if(!next||typeof next!=="object"||Array.isArray(next))parent[part]={};parent=parent[part] as Record<string,unknown>;}parent[parts.at(-1)!]=clone(value);};
export const valueAtPath=(payload:Record<string,unknown>,path:string):unknown=>pointerParts(path).reduce<unknown>((value,part)=>value&&typeof value==="object"&&!Array.isArray(value)?(value as Record<string,unknown>)[part]:undefined,payload);
export const applicableExample=(constraint:{target?:string},occurrence:{id:string},eventId:string,role:"context-setting"|"interaction"):boolean=>!constraint.target||constraint.target==="all"||constraint.target===occurrence.id||constraint.target===eventId||constraint.target===(role==="context-setting"?"context":"interaction");
export const exampleEditHref=(flowId:string,occurrenceId:string,path:string)=>`?kind=flow-page-instances&flow=${encodeURIComponent(flowId)}&entity=${encodeURIComponent(occurrenceId)}&field=${encodeURIComponent(`canonicalSchema.properties${path}.example`)}`;
