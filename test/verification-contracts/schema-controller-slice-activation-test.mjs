import assert from "node:assert/strict";
import {readdir,readFile} from "node:fs/promises";

import { planVerification } from
  "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks } from
  "../../scripts/verification-registry/validation.mjs";

const packs=await loadVerificationPacks();
const schemas=packs.find(({id})=>id==="schemas");
const granularityDispositions=JSON.parse(await readFile(
  "verification/granularity-dispositions.json","utf8"));
const sliceById=new Map(schemas.verificationSlices.map((slice)=>[slice.id,slice]));
const consumer=(packId,sliceId="side_panel_installed_controller_consumer")=>({packId,sliceId});
const expected=[
  {id:"schemas_installed_composition",source:"src/data-layer-installed/schemas/index.ts",
    test:"test/data-layer-installed/schemas-composition-test.mjs",
    properties:[],
    consumers:[consumer("defects"),consumer("project_assurance_severity"),consumer("guided_test_cases"),consumer("shell")]},
  {id:"schema_editor_reachability",source:"src/data-layer-installed/schemas/editor-route-controller.ts",
    test:"test/data-layer-installed/schemas/editor-route-controller-test.mjs",
    properties:[],
    consumers:[consumer("schema_relationship_tree","schema_editor_return")]},
  {id:"schema_relationship_tree_view",source:"src/data-layer-installed/schemas/relationship-tree-controller.ts",
    test:"test/data-layer-installed/schemas/relationship-tree-controller-test.mjs",
    properties:[],
    consumers:[{packId:"schema_relationship_tree"}]},
  {id:"schema_library_lifecycle",source:"src/data-layer-installed/schemas/library-controller.ts",
    test:"test/data-layer-installed/schemas/library-controller-test.mjs",
    properties:["test/data-layer-schema-verification-property-test.mjs"],
    consumers:[consumer("defects"),consumer("project_assurance_severity"),consumer("guided_test_cases"),consumer("shell")]},
  {id:"schema_property_authoring",source:"src/data-layer-installed/schemas/property-controller.ts",
    test:"test/data-layer-installed/schemas/property-controller-test.mjs",
    properties:["test/data-layer-schema-documentation-property-test.mjs",
      "test/data-layer-schema-manual-property-property-test.mjs",
      "test/data-layer-schema-manual-property-test.mjs",
      "test/data-layer-schema-nested-path-property-test.mjs",
      "test/data-layer-schema-property-copy-property-test.mjs",
      "test/data-layer-schema-property-removal-property-test.mjs",
      "test/data-layer-schema-verification-property-test.mjs"],consumers:[]},
  {id:"schema_rule_authoring",source:"src/data-layer-installed/schemas/rule-controller.ts",
    test:"test/data-layer-installed/schemas/rule-controller-test.mjs",
    properties:["test/data-layer-local-rule-promotion-property-test.mjs",
      "test/data-layer-rule-edit-sync-property-test.mjs",
      "test/data-layer-schema-property-rule-picker-property-test.mjs",
      "test/data-layer-schema-rule-property-identity-property-test.mjs"],consumers:[]},
  {id:"schema_assignment_authoring",source:"src/data-layer-installed/schemas/assignment-controller.ts",
    test:"test/data-layer-installed/schemas/assignment-controller-test.mjs",
    properties:["test/data-layer-schema-assignment-data-conditions-property-test.mjs"],consumers:[]},
  {id:"schema_validation_records",source:"src/data-layer-installed/schemas/validation-controller.ts",
    test:"test/data-layer-installed/schemas/validation-controller-test.mjs",
    properties:["test/data-layer-schema-verification-property-test.mjs",
      "test/data-layer-validation-presence-semantics-property-test.mjs"],
    consumers:[consumer("capture"),consumer("project_assurance_severity"),consumer("live_flow_testing")]},
  {id:"schema_guided_validation",source:"src/data-layer-installed/schemas/guided-validation-controller.ts",
    test:"test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
    properties:["test/data-layer-allowed-value-expansion-property-test.mjs",
      "test/data-layer-guided-nested-property-merge-property-test.mjs",
      "test/data-layer-guided-rule-parameter-integrity-property-test.mjs",
      "test/data-layer-guided-validation-continuation-property-test.mjs",
      "test/data-layer-guided-validation-property-test.mjs",
      "test/data-layer-live-schema-property-declaration-property-test.mjs",
      "test/data-layer-schema-rule-property-identity-property-test.mjs",
      "test/data-layer-schema-verification-property-test.mjs",
      "test/data-layer-specification-project-property-test.mjs"],
    consumers:[consumer("capture"),consumer("project_management"),consumer("project_assurance_severity"),consumer("guided_test_cases"),consumer("live_flow_testing")]},
  {id:"schema_canonical_editing",source:"src/data-layer-installed/schemas/canonical-editor-controller.ts",
    test:"test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
    properties:[],
    consumers:[consumer("layered_schema")]},
];
const newExactHelpers={
  schemas_installed_composition:["installed-controller.ts"],
  schema_relationship_tree_view:["relationship-view-coordinator.ts"],
  schema_library_lifecycle:["library-controller-contracts.ts","library-deletion-policy.ts",
    "library-deletion-workflow.ts","library-editor.ts","library-export-policy.ts",
    "library-export-workflow.ts","library-import-policy.ts","library-import-workflow.ts",
    "library-installed-view.ts","library-operations.ts","library-public-operations.ts"],
  schema_property_authoring:["property-canonical-adapter.ts","property-installed-view.ts",
    "property-view.ts"],
  schema_rule_authoring:["rule-attachment-workflow.ts","rule-behavior-contracts.ts",
    "rule-installed-view.ts","rule-picker-condition-view.ts","rule-picker-configuration-view.ts",
    "rule-picker-contracts.ts","rule-picker-parameter-view.ts","rule-picker-preview-view.ts",
    "rule-picker-reusable-view.ts","rule-picker-selection-view.ts","rule-picker-view.ts",
    "rule-promotion-workflow.ts","rule-view-contracts.ts"],
  schema_guided_validation:["guided-installed-workflow.ts"],
  schema_canonical_editing:["canonical-context-controls.ts","canonical-context-table-view.ts",
    "canonical-installed-view.ts","canonical-property-actions-view.ts",
    "canonical-public-operations.ts","canonical-rule-editor-view.ts","canonical-saved-adapter.ts",
    "canonical-table-view.ts","canonical-view-contracts.ts"],
};
const installedSchemaPath=(file)=>`src/data-layer-installed/schemas/${file}`;

for(const row of expected){
  const slice=sliceById.get(row.id);
  assert.ok(slice,`${row.id} is registered`);
  assert.ok(slice.sourcePaths.includes(row.source),`${row.id} owns its direct source`);
  assert.equal(schemas.verificationSlices.filter((candidate)=>
    candidate.sourcePaths.includes(row.source)).length,1,`${row.source} has one current slice owner`);
  assert.ok(slice.sourcePaths.includes(row.test),`${row.id} owns its direct test`);
  assert.ok(slice.tasks.includes(`unit:${row.test}`),`${row.id} runs its direct test`);
  assert.deepEqual(slice.consumers,row.consumers,`${row.id} has only proved consumers`);
  assert.ok(slice.observableBoundary,`${row.id} declares an observable boundary`);
  const plan=planVerification(packs,{changedPaths:[row.source],includeProperties:true});
  const keys=plan.tasks.map(({key})=>key);
  assert.ok(keys.includes(`unit:${row.test}`),`${row.source} selects its direct test`);
  assert.deepEqual(plan.propertyTasks.filter(({packId})=>packId==="schemas")
    .map(({target})=>target).sort(),row.properties.toSorted(),
    `${row.source} selects only its declared property tasks`);
  for(const other of expected.filter((candidate)=>candidate.id!==row.id)){
    assert.equal(keys.includes(`unit:${other.test}`),false,
      `${row.source} does not select unrelated ${other.id} evidence`);
  }
}

const controllerTestKeys=new Set(expected.map(({test})=>`unit:${test}`));
for(const [sliceId,files] of Object.entries(newExactHelpers)){
  const slice=sliceById.get(sliceId);
  for(const file of files){
    const source=installedSchemaPath(file);
    assert.ok(slice.sourcePaths.includes(source),`${source} has its classified slice owner`);
    assert.equal(schemas.verificationSlices.filter((candidate)=>!candidate.consumerOnly&&
      candidate.sourcePaths.includes(source)).length,1,`${source} has one exact source owner`);
    const plan=planVerification(packs,{changedPaths:[source],includeProperties:true});
    const taskKeys=new Set(plan.tasks.map(({key})=>key));
    assert.deepEqual(plan.selectedVerificationSlices.schemas,[sliceId],
      `${source} selects only ${sliceId}`);
    assert.ok(slice.tasks.every((key)=>taskKeys.has(key)),`${source} selects all direct slice evidence`);
    assert.deepEqual(plan.propertyTasks.filter(({packId})=>packId==="schemas")
      .map(({target})=>target).sort(),slice.prerequisites.filter((key)=>key.startsWith("property:"))
      .map((key)=>key.slice("property:".length)).sort(),`${source} selects its causal properties`);
    const unrelated=[...controllerTestKeys].filter((key)=>!slice.tasks.includes(key));
    assert.ok(unrelated.every((key)=>!taskKeys.has(key)),
      `${source} excludes unrelated Schema controller evidence`);
    assert.deepEqual(new Set(plan.packIds),new Set(["schemas",...slice.consumers.map(({packId})=>packId)]),
      `${source} selects only its exact consumers`);
  }
}

const compositionPlan=planVerification(packs,{changedPaths:[expected[0].source]});
assert.deepEqual(compositionPlan.packIds,
  ["schemas","defects","project_assurance_severity","guided_test_cases","shell"],
  "the thin composition root selects only its exact installed consumers");
const relationshipPlan=planVerification(packs,{changedPaths:[expected[2].source]});
assert.deepEqual(relationshipPlan.packIds,["schemas","schema_relationship_tree"],
  "the relationship-tree controller uses the conservative consumer parent");

const parentPlan=planVerification(packs,{packIds:["schemas"],includeProperties:true});
assert.ok(parentPlan.tasks.length>compositionPlan.tasks.length,
  "the complete Schemas parent remains larger than every narrow controller plan");
assert.equal(parentPlan.verificationSliceConservation.schemas.conserved,true,
  "the complete Schemas parent task closure is conserved across slices and remainder tasks");
const schemaInventory=(await readdir("src/data-layer-installed/schemas"))
  .filter((file)=>file.endsWith(".ts")).map(installedSchemaPath).sort();
const exactOwnersBySource=new Map();
for(const slice of schemas.verificationSlices.filter(({consumerOnly})=>!consumerOnly)){
  for(const source of slice.sourcePaths.filter((path)=>path.startsWith(
    "src/data-layer-installed/schemas/")&&path.endsWith(".ts"))){
    exactOwnersBySource.set(source,[...(exactOwnersBySource.get(source)??[]),slice.id]);
  }
}
const fallbackRows=granularityDispositions.dispositions.filter(({task})=>
  task==="schema-controller-helper-ownership");
const fallbackBySource=new Map(fallbackRows.map((row)=>[row.path,row]));
assert.equal(fallbackBySource.size,fallbackRows.length,"fallback helper paths are unique");
for(const source of schemaInventory){
  assert.equal((exactOwnersBySource.get(source)?.length??0)+(fallbackBySource.has(source)?1:0),1,
    `${source} has exactly one exact owner or parent fallback`);
}
assert.equal(schemaInventory.length,73,"the current installed Schema inventory has 73 TypeScript files");
assert.equal(exactOwnersBySource.size,50,"11 existing sources and 39 helpers have exact owners");
assert.equal(fallbackRows.length,23,"every shared or unproved helper has a durable fallback");
assert.equal(new Set(fallbackRows.map(({reason})=>reason)).size,fallbackRows.length,
  "each fallback has a specific technical reason");
const parentTaskKeys=parentPlan.tasks.map(({key})=>key).sort();
for(const row of fallbackRows){
  assert.equal(row.decision,"parent-fallback",`${row.path} uses the safe parent decision`);
  assert.equal(row.reviewAuthority,"qa-integration",`${row.path} uses QA integration review`);
  assert.deepEqual(row.replacementPaths,[],`${row.path} declares no false replacement seam`);
  assert.ok(row.reason.length>=80,`${row.path} records an observable technical reason`);
  const plan=planVerification(packs,{changedPaths:[row.path],includeProperties:true});
  assert.ok(plan.parentPackSliceFallbacks.includes("schemas"),`${row.path} selects the parent fallback`);
  assert.deepEqual(plan.tasks.map(({key})=>key).sort(),parentTaskKeys,
    `${row.path} conserves the complete Schemas task and dependant closure`);
}
const stageCPlan=planVerification(packs,{changedPaths:[
  "verification/manifests/schemas.json","verification/packs.json",
  "verification/granularity-dispositions.json","verification/manifests/verification_process.json",
  "acceptance/src/acceptance/steps/verification_process_schema_helper_ownership.clj",
  "features/verification-process-schema-controller-helper-ownership.feature",
  "test/verification-contracts/schema-controller-slice-activation-test.mjs",
]});
assert.equal(stageCPlan.packIds.includes("schemas"),false,
  "Stage C registry changes cannot use the new product slices to narrow their own evidence");
assert.deepEqual(stageCPlan.selectedVerificationSlices.verification_process,["ownership_impact","registry_inventory"],
  "Stage C selects its registry and ownership evidence instead of a new product slice");

const representativeHelper=installedSchemaPath("canonical-context-controls.ts");
for(const [name,mutate] of [
  ["missing",(registry)=>{const slice=registry.find(({id})=>id==="schemas").verificationSlices
    .find(({id})=>id==="schema_canonical_editing");slice.sourcePaths=
      slice.sourcePaths.filter((source)=>source!==representativeHelper);}],
  ["conflicting",(registry)=>registry.find(({id})=>id==="schemas").verificationSlices
    .find(({id})=>id==="schema_property_authoring").sourcePaths.push(representativeHelper)],
  ["unobservable",(registry)=>registry.find(({id})=>id==="schemas").verificationSlices
    .find(({id})=>id==="schema_canonical_editing").observableBoundary=""],
]){
  const registry=structuredClone(packs);
  mutate(registry);
  const plan=planVerification(registry,{changedPaths:[representativeHelper],includeProperties:true});
  assert.ok(plan.parentPackSliceFallbacks.includes("schemas"),`${name} ownership uses the parent fallback`);
  assert.equal(plan.unitTasks.length,schemas.unit.length,`${name} ownership conserves the parent unit closure`);
}

console.log("Schema controller slice activation contracts passed");
