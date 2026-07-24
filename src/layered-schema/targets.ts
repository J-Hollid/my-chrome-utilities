import type {CompiledLayeredSchema,LayerActivation} from "../data-layer-layered-schema.js";

export interface LayerPredicate{name:string;field:string;operator:"equals"|"matches";value:unknown}
export interface LayerTarget{id:string;name:string;activation:LayerActivation;priority:number;applicability:readonly LayerPredicate[];compiled:CompiledLayeredSchema}
export interface LayerResolution{selectionMode?:"automatic"|"manual";winner?:LayerTarget;candidates:{id:string;name:string;matched:boolean;priority:number;reasons:string[]}[];ties:string[]}

const same=(left:unknown,right:unknown):boolean=>JSON.stringify(left)===JSON.stringify(right);
const matches=(predicate:LayerPredicate,observation:Record<string,unknown>):boolean=>predicate.operator==="equals"?same(observation[predicate.field],predicate.value):new RegExp(String(predicate.value)).test(String(observation[predicate.field]??""));

export function resolveLayeredTarget(targets:readonly LayerTarget[],observation:Record<string,unknown>,options:{manualTargetId?:string}={}):LayerResolution{
  if(options.manualTargetId){const winner=targets.find(({id,activation})=>id===options.manualTargetId&&activation==="manual");return{...(winner?{selectionMode:"manual" as const,winner}:{}),candidates:winner?[{id:winner.id,name:winner.name,matched:true,priority:winner.priority,reasons:[]}]:[],ties:[]};}
  const eligible=targets.filter(({activation})=>activation==="automatic"),candidates=eligible.map((target)=>{const reasons=target.applicability.filter((predicate)=>!matches(predicate,observation)).map(({name})=>`${name} did not match`);return{id:target.id,name:target.name,matched:reasons.length===0,priority:target.priority,reasons};}),matched=candidates.filter((candidate)=>candidate.matched).sort((left,right)=>right.priority-left.priority),highest=matched[0]?.priority,ties=matched.filter(({priority})=>priority===highest).map(({id})=>id),winner=ties.length===1?eligible.find(({id})=>id===ties[0]):undefined;return{...(winner?{selectionMode:"automatic" as const,winner}:{}),candidates,ties};
}
