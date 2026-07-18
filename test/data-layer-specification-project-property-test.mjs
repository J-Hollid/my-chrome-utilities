import assert from "node:assert/strict";

import {
  addFlowStep,
  addProjectEntity,
  buildCoverageMatrix,
  commitStagedProjectImport,
  conditionMatches,
  createProjectSchemaDraft,
  createSpecificationProject,
  exportSpecificationProject,
  exportSpecificationProjectState,
  importSpecificationProject,
  redoProjectTransaction,
  reorderFlowStep,
  saveProjectAssignment,
  searchProjectAssignments,
  stageProjectImport,
  transactProject,
  undoProjectTransaction,
} from "../dist/data-layer-specification-project.js";
import {
  FLOW_INSTANCES_STORAGE_KEY,
  SPECIFICATION_PROJECT_STORAGE_KEY,
  recordSpecificationCapture,
} from "../dist/data-layer-specification-runtime.js";

let seed = 0x70726f6a;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  let sequence = 0;
  const id = (kind) => `${kind}-${sample}-${sequence += 1}-${nextToken()}`;
  const initial = createSpecificationProject({
    name:`Project ${sample}`,
    description:`Description ${nextToken()}`,
    site:`site-${sample}.example`,
    environments:sample % 2 ? ["Production", "Staging"] : undefined,
    id,
  });
  const initialSnapshot = structuredClone(initial);
  const added = addProjectEntity(initial, "profiles", {
    name:`Profile ${sample}`,
    requirements:[{ path:`/value_${sample}`, type:"string", required:sample % 2 === 0 }],
  }, id);

  assert.deepEqual(initial, initialSnapshot, "entity addition must not mutate its input state");
  assert.equal(added.project.id, initial.project.id, "transactions must preserve project identity");
  assert.equal(added.project.collections.profiles.length, 1);
  assert.equal(added.history.undo.length, 1);
  assert.equal(added.history.redo.length, 0);

  const undone = undoProjectTransaction(added);
  assert.deepEqual(undone.project, initial.project, "undo must restore the exact prior project");
  assert.equal(undone.history.redo.length, 1);
  const redone = redoProjectTransaction(undone);
  assert.deepEqual(redone.project, added.project, "redo must restore the exact transaction result");
  assert.deepEqual(added.project.collections.profiles[0].requirements,
    [{ path:`/value_${sample}`, type:"string", required:sample % 2 === 0 }]);

  const beforeRejectedTransaction = structuredClone(redone);
  assert.throws(() => transactProject(redone, "replace identity", (project) => ({
    ...project,
    id:`replacement-${sample}`,
  })), /cannot replace project identity/);
  assert.deepEqual(redone, beforeRejectedTransaction,
    "a rejected transaction must conserve the caller snapshot");

  const serialized = exportSpecificationProject(redone.project);
  const imported = importSpecificationProject(serialized, { existingProjects:[], id });
  assert.deepEqual(imported.project, redone.project,
    "project export and import must round-trip without loss");
  assert.deepEqual(imported.collisions, []);
  assert.deepEqual(
    importSpecificationProject(serialized, { existingProjects:[redone.project], id }).collisions,
    [redone.project.id],
    "import must report stable-identity collisions",
  );

  const first = { kind:"predicate", field:"payload.value", operator:"equals", value:String(sample) };
  const second = { kind:"predicate", field:"pathname", operator:"contains", value:"checkout" };
  const context = { payload:{ value:String(sample) }, pathname:sample % 2 ? "/checkout" : "/home" };
  const firstMatches = true;
  const secondMatches = sample % 2 === 1;
  assert.equal(conditionMatches({ kind:"all", conditions:[first, second] }, context),
    firstMatches && secondMatches);
  assert.equal(conditionMatches({ kind:"any", conditions:[first, second] }, context),
    firstMatches || secondMatches);
  assert.equal(conditionMatches({ kind:"not", conditions:[second] }, context), !secondMatches);

  const assignmentInput = {
    name:`Assignment ${sample}`,
    schemaId:`schema-${sample}`,
    eventName:`Event ${sample}`,
    sourceId:`source-${sample}`,
    target:`target-${sample}`,
    priority:sample % 5,
    versionPolicy:"pinned",
    schemaRevision:(sample % 3) + 1,
    condition:first,
  };
  const schemaState = createProjectSchemaDraft(initial, {
    schemaId:assignmentInput.schemaId,
    name:`Schema ${sample}`,
    baseRevision:assignmentInput.schemaRevision,
    description:`Generated schema ${sample}`,
  }, id);
  const assignmentState = saveProjectAssignment(schemaState, assignmentInput, id);
  const savedAssignment = searchProjectAssignments(assignmentState.project, "").rows[0];
  const editedAssignmentState = saveProjectAssignment(assignmentState, {
    ...assignmentInput,
    id:savedAssignment.id,
    name:`Edited assignment ${sample}`,
  }, id);
  const editedAssignment = searchProjectAssignments(editedAssignmentState.project, "").rows[0];
  assert.equal(editedAssignment.id, savedAssignment.id,
    "assignment edits must preserve stable identity");
  assert.deepEqual(editedAssignment.condition, first,
    "assignment edits must preserve structured conditions");
  assert.equal(searchProjectAssignments(editedAssignmentState.project, `edited assignment ${sample}`).count, 1);
  const beforeInvalidAssignment = structuredClone(editedAssignmentState);
  assert.throws(() => saveProjectAssignment(editedAssignmentState, {
    ...assignmentInput,
    target:"",
  }, id), /routing fields/);
  assert.deepEqual(editedAssignmentState, beforeInvalidAssignment,
    "rejected assignment saves must conserve the caller state");

  const flowState = addProjectEntity(initial, "flows", { name:`Flow ${sample}`, steps:[] }, id);
  const flowId = flowState.project.collections.flows[0].id;
  const withFirstStep = addFlowStep(flowState, flowId, {
    name:`First ${sample}`, eventId:`event-${sample}`, minimum:0, maximum:(sample % 4) + 1, optional:true,
  }, id);
  const withTwoSteps = addFlowStep(withFirstStep, flowId, {
    name:`Second ${sample}`, minimum:1, maximum:1, optional:false,
  }, id);
  const reordered = reorderFlowStep(withTwoSteps, flowId, 1, 0);
  assert.deepEqual(reordered.project.collections.flows[0].steps.map(({ name }) => name),
    [`Second ${sample}`, `First ${sample}`], "flow reordering must move exactly one structured step");
  assert.deepEqual(flowState.project.collections.flows[0].steps, [],
    "flow authoring must not mutate the prior project snapshot");

  const fullFidelity = exportSpecificationProjectState(editedAssignmentState);
  const collision = stageProjectImport(fullFidelity, editedAssignmentState);
  assert.equal(collision.blockers.length, 1, "staging must expose project identity collisions");
  const remapped = stageProjectImport(fullFidelity, editedAssignmentState, {
    projectId:`imported-${sample}`,
  });
  assert.equal(remapped.blockers.length, 0, "explicit remapping must resolve identity collisions");
  let writes = 0;
  const committed = commitStagedProjectImport(editedAssignmentState, remapped, {
    write:() => { writes += 1; },
  });
  assert.equal(writes, 1, "a staged import must commit atomically once");
  assert.equal(committed.project.id, `imported-${sample}`);
  assert.equal(editedAssignmentState.project.id, initial.project.id,
    "import staging and commit must conserve the current project snapshot");

  const coverage = buildCoverageMatrix(editedAssignmentState.project, { rowLimit:(sample % 7) + 1 });
  assert.ok(coverage.rows.length <= (sample % 7) + 1, "coverage rendering must honor its row bound");
  assert.equal(coverage.totalRows,
    Object.values(editedAssignmentState.project.collections).flat().length,
    "bounded coverage must retain the exact total row count");

  const runtimeEventState = addProjectEntity(initial, "events", {
    name:`Runtime event ${sample}`,
    eventName:`runtime_${sample}`,
  }, id);
  const runtimeEvent = runtimeEventState.project.collections.events[0];
  const runtimeFlowState = addProjectEntity(runtimeEventState, "flows", {
    name:`Runtime flow ${sample}`,
    steps:[{
      id:`runtime-step-${sample}`,
      name:`Runtime step ${sample}`,
      eventId:runtimeEvent.id,
      minimum:1,
      maximum:1,
    }],
  }, id);
  const runtimeValues = new Map([[SPECIFICATION_PROJECT_STORAGE_KEY, JSON.stringify(runtimeFlowState)]]);
  const runtimeStorage = {
    getItem:(key) => runtimeValues.get(key) ?? null,
    setItem:(key, value) => runtimeValues.set(key, value),
  };
  const firstRuntime = recordSpecificationCapture(runtimeStorage, {
    sessionId:`session-${sample}-a`,
    pageUrl:`https://site-${sample}.example/path`,
    sourceId:`source-${sample}`,
    rawValue:{ event:`RUNTIME_${sample}` },
  });
  assert.equal(firstRuntime.instances.length, 1,
    "a matching production capture must create exactly one flow instance");
  assert.equal(firstRuntime.active.status, "complete",
    "a generated one-step flow must complete after its matching capture");
  assert.deepEqual(JSON.parse(runtimeValues.get(FLOW_INSTANCES_STORAGE_KEY)), firstRuntime.instances,
    "runtime persistence must exactly match the returned instances");

  const secondRuntime = recordSpecificationCapture(runtimeStorage, {
    sessionId:`session-${sample}-b`,
    pageUrl:`https://site-${sample}.example/path`,
    sourceId:`source-${sample}`,
    rawValue:{ event:`runtime_${sample}` },
  });
  assert.deepEqual(secondRuntime.instances.map(({ sessionId }) => sessionId).sort(),
    [`session-${sample}-a`, `session-${sample}-b`],
    "runtime observations must conserve independent session instances");
  const beforeUnknownCapture = structuredClone(secondRuntime.instances);
  const unknownRuntime = recordSpecificationCapture(runtimeStorage, {
    sessionId:`session-${sample}-c`,
    pageUrl:`https://site-${sample}.example/path`,
    sourceId:`source-${sample}`,
    rawValue:{ event:`unknown_${sample}` },
  });
  assert.deepEqual(unknownRuntime.instances, beforeUnknownCapture,
    "an unrelated capture must not create or alter flow instances");
}

console.log("Specification Project properties: 200 generated cases passed");
