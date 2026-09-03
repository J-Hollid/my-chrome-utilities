import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const feature="features/swarmforge-role-liveness-and-legacy-unblockers.feature",
  handler="acceptance/src/acceptance/steps/swarmforge_role_liveness.clj",
  manifest=JSON.parse(await readFile("verification/manifests/verification_process.json","utf8")),
  shell=JSON.parse(await readFile("verification/manifests/shell.json","utf8")),
  pack=manifest.pack;

assert.ok(pack.features.includes(feature),"the Phase 4 feature is active");
assert.ok(!pack.plannedFeatures.includes(feature),"the Phase 4 feature is not only planned");
assert.ok(pack.handlers.includes(handler),"the Phase 4 feature has a boundary-owned handler");
const slice=pack.verificationSlices.find(({id})=>id==="swarmforge_role_liveness_acceptance");
assert.ok(slice,"the Phase 4 acceptance boundary has one exact slice");
for (const source of [feature,handler,"test/swarmforge-role-liveness-acceptance-registration-test.mjs"])
  assert.ok(slice.sourcePaths.includes(source),`the acceptance slice owns ${source}`);
for (const task of [`acceptance-parse:${feature}`,`acceptance-generate:${feature}`,
  "acceptance-session:verification_process"])
  assert.ok(slice.tasks.includes(task),`the acceptance slice requires ${task}`);
assert.deepEqual(slice.consumers,[{packId:"shell",sliceId:"swarmforge-handoff-control"}],
  "the acceptance slice binds its production checks through the exact Shell consumer");

const shellSlice=shell.pack.verificationSlices.find(({id})=>id==="swarmforge-handoff-control"),
  splitTests=["test/swarmforge-role-command-observation-runtime-test.mjs",
    "test/swarmforge-role-delivery-runtime-test.mjs","test/swarmforge-role-lease-race-runtime-test.mjs",
    "test/swarmforge-role-task-lifecycle-runtime-test.mjs",
    "test/swarmforge-role-task-recovery-runtime-test.mjs"];
for (const file of [...splitTests,"test/swarmforge-role-runtime-fixtures.mjs"])
  assert.ok(shellSlice.sourcePaths.includes(file),`the Shell slice owns ${file}`);
for (const file of splitTests) assert.ok(shellSlice.tasks.includes(`unit:${file}`));
assert.ok(!shellSlice.sourcePaths.includes("test/swarmforge-role-liveness-runtime-test.mjs"));

console.log("SwarmForge role liveness acceptance registration contracts passed.");
