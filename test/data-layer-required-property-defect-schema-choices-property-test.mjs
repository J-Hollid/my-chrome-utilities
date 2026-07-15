import assert from "node:assert/strict";

import { defectCapturedEvent } from "../dist/data-layer-defect-report-browser.js";
import {
  applyExpectedResult,
  createDefectReport,
  generateReportDetails,
  renderJiraReport,
} from "../dist/data-layer-defect-report.js";
import { resolveRequiredPropertySchemaChoices } from "../dist/data-layer-defect-schema-choices.js";

function sharedValue(sample) {
  switch (sample % 3) {
    case 0: return `shared-${sample}`;
    case 1: return sample + 0.5;
    default: return sample % 2 === 0;
  }
}

function evaluation(sample, overrides = {}) {
  return {
    propertyPath:`/products/*/field~0${sample}~1value`,
    status:"not-applicable",
    message:"optional target is absent",
    expected:"configured value",
    actual:"missing",
    rule:`Value rule ${sample}`,
    ruleVersion:sample + 1,
    severity:"error",
    schemaName:`Schema ${sample}`,
    schemaVersion:sample + 1,
    ruleId:`rule:${sample}`,
    schemaId:`schema:${sample}`,
    operator:"allowed-values",
    notApplicableReason:"target-absent",
    ...overrides,
  };
}

for (let sample = 0; sample < 200; sample += 1) {
  const value = sharedValue(sample);
  const index = sample % 7;
  const pointer = `/products/${index}/field~0${sample}~1value`;
  const assignedSchema = { id:`schema:${sample}`, name:`Schema ${sample}`, version:sample + 1 };
  const evaluations = [
    evaluation(sample, { allowedValues:[value, `left-${sample}`, value] }),
    evaluation(sample, {
      operator:"exact-value",
      allowedValues:[value, `right-${sample}`],
      rule:`Exact rule ${sample}`,
      ruleId:`rule:exact:${sample}`,
    }),
    evaluation(sample, {
      allowedValues:[`inactive-${sample}`],
      rule:`Inactive rule ${sample}`,
      ruleId:`rule:inactive:${sample}`,
      notApplicableReason:"condition-not-satisfied",
    }),
    evaluation(sample, {
      propertyPath:`/products/*/other-${sample}`,
      allowedValues:[`unrelated-${sample}`],
      rule:`Unrelated rule ${sample}`,
      ruleId:`rule:unrelated:${sample}`,
    }),
  ];
  const input = { issuePointer:pointer, evaluations, assignedSchema };
  const snapshot = structuredClone(input);

  const resolved = resolveRequiredPropertySchemaChoices(input);
  assert.deepEqual(resolved.values, [value], "effective choices must be the typed constraint intersection");
  assert.deepEqual(resolved.provenance.schema, assignedSchema);
  assert.deepEqual(resolved.provenance.rules.map(({ id }) => id), [`rule:${sample}`, `rule:exact:${sample}`]);
  assert.equal(resolved.conflict, undefined);
  assert.deepEqual(resolveRequiredPropertySchemaChoices(input), resolved, "choice resolution must be deterministic");
  assert.deepEqual(input, snapshot, "choice resolution must not mutate schema evidence");

  const reversed = resolveRequiredPropertySchemaChoices({
    ...input,
    evaluations:[evaluations[1], evaluations[0], evaluations[3], evaluations[2]],
  });
  assert.deepEqual(reversed.values, resolved.values, "rule ordering must not change the effective singleton choice");

  const conflict = resolveRequiredPropertySchemaChoices({
    ...input,
    evaluations:[
      evaluation(sample, { allowedValues:[`left-${sample}`] }),
      evaluation(sample, { allowedValues:[`right-${sample}`], rule:`Other rule ${sample}`, ruleId:`rule:other:${sample}` }),
    ],
  });
  assert.deepEqual(conflict.values, []);
  assert.match(conflict.conflict, new RegExp(`Value rule ${sample}.*Other rule ${sample}`));

  const payload = { products:Array.from({ length:index + 1 }, (_, productIndex) => ({ retained:`item-${productIndex}` })) };
  const payloadSnapshot = structuredClone(payload);
  const captured = defectCapturedEvent({
    id:`event:${sample}`,
    name:"pageview",
    sourceId:"history",
    captureTime:`2026-07-15T12:${String(sample % 60).padStart(2, "0")}:00Z`,
    payload,
    validation:"Invalid",
    validationDetails:{
      issues:[{
        instancePath:pointer,
        message:"Required value",
        expected:"required property",
        actual:"missing",
        schemaName:assignedSchema.name,
        schemaVersion:assignedSchema.version,
        schemaLocation:`${assignedSchema.name} v${assignedSchema.version}`,
        severity:"error",
      }],
      evaluations,
      schema:assignedSchema,
    },
  });
  assert.deepEqual(captured.issues[0].allowedValues, [value]);

  const report = createDefectReport(captured);
  const choice = {
    issueId:captured.issues[0].id,
    method:"choose an allowed value",
    response:value,
    responseSource:`${assignedSchema.name} revision ${assignedSchema.version}`,
    responseProvenance:captured.issues[0].schemaChoiceProvenance,
  };
  const corrected = applyExpectedResult(report, [choice]);
  const repeated = applyExpectedResult(report, [choice]);
  assert.deepEqual(repeated.expected, corrected.expected, "reapplying a choice must create one identical correction");
  assert.equal(Object.is(corrected.expected.payload.products[index][`field~${sample}/value`], value), true);
  assert.equal(corrected.expected.payload.products[index].retained, `item-${index}`);
  assert.deepEqual(corrected.expected.corrections.map(({ pointer: correctionPointer, operation }) => ({ pointer:correctionPointer, operation })), [{ pointer, operation:"add" }]);
  assert.deepEqual(corrected.expected.corrections[0].responseProvenance, resolved.provenance);

  const rendered = renderJiraReport(generateReportDetails(corrected));
  assert.deepEqual(JSON.parse(rendered.actualJson), payloadSnapshot);
  assert.deepEqual(JSON.parse(rendered.expectedJson), corrected.expected.payload);
  assert.deepEqual(payload, payloadSnapshot, "report conversion, correction, and rendering must preserve the captured payload");
}

console.log("required-property defect schema choice property tests passed");
