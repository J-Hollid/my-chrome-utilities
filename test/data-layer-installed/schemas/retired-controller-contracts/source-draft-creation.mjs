/** Original retired assertions and their exact direct bindings. */
export const checks = [
  {
    "id": "source-drafts-revision-publication-close-001",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "richSourceSchema.assignments => [{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]",
    "observable": "richSourceSchema.assignments",
    "expected": "[{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]",
    "binding": "assert.deepEqual(richSourceSchema.assignments, [{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]);"
  },
  {
    "id": "source-drafts-revision-publication-close-002",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "richSourceSchema.workingDraft.assignments => [{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]",
    "observable": "richSourceSchema.workingDraft.assignments",
    "expected": "[{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]",
    "binding": "assert.deepEqual(richSourceSchema.workingDraft.assignments, [{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]);"
  },
  {
    "id": "source-drafts-revision-publication-close-003",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.guidedState().selectedSchemaPropertyPath => \"total\"",
    "observable": "uiController.guidedState().selectedSchemaPropertyPath",
    "expected": "\"total\"",
    "binding": "assert.equal(uiController.guidedState().selectedSchemaPropertyPath, \"total\");"
  },
  {
    "id": "source-drafts-revision-publication-close-004",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "elements.get(\"#schema-result\").textContent => \"Library template fields loaded into a new schema draft.\"",
    "observable": "elements.get(\"#schema-result\").textContent",
    "expected": "\"Library template fields loaded into a new schema draft.\"",
    "binding": "assert.equal(elements.get(\"#schema-result\").textContent, \"Library template fields loaded into a new schema draft.\");"
  },
  {
    "id": "source-drafts-revision-publication-close-005",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "elements.get(\"#schema-editor-name\").focused => true",
    "observable": "elements.get(\"#schema-editor-name\").focused",
    "expected": "true",
    "binding": "assert.equal(elements.get(\"#schema-editor-name\").focused, true);"
  },
  {
    "id": "source-drafts-revision-publication-close-006",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "relationshipActions.at(-1) => \"view:Schemas\"",
    "observable": "relationshipActions.at(-1)",
    "expected": "\"view:Schemas\"",
    "binding": "assert.equal(relationshipActions.at(-1), \"view:Schemas\");"
  },
  {
    "id": "source-drafts-revision-publication-close-007",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "source-created properties retain the canonical property-row browser contract",
    "observable": "elements.get(\"#schema-property-tree\").children.map(({ dataset }) => dataset.schemaPropertyCanonicalPath)",
    "expected": "[\"/total\", \"/coupon\"]",
    "binding": "assert.deepEqual(elements.get(\"#schema-property-tree\").children.map(({ dataset }) => dataset.schemaPropertyCanonicalPath), [\"/total\", \"/coupon\"], \"source-created properties retain the canonical property-row browser contract\");"
  },
  {
    "id": "source-drafts-revision-publication-close-008",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "source-created property rows expose their canonical labels as headings",
    "observable": "elements.get(\"#schema-property-tree\").children.map(({ children }) => children[0].textContent)",
    "expected": "[\"total\", \"coupon\"]",
    "binding": "assert.deepEqual(elements.get(\"#schema-property-tree\").children.map(({ children }) => children[0].textContent), [\"total\", \"coupon\"], \"source-created property rows expose their canonical labels as headings\");"
  },
  {
    "id": "source-drafts-revision-publication-close-009",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "schema target input updates the transient draft through the exact installed event type",
    "observable": "uiController.state().transientDraft.workingDraft.assignments[0].target",
    "expected": "\"raw input\"",
    "binding": "assert.equal(uiController.state().transientDraft.workingDraft.assignments[0].target, \"raw input\", \"schema target input updates the transient draft through the exact installed event type\");"
  },
  {
    "id": "source-drafts-revision-publication-close-010",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "opening a source does not append transient editor state to the Schema Library",
    "observable": "uiController.schemas()",
    "expected": "sourceLibraryBefore",
    "binding": "assert.deepEqual(uiController.schemas(), sourceLibraryBefore, \"opening a source does not append transient editor state to the Schema Library\");"
  },
  {
    "id": "source-drafts-revision-publication-close-011",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "opening a source performs no premature Schema Library storage write",
    "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
    "expected": "sourceStorageBefore",
    "binding": "assert.equal(uiValues.get(\"my-chrome-utilities.schema-library.v1\"), sourceStorageBefore, \"opening a source performs no premature Schema Library storage write\");"
  },
  {
    "id": "source-drafts-revision-publication-close-012",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "primitiveSourceSchema.workingDraft.document.type => \"object\"",
    "observable": "primitiveSourceSchema.workingDraft.document.type",
    "expected": "\"object\"",
    "binding": "assert.equal(primitiveSourceSchema.workingDraft.document.type, \"object\");"
  },
  {
    "id": "source-drafts-revision-publication-close-013",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "primitive source payloads remain editable through the legacy value wrapper",
    "observable": "primitiveSourceSchema.workingDraft.document.properties.value.type",
    "expected": "\"boolean\"",
    "binding": "assert.equal(primitiveSourceSchema.workingDraft.document.properties.value.type, \"boolean\", \"primitive source payloads remain editable through the legacy value wrapper\");"
  },
  {
    "id": "source-drafts-revision-publication-close-014",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "primitiveSourceSchema.workingDraft.assignments => [{ sourceId:\"page\", eventName:\"consent\", target:\"payload\" }]",
    "observable": "primitiveSourceSchema.workingDraft.assignments",
    "expected": "[{ sourceId:\"page\", eventName:\"consent\", target:\"payload\" }]",
    "binding": "assert.deepEqual(primitiveSourceSchema.workingDraft.assignments, [{ sourceId:\"page\", eventName:\"consent\", target:\"payload\" }]);"
  },
  {
    "id": "source-drafts-revision-publication-close-015",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.guidedState().selectedSchemaPropertyPath => \"value\"",
    "observable": "uiController.guidedState().selectedSchemaPropertyPath",
    "expected": "\"value\"",
    "binding": "assert.equal(uiController.guidedState().selectedSchemaPropertyPath, \"value\");"
  },
  {
    "id": "source-drafts-revision-publication-close-016",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "arraySourceSchema.workingDraft.document.properties.value.type => \"array\"",
    "observable": "arraySourceSchema.workingDraft.document.properties.value.type",
    "expected": "\"array\"",
    "binding": "assert.equal(arraySourceSchema.workingDraft.document.properties.value.type, \"array\");"
  },
  {
    "id": "source-drafts-revision-publication-close-017",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "arraySourceSchema.workingDraft.document.properties.value.items.type => \"object\"",
    "observable": "arraySourceSchema.workingDraft.document.properties.value.items.type",
    "expected": "\"object\"",
    "binding": "assert.equal(arraySourceSchema.workingDraft.document.properties.value.items.type, \"object\");"
  },
  {
    "id": "source-drafts-revision-publication-close-018",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "array source inference recursively preserves the first item schema",
    "observable": "arraySourceSchema.workingDraft.document.properties.value.items.properties.quantity.type",
    "expected": "\"number\"",
    "binding": "assert.equal(arraySourceSchema.workingDraft.document.properties.value.items.properties.quantity.type, \"number\", \"array source inference recursively preserves the first item schema\");"
  },
  {
    "id": "source-drafts-revision-publication-close-019",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "empty arrays retain an explicit empty item schema",
    "observable": "emptyArraySchema.workingDraft.document.properties.value",
    "expected": "{ type:\"array\", items:{} }",
    "binding": "assert.deepEqual(emptyArraySchema.workingDraft.document.properties.value, { type:\"array\", items:{} }, \"empty arrays retain an explicit empty item schema\");"
  },
  {
    "id": "source-drafts-revision-publication-close-020",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.schemas() => sourceLibraryBefore",
    "observable": "uiController.schemas()",
    "expected": "sourceLibraryBefore",
    "binding": "assert.deepEqual(uiController.schemas(), sourceLibraryBefore);"
  },
  {
    "id": "source-drafts-revision-publication-close-021",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiValues.get(\"my-chrome-utilities.schema-library.v1\") => sourceStorageBefore",
    "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
    "expected": "sourceStorageBefore",
    "binding": "assert.equal(uiValues.get(\"my-chrome-utilities.schema-library.v1\"), sourceStorageBefore);"
  },
  {
    "id": "source-drafts-revision-publication-close-022",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "a transient Source draft reaches the publication review",
    "observable": "elements.get(\"#schema-revision-review\").open",
    "expected": "true",
    "binding": "assert.equal(elements.get(\"#schema-revision-review\").open, true, \"a transient Source draft reaches the publication review\");"
  },
  {
    "id": "source-drafts-revision-publication-close-023",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.schemas() => sourceLibraryBefore",
    "observable": "uiController.schemas()",
    "expected": "sourceLibraryBefore",
    "binding": "assert.deepEqual(uiController.schemas(), sourceLibraryBefore);"
  },
  {
    "id": "source-drafts-revision-publication-close-024",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "canceling Source publication leaves both the library and storage unchanged",
    "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
    "expected": "sourceStorageBefore",
    "binding": "assert.equal(uiValues.get(\"my-chrome-utilities.schema-library.v1\"), sourceStorageBefore, \"canceling Source publication leaves both the library and storage unchanged\");"
  },
  {
    "id": "source-drafts-revision-publication-close-025",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.schemas() => sourceLibraryBefore",
    "observable": "uiController.schemas()",
    "expected": "sourceLibraryBefore",
    "binding": "assert.deepEqual(uiController.schemas(), sourceLibraryBefore);"
  },
  {
    "id": "source-drafts-revision-publication-close-026",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "discarding a transient Source draft leaves no stored schema behind",
    "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
    "expected": "sourceStorageBefore",
    "binding": "assert.equal(uiValues.get(\"my-chrome-utilities.schema-library.v1\"), sourceStorageBefore, \"discarding a transient Source draft leaves no stored schema behind\");"
  },
  {
    "id": "source-drafts-revision-publication-close-027",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "confirming Source publication appends exactly one schema",
    "observable": "uiController.schemas().length",
    "expected": "sourceLibraryBefore.length + 1",
    "binding": "assert.equal(uiController.schemas().length, sourceLibraryBefore.length + 1, \"confirming Source publication appends exactly one schema\");"
  },
  {
    "id": "source-drafts-revision-publication-close-028",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "installed publication reports the exact current-Live revalidation outcome",
    "observable": "elements.get(\"#schema-result\").textContent",
    "expected": "\"Published Checkout schema revision 1. Revalidated 3 current Live events.\"",
    "binding": "assert.equal(elements.get(\"#schema-result\").textContent, \"Published Checkout schema revision 1. Revalidated 3 current Live events.\", \"installed publication reports the exact current-Live revalidation outcome\");"
  },
  {
    "id": "source-drafts-revision-publication-close-029",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "relationship-tree rerenders retain the completed publication outcome",
    "observable": "elements.get(\"#schema-result\").textContent",
    "expected": "\"Published Checkout schema revision 1. Revalidated 3 current Live events.\"",
    "binding": "assert.equal(elements.get(\"#schema-result\").textContent, \"Published Checkout schema revision 1. Revalidated 3 current Live events.\", \"relationship-tree rerenders retain the completed publication outcome\");"
  },
  {
    "id": "source-drafts-revision-publication-close-030",
    "method": "deepEqual",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.schemas().at(-1).assignments => [{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]",
    "observable": "uiController.schemas().at(-1).assignments",
    "expected": "[{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]",
    "binding": "assert.deepEqual(uiController.schemas().at(-1).assignments, [{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]);"
  },
  {
    "id": "source-drafts-revision-publication-close-031",
    "method": "equal",
    "owner": "test/data-layer-installed/schemas/retired-source-controller-contract-test.mjs",
    "contract": "uiController.schemas().at(-1).document.properties.total.type => \"number\"",
    "observable": "uiController.schemas().at(-1).document.properties.total.type",
    "expected": "\"number\"",
    "binding": "assert.equal(uiController.schemas().at(-1).document.properties.total.type, \"number\");"
  }
];
