import { SchemaAssignmentController } from "./assignment-controller.js";
import { SchemaPropertyController } from "./property-controller.js";
import { SchemaPropertyView } from "./property-view.js";
import { SchemaRuleController } from "./rule-controller.js";
import { SchemaRuleInstalledPresentation } from "./rule-installed-view.js";
import { SchemaRulePickerView } from "./rule-picker-view.js";
/** Creates the property, rule, and assignment composition domain. */
export function createSchemaPropertyRuleAssignmentDomain(storage, ruleElements, schemas, assignmentPorts) {
    const property = new SchemaPropertyController(), rule = new SchemaRuleController(storage), rulePresentation = new SchemaRuleInstalledPresentation(rule, ruleElements, schemas), assignment = new SchemaAssignmentController(assignmentPorts);
    return { property, rule, rulePresentation, assignment,
        createPropertyView: (ports) => new SchemaPropertyView(ports),
        createRulePicker: (ports) => new SchemaRulePickerView(rule, ports),
        dispose: () => { rulePresentation.dispose(); rule.dispose(); property.dispose(); assignment.dispose(); } };
}
//# sourceMappingURL=property-rule-assignment-factory.js.map