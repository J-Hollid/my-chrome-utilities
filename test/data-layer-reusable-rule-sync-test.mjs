import assert from "node:assert/strict";
import {
  reviewReusableRuleSync,
  publishReusableRuleSync,
} from "../dist/data-layer-reusable-rule-sync.js";

const oldAttachment = (path) => ({ id:"reusable-51", name:"Approved page types", version:1, propertyPath:path, operator:"allowed-values", allowedValues:["page", "product"] });
const schema = (id, name, version, attachments) => ({
  id,
  name,
  version,
  document:{ type:"object", properties:{ page_type:{ type:"string" }, page_name:{ type:"string" } } },
  assignments:[],
  attachedRules:attachments,
});
const page = schema("schema-page", "Page view", 3, [oldAttachment("/page_type"), oldAttachment("/page_name")]);
const product = schema("schema-product", "Product detail", 5, [oldAttachment("/page_type")]);
const unrelated = schema("schema-other", "Other", 7, [{ id:"other", version:4, propertyPath:"/page_type", operator:"required" }]);
const ruleV2 = { id:"reusable-51", name:"Approved page types", kind:"Allowed values", version:2, operator:"allowed-values", allowedValues:["page", "product", "checkout"], severity:"warning", enabled:true };

const review = reviewReusableRuleSync([page, product, unrelated], ruleV2);
assert.equal(review.ready, true);
assert.equal(review.schemaCount, 2);
assert.equal(review.attachmentCount, 3);
assert.deepEqual(review.schemas.map(({ schemaName, currentVersion, nextVersion, attachmentCount }) => ({ schemaName, currentVersion, nextVersion, attachmentCount })), [
  { schemaName:"Page view", currentVersion:3, nextVersion:4, attachmentCount:2 },
  { schemaName:"Product detail", currentVersion:5, nextVersion:6, attachmentCount:1 },
]);
assert.deepEqual([page.version, product.version], [3, 5], "review must be read-only");

const before = JSON.stringify([page, product, unrelated]);
const synced = publishReusableRuleSync([page, product, unrelated], ruleV2, review);
assert.equal(JSON.stringify([page, product, unrelated]), before, "sync must not mutate input schemas");
assert.deepEqual(synced.map(({ version }) => version), [4, 6, 7]);
assert.equal(synced[0].attachedRules.filter(({ id, version }) => id === "reusable-51" && version === 2).length, 2);
assert.equal(synced[1].attachedRules[0].version, 2);
assert.deepEqual(synced[0].attachedRules[0].allowedValues, ruleV2.allowedValues);
assert.deepEqual(synced[0].revisionHistory.at(-1).attachedRules, page.attachedRules);
assert.deepEqual(synced[2], unrelated);

const blockedProduct = { ...product, workingDraft:{ baseVersion:5, sourceVersion:5, document:product.document, assignments:[], attachedRules:product.attachedRules, pendingChanges:["Unrelated"] } };
const blocked = reviewReusableRuleSync([page, blockedProduct], ruleV2);
assert.equal(blocked.ready, false);
assert.match(blocked.blocked[0].assistance, /Publish or discard the Product detail draft first/);
assert.throws(() => publishReusableRuleSync([page, blockedProduct], ruleV2, blocked), /Publish or discard/);

const failureInputs = JSON.stringify([page, product]);
assert.throws(() => publishReusableRuleSync([page, product], ruleV2, review, {
  publish(schema) { if (schema.id === "schema-product") throw new Error("publication failed"); return schema; },
}), /publication failed/);
assert.equal(JSON.stringify([page, product]), failureInputs, "failed sync leaves caller snapshots intact");
