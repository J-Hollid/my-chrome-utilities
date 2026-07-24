import type {CanonicalPropertyNode} from "../data-layer-canonical-schema.js";
import type {CanonicalFocusedSectionContext} from "../data-layer-canonical-schema-focused-sections.js";
import {canonicalFacetText} from "../data-layer-canonical-schema-facets.js";
import {input,labeled} from "./dom.js";

export function renderExampleFacet(host:HTMLElement,context:CanonicalFocusedSectionContext,working:CanonicalPropertyNode):void {
  const {dom}=context,method=dom.createElement("select"),value=input(dom,"exampleValue",canonicalFacetText(working.documentation.example.value));method.name="exampleMethod";method.append(...(["allowed-value","custom","blank"] as const).map((entry)=>new Option(entry,entry)));method.value=working.documentation.example.method;method.addEventListener("change",()=>{const next=context.getWorking();if(next)next.documentation={...next.documentation,example:{method:method.value as "allowed-value"|"custom"|"blank",value:method.value==="blank"?undefined:value.value}};});value.addEventListener("input",()=>{const next=context.getWorking();if(next)next.documentation={...next.documentation,example:{method:method.value as "allowed-value"|"custom"|"blank",value:value.value}};});host.append(labeled(dom,"Example method",method),labeled(dom,"Example value",value));
}
