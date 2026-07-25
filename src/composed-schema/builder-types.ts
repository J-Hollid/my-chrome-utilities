import type {LayerConstraint,LayerValueProvenance} from "../data-layer-layered-schema.js";

export type ConditionPredicate={kind:"predicate";id?:string;propertyId:string;operator:string;value?:unknown};
export type ConditionGroup={kind:"all"|"any"|"not";id?:string;children:ComposedCondition[]};
export type ComposedCondition=ConditionPredicate|ConditionGroup;
export interface ComposedPropertyChoice {path:string;definitionId:string;type?:string|undefined;}
export interface ComposedFacetDraft {
  type?:string|undefined;itemType?:string|undefined;presence?:LayerConstraint["presence"]|undefined;expectedValue?:unknown;allowedValues:unknown[];allowedValueIds?:string[];allowedValueProvenance?:LayerValueProvenance[];
  condition:ConditionGroup;rules:Record<string,unknown>[];documentation:string;exampleMethod:"allowed-value"|"custom"|"blank";exampleValue?:unknown;
}
