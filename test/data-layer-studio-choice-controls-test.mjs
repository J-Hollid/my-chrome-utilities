import assert from "node:assert/strict";
import {
  studioChoiceContract,
  studioChoiceTargetHeight,
} from "../dist/data-layer-studio-choice-controls.js";

for(const [key,pattern,consequence] of[
  ["schema.only-defined","switch","Immediately applies one reversible Draft setting"],
  ["documentation.concept-subheadings","checkbox","Changes configuration pending preview refresh"],
  ["documentation.concept-membership","checkbox","Selects membership in the ordered concept group"],
  ["documentation.export-section","checkbox","Selects membership in the export scope"],
  ["documentation.confirm-incomplete","checkbox","Records an acknowledgement before incomplete export"],
  ["bulk.staged-property","checkbox","Selects membership for the later bulk action"],
  ["documentation.theme-option","checkbox","Stages a theme option for explicit Save theme"],
]){
  assert.deepEqual(studioChoiceContract(key),{key,pattern,consequence});
}

const immediate=studioChoiceContract("schema.only-defined");
for(const changedCopy of["Closed fields","Only documented properties","Anything a translator writes"]){
  assert.deepEqual(
    studioChoiceContract(immediate.key),
    immediate,
    `${changedCopy} cannot change stable switch semantics`,
  );
}
assert.equal(studioChoiceTargetHeight({coarsePointer:false,narrow:false}),36);
assert.equal(studioChoiceTargetHeight({coarsePointer:true,narrow:false}),44);
assert.equal(studioChoiceTargetHeight({coarsePointer:false,narrow:true}),44);

console.log("Specification Studio choice control unit tests passed");
