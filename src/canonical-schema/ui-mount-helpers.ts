import {focusedPropertySectionLabels,type FocusedPropertySection} from "../data-layer-focused-schema-property-ui.js";
import type {CanonicalPresenceMode,CanonicalPropertyNode} from "../data-layer-canonical-schema.js";
export const clone=<T>(value:T):T=>structuredClone(value);
export const provenanceText=(node:CanonicalPropertyNode):string=>node.provenance.map(({source,contributorName,scope,state})=>contributorName?`${scope??"source"} ${contributorName}${state?` ${state}`:""}`:source).join(" → ")||"created";
export const presenceText=(mode:CanonicalPresenceMode):string=>({optional:"Optional",required:"Required","required-when":"Required when",forbidden:"Forbidden","forbidden-when":"Forbidden when"})[mode];
export const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
export const sectionLabel=(section:FocusedPropertySection):string=>focusedPropertySectionLabels[section];
