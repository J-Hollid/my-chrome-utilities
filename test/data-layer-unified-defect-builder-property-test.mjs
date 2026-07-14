import assert from "node:assert/strict";

import {
  expectedPropertyChoices,
  expectedPropertyPresentation,
  missingEventActualPresentation,
  reconcileMissingEventJourney,
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
  const journey = reconcileMissingEventJourney(
    visits,
    visits[startIndex].id,
    visits[endIndex].id,
    previous,
    expectation,
  );

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
  }), `No matching ${expectation.eventName} event was pushed or observed in ${expectation.sourceId} during ${visits[endIndex].pathname} from start-${sample} to end-${sample}.`);
}

assert.throws(() => reconcileMissingEventJourney(
  [{ id:"only", pathname:"/only" }],
  "missing",
  "only",
  [],
  { eventName:"event", sourceId:"source" },
), /start at or before/i);

console.log("unified defect builder properties: 200 generated cases passed");
