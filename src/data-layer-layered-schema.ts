export {compileLayeredSchema} from "./layered-schema/compile.js";
export {exportLayeredSchema} from "./layered-schema/export.js";
export {validateLayeredObservation} from "./layered-schema/validation.js";
export {layeredConditionMatches,resolveConditionalLayeredSchema} from "./layered-schema/conditional-rules.js";
export {resolveLayeredTarget,type LayerPredicate,type LayerResolution,type LayerTarget} from "./layered-schema/targets.js";
export type LayerScope="Shared Profile"|"Event"|"Page Group"|"Page"|"Flow Page-instance"|"Event-occurrence";
export type LayerPresence="required"|"optional"|"forbidden"|"permitted";
export type LayerActivation="automatic"|"manual"|"documentation-only";
export interface LayerValueProvenance{id:string;state:"inherited"|"local"|"overridden";contributorId?:string;source?:string;}
export interface LayerItemSchema{id:string;type?:string;items?:LayerItemSchema;allowedValues?:readonly unknown[]}
export interface LayerConstraint{path:string;concept?:string;type?:string;itemType?:string;itemSchema?:LayerItemSchema;allowedValues?:readonly unknown[];allowedValueIds?:readonly string[];allowedValueProvenance?:readonly LayerValueProvenance[];presence?:LayerPresence;patterns?:readonly string[];minimum?:number;maximum?:number;minItems?:number;maxItems?:number;rules?:readonly Record<string,unknown>[];reusableRules?:readonly Record<string,unknown>[];expectedValue?:unknown;enforcement?:"invariant"|"overridable";target?:string;condition?:Record<string,unknown>;displayText?:string;documentation?:string;comments?:string;examples?:readonly unknown[];definitionId?:string;overrideReferences?:readonly string[]}
export interface LayerContributor{id:string;name:string;scope:LayerScope;revision?:number;constraints:readonly LayerConstraint[];onlyDefinedFields?:boolean;active?:boolean;applicabilityConditional?:boolean;applicabilitySetId?:string;applicabilitySetName?:string;applicabilityCondition?:Record<string,unknown>;exclusionReason?:string}
export interface LayerContext{eventId:string;eventRole:"context"|"interaction";occurrenceId?:string}
export interface EffectiveProperty extends LayerConstraint{origins:{contributorId:string;contributorName:string;scope:LayerScope}[];superseded:{contributorId:string;contributorName:string;value:unknown}[];expectedContributor?:string}
export interface LayerConflict{path:string;message:string;contributors:string[]}
export interface CompiledLayeredSchema{status:"ready"|"blocked";properties:Record<string,EffectiveProperty>;conflicts:LayerConflict[];provenance:{contributorId:string;contributorName:string;scope:LayerScope}[];exclusions:{contributorId:string;contributorName:string;path:string;target:string}[];onlyDefinedFields?:boolean}
