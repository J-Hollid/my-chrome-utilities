import type {CanonicalPresenceMode,CanonicalPropertyNode} from "../data-layer-canonical-schema.js";
import type {CanonicalFocusedSectionContext} from "../data-layer-canonical-schema-focused-sections.js";
import {labeled} from "./dom.js";

const presenceText=(mode:CanonicalPresenceMode):string=>({optional:"Optional",required:"Required","required-when":"Required when",forbidden:"Forbidden","forbidden-when":"Forbidden when"})[mode];

export function renderPresenceFacet(host:HTMLElement,context:CanonicalFocusedSectionContext,working:CanonicalPropertyNode):void {
  const {dom}=context,presence=dom.createElement("select");presence.name="presenceMode";presence.append(...(["optional","required","required-when","forbidden","forbidden-when"] as const).map((entry)=>new Option(presenceText(entry),entry)));presence.value=working.presence.mode;presence.addEventListener("change",()=>{const next=context.getWorking();if(next)next.presence={...next.presence,mode:presence.value as CanonicalPresenceMode};});host.append(labeled(dom,"Presence",presence));
}
