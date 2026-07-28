import assert from "node:assert/strict";

import {createCanonicalProjectEnvelope} from "../dist/data-layer-specification-engine.js";
import {
  assertDeveloperSchemaExportAvailable,
  publishCompiledRelease,
  specificationPreflight,
} from "../dist/data-layer-specification-assurance.js";
import engineTestProject from "./fixtures/specification-assurance-project.mjs";

const envelope = (project, draftId = "draft:severity") =>
  createCanonicalProjectEnvelope(project, draftId);
const finding = (result, code) => result.warnings.find((item) => item.code === code);

for (const publicationPolicy of [
  {warningsBlock:false, fixturesRequired:true},
  {warningsBlock:true, fixturesRequired:false},
]) {
  const project = {
    ...structuredClone(engineTestProject),
    publicationPolicy,
    collections:{
      ...structuredClone(engineTestProject.collections),
      fixtures:[],
      assignments:[],
    },
  };
  const result = specificationPreflight(envelope(project));
  assert.equal(result.blockers.length, 0, "legacy publication policy cannot promote assurance warnings");
  assert.ok(finding(result, "no-fixtures"));
  assert.ok(finding(result, "no-assignments"));
  assert.ok(finding(result, "no-coverage"));
  for (const warning of result.warnings) {
    assert.ok(warning.entityId, "warning bytes identify the affected entity");
    assert.ok(warning.field, "warning bytes include a repair route");
  }

  const state = {
    project,
    draft:{id:"draft:severity", status:"Saved", updatedAt:"2026-07-28T00:00:00.000Z"},
    history:{undo:[], redo:[]},
  };
  const released = publishCompiledRelease(state, {
    id:(kind) => `${kind}:severity`,
    write:() => {},
    preflight:result,
  });
  const release = released.project.releases.at(-1);
  assert.deepEqual(release.preflightWarnings, result.warnings);
  assert.deepEqual(release.preflightBlockers, result.blockers);
  assert.equal(release.snapshot.assignments.length, 0, "publication must not synthesize an Assignment");
}

const fixture = {
  id:"fixture:broken",
  name:"Broken optional evidence",
  releasePolicy:"required",
  observations:[],
  expected:{},
};
const fixtureProject = {
  ...structuredClone(engineTestProject),
  collections:{...structuredClone(engineTestProject.collections), fixtures:[fixture]},
};
const fixtureResult = specificationPreflight(envelope(fixtureProject));
assert.equal(fixtureResult.blockers.length, 0);
assert.equal(finding(fixtureResult, "fixture-incomplete").entityId, fixture.id);

const staleFixture = {
  id:"fixture:stale",
  name:"Stale evidence",
  observations:[{
    sessionId:"fixture:stale",
    sourceId:"event-history",
    eventName:"purchase",
    eventId:"event:purchase",
    pageId:"page:confirmation",
    payload:{ecommerce:{transaction_id:"T-1", currency:"EUR"}},
  }],
  expected:{winner:"assignment:retail"},
  evaluationResultIdentity:"result:older-schema",
};
const staleResult = specificationPreflight(envelope({
  ...structuredClone(engineTestProject),
  collections:{...structuredClone(engineTestProject.collections), fixtures:[staleFixture]},
}));
assert.equal(staleResult.blockers.length, 0);
assert.equal(finding(staleResult, "fixture-failed").entityId, staleFixture.id);
assert.equal(finding(staleResult, "stale-coverage").entityId, staleFixture.id);

const tied = structuredClone(engineTestProject);
tied.collections.assignments.push({...tied.collections.assignments[0], id:"assignment:tie"});
const untied = specificationPreflight(envelope(engineTestProject));
const tieResult = specificationPreflight(envelope(tied));
assert.equal(tieResult.blockers.length, 0);
assert.equal(finding(tieResult, "assignment-tie").entityId, "assignment:retail");
assert.ok(finding(tieResult, "uncovered-requirement"));
assert.deepEqual(
  tieResult.plan.assignments.map(({assignmentId}) => assignmentId),
  ["assignment:trade"],
  "all ambiguous candidates are absent from production evaluation",
);
assert.deepEqual(
  tieResult.plan.schemas["assignment:trade"],
  untied.plan.schemas["assignment:trade"],
  "excluding a tie leaves an unrelated effective schema byte-for-byte unchanged",
);
assert.doesNotThrow(()=>assertDeveloperSchemaExportAvailable(tieResult),
  "optional-assurance warnings cannot block developer export");

const unresolved = structuredClone(engineTestProject);
unresolved.collections.assignments.push({
  id:"assignment:unresolved",
  name:"Unresolved",
  targetKind:"Shared Profile",
  targetId:"profile:missing",
  eventId:"event:purchase",
  priority:50,
});
const unresolvedResult = specificationPreflight(envelope(unresolved));
assert.equal(unresolvedResult.blockers.length, 0);
assert.equal(finding(unresolvedResult, "assignment-unresolved").entityId, "assignment:unresolved");
assert.equal(
  unresolvedResult.plan.assignments.some(({assignmentId}) => assignmentId === "assignment:unresolved"),
  false,
  "unusable optional assignments are excluded from production evaluation",
);

const conflicted = structuredClone(engineTestProject);
conflicted.collections.pages[0].profileId = "profile:retail";
conflicted.collections.pages[0].schemaConstraints = [{
  path:"/ecommerce/value",
  type:"string",
  enforcement:"invariant",
}];
const conflictResult = specificationPreflight(envelope(conflicted));
assert.ok(conflictResult.blockers.some(({code}) => code === "contributor-conflict"));
assert.throws(()=>assertDeveloperSchemaExportAvailable(conflictResult), /blocking issues/i);

const malformed = structuredClone(engineTestProject);
malformed.collections.profiles[0].requirements[0].rules = [{
  id:"rule:malformed",
  kind:"pattern",
  pattern:"[",
  severity:"error",
}];
const malformedResult = specificationPreflight(envelope(malformed));
assert.ok(malformedResult.blockers.some(({code}) => code === "canonical-invalid-rule"));

const changedWarnings = specificationPreflight(envelope({
  ...structuredClone(engineTestProject),
  collections:{...structuredClone(engineTestProject.collections), fixtures:[fixture]},
}));
assert.notEqual(
  changedWarnings.contentIdentity,
  specificationPreflight(envelope(engineTestProject)).contentIdentity,
  "preflight identity covers the exact warning set",
);

console.log("project assurance severity tests passed");
