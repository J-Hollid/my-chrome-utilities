import {orderedPageGroupIds,requiresPageGroupMembershipMigration} from "./utilities/data-layer/page-group-membership.js";
import {canonicalSchemaWithConstraint,compileLayeredSchema,createCanonicalSchema,layeredContributorPath,layeredContributorsForPath,migrateLegacyProfile,transactProject,validateLayeredObservation,type CanonicalSchemaDocument,type IdFactory,type LayerConstraint,type ProjectEntity,type ProjectState,type SpecificationProject} from "./utilities/data-layer/schemas.js";
import {duplicatePageFrameRecord} from "./data-layer-flow-graph-structural.js";
export {addFreePageFrame,addUngroupedPageFrame,inspectFreePageEdgeMove,inspectOccurrenceContainmentMove,inspectOccurrencePageChange,inspectUngroupedPageDrop,moveFreePageFrame,reassignFlowOccurrencePage} from "./flow-graph/containment.js";
export {flowOutline,flowRelationshipText,inspectFlowGraph,projectFlowGraph} from "./flow-graph/projection.js";
export {deriveFlowOccurrenceExample,deriveFlowPageFrameExample,setFlowOccurrenceExample,flowOccurrenceExampleEditorRows} from "./flow-graph/examples.js";
export type {FlowExampleIssue,FlowOccurrenceExample,FlowOccurrenceExampleEditorRow} from "./flow-graph/examples.js";
export {migrateLegacyFlowContextBindings,migrateLegacyFlowRelationshipKinds,removeFlowRelationship,reviewLegacyFlowContextMigration,saveGraphRelationship} from "./flow-graph/examples.js";
export {addEventOccurrenceToPage,addGraphOccurrence,addInteractionOccurrenceToPage,moveGraphOccurrence,removeGraphOccurrence,reorderGraphOccurrence,updateGraphOccurrence} from "./flow-graph/occurrences.js";
export {applyFlowPageGroupLaneSelection,addFlowPageFrame,duplicateFlowPageFrame,inspectPageFrameDrop,moveFlowPageFrame,removeFlowPageFrame,reorderFlowPageGroupLane,saveFlowViewState,setFlowPageGroupLanes} from "./flow-graph/page-frames.js";

export type FlowRole="context-setting"|"interaction";
export type FlowObligation="Required"|"Optional"|"Conditional"|"Informational";
export type FlowRelationshipKind="expected_next"|"alternative"|"merge";
export type FlowPortSide="left"|"right"|"top"|"bottom";
export type FreePageRegion="before-lanes"|"after-lanes";
export type FlowEndpointKind="page-frame";
export const FLOW_GRAPH_GEOMETRY={eventWidth:170,eventHeight:94,eventMinX:12,eventMinY:40,pageFrameMinWidth:190,pageFrameMinHeight:108,pageFrameChildRightPadding:20,pageFrameChildBottomPadding:16} as const;
export interface FlowEndpointReference {kind:FlowEndpointKind;id:string}
export type StoredFlowEndpointReference=FlowEndpointReference|{kind:"event-occurrence";id:string};
export interface FlowLayout {lane:string;x:number;y:number}
export interface FlowOccurrenceInput {name:string;pageFrameId?:string;pageGroupId?:string;freePageFrameId?:string;freePageFrame?:boolean;freePageRegion?:FreePageRegion;pageId:string;eventId?:string;role?:FlowRole;trigger?:string;fallbackRole?:FlowRole;obligation:FlowObligation;minimum:number;maximum:number;layout?:FlowLayout;x?:number;y?:number}
export interface FlowRelationshipInput {id?:string;toStepId:string;sourcePort:FlowPortSide;targetPort:FlowPortSide;group?:string;label?:string;documentationCondition?:string;expectation?:string}
export interface FlowNode {id:string;name:string;eventId:string;pageId:string;pageFrameId?:string;pageGroupId?:string;freePageFrameId?:string;freePageFrame?:boolean;freePageRegion?:FreePageRegion;role:FlowRole;trigger?:string;obligation:FlowObligation;expectedMinimum:number;expectedMaximum?:number;layout?:FlowLayout}
export interface FlowConnectionEndpoint extends FlowEndpointReference {name:string;pageId:string;pageGroupId?:string;freePageRegion?:FreePageRegion;layout:FlowLayout;width:number;height:number}
export interface FlowRelationship {id:string;sourceEndpoint:FlowEndpointReference;targetEndpoint:FlowEndpointReference;sourceNodeId:string;targetNodeId:string;sourcePort:FlowPortSide;targetPort:FlowPortSide;kind:FlowRelationshipKind;group?:string;label?:string;documentationCondition?:string;expectation?:string}
export interface FlowGraph {id:string;name:string;purpose:string;nodes:readonly FlowNode[];connectionEndpoints:readonly FlowConnectionEndpoint[];relationships:readonly FlowRelationship[]}
export interface FlowCatalogEntry {id:string;name:string;role?:FlowRole;[key:string]:unknown}
export interface FlowCatalog {propertySets:readonly FlowCatalogEntry[];pages:readonly FlowCatalogEntry[];events:readonly FlowCatalogEntry[]}
export interface FlowDiagnostic {kind:"missing-event"|"missing-page"|"dangling-relationship";message:string;nodeId?:string;relationshipId?:string}
export interface FlowLaneBand {id:string;name:string;y:number;height:number}
export interface FlowGraphProjection {projectName:string;lanes:readonly FlowCatalogEntry[];laneBands:readonly FlowLaneBand[];graph:FlowGraph;catalog:FlowCatalog;diagnostics:readonly FlowDiagnostic[]}
export interface DocumentaryPageFrameRecord {id:string;pageId:string;pageGroupId?:string;freePageRegion?:FreePageRegion;position:{x?:number;y:number}}
export interface DocumentaryRelationshipRecord {id:string;sourceEndpoint?:StoredFlowEndpointReference;targetEndpoint?:StoredFlowEndpointReference;sourceNodeId?:string;targetNodeId?:string;sourcePort?:FlowPortSide;targetPort?:FlowPortSide;[key:string]:unknown}
export interface FlowViewState {selectedItem?:{kind:"page-frame"|"occurrence"|"relationship";id:string};viewport?:{x:number;y:number;zoom:number}}
export interface DocumentaryFlowGraph extends FlowViewState {pageGroupIds:readonly string[];pageFrames:readonly DocumentaryPageFrameRecord[];occurrences:readonly ProjectEntity[];relationships:readonly DocumentaryRelationshipRecord[]}

interface StoredDocumentaryFlowGraph extends FlowViewState {pageGroupIds:string[];pageFrames:DocumentaryPageFrameRecord[];occurrences:ProjectEntity[];relationships:DocumentaryRelationshipRecord[]}
interface LegacyBindingOccurrence extends ProjectEntity {contextBindingId:string}
type ProjectWithDocumentaryGraphs=SpecificationProject&{documentationFlowGraphs?:Record<string,StoredDocumentaryFlowGraph>};
export const clone=<T>(value:T):T=>structuredClone(value);
export const graphIndex=(project:SpecificationProject):Record<string,StoredDocumentaryFlowGraph>=>(project as ProjectWithDocumentaryGraphs).documentationFlowGraphs??{};
export const storedGraph=(project:SpecificationProject,flowId:string):StoredDocumentaryFlowGraph=>{const stored=graphIndex(project)[flowId],legacy=project.collections.flows.find(({id})=>id===flowId)?.pageGroupIds as string[]|undefined;return{pageGroupIds:[...(stored?.pageGroupIds??legacy??[])],pageFrames:stored?.pageFrames??[],occurrences:stored?.occurrences??[],relationships:stored?.relationships??[],...(stored?.selectedItem?{selectedItem:stored.selectedItem}:{}),...(stored?.viewport?{viewport:stored.viewport}:{})};};
export const saveStoredGraph=(project:SpecificationProject,flowId:string,graph:StoredDocumentaryFlowGraph):SpecificationProject=>{const{selectedItem:_selectedItem,viewport:_viewport,...semanticGraph}=graph;return{...project,documentationFlowGraphs:{...graphIndex(project),[flowId]:semanticGraph}};};
export const legacyBindingOccurrence=(occurrence:ProjectEntity):occurrence is LegacyBindingOccurrence=>typeof occurrence.contextBindingId==="string"&&Boolean(occurrence.contextBindingId);
export const relationshipEndpoint=(relationship:DocumentaryRelationshipRecord,side:"source"|"target"):StoredFlowEndpointReference|undefined=>{
  const endpoint=side==="source"?relationship.sourceEndpoint:relationship.targetEndpoint;
  if(endpoint&&(endpoint.kind==="page-frame"||endpoint.kind==="event-occurrence")&&endpoint.id)return endpoint;
  const legacy=side==="source"?relationship.sourceNodeId:relationship.targetNodeId;
  return legacy?{kind:"event-occurrence",id:String(legacy)}:undefined;
};
export const relationshipTouches=(relationship:DocumentaryRelationshipRecord,ids:Set<string>):boolean=>ids.has(relationshipEndpoint(relationship,"source")?.id??"")||ids.has(relationshipEndpoint(relationship,"target")?.id??"");
const flowPortSide=(value:unknown):value is FlowPortSide=>value==="left"||value==="right"||value==="top"||value==="bottom";
export function inferFlowRelationshipKind(sourcePort:FlowPortSide,targetPort:FlowPortSide):FlowRelationshipKind|undefined{
  if(sourcePort==="right"&&targetPort==="left")return"expected_next";
  if(sourcePort==="top"&&targetPort==="bottom")return"alternative";
  if(sourcePort==="bottom"&&targetPort==="top")return"merge";
  return undefined;
}
const legacyPorts=(kind:unknown):{sourcePort:FlowPortSide;targetPort:FlowPortSide}=>kind==="alternative"||kind==="parallel"?{sourcePort:"top",targetPort:"bottom"}:kind==="merge"?{sourcePort:"bottom",targetPort:"top"}:{sourcePort:"right",targetPort:"left"};
export const relationshipPorts=(relationship:DocumentaryRelationshipRecord):{sourcePort:FlowPortSide;targetPort:FlowPortSide}=>flowPortSide(relationship.sourcePort)&&flowPortSide(relationship.targetPort)?{sourcePort:relationship.sourcePort,targetPort:relationship.targetPort}:legacyPorts(relationship.kind);
type ValidatedOccurrence=FlowOccurrenceInput;
export const normalizedOccurrence=(input:ValidatedOccurrence):Omit<ProjectEntity,"id">=>{
  if(input.pageFrameId||input.pageGroupId||input.freePageFrameId||input.freePageFrame){const {layout,x,y,fallbackRole,role,eventId,...values}=clone(input);void layout;void fallbackRole;void role;const ownsCoordinates=Boolean(input.pageFrameId||input.freePageFrameId||input.freePageFrame);return{...values,...(eventId?{eventId}:{}),position:{...(ownsCoordinates?{x:Number(x??input.layout?.x??24)}:{}),y:Number(y??input.layout?.y??70)},optional:input.obligation==="Optional"};}
  const {layout,...values}=clone(input);if(!layout)throw new Error("An uncontained legacy Flow occurrence requires an explicit legacy layout.");return{...values,lane:layout.lane,position:{x:layout.x,y:layout.y},optional:input.obligation==="Optional"};
};

export function documentaryFlowGraph(project:SpecificationProject,flowId:string):DocumentaryFlowGraph{const graph=storedGraph(project,flowId);return{pageGroupIds:graph.pageGroupIds,pageFrames:graph.pageFrames,occurrences:graph.occurrences,relationships:graph.relationships,...(graph.selectedItem?{selectedItem:graph.selectedItem}:{}),...(graph.viewport?{viewport:graph.viewport}:{})};}
export function flowPageGroupLaneIds(project:SpecificationProject,flowId:string):readonly string[]{return storedGraph(project,flowId).pageGroupIds;}
export function flowOccurrenceEventSchema(project:SpecificationProject,flowId:string,occurrenceId:string):unknown{
  const occurrence=storedGraph(project,flowId).occurrences.find(({id})=>id===occurrenceId),event=project.collections.events.find(({id})=>id===occurrence?.eventId);return event?.id;
}
export function validOccurrence(state:ProjectState,flowId:string,input:FlowOccurrenceInput):ValidatedOccurrence{
  if("contextBindingId" in input)throw new Error("A legacy Page-context binding is migration input and cannot be authored as a Flow occurrence.");
  const flow=state.project.collections.flows.find(({id})=>id===flowId);if(!flow)throw new Error("A documentary Flow graph requires an existing Flow.");if(!input.name.trim())throw new Error("A Flow occurrence requires a name.");const page=state.project.collections.pages.find(({id})=>id===input.pageId);if(!page)throw new Error("A Flow occurrence requires an existing Page.");if(!input.pageFrameId)throw new Error("A Flow occurrence requires an existing containing Page frame; legacy lane records are migration input only.");const graph=storedGraph(state.project,flowId),frame=graph.pageFrames.find(({id})=>id===input.pageFrameId);
  if(input.pageFrameId&&(!frame||frame.pageId!==page.id||(input.pageGroupId!==undefined&&String(frame.pageGroupId??"")!==String(input.pageGroupId))))throw new Error("A Flow occurrence requires its existing containing Page frame.");const effectivePageGroupId=input.pageGroupId??frame?.pageGroupId;if(effectivePageGroupId){const group=state.project.collections.propertySets.find(({id})=>id===effectivePageGroupId),memberIds=orderedPageGroupIds(state.project,page.id);if(!group||!flowPageGroupLaneIds(state.project,flowId).includes(group.id)||!memberIds.includes(group.id))throw new Error("A Flow occurrence requires a selected Property Set containing its Page.");}
  if(input.freePageFrameId){const legacyFrame=graph.occurrences.find(({id})=>id===input.freePageFrameId);if(!legacyFrame?.freePageFrame||legacyFrame.pageId!==page.id)throw new Error("A free-page interaction requires an existing free Page frame for its Page.");}
  const event=state.project.collections.events.find(({id})=>id===input.eventId);if(!event)throw new Error("A Flow occurrence requires an existing Event.");if(input.minimum<0||input.maximum<input.minimum)throw new Error("Flow occurrence bounds are invalid.");const{fallbackRole,role,...values}=input;void fallbackRole;void role;return{...values,name:input.name.trim()};
}


export interface FlowContainmentSchemaSummary {pageFrameId:string;pageName:string;status:"ready"|"blocked";propertyPaths:string[]}
export interface FlowContainmentSchemaImpact {source:FlowContainmentSchemaSummary;target:FlowContainmentSchemaSummary;addedPaths:string[];removedPaths:string[];changedPaths:string[]}
export interface FlowContainmentReview {rejected:boolean;message:string;guidance:string;impact?:FlowContainmentSchemaImpact}
