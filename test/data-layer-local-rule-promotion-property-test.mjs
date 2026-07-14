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

  const { workingDraft:_workingDraft, ...currentSchema } = schema;
  const currentInput = {
    schema:currentSchema,
    reusableRules:[unrelatedReusable],
    propertyPath:`//nested//value_${sample}/`,
    sourceRuleId:sourceId,
    editorContext:"editable",
  };
  const currentSnapshot = structuredClone(currentInput);
  assert.deepEqual(localRulePromotionAvailability(currentInput), { available:true },
    "current-revision local rules must be promotable before a draft exists");
  const currentReview = reviewLocalRulePromotion(currentInput);
  assert.equal(currentReview.source.createsWorkingDraft, true,
    "current-revision reviews must disclose lazy working-draft creation");
  const currentReplacementId = `current-reusable-${sample}-${nextToken()}`;
  const promotedCurrent = promoteLocalRule({
    ...currentInput,
    action:"create",
    name:`Current promoted ${sample}`,
    createId:() => currentReplacementId,
  });
  assert.deepEqual(currentInput, currentSnapshot,
    "current-revision promotion must not mutate its schema or reusable library");
  assert.deepEqual(promotedCurrent.schema.attachedRules, currentSchema.attachedRules,
    "lazy draft creation must preserve the published attachment list");
  assert.equal(currentSchema.workingDraft, undefined,
    "availability, review, and promotion must not back-mutate the published schema");
  assert.equal(promotedCurrent.schema.workingDraft.baseVersion, currentSchema.version);
  assert.equal(promotedCurrent.schema.workingDraft.sourceVersion, currentSchema.version);
  assert.deepEqual(promotedCurrent.schema.workingDraft.pendingChanges, [
    `Promote local rule ${sourceId} to reusable rule ${currentReplacementId}`,
  ]);
  const currentReplacement = promotedCurrent.schema.workingDraft.attachedRules[0];
  assert.deepEqual({
    ...currentReplacement,
    id:publishedRule.id,
    name:publishedRule.name,
    version:publishedRule.version,
  }, publishedRule, "current-revision promotion must preserve the complete source configuration");
  assert.deepEqual(promotedCurrent.reusableRules.at(-1).attachments, [schemaId]);

  const provisionalSource = { ...source, propertyPath };
  const provisionalSchema = {
    id:`provisional-${sample}-${nextToken()}`,
    name:`Provisional ${sample}`,
    version:1,
    published:false,
    document,
    assignments:[],
    attachedRules:[sibling, provisionalSource],
  };
  const provisionalInput = {
    schema:provisionalSchema,
    reusableRules:[unrelatedReusable],
    propertyPath,
    sourceRuleId:sourceId,
    editorContext:"new-schema",
  };
  const provisionalSnapshot = structuredClone(provisionalInput);
  assert.deepEqual(localRulePromotionAvailability(provisionalInput), { available:true });
  assert.equal(reviewLocalRulePromotion(provisionalInput).source.createsWorkingDraft, undefined,
    "new-schema promotion must remain in the provisional schema without creating a draft");
  const provisionalReplacementId = `standalone-${sample}-${nextToken()}`;
  const promotedProvisional = promoteLocalRule({
    ...provisionalInput,
    action:"create",
    name:`Standalone ${sample}`,
    createId:() => provisionalReplacementId,
  });
  assert.deepEqual(provisionalInput, provisionalSnapshot,
    "provisional promotion must not mutate its schema or reusable library");
  assert.equal(promotedProvisional.schema.workingDraft, undefined);
  assert.deepEqual(promotedProvisional.schema.attachedRules[0], sibling,
    "provisional promotion must conserve unrelated attachment order");
  assert.equal(promotedProvisional.schema.attachedRules[1].id, provisionalReplacementId);
  assert.deepEqual(promotedProvisional.reusableRules.at(-1).attachments, [],
    "a reusable rule promoted from a discardable schema must remain standalone");

  assert.equal(localRulePromotionAvailability({ ...currentInput, editorContext:"read-only" }).available, false,
    "historical read-only rules must not be promotable");
  assert.equal(localRulePromotionAvailability({
    ...currentInput,
    reusableRules:[{ ...unrelatedReusable, id:sourceId }],
  }).available, false, "reusable identities must never expose another promotion action");

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
