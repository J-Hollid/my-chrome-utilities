import assert from "node:assert/strict";

const { createSchemaRelationshipTreeController } = await import(
  "../../../dist/data-layer-installed/schemas/relationship-tree-controller.js"
);

const values = new Map();
const query = { value:"" };
const category = { value:"All" };
const scrollOwner = { scrollTop:0 };
const panel = { hidden:false };
const frames = [];
const controller = createSchemaRelationshipTreeController({
  query,
  category,
  scrollOwner,
  panel,
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  scheduleFrame:(callback) => frames.push(callback),
});
const nodes = [{ key:"saved", name:"Saved schemas", kind:"branch", role:"Structural ancestor", relationshipPath:"Saved schemas", children:[
  { key:"saved:one", name:"Checkout", kind:"contributor", role:"Saved schema", category:"Saved schemas", targetKey:"saved:schema:one", relationshipPath:"Saved schemas → Checkout", children:[] },
] }];
// retired-schema-assertion: installed-dialogs-library-relationship-routing-008
assert.equal(controller.project("project:one", nodes).length, 1);
// retired-schema-assertion: installed-dialogs-library-relationship-routing-001
assert.ok(controller.isExpanded("saved"));
assert.equal(query.value, "");
assert.equal(category.value, "All");
await Promise.resolve();
frames.shift()?.();
controller.toggle("saved");
assert.equal(controller.isExpanded("saved"), false);
assert.match([...values.values()][0], /"expandedKeys":\[\]/);
controller.toggle("saved");
assert.ok(controller.isExpanded("saved"));
controller.toggle("saved");
assert.equal(controller.isExpanded("saved"), false);

query.value = "checkout";
controller.update();
// retired-schema-assertion: canonical-edit-history-settlement-overlay-049
assert.equal(controller.project("project:one", nodes)[0].children[0].match, true);
query.value = "missing";
assert.equal(controller.project("project:one", nodes).length, 0);
query.value = "checkout";
category.value = "Saved schemas";
assert.equal(controller.project("project:one", nodes).length, 1);
category.value = "Pages";
assert.equal(controller.project("project:one", nodes).length, 0);
category.value = "All";
scrollOwner.scrollTop = 73;
controller.persistScroll();
// retired-schema-assertion: installed-dialogs-library-relationship-routing-015
assert.match([...values.values()][0], /"scrollTop":73/);

const row = new EventTarget();
let actions = 0;
controller.listen(row, "click", () => { actions += 1; });
row.dispatchEvent(new Event("click"));
controller.clearRows();
row.dispatchEvent(new Event("click"));
// retired-schema-assertion: installed-dialogs-library-relationship-routing-014
assert.equal(actions, 1, "a tree rerender removes its replaced row actions");
controller.invalidateProject();
query.value = "changed";
controller.project("project:one", nodes);
assert.equal(query.value, "checkout");
assert.equal(category.value, "All");
assert.ok(controller.isExpanded("saved"));
controller.dispose();
assert.equal(controller.isExpanded("saved"), false);
// retired-schema-assertion: installed-dialogs-library-relationship-routing-009
assert.ok(controller.project("project:one", nodes)[0], "the direct tree owner returns its projected root");
// retired-schema-assertion: installed-dialogs-library-relationship-routing-004
assert.deepEqual(controller.project("project:one", nodes).map(({ key }) => key), ["saved"],
  "the direct tree owner preserves projected root identity");
