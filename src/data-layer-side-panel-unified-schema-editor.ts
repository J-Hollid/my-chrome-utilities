import {canonicalPropertyPath,canonicalSchemaFromJsonSchema,type CanonicalCommand,type CanonicalPredicate,type CanonicalPredicateGroup,type CanonicalPredicateLeaf,type CanonicalPredicateOperator,type CanonicalPresenceMode,type CanonicalPropertyNode,type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import type {AttachedSchemaRule,JsonSchema,SchemaDefinition} from "./data-layer-schema-verification.js";

const pointer=(path:string)=>`/${path.split(/[./]/).filter(Boolean).join("/")}`;
const clone=<T>(value:T):T=>structuredClone(value);
const jsonFacetRule=(schemaId:string,nodeId:string,kind:string)=>`json-facet:${schemaId}:${nodeId}:${kind}`;
const compactOperator=(operator:CanonicalPredicateOperator)=>({"Greater than":"Is greater than","At least":"Is at least","Less than":"Is less than","At most":"Is at most"} as const)[operator as "Greater than"|"At least"|"Less than"|"At most"]??operator;
const canonicalOperator=(operator:string):CanonicalPredicateOperator=>({"Is greater than":"Greater than","Is at least":"At least","Is less than":"Less than","Is at most":"At most"} as const)[operator as "Is greater than"|"Is at least"|"Is less than"|"Is at most"]??operator as CanonicalPredicateOperator;
const compactComparison=(value:unknown)=>value===null?{type:"null" as const,value:null}:typeof value==="string"?{type:"string" as const,value}:typeof value==="number"?{type:"number" as const,value}:typeof value==="boolean"?{type:"boolean" as const,value}:undefined;
function compactRuleCondition(document:CanonicalSchemaDocument,condition:CanonicalPredicate|undefined):AttachedSchemaRule["conditionGroup"]{
  if(!condition)return undefined;
  let group:CanonicalPredicateGroup|undefined,leaves:CanonicalPredicateLeaf[];
  if(condition.kind==="predicate")leaves=[condition];
  else if((condition.kind==="all"||condition.kind==="any")&&condition.children.every((child)=>child.kind==="predicate")){group=condition;leaves=condition.children as CanonicalPredicateLeaf[];}
  else return undefined;
  return{operator:group?.kind==="any"?"Any":"All",predicates:leaves.flatMap((leaf)=>{const node=document.nodes[leaf.propertyId];if(!node)return[];const comparison=compactComparison(leaf.value);return[{propertyPath:canonicalPropertyPath(document,node.id),operator:compactOperator(leaf.operator),...(comparison?{comparison}:{}),detectedType:node.type==="integer"?"number":node.type}];})};
}
function canonicalRuleCondition(document:CanonicalSchemaDocument,group:AttachedSchemaRule["conditionGroup"]):CanonicalPredicate|undefined{
  if(!group)return undefined;const byPath=new Map(Object.values(document.nodes).map((node)=>[canonicalPropertyPath(document,node.id),node.id])),children=group.predicates.flatMap((predicate)=>{const propertyId=byPath.get(pointer(predicate.propertyPath));if(!propertyId)return[];const value=predicate.comparison?.value;return[{kind:"predicate" as const,propertyId,operator:canonicalOperator(predicate.operator),...(value!==undefined?{value}:predicate.comparison?.type==="null"?{value:null}:{})}];});
  if(!children.length)return undefined;return children.length===1?children[0]:{kind:group.operator==="Any"?"any":"all",children};
}

export function compactSchemaProjection(document:CanonicalSchemaDocument,identity:{id:string;name:string;version:number}):SchemaDefinition{
  const base:SchemaDefinition={
    ...identity,
    published:false,
    assignments:[],
    document:{type:"object"},
  };
  const projected=savedSchemaFromCanonical(base,document);
  const {canonicalSchema:_canonicalSchema,...compact}=projected;
  return compact;
}

export function compactConditionalPresence(mode:Extract<CanonicalPresenceMode,"required-when"|"forbidden-when">,propertyId:string,operator:CanonicalPredicateOperator,value?:unknown):CanonicalPropertyNode["presence"]{
  return{mode,condition:{kind:"predicate",propertyId,operator,...(!operator.includes("exist")&&!operator.includes("Exist")?{value}:{})}};
}

const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
const presenceFamily=(mode:CanonicalPropertyNode["presence"]["mode"]):"required"|"forbidden"|"optional"=>mode.startsWith("required")?"required":mode.startsWith("forbidden")?"forbidden":"optional";
const valuesWithStableIds=(current:CanonicalPropertyNode["allowedValues"],next:CanonicalPropertyNode["allowedValues"],id:(kind:string)=>string)=>next.map((entry,index)=>{
  const prior=current[index];
  return prior&&same(prior.value,entry.value)?{...entry,id:prior.id}:{...entry,id:id("allowed-value")};
});
const rulesWithStableConditions=(current:CanonicalPropertyNode["rules"],next:CanonicalPropertyNode["rules"]):CanonicalPropertyNode["rules"]=>next.map((rule)=>{
  const prior=current.find(({id})=>id===rule.id);
  return prior?.condition&&!rule.condition?{...rule,condition:clone(prior.condition)}:rule;
});

export function canonicalCommandsFromCompactProjection(document:CanonicalSchemaDocument,projection:SchemaDefinition,id:(kind:string)=>string):CanonicalCommand[]{
  const {canonicalSchema:_canonicalSchema,...source}=projection;
  const parsed=savedSchemaCanonicalDocument(source,id),parsedByPath=new Map(Object.values(parsed.nodes).map((node)=>[canonicalPropertyPath(parsed,node.id),node])),currentByPath=new Map(Object.values(document.nodes).map((node)=>[canonicalPropertyPath(document,node.id),node]));
  const commands:CanonicalCommand[]=[];
  let revision=document.revision;
  const removedPaths=new Set([...currentByPath.keys()].filter((path)=>!parsedByPath.has(path)));
  for(const [path,current] of [...currentByPath].filter(([candidatePath])=>removedPaths.has(candidatePath)&&!candidatePath.split("/").slice(1,-1).some((_,index)=>removedPaths.has(`/${candidatePath.split("/").slice(1,index+2).join("/")}`)))){
    commands.push({kind:"delete",baseRevision:revision++,propertyId:current.id});
  }
  const addedIdsByPath=new Map<string,string>();
  for(const [path,candidate] of [...parsedByPath].filter(([candidatePath])=>!currentByPath.has(candidatePath)).sort(([left],[right])=>left.split("/").length-right.split("/").length)){
    const parentPath=path.split("/").slice(0,-1).join("/"),parentId=parentPath?(currentByPath.get(parentPath)?.id??addedIdsByPath.get(parentPath)):undefined,nodeId=candidate.id;
    commands.push({kind:"add",baseRevision:revision++,name:candidate.name,type:candidate.type,...(parentId?{parentId}:{}),id:()=>nodeId});
    addedIdsByPath.set(path,nodeId);
    if(candidate.itemType)commands.push({kind:"type",baseRevision:revision++,propertyId:nodeId,type:candidate.type,itemType:candidate.itemType,confirmed:true});
    const facets={presence:candidate.presence,allowedValues:candidate.allowedValues,rules:candidate.rules,documentation:candidate.documentation},defaults={presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:"",description:"",comments:"",example:{method:"blank"}}};
    if(!same(facets,defaults))commands.push({kind:"set",baseRevision:revision++,propertyId:nodeId,patch:clone(facets)});
  }
  for(const current of Object.values(document.nodes)){
    const path=canonicalPropertyPath(document,current.id),candidate=parsedByPath.get(path);
    if(!candidate)continue;
    if(current.type!==candidate.type||current.itemType!==candidate.itemType){
      commands.push({kind:"type",baseRevision:revision++,propertyId:current.id,type:candidate.type,...(candidate.itemType?{itemType:candidate.itemType}:{}),confirmed:true});
    }
    const candidatePresence=presenceFamily(candidate.presence.mode)===presenceFamily(current.presence.mode)
      ? current.presence
      : candidate.presence;
    const patch={
      presence:clone(candidatePresence),
      allowedValues:valuesWithStableIds(current.allowedValues,candidate.allowedValues,id),
      rules:rulesWithStableConditions(current.rules,candidate.rules),
      documentation:clone(candidate.documentation),
    };
    const currentFacets={presence:current.presence,allowedValues:current.allowedValues,rules:current.rules,documentation:current.documentation};
    if(!same(currentFacets,patch))commands.push({kind:"set",baseRevision:revision++,propertyId:current.id,patch});
  }
  return commands;
}

export function savedSchemaCanonicalDocument(schema:Pick<SchemaDefinition,"id"|"name"|"version"|"document"|"attachedRules"|"documentation"|"canonicalSchema">,id:(kind:string)=>string):CanonicalSchemaDocument{
  if(schema.canonicalSchema)return clone(schema.canonicalSchema);
  const canonical=canonicalSchemaFromJsonSchema({id:`canonical:saved:${schema.id}`,contributorId:schema.id,contributorName:schema.name,sourceIdentity:schema.id,sourceRevision:schema.version,document:schema.document as Record<string,unknown>,idFactory:id}),byPath=new Map(Object.values(canonical.nodes).map((node)=>[canonicalPropertyPath(canonical,node.id),node]));
  const definitionsByNodeId:Record<string,Record<string,unknown>>={};
  const visit=(definition:JsonSchema,path:string):void=>{for(const[name,child]of Object.entries(definition.properties??{})){const childPath=`${path}/${name}`,node=byPath.get(childPath),documentation=schema.documentation?.properties?.[childPath],rich=child as JsonSchema&Record<string,unknown>;if(node){definitionsByNodeId[node.id]=clone(rich);if(definition.required?.includes(name))node.presence={mode:"required"};else if(definition.forbidden?.includes(name))node.presence={mode:"forbidden"};if(node.type==="array"&&rich.items&&typeof rich.items==="object"&&typeof rich.items.type==="string")node.itemType=rich.items.type as CanonicalPropertyNode["type"];node.allowedValues=node.allowedValues.map((entry,index)=>({...entry,id:`allowed-value:${node.id}:${index}`}));if(documentation)node.documentation={displayText:documentation.displayName,description:documentation.description||node.documentation.description,comments:documentation.comments??"",example:documentation.example?{method:documentation.example.selectionMethod==="allowed value"?"allowed-value":"custom",value:clone(documentation.example.value)}:node.documentation.example};const minimum=typeof rich.minimum==="number"?rich.minimum:undefined,maximum=typeof rich.maximum==="number"?rich.maximum:undefined,minItems=typeof rich.minItems==="number"?rich.minItems:undefined,maxItems=typeof rich.maxItems==="number"?rich.maxItems:undefined;if(typeof rich.pattern==="string")node.rules.push({id:jsonFacetRule(schema.id,node.id,"pattern"),kind:"pattern",pattern:rich.pattern,severity:"error",message:"Pattern mismatch"});if(minimum!==undefined||maximum!==undefined)node.rules.push({id:jsonFacetRule(schema.id,node.id,"range"),kind:"range",...(minimum!==undefined?{minimum}:{}),...(maximum!==undefined?{maximum}:{}),severity:"error",message:"Outside range"});if(minItems!==undefined||maxItems!==undefined)node.rules.push({id:jsonFacetRule(schema.id,node.id,"cardinality"),kind:"cardinality",...(minItems!==undefined?{minItems}:{}),...(maxItems!==undefined?{maxItems}:{}),severity:"error",message:"Outside cardinality"});}visit(child,childPath);}};visit(schema.document,"");
  for(const rule of schema.attachedRules??[]){const node=byPath.get(pointer(rule.propertyPath??""));if(!node)continue;const operator=rule.operator?.replaceAll("_","-").replaceAll(" ","-").toLowerCase(),bounds=rule.parameters?.split(",")??[],number=(value:string|undefined)=>value!==undefined&&value!==""&&Number.isFinite(Number(value))?Number(value):undefined,minimum=number(bounds[0]),maximum=number(bounds[1]),kind=operator==="pattern"||operator==="regular-expression"?"pattern":operator==="range"||operator==="numeric-range"?"range":operator==="cardinality"||operator==="item-count"?"cardinality":"custom",condition=canonicalRuleCondition(canonical,rule.conditionGroup);node.rules.push({id:rule.id,kind,...(kind==="pattern"&&rule.parameters?{pattern:rule.parameters}:{}),...(kind==="range"&&minimum!==undefined?{minimum}:{}),...(kind==="range"&&maximum!==undefined?{maximum}:{}),...(kind==="cardinality"&&minimum!==undefined?{minItems:minimum}:{}),...(kind==="cardinality"&&maximum!==undefined?{maxItems:maximum}:{}),...(condition?{condition}:{}),severity:rule.severity==="warning"?"warning":"error",message:rule.message??rule.name??rule.id,...(rule.id.startsWith("rule:")?{reusableRuleId:rule.id}:{})});}
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
    for(const rule of node.rules){if(rule.id.startsWith("json-facet:"))continue;const prior=(schema.attachedRules??[]).find(({id})=>id===rule.id),operator=rule.kind==="pattern"?(prior?.operator??"regular-expression"):rule.kind==="range"?"numeric-range":rule.kind==="cardinality"?"item-count":prior?.operator??rule.kind,parameters=rule.kind==="pattern"?rule.pattern:rule.kind==="range"?`${rule.minimum??""},${rule.maximum??""}`:rule.kind==="cardinality"?`${rule.minItems??""},${rule.maxItems??""}`:prior?.parameters,propertyPath=prior?.propertyPath&&pointer(prior.propertyPath)===path?prior.propertyPath:path,conditionGroup=compactRuleCondition(canonical,rule.condition);attachedRules.push({...prior,id:rule.id,version:prior?.version??1,propertyPath,operator,...(parameters!==undefined?{parameters}:{}),...(conditionGroup?{conditionGroup}:{}),severity:rule.severity,message:rule.message});}
  }
  const clean=(value:JsonSchema):JsonSchema=>{const next=structuredClone(value) as JsonSchema&{attachedRules?:unknown};delete next.attachedRules;if(next.required&&!next.required.length)delete next.required;for(const child of Object.values(next.properties??{}))clean(child);return next;};
  const documentation={...(schema.documentation?.description?{description:schema.documentation.description}:{}),...(Object.keys(properties).length?{properties}:{})};
  const {attachedRules:_attachedRules,documentation:_documentation,canonicalSchema:_canonicalSchema,...current}=schema;return{...current,document:clean(document),...(attachedRules.length?{attachedRules}:{}),...(Object.keys(documentation).length?{documentation}:{}),canonicalSchema:clone(canonical)} as unknown as T;
}
