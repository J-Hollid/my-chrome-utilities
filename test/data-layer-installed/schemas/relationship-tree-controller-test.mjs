import assert from "node:assert/strict";
import { createSchemaLibraryFakeDocument } from "../../support/schema-library-fake-dom.mjs";

const { createSchemaRelationshipTreeController } = await import(
  "../../../dist/data-layer-installed/schemas/relationship-tree-controller.js"
);
const { SchemaRelationshipViewCoordinator } = await import(
  "../../../dist/data-layer-installed/schemas/relationship-view-coordinator.js"
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

assert.equal(controller.project("project:one", nodes).length, 1);

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

assert.equal(controller.project("project:one", nodes)[0].children[0].match, true);
query.value = "missing";
assert.equal(controller.project("project:one", nodes).length, 0);
query.value = "checkout";
category.value = "Saved schemas";
assert.equal(controller.project("project:one", nodes).length, 1);
category.value = "Pages";
assert.equal(controller.project("project:one", nodes).length, 0);
category.value = "All";
scrollOwner.scrollTop = 37;
controller.persistScroll();

// retired-schema-assertion: installed-dialogs-library-relationship-routing-015
assert.match([...values.values()][0], /"scrollTop":37/);

const row = new EventTarget();
let actions = 0;
controller.listen(row, "click", () => { actions += 1; });
row.dispatchEvent(new Event("click"));
controller.clearRows();
row.dispatchEvent(new Event("click"));

assert.equal(actions, 1, "a tree rerender removes its replaced row actions");
controller.invalidateProject();
query.value = "changed";
controller.project("project:one", nodes);

assert.equal(query.value, "checkout");
assert.equal(category.value, "All");
assert.ok(controller.isExpanded("saved"));
controller.dispose();

assert.equal(controller.isExpanded("saved"), false);

assert.ok(controller.project("project:one", nodes)[0], "the direct tree owner returns its projected root");

assert.deepEqual(controller.project("project:one", nodes).map(({ key }) => key), ["saved"],
  "the direct tree owner preserves projected root identity");

const { document, element } = createSchemaLibraryFakeDocument();
const list = element();
const directController = createSchemaRelationshipTreeController({
  query:{value:""},category:{value:"All"},scrollOwner:{scrollTop:0},panel:{hidden:false},
  list,emptyState:element(),count:element(),storage:{},scheduleFrame:(callback) => callback(),
});
const directSchema = { id:"schema:one",name:"Checkout",version:1,published:true,
  document:{type:"object"},assignments:[] };
const directNodes = [
  { key:"saved:one",name:"Checkout",kind:"contributor",role:"Saved schema",category:"Saved schemas",
    targetKey:"saved:schema:one",relationshipPath:"Saved schemas → Checkout",children:[] },
  { key:"pages:checkout",name:"Checkout Page",kind:"contributor",role:"Page",category:"Pages",
    targetKey:"pages:checkout",relationshipPath:"Pages → Checkout",children:[] },
];
const relationshipActions=[];
directController.render({
  projectId:"project:one",nodes:directNodes,schemas:[directSchema],activeSchemaId:directSchema.id,
  invokingReference:"pages:checkout",historyCount:() => 0,editSaved() {},duplicateSaved() {},
  adoptSaved:() => relationshipActions.push("adopt:schema:page"),
  buildSpecification:() => relationshipActions.push("build:schema:page:published:1"),
  exportSaved() {},reportMissing:() => relationshipActions.push("missing:schema:page"),
  deleteSaved() {},openContributor:() => relationshipActions.push("open:pages:checkout"),
  openContributorInStudio:() => relationshipActions.push("studio:pages:checkout"),
  openProject() {},rerender() {},
});
const initialSavedRow = list.children.find(({ dataset }) => dataset.schemaEntryKey === "saved:schema:one");

// retired-schema-assertion: installed-dialogs-library-relationship-routing-009
assert.ok(initialSavedRow,"the Schema owner renders saved relationship-tree rows");
initialSavedRow.children[2].click();
initialSavedRow.children[3].click();
initialSavedRow.children[5].click();

// retired-schema-assertion: installed-dialogs-library-relationship-routing-010
assert.deepEqual(relationshipActions,["adopt:schema:page","build:schema:page:published:1","missing:schema:page"]);
const contributorRow = list.children.find(({ dataset }) => dataset.schemaEntryKey === "pages:checkout");
contributorRow.children[0].click();
contributorRow.children[1].click();

// retired-schema-assertion: installed-dialogs-library-relationship-routing-013
assert.deepEqual(relationshipActions.slice(-2),["open:pages:checkout","studio:pages:checkout"]);

// retired-schema-assertion: installed-dialogs-library-relationship-routing-014
assert.equal(contributorRow.getAttribute("aria-selected"),"true");
const treeControls = [element(),element()];
const navigation = new SchemaRelationshipViewCoordinator({ list:{ querySelectorAll:() => treeControls } });
navigation.navigate({ target:treeControls[0],key:"End",preventDefault() {} });

// retired-schema-assertion: installed-dialogs-library-relationship-routing-016
assert.equal(treeControls.at(-1).focused,true);
