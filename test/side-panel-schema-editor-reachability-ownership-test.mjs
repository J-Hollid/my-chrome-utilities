import assert from "node:assert/strict";
import {createHash} from "node:crypto";

import {planVerification} from "../scripts/verification-planner/tasks/planner.mjs";
import {loadVerificationPacks} from "../scripts/verification-registry/validation.mjs";

const packs=await loadVerificationPacks();
const slice=(packId,sliceId)=>packs.find(({id})=>id===packId)
  .verificationSlices.find(({id})=>id===sliceId);
const shellSlice=slice("shell","side_panel_schema_editor_reachability");
const ownershipTask="unit:test/side-panel-schema-editor-reachability-ownership-test.mjs";

assert.deepEqual(shellSlice.sourcePaths,
  ["test/side-panel-schema-editor-reachability-ownership-test.mjs"]);
assert.deepEqual(shellSlice.sourcePrefixes,["side-panel-schema-editor-reachability"]);
assert.deepEqual(shellSlice.tasks,[ownershipTask]);
assert.deepEqual(shellSlice.consumers,[
  {packId:"schemas",sliceId:"schema_editor_reachability"},
  {packId:"schema_relationship_tree",sliceId:"schema_editor_return"},
]);

const installedSlice=slice("schemas","schemas_installed_side_panel");
assert.deepEqual(installedSlice.sourcePaths,
  ["src/data-layer-installed/schemas/project-hydration.ts"]);
assert.deepEqual(installedSlice.sourcePrefixes,[]);
assert.deepEqual(installedSlice.consumers,[
  {packId:"defects",sliceId:"side_panel_installed_controller_consumer"},
  {packId:"project_assurance_severity",sliceId:"side_panel_installed_controller_consumer"},
  {packId:"guided_test_cases",sliceId:"side_panel_installed_controller_consumer"},
  {packId:"shell",sliceId:"side_panel_installed_controller_consumer"},
]);
const installedPlan=planVerification(packs,{changedPaths:[
  "src/data-layer-installed/schemas/project-hydration.ts",
],includeProperties:true});
assert.deepEqual(installedPlan.tasks.map(({key})=>key),[
  "build:dist",
  "unit:test/data-layer-installed/schemas-controller-test.mjs",
  "unit:test/data-layer-installed/consumers/defects-consumer-test.mjs",
  "unit:test/data-layer-installed/consumers/project-assurance-severity-consumer-test.mjs",
  "unit:test/data-layer-installed/consumers/guided-test-cases-consumer-test.mjs",
  "unit:test/side-panel-single-cutover-preparation-test.mjs",
]);

assert.throws(()=>planVerification(packs,{changedPaths:[
  "side-panel-schema-editor-reachability.css",
],includeProperties:true}),/Undeclared stylesheet boundary/u);

const futurePacks=structuredClone(packs);
futurePacks.find(({id})=>id==="shell").stylesheets.unshift({
  source:"side-panel-schema-editor-reachability.css",
  destination:"side-panel-schema-editor-reachability.css",
  classification:"shell-bridge",
  owner:"shell",
  consumers:["schemas","schema_relationship_tree"],
  qaTargets:[],
  scopeRoot:".twatility-side-panel",
});
const plan=planVerification(futurePacks,{changedPaths:[
  "src/data-layer-installed/schemas/index.ts",
  "src/data-layer-installed/schema-editor-reachability.ts",
  "side-panel-schema-editor-reachability.css",
],includeProperties:true});
assert.deepEqual(plan.packIds,["schemas","schema_relationship_tree","shell"]);
assert.deepEqual(plan.selectedVerificationSlices,{
  schema_relationship_tree:["schema_editor_return"],
  schemas:["schema_editor_reachability"],
  shell:["side_panel_schema_editor_reachability"],
});
assert.deepEqual(plan.tasks.map(({key})=>key),[
  "build:dist",
  "unit:test/data-layer-installed/schemas-controller-test.mjs",
  "unit:test/data-layer-schema-relationship-tree-test.mjs",
  ownershipTask,
]);
assert.deepEqual(plan.propertyTasks,[]);
assert.ok(!plan.tasks.some(({key})=>key==="unit:test/side-panel-paper-first-brand-test.mjs"));

const parentFields=["unit","property","features","handlers","browserAdapters",
  "browserObservations","checkpointCommands"];
const parentDigest=(pack)=>createHash("sha256").update(JSON.stringify(Object.fromEntries(
  parentFields.map((key)=>[key,(pack[key]??[]).filter((entry)=>
    entry!=="test/side-panel-schema-editor-reachability-ownership-test.mjs")]),
))).digest("hex");
assert.deepEqual(Object.fromEntries(["schemas","shell","schema_relationship_tree"].map((id)=>
  [id,parentDigest(packs.find((pack)=>pack.id===id))])),{
  schemas:"bd99a2ee9820d4a3bb3309843aade0333b627cd63886eb347c2b60a662e66434",
  shell:"99aa58ebb5f7dbc22f30d961fc915c422471845f6d3b64a719fb009a42203a9f",
  schema_relationship_tree:"4ec23b817f5da6f75a788ed8d855fb1d3cdc296594a4244378f16f065dd9f029",
});

console.log("side-panel Schema editor reachability ownership tests passed");
