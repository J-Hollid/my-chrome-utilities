import type {CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import type {LayerScope} from "./data-layer-layered-schema.js";
import type {ProjectEntity,ProjectEntityKind,ProjectState} from "./data-layer-specification-project.js";

export type SidePanelSchemaGroupName="Saved schemas"|"Shared"|"Page Groups"|"Pages"|"Events"|"Flow instances"|"Occurrences";
export interface SidePanelSchemaEntry {key:string;name:string;role:string;scope:string;lineage:string;revision:number;state:"Draft"|"saved"|"Migration required";}
export interface SidePanelSchemaGroup {name:SidePanelSchemaGroupName;entries:SidePanelSchemaEntry[];}
export interface SavedSchemaSummary {id:string;name:string;version:number;published?:boolean;workingDraft?:unknown;parentSchemaId?:string;}
export interface SidePanelContributorSelection {entity:ProjectEntity;scope:LayerScope;collectionKind?:ProjectEntityKind;flowId?:string;}

const canonicalRevision=(entity:ProjectEntity):number=>(entity.canonicalSchema as CanonicalSchemaDocument|undefined)?.revision??Number(entity.sourceRevision??0);
const projectEntry=(key:string,entity:ProjectEntity,role:string,scope:LayerScope,lineage:string):SidePanelSchemaEntry=>({key,name:entity.name,role,scope,lineage:lineage||"Project root",revision:canonicalRevision(entity),state:entity.canonicalSchema?"Draft":"Migration required"});

export function sidePanelSchemaGroups(state:ProjectState|undefined,savedSchemas:readonly SavedSchemaSummary[]):SidePanelSchemaGroup[]{
  const saved:SidePanelSchemaGroup={name:"Saved schemas",entries:savedSchemas.map((schema)=>({key:`saved:${schema.id}`,name:schema.name,role:"Saved schema",scope:"Library",lineage:schema.parentSchemaId?`Parent ${schema.parentSchemaId}`:"Library root",revision:schema.version,state:schema.published===false||schema.workingDraft?"Draft":"saved"}))};
  if(!state)return saved.entries.length?[saved]:[];
  const {collections}=state.project,profileName=(id:unknown)=>collections.profiles.find((candidate)=>candidate.id===id)?.name,groupName=(id:unknown)=>collections.pageGroups.find((candidate)=>candidate.id===id)?.name,pageName=(id:unknown)=>collections.pages.find((candidate)=>candidate.id===id)?.name,eventName=(id:unknown)=>collections.events.find((candidate)=>candidate.id===id)?.name,join=(values:(string|undefined)[])=>values.filter((value):value is string=>Boolean(value)).join(" → ");
  const groups:SidePanelSchemaGroup[]=[saved,
    {name:"Shared",entries:collections.profiles.map((entity)=>projectEntry(`profiles:${entity.id}`,entity,"Shared Profile","Shared Profile","Project root"))},
    {name:"Page Groups",entries:collections.pageGroups.map((entity)=>projectEntry(`pageGroups:${entity.id}`,entity,"Page Group","Page Group",profileName(entity.profileId)??"Project root"))},
    {name:"Pages",entries:collections.pages.map((entity)=>projectEntry(`pages:${entity.id}`,entity,"Page","Page",join([profileName(entity.profileId),...((entity.pageGroupIds as string[]|undefined)??[]).map(groupName)])))},
    {name:"Events",entries:collections.events.map((entity)=>projectEntry(`events:${entity.id}`,entity,"Event","Event",profileName(entity.profileId)??"Project root"))},
    {name:"Flow instances",entries:Object.entries(state.project.documentationFlowGraphs??{}).flatMap(([flowId,graph])=>((graph as {pageFrames?:ProjectEntity[]}).pageFrames??[]).map((entity)=>projectEntry(`flowInstances:${flowId}:${entity.id}`,entity,"Flow Page instance","Flow Page-instance",join([collections.flows.find(({id})=>id===flowId)?.name,groupName(entity.pageGroupId),pageName(entity.pageId)]))))},
    {name:"Occurrences",entries:Object.entries(state.project.documentationFlowGraphs??{}).flatMap(([flowId,graph])=>{const typed=graph as {pageFrames?:ProjectEntity[];occurrences?:ProjectEntity[]};return(typed.occurrences??[]).map((entity)=>projectEntry(`occurrences:${flowId}:${entity.id}`,entity,"Event occurrence","Event-occurrence",join([collections.flows.find(({id})=>id===flowId)?.name,typed.pageFrames?.find(({id})=>id===entity.pageFrameId)?.name,eventName(entity.eventId)])));})},
  ];
  return groups.filter(({entries})=>entries.length);
}

export function resolveSidePanelSchemaContributor(state:ProjectState,key:string):SidePanelContributorSelection|undefined{
  const collections:[ProjectEntityKind,LayerScope][]=[["profiles","Shared Profile"],["pageGroups","Page Group"],["pages","Page"],["events","Event"]];
  for(const[collectionKind,scope]of collections){const entity=(state.project.collections[collectionKind] as ProjectEntity[]).find((candidate)=>key===`${collectionKind}:${candidate.id}`);if(entity)return{entity,scope,collectionKind};}
  for(const[flowId,graph]of Object.entries(state.project.documentationFlowGraphs??{})){const typed=graph as {pageFrames?:ProjectEntity[];occurrences?:ProjectEntity[]},frame=typed.pageFrames?.find((candidate)=>key===`flowInstances:${flowId}:${candidate.id}`);if(frame)return{entity:frame,scope:"Flow Page-instance",flowId};const occurrence=typed.occurrences?.find((candidate)=>key===`occurrences:${flowId}:${candidate.id}`);if(occurrence)return{entity:occurrence,scope:"Event-occurrence",flowId};}
  return undefined;
}

export function canonicalMigrationDurablyAcknowledged(state:ProjectState,key:string,expected:CanonicalSchemaDocument):boolean{
  const selection=resolveSidePanelSchemaContributor(state,key),entity=selection?.entity;
  const canonicalKeys=(value:unknown):string[]=>value&&typeof value==="object"?[...new Set(Object.values(value).flatMap(canonicalKeys).concat(Object.keys(value)))].sort():[];
  const canonicalBytes=(value:unknown)=>JSON.stringify(value,canonicalKeys(value));
  if(!entity||canonicalBytes(entity.canonicalSchema)!==canonicalBytes(expected))return false;
  const requirements=entity.requirements as unknown[]|undefined,schemaConstraints=entity.schemaConstraints as unknown[]|undefined,structuredDraft=entity.structuredDraft as {document?:unknown}|undefined;
  return !requirements?.length&&!schemaConstraints?.length&&!entity.structuredSchema&&!structuredDraft?.document;
}
