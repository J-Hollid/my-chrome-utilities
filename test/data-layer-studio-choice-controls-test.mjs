import assert from "node:assert/strict";
import {
  studioChoiceContract,
  studioChoiceContractKeys,
  studioChoiceTargetHeight,
} from "../dist/data-layer-studio-choice-controls.js";
import {expectedStudioChoiceContracts} from "./support/studio-choice-contract-oracle.mjs";

const keys=studioChoiceContractKeys();
assert.equal(new Set(keys).size,keys.length,"registry keys must be unique");
assert.deepEqual(new Set(keys),new Set(expectedStudioChoiceContracts.keys()),"the exact production registry must be specified");
assert.equal(Object.isFrozen(keys),true,"the exposed registry key collection must be immutable");

for(const [key,[pattern,consequence]] of expectedStudioChoiceContracts){
  const first=studioChoiceContract(key),second=studioChoiceContract(key);
  assert.deepEqual(first,{key,pattern,consequence});
  assert.deepEqual(second,first);
  assert.notStrictEqual(second,first,"each lookup must return a defensive contract value");
  assert.equal(Object.isFrozen(first),true,`${key} must be immutable`);
  assert.equal(first.consequence.trim().length>0,true,`${key} must name a stable consequence`);
  assert.throws(()=>{first.pattern=first.pattern==="switch"?"checkbox":"switch";},TypeError);
  assert.throws(()=>{first.consequence="mutated";},TypeError);
  assert.deepEqual(studioChoiceContract(key),{key,pattern,consequence},`${key} mutation attempts cannot escape`);
}

assert.deepEqual(keys.filter((key)=>studioChoiceContract(key).pattern==="switch"),["schema.only-defined"]);
assert.throws(()=>studioChoiceContract("unknown.choice"),/Unknown Specification Studio choice contract/u);
assert.equal(studioChoiceTargetHeight({coarsePointer:false,narrow:false}),36);
assert.equal(studioChoiceTargetHeight({coarsePointer:true,narrow:false}),44);
assert.equal(studioChoiceTargetHeight({coarsePointer:false,narrow:true}),44);

console.log("Specification Studio choice control unit tests passed");
