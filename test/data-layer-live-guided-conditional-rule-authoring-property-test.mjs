import assert from "node:assert/strict";

import {
  addGuidedCondition,
  createGuidedConditionalDraft,
  guidedConditionComparisonText,
  guidedConditionGroup,
  guidedConditionPropertyOptions,
  guidedConditionalPreview,
  reconcileGuidedConditions,
  removeGuidedCondition,
  selectGuidedConditionProperty,
  setGuidedConditionComparison,
  setGuidedConditionGroupOperator,
  setGuidedConditionOperator,
  validateGuidedConditionalDraft,
} from "../dist/data-layer-live-guided-conditional-rule-authoring.js";

let seed = 0x636f6e64;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  const stringPath = `/trigger_${sample}_${nextToken()}`;
  const numberPath = `/total_${sample}_${nextToken()}`;
  const nestedKey = `nested/${sample}~${nextToken()}`;
  const nestedPath = `/metadata/${nestedKey.replaceAll("~", "~0").replaceAll("/", "~1")}`;
  const schemaOnlyPath = `/customer_${sample}/type`;
  const consequencePath = "/outcome";
  const stringValue = `product-${sample}-${nextToken()}`;
  const numberValue = sample + 0.5;
  const payload = {
    [stringPath.slice(1)]:stringValue,
    [numberPath.slice(1)]:numberValue,
    enabled:sample % 2 === 0,
    metadata:{ [nestedKey]:`nested-${nextToken()}` },
    outcome:`present-${sample}`,
  };
  const destinationTypes = {
    [stringPath]:"Number",
    [numberPath]:"Number",
    [`customer_${sample}.type`]:"String",
    outcome:"String",
  };
  const inputsSnapshot = structuredClone({ payload, destinationTypes });
  const options = guidedConditionPropertyOptions(payload, destinationTypes, consequencePath);
  const paths = options.map(({ path }) => path);

  assert.deepEqual(paths, [...paths].sort((left, right) => left.localeCompare(right)),
    "condition property choices must have stable canonical ordering");
  assert.equal(new Set(paths).size, paths.length,
    "event and destination schema properties must be unique by canonical path");
  assert.equal(paths.includes(consequencePath), false,
    "the consequence must not be offered as its own trigger");
  assert.deepEqual(options.find(({ path }) => path === stringPath), {
    path:stringPath,
    type:"string",
    source:"current event",
    observedValue:stringValue,
  }, "observed event types and values must take precedence over schema declarations");
  assert.deepEqual(options.find(({ path }) => path === schemaOnlyPath), {
    path:schemaOnlyPath,
    type:"string",
    source:"destination schema",
  });
  assert.equal(options.some(({ path }) => path === nestedPath), true,
    "nested event keys must retain escaped JSON-pointer identity");

  const initial = createGuidedConditionalDraft();
  const withFirst = addGuidedCondition(initial);
  const withSecond = addGuidedCondition(withFirst);
  let draft = selectGuidedConditionProperty(
    withSecond,
    0,
    options.find(({ path }) => path === stringPath),
  );
  draft = selectGuidedConditionProperty(
    draft,
    1,
    options.find(({ path }) => path === numberPath),
  );
  assert.deepEqual(draft.conditionGroup.predicates.map(({ comparison }) => comparison), [
    { type:"string", value:stringValue },
    { type:"number", value:numberValue },
  ], "observed defaults must retain their runtime types");
  assert.deepEqual(initial, createGuidedConditionalDraft(),
    "adding and selecting predicates must not mutate earlier drafts");
  assert.equal(withFirst.conditionGroup.predicates.length, 1);

  const manualValue = `manual-${sample}-${nextToken()}`;
  draft = setGuidedConditionComparison(draft, 0, manualValue);
  draft = selectGuidedConditionProperty(draft, 0, {
    ...options.find(({ path }) => path === stringPath),
    observedValue:`new-observation-${sample}`,
  });
  assert.equal(guidedConditionComparisonText(draft.conditionGroup.predicates[0]), manualValue,
    "rerendering the same compatible property must not replace an operator edit");
  draft = setGuidedConditionComparison(draft, 0, stringValue);

  const withSchemaOnly = selectGuidedConditionProperty(
    addGuidedCondition(draft),
    2,
    options.find(({ path }) => path === schemaOnlyPath),
  );
  assert.equal(withSchemaOnly.conditionGroup.predicates[2].comparison, undefined,
    "unobserved schema properties must not invent comparison values");
  const enteredSchemaOnly = setGuidedConditionComparison(withSchemaOnly, 2, `customer-${sample}`);
  assert.deepEqual(enteredSchemaOnly.conditionGroup.predicates[2].comparison, {
    type:"string",
    value:`customer-${sample}`,
  });
  draft = removeGuidedCondition(enteredSchemaOnly, 2);
  assert.deepEqual(draft.conditionGroup.predicates.map(({ propertyPath }) => propertyPath), [stringPath, numberPath],
    "removing one condition must conserve the order of all remaining predicates");
  assert.equal(enteredSchemaOnly.conditionGroup.predicates.length, 3,
    "condition removal must not mutate the prior draft");

  draft = setGuidedConditionGroupOperator(draft, sample % 2 === 0 ? "All" : "Any");
  const consequence = { propertyPath:consequencePath, operator:"required" };
  assert.deepEqual(validateGuidedConditionalDraft(draft, consequence), {
    ready:true,
    assistance:"Ready to create conditional rule",
  });
  assert.deepEqual(guidedConditionalPreview(payload, draft, consequence), {
    result:"Passed",
    invocationCount:1,
  });
  const missingConsequence = { ...payload };
  delete missingConsequence.outcome;
  assert.deepEqual(guidedConditionalPreview(missingConsequence, draft, consequence), {
    result:"Failed",
    invocationCount:1,
  });
  assert.deepEqual(guidedConditionalPreview({
    ...missingConsequence,
    [stringPath.slice(1)]:`other-${stringValue}`,
    [numberPath.slice(1)]:numberValue + 1,
  }, draft, consequence), {
    result:"Not applicable",
    invocationCount:0,
  }, "inapplicable conditions must never invoke the consequence");

  const missingOption = reconcileGuidedConditions(
    draft,
    options.filter(({ path }) => path !== numberPath),
  );
  assert.equal(missingOption.conditionGroup.predicates[1].requiresReview, true);
  assert.deepEqual(validateGuidedConditionalDraft(missingOption, consequence), {
    ready:false,
    assistance:`Review condition property ${numberPath}`,
  });
  const reconciled = reconcileGuidedConditions(missingOption, options);
  assert.equal(reconciled.conditionGroup.predicates[1].requiresReview, undefined,
    "restoring a compatible option must clear review without losing the predicate");
  assert.deepEqual(reconciled.conditionGroup.predicates[1].comparison, { type:"number", value:numberValue });

  let oneOf = setGuidedConditionOperator(reconciled, 0, "Is one of");
  oneOf = setGuidedConditionComparison(oneOf, 0, `${stringValue},alternative-${sample}`);
  assert.deepEqual(oneOf.conditionGroup.predicates[0].comparisons, [
    { type:"string", value:stringValue },
    { type:"string", value:`alternative-${sample}` },
  ]);
  assert.equal(guidedConditionComparisonText(oneOf.conditionGroup.predicates[0]),
    `${stringValue}, alternative-${sample}`);
  const exists = setGuidedConditionOperator(oneOf, 0, "Exists");
  assert.equal(exists.conditionGroup.predicates[0].comparison, undefined);
  assert.equal(exists.conditionGroup.predicates[0].comparisons, undefined,
    "existence operators must discard obsolete comparisons");

  const persisted = guidedConditionGroup(reconciled);
  const persistedSnapshot = structuredClone(persisted);
  assert.equal("comparisonEdited" in persisted.predicates[0], false);
  assert.equal("requiresReview" in persisted.predicates[0], false);
  persisted.predicates[0].comparison.value = `mutated-${sample}`;
  assert.deepEqual(guidedConditionGroup(reconciled), persistedSnapshot,
    "persistence conversion must not expose nested mutation paths into the guided draft");
  assert.deepEqual(JSON.parse(JSON.stringify(persistedSnapshot)), persistedSnapshot,
    "typed conditional groups must round-trip through JSON storage");
  assert.equal(guidedConditionGroup(undefined), undefined);
  assert.deepEqual({ payload, destinationTypes }, inputsSnapshot,
    "option discovery and guided operations must not mutate event or schema inputs");
}

console.log("Live guided conditional rule properties: 200 generated cases passed");
