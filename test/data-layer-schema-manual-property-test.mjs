import assert from "node:assert/strict";

import {
  addManualProperty,
  contextualManualPropertyDefinition,
  inspectManualProperty,
  manualPropertyContainerAction,
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

const containerDocument = {
  type:"object",
  required:["products", "tags"],
  properties:{
    commerce:{ type:"object", minimum:1, properties:{} },
    products:{
      type:"array",
      minimum:1,
      items:{
        type:"object",
        additionalProperties:false,
        required:["product_name"],
        properties:{
          product_name:{ type:"string", propertyOrigin:"manual", minimum:2 },
        },
      },
    },
    tags:{ type:"array", items:{ type:"string" } },
  },
};

assert.deepEqual(manualPropertyContainerAction(containerDocument, "/commerce"), {
  label:"Add child property",
  parentPath:"/commerce",
});
assert.deepEqual(manualPropertyContainerAction(containerDocument, "/products"), {
  label:"Add item property",
  parentPath:"/products/*",
});
assert.deepEqual(manualPropertyContainerAction(containerDocument, "/products/*"), {
  label:"Add child property",
  parentPath:"/products/*",
});
assert.equal(manualPropertyContainerAction(containerDocument, "/products/*/product_name"), undefined);
assert.equal(manualPropertyContainerAction(containerDocument, "/tags"), undefined);

assert.deepEqual(
  contextualManualPropertyDefinition("/products/*", "product_id", "number"),
  { path:"/products/*/product_id", type:"number" },
);
assert.deepEqual(
  contextualManualPropertyDefinition("/commerce/order", "line_items", "array", "object"),
  { path:"/commerce/order/line_items", type:"array", arrayItemType:"object" },
);
for (const childName of ["nested/path", "nested.path", "*"]) {
  const contextual = contextualManualPropertyDefinition("/commerce", childName, "string");
  assert.equal(
    inspectManualProperty(containerDocument, [], contextual).result,
    "blocked",
    "a contextual child name must not escape its fixed parent path",
  );
}

for (const path of ["products/*/product_id", "products.*.product_id"]) {
  const inspected = inspectManualProperty(containerDocument, [], { path, type:"number" });
  assert.deepEqual(inspected, {
    result:"ready",
    normalizedPath:"/products/*/product_id",
    missingObjectPath:[],
  });
}

const beforeContainerAddition = structuredClone(containerDocument);
const productAdded = addManualProperty(containerDocument, [], { path:"products/*/product_id", type:"number" });
assert.deepEqual(productAdded.properties.products.items.properties.product_id, { type:"number", propertyOrigin:"manual" });
assert.deepEqual(productAdded.properties.products.items.properties.product_name, containerDocument.properties.products.items.properties.product_name);
assert.deepEqual(productAdded.properties.products.items.required, ["product_name"]);
assert.equal(productAdded.properties.products.minimum, 1);
assert.equal(productAdded.properties.products.items.additionalProperties, false);
assert.deepEqual(containerDocument, beforeContainerAddition, "object-item authoring must not mutate its source document");

const duplicateItem = inspectManualProperty(containerDocument, [], { path:"/products/*/product_name", type:"string" });
assert.deepEqual(duplicateItem, {
  result:"blocked",
  normalizedPath:"/products/*/product_name",
  missingObjectPath:[],
  assistance:"Go to existing property /products/*/product_name",
  existingPath:"/products/*/product_name",
});

const orderAdded = addManualProperty(containerDocument, [], { path:"/commerce/order", type:"object" });
const linesAdded = addManualProperty(orderAdded, [], { path:"/commerce/order/line_items", type:"array", arrayItemType:"object" });
const skuAdded = addManualProperty(linesAdded, [], { path:"/commerce/order/line_items/*/sku", type:"string" });
assert.deepEqual(skuAdded.properties.commerce.properties.order.properties.line_items, {
  type:"array",
  propertyOrigin:"manual",
  items:{
    type:"object",
    properties:{ sku:{ type:"string", propertyOrigin:"manual" } },
  },
});
