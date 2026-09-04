import assert from "node:assert/strict";
import { fixture, importedSchema } from "./retired-library-import-controller-contract-test.mjs";

const { elements, uiController } = fixture;

// retired-schema-assertion: library-deletion-review-001
assert.equal(uiController.requestDeletion(importedSchema.id), true);
// retired-schema-assertion: library-deletion-review-002
assert.match(elements.get("#schema-delete-review-summary").textContent, /Imported v1/);
elements.get("#cancel-schema-delete").click();
// retired-schema-assertion: library-deletion-review-003
assert.equal(uiController.schemas().some(({ id }) => id === importedSchema.id), true);
uiController.requestDeletion(importedSchema.id); elements.get("#confirm-schema-delete").click();
// retired-schema-assertion: library-deletion-review-004
assert.equal(uiController.schemas().some(({ id }) => id === importedSchema.id), false);

export { fixture };
