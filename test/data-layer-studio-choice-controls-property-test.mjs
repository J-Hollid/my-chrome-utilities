import assert from "node:assert/strict";
import {
  studioChoiceContract,
  studioChoiceContractKeys,
  studioChoiceTargetHeight,
} from "../dist/data-layer-studio-choice-controls.js";
import {expectedStudioChoiceContracts} from "./support/studio-choice-contract-oracle.mjs";

let state=0x51c0ffee;
const next=()=>{
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  return state;
};
const keys=studioChoiceContractKeys();

for(let attempt=0;attempt<250;attempt+=1){
  const key=keys[next()%keys.length],expected=expectedStudioChoiceContracts.get(key),contract=studioChoiceContract(key);
  assert.deepEqual([contract.pattern,contract.consequence],expected);
  assert.equal(Object.isFrozen(contract),true);
  assert.notStrictEqual(studioChoiceContract(key),contract);
  assert.equal(contract.consequence.trim().length>0,true);

  const coarsePointer=Boolean(next()&1),narrow=Boolean(next()&1);
  assert.equal(
    studioChoiceTargetHeight({coarsePointer,narrow}),
    coarsePointer||narrow ? 44 : 36,
    "target height is the coarse-or-narrow invariant",
  );
}

assert.deepEqual(
  new Set(keys),
  new Set(expectedStudioChoiceContracts.keys()),
  "property sampling must range over the complete exact registry",
);

console.log("Specification Studio choice control property tests passed");
