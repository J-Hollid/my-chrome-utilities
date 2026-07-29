import assert from "node:assert/strict";
import {
  STUDIO_ANALYST_COOLDOWN_MS,
  STUDIO_ANALYST_FIRST_HINT_MS,
  STUDIO_ANALYST_HINT_LIFETIME_MS,
  createStudioAnalystGuidanceSchedule,
  studioAnalystHintForRoute,
} from "../dist/specification-studio-technical-analyst-guidance.js";

const routes=[
  "Project overview",
  "Shared Profiles",
  "Pages",
  "Flows",
  "Documentation",
];

let seed=0x51a7c0de;
const random=()=>{
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  return seed;
};

for(let sample=0;sample<160;sample+=1){
  const beforeFirst=random()%STUDIO_ANALYST_FIRST_HINT_MS;
  const schedule=createStudioAnalystGuidanceSchedule();
  assert.equal(schedule.advance(beforeFirst,{active:true,route:routes[0]}).kind,"waiting");
  assert.equal(
    schedule.advance(STUDIO_ANALYST_FIRST_HINT_MS-beforeFirst,{active:true,route:routes[0]}).kind,
    "show",
    "every partition of the first active interval reaches the same boundary",
  );

  const visiblePartition=random()%STUDIO_ANALYST_HINT_LIFETIME_MS;
  assert.equal(schedule.advance(visiblePartition,{active:true,route:routes[0]}).kind,"visible");
  assert.equal(
    schedule.advance(STUDIO_ANALYST_HINT_LIFETIME_MS-visiblePartition,{active:true,route:routes[0]}).kind,
    "hide",
    "every partition of the visible lifetime reaches the same boundary",
  );

  const cooldownRemaining=STUDIO_ANALYST_COOLDOWN_MS-STUDIO_ANALYST_HINT_LIFETIME_MS;
  const beforeCooldown=random()%cooldownRemaining;
  assert.equal(schedule.advance(beforeCooldown,{active:true,route:routes[1]}).kind,"waiting");
  assert.equal(
    schedule.advance(cooldownRemaining-beforeCooldown,{active:true,route:routes[1]}).kind,
    "show",
    "cooldown is measured from the prior appearance",
  );
}

for(let sample=0;sample<80;sample+=1){
  const activeBefore=random()%STUDIO_ANALYST_FIRST_HINT_MS;
  const inactiveDuration=1+(random()%1_000_000);
  const schedule=createStudioAnalystGuidanceSchedule();
  schedule.advance(activeBefore,{active:true,route:"Pages"});
  assert.equal(schedule.advance(inactiveDuration,{active:false,route:"Pages"}).kind,"waiting");
  assert.equal(
    schedule.advance(STUDIO_ANALYST_FIRST_HINT_MS-activeBefore,{active:true,route:"Pages"}).kind,
    "show",
    "inactive time never consumes the first-hint interval",
  );
}

for(let sample=0;sample<40;sample+=1){
  const schedule=createStudioAnalystGuidanceSchedule(),seen=[];
  const routeOrder=[...routes].sort(()=>random()%3-1);
  for(const [index,route] of routeOrder.entries()){
    const action=schedule.advance(index===0?STUDIO_ANALYST_FIRST_HINT_MS:STUDIO_ANALYST_COOLDOWN_MS,{active:true,route});
    assert.equal(action.kind,"show");
    seen.push(action.hint.id);
    schedule.advance(STUDIO_ANALYST_HINT_LIFETIME_MS,{active:true,route});
  }
  assert.equal(new Set(seen).size,routes.length,"one rotation contains every hint exactly once");
}

const stableLookup=routes.map((route)=>studioAnalystHintForRoute(route,[]));
for(let sample=0;sample<100;sample+=1){
  assert.deepEqual(
    routes.map((route)=>studioAnalystHintForRoute(route,[])),
    stableLookup,
    "route lookup remains stable across calls",
  );
  for(const hint of stableLookup){
    assert.equal(studioAnalystHintForRoute(hint.route,[hint.id]),undefined);
  }
}

console.log("Specification Studio technical analyst guidance properties passed");
