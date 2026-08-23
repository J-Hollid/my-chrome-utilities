import {canonicalConstraints,canonicalRequirements} from "./data-layer-canonical-schema.js";
import {compileLayeredSchema,type CompiledLayeredSchema} from "./data-layer-layered-schema.js";
import {layeredContributorPath,layeredContributorsForPath} from "./data-layer-layered-schema-project.js";
import {configureFlowDocumentationSnapshot,configureFlowDocumentationTable,flowDocumentationDisplayPath,flowDocumentationPropertyPaths,type FlowDocumentationMetadata,type FlowDocumentationSnapshot} from "./data-layer-flow-table-documentation-export.js";
import {flowDocumentationSnapshotFromState} from "./data-layer-flow-documentation-snapshot.js";
import type {ProjectDocumentationProfileColumn,ProjectDocumentationSection,ProjectDocumentationSet,ProjectDocumentationTheme} from "./data-layer-project-documentation-records.js";
import {compileProjectDocumentationSnapshot,themeFingerprint,type ProjectDocumentationDiagnostic,type ProjectDocumentationSnapshot,type ProjectDocumentationTable} from "./data-layer-project-documentation-workspace.js";
import type {Profile,ProjectEntity,ProjectEntityKind,ProjectState,Requirement} from "./data-layer-specification-project.js";
import {documentationTemplateUnavailableInvariant,snapshotTemplateDigests} from "./documentation-templates/template-library.js";
import type {TemplateContextObject} from "./documentation-templates/template-contract.js";

export type ProjectDocumentationMatrixContextKind="page-definition"|"event-definition"|"page-instance"|"event-occurrence";
export interface ProjectDocumentationMatrixContext {
  id:string;
  kind:ProjectDocumentationMatrixContextKind;
  label:string;
  flowName?:string;
  pageName?:string;
  groupLabel:string;
  parentLabel:string;
  searchText:string;
  effectiveRevision:number;
  compiled:CompiledLayeredSchema;
  sourceId:string;
  sourceKind:ProjectEntityKind;
  flowSnapshot?:FlowDocumentationSnapshot;
}
export interface ProjectDocumentationFlowSource {entity:ProjectEntity;snapshot:FlowDocumentationSnapshot}
export interface ProjectDocumentationSources {
  flows:ProjectDocumentationFlowSource[];
  matrixContexts:ProjectDocumentationMatrixContext[];
  profiles:Profile[];
}
export interface CompileProjectDocumentationInput {
  state:ProjectState;
  set:ProjectDocumentationSet;
  theme:ProjectDocumentationTheme;
  revision:number;
  generatedAt:string;
}

const stableRevision=(value:unknown):number=>{let hash=2166136261;for(const byte of new TextEncoder().encode(JSON.stringify(value)))hash=Math.imul(hash^byte,16777619);return hash>>>0;};
const flowSourceRevision=(snapshot:FlowDocumentationSnapshot):number=>stableRevision({graphRevision:snapshot.graphRevision,contexts:snapshot.contexts.map(({id,effectiveRevision})=>({id,effectiveRevision}))});
const contextHeading=(context:FlowDocumentationSnapshot["contexts"][number]):string=>`${context.pageName} / ${context.eventName}`;
const selectedOrder=<T extends {id:string}>(items:readonly T[],ids:readonly string[]|undefined):T[]=>{if(!ids)return[...items];const byId=new Map(items.map((item)=>[item.id,item]));return ids.flatMap((id)=>byId.has(id)?[byId.get(id)!]:[]);};
const matrixState=(context:ProjectDocumentationMatrixContext,path:string):string=>{if(context.compiled.conflicts.some((conflict)=>conflict.path===path))return"Blocked";const property=context.compiled.properties[path];if(!property)return"Not defined";if(property.presence==="forbidden")return"Not expected";if(property.condition)return"Conditional";return property.presence==="required"?"Mandatory":"Optional";};
const defaultProfileColumns:ProjectDocumentationProfileColumn[]=["Property","Description","Required","Allowed values","Example","Comments"];
const profileValue=(column:ProjectDocumentationProfileColumn,item:Requirement):string=>column==="Property"?flowDocumentationDisplayPath(item.path):column==="Description"?item.description??"":column==="Required"?item.forbidden?"Not expected":item.required?"Yes":"No":column==="Allowed values"?item.allowedValues?.map(String).join(", ")??"":column==="Example"?item.examples?.map(String).join(", ")??"":String((item as Requirement&{comments?:unknown}).comments??"");
const publicRows=(table:{headings:readonly string[];rows:readonly (readonly string[])[];conceptGroups?:readonly {name:string;start:number;count:number}[]})=>{const concepts=new Map(table.conceptGroups?.flatMap(group=>Array.from({length:group.count},(_,offset)=>[group.start+offset,group.name] as const))??[]);return table.rows.map((row,index)=>({property:flowDocumentationDisplayPath(row[0]??""),concept:concepts.get(index)??"",cells:row.slice(1).map((value,column)=>({columnKey:table.headings[column+1]??`column-${column+2}`,heading:table.headings[column+1]??"",value}))}));};
const tableTemplateData=(table:{headings:readonly string[];rows:readonly (readonly string[])[];legend?:string;conceptGroups?:readonly {name:string;start:number;count:number}[]}):TemplateContextObject=>({columns:table.headings.slice(1).map(heading=>({key:heading,heading})),rows:publicRows(table),concepts:(table.conceptGroups??[]).map(({name,start,count})=>({name,rows:publicRows(table).slice(start,start+count)})),legend:table.legend??""});
const metadataHeading:Record<FlowDocumentationMetadata,string>={description:"Description",type:"Type",allowedValues:"Allowed values",example:"Documented example",comments:"Comments",provenance:"Provenance"};
const flowTemplateData=(snapshot:FlowDocumentationSnapshot,table:ProjectDocumentationTable,metadata:readonly FlowDocumentationMetadata[],canonicalPaths:readonly string[],set:ProjectDocumentationSet):TemplateContextObject=>{
  const availablePaths=new Set(flowDocumentationPropertyPaths(snapshot)),tableCanonicalPaths=canonicalPaths.filter((path)=>availablePaths.has(path));
  const pages:TemplateContextObject[]=[],pageByFrame=new Map<string,TemplateContextObject>();
  const rows=(context:FlowDocumentationSnapshot["contexts"][number],contextIndex:number):TemplateContextObject[]=>table.rows.map((row,rowIndex)=>{
    const property=String(row[0]??""),canonicalPath=tableCanonicalPaths[rowIndex]??"",effective=context.compiled.properties[canonicalPath],metadataValues=metadata.map((column,index)=>[column,column==="example"?effective?.examples?.map(String).join(" or ")??"":String(row[index+1]??"")] as const),value=String(row[metadata.length+contextIndex+1]??""),cells=[{columnKey:"property",heading:"Property",value:property},...metadataValues.map(([column,item])=>({columnKey:column,heading:metadataHeading[column],value:item})),{columnKey:"value",heading:"Value",value}];
    return{property,concept:context.compiled.properties[canonicalPath]?.concept??"",...Object.fromEntries(metadataValues),value,cells};
  });
  const concepts=(items:TemplateContextObject[],context:FlowDocumentationSnapshot["contexts"][number]):TemplateContextObject[]=>{if(!set.includeConceptSubheadings)return[];const effectiveItems=items.filter((_,index)=>Boolean(context.compiled.properties[tableCanonicalPaths[index]??""])),configured=reconcileProjectDocumentationConcepts(set,effectiveItems.flatMap(({concept})=>typeof concept==="string"&&concept.trim()?[concept]:[])),conceptKey=(value:unknown)=>String(value??"").trim().toLocaleLowerCase()||"ungrouped";return configured.flatMap(({name,included})=>{if(!included)return[];const grouped=effectiveItems.filter(({concept})=>conceptKey(concept)===name.toLocaleLowerCase());return grouped.length?[{name,rows:grouped}]:[];});};
  for(const [contextIndex,context] of snapshot.contexts.entries())if(context.kind==="page-instance"){const pageRows=rows(context,contextIndex),page:TemplateContextObject={stepLabel:context.stepLabel,pageName:context.pageName,sourcePageName:context.sourcePageName??context.pageName,eventName:context.eventName,heading:`Step ${context.stepLabel} ${context.pageName}`,rows:pageRows,concepts:concepts(pageRows,context),events:[],...(context.visual?{visual:{image:context.visual.image,description:context.visual.description,caption:context.visual.caption,sourceReference:context.visual.sourceReference}}:{})};pages.push(page);pageByFrame.set(context.pageFrameId,page);}
  for(const [contextIndex,context] of snapshot.contexts.entries())if(context.kind!=="page-instance"){const page=pageByFrame.get(context.pageFrameId),eventRows=rows(context,contextIndex);if(page&&Array.isArray(page.events))(page.events as TemplateContextObject[]).push({eventName:context.eventName,heading:context.eventName,rows:eventRows,concepts:concepts(eventRows,context)});}
  const tableData=tableTemplateData(table);return{name:snapshot.flowName,pages,columns:tableData.columns!,rows:tableData.rows!};
};
const repairTarget=(context:ProjectDocumentationMatrixContext,path?:string):NonNullable<ProjectDocumentationDiagnostic["repairTarget"]>=>({kind:context.sourceKind,id:context.sourceId,...(path?{path}:{})});
export interface ProjectDocumentationConceptRow {path:string;concept?:string|undefined;cells:string[]}
export function reconcileProjectDocumentationConcepts(set:ProjectDocumentationSet,available:readonly string[]):{name:string;included:boolean}[]{const normalized=new Map<string,string>();for(const raw of available){const name=raw.trim();if(name&&!normalized.has(name.toLocaleLowerCase()))normalized.set(name.toLocaleLowerCase(),name);}const configured=set.concepts??[],known=new Set(configured.map(({name})=>name.toLocaleLowerCase())),newConcepts=[...normalized].filter(([key])=>!known.has(key)).map(([,name])=>({name,included:true})).sort((left,right)=>left.name.localeCompare(right.name,undefined,{sensitivity:"base"})),hasUngrouped=known.has("ungrouped");return[...configured,...newConcepts,...(hasUngrouped?[]:[{name:"Ungrouped",included:true}])];}
export function groupProjectDocumentationConceptRows(set:ProjectDocumentationSet,items:readonly ProjectDocumentationConceptRow[]):{rows:string[][];groups:{name:string;start:number;count:number}[];concepts:{name:string;included:boolean}[]}{const available=items.flatMap(({concept})=>concept?.trim()?[concept]:[]);if(!set.concepts?.length&&!available.length)return{rows:items.map(({cells})=>cells),groups:[],concepts:[]};const concepts=reconcileProjectDocumentationConcepts(set,available),byKey=new Map<string,ProjectDocumentationConceptRow[]>();for(const item of items){const key=item.concept?.trim().toLocaleLowerCase()||"ungrouped",rows=byKey.get(key)??[];rows.push(item);byKey.set(key,rows);}const rows:string[][]=[],groups:{name:string;start:number;count:number}[]=[];for(const concept of concepts){if(!concept.included)continue;const grouped=(byKey.get(concept.name.toLocaleLowerCase())??[]).sort((left,right)=>left.path.localeCompare(right.path));if(!grouped.length)continue;groups.push({name:concept.name,start:rows.length,count:grouped.length});rows.push(...grouped.map(({cells})=>cells));}return{rows,groups,concepts};}

export function projectDocumentationSources(state:ProjectState,generatedAt:string,revision:number):ProjectDocumentationSources {
  const flows=state.project.collections.flows.map((entity)=>({entity,snapshot:flowDocumentationSnapshotFromState(state,entity.id,generatedAt,revision)}));
  const definitions=(entities:readonly ProjectEntity[],scope:"Page"|"Event",sourceKind:"pages"|"events"):ProjectDocumentationMatrixContext[]=>entities.map((entity)=>{const contributors=layeredContributorsForPath(state,layeredContributorPath(state,entity,scope)),compiled=compileLayeredSchema(contributors,{eventId:entity.id,eventRole:scope==="Page"?"context":"interaction"}),observed=scope==="Event"?String(entity.eventName??entity.name):entity.name,label=`${scope} ${observed}`;return{id:`context:${scope.toLowerCase()}:${entity.id}`,kind:scope==="Page"?"page-definition":"event-definition",label,groupLabel:"Definitions",parentLabel:scope==="Page"?"Pages":"Events",searchText:`${scope} ${entity.name} ${observed}`,effectiveRevision:stableRevision({entity,compiled}),compiled,sourceId:entity.id,sourceKind};});
  const instances=flows.flatMap(({entity,snapshot})=>snapshot.contexts.map((context):ProjectDocumentationMatrixContext=>({id:context.id,kind:context.kind==="page-instance"?"page-instance":"event-occurrence",label:`${context.kind==="page-instance"?"Page instance":"Event occurrence"} ${contextHeading(context)}`,flowName:entity.name,pageName:context.pageName,groupLabel:entity.name,parentLabel:context.sourcePageName??context.pageName,searchText:`${entity.name} ${context.sourcePageName??""} ${context.pageName} ${context.eventName}`,effectiveRevision:context.effectiveRevision,compiled:context.compiled,sourceId:entity.id,sourceKind:"flows",flowSnapshot:snapshot})));
  return{flows,matrixContexts:[...definitions(state.project.collections.pages,"Page","pages"),...definitions(state.project.collections.events,"Event","events"),...instances],profiles:state.project.collections.profiles};
}

function profileTable(section:ProjectDocumentationSection,profile:Profile,set:ProjectDocumentationSet):ProjectDocumentationTable {
  const requirements=profile.canonicalSchema?canonicalRequirements(profile.canonicalSchema):profile.requirements,concepts=profile.canonicalSchema?new Map(canonicalConstraints(profile.canonicalSchema).map(({path,concept})=>[path,concept])):new Map<string,string|undefined>(),columns=(section.configuration?.columns?.filter((column):column is ProjectDocumentationProfileColumn=>defaultProfileColumns.includes(column as ProjectDocumentationProfileColumn))??defaultProfileColumns),paths=section.configuration?.paths??requirements.map(({path})=>path),byPath=new Map(requirements.map((item)=>[item.path,item])),grouped=groupProjectDocumentationConceptRows(set,paths.flatMap((path)=>byPath.has(path)?[{path,concept:concepts.get(path),cells:columns.map((column)=>profileValue(column,byPath.get(path)!))}]:[]));
  return{id:section.id,title:section.name,headings:columns,rows:grouped.rows,...(set.includeConceptSubheadings?{conceptGroups:grouped.groups}:{})};
}

export function compileProjectDocumentation(input:CompileProjectDocumentationInput):ProjectDocumentationSnapshot {
  const {state,set,theme,revision,generatedAt}=input,sources=projectDocumentationSources(state,generatedAt,revision),tables:ProjectDocumentationTable[]=[],diagnostics:ProjectDocumentationDiagnostic[]=[],revisions:Record<string,number>={[set.id]:stableRevision(set),[theme.id]:stableRevision(theme)};
  for(const section of set.sections.filter(({selected})=>selected)){
    if(section.kind==="overview"){revisions.project=stableRevision({name:state.project.name,description:state.project.description,site:state.project.site});tables.push({id:section.id,title:section.name,headings:["Project","Value"],rows:[["Name",state.project.name],["Purpose",state.project.description],["Website",state.project.site]]});continue;}
    if(section.kind==="flow"){
      const source=sources.flows.find(({entity})=>entity.id===section.targetId);if(!source){diagnostics.push({sectionId:section.id,message:`Flow ${section.name} is unavailable.`,repair:"Open Flow selection",repairTarget:{kind:"flows",id:String(section.targetId??"")}});continue;}
      const configured=configureFlowDocumentationSnapshot(source.snapshot,{...(section.configuration?.contextIds?{contextOrder:section.configuration.contextIds}:{}),...(section.configuration?.labels?{stepLabels:section.configuration.labels}:{})}),paths=section.configuration?.paths??flowDocumentationPropertyPaths(configured),metadata=(section.configuration?.columns??[]).filter((column):column is FlowDocumentationMetadata=>["description","type","allowedValues","example","comments"].includes(column));
      revisions[source.entity.id]=flowSourceRevision(configured);const table={...configureFlowDocumentationTable(configured,"values",{selectedPaths:paths,metadata}),id:section.id,title:section.name,themeFingerprint:themeFingerprint(theme)};tables.push({...table,templateData:flowTemplateData(configured,table,metadata,paths,set)});
      diagnostics.push(...configured.diagnostics.map((item):ProjectDocumentationDiagnostic=>({sectionId:section.id,message:`${item.contextName}: ${item.issue}`,repair:item.repair,repairTarget:{kind:"flows",id:source.entity.id,path:item.path}})));continue;
    }
    if(section.kind==="profile"){
      const profile=sources.profiles.find(({id})=>id===section.targetId);if(!profile){diagnostics.push({sectionId:section.id,message:`Site Profile ${section.name} is unavailable.`,repair:"Open Site Profile selection",repairTarget:{kind:"profiles",id:String(section.targetId??"")}});continue;}
      revisions[profile.id]=stableRevision(profile);tables.push({...profileTable(section,profile,set),themeFingerprint:themeFingerprint(theme)});continue;
    }
    const selected=selectedOrder(sources.matrixContexts,section.configuration?.contextIds),paths=section.configuration?.paths??[...new Set(selected.flatMap(({compiled})=>[...Object.keys(compiled.properties),...compiled.conflicts.map(({path})=>path)]))];
    for(const context of selected){revisions[`${context.sourceId}:${context.id}`]=context.effectiveRevision;for(const conflict of context.compiled.conflicts)diagnostics.push({sectionId:section.id,message:`${context.label}: ${conflict.message}`,repair:`Open ${context.label} effective property ${conflict.path}`,repairTarget:repairTarget(context,conflict.path)});}
    const grouped=groupProjectDocumentationConceptRows(set,paths.map((path)=>({path,concept:selected.map(({compiled})=>compiled.properties[path]?.concept).find((value)=>Boolean(value)),cells:[flowDocumentationDisplayPath(path),...selected.map((context)=>matrixState(context,path))]})));tables.push({id:section.id,title:section.name,headings:["Property",...selected.map(({label})=>label)],rows:grouped.rows,...(set.includeConceptSubheadings?{conceptGroups:grouped.groups}:{}),legend:"Mandatory · Optional · Conditional · Not expected · Not defined · Blocked",themeFingerprint:themeFingerprint(theme)});
  }
  for(const table of tables)if(!table.templateData)table.templateData=tableTemplateData(table);
  const documentation=state.project.documentation??{sets:[set],themes:[theme]};
  const templates=(documentation.templates??[]).map(template=>documentationTemplateUnavailableInvariant(template)?{...template,validation:{...template.validation,valid:false}}:template);
  return compileProjectDocumentationSnapshot({projectId:state.project.id,projectName:state.project.name,projectPurpose:state.project.description,projectWebsite:state.project.site,set,theme,sourceRevisions:revisions,templateDigests:snapshotTemplateDigests(documentation,set),templates,generatedAt,tables,diagnostics});
}

export function projectDocumentationProfileColumns():readonly ProjectDocumentationProfileColumn[]{return defaultProfileColumns;}
export {projectDocumentationProfilePaths} from "./project-documentation/profile-concept-properties.js";
