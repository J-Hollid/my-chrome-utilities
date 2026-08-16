import type {SpecificationProject} from "./data-layer-specification-project.js";

const lineageField=(name:string)=>name==="sourceLineage"||name==="externalLineage";
const ownedIdentity=(external:boolean,name:string,value:unknown)=>!external&&name==="id"&&typeof value==="string";
const ownedFlowGraphKey=(external:boolean,parent:string)=>!external&&parent==="documentationFlowGraphs";
const objectRecord=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==="object";

function collectProjectIds(value:unknown,ids:Set<string>,external=false,parent=""):void{
  if(Array.isArray(value)){collectProjectIdArray(value,ids,external,parent);return;}
  if(objectRecord(value))collectProjectIdObject(value,ids,external,parent);
}
const collectProjectIdArray=(value:unknown[],ids:Set<string>,external:boolean,parent:string)=>{for(const entry of value)collectProjectIds(entry,ids,external,parent);};
const collectProjectIdObject=(value:Record<string,unknown>,ids:Set<string>,external:boolean,parent:string)=>{for(const[name,entry]of Object.entries(value)){const outside=external||lineageField(name);if(ownedIdentity(outside,name,entry))ids.add(entry as string);if(ownedFlowGraphKey(outside,parent))ids.add(name);collectProjectIds(entry,ids,outside,name);}};

export function flowVisualProjectMapping(project:SpecificationProject,targetProjectId:string,id:(oldId:string)=>string):Map<string,string>{
  const ids=new Set<string>();collectProjectIds(project,ids);return new Map([...ids].map(old=>[old,old===project.id?targetProjectId:id(old)]));
}

const mappedProjectKey=(name:string,parent:string,external:boolean,mapping:Map<string,string>)=>!external&&parent==="documentationFlowGraphs"?(mapping.get(name)??name):name;
const remapObject=(value:Record<string,unknown>,mapping:Map<string,string>,external:boolean,parent:string)=>Object.fromEntries(Object.entries(value).map(([name,entry])=>{const outside=external||lineageField(name);return[mappedProjectKey(name,parent,outside,mapping),remapFlowVisualProject(entry,mapping,outside,name)];}));

export function remapFlowVisualProject(value:unknown,mapping:Map<string,string>,external=false,parent=""):unknown{
  if(typeof value==="string")return!external&&mapping.has(value)?mapping.get(value):value;
  if(Array.isArray(value))return value.map(entry=>remapFlowVisualProject(entry,mapping,external,parent));
  return objectRecord(value)?remapObject(value,mapping,external,parent):value;
}

export function flowVisualAssetReferences(project:SpecificationProject):string[]{return Object.values(project.documentationFlowGraphs??{}).flatMap(graph=>[...(graph.pageFrames??[]),...(graph.occurrences??[])].flatMap(item=>item.conceptVisual?.assetId?[item.conceptVisual.assetId]:[]));}
