import {renderCanonicalRuleAddPanel} from "./data-layer-canonical-schema-focused-rule-add.js";
import {renderCanonicalRuleRows,type CanonicalFocusedRuleRowsContext} from "./data-layer-canonical-schema-focused-rule-rows.js";

export interface CanonicalFocusedRulesContext extends CanonicalFocusedRuleRowsContext {}

export function renderCanonicalFocusedRules(host:HTMLElement,context:CanonicalFocusedRulesContext):void {
  renderCanonicalRuleRows(host,context);
  renderCanonicalRuleAddPanel(host,context);
}
