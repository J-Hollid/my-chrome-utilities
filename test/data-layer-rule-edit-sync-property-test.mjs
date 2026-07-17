import assert from "node:assert/strict";

import { saveLocalRuleEdit } from "../dist/data-layer-local-rule-editing.js";
import {
  publishReusableRuleSync,
  reviewReusableRuleSync,
} from "../dist/data-layer-reusable-rule-sync.js";

let seed = 0x73796e63;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

function schema(id, version, attachedRules) {
  return {
    id,
    name:`Schema ${id}`,
    version,
    document:{ type:"object", properties:{ value:{ type:"string" } } },
    assignments:[],
    attachedRules,
  };
}

for (let sample = 0; sample < 200; sample += 1) {
  const path = `/nested/value_${sample}`;
  const selectedId = `local-${sample}-${nextToken()}`;
  const selected = {
    id:selectedId,
    name:`Local ${sample}`,
    version:sample % 5 + 1,
    propertyPath:path,
    operator:"allowed-values",
    allowedValues:[`old-${sample}`],
    severity:"warning",
  };
  const sibling = {
    ...selected,
    id:`sibling-${sample}-${nextToken()}`,
    name:`Sibling ${sample}`,
  };
  const published = schema(`editing-${sample}`, sample % 7 + 1, [sibling, selected]);
  const editingSchema = sample % 2 === 0 ? published : {
    ...published,
    workingDraft:{
      baseVersion:published.version,
      sourceVersion:published.version,
      document:published.document,
      assignments:[],
      attachedRules:[sibling, selected],
      pendingChanges:[`Existing ${sample}`],
    },
  };
  const editingSnapshot = structuredClone(editingSchema);
  const edited = saveLocalRuleEdit(editingSchema, {
    propertyPath:` //nested//value_${sample}/ `,
    ruleId:selectedId,
    rule:{ ...selected, propertyPath:`//nested//value_${sample}/`, allowedValues:[`new-${sample}`] },
  });

  assert.deepEqual(editingSchema, editingSnapshot, "local edits must not mutate their input schema");
  assert.deepEqual(edited.attachedRules, published.attachedRules,
    "local edits must conserve the published revision");
  assert.deepEqual(edited.workingDraft.attachedRules[0], sibling,
    "local edits must conserve unrelated attachments and their order");
  assert.equal(edited.workingDraft.attachedRules[1].id, selectedId);
  assert.equal(edited.workingDraft.attachedRules[1].propertyPath, path);
  assert.deepEqual(edited.workingDraft.attachedRules[1].allowedValues, [`new-${sample}`]);
  assert.deepEqual(
    edited.workingDraft.pendingChanges.slice(0, editingSchema.workingDraft?.pendingChanges.length ?? 0),
    editingSchema.workingDraft?.pendingChanges ?? [],
    "local edits must conserve existing draft changes",
  );
  edited.workingDraft.attachedRules[1].allowedValues.push("output-only");
  assert.deepEqual(editingSchema, editingSnapshot, "edited output must not alias its input");

  const ruleId = `reusable-${sample}-${nextToken()}`;
  const targetVersion = sample % 4 + 2;
  const reusableRule = {
    id:ruleId,
    name:`Reusable ${sample}`,
    kind:"Allowed values",
    version:targetVersion,
    operator:"allowed-values",
    allowedValues:[`value-${sample}`, `next-${sample}`],
    severity:sample % 2 === 0 ? "error" : "warning",
  };
  const affectedCount = sample % 4 + 1;
  const attachmentCount = sample % 3 + 1;
  const affected = Array.from({ length:affectedCount }, (_, schemaIndex) => {
    const targetAttachments = Array.from({ length:attachmentCount }, (_, attachmentIndex) => ({
      id:ruleId,
      name:`Old reusable ${sample}`,
      version:targetVersion - 1,
      propertyPath:`/value_${schemaIndex}_${attachmentIndex}`,
      operator:"allowed-values",
      allowedValues:["old"],
    }));
    return schema(`affected-${sample}-${schemaIndex}`, schemaIndex + 1, [
      { id:`unrelated-${sample}-${schemaIndex}`, version:1, propertyPath:"/other", operator:"required" },
      ...targetAttachments,
    ]);
  });
  const unrelated = schema(`unrelated-${sample}`, 9, [
    { id:`other-${sample}`, version:1, propertyPath:"/value", operator:"required" },
  ]);
  const schemas = [...affected, unrelated];
  const schemasSnapshot = structuredClone(schemas);
  const review = reviewReusableRuleSync(schemas, reusableRule);

  assert.deepEqual(schemas, schemasSnapshot, "sync review must be read-only");
  assert.equal(review.ready, true);
  assert.equal(review.schemaCount, affectedCount);
  assert.equal(review.attachmentCount, affectedCount * attachmentCount);
  assert.deepEqual(review.schemas.map(({ attachmentCount:count }) => count),
    Array(affectedCount).fill(attachmentCount));

  const synced = publishReusableRuleSync(schemas, reusableRule, review);
  assert.deepEqual(schemas, schemasSnapshot, "sync publication must not mutate input schemas");
  assert.equal(synced.length, schemas.length);
  assert.deepEqual(synced.at(-1), unrelated, "sync publication must conserve unrelated schemas");
  for (let schemaIndex = 0; schemaIndex < affectedCount; schemaIndex += 1) {
    const before = affected[schemaIndex];
    const after = synced[schemaIndex];
    assert.equal(after.version, before.version + 1);
    assert.deepEqual(after.attachedRules[0], before.attachedRules[0],
      "sync publication must conserve unrelated attachments");
    assert.deepEqual(after.revisionHistory.at(-1).attachedRules, before.attachedRules,
      "sync publication must retain the previous revision exactly");
    for (const attachment of after.attachedRules.slice(1)) {
      assert.equal(attachment.id, ruleId);
      assert.equal(attachment.version, targetVersion);
      assert.deepEqual(attachment.allowedValues, reusableRule.allowedValues);
    }
  }
  synced[0].attachedRules[1].allowedValues.push("output-only");
  assert.deepEqual(schemas, schemasSnapshot, "synced output must not alias its inputs");

  const failureSnapshot = structuredClone(schemas);
  assert.throws(() => publishReusableRuleSync(schemas, reusableRule, review, {
    publish(schemaWithDraft) {
      if (schemaWithDraft.id === affected.at(-1).id) throw new Error("publication failed");
      return schemaWithDraft;
    },
  }), /publication failed/);
  assert.deepEqual(schemas, failureSnapshot, "failed publication must leave caller snapshots intact");
}

console.log("rule edit and reusable sync properties passed");
