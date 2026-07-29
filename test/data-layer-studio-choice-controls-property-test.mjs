import assert from "node:assert/strict";
import {
  studioChoicePattern,
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
  const label=`${" ".repeat(next()%3)}${varied(["Only","defined","fields"])}${" ".repeat(next()%3)}`;
  const consequence=varied(["immediately","applies","one","reversible","Draft","setting"]);
  assert.equal(studioChoicePattern(label,consequence),"switch","normalization preserves the immediate-setting classification");
  assert.equal(studioChoicePattern(label,`${consequence} later`),"checkbox","a different consequence never gains switch semantics");

  const unrelated=`Choice ${next().toString(36)}`;
  assert.equal(studioChoicePattern(unrelated,consequence),"checkbox","only the named immediate setting is a switch");

  const coarsePointer=Boolean(next()&1),narrow=Boolean(next()&1);
  assert.equal(
    studioChoiceTargetHeight({coarsePointer,narrow}),
    coarsePointer||narrow ? 44 : 36,
    "target height is the coarse-or-narrow invariant",
  );
}

console.log("Specification Studio choice control property tests passed");
