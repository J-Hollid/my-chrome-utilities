import assert from "node:assert/strict";
import {
  studioChoicePattern,
  studioChoiceTargetHeight,
} from "../dist/data-layer-studio-choice-controls.js";

for(const [label,consequence,expected] of[
  ["Only defined fields","immediately applies one reversible Draft setting","switch"],
  ["Include concept subheadings","changes configuration pending preview refresh","checkbox"],
  ["Include ecommerce concept","selects membership in an ordered group","checkbox"],
  ["Export Sitewide","selects membership in an export scope","checkbox"],
  ["Confirm incomplete export","records an acknowledgement","checkbox"],
  ["Select staged property","selects membership for a later batch action","checkbox"],
  ["Borders","stages a theme option for an explicit save","checkbox"],
]){
  assert.equal(studioChoicePattern(label,consequence),expected,`${label} control classification`);
}

assert.equal(studioChoiceTargetHeight({coarsePointer:false,narrow:false}),36);
assert.equal(studioChoiceTargetHeight({coarsePointer:true,narrow:false}),44);
assert.equal(studioChoiceTargetHeight({coarsePointer:false,narrow:true}),44);

console.log("Specification Studio choice control unit tests passed");
