import type {ProjectEntity,ProjectState} from "./data-layer-specification-project.js";
import type {SavedSchemaSummary} from "./data-layer-side-panel-schema-editor.js";

export type SchemaRelationshipCategory="All"|"Saved schemas"|"Shared Profiles"|"Property Sets"|"Pages"|"Events"|"Flow Page instances"|"Event occurrences";
export interface SchemaRelationshipTreeNode {
  key:string;
  name:string;
  kind:"branch"|"relationship"|"contributor";
  role:string;
  relationshipPath:string;
  children:SchemaRelationshipTreeNode[];
  targetKey?:string;
  category?:Exclude<SchemaRelationshipCategory,"All">;
  expanded?:boolean;
  match?:boolean;
}
export interface SchemaRelationshipTreeView {
  query:string;
  category:SchemaRelationshipCategory;
  expandedKeys:string[];
  scrollTop:number;
}
interface TreeViewStorage {
  getItem?(key:string):string|null;
  setItem?(key:string,value:string):void;
  get?(key:string):string|undefined;
  set?(key:string,value:string):unknown;
}

const path=(parts:readonly string[])=>parts.join(" → ");
const branch=(key:string,name:string,parts:string[],children:SchemaRelationshipTreeNode[]):SchemaRelationshipTreeNode=>({key,name,kind:"branch",role:"Structural ancestor",relationshipPath:path([...parts,name]),children});
const contributor=(key:string,name:string,role:string,category:Exclude<SchemaRelationshipCategory,"All">,parts:string[],targetKey=key):SchemaRelationshipTreeNode=>({key,name,kind:"contributor",role,category,targetKey,relationshipPath:path([...parts,name]),children:[]});
const reference=(key:string,name:string,role:string,category:Exclude<SchemaRelationshipCategory,"All">,parts:string[],targetKey:string,children:SchemaRelationshipTreeNode[]=[]):SchemaRelationshipTreeNode=>({key,name,kind:"relationship",role,category,targetKey,relationshipPath:path([...parts,name]),children});

export function projectSchemaRelationshipTree(state:ProjectState|undefined,savedSchemas:readonly SavedSchemaSummary[]):SchemaRelationshipTreeNode[]{
  const savedPath=["Saved schemas"],savedChildren=savedSchemas.map((schema)=>contributor(`saved:${schema.id}`,schema.name,"Saved schema","Saved schemas",savedPath,`saved:${schema.id}`));
  const saved=branch("saved-schemas","Saved schemas",[],savedChildren);
  if(!state)return [saved];
  const {project}=state,{collections}=project,projectPath=[project.name],graphs=(project.documentationFlowGraphs??{}) as Record<string,{pageFrames?:ProjectEntity[];occurrences?:ProjectEntity[]}>,propertySets=((collections as typeof collections&{propertySets?:ProjectEntity[]}).propertySets??collections.pageGroups);
  const byId=<T extends ProjectEntity>(values:readonly T[],id:unknown)=>values.find((candidate)=>candidate.id===id);
  const occurrencesFor=(flowId:string,frameId?:string,eventId?:string)=>(graphs[flowId]?.occurrences??[]).filter((occurrence)=>(!frameId||occurrence.pageFrameId===frameId)&&(!eventId||occurrence.eventId===eventId));
  const occurrenceNode=(appearance:string,flowId:string,occurrence:ProjectEntity,parts:string[])=>reference(`${appearance}:occurrence:${flowId}:${occurrence.id}`,occurrence.name,"Event occurrence","Event occurrences",parts,`occurrences:${flowId}:${occurrence.id}`);
  const shared=branch(`project:${project.id}:shared`,"Shared Profiles",projectPath,collections.profiles.map((profile)=>contributor(`profiles:${profile.id}`,profile.name,"Shared Profile","Shared Profiles",[...projectPath,"Shared Profiles"])));
  const pageGroups=branch(`project:${project.id}:property-sets`,"Property Sets",projectPath,propertySets.map((group)=>{
    const parts=[...projectPath,"Property Sets"],node=contributor(`propertySets:${group.id}`,group.name,"Property Set","Property Sets",parts);
    node.children=collections.pages.filter((page)=>((page.propertySetApplications as {propertySetId?:string}[]|undefined)??[]).some(({propertySetId})=>propertySetId===group.id)||((page.pageGroupIds as string[]|undefined)??[]).includes(group.id)).map((page)=>reference(`property-set:${group.id}:page:${page.id}`,page.name,"Page application","Pages",[...parts,group.name],`pages:${page.id}`));
    return node;
  }));
  const pages=branch(`project:${project.id}:pages`,"Pages",projectPath,collections.pages.map((page)=>{
    const parts=[...projectPath,"Pages"],node=contributor(`pages:${page.id}`,page.name,"Page","Pages",parts);
    node.children=Object.entries(graphs).flatMap(([flowId,graph])=>(graph.pageFrames??[]).filter((frame)=>frame.pageId===page.id).map((frame)=>{
      const flow=byId(collections.flows,flowId),frameParts=[...parts,page.name];
      return reference(`page:${page.id}:frame:${flowId}:${frame.id}`,`${flow?.name??"Flow"} ${frame.name}`,"Flow Page instance","Flow Page instances",frameParts,`flowInstances:${flowId}:${frame.id}`);
    }));
    return node;
  }));
  const events=branch(`project:${project.id}:events`,"Events",projectPath,collections.events.map((event)=>{
    const parts=[...projectPath,"Events"],node=contributor(`events:${event.id}`,event.name,"Event","Events",parts);
    node.children=Object.entries(graphs).flatMap(([flowId])=>occurrencesFor(flowId,undefined,event.id).map((occurrence)=>{
      const flow=byId(collections.flows,flowId),frame=byId(graphs[flowId]?.pageFrames??[],occurrence.pageFrameId);
      return occurrenceNode(`event:${event.id}`,flowId,occurrence,[...parts,event.name,flow?.name??"Flow",frame?.name??"Page instance"]);
    }));
    return node;
  }));
  const flows=branch(`project:${project.id}:flows`,"Flows",projectPath,collections.flows.map((flow)=>{
    const flowParts=[...projectPath,"Flows"],graph=graphs[flow.id]??{},flowNode=branch(`flow:${flow.id}`,flow.name,flowParts,[]);
    flowNode.children=(graph.pageFrames??[]).map((frame)=>{
      const page=byId(collections.pages,frame.pageId),frameName=frame.name||page?.name||"Page instance",parts=[...flowParts,flow.name];
      return reference(`flow:${flow.id}:frame:${frame.id}`,frameName,"Flow Page instance","Flow Page instances",parts,`flowInstances:${flow.id}:${frame.id}`,occurrencesFor(flow.id,frame.id).map((occurrence)=>occurrenceNode(`flow:${flow.id}:frame:${frame.id}`,flow.id,occurrence,[...parts,frameName])));
    });
    return flowNode;
  }));
  return [saved,branch(`project:${project.id}`,`Project ${project.name}`,[],[shared,pageGroups,pages,events,flows])];
}

function clonePruned(node:SchemaRelationshipTreeNode,children:SchemaRelationshipTreeNode[],expanded=false,match=false):SchemaRelationshipTreeNode{
  const {expanded:_expanded,match:_match,...base}=node;
  return {...base,children,...(expanded&&children.length?{expanded:true}:{}),...(match?{match:true}:{})};
}

export function filterSchemaRelationshipTree(tree:readonly SchemaRelationshipTreeNode[],view:Pick<SchemaRelationshipTreeView,"category"|"query">):SchemaRelationshipTreeNode[]{
  const query=view.query.trim().toLocaleLowerCase(),category=view.category;
  const categoryBranch=(node:SchemaRelationshipTreeNode):SchemaRelationshipCategory|undefined=>{
    if(node.key.endsWith(":shared"))return"Shared Profiles";
    if(node.key.endsWith(":property-sets"))return"Property Sets";
    if(node.key.endsWith(":pages"))return"Pages";
    if(node.key.endsWith(":events"))return"Events";
    if(node.key.endsWith(":flows"))return category==="Event occurrences"?"Event occurrences":"Flow Page instances";
    return undefined;
  };
  const relevantRoot=(node:SchemaRelationshipTreeNode):boolean=>{
    if(category==="All")return true;
    if(category==="Saved schemas")return node.name==="Saved schemas";
    if(category==="Flow Page instances"||category==="Event occurrences")return node.name.startsWith("Project ");
    return node.name===category||node.name.startsWith("Project ");
  };
  const allowed=(node:SchemaRelationshipTreeNode):boolean=>{
    if(category==="All")return true;
    if(node.kind==="branch")return true;
    if(category==="Property Sets")return node.category==="Property Sets"||Boolean(query&&node.key.startsWith("property-set:"));
    if(category==="Flow Page instances")return node.category==="Flow Page instances"&&node.key.startsWith("flow:");
    if(category==="Event occurrences")return node.category==="Event occurrences"&&node.key.startsWith("flow:");
    return node.category===category;
  };
  const visit=(node:SchemaRelationshipTreeNode):SchemaRelationshipTreeNode|undefined=>{
    const branchCategory=categoryBranch(node);
    if(category!=="All"&&category!=="Saved schemas"&&branchCategory&&branchCategory!==category)return undefined;
    const haystack=`${node.name} ${node.role} ${node.relationshipPath}`.toLocaleLowerCase(),selfMatches=!query||haystack.includes(query);
    const children=node.children.map(visit).filter((child):child is SchemaRelationshipTreeNode=>Boolean(child));
    if(!allowed(node)&&node.kind!=="branch"){
      if(!children.length)return undefined;
      const {targetKey:_targetKey,category:_category,...ancestor}=clonePruned(node,children,Boolean(query));
      return{...ancestor,kind:"branch"};
    }
    if(query&&!selfMatches&&!children.length)return undefined;
    if(!query&&node.kind==="branch"&&!children.length)return undefined;
    if(query&&!selfMatches&&children.length&&node.targetKey){
      const {targetKey:_targetKey,category:_category,...ancestor}=clonePruned(node,children,true);
      return{...ancestor,kind:"branch"};
    }
    return clonePruned(node,children,Boolean(query),Boolean(query&&selfMatches&&node.targetKey));
  };
  return tree.filter(relevantRoot).map(visit).filter((node):node is SchemaRelationshipTreeNode=>Boolean(node));
}

const storageKey=(projectId:string)=>`my-chrome-utilities.schema-relationship-tree-view.v1:${projectId}`;
const defaultView=():SchemaRelationshipTreeView=>({query:"",category:"All",expandedKeys:[],scrollTop:0});

export function saveSchemaRelationshipTreeView(storage:TreeViewStorage,projectId:string,view:SchemaRelationshipTreeView):void{
  const value=JSON.stringify(view),key=storageKey(projectId);
  try{if(storage.setItem)storage.setItem(key,value);else storage.set?.(key,value);}catch{/* Ephemeral navigation state must never block the canonical Schema Library. */}
}

export function restoreSchemaRelationshipTreeView(storage:TreeViewStorage,projectId:string,validKeys:ReadonlySet<string>):SchemaRelationshipTreeView{
  const key=storageKey(projectId);let serialized:string|null|undefined;
  try{serialized=storage.getItem?storage.getItem(key):storage.get?.(key);}catch{return defaultView();}
  if(!serialized)return defaultView();
  try{
    const parsed=JSON.parse(serialized) as Partial<SchemaRelationshipTreeView>,categories:SchemaRelationshipCategory[]=["All","Saved schemas","Shared Profiles","Property Sets","Pages","Events","Flow Page instances","Event occurrences"];
    return{query:typeof parsed.query==="string"?parsed.query:"",category:categories.includes(parsed.category as SchemaRelationshipCategory)?parsed.category as SchemaRelationshipCategory:"All",expandedKeys:Array.isArray(parsed.expandedKeys)?parsed.expandedKeys.filter((value):value is string=>typeof value==="string"&&validKeys.has(value)):[],scrollTop:Number.isFinite(parsed.scrollTop)&&Number(parsed.scrollTop)>=0?Number(parsed.scrollTop):0};
  }catch{return defaultView();}
}
