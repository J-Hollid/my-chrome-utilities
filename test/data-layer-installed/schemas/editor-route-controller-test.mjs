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
assert.equal(route.invokingReference(), "saved:schema:one");
assert.equal(panel.dataset.schemaEditorRoute, "active");
assert.equal(scrollOwner.scrollTop, 0);

const pageDown = new Event("keydown", { cancelable:true });
Object.defineProperties(pageDown, { key:{ value:"PageDown" }, altKey:{ value:false }, ctrlKey:{ value:false }, metaKey:{ value:false } });
panel.dispatchEvent(pageDown);
assert.equal(detail.scrollDistance, 85, "the active route owns Page Down movement");

route.close((key) => key === "saved:schema:one" ? reference : undefined);
assert.equal(route.invokingReference(), undefined);
assert.equal(frames.length, 1);
frames.shift()();
assert.equal(scrollOwner.scrollTop, 48);
assert.equal(reference.focused, true, "close restores the invoking tree reference");

route.dispose();
route.dispose();
route.mount();
route.open(trigger);
route.dispose();
panel.dispatchEvent(pageDown);
assert.equal(detail.scrollDistance, 85, "dispose removes the route listener");
