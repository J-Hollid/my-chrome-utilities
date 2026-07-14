import assert from "node:assert/strict";

import {
  inspectSchemaPropertyRemoval,
  removeSchemaProperty,
  undoSchemaPropertyRemoval,
} from "../dist/data-layer-schema-property-removal.js";

const document = {
  type:"object",
  required:["page_type", "commerce", "debug"],
  properties:{
    page_type:{ type:"string" },
    commerce:{
      type:"object",
      required:["order"],
      properties:{
        order:{
          type:"object",
          propertyOrigin:"manual",
          required:["id", "value"],
          properties:{ id:{ type:"string", propertyOrigin:"manual" }, value:{ type:"number", propertyOrigin:"manual" } },
        },
      },
    },
    debug:{ type:"boolean", propertyOrigin:"manual" },
  },
};
const attachments = [
  { id:"order-id", name:"Order identifier", version:2, propertyPath:"/commerce/order/id" },
  { id:"order-value", version:1, propertyPath:"/commerce/order/value" },
  { id:"commerce-shape", version:1, propertyPath:"/commerce" },
  { id:"page-type", version:1, propertyPath:"page_type" },
];

assert.deepEqual(inspectSchemaPropertyRemoval(document, attachments, "/debug"), {
  propertyPath:"/debug",
  descendants:[],
  affectedRuleAttachments:[],
  requiresConfirmation:false,
});
assert.deepEqual(inspectSchemaPropertyRemoval(document, attachments, "/commerce"), {
  propertyPath:"/commerce",
  descendants:["/commerce/order", "/commerce/order/id", "/commerce/order/value"],
  affectedRuleAttachments:[attachments[2], attachments[0], attachments[1]],
  requiresConfirmation:true,
});

const debugRemoval = removeSchemaProperty(document, attachments, "/debug");
assert.equal(debugRemoval.document.properties.debug, undefined);
assert.deepEqual(debugRemoval.document.required, ["page_type", "commerce"]);
assert.deepEqual(document.properties.debug, { type:"boolean", propertyOrigin:"manual" });
assert.deepEqual(undoSchemaPropertyRemoval(debugRemoval).document, document);

const commerceRemoval = removeSchemaProperty(document, attachments, "/commerce");
assert.equal(commerceRemoval.document.properties.commerce, undefined);
assert.deepEqual(commerceRemoval.document.required, ["page_type", "debug"]);
assert.deepEqual(commerceRemoval.attachedRules, [attachments[3]]);
assert.deepEqual(undoSchemaPropertyRemoval(commerceRemoval).attachedRules, attachments);

const manualAncestor = removeSchemaProperty(document, attachments, "/commerce/order/id");
assert.equal(manualAncestor.document.properties.commerce.properties.order.properties.id, undefined);
assert.deepEqual(manualAncestor.document.properties.commerce.properties.order.required, ["value"]);
const lastManualLeaf = removeSchemaProperty(manualAncestor.document, manualAncestor.attachedRules, "/commerce/order/value");
assert.equal(lastManualLeaf.document.properties.commerce.properties.order, undefined);
assert.ok(lastManualLeaf.document.properties.commerce, "observed empty ancestors are retained");

const lastProperty = removeSchemaProperty({ type:"object", required:["page_type"], properties:{ page_type:{ type:"string" } } }, [], "/page_type");
assert.deepEqual(lastProperty.document.properties, {});
assert.deepEqual(lastProperty.document.required, []);
