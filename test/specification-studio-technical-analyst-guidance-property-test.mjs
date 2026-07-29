import assert from "node:assert/strict";
import {
  STUDIO_ANALYST_COOLDOWN_MS,
  STUDIO_ANALYST_CONTROL_DWELL_MS,
  STUDIO_ANALYST_FIRST_HINT_MS,
  STUDIO_ANALYST_HINT_LIFETIME_MS,
  STUDIO_ANALYST_PRINT_INTERVAL_MS,
  createStudioAnalystControlDwell,
  createStudioAnalystGuidanceSchedule,
  studioAnalystHintForRoute,
  studioAnalystHintsForRoute,
  studioAnalystVisibleText,
} from "../dist/specification-studio-technical-analyst-guidance.js";

const routes=[
  "Project overview",
  "Shared Profiles",
  "Pages",
  "Page Groups",
  "Events",
  "Applicability",
  "Flows",
  "Fixtures",
  "Assignments",
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
  assert.equal(schedule.advance(beforeCooldown,{active:true,route:routes[0]}).kind,"waiting");
  assert.equal(
    schedule.advance(cooldownRemaining-beforeCooldown,{active:true,route:routes[0]}).kind,
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
    if(index>0)schedule.advance(0,{active:true,route});
    const action=schedule.advance(STUDIO_ANALYST_FIRST_HINT_MS,{active:true,route});
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
    assert.notEqual(studioAnalystHintForRoute(hint.route,[hint.id])?.id,hint.id);
  }
}

for(let sample=0;sample<160;sample+=1){
  const text=`Tip ${sample}: ${"guidance ".repeat(1+(random()%12)).trim()}`;
  const elapsed=random()%((text.length+20)*STUDIO_ANALYST_PRINT_INTERVAL_MS);
  const visible=studioAnalystVisibleText(text,elapsed,false);
  const expectedLength=Math.min(text.length,Math.floor(elapsed/STUDIO_ANALYST_PRINT_INTERVAL_MS));
  assert.equal(visible,text.slice(0,expectedLength),"typewriter output is always the expected prefix");
  assert.equal(studioAnalystVisibleText(text,-elapsed,false),"","negative elapsed time is clamped");
  assert.equal(studioAnalystVisibleText(text,elapsed,true),text,"reduced motion always reveals the complete tip");
}

for(let sample=0;sample<120;sample+=1){
  const dwell=createStudioAnalystControlDwell();
  const target={id:`control-${sample}`,name:`Control ${sample}`};
  const activeBefore=random()%STUDIO_ANALYST_CONTROL_DWELL_MS;
  const inactiveDuration=1+(random()%1_000_000);
  dwell.enter(target,sample%2===0?"pointer":"focus");
  assert.equal(dwell.advance(activeBefore,true),undefined);
  assert.equal(dwell.advance(inactiveDuration,false),undefined,"inactive time never consumes control dwell");
  assert.deepEqual(
    dwell.advance(STUDIO_ANALYST_CONTROL_DWELL_MS-activeBefore,true),
    target,
    "every active-time partition reaches the same control dwell boundary",
  );
  assert.equal(dwell.advance(1_000_000,true),undefined,"one continuous dwell triggers only once");
}

for(const route of routes){
  const pool=studioAnalystHintsForRoute(route);
  const schedule=createStudioAnalystGuidanceSchedule();
  const presented=[];
  for(let index=0;index<pool.length;index+=1){
    const action=schedule.request({active:true,route});
    assert.equal(action.kind,"show");
    presented.push(action.hint.id);
  }
  assert.equal(new Set(presented).size,pool.length,`${route} exhausts its complete pool without repetition`);
}

console.log("Specification Studio technical analyst guidance properties passed");
