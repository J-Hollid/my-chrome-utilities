export type LayerScope="Shared Profile"|"Event"|"Page Group"|"Page"|"Flow Page-instance"|"Event-occurrence";
export type LayerPresence="required"|"optional"|"forbidden"|"permitted";
export type LayerActivation="automatic"|"manual"|"documentation-only";
export interface LayerConstraint{path:string;type?:string;allowedValues?:readonly unknown[];presence?:LayerPresence;patterns?:readonly string[];rules?:readonly Record<string,unknown>[];expectedValue?:unknown;enforcement?:"invariant"|"overridable";target?:string;condition?:Record<string,unknown>;documentation?:string;examples?:readonly unknown[]}
export interface LayerContributor{id:string;name:string;scope:LayerScope;constraints:readonly LayerConstraint[]}
export interface LayerContext{eventId:string;eventRole:"context"|"interaction";occurrenceId?:string}
export interface EffectiveProperty extends LayerConstraint{origins:{contributorId:string;contributorName:string;scope:LayerScope}[];superseded:{contributorId:string;contributorName:string;value:unknown}[];expectedContributor?:string}
export interface LayerConflict{path:string;message:string;contributors:string[]}
export interface CompiledLayeredSchema{status:"ready"|"blocked";properties:Record<string,EffectiveProperty>;conflicts:LayerConflict[];provenance:{contributorId:string;contributorName:string;scope:LayerScope}[];exclusions:{contributorId:string;contributorName:string;path:string;target:string}[]}

const clone=<T>(value:T):T=>structuredClone(value);
const included=(target:string|undefined,context:LayerContext):boolean=>!target||target==="all"||target===context.eventRole||target===context.eventId||target===context.occurrenceId;
const origin=(contributor:LayerContributor)=>({contributorId:contributor.id,contributorName:contributor.name,scope:contributor.scope});
const same=(left:unknown,right:unknown)=>JSON.stringify(left)===JSON.stringify(right);

export function compileLayeredSchema(contributors:readonly LayerContributor[],context:LayerContext):CompiledLayeredSchema{
  const properties:Record<string,EffectiveProperty>={},conflicts:LayerConflict[]=[],provenance=contributors.map(origin),exclusions:CompiledLayeredSchema["exclusions"]=[];
  const conflict=(path:string,message:string,names:string[])=>conflicts.push({path,message,contributors:names});
  for(const contributor of contributors)for(const constraint of contributor.constraints){
    if(!included(constraint.target,context)){exclusions.push({contributorId:contributor.id,contributorName:contributor.name,path:constraint.path,target:constraint.target??"all"});continue;}
    const prior=properties[constraint.path],source=origin(contributor);
    if(!prior){properties[constraint.path]={...clone(constraint),origins:[source],superseded:[],...(constraint.expectedValue!==undefined?{expectedContributor:contributor.name}:{})};continue;}
    const next:EffectiveProperty={...prior,origins:[...prior.origins,source],superseded:[...prior.superseded]};
    if(constraint.type&&prior.type&&constraint.type!==prior.type)conflict(constraint.path,"type cannot change",[prior.origins.at(-1)!.contributorName,contributor.name]);else if(constraint.type)next.type=constraint.type;
    if(constraint.allowedValues){if(prior.allowedValues){const narrowed=constraint.allowedValues.filter((value)=>prior.allowedValues!.some((base)=>same(base,value)));if(narrowed.length!==constraint.allowedValues.length)conflict(constraint.path,`${String(constraint.allowedValues.find((value)=>!prior.allowedValues!.some((base)=>same(base,value))))} is outside the base allowed universe`,[prior.origins.at(-1)!.contributorName,contributor.name]);else next.allowedValues=clone(narrowed);}else next.allowedValues=clone(constraint.allowedValues);}
    if(prior.presence==="required"&&constraint.presence==="optional")conflict(constraint.path,"required cannot be silently relaxed",[prior.origins.at(-1)!.contributorName,contributor.name]);else if(prior.presence==="forbidden"&&constraint.presence==="permitted")conflict(constraint.path,"a forbidden property cannot be re-enabled",[prior.origins.at(-1)!.contributorName,contributor.name]);else if(constraint.presence)next.presence=constraint.presence;
    if(constraint.patterns)next.patterns=[...(prior.patterns??[]),...constraint.patterns];
    if(constraint.rules)next.rules=[...(prior.rules??[]),...constraint.rules.map(clone)];
    if(constraint.expectedValue!==undefined){if(prior.expectedValue!==undefined&&!same(prior.expectedValue,constraint.expectedValue)){if(prior.enforcement==="invariant")conflict(constraint.path,`invariant expectation ${String(prior.expectedValue)} cannot be replaced by ${String(constraint.expectedValue)}`,[prior.expectedContributor??prior.origins.at(-1)!.contributorName,contributor.name]);else next.superseded.push({contributorId:prior.origins.at(-1)!.contributorId,contributorName:prior.expectedContributor??prior.origins.at(-1)!.contributorName,value:clone(prior.expectedValue)});}next.expectedValue=clone(constraint.expectedValue);next.expectedContributor=contributor.name;next.enforcement=constraint.enforcement??"overridable";}
    if(constraint.condition)next.condition=clone(constraint.condition);if(constraint.documentation)next.documentation=constraint.documentation;if(constraint.examples)next.examples=clone(constraint.examples);
    properties[constraint.path]=next;
  }
  return{status:conflicts.length?"blocked":"ready",properties,conflicts,provenance,exclusions};
}

export interface LayerPredicate{name:string;field:string;operator:"equals"|"matches";value:unknown}
export interface LayerTarget{id:string;name:string;activation:LayerActivation;priority:number;applicability:readonly LayerPredicate[];compiled:CompiledLayeredSchema}
export interface LayerResolution{selectionMode?:"automatic"|"manual";winner?:LayerTarget;candidates:{id:string;name:string;matched:boolean;priority:number;reasons:string[]}[];ties:string[]}
const matches=(predicate:LayerPredicate,observation:Record<string,unknown>)=>predicate.operator==="equals"?same(observation[predicate.field],predicate.value):new RegExp(String(predicate.value)).test(String(observation[predicate.field]??""));
export function resolveLayeredTarget(targets:readonly LayerTarget[],observation:Record<string,unknown>,options:{manualTargetId?:string}={}):LayerResolution{
  if(options.manualTargetId){const winner=targets.find(({id,activation})=>id===options.manualTargetId&&activation==="manual");return{...(winner?{selectionMode:"manual" as const,winner}:{}),candidates:winner?[{id:winner.id,name:winner.name,matched:true,priority:winner.priority,reasons:[]}]:[],ties:[]};}
  const eligible=targets.filter(({activation})=>activation==="automatic"),candidates=eligible.map((target)=>{const reasons=target.applicability.filter((predicate)=>!matches(predicate,observation)).map(({name})=>`${name} did not match`);return{id:target.id,name:target.name,matched:reasons.length===0,priority:target.priority,reasons};}),matched=candidates.filter((candidate)=>candidate.matched).sort((left,right)=>right.priority-left.priority),highest=matched[0]?.priority,ties=matched.filter(({priority})=>priority===highest).map(({id})=>id),winner=ties.length===1?eligible.find(({id})=>id===ties[0]):undefined;return{...(winner?{selectionMode:"automatic" as const,winner}:{}),candidates,ties};
}

const valueAt=(payload:Record<string,unknown>,path:string):unknown=>path.split("/").filter(Boolean).reduce<unknown>((value,key)=>value&&typeof value==="object"?(value as Record<string,unknown>)[key]:undefined,payload);
export function validateLayeredObservation(target:{targetId:string;targetName:string;revision:number;compiled:CompiledLayeredSchema},payload:Record<string,unknown>){const issues=Object.entries(target.compiled.properties).flatMap(([path,property])=>property.expectedValue!==undefined&&!same(valueAt(payload,path),property.expectedValue)?[{path,code:"EXPECTED_VALUE" as const,severity:"error" as const,expected:clone(property.expectedValue),actual:clone(valueAt(payload,path)),provenance:property.expectedContributor??property.origins.at(-1)?.contributorName??target.targetName}]:[]);return{selectedTargetId:target.targetId,selectedTargetName:target.targetName,effectiveSchemaRevision:target.revision,issues,provenance:target.compiled.provenance};}
export function exportLayeredSchema(input:{targetName:string;pageName:string;eventName:string;activation:LayerActivation;compiled:CompiledLayeredSchema}):string{const rows=Object.entries(input.compiled.properties).map(([path,property])=>`${path}: ${property.expectedValue!==undefined?`equals ${String(property.expectedValue)}`:property.type??"constraint"} (${property.origins.map(({contributorName})=>contributorName).join(" → ")})`);return[`${input.targetName} · ${input.pageName} · ${input.eventName}`,...rows,input.activation==="documentation-only"?"Documentation only — not automatically validated":`Activation: ${input.activation}`].join("\n");}
