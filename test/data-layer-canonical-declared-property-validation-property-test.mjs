import assert from "node:assert/strict";

import { normalizeCanonicalSchemaDocument } from "../dist/data-layer-schema-canonical-document.js";
import { validateWithSchema } from "../dist/data-layer-schema-verification.js";

let seed = 0x63616e6f;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

const event = (payload) => ({ sourceId:"history", eventName:"pageview", payload, rawInput:[] });

for (let sample = 0; sample < 200; sample += 1) {
  const group = `groups_${sample}_${nextToken()}`;
  const leaf = `code_${sample}_${nextToken()}`;
  const scalar = `enabled_${sample}_${nextToken()}`;
  const escapedPointer = `/meta~1${sample}~0${nextToken()}`;
  const escapedProperty = escapedPointer.slice(1).replaceAll("~1", "/").replaceAll("~0", "~");
  const allowed = `allowed-${sample}-${nextToken()}`;
  const document = {
    type:"object",
    additionalProperties:false,
    required:[`/${group}/0/${leaf}`, `/${scalar}`, escapedPointer],
    properties:{
      [`/${group}`]:{ type:"array" },
      [`/${group}/0/${leaf}`]:{ type:"string" },
      [`/${scalar}`]:{ type:"boolean" },
      [escapedPointer]:{ type:"string" },
    },
  };
  const documentSnapshot = structuredClone(document);
  const normalized = normalizeCanonicalSchemaDocument(document);

  assert.deepEqual(normalizeCanonicalSchemaDocument(normalized), normalized,
    "canonical document normalization must be idempotent");
  assert.deepEqual(document, documentSnapshot,
    "canonical document normalization must not mutate stored path-keyed documents");
  assert.deepEqual(normalized.required, [group, scalar, escapedProperty]);
  assert.deepEqual(normalized.properties[group], {
    type:"array",
    items:{ type:"object", properties:{ [leaf]:{ type:"string" } }, required:[leaf] },
  });

  const schema = {
    id:`schema-${sample}`,
    name:`Schema ${sample}`,
    version:sample % 9 + 1,
    document,
    assignments:[],
    attachedRules:[{
      id:`allowed-${sample}`,
      name:`Allowed ${sample}`,
      version:1,
      propertyPath:`/${group}/*/${leaf}`,
      operator:"allowed-values",
      allowedValues:[allowed],
    }],
  };
  const schemaSnapshot = structuredClone(schema);
  const normalizedSchema = { ...schema, document:normalized };
  const validPayload = {
    [group]:[{ [leaf]:allowed }],
    [scalar]:sample % 2 === 0,
    [escapedProperty]:`meta-${sample}`,
  };

  assert.deepEqual(
    validateWithSchema(event(validPayload), schema, [schema]),
    validateWithSchema(event(validPayload), normalizedSchema, [normalizedSchema]),
    "stored path-keyed documents and normalized documents must validate equivalently",
  );
  assert.equal(validateWithSchema(event(validPayload), schema, [schema]).state, "Valid");

  const extra = validateWithSchema(event({ ...validPayload, [`extra_${sample}`]:sample }), schema, [schema]);
  assert.deepEqual(extra.issues.map(({ instancePath, message }) => [instancePath, message]), [
    [`/extra_${sample}`, "Undeclared property"],
  ]);

  const wrongType = validateWithSchema(event({
    ...validPayload,
    [group]:[{ [leaf]:sample }],
  }), schema, [schema]);
  assert.ok(wrongType.issues.some(({ instancePath, message }) =>
    instancePath === `/${group}/0/${leaf}` && message === "Type mismatch"));
  assert.equal(wrongType.issues.some(({ message }) => message === "Undeclared property"), false);
  assert.deepEqual(
    validateWithSchema(event({ ...validPayload, [group]:[{ [leaf]:sample }] }), normalizedSchema, [normalizedSchema]),
    wrongType,
    "invalid path-keyed and normalized documents must produce equivalent results",
  );

  const missingRequired = validateWithSchema(event({
    ...validPayload,
    [group]:[{}],
  }), schema, [schema]);
  assert.ok(missingRequired.issues.some(({ instancePath, message }) =>
    instancePath === `/${group}/0/${leaf}` && message === "Required value"));

  const disallowed = validateWithSchema(event({
    ...validPayload,
    [group]:[{ [leaf]:`outside-${allowed}` }],
  }), schema, [schema]);
  assert.ok(disallowed.issues.some(({ instancePath, message }) =>
    instancePath === `/${group}/0/${leaf}` && message === "Value is not allowed"));
  assert.deepEqual(schema, schemaSnapshot, "validation must not migrate stored schema documents");

  const parentProperty = `/parent_${sample}_${nextToken()}`;
  const childProperty = `/child_${sample}_${nextToken()}`;
  const parent = {
    id:`parent-${sample}`,
    name:`Parent ${sample}`,
    version:1,
    document:{ type:"object", required:[parentProperty], properties:{ [parentProperty]:{ type:"number" } } },
    assignments:[],
  };
  const child = {
    id:`child-${sample}`,
    name:`Child ${sample}`,
    version:1,
    parentSchemaId:parent.id,
    document:{
      type:"object",
      additionalProperties:false,
      required:[childProperty],
      properties:{ [childProperty]:{ type:"boolean" } },
    },
    assignments:[],
  };
  const inheritanceSnapshot = structuredClone([parent, child]);
  const inheritedPayload = {
    [parentProperty.slice(1)]:sample,
    [childProperty.slice(1)]:sample % 2 === 0,
  };
  assert.equal(validateWithSchema(event(inheritedPayload), child, [parent, child]).state, "Valid");
  const inheritedExtra = validateWithSchema(event({ ...inheritedPayload, extra:true }), child, [parent, child]);
  assert.deepEqual(inheritedExtra.issues.map(({ instancePath, message }) => [instancePath, message]), [
    ["/extra", "Undeclared property"],
  ]);
  assert.deepEqual([parent, child], inheritanceSnapshot,
    "inherited canonical validation must not mutate parent or child schemas");
}

console.log("canonical declared property validation properties: 200 generated schemas passed");
