import {canonicalPropertyPath,canonicalSchemaFromJsonSchema,type CanonicalCommand,type CanonicalCommandResult,type CanonicalPropertyNode,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import {mountCanonicalSchemaEditor,type CanonicalSchemaEditorOptions} from "./data-layer-canonical-schema-ui.js";
import type {AttachedSchemaRule,JsonSchema,SchemaDefinition} from "./data-layer-schema-verification.js";

export interface UnifiedCanonicalEditorAdapter {
  key:string;
  label:string;
  load:()=>CanonicalSchemaDocument;
  dispatch:(command:CanonicalCommand)=>CanonicalCommandResult;
  onUndo?:()=>void;
  onRedo?:()=>void;
  actions?:readonly {label:string;run:()=>void}[];
  renderContext?:(host:HTMLElement)=>void;
}
type CoreMount=(options:CanonicalSchemaEditorOptions)=>{render():void};

export function createUnifiedCanonicalEditorController(mount:CoreMount,id:(kind:string)=>string=(kind)=>`${kind}:${crypto.randomUUID()}`){
  let active:UnifiedCanonicalEditorAdapter|undefined;
  const empty=savedSchemaCanonicalDocument({id:"schema:empty",name:"No schema selected",version:0,document:{type:"object"}},id);
  const core=mount({host:globalThis.document?.createElement("section") as HTMLElement,surface:"Side panel",load:()=>active?.load()??empty,dispatch:(command)=>active?.dispatch(command)??{status:"conflict",document:empty,message:"Select a schema before editing."},id,onUndo:()=>active?.onUndo?.(),onRedo:()=>active?.onRedo?.()});
  return{
    select(adapter:UnifiedCanonicalEditorAdapter){active=adapter;core.render();},
    clear(){active=undefined;},
    current:()=>active?.load()??empty,
    dispatch:(command:CanonicalCommand)=>active?.dispatch(command)??{status:"conflict" as const,document:empty,message:"Select a schema before editing."},
    active:()=>active,
    render:()=>core.render(),
  };
}

export function mountUnifiedSidePanelCanonicalEditor(input:{host:HTMLElement;id:(kind:string)=>string}){
  const chrome=document.createElement("header"),identity=document.createElement("p"),actions=document.createElement("div"),coreShell=document.createElement("section"),coreHost=document.createElement("section"),contextHost=document.createElement("section");
  chrome.setAttribute("aria-label","Unified schema editor context");coreShell.setAttribute("aria-label","Unified canonical schema editor core");coreShell.append(coreHost);contextHost.setAttribute("aria-label","Unified schema inheritance context");chrome.append(identity,actions);input.host.replaceChildren(chrome,coreShell,contextHost);input.host.dataset.canonicalEditorMounts=String(Number(input.host.dataset.canonicalEditorMounts??0)+1);
  const controller=createUnifiedCanonicalEditorController((options)=>mountCanonicalSchemaEditor({...options,host:coreHost}),input.id);
  const renderContext=()=>{const active=controller.active();identity.textContent=active?.label??"Select a saved schema or project contributor.";actions.replaceChildren(...(active?.actions??[]).map((action)=>{const button=document.createElement("button");button.type="button";button.textContent=action.label;button.addEventListener("click",action.run);return button;}));contextHost.replaceChildren();contextHost.hidden=!active?.renderContext;if(active?.renderContext)active.renderContext(contextHost);};
  renderContext();
  return{select(adapter:UnifiedCanonicalEditorAdapter){controller.select(adapter);input.host.hidden=false;input.host.setAttribute("aria-label","Side panel schema editor region");renderContext();},close(){controller.clear();input.host.hidden=true;input.host.removeAttribute("aria-label");renderContext();},render(){renderContext();controller.render();},active:controller.active};
}

const pointer=(path:string)=>`/${path.split(/[./]/).filter(Boolean).join("/")}`;
const clone=<T>(value:T):T=>structuredClone(value);
const jsonFacetRule=(schemaId:string,nodeId:string,kind:string)=>`json-facet:${schemaId}:${nodeId}:${kind}`;
export function savedSchemaCanonicalDocument(schema:Pick<SchemaDefinition,"id"|"name"|"version"|"document"|"attachedRules"|"documentation"|"canonicalSchema">,id:(kind:string)=>string):CanonicalSchemaDocument{
  if(schema.canonicalSchema)return clone(schema.canonicalSchema);
  const canonical=canonicalSchemaFromJsonSchema({id:`canonical:saved:${schema.id}`,contributorId:schema.id,contributorName:schema.name,sourceIdentity:schema.id,sourceRevision:schema.version,document:schema.document as Record<string,unknown>,idFactory:id}),byPath=new Map(Object.values(canonical.nodes).map((node)=>[canonicalPropertyPath(canonical,node.id),node]));
  const definitionsByNodeId:Record<string,Record<string,unknown>>={};
  const visit=(definition:JsonSchema,path:string):void=>{for(const[name,child]of Object.entries(definition.properties??{})){const childPath=`${path}/${name}`,node=byPath.get(childPath),documentation=schema.documentation?.properties?.[childPath],rich=child as JsonSchema&Record<string,unknown>;if(node){definitionsByNodeId[node.id]=clone(rich);if(definition.required?.includes(name))node.presence={mode:"required"};else if(definition.forbidden?.includes(name))node.presence={mode:"forbidden"};if(node.type==="array"&&rich.items&&typeof rich.items==="object"&&typeof rich.items.type==="string")node.itemType=rich.items.type as CanonicalPropertyNode["type"];node.allowedValues=node.allowedValues.map((entry,index)=>({...entry,id:`allowed-value:${node.id}:${index}`}));if(documentation)node.documentation={displayText:documentation.displayName,description:documentation.description||node.documentation.description,comments:documentation.comments??"",example:documentation.example?{method:documentation.example.selectionMethod==="allowed value"?"allowed-value":"custom",value:clone(documentation.example.value)}:node.documentation.example};const minimum=typeof rich.minimum==="number"?rich.minimum:undefined,maximum=typeof rich.maximum==="number"?rich.maximum:undefined,minItems=typeof rich.minItems==="number"?rich.minItems:undefined,maxItems=typeof rich.maxItems==="number"?rich.maxItems:undefined;if(typeof rich.pattern==="string")node.rules.push({id:jsonFacetRule(schema.id,node.id,"pattern"),kind:"pattern",pattern:rich.pattern,severity:"error",message:"Pattern mismatch"});if(minimum!==undefined||maximum!==undefined)node.rules.push({id:jsonFacetRule(schema.id,node.id,"range"),kind:"range",...(minimum!==undefined?{minimum}:{}),...(maximum!==undefined?{maximum}:{}),severity:"error",message:"Outside range"});if(minItems!==undefined||maxItems!==undefined)node.rules.push({id:jsonFacetRule(schema.id,node.id,"cardinality"),kind:"cardinality",...(minItems!==undefined?{minItems}:{}),...(maxItems!==undefined?{maxItems}:{}),severity:"error",message:"Outside cardinality"});}visit(child,childPath);}};visit(schema.document,"");
  for(const rule of schema.attachedRules??[]){const node=byPath.get(pointer(rule.propertyPath??""));if(!node)continue;const operator=rule.operator?.replaceAll("_","-").replaceAll(" ","-").toLowerCase(),bounds=rule.parameters?.split(",")??[],number=(value:string|undefined)=>value!==undefined&&value!==""&&Number.isFinite(Number(value))?Number(value):undefined,minimum=number(bounds[0]),maximum=number(bounds[1]),kind=operator==="pattern"||operator==="regular-expression"?"pattern":operator==="range"||operator==="numeric-range"?"range":operator==="cardinality"||operator==="item-count"?"cardinality":"custom";node.rules.push({id:rule.id,kind,...(kind==="pattern"&&rule.parameters?{pattern:rule.parameters}:{}),...(kind==="range"&&minimum!==undefined?{minimum}:{}),...(kind==="range"&&maximum!==undefined?{maximum}:{}),...(kind==="cardinality"&&minimum!==undefined?{minItems:minimum}:{}),...(kind==="cardinality"&&maximum!==undefined?{maxItems:maximum}:{}),severity:rule.severity==="warning"?"warning":"error",message:rule.message??rule.name??rule.id,...(rule.id.startsWith("rule:")?{reusableRuleId:rule.id}:{})});}
  canonical.sourceContent={document:clone(schema.document as Record<string,unknown>),rules:clone((schema.attachedRules??[]) as unknown as readonly Record<string,unknown>[]),documentation:clone(schema.documentation??{}),examples:[],definitionsByNodeId};return canonical;
}

const orderedChildren=(document:CanonicalSchemaDocument,parentId?:string):CanonicalPropertyNode[]=>Object.values(document.nodes).filter((node)=>node.parentId===parentId).sort((left,right)=>left.order-right.order||left.id.localeCompare(right.id));
function jsonDefinition(document:CanonicalSchemaDocument,node:CanonicalPropertyNode):JsonSchema{
  const base=clone(document.sourceContent?.definitionsByNodeId?.[node.id]??{}) as Record<string,unknown>,children=orderedChildren(document,node.id),definition:Record<string,unknown>={...base,type:node.type};
  for(const key of["properties","required","forbidden","enum","description","examples","pattern","minimum","maximum","minItems","maxItems"])delete definition[key];
  if(node.type==="array"){const prior=base.items&&typeof base.items==="object"?clone(base.items as Record<string,unknown>):undefined;definition.items=node.itemType&&prior?.type===node.itemType?prior:{type:node.itemType??"string"};}else delete definition.items;
  if(children.length){definition.properties=Object.fromEntries(children.map((child)=>[child.name,jsonDefinition(document,child)]));const required=children.filter(({presence})=>presence.mode.startsWith("required")).map(({name})=>name),forbidden=children.filter(({presence})=>presence.mode.startsWith("forbidden")).map(({name})=>name);if(required.length)definition.required=required;if(forbidden.length)definition.forbidden=forbidden;}
  if(node.allowedValues.length)definition.enum=node.allowedValues.map(({value})=>clone(value));if(node.documentation.description)definition.description=node.documentation.description;if(node.documentation.example.method!=="blank")definition.examples=[clone(node.documentation.example.value)];
  for(const rule of node.rules.filter(({id})=>id.startsWith("json-facet:"))){if(rule.kind==="pattern"&&rule.pattern)definition.pattern=rule.pattern;if(rule.kind==="range"){if(rule.minimum!==undefined)definition.minimum=rule.minimum;if(rule.maximum!==undefined)definition.maximum=rule.maximum;}if(rule.kind==="cardinality"){if(rule.minItems!==undefined)definition.minItems=rule.minItems;if(rule.maxItems!==undefined)definition.maxItems=rule.maxItems;}}
  return definition as JsonSchema;
}
export function savedSchemaFromCanonical<T extends SchemaDefinition>(schema:T,canonical:CanonicalSchemaDocument):T{
  const roots=orderedChildren(canonical),root=clone(canonical.sourceContent?.document??{}) as Record<string,unknown>;for(const key of["properties","required","forbidden"])delete root[key];root.type="object";root.properties=Object.fromEntries(roots.map((node)=>[node.name,jsonDefinition(canonical,node)]));const rootRequired=roots.filter(({presence})=>presence.mode.startsWith("required")).map(({name})=>name),rootForbidden=roots.filter(({presence})=>presence.mode.startsWith("forbidden")).map(({name})=>name);if(rootRequired.length)root.required=rootRequired;if(rootForbidden.length)root.forbidden=rootForbidden;const document=root as JsonSchema,attachedRules:AttachedSchemaRule[]=[],properties:Record<string,NonNullable<NonNullable<SchemaDefinition["documentation"]>["properties"]>[string]>={};
  for(const node of Object.values(canonical.nodes)){
    const path=canonicalPropertyPath(canonical,node.id),priorDocumentation=schema.documentation?.properties?.[path],example=node.documentation.example.method==="blank"?undefined:{value:structuredClone(node.documentation.example.value) as string|number|boolean|null,selectionMethod:node.documentation.example.method==="allowed-value"?"allowed value" as const:"custom" as const};
    if(node.documentation.displayText||node.documentation.comments||priorDocumentation||node.documentation.example.method==="allowed-value")properties[path]={displayName:node.documentation.displayText,description:node.documentation.description,...(node.documentation.comments?{comments:node.documentation.comments}:{}),...(example?{example}:{})};
    for(const rule of node.rules){if(rule.id.startsWith("json-facet:"))continue;const prior=(schema.attachedRules??[]).find(({id})=>id===rule.id),operator=rule.kind==="pattern"?(prior?.operator??"regular-expression"):rule.kind==="range"?"numeric-range":rule.kind==="cardinality"?"item-count":prior?.operator??rule.kind,parameters=rule.kind==="pattern"?rule.pattern:rule.kind==="range"?`${rule.minimum??""},${rule.maximum??""}`:rule.kind==="cardinality"?`${rule.minItems??""},${rule.maxItems??""}`:prior?.parameters;attachedRules.push({...prior,id:rule.id,version:prior?.version??1,propertyPath:prior?.propertyPath??path,operator,...(parameters!==undefined?{parameters}:{}),severity:rule.severity,message:rule.message});}
  }
  const clean=(value:JsonSchema):JsonSchema=>{const next=structuredClone(value) as JsonSchema&{attachedRules?:unknown};delete next.attachedRules;if(next.required&&!next.required.length)delete next.required;for(const child of Object.values(next.properties??{}))clean(child);return next;};
  const documentation={...(schema.documentation?.description?{description:schema.documentation.description}:{}),...(Object.keys(properties).length?{properties}:{})};
  const {attachedRules:_attachedRules,documentation:_documentation,canonicalSchema:_canonicalSchema,...current}=schema;return{...current,document:clean(document),...(attachedRules.length?{attachedRules}:{}),...(Object.keys(documentation).length?{documentation}:{}),canonicalSchema:clone(canonical)} as unknown as T;
}
