/** Original retired assertions and their exact direct bindings. */
export const checks = [
  {
    "id": "source-drafts-revision-publication-close-056",
    "method": "match",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "elements.get(\"#schema-inheritance-provenance\").textContent => /Parent v2/",
    "observable": "elements.get(\"#schema-inheritance-provenance\").textContent",
    "expected": "/Parent v2/",
    "binding": "assert.match(elements.get(\"#schema-inheritance-provenance\").textContent,/Parent v2/u);"
  },
  {
    "id": "source-drafts-revision-publication-close-057",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "elements.get(\"#schema-inherited-rule-groups\").hidden => false",
    "observable": "elements.get(\"#schema-inherited-rule-groups\").hidden",
    "expected": "false",
    "binding": "assert.equal(elements.get(\"#schema-inherited-rule-groups\").hidden,false);"
  },
  {
    "id": "source-drafts-revision-publication-close-058",
    "method": "match",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "elements.get(\"#schema-inherited-rule-groups\").children[0].children[0].textContent => /Active inherited \\(1\\)/",
    "observable": "elements.get(\"#schema-inherited-rule-groups\").children[0].children[0].textContent",
    "expected": "/Active inherited \\(1\\)/",
    "binding": "assert.match(elements.get(\"#schema-inherited-rule-groups\").children[0].children[0].textContent,/Active inherited \\(1\\)/u);"
  },
  {
    "id": "source-drafts-revision-publication-close-059",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.document.additionalProperties => false",
    "observable": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.document.additionalProperties",
    "expected": "false",
    "binding": "assert.equal(library.active().workingDraft.document.additionalProperties,false);"
  },
  {
    "id": "source-drafts-revision-publication-close-060",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "saving opens the controller-owned revision review",
    "observable": "elements.get(\"#schema-revision-review\").open",
    "expected": "true",
    "binding": "assert.equal(elements.get(\"#schema-revision-review\").open,true);"
  },
  {
    "id": "source-drafts-revision-publication-close-061",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "uiController.schemas()[0].version => 2",
    "observable": "uiController.schemas()[0].version",
    "expected": "2",
    "binding": "assert.equal(published.version,2);"
  },
  {
    "id": "source-drafts-revision-publication-close-062",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "uiController.schemas()[0].name => \"Page checkout\"",
    "observable": "uiController.schemas()[0].name",
    "expected": "\"Page checkout\"",
    "binding": "assert.equal(published.name,\"Page checkout\");"
  },
  {
    "id": "source-drafts-revision-publication-close-063",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "uiController.schemas()[0].documentation.description => \"Checkout payload\"",
    "observable": "uiController.schemas()[0].documentation.description",
    "expected": "\"Checkout payload\"",
    "binding": "assert.equal(published.documentation.description,\"Checkout payload\");"
  },
  {
    "id": "source-drafts-revision-publication-close-064",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "uiController.state().activeSchemaId => undefined",
    "observable": "uiController.state().activeSchemaId",
    "expected": "undefined",
    "binding": "assert.equal(library.activeSchemaId,undefined);"
  },
  {
    "id": "source-drafts-revision-publication-close-065",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "stored-schema publication clears editor state and returns to the list",
    "observable": "elements.get(\"#schema-editor\").hidden",
    "expected": "true",
    "binding": "assert.equal(elements.get(\"#schema-editor\").hidden,true);"
  },
  {
    "id": "source-drafts-revision-publication-close-066",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "opening a published schema renders its historical revision choices",
    "observable": "elements.get(\"#schema-revision-selector\").children.map(({ value, textContent }) => ({ value, textContent }))",
    "expected": "[{ value:\"1\", textContent:\"Revision 1\" }]",
    "binding": "assert.deepEqual(elements.get(\"#schema-revision-selector\").children.map(({value,textContent}) => ({value,textContent})), [{value:\"1\",textContent:\"Revision 1\"}]);"
  },
  {
    "id": "source-drafts-revision-publication-close-067",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "elements.get(\"#schema-revision-comparison\").textContent => \"Revision 1 compared with current revision 2. 1 historical properties; 1 current properties.\"",
    "observable": "elements.get(\"#schema-revision-comparison\").textContent",
    "expected": "\"Revision 1 compared with current revision 2. 1 historical properties; 1 current properties.\"",
    "binding": "assert.equal(elements.get(\"#schema-revision-comparison\").textContent, \"Revision 1 compared with current revision 2. 1 historical properties; 1 current properties.\");"
  },
  {
    "id": "source-drafts-revision-publication-close-068",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "elements.get(\"#schema-revision-review\").open => true",
    "observable": "elements.get(\"#schema-revision-review\").open",
    "expected": "true",
    "binding": "assert.equal(elements.get(\"#schema-revision-review\").open,true);"
  },
  {
    "id": "source-drafts-revision-publication-close-069",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "requesting historical restoration does not mutate the current schema before confirmation",
    "observable": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft",
    "expected": "undefined",
    "binding": "assert.equal(library.active().workingDraft,undefined);"
  },
  {
    "id": "source-drafts-revision-publication-close-070",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "cancelling historical restoration leaves the current schema unchanged",
    "observable": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft",
    "expected": "undefined",
    "binding": "assert.equal(library.active().workingDraft,undefined);"
  },
  {
    "id": "source-drafts-revision-publication-close-071",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "confirming historical restoration creates a working draft from the selected revision",
    "observable": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.sourceVersion",
    "expected": "1",
    "binding": "assert.equal(library.active().workingDraft.sourceVersion,1);"
  },
  {
    "id": "source-drafts-revision-publication-close-072",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "relationshipActions.at(-1) => \"build:schema:page:historical:1\"",
    "observable": "relationshipActions.at(-1)",
    "expected": "\"build:schema:page:historical:1\"",
    "binding": "assert.equal(calls.specifications.at(-1),\"schema:page:historical:1\");"
  },
  {
    "id": "source-drafts-revision-publication-close-073",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "revision duplication remains schema-controller behavior",
    "observable": "uiController.schemas().length",
    "expected": "3",
    "binding": "assert.equal(library.schemas.length,3);"
  },
  {
    "id": "source-drafts-revision-publication-close-074",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "uiController.state().activeSchemaId => undefined",
    "observable": "uiController.state().activeSchemaId",
    "expected": "undefined",
    "binding": "assert.equal(library.activeSchemaId,undefined);"
  },
  {
    "id": "source-drafts-revision-publication-close-075",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "elements.get(\"#close-schema-editor-review\").open => false",
    "observable": "elements.get(\"#close-schema-editor-review\").open",
    "expected": "false",
    "binding": "assert.equal(elements.get(\"#close-schema-editor-review\").open,false);"
  },
  {
    "id": "source-drafts-revision-publication-close-076",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "schemaStorageWrites => storedDraftWrites",
    "observable": "schemaStorageWrites",
    "expected": "storedDraftWrites",
    "binding": "assert.equal(writes,retainedWrites);"
  },
  {
    "id": "source-drafts-revision-publication-close-077",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "uiValues.get(\"my-chrome-utilities.schema-library.v1\") => storedDraftStorage",
    "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
    "expected": "storedDraftStorage",
    "binding": "assert.equal(values.get(\"library\"),retainedStorage);"
  },
  {
    "id": "source-drafts-revision-publication-close-078",
    "method": "ok",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "close retains the stored working draft without another persistence write",
    "observable": "uiController.schemas().find(({ id }) => id === lifecycleSchemaId).workingDraft",
    "expected": "truthy",
    "binding": "assert.ok(library.schemas.find(({id}) => id===page.id).workingDraft);"
  },
  {
    "id": "source-drafts-revision-publication-close-079",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "elements.get(\"#schema-result\").textContent => \"Working draft retained without publishing.\"",
    "observable": "elements.get(\"#schema-result\").textContent",
    "expected": "\"Working draft retained without publishing.\"",
    "binding": "assert.equal(elements.get(\"#schema-result\").textContent,\"Working draft retained without publishing.\");"
  },
  {
    "id": "source-drafts-revision-publication-close-080",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "schemaStorageWrites => abandonWrites",
    "observable": "schemaStorageWrites",
    "expected": "abandonWrites",
    "binding": "assert.equal(writes,abandonedWrites);"
  },
  {
    "id": "source-drafts-revision-publication-close-081",
    "method": "ok",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "discard-schema-draft abandons editor state without discarding the stored working draft",
    "observable": "uiController.schemas().find(({ id }) => id === lifecycleSchemaId).workingDraft",
    "expected": "truthy",
    "binding": "assert.ok(library.schemas.find(({id}) => id===page.id).workingDraft);"
  },
  {
    "id": "source-drafts-revision-publication-close-082",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "schemaStorageWrites => discardStoredWrites + 1",
    "observable": "schemaStorageWrites",
    "expected": "discardStoredWrites + 1",
    "binding": "assert.equal(writes,discardWrites+1);"
  },
  {
    "id": "source-drafts-revision-publication-close-083",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/library-editor-test.mjs",
    "contract": "discard-working-schema-draft is the distinct operation that mutates the stored library",
    "observable": "uiController.schemas().find(({ id }) => id === lifecycleSchemaId).workingDraft",
    "expected": "undefined",
    "binding": "assert.equal(library.schemas.find(({id}) => id===page.id).workingDraft,undefined);"
  }
];
