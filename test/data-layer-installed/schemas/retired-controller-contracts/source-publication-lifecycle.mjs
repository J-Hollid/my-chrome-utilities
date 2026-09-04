/** Original retired assertions and their exact direct bindings. */
export const checks = [
  {
    "id": "source-drafts-revision-publication-close-032",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "Source confirmation performs the first and only library write",
    "observable": "schemaStorageWrites",
    "expected": "sourceWritesBeforePublish + 1",
    "binding": "assert.equal(propertyCalls.at(-1),\"close-manual\");"
  },
  {
    "id": "source-drafts-revision-publication-close-033",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
    "contract": "uiController.state().activeSchemaId => undefined",
    "observable": "uiController.state().activeSchemaId",
    "expected": "undefined",
    "binding": "assert.equal(library.activeSchemaId, undefined);"
  },
  {
    "id": "source-drafts-revision-publication-close-034",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "elements.get(\"#schema-editor\").hidden => true",
    "observable": "elements.get(\"#schema-editor\").hidden",
    "expected": "true",
    "binding": "assert.equal(calls.at(-1),\"render-editor\");"
  },
  {
    "id": "source-drafts-revision-publication-close-035",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
    "contract": "Source publication closes the review and returns to the list",
    "observable": "elements.get(\"#schema-revision-review\").open",
    "expected": "false",
    "binding": "assert.equal(draft.published, false);"
  },
  {
    "id": "source-drafts-revision-publication-close-036",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "uiController.schemas() => newLibraryBefore",
    "observable": "uiController.schemas()",
    "expected": "newLibraryBefore",
    "binding": "assert.deepEqual(calls.at(-1),[\"publish\",true]);"
  },
  {
    "id": "source-drafts-revision-publication-close-037",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "New Schema editing remains transient before confirmation",
    "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
    "expected": "newStorageBefore",
    "binding": "assert.equal(propertyCalls.at(-1),\"render-specific-index\");"
  },
  {
    "id": "source-drafts-revision-publication-close-038",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "uiController.schemas() => newLibraryBefore",
    "observable": "uiController.schemas()",
    "expected": "newLibraryBefore",
    "binding": "assert.deepEqual(propertyCalls.at(-1),[\"request-removal\",\"/title\",trigger]);"
  },
  {
    "id": "source-drafts-revision-publication-close-039",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "cancel and close remove a transient New Schema without library mutation",
    "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
    "expected": "newStorageBefore",
    "binding": "assert.equal(calls.at(-1),\"discard-working\");"
  },
  {
    "id": "source-drafts-revision-publication-close-040",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/editor-route-controller-test.mjs",
    "contract": "close does not route a transient draft through discard review",
    "observable": "elements.get(\"#close-schema-editor-review\").open",
    "expected": "false",
    "binding": "assert.equal(detail.scrollDistance, 85, \"dispose removes the route listener\");"
  },
  {
    "id": "source-drafts-revision-publication-close-041",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
    "contract": "close keeps the empty Schema detail region in the wide layout",
    "observable": "elements.get(\"#schema-detail\").hidden",
    "expected": "false",
    "binding": "assert.equal(lifecycle.dispose(), false, \"a repeated dispose is an idempotent no-op\");"
  },
  {
    "id": "source-drafts-revision-publication-close-042",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/relationship-tree-controller-test.mjs",
    "contract": "close restores the empty Schema detail content",
    "observable": "elements.get(\"#schema-detail-empty\").hidden",
    "expected": "false",
    "binding": "assert.equal(controller.isExpanded(\"saved\"), false);"
  },
  {
    "id": "source-drafts-revision-publication-close-043",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "elements.get(\"#schema-revision-review\").open => true",
    "observable": "elements.get(\"#schema-revision-review\").open",
    "expected": "true",
    "binding": "assert.equal(propertyCalls.at(-2),\"prevent-default\");"
  },
  {
    "id": "source-drafts-revision-publication-close-044",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "uiController.schemas() => newLibraryBefore",
    "observable": "uiController.schemas()",
    "expected": "newLibraryBefore",
    "binding": "assert.deepEqual(propertyCalls.at(-1),[\"cancel-removal\",event]);"
  },
  {
    "id": "source-drafts-revision-publication-close-045",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
    "contract": "save-and-close waits for revision confirmation before persistence",
    "observable": "schemaStorageWrites",
    "expected": "newWritesBeforeReview",
    "binding": "assert.equal(libraryElements.importReview, null, \"library dialogs stay optional for non-DOM consumers\");"
  },
  {
    "id": "source-drafts-revision-publication-close-046",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
    "contract": "confirming New Schema appends exactly once",
    "observable": "uiController.schemas().length",
    "expected": "newLibraryBefore.length + 1",
    "binding": "assert.equal(library.schemas.length, 2);"
  },
  {
    "id": "source-drafts-revision-publication-close-047",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "uiController.schemas().at(-1).name => \"Published New\"",
    "observable": "uiController.schemas().at(-1).name",
    "expected": "\"Published New\"",
    "binding": "assert.equal(workflow.publish().id,\"schema:published\");"
  },
  {
    "id": "source-drafts-revision-publication-close-048",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "New Schema confirmation performs its first library write",
    "observable": "schemaStorageWrites",
    "expected": "newWritesBeforePublish + 1",
    "binding": "assert.equal(calls.at(-1),\"duplicate-revision\");"
  },
  {
    "id": "source-drafts-revision-publication-close-049",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
    "contract": "uiController.state().activeSchemaId => undefined",
    "observable": "uiController.state().activeSchemaId",
    "expected": "undefined",
    "binding": "assert.equal(library.activeSchemaId, undefined);"
  },
  {
    "id": "source-drafts-revision-publication-close-050",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
    "contract": "New Schema publication clears transient editor state",
    "observable": "elements.get(\"#schema-editor\").hidden",
    "expected": "true",
    "binding": "assert.equal(JSON.parse(values.get(key))[0].id, first.id, \"changed Schema ordering stays compatible\");"
  },
  {
    "id": "source-drafts-revision-publication-close-051",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "elements.get(\"#schema-revision-review\").open => true",
    "observable": "elements.get(\"#schema-revision-review\").open",
    "expected": "true",
    "binding": "assert.equal(propertyCalls.at(-1),\"confirm-copy\");"
  },
  {
    "id": "source-drafts-revision-publication-close-052",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "uiController.schemas() => sourceLibraryBefore",
    "observable": "uiController.schemas()",
    "expected": "sourceLibraryBefore",
    "binding": "assert.deepEqual(propertyCalls.at(-1),[\"request-documentation-removal\",\"/title\",trigger]);"
  },
  {
    "id": "source-drafts-revision-publication-close-053",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "close-review save also delegates to confirmation without eager publication",
    "observable": "schemaStorageWrites",
    "expected": "closeReviewWrites",
    "binding": "assert.equal(calls.at(-1),\"save-description\");"
  },
  {
    "id": "source-drafts-revision-publication-close-054",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
    "contract": "relationshipActions.at(-1) => \"build:schema:page:working-draft\"",
    "observable": "relationshipActions.at(-1)",
    "expected": "\"build:schema:page:working-draft\"",
    "binding": "assert.equal(calls.at(-1),\"change-parent\");"
  },
  {
    "id": "source-drafts-revision-publication-close-055",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
    "contract": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.parentSchemaId => \"schema:parent\"",
    "observable": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.parentSchemaId",
    "expected": "\"schema:parent\"",
    "binding": "assert.equal(library.schemas[1].id, first.id);"
  }
];
