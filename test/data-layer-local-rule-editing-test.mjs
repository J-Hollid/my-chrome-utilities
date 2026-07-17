import assert from "node:assert/strict";
import {
  inspectLocalRuleEdit,
  saveLocalRuleEdit,
} from "../dist/data-layer-local-rule-editing.js";
import { publishSchemaWorkingDraft, validateWithSchema } from "../dist/data-layer-schema-verification.js";

const rule40 = { id:"local-40", name:"Known page types", version:1, propertyPath:"/page_type", operator:"allowed-values", allowedValues:["page", "product", "checkout"], severity:"error", enabled:true };
const rule41 = { id:"local-41", name:"Known page types", version:1, propertyPath:"/page_type", operator:"allowed-values", allowedValues:["page", "product"], severity:"warning", message:"Known page type", enabled:true };
const schema = {
  id:"schema-page-view",
  name:"Page view",
  version:3,
  document:{ type:"object", properties:{ page_type:{ type:"string" }, unrelated:{ type:"string" } } },
  assignments:[],
  attachedRules:[rule40, rule41],
};

const inspection = inspectLocalRuleEdit(schema, "/page_type", "local-41", new Set(["reusable-51"]));
assert.equal(inspection.origin, "Local rule");
assert.equal(inspection.canonicalPath, "/page_type");
assert.deepEqual(inspection.rule, rule41);

assert.throws(
  () => inspectLocalRuleEdit(schema, "/page_type", "reusable-51", new Set(["reusable-51"])),
  /reusable Rule Library/,
);

const withExistingDraft = {
  ...schema,
  workingDraft:{
    baseVersion:3,
    sourceVersion:3,
    document:{ type:"object", properties:{ page_type:{ type:"string" }, unrelated:{ type:"string", description:"pending" } } },
    assignments:[],
    attachedRules:[rule40, rule41],
    pendingChanges:["Document unrelated"],
  },
};
const originalBytes = JSON.stringify(withExistingDraft);
const edited = saveLocalRuleEdit(withExistingDraft, {
  propertyPath:"page_type",
  ruleId:"local-41",
  rule:{ ...rule41, allowedValues:["page", "product", "checkout"], severity:"warning" },
});

assert.equal(JSON.stringify(withExistingDraft), originalBytes, "editing must not mutate the caller's schema");
assert.equal(edited.version, 3);
assert.deepEqual(edited.attachedRules, schema.attachedRules, "published revision must remain unchanged");
assert.equal(edited.workingDraft.pendingChanges[0], "Document unrelated");
assert.match(edited.workingDraft.pendingChanges[1], /Edit Known page types at \/page_type/);
assert.equal(edited.workingDraft.attachedRules.length, 2);
assert.deepEqual(edited.workingDraft.attachedRules[0], rule40);
assert.deepEqual(edited.workingDraft.attachedRules[1].allowedValues, ["page", "product", "checkout"]);

const preview = { ...edited, document:edited.workingDraft.document, attachedRules:edited.workingDraft.attachedRules };
assert.equal(validateWithSchema({ sourceId:"test", eventName:"page", payload:{ page_type:"checkout" }, rawInput:[] }, preview, [preview]).issues.length, 0);
assert.equal(validateWithSchema({ sourceId:"test", eventName:"page", payload:{ page_type:"checkout" }, rawInput:[] }, schema, [schema]).issues.length, 1);

const published = publishSchemaWorkingDraft(edited);
assert.equal(published.version, 4);
assert.deepEqual(published.attachedRules[1].allowedValues, ["page", "product", "checkout"]);
assert.deepEqual(published.revisionHistory.at(-1).attachedRules[1], rule41);

assert.throws(() => saveLocalRuleEdit(schema, {
  propertyPath:"/page_type",
  ruleId:"local-41",
  rule:{ ...rule41, operator:"regular-expression", parameters:"[" },
}), /Correct the regular expression/);

assert.throws(() => saveLocalRuleEdit(schema, {
  propertyPath:"/page_name",
  ruleId:"local-41",
  rule:{ ...rule41, propertyPath:"/page_name" },
}), /does not exist at \/page_name/);
