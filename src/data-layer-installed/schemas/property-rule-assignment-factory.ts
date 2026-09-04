import { SchemaAssignmentController } from "./assignment-controller.js";
import { SchemaPropertyController } from "./property-controller.js";
import { SchemaPropertyView } from "./property-view.js";
import { SchemaRuleController } from "./rule-controller.js";
import { SchemaRuleInstalledPresentation, type RuleElements } from "./rule-installed-view.js";
import { SchemaRulePickerView } from "./rule-picker-view.js";
import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";

/** Creates the property, rule, and assignment composition domain. */
export function createSchemaPropertyRuleAssignmentDomain(storage:Pick<Storage,"getItem"|"setItem">,ruleElements:RuleElements,schemas:()=>readonly SchemaDefinition[],assignmentPorts:ConstructorParameters<typeof SchemaAssignmentController>[0]) {
  const property=new SchemaPropertyController(),rule=new SchemaRuleController(storage),rulePresentation=new SchemaRuleInstalledPresentation(rule,ruleElements,schemas),assignment=new SchemaAssignmentController(assignmentPorts);
  return { property,rule,rulePresentation,assignment,
    createPropertyView:(ports:ConstructorParameters<typeof SchemaPropertyView>[0]) => new SchemaPropertyView(ports),
    createRulePicker:(ports:ConstructorParameters<typeof SchemaRulePickerView>[1]) => new SchemaRulePickerView(rule,ports),
    dispose:() => { rulePresentation.dispose();rule.dispose();property.dispose();assignment.dispose(); } };
}
