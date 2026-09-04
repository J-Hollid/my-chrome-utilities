import assert from "node:assert/strict";
import { fixture } from "./retired-assignment-controller-contract-test.mjs";

const { elements, uiController } = fixture;
const importedSchema = {
  id:"schema:imported", name:"Imported", version:1,
  document:{ type:"object" }, assignments:[], published:true,
};

uiController.reviewLibraryImport(JSON.stringify({ version:1, schemas:[importedSchema], rules:[] }));
// retired-schema-assertion: library-import-review-001
assert.equal(elements.get("#schema-import-review").open, true);
elements.get("#cancel-schema-import").click();
// retired-schema-assertion: library-import-review-002
assert.equal(uiController.schemas().some(({ id }) => id === importedSchema.id), false, "cancel leaves both libraries untouched");
uiController.reviewLibraryImport(JSON.stringify({ version:1, schemas:[importedSchema], rules:[] }));
elements.get("#append-schema-library").click();
// retired-schema-assertion: library-import-review-003
assert.equal(uiController.schemas().some(({ id }) => id === importedSchema.id), true);

export { fixture, importedSchema };
