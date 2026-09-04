import assert from "node:assert/strict";
import { createRetiredSchemaControllerFixture } from
  "../../support/retired-schema-controller-fixture.mjs";

const fixture = createRetiredSchemaControllerFixture();
const { elements, fakeDocument, relationshipActions, uiController, uiValues } = fixture;

for (const selector of ["#schema-rule-revision-review", "#schema-rule-revision-review-summary",
  "#confirm-schema-rule-revision-review", "#cancel-schema-rule-revision"]) {
  const created = fakeDocument.body.querySelector(selector);

  // retired-schema-assertion: installed-dialogs-library-relationship-routing-001
  assert.ok(created, `Schemas creates ${selector} from a minimal dialog host`);
  elements.set(selector, created);
}

// retired-schema-assertion: installed-dialogs-library-relationship-routing-002
assert.equal(elements.get("#confirm-schema-rule-revision-review").id, "confirm-schema-rule-revision-review",
  "Schemas preserves the installed browser contract for rule revision confirmation");
uiController.mount();

// retired-schema-assertion: installed-dialogs-library-relationship-routing-003
assert.equal(fixture.layeredProfileMounts, 1, "Schemas mounts the layered Profile editor exactly once");

// retired-schema-assertion: installed-dialogs-library-relationship-routing-004
assert.deepEqual(elements.get("#schema-rule-types").children.map(({ value }) => value),
  ["string", "number", "boolean", "object", "array"],
  "Schemas replaces the legacy rule-kind choices with canonical value types at its installed boundary");

// retired-schema-assertion: installed-dialogs-library-relationship-routing-005
assert.deepEqual(uiController.rules().find(({ id }) => id === "rule:quantities")?.allowedValues, [1, 2],
  "Schemas migrates parameter-backed reusable allowed values at the installed storage boundary");

// retired-schema-assertion: installed-dialogs-library-relationship-routing-006
assert.equal(uiController.rules().find(({ id }) => id === "rule:quantities")?.parameters, undefined);

// retired-schema-assertion: installed-dialogs-library-relationship-routing-007
assert.deepEqual(JSON.parse(uiValues.get("my-chrome-utilities.schema-rule-library.v1"))
  .find(({ id }) => id === "rule:quantities").allowedValues, [1, 2],
"Schemas persists the canonical reusable-rule migration for future installed owners");
await uiController.hydrateActiveProjectForSchemas();

// retired-schema-assertion: installed-dialogs-library-relationship-routing-008
assert.equal(elements.get("#schema-result").textContent, "Loaded schema contributors for Project One.");
const initialSavedRow = elements.get("#schema-list").children.find(
  ({ dataset }) => dataset.schemaEntryKey === "saved:schema:page",
);

// retired-schema-assertion: installed-dialogs-library-relationship-routing-009
assert.ok(initialSavedRow, "the Schema owner renders saved relationship-tree rows");
initialSavedRow.children[2].click();
initialSavedRow.children[3].click();
initialSavedRow.children[5].click();

// retired-schema-assertion: installed-dialogs-library-relationship-routing-010
assert.deepEqual(relationshipActions,
  ["adopt:schema:page", "build:schema:page:published:1", "missing:schema:page"]);

// retired-schema-assertion: installed-dialogs-library-relationship-routing-011
assert.equal(elements.get("#schema-specification-builder").hidden, false);
fixture.closeSpecification();

// retired-schema-assertion: installed-dialogs-library-relationship-routing-012
assert.equal(elements.get("#schema-specification-builder").hidden, true);
const contributorRow = elements.get("#schema-list").children.find(
  ({ dataset }) => dataset.schemaEntryKey === "pages:checkout",
);
contributorRow.children[0].click();
elements.get("#schema-list").children.find(
  ({ dataset }) => dataset.schemaEntryKey === "pages:checkout",
).children[1].click();

// retired-schema-assertion: installed-dialogs-library-relationship-routing-013
assert.deepEqual(relationshipActions.slice(-2), ["open:pages:checkout", "studio:pages:checkout"]);

// retired-schema-assertion: installed-dialogs-library-relationship-routing-014
assert.equal(elements.get("#schema-list").children.find(
  ({ dataset }) => dataset.schemaEntryKey === "pages:checkout",
).getAttribute("aria-selected"), "true",
"opening a relationship-tree contributor marks its installed row as selected");
await Promise.resolve();
elements.get("#workspace-panel-data-layer").scrollTop = 37;
elements.get("#workspace-panel-data-layer").dispatch("scroll");

// retired-schema-assertion: installed-dialogs-library-relationship-routing-015
assert.match(uiValues.get("view:my-chrome-utilities.schema-relationship-tree-view.v1:project:one"),
  /"scrollTop":37/);
const treeControls = elements.get("#schema-list").querySelectorAll();
elements.get("#schema-list").dispatch("keydown", { target:treeControls[0], key:"End" });

// retired-schema-assertion: installed-dialogs-library-relationship-routing-016
assert.equal(treeControls.at(-1).focused, true, "tree keyboard navigation remains controller-owned");

export { fixture };
