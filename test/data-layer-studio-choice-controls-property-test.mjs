import assert from "node:assert/strict";
import {
  studioChoiceContract,
  studioChoiceTargetHeight,
} from "../dist/data-layer-studio-choice-controls.js";

let state=0x51c0ffee;
const next=()=>{
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  return state;
};
const varied=(words)=>words
  .map((word,index)=>(next()&1 ? word.toUpperCase() : word.toLowerCase())
    +(index<words.length-1 ? " ".repeat(1+(next()%4)) : ""))
  .join("");

for(let attempt=0;attempt<250;attempt+=1){
  const contract=studioChoiceContract("schema.only-defined");
  const unrelated=`${" ".repeat(next()%3)}${varied(["Only","defined","fields"])} ${next().toString(36)}`;
  assert.deepEqual(studioChoiceContract(contract.key),contract,`${unrelated} copy cannot alter the explicit contract`);

  const coarsePointer=Boolean(next()&1),narrow=Boolean(next()&1);
  assert.equal(
    studioChoiceTargetHeight({coarsePointer,narrow}),
    coarsePointer||narrow ? 44 : 36,
    "target height is the coarse-or-narrow invariant",
  );
}

console.log("Specification Studio choice control property tests passed");
