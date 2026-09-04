/** Original retired assertions and their direct executable owners. */
export const group = {
  "group": "source drafts, revision lifecycle, publication, and close routing",
  "lines": "247-396",
  "checks": [
    {
      "id": "source-drafts-revision-publication-close-001",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "richSourceSchema.assignments => [{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]",
      "observable": "richSourceSchema.assignments",
      "expected": "[{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]"
    },
    {
      "id": "source-drafts-revision-publication-close-002",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "richSourceSchema.workingDraft.assignments => [{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]",
      "observable": "richSourceSchema.workingDraft.assignments",
      "expected": "[{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]"
    },
    {
      "id": "source-drafts-revision-publication-close-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "uiController.guidedState().selectedSchemaPropertyPath => \"total\"",
      "observable": "uiController.guidedState().selectedSchemaPropertyPath",
      "expected": "\"total\""
    },
    {
      "id": "source-drafts-revision-publication-close-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "elements.get(\"#schema-result\").textContent => \"Library template fields loaded into a new schema draft.\"",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "\"Library template fields loaded into a new schema draft.\""
    },
    {
      "id": "source-drafts-revision-publication-close-005",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "elements.get(\"#schema-editor-name\").focused => true",
      "observable": "elements.get(\"#schema-editor-name\").focused",
      "expected": "true"
    },
    {
      "id": "source-drafts-revision-publication-close-006",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "relationshipActions.at(-1) => \"view:Schemas\"",
      "observable": "relationshipActions.at(-1)",
      "expected": "\"view:Schemas\""
    },
    {
      "id": "source-drafts-revision-publication-close-007",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "source-created properties retain the canonical property-row browser contract",
      "observable": "elements.get(\"#schema-property-tree\").children.map(({ dataset }) => dataset.schemaPropertyCanonicalPath)",
      "expected": "[\"/total\", \"/coupon\"]"
    },
    {
      "id": "source-drafts-revision-publication-close-008",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "source-created property rows expose their canonical labels as headings",
      "observable": "elements.get(\"#schema-property-tree\").children.map(({ children }) => children[0].textContent)",
      "expected": "[\"total\", \"coupon\"]"
    },
    {
      "id": "source-drafts-revision-publication-close-009",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/assignment-controller-test.mjs",
      "contract": "schema target input updates the transient draft through the exact installed event type",
      "observable": "uiController.state().transientDraft.workingDraft.assignments[0].target",
      "expected": "\"raw input\""
    },
    {
      "id": "source-drafts-revision-publication-close-010",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "opening a source does not append transient editor state to the Schema Library",
      "observable": "uiController.schemas()",
      "expected": "sourceLibraryBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-011",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/editor-route-controller-test.mjs",
      "contract": "opening a source performs no premature Schema Library storage write",
      "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
      "expected": "sourceStorageBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-012",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "primitiveSourceSchema.workingDraft.document.type => \"object\"",
      "observable": "primitiveSourceSchema.workingDraft.document.type",
      "expected": "\"object\""
    },
    {
      "id": "source-drafts-revision-publication-close-013",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "primitive source payloads remain editable through the legacy value wrapper",
      "observable": "primitiveSourceSchema.workingDraft.document.properties.value.type",
      "expected": "\"boolean\""
    },
    {
      "id": "source-drafts-revision-publication-close-014",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "primitiveSourceSchema.workingDraft.assignments => [{ sourceId:\"page\", eventName:\"consent\", target:\"payload\" }]",
      "observable": "primitiveSourceSchema.workingDraft.assignments",
      "expected": "[{ sourceId:\"page\", eventName:\"consent\", target:\"payload\" }]"
    },
    {
      "id": "source-drafts-revision-publication-close-015",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "uiController.guidedState().selectedSchemaPropertyPath => \"value\"",
      "observable": "uiController.guidedState().selectedSchemaPropertyPath",
      "expected": "\"value\""
    },
    {
      "id": "source-drafts-revision-publication-close-016",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "arraySourceSchema.workingDraft.document.properties.value.type => \"array\"",
      "observable": "arraySourceSchema.workingDraft.document.properties.value.type",
      "expected": "\"array\""
    },
    {
      "id": "source-drafts-revision-publication-close-017",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "arraySourceSchema.workingDraft.document.properties.value.items.type => \"object\"",
      "observable": "arraySourceSchema.workingDraft.document.properties.value.items.type",
      "expected": "\"object\""
    },
    {
      "id": "source-drafts-revision-publication-close-018",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "array source inference recursively preserves the first item schema",
      "observable": "arraySourceSchema.workingDraft.document.properties.value.items.properties.quantity.type",
      "expected": "\"number\""
    },
    {
      "id": "source-drafts-revision-publication-close-019",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "empty arrays retain an explicit empty item schema",
      "observable": "emptyArraySchema.workingDraft.document.properties.value",
      "expected": "{ type:\"array\", items:{} }"
    },
    {
      "id": "source-drafts-revision-publication-close-020",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "uiController.schemas() => sourceLibraryBefore",
      "observable": "uiController.schemas()",
      "expected": "sourceLibraryBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-021",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "uiValues.get(\"my-chrome-utilities.schema-library.v1\") => sourceStorageBefore",
      "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
      "expected": "sourceStorageBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-022",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-deletion-workflow-test.mjs",
      "contract": "a transient Source draft reaches the publication review",
      "observable": "elements.get(\"#schema-revision-review\").open",
      "expected": "true"
    },
    {
      "id": "source-drafts-revision-publication-close-023",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "uiController.schemas() => sourceLibraryBefore",
      "observable": "uiController.schemas()",
      "expected": "sourceLibraryBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-024",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "canceling Source publication leaves both the library and storage unchanged",
      "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
      "expected": "sourceStorageBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-025",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "uiController.schemas() => sourceLibraryBefore",
      "observable": "uiController.schemas()",
      "expected": "sourceLibraryBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-026",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "discarding a transient Source draft leaves no stored schema behind",
      "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
      "expected": "sourceStorageBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-027",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/editor-route-controller-test.mjs",
      "contract": "confirming Source publication appends exactly one schema",
      "observable": "uiController.schemas().length",
      "expected": "sourceLibraryBefore.length + 1"
    },
    {
      "id": "source-drafts-revision-publication-close-028",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "installed publication reports the exact current-Live revalidation outcome",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "\"Published Checkout schema revision 1. Revalidated 3 current Live events.\""
    },
    {
      "id": "source-drafts-revision-publication-close-029",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "relationship-tree rerenders retain the completed publication outcome",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "\"Published Checkout schema revision 1. Revalidated 3 current Live events.\""
    },
    {
      "id": "source-drafts-revision-publication-close-030",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "uiController.schemas().at(-1).assignments => [{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]",
      "observable": "uiController.schemas().at(-1).assignments",
      "expected": "[{ sourceId:\"gtm\", eventName:\"checkout\", target:\"payload\" }]"
    },
    {
      "id": "source-drafts-revision-publication-close-031",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "uiController.schemas().at(-1).document.properties.total.type => \"number\"",
      "observable": "uiController.schemas().at(-1).document.properties.total.type",
      "expected": "\"number\""
    },
    {
      "id": "source-drafts-revision-publication-close-032",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "Source confirmation performs the first and only library write",
      "observable": "schemaStorageWrites",
      "expected": "sourceWritesBeforePublish + 1"
    },
    {
      "id": "source-drafts-revision-publication-close-033",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "uiController.state().activeSchemaId => undefined",
      "observable": "uiController.state().activeSchemaId",
      "expected": "undefined"
    },
    {
      "id": "source-drafts-revision-publication-close-034",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "elements.get(\"#schema-editor\").hidden => true",
      "observable": "elements.get(\"#schema-editor\").hidden",
      "expected": "true"
    },
    {
      "id": "source-drafts-revision-publication-close-035",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "Source publication closes the review and returns to the list",
      "observable": "elements.get(\"#schema-revision-review\").open",
      "expected": "false"
    },
    {
      "id": "source-drafts-revision-publication-close-036",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "uiController.schemas() => newLibraryBefore",
      "observable": "uiController.schemas()",
      "expected": "newLibraryBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-037",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "New Schema editing remains transient before confirmation",
      "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
      "expected": "newStorageBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-038",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "uiController.schemas() => newLibraryBefore",
      "observable": "uiController.schemas()",
      "expected": "newLibraryBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-039",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "cancel and close remove a transient New Schema without library mutation",
      "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
      "expected": "newStorageBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-040",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/editor-route-controller-test.mjs",
      "contract": "close does not route a transient draft through discard review",
      "observable": "elements.get(\"#close-schema-editor-review\").open",
      "expected": "false"
    },
    {
      "id": "source-drafts-revision-publication-close-041",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "close keeps the empty Schema detail region in the wide layout",
      "observable": "elements.get(\"#schema-detail\").hidden",
      "expected": "false"
    },
    {
      "id": "source-drafts-revision-publication-close-042",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/relationship-tree-controller-test.mjs",
      "contract": "close restores the empty Schema detail content",
      "observable": "elements.get(\"#schema-detail-empty\").hidden",
      "expected": "false"
    },
    {
      "id": "source-drafts-revision-publication-close-043",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "elements.get(\"#schema-revision-review\").open => true",
      "observable": "elements.get(\"#schema-revision-review\").open",
      "expected": "true"
    },
    {
      "id": "source-drafts-revision-publication-close-044",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "uiController.schemas() => newLibraryBefore",
      "observable": "uiController.schemas()",
      "expected": "newLibraryBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-045",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "save-and-close waits for revision confirmation before persistence",
      "observable": "schemaStorageWrites",
      "expected": "newWritesBeforeReview"
    },
    {
      "id": "source-drafts-revision-publication-close-046",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "confirming New Schema appends exactly once",
      "observable": "uiController.schemas().length",
      "expected": "newLibraryBefore.length + 1"
    },
    {
      "id": "source-drafts-revision-publication-close-047",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "uiController.schemas().at(-1).name => \"Published New\"",
      "observable": "uiController.schemas().at(-1).name",
      "expected": "\"Published New\""
    },
    {
      "id": "source-drafts-revision-publication-close-048",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "New Schema confirmation performs its first library write",
      "observable": "schemaStorageWrites",
      "expected": "newWritesBeforePublish + 1"
    },
    {
      "id": "source-drafts-revision-publication-close-049",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "uiController.state().activeSchemaId => undefined",
      "observable": "uiController.state().activeSchemaId",
      "expected": "undefined"
    },
    {
      "id": "source-drafts-revision-publication-close-050",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "New Schema publication clears transient editor state",
      "observable": "elements.get(\"#schema-editor\").hidden",
      "expected": "true"
    },
    {
      "id": "source-drafts-revision-publication-close-051",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "elements.get(\"#schema-revision-review\").open => true",
      "observable": "elements.get(\"#schema-revision-review\").open",
      "expected": "true"
    },
    {
      "id": "source-drafts-revision-publication-close-052",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "uiController.schemas() => sourceLibraryBefore",
      "observable": "uiController.schemas()",
      "expected": "sourceLibraryBefore"
    },
    {
      "id": "source-drafts-revision-publication-close-053",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "close-review save also delegates to confirmation without eager publication",
      "observable": "schemaStorageWrites",
      "expected": "closeReviewWrites"
    },
    {
      "id": "source-drafts-revision-publication-close-054",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "relationshipActions.at(-1) => \"build:schema:page:working-draft\"",
      "observable": "relationshipActions.at(-1)",
      "expected": "\"build:schema:page:working-draft\""
    },
    {
      "id": "source-drafts-revision-publication-close-055",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.parentSchemaId => \"schema:parent\"",
      "observable": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.parentSchemaId",
      "expected": "\"schema:parent\""
    },
    {
      "id": "source-drafts-revision-publication-close-056",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/library-deletion-workflow-test.mjs",
      "contract": "elements.get(\"#schema-inheritance-provenance\").textContent => /Parent v2/",
      "observable": "elements.get(\"#schema-inheritance-provenance\").textContent",
      "expected": "/Parent v2/"
    },
    {
      "id": "source-drafts-revision-publication-close-057",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "elements.get(\"#schema-inherited-rule-groups\").hidden => false",
      "observable": "elements.get(\"#schema-inherited-rule-groups\").hidden",
      "expected": "false"
    },
    {
      "id": "source-drafts-revision-publication-close-058",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "elements.get(\"#schema-inherited-rule-groups\").children[0].children[0].textContent => /Active inherited \\(1\\)/",
      "observable": "elements.get(\"#schema-inherited-rule-groups\").children[0].children[0].textContent",
      "expected": "/Active inherited \\(1\\)/"
    },
    {
      "id": "source-drafts-revision-publication-close-059",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.document.additionalProperties => false",
      "observable": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.document.additionalProperties",
      "expected": "false"
    },
    {
      "id": "source-drafts-revision-publication-close-060",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "saving opens the controller-owned revision review",
      "observable": "elements.get(\"#schema-revision-review\").open",
      "expected": "true"
    },
    {
      "id": "source-drafts-revision-publication-close-061",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "uiController.schemas()[0].version => 2",
      "observable": "uiController.schemas()[0].version",
      "expected": "2"
    },
    {
      "id": "source-drafts-revision-publication-close-062",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "uiController.schemas()[0].name => \"Page checkout\"",
      "observable": "uiController.schemas()[0].name",
      "expected": "\"Page checkout\""
    },
    {
      "id": "source-drafts-revision-publication-close-063",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/assignment-controller-test.mjs",
      "contract": "uiController.schemas()[0].documentation.description => \"Checkout payload\"",
      "observable": "uiController.schemas()[0].documentation.description",
      "expected": "\"Checkout payload\""
    },
    {
      "id": "source-drafts-revision-publication-close-064",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-deletion-workflow-test.mjs",
      "contract": "uiController.state().activeSchemaId => undefined",
      "observable": "uiController.state().activeSchemaId",
      "expected": "undefined"
    },
    {
      "id": "source-drafts-revision-publication-close-065",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "stored-schema publication clears editor state and returns to the list",
      "observable": "elements.get(\"#schema-editor\").hidden",
      "expected": "true"
    },
    {
      "id": "source-drafts-revision-publication-close-066",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "opening a published schema renders its historical revision choices",
      "observable": "elements.get(\"#schema-revision-selector\").children.map(({ value, textContent }) => ({ value, textContent }))",
      "expected": "[{ value:\"1\", textContent:\"Revision 1\" }]"
    },
    {
      "id": "source-drafts-revision-publication-close-067",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "elements.get(\"#schema-revision-comparison\").textContent => \"Revision 1 compared with current revision 2. 1 historical properties; 1 current properties.\"",
      "observable": "elements.get(\"#schema-revision-comparison\").textContent",
      "expected": "\"Revision 1 compared with current revision 2. 1 historical properties; 1 current properties.\""
    },
    {
      "id": "source-drafts-revision-publication-close-068",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "elements.get(\"#schema-revision-review\").open => true",
      "observable": "elements.get(\"#schema-revision-review\").open",
      "expected": "true"
    },
    {
      "id": "source-drafts-revision-publication-close-069",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "requesting historical restoration does not mutate the current schema before confirmation",
      "observable": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft",
      "expected": "undefined"
    },
    {
      "id": "source-drafts-revision-publication-close-070",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "cancelling historical restoration leaves the current schema unchanged",
      "observable": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft",
      "expected": "undefined"
    },
    {
      "id": "source-drafts-revision-publication-close-071",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "confirming historical restoration creates a working draft from the selected revision",
      "observable": "uiController.schemas().find(({ id }) => id === \"schema:page\").workingDraft.sourceVersion",
      "expected": "1"
    },
    {
      "id": "source-drafts-revision-publication-close-072",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "relationshipActions.at(-1) => \"build:schema:page:historical:1\"",
      "observable": "relationshipActions.at(-1)",
      "expected": "\"build:schema:page:historical:1\""
    },
    {
      "id": "source-drafts-revision-publication-close-073",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "revision duplication remains schema-controller behavior",
      "observable": "uiController.schemas().length",
      "expected": "3"
    },
    {
      "id": "source-drafts-revision-publication-close-074",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/assignment-controller-test.mjs",
      "contract": "uiController.state().activeSchemaId => undefined",
      "observable": "uiController.state().activeSchemaId",
      "expected": "undefined"
    },
    {
      "id": "source-drafts-revision-publication-close-075",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/source-controller-test.mjs",
      "contract": "elements.get(\"#close-schema-editor-review\").open => false",
      "observable": "elements.get(\"#close-schema-editor-review\").open",
      "expected": "false"
    },
    {
      "id": "source-drafts-revision-publication-close-076",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "schemaStorageWrites => storedDraftWrites",
      "observable": "schemaStorageWrites",
      "expected": "storedDraftWrites"
    },
    {
      "id": "source-drafts-revision-publication-close-077",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "uiValues.get(\"my-chrome-utilities.schema-library.v1\") => storedDraftStorage",
      "observable": "uiValues.get(\"my-chrome-utilities.schema-library.v1\")",
      "expected": "storedDraftStorage"
    },
    {
      "id": "source-drafts-revision-publication-close-078",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "close retains the stored working draft without another persistence write",
      "observable": "uiController.schemas().find(({ id }) => id === lifecycleSchemaId).workingDraft",
      "expected": "truthy"
    },
    {
      "id": "source-drafts-revision-publication-close-079",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "elements.get(\"#schema-result\").textContent => \"Working draft retained without publishing.\"",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "\"Working draft retained without publishing.\""
    },
    {
      "id": "source-drafts-revision-publication-close-080",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "schemaStorageWrites => abandonWrites",
      "observable": "schemaStorageWrites",
      "expected": "abandonWrites"
    },
    {
      "id": "source-drafts-revision-publication-close-081",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "discard-schema-draft abandons editor state without discarding the stored working draft",
      "observable": "uiController.schemas().find(({ id }) => id === lifecycleSchemaId).workingDraft",
      "expected": "truthy"
    },
    {
      "id": "source-drafts-revision-publication-close-082",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "schemaStorageWrites => discardStoredWrites + 1",
      "observable": "schemaStorageWrites",
      "expected": "discardStoredWrites + 1"
    },
    {
      "id": "source-drafts-revision-publication-close-083",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/assignment-controller-test.mjs",
      "contract": "discard-working-schema-draft is the distinct operation that mutates the stored library",
      "observable": "uiController.schemas().find(({ id }) => id === lifecycleSchemaId).workingDraft",
      "expected": "undefined"
    }
  ]
};
