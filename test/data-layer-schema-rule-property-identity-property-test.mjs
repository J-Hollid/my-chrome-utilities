import assert from "node:assert/strict";

import {
  attachRuleToSchemaProperty,
  schemaPropertyRows,
} from "../dist/data-layer-schema-rule-property-identity.js";

let seed = 0x6964656e;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  const propertyCount = sample % 5 + 1;
  const names = Array.from({ length:propertyCount }, (_, index) => `property_${sample}_${index}_${nextToken()}`);
  const localProperties = Object.fromEntries(names.map((name, index) => [
    index % 2 === 0 ? `/${name}` : name,
    index % 3 === 0
      ? { type:"array", items:{ type:"object", properties:{ value:{ type:"string" } } } }
      : { type:["string", "number", "boolean"][index % 3] },
  ]));
  const localDocument = { type:"object", properties:localProperties };
  const inheritedName = `inherited_${sample}_${nextToken()}`;
  const inheritedDocuments = [{
    type:"object",
    properties:{
      [`/${names[0]}`]:{ type:"number" },
      [`/${inheritedName}`]:{ type:"string" },
    },
  }];
  const excluded = sample % 2 === 0 ? new Set([`/${inheritedName}`]) : new Set();
  const inputs = { localDocument, inheritedDocuments };
  const inputSnapshot = structuredClone(inputs);
  const rows = schemaPropertyRows(localDocument, inheritedDocuments, excluded);
  const localCanonicalPaths = names.flatMap((name, index) => index % 3 === 0
    ? [`/${name}`, `/${name}/*`, `/${name}/*/value`]
    : [`/${name}`]);
  const expectedPaths = [
    ...localCanonicalPaths,
    ...(excluded.has(`/${inheritedName}`) ? [] : [`/${inheritedName}`]),
  ];

  assert.deepEqual(rows.map(({ canonicalPath }) => canonicalPath), expectedPaths,
    "canonical row order must preserve local document order before inherited additions");
  assert.deepEqual(rows.map(({ displayPath }) => displayPath),
    expectedPaths.map((path) => path.slice(1).replaceAll("/", ".")));
  assert.equal(new Set(rows.map(({ canonicalPath }) => canonicalPath)).size, rows.length,
    "each canonical property must have exactly one row");
  assert.ok(rows.filter(({ origin }) => origin === "local").every(({ canonicalPath }) => localCanonicalPaths.includes(canonicalPath)));
  assert.equal(rows.find(({ canonicalPath }) => canonicalPath === `/${names[0]}`).origin, "local",
    "a local definition must win over an inherited definition with the same identity");
  assert.deepEqual(inputs, inputSnapshot, "row derivation must not mutate schema documents");

  const targetIndex = sample % localCanonicalPaths.length;
  const targetPath = localCanonicalPaths[targetIndex];
  const displayVariant = ` ${targetPath.slice(1).replaceAll("/", " . ")} `;
  const draft = {
    id:`schema-${sample}`,
    document:localDocument,
    attachedRules:[{
      id:`existing-${sample}`,
      name:"Existing",
      version:1,
      propertyPath:"/existing",
      operator:"required",
    }],
  };
  const draftSnapshot = structuredClone(draft);
  const rule = {
    id:`rule-${sample}`,
    name:`Rule ${sample}`,
    version:sample % 7 + 1,
    operator:"allowed-values",
    parameters:`value-${nextToken()}`,
    enabled:true,
  };
  const attached = attachRuleToSchemaProperty(draft, displayVariant, rule);
  assert.deepEqual(draft, draftSnapshot, "attaching must not mutate the prior draft");
  assert.equal(JSON.stringify(attached.document), JSON.stringify(draft.document),
    "attaching must preserve schema document bytes");
  assert.deepEqual(attached.attachedRules.at(-1), { ...rule, propertyPath:targetPath });

  const retried = attachRuleToSchemaProperty(attached, targetPath, rule);
  assert.strictEqual(retried, attached, "retrying the same rule identity must return the unchanged draft");

  const revisedRule = { ...rule, version:rule.version + 1, parameters:`revised-${nextToken()}` };
  const revised = attachRuleToSchemaProperty(attached, targetPath, revisedRule);
  assert.equal(revised.attachedRules.length, attached.attachedRules.length);
  assert.deepEqual(revised.attachedRules.slice(0, -1), attached.attachedRules.slice(0, -1),
    "revising one attachment must retain unrelated rule order and values");
  assert.deepEqual(revised.attachedRules.at(-1), { ...revisedRule, propertyPath:targetPath });
  assert.equal(JSON.stringify(revised.document), JSON.stringify(draft.document));

  const otherPath = `/${inheritedName}`;
  const sameRuleOtherPath = attachRuleToSchemaProperty(revised, otherPath, revisedRule);
  assert.equal(sameRuleOtherPath.attachedRules.length, revised.attachedRules.length + 1,
    "one reusable rule may attach to distinct canonical properties");
  assert.equal(sameRuleOtherPath.attachedRules.at(-1).propertyPath, otherPath);

  const distinctRule = { ...revisedRule, id:`distinct-${sample}` };
  const distinctSamePath = attachRuleToSchemaProperty(sameRuleOtherPath, targetPath, distinctRule);
  assert.equal(distinctSamePath.attachedRules.length, sameRuleOtherPath.attachedRules.length + 1,
    "distinct rules on one canonical property must be conserved");
  assert.equal(distinctSamePath.attachedRules.filter(({ propertyPath }) => propertyPath === targetPath).length, 2);
}

console.log("schema rule property identity properties: 200 generated cases passed");
