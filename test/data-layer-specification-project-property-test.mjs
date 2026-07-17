import assert from "node:assert/strict";

import {
  addProjectEntity,
  conditionMatches,
  createSpecificationProject,
  exportSpecificationProject,
  importSpecificationProject,
  redoProjectTransaction,
  transactProject,
  undoProjectTransaction,
} from "../dist/data-layer-specification-project.js";

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
}

console.log("Specification Project properties: 200 generated cases passed");
