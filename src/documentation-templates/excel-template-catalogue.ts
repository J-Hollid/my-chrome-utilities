import type {DocumentationTemplateKind} from "./template-contract.js";

export const excelTemplateItemPaths:Record<string,readonly string[]>={
  "flow.pages":["page.stepLabel","page.pageName","page.sourcePageName","page.eventName","page.heading","page.visual.description","page.visual.caption","page.visual.sourceReference","page.rows","page.concepts","page.events"],
  "page.events":["event.eventName","event.heading","event.rows","event.concepts"],
  "table.rows":["row.property","row.concept","row.cells"],"flow.rows":["row.property","row.concept","row.cells"],
  "page.rows":["row.property","row.concept","row.description","row.type","row.allowedValues","row.example","row.comments","row.value","row.cells"],
  "event.rows":["row.property","row.concept","row.description","row.type","row.allowedValues","row.example","row.comments","row.value","row.cells"],
  "table.columns":["column.key","column.heading"],"flow.columns":["column.key","column.heading"],"matrix.columns":["column.key","column.heading"],
  "row.cells":["cell.columnKey","cell.heading","cell.value"],
  "matrix.rows":["row.property","row.concept","row.cells"],"matrix.concepts":["concept.name","concept.rows"],
  "profile.rows":["row.property","row.concept","row.cells"],"profile.concepts":["concept.name","concept.rows"],"page.concepts":["concept.name","concept.rows"],"event.concepts":["concept.name","concept.rows"],
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
  "flow.pages":["page.events","page.rows","page.concepts"],"page.events":["event.rows","event.concepts"],
  "page.rows":["row.cells"],"event.rows":["row.cells"],"table.rows":["row.cells"],
  "flow.rows":["row.cells"],"matrix.rows":["row.cells"],"profile.rows":["row.cells"],
  "table.concepts":["concept.rows"],"matrix.concepts":["concept.rows"],
  "profile.concepts":["concept.rows"],"page.concepts":["concept.rows"],"event.concepts":["concept.rows"],"concept.rows":["row.cells"],
};

export const excelTemplateItemRoot=(collection:string):string=>
  collection.endsWith(".pages")?"page":collection.endsWith(".events")?"event":
    collection.endsWith(".cells")?"cell":collection.endsWith(".concepts")?"concept":
      collection.endsWith(".fields")?"field":collection.endsWith(".columns")?"column":"row";

export interface ExcelTemplateValueGuide {path:string;placeholder:string;meaning:string;example:string;available:string}
export interface ExcelTemplateCollectionGuide {path:string;meaning:string;itemPrefix:string;fields:readonly string[];nestedCollections:readonly string[];directions:readonly ["Across","Down"];emptyResult:"No copy";copyBehavior:string;example:string}
export interface ExcelTemplateAreaGuide {area:string;type:"Repeat"|"Image";source:string;direction:"Across"|"Down"|"";range:string;properties?:string;parent?:string}

export const excelTemplateAreaPropertiesGuide=[
  "declarations = declaration (\";\" declaration)* [\";\"] and declaration = property-name : value; declaration order, ASCII case, and surrounding whitespace do not change the result.",
  "Image keys and defaults: fit scale-down or contain (default scale-down); position keywords or 0% through 100% percentages (default left top); padding one to four nonnegative px values (default 0px).",
  "Combined Image example: fit: scale-down; position: center; padding: 8px",
  "Percentage and padding-shorthand example: fit: contain; position: 25% 75%; padding: 4px 8px 12px 16px",
  "Across separator example: separator-area: PageSeparator, where PageSeparator is the complete full-height right edge and is emitted only between items.",
  "Down separator example: separator-area: RowSeparator, where RowSeparator is the complete full-width bottom edge and is emitted only between items.",
  "Contract 2 defaults remain compatible without a Properties column or workbook migration.",
] as const;

const contract3AcrossExamples:Record<DocumentationTemplateKind,Pick<ExcelTemplateAreaGuide,"area"|"source">>={
  overview:{area:"FieldStep",source:"overview.fields"},
  flow:{area:"PageStep",source:"flow.pages"},
  matrix:{area:"MatrixStep",source:"matrix.rows"},
  profile:{area:"ProfileStep",source:"profile.rows"},
};
const contract3AreaExamples=(kind:DocumentationTemplateKind):ExcelTemplateAreaGuide[]=>[
  {area:"ImageArea",type:"Image",source:"theme.logo",direction:"",properties:"fit: scale-down; position: center; padding: 8px",range:"A1:B2"},
  {...contract3AcrossExamples[kind],type:"Repeat",direction:"Across",properties:"separator-area: PageSeparator",range:"A1:B1"},
  {area:"RowStep",type:"Repeat",source:"table.rows",direction:"Down",properties:"separator-area: RowSeparator",range:"A1:B2"},
];

const scalarRoots=["document.title","document.incomplete","document.generatedAt","project.name","project.purpose","project.website","set.name","section.name","section.kind","theme.name","theme.clientName","theme.headerText","theme.footerText","theme.logo","table.legend"];
const kindScalars:Record<DocumentationTemplateKind,readonly string[]>={overview:[],flow:["flow.name"],matrix:["matrix.legend"],profile:["profile.name"]};
const examples:Record<string,string>={"project.name":"Shop","section.name":"Checkout journey","page.pageName":"Cart","event.eventName":"purchase","row.property":"/order/id","cell.value":"Mandatory","concept.name":"Order","field.label":"Website","field.value":"shop.example"};
const description=(path:string)=>path.split(".").at(-1)!.replace(/([A-Z])/gu," $1").replace(/^./u,value=>value.toUpperCase());
const areaExamples:Record<DocumentationTemplateKind,ExcelTemplateAreaGuide[]>={
  overview:[{area:"FieldRow",type:"Repeat",source:"overview.fields",direction:"Down",range:"A3:B3"}],
  flow:[{area:"PageCard",type:"Repeat",source:"flow.pages",direction:"Across",range:"A3:D8"},{area:"EventRow",type:"Repeat",source:"page.events",direction:"Down",range:"A5:B5",parent:"PageCard"},{area:"PageVisual",type:"Image",source:"page.visual.image",direction:"",range:"C5:D7",parent:"PageCard"},{area:"ThemeLogo",type:"Image",source:"theme.logo",direction:"",range:"C1:D2"}],
  matrix:[{area:"RowPattern",type:"Repeat",source:"matrix.rows",direction:"Down",range:"A3:C4"},{area:"CellPattern",type:"Repeat",source:"row.cells",direction:"Across",range:"B3:C3",parent:"RowPattern"}],
  profile:[{area:"ConceptPattern",type:"Repeat",source:"profile.concepts",direction:"Down",range:"A3:D6"},{area:"RowPattern",type:"Repeat",source:"concept.rows",direction:"Down",range:"A4:D4",parent:"ConceptPattern"},{area:"CellPattern",type:"Repeat",source:"row.cells",direction:"Across",range:"B4:C4",parent:"RowPattern"}],
};
const generatedAreaName=(path:string)=>path.split(".").map(part=>part[0]!.toUpperCase()+part.slice(1)).join("")+"Area";

export function excelTemplateGuideFor(kind:DocumentationTemplateKind):{values:ExcelTemplateValueGuide[];collections:ExcelTemplateCollectionGuide[];areaExamples:ExcelTemplateAreaGuide[];propertyGuidance:string[];propertyExamples:ExcelTemplateAreaGuide[]}{
  const collectionPaths:string[]=[],pending=[...excelTemplateRootCollections[kind]],seen=new Set<string>();
  while(pending.length){const path=pending.shift()!;if(seen.has(path))continue;seen.add(path);collectionPaths.push(path);pending.push(...(excelTemplateNestedCollections[path]??[]));}
  const collectionSet=new Set(collectionPaths),valuePaths=new Set([...scalarRoots,...kindScalars[kind]]);
  for(const path of collectionPaths)for(const field of excelTemplateItemPaths[path]??[])if(!collectionSet.has(field)&&!(excelTemplateNestedCollections[path]??[]).includes(field))valuePaths.add(field);
  const rootValues=new Set([...scalarRoots,...kindScalars[kind]]),values=[...valuePaths].sort().map(path=>{const providers=collectionPaths.filter(collection=>(excelTemplateItemPaths[collection]??[]).includes(path));return{path,placeholder:`{{${path}}}`,meaning:description(path),example:examples[path]??description(path),available:rootValues.has(path)?"Template root and every repeat area":`Inside repeats of ${providers.join(", ")}`};});
  const examplesForKind=areaExamples[kind],collections=collectionPaths.map(path=>{const area=examplesForKind.find(item=>item.source===path),name=area?.area??generatedAreaName(path),direction=area?.direction||"Down",range=area?.range??"A3:D3";return{path,meaning:path==="flow.pages"?"Flow Page contexts":`${description(path)} collection`,itemPrefix:excelTemplateItemRoot(path),fields:[...(excelTemplateItemPaths[path]??[])],nestedCollections:[...(excelTemplateNestedCollections[path]??[])],directions:["Across","Down"] as ["Across","Down"],emptyResult:"No copy" as const,copyBehavior:"The complete named repeat area is copied for every item.",example:`${name} | Repeat | ${path} | ${direction} | named range ${range}`};});
  return{values,collections,areaExamples:examplesForKind.map(item=>({...item})),propertyGuidance:[...excelTemplateAreaPropertiesGuide],propertyExamples:contract3AreaExamples(kind)};
}
