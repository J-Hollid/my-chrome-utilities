import assert from "node:assert/strict";

import {
  localRulePromotionAvailability,
  persistLocalRulePromotion,
  promoteLocalRule,
  reviewLocalRulePromotion,
  validateLocalRulePromotion,
} from "../dist/data-layer-local-rule-promotion.js";

let seed = 0x72756c65;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

const operators = ["allowed-values", "allowed_values", "Allowed values"];

for (let sample = 0; sample < 200; sample += 1) {
  const schemaId = `schema-${sample}-${nextToken()}`;
  const sourceId = `local-${sample}-${nextToken()}`;
  const replacementId = `reusable-${sample}-${nextToken()}`;
  const propertyPath = `/nested/value_${sample}`;
  const source = {
    id:sourceId,
    name:`Local rule ${sample}`,
    version:sample % 5 + 1,
    propertyPath:`//nested//value_${sample}/`,
    operator:operators[sample % operators.length],
    allowedValues:[`value-${sample}`, sample, sample % 2 === 0],
    applicableType:"string",
    severity:sample % 2 === 0 ? "error" : "warning",
    message:`message-${nextToken()}`,
    conditionGroup:{
      operator:"All",
      predicates:[{
        propertyPath:"/audience",
        operator:"Equals",
        comparison:{ type:"string", value:`audience-${sample}` },
        detectedType:"string",
      }],
    },
    ...(sample % 3 === 0 ? { enabled:false } : {}),
  };
  const sibling = {
    ...source,
    id:`sibling-${sample}`,
    name:`Sibling ${sample}`,
    propertyPath:`/other_${sample}`,
  };
  const publishedRule = { ...source, allowedValues:["published"] };
  const document = { type:"object", properties:{ nested:{ type:"object" } } };
  const schema = {
    id:schemaId,
    name:`Schema ${sample}`,
    version:sample % 7 + 1,
    published:true,
    document,
    assignments:[],
    attachedRules:[publishedRule],
    workingDraft:{
      baseVersion:1,
      sourceVersion:1,
      document,
      assignments:[],
      attachedRules:[sibling, source],
      pendingChanges:[`existing-${sample}`],
    },
  };
  const unrelatedReusable = {
    ...sibling,
    id:`existing-${sample}`,
    name:`Existing ${sample}`,
    kind:"Allowed values",
    attachments:["another-schema"],
    revisionHistory:[],
  };
  const equivalent = {
    ...source,
    id:replacementId,
    name:`Equivalent ${sample}`,
    kind:"Allowed values",
    version:sample % 4 + 2,
    operator:operators[(sample + 1) % operators.length],
    attachments:["another-schema"],
    revisionHistory:[],
  };
  delete equivalent.propertyPath;
  const reuse = sample % 2 === 1;
  const reusableRules = reuse ? [unrelatedReusable, equivalent] : [unrelatedReusable];
  const input = {
    schema,
    reusableRules,
    propertyPath:` /nested//value_${sample}/ `,
    sourceRuleId:sourceId,
  };
  const snapshot = structuredClone(input);

  assert.deepEqual(localRulePromotionAvailability(input), { available:true });
  const review = reviewLocalRulePromotion(input);
  assert.equal(review.source.propertyPath, propertyPath);
  assert.deepEqual(input, snapshot, "review must not mutate task inputs");

  const selection = reuse
    ? { action:"use-existing", reusableRuleId:replacementId }
    : {
        action:"create",
        name:`  Promoted   ${sample}  `,
        description:`  Description ${sample}  `,
        examples:`  Example ${sample}  `,
        createId:() => replacementId,
      };
  assert.equal(validateLocalRulePromotion(review, selection).ready, true);
  const promoted = promoteLocalRule({ ...input, ...selection });

  assert.deepEqual(input, snapshot, "promotion must not mutate schemas or reusable rules");
  assert.deepEqual(promoted.schema.attachedRules, schema.attachedRules,
    "published rules must remain unchanged");
  assert.deepEqual(promoted.schema.workingDraft.attachedRules[0], sibling,
    "unrelated draft rules must remain unchanged");
  const replacement = promoted.schema.workingDraft.attachedRules[1];
  assert.equal(replacement.id, replacementId);
  assert.equal(replacement.name, reuse ? equivalent.name : `Promoted   ${sample}`);
  assert.equal(replacement.version, reuse ? equivalent.version : 1);
  assert.deepEqual({
    ...replacement,
    id:source.id,
    name:source.name,
    version:source.version,
  }, source, "promotion must preserve the source rule configuration and stable attachment fields");
  assert.deepEqual(
    promoted.schema.workingDraft.pendingChanges,
    [`existing-${sample}`, `Promote local rule ${sourceId} to reusable rule ${replacementId}`],
  );
  assert.equal(promoted.replacementRuleId, replacementId);
  assert.equal(promoted.changed, true);

  if (reuse) {
    assert.deepEqual(promoted.reusableRules, reusableRules,
      "reusing an equivalent rule must conserve the reusable library");
  } else {
    assert.deepEqual(promoted.reusableRules.slice(0, -1), reusableRules);
    const created = promoted.reusableRules.at(-1);
    assert.equal(created.id, replacementId);
    assert.equal(created.name, `Promoted   ${sample}`);
    assert.deepEqual(created.attachments, [schemaId]);
    assert.deepEqual(created.revisionHistory, []);
  }

  assert.equal(localRulePromotionAvailability({
    ...input,
    schema:promoted.schema,
    reusableRules:promoted.reusableRules,
  }).available, false, "the replaced local identity must not remain promotable");

  const differentlyDefined = {
    ...equivalent,
    name:`  CONFLICT   ${sample} `,
    allowedValues:["different"],
  };
  const conflictReview = reviewLocalRulePromotion({ ...input, reusableRules:[differentlyDefined] });
  assert.equal(validateLocalRulePromotion(conflictReview, {
    action:"create",
    name:`conflict ${sample}`,
  }).ready, false, "normalized names must not permit a conflicting duplicate definition");

  const previousSchema = sample % 4 === 0 ? null : `before-schema-${sample}`;
  const previousRules = sample % 5 === 0 ? null : `before-rules-${sample}`;
  const values = new Map([
    ...(previousSchema === null ? [] : [["schemas", previousSchema]]),
    ...(previousRules === null ? [] : [["rules", previousRules]]),
  ]);
  const failureKey = sample % 2 === 0 ? "rules" : "schemas";
  let failed = false;
  const storage = {
    getItem:(key) => values.get(key) ?? null,
    removeItem:(key) => values.delete(key),
    setItem:(key, value) => {
      if (key === failureKey && !failed) {
        failed = true;
        throw new Error(`unavailable-${sample}`);
      }
      values.set(key, value);
    },
  };
  assert.throws(() => persistLocalRulePromotion(storage, {
    schemaKey:"schemas",
    schemaValue:`after-schema-${sample}`,
    ruleKey:"rules",
    ruleValue:`after-rules-${sample}`,
  }), new RegExp(`unavailable-${sample}`));
  assert.equal(values.get("schemas") ?? null, previousSchema);
  assert.equal(values.get("rules") ?? null, previousRules);
}

console.log("local-rule promotion properties: 200 generated cases passed");
