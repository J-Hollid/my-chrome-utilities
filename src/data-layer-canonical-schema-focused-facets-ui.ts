import type {CanonicalPropertyNode,CanonicalPresenceMode} from "./data-layer-canonical-schema.js";
import {renderCanonicalFocusedCondition} from "./data-layer-canonical-schema-focused-conditions.js";
import {renderCanonicalFocusedRules} from "./data-layer-canonical-schema-focused-rules.js";
import type {CanonicalFocusedSectionContext} from "./data-layer-canonical-schema-focused-sections.js";
import {renderDocumentationFacet} from "./canonical-schema-focused/documentation.js";
import {renderExampleFacet} from "./canonical-schema-focused/example.js";
import {renderPresenceFacet} from "./canonical-schema-focused/presence.js";
import {renderStructureFacet} from "./canonical-schema-focused/structure.js";
import {renderValuesFacet} from "./canonical-schema-focused/values.js";

export function renderCanonicalFacetSection(host:HTMLElement,context:CanonicalFocusedSectionContext,working:CanonicalPropertyNode):void {
  const {dom}=context;
  if(context.activeSection==="presence"){renderPresenceFacet(host,context,working);if(working.presence.condition)renderCanonicalFocusedCondition(host,context);return;}
  if(context.activeSection==="values"){renderValuesFacet(host,context,working);return;}
  if(context.activeSection==="conditions"){renderCanonicalFocusedCondition(host,context);return;}
  if(context.activeSection==="rules"){renderCanonicalFocusedRules(host,{...context,properties:()=>Object.values(context.current().nodes).map(({id,name,type})=>({id,name,type})),invariant:working.enforcement==="invariant"});return;}
  if(context.activeSection==="documentation"){renderDocumentationFacet(host,context,working);return;}
  if(context.activeSection==="example"){renderExampleFacet(host,context,working);return;}
  if(context.activeSection==="structure"){renderStructureFacet(host,context,working);return;}
}
