import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";

import {
  createExtensionSchemaPackage,
  exportJsonSchemaBundle,
  exportJsonSchemaResource,
  jsonSchemaResourceId,
} from "../dist/data-layer-json-schema-export.js";

const comparisons = [">", ">=", "==", "<", "<="];
const expectedCardinality = (prefix, comparison, limit) => comparison === ">" ? { [`min${prefix}`]:limit + 1 }
  : comparison === ">=" ? { [`min${prefix}`]:limit }
    : comparison === "==" ? { [`min${prefix}`]:limit, [`max${prefix}`]:limit }
      : comparison === "<" ? limit === 0 ? { not:{} } : { [`max${prefix}`]:limit - 1 }
        : { [`max${prefix}`]:limit };
const ajv = new Ajv2020({ strict:false });

for (let sample = 0; sample < 100; sample += 1) {
  const comparison = comparisons[sample % comparisons.length];
  const textRule = sample % 2 === 0;
  const operator = textRule ? "text-length" : "item-count";
  const prefix = textRule ? "Length" : "Items";
  const limit = sample % 23;
  const property = textRule ? { type:"string" } : { type:"array", items:{ type:"number" } };
  const schema = {
    id:`schema:generated-${sample}`, name:`Generated schema ${sample}`, version:1 + sample % 7,
    published:true, assignments:[],
    document:{ type:"object", additionalProperties:false, properties:{ value:property } },
    attachedRules:[{ id:`rule-${sample}`, version:1, propertyPath:"/value", operator, comparison, limit, parameters:String(limit) }],
  };
  const snapshot = structuredClone(schema);
  const exported = exportJsonSchemaResource(schema, [schema]);

  assert.equal(ajv.validateSchema(exported.document), true, JSON.stringify(ajv.errors));
  assert.equal(exported.document.$id, jsonSchemaResourceId(schema));
  assert.deepEqual(
    Object.fromEntries(Object.entries(exported.document.properties.value).filter(([key]) => key !== "type" && key !== "items")),
    expectedCardinality(prefix, comparison, limit),
    "generated cardinality rules must translate exactly at broad limits",
  );
  assert.deepEqual(exportJsonSchemaResource(schema, [schema]), exported,
    "standard export must be deterministic for the same schema library");
  assert.deepEqual(schema, snapshot, "standard export must not mutate extension schema state");

  const unpublished = { ...schema, id:`draft-${sample}`, name:`Draft ${sample}`, version:0, published:false };
  const bundle = exportJsonSchemaBundle([schema, unpublished]);
  assert.deepEqual(bundle.resourceIds, [jsonSchemaResourceId(schema)],
    "generated bundles must contain only current published resources");
  assert.equal(Object.keys(bundle.document.$defs).length, 1);

  const parent = { ...schema, id:`parent-${sample}`, name:`Parent ${sample}`, attachedRules:[{ id:`parent-rule-${sample}`, version:1 }] };
  const child = { ...schema, id:`child-${sample}`, name:`Child ${sample}`, parentSchemaId:parent.id, attachedRules:[{ id:`child-rule-${sample}`, version:1 }] };
  const availableRules = [{ id:`parent-rule-${sample}` }, { id:`child-rule-${sample}` }, { id:`unrelated-${sample}` }];
  const extensionPackage = createExtensionSchemaPackage(child, [parent, child, unpublished], availableRules);
  assert.deepEqual(extensionPackage.schemas.map(({ id }) => id), [parent.id, child.id],
    "extension packages must preserve generated ancestry in dependency order");
  assert.deepEqual(extensionPackage.rules.map(({ id }) => id), [`parent-rule-${sample}`, `child-rule-${sample}`],
    "extension packages must conserve only referenced reusable rules");
}

console.log("JSON Schema export properties: 100 generated cases passed");
