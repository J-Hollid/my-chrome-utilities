import type {LayerConstraint} from "../data-layer-layered-schema.js";
import type {ComposedFacetDraft,ComposedPropertyChoice} from "./builder-types.js";
export interface BuilderOptions {host:HTMLElement;path:string;local:LayerConstraint;effective:LayerConstraint;inherited?:LayerConstraint|undefined;propertyChoices:ComposedPropertyChoice[];includeConditionEvaluation?:boolean;onSave:(facets:Omit<LayerConstraint,"path">)=>void;}
export interface BuilderRenderContext {options:BuilderOptions;draft:()=>ComposedFacetDraft;setDraft:(next:ComposedFacetDraft)=>void;feedback:()=>string;setFeedback:(value:string)=>void;render:()=>void;}
export const clone=<T>(value:T):T=>structuredClone(value);
export const labeled=(text:string,control:HTMLElement):HTMLLabelElement=>{const label=document.createElement("label");label.append(text,control);return label;};
export const button=(text:string,run:()=>void):HTMLButtonElement=>{const control=document.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
export const option=(value:string,label=value):HTMLOptionElement=>new Option(label,value);
