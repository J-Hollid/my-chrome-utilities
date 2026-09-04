import assert from "node:assert/strict";
import { fixture } from "./retired-rule-revision-controller-contract-test.mjs";

const { elements, uiController } = fixture;

elements.get("#schema-assignment-schema").value = uiController.state().activeSchemaId;
elements.get("#create-schema-assignment").click();
elements.get("#schema-assignment-source").value = "gtm"; elements.get("#schema-assignment-event").value = "checkout";
elements.get("#schema-assignment-priority").value = "20"; elements.get("#schema-assignment-target").value = "payload";
elements.get("#schema-assignment-domain").value = "shop.example"; elements.get("#schema-assignment-pathname").value = "/checkout";
elements.get("#schema-assignment-version-policy").value = "follow latest"; elements.get("#schema-assignment-enabled").checked = true;
elements.get("#save-schema-assignment").click();
const assignedSchema = uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId);
// retired-schema-assertion: assignment-conflicts-001
assert.equal(assignedSchema.assignments[0].eventName, "checkout");
// retired-schema-assertion: assignment-conflicts-002
assert.equal(assignedSchema.assignments[0].versionPolicy, "follow latest");
// retired-schema-assertion: assignment-conflicts-003
assert.match(elements.get("#schema-assignment-list").children[0].children[0].textContent, /gtm\/checkout/);
elements.get("#schema-assignment-list").children[0].children[2].click();
// retired-schema-assertion: assignment-conflicts-004
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).assignments.length, 2,
  "assignment duplication preserves the complete assignment contract");
// retired-schema-assertion: assignment-conflicts-005
assert.match(elements.get("#schema-assignment-conflicts").textContent, /Assignment conflict/);
elements.get("#schema-assignment-list").children[1].children[3].click();
// retired-schema-assertion: assignment-conflicts-006
assert.equal(elements.get("#schema-assignment-conflicts").textContent, "", "disabled duplicates no longer conflict");
const importedSchema = { id:"schema:imported", name:"Imported", version:1, document:{ type:"object" }, assignments:[], published:true };

export { fixture };
