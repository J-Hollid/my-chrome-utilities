import assert from "node:assert/strict";

import {
  addExpectedArrayItem,
  createExpectedPayloadDraft,
  duplicateExpectedArrayItem,
  expectedPayloadComplete,
  expectedPayloadEvaluation,
  expectedPayloadFields,
  expectedPayloadPresentation,
  expectedPropertyChoices,
  expectedPropertyPresentation,
  missingEventActualPresentation,
  normalizedExpectedPayloadSchema,
  reconcileMissingEventJourney,
  reconcileMissingEventJourneyWithReview,
  removeExpectedArrayItem,
  removeExpectedPayloadValue,
  setExpectedPayloadValue,
} from "../dist/data-layer-unified-defect-builder.js";

let seed = 0x64656665;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

const typedValue = (sample, offset) => [
  `value-${sample}-${offset}-${nextToken()}`,
  sample + offset + 0.5,
  (sample + offset) % 2 === 0,
  null,
][(sample + offset) % 4];

for (let sample = 0; sample < 200; sample += 1) {
  const propertyCount = sample % 5 + 1;
  const properties = Object.fromEntries(Array.from({ length:propertyCount }, (_, index) => [
    `property_${sample}_${index}`,
    { type:["string", "number", "boolean", undefined][index % 4] },
  ]));
  const propertyNames = Object.keys(properties);
  const required = propertyNames.filter((_, index) => index % 2 === sample % 2);
  const constrainedIndex = sample % propertyCount;
  const constrainedName = propertyNames[constrainedIndex];
  const values = [typedValue(sample, 0), typedValue(sample, 1), typedValue(sample, 2)];
  const schema = {
    id:`schema-${sample}`,
    name:`Schema ${sample}`,
    version:sample % 7 + 1,
    document:{ type:"object", required, properties },
    assignments:[],
    attachedRules:[{
      id:`rule-${sample}`,
      name:`Rule ${sample}`,
      version:1,
      propertyPath:`/${constrainedName}`,
      operator:["allowed-values", "allowed_values", "Allowed values"][sample % 3],
      allowedValues:values,
    }],
  };
  const schemaSnapshot = structuredClone(schema);
  const choices = expectedPropertyChoices(schema);

  assert.deepEqual(schema, schemaSnapshot, "choice derivation must not mutate the schema");
  assert.deepEqual(choices.map(({ property }) => property), propertyNames,
    "property choice order must follow schema document order");
  for (const [index, choice] of choices.entries()) {
    assert.equal(choice.pointer, `/${propertyNames[index]}`);
    assert.equal(choice.required, required.includes(choice.property));
    assert.equal(choice.type, properties[choice.property].type ?? "value");
    assert.deepEqual(choice.schemaValues, index === constrainedIndex ? values : []);
  }

  const constrained = choices[constrainedIndex];
  assert.deepEqual(expectedPropertyPresentation(constrained, { method:"generic" }), {
    text:`${constrainedName} is ${values.map(String).join(" OR ")}`,
    source:"schema constraint",
  });
  for (const value of values) {
    assert.deepEqual(expectedPropertyPresentation(constrained, { method:"schema-value", value }), {
      text:`${constrainedName} is ${String(value)}`,
      source:"schema-provided value",
    });
  }
  assert.throws(() => expectedPropertyPresentation(constrained, {
    method:"schema-value",
    value:`outside-${sample}`,
  }), /schema-provided value/i);
  const custom = typedValue(sample, 3);
  assert.deepEqual(expectedPropertyPresentation(constrained, { method:"custom", value:custom }), {
    text:`${constrainedName} is ${String(custom)}`,
    source:"operator custom response",
  });

  const allowedName = `item-${sample}-${nextToken()}`;
  const payloadSchema = {
    id:`payload-schema-${sample}`,
    name:`Payload schema ${sample}`,
    version:sample % 7 + 1,
    document:{
      type:"object",
      required:["label", "items"],
      properties:{
        label:{ type:"string" },
        items:{
          type:"array",
          items:{
            type:"object",
            required:["id", "name"],
            properties:{ id:{ type:"number" }, name:{ type:"string" } },
          },
        },
        enabled:{ type:"boolean" },
      },
    },
    assignments:[],
    attachedRules:[{
      id:`item-name-rule-${sample}`,
      name:`Item name ${sample}`,
      version:1,
      propertyPath:"/items/*/name",
      operator:["allowed-values", "allowed_values", "Allowed values"][sample % 3],
      allowedValues:[allowedName],
    }],
  };
  const payloadSchemaSnapshot = structuredClone(payloadSchema);
  const fields = expectedPayloadFields(payloadSchema);
  assert.deepEqual(fields.map(({ pointer }) => pointer), [
    "/label", "/items", "/items/0", "/items/0/id", "/items/0/name", "/enabled",
  ]);
  assert.deepEqual(fields.find(({ pointer }) => pointer === "/items/0/name").schemaValues, [allowedName],
    "array indexes must match wildcard schema rules");

  const emptyDraft = createExpectedPayloadDraft(payloadSchema);
  assert.deepEqual(emptyDraft, { payload:{ items:[] }, responseSources:{} });
  assert.equal(expectedPayloadComplete(payloadSchema, emptyDraft), false,
    "required arrays must contain a complete item");
  let payloadDraft = setExpectedPayloadValue(payloadSchema, emptyDraft, "/label", {
    method:"custom", value:sample,
  });
  payloadDraft = addExpectedArrayItem(payloadSchema, payloadDraft, "/items");
  assert.equal(expectedPayloadComplete(payloadSchema, payloadDraft), false,
    "required array item fields must be populated");
  payloadDraft = setExpectedPayloadValue(payloadSchema, payloadDraft, "/items/0/id", {
    method:"custom", value:String(sample + 0.5),
  });
  payloadDraft = setExpectedPayloadValue(payloadSchema, payloadDraft, "/items/0/name", {
    method:"schema-value", value:allowedName,
  });
  payloadDraft = setExpectedPayloadValue(payloadSchema, payloadDraft, "/enabled", {
    method:"custom", value:sample % 2 === 0 ? "true" : "false",
  });
  assert.deepEqual(Object.keys(payloadDraft.payload), ["label", "items", "enabled"],
    "payload keys must follow schema order regardless of edit order");
  assert.deepEqual(payloadDraft.payload, {
    label:String(sample),
    items:[{ id:sample + 0.5, name:allowedName }],
    enabled:sample % 2 === 0,
  });
  assert.equal(expectedPayloadComplete(payloadSchema, payloadDraft), true);
  assert.equal(expectedPayloadPresentation(`event-${sample}`, payloadDraft.payload),
    `event-${sample} is fired with`);
  assert.equal(expectedPayloadEvaluation(payloadSchema, payloadDraft).state, "Valid");
  assert.deepEqual(payloadDraft.responseProvenance["/items/0/name"], {
    id:`item-name-rule-${sample}`,
    name:`Item name ${sample}`,
    version:1,
    propertyPath:"/items/*/name",
  });
  assert.deepEqual(emptyDraft, { payload:{ items:[] }, responseSources:{} },
    "payload operations must not mutate earlier drafts");
  assert.deepEqual(payloadSchema, payloadSchemaSnapshot,
    "payload derivation and edits must not mutate the schema");
  assert.throws(() => setExpectedPayloadValue(payloadSchema, payloadDraft, "/items/0/name", {
    method:"schema-value", value:`outside-${sample}`,
  }), /schema-provided value/i);
  const invalidPayloadDraft = setExpectedPayloadValue(payloadSchema, payloadDraft, "/items/0/name", {
    method:"custom", value:`outside-${sample}`,
  });
  const invalidEvaluation = expectedPayloadEvaluation(payloadSchema, invalidPayloadDraft);
  assert.notEqual(invalidEvaluation.state, "Valid");
  assert.ok(invalidEvaluation.issues.some(({ instancePath }) => instancePath === "/items/0/name"));
  assert.equal(invalidPayloadDraft.responseProvenance?.["/items/0/name"], undefined,
    "custom responses must clear schema-rule provenance");

  let withSibling = addExpectedArrayItem(payloadSchema, payloadDraft, "/items");
  withSibling = setExpectedPayloadValue(payloadSchema, withSibling, "/items/1/id", {
    method:"custom", value:String(sample + 1.5),
  });
  withSibling = setExpectedPayloadValue(payloadSchema, withSibling, "/items/1/name", {
    method:"custom", value:`custom-${allowedName}`,
  });
  const duplicated = duplicateExpectedArrayItem(payloadSchema, withSibling, "/items", 0);
  assert.deepEqual(duplicated.payload.items, [payloadDraft.payload.items[0], payloadDraft.payload.items[0], withSibling.payload.items[1]]);
  assert.equal(duplicated.responseSources["/items/1/id"], "operator custom response");
  assert.equal(duplicated.responseSources["/items/1/name"], "schema-provided value");
  assert.equal(duplicated.responseSources["/items/2/name"], "operator custom response",
    "duplicating before a sibling must shift that sibling's response provenance");
  assert.deepEqual(duplicated.responseProvenance["/items/1/name"], payloadDraft.responseProvenance["/items/0/name"]);
  assert.equal(duplicated.responseProvenance["/items/2/name"], undefined);
  const shifted = removeExpectedArrayItem(payloadSchema, duplicated, "/items", 0);
  assert.deepEqual(shifted.payload.items, [payloadDraft.payload.items[0], withSibling.payload.items[1]]);
  assert.equal(shifted.responseSources["/items/0/id"], "operator custom response");
  assert.equal(shifted.responseSources["/items/0/name"], "schema-provided value");
  assert.equal(shifted.responseSources["/items/1/name"], "operator custom response");
  assert.deepEqual(shifted.responseProvenance["/items/0/name"], payloadDraft.responseProvenance["/items/0/name"]);
  assert.equal(shifted.responseProvenance["/items/1/name"], undefined);
  const withoutOptional = removeExpectedPayloadValue(shifted, "/enabled");
  assert.equal(expectedPayloadComplete(payloadSchema, withoutOptional), true);
  assert.equal(withoutOptional.responseSources["/enabled"], undefined);
  assert.equal(expectedPayloadComplete(payloadSchema, removeExpectedPayloadValue(withoutOptional, "/label")), false);

  const escapedPointer = `/meta~1${sample}~0value`;
  const flatValue = `flat-${sample}-${nextToken()}`;
  const flatSchema = {
    id:`flat-schema-${sample}`,
    name:`Flat schema ${sample}`,
    version:sample % 7 + 1,
    document:{
      type:"object",
      required:["/groups", "/groups/0/code", escapedPointer],
      properties:{
        "/groups":{ type:"array" },
        "/groups/0/code":{ type:"string" },
        [escapedPointer]:{ type:"string" },
        "/untyped":{ type:"array" },
      },
    },
    assignments:[],
    attachedRules:[{
      id:`flat-rule-${sample}`,
      name:`Flat rule ${sample}`,
      version:sample % 5 + 1,
      propertyPath:"/groups/*/code",
      operator:"allowed-values",
      allowedValues:[flatValue],
    }],
  };
  const flatSchemaSnapshot = structuredClone(flatSchema);
  const normalized = normalizedExpectedPayloadSchema(flatSchema);
  assert.deepEqual(normalizedExpectedPayloadSchema(normalized), normalized,
    "normalizing an already normalized schema must be idempotent");
  assert.deepEqual(flatSchema, flatSchemaSnapshot, "normalization must not mutate stored flat schemas");
  assert.deepEqual(normalized.document.required, ["groups", `meta/${sample}~value`]);
  assert.deepEqual(normalized.document.properties.groups, {
    type:"array",
    items:{ type:"object", properties:{ code:{ type:"string" } }, required:["code"] },
  });
  assert.deepEqual(expectedPayloadFields(flatSchema).map(({ pointer }) => pointer), [
    "/groups", "/groups/0", "/groups/0/code", escapedPointer, "/untyped",
  ]);

  let flatDraft = createExpectedPayloadDraft(flatSchema);
  assert.deepEqual(flatDraft.payload, { groups:[] });
  flatDraft = addExpectedArrayItem(flatSchema, flatDraft, "/groups");
  flatDraft = setExpectedPayloadValue(flatSchema, flatDraft, "/groups/0/code", {
    method:"schema-value", value:flatValue,
  });
  flatDraft = setExpectedPayloadValue(flatSchema, flatDraft, escapedPointer, {
    method:"custom", value:sample,
  });
  assert.deepEqual(flatDraft.payload, {
    groups:[{ code:flatValue }],
    [`meta/${sample}~value`]:String(sample),
  });
  assert.equal(expectedPayloadComplete(flatSchema, flatDraft), true);
  assert.equal(expectedPayloadEvaluation(flatSchema, flatDraft).state, "Valid");
  assert.deepEqual(flatDraft.responseProvenance["/groups/0/code"], {
    id:`flat-rule-${sample}`,
    name:`Flat rule ${sample}`,
    version:sample % 5 + 1,
    propertyPath:"/groups/*/code",
  });
  assert.throws(() => addExpectedArrayItem(flatSchema, flatDraft, "/untyped"), /item type must be defined/i);

  const visitCount = sample % 6 + 3;
  const visits = Array.from({ length:visitCount }, (_, index) => ({
    id:`visit-${sample}-${index}`,
    pathname:`/path-${sample}-${index}`,
  }));
  const startIndex = sample % (visitCount - 1);
  const endIndex = startIndex + (sample % (visitCount - startIndex));
  const previous = visits.flatMap((visit, index) => [
    {
      kind:"manual",
      id:`manual-${sample}-${index}-a`,
      visitId:visit.id,
      pathname:visit.pathname,
      text:`${index + 9}. First action ${index}`,
      template:{ kind:"custom", text:`First action ${index}` },
    },
    ...(index % 2 === 0 ? [{
      kind:"manual",
      id:`manual-${sample}-${index}-b`,
      visitId:visit.id,
      pathname:visit.pathname,
      text:`Second action ${index}`,
      template:{ kind:"custom", text:`Second action ${index}` },
    }] : []),
  ]);
  const previousSnapshot = structuredClone(previous);
  const expectation = {
    eventName:`event-${sample}`,
    sourceId:`source-${sample}`,
  };
  const reconciled = reconcileMissingEventJourneyWithReview(
    visits,
    visits[startIndex].id,
    visits[endIndex].id,
    previous,
    expectation,
  );
  const journey = reconciled.journey;

  assert.deepEqual(previous, previousSnapshot, "journey reconciliation must not mutate prior steps");
  assert.deepEqual(visits, Array.from({ length:visitCount }, (_, index) => ({
    id:`visit-${sample}-${index}`,
    pathname:`/path-${sample}-${index}`,
  })));
  assert.deepEqual(
    journey.filter(({ kind }) => kind === "pathname").map(({ visitId }) => visitId),
    visits.slice(startIndex, endIndex + 1).map(({ id }) => id),
  );
  assert.deepEqual(
    journey.filter(({ kind }) => kind === "manual").map(({ id }) => id),
    previous.filter(({ visitId }) => {
      const index = visits.findIndex(({ id }) => id === visitId);
      return index >= startIndex && index <= endIndex;
    }).map(({ id }) => id),
    "manual steps must retain visit-local order and be discarded outside the selected range",
  );
  assert.deepEqual(reconciled.review.map(({ id }) => id), previous.filter(({ visitId }) => {
    const index = visits.findIndex(({ id }) => id === visitId);
    return index < startIndex || index > endIndex;
  }).map(({ id }) => id), "manual steps outside the selected range must be returned for review");
  assert.deepEqual(journey.map(({ text }, index) => text.match(/^\d+\./)?.[0]),
    journey.map((_, index) => `${index + 1}.`), "journey numbering must be contiguous");
  const assertion = journey.at(-1);
  assert.equal(assertion.kind, "assertion");
  assert.equal(assertion.visitId, visits[endIndex].id);
  assert.equal(assertion.text, `${journey.length}. Expect ${expectation.eventName} to be pushed to ${expectation.sourceId} during ${visits[endIndex].pathname}`);
  assert.deepEqual(reconcileMissingEventJourney(
    visits,
    visits[startIndex].id,
    visits[endIndex].id,
    journey,
    expectation,
  ), journey, "reconciling an unchanged selection must be idempotent");

  assert.equal(missingEventActualPresentation({
    eventName:expectation.eventName,
    sourceId:expectation.sourceId,
    pathname:visits[endIndex].pathname,
    startedAt:`start-${sample}`,
    endedAt:`end-${sample}`,
  }), `No matching ${expectation.eventName} event was pushed or observed in ${expectation.sourceId} during the selected ${visits[endIndex].pathname} page visit.`);
}

assert.throws(() => reconcileMissingEventJourney(
  [{ id:"only", pathname:"/only" }],
  "missing",
  "only",
  [],
  { eventName:"event", sourceId:"source" },
), /start at or before/i);

console.log("unified defect builder properties: 200 generated cases passed");
