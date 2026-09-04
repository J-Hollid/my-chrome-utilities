import assert from "node:assert/strict";

const { SchemaLibraryController } = await import(
  "../../../dist/data-layer-installed/schemas/library-controller.js"
);
const { installSchemaLibraryElements } = await import(
  "../../../dist/data-layer-installed/schemas/library-installed-view.js"
);

const queried = [];
const libraryElements = installSchemaLibraryElements({
  querySelector(selector) { queried.push(selector); return null; },
});
assert.equal(queried.includes("#schema-import-review"), true);
assert.equal(libraryElements.importReview, null, "library dialogs stay optional for non-DOM consumers");

const first = { id:"schema:first", name:"First", version:1, document:{ type:"object", properties:{} }, assignments:[], published:true };
const second = { id:"schema:second", name:"Second", version:1, document:{ type:"object", properties:{} }, assignments:[], published:true };
const key = "my-chrome-utilities.schema-library.v1";
const values = new Map([[key, JSON.stringify([first, second])]]);
const changed = [];
const library = new SchemaLibraryController({
  storage:{ getItem:(name) => values.get(name) ?? null, setItem:(name, value) => values.set(name, value) },
  changed:(schemas) => changed.push(schemas.map(({ id }) => id)),
});

library.activeSchemaId = first.id;
library.draft = structuredClone(first);
library.replaceActive({ ...first, name:"First draft", workingDraft:{
  name:"First draft", document:first.document, assignments:[], attachedRules:[], pendingChanges:["Rename"],
} });
assert.equal(library.active().workingDraft.name, "First draft");
library.persist();
assert.deepEqual(changed, [[first.id, second.id]]);
assert.equal(JSON.parse(values.get(key))[0].id, first.id, "changed Schema ordering stays compatible");

values.set(key, JSON.stringify([second]));
library.reload();
assert.deepEqual(library.schemas.map(({ id }) => id), [second.id]);
library.activeSchemaId = undefined;
library.draft = structuredClone(first);
assert.equal(library.active(), library.draft, "a transient draft remains the active library projection");
