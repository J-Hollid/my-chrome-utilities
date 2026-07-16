import assert from "node:assert/strict";

import { builtInRulesForProperty, ruleTypeAvailability } from "../dist/data-layer-schema-property-rule-picker.js";
import { exportSchema, importSchema, validateWithSchema } from "../dist/data-layer-schema-verification.js";

assert.equal(ruleTypeAvailability("object", "Allow undeclared properties"), "available");
assert.equal(ruleTypeAvailability("string", "Allow undeclared properties"), "unavailable");
assert.equal(ruleTypeAvailability("array", "Allow undeclared properties"), "unavailable");
assert.equal(builtInRulesForProperty("object").some(({ name }) => name === "Allow undeclared properties"), true);

const document = {
  type:"object", additionalProperties:false,
  properties:{
    metadata:{ type:"object", properties:{
      category:{ type:"string" },
      settings:{ type:"object", properties:{} },
    } },
    commerce:{ type:"object", properties:{} },
    products:{ type:"array", items:{ type:"object", properties:{
      attributes:{ type:"object", properties:{} },
    } } },
  },
};
const exception = (propertyPath, enabled = true) => ({
  id:`exception:${propertyPath}`, name:"Allow undeclared properties", version:1,
  propertyPath, operator:"allow-undeclared-properties", applicableType:"object", enabled,
});
const schema = {
  id:"schema:payload", name:"Payload", version:1, assignments:[], document,
  attachedRules:[exception("/metadata"), exception("/products/*/attributes")],
};
const event = (payload) => ({ sourceId:"history", eventName:"payload", payload, rawInput:[] });
const payload = {
  metadata:{ source:"feed", category:42, settings:{ debug:true } },
  commerce:{ internal:true }, debug:true,
  products:[{ attributes:{ color:"black" }, itemDebug:true }, { attributes:{ material:"steel" } }],
};

const result = validateWithSchema(event(payload), schema, [schema]);
assert.deepEqual(result.issues.map(({ instancePath, message }) => [instancePath, message]), [
  ["/debug", "Undeclared property"],
  ["/metadata/category", "Type mismatch"],
  ["/metadata/settings/debug", "Undeclared property"],
  ["/commerce/internal", "Undeclared property"],
  ["/products/0/itemDebug", "Undeclared property"],
]);
assert.equal(result.issues.some(({ instancePath }) => instancePath === "/metadata/source"), false);
assert.equal(result.issues.some(({ instancePath }) => /\/attributes\/(color|material)$/.test(instancePath)), false);

const reopened = importSchema(exportSchema(schema));
assert.equal(reopened.attachedRules[1].propertyPath, "/products/*/attributes");
assert.equal(validateWithSchema(event(payload), reopened, [reopened]).issues.some(({ instancePath }) => instancePath === "/metadata/source"), false);

const disabled = { ...schema, attachedRules:[exception("/metadata", false), exception("/products/*/attributes")] };
assert.equal(validateWithSchema(event(payload), disabled, [disabled]).issues.some(({ instancePath, message }) => instancePath === "/metadata/source" && message === "Undeclared property"), true);

console.log("schema declared-property exception tests passed");
