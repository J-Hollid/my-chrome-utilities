import assert from "node:assert/strict";
import {
  guidedPropertyDocument,
  mergeGuidedDocument,
} from "../dist/data-layer-guided-nested-property-merge.js";

function addPath(document, path, type) {
  return mergeGuidedDocument(document, guidedPropertyDocument(path, type));
}

for (const [firstPath, firstType, secondPath, secondType] of [
  ["/products/*/product_name", "String", "/products/*/product_id", "Number"],
  ["/products/*/product_id", "Number", "/products/*/product_name", "String"],
  ["/orders/*/products/*/product_name", "String", "/orders/*/products/*/product_id", "Number"],
]) {
  const merged = addPath(addPath({ type:"object" }, firstPath, firstType), secondPath, secondType);
  const item = firstPath.startsWith("/orders/")
    ? merged.properties.orders.items.properties.products.items
    : merged.properties.products.items;
  assert.equal(item.properties.product_name.type, "string", `${firstPath} then ${secondPath} keeps product_name`);
  assert.equal(item.properties.product_id.type, "number", `${firstPath} then ${secondPath} keeps product_id`);
}

const productName = {
  type:"object",
  properties:{
    products:{
      type:"array",
      minItems:1,
      maxItems:20,
      items:{
        type:"object",
        required:["product_name"],
        additionalProperties:false,
        minProperties:1,
        properties:{
          product_name:{
            type:"string",
            description:"Human-readable product name",
            pattern:"^[A-Z]",
            minLength:2,
          },
        },
      },
    },
  },
};
const preserved = addPath(productName, "/products/*/product_id", "Number");
assert.deepEqual(preserved.properties.products, {
  ...productName.properties.products,
  items:{
    ...productName.properties.products.items,
    properties:{
      ...productName.properties.products.items.properties,
      product_id:{ type:"number" },
    },
  },
});
assert.deepEqual(productName.properties.products.items.properties, {
  product_name:{
    type:"string",
    description:"Human-readable product name",
    pattern:"^[A-Z]",
    minLength:2,
  },
}, "merge does not mutate the stored draft");

console.log("data-layer guided nested property merge tests passed");
