/** Original retired assertions and their exact direct bindings. */
export const checks = [
  {
    "id": "source-drafts-revision-publication-close-032",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "Source confirmation performs the first and only library write",
    "observable": "schemaStorageWrites",
    "expected": "sourceWritesBeforePublish + 1",
    "binding": "assert.equal(fixture.schemaStorageWrites, sourceWritesBeforePublish + 1, \"Source confirmation performs the first and only library write\");"
  },
  {
    "id": "source-drafts-revision-publication-close-033",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.state().activeSchemaId => undefined",
    "observable": "uiController.state().activeSchemaId",
    "expected": "undefined",
    "binding": "assert.equal(uiController.state().activeSchemaId, undefined);"
  },
  {
    "id": "source-drafts-revision-publication-close-034",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "elements.get(\"#schema-editor\").hidden => true",
    "observable": "elements.get(\"#schema-editor\").hidden",
    "expected": "true",
    "binding": "assert.equal(elements.get(\"#schema-editor\").hidden, true);"
  },
  {
    "id": "source-drafts-revision-publication-close-035",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "Source publication closes the review and returns to the list",
    "observable": "elements.get(\"#schema-revision-review\").open",
    "expected": "false",
    "binding": "assert.equal(elements.get(\"#schema-revision-review\").open, false, \"Source publication closes the review and returns to the list\");"
  },
  {
    "id": "source-drafts-revision-publication-close-036",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.schemas() => newLibraryBefore",
    "observable": "uiController.schemas()",
    "expected": "newLibraryBefore",
    "binding": "assert.deepEqual(uiController.schemas(), newLibraryBefore);"
  },
  {
    "id": "source-drafts-revision-publication-close-037",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "New Schema editing remains transient before confirmation",
    "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
    "expected": "newStorageBefore",
    "binding": "assert.equal(uiValues.get(\"my-chrome-utilities.schema-library.v1\"), newStorageBefore, \"New Schema editing remains transient before confirmation\");"
  },
  {
    "id": "source-drafts-revision-publication-close-038",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.schemas() => newLibraryBefore",
    "observable": "uiController.schemas()",
    "expected": "newLibraryBefore",
    "binding": "assert.deepEqual(uiController.schemas(), newLibraryBefore);"
  },
  {
    "id": "source-drafts-revision-publication-close-039",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "cancel and close remove a transient New Schema without library mutation",
    "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
    "expected": "newStorageBefore",
    "binding": "assert.equal(uiValues.get(\"my-chrome-utilities.schema-library.v1\"), newStorageBefore, \"cancel and close remove a transient New Schema without library mutation\");"
  },
  {
    "id": "source-drafts-revision-publication-close-040",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "close does not route a transient draft through discard review",
    "observable": "elements.get(\"#close-schema-editor-review\").open",
    "expected": "false",
    "binding": "assert.equal(elements.get(\"#close-schema-editor-review\").open, false, \"close does not route a transient draft through discard review\");"
  },
  {
    "id": "source-drafts-revision-publication-close-041",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "close keeps the empty Schema detail region in the wide layout",
    "observable": "elements.get(\"#schema-detail\").hidden",
    "expected": "false",
    "binding": "assert.equal(elements.get(\"#schema-detail\").hidden, false, \"close keeps the empty Schema detail region in the wide layout\");"
  },
  {
    "id": "source-drafts-revision-publication-close-042",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "close restores the empty Schema detail content",
    "observable": "elements.get(\"#schema-detail-empty\").hidden",
    "expected": "false",
    "binding": "assert.equal(elements.get(\"#schema-detail-empty\").hidden, false, \"close restores the empty Schema detail content\");"
  },
  {
    "id": "source-drafts-revision-publication-close-043",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "elements.get(\"#schema-revision-review\").open => true",
    "observable": "elements.get(\"#schema-revision-review\").open",
    "expected": "true",
    "binding": "assert.equal(elements.get(\"#schema-revision-review\").open, true);"
  },
  {
    "id": "source-drafts-revision-publication-close-044",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.schemas() => newLibraryBefore",
    "observable": "uiController.schemas()",
    "expected": "newLibraryBefore",
    "binding": "assert.deepEqual(uiController.schemas(), newLibraryBefore);"
  },
  {
    "id": "source-drafts-revision-publication-close-045",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "save-and-close waits for revision confirmation before persistence",
    "observable": "schemaStorageWrites",
    "expected": "newWritesBeforeReview",
    "binding": "assert.equal(fixture.schemaStorageWrites, newWritesBeforeReview, \"save-and-close waits for revision confirmation before persistence\");"
  },
  {
    "id": "source-drafts-revision-publication-close-046",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "confirming New Schema appends exactly once",
    "observable": "uiController.schemas().length",
    "expected": "newLibraryBefore.length + 1",
    "binding": "assert.equal(uiController.schemas().length, newLibraryBefore.length + 1, \"confirming New Schema appends exactly once\");"
  },
  {
    "id": "source-drafts-revision-publication-close-047",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.schemas().at(-1).name => \"Published New\"",
    "observable": "uiController.schemas().at(-1).name",
    "expected": "\"Published New\"",
    "binding": "assert.equal(uiController.schemas().at(-1).name, \"Published New\");"
  },
  {
    "id": "source-drafts-revision-publication-close-048",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "New Schema confirmation performs its first library write",
    "observable": "schemaStorageWrites",
    "expected": "newWritesBeforePublish + 1",
    "binding": "assert.equal(fixture.schemaStorageWrites, newWritesBeforePublish + 1, \"New Schema confirmation performs its first library write\");"
  },
  {
    "id": "source-drafts-revision-publication-close-049",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.state().activeSchemaId => undefined",
    "observable": "uiController.state().activeSchemaId",
    "expected": "undefined",
    "binding": "assert.equal(uiController.state().activeSchemaId, undefined);"
  },
  {
    "id": "source-drafts-revision-publication-close-050",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "New Schema publication clears transient editor state",
    "observable": "elements.get(\"#schema-editor\").hidden",
    "expected": "true",
    "binding": "assert.equal(elements.get(\"#schema-editor\").hidden, true, \"New Schema publication clears transient editor state\");"
  },
  {
    "id": "source-drafts-revision-publication-close-051",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "elements.get(\"#schema-revision-review\").open => true",
    "observable": "elements.get(\"#schema-revision-review\").open",
    "expected": "true",
    "binding": "assert.equal(elements.get(\"#schema-revision-review\").open, true);"
  },
  {
    "id": "source-drafts-revision-publication-close-052",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.schemas() => sourceLibraryBefore",
    "observable": "uiController.schemas()",
    "expected": "sourceLibraryBefore",
    "binding": "assert.deepEqual(uiController.schemas(), sourceLibraryBefore);"
  },
  {
    "id": "source-drafts-revision-publication-close-053",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "close-review save also delegates to confirmation without eager publication",
    "observable": "schemaStorageWrites",
    "expected": "closeReviewWrites",
    "binding": "assert.equal(fixture.schemaStorageWrites, closeReviewWrites, \"close-review save also delegates to confirmation without eager publication\");"
  },
  {
    "id": "source-drafts-revision-publication-close-054",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "relationshipActions.at(-1) => \"build:schema:page:working-draft\"",
    "observable": "relationshipActions.at(-1)",
    "expected": "\"build:schema:page:working-draft\"",
    "binding": "assert.equal(relationshipActions.at(-1), \"build:schema:page:working-draft\");"
  },
  {
    "id": "source-drafts-revision-publication-close-055",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.parentSchemaId => \"schema:parent\"",
    "observable": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.parentSchemaId",
    "expected": "\"schema:parent\"",
    "binding": "assert.equal(uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.parentSchemaId, \"schema:parent\");"
  }
];
