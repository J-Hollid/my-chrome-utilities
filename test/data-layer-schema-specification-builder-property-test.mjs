import assert from "node:assert/strict";

import {
  deriveSpecificationRows,
  renderSpecificationClipboard,
  specificationProperties,
} from "../dist/data-layer-schema-specification-builder.js";

let seed = 0x73706563;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  const root = `root_${sample}_${nextToken()}`;
  const group = `group_${sample}_${nextToken()}`;
  const leaf = `leaf_${sample}_${nextToken()}`;
  const rootPath = `/${root}`;
  const groupPath = `/${group}`;
  const leafPath = `${groupPath}/*/${leaf}`;
  const description = `Unsafe <tag & \"quote\"> ${nextToken()}\tcontinued\nline`;
  const allowed = [`value-${nextToken()}`, `value|${nextToken()}`];
  const schema = {
    id:`schema-${sample}`,
    name:`Schema ${sample}`,
    version:sample % 7 + 1,
    document:{
      type:"object",
      required:[root],
      properties:{
        [root]:{ type:sample % 2 === 0 ? "string" : "number" },
        [group]:{
          type:"array",
          items:{ type:"object", required:[leaf], properties:{ [leaf]:{ type:"string" } } },
        },
      },
    },
    assignments:[],
    documentation:{
      properties:{
        [rootPath]:{ displayName:root, description, example:{ value:`example-${sample}`, selectionMethod:"custom" } },
        [leafPath]:{ displayName:`${group}[].${leaf}`, description:`Leaf ${sample}` },
      },
    },
    attachedRules:[{
      id:`allowed-${sample}`,
      version:1,
      propertyPath:rootPath,
      operator:"allowed-values",
      allowedValues:allowed,
    }],
  };
  const snapshot = structuredClone(schema);

  const properties = specificationProperties(schema);
  assert.equal(properties.find(({ canonicalPath }) => canonicalPath === groupPath)?.selectedByDefault, false);
  assert.equal(properties.find(({ canonicalPath }) => canonicalPath === leafPath)?.selectedByDefault, true);

  const selected = [leafPath, rootPath];
  const rows = deriveSpecificationRows(schema, selected);
  assert.deepEqual(rows.map(({ canonicalPath }) => canonicalPath), selected,
    "row derivation must conserve caller-selected order");
  assert.deepEqual(rows.map(({ propertyName }) => propertyName), [`${group}[].${leaf}`, root]);
  assert.equal(rows[0].mandatory, `Yes when a ${group} item exists`);
  assert.equal(rows[1].mandatory, "Yes");
  assert.deepEqual(rows[1].allowedValues, allowed);

  const clipboard = renderSpecificationClipboard(rows);
  assert.equal((clipboard.html.match(/<tr>/g) ?? []).length, rows.length + 1);
  assert.match(clipboard.html, /&lt;tag &amp; &quot;quote&quot;&gt;/);
  assert.doesNotMatch(clipboard.html, /<tag/);
  const plainLines = clipboard.plain.split("\n");
  assert.equal(plainLines.length, rows.length + 1);
  assert.ok(plainLines.every((line) => line.split("\t").length === 6),
    "plain clipboard rows must conserve six spreadsheet columns");
  assert.deepEqual(schema, snapshot,
    "property discovery, row derivation, and clipboard rendering must not mutate schemas");
}

console.log("schema specification builder properties: 200 generated cases passed");
