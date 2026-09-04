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
// retired-schema-assertion: source-drafts-revision-publication-close-078
assert.ok(queried.includes("#schema-import-review"));
// retired-schema-assertion: source-drafts-revision-publication-close-039
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
// retired-schema-assertion: source-drafts-revision-publication-close-026
assert.equal(library.active().workingDraft.name, "First draft");
library.persist();
// retired-schema-assertion: project-hydration-durable-recovery-006
assert.deepEqual(changed, [[first.id, second.id]]);
// retired-schema-assertion: source-drafts-revision-publication-close-005
assert.equal(JSON.parse(values.get(key))[0].id, first.id, "changed Schema ordering stays compatible");

values.set(key, JSON.stringify([second]));
library.reload();
// retired-schema-assertion: source-drafts-revision-publication-close-066
assert.deepEqual(library.schemas.map(({ id }) => id), [second.id]);
library.clearSelection();
library.setDraft(first);
// retired-schema-assertion: source-drafts-revision-publication-close-010
assert.deepEqual(library.active(), library.draft, "a transient draft remains the active library projection");
const projectedSchemas = library.schemas;
projectedSchemas[0].name = "Changed outside the owner";
// retired-schema-assertion: source-drafts-revision-publication-close-024
assert.equal(library.schemas[0].name, "Second", "the Schema Library exposes a cloned read-only projection");
const projectedDraft = library.draft;
projectedDraft.name = "Changed outside the owner";
// retired-schema-assertion: source-drafts-revision-publication-close-022
assert.equal(library.draft.name, "First", "the Schema Library keeps draft writes behind commands");
// retired-schema-assertion: source-drafts-revision-publication-close-033
assert.equal(library.activeSchemaId, undefined);
// retired-schema-assertion: source-drafts-revision-publication-close-083
assert.equal(library.activeIndex(), -1);
// retired-schema-assertion: source-drafts-revision-publication-close-032
assert.equal(library.active().id, first.id);
// retired-schema-assertion: source-drafts-revision-publication-close-047
assert.equal(library.active().name, "First");
// retired-schema-assertion: project-hydration-durable-recovery-005
assert.equal(library.serialize(), JSON.stringify([second]));
// retired-schema-assertion: installed-dialogs-library-relationship-routing-007
assert.deepEqual(JSON.parse(library.serialize()), [second]);
library.select(second.id, second);
// retired-schema-assertion: source-drafts-revision-publication-close-049
assert.equal(library.activeSchemaId, second.id);
// retired-schema-assertion: project-hydration-durable-recovery-008
assert.equal(library.activeIndex(), 0);
// retired-schema-assertion: project-hydration-durable-recovery-009
assert.equal(library.active().id, second.id);
// retired-schema-assertion: source-drafts-revision-publication-close-040
assert.equal(library.draft.id, second.id);
const activeProjection = library.active();
activeProjection.name = "Outside";
// retired-schema-assertion: source-drafts-revision-publication-close-062
assert.equal(library.active().name, "Second");
library.replaceActive({ ...second, name:"Second draft" });
// retired-schema-assertion: source-drafts-revision-publication-close-071
assert.equal(library.draft.name, "Second draft");
// retired-schema-assertion: source-drafts-revision-publication-close-079
assert.equal(library.schemas[0].name, "Second draft");
// retired-schema-assertion: project-hydration-durable-recovery-010
assert.equal(library.activeIndex(), 0);
library.append(first);
// retired-schema-assertion: source-drafts-revision-publication-close-027
assert.equal(library.schemas.length, 2);
// retired-schema-assertion: source-drafts-revision-publication-close-048
assert.equal(library.schemas[1].id, first.id);
// retired-schema-assertion: source-drafts-revision-publication-close-064
assert.equal(library.activeSchemaId, first.id);
library.append({ ...first, name:"Duplicate ID" });
// retired-schema-assertion: source-drafts-revision-publication-close-046
assert.equal(library.schemas.length, 3);
// retired-schema-assertion: project-hydration-durable-recovery-012
assert.equal(library.schemas[2].name, "Duplicate ID");
const serialized = library.serialize([first]);
// retired-schema-assertion: source-drafts-revision-publication-close-073
assert.equal(JSON.parse(serialized).length, 1);
// retired-schema-assertion: project-hydration-durable-recovery-013
assert.equal(JSON.parse(serialized)[0].id, first.id);
library.clearSelection();
// retired-schema-assertion: source-drafts-revision-publication-close-074
assert.equal(library.activeSchemaId, undefined);
// retired-schema-assertion: project-hydration-durable-recovery-014
assert.equal(library.draft, undefined);
library.replaceSchemas([first, second]);
// retired-schema-assertion: project-hydration-durable-recovery-007
assert.deepEqual(library.schemas.map(({id})=>id), [first.id, second.id]);
const replacementProjection = library.schemas;
replacementProjection.splice(0, replacementProjection.length);
// retired-schema-assertion: project-hydration-durable-recovery-015
assert.equal(library.schemas.length, 2);
library.setDraft(undefined);
// retired-schema-assertion: project-hydration-durable-recovery-017
assert.equal(library.draft, undefined);
library.select("missing");
// retired-schema-assertion: project-hydration-durable-recovery-018
assert.equal(library.activeSchemaId, "missing");
assert.equal(library.activeIndex(), -1);
assert.throws(() => library.active(), /Open a schema/u);

const sourceLibrary = new SchemaLibraryController({
  storage:{ getItem:() => "[]", setItem() {} },
  changed() {},
});
const sourceDraft = {
  id:"schema:source", name:"Source", version:1, published:false,
  document:{ type:"object", properties:{ total:{ type:"number" } } },
  assignments:[{ sourceId:"gtm", eventName:"checkout", target:"payload" }],
};
const libraryBeforeSource = sourceLibrary.schemas;
sourceLibrary.setDraft(sourceDraft);
// retired-schema-assertion: source-drafts-revision-publication-close-023
assert.deepEqual(
  sourceLibrary.schemas,
  libraryBeforeSource,
  "opening a source keeps its draft outside the stored library",
);
sourceLibrary.clearSelection();
// retired-schema-assertion: source-drafts-revision-publication-close-038
assert.deepEqual(
  sourceLibrary.schemas,
  libraryBeforeSource,
  "canceling a source draft keeps the stored library unchanged",
);
sourceLibrary.setDraft(sourceDraft);
sourceLibrary.clearSelection();
// retired-schema-assertion: source-drafts-revision-publication-close-052
assert.deepEqual(
  sourceLibrary.schemas,
  libraryBeforeSource,
  "discarding a source draft keeps the stored library unchanged",
);
sourceLibrary.append({ ...sourceDraft, published:true });
// retired-schema-assertion: source-drafts-revision-publication-close-030
assert.deepEqual(sourceLibrary.schemas.at(-1).assignments, sourceDraft.assignments);
