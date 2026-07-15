import assert from "node:assert/strict";

import {
  addManualProperty,
  contextualManualPropertyDefinition,
  inspectManualProperty,
  manualPropertyContainerAction,
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
  return segments.reduce(
    (property, segment) => segment === "*" ? property?.items : property?.properties?.[segment],
    document,
  );
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

  const itemChild = `item_${nextToken()}`;
  const container = {
    type:"object",
    title:`Container ${sample}`,
    properties:{
      products:{
        type:"array",
        minItems:sample % 4,
        items:{
          type:"object",
          additionalProperties:false,
          required:["stable"],
          properties:{ stable:{ type:"string", description:`Stable item ${sample}` } },
        },
      },
      metadata:{ type:"object", minProperties:1, properties:{} },
      tags:{ type:"array", items:{ type:"string" } },
    },
  };
  const containerSnapshot = structuredClone(container);
  assert.deepEqual(manualPropertyContainerAction(container, "/products"), {
    label:"Add item property",
    parentPath:"/products/*",
  });
  assert.deepEqual(manualPropertyContainerAction(container, "/products/*"), {
    label:"Add child property",
    parentPath:"/products/*",
  });
  assert.deepEqual(manualPropertyContainerAction(container, "/metadata"), {
    label:"Add child property",
    parentPath:"/metadata",
  });
  assert.equal(manualPropertyContainerAction(container, "/tags"), undefined,
    "scalar-item arrays must never offer contextual item authoring");

  const contextual = contextualManualPropertyDefinition(
    "/products/*",
    `  ${itemChild}  `,
    type,
    arrayItemType,
  );
  assert.deepEqual(contextual, {
    path:`/products/*/${itemChild}`,
    type,
    ...(type === "array" ? { arrayItemType } : {}),
  }, "contextual definitions must derive one canonical child path from fixed parent context");
  assert.equal(inspectManualProperty(container, [], contextual).result, "ready");
  const contextAdded = addManualProperty(container, [], contextual);
  const contextLeaf = propertyAt(contextAdded, ["products", "*", itemChild]);
  assert.equal(contextLeaf.type, type);
  assert.equal(contextLeaf.propertyOrigin, "manual");
  assert.deepEqual(contextAdded.properties.products.items.properties.stable,
    container.properties.products.items.properties.stable,
    "item authoring must conserve existing sibling definitions");
  assert.equal(contextAdded.properties.products.minItems, container.properties.products.minItems);
  assert.equal(contextAdded.properties.products.items.additionalProperties, false);
  assert.deepEqual(contextAdded.properties.products.items.required, ["stable"]);
  assert.deepEqual(container, containerSnapshot,
    "contextual child authoring must not mutate the source container document");
}
