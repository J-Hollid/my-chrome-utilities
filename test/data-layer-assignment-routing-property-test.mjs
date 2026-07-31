import assert from "node:assert/strict";
import {assignmentConditionControl,buildGuidedAssignmentCondition} from "../dist/data-layer-assignment-routing.js";

let seed=0xa5516e;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;};
for(let sample=0;sample<180;sample+=1){
  const numeric=(random()*2000)-1000,property={path:`/amount/${sample}`,type:sample%2?"number":"integer"},before=JSON.stringify(property),control=assignmentConditionControl(property);
  assert.deepEqual(control.comparisons.includes("contains"),false,`sample ${sample} excludes string-only comparisons for numbers`);
  assert.ok(control.comparisons.includes("is greater than"),`sample ${sample} exposes numeric comparisons`);
  const condition=buildGuidedAssignmentCondition({kind:"Context data",comparison:"is at least",property,value:String(numeric)});
  assert.equal(condition.kind,"predicate");assert.equal(condition.field,property.path);assert.equal(condition.value,numeric);
  assert.equal(JSON.stringify(property),before,`sample ${sample} leaves schema property metadata unchanged`);
  assert.throws(()=>buildGuidedAssignmentCondition({kind:"Context data",comparison:"contains",property,value:"1"}),/compatible/);
}
assert.deepEqual(buildGuidedAssignmentCondition({kind:"Context data",comparison:"equals",property:{path:"/enabled",type:"boolean"},value:"false"}),{kind:"predicate",field:"/enabled",operator:"equals",value:false});
assert.throws(()=>buildGuidedAssignmentCondition({kind:"Context data",comparison:"equals",value:"x"}),/schema property/);
assert.throws(()=>buildGuidedAssignmentCondition({kind:"Query",comparison:"equals",value:"x"}),/parameter/);
assert.throws(()=>buildGuidedAssignmentCondition({kind:"Pathname",comparison:"equals",value:""}),/Pathname value/);
console.log("assignment routing properties passed");
