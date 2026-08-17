import type {ProjectDocumentationSectionKind} from "../data-layer-project-documentation-records.js";

export type DocumentationTemplateKind=ProjectDocumentationSectionKind;
export type DocumentationTemplateFormat="excel"|"rich";
export type TemplateScalar=string|number|boolean|null|undefined;
export type TemplateContextValue=TemplateScalar|TemplateContextObject|readonly TemplateContextValue[];
export interface TemplateContextObject {[key:string]:TemplateContextValue}

const commonBindings=[
  "document.title","document.incomplete","document.generatedAt",
  "project.name","project.purpose","project.website","set.name",
  "section.name","section.kind","theme.name","theme.clientName",
  "theme.headerText","theme.footerText","theme.logo",
  "table.columns","table.rows","table.concepts","table.legend",
] as const;
const kindBindings:Record<DocumentationTemplateKind,readonly string[]>={
  overview:["overview.fields"],
  flow:["flow.name","flow.pages","flow.columns","flow.rows"],
  matrix:["matrix.columns","matrix.rows","matrix.concepts","matrix.legend"],
  profile:["profile.name","profile.rows","profile.concepts"],
};

export const templateBindingsFor=(kind:DocumentationTemplateKind):readonly string[]=>[...commonBindings,...kindBindings[kind]];

export function templateValueAt(context:TemplateContextObject,path:string):TemplateContextValue{
  return path.split(".").reduce<TemplateContextValue>((value,key)=>value&&typeof value==="object"&&!Array.isArray(value)?(value as TemplateContextObject)[key]:undefined,context);
}

export function safeWorksheetName(raw:string):string{
  const base=String(raw??"").replace(/[\\/*?:[\]]/gu," ").replace(/\s+/gu," ").replace(/^'+|'+$/gu,"").trim()||"Documentation";
  return base.slice(0,31);
}

export function templateDigest(prefix:string,value:unknown):string{
  let hash=2166136261;for(const byte of new TextEncoder().encode(JSON.stringify(value))){hash^=byte;hash=Math.imul(hash,16777619);}
  return`${prefix}:${(hash>>>0).toString(16).padStart(8,"0")}`;
}

