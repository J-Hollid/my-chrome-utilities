import type {CanonicalPropertyNode} from "../data-layer-canonical-schema.js";
import type {CanonicalFocusedSectionContext} from "../data-layer-canonical-schema-focused-sections.js";
import {input,labeled} from "./dom.js";

export function renderDocumentationFacet(host:HTMLElement,context:CanonicalFocusedSectionContext,working:CanonicalPropertyNode):void {
  const {dom}=context,display=input(dom,"displayText",working.documentation.displayText),description=dom.createElement("textarea"),comments=dom.createElement("textarea");description.name="description";description.value=working.documentation.description;comments.name="comments";comments.value=working.documentation.comments;display.addEventListener("input",()=>{const next=context.getWorking();if(next)next.documentation={...next.documentation,displayText:display.value};});description.addEventListener("input",()=>{const next=context.getWorking();if(next)next.documentation={...next.documentation,description:description.value};});comments.addEventListener("input",()=>{const next=context.getWorking();if(next)next.documentation={...next.documentation,comments:comments.value};});host.append(labeled(dom,"Display text",display),labeled(dom,"Description",description),labeled(dom,"Comments",comments));
}
