export {compileLayeredSchema} from "./layered-schema/compile.js";
export {exportLayeredSchema} from "./layered-schema/export.js";
export {validateLayeredObservation} from "./layered-schema/validation.js";
export {resolveLayeredTarget,type LayerPredicate,type LayerResolution,type LayerTarget} from "./layered-schema/targets.js";
export type LayerScope="Shared Profile"|"Event"|"Page Group"|"Page"|"Flow Page-instance"|"Event-occurrence";
export type LayerPresence="required"|"optional"|"forbidden"|"permitted";
export type LayerActivation="automatic"|"manual"|"documentation-only";
export interface LayerConstraint{path:string;type?:string;itemType?:string;allowedValues?:readonly unknown[];allowedValueIds?:readonly string[];presence?:LayerPresence;patterns?:readonly string[];minimum?:number;maximum?:number;minItems?:number;maxItems?:number;rules?:readonly Record<string,unknown>[];reusableRules?:readonly Record<string,unknown>[];expectedValue?:unknown;enforcement?:"invariant"|"overridable";target?:string;condition?:Record<string,unknown>;documentation?:string;examples?:readonly unknown[];definitionId?:string;overrideReferences?:readonly string[]}
export interface LayerContributor{id:string;name:string;scope:LayerScope;revision?:number;constraints:readonly LayerConstraint[];active?:boolean;applicabilityConditional?:boolean;exclusionReason?:string}
export interface LayerContext{eventId:string;eventRole:"context"|"interaction";occurrenceId?:string}
export interface EffectiveProperty extends LayerConstraint{origins:{contributorId:string;contributorName:string;scope:LayerScope}[];superseded:{contributorId:string;contributorName:string;value:unknown}[];expectedContributor?:string}
export interface LayerConflict{path:string;message:string;contributors:string[]}
export interface CompiledLayeredSchema{status:"ready"|"blocked";properties:Record<string,EffectiveProperty>;conflicts:LayerConflict[];provenance:{contributorId:string;contributorName:string;scope:LayerScope}[];exclusions:{contributorId:string;contributorName:string;path:string;target:string}[]}
