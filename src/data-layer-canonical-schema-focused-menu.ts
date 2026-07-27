import {canonicalPropertyPath,type CanonicalPropertyNode, type CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";
import {renderFocusedPropertyMenu} from "./data-layer-focused-schema-property-menu.js";
import {focusedConditionLabel,type FocusedPropertySection} from "./data-layer-focused-schema-property-ui.js";

export interface CanonicalFocusedMenuContext {
  dom:Document;current:()=>CanonicalSchemaDocument;sourceState:(node:CanonicalPropertyNode)=>"inherited"|"local"|"overridden"|"conflict";ensureWorking:(node:CanonicalPropertyNode)=>void;getWorking:()=>CanonicalPropertyNode|undefined;
  activeSection:FocusedPropertySection;setActiveSection:(section:FocusedPropertySection)=>void;setMenuPropertyId:(id:string)=>void;render:()=>void;close:()=>void;feedback:(message:string)=>void;provenanceText:(node:CanonicalPropertyNode)=>string;
}
export function renderCanonicalFocusedMenu(node:CanonicalPropertyNode,context:CanonicalFocusedMenuContext):HTMLElement {
  const path=canonicalPropertyPath(context.current(),node.id);
  return renderFocusedPropertyMenu({dom:context.dom,path,close:context.close,sectionSummary:(section)=>section==="rules"?`${node.rules.length} items`:section==="values"?`${node.allowedValues.length} allowed values`:section==="conditions"?focusedConditionLabel(node.presence.condition as unknown as Record<string,unknown>|undefined):"View effective value",selectSection:(section)=>{context.setActiveSection(section);context.ensureWorking(node);context.setMenuPropertyId(node.id);context.render();}});
}
