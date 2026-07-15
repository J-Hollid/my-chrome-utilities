import assert from "node:assert/strict";

import {
  guidedPropertyDocument,
  mergeGuidedDocument,
} from "../dist/data-layer-guided-nested-property-merge.js";

function itemAt(document, ancestors) {
  let current = document;
  for (const ancestor of ancestors) current = current.properties[ancestor].items;
  return current;
}

for (let sample = 0; sample < 200; sample += 1) {
  const outer = `orders_${sample}`;
  const inner = `products_${sample}`;
  const name = `name_${sample}`;
  const id = `id_${sample}`;
  const namePath = `/${outer}/*/${inner}/*/${name}`;
  const idPath = `/${outer}/*/${inner}/*/${id}`;
  const nameDocument = guidedPropertyDocument(namePath, "String");
  const idDocument = guidedPropertyDocument(idPath, "Number");
  const nameSnapshot = structuredClone(nameDocument);
  const idSnapshot = structuredClone(idDocument);

  const nameThenId = mergeGuidedDocument(nameDocument, idDocument);
  const idThenName = mergeGuidedDocument(idDocument, nameDocument);
  const item = itemAt(nameThenId, [outer, inner]);
  assert.equal(item.properties[name].type, "string");
  assert.equal(item.properties[id].type, "number");
  assert.deepEqual(nameThenId, idThenName, "disjoint sibling merges must be order-independent");
  assert.deepEqual(mergeGuidedDocument(nameThenId, idDocument), nameThenId,
    "repeating a guided addition must be idempotent");
  assert.deepEqual(nameDocument, nameSnapshot, "merge must not mutate the current document");
  assert.deepEqual(idDocument, idSnapshot, "merge must not mutate the addition");

  const pointer = guidedPropertyDocument(`/products/*/${name}`, "String");
  const jsonPath = guidedPropertyDocument(`$["products"][*]["${name}"]`, "String");
  const dotted = guidedPropertyDocument(`products.*.${name}`, "String");
  assert.deepEqual(pointer, jsonPath, "JSON Pointer and JSONPath must build the same schema");
  assert.deepEqual(pointer, dotted, "JSON Pointer and dotted paths must build the same schema");

  const constrained = structuredClone(pointer);
  constrained.properties.products.minItems = sample % 5;
  constrained.properties.products.items.additionalProperties = false;
  constrained.properties.products.items.properties[name].description = `Description ${sample}`;
  const extended = mergeGuidedDocument(
    constrained,
    guidedPropertyDocument(`/products/*/${id}`, "Number"),
  );
  assert.equal(extended.properties.products.minItems, sample % 5);
  assert.equal(extended.properties.products.items.additionalProperties, false);
  assert.equal(extended.properties.products.items.properties[name].description, `Description ${sample}`);
  assert.equal(extended.properties.products.items.properties[id].type, "number");
}

console.log("guided nested property merge properties: 200 generated cases passed");
