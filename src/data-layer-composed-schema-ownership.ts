import type {ComposedSchemaRow} from "./data-layer-composed-schema-workspace.js";
import type {FocusedOwnershipInput} from "./data-layer-focused-schema-property-ui.js";

export const composedSchemaRowOwnershipInput=(row:ComposedSchemaRow):FocusedOwnershipInput=>({
  inherited:Boolean(row.inherited),
  local:Object.keys(row.local).some((key)=>key!=="path"),
  structureOwned:!row.inherited||Boolean(row.local.definitionId),
  overridden:row.action==="reset",
  invariant:row.effective.enforcement==="invariant",
  conflict:row.validationState==="blocked",
  replaceable:row.effective.enforcement==="overridable",
});
