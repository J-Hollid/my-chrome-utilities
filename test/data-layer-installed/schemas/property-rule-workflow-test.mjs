import assert from "node:assert/strict";

const { SchemaPropertyController } = await import(
  "../../../dist/data-layer-installed/schemas/property-controller.js"
);
const { SchemaPropertyRuleWorkflow } = await import(
  "../../../dist/data-layer-installed/schemas/property-rule-workflow.js"
);
const { SchemaRuleController } = await import(
  "../../../dist/data-layer-installed/schemas/rule-controller.js"
);

const property=new SchemaPropertyController();
property.rememberInteractionReturn({
  schemaId:"schema:one",path:"items.2",triggerLabel:"Add rule for items.2",
  editorScroll:1,treeScroll:2,detailScroll:3,
});
let closed=false;
let reset=false;
const rule=new SchemaRuleController({getItem:()=>null,setItem(){}});
rule.setPicker("items.2");
const workflow=new SchemaPropertyRuleWorkflow({
  property,
  rule:{pickerTriggerLabel:()=>rule.pickerTriggerLabel(),focusPickerTrigger:()=>rule.focusPickerTrigger(),resetPickerState(){reset=true;rule.resetPickerState();}},
  picker:{close(){closed=true;}},
  propertyTree:{querySelectorAll:()=>[]},
});

workflow.close();
assert.equal(closed,true);
assert.equal(reset,true);
// retired-schema-assertion: property-filter-removal-copy-manual-index-022
assert.equal(rule.pickerPath,undefined);
