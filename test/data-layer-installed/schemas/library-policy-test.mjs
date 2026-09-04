import assert from "node:assert/strict";

const { appendSchemaLibraryImport, replaceSchemaLibraryImport } = await import(
  "../../../dist/data-layer-installed/schemas/library-import-policy.js"
);
const { applySchemaDeletion } = await import(
  "../../../dist/data-layer-installed/schemas/library-deletion-policy.js"
);
const { createExtensionSchemaExport, createStandardSchemaExport } = await import(
  "../../../dist/data-layer-installed/schemas/library-export-policy.js"
);

const first = { id:"schema:first", name:"First", version:1,
  document:{ type:"object", properties:{} }, assignments:[], published:true };
const replacement = { ...first, name:"Replacement", version:2 };
const second = { ...first, id:"schema:second", name:"Second" };
const firstRule = { id:"rule:first", name:"First", kind:"Required", version:1, enabled:true };
const replacementRule = { ...firstRule, name:"Replacement", version:2 };

const replaced = replaceSchemaLibraryImport({
  schemas:[replacement], rules:[replacementRule],
});

// retired-schema-assertion: library-export-choice-compatibility-io-006
assert.deepEqual(replaced.schemas, [replacement]);

// retired-schema-assertion: library-export-choice-compatibility-io-013
assert.deepEqual(replaced.rules, [replacementRule]);
replaced.schemas[0].name = "External mutation";

// retired-schema-assertion: library-export-choice-compatibility-io-001
assert.equal(replacement.name, "Replacement", "replacement output does not expose import state");

const appended = appendSchemaLibraryImport(
  [first, second],
  [firstRule],
  { schemas:[replacement], rules:[replacementRule] },
);

assert.deepEqual(appended.schemas.map(({ id }) => id), [second.id, first.id]);

// retired-schema-assertion: library-export-choice-compatibility-io-005
assert.equal(appended.schemas[1].name, "Replacement");
assert.deepEqual(appended.rules, [replacementRule]);

const deleted = applySchemaDeletion([first, second], first.id, first);
assert.deepEqual(deleted.schemas, [second]);

// retired-schema-assertion: library-export-choice-compatibility-io-015
assert.equal(deleted.clearSelection, true);
assert.equal(deleted.status, "Deleted First.");

// retired-schema-assertion: project-hydration-durable-recovery-014
assert.equal(applySchemaDeletion([first, second], second.id, first).clearSelection, false);

const standard = createStandardSchemaExport([first]);

// retired-schema-assertion: library-export-choice-compatibility-io-016
assert.equal(standard.filename, "schema-library-draft-2020-12.schema.json");

// retired-schema-assertion: library-export-choice-compatibility-io-011
assert.match(standard.status, /1 schemas/u);

assert.match(standard.status, /0 omitted rules/u);
const extension = createExtensionSchemaExport([first], [firstRule]);

assert.equal(extension.filename, "schema-library-v1.json");
assert.equal(extension.document.schemas.length, 1);

assert.equal(extension.document.rules.length, 1);
assert.match(extension.status, /1 schemas and 1 rules/u);
