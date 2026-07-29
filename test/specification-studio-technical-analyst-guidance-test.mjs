import assert from "node:assert/strict";
import {
  STUDIO_ANALYST_COOLDOWN_MS,
  STUDIO_ANALYST_FIRST_HINT_MS,
  STUDIO_ANALYST_HINT_LIFETIME_MS,
  createStudioAnalystGuidanceSchedule,
  studioAnalystHintForRoute,
} from "../dist/specification-studio-technical-analyst-guidance.js";

assert.equal(STUDIO_ANALYST_FIRST_HINT_MS,10_000);
assert.equal(STUDIO_ANALYST_HINT_LIFETIME_MS,10_000);
assert.equal(STUDIO_ANALYST_COOLDOWN_MS,120_000);

const overview=studioAnalystHintForRoute("Project overview",[]);
assert.deepEqual(overview,{
  id:"project-overview",
  route:"Project overview",
  text:"Crikey! Pick a collection on the left to start shaping your specification.",
});
assert.equal(studioAnalystHintForRoute("Project overview",["project-overview"]),undefined);
assert.equal(studioAnalystHintForRoute("Unknown route",[]),undefined);

const schedule=createStudioAnalystGuidanceSchedule();
assert.deepEqual(schedule.advance(9_999,{active:true,route:"Project overview"}),{kind:"waiting"});
assert.deepEqual(schedule.advance(1,{active:true,route:"Project overview"}),{
  kind:"show",
  hint:overview,
});
assert.deepEqual(schedule.advance(9_999,{active:true,route:"Project overview"}),{kind:"visible",hint:overview});
assert.deepEqual(schedule.advance(1,{active:true,route:"Project overview"}),{kind:"hide"});
assert.deepEqual(schedule.advance(109_999,{active:true,route:"Shared Profiles"}),{kind:"waiting"});
assert.deepEqual(schedule.advance(1,{active:true,route:"Shared Profiles"}),{
  kind:"show",
  hint:{
    id:"shared-profiles",
    route:"Shared Profiles",
    text:"Smashing! Put reusable fields here so Pages and Events can inherit them.",
  },
});

const paused=createStudioAnalystGuidanceSchedule();
assert.deepEqual(paused.advance(5_000,{active:true,route:"Pages"}),{kind:"waiting"});
assert.deepEqual(paused.advance(30_000,{active:false,route:"Pages"}),{kind:"waiting"});
assert.deepEqual(paused.advance(5_000,{active:true,route:"Pages"}),{
  kind:"show",
  hint:{
    id:"pages",
    route:"Pages",
    text:"Jolly good! Give each Page its observed page event before refining its schema.",
  },
});
assert.deepEqual(paused.advance(1,{active:false,route:"Pages"}),{kind:"hide"});
assert.deepEqual(paused.advance(9_999,{active:true,route:"Pages"}),{kind:"visible",hint:studioAnalystHintForRoute("Pages",[])});
assert.deepEqual(paused.advance(1,{active:true,route:"Pages"}),{kind:"hide"});

const rotation=createStudioAnalystGuidanceSchedule();
for(const route of["Project overview","Shared Profiles","Pages","Flows","Documentation"]){
  const result=rotation.advance(route==="Project overview"?10_000:120_000,{active:true,route});
  assert.equal(result.kind,"show",`${route} should have one applicable hint`);
  rotation.advance(10_000,{active:true,route});
}
assert.equal(rotation.advance(120_000,{active:true,route:"Project overview"}).kind,"show","rotation resets only after every hint was presented");

console.log("Specification Studio technical analyst guidance unit tests passed");
