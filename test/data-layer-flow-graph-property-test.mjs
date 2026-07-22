import assert from "node:assert/strict";
import {inferFlowRelationshipKind} from "../dist/data-layer-flow-graph.js";

const sides=["left","right","top","bottom"];
const expected=new Map([
  ["right:left","expected_next"],
  ["top:bottom","alternative"],
  ["bottom:top","merge"],
]);

let seed=0x5eed1234;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/0x100000000;};

for(let sample=0;sample<512;sample+=1){
  const sourcePort=sides[Math.floor(random()*sides.length)];
  const targetPort=sides[Math.floor(random()*sides.length)];
  const key=`${sourcePort}:${targetPort}`;
  assert.equal(
    inferFlowRelationshipKind(sourcePort,targetPort),
    expected.get(key),
    `${key} must ${expected.has(key)?"infer exactly one canonical kind":"remain invalid"}`,
  );
}

for(const sourcePort of sides)for(const targetPort of sides){
  const key=`${sourcePort}:${targetPort}`;
  assert.equal(inferFlowRelationshipKind(sourcePort,targetPort),expected.get(key),key);
}

console.log("Flow graph property tests passed");
