import assert from "node:assert/strict";
import {
  allowedValueExpansionAvailability,
  applyAllowedValueExpansion,
  reviewAllowedValueExpansion,
} from "../dist/data-layer-allowed-value-expansion.js";
import { validateWithSchema } from "../dist/data-layer-schema-verification.js";

const localRule = {
  id:"stable-id-41", name:"Known page types", version:1, propertyPath:"/page_type",
  operator:"allowed-values", parameters:"product,content", severity:"warning",
  message:"Choose a known page type",
  conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/site", operator:"Equals", comparison:{ type:"string", value:"consumer" }, detectedType:"string" }] },
};
const assignment = { id:"assignment:page-view", sourceId:"history", eventName:"page_view", target:"payload", versionPolicy:"follow latest", enabled:true };
const schema = {
  id:"schema:page-view", name:"Otelo - Generic Pageview", version:2, published:true,
  document:{ type:"object", properties:{ page_type:{ type:"string" }, site:{ type:"string" } } },
  assignments:[assignment], attachedRules:[localRule],
};
const evidence = {
  propertyPath:"/page_type", status:"warning", message:"Choose a known page type",
  expected:"product,content", actual:"product_test", actualValue:"product_test",
  rule:"Known page types", ruleId:"stable-id-41", ruleVersion:1,
  operator:"allowed-values", severity:"warning", schemaId:schema.id,
  schemaName:schema.name, schemaVersion:2,
};

assert.deepEqual(allowedValueExpansionAvailability(evidence), { available:true });
for (const unavailable of [
  { ...evidence, status:"pass" },
  { ...evidence, status:"not-applicable" },
  { ...evidence, operator:"exact-value" },
  { ...evidence, ruleId:undefined },
  { ...evidence, actualValue:{} },
  { ...evidence, actualValue:[] },
  { ...evidence, actualValue:undefined },
]) assert.equal(allowedValueExpansionAvailability(unavailable).available, false);

const existingDraft = {
  ...schema,
  workingDraft:{
    baseVersion:2, sourceVersion:2, document:structuredClone(schema.document),
    assignments:structuredClone(schema.assignments), attachedRules:structuredClone(schema.attachedRules),
    pendingChanges:["Document checkout ownership"],
  },
};
const review = reviewAllowedValueExpansion({
  schemas:[existingDraft], reusableRules:[], assignedSchemaId:schema.id, evidence,
});
assert.deepEqual(review, {
  assignedSchema:{ id:schema.id, name:schema.name, version:2 },
  origin:"local",
  destinations:["assigned-schema-draft"],
  propertyPath:"/page_type",
  rule:{ id:"stable-id-41", name:"Known page types", version:1 },
  currentValues:["product", "content"], proposedValue:"product_test",
  alreadyPending:false, publishedUnchanged:true, pinnedAssignmentWarning:undefined,
});

const applied = applyAllowedValueExpansion({
  schemas:[existingDraft], reusableRules:[], assignedSchemaId:schema.id, evidence,
  destination:"assigned-schema-draft",
});
const widened = applied.schemas[0].workingDraft.attachedRules[0];
assert.deepEqual(widened.allowedValues, ["product", "content", "product_test"]);
assert.equal(widened.id, localRule.id);
assert.equal(widened.version, localRule.version);
assert.equal(widened.conditionGroup.predicates[0].comparison.value, "consumer");
assert.equal(widened.severity, "warning");
assert.equal(widened.message, localRule.message);
assert.deepEqual(applied.schemas[0].workingDraft.pendingChanges, [
  "Document checkout ownership",
  "Allow string product_test for /page_type in Known page types (stable-id-41)",
]);
assert.deepEqual(schema.attachedRules[0], localRule, "published revision must remain unchanged");

const competingRule = { ...localRule, id:"stable-id-42", name:"Restricted page types", parameters:"product" };
const competingSchema = { ...schema, attachedRules:[localRule, competingRule] };
const targeted = applyAllowedValueExpansion({ schemas:[competingSchema], reusableRules:[], assignedSchemaId:schema.id, evidence, destination:"assigned-schema-draft" });
assert.deepEqual(targeted.schemas[0].workingDraft.attachedRules[1], competingRule);
assert.equal(targeted.schemas[0].workingDraft.attachedRules.length, 2);
const targetedPublished = { ...targeted.schemas[0], attachedRules:targeted.schemas[0].workingDraft.attachedRules };
const stillRejected = validateWithSchema({ sourceId:"history", eventName:"page_view", payload:{ site:"consumer", page_type:"product_test" }, rawInput:[] }, targetedPublished, [targetedPublished]);
assert.deepEqual(stillRejected.issues.map(({ rule }) => rule), ["Restricted page types v1"]);
const conditionalNotApplicable = validateWithSchema({ sourceId:"history", eventName:"page_view", payload:{ site:"business", page_type:"product_test" }, rawInput:[] }, { ...targetedPublished, attachedRules:[targetedPublished.attachedRules[0]] }, [targetedPublished]);
assert.equal(conditionalNotApplicable.evaluations[0].status, "not-applicable");
assert.equal(allowedValueExpansionAvailability(conditionalNotApplicable.evaluations[0]).available, false);

const duplicate = applyAllowedValueExpansion({ ...applied, assignedSchemaId:schema.id, evidence, destination:"assigned-schema-draft" });
assert.deepEqual(duplicate.schemas, applied.schemas);
assert.equal(duplicate.changed, false);

const typedValues = [
  [1, "1"], ["1", 1], [false, "false"], [null, undefined], ["New York, NY", ["New York", "NY"]],
];
for (const [value, different] of typedValues) {
  const typedSchema = { ...schema, attachedRules:[{ ...localRule, allowedValues:["product", "content"] }] };
  const result = applyAllowedValueExpansion({
    schemas:[typedSchema], reusableRules:[], assignedSchemaId:schema.id,
    evidence:{ ...evidence, actualValue:value, actual:String(value) }, destination:"assigned-schema-draft",
  });
  const rule = result.schemas[0].workingDraft.attachedRules[0];
  assert.equal(rule.allowedValues.length, 3);
  assert.equal(Object.is(rule.allowedValues[2], value), true);
  const published = { ...result.schemas[0], attachedRules:[rule] };
  const accepted = validateWithSchema({ sourceId:"history", eventName:"page_view", payload:{ site:"consumer", page_type:value }, rawInput:[] }, published, [published]);
  const rejected = validateWithSchema({ sourceId:"history", eventName:"page_view", payload:{ site:"consumer", page_type:different }, rawInput:[] }, published, [published]);
  assert.equal(accepted.issues.some(({ rule: name }) => name?.startsWith("Known page types")), false);
  assert.equal(rejected.issues.some(({ rule: name }) => name?.startsWith("Known page types")), true);
}

const parent = { ...schema, id:"schema:parent", name:"Generic parent", assignments:[] };
const inheritedChild = { ...schema, attachedRules:[], parentSchemaId:parent.id };
const inheritedEvidence = { ...evidence, schemaId:parent.id, schemaName:parent.name };
assert.deepEqual(reviewAllowedValueExpansion({ schemas:[parent, inheritedChild], reusableRules:[], assignedSchemaId:inheritedChild.id, evidence:inheritedEvidence }).destinations,
  ["parent-schema-draft", "assigned-schema-override"]);
const override = applyAllowedValueExpansion({ schemas:[parent, inheritedChild], reusableRules:[], assignedSchemaId:inheritedChild.id, evidence:inheritedEvidence, destination:"assigned-schema-override" });
assert.deepEqual(override.schemas.find(({ id }) => id === parent.id), parent);
const childDraft = override.schemas.find(({ id }) => id === inheritedChild.id).workingDraft;
assert.equal(childDraft.inheritedRuleOverrides["/page_type"], "disabled");
assert.deepEqual(childDraft.attachedRules[0].allowedValues, ["product", "content", "product_test"]);
const parentDraft = applyAllowedValueExpansion({ schemas:[parent, inheritedChild], reusableRules:[], assignedSchemaId:inheritedChild.id, evidence:inheritedEvidence, destination:"parent-schema-draft" });
assert.deepEqual(parentDraft.schemas.find(({ id }) => id === parent.id).workingDraft.attachedRules[0].allowedValues, ["product", "content", "product_test"]);
assert.deepEqual(parentDraft.schemas.find(({ id }) => id === inheritedChild.id), inheritedChild);

const reusable = { ...localRule, kind:"Allowed values", attachments:[schema.id], revisionHistory:[] };
assert.deepEqual(reviewAllowedValueExpansion({ schemas:[schema], reusableRules:[reusable], assignedSchemaId:schema.id, evidence }).destinations,
  ["reusable-rule-revision", "assigned-schema-override"]);
const revised = applyAllowedValueExpansion({ schemas:[schema], reusableRules:[reusable], assignedSchemaId:schema.id, evidence, destination:"reusable-rule-revision" });
assert.equal(revised.reusableRules[0].version, 2);
assert.deepEqual(revised.reusableRules[0].allowedValues, ["product", "content", "product_test"]);
assert.equal(revised.reusableRules[0].revisionHistory[0].version, 1);
assert.equal(revised.schemas[0].workingDraft.attachedRules[0].version, 2);
assert.match(revised.schemas[0].workingDraft.pendingChanges[0], /attachment.*stable-id-41.*revision 2/i);
const reusableOverride = applyAllowedValueExpansion({ schemas:[schema], reusableRules:[reusable], assignedSchemaId:schema.id, evidence, destination:"assigned-schema-override" });
assert.deepEqual(reusableOverride.reusableRules, [reusable]);
assert.equal(reusableOverride.schemas[0].workingDraft.attachedRules.length, 1);
assert.match(reusableOverride.schemas[0].workingDraft.attachedRules[0].id, /^local-override:/);
assert.deepEqual(reusableOverride.schemas[0].workingDraft.attachedRules[0].allowedValues, ["product", "content", "product_test"]);

const pinned = { ...schema, assignments:[{ ...assignment, versionPolicy:"pinned", schemaVersion:2 }] };
assert.match(reviewAllowedValueExpansion({ schemas:[pinned], reusableRules:[], assignedSchemaId:schema.id, evidence }).pinnedAssignmentWarning, /pinned.*revision 2/i);

console.log("data-layer allowed-value expansion tests passed");
