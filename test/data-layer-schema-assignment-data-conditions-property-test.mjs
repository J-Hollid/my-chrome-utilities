import assert from "node:assert/strict";

import {
  assignmentConditionSuggestions,
  assignmentDataConditionSummary,
  canonicalAssignmentConditionPath,
  duplicateSchemaAssignment,
  evaluateAssignmentDataConditions,
  validateAssignmentDataConditions,
} from "../dist/data-layer-schema-assignment-data-conditions.js";
import { resolveSchemaAssignment } from "../dist/data-layer-schema-verification.js";

let seed = 0x1f83d9ab;

function nextInteger(limit) {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed % limit;
}

function token(prefix) {
  return `${prefix}_${nextInteger(0x1000000).toString(36)}`;
}

function encode(segment) {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

function text(value) {
  return { type:"string", value };
}

function predicate(propertyPath, operator, options = {}) {
  return {
    propertyPath,
    operator,
    detectedType:options.detectedType ?? "string",
    ...(options.comparison ? { comparison:options.comparison } : {}),
    ...(options.comparisons ? { comparisons:options.comparisons } : {}),
  };
}

function schema(id, name, assignment) {
  return {
    id,
    name,
    version:1,
    published:true,
    document:{ type:"object" },
    assignments:[assignment],
  };
}

for (let sample = 0; sample < 200; sample += 1) {
  const branch = sample % 2 === 0 ? `${token("branch")}/${token("part")}` : `${token("branch")}~${token("part")}`;
  const leaf = sample % 3 === 0 ? `${token("leaf")}~value` : `${token("leaf")}/value`;
  const wanted = token("wanted");
  const other = token("other");
  const propertyPath = `/${encode(branch)}/*/${encode(leaf)}`;
  const payload = {
    [branch]:[
      { [leaf]:other, stable:sample },
      { [leaf]:wanted, stable:sample + 1 },
    ],
    unrelated:{ value:token("stable") },
  };
  const payloadSnapshot = structuredClone(payload);

  assert.equal(
    canonicalAssignmentConditionPath(` ${propertyPath} `),
    propertyPath,
    "canonical paths must trim whitespace while preserving escaped segments and wildcards",
  );
  for (const invalid of ["", "/", "not/a/pointer", `${propertyPath}/`, `${propertyPath}//child`, "/bad~escape"]) {
    assert.equal(canonicalAssignmentConditionPath(invalid), undefined, "malformed property paths must be rejected");
  }

  const matchingPredicate = predicate(propertyPath, "Equals", { comparison:text(wanted) });
  const evaluated = evaluateAssignmentDataConditions(payload, { operator:"Any", predicates:[matchingPredicate] });
  assert.equal(evaluated.matched, true, "Any groups must match when one concrete wildcard value matches");
  assert.deepEqual(
    evaluated.predicates[0].observed.map(({ concretePath, value, exists }) => ({ concretePath, value, exists })),
    [
      { concretePath:`/${encode(branch)}/0/${encode(leaf)}`, value:other, exists:true },
      { concretePath:`/${encode(branch)}/1/${encode(leaf)}`, value:wanted, exists:true },
    ],
    "wildcard evidence must conserve capture order, canonical concrete paths, values, and presence",
  );
  assert.deepEqual(payload, payloadSnapshot, "condition evaluation must not mutate captured data");

  const all = evaluateAssignmentDataConditions(payload, {
    operator:"All",
    predicates:[
      matchingPredicate,
      predicate(`/${encode(branch)}/*/stable`, "Exists", { detectedType:"number" }),
    ],
  });
  assert.equal(all.matched, true, "All groups must require every predicate to match at least one concrete value");
  const missing = evaluateAssignmentDataConditions({ [branch]:[] }, {
    operator:"Any",
    predicates:[predicate(propertyPath, "Does not exist")],
  });
  assert.equal(missing.matched, true, "Does not exist must match an empty wildcard expansion");
  assert.deepEqual(missing.predicates[0].observed, [{ concretePath:propertyPath, value:undefined, exists:false }]);
  assert.equal(
    evaluateAssignmentDataConditions({ [branch]:[{ [leaf]:null }] }, {
      operator:"Any",
      predicates:[predicate(propertyPath, "Does not exist")],
    }).matched,
    false,
    "present null values must not be treated as absent",
  );

  assert.deepEqual(validateAssignmentDataConditions({ operator:"Any", predicates:[matchingPredicate] }), {
    ready:true,
    assistance:"Ready to save assignment",
  });
  assert.deepEqual(validateAssignmentDataConditions(undefined), {
    ready:true,
    assistance:"Assignment is unrestricted by event data",
  });
  assert.equal(
    validateAssignmentDataConditions({ operator:"All", predicates:[] }).ready,
    false,
    "rendered empty condition groups must remain invalid",
  );

  const suggestions = assignmentConditionSuggestions(payload);
  const suggestionPaths = suggestions.map(({ propertyPath:suggestionPath }) => suggestionPath);
  assert.equal(new Set(suggestionPaths).size, suggestionPaths.length, "suggestions must de-duplicate wildcard paths across array items");
  assert.equal(suggestionPaths.filter((suggestionPath) => suggestionPath === propertyPath).length, 1);
  assert.equal(suggestions.find(({ propertyPath:suggestionPath }) => suggestionPath === propertyPath).observedValue, other);
  assert.deepEqual(payload, payloadSnapshot, "suggestion discovery must not mutate captured data");

  const baseAssignment = {
    id:`base:${sample}`,
    name:`Base ${sample}`,
    sourceId:"event-history",
    eventName:`event_${sample}`,
    target:"payload",
    priority:10,
    conditionTarget:"payload",
    dataConditionGroup:{ operator:"Any", predicates:[matchingPredicate] },
    enabled:true,
  };
  assert.match(assignmentDataConditionSummary(baseAssignment), /Payload · Any/);
  assert.match(assignmentDataConditionSummary(baseAssignment), new RegExp(`equals ${wanted}$`));
  assert.equal(assignmentDataConditionSummary({ target:"payload" }), "No data conditions");

  const duplicate = duplicateSchemaAssignment(baseAssignment, `copy:${sample}`, `Copy ${sample}`);
  assert.equal(duplicate.id, `copy:${sample}`);
  assert.equal(duplicate.name, `Copy ${sample}`);
  assert.deepEqual(duplicate.dataConditionGroup, baseAssignment.dataConditionGroup);
  duplicate.dataConditionGroup.predicates[0].propertyPath = "/changed";
  assert.equal(baseAssignment.dataConditionGroup.predicates[0].propertyPath, propertyPath, "duplicates must own independent condition groups");

  const payloadVariant = token("payload");
  const rawVariant = token("raw");
  const event = {
    sourceId:"event-history",
    eventName:`event_${sample}`,
    payload:{ variant:payloadVariant, preserved:payload },
    rawInput:{ variant:rawVariant, preserved:payload },
  };
  const payloadAssignment = {
    ...baseAssignment,
    id:`payload:${sample}`,
    name:`Payload assignment ${sample}`,
    priority:10,
    conditionTarget:"payload",
    dataConditionGroup:{
      operator:"All",
      predicates:[predicate("/variant", "Equals", { comparison:text(payloadVariant) })],
    },
  };
  const rawAssignment = {
    ...baseAssignment,
    id:`raw:${sample}`,
    name:`Raw assignment ${sample}`,
    priority:20 + nextInteger(50),
    conditionTarget:"raw input",
    dataConditionGroup:{
      operator:"All",
      predicates:[predicate("/variant", "Equals", { comparison:text(rawVariant) })],
    },
  };
  const schemas = [
    schema(`schema:payload:${sample}`, `Payload schema ${sample}`, payloadAssignment),
    schema(`schema:raw:${sample}`, `Raw schema ${sample}`, rawAssignment),
  ];
  const eventSnapshot = structuredClone(event);
  const schemasSnapshot = structuredClone(schemas);
  const resolution = resolveSchemaAssignment(event, undefined, schemas);
  assert.equal(resolution.assignment.id, rawAssignment.id, "the unique highest-priority matching assignment must win");
  assert.equal(resolution.assignment.target, "payload", "condition targeting must not change the validation target");
  assert.equal(resolution.assignment.conditionTarget, "raw input");
  assert.equal(resolution.evidence.selectedAssignmentId, rawAssignment.id);
  assert.equal(resolution.evidence.candidates.length, 2);
  assert.equal(resolution.evidence.candidates.every(({ matched }) => matched), true);
  assert.match(resolution.evidence.summary, new RegExp(`priority ${rawAssignment.priority} wins`));
  assert.deepEqual(event, eventSnapshot, "assignment resolution must not mutate archived or live event evidence");
  assert.deepEqual(schemas, schemasSnapshot, "assignment resolution must not mutate schemas or condition groups");

  const tiedSchemas = structuredClone(schemas);
  tiedSchemas[0].assignments[0].priority = rawAssignment.priority;
  const tie = resolveSchemaAssignment(event, undefined, tiedSchemas);
  assert.match(tie.error, /Payload assignment.*Raw assignment/);
  assert.equal(tie.assignment, undefined);
  assert.equal(tie.evidence.selectedAssignmentId, undefined);
  assert.match(tie.evidence.summary, /equal highest priority/);

  const unrestricted = {
    id:`unrestricted:${sample}`,
    name:`Unrestricted ${sample}`,
    sourceId:"event-history",
    eventName:`fallback_${sample}`,
    target:"payload",
    priority:0,
  };
  const fallback = resolveSchemaAssignment(
    { ...event, eventName:`fallback_${sample}` },
    undefined,
    [schema(`schema:fallback:${sample}`, `Fallback schema ${sample}`, unrestricted)],
  );
  assert.equal(fallback.assignment.id, unrestricted.id, "legacy assignments without data conditions must remain unrestricted");
  assert.equal(fallback.evidence.candidates[0].dataCondition, undefined);
}

console.log("schema assignment data condition properties: 200 generated cases passed");
