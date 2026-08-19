import type {DocumentationTemplateKind} from "./template-contract.js";

export const excelTemplateItemPaths:Record<string,readonly string[]>={
  "flow.pages":["page.stepLabel","page.pageName","page.sourcePageName","page.eventName","page.heading","page.rows","page.events"],
  "page.events":["event.eventName","event.heading","event.rows"],
  "table.rows":["row.property","row.concept","row.cells"],"flow.rows":["row.property","row.concept","row.cells"],
  "page.rows":["row.property","row.concept","row.description","row.type","row.allowedValues","row.example","row.comments","row.value","row.cells"],
  "event.rows":["row.property","row.concept","row.description","row.type","row.allowedValues","row.example","row.comments","row.value","row.cells"],
  "table.columns":["column.key","column.heading"],"flow.columns":["column.key","column.heading"],"matrix.columns":["column.key","column.heading"],
  "row.cells":["cell.columnKey","cell.heading","cell.value"],
  "matrix.rows":["row.property","row.concept","row.cells"],"matrix.concepts":["concept.name","concept.rows"],
  "profile.rows":["row.property","row.concept","row.cells"],"profile.concepts":["concept.name","concept.rows"],
  "table.concepts":["concept.name","concept.rows"],"concept.rows":["row.property","row.concept","row.cells"],"overview.fields":["field.label","field.value"],
};

const commonCollections=["table.columns","table.rows","table.concepts"];
export const excelTemplateRootCollections:Record<DocumentationTemplateKind,readonly string[]>={
  overview:[...commonCollections,"overview.fields"],
  flow:[...commonCollections,"flow.pages","flow.columns","flow.rows"],
  matrix:[...commonCollections,"matrix.columns","matrix.rows","matrix.concepts"],
  profile:[...commonCollections,"profile.rows","profile.concepts"],
};
export const excelTemplateNestedCollections:Record<string,readonly string[]>={
  "flow.pages":["page.events","page.rows"],"page.events":["event.rows"],
  "page.rows":["row.cells"],"event.rows":["row.cells"],"table.rows":["row.cells"],
  "flow.rows":["row.cells"],"matrix.rows":["row.cells"],"profile.rows":["row.cells"],
  "table.concepts":["concept.rows"],"matrix.concepts":["concept.rows"],
  "profile.concepts":["concept.rows"],"concept.rows":["row.cells"],
};

export const excelTemplateItemRoot=(collection:string):string=>
  collection.endsWith(".pages")?"page":collection.endsWith(".events")?"event":
    collection.endsWith(".cells")?"cell":collection.endsWith(".concepts")?"concept":
      collection.endsWith(".fields")?"field":collection.endsWith(".columns")?"column":"row";

export interface ExcelTemplateValueGuide {path:string;placeholder:string;meaning:string;example:string;available:string}
export interface ExcelTemplateCollectionGuide {path:string;meaning:string;itemPrefix:string;fields:readonly string[];nestedCollections:readonly string[];directions:readonly ["Across","Down"];emptyResult:"No copy";copyBehavior:string}

const scalarRoots=["document.title","document.incomplete","document.generatedAt","project.name","project.purpose","project.website","set.name","section.name","section.kind","theme.name","theme.clientName","theme.headerText","theme.footerText","theme.logo","table.legend"];
const kindScalars:Record<DocumentationTemplateKind,readonly string[]>={overview:[],flow:["flow.name"],matrix:["matrix.legend"],profile:["profile.name"]};
const examples:Record<string,string>={"project.name":"Shop","section.name":"Checkout journey","page.pageName":"Cart","event.eventName":"purchase","row.property":"/order/id","cell.value":"Mandatory","concept.name":"Order","field.label":"Website","field.value":"shop.example"};
const description=(path:string)=>path.split(".").at(-1)!.replace(/([A-Z])/gu," $1").replace(/^./u,value=>value.toUpperCase());

export function excelTemplateGuideFor(kind:DocumentationTemplateKind):{values:ExcelTemplateValueGuide[];collections:ExcelTemplateCollectionGuide[]}{
  const collectionPaths:string[]=[],pending=[...excelTemplateRootCollections[kind]],seen=new Set<string>();
  while(pending.length){const path=pending.shift()!;if(seen.has(path))continue;seen.add(path);collectionPaths.push(path);pending.push(...(excelTemplateNestedCollections[path]??[]));}
  const collectionSet=new Set(collectionPaths),valuePaths=new Set([...scalarRoots,...kindScalars[kind]]);
  for(const path of collectionPaths)for(const field of excelTemplateItemPaths[path]??[])if(!collectionSet.has(field)&&!(excelTemplateNestedCollections[path]??[]).includes(field))valuePaths.add(field);
  const values=[...valuePaths].sort().map(path=>({path,placeholder:`{{${path}}}`,meaning:description(path),example:examples[path]??description(path),available:`${kind[0]!.toUpperCase()+kind.slice(1)} templates and compatible repeat scope`}));
  const collections=collectionPaths.map(path=>({path,meaning:path==="flow.pages"?"Flow Page contexts":`${description(path)} collection`,itemPrefix:excelTemplateItemRoot(path),fields:[...(excelTemplateItemPaths[path]??[])],nestedCollections:[...(excelTemplateNestedCollections[path]??[])],directions:["Across","Down"] as ["Across","Down"],emptyResult:"No copy" as const,copyBehavior:"The complete named repeat area is copied for every item."}));
  return{values,collections};
}
