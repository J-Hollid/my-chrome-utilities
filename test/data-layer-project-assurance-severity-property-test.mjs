import assert from "node:assert/strict";

import {createCanonicalProjectEnvelope} from "../dist/data-layer-specification-engine.js";
import {specificationPreflight} from "../dist/data-layer-specification-assurance.js";
import baseProject from "./fixtures/specification-assurance-project.mjs";

const incomplete = {
  id:"fixture:incomplete",
  name:"Incomplete",
  observations:[],
  expected:{},
};
const failed = {
  id:"fixture:failed",
  name:"Failed",
  observations:[{
    sourceId:"event-history",
    eventName:"purchase",
    eventId:"event:purchase",
    payload:{},
  }],
  expected:{winner:"assignment:missing"},
};
const fixtureStates = [[], [incomplete], [failed]];
const assignmentState = (project, state) => {
  if (state === 0) return [];
  if (state === 1) return project.collections.assignments;
  if (state === 2) return [
    ...project.collections.assignments,
    {...project.collections.assignments[0], id:"assignment:tie"},
  ];
  return [
    ...project.collections.assignments,
    {
      id:"assignment:unresolved",
      name:"Unresolved",
      targetKind:"Shared Profile",
      targetId:"profile:missing",
      eventId:"event:purchase",
      priority:30,
    },
  ];
};
const codes = (findings) => findings.map(({code,entityId,field}) => `${code}:${entityId}:${field}`).sort();

for (let sample=0; sample<96; sample+=1) {
  const project = structuredClone(baseProject);
  project.id = `project:severity-property:${sample}`;
  project.publicationPolicy = {
    fixturesRequired:Boolean(sample & 1),
    warningsBlock:Boolean(sample & 2),
  };
  project.collections.fixtures = structuredClone(fixtureStates[sample % fixtureStates.length]);
  project.collections.assignments = assignmentState(project, sample % 4);
  const baseline = specificationPreflight(createCanonicalProjectEnvelope(project, `draft:${sample}`));
  assert.equal(baseline.blockers.length, 0,
    "optional-assurance states and legacy flags must never create blockers");

  const blockedProject = structuredClone(project);
  blockedProject.collections.pages[0].profileId = "profile:retail";
  blockedProject.collections.pages[0].schemaConstraints = [{
    path:"/ecommerce/value",
    type:"string",
    enforcement:"invariant",
  }];
  const blocked = specificationPreflight(
    createCanonicalProjectEnvelope(blockedProject, `draft:${sample}`));
  assert.ok(blocked.blockers.some(({code}) => code === "contributor-conflict"),
    "an effective-schema conflict must remain blocking");
  assert.deepEqual(codes(blocked.warnings), codes(baseline.warnings),
    "adding or removing a schema blocker must not change advisory classification");
}

console.log("project assurance severity properties: 96 generated cases passed");
