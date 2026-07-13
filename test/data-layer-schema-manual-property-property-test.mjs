import assert from "node:assert/strict";

import {
  addManualProperty,
  inspectManualProperty,
  manualPropertyPreview,
} from "../dist/data-layer-schema-manual-property.js";

const valueTypes = ["string", "number", "boolean", "object", "array"];
const arrayItemTypes = ["string", "number", "boolean", "object"];
let seed = 0xbb67ae85;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

function propertyAt(document, segments) {
  return segments.reduce((property, segment) => property?.properties?.[segment], document);
}

for (let sample = 0; sample < 200; sample += 1) {
  const branch = `branch_${nextToken()}`;
  const leaf = `leaf_${nextToken()}`;
  const segments = ["root", branch, leaf];
  const dottedPath = `  root . ${branch} . ${leaf}  `;
  const slashPath = `/root/${branch}/${leaf}`;
  const type = valueTypes[sample % valueTypes.length];
  const arrayItemType = type === "array" ? arrayItemTypes[sample % arrayItemTypes.length] : undefined;
  const definition = { path:dottedPath, type, ...(arrayItemType ? { arrayItemType } : {}) };
  const base = {
    type:"object",
    title:`Document ${sample}`,
    properties:{
      stable:{ type:"string", description:`Stable ${sample}` },
      root:{ type:"object", description:"Existing root", properties:{ existing:{ type:"number" } } },
    },
  };
  const snapshot = structuredClone(base);

  assert.deepEqual(inspectManualProperty(base, [], definition), {
    result:"ready",
    normalizedPath:`/${segments.join("/")}`,
    missingObjectPath:[branch],
  }, "valid nested definitions must normalize and report missing object parents in order");

  const added = addManualProperty(base, [], definition);
  const slashAdded = addManualProperty(base, [], { ...definition, path:slashPath });
  assert.deepEqual(added, slashAdded, "dot and slash paths must create the same schema structure");
  assert.deepEqual(base, snapshot, "manual property addition must not mutate its source document");
  assert.deepEqual(added.properties.stable, base.properties.stable, "manual property addition must conserve unrelated siblings");
  assert.equal(added.title, base.title, "manual property addition must conserve document metadata");
  assert.equal(added.properties.root.description, "Existing root", "manual property addition must conserve existing parent metadata");

  const parent = propertyAt(added, segments.slice(0, -1));
  const addedLeaf = propertyAt(added, segments);
  assert.equal(parent.type, "object", "missing path segments must be created as objects");
  assert.equal(parent.propertyOrigin, "manual", "created parent objects must retain manual origin");
  assert.equal(addedLeaf.type, type, "the leaf must retain its declared value type");
  assert.equal(addedLeaf.propertyOrigin, "manual", "the leaf must retain manual origin");
  assert.deepEqual(
    addedLeaf.items,
    type === "array" ? { type:arrayItemType } : undefined,
    "only array leaves may receive their declared item schema",
  );

  const expectedPreview = type === "array"
    ? `${segments.join(".")} is an array of ${arrayItemType}`
    : `${segments.join(".")} is ${type}`;
  assert.equal(manualPropertyPreview(definition), expectedPreview, "preview must describe the normalized property definition");

  const repeated = inspectManualProperty(added, [], definition);
  assert.deepEqual(
    { result:repeated.result, assistance:repeated.assistance, existingPath:repeated.existingPath },
    { result:"blocked", assistance:`Go to existing property ${segments.join(".")}`, existingPath:segments.join(".") },
    "a successfully added path must subsequently resolve as the existing property",
  );

  const inherited = addManualProperty({ type:"object" }, [], { ...definition, path:slashPath });
  const inheritedInspection = inspectManualProperty(base, [inherited], definition);
  assert.equal(inheritedInspection.result, "blocked", "an inherited leaf must not be duplicated locally");
  assert.equal(inheritedInspection.assistance, `${segments.join(".")} is defined by the parent schema`);
  assert.throws(
    () => addManualProperty(base, [inherited], definition),
    /is defined by the parent schema/,
    "the domain write must reject every inherited collision reported by inspection",
  );
}
