import assert from "node:assert/strict";

import {
  allowedValueExpansionAvailability,
  applyAllowedValueExpansion,
  reviewAllowedValueExpansion,
} from "../dist/data-layer-allowed-value-expansion.js";

let seed = 0x616c6c6f;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

function schema(id, name, attachedRules, extra = {}) {
  return {
    id,
    name,
    version:2,
    published:true,
    document:{ type:"object", properties:{ value:{ type:"string" } } },
    assignments:[{
      id:`assignment-${id}`,
      sourceId:"history",
      eventName:"event",
      target:"payload",
      enabled:true,
      versionPolicy:extra.pinned ? "pinned" : "follow latest",
      ...(extra.pinned ? { schemaVersion:2 } : {}),
    }],
    attachedRules,
    ...extra,
  };
}

const typedValue = (sample) => [
  `observed-${sample}-${nextToken()}`,
  sample + 0.5,
  sample % 2 === 0,
  null,
][sample % 4];

for (let sample = 0; sample < 200; sample += 1) {
  const origin = ["local", "inherited", "reusable"][sample % 3];
  const value = typedValue(sample);
  const ruleId = `rule-${sample}-${nextToken()}`;
  const propertyPath = `/value_${sample}`;
  const rule = {
    id:ruleId,
    name:`Allowed ${sample}`,
    version:sample % 5 + 1,
    propertyPath,
    operator:"allowed-values",
    allowedValues:[`existing-${sample}`, sample],
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
  };
  const unrelated = {
    ...rule,
    id:`unrelated-${sample}`,
    name:`Unrelated ${sample}`,
    allowedValues:[`untouched-${nextToken()}`],
  };
  const assignedId = `assigned-${sample}`;
  const parentId = `parent-${sample}`;
  const assigned = schema(assignedId, `Assigned ${sample}`, origin === "inherited" ? [unrelated] : [rule, unrelated], {
    ...(origin === "inherited" ? { parentSchemaId:parentId } : {}),
    pinned:sample % 5 === 0,
  });
  const parent = schema(parentId, `Parent ${sample}`, [rule]);
  const reusable = {
    ...rule,
    kind:"Allowed values",
    attachments:[assignedId],
    revisionHistory:[],
  };
  const schemas = origin === "inherited" ? [parent, assigned] : [assigned];
  const reusableRules = origin === "reusable" ? [reusable] : [];
  const evidence = {
    propertyPath,
    status:sample % 2 === 0 ? "error" : "warning",
    message:rule.message,
    expected:"existing",
    actual:String(value),
    actualValue:value,
    rule:rule.name,
    ruleId,
    ruleVersion:rule.version,
    operator:["allowed-values", "allowed_values", "Allowed values"][sample % 3],
    severity:rule.severity,
    schemaId:origin === "inherited" ? parentId : assignedId,
    schemaName:origin === "inherited" ? parent.name : assigned.name,
    schemaVersion:2,
  };
  const input = { schemas, reusableRules, assignedSchemaId:assignedId, evidence };
  const snapshot = structuredClone(input);

  assert.deepEqual(allowedValueExpansionAvailability(evidence), { available:true });
  const review = reviewAllowedValueExpansion(input);
  assert.equal(review.origin, origin);
  assert.equal(review.publishedUnchanged, true);
  assert.equal(Object.is(review.proposedValue, value), true, "review must preserve scalar JSON type");
  assert.deepEqual(review.currentValues, rule.allowedValues);
  assert.equal(review.alreadyPending, false);
  assert.equal(Boolean(review.pinnedAssignmentWarning), sample % 5 === 0);

  const destination = origin === "local"
    ? "assigned-schema-draft"
    : origin === "inherited"
      ? sample % 2 === 0 ? "parent-schema-draft" : "assigned-schema-override"
      : sample % 2 === 0 ? "reusable-rule-revision" : "assigned-schema-override";
  assert.equal(review.destinations.includes(destination), true);
  const applied = applyAllowedValueExpansion({ ...input, destination });

  assert.deepEqual(input, snapshot, "expansion must not mutate schemas, reusable rules, or evidence");
  assert.equal(applied.changed, true);
  assert.equal(typeof applied.pendingChange, "string");
  assert.equal(applied.schemas.every((candidate, index) => candidate !== schemas[index]), true);

  const publishedAssigned = schemas.find(({ id }) => id === assignedId);
  assert.deepEqual(publishedAssigned, snapshot.schemas.find(({ id }) => id === assignedId),
    "published assigned schema must remain unchanged");

  if (destination === "assigned-schema-draft") {
    const draft = applied.schemas.find(({ id }) => id === assignedId).workingDraft;
    const widened = draft.attachedRules.find(({ id }) => id === ruleId);
    assert.equal(Object.is(widened.allowedValues.at(-1), value), true);
    assert.deepEqual(draft.attachedRules.find(({ id }) => id === unrelated.id), unrelated);
    assert.deepEqual({ ...widened, allowedValues:rule.allowedValues }, rule,
      "widening must preserve stable identity and unrelated rule configuration");
  }

  if (destination === "parent-schema-draft") {
    const changedParent = applied.schemas.find(({ id }) => id === parentId);
    const unchangedChild = applied.schemas.find(({ id }) => id === assignedId);
    assert.equal(Object.is(changedParent.workingDraft.attachedRules[0].allowedValues.at(-1), value), true);
    assert.deepEqual(unchangedChild, assigned);
    assert.equal(applied.affectedSchemaId, parentId);
  }

  if (destination === "assigned-schema-override") {
    const changedAssigned = applied.schemas.find(({ id }) => id === assignedId);
    const override = changedAssigned.workingDraft.attachedRules.find(({ id }) => id.startsWith("local-override:"));
    assert.equal(Object.is(override.allowedValues.at(-1), value), true);
    assert.equal(override.version, 1);
    assert.equal(override.severity, rule.severity);
    assert.equal(override.message, rule.message);
    assert.deepEqual(override.conditionGroup, rule.conditionGroup);
    if (origin === "inherited") {
      assert.equal(changedAssigned.workingDraft.inheritedRuleOverrides[propertyPath], "disabled");
      assert.deepEqual(applied.schemas.find(({ id }) => id === parentId), parent);
    } else {
      assert.deepEqual(applied.reusableRules, reusableRules);
    }
  }

  if (destination === "reusable-rule-revision") {
    const revised = applied.reusableRules[0];
    assert.equal(revised.version, rule.version + 1);
    assert.equal(Object.is(revised.allowedValues.at(-1), value), true);
    assert.equal(revised.revisionHistory.at(-1).version, rule.version);
    assert.equal(applied.schemas[0].workingDraft.attachedRules.find(({ id }) => id === ruleId).version, revised.version);
  } else {
    const duplicate = applyAllowedValueExpansion({
      schemas:applied.schemas,
      reusableRules:applied.reusableRules,
      assignedSchemaId:assignedId,
      evidence,
      destination,
    });
    assert.equal(duplicate.changed, false);
    assert.deepEqual(duplicate.schemas, applied.schemas, "duplicate application must be idempotent");
  }
}

for (const unavailable of [
  { status:"pass", operator:"allowed-values", ruleId:"rule", actualValue:"value" },
  { status:"error", operator:"exact-value", ruleId:"rule", actualValue:"value" },
  { status:"error", operator:"allowed-values", actualValue:"value" },
  { status:"error", operator:"allowed-values", ruleId:"rule", actualValue:{} },
  { status:"error", operator:"allowed-values", ruleId:"rule", actualValue:[] },
  { status:"error", operator:"allowed-values", ruleId:"rule", actualValue:undefined },
]) assert.equal(allowedValueExpansionAvailability(unavailable).available, false);

console.log("allowed-value expansion properties: 200 generated cases passed");
