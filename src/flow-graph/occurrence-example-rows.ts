import {compileLayeredSchema,layeredContributorPath,layeredContributorsForPath} from "../utilities/data-layer/schemas.js";
import {storedGraph} from "../data-layer-flow-graph.js";
import type {ProjectState,SpecificationProject} from "../utilities/data-layer/schemas.js";
import {valueAtPath,type FlowOccurrenceExampleEditorRow} from "./example-values.js";
import {deriveFlowOccurrenceExample} from "./occurrence-example-derive.js";

export function flowOccurrenceExampleEditorRows(project:SpecificationProject,flowId:string,occurrenceId:string):FlowOccurrenceExampleEditorRow[]{const occurrence=storedGraph(project,flowId).occurrences.find(({id})=>id===occurrenceId);if(!occurrence)return[];const state={project} as ProjectState,path=layeredContributorPath(state,occurrence,"Event-occurrence",flowId),contributors=layeredContributorsForPath(state,path),compiled=compileLayeredSchema(contributors,{eventId:String(occurrence.eventId??""),eventRole:"interaction",occurrenceId}),example=deriveFlowOccurrenceExample(project,flowId,occurrenceId);return Object.entries(compiled.properties).map(([propertyPath,property])=>({path:propertyPath,...(property.type?{type:property.type}:{}),value:valueAtPath(example.payload,propertyPath)}));}
