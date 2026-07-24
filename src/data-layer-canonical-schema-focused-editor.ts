import type {CanonicalPropertyNode,CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import type {FocusedPropertySection} from "./data-layer-focused-schema-property-ui.js";

export interface CanonicalFocusedEditorContext {
  dom:Document;activeSection:FocusedPropertySection;sectionLabel:(section:FocusedPropertySection)=>string;canonicalPropertyPath:(document:CanonicalSchemaDocument,id:string)=>string;provenanceText:(node:CanonicalPropertyNode)=>string;presenceText:(mode:CanonicalPropertyNode["presence"]["mode"])=>string;
  renderSection:(host:HTMLElement,node:CanonicalPropertyNode)=>void;close:()=>void;review:()=>void;save:()=>void;
}
const button=(dom:Document,text:string,run:()=>void):HTMLButtonElement=>{const control=dom.createElement("button");control.type="button";control.textContent=text;control.addEventListener("click",run);return control;};
export function renderCanonicalFocusedEditor(document:CanonicalSchemaDocument,node:CanonicalPropertyNode,context:CanonicalFocusedEditorContext):HTMLElement {
  const {dom}=context,wrapper=dom.createElement("section"),heading=dom.createElement("h3"),identity=dom.createElement("p"),source=dom.createElement("p"),effective=dom.createElement("p"),section=dom.createElement("section"),actions=dom.createElement("div");
  wrapper.setAttribute("aria-label","Focused property editor");wrapper.dataset.focusedPropertyEditor="true";wrapper.dataset.focusedPropertyPath=context.canonicalPropertyPath(document,node.id);heading.textContent=`Focused property · ${node.name}`;identity.textContent=`${context.canonicalPropertyPath(document,node.id)} · stable identity ${node.id}`;source.textContent=`Inherited value and source: ${context.provenanceText(node)}`;effective.textContent=`Effective result: ${node.type} · ${context.presenceText(node.presence.mode)} · validation valid · conflicts none`;section.setAttribute("aria-label",`Focused ${context.sectionLabel(context.activeSection)} section`);context.renderSection(section,node);actions.append(button(dom,"Cancel",context.close),button(dom,"Review changes",context.review),button(dom,"Save property",context.save));wrapper.append(heading,identity,source,effective,section,actions);return wrapper;
}
