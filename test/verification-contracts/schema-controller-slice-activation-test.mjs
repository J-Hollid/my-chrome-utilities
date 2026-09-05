import assert from "node:assert/strict";

import { planVerification } from
  "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks } from
  "../../scripts/verification-registry/validation.mjs";

const packs=await loadVerificationPacks();
const schemas=packs.find(({id})=>id==="schemas");
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
    properties:["test/data-layer-schema-verification-property-test.mjs"],consumers:[]},
  {id:"schema_rule_authoring",source:"src/data-layer-installed/schemas/rule-controller.ts",
    test:"test/data-layer-installed/schemas/rule-controller-test.mjs",
    properties:["test/data-layer-schema-property-rule-picker-property-test.mjs",
      "test/data-layer-schema-rule-property-identity-property-test.mjs"],consumers:[]},
  {id:"schema_assignment_authoring",source:"src/data-layer-installed/schemas/assignment-controller.ts",
    test:"test/data-layer-installed/schemas/assignment-controller-test.mjs",
    properties:["test/data-layer-specification-project-property-test.mjs"],consumers:[]},
  {id:"schema_validation_records",source:"src/data-layer-installed/schemas/validation-controller.ts",
    test:"test/data-layer-installed/schemas/validation-controller-test.mjs",
    properties:["test/data-layer-schema-verification-property-test.mjs",
      "test/data-layer-validation-presence-semantics-property-test.mjs"],
    consumers:[consumer("capture"),consumer("project_assurance_severity"),consumer("live_flow_testing")]},
  {id:"schema_guided_validation",source:"src/data-layer-installed/schemas/guided-validation-controller.ts",
    test:"test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
    properties:["test/data-layer-specification-project-property-test.mjs"],
    consumers:[consumer("capture"),consumer("project_management"),consumer("project_assurance_severity"),consumer("guided_test_cases"),consumer("live_flow_testing")]},
  {id:"schema_canonical_editing",source:"src/data-layer-installed/schemas/canonical-editor-controller.ts",
    test:"test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
    properties:[],
    consumers:[consumer("layered_schema")]},
];

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
const stageCPlan=planVerification(packs,{changedPaths:[
  "verification/manifests/schemas.json","verification/packs.json",
  "test/verification-contracts/schema-controller-slice-activation-test.mjs",
]});
assert.equal(stageCPlan.packIds.includes("schemas"),false,
  "Stage C registry changes cannot use the new product slices to narrow their own evidence");
assert.deepEqual(stageCPlan.selectedVerificationSlices.verification_process,["ownership_impact","registry_inventory"],
  "Stage C selects its registry and ownership evidence instead of a new product slice");

for(const [name,mutate] of [
  ["missing",(registry)=>registry.find(({id})=>id==="schemas").verificationSlices
    .find(({id})=>id==="schema_property_authoring").sourcePaths=[]],
  ["conflicting",(registry)=>registry.find(({id})=>id==="schemas").verificationSlices
    .find(({id})=>id==="schema_rule_authoring").sourcePaths.push(expected[4].source)],
  ["unobservable",(registry)=>registry.find(({id})=>id==="schemas").verificationSlices
    .find(({id})=>id==="schema_property_authoring").observableBoundary=""],
]){
  const registry=structuredClone(packs);
  mutate(registry);
  const plan=planVerification(registry,{changedPaths:[expected[4].source],includeProperties:true});
  assert.ok(plan.parentPackSliceFallbacks.includes("schemas"),`${name} ownership uses the parent fallback`);
  assert.equal(plan.unitTasks.length,schemas.unit.length,`${name} ownership conserves the parent unit closure`);
}

console.log("Schema controller slice activation contracts passed");
