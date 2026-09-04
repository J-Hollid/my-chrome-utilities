import assert from "node:assert/strict";

const { createSchemaEditorRouteController } = await import(
  "../../../dist/data-layer-installed/schemas/editor-route-controller.js"
);

class ElementStub extends EventTarget {
  dataset = {};
  scrollTop = 0;
  clientHeight = 100;
  scrollDistance = 0;
  focused = false;
  querySelector() { return undefined; }
  scrollBy({ top }) { this.scrollDistance += top; }
  focus() { this.focused = true; }
}

const panel = new ElementStub();
const detail = new ElementStub();
panel.querySelector = (selector) => selector === "#schema-detail" ? detail : undefined;
const scrollOwner = new ElementStub();
scrollOwner.scrollTop = 48;
const frames = [];
const route = createSchemaEditorRouteController({
  panel,
  scrollOwner,
  scheduleFrame: (callback) => frames.push(callback),
});
const trigger = new ElementStub();
const reference = new ElementStub();

route.mount();
route.mount();
route.open(trigger, "saved:schema:one");
// retired-schema-assertion: installed-dialogs-library-relationship-routing-006
assert.equal(route.invokingReference(), "saved:schema:one");
// retired-schema-assertion: installed-dialogs-library-relationship-routing-011
assert.equal(panel.dataset.schemaEditorRoute, "active");
// retired-schema-assertion: installed-dialogs-library-relationship-routing-012
assert.equal(scrollOwner.scrollTop, 0);

const pageDown = new Event("keydown", { cancelable:true });
Object.defineProperties(pageDown, { key:{ value:"PageDown" }, altKey:{ value:false }, ctrlKey:{ value:false }, metaKey:{ value:false } });
panel.dispatchEvent(pageDown);
// retired-schema-assertion: installed-dialogs-library-relationship-routing-002
assert.equal(detail.scrollDistance, 85, "the active route owns Page Down movement");

route.close((key) => key === "saved:schema:one" ? reference : undefined);
// retired-schema-assertion: installed-dialogs-library-relationship-routing-016
assert.equal(route.invokingReference(), undefined);
// retired-schema-assertion: source-drafts-revision-publication-close-006
assert.equal(frames.length, 1);
frames.shift()();
// retired-schema-assertion: source-drafts-revision-publication-close-021
assert.equal(scrollOwner.scrollTop, 48);
// retired-schema-assertion: installed-dialogs-library-relationship-routing-003
assert.equal(reference.focused, true, "close restores the invoking tree reference");

route.dispose();
route.dispose();
route.mount();
route.open(trigger);
route.dispose();
panel.dispatchEvent(pageDown);
// retired-schema-assertion: source-drafts-revision-publication-close-028
assert.equal(detail.scrollDistance, 85, "dispose removes the route listener");
