import {transactProject,type ProjectEntity,type ProjectState} from "../data-layer-specification-project.js";
import type {LayerConstraint} from "../data-layer-layered-schema.js";

export type FlowPageInstanceStructureKind="add-child"|"add-sibling"|"rename"|"move-earlier"|"move-later"|"move-to-root"|"duplicate"|"delete";
export interface FlowPageInstanceStructureCommand {kind:FlowPageInstanceStructureKind;path:string;name?:string;}
type FlowGraph={pageFrames?:ProjectEntity[]};

const clone=<T>(value:T):T=>structuredClone(value);
const cleanName=(name:string|undefined,fallback:string):string=>{const value=String(name??fallback).trim().replace(/^\/+|\/+$/g,"");if(!value||value.includes("/"))throw new Error("Property names must be one path segment.");return value;};
const parentPath=(path:string):string=>{const index=path.lastIndexOf("/");return index<=0?"":path.slice(0,index);};
const subtree=(path:string,candidate:string):boolean=>candidate===path||candidate.startsWith(`${path}/`);
const replacePath=(path:string,from:string,to:string):string=>path===from?to:path.startsWith(`${from}/`)?`${to}${path.slice(from.length)}`:path;
const suffixName=(path:string,name:string):string=>{const parent=parentPath(path);return `${parent}/${name}`;};
const frameFor=(state:ProjectState,flowId:string,frameId:string):ProjectEntity=>{const graph=(state.project.documentationFlowGraphs as Record<string,FlowGraph>)[flowId],frame=graph?.pageFrames?.find(({id})=>id===frameId);if(!graph||!frame)throw new Error(`Flow Page instance ${frameId} is unavailable.`);return frame;};
const constraintsFor=(frame:ProjectEntity):LayerConstraint[]=>clone((frame.localSchemaContributions as LayerConstraint[]|undefined)??[]);
const existingPath=(constraints:readonly LayerConstraint[],path:string,ignorePath?:string):boolean=>constraints.some(({path:candidate})=>candidate!==ignorePath&&subtree(ignorePath??"\0",candidate)?false:candidate===path);
const moveBlock=(constraints:LayerConstraint[],path:string,delta:number):LayerConstraint[]=>{
  const siblingPaths=[...new Set(constraints.filter(({path:candidate})=>parentPath(candidate)===parentPath(path)).map(({path:candidate})=>candidate))],siblingIndex=siblingPaths.indexOf(path),targetIndex=siblingIndex+delta;
  if(siblingIndex<0||targetIndex<0||targetIndex>=siblingPaths.length)return constraints;
  const target=siblingPaths[targetIndex]!,block=constraints.filter(({path:candidate})=>subtree(path,candidate)),remainder=constraints.filter(({path:candidate})=>!subtree(path,candidate)),targetIndexes=remainder.flatMap((constraint,index)=>constraint.path===target?[index]:[]),insertAt=delta<0?targetIndexes[0]!:targetIndexes.at(-1)!+1;
  remainder.splice(insertAt,0,...block);return remainder;
};
const remapSubtree=(constraints:LayerConstraint[],from:string,to:string,id:(kind:string)=>string):LayerConstraint[]=>constraints.map((constraint,index)=>{if(!subtree(from,constraint.path))return constraint;const next={...constraint,path:replacePath(constraint.path,from,to)};if(index===constraints.findIndex(({path})=>path===from))next.definitionId=next.definitionId??id("property");return next;});

function editConstraints(constraints:LayerConstraint[],command:FlowPageInstanceStructureCommand,id:(kind:string)=>string):LayerConstraint[]{
  const target=constraints.find(({path})=>path===command.path);
  if(command.kind==="add-child"||command.kind==="add-sibling"){
    const name=cleanName(command.name,command.kind==="add-child"?"child":"property"),path=command.kind==="add-child"?`${command.path}/${name}`:suffixName(command.path,name);
    if(existingPath(constraints,path))throw new Error(`Property ${path} already exists.`);
    const added:LayerConstraint={path,type:"string",definitionId:id("property")};
    const after=command.kind==="add-sibling"?constraints.findIndex(({path:candidate})=>candidate===command.path):-1;
    if(after<0)return[...constraints,added];
    constraints.splice(after+1,0,added);return constraints;
  }
  if(!target)throw new Error(`Local Flow Page-instance property ${command.path} is unavailable.`);
  if(command.kind==="delete")return constraints.filter(({path})=>!subtree(command.path,path));
  if(command.kind==="duplicate"){
    const name=cleanName(command.name,`${command.path.split("/").at(-1)} copy`),to=suffixName(parentPath(command.path),name);
    if(existingPath(constraints,to))throw new Error(`Property ${to} already exists.`);
    const copy=constraints.filter(({path})=>subtree(command.path,path)).map((constraint,index)=>({...clone(constraint),path:replacePath(constraint.path,command.path,to),...(index===0?{definitionId:id("property")}: {})}));
    const at=constraints.findIndex(({path})=>path===command.path);constraints.splice(at+1,0,...copy);return constraints;
  }
  if(command.kind==="rename"||command.kind==="move-to-root"){
    const name=cleanName(command.name,command.kind==="rename"?`${command.path.split("/").at(-1)} renamed`:command.path.split("/").at(-1)!);
    const to=command.kind==="move-to-root"?`/${name}`:suffixName(command.path,name);
    if(existingPath(constraints,to,command.path))throw new Error(`Property ${to} already exists.`);
    return remapSubtree(constraints,command.path,to,id);
  }
  return moveBlock(constraints,command.path,command.kind==="move-earlier"?-1:1);
}

export function applyFlowPageInstanceStructure(state:ProjectState,flowId:string,pageFrameId:string,command:FlowPageInstanceStructureCommand,id:(kind:string)=>string):ProjectState{
  frameFor(state,flowId,pageFrameId);
  return transactProject(state,`${command.kind} Flow Page-instance property ${command.path}`,(project)=>{const graphs=project.documentationFlowGraphs as Record<string,FlowGraph>,graph=graphs[flowId]!,frames=graph.pageFrames??[];return{...project,documentationFlowGraphs:{...graphs,[flowId]:{...graph,pageFrames:frames.map((frame)=>frame.id!==pageFrameId?frame:{...frame,localSchemaContributions:editConstraints(constraintsFor(frame),command,id),compiledTargetsStale:true})}}};});
}
