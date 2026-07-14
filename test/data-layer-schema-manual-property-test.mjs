import assert from "node:assert/strict";

import {
  addManualProperty,
  inspectManualProperty,
  manualPropertyPreview,
} from "../dist/data-layer-schema-manual-property.js";

const pageView = {
  type:"object",
  properties:{
    page_type:{ type:"string" },
    commerce:{ type:"object", properties:{ currency:{ type:"string" } } },
  },
};
const inherited = [{ type:"object", properties:{ page_name:{ type:"string" } } }];

assert.deepEqual(inspectManualProperty(pageView, inherited, { path:"page_category", type:"string" }), {
  result:"ready",
  normalizedPath:"/page_category",
  missingObjectPath:[],
});
assert.deepEqual(inspectManualProperty(pageView, inherited, { path:"commerce.order.id", type:"string" }), {
  result:"ready",
  normalizedPath:"/commerce/order/id",
  missingObjectPath:["order"],
});

for (const [definition, assistance] of [
  [{ path:"", type:"string" }, "Enter a property path"],
  [{ path:"commerce..id", type:"string" }, "Remove the empty path segment"],
  [{ path:"page_type", type:"string" }, "Go to existing property page_type"],
  [{ path:"commerce.order", type:"string" }, undefined],
  [{ path:"page_name", type:"string" }, "page_name is defined by the parent schema"],
  [{ path:"items", type:"array" }, "Select an array item type"],
]) {
  const inspected = inspectManualProperty(pageView, inherited, definition);
  if (assistance) assert.deepEqual({ result:inspected.result, assistance:inspected.assistance }, { result:"blocked", assistance });
  else assert.equal(inspected.result, "ready");
}

const stringCommerce = { type:"object", properties:{ commerce:{ type:"string" } } };
assert.equal(inspectManualProperty(stringCommerce, [], { path:"commerce.order", type:"string" }).assistance, "commerce cannot contain child properties");

for (const itemType of ["string", "number", "boolean", "object"]) {
  const definition = { path:"items", type:"array", arrayItemType:itemType };
  assert.equal(manualPropertyPreview(definition), `items is an array of ${itemType}`);
  assert.equal(inspectManualProperty(pageView, inherited, definition).result, "ready");
}

const added = addManualProperty(pageView, [], { path:"commerce.order.id", type:"string" });
assert.deepEqual(added.properties.commerce.properties.order, {
  type:"object",
  propertyOrigin:"manual",
  properties:{ id:{ type:"string", propertyOrigin:"manual" } },
});
assert.deepEqual(pageView.properties.commerce, { type:"object", properties:{ currency:{ type:"string" } } }, "manual authoring must not mutate the source document");

const arrayAdded = addManualProperty(pageView, [], { path:"items", type:"array", arrayItemType:"number" });
assert.deepEqual(arrayAdded.properties.items, { type:"array", propertyOrigin:"manual", items:{ type:"number" } });

assert.throws(
  () => addManualProperty(pageView, inherited, { path:"page_name", type:"string" }),
  /page_name is defined by the parent schema/,
  "the domain write must enforce inherited-property conflicts without relying on the UI",
);
assert.throws(
  () => addManualProperty(pageView, [], { path:"page_type", type:"number" }),
  /Go to existing property page_type/,
  "the domain write must not overwrite an existing property",
);
