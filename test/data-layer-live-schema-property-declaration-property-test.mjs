import assert from "node:assert/strict";

import {
  addLiveSchemaPropertyDeclaration,
  createLiveSchemaPropertyDeclaration,
} from "../dist/data-layer-live-schema-property-declaration.js";
import { validateWithSchema } from "../dist/data-layer-schema-verification.js";

const values = ["value", 42, true, { nested:"value" }, ["value"]];
const types = ["String", "Number", "Boolean", "Object", "Array"];

for (let sample = 0; sample < 200; sample += 1) {
  const field = `field_${sample}`;
  const value = structuredClone(values[sample % values.length]);
  const itemIndex = sample % 4;
  const payload = { groups:Array.from({ length:itemIndex + 1 }, (_, index) => ({
    existing:`existing_${index}`,
    ...(index === itemIndex ? { [field]:value } : {}),
  })) };
  const assignment = { id:`assignment_${sample}`, sourceId:"history", eventName:"observed", target:"payload" };
  const rule = { id:`rule_${sample}`, version:1, propertyPath:"/groups/*/existing", operator:"required" };
  const schema = {
    id:`schema_${sample}`, name:`Schema ${sample}`, version:1, published:true,
    document:{ type:"object", properties:{} }, assignments:[assignment], attachedRules:[rule],
    workingDraft:{
      baseVersion:1, sourceVersion:1,
      document:{
        type:"object", additionalProperties:false,
        properties:{ groups:{ type:"array", minItems:1, items:{
          type:"object", additionalProperties:false,
          properties:{ existing:{ type:"string", description:`Existing ${sample}` } },
        } } },
      },
      assignments:[assignment], attachedRules:[rule], pendingChanges:[`Existing change ${sample}`],
    },
  };
  const schemaSnapshot = structuredClone(schema);
  const payloadSnapshot = structuredClone(payload);
  const concretePath = `/groups/${itemIndex}/${field}`;
  const declaration = createLiveSchemaPropertyDeclaration(payload, concretePath, schema);
  assert.deepEqual(declaration, {
    concretePath,
    canonicalPath:`/groups/*/${field}`,
    detectedType:types[sample % types.length],
    schemaId:schema.id,
    schemaName:schema.name,
    schemaVersion:schema.version,
  });

  const updated = addLiveSchemaPropertyDeclaration(schema, declaration);
  const items = updated.workingDraft.document.properties.groups.items;
  assert.equal(items.properties[field].type, types[sample % types.length].toLowerCase());
  assert.equal(items.properties.existing.description, `Existing ${sample}`);
  assert.equal(items.additionalProperties, false);
  assert.equal(updated.workingDraft.document.properties.groups.minItems, 1);
  assert.deepEqual(updated.workingDraft.assignments, [assignment]);
  assert.deepEqual(updated.workingDraft.attachedRules, [rule]);
  assert.equal(updated.version, 1);
  assert.deepEqual(updated.workingDraft.pendingChanges, [
    `Existing change ${sample}`,
    `Declare /groups/*/${field} as ${types[sample % types.length]}`,
  ]);
  assert.deepEqual(schema, schemaSnapshot, "declaration must not mutate the generated schema");
  assert.deepEqual(payload, payloadSnapshot, "declaration must not mutate the captured payload");

  const draft = {
    ...updated,
    document:updated.workingDraft.document,
    assignments:updated.workingDraft.assignments,
    attachedRules:updated.workingDraft.attachedRules,
  };
  const validation = validateWithSchema(
    { sourceId:"history", eventName:"observed", payload, rawInput:[] }, draft, [draft],
  );
  assert.equal(validation.issues.some(({ instancePath, message }) =>
    instancePath === concretePath && message === "Undeclared property"), false,
  "the generated declaration must make its concrete Live property valid");
}

console.log("Live schema property declaration properties: 200 generated cases passed");
