import assert from "node:assert/strict";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {assuranceRepairGuidance,entityPurposeGuidance,projectAuthoringGuidance,projectImpactPreview} from "../dist/data-layer-specification-guidance.js";

let sequence=0;const state=createSpecificationProject({name:"Retail and Trade",site:"shop.example",id:(kind)=>`${kind}:${++sequence}`});
const guidance=projectAuthoringGuidance(state.project);
assert.deepEqual(guidance.tasks.map(({label})=>label),["Create a shared Purchase event","Add a funnel","Add flow-specific requirements","Prove checkout confirmation"]);
assert.deepEqual(guidance.map.map(({name})=>name),["Foundation","Shared entities","Requirements","Flows","Routing","Proof","Release"]);
assert.deepEqual(guidance.continue,{label:"Continue with shared entities",reason:"Pages and Events give the specification observable names.",unlocks:"Requirements and Flow authoring"});
for(const [entity,distinction] of [["Profile","Schema"],["Applicability Set","Assignment"],["Page","Flow step"],["Event","Page"],["Flow","Page"],["Assignment","Applicability Set"],["Schema","Profile"],["Fixture","Live observation"],["Draft","Published release"]]){
  const item=entityPurposeGuidance(entity);assert.match(item.purpose,/\S/);assert.match(item.example,/Retail|Trade/);assert.ok(item.prerequisites.length);assert.match(item.usedBy,/Used by/);assert.equal(item.distinguishesFrom,distinction);
}
assert.deepEqual(projectImpactPreview("change Profile composition",["Retail confirmation schema"]),{affectedEntities:["Retail confirmation schema"],scope:"Draft only until publication",runtimeConsequence:"Preview recompiles; Live remains on the published release.",staleEvidence:["Fixtures","Coverage","Preflight","Release review"]});
assert.deepEqual(assuranceRepairGuidance("zero effective cells"),{reason:"Coverage has no effective requirement cells because routing and compiled requirements do not intersect.",action:"Open the named Assignment applicability field",field:"Applicability Set"});
console.log("Specification Project operator guidance tests passed");
