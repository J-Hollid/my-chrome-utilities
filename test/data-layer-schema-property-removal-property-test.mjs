import assert from "node:assert/strict";

import {
  inspectSchemaPropertyRemoval,
  removeSchemaProperty,
  undoSchemaPropertyRemoval,
} from "../dist/data-layer-schema-property-removal.js";

let seed = 0xa54ff53a;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

function propertyAt(document, path) {
  return path.reduce((current, segment) => current?.properties?.[segment], document);
}

for (let sample = 0; sample < 200; sample += 1) {
  const branch = `branch_${nextToken()}`;
  const leaf = `leaf_${nextToken()}`;
  const sibling = `sibling_${nextToken()}`;
  const branchOrigin = sample % 2 === 0 ? "manual" : undefined;
  const path = ["root", branch, leaf];
  const slashPath = `/${path.join("/")}`;
  const dottedPath = ` ${path.join(" . ")} `;
  const document = {
    type:"object",
    title:`Schema ${sample}`,
    required:["root", "stable"],
    forbidden:["blocked"],
    properties:{
      stable:{ type:"string", description:`Stable ${sample}` },
      root:{
        type:"object",
        required:[branch, "root_sibling"],
        forbidden:["root_blocked"],
        properties:{
          root_sibling:{ type:"boolean" },
          [branch]:{
            type:"object",
            ...(branchOrigin ? { propertyOrigin:branchOrigin } : {}),
            required:[leaf, sibling],
            forbidden:["branch_blocked"],
            properties:{
              [leaf]:{ type:"number", propertyOrigin:"manual", minimum:sample },
              [sibling]:{ type:"string", description:`Sibling ${sample}` },
            },
          },
        },
      },
    },
  };
  const rules = [
    { id:`target-${sample}`, name:"Target", version:1, propertyPath:dottedPath },
    { id:`descendant-${sample}`, name:"Descendant", version:2, propertyPath:`${slashPath}/nested` },
    { id:`sibling-${sample}`, name:"Sibling", version:3, propertyPath:`/root/${branch}/${sibling}` },
    { id:`stable-${sample}`, name:"Stable", version:4, propertyPath:"stable" },
  ];
  const documentSnapshot = structuredClone(document);
  const rulesSnapshot = structuredClone(rules);

  const inspection = inspectSchemaPropertyRemoval(document, rules, dottedPath);
  assert.equal(inspection.propertyPath, slashPath, "dot and slash input must share one canonical property path");
  assert.deepEqual(
    inspection.affectedRuleAttachments.map(({ id }) => id),
    [`target-${sample}`, `descendant-${sample}`],
    "inspection must select only exact-path and descendant rule attachments in path order",
  );
  assert.equal(inspection.requiresConfirmation, true, "affected rule attachments must require confirmation");
  assert.deepEqual(document, documentSnapshot, "inspection must not mutate the schema");
  assert.deepEqual(rules, rulesSnapshot, "inspection must not mutate rule attachments");

  const removed = removeSchemaProperty(document, rules, dottedPath);
  assert.equal(propertyAt(removed.document, path), undefined, "the selected leaf must be removed");
  assert.deepEqual(document, documentSnapshot, "removal must not mutate the source schema");
  assert.deepEqual(rules, rulesSnapshot, "removal must not mutate source rule attachments");
  assert.equal(removed.document.title, document.title, "removal must conserve schema metadata");
  assert.deepEqual(removed.document.properties.stable, document.properties.stable, "removal must conserve unrelated root siblings");
  assert.deepEqual(removed.document.required, document.required, "nested removal must conserve root required references");
  assert.deepEqual(removed.document.forbidden, document.forbidden, "nested removal must conserve root forbidden references");
  assert.deepEqual(removed.document.properties.root.required, document.properties.root.required, "nested removal must conserve required references to a retained branch");
  assert.deepEqual(removed.document.properties.root.forbidden, document.properties.root.forbidden, "nested removal must conserve ancestor forbidden references");
  assert.deepEqual(
    propertyAt(removed.document, ["root", branch]).required,
    [sibling],
    "only the direct parent's reference to the removed leaf may be deleted",
  );
  assert.deepEqual(
    propertyAt(removed.document, ["root", branch]).forbidden,
    ["branch_blocked"],
    "unrelated direct-parent constraints must remain stable",
  );
  assert.deepEqual(
    propertyAt(removed.document, ["root", branch, sibling]),
    propertyAt(document, ["root", branch, sibling]),
    "removal must conserve sibling definitions",
  );
  assert.deepEqual(
    removed.attachedRules.map(({ id }) => id),
    [`sibling-${sample}`, `stable-${sample}`],
    "removal must retain unrelated rule attachments in their original order",
  );

  const restored = undoSchemaPropertyRemoval(removed);
  assert.deepEqual(restored, { document:documentSnapshot, attachedRules:rulesSnapshot }, "undo must restore the exact prior state");
  restored.document.properties.stable.description = "changed";
  restored.attachedRules[0].name = "changed";
  assert.deepEqual(document, documentSnapshot, "undo results must not alias the source schema");
  assert.deepEqual(rules, rulesSnapshot, "undo results must not alias source attachments");

  const singleLeafDocument = {
    type:"object",
    required:["root"],
    properties:{
      root:{
        type:"object",
        required:[branch],
        properties:{
          [branch]:{
            type:"object",
            propertyOrigin:"manual",
            required:[leaf],
            properties:{ [leaf]:{ type:"string", propertyOrigin:"manual" } },
          },
        },
      },
    },
  };
  const pruned = removeSchemaProperty(singleLeafDocument, [], slashPath).document;
  assert.equal(propertyAt(pruned, ["root", branch]), undefined, "an empty manual ancestor must be pruned");
  assert.deepEqual(pruned.properties.root.required, [], "pruning must remove the deleted manual ancestor's required reference");
  assert.deepEqual(pruned.required, ["root"], "pruning must retain references to observed ancestors that remain present");
}

console.log("schema property removal properties: 200 generated cases passed");
