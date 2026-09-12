import assert from "node:assert/strict";
import { applyLiveSchemaBulk, createLiveSchemaBulkDraft, reviewLiveSchemaBulk } from "../dist/data-layer-installed/schemas/live-schema-bulk-model.js";

let seed=0x51a77;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/0x100000000);
const scalar=()=>{const values=[false,0,"",null,Math.floor(random()*100),`value-${Math.floor(random()*20)}`];return values[Math.floor(random()*values.length)];};
for(let trial=0;trial<200;trial++){
  const payload={fixed:scalar(),items:Array.from({length:1+Math.floor(random()*4)},(_,index)=>({id:index===0?scalar():scalar(),[`key/${index}`]:scalar()}))};
  const schema=createLiveSchemaBulkDraft(`Trial ${trial}`,`trial-${trial}`),before=structuredClone(schema),review=reviewLiveSchemaBulk(payload,schema,[schema]),updated=applyLiveSchemaBulk(schema,review);
  assert.deepEqual(schema,before,"bulk inference does not mutate its source");assert.ok(review.added.length>0);
  const repeated=reviewLiveSchemaBulk(payload,updated,[updated]);assert.equal(repeated.added.length,0,"the same payload is idempotent");
  assert.deepEqual(applyLiveSchemaBulk(updated,repeated),updated,"an empty repeated batch makes no change");
  assert.ok(Object.keys(updated.workingDraft.documentation?.properties??{}).every((path)=>path.startsWith("/")));
}
console.log("live Add all to schema properties: 200 generated cases passed");
