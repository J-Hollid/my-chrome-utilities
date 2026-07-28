import type {CanonicalPropertyNode} from "../data-layer-canonical-schema.js";
import type {CanonicalFocusedSectionContext} from "../data-layer-canonical-schema-focused-sections.js";
import {canonicalFacetText,typedCanonicalValue} from "../data-layer-canonical-schema-facets.js";
import {input,labeled} from "./dom.js";

export function renderExampleFacet(host:HTMLElement,context:CanonicalFocusedSectionContext,working:CanonicalPropertyNode):void {
  const {dom}=context,method=dom.createElement("select"),value=input(dom,"exampleValue",canonicalFacetText(working.documentation.example.value)),issue=dom.createElement("output"),stage=()=>{const next=context.getWorking();if(!next)return;try{next.documentation={...next.documentation,example:method.value==="blank"?{method:"blank"}:{method:method.value as "allowed-value"|"custom",value:typedCanonicalValue(next.type,value.value,next.itemSchema)}};value.setCustomValidity("");issue.textContent="";}catch(error){const message=error instanceof Error?error.message:String(error);value.setCustomValidity(message);issue.textContent=message;}};method.name="exampleMethod";method.append(...(["allowed-value","custom","blank"] as const).map((entry)=>new Option(entry,entry)));method.value=working.documentation.example.method;issue.setAttribute("role","status");issue.setAttribute("aria-label","Custom example diagnostic");method.addEventListener("change",stage);value.addEventListener("input",stage);host.append(labeled(dom,"Example method",method),labeled(dom,"Example value",value),issue);
}
