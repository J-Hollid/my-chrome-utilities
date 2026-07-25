import type {CanonicalCommand,CanonicalCommandResult,CanonicalPropertyNode,CanonicalSchemaDocument,CanonicalStructuralOperation} from "./data-layer-canonical-schema.js";
import type {FocusedPropertySection} from "./data-layer-focused-schema-property-ui.js";
import {renderCanonicalFacetSection} from "./data-layer-canonical-schema-focused-facets-ui.js";
import {renderDefinitionSection} from "./canonical-schema-focused/definition.js";

export interface CanonicalFocusedSectionContext {
  dom:Document;current:()=>CanonicalSchemaDocument;node:CanonicalPropertyNode;getWorking:()=>CanonicalPropertyNode|undefined;setWorking:(value:CanonicalPropertyNode|undefined)=>void;properties?:()=>readonly {id:string;name:string;type?:string}[];
  activeSection:FocusedPropertySection;setActiveSection:(value:FocusedPropertySection)=>void;removedRuleIds:Set<string>;removedValueIds:Set<string>;id:(kind:string)=>string;stageStructure:(operation:CanonicalStructuralOperation)=>void;render:()=>void;
  patchFor:(node:CanonicalPropertyNode,original:CanonicalPropertyNode)=>Partial<Omit<CanonicalPropertyNode,"id"|"parentId"|"order"|"provenance">>;command:(command:CanonicalCommand)=>CanonicalCommandResult;select:(id:string|undefined)=>void;feedback:(message:string)=>void;
}
export function renderCanonicalFocusedSection(host:HTMLElement,context:CanonicalFocusedSectionContext):void {
  const {dom}=context,working=context.getWorking();if(!working)return;host.dataset.focusedSection=context.activeSection;
  if(context.activeSection!=="definition"){renderCanonicalFacetSection(host,context,working);return;}
  renderDefinitionSection(host,context,working);
}
