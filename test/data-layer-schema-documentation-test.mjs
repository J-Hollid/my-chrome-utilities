import assert from "node:assert/strict";

import {
  canonicalDocumentationPath,
  removePropertyDocumentation,
  resolveEffectiveSchemaDocumentation,
  resolvePropertyDocumentation,
  setPropertyDocumentation,
  setSchemaDescription,
} from "../dist/data-layer-schema-documentation.js";

const empty = {};
const described = setSchemaDescription(empty, "Product detail commerce event");
assert.equal(described.description, "Product detail commerce event");
assert.deepEqual(empty, {}, "documentation edits must not mutate their source");

const documented = setPropertyDocumentation(
  described,
  "oOrder.aProducts.*.product_id",
  { displayName:"Product identifier", description:"Stable identifier used by fulfilment" },
);
assert.equal(canonicalDocumentationPath("oOrder.aProducts.0.product_id", true), "/oOrder/aProducts/*/product_id");
assert.deepEqual(Object.keys(documented.properties), ["/oOrder/aProducts/*/product_id"]);
assert.equal(
  setPropertyDocumentation(documented, "/oOrder/aProducts/*/product_id", { displayName:"Product code", description:"Current description" })
    .properties["/oOrder/aProducts/*/product_id"].displayName,
  "Product code",
  "editing documentation must replace the canonical mapping instead of duplicating it",
);
assert.deepEqual(
  setPropertyDocumentation(documented, "/oOrder/aProducts/*/product_id", { displayName:"", description:"" }),
  { description:"Product detail commerce event" },
  "clearing both fields removes only the property documentation",
);

const parent = {
  id:"generic", name:"Generic commerce", version:2, document:{ type:"object" }, assignments:[],
  documentation:{ properties:{ "/currency":{ displayName:"Currency", description:"ISO currency code" } } },
};
const child = {
  id:"product", name:"Product detail", version:3, document:{ type:"object" }, assignments:[], parentSchemaId:"generic",
  documentation:{
    description:"Product schema",
    properties:{
      "/page_type":{ displayName:"Page classification", description:"Business classification of page" },
      "/items/*/product_id":{ displayName:"Product identifier", description:"Stable product identifier" },
    },
  },
};
const inherited = resolveEffectiveSchemaDocumentation(child, [parent, child]);
assert.equal(inherited.properties["/currency"].origin.name, "Generic commerce");
assert.equal(inherited.properties["/currency"].inherited, true);
assert.equal(inherited.properties["/page_type"].origin.name, "Product detail");
assert.equal(resolvePropertyDocumentation(inherited, "/items/0/product_id").displayName, "Product identifier");
assert.equal(resolvePropertyDocumentation(inherited, "/currency").description, "ISO currency code");
assert.equal(resolvePropertyDocumentation(inherited, "/unknown"), undefined);

const overridden = {
  ...child,
  documentation:{ ...child.documentation, properties:{ ...child.documentation.properties, "/currency":{ displayName:"Checkout currency", description:"Local meaning" } } },
};
const effectiveOverride = resolveEffectiveSchemaDocumentation(overridden, [parent, overridden]);
assert.equal(effectiveOverride.properties["/currency"].description, "Local meaning");
assert.equal(effectiveOverride.properties["/currency"].origin.name, "Product detail");
assert.equal(effectiveOverride.properties["/currency"].inherited, false);
assert.equal(Object.keys(effectiveOverride.properties).filter((path) => path === "/currency").length, 1);
assert.equal(parent.documentation.properties["/currency"].description, "ISO currency code", "a local override must not mutate its parent");

const withDescendant = {
  properties:{
    "/oOrder":{ displayName:"Order", description:"Order data" },
    "/oOrder/order_id":{ displayName:"Order identifier", description:"Stable order identifier" },
    "/page_type":{ displayName:"Page type", description:"Page category" },
  },
};
assert.deepEqual(removePropertyDocumentation(withDescendant, "/oOrder"), {
  properties:{ "/page_type":{ displayName:"Page type", description:"Page category" } },
});

const unsafe = "<img src=x onerror=globalThis.documentationExecuted=true><script>alert(1)</script>";
assert.equal(
  setPropertyDocumentation({}, "/page_type", { displayName:"Page", description:unsafe }).properties["/page_type"].description,
  unsafe,
  "documentation remains plain data for text-only rendering",
);
