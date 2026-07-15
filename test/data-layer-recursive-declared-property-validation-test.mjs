import assert from "node:assert/strict";

import { validateWithSchema } from "../dist/data-layer-schema-verification.js";

const event = (payload) => ({ sourceId:"history", eventName:"pageview", payload, rawInput:[] });
const document = {
  type:"object", additionalProperties:false,
  properties:{
    page_type:{ type:"string" },
    commerce:{ type:"object", properties:{ currency:{ type:"string" }, order:{ type:"object", properties:{ id:{ type:"string" } } } } },
    products:{ type:"array", items:{ type:"object", properties:{ product_id:{ type:"string" }, product_name:{ type:"string" }, attributes:{ type:"object", properties:{ color:{ type:"string" } } } } } },
    tags:{ type:"array", items:{ type:"string" } },
  },
};
const schema = { id:"schema:pageview", name:"Generic pageview", version:4, document, assignments:[] };
const validPayload = {
  page_type:"product", commerce:{ currency:"EUR", order:{ id:"order-1" } },
  products:[
    { product_id:"one", product_name:"Phone", attributes:{ color:"black" } },
    { product_id:"two", product_name:"Case", attributes:{ color:"blue" } },
  ],
  tags:["featured"],
};
const documentBytes = JSON.stringify(document);

assert.deepEqual(validateWithSchema(event(validPayload), schema, [schema]).issues, []);

for (const [pointer, payload, actual, schemaLocation] of [
  ["/commerce/debug", { ...validPayload, commerce:{ ...validPayload.commerce, debug:true } }, "boolean", "#/properties/commerce/additionalProperties"],
  ["/commerce/order/internal_id", { ...validPayload, commerce:{ ...validPayload.commerce, order:{ ...validPayload.commerce.order, internal_id:"internal" } } }, "string", "#/properties/commerce/properties/order/additionalProperties"],
  ["/products/0/debug", { ...validPayload, products:[{ ...validPayload.products[0], debug:true }, validPayload.products[1]] }, "boolean", "#/properties/products/items/additionalProperties"],
  ["/products/1/attributes/source", { ...validPayload, products:[validPayload.products[0], { ...validPayload.products[1], attributes:{ ...validPayload.products[1].attributes, source:"feed" } }] }, "string", "#/properties/products/items/properties/attributes/additionalProperties"],
]) {
  assert.deepEqual(validateWithSchema(event(payload), schema, [schema]).issues, [{
    instancePath:pointer, message:"Undeclared property", expected:"declared property", actual,
    schemaName:"Generic pageview", schemaVersion:4, schemaLocation,
  }]);
}

const repeated = validateWithSchema(event({
  ...validPayload,
  products:[
    { ...validPayload.products[0], debug:true },
    { ...validPayload.products[1], debug:false, metadata:{ internal_id:"1", source:"feed" } },
  ],
}), schema, [schema]);
assert.deepEqual(repeated.issues.map(({ instancePath, actual }) => [instancePath, actual]), [
  ["/products/0/debug", "boolean"],
  ["/products/1/debug", "boolean"],
  ["/products/1/metadata", "object"],
]);

const wrongObjectType = validateWithSchema(event({ ...validPayload, commerce:{ ...validPayload.commerce, order:"invalid" } }), schema, [schema]);
assert.deepEqual(wrongObjectType.issues.map(({ instancePath, message, expected }) => [instancePath, message, expected]), [
  ["/commerce/order", "Type mismatch", "object"],
]);

const pathKeyedDocument = {
  type:"object", additionalProperties:false,
  properties:{
    "/commerce/order/id":{ type:"string" },
    "/products/*/product_name":{ type:"string" },
    "/products/*/attributes/color":{ type:"string" },
  },
};
const pathKeyed = { ...schema, document:pathKeyedDocument };
const pathKeyedBytes = JSON.stringify(pathKeyedDocument);
assert.deepEqual(validateWithSchema(event({
  commerce:{ order:{ id:"1" } },
  products:[{ product_name:"Phone", attributes:{ color:"black" } }, { product_name:"Case", attributes:{ color:"blue" } }],
}), pathKeyed, [pathKeyed]).issues, []);
assert.equal(JSON.stringify(pathKeyedDocument), pathKeyedBytes);

const open = { ...schema, document:{ ...document, additionalProperties:true }, attachedRules:[{
  id:"currency", name:"Allowed currency", version:1, propertyPath:"/commerce/currency", operator:"allowed-values", allowedValues:["EUR"],
}] };
const openResult = validateWithSchema(event({
  ...validPayload, root_extra:true,
  commerce:{ ...validPayload.commerce, currency:"GBP", debug:true },
  products:[{ ...validPayload.products[0], debug:true }, validPayload.products[1]],
}), open, [open]);
assert.equal(openResult.issues.some(({ message }) => message === "Undeclared property"), false);
assert.equal(openResult.issues.some(({ instancePath, message }) => instancePath === "/commerce/currency" && message === "Value is not allowed"), true);
assert.equal(JSON.stringify(document), documentBytes);

console.log("recursive declared-property validation tests passed");
