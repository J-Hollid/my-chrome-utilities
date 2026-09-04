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

library.select(first.id, first);
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
library.clearSelection();
library.setDraft(first);
assert.deepEqual(library.active(), library.draft, "a transient draft remains the active library projection");
const projectedSchemas = library.schemas;
projectedSchemas[0].name = "Changed outside the owner";
assert.equal(library.schemas[0].name, "Second", "the Schema Library exposes a cloned read-only projection");
const projectedDraft = library.draft;
projectedDraft.name = "Changed outside the owner";
assert.equal(library.draft.name, "First", "the Schema Library keeps draft writes behind commands");

assert.equal(library.activeSchemaId, undefined);
assert.equal(library.activeIndex(), -1);
assert.equal(library.active().id, first.id);
assert.equal(library.active().name, "First");
assert.equal(library.serialize(), JSON.stringify([second]));
assert.deepEqual(JSON.parse(library.serialize()), [second]);
library.select(second.id, second);
assert.equal(library.activeSchemaId, second.id);
assert.equal(library.activeIndex(), 0);
assert.equal(library.active().id, second.id);
assert.equal(library.draft.id, second.id);
const activeProjection = library.active();
activeProjection.name = "Outside";
assert.equal(library.active().name, "Second");
library.replaceActive({ ...second, name:"Second draft" });
assert.equal(library.draft.name, "Second draft");
assert.equal(library.schemas[0].name, "Second draft");
assert.equal(library.activeIndex(), 0);
library.append(first);
assert.equal(library.schemas.length, 2);
assert.equal(library.schemas[1].id, first.id);
assert.equal(library.activeSchemaId, first.id);
library.append({ ...first, name:"Duplicate ID" });
assert.equal(library.schemas.length, 3);
assert.equal(library.schemas[2].name, "Duplicate ID");
const serialized = library.serialize([first]);
assert.equal(JSON.parse(serialized).length, 1);
assert.equal(JSON.parse(serialized)[0].id, first.id);
library.clearSelection();
assert.equal(library.activeSchemaId, undefined);
assert.equal(library.draft, undefined);
library.replaceSchemas([first, second]);
assert.deepEqual(library.schemas.map(({id})=>id), [first.id, second.id]);
const replacementProjection = library.schemas;
replacementProjection.splice(0, replacementProjection.length);
assert.equal(library.schemas.length, 2);
library.setDraft(undefined);
assert.equal(library.draft, undefined);
library.select("missing");
assert.equal(library.activeSchemaId, "missing");
assert.equal(library.activeIndex(), -1);
assert.throws(() => library.active(), /Open a schema/u);
